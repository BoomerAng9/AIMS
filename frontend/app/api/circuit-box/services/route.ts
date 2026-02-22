/**
 * GET /api/circuit-box/services
 *
 * Proxies to circuit-metrics:9090/status to get real service health data.
 */

import { NextResponse } from 'next/server';

const CIRCUIT_METRICS_URL = process.env.CIRCUIT_METRICS_URL || 'http://circuit-metrics:9090';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${CIRCUIT_METRICS_URL}/status`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Circuit metrics returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    // Circuit metrics unreachable — return honest error
    return NextResponse.json(
      {
        overall: 'unknown',
        timestamp: new Date().toISOString(),
        services: [],
        summary: { total: 0, up: 0, degraded: 0, down: 0 },
        error: 'Circuit metrics service unreachable',
      },
      { status: 503 }
    );
  }
}
