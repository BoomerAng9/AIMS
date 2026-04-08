/**
 * CollegeFootballData.com API Client
 *
 * Free tier: 1,000 calls/month
 * Covers: teams, games, player stats, recruiting, draft picks
 * Historical data: scores since 1869, stats since 2001, recruiting since 2000, draft since 1967
 *
 * API Key: Register free at https://collegefootballdata.com/key
 * Env var: CFBD_API_KEY
 */

const CFBD_BASE = 'https://api.collegefootballdata.com';
const CFBD_API_KEY = process.env.CFBD_API_KEY || '';

async function cfbdFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  if (!CFBD_API_KEY) {
    throw new Error('CFBD_API_KEY not configured — register free at https://collegefootballdata.com/key');
  }

  const url = new URL(`${CFBD_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${CFBD_API_KEY}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CFBD API ${res.status}: ${text}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────────────────────

export interface CFBDTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  alt_name1?: string;
  alt_name2?: string;
  alt_name3?: string;
  conference?: string;
  classification: string;
  color?: string;
  alt_color?: string;
  logos?: string[];
  twitter?: string;
  location?: {
    venue_id?: number;
    name?: string;
    city?: string;
    state?: string;
    zip?: string;
    country_code?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    capacity?: number;
    construction_year?: number;
    grass?: boolean;
    dome?: boolean;
  };
}

export async function getTeams(conference?: string): Promise<CFBDTeam[]> {
  const params: Record<string, string> = {};
  if (conference) params.conference = conference;
  return cfbdFetch<CFBDTeam[]>('/teams', params);
}

// ─────────────────────────────────────────────────────────────
// Games & Scores
// ─────────────────────────────────────────────────────────────

export interface CFBDGame {
  id: number;
  season: number;
  week: number;
  season_type: string;
  start_date: string;
  completed: boolean;
  neutral_site: boolean;
  conference_game: boolean;
  home_team: string;
  home_conference?: string;
  home_points?: number;
  home_line_scores?: number[];
  away_team: string;
  away_conference?: string;
  away_points?: number;
  away_line_scores?: number[];
  venue_id?: number;
  venue?: string;
}

export async function getGames(year: number, options?: {
  week?: number;
  team?: string;
  conference?: string;
  seasonType?: string;
}): Promise<CFBDGame[]> {
  const params: Record<string, string> = { year: String(year) };
  if (options?.week) params.week = String(options.week);
  if (options?.team) params.team = options.team;
  if (options?.conference) params.conference = options.conference;
  if (options?.seasonType) params.seasonType = options.seasonType;
  return cfbdFetch<CFBDGame[]>('/games', params);
}

// ─────────────────────────────────────────────────────────────
// Team Records
// ─────────────────────────────────────────────────────────────

export interface CFBDTeamRecord {
  year: number;
  team: string;
  conference: string;
  division?: string;
  total: { games: number; wins: number; losses: number; ties: number };
  conferenceGames: { games: number; wins: number; losses: number; ties: number };
  homeGames: { games: number; wins: number; losses: number; ties: number };
  awayGames: { games: number; wins: number; losses: number; ties: number };
}

export async function getTeamRecords(year: number, team?: string): Promise<CFBDTeamRecord[]> {
  const params: Record<string, string> = { year: String(year) };
  if (team) params.team = team;
  return cfbdFetch<CFBDTeamRecord[]>('/records', params);
}

// ─────────────────────────────────────────────────────────────
// Player Stats
// ─────────────────────────────────────────────────────────────

export interface CFBDPlayerStat {
  playerId: number;
  player: string;
  team: string;
  conference: string;
  category: string;
  statType: string;
  stat: number;
}

export async function getPlayerSeasonStats(year: number, options?: {
  team?: string;
  conference?: string;
  category?: string;
  startWeek?: number;
  endWeek?: number;
}): Promise<CFBDPlayerStat[]> {
  const params: Record<string, string> = { year: String(year) };
  if (options?.team) params.team = options.team;
  if (options?.conference) params.conference = options.conference;
  if (options?.category) params.category = options.category;
  if (options?.startWeek) params.startWeek = String(options.startWeek);
  if (options?.endWeek) params.endWeek = String(options.endWeek);
  return cfbdFetch<CFBDPlayerStat[]>('/stats/player/season', params);
}

// ─────────────────────────────────────────────────────────────
// Recruiting
// ─────────────────────────────────────────────────────────────

export interface CFBDRecruit {
  id: number;
  athleteId?: number;
  recruitType: string;
  year: number;
  ranking: number;
  name: string;
  school?: string;
  committedTo?: string;
  position: string;
  height?: number;
  weight?: number;
  stars: number;
  rating: number;
  city?: string;
  stateProvince?: string;
  country?: string;
  hometownInfo?: {
    latitude?: number;
    longitude?: number;
    fipsCode?: string;
  };
}

export async function getRecruits(year: number, options?: {
  classification?: string; // HighSchool, JUCO, PrepSchool
  team?: string;
  position?: string;
  state?: string;
}): Promise<CFBDRecruit[]> {
  const params: Record<string, string> = { year: String(year) };
  if (options?.classification) params.classification = options.classification;
  if (options?.team) params.team = options.team;
  if (options?.position) params.position = options.position;
  if (options?.state) params.state = options.state;
  return cfbdFetch<CFBDRecruit[]>('/recruiting/players', params);
}

export interface CFBDTeamRecruitingRank {
  year: number;
  rank: number;
  team: string;
  points: number;
}

export async function getTeamRecruitingRanks(year: number, team?: string): Promise<CFBDTeamRecruitingRank[]> {
  const params: Record<string, string> = { year: String(year) };
  if (team) params.team = team;
  return cfbdFetch<CFBDTeamRecruitingRank[]>('/recruiting/teams', params);
}

// ─────────────────────────────────────────────────────────────
// NFL Draft
// ─────────────────────────────────────────────────────────────

export interface CFBDDraftPick {
  collegeAthleteId?: number;
  nflAthleteId?: number;
  collegeId: number;
  collegeTeam: string;
  collegeConference?: string;
  nflTeam: string;
  year: number;
  overall: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  height?: number;
  weight?: number;
  preDraftRanking?: number;
  preDraftPositionRanking?: number;
  preDraftGrade?: number;
}

export async function getDraftPicks(year: number, options?: {
  nflTeam?: string;
  college?: string;
  conference?: string;
  position?: string;
}): Promise<CFBDDraftPick[]> {
  const params: Record<string, string> = { year: String(year) };
  if (options?.nflTeam) params.nflTeam = options.nflTeam;
  if (options?.college) params.college = options.college;
  if (options?.conference) params.conference = options.conference;
  if (options?.position) params.position = options.position;
  return cfbdFetch<CFBDDraftPick[]>('/draft/picks', params);
}

// ─────────────────────────────────────────────────────────────
// Transfer Portal
// ─────────────────────────────────────────────────────────────

export interface CFBDTransferPortalEntry {
  firstName: string;
  lastName: string;
  position: string;
  origin: string;
  destination?: string;
  transferDate: string;
  rating?: number;
  stars?: number;
  eligibility?: string;
}

export async function getTransferPortal(year: number): Promise<CFBDTransferPortalEntry[]> {
  return cfbdFetch<CFBDTransferPortalEntry[]>('/player/portal', { year: String(year) });
}

// ─────────────────────────────────────────────────────────────
// Rankings / Polls
// ─────────────────────────────────────────────────────────────

export interface CFBDRanking {
  season: number;
  seasonType: string;
  week: number;
  polls: Array<{
    poll: string;
    ranks: Array<{
      rank: number;
      school: string;
      conference: string;
      firstPlaceVotes?: number;
      points: number;
    }>;
  }>;
}

export async function getRankings(year: number, week?: number): Promise<CFBDRanking[]> {
  const params: Record<string, string> = { year: String(year) };
  if (week) params.week = String(week);
  return cfbdFetch<CFBDRanking[]>('/rankings', params);
}

// ─────────────────────────────────────────────────────────────
// Convenience: Bulk historical fetch
// ─────────────────────────────────────────────────────────────

/**
 * Fetch team records for multiple seasons.
 * Respects CFBD rate limits by spacing requests.
 */
export async function getHistoricalRecords(
  team: string,
  startYear: number,
  endYear: number
): Promise<CFBDTeamRecord[]> {
  const records: CFBDTeamRecord[] = [];
  for (let year = startYear; year <= endYear; year++) {
    try {
      const yearRecords = await getTeamRecords(year, team);
      records.push(...yearRecords);
    } catch (err) {
      console.warn(`[CFBD] Failed to fetch ${team} ${year}:`, err);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  return records;
}

/**
 * Fetch draft picks for multiple years.
 */
export async function getHistoricalDraftPicks(
  startYear: number,
  endYear: number,
  college?: string
): Promise<CFBDDraftPick[]> {
  const picks: CFBDDraftPick[] = [];
  for (let year = startYear; year <= endYear; year++) {
    try {
      const yearPicks = await getDraftPicks(year, { college });
      picks.push(...yearPicks);
    } catch (err) {
      console.warn(`[CFBD] Failed to fetch draft ${year}:`, err);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return picks;
}
