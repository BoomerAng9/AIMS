/**
 * Agent Commerce Router — Stripe + Coinbase Payment Rails for AI Agents
 *
 * Implements:
 *   1. Stripe Agent Toolkit — create checkout sessions, verify payment intents
 *   2. Coinbase AgentKit — agent wallet checkout for crypto payments
 *   3. X402 receipt generation — after verified payment, issue receipt for resource access
 *
 * This enables the full agent commerce loop:
 *   Agent → discovers service (LLM.txt) → requests resource → gets 402 →
 *   pays via Stripe/Coinbase → receives receipt → accesses resource
 *
 * Routes:
 *   GET  /api/payments/agent/pricing         — List resource pricing (public)
 *   POST /api/payments/agent/checkout        — Create payment session (Stripe or Coinbase)
 *   POST /api/payments/agent/confirm         — Confirm payment and get receipt
 *   GET  /api/payments/agent/receipt/:id     — Get existing receipt
 *   POST /api/payments/agent/usage           — Record usage-based charge
 */

import { Router, Request, Response } from 'express';
import { generateReceipt, getAllPricing, getResourcePricing } from './x402';
import { TASK_MULTIPLIERS } from './index';
import { paymentSessionStore, billingProvisions, agentWalletStore } from './persistence';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Stripe SDK — conditional import (graceful when key not configured)
// ---------------------------------------------------------------------------

let stripe: any = null;
try {
  const stripeModule = require('../../lib/stripe');
  stripe = stripeModule.stripe || stripeModule.default;
} catch {
  // Stripe SDK not available at this path — try aims-skills path
  try {
    const Stripe = require('stripe');
    if (process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover' as any,
      });
    }
  } catch {
    logger.warn('[AgentCommerce] Stripe SDK not available — payment confirmation will be limited');
  }
}

export const agentCommerceRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/payments/agent/pricing — List all resource pricing
// ---------------------------------------------------------------------------

