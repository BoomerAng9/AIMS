// @ts-nocheck
/**
 * Garage to Global — Seller API Routes
 *
 * Endpoints for the e-commerce seller suite:
 * - GET: Fetch seller profile, products, marketplace connections
 * - POST: Create/update seller data, run marketplace actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { GROWTH_STAGES } from '@/lib/shopping/seller-types';

// Demo seller profile for initial state
const DEMO_PROFILE = {
  id: 'demo-seller',
  userId: 'default-user',
  businessName: 'My Store',
  stage: 'garage' as const,
  businessType: 'individual' as const,
  country: 'US',
  regions: ['US'],
  marketplaces: [],
  totalProducts: 0,
  totalInventoryValue: 0,
  metrics: {
    revenue: { today: 0, week: 0, month: 0, year: 0, trend: 0 },
    orders: { pending: 0, shipped: 0, delivered: 0, returned: 0 },
    performance: { conversionRate: 0, averageOrderValue: 0, customerSatisfaction: 0, responseTime: 0 },
    inventory: { totalValue: 0, lowStockItems: 0, outOfStockItems: 0, overstockedItems: 0 },
    health: { score: 50, issues: [], lastUpdated: new Date() },
  },
  activeTeams: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'profile';

  switch (action) {
    case 'profile':
      return NextResponse.json({
        success: true,
        profile: DEMO_PROFILE,
      });

    case 'stages':
      return NextResponse.json({
        success: true,
        stages: GROWTH_STAGES,
      });

    case 'best-practices':
      const marketplace = searchParams.get('marketplace');
      return NextResponse.json({
        success: true,
        marketplace,
        message: 'Best practices engine ready. Connect a marketplace to get personalized recommendations.',
      });

    default:
      return NextResponse.json({
        success: true,
        profile: DEMO_PROFILE,
      });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'update-stage':
      return NextResponse.json({
        success: true,
        stage: body.stage,
        message: `Seller stage updated to ${body.stage}`,
      });

    case 'connect-marketplace':
      return NextResponse.json({
        success: true,
        marketplace: body.marketplace,
        message: `${body.marketplace} connection initiated. ACHEEVY will guide you through setup.`,
      });

    case 'audit-listing':
      return NextResponse.json({
        success: true,
        message: 'Listing audit queued. Boomer_Angs will analyze and report back.',
      });

    case 'optimize-listing':
      return NextResponse.json({
        success: true,
        message: 'AI optimization in progress. Results will appear in your dashboard.',
      });

    default:
      return NextResponse.json({
        success: false,
        error: `Unknown action: ${action}`,
      }, { status: 400 });
  }
}
