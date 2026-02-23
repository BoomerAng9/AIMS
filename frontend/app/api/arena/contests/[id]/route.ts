/**
 * Arena Single Contest API
 *
 * GET /api/arena/contests/[id] — Get contest details
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Try by id first, then by slug
    const contest = await prisma.arenaContest.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        entries: {
          orderBy: { score: 'desc' },
          take: 50,
          include: {
            player: {
              select: {
                displayName: true,
                avatarUrl: true,
                tier: true,
              },
            },
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: contest.id,
      slug: contest.slug,
      title: contest.title,
      description: contest.description,
      type: contest.type,
      category: contest.category,
      status: contest.status,
      entryFee: contest.entryFee,
      prizePool: contest.prizePool,
      rakePercent: contest.rakePercent,
      maxEntries: contest.maxEntries,
      minEntries: contest.minEntries,
      currentEntries: contest.currentEntries,
      startsAt: contest.startsAt.toISOString(),
      endsAt: contest.endsAt.toISOString(),
      scoredAt: contest.scoredAt?.toISOString() || null,
      contestData: JSON.parse(contest.contestData || '{}'),
      prizeStructure: JSON.parse(contest.prizeStructure || '{}'),
      difficulty: contest.difficulty,
      featured: contest.featured,
      generatedBy: contest.generatedBy,
      entries: contest.entries.map((e) => ({
        id: e.id,
        player: {
          id: e.playerId,
          displayName: e.player.displayName,
          avatarUrl: e.player.avatarUrl,
          tier: e.player.tier,
        },
        score: e.score,
        rank: e.rank,
        correctCount: e.correctCount,
        totalQuestions: e.totalQuestions,
        payout: e.payout,
        isSubmitted: e.isSubmitted,
      })),
    });
  } catch (err: any) {
    console.error('[Arena Contest Detail] Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch contest' }, { status: 500 });
  }
}
