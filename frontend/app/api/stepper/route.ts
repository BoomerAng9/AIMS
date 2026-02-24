import { NextRequest, NextResponse } from 'next/server';

/**
 * Stepper API — Proxy to UEF Gateway → Stepper.io.
 *
 * TODO: Wire to real Stepper data via UEF Gateway.
 * Returns empty results until backend integration is live.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const _status = searchParams.get('status');
  const _formId = searchParams.get('formId');
  const _search = searchParams.get('q');

  // TODO: Proxy to UEF Gateway /api/stepper endpoint
  // For now, return empty — no fake data
  return NextResponse.json({
    workflows: [],
    stats: {
      totalWorkflows: 0,
      activeWorkflows: 0,
      totalRuns: 0,
      totalCredits: 0,
    },
  });
}
