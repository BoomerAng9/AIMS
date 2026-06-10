/**
 * LUC allocator — gateway ledger (in-memory reference).
 *
 * This re-proves the money-safety invariant inside the gateway's own suite: a
 * reserve may never over-commit, and concurrent reserves can never collectively
 * exceed the budget. The NeonLedgerAdapter implements the SAME LedgerAdapter
 * contract via a conditional SQL UPDATE; its cross-process atomicity is proven
 * against real Postgres at the deploy gate.
 */

import { InMemoryLedger } from '../ledger';

describe('InMemoryLedger', () => {
  let ledger: InMemoryLedger;

  beforeEach(async () => {
    ledger = new InMemoryLedger();
    await ledger.createWallet({ id: 'w1', accountId: 'acct1', planId: '3mo', usdBudget: 1.0 });
  });

  it('starts full, zero reserved/spent', async () => {
    const b = await ledger.balance('w1');
    expect(b).not.toBeNull();
    expect(b!.budget).toBeCloseTo(1.0, 6);
    expect(b!.available).toBeCloseTo(1.0, 6);
  });

  it('reserve holds budget; balance for unknown wallet is null', async () => {
    const r = await ledger.reserve('w1', 0.3);
    expect(r.ok).toBe(true);
    expect(r.reservationId).toBeTruthy();
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(0.7, 6);
    expect(await ledger.balance('nope')).toBeNull();
  });

  it('reserve refuses to over-commit and leaves the wallet untouched', async () => {
    const r = await ledger.reserve('w1', 1.5);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/insufficient/i);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(1.0, 6);
  });

  it('reserve fails closed for an unknown wallet', async () => {
    expect((await ledger.reserve('nope', 0.1)).ok).toBe(false);
  });

  it('settle reconciles actual below estimate (releases the difference)', async () => {
    const r = await ledger.reserve('w1', 0.3);
    const s = await ledger.settle(r.reservationId!, 0.18);
    expect(s.ok).toBe(true);
    const b = await ledger.balance('w1');
    expect(b!.spent).toBeCloseTo(0.18, 6);
    expect(b!.reserved).toBeCloseTo(0, 6);
    expect(b!.available).toBeCloseTo(0.82, 6);
  });

  it('settle records real cost above estimate (bounded, priced overshoot)', async () => {
    const r = await ledger.reserve('w1', 0.3);
    await ledger.settle(r.reservationId!, 0.45);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(0.55, 6);
  });

  it('settle of an unknown reservation fails (no double-spend)', async () => {
    expect((await ledger.settle('missing', 0.1)).ok).toBe(false);
  });

  it('release returns a hold without spending', async () => {
    const r = await ledger.reserve('w1', 0.4);
    await ledger.release(r.reservationId!);
    const b = await ledger.balance('w1');
    expect(b!.reserved).toBeCloseTo(0, 6);
    expect(b!.available).toBeCloseTo(1.0, 6);
  });

  it('credit adds budget (the $6.54 starter)', async () => {
    await ledger.credit('w1', 6.54);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(7.54, 6);
  });

  it('INVARIANT: concurrent reserves never collectively over-commit', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => ledger.reserve('w1', 0.3))
    );
    expect(results.filter((r) => r.ok).length).toBe(3);
    const b = await ledger.balance('w1');
    expect(b!.reserved).toBeCloseTo(0.9, 6);
    expect(b!.available).toBeCloseTo(0.1, 6);
    expect(b!.available).toBeGreaterThanOrEqual(0);
  });
});
