/**
 * Per|Form Prospect Enrichment API
 *
 * POST /api/perform/enrich — Enrich a prospect with Brave Search data
 *   Body: { prospectId: string }
 *
 * Uses Brave Search to find recruiting profiles, stats, and highlights
 * for the given prospect, then updates their record with source URLs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enrichProspectViaBrave } from '@/lib/perform/data-service';

export async function POST(req: NextRequest) {
  try {
    const { prospectId } = await req.json();

    if (!prospectId) {
      return NextResponse.json(
        { error: 'prospectId is required' },
        { status: 400 }
      );
    }

    const result = await enrichProspectViaBrave(prospectId);
    return NextResponse.json({
      ok: true,
      prospectId,
      sourcesFound: result.sources.length,
      sources: result.sources,
      snippets: result.snippets,
    });
  } catch (err: any) {
    console.error('[Enrich] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
