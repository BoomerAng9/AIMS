/**
 * Sports Tracker API
 *
 * POST /api/sports/tracker — Search and track a player via Brave Search + AI extraction
 * Body: { playerName: string, team?: string }
 *
 * Returns: PlayerProfile with bio, career stats, injuries, news, highlights
 * Uses: Brave Search API (Pro plan) → OpenRouter AI (Gemini 2 Flash) → structured extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  trackPlayer,
  getStatsForNixieDisplay,
  calculateCareerStats,
  type PlayerProfile,
} from '@/lib/sports/tracker';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { playerName, team } = body;

  if (!playerName || typeof playerName !== 'string') {
    return NextResponse.json(
      { error: 'playerName is required' },
      { status: 400 },
    );
  }

  if (!process.env.BRAVE_API_KEY) {
    return NextResponse.json(
      { error: 'BRAVE_API_KEY not configured' },
      { status: 503 },
    );
  }

  try {
    const profile: PlayerProfile = await trackPlayer(
      playerName.trim(),
      team?.trim() || undefined,
    );

    const nixieStats = getStatsForNixieDisplay(profile);
    const careerCalcs = calculateCareerStats(profile);

    return NextResponse.json({
      player: profile.player,
      careerStats: profile.careerStats,
      injuries: profile.injuries,
      news: profile.news,
      highlights: profile.highlights,
      nixieStats,
      careerCalcs,
      lastUpdated: profile.lastUpdated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Sports Tracker API]', message);
    return NextResponse.json(
      { error: 'Failed to track player', details: message },
      { status: 500 },
    );
  }
}
