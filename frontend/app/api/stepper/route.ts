import { NextRequest, NextResponse } from 'next/server';

const UEF_URL = process.env.UEF_GATEWAY_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const res = await fetch(`${UEF_URL}/api/stepper?${searchParams.toString()}`, {
      headers: {
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({
        workflows: [],
        stats: { totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0, totalCredits: 0 },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.warn('[stepper] UEF Gateway unreachable:', (err as Error).message);
    return NextResponse.json({
      workflows: [],
      stats: { totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0, totalCredits: 0 },
    });
  }
}
