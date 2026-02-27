/**
 * Per|Form NIL Tracker API
 *
 * GET /api/perform/nil — NIL team rankings (default view)
 * GET /api/perform/nil?view=deals — NIL deals list
 * GET /api/perform/nil?view=team-rankings — NIL team rankings
 * GET /api/perform/nil?view=player-rankings — NIL player rankings
 * GET /api/perform/nil?view=stats — NIL stats summary
 * GET /api/perform/coaching-carousel?season=2026 — Filter by season (default 2026)
 * GET /api/perform/nil?teamId=<uuid> — Filter by team ID
 * GET /api/perform/nil?dealType=ENDORSEMENT — Filter deals by type
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNilDeals,
  getNilTeamRankings,
  getNilPlayerRankings,
  getNilStats,
} from '@/lib/perform/ncaa-data-service';
import {
  SEED_NIL_DEALS,
  SEED_NIL_TEAM_RANKINGS,
} from '@/lib/perform/seed-ncaa-data';

/** Build NIL team rankings from seed data */
function getSeedTeamRankings() {
  return SEED_NIL_TEAM_RANKINGS.map(r => ({
    id: `seed-nil-rank-${r.teamAbbrev}`.toLowerCase(),
    team: { commonName: r.teamAbbrev, abbreviation: r.teamAbbrev },
    teamId: null,
    season: 2025,
    rank: r.rank,
    totalNilValue: r.totalNilValue,
    avgPerPlayer: r.avgPerPlayer,
    topDealValue: r.topDealValue,
    dealCount: r.dealCount,
    collectiveCount: r.collectiveCount,
    trend: r.trend,
    previousRank: r.previousRank,
    source: 'seed-data',
  }));
}

/** Build NIL deals from seed data */
function getSeedDeals(filters?: { dealType?: string; limit?: number; offset?: number }) {
  let deals = [...SEED_NIL_DEALS];

  if (filters?.dealType) deals = deals.filter(d => d.dealType === filters.dealType);

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;

  return deals.slice(offset, offset + limit).map(d => ({
    id: `seed-nil-deal-${d.playerName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    playerName: d.playerName,
    team: { commonName: d.teamAbbrev, abbreviation: d.teamAbbrev },
    position: d.position,
    dealType: d.dealType,
    brandOrCollective: d.brandOrCollective,
    estimatedValue: d.estimatedValue,
    duration: d.duration,
    status: d.status,
    announcedDate: d.announcedDate,
    season: d.season,
    source: 'seed-data',
  }));
}

/** Build NIL stats from seed data */
function getSeedNilStats() {
  const totalValue = SEED_NIL_DEALS.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
  return {
    totalDeals: SEED_NIL_DEALS.length,
    totalValue,
    avgDealValue: SEED_NIL_DEALS.length > 0 ? totalValue / SEED_NIL_DEALS.length : 0,
    activeDealCount: SEED_NIL_DEALS.filter(d => d.status === 'ACTIVE').length,
    source: 'seed-data',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2026', 10);
  const teamId = searchParams.get('teamId');
  const dealType = searchParams.get('dealType');
  const view = searchParams.get('view') || 'team-rankings';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    if (view === 'stats') {
      const statsData = await getNilStats(season);
      if (statsData.totalDeals === 0) {
        return NextResponse.json(getSeedNilStats());
      }
      return NextResponse.json(statsData);
    }

    if (view === 'deals') {
      const deals = await getNilDeals({
        season,
        teamId: teamId || undefined,
        dealType: dealType || undefined,
        limit,
        offset,
      });
      if (!deals || deals.length === 0) {
        return NextResponse.json(getSeedDeals({ dealType: dealType || undefined, limit, offset }));
      }
      return NextResponse.json(deals);
    }

    if (view === 'player-rankings') {
      const rankings = await getNilPlayerRankings({
        season,
        teamId: teamId || undefined,
        limit,
      });
      // No seed player rankings available — return what DB has or empty
      return NextResponse.json(rankings);
    }

    // Default: team-rankings
    const rankings = await getNilTeamRankings(season);
    if (!rankings || rankings.length === 0) {
      return NextResponse.json(getSeedTeamRankings());
    }
    return NextResponse.json(rankings);
  } catch (err) {
    console.error('[NIL] DB query failed, using seed data:', err);
    // Return seed data based on the requested view
    if (view === 'stats') return NextResponse.json(getSeedNilStats());
    if (view === 'deals') return NextResponse.json(getSeedDeals({ dealType: dealType || undefined, limit, offset }));
    return NextResponse.json(getSeedTeamRankings());
  }
}
