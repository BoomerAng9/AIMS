/**
 * Per|Form Statistical Leaders API
 *
 * GET /api/perform/leaders — Returns season stat leaders by category
 *
 * Query params:
 *   ?category=passing-yards  — Filter by stat category
 *   ?conference=SEC          — Filter by conference
 *   ?position=QB             — Filter by position
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEED_STAT_LEADERS_2025 } from '@/lib/perform/seed-schedule-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get('category');
    const confFilter = searchParams.get('conference');
    const posFilter = searchParams.get('position');

    let categories = SEED_STAT_LEADERS_2025.map(cat => {
      let leaders = [...cat.leaders];

      if (confFilter) {
        leaders = leaders.filter(l => l.conference === confFilter);
      }
      if (posFilter) {
        leaders = leaders.filter(l => l.position === posFilter);
      }

      return { ...cat, leaders };
    });

    if (categoryFilter) {
      categories = categories.filter(c => c.id === categoryFilter);
    }

    // Filter out empty categories
    categories = categories.filter(c => c.leaders.length > 0);

    return NextResponse.json({
      categories,
      availableCategories: SEED_STAT_LEADERS_2025.map(c => ({ id: c.id, label: c.label })),
      season: 2025,
    });
  } catch (err: any) {
    console.error('[Per|Form Leaders] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to load leaders data' },
      { status: 500 }
    );
  }
}
