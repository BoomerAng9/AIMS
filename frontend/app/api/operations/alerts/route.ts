/**
 * Operations Alerts API — Proxy to UEF Gateway Observability
 *
 * Returns active alerts and recent alert history from the backend
 * AlertEngine. Falls back to empty arrays when backend is unreachable.
 */

import { NextResponse } from 'next/server';

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function GET() {
  try {
    const res = await fetch(`${UEF_GATEWAY}/observability/alerts`, {
      headers: INTERNAL_API_KEY ? { 'X-API-Key': INTERNAL_API_KEY } : {},
      next: { revalidate: 5 },
    });

    if (!res.ok) {
      return NextResponse.json({ active: [], history: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ active: [], history: [], fallback: true });
  }
}
