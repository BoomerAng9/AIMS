/**
 * Agent Payments Router
 *
 * Routes:
 *   POST /api/payments/x402/verify         — Verify X402 payment proof
 *   POST /api/payments/tokens/create       — Create scoped payment token
 *   POST /api/payments/purchase             — Process purchase with token
 *   GET  /api/payments/wallet/:agentId      — Get agent wallet
 *   POST /api/payments/wallet/:agentId/credit — Credit LUC to wallet
 */

import { Router } from 'express';
import { agentPayments } from './agent-payments';
import logger from '../logger';

export const paymentsRouter = Router();

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
// Payment Tokens
// ---------------------------------------------------------------------------

paymentsRouter.post('/api/payments/tokens/create', (req, res) => {
  try {
    const { agentId, maxAmount, currency, allowedProducts, ttlMinutes, maxUses } = req.body;
    if (!agentId || !maxAmount) {
      res.status(400).json({ error: 'agentId and maxAmount are required' });
      return;
    }

    const token = agentPayments.createPaymentToken(agentId, {
      maxAmount,
      currency,
      allowedProducts,
      ttlMinutes,
      maxUses,
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
// Agent Wallets
// ---------------------------------------------------------------------------

paymentsRouter.get('/api/payments/wallet/:agentId', (req, res) => {
  const wallet = agentPayments.getWallet(req.params.agentId);
  if (!wallet) {
    // Create default wallet
    const newWallet = agentPayments.getOrCreateWallet(req.params.agentId);
    res.json({ wallet: newWallet });
    return;
  }
  res.json({ wallet });
});

paymentsRouter.post('/api/payments/wallet/:agentId/credit', (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount) {
      res.status(400).json({ error: 'amount is required' });
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
