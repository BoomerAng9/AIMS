/**
 * Per|Form Draft Simulator API
 *
 * GET /api/perform/draft/simulate?id=<mockDraftId> — Get simulator state
 * POST /api/perform/draft/simulate — Create new simulator session
 * PUT /api/perform/draft/simulate — Make a pick
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSimulatorState, makeSimulatorPick } from '@/lib/perform/mock-draft-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
  }

  try {
    const state = await getSimulatorState(id);
    return NextResponse.json(state);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Create a new empty mock draft for the simulator
    const slug = `sim-${Date.now()}`;
    const mockDraft = await prisma.mockDraft.create({
      data: {
        slug,
        title: 'Draft Simulator Session',
        description: 'Interactive draft simulation',
        rounds: 7,
        totalPicks: 224, // 32 teams × 7 rounds (simplified)
        generatedBy: 'SIMULATOR',
        isPublished: false,
      },
    });

    // Get top available prospects
    const prospects = await prisma.draftProspect.findMany({
      orderBy: { overallRank: 'asc' },
      take: 20,
    });

    // Get NFL teams in draft order
    const teams = await prisma.nFLTeamNeeds.findMany({
      orderBy: { draftOrder: 'asc' },
    });

    return NextResponse.json({
      ok: true,
      simulatorId: mockDraft.id,
      nextPick: 1,
      round: 1,
      pickInRound: 1,
      onTheClock: teams[0] || null,
      topAvailable: prospects,
      teams,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { mockDraftId, prospectId, teamName, overall, round, pickInRound, rationale } = await req.json();

    if (!mockDraftId || !prospectId || !teamName || !overall || !round || !pickInRound) {
      return NextResponse.json(
        { error: 'Missing required fields: mockDraftId, prospectId, teamName, overall, round, pickInRound' },
        { status: 400 }
      );
    }

    const pick = await makeSimulatorPick(
      mockDraftId, prospectId, teamName, overall, round, pickInRound, rationale
    );

    // Get updated state
    const state = await getSimulatorState(mockDraftId);

    return NextResponse.json({ ok: true, pick, state });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
