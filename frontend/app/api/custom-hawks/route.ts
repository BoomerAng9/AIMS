/**
 * Custom Hawks API Proxy — /api/custom-hawks
 *
 * Proxies requests to the UEF Gateway /custom-hawks endpoints.
 * Adds authentication context from NextAuth session.
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
      || request.headers.get('x-user-id')
      || 'anon-unknown';
    const res = await fetch(`${UEF_GATEWAY_URL}/custom-hawks?userId=${userId}`, {
      headers: gatewayHeaders(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Custom hawks fetch failed';
    console.error('[Custom Hawks API] GET error:', msg);
    return NextResponse.json({ hawks: [], count: 0, error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${UEF_GATEWAY_URL}/custom-hawks`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Custom hawk creation failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
