/**
 * Arena Leaderboard API
 *
 * GET /api/arena/leaderboard — Global leaderboard
 * Query: ?period=ALL_TIME|WEEKLY|MONTHLY&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEED_LEADERBOARD, SEED_PLAYERS } from '@/lib/arena/seed-contests';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'ALL_TIME';
  const limit = parseInt(searchParams.get('limit') || '25', 10);

  // Enrich leaderboard with player data
  const leaderboard = SEED_LEADERBOARD
    .filter(entry => entry.period === period)
    .slice(0, limit)
    .map(entry => ({
      ...entry,
      player: SEED_PLAYERS.find(p => p.id === entry.playerId) || null,
    }));

  return NextResponse.json({
    period,
    entries: leaderboard,
    totalPlayers: SEED_PLAYERS.length,
    updatedAt: new Date().toISOString(),
  });
}
