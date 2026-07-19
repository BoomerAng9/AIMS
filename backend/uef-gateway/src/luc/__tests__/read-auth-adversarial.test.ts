/**
 * LUC allocator — ADVERSARIAL auth + bounds proofs for the read/write split.
 *
 * reads.test.ts proves the happy paths; this suite attacks them:
 *   - timing-safe key comparison (timingSafeKeyEqual) — the middleware no
 *     longer compares secrets with `===`;
 *   - method-bypass: the read key opens GET ONLY — HEAD and OPTIONS (which
 *     Express would otherwise route or auto-answer) are refused; POST stays
 *     refused; the internal key is unaffected;
 *   - key-state matrix: absent key -> 401; wrong key -> 401; EMPTY-STRING
 *     presented key -> 401; empty-string CONFIGURED internal key means
 *     UNCONFIGURED -> 503 (never open); empty-string configured read key
 *     opens nothing;
 *   - clamp bounds: limit NaN / negative / float / 1e9 can neither crash the
 *     route nor escape the <=100 window.
 *
 * PROPRIETARY — A.I.M.S.
 */

import express from 'express';
import request from 'supertest';
import { InMemoryLedger, LedgerAdapter, clampEntryLimit } from '../ledger';
import { createLucRouter, timingSafeKeyEqual } from '../routes';
import { provisionPlan } from '../service';

const KEY = 'test-internal-key';
const READ_KEY = 'test-read-key';

function makeApp(
  ledger: LedgerAdapter = new InMemoryLedger(),
  keys: { internalApiKey?: string; readApiKey?: string } = {
    internalApiKey: KEY,
    readApiKey: READ_KEY,
  }
) {
  const app = express();
  app.use(express.json());
  app.use('/luc', createLucRouter({ ledger, ...keys }));
  return app;
}

describe('timingSafeKeyEqual', () => {
  it('accepts equal keys', () => {
    expect(timingSafeKeyEqual('devtest-internal', 'devtest-internal')).toBe(true);
  });

  it('rejects same-length and different-length mismatches without throwing', () => {
    expect(timingSafeKeyEqual('devtest-internal', 'devtest-internaL')).toBe(false);
    expect(timingSafeKeyEqual('short', 'a-much-longer-expected-key')).toBe(false);
    expect(timingSafeKeyEqual('', 'x')).toBe(false);
  });
});

describe('method-bypass: the read key opens GET only', () => {
  it('read key on HEAD /balance is refused (HEAD is not GET)', async () => {
    const res = await request(makeApp())
      .head('/luc/balance?walletId=w1')
      .set('Authorization', `Bearer ${READ_KEY}`);
    expect(res.status).toBe(401);
  });

  it('read key on OPTIONS of a write route is refused before Express can auto-answer', async () => {
    const res = await request(makeApp())
      .options('/luc/provision')
      .set('Authorization', `Bearer ${READ_KEY}`);
    expect(res.status).toBe(401);
  });

  it('read key on POST /provision stays a 401', async () => {
    const res = await request(makeApp())
      .post('/luc/provision')
      .set('Authorization', `Bearer ${READ_KEY}`)
      .send({ id: 'w1', accountId: 'a1', planId: 'p', usdBudget: 10 });
    expect(res.status).toBe(401);
  });

  it('the internal key still answers HEAD on a GET route (Express HEAD->GET)', async () => {
    const ledger = new InMemoryLedger();
    await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'medium', cadence: '3mo' });
    const res = await request(makeApp(ledger))
      .head('/luc/balance?walletId=w1')
      .set('Authorization', `Bearer ${KEY}`);
    expect(res.status).toBe(200);
  });
});

describe('key-state matrix', () => {
  it('absent key -> 401', async () => {
    const res = await request(makeApp()).get('/luc/balance?walletId=w1');
    expect(res.status).toBe(401);
  });

  it('wrong key -> 401', async () => {
    const res = await request(makeApp())
      .get('/luc/balance?walletId=w1')
      .set('x-internal-key', 'not-the-key');
    expect(res.status).toBe(401);
  });

  it('EMPTY-STRING presented key -> 401 (never treated as a match)', async () => {
    const res = await request(makeApp())
      .get('/luc/balance?walletId=w1')
      .set('x-internal-key', '');
    expect(res.status).toBe(401);
  });

  it('empty-string CONFIGURED internal key means UNCONFIGURED -> 503, never open', async () => {
    const app = makeApp(new InMemoryLedger(), { internalApiKey: '', readApiKey: READ_KEY });
    const withEmpty = await request(app).get('/luc/pricing').set('x-internal-key', '');
    expect(withEmpty.status).toBe(503);
    const withRead = await request(app).get('/luc/pricing').set('x-internal-key', READ_KEY);
    expect(withRead.status).toBe(503);
  });

  it('empty-string configured read key opens nothing', async () => {
    const app = makeApp(new InMemoryLedger(), { internalApiKey: KEY, readApiKey: '' });
    const res = await request(app).get('/luc/pricing').set('x-internal-key', '');
    expect(res.status).toBe(401);
  });
});

describe('clamp bounds on /usage limit', () => {
  it('clampEntryLimit: NaN -> fallback, negative -> 1, float -> floor, 1e9 -> cap', () => {
    expect(clampEntryLimit(Number.NaN)).toBe(100);
    expect(clampEntryLimit(-5)).toBe(1);
    expect(clampEntryLimit(2.7)).toBe(2);
    expect(clampEntryLimit(1e9)).toBe(100);
    expect(clampEntryLimit(undefined)).toBe(100);
  });

  it.each(['abc', '-5', '2.7', '1000000000'])(
    'GET /usage?limit=%s answers 200 with a bounded entries array',
    async (limit) => {
      const ledger = new InMemoryLedger();
      await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'medium', cadence: '3mo' });
      const res = await request(makeApp(ledger))
        .get(`/luc/usage?walletId=w1&limit=${limit}`)
        .set('Authorization', `Bearer ${READ_KEY}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.entries)).toBe(true);
      expect(res.body.entries.length).toBeLessThanOrEqual(100);
    }
  );
});
