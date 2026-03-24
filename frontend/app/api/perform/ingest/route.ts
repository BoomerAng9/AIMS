/**
 * Per|Form Data Ingestion API
 *
 * POST /api/perform/ingest — Full seed (conferences + teams + prospects + NCAA data)
 * POST /api/perform/ingest?action=prospect — Add/update a single prospect
 * POST /api/perform/ingest?action=discover — Discover prospects via Brave Search
 * POST /api/perform/ingest?action=ncaa — Seed NCAA data only (coaching, portal, NIL, budgets)
 *
 * Seeds the database with real CFB conference/team data from conferences.ts,
 * curated prospects, and NCAA football operational data.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  seedConferencesAndTeams,
  upsertProspect,
  discoverProspectsViaBrave,
  getStats,
} from '@/lib/perform/data-service';
import {
  seedCoachingChanges,
  seedTransferPortalEntries,
  seedNilDeals,
  seedNilTeamRankings,
  seedSchoolBudgets,
} from '@/lib/perform/ncaa-data-service';
import { SEED_PROSPECTS } from '@/lib/perform/seed-prospects';
import {
  SEED_COACHING_CHANGES,
  SEED_TRANSFER_PORTAL,
  SEED_NIL_DEALS,
  SEED_NIL_TEAM_RANKINGS,
  SEED_SCHOOL_BUDGETS,
} from '@/lib/perform/seed-ncaa-data';
import { SEED_DRAFT_PROSPECTS } from '@/lib/perform/seed-draft-data';
import {
  batchEnrichDraftProspects,
  enrichDraftProspect,
  persistEnrichment,
} from '@/lib/perform/draft-enrichment-service';

/** Seed all NCAA operational data (coaching, portal, NIL, budgets) */
async function seedNcaaData() {
  const coaching = await seedCoachingChanges(SEED_COACHING_CHANGES);
  const portal = await seedTransferPortalEntries(SEED_TRANSFER_PORTAL);
  const nilDeals = await seedNilDeals(SEED_NIL_DEALS);
  const nilRankings = await seedNilTeamRankings(SEED_NIL_TEAM_RANKINGS);
  const budgets = await seedSchoolBudgets(SEED_SCHOOL_BUDGETS);

  return {
    coaching,
    transferPortal: portal,
    nilDeals,
    nilTeamRankings: nilRankings,
    schoolBudgets: budgets,
  };
}

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

    // NCAA data only (requires teams to already exist)
    if (action === 'ncaa') {
      const ncaa = await seedNcaaData();
      return NextResponse.json({ ok: true, seeded: { ncaa } });
    }

    // Enrich draft prospects via CFBD + Brave (Lil_Scout_Hawk pipeline)
    if (action === 'enrich-draft') {
      const body = await req.json().catch(() => ({}));
      const prospects = body.prospects || SEED_DRAFT_PROSPECTS;
      const limit = Math.min(body.limit || prospects.length, prospects.length);
      const batch = prospects.slice(0, limit);

      const results = await batchEnrichDraftProspects(batch, {
        delayMs: body.delayMs || 2000,
      });

      const summary = {
        total: results.length,
        success: results.filter((r: any) => r.status === 'SUCCESS').length,
        partial: results.filter((r: any) => r.status === 'PARTIAL').length,
        failed: results.filter((r: any) => r.status === 'FAILED').length,
      };

      return NextResponse.json({ ok: true, enrichment: summary, results });
    }

    // Enrich a single draft prospect
    if (action === 'enrich-prospect') {
      const body = await req.json();
      const result = await enrichDraftProspect(body);
      await persistEnrichment(body, result);
      return NextResponse.json({ ok: true, result });
    }

    // Full seed: conferences + teams + prospects + NCAA data
    const confResult = await seedConferencesAndTeams();

    let prospectCount = 0;
    for (const p of SEED_PROSPECTS) {
      await upsertProspect(p);
      prospectCount++;
    }

    // Seed NCAA operational data (depends on teams existing)
    const ncaa = await seedNcaaData();

    const stats = await getStats();

    return NextResponse.json({
      ok: true,
      seeded: {
        conferences: confResult.conferences,
        teams: confResult.teams,
        prospects: prospectCount,
        ncaa,
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
