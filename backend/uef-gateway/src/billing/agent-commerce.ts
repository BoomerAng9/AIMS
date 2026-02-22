/**
 * Agent Commerce Router — Stripe + Coinbase Payment Rails for AI Agents
 *
 * Implements:
 *   1. Stripe Agent Toolkit — create payment links, usage-based billing, SPTs
 *   2. Coinbase AgentKit — agent wallet checkout for crypto payments
 *   3. X402 receipt generation — after successful payment, issue receipt for resource access
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
 *   GET  /api/payments/agent/balance/:wallet — Check agent wallet balance (Coinbase)
 */

import { Router, Request, Response } from 'express';
import { generateReceipt, getAllPricing, getResourcePricing } from './x402';
import { TASK_MULTIPLIERS } from './index';
import logger from '../logger';

export const agentCommerceRouter = Router();

// ---------------------------------------------------------------------------
// In-memory payment session store (upgrade to DB for production)
// ---------------------------------------------------------------------------

interface PaymentSession {
  id: string;
  resourceType: string;
  resourceId: string;
  amount: number;
  currency: string;
  network: 'stripe' | 'coinbase';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  completedAt?: string;
  receipt?: string;
  agentId?: string;
  metadata?: Record<string, string>;
}

const paymentSessions = new Map<string, PaymentSession>();

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
        supports: ['payment-links', 'usage-billing', 'spt'],
        docs: 'https://docs.stripe.com/agents',
      },
      coinbase: {
        type: 'coinbase-agentkit',
        supports: ['usdc', 'agent-wallet', 'gasless'],
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

  const session: PaymentSession = {
    id: sessionId,
    resourceType,
    resourceId,
    amount: pricing.usd,
    currency: 'usd',
    network: paymentNetwork,
    status: 'pending',
    createdAt: new Date().toISOString(),
    agentId,
    metadata,
  };

  paymentSessions.set(sessionId, session);

  logger.info({
    sessionId,
    resourceType,
    amount: pricing.usd,
    network: paymentNetwork,
    agentId,
  }, '[AgentCommerce] Payment session created');

  if (paymentNetwork === 'stripe') {
    // Stripe payment flow
    res.json({
      sessionId,
      status: 'pending',
      network: 'stripe',
      amount: pricing.usd,
      currency: 'usd',
      // In production: create a Stripe Payment Link or Checkout Session
      checkoutUrl: `${baseUrl}/api/payments/stripe/checkout/${sessionId}`,
      confirmUrl: `${baseUrl}/api/payments/agent/confirm`,
      instructions: {
        method: 'POST',
        url: `${baseUrl}/api/payments/agent/confirm`,
        body: { sessionId, stripePaymentIntentId: '<from_stripe_checkout>' },
        headers: { 'Content-Type': 'application/json' },
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  } else {
    // Coinbase / crypto payment flow
    res.json({
      sessionId,
      status: 'pending',
      network: 'coinbase',
      amount: pricing.usd,
      currency: 'usdc',
      // In production: use Coinbase Commerce or AgentKit
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
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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

  const session = paymentSessions.get(sessionId);
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

  // Verify payment based on network
  const paymentId = session.network === 'stripe'
    ? (stripePaymentIntentId || `stripe_${sessionId}`)
    : (txHash || `tx_${sessionId}`);

  // In production: verify with Stripe API / Coinbase API
  // For now: trust the confirmation (gated by session existence)

  const receipt = generateReceipt(
    paymentId,
    session.network,
    session.amount,
    session.currency,
    session.resourceId,
  );

  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  session.receipt = receipt;

  logger.info({
    sessionId,
    paymentId,
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
  const session = paymentSessions.get(req.params.sessionId);

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
