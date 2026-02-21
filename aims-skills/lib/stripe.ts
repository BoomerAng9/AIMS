/**
 * Shared Stripe SDK initialization
 * All modules import from here instead of using stubs.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    '[AIMS/Stripe] STRIPE_SECRET_KEY not set. Stripe operations will fail at runtime.'
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover' as any,
  appInfo: {
    name: 'AIMS-LUC',
    version: '1.0.0',
  },
});

export { stripe };
export default stripe;
