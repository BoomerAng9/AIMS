/**
 * Social Account Linking
 *
 * POST /api/social/link — Claim a link code to bind social account to platform user
 * GET /api/social/link?code=ABC123 — Check link code status
 */

import { NextRequest, NextResponse } from 'next/server';
import { claimLinkCode, generateLinkCode } from '@/lib/social/gateway';

export async function POST(req: NextRequest) {
  try {
    const { code, platform_user_id } = await req.json();

    if (!code || !platform_user_id) {
      return NextResponse.json({ error: 'code and platform_user_id required' }, { status: 400 });
    }

    const success = claimLinkCode(code, platform_user_id);
    if (!success) {
      return NextResponse.json({ error: 'Invalid, expired, or already claimed code' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, linked: true });
  } catch {
    return NextResponse.json({ error: 'Linking failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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
