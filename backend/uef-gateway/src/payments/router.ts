/**
 * Agent Payments Router
 *
 * Routes:
 *   POST /api/payments/x402/verify         — Verify X402 payment proof
 *   POST /api/payments/tokens/create       — Create scoped payment token (internal only)
 *   POST /api/payments/purchase             — Process purchase with token
 *   GET  /api/payments/wallet/:agentId      — Get agent wallet
 *   POST /api/payments/wallet/:agentId/credit — Credit LUC to wallet (internal only)
 *
 * SECURITY: Token creation and wallet credit require x-internal-caller header.
 * All routes require INTERNAL_API_KEY via global middleware.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { agentPayments } from './agent-payments';
import { agentCommerceRouter } from '../billing/agent-commerce';
import logger from '../logger';

export const paymentsRouter = Router();

// ---------------------------------------------------------------------------
// Internal-only middleware — blocks external callers from privileged routes
// ---------------------------------------------------------------------------

function requireInternalCaller(req: Request, res: Response, next: NextFunction): void {
  const caller = req.headers['x-internal-caller'];
  if (caller !== 'acheevy' && caller !== 'uef-gateway' && caller !== 'stripe-webhook') {
    logger.warn({ path: req.path, ip: req.ip }, '[Payments] Rejected: privileged route requires x-internal-caller header');
    res.status(403).json({ error: 'Forbidden — this endpoint is restricted to internal services' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// X402 Protocol
// ---------------------------------------------------------------------------

paymentsRouter.post('/api/payments/x402/verify', (req, res) => {
  try {
    const proof = req.body;
    if (!proof.paymentSessionId) {
      res.status(400).json({ error: 'paymentSessionId is required' });
      return;
    }

    const result = agentPayments.verifyPayment(proof);
    if (!result.verified) {
      res.status(400).json({ verified: false, error: result.error });
      return;
    }

    res.json({ verified: true, lucCredits: result.lucCredits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Payment Tokens — INTERNAL ONLY (requires x-internal-caller)
// ---------------------------------------------------------------------------

paymentsRouter.post('/api/payments/tokens/create', requireInternalCaller, (req, res) => {
  try {
    const { agentId, maxAmount, currency, allowedProducts, ttlMinutes, maxUses } = req.body;
    if (!agentId || !maxAmount) {
      res.status(400).json({ error: 'agentId and maxAmount are required' });
      return;
    }

    // Validate ranges to prevent abuse
    const safeTtl = typeof ttlMinutes === 'number' && ttlMinutes > 0 && ttlMinutes <= 1440 ? ttlMinutes : 60; // Max 24h, default 1h
    const safeMaxUses = typeof maxUses === 'number' && maxUses > 0 && maxUses <= 1000 ? maxUses : 10; // Max 1000, default 10
    const safeMaxAmount = typeof maxAmount === 'number' && maxAmount > 0 && maxAmount <= 10000 ? maxAmount : maxAmount; // Cap at $10K

    if (typeof maxAmount !== 'number' || maxAmount <= 0 || maxAmount > 10000) {
      res.status(400).json({ error: 'maxAmount must be a positive number up to 10000' });
      return;
    }

    const token = agentPayments.createPaymentToken(agentId, {
      maxAmount: safeMaxAmount,
      currency,
      allowedProducts,
      ttlMinutes: safeTtl,
      maxUses: safeMaxUses,
    });

    res.json({ token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token creation failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Purchase
// ---------------------------------------------------------------------------

paymentsRouter.post('/api/payments/purchase', (req, res) => {
  try {
    const { tokenId, productId, quantity, metadata } = req.body;
    if (!tokenId || !productId) {
      res.status(400).json({ error: 'tokenId and productId are required' });
      return;
    }

    const result = agentPayments.processPurchase({
      tokenId,
      productId,
      quantity: quantity || 1,
      metadata,
    });

    if (result.status === 'failed') {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Purchase failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Agent Wallets — Read requires ownership (x-user-id == agentId) or internal caller
// ---------------------------------------------------------------------------

paymentsRouter.get('/api/payments/wallet/:agentId', (req, res) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  const caller = req.headers['x-internal-caller'] as string | undefined;
  const isInternal = caller === 'acheevy' || caller === 'uef-gateway' || caller === 'stripe-webhook';

  // Ownership check: user can only read their own wallet
  if (!isInternal && (!userId || userId !== req.params.agentId)) {
    logger.warn({ agentId: req.params.agentId, requestedBy: userId }, '[Payments] SECURITY: Wallet read denied — ownership mismatch');
    res.status(403).json({ error: 'Forbidden — you can only read your own wallet' });
    return;
  }

  const wallet = agentPayments.getWallet(req.params.agentId);
  if (!wallet) {
    const newWallet = agentPayments.getOrCreateWallet(req.params.agentId);
    res.json({ wallet: newWallet });
    return;
  }
  res.json({ wallet });
});

// SECURITY: Wallet credit requires internal caller header
paymentsRouter.post('/api/payments/wallet/:agentId/credit', requireInternalCaller, (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'amount must be a positive number' });
      return;
    }

    // Cap single credit to prevent abuse
    if (amount > 100000) {
      res.status(400).json({ error: 'Credit amount exceeds maximum (100000 LUC)' });
      return;
    }

    agentPayments.creditWallet(
      req.params.agentId,
      amount,
      description || 'Manual credit',
    );

    const wallet = agentPayments.getWallet(req.params.agentId);
    res.json({ wallet });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Credit failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Agent Commerce (X402 checkout flow + Stripe/Coinbase)
// ---------------------------------------------------------------------------
paymentsRouter.use(agentCommerceRouter);
