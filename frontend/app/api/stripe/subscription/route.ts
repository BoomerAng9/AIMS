/**
 * Subscription Status API — Returns the user's current 3-6-9 tier
 *
 * Checks Stripe for active subscription, maps to AIMS tier.
 * Falls back to P2P (free) if no subscription found.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isOwnerEmail } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const PRICE_TO_TIER: Record<string, {
  tierId: string;
  tierName: string;
  monthlyPrice: number;
  tokensIncluded: number;
  agents: number;
  concurrent: number;
}> = {
  [process.env.STRIPE_PRICE_GARAGE || 'price_garage']: {
    tierId: 'garage',
    tierName: 'Garage',
    monthlyPrice: 99,
    tokensIncluded: 100_000,
    agents: 3,
    concurrent: 1,
  },
  [process.env.STRIPE_PRICE_COMMUNITY || 'price_community']: {
    tierId: 'community',
    tierName: 'Community',
    monthlyPrice: 89,
    tokensIncluded: 250_000,
    agents: 10,
    concurrent: 5,
  },
  [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: {
    tierId: 'enterprise',
    tierName: 'Enterprise',
    monthlyPrice: 67,
    tokensIncluded: 500_000,
    agents: 50,
    concurrent: 25,
  },
};

const P2P_RESPONSE = {
  tierId: 'p2p',
  tierName: 'P2P (Free)',
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
        tokensIncluded: 999_999,
        tokensUsed: 0,
        agents: 999,
        concurrent: 999,
      });
    }

    // Look up Stripe customer by email
    if (!process.env.STRIPE_SECRET_KEY) {
      // No Stripe configured — default to P2P
      return NextResponse.json(P2P_RESPONSE);
    }

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

    return NextResponse.json({
      ...tierInfo,
      tokensUsed: 0, // TODO: wire to LUC metering
      subscriptionId: sub.id,
      currentPeriodEnd: sub.current_period_end,
    });
  } catch (err: any) {
    console.error('[Subscription] Error:', err.message);
    // On error, don't block — return P2P
    return NextResponse.json(P2P_RESPONSE);
  }
}
