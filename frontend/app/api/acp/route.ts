import { NextResponse } from 'next/server';

const UEF_URL = process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${UEF_URL}/ingress/acp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
