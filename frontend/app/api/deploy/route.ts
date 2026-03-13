import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';
import { requireOwner } from '@/lib/auth/require-role';

export async function POST(req: NextRequest) {
  // Deploy is a destructive action — OWNER only
  const auth = await requireOwner();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  return proxyToBackend({ path: '/deploy', method: 'POST', body, requireOwner: true });
}
