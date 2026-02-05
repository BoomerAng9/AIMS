/**
 * Stripe Products Setup Script
 * Creates all A.I.M.S. subscription products and prices in Stripe
 * 
 * Run: node scripts/setup-stripe-products.js
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    name: 'Buy Me a Coffee',
    id: 'coffee',
    prices: { monthly: 7.99, annual: 79.99 },
    description: 'Basic automations, voice summaries, research tools'
  },
  {
    name: 'Data Entry',
    id: 'data_entry',
    prices: { monthly: 29.99, annual: 299.99 },
    description: 'iAgent lite, full voice suite, unlimited jobs'
  },
  {
    name: 'Pro',
    id: 'pro',
    prices: { monthly: 99.99, annual: 999.99 },
    description: 'All II repos, priority execution, API access'
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    prices: { monthly: 299, annual: 2999 },
    description: 'Unlimited everything, custom integrations, SLA'
  }
];

async function setupProducts() {
  console.log('🚀 Setting up A.I.M.S. Stripe Products...\n');

  const results = {};

  for (const prod of products) {
    try {
      console.log(`Creating ${prod.name}...`);

      // Create Product
      const product = await stripe.products.create({
        name: `A.I.M.S. ${prod.name}`,
        description: prod.description,
        metadata: {
          plan_id: prod.id,
          aims_product: 'true'
        }
      });

      // Create Monthly Price
      const priceMonthly = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(prod.prices.monthly * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: {
          plan_id: prod.id,
          billing_interval: 'monthly'
        }
      });

      // Create Annual Price
      const priceAnnual = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(prod.prices.annual * 100),
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: {
          plan_id: prod.id,
          billing_interval: 'annual'
        }
      });

      results[prod.id] = {
        product_id: product.id,
        price_monthly: priceMonthly.id,
        price_annual: priceAnnual.id
      };

      console.log(`  ✅ Product ID: ${product.id}`);
      console.log(`  ✅ Monthly Price ID: ${priceMonthly.id}`);
      console.log(`  ✅ Annual Price ID: ${priceAnnual.id}`);
      console.log('');
    } catch (error) {
      console.error(`  ❌ Error creating ${prod.name}:`, error.message);
    }
  }

  console.log('\n📋 Environment Variables to Add:\n');
  console.log('# Stripe Product IDs');
  for (const [planId, ids] of Object.entries(results)) {
    const envPrefix = `STRIPE_${planId.toUpperCase()}`;
    console.log(`${envPrefix}_PRODUCT=${ids.product_id}`);
    console.log(`${envPrefix}_PRICE_MONTHLY=${ids.price_monthly}`);
    console.log(`${envPrefix}_PRICE_ANNUAL=${ids.price_annual}`);
  }

  console.log('\n✨ Setup complete!');
  return results;
}

// Run if called directly
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }
  setupProducts().catch(console.error);
}

module.exports = { setupProducts };
