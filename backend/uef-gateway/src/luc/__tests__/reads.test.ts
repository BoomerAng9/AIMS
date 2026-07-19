/**
 * LUC allocator — read-side billing pipes (GET-only).
 *
 * Proves, over HTTP and against BOTH ledger adapters:
 *   - usage/reservations serialize LEDGER state written by the real
 *     provisionPlan -> reserveForCall -> settleCall path (ML-3);
 *   - /luc/pricing is COMPUTED from pricing.ts at request time — every SKU
 *     equals a fresh planChargeUsd/planLuc recomputation (ML-5, one table);
 *   - SHAPE GUARDS: no `model` key/value, no floor-GM/margin field ever
 *     crosses the serialization boundary (Sacred Separation);
 *   - auth split: fail-closed 503 when unconfigured; wrong key 401; the
 *     dedicated read key (LUC_READ_API_KEY) opens GETs ONLY — a read key on a
 *     POST is a 401 while the internal key still works everywhere.
 */

import express from 'express';
import request from 'supertest';
import { InMemoryLedger, LedgerAdapter } from '../ledger';
import { SqliteLedgerAdapter, SqlDb } from '../sqlite-ledger';
import { LUC_LEDGER_SCHEMA_SQL } from '../schema';
import { createLucRouter } from '../routes';
import { provisionPlan, reserveForCall, settleCall } from '../service';
import {
  LUC_USD,
  PLATFORM_RATE_FACTOR,
  LANES,
  TIERS,
  CADENCES,
  BMC,
  planChargeUsd,
  planLuc,
  planWalletUsdBudget,
  missionBurnLuc,
  LaneId,
} from '../pricing';

const KEY = 'test-internal-key';
const READ_KEY = 'test-read-key';

// node:sqlite is a Node 22.5+/26 builtin; @types/node@20 doesn't declare it.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => SqlDb & { exec(sql: string): void };
};

function sqliteLedger(): LedgerAdapter {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(LUC_LEDGER_SCHEMA_SQL);
  return new SqliteLedgerAdapter(db);
}

function makeApp(
  ledger: LedgerAdapter,
  keys: { internalApiKey?: string; readApiKey?: string } = { internalApiKey: KEY, readApiKey: READ_KEY }
) {
  const app = express();
  app.use(express.json());
  app.use('/luc', createLucRouter({ ledger, ...keys }));
  return app;
}

const withKey = (t: request.Test) => t.set('Authorization', `Bearer ${KEY}`);
const withReadKey = (t: request.Test) => t.set('Authorization', `Bearer ${READ_KEY}`);

/** No internal-only value may cross the wire: model, floor GM, margins. */
function expectCleanShape(body: unknown): void {
  const json = JSON.stringify(body);
  expect(json).not.toMatch(/model/i);
  expect(json).not.toMatch(/floorGm/i);
  expect(json).not.toMatch(/margin/i);
  expect(json).not.toMatch(/gmPct/i);
  expect(json).not.toMatch(/wholesaleCogs/i);
}

