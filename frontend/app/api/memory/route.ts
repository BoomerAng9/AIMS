/**
 * Memory API Proxy — /api/memory
 *
 * Proxies memory operations to the UEF Gateway memory endpoints.
 * Supports: remember, recall, feedback, list, stats, preferences.
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;
  return headers;
}

// GET /api/memory — List memories or stats
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'web-user';
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'stats') {
      const res = await fetch(`${UEF_GATEWAY_URL}/memory/stats?userId=${userId}`, {
        headers: gatewayHeaders(),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Default: list memories
    const type = request.nextUrl.searchParams.get('type') || '';
    const projectId = request.nextUrl.searchParams.get('projectId') || '';
    const limit = request.nextUrl.searchParams.get('limit') || '';
    const params = new URLSearchParams({ userId });
    if (type) params.set('type', type);
    if (projectId) params.set('projectId', projectId);
    if (limit) params.set('limit', limit);

    const res = await fetch(`${UEF_GATEWAY_URL}/memory?${params.toString()}`, {
      headers: gatewayHeaders(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Memory fetch failed';
    console.error('[Memory API] GET error:', msg);
    return NextResponse.json({ memories: [], count: 0, error: msg }, { status: 502 });
  }
}

// POST /api/memory — remember, recall, feedback, preference
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    let endpoint = '/memory/remember';
    if (action === 'recall') endpoint = '/memory/recall';
    else if (action === 'feedback') endpoint = '/memory/feedback';
    else if (action === 'preference') endpoint = '/memory/preference';
    else if (action === 'maintenance') endpoint = '/memory/maintenance';

    const res = await fetch(`${UEF_GATEWAY_URL}${endpoint}`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Memory operation failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
