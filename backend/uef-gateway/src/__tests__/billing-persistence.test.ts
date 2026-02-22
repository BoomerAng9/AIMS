/**
 * Billing Persistence Integration Tests
 *
 * Proves that the in-memory Maps have been replaced with real SQLite:
 *   - billing_provisions CRUD
 *   - payment_sessions CRUD + expiration
 *   - x402_receipts store + replay protection
 *   - agent_wallets + transactions
 *
 * Uses in-memory SQLite (NODE_ENV=test) for isolation.
 */

import Database from 'better-sqlite3';
import { resetDbForTesting, getDb, closeDb } from '../db';
import { runMigrations } from '../db/migrations';
import {
  billingProvisions,
  paymentSessionStore,
  x402ReceiptStore,
  agentWalletStore,
  agentTransactionStore,
} from '../billing/persistence';

// ---------------------------------------------------------------------------
// Setup: in-memory SQLite with migrations
// ---------------------------------------------------------------------------

let testDb: Database.Database;

beforeAll(() => {
  testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  resetDbForTesting(testDb);
  runMigrations(testDb);
});

afterAll(() => {
  testDb.close();
  resetDbForTesting(undefined as any);
});

// ---------------------------------------------------------------------------
// billing_provisions
// ---------------------------------------------------------------------------

