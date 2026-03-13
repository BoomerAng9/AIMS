/**
 * Collaboration Feed API Proxy — /api/collaboration
 *
 * Proxies to UEF Gateway /collaboration/demo endpoint.
 * Starts a collaboration session and returns the feed transcript.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-role';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;
  return headers;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const res = await fetch(`${UEF_GATEWAY_URL}/collaboration/demo`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({ ...body, userId: auth.user.email }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Collaboration feed failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
