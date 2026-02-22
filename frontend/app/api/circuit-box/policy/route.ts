/**
 * Circuit Box Policy API
 *
 * GET /api/circuit-box/policy — Returns current system policy state
 * POST /api/circuit-box/policy — Update policy settings (owner only)
 *
 * Polled every 2s by the Control Plane panel in the Circuit Box dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';

// Default policy state — returned when gateway is unreachable
const DEFAULT_POLICY = {
  autonomyMode: 'supervised' as const,     // supervised | auto-execute
  sandboxRequired: true,                    // always true, locked
  killSwitchArmed: true,                    // emergency halt ready
  killSwitchActive: false,                  // not currently triggered
  toolPermissions: {
    braveSearch: true,
    openRouter: true,
    stripe: true,
    dockerEngine: true,
    fileSystem: false,                       // sandboxed only
    shellExec: false,                        // sandboxed only
  },
  rateLimits: {
    maxConcurrentAgents: 5,
    maxTasksPerMinute: 30,
    maxTokensPerHour: 500_000,
  },
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/api/circuit-box/policy`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Gateway unreachable — return defaults
  }

  return NextResponse.json(DEFAULT_POLICY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${UEF_GATEWAY_URL}/api/circuit-box/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Policy update failed', status: res.status },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { error: 'Gateway unreachable' },
      { status: 502 },
    );
  }
}
