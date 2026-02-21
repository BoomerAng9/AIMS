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

    return NextResponse.json(entries);
  } catch (err) {
    console.error('[TransferPortal] DB query failed:', err);

    // Return empty results on error
    if (stats) {
      return NextResponse.json({ total: 0, inPortal: 0, committed: 0, withdrawn: 0, signed: 0 });
    }
    return NextResponse.json([]);
  }
}
