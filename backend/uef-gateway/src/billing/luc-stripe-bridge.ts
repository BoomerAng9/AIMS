import { Router, Request, Response } from 'express';
import logger from '../logger';

export const lucStripeBridgeRouter = Router();

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('change-this')) return null;
  // Dynamic import to avoid crash if stripe not configured
  try {
    const Stripe = require('stripe');
    return new Stripe(key);
  } catch {
    return null;
  }
};

// GET /api/billing/status — check if billing is configured
lucStripeBridgeRouter.get('/api/billing/status', (_req: Request, res: Response) => {
  const stripe = getStripe();
  res.json({
    configured: !!stripe,
    tiers: {
      '3mo': !!process.env.STRIPE_PRICE_3MO,
      '6mo': !!process.env.STRIPE_PRICE_6MO,
      '9mo': !!process.env.STRIPE_PRICE_9MO,
    },
  });
});

// POST /api/billing/checkout — create a Stripe checkout session
lucStripeBridgeRouter.post('/api/billing/checkout', async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Billing not configured',
      code: 'STRIPE_NOT_CONFIGURED',
    });
  }

  const { tier, userId, successUrl, cancelUrl } = req.body;
  const priceKey = `STRIPE_PRICE_${(tier || '').toUpperCase()}`;
  const priceId = process.env[priceKey];

  if (!priceId) {
    return res.status(400).json({ error: `Unknown billing tier: ${tier}` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?billing=success`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard?billing=cancel`,
      metadata: { userId, tier },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, '[luc-stripe-bridge] Checkout error');
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/webhook — Stripe webhook handler
// NOTE: This endpoint uses Stripe signature verification instead of role-based auth.
// The raw body must be passed for signature verification.
lucStripeBridgeRouter.post('/api/billing/webhook', async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(503).json({ error: 'Webhook secret not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info(`[billing] Checkout complete for user ${session.metadata?.userId}, tier: ${session.metadata?.tier}`);
        // Tier provisioning handled by existing billing infrastructure
        break;
      }
      case 'customer.subscription.deleted': {
        logger.info('[billing] Subscription cancelled');
        break;
      }
      default:
        logger.info(`[billing] Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, '[billing] Webhook signature verification failed');
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});
