/**
 * Per|Form Data Ingestion API
 *
 * POST /api/perform/ingest — Seed conferences/teams + initial prospects
 * POST /api/perform/ingest?action=prospect — Add/update a single prospect
 * POST /api/perform/ingest?action=discover — Discover prospects via Brave Search
 *
 * Seeds the database with real CFB conference/team data from conferences.ts
 * and migrates the curated prospect database to persistent storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  seedConferencesAndTeams,
  upsertProspect,
  discoverProspectsViaBrave,
  getStats,
} from '@/lib/perform/data-service';
import { SEED_PROSPECTS } from '@/lib/perform/seed-prospects';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    // Single prospect upsert
    if (action === 'prospect') {
      const body = await req.json();
      const prospect = await upsertProspect(body);
      return NextResponse.json({ ok: true, prospect });
    }

    // Discover prospects via Brave
    if (action === 'discover') {
      const body = await req.json();
      const results = await discoverProspectsViaBrave(body);
      return NextResponse.json({ ok: true, results });
    }

    // Full seed: conferences + teams + curated prospects
    const confResult = await seedConferencesAndTeams();

    let prospectCount = 0;
    for (const p of SEED_PROSPECTS) {
      await upsertProspect(p);
      prospectCount++;
    }

    const stats = await getStats();

    return NextResponse.json({
      ok: true,
      seeded: {
        conferences: confResult.conferences,
        teams: confResult.teams,
        prospects: prospectCount,
      },
      totals: stats,
    });
  } catch (err: any) {
    console.error('[Ingest] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json({ ok: true, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
