/**
 * LUC SDK - Atomic Wallet / Ledger Tests
 *
 * The money-safety core: a monetary wallet with reserve -> settle accounting.
 * RESERVE atomically holds budget and refuses to over-commit; SETTLE reconciles
 * the held estimate against the real provider cost; RELEASE cancels a hold when
 * the underlying call fails; CREDIT tops the budget up (e.g. the $6.54 starter).
 *
 * Invariant under contention: concurrent reserves can never collectively commit
 * more than the wallet's budget (available never goes negative at reserve time).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryLedgerAdapter } from '../src';

describe('MemoryLedgerAdapter', () => {
  let ledger: MemoryLedgerAdapter;

  beforeEach(async () => {
    ledger = new MemoryLedgerAdapter();
    await ledger.createWallet({
      id: 'w1',
      accountId: 'acct1',
      planId: '3mo',
      usdBudget: 1.0,
    });
  });

  describe('createWallet + balance', () => {
    it('starts with full budget, zero reserved, zero spent', async () => {
      const b = await ledger.balance('w1');
      expect(b.budget).toBeCloseTo(1.0, 6);
      expect(b.reserved).toBeCloseTo(0, 6);
      expect(b.spent).toBeCloseTo(0, 6);
      expect(b.available).toBeCloseTo(1.0, 6);
    });

    it('returns null balance for an unknown wallet', async () => {
      const b = await ledger.balance('nope');
      expect(b).toBeNull();
    });
  });

  describe('reserve', () => {
    it('holds budget when affordable and decrements available', async () => {
      const r = await ledger.reserve('w1', 0.3);
      expect(r.ok).toBe(true);
      expect(r.reservationId).toBeTruthy();

      const b = await ledger.balance('w1');
      expect(b!.reserved).toBeCloseTo(0.3, 6);
      expect(b!.available).toBeCloseTo(0.7, 6);
      expect(b!.spent).toBeCloseTo(0, 6);
    });

    it('refuses to over-commit and leaves the wallet untouched', async () => {
      const r = await ledger.reserve('w1', 1.5);
      expect(r.ok).toBe(false);
      expect(r.reservationId).toBeUndefined();
      expect(r.reason).toMatch(/insufficient/i);

      const b = await ledger.balance('w1');
      expect(b!.reserved).toBeCloseTo(0, 6);
      expect(b!.available).toBeCloseTo(1.0, 6);
    });

    it('fails closed for an unknown wallet', async () => {
      const r = await ledger.reserve('nope', 0.1);
      expect(r.ok).toBe(false);
    });
  });

  describe('settle', () => {
    it('reconciles when actual is below the estimate (releases the difference)', async () => {
      const r = await ledger.reserve('w1', 0.3);
      const s = await ledger.settle(r.reservationId!, 0.18);
      expect(s.ok).toBe(true);
      expect(s.actualUsd).toBeCloseTo(0.18, 6);

      const b = await ledger.balance('w1');
      expect(b!.spent).toBeCloseTo(0.18, 6);
      expect(b!.reserved).toBeCloseTo(0, 6); // hold released
      expect(b!.available).toBeCloseTo(0.82, 6);
    });

    it('records the real cost when actual exceeds the estimate (bounded, priced overshoot)', async () => {
      const r = await ledger.reserve('w1', 0.3);
      const s = await ledger.settle(r.reservationId!, 0.45);
      expect(s.ok).toBe(true);

      const b = await ledger.balance('w1');
      expect(b!.spent).toBeCloseTo(0.45, 6);
      expect(b!.reserved).toBeCloseTo(0, 6);
      expect(b!.available).toBeCloseTo(0.55, 6);
    });

    it('is idempotent-safe: settling an unknown reservation fails, not double-spends', async () => {
      const s = await ledger.settle('missing', 0.1);
      expect(s.ok).toBe(false);
    });
  });

  describe('release', () => {
    it('returns a held reservation to available without spending', async () => {
      const r = await ledger.reserve('w1', 0.4);
      await ledger.release(r.reservationId!);

      const b = await ledger.balance('w1');
      expect(b!.reserved).toBeCloseTo(0, 6);
      expect(b!.spent).toBeCloseTo(0, 6);
      expect(b!.available).toBeCloseTo(1.0, 6);
    });
  });

  describe('credit', () => {
    it('adds budget (e.g. the $6.54 starter-token purchase)', async () => {
      await ledger.credit('w1', 6.54);
      const b = await ledger.balance('w1');
      expect(b!.budget).toBeCloseTo(7.54, 6);
      expect(b!.available).toBeCloseTo(7.54, 6);
    });
  });

  describe('money-safety invariant under contention', () => {
    it('concurrent reserves never collectively over-commit the budget', async () => {
      // $1.00 budget, ten concurrent $0.30 reservations -> exactly 3 fit (0.90 <= 1.00)
      const results = await Promise.all(
        Array.from({ length: 10 }, () => ledger.reserve('w1', 0.3))
      );
      const granted = results.filter((r) => r.ok).length;
      expect(granted).toBe(3);

      const b = await ledger.balance('w1');
      expect(b!.reserved).toBeCloseTo(0.9, 6);
      expect(b!.available).toBeCloseTo(0.1, 6);
      expect(b!.available).toBeGreaterThanOrEqual(0); // never negative at reserve time
    });
  });
});
