/**
 * LUC allocator — Stripe product/price provisioning (the go-live script).
 *
 * Creates the 13 v6 SKUs as Stripe products + prices, IDEMPOTENTLY (tagged with
 * metadata.aims_sku; a second run reuses, never duplicates), and returns the
 * STRIPE_PRICE_* -> priceId env map to paste into the gateway env. Amounts come
 * from the SKU catalog (pricing.ts), so live prices match canon exactly.
 *
 * Validated here against a fake Stripe — the real run uses the live key on the box.
 */

import { provisionStripeCatalog } from '../stripe-provision';

function fakeStripe() {
  const products: any[] = [];
  const prices: any[] = [];
  return {
    products: {
      create: async (p: any) => { const o = { id: `prod_${products.length}`, ...p }; products.push(o); return o; },
      search: async ({ query }: { query: string }) => {
        const m = query.match(/:'([^']+)'/); // extract the value in metadata['aims_sku']:'<value>'
        const sku = m?.[1];
        return { data: products.filter((p) => p.metadata?.aims_sku === sku) };
      },
    },
    prices: {
      create: async (p: any) => { const o = { id: `price_${prices.length}`, active: true, ...p }; prices.push(o); return o; },
      list: async ({ product }: { product: string }) => ({ data: prices.filter((p) => p.product === product) }),
    },
    _products: products,
    _prices: prices,
  };
}

describe('provisionStripeCatalog', () => {
  it('creates 13 products + prices and returns the full STRIPE_PRICE_* env map', async () => {
    const s = fakeStripe();
    const env = await provisionStripeCatalog(s as any);
    expect(Object.keys(env)).toHaveLength(13);
    expect(env.STRIPE_PRICE_BMC).toBeTruthy();
    expect(env.STRIPE_PRICE_MEDIUM_6MO).toBeTruthy();
    expect(s._products).toHaveLength(13);
  });

  it('subscription price carries cents + monthly interval_count; BMC is one-time', async () => {
    const s = fakeStripe();
    await provisionStripeCatalog(s as any);
    const m6 = s._prices.find((p: any) => p.metadata?.aims_sku === 'medium-6mo');
    expect(m6.unit_amount).toBe(10795); // $107.95
    expect(m6.currency).toBe('usd');
    expect(m6.recurring).toEqual({ interval: 'month', interval_count: 6 });
    const sup9 = s._prices.find((p: any) => p.metadata?.aims_sku === 'superior-9mo');
    expect(sup9.unit_amount).toBe(71991); // $719.91
    expect(sup9.recurring.interval_count).toBe(9);
    const bmc = s._prices.find((p: any) => p.metadata?.aims_sku === 'bmc');
    expect(bmc.unit_amount).toBe(654); // $6.54
    expect(bmc.recurring).toBeUndefined(); // one-time
  });

  it('is idempotent — a second run creates nothing new and returns the same ids', async () => {
    const s = fakeStripe();
    const env1 = await provisionStripeCatalog(s as any);
    const env2 = await provisionStripeCatalog(s as any);
    expect(s._products).toHaveLength(13); // not 26
    expect(s._prices).toHaveLength(13);
    expect(env2).toEqual(env1);
  });
});
