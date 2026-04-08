import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, getSessionUserId } from '@/lib/api-proxy';
import { requireAuth } from '@/lib/auth/require-role';
import { createProjectSchema, validateInput } from '@/lib/validation/schemas';

export async function GET() {
  const userId = await getSessionUserId();
  return proxyToBackend({ path: `/projects${userId ? `?userId=${userId}` : ''}`, guestAllowed: true });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const validation = validateInput(createProjectSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid project input', details: validation.errors }, { status: 400 });
  }

  const userId = await getSessionUserId();
  return proxyToBackend({
    path: '/projects',
    method: 'POST',
    body: { ...validation.data, userId: userId || auth.user.email },
  });
}
