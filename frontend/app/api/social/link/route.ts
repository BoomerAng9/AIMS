/**
 * Social Account Linking
 *
 * POST /api/social/link — Claim a link code to bind social account to platform user
 * GET /api/social/link?code=ABC123 — Check link code status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requireAuth } from '@/lib/auth/require-role';
import { claimLinkCode, generateLinkCode } from '@/lib/social/gateway';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const session = await getServerSession(authOptions);
    const { code } = await req.json();
    const platformUserId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;
    const fallbackUserId = auth.user.email;

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const success = claimLinkCode(code, platformUserId || fallbackUserId);
    if (!success) {
      return NextResponse.json({ error: 'Invalid, expired, or already claimed code' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, linked: true });
  } catch {
    return NextResponse.json({ error: 'Linking failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'code parameter required' }, { status: 400 });
  }

  return NextResponse.json({
    service: 'aims-social-link',
    code,
    info: 'Use POST with { code, platform_user_id } to claim',
  });
}
