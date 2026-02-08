/**
 * n8n Bridge API — Health check and status
 *
 * GET /api/n8n — Returns n8n connection health and remote instance info
 */

import { NextResponse } from 'next/server';
import { n8nHealthCheck } from '@/lib/n8n-bridge';

export async function GET() {
  const health = await n8nHealthCheck();

  return NextResponse.json({
    service: 'n8n-bridge',
    remote: health,
    bridge: 'active',
  }, {
    status: health.healthy ? 200 : 503,
  });
}
