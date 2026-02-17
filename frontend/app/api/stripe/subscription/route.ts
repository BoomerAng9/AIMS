/**
 * Subscription Status API — Returns the user's current plan tier
 *
 * 5-tier model: Pay-per-Use | Coffee | Data Entry | Pro | Enterprise
 * Checks Stripe for active subscription, maps to AIMS tier.
 * Falls back to Pay-per-Use if no subscription found.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isOwnerEmail } from '@/lib/auth';
import Stripe from 'stripe';

// Lazy-initialized Stripe client — avoids instantiation with empty key at module load
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });
  }
  return _stripe;
}

/**
 * Maps Stripe price IDs to plan tiers.
 * No tier is "unlimited" — all have explicit caps.
 */
const PRICE_TO_TIER: Record<string, {
  tierId: string;
  tierName: string;
  monthlyPrice: number;
  tokensIncluded: number;
  agents: number;
  concurrent: number;
}> = {
  [process.env.STRIPE_PRICE_COFFEE_MONTHLY || 'price_coffee']: {
    tierId: 'coffee',
    tierName: 'Buy Me a Coffee',
    monthlyPrice: 7.99,
    tokensIncluded: 10_000,
    agents: 5,
    concurrent: 1,
  },
  [process.env.STRIPE_PRICE_DATA_ENTRY_MONTHLY || 'price_data_entry']: {
    tierId: 'data_entry',
    tierName: 'Data Entry',
    monthlyPrice: 29.99,
    tokensIncluded: 50_000,
    agents: 15,
    concurrent: 3,
  },
  [process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro']: {
    tierId: 'pro',
    tierName: 'Pro',
    monthlyPrice: 99.99,
    tokensIncluded: 200_000,
    agents: 50,
    concurrent: 10,
  },
  [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise']: {
    tierId: 'enterprise',
    tierName: 'Enterprise',
    monthlyPrice: 299,
    tokensIncluded: 500_000,
    agents: 100,
    concurrent: 25,
  },
};

const P2P_RESPONSE = {
  tierId: 'p2p',
  tierName: 'Pay-per-Use',
  monthlyPrice: 0,
  tokensIncluded: 0,
  tokensUsed: 0,
  agents: 0,
  concurrent: 1,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(P2P_RESPONSE, { status: 401 });
    }

    // Owner always gets Enterprise-level access
    if (isOwnerEmail(session.user.email)) {
      return NextResponse.json({
        tierId: 'enterprise',
        tierName: 'Enterprise (Owner)',
        monthlyPrice: 0,
        tokensIncluded: 500_000,
        tokensUsed: 0,
        agents: 100,
        concurrent: 25,
      });
    }

    // Look up Stripe customer by email
    if (!process.env.STRIPE_SECRET_KEY) {
      // No Stripe configured — default to P2P
      return NextResponse.json(P2P_RESPONSE);
    }

    const stripe = getStripe();
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(P2P_RESPONSE);
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(P2P_RESPONSE);
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id || '';
    const tierInfo = PRICE_TO_TIER[priceId];

    if (!tierInfo) {
      // Unknown price — treat as P2P
      return NextResponse.json(P2P_RESPONSE);
    }

    // Fetch token usage from LUC meter (in-memory for now, persistent store TODO)
    let tokensUsed = 0;
    try {
      const meterRes = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/luc/meter?userId=${encodeURIComponent(session.user.email)}`,
        { headers: { cookie: '' } } // internal call — session already validated above
      );
      if (meterRes.ok) {
        const meterData = await meterRes.json();
        tokensUsed = meterData?.summary?.quotas?.AI_CHAT?.used ?? 0;
      }
    } catch {
      // LUC meter unavailable — return 0 rather than blocking
    }

    return NextResponse.json({
      ...tierInfo,
      tokensUsed,
      subscriptionId: sub.id,
      currentPeriodEnd: sub.current_period_end,
    });
  } catch (err: any) {
    console.error('[Subscription] Error:', err.message);
    // On error, don't block — return P2P
    return NextResponse.json(P2P_RESPONSE);
  }
}
