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
 * Data source priority:
 *   1. Database (Prisma) — primary
 *   2. Curated seed data — fallback when DB is empty or unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoachingChanges, getCoachingCarouselStats } from '@/lib/perform/ncaa-data-service';
import prisma from '@/lib/db/prisma';
import { SEED_COACHING_CHANGES } from '@/lib/perform/seed-ncaa-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2025', 10);
  const changeType = searchParams.get('changeType');
  const teamId = searchParams.get('teamId');
  const stats = searchParams.get('stats') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // ── Try database first ────────────────────────────────────
  try {
    const dbCount = await prisma.coachingChange.count();

    if (dbCount > 0) {
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
    }
  } catch (err) {
    console.warn('[CoachingCarousel] DB query failed, falling back to seed data:', err);
  }

  // ── Serve curated seed data ───────────────────────────────
  let seedData = SEED_COACHING_CHANGES.map((c, index) => ({
    id: `seed-cc-${index}`,
    ...c,
  }));

  // Apply filters in-memory
  if (season) seedData = seedData.filter(c => c.season === season);
  if (changeType) seedData = seedData.filter(c => c.changeType === changeType);
  if (teamId) {
    seedData = seedData.filter(c =>
      c.previousTeamAbbrev === teamId || c.newTeamAbbrev === teamId
    );
  }

  // Stats summary from seed data
  if (stats) {
    const total = seedData.length;
    const hired = seedData.filter(c => (c.changeType as string) === 'HIRED').length;
    const fired = seedData.filter(c => (c.changeType as string) === 'FIRED').length;
    const resigned = seedData.filter(c => (c.changeType as string) === 'RESIGNED').length;
    const retired = seedData.filter(c => (c.changeType as string) === 'RETIRED').length;
    const interim = seedData.filter(c => (c.changeType as string) === 'INTERIM').length;
    return NextResponse.json({ total, hired, fired, resigned, retired, interim });
  }

  // Sort by effectiveDate descending
  const sorted = seedData.sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );

  return NextResponse.json(sorted.slice(offset, offset + limit));
}