describe.each([
  ['InMemoryLedger', (): LedgerAdapter => new InMemoryLedger()],
  ['SqliteLedgerAdapter', sqliteLedger],
])('read pipes over HTTP (%s)', (_name, freshLedger) => {
  it('usage + reservations serialize the real provision -> reserve -> settle flow', async () => {
    const ledger = freshLedger();
    const app = makeApp(ledger);

    const wallet = await provisionPlan(ledger, {
      id: 'w1',
      accountId: 'acct1',
      tier: 'medium',
      cadence: '3mo',
    });
    expect(wallet.usdBudget).toBeCloseTo(planWalletUsdBudget('medium', '3mo'), 6);

    const rsv = await reserveForCall(ledger, { walletId: 'w1', estUsd: 0.3 });
    expect(rsv.ok).toBe(true);

    // Open hold visible before settle.
    const open = await withKey(request(app).get('/luc/reservations').query({ walletId: 'w1' })).expect(200);
    expect(open.body.reservations).toHaveLength(1);
    expect(open.body.reservations[0].id).toBe(rsv.reservationId);
    expect(open.body.reservations[0].estUsd).toBeCloseTo(0.3, 6);
    expect(open.body.reservations[0].createdAt).toBeTruthy();
    expectCleanShape(open.body);

    await settleCall(ledger, { reservationId: rsv.reservationId!, actualUsd: 0.25 });

    // Hold gone after settle.
    const after = await withKey(request(app).get('/luc/reservations').query({ walletId: 'w1' })).expect(200);
    expect(after.body.reservations).toHaveLength(0);

    // Usage shows the settled entry with correct est/actual in USD.
    const usage = await withKey(request(app).get('/luc/usage').query({ walletId: 'w1' })).expect(200);
    expect(usage.body.entries).toHaveLength(1);
    const entry = usage.body.entries[0];
    expect(entry.reservationId).toBe(rsv.reservationId);
    expect(entry.estUsd).toBeCloseTo(0.3, 6);
    expect(entry.actualUsd).toBeCloseTo(0.25, 6);
    expect(entry.createdAt).toBeTruthy();
    expectCleanShape(usage.body);
  });

  it('usage respects the limit bound and newest-first order', async () => {
    const ledger = freshLedger();
    const app = makeApp(ledger);
    await provisionPlan(ledger, { id: 'w1', accountId: 'acct1', tier: 'medium', cadence: '3mo' });

    for (let i = 0; i < 3; i++) {
      const r = await reserveForCall(ledger, { walletId: 'w1', estUsd: 0.1 });
      await settleCall(ledger, { reservationId: r.reservationId!, actualUsd: 0.05 * (i + 1) });
    }

    const limited = await withKey(
      request(app).get('/luc/usage').query({ walletId: 'w1', limit: 2 })
    ).expect(200);
    expect(limited.body.entries).toHaveLength(2);
    // Newest first: the later settle (0.15) precedes the earlier ones.
    expect(limited.body.entries[0].actualUsd).toBeCloseTo(0.15, 6);
    expect(limited.body.entries[0].id).toBeGreaterThan(limited.body.entries[1].id);
  });

  it('lists wallets by account', async () => {
    const ledger = freshLedger();
    const app = makeApp(ledger);
    await provisionPlan(ledger, { id: 'w1', accountId: 'acct1', tier: 'medium', cadence: '3mo' });
    await provisionPlan(ledger, { id: 'w2', accountId: 'acct1', tier: 'light', cadence: '6mo' });
    await provisionPlan(ledger, { id: 'w3', accountId: 'acct2', tier: 'heavy', cadence: '9mo' });

    const res = await withKey(request(app).get('/luc/wallets').query({ accountId: 'acct1' })).expect(200);
    expect(res.body.wallets).toHaveLength(2);
    const ids = res.body.wallets.map((w: { id: string }) => w.id).sort();
    expect(ids).toEqual(['w1', 'w2']);
    const w1 = res.body.wallets.find((w: { id: string }) => w.id === 'w1');
    expect(w1.accountId).toBe('acct1');
    expect(w1.planId).toBe('medium-3mo');
    expect(w1.byok).toBe(false);
    expect(w1.usdBudget).toBeCloseTo(planWalletUsdBudget('medium', '3mo'), 6);
    expectCleanShape(res.body);

    const none = await withKey(request(app).get('/luc/wallets').query({ accountId: 'nobody' })).expect(200);
    expect(none.body.wallets).toHaveLength(0);
  });
});

describe('GET /luc/pricing (one table — computed, never re-typed)', () => {
  const app = makeApp(new InMemoryLedger());

  it('every one of the 13 SKUs equals a fresh planChargeUsd/planLuc recomputation', async () => {
    const res = await withKey(request(app).get('/luc/pricing')).expect(200);
    const { skus } = res.body;

    const expectedKeys: string[] = [];
    for (const tier of Object.keys(TIERS)) {
      for (const cadence of Object.keys(CADENCES)) expectedKeys.push(`${tier}-${cadence}`);
    }
    expectedKeys.push('bmc');
    expect(skus).toHaveLength(13);
    expect(skus.map((s: { key: string }) => s.key).sort()).toEqual([...expectedKeys].sort());

    for (const sku of skus as Array<{ key: string; amountUsd: number; luc: number }>) {
      if (sku.key === 'bmc') {
        expect(sku.amountUsd).toBeCloseTo(planChargeUsd('bmc', 'once'), 6);
        expect(sku.luc).toBe(planLuc('bmc', 'once'));
      } else {
        const [tier, cadence] = sku.key.split('-');
        expect(sku.amountUsd).toBeCloseTo(planChargeUsd(tier, cadence), 6);
        expect(sku.luc).toBe(planLuc(tier, cadence));
      }
    }
  });

  it('lanes, tiers, cadences, bmc and standardMission match pricing.ts exports', async () => {
    const res = await withKey(request(app).get('/luc/pricing')).expect(200);
    const p = res.body;

    expect(p.lucUsd).toBe(LUC_USD);
    expect(p.platformRateFactor).toBe(PLATFORM_RATE_FACTOR);

    expect(p.lanes).toHaveLength(4);
    for (const lane of p.lanes) {
      const src = LANES[lane.id as LaneId];
      expect(src).toBeDefined();
      expect(lane.maxOutputUsdPerM).toBe(Number.isFinite(src.maxOutputUsdPerM) ? src.maxOutputUsdPerM : null);
      expect(lane.inWholesalePer1k).toBe(src.inWholesalePer1k);
      expect(lane.outWholesalePer1k).toBe(src.outWholesalePer1k);
      expect(lane.inPlatformPer1k).toBe(src.inPlatformPer1k);
      expect(lane.outPlatformPer1k).toBe(src.outPlatformPer1k);
    }

    expect(p.tiers).toHaveLength(Object.keys(TIERS).length);
    for (const tier of p.tiers) {
      const src = TIERS[tier.id];
      expect(src).toBeDefined();
      expect(tier.name).toBe(src.name);
      expect(tier.monthlyPriceUsd).toBe(src.monthlyPriceUsd);
      expect(tier.lucPerMonth).toBe(src.lucPerMonth);
      expect(tier.lane).toBe(src.lane);
      expect(tier.maxOutputUsdPerM).toBe(Number.isFinite(src.maxOutputUsdPerM) ? src.maxOutputUsdPerM : null);
    }

    expect(p.cadences).toHaveLength(Object.keys(CADENCES).length);
    for (const cadence of p.cadences) {
      const src = CADENCES[cadence.id];
      expect(src).toBeDefined();
      expect(cadence.chargeMonths).toBe(src.chargeMonths);
      expect(cadence.lucMonths).toBe(src.lucMonths);
      expect(cadence.discount).toBe(src.discount);
    }

    expect(p.bmc).toEqual({ priceUsd: BMC.priceUsd, luc: BMC.luc });

    for (const lane of ['economy', 'standard', 'frontier', 'super'] as LaneId[]) {
      expect(p.standardMission[lane]).toBeCloseTo(
        missionBurnLuc(lane, p.standardMission.tokensIn, p.standardMission.tokensOut),
        6
      );
    }
  });

  it('SHAPE GUARD: serializes no model ids, no floor GM, no margin field', async () => {
    const res = await withKey(request(app).get('/luc/pricing')).expect(200);
    expectCleanShape(res.body);
  });
});

