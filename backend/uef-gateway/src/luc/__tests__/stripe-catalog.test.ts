/**
 * LUC allocator — v6 Stripe SKU catalog + provision-on-event bridge.
 *
 * The 13 SKUs (4 tiers x 3 Tesla cadences + the BMC reload) derive their amounts
 * from pricing.ts, so the Stripe charge can never drift from the canon. Live
 * Stripe price IDs are injected via env at the money gate; this layer maps a
 * paid SKU -> the LUC ledger provision (provisionPlan / applyBmcPurchase).
 */

import { InMemoryLedger } from '../ledger';
import { SKUS, getSku, skuForPlan, BMC_SKU_KEY, resolveStripePriceId, skuByStripePriceId, provisionFromSku } from '../stripe-catalog';

describe('v6 Stripe SKU catalog', () => {
  it('has 12 subscription SKUs + 1 BMC reload = 13', () => {
    const keys = Object.keys(SKUS);
    expect(keys).toHaveLength(13);
    expect(keys).toContain('bmc');
    expect(keys).toContain('medium-6mo');
    expect(keys).toContain('superior-9mo');
  });

  it('subscription SKU amounts + interval derive from pricing.ts', () => {
    expect(skuForPlan('medium', '6mo')).toMatchObject({
      kind: 'subscription', tier: 'medium', cadence: '6mo',
      amountUsd: 107.95, intervalMonths: 6, stripePriceEnv: 'STRIPE_PRICE_MEDIUM_6MO',
    });
    expect(skuForPlan('superior', '9mo')).toMatchObject({
      kind: 'subscription', amountUsd: 719.91, intervalMonths: 9, stripePriceEnv: 'STRIPE_PRICE_SUPERIOR_9MO',
    });
    expect(skuForPlan('light', '3mo')).toMatchObject({ amountUsd: 29.97, intervalMonths: 3 });
  });

  it('BMC is a repeatable one-time SKU at $6.54', () => {
    expect(getSku(BMC_SKU_KEY)).toMatchObject({
      kind: 'one_time', amountUsd: 6.54, stripePriceEnv: 'STRIPE_PRICE_BMC',
    });
  });

  it('resolves the live Stripe price id from env (injected at the money gate)', () => {
    const env = { STRIPE_PRICE_MEDIUM_6MO: 'price_live_abc', STRIPE_PRICE_BMC: 'price_live_bmc' };
    expect(resolveStripePriceId(skuForPlan('medium', '6mo')!, env)).toBe('price_live_abc');
    expect(resolveStripePriceId(getSku('bmc')!, {})).toBeNull(); // unset -> null (don't guess)
  });

  it('reverse-resolves a SKU from the Stripe price id (webhook path)', () => {
    const env = { STRIPE_PRICE_HEAVY_3MO: 'price_h3', STRIPE_PRICE_BMC: 'price_bmc' };
    expect(skuByStripePriceId('price_h3', env)?.key).toBe('heavy-3mo');
    expect(skuByStripePriceId('price_bmc', env)?.key).toBe('bmc');
    expect(skuByStripePriceId('price_unknown', env)).toBeNull();
  });
});

describe('provision-on-event (paid SKU -> LUC wallet)', () => {
  let ledger: InMemoryLedger;
  beforeEach(() => { ledger = new InMemoryLedger(); });

  it('a paid Medium 3mo subscription provisions a $60 wallet', async () => {
    const r = await provisionFromSku(ledger, skuForPlan('medium', '3mo')!, { walletId: 'w1', accountId: 'a1' });
    expect(r.planId ?? (await ledger.getWallet('w1'))!.planId).toBe('medium-3mo');
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(60, 6);
  });

  it('a paid BMC stacks (reload) — buy twice -> $13.08', async () => {
    await provisionFromSku(ledger, getSku('bmc')!, { walletId: 'w1', accountId: 'a1' });
    await provisionFromSku(ledger, getSku('bmc')!, { walletId: 'w1', accountId: 'a1' });
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(13.08, 6);
  });
});
