/**
 * Plug Instances API — Frontend proxy to UEF Gateway
 *
 * GET  /api/plug-instances?userId=xxx     → List user's instances
 * POST /api/plug-instances                → Actions: stop, restart, export, health
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

async function gatewayFetch(path: string, options?: RequestInit): Promise<Response | null> {
  try {
    const url = `${UEF_GATEWAY}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        ...(options?.headers || {}),
      },
    });
    return res;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'web-user';

  const res = await gatewayFetch(`/api/plug-instances?userId=${userId}`);
  if (res?.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ instances: [], count: 0 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, instanceId } = body;

  if (!instanceId || !action) {
    return NextResponse.json({ error: 'instanceId and action are required' }, { status: 400 });
  }

  let path: string;
  let method = 'POST';

  switch (action) {
    case 'stop':
      path = `/api/plug-instances/${instanceId}/stop`;
      break;
    case 'restart':
      path = `/api/plug-instances/${instanceId}/restart`;
      break;
    case 'health':
      path = `/api/plug-instances/${instanceId}/health`;
      method = 'GET';
      break;
    case 'export':
      path = `/api/plug-instances/export`;
      break;
    case 'remove':
      path = `/api/plug-instances/${instanceId}`;
      method = 'DELETE';
      break;
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const res = await gatewayFetch(path, {
    method,
    ...(method !== 'GET' && method !== 'DELETE' ? { body: JSON.stringify(body) } : {}),
  });

  if (res?.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  const status = res?.status || 502;
  return NextResponse.json(
    { error: `Gateway ${res ? `returned ${status}` : 'unreachable'}` },
    { status },
  );
}
