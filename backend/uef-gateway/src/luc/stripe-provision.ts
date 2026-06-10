/**
 * LUC allocator — Stripe product/price provisioning (go-live).
 *
 * Idempotently creates the 13 v6 SKUs (4 tiers x 3 Tesla cadences as monthly-
 * interval subscriptions + the BMC one-time reload) as Stripe products + prices,
 * tagged with metadata.aims_sku so a re-run reuses instead of duplicating.
 * Returns the STRIPE_PRICE_* -> priceId map to set in the gateway env.
 *
 * Amounts come from the SKU catalog (pricing.ts) -> live prices match canon.
 * Run on the box where the live STRIPE_SECRET_KEY lives (see runStripeProvision).
 *
 * PROPRIETARY — A.I.M.S.
 */

import { SKUS, Sku } from './stripe-catalog';

/** Minimal slice of the Stripe SDK the provisioner needs (injectable for tests). */
export interface StripeProvisionClient {
  products: {
    create(params: Record<string, unknown>): Promise<{ id: string }>;
    search(params: { query: string }): Promise<{ data: Array<{ id: string; metadata?: Record<string, string> }> }>;
  };
  prices: {
    create(params: Record<string, unknown>): Promise<{ id: string }>;
    list(params: { product: string }): Promise<{ data: Array<{ id: string; unit_amount?: number; active?: boolean; recurring?: unknown }> }>;
  };
}

function recurringFor(sku: Sku): { interval: 'month'; interval_count: number } | undefined {
  return sku.kind === 'subscription'
    ? { interval: 'month', interval_count: sku.intervalMonths! }
    : undefined;
}

async function ensureProduct(stripe: StripeProvisionClient, sku: Sku): Promise<string> {
  const found = await stripe.products.search({ query: `metadata['aims_sku']:'${sku.key}'` });
  if (found.data[0]) return found.data[0].id;
  const created = await stripe.products.create({
    name: `A.I.M.S. — ${sku.name}`,
    metadata: { aims_sku: sku.key },
  });
  return created.id;
}

async function ensurePrice(stripe: StripeProvisionClient, sku: Sku, productId: string): Promise<string> {
  const unit_amount = Math.round(sku.amountUsd * 100); // cents
  const recurring = recurringFor(sku);
  const recurringKey = JSON.stringify(recurring ?? null);
  const existing = (await stripe.prices.list({ product: productId })).data;
  const match = existing.find(
    (p) => p.active !== false && p.unit_amount === unit_amount && JSON.stringify(p.recurring ?? null) === recurringKey
  );
  if (match) return match.id;
  const created = await stripe.prices.create({
    product: productId,
    currency: 'usd',
    unit_amount,
    ...(recurring ? { recurring } : {}),
    metadata: { aims_sku: sku.key },
  });
  return created.id;
}

/**
 * Create (idempotently) every SKU's product + price. Returns the env map
 * { STRIPE_PRICE_*: priceId } to write into the gateway environment.
 */
export async function provisionStripeCatalog(stripe: StripeProvisionClient): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  for (const sku of Object.values(SKUS)) {
    const productId = await ensureProduct(stripe, sku);
    const priceId = await ensurePrice(stripe, sku, productId);
    env[sku.stripePriceEnv] = priceId;
  }
  return env;
}

/**
 * CLI entry for the box: `node dist/luc/stripe-provision.js` (live key in env).
 * Prints the env block to paste/append into the gateway's .env, then restart.
 */
/* istanbul ignore next — exercised live on the box, not in unit tests */
export async function runStripeProvision(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // eslint-disable-next-line no-console
    console.error('[stripe-provision] STRIPE_SECRET_KEY not set — refuse to run (no live key, no guess).');
    process.exit(5);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Stripe = require('stripe');
  const stripe = new Stripe(key);
  const env = await provisionStripeCatalog(stripe as unknown as StripeProvisionClient);
  const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
  // eslint-disable-next-line no-console
  console.log(`# A.I.M.S. v6 Stripe price IDs (${mode}) — append to the gateway env, then restart:`);
  for (const [k, v] of Object.entries(env)) {
    // eslint-disable-next-line no-console
    console.log(`${k}=${v}`);
  }
}

/* istanbul ignore next */
if (require.main === module) {
  runStripeProvision().catch((e) => {
    // eslint-disable-next-line no-console
    console.error('[stripe-provision] failed:', e?.message ?? e);
    process.exit(2);
  });
}
