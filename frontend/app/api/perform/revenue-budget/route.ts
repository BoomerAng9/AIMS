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
 * Data source priority:
 *   1. Database (Prisma) — primary
 *   2. Curated seed data — fallback when DB is empty or unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSchoolBudgets,
  getSchoolBudgetByTeam,
  getBudgetLeaderboard,
} from '@/lib/perform/ncaa-data-service';
import prisma from '@/lib/db/prisma';
import { SEED_SCHOOL_BUDGETS } from '@/lib/perform/seed-ncaa-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2025', 10);
  const teamId = searchParams.get('teamId');
  const spendingTier = searchParams.get('spendingTier');
  const view = searchParams.get('view') || 'leaderboard';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // ── Detail view requires teamId ───────────────────────────
  if (view === 'detail' && !teamId) {
    return NextResponse.json(
      { error: 'teamId is required for detail view' },
      { status: 400 }
    );
  }

  // ── Try database first ────────────────────────────────────
  try {
    const dbCount = await prisma.schoolRevenueBudget.count();

    if (dbCount > 0) {
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
    }
  } catch (err) {
    console.warn('[RevenueBudget] DB query failed, falling back to seed data:', err);
  }

  // ── Serve curated seed data ───────────────────────────────
  let seedData = SEED_SCHOOL_BUDGETS.map((b, index) => ({
    id: `seed-rb-${index}`,
    season: 2025,
    capSpace: b.totalRevenue - b.nilSpent - b.coachingSalary - b.operatingBudget,
    ...b,
  }));

  // Detail view from seed
  if (view === 'detail' && teamId) {
    const budget = seedData.find(b => b.teamAbbrev === teamId);
    return budget
      ? NextResponse.json(budget)
      : NextResponse.json({ error: 'Budget not found for team' }, { status: 404 });
  }

  // Apply filters in-memory
  if (spendingTier) seedData = seedData.filter(b => b.spendingTier === spendingTier);

  // Sort by totalRevenue descending (leaderboard style)
  const sorted = seedData.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return NextResponse.json(sorted.slice(offset, offset + limit));
}
