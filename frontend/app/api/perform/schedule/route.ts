/**
 * Per|Form Schedule & Scores API
 *
 * GET /api/perform/schedule — Returns game results, upcoming games,
 * and conference standings for the 2025 CFB season.
 *
 * Query params:
 *   ?week=5          — Filter by week number
 *   ?conference=SEC  — Filter by conference
 *   ?team=OSU        — Filter by team abbreviation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SEED_SCHEDULE_2025,
  SEED_STANDINGS_2025,
} from '@/lib/perform/seed-schedule-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekFilter = searchParams.get('week');
    const confFilter = searchParams.get('conference');
    const teamFilter = searchParams.get('team');

    let games = [...SEED_SCHEDULE_2025];
    let standings = [...SEED_STANDINGS_2025];

    // Filter games
    if (weekFilter) {
      const w = parseInt(weekFilter, 10);
      games = games.filter(g => g.week === w);
    }
    if (confFilter) {
      // For games, filter where either team is in that conference's standings
      const confTeams = standings
        .filter(s => s.conference === confFilter)
        .map(s => s.team);
      games = games.filter(g =>
        confTeams.includes(g.homeTeam) || confTeams.includes(g.awayTeam)
      );
    }
    if (teamFilter) {
      games = games.filter(g =>
        g.homeTeam === teamFilter || g.awayTeam === teamFilter
      );
    }

    // Filter standings by conference
    if (confFilter) {
      standings = standings.filter(s => s.conference === confFilter);
    }

    // Derive available weeks
    const weeks = [...new Set(SEED_SCHEDULE_2025.map(g => g.week))].sort((a, b) => a - b);

    // Derive available conferences
    const conferences = [...new Set(SEED_STANDINGS_2025.map(s => s.conference))].sort();

    return NextResponse.json({
      games,
      standings: standings.sort((a, b) => {
        // Sort by conference, then by conf wins desc, then overall wins desc
        if (a.conference !== b.conference) return a.conference.localeCompare(b.conference);
        if (b.confWins !== a.confWins) return b.confWins - a.confWins;
        return b.wins - a.wins;
      }),
      weeks,
      conferences,
      season: 2025,
      totalGames: games.length,
    });
  } catch (err: any) {
    console.error('[Per|Form Schedule] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to load schedule data' },
      { status: 500 }
    );
  }
}
