import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-role';

const UEF_URL = process.env.UEF_GATEWAY_URL || process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    body.userId = auth.user.email;

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
