import { NextRequest } from 'next/server';
import { proxyToBackend, getSessionUserId } from '@/lib/api-proxy';

export async function GET() {
  const userId = await getSessionUserId();
  return proxyToBackend({ path: `/projects${userId ? `?userId=${userId}` : ''}`, guestAllowed: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = await getSessionUserId();
  return proxyToBackend({
    path: '/projects',
    method: 'POST',
    body: { ...body, userId: userId || 'anon' },
  });
}
