/**
 * Per|Form Automation API
 *
 * GET /api/perform/automation — List automation runs
 * GET /api/perform/automation?agentName=boomer_ang — Filter by agent
 * GET /api/perform/automation?targetModule=TRANSFER_PORTAL — Filter by module
 * GET /api/perform/automation?limit=20 — Limit results
 *
 * POST /api/perform/automation — Trigger a new automation run
 *   Body: { agentName, taskType, targetModule, triggeredBy? }
 *
 * Data source priority:
 *   1. Database (Prisma) — primary
 *   2. Empty array — fallback when DB is unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomationRuns, createAutomationRun } from '@/lib/perform/ncaa-data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentName = searchParams.get('agentName');
  const targetModule = searchParams.get('targetModule');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // ── Try database first ────────────────────────────────────
  try {
    const runs = await getAutomationRuns({
      agentName: agentName || undefined,
      targetModule: targetModule || undefined,
      limit,
    });

    return NextResponse.json(runs);
  } catch (err) {
    console.warn('[Automation] DB query failed, returning empty array:', err);
  }

  // ── Fallback: empty array ─────────────────────────────────
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { agentName, taskType, targetModule, triggeredBy } = body;

    // Validate required fields
    if (!agentName || !taskType || !targetModule) {
      return NextResponse.json(
        { error: 'agentName, taskType, and targetModule are required' },
        { status: 400 }
      );
    }

    const run = await createAutomationRun({
      agentName,
      taskType,
      targetModule,
      triggeredBy,
    });

    return NextResponse.json(run, { status: 201 });
  } catch (err: any) {
    console.error('[Automation] Failed to create automation run:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create automation run' },
      { status: 500 }
    );
  }
}
