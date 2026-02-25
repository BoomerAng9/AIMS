/**
 * Per|Form Transfer Portal API
 *
 * GET /api/perform/transfer-portal — All transfer portal entries
 * GET /api/perform/transfer-portal?season=2026 — Filter by season (default 2026)
 * GET /api/perform/transfer-portal?status=IN_PORTAL — Filter by status
 * GET /api/perform/transfer-portal?position=QB — Filter by position
 * GET /api/perform/transfer-portal?transferWindow=SPRING — Filter by window
 * GET /api/perform/transfer-portal?teamId=<uuid> — Filter by team ID
 * GET /api/perform/transfer-portal?stats=true — Return stats summary
 * GET /api/perform/transfer-portal?limit=50&offset=0 — Pagination
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTransferPortalEntries, getTransferPortalStats } from '@/lib/perform/ncaa-data-service';
import { SEED_TRANSFER_PORTAL } from '@/lib/perform/seed-ncaa-data';

/** Build transfer portal data from seed entries */
function getSeedTransferPortal(filters?: {
  season?: number;
  status?: string;
  position?: string;
  transferWindow?: string;
  limit?: number;
  offset?: number;
}) {
  let entries = [...SEED_TRANSFER_PORTAL];

  if (filters?.season) entries = entries.filter(e => e.season === filters.season);
  if (filters?.status) entries = entries.filter(e => e.status === filters.status);
  if (filters?.position) entries = entries.filter(e => e.position.toUpperCase() === filters.position!.toUpperCase());
  if (filters?.transferWindow) entries = entries.filter(e => e.transferWindow === filters.transferWindow);

  // Sort by paiScore descending
  entries.sort((a, b) => (b.paiScore || 0) - (a.paiScore || 0));

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;

  return entries.slice(offset, offset + limit).map((e, i) => ({
    id: `seed-portal-${e.playerName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    playerName: e.playerName,
    position: e.position,
    eligibility: e.eligibility,
    previousTeam: { commonName: e.previousTeamAbbrev, abbreviation: e.previousTeamAbbrev },
    newTeam: e.newTeamAbbrev ? { commonName: e.newTeamAbbrev, abbreviation: e.newTeamAbbrev } : null,
    status: e.status,
    season: e.season,
    enteredDate: e.enteredDate,
    committedDate: e.committedDate || null,
    stars: e.stars,
    previousStats: e.previousStats,
    nilValuation: e.nilValuation,
    paiScore: e.paiScore,
    tier: e.tier,
    transferWindow: e.transferWindow,
    source: 'seed-data',
  }));
}

function getSeedPortalStats(season?: number) {
  const entries = season ? SEED_TRANSFER_PORTAL.filter(e => e.season === season) : SEED_TRANSFER_PORTAL;
  return {
    total: entries.length,
    inPortal: entries.filter(e => e.status === 'IN_PORTAL').length,
    committed: entries.filter(e => e.status === 'COMMITTED').length,
    withdrawn: entries.filter(e => e.status === 'WITHDRAWN').length,
    signed: entries.filter(e => e.status === 'SIGNED').length,
    source: 'seed-data',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = parseInt(searchParams.get('season') || '2026', 10);
  const status = searchParams.get('status');
  const position = searchParams.get('position');
  const transferWindow = searchParams.get('transferWindow');
  const teamId = searchParams.get('teamId');
  const stats = searchParams.get('stats') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Stats summary
    if (stats) {
      const statsData = await getTransferPortalStats(season);
      // If DB returned empty stats, use seed
      if (statsData.total === 0) {
        return NextResponse.json(getSeedPortalStats(season));
      }
      return NextResponse.json(statsData);
    }

    // Filtered list
    const entries = await getTransferPortalEntries({
      season,
      status: status || undefined,
      position: position || undefined,
      transferWindow: transferWindow || undefined,
      teamId: teamId || undefined,
      limit,
      offset,
    });

    // If DB returned empty, use seed data
    if (!entries || entries.length === 0) {
      return NextResponse.json(getSeedTransferPortal({ season, status: status || undefined, position: position || undefined, transferWindow: transferWindow || undefined, limit, offset }));
    }

    return NextResponse.json(entries);
  } catch (err) {
    console.error('[TransferPortal] DB query failed, using seed data:', err);
    // Fallback to seed data instead of error
    if (stats) {
      return NextResponse.json(getSeedPortalStats(season));
    }
    return NextResponse.json(getSeedTransferPortal({ season, status: status || undefined, position: position || undefined, transferWindow: transferWindow || undefined, limit, offset }));
  }
}
