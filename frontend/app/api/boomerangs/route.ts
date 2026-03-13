import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-role';

const HOUSE_OF_ANG_URL = process.env.HOUSE_OF_ANG_URL || 'http://localhost:3002';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await fetch(`${HOUSE_OF_ANG_URL}/boomerangs`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'House of Ang service unreachable.' },
      { status: 502 }
    );
  }
}
