/**
 * Per|Form Teams API
 *
 * GET /api/perform/teams — All teams with conference data
 * GET /api/perform/teams?conference=SEC — Teams in a specific conference
 * GET /api/perform/teams?id=<uuid> — Single team by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTeamsWithConference, getConferencesWithTeams } from '@/lib/perform/data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conference = searchParams.get('conference');
  const id = searchParams.get('id');
  const grouped = searchParams.get('grouped') === 'true';

  try {
    if (grouped) {
      const conferences = await getConferencesWithTeams();
      return NextResponse.json(conferences);
    }

    const teams = await getTeamsWithConference();

    if (id) {
      const team = teams.find(t => t.id === id);
      return team
        ? NextResponse.json(team)
        : NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (conference) {
      const filtered = teams.filter(t =>
        t.conference.abbreviation.toLowerCase() === conference.toLowerCase() ||
        t.conference.name.toLowerCase().includes(conference.toLowerCase())
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(teams);
  } catch (err: any) {
    console.error('[Teams] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
