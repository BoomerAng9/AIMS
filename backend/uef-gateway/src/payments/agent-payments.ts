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
 *
 * SECURITY: All wallet state persisted to SQLite. No in-memory Maps.
 * Payment tokens persisted to SQLite via payment_tokens table.
 */

import { v4 as uuidv4 } from 'uuid';
import { LUCEngine } from '../luc';
import logger from '../logger';
import { agentWalletStore, agentTransactionStore } from '../billing/persistence';
import { getDb } from '../db';
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
// Payment Token SQLite Persistence
// ---------------------------------------------------------------------------

function ensurePaymentTokensTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_tokens (
      tokenId TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      maxAmount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      allowedProducts TEXT NOT NULL DEFAULT '["*"]',
      expiresAt TEXT NOT NULL,
      usesRemaining INTEGER NOT NULL DEFAULT 10,
      createdBy TEXT NOT NULL DEFAULT 'acheevy',
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_payment_tokens_agentId ON payment_tokens(agentId);
    CREATE INDEX IF NOT EXISTS idx_payment_tokens_expiresAt ON payment_tokens(expiresAt);
  `);
}

function persistToken(token: AgentPaymentToken): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO payment_tokens (tokenId, agentId, maxAmount, currency, allowedProducts, expiresAt, usesRemaining, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    token.tokenId, token.agentId, token.maxAmount, token.currency,
    JSON.stringify(token.allowedProducts), token.expiresAt,
    token.usesRemaining, token.createdBy, token.createdAt,
  );
}

function getToken(tokenId: string): AgentPaymentToken | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM payment_tokens WHERE tokenId = ?').get(tokenId) as any;
  if (!row) return undefined;
  return {
    ...row,
    allowedProducts: JSON.parse(row.allowedProducts),
  };
}

function updateToken(tokenId: string, updates: { usesRemaining: number; maxAmount: number }): void {
  const db = getDb();
  db.prepare('UPDATE payment_tokens SET usesRemaining = ?, maxAmount = ? WHERE tokenId = ?')
    .run(updates.usesRemaining, updates.maxAmount, tokenId);
}

function cleanupExpiredTokens(): number {
  const db = getDb();
  const result = db.prepare('DELETE FROM payment_tokens WHERE expiresAt < ?').run(new Date().toISOString());
  return result.changes;
}

// ---------------------------------------------------------------------------
// Agent Payment Engine — ALL STATE IN SQLITE
// ---------------------------------------------------------------------------

export class AgentPaymentEngine {
  // pendingPayments is ephemeral by design (15-min TTL, session-scoped)
  private pendingPayments = new Map<string, X402PaymentRequired>();

  constructor() {
    ensurePaymentTokensTable();

    // Cleanup expired tokens every 10 minutes
    setInterval(() => {
      const cleaned = cleanupExpiredTokens();
      if (cleaned > 0) {
        logger.info({ cleaned }, '[AgentPayments] Expired payment tokens cleaned');
      }
    }, 10 * 60 * 1000);
  }

  // -----------------------------------------------------------------------
  // X402 Protocol — Request Payment
  // -----------------------------------------------------------------------

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

    // Auto-cleanup after expiry
    setTimeout(() => this.pendingPayments.delete(sessionId), 15 * 60 * 1000);

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

  verifyPayment(proof: X402PaymentProof): {
    verified: boolean;
    lucCredits: number;
    error?: string;
  } {
    const pending = this.pendingPayments.get(proof.paymentSessionId);
    if (!pending) {
      return { verified: false, lucCredits: 0, error: 'Unknown payment session' };
    }

    if (new Date(pending.expiresAt) < new Date()) {
      this.pendingPayments.delete(proof.paymentSessionId);
      return { verified: false, lucCredits: 0, error: 'Payment session expired' };
    }

    // REQUIRE a real payment reference — no empty proofs
    if (!proof.transactionHash && !proof.stripePaymentId && !proof.lucTransactionId) {
      return { verified: false, lucCredits: 0, error: 'No payment reference provided' };
    }

    const rate = LUC_RATES[pending.currency.toLowerCase()] || 100;
    const lucCredits = Math.floor((pending.amount / 100) * rate);

    this.pendingPayments.delete(proof.paymentSessionId);

    logger.info(
      { sessionId: proof.paymentSessionId, lucCredits },
      '[AgentPayments] Payment verified',
    );

    return { verified: true, lucCredits };
  }

  // -----------------------------------------------------------------------
  // Stripe Agent Commerce — Payment Tokens (PERSISTED TO SQLITE)
  // -----------------------------------------------------------------------

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

    // Persist to SQLite — survives restarts
    persistToken(token);

    logger.info(
      { tokenId: token.tokenId, agentId, maxAmount: token.maxAmount },
      '[AgentPayments] Payment token created (persisted)',
    );

    return token;
  }

  processPurchase(request: AgentPurchaseRequest): AgentPurchaseResult {
    // Read token from SQLite — NOT in-memory
    const token = getToken(request.tokenId);
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

    const unitPrice = getProductPrice(request.productId);
    const amount = request.quantity * unitPrice;
    if (amount > token.maxAmount) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost: 0, receipt: 'Exceeds token limit' };
    }

    const rate = LUC_RATES[token.currency] || 100;
    const lucCost = Math.floor(amount * rate);

    // Enforce spending limits from persistent wallet
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

    // Check LUC balance from SQLite
    if (persistedWallet.lucBalance < lucCost) {
      return { purchaseId: '', status: 'failed', amount, currency: token.currency, lucCost, receipt: `Insufficient LUC balance (need ${lucCost}, have ${persistedWallet.lucBalance})` };
    }

    // Deduct token uses + amount — persist to SQLite
    updateToken(token.tokenId, {
      usesRemaining: token.usesRemaining - 1,
      maxAmount: token.maxAmount - amount,
    });

    // Record transaction in SQLite
    const txnId = `txn_${uuidv4()}`;
    agentTransactionStore.create({
      id: txnId,
      agentId: token.agentId,
      type: 'debit',
      amount,
      currency: token.currency,
      description: `Purchase: ${request.productId} x${request.quantity}`,
      counterparty: 'aims-platform',
      protocol: 'stripe',
      timestamp: new Date().toISOString(),
    });

    // Update wallet balance in SQLite
    agentWalletStore.updateBalance(token.agentId, persistedWallet.lucBalance - lucCost);

    const purchaseId = `pur_${uuidv4()}`;

    logger.info(
      { purchaseId, agentId: token.agentId, amount, lucCost },
      '[AgentPayments] Purchase completed (SQLite persisted)',
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
  // Agent Wallets — ALL READS/WRITES VIA SQLITE
  // -----------------------------------------------------------------------

  /**
   * Get wallet from SQLite (creates if missing with 1000 LUC starting balance).
   * Returns a view-model compatible with the AgentWallet type.
   */
  getOrCreateWallet(agentId: string): AgentWallet {
    const persisted = agentWalletStore.getOrCreate(agentId);
    const recentTxns = agentTransactionStore.listByAgent(agentId, 20);
    const tokens = this.listActiveTokens(agentId);

    return {
      agentId,
      lucBalance: persisted.lucBalance,
      spendingLimit: {
        perTransaction: persisted.limitPerTransaction,
        perHour: persisted.limitPerHour,
        perDay: persisted.limitPerDay,
      },
      recentTransactions: recentTxns.map(t => ({
        id: t.id,
        type: t.type as 'credit' | 'debit',
        amount: t.amount,
        currency: t.currency,
        description: t.description,
        counterparty: t.counterparty,
        protocol: t.protocol as 'stripe' | 'luc' | 'x402' | 'internal',
        timestamp: t.timestamp,
      })),
      activeTokens: tokens,
    };
  }

  getWallet(agentId: string): AgentWallet | undefined {
    const persisted = agentWalletStore.get(agentId);
    if (!persisted) return undefined;
    return this.getOrCreateWallet(agentId);
  }

  /**
   * Credit LUC to an agent wallet. SQLite only — no in-memory.
   */
  creditWallet(agentId: string, lucAmount: number, description: string): void {
    const persisted = agentWalletStore.getOrCreate(agentId);

    // Write to SQLite FIRST (source of truth)
    agentWalletStore.updateBalance(agentId, persisted.lucBalance + lucAmount);

    // Record transaction
    const txnId = `txn_${uuidv4()}`;
    agentTransactionStore.create({
      id: txnId,
      agentId,
      type: 'credit',
      amount: lucAmount,
      currency: 'LUC',
      description,
      counterparty: 'aims-platform',
      protocol: 'internal',
      timestamp: new Date().toISOString(),
    });

    logger.info({ agentId, lucAmount, txnId }, '[AgentPayments] Wallet credited (SQLite)');
  }

  /**
   * Check if an agent can afford a LUC cost. SQLite source of truth.
   */
  canAfford(agentId: string, lucCost: number): boolean {
    const wallet = agentWalletStore.getOrCreate(agentId);
    return wallet.lucBalance >= lucCost;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private listActiveTokens(agentId: string): AgentPaymentToken[] {
    const db = getDb();
    const now = new Date().toISOString();
    const rows = db.prepare(
      'SELECT * FROM payment_tokens WHERE agentId = ? AND expiresAt > ? AND usesRemaining > 0 ORDER BY createdAt DESC LIMIT 20',
    ).all(agentId, now) as any[];
    return rows.map(r => ({
      ...r,
      allowedProducts: JSON.parse(r.allowedProducts),
    }));
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const agentPayments = new AgentPaymentEngine();
