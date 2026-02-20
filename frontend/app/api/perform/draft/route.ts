/**
 * Per|Form NFL Draft API
 *
 * GET /api/perform/draft — Get draft prospects (Big Board)
 * GET /api/perform/draft?tier=FIRST_ROUND — Filter by tier
 * GET /api/perform/draft?position=QB — Filter by position
 * GET /api/perform/draft?mock=latest — Get latest mock draft with picks
 * POST /api/perform/draft — Seed/upsert a draft prospect
 * POST /api/perform/draft?action=seed-teams — Seed NFL team needs
 * POST /api/perform/draft?action=seed-all — Full seed: prospects + teams + generate mock
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { seedNFLTeams, NFL_TEAMS } from '@/lib/perform/mock-draft-engine';
import { SEED_DRAFT_PROSPECTS, NFL_TEAM_NEEDS_2026 } from '@/lib/perform/seed-draft-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier');
  const position = searchParams.get('position');
  const college = searchParams.get('college');
  const mock = searchParams.get('mock');
  const limit = parseInt(searchParams.get('limit') || '300', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Return a mock draft
    if (mock) {
      const mockDraft = mock === 'latest'
        ? await prisma.mockDraft.findFirst({
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          include: {
            picks: {
              orderBy: { overall: 'asc' },
              include: { prospect: true, nflTeam: true },
            },
          },
        })
        : await prisma.mockDraft.findUnique({
          where: { id: mock },
          include: {
            picks: {
              orderBy: { overall: 'asc' },
              include: { prospect: true, nflTeam: true },
            },
          },
        });

      if (!mockDraft) {
        return NextResponse.json({ error: 'Mock draft not found' }, { status: 404 });
      }

      return NextResponse.json(mockDraft);
    }

    // Return draft prospects (Big Board)
    const where: any = {};
    if (tier) where.tier = tier;
    if (position) where.position = position;
    if (college) where.college = college;

    const [prospects, total] = await Promise.all([
      prisma.draftProspect.findMany({
        where,
        orderBy: { overallRank: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.draftProspect.count({ where }),
    ]);

    // Hydrate JSON fields
    const hydrated = prospects.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      comparisons: p.comparisons ? JSON.parse(p.comparisons) : [],
      collegeStats: p.collegeStats ? JSON.parse(p.collegeStats) : {},
      sourceUrls: p.sourceUrls ? JSON.parse(p.sourceUrls) : [],
    }));

    return NextResponse.json({ prospects: hydrated, total, limit, offset });
  } catch (err: any) {
    console.error('[Draft] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    // Full seed
    if (action === 'seed-all') {
      // 1. Seed NFL teams
      const teamCount = await seedNFLTeams(NFL_TEAM_NEEDS_2026);

      // 2. Seed draft prospects
      let prospectCount = 0;
      for (const p of SEED_DRAFT_PROSPECTS) {
        const slug = `${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        await prisma.draftProspect.upsert({
          where: { slug },
          create: { slug, ...p },
          update: { ...p },
        });
        prospectCount++;
      }

      return NextResponse.json({
        ok: true,
        seeded: { teams: teamCount, prospects: prospectCount },
      });
    }

    // Seed teams only
    if (action === 'seed-teams') {
      const count = await seedNFLTeams(NFL_TEAM_NEEDS_2026);
      return NextResponse.json({ ok: true, teams: count });
    }

    // Single prospect upsert
    const body = await req.json();
    const slug = `${body.firstName}-${body.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const prospect = await prisma.draftProspect.upsert({
      where: { slug },
      create: { slug, ...body },
      update: { ...body },
    });
    return NextResponse.json({ ok: true, prospect });
  } catch (err: any) {
    console.error('[Draft] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
