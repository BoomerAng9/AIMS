import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const UEF_URL = process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function GET() {
  // Auth gate — OWNER only
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as Record<string, unknown>).role;
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden — OWNER role required' }, { status: 403 });
  }

  try {
    const res = await fetch(`${UEF_URL}/admin/api-keys`, {
      headers: { 'X-API-Key': INTERNAL_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
