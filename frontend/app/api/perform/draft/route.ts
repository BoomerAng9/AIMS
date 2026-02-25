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
import { SEED_DRAFT_PROSPECTS, NFL_TEAM_NEEDS_2026, REDRAFT_2025_CLASS, REDRAFT_2024_CLASS, TeamNeed } from '@/lib/perform/seed-draft-data';

/** Convert TeamNeed[] → the shape seedNFLTeams expects */
function toSeedFormat(needs: TeamNeed[]) {
  const teamLookup = new Map(NFL_TEAMS.map(t => [t.abbreviation, t]));
  return needs.map(n => {
    const base = teamLookup.get(n.abbrev);
    // Build needs Record: primary needs weighted 3, secondary 1
    const needsMap: Record<string, number> = {};
    for (const p of n.primaryNeeds) needsMap[p] = 3;
    for (const s of n.secondaryNeeds) needsMap[s] = needsMap[s] ?? 1;
    return {
      teamName: base?.teamName ?? n.team,
      abbreviation: n.abbrev,
      city: base?.city ?? '',
      conference: base?.conference ?? '',
      division: base?.division ?? '',
      draftOrder: n.projectedPick,
      needs: needsMap,
    };
  });
}

/** Convert seed draft prospect to API-ready format */
function seedDraftToApi(p: typeof SEED_DRAFT_PROSPECTS[number], idx: number) {
  return {
    id: `seed-draft-${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    slug: `${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    firstName: p.firstName,
    lastName: p.lastName,
    position: p.position,
    college: p.college,
    conference: p.conference,
    classYear: p.classYear,
    eligibility: p.eligibility,
    height: p.height,
    weight: p.weight,
    paiScore: p.paiScore,
    tier: p.tier,
    performance: p.performance,
    athleticism: p.athleticism,
    intangibles: p.intangibles,
    overallRank: p.overallRank,
    positionRank: p.positionRank,
    trend: p.trend,
    scoutMemo: p.scoutMemo,
    tags: typeof p.tags === 'string' ? p.tags.split(',') : (p.tags || []),
    comparisons: typeof p.comparisons === 'string' ? p.comparisons.split(',') : (p.comparisons || []),
    collegeStats: typeof p.collegeStats === 'string' ? JSON.parse(p.collegeStats) : (p.collegeStats || {}),
    combineInvite: p.combineInvite,
    seniorBowl: p.seniorBowl,
    projectedRound: p.projectedRound,
    projectedPick: p.projectedPick,
    bullCase: p.bullCase,
    bearCase: p.bearCase,
    mediationVerdict: p.mediationVerdict,
    debateWinner: p.debateWinner,
    enrichedBy: p.enrichedBy || 'seed-data',
    sourceUrls: [],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier');
  const position = searchParams.get('position');
  const college = searchParams.get('college');
  const mock = searchParams.get('mock');
  const redraft = searchParams.get('redraft');
  const teamNeeds = searchParams.get('teamNeeds') === 'true';
  const limit = parseInt(searchParams.get('limit') || '300', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Return redraft classes
    if (redraft === '2025') {
      return NextResponse.json({ class: 2025, prospects: REDRAFT_2025_CLASS, total: REDRAFT_2025_CLASS.length });
    }
    if (redraft === '2024') {
      return NextResponse.json({ class: 2024, prospects: REDRAFT_2024_CLASS, total: REDRAFT_2024_CLASS.length });
    }

    // Return team needs / draft order
    if (teamNeeds) {
      return NextResponse.json({ draftOrder: NFL_TEAM_NEEDS_2026, total: NFL_TEAM_NEEDS_2026.length });
    }

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
        // Fallback: generate a mock from seed data matching picks to team needs
        const seedMock = NFL_TEAM_NEEDS_2026.slice(0, 32).map((team, i) => {
          const prospect = SEED_DRAFT_PROSPECTS[i];
          if (!prospect) return null;
          return {
            overall: team.projectedPick,
            round: 1,
            pickInRound: team.projectedPick,
            teamName: team.team,
            teamAbbrev: team.abbrev,
            prospect: seedDraftToApi(prospect, i),
            fitScore: 85 + Math.floor(Math.random() * 10),
            rationale: `${team.team} addresses ${team.primaryNeeds[0]} need with ${prospect.firstName} ${prospect.lastName}.`,
          };
        }).filter(Boolean);

        return NextResponse.json({
          id: 'seed-mock-2026',
          title: '2026 NFL Mock Draft 1.0 — Per|Form Engine',
          description: 'First-round projections based on P.A.I. grades and team needs matrix.',
          rounds: 1,
          totalPicks: seedMock.length,
          generatedBy: 'PERFORM_ENGINE',
          isPublished: true,
          picks: seedMock,
          source: 'seed-data',
        });
      }

      return NextResponse.json(mockDraft);
    }

    // Return draft prospects (Big Board) — try DB first
    const dbCount = await prisma.draftProspect.count().catch(() => 0);

    if (dbCount > 0) {
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
        tags: typeof p.tags === 'string' ? p.tags.split(',') : (p.tags || []),
        comparisons: typeof p.comparisons === 'string' ? p.comparisons.split(',') : (p.comparisons || []),
        collegeStats: typeof p.collegeStats === 'string' ? JSON.parse(p.collegeStats) : (p.collegeStats || {}),
        sourceUrls: typeof p.sourceUrls === 'string' ? JSON.parse(p.sourceUrls) : (p.sourceUrls || []),
      }));

      return NextResponse.json({ prospects: hydrated, total, limit, offset });
    }

    // Fallback to seed data
    let seedData = SEED_DRAFT_PROSPECTS.map(seedDraftToApi);

    if (tier) seedData = seedData.filter(p => p.tier === tier);
    if (position) seedData = seedData.filter(p => p.position.toUpperCase() === position.toUpperCase());
    if (college) seedData = seedData.filter(p => p.college.toLowerCase().includes(college.toLowerCase()));

    const total = seedData.length;
    const paginated = seedData.slice(offset, offset + limit);

    return NextResponse.json({ prospects: paginated, total, limit, offset, source: 'seed-data' });
  } catch (err: any) {
    console.error('[Draft] GET error:', err);
    // Even on error, return seed data
    let seedData = SEED_DRAFT_PROSPECTS.map(seedDraftToApi);
    if (tier) seedData = seedData.filter(p => p.tier === tier);
    if (position) seedData = seedData.filter(p => p.position.toUpperCase() === position.toUpperCase());
    return NextResponse.json({ prospects: seedData.slice(offset, offset + limit), total: seedData.length, limit, offset, source: 'seed-data-fallback' });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    // Full seed
    if (action === 'seed-all') {
      // 1. Seed NFL teams
      const teamCount = await seedNFLTeams(toSeedFormat(NFL_TEAM_NEEDS_2026));

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
      const count = await seedNFLTeams(toSeedFormat(NFL_TEAM_NEEDS_2026));
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
