/**
 * Per|Form Rankings API
 *
 * GET /api/perform/rankings — Returns AP, CFP, and Coaches Poll rankings
 *
 * Query params:
 *   ?poll=AP         — Filter by poll type (AP, CFP, Coaches)
 *   ?week=18         — Filter by week
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEED_POLLS_2025 } from '@/lib/perform/seed-schedule-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pollFilter = searchParams.get('poll');
    const weekFilter = searchParams.get('week');

    let polls = [...SEED_POLLS_2025];

    if (pollFilter) {
      polls = polls.filter(p => p.poll === pollFilter);
    }
    if (weekFilter) {
      const w = parseInt(weekFilter, 10);
      polls = polls.filter(p => p.week === w);
    }

    return NextResponse.json({
      polls,
      availablePolls: ['AP', 'CFP', 'Coaches'],
      season: 2025,
    });
  } catch (err: any) {
    console.error('[Per|Form Rankings] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to load rankings data' },
      { status: 500 }
    );
  }
}
