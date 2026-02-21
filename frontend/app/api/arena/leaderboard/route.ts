/**
 * Arena Leaderboard API
 *
 * GET /api/arena/leaderboard — Global leaderboard
 * Query: ?period=ALL_TIME|WEEKLY|MONTHLY&limit=10
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'ALL_TIME';
  const limit = parseInt(searchParams.get('limit') || '25', 10);

  // TODO: Query from Prisma when Arena DB schema is live
  // For now return empty leaderboard — no fabricated data
  return NextResponse.json({
    period,
    entries: [],
    totalPlayers: 0,
    updatedAt: new Date().toISOString(),
  });
}
