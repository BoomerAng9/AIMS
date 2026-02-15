/**
 * n8n Bridge API — Health check, status, and execution queries
 *
 * GET /api/n8n                      — Health check
 * GET /api/n8n?action=health        — Health check (explicit)
 * GET /api/n8n?action=executions    — Recent executions
 */

import { NextResponse } from 'next/server';
import { n8nHealthCheck, n8nFetch } from '@/lib/n8n-bridge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'executions') {
    const limit = searchParams.get('limit') || '20';
    const result = await n8nFetch<{ data: unknown[] }>({
      path: `/api/v1/executions?limit=${limit}&status=success,error,running`,
    });

    if (!result.ok) {
      return NextResponse.json(
        { executions: [], error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      executions: (result.data as any)?.data || result.data || [],
    });
  }

  // Default: health check
  const health = await n8nHealthCheck();

  return NextResponse.json({
    service: 'n8n-bridge',
    healthy: health.healthy,
    remote: health,
    bridge: 'active',
  }, {
    status: health.healthy ? 200 : 503,
  });
}
