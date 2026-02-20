/**
 * Per|Form NIL Tracker API
 *
 * GET /api/perform/nil — NIL team rankings (default view)
 * GET /api/perform/nil?view=deals — NIL deals list
 * GET /api/perform/nil?view=team-rankings — NIL team rankings
 * GET /api/perform/nil?view=player-rankings — NIL player rankings
 * GET /api/perform/nil?view=stats — NIL stats summary
 * GET /api/perform/nil?season=2025 — Filter by season (default 2025)
 * GET /api/perform/nil?teamId=<uuid> — Filter by team ID
 * GET /api/perform/nil?dealType=ENDORSEMENT — Filter deals by type
 *
 * Data source priority:
 *   1. Database (Prisma) — primary
 *   2. Curated seed data — fallback when DB is empty or unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNilDeals,
  getNilTeamRankings,
  getNilPlayerRankings,
  getNilStats,
} from '@/lib/perform/ncaa-data-service';
import prisma from '@/lib/db/prisma';
import { SEED_NIL_DEALS, SEED_NIL_TEAM_RANKINGS } from '@/lib/perform/seed-ncaa-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2025', 10);
  const teamId = searchParams.get('teamId');
  const dealType = searchParams.get('dealType');
  const view = searchParams.get('view') || 'team-rankings';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // ── Try database first ────────────────────────────────────
  try {
    // Check which table to query based on view
    if (view === 'stats') {
      const dealCount = await prisma.nilDeal.count();
      if (dealCount > 0) {
        const statsData = await getNilStats(season);
        return NextResponse.json(statsData);
      }
    } else if (view === 'deals') {
      const dealCount = await prisma.nilDeal.count();
      if (dealCount > 0) {
        const deals = await getNilDeals({
          season,
          teamId: teamId || undefined,
          dealType: dealType || undefined,
          limit,
          offset,
        });
        return NextResponse.json(deals);
      }
    } else if (view === 'player-rankings') {
      const rankingCount = await prisma.nilPlayerRanking.count();
      if (rankingCount > 0) {
        const rankings = await getNilPlayerRankings({
          season,
          teamId: teamId || undefined,
          limit,
        });
        return NextResponse.json(rankings);
      }
    } else {
      // Default: team-rankings
      const rankingCount = await prisma.nilTeamRanking.count();
      if (rankingCount > 0) {
        const rankings = await getNilTeamRankings(season);
        return NextResponse.json(rankings);
      }
    }
  } catch (err) {
    console.warn('[NIL] DB query failed, falling back to seed data:', err);
  }

  // ── Serve curated seed data ───────────────────────────────

  if (view === 'stats') {
    // Compute stats from seed deals
    let seedDeals = SEED_NIL_DEALS.filter(d => d.season === season);
    if (teamId) seedDeals = seedDeals.filter(d => d.teamAbbrev === teamId);
    const totalValue = seedDeals.reduce((sum, d) => sum + d.estimatedValue, 0);
    const avgDealValue = seedDeals.length > 0 ? totalValue / seedDeals.length : 0;
    const activeDealCount = seedDeals.filter(d => d.status === 'ACTIVE').length;
    return NextResponse.json({
      totalDeals: seedDeals.length,
      totalValue,
      avgDealValue,
      activeDealCount,
    });
  }

  if (view === 'deals') {
    let seedDeals = SEED_NIL_DEALS.map((d, index) => ({
      id: `seed-nil-${index}`,
      ...d,
    }));

    // Apply filters in-memory
    seedDeals = seedDeals.filter(d => d.season === season);
    if (teamId) seedDeals = seedDeals.filter(d => d.teamAbbrev === teamId);
    if (dealType) seedDeals = seedDeals.filter(d => d.dealType === dealType);

    // Sort by estimatedValue descending
    const sorted = seedDeals.sort((a, b) => b.estimatedValue - a.estimatedValue);
    return NextResponse.json(sorted.slice(offset, offset + limit));
  }

  if (view === 'player-rankings') {
    // No seed data for player rankings, return empty array
    return NextResponse.json([]);
  }

  // Default: team-rankings
  let seedRankings = SEED_NIL_TEAM_RANKINGS.map((r, index) => ({
    id: `seed-nilr-${index}`,
    ...r,
  }));

  if (teamId) seedRankings = seedRankings.filter(r => r.teamAbbrev === teamId);

  // Already sorted by rank in seed data
  return NextResponse.json(seedRankings);
}
