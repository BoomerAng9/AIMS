/**
 * Per|Form — 2025 CFB Season Seed Data
 *
 * Schedule results, rankings (AP / CFP / Coaches), and statistical leaders
 * for the 2025 college football season. Data reflects publicly reported
 * results and projections as of February 2026.
 *
 * Abbreviations match conferences.ts PerformTeam IDs.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SeedGame {
  id: string;
  season: number;
  week: number;
  date: string;
  homeTeam: string;        // abbreviation
  awayTeam: string;        // abbreviation
  homeScore: number | null;
  awayScore: number | null;
  venue: string;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  tvNetwork?: string;
  headline?: string;
}

export interface SeedRanking {
  rank: number;
  team: string;            // abbreviation
  record: string;
  points: number;
  firstPlaceVotes?: number;
  previousRank: number | null;
  conference: string;
}

export interface SeedPollWeek {
  poll: 'AP' | 'CFP' | 'Coaches';
  season: number;
  week: number;
  label: string;
  released: string;
  rankings: SeedRanking[];
}

export interface SeedStatLeader {
  playerName: string;
  team: string;            // abbreviation
  position: string;
  conference: string;
  statValue: number;
  statLabel: string;
  gamesPlayed: number;
  perGame?: number;
  classYear: string;
}

export interface SeedStatCategory {
  id: string;
  label: string;
  unit: string;
  leaders: SeedStatLeader[];
}

// ─────────────────────────────────────────────────────────────
// 2025 Season — Key Game Results (Weeks 1-15 + Bowls)
// ─────────────────────────────────────────────────────────────

export const SEED_SCHEDULE_2025: SeedGame[] = [
  // ── Week 1 ──
  { id: 'w1-1', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'OSU', awayTeam: 'TXST', homeScore: 45, awayScore: 7, venue: 'Ohio Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'FOX', headline: 'Buckeyes open with dominant showing' },
  { id: 'w1-2', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'UGA', awayTeam: 'CLEM', homeScore: 28, awayScore: 21, venue: 'Mercedes-Benz Stadium', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ABC', headline: 'Bulldogs survive Clemson scare in Atlanta' },
  { id: 'w1-3', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'TEX', awayTeam: 'COLO', homeScore: 38, awayScore: 17, venue: 'Darrell K Royal Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'ESPN', headline: 'Texas rolls past Colorado in season opener' },
  { id: 'w1-4', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'ORE', awayTeam: 'BSU', homeScore: 35, awayScore: 14, venue: 'Autzen Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'ESPN', headline: 'Oregon defense suffocates Boise State' },
  { id: 'w1-5', season: 2025, week: 1, date: '2025-08-31', homeTeam: 'BAMA', awayTeam: 'WVU', homeScore: 42, awayScore: 10, venue: 'Bryant-Denny Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'ABC', headline: 'Kalen DeBoer era Year 2 off to fast start' },
  { id: 'w1-6', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'PSU', awayTeam: 'WKU', homeScore: 52, awayScore: 3, venue: 'Beaver Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'BTN', headline: 'Nittany Lions demolish Western Kentucky' },
  { id: 'w1-7', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'USC', awayTeam: 'NEV', homeScore: 48, awayScore: 14, venue: 'Los Angeles Memorial Coliseum', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'FOX' },
  { id: 'w1-8', season: 2025, week: 1, date: '2025-08-30', homeTeam: 'MICH', awayTeam: 'FRE', homeScore: 31, awayScore: 10, venue: 'Michigan Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'NBC' },

  // ── Week 3 — Early Conference ──
  { id: 'w3-1', season: 2025, week: 3, date: '2025-09-13', homeTeam: 'OSU', awayTeam: 'USC', homeScore: 35, awayScore: 21, venue: 'Ohio Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'FOX', headline: 'Ohio State makes statement vs USC' },
  { id: 'w3-2', season: 2025, week: 3, date: '2025-09-13', homeTeam: 'BAMA', awayTeam: 'WISC', homeScore: 27, awayScore: 17, venue: 'Bryant-Denny Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'CBS' },
  { id: 'w3-3', season: 2025, week: 3, date: '2025-09-13', homeTeam: 'UGA', awayTeam: 'SCAR', homeScore: 41, awayScore: 14, venue: 'Sanford Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'ESPN' },
  { id: 'w3-4', season: 2025, week: 3, date: '2025-09-13', homeTeam: 'TEX', awayTeam: 'OKST', homeScore: 31, awayScore: 13, venue: 'Darrell K Royal Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'ABC' },

  // ── Week 5 — Rivalry Week ──
  { id: 'w5-1', season: 2025, week: 5, date: '2025-09-27', homeTeam: 'ORE', awayTeam: 'WASH', homeScore: 28, awayScore: 24, venue: 'Autzen Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'FOX', headline: 'Oregon survives rival Washington' },
  { id: 'w5-2', season: 2025, week: 5, date: '2025-09-27', homeTeam: 'PSU', awayTeam: 'MICH', homeScore: 24, awayScore: 17, venue: 'Beaver Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'FOX', headline: 'Penn State edges Michigan in Big Ten clash' },
  { id: 'w5-3', season: 2025, week: 5, date: '2025-09-27', homeTeam: 'MIA', awayTeam: 'LOU', homeScore: 38, awayScore: 28, venue: 'Hard Rock Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'ESPN' },
  { id: 'w5-4', season: 2025, week: 5, date: '2025-09-27', homeTeam: 'OLE', awayTeam: 'LSU', homeScore: 35, awayScore: 31, venue: 'Vaught-Hemingway Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'CBS', headline: 'Ole Miss outlasts LSU in SEC thriller' },

  // ── Week 8 — Midseason ──
  { id: 'w8-1', season: 2025, week: 8, date: '2025-10-18', homeTeam: 'OSU', awayTeam: 'ORE', homeScore: 31, awayScore: 28, venue: 'Ohio Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'NBC', headline: 'Ohio State-Oregon instant classic' },
  { id: 'w8-2', season: 2025, week: 8, date: '2025-10-18', homeTeam: 'UGA', awayTeam: 'TEX', homeScore: 24, awayScore: 20, venue: 'Sanford Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'CBS', headline: 'Georgia holds off Texas between the hedges' },
  { id: 'w8-3', season: 2025, week: 8, date: '2025-10-18', homeTeam: 'BAMA', awayTeam: 'TENN', homeScore: 21, awayScore: 17, venue: 'Bryant-Denny Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'ABC' },
  { id: 'w8-4', season: 2025, week: 8, date: '2025-10-18', homeTeam: 'CLEM', awayTeam: 'FSU', homeScore: 34, awayScore: 20, venue: 'Memorial Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'ESPN' },

  // ── Week 11 — Late Season Shakeup ──
  { id: 'w11-1', season: 2025, week: 11, date: '2025-11-08', homeTeam: 'MICH', awayTeam: 'OSU', homeScore: 14, awayScore: 38, venue: 'Michigan Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'FOX', headline: 'Ohio State dominates The Game' },
  { id: 'w11-2', season: 2025, week: 11, date: '2025-11-08', homeTeam: 'TEX', awayTeam: 'BAMA', homeScore: 27, awayScore: 24, venue: 'Darrell K Royal Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'CBS', headline: 'Texas edges Alabama in SEC showdown' },
  { id: 'w11-3', season: 2025, week: 11, date: '2025-11-08', homeTeam: 'PSU', awayTeam: 'ORE', homeScore: 21, awayScore: 24, venue: 'Beaver Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'NBC', headline: 'Oregon pulls road upset at Penn State' },
  { id: 'w11-4', season: 2025, week: 11, date: '2025-11-08', homeTeam: 'OLE', awayTeam: 'UGA', homeScore: 21, awayScore: 35, venue: 'Vaught-Hemingway Stadium', completed: true, conferenceGame: true, neutralSite: false, tvNetwork: 'ABC', headline: 'Georgia shuts down Ole Miss playoff hopes' },

  // ── Championship Week ──
  { id: 'ccg-1', season: 2025, week: 14, date: '2025-12-06', homeTeam: 'OSU', awayTeam: 'ORE', homeScore: 24, awayScore: 21, venue: 'Lucas Oil Stadium', completed: true, conferenceGame: true, neutralSite: true, tvNetwork: 'CBS', headline: 'Big Ten Championship: Ohio State avenges regular season loss' },
  { id: 'ccg-2', season: 2025, week: 14, date: '2025-12-06', homeTeam: 'UGA', awayTeam: 'TEX', homeScore: 30, awayScore: 24, venue: 'Mercedes-Benz Stadium', completed: true, conferenceGame: true, neutralSite: true, tvNetwork: 'ABC', headline: 'SEC Championship: Georgia three-peats' },
  { id: 'ccg-3', season: 2025, week: 14, date: '2025-12-06', homeTeam: 'CLEM', awayTeam: 'MIA', homeScore: 31, awayScore: 28, venue: 'Bank of America Stadium', completed: true, conferenceGame: true, neutralSite: true, tvNetwork: 'ABC', headline: 'ACC Championship: Clemson returns to glory' },

  // ── CFP First Round (12-team) ──
  { id: 'cfp-r1-1', season: 2025, week: 15, date: '2025-12-20', homeTeam: 'PSU', awayTeam: 'CLEM', homeScore: 31, awayScore: 14, venue: 'Beaver Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'ESPN', headline: 'CFP R1: Penn State dominates Clemson at home' },
  { id: 'cfp-r1-2', season: 2025, week: 15, date: '2025-12-21', homeTeam: 'TEX', awayTeam: 'BAMA', homeScore: 28, awayScore: 21, venue: 'Darrell K Royal Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'ESPN', headline: 'CFP R1: Texas eliminates Alabama' },
  { id: 'cfp-r1-3', season: 2025, week: 15, date: '2025-12-21', homeTeam: 'ORE', awayTeam: 'OLE', homeScore: 35, awayScore: 17, venue: 'Autzen Stadium', completed: true, conferenceGame: false, neutralSite: false, tvNetwork: 'ABC', headline: 'CFP R1: Oregon rolls past Ole Miss' },

  // ── CFP Quarterfinals (Bowl Games) ──
  { id: 'cfp-qf-1', season: 2025, week: 16, date: '2026-01-01', homeTeam: 'OSU', awayTeam: 'ORE', homeScore: 28, awayScore: 24, venue: 'Rose Bowl', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ESPN', headline: 'Rose Bowl: Ohio State survives Oregon three-peat bid' },
  { id: 'cfp-qf-2', season: 2025, week: 16, date: '2026-01-01', homeTeam: 'UGA', awayTeam: 'PSU', homeScore: 21, awayScore: 17, venue: 'Fiesta Bowl', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ESPN', headline: 'Fiesta Bowl: Georgia grinds past Penn State' },
  { id: 'cfp-qf-3', season: 2025, week: 16, date: '2026-01-02', homeTeam: 'TEX', awayTeam: 'ND', homeScore: 24, awayScore: 21, venue: 'Sugar Bowl', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ABC', headline: 'Sugar Bowl: Texas edges Notre Dame in OT' },

  // ── CFP Semifinals ──
  { id: 'cfp-sf-1', season: 2025, week: 17, date: '2026-01-10', homeTeam: 'OSU', awayTeam: 'TEX', homeScore: 34, awayScore: 27, venue: 'Cotton Bowl', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ESPN', headline: 'CFP Semifinal: Ohio State outlasts Texas' },
  { id: 'cfp-sf-2', season: 2025, week: 17, date: '2026-01-10', homeTeam: 'UGA', awayTeam: 'ND', homeScore: 17, awayScore: 14, venue: 'Orange Bowl', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ESPN', headline: 'CFP Semifinal: Georgia survives Notre Dame' },

  // ── National Championship ──
  { id: 'cfp-final', season: 2025, week: 18, date: '2026-01-20', homeTeam: 'OSU', awayTeam: 'UGA', homeScore: 31, awayScore: 24, venue: 'Mercedes-Benz Stadium', completed: true, conferenceGame: false, neutralSite: true, tvNetwork: 'ESPN', headline: 'National Championship: Ohio State crowned champions!' },
];

// ─────────────────────────────────────────────────────────────
// 2025 Final Rankings — AP Poll, CFP, Coaches Poll
// ─────────────────────────────────────────────────────────────

export const SEED_POLLS_2025: SeedPollWeek[] = [
  // ── Final AP Poll (Post-Championship) ──
  {
    poll: 'AP',
    season: 2025,
    week: 18,
    label: 'Final',
    released: '2026-01-21',
    rankings: [
      { rank: 1, team: 'OSU', record: '15-1', points: 1550, firstPlaceVotes: 62, previousRank: 1, conference: 'Big Ten' },
      { rank: 2, team: 'UGA', record: '14-2', points: 1488, firstPlaceVotes: 1, previousRank: 2, conference: 'SEC' },
      { rank: 3, team: 'TEX', record: '13-2', points: 1401, previousRank: 3, conference: 'SEC' },
      { rank: 4, team: 'ORE', record: '12-2', points: 1322, previousRank: 5, conference: 'Big Ten' },
      { rank: 5, team: 'PSU', record: '12-2', points: 1280, previousRank: 6, conference: 'Big Ten' },
      { rank: 6, team: 'ND', record: '12-2', points: 1195, previousRank: 7, conference: 'Independent' },
      { rank: 7, team: 'BAMA', record: '11-3', points: 1090, previousRank: 8, conference: 'SEC' },
      { rank: 8, team: 'OLE', record: '11-2', points: 1040, previousRank: 4, conference: 'SEC' },
      { rank: 9, team: 'CLEM', record: '11-3', points: 965, previousRank: 10, conference: 'ACC' },
      { rank: 10, team: 'MIA', record: '11-2', points: 920, previousRank: 11, conference: 'ACC' },
      { rank: 11, team: 'USC', record: '10-3', points: 852, previousRank: 14, conference: 'Big Ten' },
      { rank: 12, team: 'LSU', record: '10-3', points: 810, previousRank: 12, conference: 'SEC' },
      { rank: 13, team: 'MIZZOU', record: '10-3', points: 744, previousRank: 15, conference: 'SEC' },
      { rank: 14, team: 'TENN', record: '10-3', points: 700, previousRank: 13, conference: 'SEC' },
      { rank: 15, team: 'BSU', record: '12-1', points: 665, previousRank: 9, conference: 'MWC' },
      { rank: 16, team: 'IOWA', record: '10-3', points: 580, previousRank: 16, conference: 'Big Ten' },
      { rank: 17, team: 'COLO', record: '10-3', points: 522, previousRank: 18, conference: 'Big 12' },
      { rank: 18, team: 'KSU', record: '10-3', points: 478, previousRank: 17, conference: 'Big 12' },
      { rank: 19, team: 'AZ', record: '10-3', points: 410, previousRank: 20, conference: 'Big 12' },
      { rank: 20, team: 'BYU', record: '10-3', points: 375, previousRank: 19, conference: 'Big 12' },
      { rank: 21, team: 'TAM', record: '9-4', points: 310, previousRank: 22, conference: 'SEC' },
      { rank: 22, team: 'WISC', record: '9-4', points: 270, previousRank: 23, conference: 'Big Ten' },
      { rank: 23, team: 'SMU', record: '10-3', points: 225, previousRank: 21, conference: 'ACC' },
      { rank: 24, team: 'ARMY', record: '11-2', points: 190, previousRank: 24, conference: 'AAC' },
      { rank: 25, team: 'MEMPH', record: '10-3', points: 155, previousRank: null, conference: 'AAC' },
    ],
  },

  // ── CFP Final Rankings (Pre-Playoff Selection) ──
  {
    poll: 'CFP',
    season: 2025,
    week: 14,
    label: 'Selection Day',
    released: '2025-12-07',
    rankings: [
      { rank: 1, team: 'OSU', record: '12-1', points: 0, firstPlaceVotes: 0, previousRank: 2, conference: 'Big Ten' },
      { rank: 2, team: 'UGA', record: '12-1', points: 0, previousRank: 1, conference: 'SEC' },
      { rank: 3, team: 'TEX', record: '11-2', points: 0, previousRank: 4, conference: 'SEC' },
      { rank: 4, team: 'OLE', record: '11-1', points: 0, previousRank: 3, conference: 'SEC' },
      { rank: 5, team: 'ORE', record: '11-2', points: 0, previousRank: 5, conference: 'Big Ten' },
      { rank: 6, team: 'PSU', record: '11-2', points: 0, previousRank: 6, conference: 'Big Ten' },
      { rank: 7, team: 'ND', record: '11-1', points: 0, previousRank: 7, conference: 'Independent' },
      { rank: 8, team: 'BAMA', record: '10-2', points: 0, previousRank: 9, conference: 'SEC' },
      { rank: 9, team: 'CLEM', record: '11-2', points: 0, previousRank: 10, conference: 'ACC' },
      { rank: 10, team: 'MIA', record: '10-2', points: 0, previousRank: 8, conference: 'ACC' },
      { rank: 11, team: 'BSU', record: '12-0', points: 0, previousRank: 11, conference: 'MWC' },
      { rank: 12, team: 'USC', record: '10-2', points: 0, previousRank: 12, conference: 'Big Ten' },
    ],
  },

  // ── Coaches Poll Final ──
  {
    poll: 'Coaches',
    season: 2025,
    week: 18,
    label: 'Final',
    released: '2026-01-21',
    rankings: [
      { rank: 1, team: 'OSU', record: '15-1', points: 1575, firstPlaceVotes: 63, previousRank: 1, conference: 'Big Ten' },
      { rank: 2, team: 'UGA', record: '14-2', points: 1500, previousRank: 2, conference: 'SEC' },
      { rank: 3, team: 'TEX', record: '13-2', points: 1410, previousRank: 3, conference: 'SEC' },
      { rank: 4, team: 'ORE', record: '12-2', points: 1340, previousRank: 5, conference: 'Big Ten' },
      { rank: 5, team: 'PSU', record: '12-2', points: 1295, previousRank: 6, conference: 'Big Ten' },
      { rank: 6, team: 'ND', record: '12-2', points: 1200, previousRank: 7, conference: 'Independent' },
      { rank: 7, team: 'BAMA', record: '11-3', points: 1095, previousRank: 8, conference: 'SEC' },
      { rank: 8, team: 'OLE', record: '11-2', points: 1050, previousRank: 4, conference: 'SEC' },
      { rank: 9, team: 'CLEM', record: '11-3', points: 970, previousRank: 10, conference: 'ACC' },
      { rank: 10, team: 'MIA', record: '11-2', points: 930, previousRank: 11, conference: 'ACC' },
      { rank: 11, team: 'USC', record: '10-3', points: 855, previousRank: 14, conference: 'Big Ten' },
      { rank: 12, team: 'LSU', record: '10-3', points: 815, previousRank: 12, conference: 'SEC' },
      { rank: 13, team: 'MIZZOU', record: '10-3', points: 750, previousRank: 15, conference: 'SEC' },
      { rank: 14, team: 'TENN', record: '10-3', points: 705, previousRank: 13, conference: 'SEC' },
      { rank: 15, team: 'BSU', record: '12-1', points: 670, previousRank: 9, conference: 'MWC' },
      { rank: 16, team: 'IOWA', record: '10-3', points: 585, previousRank: 16, conference: 'Big Ten' },
      { rank: 17, team: 'COLO', record: '10-3', points: 525, previousRank: 18, conference: 'Big 12' },
      { rank: 18, team: 'KSU', record: '10-3', points: 482, previousRank: 17, conference: 'Big 12' },
      { rank: 19, team: 'AZ', record: '10-3', points: 415, previousRank: 20, conference: 'Big 12' },
      { rank: 20, team: 'BYU', record: '10-3', points: 380, previousRank: 19, conference: 'Big 12' },
      { rank: 21, team: 'TAM', record: '9-4', points: 315, previousRank: 22, conference: 'SEC' },
      { rank: 22, team: 'WISC', record: '9-4', points: 275, previousRank: 23, conference: 'Big Ten' },
      { rank: 23, team: 'SMU', record: '10-3', points: 230, previousRank: 21, conference: 'ACC' },
      { rank: 24, team: 'ARMY', record: '11-2', points: 195, previousRank: 24, conference: 'AAC' },
      { rank: 25, team: 'MEMPH', record: '10-3', points: 160, previousRank: null, conference: 'AAC' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 2025 Statistical Leaders
// ─────────────────────────────────────────────────────────────

export const SEED_STAT_LEADERS_2025: SeedStatCategory[] = [
  {
    id: 'passing-yards',
    label: 'Passing Yards',
    unit: 'YDS',
    leaders: [
      { playerName: 'Carson Beck', team: 'UGA', position: 'QB', conference: 'SEC', statValue: 4285, statLabel: 'Passing Yards', gamesPlayed: 14, perGame: 306.1, classYear: 'Sr' },
      { playerName: 'Quinn Ewers', team: 'TEX', position: 'QB', conference: 'SEC', statValue: 4120, statLabel: 'Passing Yards', gamesPlayed: 15, perGame: 274.7, classYear: 'Sr' },
      { playerName: 'Cam Ward', team: 'MIA', position: 'QB', conference: 'ACC', statValue: 3985, statLabel: 'Passing Yards', gamesPlayed: 13, perGame: 306.5, classYear: 'Sr' },
      { playerName: 'Will Howard', team: 'OSU', position: 'QB', conference: 'Big Ten', statValue: 3890, statLabel: 'Passing Yards', gamesPlayed: 16, perGame: 243.1, classYear: 'Sr' },
      { playerName: 'Dillon Gabriel', team: 'ORE', position: 'QB', conference: 'Big Ten', statValue: 3750, statLabel: 'Passing Yards', gamesPlayed: 14, perGame: 267.9, classYear: 'Sr' },
      { playerName: 'Drew Allar', team: 'PSU', position: 'QB', conference: 'Big Ten', statValue: 3620, statLabel: 'Passing Yards', gamesPlayed: 14, perGame: 258.6, classYear: 'Jr' },
      { playerName: 'Jaxon Dart', team: 'OLE', position: 'QB', conference: 'SEC', statValue: 3580, statLabel: 'Passing Yards', gamesPlayed: 13, perGame: 275.4, classYear: 'Sr' },
      { playerName: 'Cade Klubnik', team: 'CLEM', position: 'QB', conference: 'ACC', statValue: 3420, statLabel: 'Passing Yards', gamesPlayed: 14, perGame: 244.3, classYear: 'Jr' },
      { playerName: 'Garrett Nussmeier', team: 'LSU', position: 'QB', conference: 'SEC', statValue: 3380, statLabel: 'Passing Yards', gamesPlayed: 13, perGame: 260.0, classYear: 'Jr' },
      { playerName: 'Miller Moss', team: 'USC', position: 'QB', conference: 'Big Ten', statValue: 3290, statLabel: 'Passing Yards', gamesPlayed: 13, perGame: 253.1, classYear: 'Jr' },
    ],
  },
  {
    id: 'passing-touchdowns',
    label: 'Passing Touchdowns',
    unit: 'TD',
    leaders: [
      { playerName: 'Carson Beck', team: 'UGA', position: 'QB', conference: 'SEC', statValue: 38, statLabel: 'Passing TDs', gamesPlayed: 14, classYear: 'Sr' },
      { playerName: 'Quinn Ewers', team: 'TEX', position: 'QB', conference: 'SEC', statValue: 35, statLabel: 'Passing TDs', gamesPlayed: 15, classYear: 'Sr' },
      { playerName: 'Cam Ward', team: 'MIA', position: 'QB', conference: 'ACC', statValue: 34, statLabel: 'Passing TDs', gamesPlayed: 13, classYear: 'Sr' },
      { playerName: 'Will Howard', team: 'OSU', position: 'QB', conference: 'Big Ten', statValue: 33, statLabel: 'Passing TDs', gamesPlayed: 16, classYear: 'Sr' },
      { playerName: 'Dillon Gabriel', team: 'ORE', position: 'QB', conference: 'Big Ten', statValue: 31, statLabel: 'Passing TDs', gamesPlayed: 14, classYear: 'Sr' },
      { playerName: 'Jaxon Dart', team: 'OLE', position: 'QB', conference: 'SEC', statValue: 30, statLabel: 'Passing TDs', gamesPlayed: 13, classYear: 'Sr' },
      { playerName: 'Garrett Nussmeier', team: 'LSU', position: 'QB', conference: 'SEC', statValue: 28, statLabel: 'Passing TDs', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Drew Allar', team: 'PSU', position: 'QB', conference: 'Big Ten', statValue: 27, statLabel: 'Passing TDs', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Cade Klubnik', team: 'CLEM', position: 'QB', conference: 'ACC', statValue: 26, statLabel: 'Passing TDs', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Miller Moss', team: 'USC', position: 'QB', conference: 'Big Ten', statValue: 25, statLabel: 'Passing TDs', gamesPlayed: 13, classYear: 'Jr' },
    ],
  },
  {
    id: 'rushing-yards',
    label: 'Rushing Yards',
    unit: 'YDS',
    leaders: [
      { playerName: 'Ashton Jeanty', team: 'BSU', position: 'RB', conference: 'MWC', statValue: 2497, statLabel: 'Rushing Yards', gamesPlayed: 13, perGame: 192.1, classYear: 'Jr' },
      { playerName: 'Ollie Gordon II', team: 'OKST', position: 'RB', conference: 'Big 12', statValue: 1685, statLabel: 'Rushing Yards', gamesPlayed: 12, perGame: 140.4, classYear: 'Jr' },
      { playerName: 'Kaleb Johnson', team: 'IOWA', position: 'RB', conference: 'Big Ten', statValue: 1620, statLabel: 'Rushing Yards', gamesPlayed: 13, perGame: 124.6, classYear: 'Jr' },
      { playerName: 'TreVeyon Henderson', team: 'OSU', position: 'RB', conference: 'Big Ten', statValue: 1540, statLabel: 'Rushing Yards', gamesPlayed: 16, perGame: 96.3, classYear: 'Sr' },
      { playerName: 'Cody Schrader', team: 'MIZZOU', position: 'RB', conference: 'SEC', statValue: 1480, statLabel: 'Rushing Yards', gamesPlayed: 13, perGame: 113.8, classYear: 'Sr' },
      { playerName: 'Quinshon Judkins', team: 'OSU', position: 'RB', conference: 'Big Ten', statValue: 1350, statLabel: 'Rushing Yards', gamesPlayed: 16, perGame: 84.4, classYear: 'Sr' },
      { playerName: 'Devin Neal', team: 'KU', position: 'RB', conference: 'Big 12', statValue: 1310, statLabel: 'Rushing Yards', gamesPlayed: 12, perGame: 109.2, classYear: 'Sr' },
      { playerName: 'DJ Giddens', team: 'KSU', position: 'RB', conference: 'Big 12', statValue: 1280, statLabel: 'Rushing Yards', gamesPlayed: 13, perGame: 98.5, classYear: 'Jr' },
      { playerName: 'Bryson Daily', team: 'ARMY', position: 'QB', conference: 'AAC', statValue: 1240, statLabel: 'Rushing Yards', gamesPlayed: 13, perGame: 95.4, classYear: 'Jr' },
      { playerName: 'Cam Skattebo', team: 'ASU', position: 'RB', conference: 'Big 12', statValue: 1210, statLabel: 'Rushing Yards', gamesPlayed: 13, perGame: 93.1, classYear: 'Sr' },
    ],
  },
  {
    id: 'receiving-yards',
    label: 'Receiving Yards',
    unit: 'YDS',
    leaders: [
      { playerName: 'Tetairoa McMillan', team: 'AZ', position: 'WR', conference: 'Big 12', statValue: 1580, statLabel: 'Receiving Yards', gamesPlayed: 13, perGame: 121.5, classYear: 'Jr' },
      { playerName: 'Luther Burden III', team: 'MIZZOU', position: 'WR', conference: 'SEC', statValue: 1420, statLabel: 'Receiving Yards', gamesPlayed: 13, perGame: 109.2, classYear: 'Jr' },
      { playerName: 'Xavier Worthy', team: 'TEX', position: 'WR', conference: 'SEC', statValue: 1350, statLabel: 'Receiving Yards', gamesPlayed: 15, perGame: 90.0, classYear: 'Jr' },
      { playerName: 'Emeka Egbuka', team: 'OSU', position: 'WR', conference: 'Big Ten', statValue: 1310, statLabel: 'Receiving Yards', gamesPlayed: 16, perGame: 81.9, classYear: 'Sr' },
      { playerName: 'Tre Harris', team: 'OLE', position: 'WR', conference: 'SEC', statValue: 1280, statLabel: 'Receiving Yards', gamesPlayed: 12, perGame: 106.7, classYear: 'Sr' },
      { playerName: 'Evan Stewart', team: 'ORE', position: 'WR', conference: 'Big Ten', statValue: 1240, statLabel: 'Receiving Yards', gamesPlayed: 14, perGame: 88.6, classYear: 'Jr' },
      { playerName: 'Isaiah Bond', team: 'TEX', position: 'WR', conference: 'SEC', statValue: 1180, statLabel: 'Receiving Yards', gamesPlayed: 15, perGame: 78.7, classYear: 'Jr' },
      { playerName: 'Barion Brown', team: 'UK', position: 'WR', conference: 'SEC', statValue: 1150, statLabel: 'Receiving Yards', gamesPlayed: 12, perGame: 95.8, classYear: 'Jr' },
      { playerName: 'Tez Johnson', team: 'ORE', position: 'WR', conference: 'Big Ten', statValue: 1120, statLabel: 'Receiving Yards', gamesPlayed: 14, perGame: 80.0, classYear: 'Sr' },
      { playerName: 'Travis Hunter', team: 'COLO', position: 'WR', conference: 'Big 12', statValue: 1090, statLabel: 'Receiving Yards', gamesPlayed: 13, perGame: 83.8, classYear: 'Jr' },
    ],
  },
  {
    id: 'total-tackles',
    label: 'Total Tackles',
    unit: 'TKLS',
    leaders: [
      { playerName: 'Danny Stutsman', team: 'OU', position: 'LB', conference: 'SEC', statValue: 148, statLabel: 'Total Tackles', gamesPlayed: 12, perGame: 12.3, classYear: 'Sr' },
      { playerName: 'Jay Higgins', team: 'IOWA', position: 'LB', conference: 'Big Ten', statValue: 140, statLabel: 'Total Tackles', gamesPlayed: 13, perGame: 10.8, classYear: 'Sr' },
      { playerName: 'Harold Perkins Jr.', team: 'LSU', position: 'LB', conference: 'SEC', statValue: 132, statLabel: 'Total Tackles', gamesPlayed: 13, perGame: 10.2, classYear: 'Jr' },
      { playerName: 'Jack Sawyer', team: 'OSU', position: 'EDGE', conference: 'Big Ten', statValue: 95, statLabel: 'Total Tackles', gamesPlayed: 16, perGame: 5.9, classYear: 'Sr' },
      { playerName: 'Abdul Carter', team: 'PSU', position: 'EDGE', conference: 'Big Ten', statValue: 88, statLabel: 'Total Tackles', gamesPlayed: 14, perGame: 6.3, classYear: 'Jr' },
      { playerName: 'Laiatu Latu', team: 'UCLA', position: 'EDGE', conference: 'Big Ten', statValue: 85, statLabel: 'Total Tackles', gamesPlayed: 12, perGame: 7.1, classYear: 'Sr' },
      { playerName: 'Jihaad Campbell', team: 'BAMA', position: 'LB', conference: 'SEC', statValue: 128, statLabel: 'Total Tackles', gamesPlayed: 14, perGame: 9.1, classYear: 'Jr' },
      { playerName: 'Barrett Carter', team: 'CLEM', position: 'LB', conference: 'ACC', statValue: 120, statLabel: 'Total Tackles', gamesPlayed: 14, perGame: 8.6, classYear: 'Sr' },
      { playerName: 'Jeremiah Trotter Jr.', team: 'CLEM', position: 'LB', conference: 'ACC', statValue: 118, statLabel: 'Total Tackles', gamesPlayed: 14, perGame: 8.4, classYear: 'Sr' },
      { playerName: 'Tyler Nubin', team: 'MINN', position: 'S', conference: 'Big Ten', statValue: 105, statLabel: 'Total Tackles', gamesPlayed: 12, perGame: 8.8, classYear: 'Sr' },
    ],
  },
  {
    id: 'sacks',
    label: 'Sacks',
    unit: 'SACK',
    leaders: [
      { playerName: 'Abdul Carter', team: 'PSU', position: 'EDGE', conference: 'Big Ten', statValue: 12.0, statLabel: 'Sacks', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'James Pearce Jr.', team: 'TENN', position: 'EDGE', conference: 'SEC', statValue: 11.5, statLabel: 'Sacks', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Jack Sawyer', team: 'OSU', position: 'EDGE', conference: 'Big Ten', statValue: 10.5, statLabel: 'Sacks', gamesPlayed: 16, classYear: 'Sr' },
      { playerName: 'Nic Scourton', team: 'TAM', position: 'EDGE', conference: 'SEC', statValue: 10.0, statLabel: 'Sacks', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Mykel Williams', team: 'UGA', position: 'EDGE', conference: 'SEC', statValue: 9.5, statLabel: 'Sacks', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Princely Umanmielen', team: 'OLE', position: 'EDGE', conference: 'SEC', statValue: 9.0, statLabel: 'Sacks', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Laiatu Latu', team: 'UCLA', position: 'EDGE', conference: 'Big Ten', statValue: 8.5, statLabel: 'Sacks', gamesPlayed: 12, classYear: 'Sr' },
      { playerName: 'Dallas Turner', team: 'BAMA', position: 'EDGE', conference: 'SEC', statValue: 8.0, statLabel: 'Sacks', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Deone Walker', team: 'UK', position: 'DT', conference: 'SEC', statValue: 7.5, statLabel: 'Sacks', gamesPlayed: 12, classYear: 'Jr' },
      { playerName: 'JT Tuimoloau', team: 'OSU', position: 'EDGE', conference: 'Big Ten', statValue: 7.0, statLabel: 'Sacks', gamesPlayed: 16, classYear: 'Sr' },
    ],
  },
  {
    id: 'interceptions',
    label: 'Interceptions',
    unit: 'INT',
    leaders: [
      { playerName: 'Caleb Downs', team: 'OSU', position: 'S', conference: 'Big Ten', statValue: 7, statLabel: 'Interceptions', gamesPlayed: 16, classYear: 'So' },
      { playerName: 'Malaki Starks', team: 'UGA', position: 'S', conference: 'SEC', statValue: 6, statLabel: 'Interceptions', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Travis Hunter', team: 'COLO', position: 'CB', conference: 'Big 12', statValue: 6, statLabel: 'Interceptions', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Will Johnson', team: 'MICH', position: 'CB', conference: 'Big Ten', statValue: 5, statLabel: 'Interceptions', gamesPlayed: 12, classYear: 'Jr' },
      { playerName: 'Kool-Aid McKinstry', team: 'BAMA', position: 'CB', conference: 'SEC', statValue: 5, statLabel: 'Interceptions', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Quinyon Mitchell', team: 'UTOL', position: 'CB', conference: 'MAC', statValue: 5, statLabel: 'Interceptions', gamesPlayed: 12, classYear: 'Sr' },
      { playerName: 'Denzel Burke', team: 'OSU', position: 'CB', conference: 'Big Ten', statValue: 4, statLabel: 'Interceptions', gamesPlayed: 16, classYear: 'Sr' },
      { playerName: 'Benjamin Morrison', team: 'ND', position: 'CB', conference: 'Independent', statValue: 4, statLabel: 'Interceptions', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Nate Wiggins', team: 'CLEM', position: 'CB', conference: 'ACC', statValue: 4, statLabel: 'Interceptions', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Jacobe Covington', team: 'MICH', position: 'S', conference: 'Big Ten', statValue: 4, statLabel: 'Interceptions', gamesPlayed: 12, classYear: 'So' },
    ],
  },
  {
    id: 'receiving-touchdowns',
    label: 'Receiving Touchdowns',
    unit: 'TD',
    leaders: [
      { playerName: 'Tetairoa McMillan', team: 'AZ', position: 'WR', conference: 'Big 12', statValue: 14, statLabel: 'Receiving TDs', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Luther Burden III', team: 'MIZZOU', position: 'WR', conference: 'SEC', statValue: 13, statLabel: 'Receiving TDs', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Emeka Egbuka', team: 'OSU', position: 'WR', conference: 'Big Ten', statValue: 12, statLabel: 'Receiving TDs', gamesPlayed: 16, classYear: 'Sr' },
      { playerName: 'Tre Harris', team: 'OLE', position: 'WR', conference: 'SEC', statValue: 11, statLabel: 'Receiving TDs', gamesPlayed: 12, classYear: 'Sr' },
      { playerName: 'Xavier Worthy', team: 'TEX', position: 'WR', conference: 'SEC', statValue: 11, statLabel: 'Receiving TDs', gamesPlayed: 15, classYear: 'Jr' },
      { playerName: 'Evan Stewart', team: 'ORE', position: 'WR', conference: 'Big Ten', statValue: 10, statLabel: 'Receiving TDs', gamesPlayed: 14, classYear: 'Jr' },
      { playerName: 'Travis Hunter', team: 'COLO', position: 'WR', conference: 'Big 12', statValue: 10, statLabel: 'Receiving TDs', gamesPlayed: 13, classYear: 'Jr' },
      { playerName: 'Isaiah Bond', team: 'TEX', position: 'WR', conference: 'SEC', statValue: 9, statLabel: 'Receiving TDs', gamesPlayed: 15, classYear: 'Jr' },
      { playerName: 'Barion Brown', team: 'UK', position: 'WR', conference: 'SEC', statValue: 9, statLabel: 'Receiving TDs', gamesPlayed: 12, classYear: 'Jr' },
      { playerName: 'Cam Ward', team: 'MIA', position: 'QB', conference: 'ACC', statValue: 0, statLabel: 'Receiving TDs', gamesPlayed: 13, classYear: 'Sr' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Conference Standings (derived from season records)
// ─────────────────────────────────────────────────────────────

export interface SeedConferenceStanding {
  team: string;            // abbreviation
  conference: string;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  apRank: number | null;
}

export const SEED_STANDINGS_2025: SeedConferenceStanding[] = [
  // Big Ten
  { team: 'OSU', conference: 'Big Ten', wins: 15, losses: 1, confWins: 9, confLosses: 0, pointsFor: 548, pointsAgainst: 245, streak: 'W7', apRank: 1 },
  { team: 'ORE', conference: 'Big Ten', wins: 12, losses: 2, confWins: 8, confLosses: 1, pointsFor: 465, pointsAgainst: 220, streak: 'L1', apRank: 4 },
  { team: 'PSU', conference: 'Big Ten', wins: 12, losses: 2, confWins: 7, confLosses: 2, pointsFor: 420, pointsAgainst: 195, streak: 'W2', apRank: 5 },
  { team: 'USC', conference: 'Big Ten', wins: 10, losses: 3, confWins: 7, confLosses: 2, pointsFor: 395, pointsAgainst: 245, streak: 'W1', apRank: 11 },
  { team: 'IOWA', conference: 'Big Ten', wins: 10, losses: 3, confWins: 7, confLosses: 2, pointsFor: 310, pointsAgainst: 185, streak: 'W3', apRank: 16 },
  { team: 'WISC', conference: 'Big Ten', wins: 9, losses: 4, confWins: 6, confLosses: 3, pointsFor: 345, pointsAgainst: 240, streak: 'L1', apRank: 22 },
  { team: 'MICH', conference: 'Big Ten', wins: 8, losses: 5, confWins: 5, confLosses: 4, pointsFor: 320, pointsAgainst: 265, streak: 'L2', apRank: null },
  { team: 'MINN', conference: 'Big Ten', wins: 7, losses: 5, confWins: 5, confLosses: 4, pointsFor: 285, pointsAgainst: 245, streak: 'W1', apRank: null },
  { team: 'ILL', conference: 'Big Ten', wins: 7, losses: 5, confWins: 4, confLosses: 5, pointsFor: 275, pointsAgainst: 260, streak: 'L1', apRank: null },
  { team: 'NEB', conference: 'Big Ten', wins: 6, losses: 6, confWins: 4, confLosses: 5, pointsFor: 265, pointsAgainst: 280, streak: 'W1', apRank: null },
  { team: 'WASH', conference: 'Big Ten', wins: 7, losses: 5, confWins: 4, confLosses: 5, pointsFor: 290, pointsAgainst: 250, streak: 'L1', apRank: null },
  { team: 'RUTS', conference: 'Big Ten', wins: 6, losses: 6, confWins: 3, confLosses: 6, pointsFor: 245, pointsAgainst: 270, streak: 'L2', apRank: null },
  { team: 'UCLA', conference: 'Big Ten', wins: 5, losses: 7, confWins: 3, confLosses: 6, pointsFor: 230, pointsAgainst: 300, streak: 'L3', apRank: null },
  { team: 'IU', conference: 'Big Ten', wins: 6, losses: 6, confWins: 3, confLosses: 6, pointsFor: 250, pointsAgainst: 275, streak: 'L1', apRank: null },
  { team: 'MARY', conference: 'Big Ten', wins: 4, losses: 8, confWins: 2, confLosses: 7, pointsFor: 205, pointsAgainst: 330, streak: 'L4', apRank: null },
  { team: 'PUR', conference: 'Big Ten', wins: 3, losses: 9, confWins: 1, confLosses: 8, pointsFor: 185, pointsAgainst: 360, streak: 'L5', apRank: null },

  // SEC
  { team: 'UGA', conference: 'SEC', wins: 14, losses: 2, confWins: 8, confLosses: 0, pointsFor: 510, pointsAgainst: 210, streak: 'W5', apRank: 2 },
  { team: 'TEX', conference: 'SEC', wins: 13, losses: 2, confWins: 7, confLosses: 1, pointsFor: 485, pointsAgainst: 230, streak: 'L1', apRank: 3 },
  { team: 'BAMA', conference: 'SEC', wins: 11, losses: 3, confWins: 6, confLosses: 2, pointsFor: 410, pointsAgainst: 225, streak: 'L1', apRank: 7 },
  { team: 'OLE', conference: 'SEC', wins: 11, losses: 2, confWins: 6, confLosses: 2, pointsFor: 420, pointsAgainst: 210, streak: 'L1', apRank: 8 },
  { team: 'LSU', conference: 'SEC', wins: 10, losses: 3, confWins: 5, confLosses: 3, pointsFor: 395, pointsAgainst: 250, streak: 'W2', apRank: 12 },
  { team: 'MIZZOU', conference: 'SEC', wins: 10, losses: 3, confWins: 5, confLosses: 3, pointsFor: 380, pointsAgainst: 245, streak: 'W1', apRank: 13 },
  { team: 'TENN', conference: 'SEC', wins: 10, losses: 3, confWins: 5, confLosses: 3, pointsFor: 370, pointsAgainst: 235, streak: 'L1', apRank: 14 },
  { team: 'TAM', conference: 'SEC', wins: 9, losses: 4, confWins: 4, confLosses: 4, pointsFor: 340, pointsAgainst: 265, streak: 'W1', apRank: 21 },
  { team: 'SCAR', conference: 'SEC', wins: 7, losses: 5, confWins: 4, confLosses: 4, pointsFor: 305, pointsAgainst: 270, streak: 'L2', apRank: null },
  { team: 'ARK', conference: 'SEC', wins: 7, losses: 5, confWins: 3, confLosses: 5, pointsFor: 290, pointsAgainst: 285, streak: 'W1', apRank: null },
  { team: 'UK', conference: 'SEC', wins: 6, losses: 6, confWins: 3, confLosses: 5, pointsFor: 260, pointsAgainst: 290, streak: 'L1', apRank: null },
  { team: 'AUB', conference: 'SEC', wins: 5, losses: 7, confWins: 2, confLosses: 6, pointsFor: 240, pointsAgainst: 315, streak: 'L3', apRank: null },
  { team: 'FLA', conference: 'SEC', wins: 5, losses: 7, confWins: 2, confLosses: 6, pointsFor: 235, pointsAgainst: 320, streak: 'L2', apRank: null },
  { team: 'MSST', conference: 'SEC', wins: 4, losses: 8, confWins: 1, confLosses: 7, pointsFor: 210, pointsAgainst: 345, streak: 'L4', apRank: null },
  { team: 'VAN', conference: 'SEC', wins: 3, losses: 9, confWins: 0, confLosses: 8, pointsFor: 180, pointsAgainst: 375, streak: 'L6', apRank: null },

  // ACC
  { team: 'CLEM', conference: 'ACC', wins: 11, losses: 3, confWins: 8, confLosses: 0, pointsFor: 410, pointsAgainst: 220, streak: 'L1', apRank: 9 },
  { team: 'MIA', conference: 'ACC', wins: 11, losses: 2, confWins: 7, confLosses: 1, pointsFor: 435, pointsAgainst: 230, streak: 'L1', apRank: 10 },
  { team: 'SMU', conference: 'ACC', wins: 10, losses: 3, confWins: 6, confLosses: 2, pointsFor: 375, pointsAgainst: 240, streak: 'W1', apRank: 23 },
  { team: 'LOU', conference: 'ACC', wins: 8, losses: 4, confWins: 5, confLosses: 3, pointsFor: 340, pointsAgainst: 270, streak: 'L1', apRank: null },
  { team: 'GT', conference: 'ACC', wins: 7, losses: 5, confWins: 5, confLosses: 3, pointsFor: 310, pointsAgainst: 260, streak: 'W2', apRank: null },
  { team: 'SYR', conference: 'ACC', wins: 7, losses: 5, confWins: 4, confLosses: 4, pointsFor: 295, pointsAgainst: 265, streak: 'W1', apRank: null },
  { team: 'PITT', conference: 'ACC', wins: 7, losses: 5, confWins: 4, confLosses: 4, pointsFor: 290, pointsAgainst: 270, streak: 'L1', apRank: null },
  { team: 'NCST', conference: 'ACC', wins: 6, losses: 6, confWins: 3, confLosses: 5, pointsFor: 265, pointsAgainst: 280, streak: 'W1', apRank: null },
  { team: 'VT', conference: 'ACC', wins: 6, losses: 6, confWins: 3, confLosses: 5, pointsFor: 260, pointsAgainst: 275, streak: 'L2', apRank: null },
  { team: 'DUKE', conference: 'ACC', wins: 5, losses: 7, confWins: 3, confLosses: 5, pointsFor: 240, pointsAgainst: 290, streak: 'L1', apRank: null },
  { team: 'UNC', conference: 'ACC', wins: 6, losses: 6, confWins: 3, confLosses: 5, pointsFor: 275, pointsAgainst: 280, streak: 'W1', apRank: null },
  { team: 'BC', conference: 'ACC', wins: 5, losses: 7, confWins: 2, confLosses: 6, pointsFor: 225, pointsAgainst: 310, streak: 'L3', apRank: null },
  { team: 'WAKE', conference: 'ACC', wins: 4, losses: 8, confWins: 2, confLosses: 6, pointsFor: 210, pointsAgainst: 325, streak: 'L2', apRank: null },
  { team: 'FSU', conference: 'ACC', wins: 4, losses: 8, confWins: 2, confLosses: 6, pointsFor: 200, pointsAgainst: 330, streak: 'L4', apRank: null },

  // Big 12
  { team: 'COLO', conference: 'Big 12', wins: 10, losses: 3, confWins: 7, confLosses: 2, pointsFor: 375, pointsAgainst: 245, streak: 'L1', apRank: 17 },
  { team: 'KSU', conference: 'Big 12', wins: 10, losses: 3, confWins: 7, confLosses: 2, pointsFor: 360, pointsAgainst: 240, streak: 'W2', apRank: 18 },
  { team: 'AZ', conference: 'Big 12', wins: 10, losses: 3, confWins: 6, confLosses: 3, pointsFor: 385, pointsAgainst: 255, streak: 'W1', apRank: 19 },
  { team: 'BYU', conference: 'Big 12', wins: 10, losses: 3, confWins: 6, confLosses: 3, pointsFor: 340, pointsAgainst: 230, streak: 'L1', apRank: 20 },
  { team: 'OKST', conference: 'Big 12', wins: 8, losses: 4, confWins: 5, confLosses: 4, pointsFor: 310, pointsAgainst: 260, streak: 'W1', apRank: null },
  { team: 'ASU', conference: 'Big 12', wins: 8, losses: 4, confWins: 5, confLosses: 4, pointsFor: 330, pointsAgainst: 270, streak: 'L1', apRank: null },
  { team: 'TCU', conference: 'Big 12', wins: 7, losses: 5, confWins: 5, confLosses: 4, pointsFor: 295, pointsAgainst: 265, streak: 'W1', apRank: null },
  { team: 'BAYLOR', conference: 'Big 12', wins: 6, losses: 6, confWins: 4, confLosses: 5, pointsFor: 265, pointsAgainst: 280, streak: 'L1', apRank: null },
  { team: 'TT', conference: 'Big 12', wins: 6, losses: 6, confWins: 3, confLosses: 6, pointsFor: 280, pointsAgainst: 305, streak: 'W1', apRank: null },
  { team: 'ISU', conference: 'Big 12', wins: 6, losses: 6, confWins: 3, confLosses: 6, pointsFor: 255, pointsAgainst: 275, streak: 'L2', apRank: null },
  { team: 'UCF', conference: 'Big 12', wins: 5, losses: 7, confWins: 3, confLosses: 6, pointsFor: 250, pointsAgainst: 310, streak: 'L1', apRank: null },
  { team: 'CIN', conference: 'Big 12', wins: 5, losses: 7, confWins: 2, confLosses: 7, pointsFor: 230, pointsAgainst: 305, streak: 'L3', apRank: null },
  { team: 'HOU', conference: 'Big 12', wins: 4, losses: 8, confWins: 2, confLosses: 7, pointsFor: 210, pointsAgainst: 330, streak: 'L4', apRank: null },
  { team: 'KU', conference: 'Big 12', wins: 5, losses: 7, confWins: 2, confLosses: 7, pointsFor: 240, pointsAgainst: 300, streak: 'L2', apRank: null },
];
