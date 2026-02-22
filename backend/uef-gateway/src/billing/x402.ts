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
 * References:
 *   - Cloudflare X402 spec
 *   - Stripe Agentic Commerce Protocol (ACP)
 *   - Coinbase AgentKit wallet integration
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { TASK_MULTIPLIERS, type TaskType } from './index';

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

// In-memory receipt store (upgrade to SQLite/Redis for production)
const receiptStore = new Map<string, X402Receipt>();

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
  return (req: Request, res: Response, next: NextFunction): void => {
    const receiptHeader = req.headers['x-402-receipt'] as string | undefined;

    // If receipt provided, validate it
    if (receiptHeader) {
      const receipt = validateReceipt(receiptHeader);
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
// Receipt Validation
// ---------------------------------------------------------------------------

function validateReceipt(receiptHeader: string): X402Receipt | null {
  try {
    const receipt: X402Receipt = JSON.parse(
      Buffer.from(receiptHeader, 'base64').toString('utf-8'),
    );

    // Check required fields
    if (!receipt.paymentId || !receipt.network || !receipt.amount || !receipt.resourceId) {
      return null;
    }

    // Check if already used (replay protection)
    if (receiptStore.has(receipt.paymentId)) {
      const existing = receiptStore.get(receipt.paymentId)!;
      // Allow reuse for same resource within 24h
      const age = Date.now() - new Date(existing.timestamp).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        return null;
      }
      return existing;
    }

    // Store for replay protection
    receiptStore.set(receipt.paymentId, receipt);

    logger.info({
      paymentId: receipt.paymentId,
      network: receipt.network,
      amount: receipt.amount,
    }, '[X402] Valid receipt accepted');

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

  receiptStore.set(paymentId, receipt);

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
