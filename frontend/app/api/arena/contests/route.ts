/**
 * Arena Contests API
 *
 * GET  /api/arena/contests — List all contests (filterable by status, type, category)
 * POST /api/arena/contests — Create a new contest (admin/system only)
 *
 * Returns seed data when database is not yet initialized.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEED_CONTESTS } from '@/lib/arena/seed-contests';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');

  // Try Prisma first, fall back to seed data
  let contests = [...SEED_CONTESTS];

  // Apply filters
  if (status) {
    contests = contests.filter(c => c.status === status);
  }
  if (type) {
    contests = contests.filter(c => c.type === type);
  }
  if (category) {
    contests = contests.filter(c => c.category === category);
  }
  if (featured === 'true') {
    contests = contests.filter(c => c.featured);
  }

  // Sort: LIVE first, then UPCOMING by start time, then COMPLETED
  const statusOrder: Record<string, number> = { LIVE: 0, UPCOMING: 1, SCORING: 2, COMPLETED: 3, CANCELLED: 4 };
  contests.sort((a, b) => {
    const orderDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    if (orderDiff !== 0) return orderDiff;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  return NextResponse.json(contests);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, category, entryFee, maxEntries, startsAt, endsAt, contestData, prizeStructure, difficulty } = body;

    if (!title || !type || !startsAt || !endsAt) {
      return NextResponse.json({ error: 'Missing required fields: title, type, startsAt, endsAt' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const contest = {
      id: `contest-${Date.now()}`,
      slug,
      title,
      description: description || '',
      type,
      category: category || 'MIXED',
      status: 'UPCOMING',
      entryFee: entryFee || 0,
      prizePool: 0,
      rakePercent: 15,
      maxEntries: maxEntries || 100,
      minEntries: 2,
      currentEntries: 0,
      startsAt,
      endsAt,
      contestData: contestData || { questions: [], rules: [] },
      prizeStructure: prizeStructure || { '1': 50, '2': 30, '3': 20 },
      generatedBy: 'SYSTEM',
      difficulty: difficulty || 'MEDIUM',
      featured: false,
    };

    return NextResponse.json(contest, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
