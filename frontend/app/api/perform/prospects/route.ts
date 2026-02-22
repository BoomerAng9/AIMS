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

const SCOUT_HUB_URL = process.env.SCOUT_HUB_URL || 'http://localhost:5001';

/** Deserialize JSON fields from DB records */
function hydrateProspect(p: any) {
  return {
    ...p,
    name: `${p.firstName} ${p.lastName}`,
    tags: p.tags ? JSON.parse(p.tags) : [],
    comparisons: p.comparisons ? JSON.parse(p.comparisons) : [],
    stats: p.stats ? JSON.parse(p.stats) : {},
    sourceUrls: p.sourceUrls ? JSON.parse(p.sourceUrls) : [],
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
    // Scout Hub offline — return empty
  }

  // ── No data available ─────────────────────────────────────
  if (id || slug) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }
  return NextResponse.json({ prospects: [], count: 0, source: 'none' });
}