agentCommerceRouter.get('/api/payments/agent/pricing', (_req: Request, res: Response) => {
  const pricing = getAllPricing();

  res.json({
    version: '1.0',
    currency: 'usd',
    acceptedNetworks: ['stripe', 'coinbase'],
    resources: Object.entries(pricing).map(([type, p]) => ({
      type,
      price: p.usd,
      priceSmallest: Math.round(p.usd * 100),
      currency: 'usd',
      description: p.description,
    })),
    protocols: {
      stripe: {
        type: 'stripe-agent-toolkit',
        supports: ['payment-links', 'checkout-sessions', 'payment-intents', 'usage-billing'],
        docs: 'https://docs.stripe.com/agents',
        mcp: 'https://mcp.stripe.com',
      },
      coinbase: {
        type: 'coinbase-agentkit',
        supports: ['usdc', 'agent-wallet', 'x402', 'gasless'],
        docs: 'https://www.coinbase.com/developer-platform/products/agentkit',
      },
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/agent/checkout — Create a payment session
// ---------------------------------------------------------------------------

agentCommerceRouter.post('/api/payments/agent/checkout', async (req: Request, res: Response) => {
  const { resourceType, resourceId, network, agentId, metadata } = req.body;

  if (!resourceType || !resourceId) {
    res.status(400).json({ error: 'resourceType and resourceId are required' });
    return;
  }

  const pricing = getResourcePricing(resourceType);
  if (!pricing) {
    res.status(400).json({ error: `Unknown resource type: ${resourceType}` });
    return;
  }

  const paymentNetwork = network || 'stripe';
  if (paymentNetwork !== 'stripe' && paymentNetwork !== 'coinbase') {
    res.status(400).json({ error: 'network must be "stripe" or "coinbase"' });
    return;
  }

  const sessionId = `paysess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://plugmein.cloud';
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Persist session to SQLite
  paymentSessionStore.create({
    id: sessionId,
    resourceType,
    resourceId,
    amount: pricing.usd,
    currency: 'usd',
    network: paymentNetwork,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt,
    agentId,
    metadata,
  });

  logger.info({
    sessionId,
    resourceType,
    amount: pricing.usd,
    network: paymentNetwork,
    agentId,
  }, '[AgentCommerce] Payment session created (persisted)');

  if (paymentNetwork === 'stripe') {
    // Create a real Stripe Checkout Session if SDK is available
    let stripeCheckoutUrl: string | undefined;
    let stripeSessionId: string | undefined;

    if (stripe) {
      try {
        const checkoutSession = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: pricing.description,
                metadata: { resourceType, resourceId, aimsSessionId: sessionId },
              },
              unit_amount: Math.round(pricing.usd * 100),
            },
            quantity: 1,
          }],
          metadata: {
            aimsSessionId: sessionId,
            resourceType,
            resourceId,
            agentId: agentId || '',
          },
          success_url: `${baseUrl}/api/payments/agent/confirm?sessionId=${sessionId}&stripe_session={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/api/payments/agent/receipt/${sessionId}`,
        });

        stripeCheckoutUrl = checkoutSession.url;
        stripeSessionId = checkoutSession.id;

        // Update session with Stripe checkout session ID
        paymentSessionStore.update(sessionId, { stripeCheckoutSessionId: stripeSessionId });

        logger.info({ sessionId, stripeSessionId }, '[AgentCommerce] Stripe Checkout Session created');
      } catch (stripeErr) {
        logger.warn({ err: stripeErr, sessionId }, '[AgentCommerce] Stripe Checkout creation failed — returning manual flow');
      }
    }

    res.json({
      sessionId,
      status: 'pending',
      network: 'stripe',
      amount: pricing.usd,
      currency: 'usd',
      checkoutUrl: stripeCheckoutUrl || `${baseUrl}/api/payments/stripe/checkout/${sessionId}`,
      stripeSessionId,
      confirmUrl: `${baseUrl}/api/payments/agent/confirm`,
      instructions: {
        method: 'POST',
        url: `${baseUrl}/api/payments/agent/confirm`,
        body: { sessionId, stripePaymentIntentId: '<from_stripe_checkout>' },
        headers: { 'Content-Type': 'application/json' },
      },
      expiresAt,
    });
  } else {
    // Coinbase / crypto payment flow
    res.json({
      sessionId,
      status: 'pending',
      network: 'coinbase',
      amount: pricing.usd,
      currency: 'usdc',
      walletAddress: process.env.COINBASE_MERCHANT_WALLET || '0x...aims-treasury',
      chainId: 8453, // Base mainnet
      token: 'USDC',
      confirmUrl: `${baseUrl}/api/payments/agent/confirm`,
      instructions: {
        method: 'POST',
        url: `${baseUrl}/api/payments/agent/confirm`,
        body: { sessionId, txHash: '<transaction_hash_from_wallet>' },
        headers: { 'Content-Type': 'application/json' },
      },
      expiresAt,
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/agent/confirm — Confirm payment and issue receipt
// ---------------------------------------------------------------------------

agentCommerceRouter.post('/api/payments/agent/confirm', async (req: Request, res: Response) => {
  const { sessionId, stripePaymentIntentId, txHash } = req.body;

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  const session = paymentSessionStore.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Payment session not found' });
    return;
  }

  if (session.status === 'completed') {
    res.json({
      status: 'already_completed',
      receipt: session.receipt,
      message: 'Include this receipt as X-402-Receipt header to access the resource',
    });
    return;
  }

  if (session.status === 'expired' || session.status === 'failed') {
    res.status(400).json({ error: `Session is ${session.status}` });
    return;
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    paymentSessionStore.update(sessionId, { status: 'expired' });
    res.status(400).json({ error: 'Payment session expired' });
    return;
  }

  // Verify payment based on network
  let verifiedPaymentId: string | undefined;

  if (session.network === 'stripe') {
    // Verify with Stripe API
    const piId = stripePaymentIntentId || session.stripePaymentIntentId;

    if (stripe && piId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(piId);
        if (paymentIntent.status === 'succeeded') {
          verifiedPaymentId = paymentIntent.id;
          logger.info({
            sessionId, paymentIntentId: piId, amount: paymentIntent.amount,
          }, '[AgentCommerce] Stripe PaymentIntent verified');
        } else {
          res.status(400).json({
            error: `Payment not yet succeeded. Status: ${paymentIntent.status}`,
            paymentIntentStatus: paymentIntent.status,
          });
          return;
        }
      } catch (stripeErr: any) {
        logger.error({ err: stripeErr, sessionId, piId }, '[AgentCommerce] Stripe verification failed');
        res.status(400).json({ error: `Stripe verification failed: ${stripeErr.message}` });
        return;
      }
    } else if (stripe && session.stripeCheckoutSessionId) {
      // Try to retrieve the checkout session and its payment intent
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(session.stripeCheckoutSessionId);
        if (checkoutSession.payment_status === 'paid' && checkoutSession.payment_intent) {
          verifiedPaymentId = checkoutSession.payment_intent as string;
          logger.info({
            sessionId, checkoutSessionId: session.stripeCheckoutSessionId,
          }, '[AgentCommerce] Stripe Checkout Session verified via retrieve');
        } else {
          res.status(400).json({
            error: `Checkout not paid. Status: ${checkoutSession.payment_status}`,
          });
          return;
        }
      } catch (stripeErr: any) {
        logger.error({ err: stripeErr, sessionId }, '[AgentCommerce] Stripe checkout retrieval failed');
        res.status(400).json({ error: `Stripe verification failed: ${stripeErr.message}` });
        return;
      }
    } else if (!stripe) {
      // Stripe SDK not configured — accept with warning (dev/test mode)
      verifiedPaymentId = piId || `unverified_stripe_${sessionId}`;
      logger.warn({ sessionId }, '[AgentCommerce] Stripe SDK not configured — accepting without verification (dev mode)');
    } else {
      res.status(400).json({ error: 'stripePaymentIntentId is required for Stripe payments' });
      return;
    }
  } else {
    // Coinbase / crypto verification
    // TODO: Verify txHash on Base chain via Coinbase CDP API
    if (!txHash) {
      res.status(400).json({ error: 'txHash is required for Coinbase payments' });
      return;
    }
    verifiedPaymentId = txHash;
    logger.info({ sessionId, txHash }, '[AgentCommerce] Coinbase payment accepted (chain verification pending)');
  }

  if (!verifiedPaymentId) {
    res.status(400).json({ error: 'Payment verification failed' });
    return;
  }

  // Generate receipt and persist
  const receipt = generateReceipt(
    verifiedPaymentId,
    session.network,
    session.amount,
    session.currency,
    session.resourceId,
  );

  paymentSessionStore.update(sessionId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    receipt,
    stripePaymentIntentId: verifiedPaymentId,
  });

  logger.info({
    sessionId,
    paymentId: verifiedPaymentId,
    network: session.network,
    amount: session.amount,
    resourceId: session.resourceId,
  }, '[AgentCommerce] Payment confirmed — receipt issued');

  res.json({
    status: 'completed',
    receipt,
    message: 'Include this receipt as X-402-Receipt header to access the resource',
    usage: {
      header: 'X-402-Receipt',
      value: receipt,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/payments/agent/receipt/:sessionId — Retrieve existing receipt
// ---------------------------------------------------------------------------

agentCommerceRouter.get('/api/payments/agent/receipt/:sessionId', (req: Request, res: Response) => {
  const session = paymentSessionStore.get(req.params.sessionId);

  if (!session) {
    res.status(404).json({ error: 'Payment session not found' });
    return;
  }

  if (session.status !== 'completed' || !session.receipt) {
    res.status(400).json({ error: 'Payment not yet completed', status: session.status });
    return;
  }

  res.json({
    sessionId: session.id,
    receipt: session.receipt,
    resourceType: session.resourceType,
    resourceId: session.resourceId,
    amount: session.amount,
    network: session.network,
    completedAt: session.completedAt,
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/agent/usage — Record usage-based charge
// ---------------------------------------------------------------------------

agentCommerceRouter.post('/api/payments/agent/usage', (req: Request, res: Response) => {
  const { agentId, resourceType, tokens, taskType } = req.body;

  if (!agentId || !tokens) {
    res.status(400).json({ error: 'agentId and tokens are required' });
    return;
  }

  // Calculate cost with task multiplier
  const baseRate = 0.01; // $0.01 per 1K tokens
  const multiplier = taskType && (taskType in TASK_MULTIPLIERS)
    ? (TASK_MULTIPLIERS as any)[taskType].multiplier
    : 1.0;
  const cost = (tokens / 1000) * baseRate * multiplier;

  logger.info({
    agentId,
    tokens,
    taskType,
    multiplier,
    cost,
  }, '[AgentCommerce] Usage recorded');

  res.json({
    agentId,
    tokens,
    taskType: taskType || 'CODE_GEN',
    multiplier,
    cost,
    currency: 'usd',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/stripe/webhook — Backend Stripe Webhook Receiver
//
// Handles subscription lifecycle events directly on the backend:
//   - checkout.session.completed → provision tier + credit LUC
//   - customer.subscription.updated → update tier
//   - customer.subscription.deleted → de-provision
//   - invoice.paid → credit LUC for renewal
//   - payment_intent.succeeded → mark agent commerce sessions complete
// ---------------------------------------------------------------------------

agentCommerceRouter.post('/api/payments/stripe/webhook', async (req: Request, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'] as string;

  let event: any;

  // Verify webhook signature when secret is configured
  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      logger.warn({ err: err.message }, '[StripeWebhook] Signature verification failed');
      res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      return;
    }
  } else if (!webhookSecret) {
    // Dev mode: accept raw JSON body
    event = req.body;
    logger.warn('[StripeWebhook] No STRIPE_WEBHOOK_SECRET — accepting unverified (dev mode)');
  } else {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  const eventType = event.type;
  const data = event.data?.object;

  logger.info({ eventType, eventId: event.id }, '[StripeWebhook] Received event');

  try {
    switch (eventType) {
      // ── Checkout completed → provision tier ─────────────────────────
      case 'checkout.session.completed': {
        const userId = data.metadata?.userId || data.client_reference_id;
        const tierId = data.metadata?.tierId;
        const customerId = data.customer;
        const subscriptionId = data.subscription;

        if (userId && tierId) {
          const now = new Date().toISOString();
          billingProvisions.upsert({
            userId,
            tierId,
            tierName: data.metadata?.tierName || tierId,
            stripeCustomerId: customerId || '',
            stripeSubscriptionId: subscriptionId || '',
            provisionedAt: now,
            updatedAt: now,
          });
          logger.info({ userId, tierId, customerId }, '[StripeWebhook] Tier provisioned');
        }

        // Also check if this is an agent commerce session
        const aimsSessionId = data.metadata?.aimsSessionId;
        if (aimsSessionId) {
          const session = paymentSessionStore.get(aimsSessionId);
          if (session && session.status === 'pending') {
            const receipt = generateReceipt(
              data.payment_intent || data.id,
              'stripe',
              session.amount,
              session.currency,
              session.resourceId,
            );
            paymentSessionStore.update(aimsSessionId, {
              status: 'completed',
              completedAt: new Date().toISOString(),
              receipt,
              stripePaymentIntentId: data.payment_intent,
              stripeCheckoutSessionId: data.id,
            });
            logger.info({ aimsSessionId }, '[StripeWebhook] Agent commerce session completed via webhook');
          }
        }
        break;
      }

      // ── Subscription updated → update tier ─────────────────────────
      case 'customer.subscription.updated': {
        const userId = data.metadata?.userId;
        const tierId = data.metadata?.tierId;
        if (userId && tierId) {
          const existing = billingProvisions.get(userId);
          if (existing) {
            billingProvisions.upsert({
              ...existing,
              tierId,
              tierName: data.metadata?.tierName || tierId,
              updatedAt: new Date().toISOString(),
            });
            logger.info({ userId, tierId }, '[StripeWebhook] Subscription updated');
          }
        }
        break;
      }

      // ── Subscription deleted → de-provision ────────────────────────
      case 'customer.subscription.deleted': {
        const userId = data.metadata?.userId;
        if (userId) {
          billingProvisions.delete(userId);
          logger.info({ userId }, '[StripeWebhook] Subscription cancelled — de-provisioned');
        }
        break;
      }

      // ── Invoice paid → credit LUC for subscription renewal ─────────
      case 'invoice.paid': {
        const userId = data.metadata?.userId || data.subscription_details?.metadata?.userId;
        const amountPaid = (data.amount_paid || 0) / 100; // cents → dollars
        if (userId && amountPaid > 0) {
          const lucCredit = Math.floor(amountPaid * 100); // $1 = 100 LUC
          const wallet = agentWalletStore.getOrCreate(userId);
          agentWalletStore.updateBalance(userId, wallet.lucBalance + lucCredit);
          logger.info({ userId, amountPaid, lucCredit }, '[StripeWebhook] Invoice paid — LUC credited');
        }
        break;
      }

      // ── Payment intent succeeded → mark sessions ───────────────────
      case 'payment_intent.succeeded': {
        const aimsSessionId = data.metadata?.aimsSessionId;
        if (aimsSessionId) {
          const session = paymentSessionStore.get(aimsSessionId);
          if (session && session.status === 'pending') {
            const receipt = generateReceipt(
              data.id,
              'stripe',
              session.amount,
              session.currency,
              session.resourceId,
            );
            paymentSessionStore.update(aimsSessionId, {
              status: 'completed',
              completedAt: new Date().toISOString(),
              receipt,
              stripePaymentIntentId: data.id,
            });
            logger.info({ aimsSessionId, piId: data.id }, '[StripeWebhook] PaymentIntent succeeded — session completed');
          }
        }
        break;
      }

      default:
        logger.debug({ eventType }, '[StripeWebhook] Unhandled event type');
    }
  } catch (handlerErr: any) {
    logger.error({ err: handlerErr, eventType }, '[StripeWebhook] Handler error');
    // Still return 200 to prevent Stripe retries on handler errors
  }

  // Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
  res.json({ received: true });
});
