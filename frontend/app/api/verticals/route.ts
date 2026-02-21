/**
 * Verticals API Proxy — /api/verticals
 *
 * Proxies to UEF Gateway /verticals endpoints.
 * Supports: list all, get by id, get by category.
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
    const id = request.nextUrl.searchParams.get('id');
    const category = request.nextUrl.searchParams.get('category');

    let url = `${UEF_GATEWAY_URL}/verticals`;
    if (category) url = `${UEF_GATEWAY_URL}/verticals/${encodeURIComponent(category)}`;

    const res = await fetch(url, { headers: gatewayHeaders() });
    const data = await res.json();

    // If requesting a specific vertical by ID, filter from the list
    if (id && data.verticals) {
      const vertical = data.verticals.find((v: any) => v.id === id);
      if (vertical) return NextResponse.json({ vertical });
      return NextResponse.json({ error: `Vertical ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Verticals fetch failed';
    console.error('[Verticals API] GET error:', msg);
    return NextResponse.json({ verticals: [], error: msg }, { status: 502 });
  }
}
