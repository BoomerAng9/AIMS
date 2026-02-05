import { NextRequest, NextResponse } from 'next/server';

const ACHEEVY_URL = process.env.ACHEEVY_URL || 'http://localhost:3003';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${ACHEEVY_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'ACHEEVY service unreachable. Ensure Docker services are running.' },
      { status: 502 }
    );
  }
}
