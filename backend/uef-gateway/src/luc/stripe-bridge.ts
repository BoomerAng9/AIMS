/**
 * LUC allocator — Stripe checkout + webhook bridge (v6).
 *
 * Two glue functions over the SKU catalog + provision bridge:
 *   createCheckoutSession — builds the Stripe Checkout params for a v6 SKU
 *     (subscription for plans, payment for the repeatable BMC reload) with the
 *     live price id from env and the wallet/account carried in metadata.
 *   handleCheckout — the webhook side: a paid v6 SKU provisions the luc_wallets
 *     ledger; a non-v6 price returns {handled:false} so the legacy agent-commerce
 *     path runs unchanged (the two systems live ALONGSIDE, not replaced).
 *
 * Stripe is injected (minimal interface) so this is unit-testable with no live
 * keys; the route layer passes the real `stripe` client + process.env.
 *
 * PROPRIETARY — A.I.M.S.
 */

import { LedgerAdapter } from './ledger';
import { getSku, skuByStripePriceId, resolveStripePriceId, provisionFromSku } from './stripe-catalog';

type Env = Record<string, string | undefined>;

/** Minimal slice of the Stripe SDK this bridge needs (injectable for tests). */
export interface StripeLike {
  checkout: {
    sessions: {
      create(params: Record<string, unknown>): Promise<{ id: string; url: string | null }>;
    };
  };
}

export interface CheckoutResolved {
  /** Preferred: the v6 SKU key carried in session metadata at creation. */
  skuKey?: string;
  /** Fallback: the Stripe price id (for externally-created subs without our metadata). */
  priceId?: string;
  walletId: string;
  accountId: string;
  byok?: boolean;
}

export interface CheckoutOutcome {
  handled: boolean;
  planId?: string;
  available?: number;
  reason?: string;
}

/**
 * Webhook side. Resolve the v6 SKU (metadata first, then price id) and provision
 * the LUC wallet. Returns {handled:false} for non-v6 prices — the caller then
 * falls through to the legacy billing path.
 */
export async function handleCheckout(
  ledger: LedgerAdapter,
  r: CheckoutResolved,
  env: Env
): Promise<CheckoutOutcome> {
  let sku = r.skuKey ? getSku(r.skuKey) : null;
  if (!sku && r.priceId) sku = skuByStripePriceId(r.priceId, env);
  if (!sku) return { handled: false, reason: 'no v6 SKU matched — legacy path' };
  const res = await provisionFromSku(ledger, sku, {
    walletId: r.walletId,
    accountId: r.accountId,
    byok: r.byok,
  });
  return { handled: true, planId: res.planId, available: res.available };
}

export interface CreateCheckoutInput {
  skuKey: string;
  env: Env;
  walletId: string;
  accountId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

/** Build + create a Stripe Checkout session for a v6 SKU. */
export async function createCheckoutSession(
  stripe: StripeLike,
  input: CreateCheckoutInput
): Promise<{ id: string; url: string | null }> {
  const sku = getSku(input.skuKey);
  if (!sku) throw new Error(`unknown sku: ${input.skuKey}`);
  const priceId = resolveStripePriceId(sku, input.env);
  if (!priceId) throw new Error(`Stripe price not configured for sku ${sku.key} (${sku.stripePriceEnv})`);

  const metadata = { skuKey: sku.key, walletId: input.walletId, accountId: input.accountId };
  const mode = sku.kind === 'subscription' ? 'subscription' : 'payment';

  const params: Record<string, unknown> = {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata,
  };
  if (input.customerEmail) params.customer_email = input.customerEmail;
  // Carry the same metadata onto the subscription so renewal invoices resolve too.
  if (mode === 'subscription') params.subscription_data = { metadata };

  const session = await stripe.checkout.sessions.create(params);
  return { id: session.id, url: session.url };
}
