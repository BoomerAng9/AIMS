/**
 * Per|Form Teams API
 *
 * GET /api/perform/teams — All teams with conference data
 * GET /api/perform/teams?conference=SEC — Teams in a specific conference
 * GET /api/perform/teams?id=<uuid> — Single team by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTeamsWithConference, getConferencesWithTeams } from '@/lib/perform/data-service';
import { CONFERENCES, INDEPENDENTS } from '@/lib/perform/conferences';

/** Build teams array from the static conferences.ts data */
function getSeedTeams() {
  const teams: any[] = [];
  for (const conf of CONFERENCES) {
    for (const team of conf.teams) {
      teams.push({
        id: team.id,
        schoolName: team.schoolName,
        commonName: team.commonName,
        abbreviation: team.abbreviation,
        mascot: team.mascot,
        city: team.city,
        state: team.state,
        stadium: team.stadium,
        stadiumCapacity: team.stadiumCapacity,
        colors: team.colors,
        headCoach: team.headCoach,
        headCoachSince: team.headCoachSince,
        social: team.social,
        conference: {
          id: conf.id,
          name: conf.name,
          abbreviation: conf.abbreviation,
          tier: conf.tier,
        },
        source: 'seed-data',
      });
    }
  }
  for (const team of INDEPENDENTS) {
    teams.push({
      ...team,
      conference: { id: 'ind', name: 'Independent', abbreviation: 'IND', tier: 'independent' },
      source: 'seed-data',
    });
  }
  return teams;
}

function getSeedConferencesGrouped() {
  return CONFERENCES.map(conf => ({
    id: conf.id,
    name: conf.name,
    abbreviation: conf.abbreviation,
    tier: conf.tier,
    commissioner: conf.commissioner,
    hqCity: conf.hqCity,
    hqState: conf.hqState,
    teams: conf.teams,
    source: 'seed-data',
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conference = searchParams.get('conference');
  const id = searchParams.get('id');
  const grouped = searchParams.get('grouped') === 'true';

  try {
    if (grouped) {
      const conferences = await getConferencesWithTeams();
      if (conferences && conferences.length > 0) {
        return NextResponse.json(conferences);
      }
      // Fall back to seed conferences
      return NextResponse.json(getSeedConferencesGrouped());
    }

    const teams = await getTeamsWithConference();

    if (teams && teams.length > 0) {
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
    }

    // Fall through to seed data
  } catch (err: any) {
    console.error('[Teams] DB error, falling back to seed data:', err);
  }

  // Fallback to static seed data
  let seedTeams = getSeedTeams();

  if (id) {
    const team = seedTeams.find(t => t.id === id);
    return team
      ? NextResponse.json(team)
      : NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  if (conference) {
    seedTeams = seedTeams.filter(t =>
      t.conference.abbreviation.toLowerCase() === conference.toLowerCase() ||
      t.conference.name.toLowerCase().includes(conference.toLowerCase())
    );
  }

  return NextResponse.json(seedTeams);
}
