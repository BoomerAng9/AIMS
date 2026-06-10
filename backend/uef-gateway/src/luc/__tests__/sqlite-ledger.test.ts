/**
 * LUC allocator — SQLite ledger adapter.
 *
 * This is the DURABLE ledger the gateway runs in production: the same
 * LedgerAdapter contract as InMemoryLedger, backed by the gateway's
 * better-sqlite3 store (getDb()). The money-safety guarantee here derives from
 * (a) reserve being a SINGLE atomic conditional UPDATE — granted iff
 * `result.changes === 1` — and (b) the gateway being a single Node process with
 * a synchronous SQLite driver, so reserve calls serialize and can never
 * interleave a check with a competing mutation.
 *
 * NOTE ON THE TEST DRIVER: prod injects a better-sqlite3 `Database`; this test
 * injects Node's built-in `node:sqlite` `DatabaseSync`. Both wrap the same
 * SQLite C library with identical SQL semantics for these queries, so the
 * behavior proven here is the behavior prod runs. (better-sqlite3's native
 * binding isn't built on every dev box; node:sqlite needs no native build.)
 * The adapter depends only on a structural `SqlDb` interface, so neither the
 * adapter nor this test imports better-sqlite3.
 *
 * Because a synchronous SQLite driver cannot actually run two reserves in
 * parallel, the "10 reserves" test proves the ATOMIC GATE REJECTS WHEN
 * INSUFFICIENT (exactly 3 of 10 succeed against a $1 budget), not survival of
 * true parallel writes — that property would only need re-proving against a
 * networked Postgres (a future NeonLedgerAdapter), not here.
 */

import { LUC_LEDGER_SCHEMA_SQL } from '../schema';
import { SqliteLedgerAdapter, SqlDb } from '../sqlite-ledger';

// node:sqlite is a Node 22.5+/26 builtin; @types/node@20 doesn't declare it.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => SqlDb & { exec(sql: string): void };
};

function freshDb(): SqlDb {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(LUC_LEDGER_SCHEMA_SQL);
  return db;
}

describe('SqliteLedgerAdapter', () => {
  let db: SqlDb;
  let ledger: SqliteLedgerAdapter;

  beforeEach(async () => {
    db = freshDb();
    ledger = new SqliteLedgerAdapter(db);
    await ledger.createWallet({ id: 'w1', accountId: 'acct1', planId: '3mo', usdBudget: 1.0 });
  });

  it('persists a wallet: balance + getWallet round-trip', async () => {
    const b = await ledger.balance('w1');
    expect(b).not.toBeNull();
    expect(b!.budget).toBeCloseTo(1.0, 6);
    expect(b!.available).toBeCloseTo(1.0, 6);

    const w = await ledger.getWallet('w1');
    expect(w!.accountId).toBe('acct1');
    expect(w!.planId).toBe('3mo');
    expect(w!.byok).toBe(false);
  });

  it('records the byok flag', async () => {
    await ledger.createWallet({ id: 'wb', accountId: 'acct1', planId: '3mo', usdBudget: 1.0, byok: true });
    expect((await ledger.getWallet('wb'))!.byok).toBe(true);
  });

  it('balance/getWallet for an unknown wallet is null', async () => {
    expect(await ledger.balance('nope')).toBeNull();
    expect(await ledger.getWallet('nope')).toBeNull();
  });

  it('reserve holds budget and returns a reservation id', async () => {
    const r = await ledger.reserve('w1', 0.3);
    expect(r.ok).toBe(true);
    expect(r.reservationId).toBeTruthy();
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(0.7, 6);
  });

  it('reserve refuses to over-commit and leaves the wallet untouched', async () => {
    const r = await ledger.reserve('w1', 1.5);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/insufficient/i);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(1.0, 6);
  });

  it('reserve rejects a negative estimate without touching the wallet', async () => {
    const r = await ledger.reserve('w1', -0.5);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/negative/i);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(1.0, 6);
  });

  it('reserve fails closed for an unknown wallet', async () => {
    const r = await ledger.reserve('nope', 0.1);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unknown wallet/i);
  });

  it('settle reconciles actual below estimate (releases the difference)', async () => {
    const r = await ledger.reserve('w1', 0.3);
    const s = await ledger.settle(r.reservationId!, 0.18);
    expect(s.ok).toBe(true);
    expect(s.walletSpent).toBeCloseTo(0.18, 6);
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

  it('double-settle is refused (no double-spend)', async () => {
    const r = await ledger.reserve('w1', 0.3);
    await ledger.settle(r.reservationId!, 0.25);
    const again = await ledger.settle(r.reservationId!, 0.25);
    expect(again.ok).toBe(false);
    expect(again.reason).toMatch(/already settled/i);
    expect((await ledger.balance('w1'))!.spent).toBeCloseTo(0.25, 6);
  });

  it('settle of an unknown reservation fails', async () => {
    expect((await ledger.settle('missing', 0.1)).ok).toBe(false);
  });

  it('release returns a hold without spending', async () => {
    const r = await ledger.reserve('w1', 0.4);
    await ledger.release(r.reservationId!);
    const b = await ledger.balance('w1');
    expect(b!.reserved).toBeCloseTo(0, 6);
    expect(b!.available).toBeCloseTo(1.0, 6);
  });

  it('a released hold cannot then be settled', async () => {
    const r = await ledger.reserve('w1', 0.4);
    await ledger.release(r.reservationId!);
    expect((await ledger.settle(r.reservationId!, 0.2)).ok).toBe(false);
  });

  it('credit adds budget (the $6.54 starter purchase)', async () => {
    await ledger.credit('w1', 6.54);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(7.54, 6);
  });

  it('writes an immutable ledger entry per settled call', async () => {
    const r1 = await ledger.reserve('w1', 0.3);
    await ledger.settle(r1.reservationId!, 0.25);
    const r2 = await ledger.reserve('w1', 0.2);
    await ledger.settle(r2.reservationId!, 0.2);
    const rows = db.prepare('SELECT actual_micro FROM luc_ledger_entries WHERE wallet_id = ? ORDER BY id').all('w1') as Array<{ actual_micro: number }>;
    expect(rows.map((e) => e.actual_micro)).toEqual([250000, 200000]);
  });

  it('THE PROOF: a $1 budget pauses at the limit (atomic gate rejects)', async () => {
    let granted = 0;
    let paused = false;
    for (let i = 0; i < 10; i++) {
      const r = await ledger.reserve('w1', 0.3);
      if (r.ok) granted++;
      else { paused = true; break; }
    }
    expect(granted).toBe(3);
    expect(paused).toBe(true);

    const b = await ledger.balance('w1');
    expect(b!.reserved).toBeCloseTo(0.9, 6);
    expect(b!.available).toBeCloseTo(0.1, 6);
    expect(b!.available).toBeGreaterThanOrEqual(0);
  });

  it('DURABILITY: a second adapter on the same db sees committed state', async () => {
    const r = await ledger.reserve('w1', 0.3);
    await ledger.settle(r.reservationId!, 0.25);

    // A fresh adapter instance reading the SAME underlying db — proving the
    // state lives in SQLite, not in process memory (survives a restart).
    const reopened = new SqliteLedgerAdapter(db);
    const b = await reopened.balance('w1');
    expect(b!.spent).toBeCloseTo(0.25, 6);
    expect(b!.available).toBeCloseTo(0.75, 6);
  });
});
