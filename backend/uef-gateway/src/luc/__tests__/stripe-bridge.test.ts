/**
 * LUC allocator — Stripe checkout + webhook bridge.
 *
 * createCheckoutSession builds the Stripe params for a v6 SKU (subscription for
 * plans, payment for the BMC reload) with the live price id from env and the
 * wallet/account in metadata. handleCheckout is the webhook side: a paid v6 SKU
 * provisions the luc_wallets ledger; anything else returns {handled:false} so the
 * legacy agent-commerce path is left untouched (alongside, not replaced).
 *
 * Stripe is injected (a minimal fake here) — no live keys, gate-safe.
 */

import { InMemoryLedger } from '../ledger';
import { handleCheckout, createCheckoutSession } from '../stripe-bridge';

describe('handleCheckout (webhook -> luc_wallets)', () => {
  let ledger: InMemoryLedger;
  beforeEach(() => { ledger = new InMemoryLedger(); });

  it('a v6 plan SKU (by metadata) provisions the wallet', async () => {
    const r = await handleCheckout(ledger, { skuKey: 'medium-3mo', walletId: 'w1', accountId: 'a1' }, {});
    expect(r.handled).toBe(true);
    expect(r.planId).toBe('medium-3mo');
    expect(r.available).toBeCloseTo(60, 6);
  });

  it('a BMC SKU stacks (reload) across two purchases', async () => {
    await handleCheckout(ledger, { skuKey: 'bmc', walletId: 'w1', accountId: 'a1' }, {});
    const r2 = await handleCheckout(ledger, { skuKey: 'bmc', walletId: 'w1', accountId: 'a1' }, {});
    expect(r2.handled).toBe(true);
    expect(r2.available).toBeCloseTo(13.08, 6);
  });

  it('resolves by Stripe price id when metadata is absent (externally-created sub)', async () => {
    const env = { STRIPE_PRICE_HEAVY_3MO: 'price_h3' };
    const r = await handleCheckout(ledger, { priceId: 'price_h3', walletId: 'w1', accountId: 'a1' }, env);
    expect(r.handled).toBe(true);
    expect(r.planId).toBe('heavy-3mo');
  });

  it('a non-v6 price is NOT handled here (legacy path takes over)', async () => {
    const r = await handleCheckout(ledger, { priceId: 'price_legacy_x402', walletId: 'w1', accountId: 'a1' }, {});
    expect(r.handled).toBe(false);
  });
});

describe('createCheckoutSession (Stripe params for a v6 SKU)', () => {
  function fakeStripe() {
    const calls: any[] = [];
    return {
      calls,
      checkout: { sessions: { create: async (p: any) => { calls.push(p); return { id: 'cs_1', url: 'https://pay/cs_1' }; } } },
    };
  }
  const env = { STRIPE_PRICE_MEDIUM_6MO: 'price_m6', STRIPE_PRICE_BMC: 'price_bmc' };

  it('plan SKU -> mode subscription, resolved price, wallet/account in metadata', async () => {
    const s = fakeStripe();
    const out = await createCheckoutSession(s as any, {
      skuKey: 'medium-6mo', env, walletId: 'w1', accountId: 'a1',
      successUrl: 'https://ok', cancelUrl: 'https://no',
    });
    expect(out.url).toBe('https://pay/cs_1');
    const p = s.calls[0];
    expect(p.mode).toBe('subscription');
    expect(p.line_items[0].price).toBe('price_m6');
    expect(p.metadata).toMatchObject({ skuKey: 'medium-6mo', walletId: 'w1', accountId: 'a1' });
    expect(p.subscription_data.metadata).toMatchObject({ skuKey: 'medium-6mo', walletId: 'w1' });
  });

  it('BMC SKU -> mode payment (repeatable one-time)', async () => {
    const s = fakeStripe();
    await createCheckoutSession(s as any, { skuKey: 'bmc', env, walletId: 'w1', accountId: 'a1', successUrl: 'https://ok', cancelUrl: 'https://no' });
    expect(s.calls[0].mode).toBe('payment');
    expect(s.calls[0].line_items[0].price).toBe('price_bmc');
  });

  it('unknown SKU throws', async () => {
    const s = fakeStripe();
    await expect(createCheckoutSession(s as any, { skuKey: 'nope', env, walletId: 'w1', accountId: 'a1', successUrl: 'x', cancelUrl: 'y' }))
      .rejects.toThrow(/unknown sku/i);
  });

  it('a SKU whose Stripe price is not configured throws (never guess)', async () => {
    const s = fakeStripe();
    await expect(createCheckoutSession(s as any, { skuKey: 'light-9mo', env, walletId: 'w1', accountId: 'a1', successUrl: 'x', cancelUrl: 'y' }))
      .rejects.toThrow(/price not configured/i);
  });
});
