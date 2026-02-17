/**
 * Arena Single Contest API
 *
 * GET /api/arena/contests/[id] — Get contest details
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEED_CONTESTS } from '@/lib/arena/seed-contests';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try by ID
  let contest = SEED_CONTESTS.find(c => c.id === id);

  // Try by slug
  if (!contest) {
    contest = SEED_CONTESTS.find(c => c.slug === id);
  }

  if (!contest) {
    return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
  }

  return NextResponse.json(contest);
}
