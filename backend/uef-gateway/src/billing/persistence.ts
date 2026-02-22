/**
 * Billing Persistence — SQLite-backed storage for billing state
 *
 * Replaces in-memory Maps with persistent SQLite tables:
 *   - billing_provisions: user tier state (from Stripe webhook)
 *   - payment_sessions: agent commerce checkout sessions
 *   - x402_receipts: validated X-402 payment receipts
 *   - agent_wallets: per-agent LUC balance and spending limits
 *   - agent_transactions: agent wallet transaction history
 *
 * Uses the same getDb() singleton as the rest of the platform.
 */

import { getDb } from '../db';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BillingProvision {
  userId: string;
  tierId: string;
  tierName: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  provisionedAt: string;
  updatedAt: string;
}

export interface PaymentSessionRecord {
  id: string;
  resourceType: string;
  resourceId: string;
  amount: number;
  currency: string;
  network: 'stripe' | 'coinbase';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  agentId?: string;
  metadata?: Record<string, string>;
  receipt?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

export interface X402ReceiptRecord {
  paymentId: string;
  network: 'stripe' | 'coinbase';
  amount: number;
  currency: string;
  resourceId: string;
  timestamp: string;
  expiresAt: string;
}

export interface AgentWalletRecord {
  agentId: string;
  lucBalance: number;
  limitPerTransaction: number;
  limitPerHour: number;
  limitPerDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTransactionRecord {
  id: string;
  agentId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  counterparty: string;
  protocol: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Billing Provisions
// ---------------------------------------------------------------------------

export const billingProvisions = {
  upsert(provision: BillingProvision): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO billing_provisions (userId, tierId, tierName, stripeCustomerId, stripeSubscriptionId, provisionedAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        tierId = excluded.tierId,
        tierName = excluded.tierName,
        stripeCustomerId = excluded.stripeCustomerId,
        stripeSubscriptionId = excluded.stripeSubscriptionId,
        provisionedAt = excluded.provisionedAt,
        updatedAt = excluded.updatedAt
    `).run(
      provision.userId, provision.tierId, provision.tierName,
      provision.stripeCustomerId, provision.stripeSubscriptionId,
      provision.provisionedAt, provision.updatedAt,
    );
    logger.info({ userId: provision.userId, tierId: provision.tierId }, '[BillingDB] Provision upserted');
  },

  get(userId: string): BillingProvision | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM billing_provisions WHERE userId = ?').get(userId) as BillingProvision | undefined;
  },

  delete(userId: string): void {
    const db = getDb();
    db.prepare('DELETE FROM billing_provisions WHERE userId = ?').run(userId);
  },
};

// ---------------------------------------------------------------------------
// Payment Sessions
// ---------------------------------------------------------------------------

export const paymentSessionStore = {
  create(session: PaymentSessionRecord): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO payment_sessions (id, resourceType, resourceId, amount, currency, network, status, agentId, metadata, receipt, stripePaymentIntentId, stripeCheckoutSessionId, createdAt, completedAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id, session.resourceType, session.resourceId,
      session.amount, session.currency, session.network, session.status,
      session.agentId || null, JSON.stringify(session.metadata || {}),
      session.receipt || null, session.stripePaymentIntentId || null,
      session.stripeCheckoutSessionId || null,
      session.createdAt, session.completedAt || null, session.expiresAt,
    );
  },

  get(id: string): PaymentSessionRecord | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM payment_sessions WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  },

  update(id: string, updates: Partial<PaymentSessionRecord>): void {
    const db = getDb();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    // SECURITY: Only allow known column names to prevent SQL injection via key names
    const ALLOWED_COLUMNS = new Set([
      'resourceType', 'resourceId', 'amount', 'currency', 'network', 'status',
      'agentId', 'metadata', 'receipt', 'stripePaymentIntentId',
      'stripeCheckoutSessionId', 'createdAt', 'completedAt', 'expiresAt',
    ]);

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id') continue;
      if (!ALLOWED_COLUMNS.has(key)) {
        logger.warn({ key }, '[BillingDB] Rejected unknown column in payment session update');
        continue;
      }
      setClauses.push(`${key} = ?`);
      values.push(key === 'metadata' ? JSON.stringify(value) : value);
    }

    if (setClauses.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE payment_sessions SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  },

  listByAgent(agentId: string): PaymentSessionRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM payment_sessions WHERE agentId = ? ORDER BY createdAt DESC LIMIT 100').all(agentId) as any[];
    return rows.map(row => ({ ...row, metadata: row.metadata ? JSON.parse(row.metadata) : {} }));
  },

  expireStaleSessions(): number {
    const db = getDb();
    const result = db.prepare(
      "UPDATE payment_sessions SET status = 'expired' WHERE status = 'pending' AND expiresAt < ?",
    ).run(new Date().toISOString());
    return result.changes;
  },
};

// ---------------------------------------------------------------------------
// X402 Receipts
// ---------------------------------------------------------------------------

export const x402ReceiptStore = {
  store(receipt: X402ReceiptRecord): void {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO x402_receipts (paymentId, network, amount, currency, resourceId, timestamp, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      receipt.paymentId, receipt.network, receipt.amount,
      receipt.currency, receipt.resourceId, receipt.timestamp, receipt.expiresAt,
    );
  },

  get(paymentId: string): X402ReceiptRecord | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM x402_receipts WHERE paymentId = ?').get(paymentId) as X402ReceiptRecord | undefined;
  },

  isValid(paymentId: string): boolean {
    const receipt = this.get(paymentId);
    if (!receipt) return false;
    return new Date(receipt.expiresAt) > new Date();
  },

  cleanup(): number {
    const db = getDb();
    const result = db.prepare("DELETE FROM x402_receipts WHERE expiresAt < ?").run(new Date().toISOString());
    return result.changes;
  },
};

// ---------------------------------------------------------------------------
// Agent Wallets
// ---------------------------------------------------------------------------

export const agentWalletStore = {
  getOrCreate(agentId: string): AgentWalletRecord {
    const db = getDb();
    let wallet = db.prepare('SELECT * FROM agent_wallets WHERE agentId = ?').get(agentId) as AgentWalletRecord | undefined;
    if (!wallet) {
      const now = new Date().toISOString();
      wallet = {
        agentId,
        lucBalance: 1000, // Starting balance
        limitPerTransaction: 100,
        limitPerHour: 500,
        limitPerDay: 2000,
        createdAt: now,
        updatedAt: now,
      };
      db.prepare(`
        INSERT INTO agent_wallets (agentId, lucBalance, limitPerTransaction, limitPerHour, limitPerDay, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(wallet.agentId, wallet.lucBalance, wallet.limitPerTransaction, wallet.limitPerHour, wallet.limitPerDay, wallet.createdAt, wallet.updatedAt);
    }
    return wallet;
  },

  get(agentId: string): AgentWalletRecord | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM agent_wallets WHERE agentId = ?').get(agentId) as AgentWalletRecord | undefined;
  },

  updateBalance(agentId: string, newBalance: number): void {
    const db = getDb();
    db.prepare('UPDATE agent_wallets SET lucBalance = ?, updatedAt = ? WHERE agentId = ?')
      .run(newBalance, new Date().toISOString(), agentId);
  },
};

// ---------------------------------------------------------------------------
// Agent Transactions
// ---------------------------------------------------------------------------

export const agentTransactionStore = {
  create(txn: AgentTransactionRecord): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO agent_transactions (id, agentId, type, amount, currency, description, counterparty, protocol, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txn.id, txn.agentId, txn.type, txn.amount, txn.currency, txn.description, txn.counterparty, txn.protocol, txn.timestamp);
  },

  listByAgent(agentId: string, limit = 50): AgentTransactionRecord[] {
    const db = getDb();
    return db.prepare('SELECT * FROM agent_transactions WHERE agentId = ? ORDER BY timestamp DESC LIMIT ?').all(agentId, limit) as AgentTransactionRecord[];
  },

  getHourlySpend(agentId: string): number {
    const db = getDb();
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const result = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM agent_transactions WHERE agentId = ? AND type = 'debit' AND timestamp > ?",
    ).get(agentId, oneHourAgo) as { total: number };
    return result.total;
  },

  getDailySpend(agentId: string): number {
    const db = getDb();
    const oneDayAgo = new Date(Date.now() - 86400_000).toISOString();
    const result = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM agent_transactions WHERE agentId = ? AND type = 'debit' AND timestamp > ?",
    ).get(agentId, oneDayAgo) as { total: number };
    return result.total;
  },
};
