/**
 * Per|Form Prospects API
 *
 * GET /api/perform/prospects — Returns all prospects (from DB, falls back to Scout Hub)
 * GET /api/perform/prospects?id=<uuid> — Returns single prospect by ID
 * GET /api/perform/prospects?slug=cameron-price — Returns single prospect by slug
 * GET /api/perform/prospects?position=QB — Filter by position
 * GET /api/perform/prospects?tier=ELITE — Filter by tier
 * GET /api/perform/prospects?state=TX — Filter by state
 * GET /api/perform/prospects?classYear='26 — Filter by class year
 * GET /api/perform/prospects?pool=HIGH_SCHOOL — Filter by pool
 *
 * Data source priority:
 *   1. Database (Prisma) — primary, populated by /api/perform/ingest
 *   2. Scout Hub (port 5001) — live scouting service
 *
 * PROPRIETARY BOUNDARY:
 * Response includes P.A.I. scores and tiers but NEVER formula weights,
 * GROC internals, or Luke adjustment values.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProspects, getProspectBySlug, getProspectById } from '@/lib/perform/data-service';
import prisma from '@/lib/db/prisma';
import { SEED_PROSPECTS, type SeedProspect } from '@/lib/perform/seed-prospects';

const SCOUT_HUB_URL = process.env.SCOUT_HUB_URL || 'http://localhost:5001';

/** Deserialize JSON fields from DB records */
function hydrateProspect(p: any) {
  return {
    ...p,
    name: `${p.firstName} ${p.lastName}`,
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []),
    comparisons: typeof p.comparisons === 'string' ? JSON.parse(p.comparisons) : (p.comparisons || []),
    stats: typeof p.stats === 'string' ? JSON.parse(p.stats) : (p.stats || {}),
    sourceUrls: typeof p.sourceUrls === 'string' ? JSON.parse(p.sourceUrls) : (p.sourceUrls || []),
  };
}

/** Convert seed prospect to API-ready format */
function seedToProspect(p: SeedProspect, idx: number) {
  return {
    id: `seed-${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    slug: `${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    name: `${p.firstName} ${p.lastName}`,
    firstName: p.firstName,
    lastName: p.lastName,
    position: p.position,
    classYear: p.classYear,
    school: p.school,
    state: p.state,
    pool: p.pool,
    height: p.height || '',
    weight: p.weight || 0,
    gpa: p.gpa,
    paiScore: p.paiScore,
    tier: p.tier,
    performance: p.performance,
    athleticism: p.athleticism,
    intangibles: p.intangibles,
    nationalRank: p.nationalRank,
    stateRank: p.stateRank,
    positionRank: p.positionRank,
    trend: p.trend,
    previousRank: p.previousRank,
    nilEstimate: p.nilEstimate,
    scoutMemo: p.scoutMemo,
    tags: p.tags,
    comparisons: p.comparisons,
    stats: p.stats,
    bullCase: p.bullCase,
    bearCase: p.bearCase,
    mediationVerdict: p.mediationVerdict,
    debateWinner: p.debateWinner,
    stars: p.stars,
    sourceUrls: [],
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');
  const position = searchParams.get('position');
  const tier = searchParams.get('tier');
  const state = searchParams.get('state');
  const classYear = searchParams.get('classYear');
  const pool = searchParams.get('pool');
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // ── Try database first ────────────────────────────────────
  try {
    const dbCount = await prisma.performProspect.count();

    if (dbCount > 0) {
      // Single prospect by ID
      if (id) {
        const prospect = await getProspectById(id);
        return prospect
          ? NextResponse.json(hydrateProspect(prospect))
          : NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
      }

      // Single prospect by slug
      if (slug) {
        const prospect = await getProspectBySlug(slug);
        return prospect
          ? NextResponse.json(hydrateProspect(prospect))
          : NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
      }

      // Filtered list
      const prospects = await getProspects({
        position: position || undefined,
        tier: tier || undefined,
        state: state || undefined,
        classYear: classYear || undefined,
        pool: pool || undefined,
        limit,
        offset,
      });

      return NextResponse.json(prospects.map(hydrateProspect));
    }
  } catch (err) {
    console.warn('[Prospects] DB query failed, trying Scout Hub:', err);
  }

  // ── Try live Scout Hub ────────────────────────────────────
  try {
    const res = await fetch(`${SCOUT_HUB_URL}/prospects`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      if (id) {
        const prospect = data.find((p: any) => p.id === id);
        return prospect
          ? NextResponse.json(prospect)
          : NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
      }
      if (slug) {
        const prospect = data.find((p: any) =>
          `${p.firstName}-${p.lastName}`.toLowerCase() === slug
        );
        return prospect
          ? NextResponse.json(prospect)
          : NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
      }
      return NextResponse.json(data);
    }
  } catch {
    // Scout Hub offline — fall through to seed data
  }

  // ── Fallback to seed data ─────────────────────────────────
  let seedData = SEED_PROSPECTS.map(seedToProspect);

  // Apply filters
  if (position) seedData = seedData.filter(p => p.position.toUpperCase() === position.toUpperCase());
  if (tier) seedData = seedData.filter(p => p.tier === tier);
  if (state) seedData = seedData.filter(p => p.state.toUpperCase() === state.toUpperCase());
  if (classYear) seedData = seedData.filter(p => p.classYear === classYear);
  if (pool) seedData = seedData.filter(p => p.pool === pool);

  if (slug) {
    const prospect = seedData.find(p => p.slug === slug);
    return prospect
      ? NextResponse.json(prospect)
      : NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }

  if (id) {
    const prospect = seedData.find(p => p.id === id);
    return prospect
      ? NextResponse.json(prospect)
      : NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }

  // Paginate
  const paginated = seedData.slice(offset, offset + limit);
  return NextResponse.json(paginated);
}
