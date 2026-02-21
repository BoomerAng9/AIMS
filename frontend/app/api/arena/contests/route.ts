/**
 * Arena Contests API
 *
 * GET  /api/arena/contests — List all contests (filterable by status, type, category)
 * POST /api/arena/contests — Create a new contest (admin/system only)
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');

  // TODO: Query from Prisma when Arena DB schema is live
  // For now return empty array — no fabricated data
  const contests: any[] = [];

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
