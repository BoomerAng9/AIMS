/**
 * Agent Payments Engine — Payment Primitives for A.I.M.S.
 *
 * Implements the payment layer for the agentic web:
 *
 * 1. X402 Protocol: HTTP 402 responses with payment instructions.
 *    When an external agent hits a paid endpoint, we return 402 with
 *    payment details. The agent pays, sends proof, gets access.
 *
 * 2. Stripe Agent Commerce: Scoped payment tokens for fiat transactions.
 *    Agents get limited tokens instead of full API keys.
 *
 * 3. LUC Bridge: All payments convert to LUC credits internally.
 *    LUC is the universal metering unit across AIMS.
 *
 * 4. Agent Wallets: Per-agent spending limits and transaction history.
 *    Implements the "programmable spending guardrails" pattern.
 */

import { v4 as uuidv4 } from 'uuid';
import { LUCEngine } from '../luc';
import logger from '../logger';
import { agentWalletStore, agentTransactionStore } from '../billing/persistence';
import type {
  X402PaymentRequired,
  X402PaymentProof,
  AgentPaymentToken,
  AgentPurchaseRequest,
  AgentPurchaseResult,
  AgentWallet,
  AgentTransaction,
} from './types';

// ---------------------------------------------------------------------------
// LUC Exchange Rates (LUC credits per unit of currency)
// ---------------------------------------------------------------------------

const LUC_RATES: Record<string, number> = {
  usd: 100,     // $1 = 100 LUC
  eur: 110,
  gbp: 125,
  usdc: 100,
  eth: 350000,  // Approximate
};

// ---------------------------------------------------------------------------
// Product Pricing Catalog (USD per unit)
// ---------------------------------------------------------------------------

const PRODUCT_PRICES: Record<string, number> = {
  // Plug instance costs (monthly hosting)
  'plug-instance-starter': 9.99,
  'plug-instance-pro': 29.99,
  'plug-instance-enterprise': 99.99,

  // API usage tiers
  'api-calls-100': 1.00,
  'api-calls-1000': 8.00,
  'api-calls-10000': 50.00,

  // Video generation
  'video-gen-basic': 0.50,
  'video-gen-pro': 2.00,
  'video-gen-4k': 5.00,

  // Content pipeline
  'content-pipeline-run': 3.00,
  'content-pipeline-batch': 15.00,

  // LUC top-ups
  'luc-100': 1.00,
  'luc-500': 4.50,
  'luc-1000': 8.00,
  'luc-5000': 35.00,

  // Agent services
  'agent-task-basic': 0.10,
  'agent-task-complex': 1.00,
  'agent-research-deep': 5.00,
};

function getProductPrice(productId: string): number {
  return PRODUCT_PRICES[productId] ?? 1.00; // $1 fallback for unknown products
}

// ---------------------------------------------------------------------------
// Agent Payment Engine
// ---------------------------------------------------------------------------

export class AgentPaymentEngine {
  private wallets = new Map<string, AgentWallet>();
  private tokens = new Map<string, AgentPaymentToken>();
  private pendingPayments = new Map<string, X402PaymentRequired>();

  // -----------------------------------------------------------------------
  // X402 Protocol — Request Payment
  // -----------------------------------------------------------------------

  /**
   * Create an X402 payment request for a resource.
   * Returns headers and body that should be sent as HTTP 402 response.
   */
  createPaymentRequired(
    resource: string,
    lucCost: number,
    description: string,
  ): { status: 402; headers: Record<string, string>; body: X402PaymentRequired } {
    const sessionId = `pay_${uuidv4()}`;
    const usdAmount = lucCost / (LUC_RATES.usd || 100);

    const payment: X402PaymentRequired = {
      resource,
      amount: Math.ceil(usdAmount * 100), // cents
      currency: 'USD',
      network: 'stripe',
      recipient: 'aims-platform',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
      description,
      paymentSessionId: sessionId,
    };

    this.pendingPayments.set(sessionId, payment);

    logger.info(
      { sessionId, resource, lucCost, usdAmount },
      '[AgentPayments] X402 payment required',
    );

    return {
      status: 402,
      headers: {
        'X-Payment-Required': 'true',
        'X-Payment-Session': sessionId,
        'X-Payment-Amount': String(payment.amount),
        'X-Payment-Currency': payment.currency,
        'X-Payment-Network': payment.network,
        'X-Payment-Expires': payment.expiresAt,
        'X-Payment-Description': description,
      },
      body: payment,
    };
  }

