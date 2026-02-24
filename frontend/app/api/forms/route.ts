import { NextRequest, NextResponse } from 'next/server';

/**
 * Forms API — Proxy to UEF Gateway → Pipedream MCP → Paperform.
 *
 * TODO: Wire to real Paperform data via UEF Gateway.
 * Returns empty results until backend integration is live.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const _category = searchParams.get('category');
  const _status = searchParams.get('status');
  const _search = searchParams.get('q');

  // TODO: Proxy to UEF Gateway /api/forms endpoint
  // For now, return empty — no fake data
  return NextResponse.json({
    forms: [],
    stats: {
      totalForms: 0,
      totalSubmissions: 0,
      totalPartials: 0,
      liveForms: 0,
    },
  });
}
