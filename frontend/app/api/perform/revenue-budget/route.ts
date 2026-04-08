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
import { SEED_SCHOOL_BUDGETS } from '@/lib/perform/seed-ncaa-data';

/** Build budget leaderboard from seed data */
function getSeedBudgetLeaderboard(filters?: { spendingTier?: string; limit?: number; offset?: number }) {
  let budgets = SEED_SCHOOL_BUDGETS.map((b, i) => ({
    id: `seed-budget-${b.teamAbbrev}`.toLowerCase(),
    team: { commonName: b.teamAbbrev, abbreviation: b.teamAbbrev },
    teamId: null,
    season: 2025,
    totalRevenue: b.totalRevenue,
    footballRevenue: b.footballRevenue,
    nilBudget: b.nilBudget,
    nilSpent: b.nilSpent,
    nilRemaining: b.nilBudget - b.nilSpent,
    coachingSalary: b.coachingSalary,
    operatingBudget: b.operatingBudget,
    capSpace: b.nilBudget - b.nilSpent,
    spendingTier: b.spendingTier,
    tvRevenue: b.tvRevenue,
    ticketRevenue: b.ticketRevenue,
    donorRevenue: b.donorRevenue,
    merchandiseRev: b.merchandiseRev,
    conferenceShare: b.conferenceShare,
    rosterSize: b.rosterSize,
    capRank: i + 1,
    source: 'seed-data',
  }));

  // Sort by totalRevenue descending for leaderboard
  budgets.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Assign capRank after sorting
  budgets = budgets.map((b, i) => ({ ...b, capRank: i + 1 }));

  if (filters?.spendingTier) budgets = budgets.filter(b => b.spendingTier === filters.spendingTier);

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;
  return budgets.slice(offset, offset + limit);
}

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
      if (budget) return NextResponse.json(budget);

      // Try seed data lookup by abbreviation
      const seedBudget = SEED_SCHOOL_BUDGETS.find(b => b.teamAbbrev.toLowerCase() === teamId.toLowerCase());
      if (seedBudget) {
        return NextResponse.json(getSeedBudgetLeaderboard().find(b => b.team.abbreviation === seedBudget.teamAbbrev) || { error: 'Not found' });
      }
      return NextResponse.json({ error: 'Budget not found for team' }, { status: 404 });
    }

    // Leaderboard view
    if (view === 'leaderboard') {
      const leaderboard = await getBudgetLeaderboard(season);
      if (!leaderboard || leaderboard.length === 0) {
        return NextResponse.json(getSeedBudgetLeaderboard());
      }
      return NextResponse.json(leaderboard);
    }

    // Default filtered list
    const budgets = await getSchoolBudgets({
      season,
      spendingTier: spendingTier || undefined,
      limit,
      offset,
    });

    if (!budgets || budgets.length === 0) {
      return NextResponse.json(getSeedBudgetLeaderboard({ spendingTier: spendingTier || undefined, limit, offset }));
    }

    return NextResponse.json(budgets);
  } catch (err) {
    console.error('[RevenueBudget] DB query failed, using seed data:', err);
    return NextResponse.json(getSeedBudgetLeaderboard({ spendingTier: spendingTier || undefined, limit, offset }));
  }
}