  /**
   * Verify an X402 payment proof and grant access.
   */
  verifyPayment(proof: X402PaymentProof): {
    verified: boolean;
    lucCredits: number;
    error?: string;
  } {
    const pending = this.pendingPayments.get(proof.paymentSessionId);
    if (!pending) {
      return { verified: false, lucCredits: 0, error: 'Unknown payment session' };
    }

    // Check expiration
    if (new Date(pending.expiresAt) < new Date()) {
      this.pendingPayments.delete(proof.paymentSessionId);
      return { verified: false, lucCredits: 0, error: 'Payment session expired' };
    }

    // In production, verify the transaction hash / Stripe payment ID
    // For now, accept any proof with a transaction reference
    if (!proof.transactionHash && !proof.stripePaymentId && !proof.lucTransactionId) {
      return { verified: false, lucCredits: 0, error: 'No payment reference provided' };
    }

    // Convert to LUC credits
    const rate = LUC_RATES[pending.currency.toLowerCase()] || 100;
    const lucCredits = Math.floor((pending.amount / 100) * rate);

    // Clean up
    this.pendingPayments.delete(proof.paymentSessionId);

    logger.info(
      { sessionId: proof.paymentSessionId, lucCredits },
      '[AgentPayments] Payment verified',
    );

    return { verified: true, lucCredits };
  }

  // -----------------------------------------------------------------------
  // Stripe Agent Commerce — Payment Tokens
  // -----------------------------------------------------------------------

  /**
   * Create a scoped payment token for an agent.
   * The token limits what the agent can buy and how much it can spend.
   */
  createPaymentToken(
    agentId: string,
    options: {
      maxAmount: number;
      currency?: string;
      allowedProducts?: string[];
      ttlMinutes?: number;
      maxUses?: number;
    },
  ): AgentPaymentToken {
    const token: AgentPaymentToken = {
      tokenId: `apt_${uuidv4()}`,
      agentId,
      maxAmount: options.maxAmount,
      currency: (options.currency as any) || 'usd',
      allowedProducts: options.allowedProducts || ['*'],
      expiresAt: new Date(Date.now() + (options.ttlMinutes || 60) * 60 * 1000).toISOString(),
      usesRemaining: options.maxUses || 10,
      createdBy: 'acheevy',
      createdAt: new Date().toISOString(),
    };

    this.tokens.set(token.tokenId, token);

    // Add to agent wallet
    const wallet = this.getOrCreateWallet(agentId);
    wallet.activeTokens.push(token);

    logger.info(
      { tokenId: token.tokenId, agentId, maxAmount: token.maxAmount },
      '[AgentPayments] Payment token created',
    );

    return token;
  }

