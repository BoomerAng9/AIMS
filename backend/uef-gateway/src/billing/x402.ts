/**
 * X-402 Payment Required — Agent Commerce Protocol
 *
 * Implements the X402 header standard for AI agent-initiated payments.
 * When an agent accesses a paid resource, the server responds with:
 *   - 402 Payment Required
 *   - X-402-Payment header with payment instructions
 *   - X-402-Price header with cost in smallest unit
 *
 * The agent can then:
 *   1. Pay via Stripe (fiat) or Coinbase (crypto) using the payment URL
 *   2. Include the payment receipt in a follow-up request
 *   3. Access the resource with the X-402-Receipt header
 *
 * This enables autonomous agent commerce — agents discover, pay for,
 * and consume AIMS services without human intervention.
 *
 * Receipt validation now uses:
 *   - Stripe PaymentIntents API for fiat receipts
 *   - SQLite persistence for replay protection
 *   - 24-hour receipt reuse window
 *
 * References:
 *   - Cloudflare X402 spec (x402.org)
 *   - Stripe Agentic Commerce Protocol (ACP)
 *   - Coinbase AgentKit wallet integration
 *   - Stripe x402 integration (Feb 2026)
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { TASK_MULTIPLIERS, type TaskType } from './index';
import { x402ReceiptStore } from './persistence';

// ---------------------------------------------------------------------------
// Stripe SDK — conditional import
// ---------------------------------------------------------------------------

let stripe: any = null;
try {
  const Stripe = require('stripe');
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover' as any,
    });
  }
} catch {
  // Stripe not available
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface X402PaymentOffer {
  version: '1.0';
  network: 'stripe' | 'coinbase' | 'both';
  currency: 'usd' | 'usdc';
  amount: number;
  amountSmallest: number;
  description: string;
  paymentUrl: string;
  receiptHeader: string;
  expiresAt: string;
  resourceId: string;
  resourceType: 'plug-deploy' | 'plug-access' | 'api-call' | 'export-bundle';
}

export interface X402Receipt {
  paymentId: string;
  network: 'stripe' | 'coinbase';
  amount: number;
  currency: string;
  timestamp: string;
  resourceId: string;
}

// ---------------------------------------------------------------------------
// Pricing Table — per-resource-type costs
// ---------------------------------------------------------------------------

const RESOURCE_PRICING: Record<string, { usd: number; description: string }> = {
  'plug-deploy':    { usd: 5.00,  description: 'Deploy a plug instance (one-time)' },
  'plug-access':    { usd: 0.10,  description: 'Access a running plug instance (per-request)' },
  'api-call':       { usd: 0.001, description: 'Single API call to AIMS platform' },
  'export-bundle':  { usd: 2.00,  description: 'Generate a self-hosting export bundle' },
  'research-query': { usd: 0.50,  description: 'Deep research query via DeerFlow' },
  'video-gen':      { usd: 1.00,  description: 'AI video generation job' },
};

// ---------------------------------------------------------------------------
// Middleware: X402 Gate
// ---------------------------------------------------------------------------

/**
 * Express middleware that checks for X-402-Receipt on paid endpoints.
 * If no valid receipt, returns 402 with payment instructions.
 *
 * Usage:
 *   router.post('/paid-endpoint', x402Gate('plug-deploy', 'my-plug'), handler);
 */
export function x402Gate(resourceType: string, resourceId?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const receiptHeader = req.headers['x-402-receipt'] as string | undefined;

    // If receipt provided, validate it
    if (receiptHeader) {
      const receipt = await validateReceipt(receiptHeader);
      if (receipt) {
        (req as any).__x402Receipt = receipt;
        next();
        return;
      }
      // Invalid receipt
      res.status(403).json({ error: 'Invalid or expired X-402-Receipt' });
      return;
    }

    // Check if this is an agent request (non-agents get normal auth flow)
    const isAgent = (req as any).__agentRequest || req.headers['x-agent-protocol'];
    if (!isAgent) {
      next();
      return;
    }

    // Return 402 with payment instructions
    const pricing = RESOURCE_PRICING[resourceType];
    if (!pricing) {
      next();
      return;
    }

    const offer = buildPaymentOffer(
      resourceType as X402PaymentOffer['resourceType'],
      resourceId || req.params.id || 'unknown',
      pricing.usd,
      pricing.description,
    );

    logger.info({
      resourceType,
      resourceId: offer.resourceId,
      amount: offer.amount,
      agent: req.headers['user-agent']?.slice(0, 50),
    }, '[X402] Payment required — returning offer');

    res.status(402);
    res.setHeader('X-402-Version', '1.0');
    res.setHeader('X-402-Price', String(offer.amountSmallest));
    res.setHeader('X-402-Currency', offer.currency);
    res.setHeader('X-402-Payment', JSON.stringify(offer));
    res.setHeader('X-402-Accepts', 'stripe,coinbase');
    res.json({
      error: 'Payment Required',
      message: `This resource costs $${offer.amount.toFixed(2)} ${offer.currency.toUpperCase()}. Include an X-402-Receipt header with a valid payment receipt to access.`,
      payment: offer,
    });
  };
}

