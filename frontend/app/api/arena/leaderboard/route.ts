/**
 * Arena Leaderboard API
 *
 * GET /api/arena/leaderboard — Global leaderboard
 * Query: ?period=ALL_TIME|WEEKLY|MONTHLY&limit=10
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'ALL_TIME';
  const limit = parseInt(searchParams.get('limit') || '25', 10);

  try {
    // Determine periodKey based on period type
    const now = new Date();
    let periodKey: string;

    switch (period) {
      case 'WEEKLY': {
        const weekNum = Math.ceil(
          ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
        );
        periodKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        break;
      }
      case 'MONTHLY':
        periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        periodKey = 'all';
    }

    const entries = await prisma.arenaLeaderboard.findMany({
      where: {
        period,
        periodKey,
      },
      orderBy: { rank: 'asc' },
      take: Math.min(limit, 100),
      include: {
        player: {
          select: {
            displayName: true,
            avatarUrl: true,
            tier: true,
            level: true,
          },
        },
      },
    });

    const totalPlayers = await prisma.arenaPlayer.count();

    return NextResponse.json({
      period,
      periodKey,
      entries: entries.map((e) => ({
        rank: e.rank,
        score: e.score,
        wins: e.wins,
        entries: e.entries,
        earnings: e.earnings,
        accuracy: e.accuracy,
        player: {
          id: e.playerId,
          displayName: e.player.displayName,
          avatarUrl: e.player.avatarUrl,
          tier: e.player.tier,
          level: e.player.level,
        },
      })),
      totalPlayers,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Arena Leaderboard] Error:', err.message);
    // Graceful fallback
    return NextResponse.json({
      period,
      entries: [],
      totalPlayers: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}