describe('read-key auth split', () => {
  it('fails closed (503) when no internal key is configured — even with a read key', async () => {
    const app = makeApp(new InMemoryLedger(), { readApiKey: READ_KEY });
    await withReadKey(request(app).get('/luc/pricing')).expect(503);
    await request(app).get('/luc/pricing').expect(503);
  });

  it('rejects a wrong key on GET (401)', async () => {
    const app = makeApp(new InMemoryLedger());
    await request(app).get('/luc/pricing').set('Authorization', 'Bearer nope').expect(401);
  });

  it('rejects a missing key on GET (401)', async () => {
    const app = makeApp(new InMemoryLedger());
    await request(app).get('/luc/pricing').expect(401);
  });

  it('accepts the read key on GET routes', async () => {
    const ledger = new InMemoryLedger();
    const app = makeApp(ledger);
    await provisionPlan(ledger, { id: 'w1', accountId: 'acct1', tier: 'medium', cadence: '3mo' });
    await withReadKey(request(app).get('/luc/pricing')).expect(200);
    await withReadKey(request(app).get('/luc/usage').query({ walletId: 'w1' })).expect(200);
    await withReadKey(request(app).get('/luc/wallets').query({ accountId: 'acct1' })).expect(200);
    await withReadKey(request(app).get('/luc/reservations').query({ walletId: 'w1' })).expect(200);
    await withReadKey(request(app).get('/luc/balance').query({ walletId: 'w1' })).expect(200);
  });

  it('rejects the read key on a POST (write) route — 401', async () => {
    const ledger = new InMemoryLedger();
    const app = makeApp(ledger);
    await provisionPlan(ledger, { id: 'w1', accountId: 'acct1', tier: 'medium', cadence: '3mo' });
    await withReadKey(request(app).post('/luc/reserve'))
      .send({ walletId: 'w1', estUsd: 0.1 })
      .expect(401);
    // The internal key still opens the same write route.
    await withKey(request(app).post('/luc/reserve')).send({ walletId: 'w1', estUsd: 0.1 }).expect(200);
  });

  it('rejects the read key when no read key is configured (401)', async () => {
    const app = makeApp(new InMemoryLedger(), { internalApiKey: KEY });
    await withReadKey(request(app).get('/luc/pricing')).expect(401);
  });

  it('falls back to the LUC_READ_API_KEY env var when not injected', async () => {
    const prev = process.env.LUC_READ_API_KEY;
    process.env.LUC_READ_API_KEY = 'env-read-key';
    try {
      const app = makeApp(new InMemoryLedger(), { internalApiKey: KEY });
      await request(app).get('/luc/pricing').set('Authorization', 'Bearer env-read-key').expect(200);
      await request(app)
        .post('/luc/reserve')
        .set('Authorization', 'Bearer env-read-key')
        .send({ walletId: 'w1', estUsd: 0.1 })
        .expect(401);
    } finally {
      if (prev === undefined) delete process.env.LUC_READ_API_KEY;
      else process.env.LUC_READ_API_KEY = prev;
    }
  });
});
