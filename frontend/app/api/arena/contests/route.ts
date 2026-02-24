/**
 * Arena Contests API
 *
 * GET  /api/arena/contests — List all contests (filterable by status, type, category)
 * POST /api/arena/contests — Create a new contest (admin/system only)
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.category = category;
    if (featured === 'true') where.featured = true;

    const contests = await prisma.arenaContest.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { startsAt: 'desc' },
      ],
      take: Math.min(limit, 100),
    });

    return NextResponse.json(
      contests.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        type: c.type,
        category: c.category,
        status: c.status,
        entryFee: c.entryFee,
        prizePool: c.prizePool,
        maxEntries: c.maxEntries,
        currentEntries: c.currentEntries,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString(),
        difficulty: c.difficulty,
        featured: c.featured,
        generatedBy: c.generatedBy,
        prizeStructure: JSON.parse(c.prizeStructure || '{}'),
      }))
    );
  } catch (err: any) {
    console.error('[Arena Contests] Error:', err.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, category, entryFee, maxEntries, startsAt, endsAt, contestData, prizeStructure, difficulty } = body;

    if (!title || !type || !startsAt || !endsAt) {
      return NextResponse.json({ error: 'Missing required fields: title, type, startsAt, endsAt' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const contest = await prisma.arenaContest.create({
      data: {
        slug: `${slug}-${Date.now()}`,
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
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        contestData: JSON.stringify(contestData || { questions: [], rules: [] }),
        prizeStructure: JSON.stringify(prizeStructure || { '1': 50, '2': 30, '3': 20 }),
        generatedBy: 'SYSTEM',
        difficulty: difficulty || 'MEDIUM',
        featured: false,
      },
    });

    return NextResponse.json({
      id: contest.id,
      slug: contest.slug,
      title: contest.title,
      status: contest.status,
    }, { status: 201 });
  } catch (err: any) {
    console.error('[Arena Contests] Create error:', err.message);
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  }
}
