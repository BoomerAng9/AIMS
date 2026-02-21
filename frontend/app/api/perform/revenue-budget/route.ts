/**
 * Per|Form Revenue Budget API
 *
 * GET /api/perform/revenue-budget — Budget leaderboard (default view)
 * GET /api/perform/revenue-budget?view=leaderboard — Budget leaderboard
 * GET /api/perform/revenue-budget?view=detail&teamId=<uuid> — Single team detail
 * GET /api/perform/revenue-budget?season=2025 — Filter by season (default 2025)
 * GET /api/perform/revenue-budget?spendingTier=ELITE — Filter by spending tier
 * GET /api/perform/revenue-budget?limit=50&offset=0 — Pagination
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSchoolBudgets,
  getSchoolBudgetByTeam,
  getBudgetLeaderboard,
} from '@/lib/perform/ncaa-data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2025', 10);
  const teamId = searchParams.get('teamId');
  const spendingTier = searchParams.get('spendingTier');
  const view = searchParams.get('view') || 'leaderboard';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Detail view requires teamId
  if (view === 'detail' && !teamId) {
    return NextResponse.json(
      { error: 'teamId is required for detail view' },
      { status: 400 }
    );
  }

  try {
    // Detail view for a specific team
    if (view === 'detail' && teamId) {
      const budget = await getSchoolBudgetByTeam(teamId, season);
      return budget
        ? NextResponse.json(budget)
        : NextResponse.json({ error: 'Budget not found for team' }, { status: 404 });
    }

    // Leaderboard view
    if (view === 'leaderboard') {
      const leaderboard = await getBudgetLeaderboard(season);
      return NextResponse.json(leaderboard);
    }

    // Default filtered list
    const budgets = await getSchoolBudgets({
      season,
      spendingTier: spendingTier || undefined,
      limit,
      offset,
    });

    return NextResponse.json(budgets);
  } catch (err) {
    console.error('[RevenueBudget] DB query failed:', err);
    return NextResponse.json([]);
  }
}
