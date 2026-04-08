/**
 * Stripe Webhook Handler — /api/stripe/webhook
 *
 * Receives Stripe webhook events and provisions/deprovisions LUC tiers.
 * Verifies signature with STRIPE_WEBHOOK_SECRET, then dispatches:
 *
 *   checkout.session.completed       → provision new subscription tier
 *   customer.subscription.updated    → update tier on plan change
 *   customer.subscription.deleted    → downgrade to P2P
 *   invoice.payment_failed           → flag account, log warning
 *
 * Provisioning calls the UEF Gateway /billing/provision endpoint to
 * update the user's LUC quotas and tier status.
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;
  return headers;
}

/**
 * Map Stripe price IDs → AIMS tier IDs.
 * Uses the same env vars as subscription/route.ts and lib/stripe.ts.
 */
function buildPriceToTierMap(): Record<string, { tierId: string; tierName: string }> {
  return {
    // 3-6-9 commitment tiers
    [process.env.STRIPE_PRICE_P2P || 'price_p2p']:                 { tierId: 'p2p', tierName: 'Pay-per-Use' },
    [process.env.STRIPE_PRICE_3MO || 'price_3mo']:                 { tierId: '3mo', tierName: '3 Months' },
    [process.env.STRIPE_PRICE_6MO || 'price_6mo']:                 { tierId: '6mo', tierName: '6 Months' },
    [process.env.STRIPE_PRICE_9MO || 'price_9mo']:                 { tierId: '9mo', tierName: '9 Months' },
    // Legacy 5-tier names (subscription/route.ts compatibility)
    [process.env.STRIPE_PRICE_COFFEE_MONTHLY || 'price_coffee']:           { tierId: 'coffee', tierName: 'Buy Me a Coffee' },
    [process.env.STRIPE_PRICE_DATA_ENTRY_MONTHLY || 'price_data_entry']:   { tierId: 'data_entry', tierName: 'Data Entry' },
    [process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro']:                 { tierId: 'pro', tierName: 'Pro' },
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise']:   { tierId: 'enterprise', tierName: 'Enterprise' },
    // LTD tiers
    [process.env.STRIPE_PRICE_LTD_BYOK || 'price_ltd_byok']:              { tierId: 'ltd_byok', tierName: 'LTD BYOK' },
    [process.env.STRIPE_PRICE_LTD_PLATFORM || 'price_ltd_platform']:       { tierId: 'ltd_platform', tierName: 'LTD Platform' },
    [process.env.STRIPE_PRICE_LTD_WHITELABEL || 'price_ltd_whitelabel']:   { tierId: 'ltd_whitelabel', tierName: 'LTD White Label' },
  };
}

/**
 * Provision a user's LUC tier via the UEF Gateway.
 */
async function provisionTier(
  email: string,
  tierId: string,
  tierName: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
): Promise<boolean> {
  if (!UEF_GATEWAY_URL) {
    console.warn('[Stripe Webhook] No UEF_GATEWAY_URL — cannot provision tier');
    return false;
  }

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/billing/provision`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        userId: email,
        tierId,
        tierName,
        stripeCustomerId,
        stripeSubscriptionId,
        provisionedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.error('[Stripe Webhook] Provision failed:', res.status, await res.text().catch(() => ''));
      return false;
    }

    console.log(`[Stripe Webhook] Provisioned tier=${tierId} for user=${email}`);
    return true;
  } catch (err) {
    console.error('[Stripe Webhook] Provision error:', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Deprovision (downgrade to P2P) via the UEF Gateway.
 */
async function deprovisionTier(email: string, stripeCustomerId: string): Promise<boolean> {
  if (!UEF_GATEWAY_URL) return false;

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/billing/provision`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        userId: email,
        tierId: 'p2p',
        tierName: 'Pay-per-Use',
        stripeCustomerId,
        stripeSubscriptionId: '',
        provisionedAt: new Date().toISOString(),
        reason: 'subscription_cancelled',
      }),
    });

    if (!res.ok) {
      console.error('[Stripe Webhook] Deprovision failed:', res.status);
      return false;
    }

    console.log(`[Stripe Webhook] Deprovisioned user=${email} to P2P`);
    return true;
  } catch (err) {
    console.error('[Stripe Webhook] Deprovision error:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('[Stripe Webhook] STRIPE_SECRET_KEY not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    // Read the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Dynamic import — Stripe SDK only loaded when needed
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    // Verify webhook signature
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signature verification failed';
      console.error('[Stripe Webhook] Signature invalid:', msg);
      return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
    }

    const priceToTier = buildPriceToTierMap();

    switch (event.type) {
      // ── New checkout completed ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string || '';
        const metadata = session.metadata || {};

        if (!email) {
          console.warn('[Stripe Webhook] checkout.session.completed — no email found');
          break;
        }

        // For one-time payments (P2P/LTD), use metadata tierId
        if (session.mode === 'payment') {
          const tierId = metadata.tierId || 'p2p';
          const tierName = metadata.tierName || 'Pay-per-Use';
          await provisionTier(email, tierId, tierName, customerId, '');
          break;
        }

        // For subscriptions, resolve from the price ID
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price.id || '';
          const tierInfo = priceToTier[priceId];

          if (tierInfo) {
            await provisionTier(email, tierInfo.tierId, tierInfo.tierName, customerId, subscriptionId);
          } else {
            // Fall back to metadata
            const tierId = metadata.tierId || 'p2p';
            const tierName = metadata.tierName || 'Pay-per-Use';
            await provisionTier(email, tierId, tierName, customerId, subscriptionId);
          }
        }
        break;
      }

      // ── Subscription updated (plan change, renewal) ────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id || '';
        const tierInfo = priceToTier[priceId];

        // Look up customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;

        if (!email) {
          console.warn('[Stripe Webhook] subscription.updated — no customer email');
          break;
        }

        if (subscription.status === 'active' && tierInfo) {
          await provisionTier(email, tierInfo.tierId, tierInfo.tierName, customerId, subscription.id);
        } else if (subscription.status === 'past_due') {
          console.warn(`[Stripe Webhook] Subscription past_due for user=${email}`);
        }
        break;
      }

      // ── Subscription deleted (cancelled) ───────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;

        if (email) {
          await deprovisionTier(email, customerId);
        } else {
          console.warn('[Stripe Webhook] subscription.deleted — no customer email');
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const email = invoice.customer_email;
        console.warn(`[Stripe Webhook] Payment failed for user=${email || 'unknown'}, invoice=${invoice.id}`);
        break;
      }

      // ── Payment succeeded (for logging) ────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const email = invoice.customer_email;
        console.log(`[Stripe Webhook] Payment succeeded for user=${email || 'unknown'}, amount=${invoice.amount_paid / 100}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt — Stripe retries on non-2xx
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    console.error('[Stripe Webhook] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
