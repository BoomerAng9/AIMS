/**
 * Per|Form Coaching Carousel API
 *
 * GET /api/perform/coaching-carousel — All coaching changes
 * GET /api/perform/coaching-carousel?season=2025 — Filter by season (default 2025)
 * GET /api/perform/coaching-carousel?changeType=FIRED — Filter by change type
 * GET /api/perform/coaching-carousel?teamId=<uuid> — Filter by team ID
 * GET /api/perform/coaching-carousel?stats=true — Return stats summary
 * GET /api/perform/coaching-carousel?limit=50&offset=0 — Pagination
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoachingChanges, getCoachingCarouselStats } from '@/lib/perform/ncaa-data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2025', 10);
  const changeType = searchParams.get('changeType');
  const teamId = searchParams.get('teamId');
  const stats = searchParams.get('stats') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Stats summary
    if (stats) {
      const statsData = await getCoachingCarouselStats(season);
      return NextResponse.json(statsData);
    }

    // Filtered list
    const changes = await getCoachingChanges({
      season,
      changeType: changeType || undefined,
      teamId: teamId || undefined,
      limit,
      offset,
    });

    return NextResponse.json(changes);
  } catch (err) {
    console.error('[CoachingCarousel] DB query failed:', err);
    return NextResponse.json(
      { error: 'Database unavailable', changes: [] },
      { status: 503 }
    );
  }
}