// ---------------------------------------------------------------------------
// Payment Offer Builder
// ---------------------------------------------------------------------------

function buildPaymentOffer(
  resourceType: X402PaymentOffer['resourceType'],
  resourceId: string,
  amountUsd: number,
  description: string,
): X402PaymentOffer {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://plugmein.cloud';
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  return {
    version: '1.0',
    network: 'both',
    currency: 'usd',
    amount: amountUsd,
    amountSmallest: Math.round(amountUsd * 100), // cents
    description,
    paymentUrl: `${baseUrl}/api/payments/agent/checkout?type=${resourceType}&id=${resourceId}&amount=${amountUsd}`,
    receiptHeader: 'X-402-Receipt',
    expiresAt,
    resourceId,
    resourceType,
  };
}

// ---------------------------------------------------------------------------
// Receipt Validation — Stripe-verified + SQLite-persisted replay protection
// ---------------------------------------------------------------------------

async function validateReceipt(receiptHeader: string): Promise<X402Receipt | null> {
  try {
    const receipt: X402Receipt = JSON.parse(
      Buffer.from(receiptHeader, 'base64').toString('utf-8'),
    );

    // Check required fields
    if (!receipt.paymentId || !receipt.network || !receipt.amount || !receipt.resourceId) {
      return null;
    }

    // Check SQLite store for replay protection
    const existing = x402ReceiptStore.get(receipt.paymentId);
    if (existing) {
      // Allow reuse within 24h
      const age = Date.now() - new Date(existing.timestamp).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        return null;
      }
      return {
        paymentId: existing.paymentId,
        network: existing.network,
        amount: existing.amount,
        currency: existing.currency,
        timestamp: existing.timestamp,
        resourceId: existing.resourceId,
      };
    }

    // Verify with Stripe if it's a Stripe payment
    if (receipt.network === 'stripe' && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(receipt.paymentId);
        if (paymentIntent.status !== 'succeeded') {
          logger.warn({
            paymentId: receipt.paymentId,
            status: paymentIntent.status,
          }, '[X402] Stripe PaymentIntent not succeeded — rejecting receipt');
          return null;
        }

        // Verify amount matches (within 1 cent tolerance)
        const expectedCents = Math.round(receipt.amount * 100);
        if (Math.abs(paymentIntent.amount - expectedCents) > 1) {
          logger.warn({
            paymentId: receipt.paymentId,
            expected: expectedCents,
            actual: paymentIntent.amount,
          }, '[X402] Amount mismatch — rejecting receipt');
          return null;
        }

        logger.info({
          paymentId: receipt.paymentId,
          amount: receipt.amount,
        }, '[X402] Stripe-verified receipt accepted');
      } catch (stripeErr: any) {
        // If it's a pi_ ID and lookup fails, reject
        if (receipt.paymentId.startsWith('pi_')) {
          logger.warn({ paymentId: receipt.paymentId, err: stripeErr.message }, '[X402] Stripe verification failed');
          return null;
        }
        // For non-Stripe IDs (legacy), fall through to basic acceptance
        logger.info({ paymentId: receipt.paymentId }, '[X402] Non-Stripe payment ID — accepting with basic validation');
      }
    }

    // Store in SQLite for replay protection
    x402ReceiptStore.store({
      paymentId: receipt.paymentId,
      network: receipt.network,
      amount: receipt.amount,
      currency: receipt.currency,
      resourceId: receipt.resourceId,
      timestamp: receipt.timestamp,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    logger.info({
      paymentId: receipt.paymentId,
      network: receipt.network,
      amount: receipt.amount,
    }, '[X402] Valid receipt accepted and persisted');

    return receipt;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Receipt Generation (for internal use after successful payment)
// ---------------------------------------------------------------------------

export function generateReceipt(
  paymentId: string,
  network: 'stripe' | 'coinbase',
  amount: number,
  currency: string,
  resourceId: string,
): string {
  const receipt: X402Receipt = {
    paymentId,
    network,
    amount,
    currency,
    timestamp: new Date().toISOString(),
    resourceId,
  };

  // Persist to SQLite
  x402ReceiptStore.store({
    ...receipt,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return Buffer.from(JSON.stringify(receipt)).toString('base64');
}

// ---------------------------------------------------------------------------
// Agent Checkout Router Handlers
// ---------------------------------------------------------------------------

export function getResourcePricing(resourceType: string): { usd: number; description: string } | undefined {
  return RESOURCE_PRICING[resourceType];
}

export function getAllPricing(): typeof RESOURCE_PRICING {
  return { ...RESOURCE_PRICING };
}
