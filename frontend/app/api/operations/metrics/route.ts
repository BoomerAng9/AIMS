/**
 * Operations Metrics API — Proxy to UEF Gateway Observability
 *
 * Returns JSON metrics snapshot from the backend MetricsExporter.
 * Falls back to empty metrics when backend is unreachable.
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-role';

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await fetch(`${UEF_GATEWAY}/observability/metrics`, {
      headers: INTERNAL_API_KEY ? { 'X-API-Key': INTERNAL_API_KEY } : {},
      next: { revalidate: 3 },
    });

    if (!res.ok) {
      return NextResponse.json({ timestamp: new Date().toISOString(), metrics: {}, fallback: true }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ timestamp: new Date().toISOString(), metrics: {}, fallback: true });
  }
}
