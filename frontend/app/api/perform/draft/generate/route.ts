/**
 * Per|Form Mock Draft Generator API
 *
 * POST /api/perform/draft/generate — Generate a new mock draft
 *   Body: { rounds?: number, title?: string, description?: string }
 *
 * Uses the mock draft engine to auto-generate picks based on
 * P.A.I. grades, team needs, and positional value.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockDraft } from '@/lib/perform/mock-draft-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { rounds = 7, title, description } = body;

    // Get draft order from NFLTeamNeeds (sorted by draftOrder)
    const teams = await prisma.nFLTeamNeeds.findMany({
      orderBy: { draftOrder: 'asc' },
    });

    if (teams.length === 0) {
      return NextResponse.json(
        { error: 'No NFL teams seeded. POST /api/perform/draft?action=seed-all first.' },
        { status: 400 }
      );
    }

    const draftOrder = teams.map(t => t.abbreviation);

    const result = await generateMockDraft({
      draftOrder,
      rounds,
      title,
      description,
    });

    // Fetch the full mock draft with picks
    const mockDraft = await prisma.mockDraft.findUnique({
      where: { id: result.mockDraftId },
      include: {
        picks: {
          orderBy: { overall: 'asc' },
          include: { prospect: true, nflTeam: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mockDraft,
    });
  } catch (err: any) {
    console.error('[MockDraft] Generate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
