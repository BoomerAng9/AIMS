import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-role';

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const requestedUserId = req.nextUrl.searchParams.get('userId');
  const userId = auth.user.role === 'OWNER' || auth.user.role === 'ADMIN'
    ? requestedUserId || auth.user.email
    : auth.user.email;

  try {
    const res = await fetch(`${UEF_GATEWAY}/luc/status?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Return default quotas when UEF is unreachable
    return NextResponse.json({
      userId,
      tier: 'free',
      billing_cycle_start: new Date().toISOString(),
      billing_cycle_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      can_execute: true,
      blocking_quotas: [],
      usage_summary: {
        api_calls:        { used: 0, limit: 50, pct: 0 },
        brave_searches:   { used: 0, limit: 10, pct: 0 },
        container_hours:  { used: 0, limit: 0.5, pct: 0 },
        storage_gb:       { used: 0, limit: 1, pct: 0 },
        elevenlabs_chars: { used: 0, limit: 5000, pct: 0 },
        n8n_executions:   { used: 0, limit: 5, pct: 0 },
      },
    });
  }
}