describe('billingProvisions', () => {
  const now = new Date().toISOString();

  it('returns undefined for unknown user', () => {
    expect(billingProvisions.get('unknown-user')).toBeUndefined();
  });

  it('upserts and retrieves a provision', () => {
    billingProvisions.upsert({
      userId: 'user-001',
      tierId: '6mo',
      tierName: '6 Months',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test456',
      provisionedAt: now,
      updatedAt: now,
    });

    const result = billingProvisions.get('user-001');
    expect(result).toBeDefined();
    expect(result!.tierId).toBe('6mo');
    expect(result!.tierName).toBe('6 Months');
    expect(result!.stripeCustomerId).toBe('cus_test123');
    expect(result!.stripeSubscriptionId).toBe('sub_test456');
  });

  it('upsert overwrites on conflict (same userId)', () => {
    billingProvisions.upsert({
      userId: 'user-001',
      tierId: '9mo',
      tierName: '9 Months V.I.B.E.',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_upgraded789',
      provisionedAt: now,
      updatedAt: new Date().toISOString(),
    });

    const result = billingProvisions.get('user-001');
    expect(result!.tierId).toBe('9mo');
    expect(result!.stripeSubscriptionId).toBe('sub_upgraded789');
  });

  it('deletes a provision', () => {
    billingProvisions.delete('user-001');
    expect(billingProvisions.get('user-001')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// payment_sessions
// ---------------------------------------------------------------------------

describe('paymentSessionStore', () => {
  const sessionId = 'paysess_test_001';
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  it('creates and retrieves a payment session', () => {
    paymentSessionStore.create({
      id: sessionId,
      resourceType: 'plug-deploy',
      resourceId: 'n8n-plug',
      amount: 5.00,
      currency: 'usd',
      network: 'stripe',
      status: 'pending',
      agentId: 'agent-acheevy',
      metadata: { source: 'test' },
      createdAt: now,
      expiresAt: expires,
    });

    const result = paymentSessionStore.get(sessionId);
    expect(result).toBeDefined();
    expect(result!.id).toBe(sessionId);
    expect(result!.amount).toBe(5.00);
    expect(result!.status).toBe('pending');
    expect(result!.network).toBe('stripe');
    expect(result!.metadata).toEqual({ source: 'test' });
  });

  it('updates session status to completed', () => {
    paymentSessionStore.update(sessionId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      receipt: 'base64receipt==',
      stripePaymentIntentId: 'pi_test_123',
    });

    const result = paymentSessionStore.get(sessionId);
    expect(result!.status).toBe('completed');
    expect(result!.receipt).toBe('base64receipt==');
    expect(result!.stripePaymentIntentId).toBe('pi_test_123');
    expect(result!.completedAt).toBeDefined();
  });

  it('lists sessions by agent', () => {
    paymentSessionStore.create({
      id: 'paysess_test_002',
      resourceType: 'api-call',
      resourceId: 'search',
      amount: 0.001,
      currency: 'usd',
      network: 'stripe',
      status: 'pending',
      agentId: 'agent-acheevy',
      createdAt: now,
      expiresAt: expires,
    });

    const sessions = paymentSessionStore.listByAgent('agent-acheevy');
    expect(sessions.length).toBeGreaterThanOrEqual(2);
    expect(sessions.every(s => s.agentId === 'agent-acheevy')).toBe(true);
  });

  it('expires stale sessions', () => {
    // Create a session that already expired
    paymentSessionStore.create({
      id: 'paysess_expired',
      resourceType: 'plug-deploy',
      resourceId: 'old-plug',
      amount: 5.00,
      currency: 'usd',
      network: 'stripe',
      status: 'pending',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // expired 30min ago
    });

    const expired = paymentSessionStore.expireStaleSessions();
    expect(expired).toBeGreaterThanOrEqual(1);

    const result = paymentSessionStore.get('paysess_expired');
    expect(result!.status).toBe('expired');
  });
});

// ---------------------------------------------------------------------------
// x402_receipts
// ---------------------------------------------------------------------------

describe('x402ReceiptStore', () => {
  const paymentId = 'pi_test_x402_001';

  it('stores and retrieves a receipt', () => {
    x402ReceiptStore.store({
      paymentId,
      network: 'stripe',
      amount: 5.00,
      currency: 'usd',
      resourceId: 'n8n-plug',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    const result = x402ReceiptStore.get(paymentId);
    expect(result).toBeDefined();
    expect(result!.paymentId).toBe(paymentId);
    expect(result!.amount).toBe(5.00);
    expect(result!.network).toBe('stripe');
  });

  it('validates a non-expired receipt', () => {
    expect(x402ReceiptStore.isValid(paymentId)).toBe(true);
  });

  it('rejects unknown receipt', () => {
    expect(x402ReceiptStore.isValid('pi_unknown')).toBe(false);
  });

  it('cleans up expired receipts', () => {
    // Store an already-expired receipt
    x402ReceiptStore.store({
      paymentId: 'pi_old_expired',
      network: 'stripe',
      amount: 1.00,
      currency: 'usd',
      resourceId: 'old-resource',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // expired yesterday
    });

    const cleaned = x402ReceiptStore.cleanup();
    expect(cleaned).toBeGreaterThanOrEqual(1);
    expect(x402ReceiptStore.get('pi_old_expired')).toBeUndefined();
  });

  it('preserves non-expired receipt after cleanup', () => {
    expect(x402ReceiptStore.get(paymentId)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// agent_wallets
// ---------------------------------------------------------------------------

describe('agentWalletStore', () => {
  const agentId = 'agent-acheevy-test';

  it('creates a wallet with defaults on first access', () => {
    const wallet = agentWalletStore.getOrCreate(agentId);
    expect(wallet.agentId).toBe(agentId);
    expect(wallet.lucBalance).toBe(1000);
    expect(wallet.limitPerTransaction).toBe(100);
    expect(wallet.limitPerHour).toBe(500);
    expect(wallet.limitPerDay).toBe(2000);
  });

  it('returns existing wallet on second access', () => {
    const wallet = agentWalletStore.getOrCreate(agentId);
    expect(wallet.lucBalance).toBe(1000); // same as created
  });

  it('updates balance', () => {
    agentWalletStore.updateBalance(agentId, 850);
    const wallet = agentWalletStore.get(agentId);
    expect(wallet).toBeDefined();
    expect(wallet!.lucBalance).toBe(850);
  });

  it('returns undefined for non-existent wallet', () => {
    expect(agentWalletStore.get('nonexistent-agent')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// agent_transactions
// ---------------------------------------------------------------------------

describe('agentTransactionStore', () => {
  const agentId = 'agent-acheevy-test';

  it('creates and lists transactions', () => {
    agentTransactionStore.create({
      id: 'txn_test_001',
      agentId,
      type: 'debit',
      amount: 50,
      currency: 'usd',
      description: 'Purchase: plug-instance-starter x1',
      counterparty: 'aims-platform',
      protocol: 'stripe',
      timestamp: new Date().toISOString(),
    });

    agentTransactionStore.create({
      id: 'txn_test_002',
      agentId,
      type: 'credit',
      amount: 200,
      currency: 'LUC',
      description: 'LUC top-up',
      counterparty: 'aims-platform',
      protocol: 'internal',
      timestamp: new Date().toISOString(),
    });

    const txns = agentTransactionStore.listByAgent(agentId);
    expect(txns.length).toBe(2);
    // Both transactions present
    const ids = txns.map(t => t.id);
    expect(ids).toContain('txn_test_001');
    expect(ids).toContain('txn_test_002');
  });

  it('calculates hourly spend', () => {
    const hourly = agentTransactionStore.getHourlySpend(agentId);
    expect(hourly).toBe(50); // only the debit counts
  });

  it('calculates daily spend', () => {
    const daily = agentTransactionStore.getDailySpend(agentId);
    expect(daily).toBe(50);
  });

  it('returns 0 for unknown agent', () => {
    expect(agentTransactionStore.getHourlySpend('nobody')).toBe(0);
    expect(agentTransactionStore.getDailySpend('nobody')).toBe(0);
  });
});
