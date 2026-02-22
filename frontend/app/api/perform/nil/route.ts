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
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNilDeals,
  getNilTeamRankings,
  getNilPlayerRankings,
  getNilStats,
} from '@/lib/perform/ncaa-data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2025', 10);
  const teamId = searchParams.get('teamId');
  const dealType = searchParams.get('dealType');
  const view = searchParams.get('view') || 'team-rankings';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    if (view === 'stats') {
      const statsData = await getNilStats(season);
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
      return NextResponse.json(deals);
    }

    if (view === 'player-rankings') {
      const rankings = await getNilPlayerRankings({
        season,
        teamId: teamId || undefined,
        limit,
      });
      return NextResponse.json(rankings);
    }

    // Default: team-rankings
    const rankings = await getNilTeamRankings(season);
    return NextResponse.json(rankings);
  } catch (err) {
    console.error('[NIL] DB query failed:', err);
    return NextResponse.json(
      { error: 'Database unavailable', deals: [] },
      { status: 503 }
    );
  }
}
