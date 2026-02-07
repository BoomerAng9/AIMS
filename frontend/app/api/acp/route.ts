import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const UEF_URL = process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Try to get authenticated user — but don't block if not signed in
    const session = await getServerSession(authOptions);
    if (session?.user) {
      body.userId = (session.user as Record<string, unknown>).id || session.user.email;
    } else {
      body.userId = 'guest';
    }

    const res = await fetch(`${UEF_URL}/ingress/acp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({
        status: 'ERROR',
        message: `UEF Gateway returned ${res.status}. Ensure the backend is running.`
      }, { status: 503 });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { status: 'ERROR', message: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
