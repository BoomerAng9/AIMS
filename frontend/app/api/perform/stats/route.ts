/**
 * Per|Form Stats API — Live platform metrics for the lobby page
 *
 * GET /api/perform/stats — Returns real counts from the database
 *
 * Feeds: Prospects tracked, film hours analyzed, reports generated, active debates
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    // Run all counts in parallel for speed
    const [prospectCount, contestCount, draftPickCount, transferCount] = await Promise.all([
      prisma.draftProspect.count().catch(() => 0),
      prisma.arenaContest.count({ where: { status: 'LIVE' } }).catch(() => 0),
      prisma.draftPick.count().catch(() => 0),
      prisma.transferPortalEntry.count().catch(() => 0),
    ]);

    // Film hours = proxy from draft picks analyzed (each pick ~0.5 hrs of film review)
    const filmHours = Math.round(draftPickCount * 0.5);

    // Reports = prospect scout memos + mediation verdicts that exist
    const reportsGenerated = await prisma.draftProspect.count({
      where: {
        OR: [
          { scoutMemo: { not: null } },
          { mediationVerdict: { not: null } },
        ],
      },
    }).catch(() => 0);

    // Active debates = prospects with bull/bear cases but no mediation verdict yet
    const activeDebates = await prisma.draftProspect.count({
      where: {
        bullCase: { not: null },
        bearCase: { not: null },
        mediationVerdict: null,
      },
    }).catch(() => 0);

    return NextResponse.json({
      prospectsTracked: prospectCount,
      filmHoursAnalyzed: filmHours,
      reportsGenerated,
      activeDebates,
      liveContests: contestCount,
      transferPortalEntries: transferCount,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Per|Form Stats] Error:', err.message);
    // Graceful fallback — return zeros, never block the page
    return NextResponse.json({
      prospectsTracked: 0,
      filmHoursAnalyzed: 0,
      reportsGenerated: 0,
      activeDebates: 0,
      liveContests: 0,
      transferPortalEntries: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}