  /**
   * Process a purchase using a payment token.
   */
  processPurchase(request: AgentPurchaseRequest): AgentPurchaseResult {
    const token = this.tokens.get(request.tokenId);
    if (!token) {
      return { purchaseId: '', status: 'failed', amount: 0, currency: 'usd', lucCost: 0, receipt: 'Invalid token' };
    }

    // Validate token
    if (new Date(token.expiresAt) < new Date()) {
      return { purchaseId: '', status: 'failed', amount: 0, currency: 'usd', lucCost: 0, receipt: 'Token expired' };
    }

    if (token.usesRemaining <= 0) {
      return { purchaseId: '', status: 'failed', amount: 0, currency: 'usd', lucCost: 0, receipt: 'Token uses exhausted' };
    }

    if (!token.allowedProducts.includes('*') && !token.allowedProducts.includes(request.productId)) {
      return { purchaseId: '', status: 'failed', amount: 0, currency: 'usd', lucCost: 0, receipt: 'Product not allowed' };
    }

    // Look up product price from catalog
    const unitPrice = getProductPrice(request.productId);
    const amount = request.quantity * unitPrice;
    if (amount > token.maxAmount) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost: 0, receipt: 'Exceeds token limit' };
    }

    // Convert to LUC
    const rate = LUC_RATES[token.currency] || 100;
    const lucCost = Math.floor(amount * rate);

    // Enforce spending limits from persistent wallet BEFORE processing
    const persistedWallet = agentWalletStore.getOrCreate(token.agentId);
    if (amount > persistedWallet.limitPerTransaction) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost: 0, receipt: `Exceeds per-transaction limit ($${persistedWallet.limitPerTransaction})` };
    }
    const hourlySpend = agentTransactionStore.getHourlySpend(token.agentId);
    if (hourlySpend + amount > persistedWallet.limitPerHour) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost: 0, receipt: `Exceeds hourly limit ($${persistedWallet.limitPerHour}, current: $${hourlySpend.toFixed(2)})` };
    }
    const dailySpend = agentTransactionStore.getDailySpend(token.agentId);
    if (dailySpend + amount > persistedWallet.limitPerDay) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost: 0, receipt: `Exceeds daily limit ($${persistedWallet.limitPerDay}, current: $${dailySpend.toFixed(2)})` };
    }

    // Check LUC balance
    if (persistedWallet.lucBalance < lucCost) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost, receipt: `Insufficient LUC balance (need ${lucCost}, have ${persistedWallet.lucBalance})` };
    }

    // Deduct from token
    token.usesRemaining--;
    token.maxAmount -= amount;

    // Record transaction in memory + SQLite
    const wallet = this.getOrCreateWallet(token.agentId);
    const txnId = `txn_${uuidv4()}`;
    const transaction: AgentTransaction = {
      id: txnId,
      type: 'debit',
      amount,
      currency: token.currency,
      description: `Purchase: ${request.productId} x${request.quantity}`,
      counterparty: 'aims-platform',
      protocol: 'stripe',
      timestamp: new Date().toISOString(),
    };
    wallet.recentTransactions.unshift(transaction);
    wallet.lucBalance -= lucCost;

    // Persist to SQLite
    agentTransactionStore.create(transaction as any);
    agentWalletStore.updateBalance(token.agentId, persistedWallet.lucBalance - lucCost);

    const purchaseId = `pur_${uuidv4()}`;

    logger.info(
      { purchaseId, agentId: token.agentId, amount, lucCost },
      '[AgentPayments] Purchase completed',
    );

    return {
      purchaseId,
      status: 'completed',
      amount,
      currency: token.currency,
      lucCost,
    };
  }

  // -----------------------------------------------------------------------
  // Agent Wallets
  // -----------------------------------------------------------------------

  getOrCreateWallet(agentId: string): AgentWallet {
    let wallet = this.wallets.get(agentId);
    if (!wallet) {
      wallet = {
        agentId,
        lucBalance: 1000, // Starting balance
        spendingLimit: {
          perTransaction: 100,
          perHour: 500,
          perDay: 2000,
        },
        recentTransactions: [],
        activeTokens: [],
      };
      this.wallets.set(agentId, wallet);
    }
    return wallet;
  }

  getWallet(agentId: string): AgentWallet | undefined {
    return this.wallets.get(agentId);
  }

  /**
   * Credit LUC to an agent wallet (e.g., after receiving payment).
   * Persists to both in-memory and SQLite.
   */
  creditWallet(agentId: string, lucAmount: number, description: string): void {
    const wallet = this.getOrCreateWallet(agentId);
    wallet.lucBalance += lucAmount;
    const txnId = `txn_${uuidv4()}`;
    const txn: AgentTransaction = {
      id: txnId,
      type: 'credit',
      amount: lucAmount,
      currency: 'LUC',
      description,
      counterparty: 'aims-platform',
      protocol: 'internal',
      timestamp: new Date().toISOString(),
    };
    wallet.recentTransactions.unshift(txn);

    // Persist to SQLite
    const persistedWallet = agentWalletStore.getOrCreate(agentId);
    agentWalletStore.updateBalance(agentId, persistedWallet.lucBalance + lucAmount);
    agentTransactionStore.create({ ...txn, agentId } as any);
  }

  /**
   * Check if an agent can afford a LUC cost.
   * Uses persistent wallet (SQLite) as source of truth.
   */
  canAfford(agentId: string, lucCost: number): boolean {
    const persisted = agentWalletStore.get(agentId);
    if (!persisted) return true; // New wallets get 1000 LUC starting balance
    return persisted.lucBalance >= lucCost;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private getHourlySpend(wallet: AgentWallet): number {
    const oneHourAgo = Date.now() - 3600_000;
    return wallet.recentTransactions
      .filter(t => t.type === 'debit' && new Date(t.timestamp).getTime() > oneHourAgo)
      .reduce((sum, t) => sum + t.amount, 0);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const agentPayments = new AgentPaymentEngine();
