/**
 * LUC allocator — HTTP routes.
 *
 * Thin Express shell over the proven service. These tests prove the wire layer:
 * the routes REQUIRE the internal service key (closing the unauthenticated-debit
 * class), and the full provision -> gate -> reserve -> settle -> balance flow —
 * including the $1 pause — works over HTTP.
 */

import express from 'express';
import request from 'supertest';
import { InMemoryLedger } from '../ledger';
import { createLucRouter } from '../routes';

const KEY = 'test-internal-key';
const FABLE = 'claude-fable-5';

function makeApp() {
  const ledger = new InMemoryLedger();
  const app = express();
  app.use(express.json());
  app.use('/luc', createLucRouter({ ledger, internalApiKey: KEY }));
  return app;
}

const withKey = (t: request.Test) => t.set('Authorization', `Bearer ${KEY}`);

describe('LUC routes (HTTP)', () => {
  it('rejects requests without the internal key (401)', async () => {
    await request(makeApp()).post('/luc/gate').send({ walletId: 'w1', model: FABLE }).expect(401);
  });

  it('rejects a wrong key (401)', async () => {
    await request(makeApp())
      .post('/luc/gate')
      .set('Authorization', 'Bearer nope')
      .send({ walletId: 'w1', model: FABLE })
      .expect(401);
  });

  it('runs provision -> gate -> reserve -> settle -> balance', async () => {
    const app = makeApp();
    await withKey(request(app).post('/luc/provision'))
      .send({ id: 'w1', accountId: 'a1', planId: '3mo', usdBudget: 1.0 })
      .expect(200);

    const gate = await withKey(request(app).post('/luc/gate'))
      .send({ walletId: 'w1', model: FABLE })
      .expect(200);
    expect(gate.body.allowed).toBe(true);

    const rsv = await withKey(request(app).post('/luc/reserve'))
      .send({ walletId: 'w1', model: FABLE, maxTokens: 6000 })
      .expect(200);
    expect(rsv.body.ok).toBe(true);
    expect(rsv.body.estUsd).toBeCloseTo(0.3, 6);

    await withKey(request(app).post('/luc/settle'))
      .send({ reservationId: rsv.body.reservationId, actualUsd: 0.25 })
      .expect(200);

    const bal = await withKey(request(app).get('/luc/balance').query({ walletId: 'w1' })).expect(200);
    expect(bal.body.spent).toBeCloseTo(0.25, 6);
    expect(bal.body.available).toBeCloseTo(0.75, 6);
  });

  it('pauses a $1 wallet at the limit over HTTP', async () => {
    const app = makeApp();
    await withKey(request(app).post('/luc/provision'))
      .send({ id: 'w1', accountId: 'a1', planId: '3mo', usdBudget: 1.0 })
      .expect(200);

    let granted = 0;
    let paused = false;
    for (let i = 0; i < 10; i++) {
      const r = await withKey(request(app).post('/luc/reserve')).send({
        walletId: 'w1',
        model: FABLE,
        maxTokens: 6000,
      });
      if (r.body.ok) granted++;
      else {
        paused = true;
        break;
      }
    }
    expect(granted).toBe(3);
    expect(paused).toBe(true);

    const bal = await withKey(request(app).get('/luc/balance').query({ walletId: 'w1' }));
    expect(bal.body.available).toBeGreaterThanOrEqual(0);
  });

  it('400s on a missing required field', async () => {
    await withKey(request(makeApp()).post('/luc/reserve')).send({ model: FABLE }).expect(400);
  });
});
