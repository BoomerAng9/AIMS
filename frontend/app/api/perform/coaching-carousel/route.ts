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
import { SEED_COACHING_CHANGES } from '@/lib/perform/seed-ncaa-data';

/** Build coaching carousel data from seed entries */
function getSeedCoachingChanges(filters?: {
  season?: number;
  changeType?: string;
  limit?: number;
  offset?: number;
}) {
  let entries = [...SEED_COACHING_CHANGES];

  if (filters?.season) entries = entries.filter(e => e.season === filters.season);
  if (filters?.changeType) entries = entries.filter(e => e.changeType === filters.changeType);

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;

  return entries.slice(offset, offset + limit).map(e => ({
    id: `seed-cc-${e.coachName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    coachName: e.coachName,
    previousRole: e.previousRole,
    newRole: e.newRole,
    previousTeam: e.previousTeamAbbrev ? { commonName: e.previousTeamAbbrev, abbreviation: e.previousTeamAbbrev } : null,
    newTeam: e.newTeamAbbrev ? { commonName: e.newTeamAbbrev, abbreviation: e.newTeamAbbrev } : null,
    changeType: e.changeType,
    season: e.season,
    effectiveDate: e.effectiveDate,
    contractYears: e.contractYears || null,
    contractValue: e.contractValue || null,
    buyout: e.buyout || null,
    record: e.record || null,
    notes: e.notes || null,
    verified: e.verified,
    source: 'seed-data',
  }));
}

function getSeedCarouselStats(season?: number) {
  const entries = season ? SEED_COACHING_CHANGES.filter(e => e.season === season) : SEED_COACHING_CHANGES;
  return {
    total: entries.length,
    hired: entries.filter(e => e.changeType === 'HIRED').length,
    fired: entries.filter(e => e.changeType === 'FIRED').length,
    resigned: entries.filter(e => e.changeType === 'RESIGNED').length,
    retired: entries.filter(e => e.changeType === 'RETIRED').length,
    interim: entries.filter(e => e.changeType === 'INTERIM').length,
    source: 'seed-data',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2026', 10);
  const changeType = searchParams.get('changeType');
  const teamId = searchParams.get('teamId');
  const stats = searchParams.get('stats') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Stats summary
    if (stats) {
      const statsData = await getCoachingCarouselStats(season);
      if (statsData.total === 0) {
        return NextResponse.json(getSeedCarouselStats(season));
      }
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

    // If DB returned empty, use seed data
    if (!changes || changes.length === 0) {
      return NextResponse.json(getSeedCoachingChanges({ season, changeType: changeType || undefined, limit, offset }));
    }

    return NextResponse.json(changes);
  } catch (err) {
    console.error('[CoachingCarousel] DB query failed, using seed data:', err);
    if (stats) {
      return NextResponse.json(getSeedCarouselStats(season));
    }
    return NextResponse.json(getSeedCoachingChanges({ season, changeType: changeType || undefined, limit, offset }));
  }
}
