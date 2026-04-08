import 'dotenv/config';
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

import {
  corsMiddleware,
  rateLimiter,
  adminAuth,
  requestLogger,
  stripeWebhookVerification,
} from './middleware';
import {
  sendRegistrationConfirmation,
  sendSponsorInquiryConfirmation,
  sendSponsorOnboardingComplete,
} from './email';
import type {
  Registration,
  CheckoutRequest,
  SponsorInquiry,
  SponsorOnboarding,
  EventAccess,
  EventStats,
} from './types';

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

app.use(requestLogger);
app.use(corsMiddleware);
app.use(rateLimiter);

// JSON body parser for all routes EXCEPT the Stripe webhook
app.use((req, res, next) => {
  if (req.path === '/api/event/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ---------------------------------------------------------------------------
// POST /api/event/register — Register attendee (lead capture)
// ---------------------------------------------------------------------------

app.post('/api/event/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      role,
      trackInterest,
      dietaryRestrictions,
      tshirtSize,
      ticketType,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !company || !role || !trackInterest || !ticketType) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, phone, company, role, trackInterest, ticketType.',
      });
      return;
    }

    if (!['in-person', 'virtual'].includes(ticketType)) {
      res.status(400).json({ success: false, error: 'ticketType must be "in-person" or "virtual".' });
      return;
    }

    const now = new Date().toISOString();
    const registration: Registration = {
      name,
      email,
      phone,
      company,
      role,
      trackInterest,
      dietaryRestrictions: dietaryRestrictions || '',
      tshirtSize: tshirtSize || '',
      ticketType,
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('event_registrations').add(registration);

    res.status(201).json({ success: true, registrationId: docRef.id });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/event/checkout — Create Stripe Checkout Session
// ---------------------------------------------------------------------------

app.post('/api/event/checkout', async (req: Request, res: Response) => {
  try {
    const { ticketType, email, name, registrationId }: CheckoutRequest = req.body;

    if (!ticketType || !email || !name || !registrationId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: ticketType, email, name, registrationId.',
      });
      return;
    }

    const isEarlyBird = process.env.EARLY_BIRD === 'true';

    let unitAmount: number;
    let description: string;

    if (ticketType === 'in-person') {
      unitAmount = isEarlyBird
        ? parseInt(process.env.IN_PERSON_EARLY_BIRD_PRICE || '9900', 10)
        : parseInt(process.env.IN_PERSON_PRICE || '14900', 10);
      description = isEarlyBird
        ? 'CTIH Hack-A-Thon — In-Person (Early Bird)'
        : 'CTIH Hack-A-Thon — In-Person';
    } else {
      unitAmount = isEarlyBird
        ? parseInt(process.env.VIRTUAL_EARLY_BIRD_PRICE || '2900', 10)
        : parseInt(process.env.VIRTUAL_PRICE || '4900', 10);
      description = isEarlyBird
        ? 'CTIH Hack-A-Thon — Virtual (Early Bird)'
        : 'CTIH Hack-A-Thon — Virtual';
    }

    const origin = process.env.CORS_ORIGIN || 'https://foai.cloud';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      metadata: {
        registrationId,
        ticketType,
        attendeeName: name,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: description,
              description: `Coastal Talent and Innovation Hack-A-Thon — ${ticketType === 'in-person' ? 'In-Person' : 'Virtual'} Ticket`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/event/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/event/register?canceled=true`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/event/webhook — Stripe Webhook Handler
// ---------------------------------------------------------------------------

app.post(
  '/api/event/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookVerification(stripe),
  async (req: Request, res: Response) => {
    try {
      const event = (req as any).stripeEvent as Stripe.Event;

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { registrationId, ticketType, attendeeName } = session.metadata || {};

        if (registrationId) {
          // Update registration payment status
          await db.collection('event_registrations').doc(registrationId).update({
            paymentStatus: 'completed',
            stripeSessionId: session.id,
            updatedAt: new Date().toISOString(),
          });

          // Generate unique access token
          const accessToken = uuidv4();

          const accessRecord: EventAccess = {
            token: accessToken,
            registrationId,
            ticketType: (ticketType as 'in-person' | 'virtual') || 'virtual',
            attendeeName: attendeeName || '',
            email: session.customer_email || '',
            isValid: true,
            createdAt: new Date().toISOString(),
          };

          await db.collection('event_access').doc(accessToken).set(accessRecord);

          // Update registration with access token
          await db.collection('event_registrations').doc(registrationId).update({
            accessToken,
          });

          // Send confirmation email
          if (session.customer_email && attendeeName) {
            await sendRegistrationConfirmation(
              session.customer_email,
              attendeeName,
              (ticketType as 'in-person' | 'virtual') || 'virtual',
              accessToken
            );
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      res.status(500).json({ success: false, error: 'Webhook processing failed.' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/event/sponsor-inquiry — Sponsor Lead Capture
// ---------------------------------------------------------------------------

app.post('/api/event/sponsor-inquiry', async (req: Request, res: Response) => {
  try {
    const { companyName, contactName, email, phone, website, tierInterest, message } = req.body;

    if (!companyName || !contactName || !email || !phone || !tierInterest) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: companyName, contactName, email, phone, tierInterest.',
      });
      return;
    }

    if (!['platinum', 'gold', 'silver'].includes(tierInterest)) {
      res.status(400).json({
        success: false,
        error: 'tierInterest must be "platinum", "gold", or "silver".',
      });
      return;
    }

    const now = new Date().toISOString();
    const inquiry: SponsorInquiry = {
      companyName,
      contactName,
      email,
      phone,
      website: website || '',
      tierInterest,
      message: message || '',
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('sponsor_inquiries').add(inquiry);

    // Send confirmation email to the sponsor contact
    await sendSponsorInquiryConfirmation(email, contactName, tierInterest);

    res.status(201).json({ success: true, inquiryId: docRef.id });
  } catch (err: any) {
    console.error('Sponsor inquiry error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/event/sponsor-onboard — Sponsor Onboarding (after payment)
// ---------------------------------------------------------------------------

app.post('/api/event/sponsor-onboard', async (req: Request, res: Response) => {
  try {
    const { sponsorId, tier, companyLogo, companyBio, boothPreferences, attendeeNames } = req.body;

    if (!sponsorId || !tier || !companyLogo || !companyBio || !attendeeNames) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sponsorId, tier, companyLogo, companyBio, attendeeNames.',
      });
      return;
    }

    if (!['platinum', 'gold', 'silver'].includes(tier)) {
      res.status(400).json({
        success: false,
        error: 'tier must be "platinum", "gold", or "silver".',
      });
      return;
    }

    const sponsorPackageId = `SP-${tier.toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const onboarding: SponsorOnboarding = {
      sponsorId,
      tier,
      companyLogo,
      companyBio,
      boothPreferences: boothPreferences || '',
      attendeeNames: Array.isArray(attendeeNames) ? attendeeNames : [attendeeNames],
      sponsorPackageId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('sponsor_onboarding').add(onboarding);

    // Look up the sponsor inquiry to get the email for confirmation
    const inquirySnap = await db.collection('sponsor_inquiries').doc(sponsorId).get();
    if (inquirySnap.exists) {
      const inquiryData = inquirySnap.data() as SponsorInquiry;
      await sendSponsorOnboardingComplete(inquiryData.email, inquiryData.contactName, sponsorPackageId);

      // Update inquiry status
      await db.collection('sponsor_inquiries').doc(sponsorId).update({
        status: 'confirmed',
        updatedAt: now,
      });
    }

    res.status(201).json({ success: true, sponsorPackageId });
  } catch (err: any) {
    console.error('Sponsor onboarding error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/event/verify-access/:token — Verify Event Access Token
// ---------------------------------------------------------------------------

app.get('/api/event/verify-access/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ success: false, error: 'Access token is required.' });
      return;
    }

    const docSnap = await db.collection('event_access').doc(token).get();

    if (!docSnap.exists) {
      res.status(404).json({ valid: false, error: 'Access token not found.' });
      return;
    }

    const access = docSnap.data() as EventAccess;

    if (!access.isValid) {
      res.status(403).json({ valid: false, error: 'Access token has been revoked.' });
      return;
    }

    res.json({
      valid: true,
      ticketType: access.ticketType,
      attendeeName: access.attendeeName,
      eventDetails: {
        name: 'Coastal Talent and Innovation Hack-A-Thon',
        shortName: 'CTIH',
        format: 'hybrid',
        supportedTicketTypes: ['in-person', 'virtual'],
      },
    });
  } catch (err: any) {
    console.error('Verify access error:', err);
    res.status(500).json({ valid: false, error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/event/stats — Event Dashboard Stats (admin only)
// ---------------------------------------------------------------------------

app.get('/api/event/stats', adminAuth, async (_req: Request, res: Response) => {
  try {
    // Fetch all registrations
    const registrationsSnap = await db.collection('event_registrations').get();
    const registrations = registrationsSnap.docs.map((d) => d.data() as Registration);

    const totalRegistrations = registrations.length;
    const inPersonCount = registrations.filter((r) => r.ticketType === 'in-person').length;
    const virtualCount = registrations.filter((r) => r.ticketType === 'virtual').length;

    // Calculate revenue from completed payments
    const isEarlyBird = process.env.EARLY_BIRD === 'true';
    const inPersonPrice = isEarlyBird
      ? parseInt(process.env.IN_PERSON_EARLY_BIRD_PRICE || '9900', 10)
      : parseInt(process.env.IN_PERSON_PRICE || '14900', 10);
    const virtualPrice = isEarlyBird
      ? parseInt(process.env.VIRTUAL_EARLY_BIRD_PRICE || '2900', 10)
      : parseInt(process.env.VIRTUAL_PRICE || '4900', 10);

    const completedRegistrations = registrations.filter((r) => r.paymentStatus === 'completed');
    const totalRevenue = completedRegistrations.reduce((sum, r) => {
      return sum + (r.ticketType === 'in-person' ? inPersonPrice : virtualPrice);
    }, 0);

    // Sponsor stats
    const sponsorSnap = await db.collection('sponsor_inquiries').get();
    const sponsors = sponsorSnap.docs.map((d) => d.data() as SponsorInquiry);
    const confirmedSponsors = sponsors.filter((s) => s.status === 'confirmed');

    const sponsorsByTier = {
      platinum: confirmedSponsors.filter((s) => s.tierInterest === 'platinum').length,
      gold: confirmedSponsors.filter((s) => s.tierInterest === 'gold').length,
      silver: confirmedSponsors.filter((s) => s.tierInterest === 'silver').length,
    };

    // Registrations by day
    const registrationsByDay: Record<string, number> = {};
    for (const reg of registrations) {
      const day = reg.createdAt.slice(0, 10); // YYYY-MM-DD
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    }

    const stats: EventStats = {
      totalRegistrations,
      inPersonCount,
      virtualCount,
      totalRevenue,
      sponsorCount: confirmedSponsors.length,
      sponsorsByTier,
      registrationsByDay,
    };

    res.json({ success: true, stats });
  } catch (err: any) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || '3100', 10);

app.listen(PORT, () => {
  console.log(`[CTIH Event API] Server running on port ${PORT}`);
});

export default app;
