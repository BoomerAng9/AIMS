/**
 * Per|Form Mock Draft Engine
 *
 * Autonomous mock draft generation using:
 * - P.A.I. (Performance, Athleticism, Intangibles) grades
 * - NFL team needs matrix
 * - Best Player Available (BPA) vs Team Need balancing
 * - Trade-up probability modeling
 *
 * Generates full 7-round mock drafts with rationale per pick.
 */

import prisma from '@/lib/db/prisma';

// ─────────────────────────────────────────────────────────────
// NFL Teams — 2025-2026 Season (32 teams)
// ─────────────────────────────────────────────────────────────

export interface NFLTeamSeed {
  teamName: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
}

export const NFL_TEAMS: NFLTeamSeed[] = [
  // AFC East
  { teamName: 'Buffalo Bills', abbreviation: 'BUF', city: 'Buffalo', conference: 'AFC', division: 'East' },
  { teamName: 'Miami Dolphins', abbreviation: 'MIA', city: 'Miami', conference: 'AFC', division: 'East' },
  { teamName: 'New England Patriots', abbreviation: 'NE', city: 'Foxborough', conference: 'AFC', division: 'East' },
  { teamName: 'New York Jets', abbreviation: 'NYJ', city: 'East Rutherford', conference: 'AFC', division: 'East' },
  // AFC North
  { teamName: 'Baltimore Ravens', abbreviation: 'BAL', city: 'Baltimore', conference: 'AFC', division: 'North' },
  { teamName: 'Cincinnati Bengals', abbreviation: 'CIN', city: 'Cincinnati', conference: 'AFC', division: 'North' },
  { teamName: 'Cleveland Browns', abbreviation: 'CLE', city: 'Cleveland', conference: 'AFC', division: 'North' },
  { teamName: 'Pittsburgh Steelers', abbreviation: 'PIT', city: 'Pittsburgh', conference: 'AFC', division: 'North' },
  // AFC South
  { teamName: 'Houston Texans', abbreviation: 'HOU', city: 'Houston', conference: 'AFC', division: 'South' },
  { teamName: 'Indianapolis Colts', abbreviation: 'IND', city: 'Indianapolis', conference: 'AFC', division: 'South' },
  { teamName: 'Jacksonville Jaguars', abbreviation: 'JAX', city: 'Jacksonville', conference: 'AFC', division: 'South' },
  { teamName: 'Tennessee Titans', abbreviation: 'TEN', city: 'Nashville', conference: 'AFC', division: 'South' },
  // AFC West
  { teamName: 'Denver Broncos', abbreviation: 'DEN', city: 'Denver', conference: 'AFC', division: 'West' },
  { teamName: 'Kansas City Chiefs', abbreviation: 'KC', city: 'Kansas City', conference: 'AFC', division: 'West' },
  { teamName: 'Las Vegas Raiders', abbreviation: 'LV', city: 'Las Vegas', conference: 'AFC', division: 'West' },
  { teamName: 'Los Angeles Chargers', abbreviation: 'LAC', city: 'Los Angeles', conference: 'AFC', division: 'West' },
  // NFC East
  { teamName: 'Dallas Cowboys', abbreviation: 'DAL', city: 'Arlington', conference: 'NFC', division: 'East' },
  { teamName: 'New York Giants', abbreviation: 'NYG', city: 'East Rutherford', conference: 'NFC', division: 'East' },
  { teamName: 'Philadelphia Eagles', abbreviation: 'PHI', city: 'Philadelphia', conference: 'NFC', division: 'East' },
  { teamName: 'Washington Commanders', abbreviation: 'WAS', city: 'Landover', conference: 'NFC', division: 'East' },
  // NFC North
  { teamName: 'Chicago Bears', abbreviation: 'CHI', city: 'Chicago', conference: 'NFC', division: 'North' },
  { teamName: 'Detroit Lions', abbreviation: 'DET', city: 'Detroit', conference: 'NFC', division: 'North' },
  { teamName: 'Green Bay Packers', abbreviation: 'GB', city: 'Green Bay', conference: 'NFC', division: 'North' },
  { teamName: 'Minnesota Vikings', abbreviation: 'MIN', city: 'Minneapolis', conference: 'NFC', division: 'North' },
  // NFC South
  { teamName: 'Atlanta Falcons', abbreviation: 'ATL', city: 'Atlanta', conference: 'NFC', division: 'South' },
  { teamName: 'Carolina Panthers', abbreviation: 'CAR', city: 'Charlotte', conference: 'NFC', division: 'South' },
  { teamName: 'New Orleans Saints', abbreviation: 'NO', city: 'New Orleans', conference: 'NFC', division: 'South' },
  { teamName: 'Tampa Bay Buccaneers', abbreviation: 'TB', city: 'Tampa', conference: 'NFC', division: 'South' },
  // NFC West
  { teamName: 'Arizona Cardinals', abbreviation: 'ARI', city: 'Glendale', conference: 'NFC', division: 'West' },
  { teamName: 'Los Angeles Rams', abbreviation: 'LAR', city: 'Inglewood', conference: 'NFC', division: 'West' },
  { teamName: 'San Francisco 49ers', abbreviation: 'SF', city: 'Santa Clara', conference: 'NFC', division: 'West' },
  { teamName: 'Seattle Seahawks', abbreviation: 'SEA', city: 'Seattle', conference: 'NFC', division: 'West' },
];

// ─────────────────────────────────────────────────────────────
// Position value tiers (how much each position is worth in draft)
// ─────────────────────────────────────────────────────────────

const POSITION_VALUE: Record<string, number> = {
  QB: 1.5,
  EDGE: 1.3,
  OT: 1.2,
  CB: 1.15,
  WR: 1.1,
  DT: 1.05,
  S: 1.0,
  LB: 1.0,
  IOL: 0.95,
  TE: 0.9,
  RB: 0.8,
  K: 0.5,
  P: 0.5,
};

function getPositionValue(pos: string): number {
  // Normalize position names
  const normalized = pos.toUpperCase();
  if (['DE', 'OLB', 'EDGE'].includes(normalized)) return POSITION_VALUE.EDGE;
  if (['OT', 'T'].includes(normalized)) return POSITION_VALUE.OT;
  if (['OG', 'C', 'G', 'IOL'].includes(normalized)) return POSITION_VALUE.IOL;
  if (['DT', 'NT', 'DL'].includes(normalized)) return POSITION_VALUE.DT;
  if (['ILB', 'MLB', 'LB'].includes(normalized)) return POSITION_VALUE.LB;
  return POSITION_VALUE[normalized] || 1.0;
}

// ─────────────────────────────────────────────────────────────
// Draft pick value chart (approximate, based on Jimmy Johnson chart)
// ─────────────────────────────────────────────────────────────

function pickValue(overall: number): number {
  if (overall <= 0) return 0;
  if (overall === 1) return 3000;
  if (overall <= 5) return 3000 - (overall - 1) * 400;
  if (overall <= 10) return 1600 - (overall - 5) * 160;
  if (overall <= 32) return 800 - (overall - 10) * 25;
  if (overall <= 64) return 250 - (overall - 32) * 5;
  if (overall <= 100) return 90 - (overall - 64) * 1.5;
  return Math.max(1, 35 - (overall - 100) * 0.2);
}

// ─────────────────────────────────────────────────────────────
// Core Engine: Generate Mock Draft
// ─────────────────────────────────────────────────────────────

interface DraftSlot {
  overall: number;
  round: number;
  pickInRound: number;
  teamAbbrev: string;
  teamName: string;
}

/**
 * Build the draft order for all 7 rounds (simplified: no compensatory picks).
 * Takes an array of team abbreviations in round-1 order (worst to best record).
 */
function buildDraftOrder(round1Order: string[]): DraftSlot[] {
  const slots: DraftSlot[] = [];
  const teamMap = new Map(NFL_TEAMS.map(t => [t.abbreviation, t.teamName]));

  let overall = 1;
  for (let round = 1; round <= 7; round++) {
    // Rounds 1 and 2: same order. Rounds 3-7: can vary but we use same for simplicity
    const roundOrder = round % 2 === 0
      ? [...round1Order].reverse() // Even rounds reverse (simplified)
      : round1Order;

    let pickInRound = 1;
    for (const abbrev of roundOrder) {
      slots.push({
        overall,
        round,
        pickInRound,
        teamAbbrev: abbrev,
        teamName: teamMap.get(abbrev) || abbrev,
      });
      overall++;
      pickInRound++;
    }
  }

  return slots;
}

/**
 * Score a prospect-team fit. Higher = better fit.
 * Balances BPA (best player available) with team needs.
 */
function scoreFit(
  prospect: { paiScore: number; position: string; overallRank: number },
  teamNeeds: Record<string, number>, // position -> need level (1=critical, 2=moderate, 3=depth)
  pickNumber: number,
  round: number
): { fitScore: number; rationale: string } {
  const posValue = getPositionValue(prospect.position);
  const needLevel = teamNeeds[prospect.position.toUpperCase()] || teamNeeds[normalizePos(prospect.position)] || 3;

  // BPA component (40%)
  const bpaScore = prospect.paiScore * posValue;

  // Need component (40%)
  const needMultiplier = needLevel === 1 ? 1.5 : needLevel === 2 ? 1.15 : 0.85;
  const needScore = prospect.paiScore * needMultiplier;

  // Value component — is this pick good value? (20%)
  const expectedPick = prospect.overallRank;
  const valueDiff = expectedPick - pickNumber;
  const valueScore = valueDiff > 10 ? 95 : valueDiff > 0 ? 80 + valueDiff : 70 + valueDiff;

  const fitScore = Math.round(bpaScore * 0.4 + needScore * 0.4 + valueScore * 0.2);

  // Generate rationale
  let rationale = '';
  if (needLevel === 1) {
    rationale = `Fills critical need at ${prospect.position}. `;
  } else if (needLevel === 2) {
    rationale = `Addresses moderate need at ${prospect.position}. `;
  } else {
    rationale = `Best player available — talent too good to pass on. `;
  }

  if (valueDiff > 10) {
    rationale += `Excellent value — ranked ${prospect.overallRank} overall, picked at ${pickNumber}.`;
  } else if (valueDiff > 0) {
    rationale += `Solid value at pick ${pickNumber}.`;
  } else if (round <= 2) {
    rationale += `Slight reach but positional value and need justify the selection.`;
  }

  return { fitScore: Math.min(100, Math.max(0, fitScore)), rationale };
}

function normalizePos(pos: string): string {
  const p = pos.toUpperCase();
  if (['DE', 'OLB'].includes(p)) return 'EDGE';
  if (['OT', 'T'].includes(p)) return 'OT';
  if (['OG', 'C', 'G'].includes(p)) return 'IOL';
  if (['DT', 'NT', 'DL'].includes(p)) return 'DT';
  if (['ILB', 'MLB'].includes(p)) return 'LB';
  return p;
}

/**
 * Generate a full mock draft.
 *
 * @param draftOrder - Team abbreviations in round-1 pick order (1st = worst record)
 * @param rounds - Number of rounds (1-7)
 */
export async function generateMockDraft(options: {
  draftOrder: string[];
  rounds?: number;
  title?: string;
  description?: string;
}): Promise<{ mockDraftId: string; totalPicks: number }> {
  const { draftOrder, rounds = 7, title, description } = options;

  // Build full draft order
  const slots = buildDraftOrder(draftOrder).filter(s => s.round <= rounds);

  // Get all draft prospects ordered by grade
  const prospects = await prisma.draftProspect.findMany({
    orderBy: { overallRank: 'asc' },
  });

  if (prospects.length === 0) {
    throw new Error('No draft prospects in database. Run /api/perform/draft/ingest first.');
  }

  // Get team needs
  const teamNeeds = await prisma.nFLTeamNeeds.findMany();
  const needsMap = new Map<string, Record<string, number>>();
  for (const tn of teamNeeds) {
    try {
      needsMap.set(tn.abbreviation, JSON.parse(tn.needs));
    } catch {
      needsMap.set(tn.abbreviation, {});
    }
  }

  // Create the mock draft record
  const slug = `mock-draft-${Date.now()}`;
  const mockDraft = await prisma.mockDraft.create({
    data: {
      slug,
      title: title || `Per|Form Mock Draft — ${new Date().toLocaleDateString()}`,
      description: description || `${rounds}-round mock draft generated by Per|Form engine`,
      rounds,
      totalPicks: slots.length,
      generatedBy: 'PERFORM_ENGINE',
      isPublished: true,
    },
  });

  // Track which prospects have been picked
  const picked = new Set<string>();

  // Make picks
  for (const slot of slots) {
    const needs = needsMap.get(slot.teamAbbrev) || {};

    // Score all available prospects for this team
    const available = prospects.filter(p => !picked.has(p.id));
    if (available.length === 0) break;

    let bestProspect = available[0];
    let bestFit = scoreFit(
      { paiScore: bestProspect.paiScore, position: bestProspect.position, overallRank: bestProspect.overallRank },
      needs,
      slot.overall,
      slot.round
    );

    // Check top candidates (don't scan ALL — top 15 available is enough)
    const candidates = available.slice(0, Math.min(15, available.length));
    for (const candidate of candidates) {
      const fit = scoreFit(
        { paiScore: candidate.paiScore, position: candidate.position, overallRank: candidate.overallRank },
        needs,
        slot.overall,
        slot.round
      );

      if (fit.fitScore > bestFit.fitScore) {
        bestProspect = candidate;
        bestFit = fit;
      }
    }

    // Find the NFL team record
    const nflTeamRecord = teamNeeds.find(t => t.abbreviation === slot.teamAbbrev);

    // Insert the pick
    await prisma.draftPick.create({
      data: {
        mockDraftId: mockDraft.id,
        prospectId: bestProspect.id,
        nflTeamId: nflTeamRecord?.id || null,
        overall: slot.overall,
        round: slot.round,
        pickInRound: slot.pickInRound,
        teamName: slot.teamName,
        fitScore: bestFit.fitScore,
        rationale: bestFit.rationale,
      },
    });

    picked.add(bestProspect.id);

    // After picking, reduce team's need at that position
    const posKey = normalizePos(bestProspect.position);
    if (needs[posKey]) {
      needs[posKey] = Math.min(3, needs[posKey] + 1);
    }
  }

  return { mockDraftId: mockDraft.id, totalPicks: slots.length };
}

// ─────────────────────────────────────────────────────────────
// Draft Simulator — Interactive pick-by-pick
// ─────────────────────────────────────────────────────────────

/**
 * Get the next available pick and top candidates for the user to choose from.
 */
export async function getSimulatorState(mockDraftId: string) {
  const mockDraft = await prisma.mockDraft.findUnique({
    where: { id: mockDraftId },
    include: {
      picks: {
        orderBy: { overall: 'asc' },
        include: { prospect: true },
      },
    },
  });

  if (!mockDraft) throw new Error('Mock draft not found');

  const pickedIds = new Set(mockDraft.picks.map(p => p.prospectId));
  const lastPick = mockDraft.picks[mockDraft.picks.length - 1];
  const nextOverall = lastPick ? lastPick.overall + 1 : 1;

  // Get available prospects
  const available = await prisma.draftProspect.findMany({
    where: { id: { notIn: Array.from(pickedIds) } },
    orderBy: { overallRank: 'asc' },
    take: 20,
  });

  return {
    mockDraft: {
      id: mockDraft.id,
      title: mockDraft.title,
      totalPicks: mockDraft.totalPicks,
      picksMade: mockDraft.picks.length,
    },
    nextPick: nextOverall,
    picks: mockDraft.picks,
    topAvailable: available,
  };
}

/**
 * Make a pick in the simulator (user chooses the prospect).
 */
export async function makeSimulatorPick(
  mockDraftId: string,
  prospectId: string,
  teamName: string,
  overall: number,
  round: number,
  pickInRound: number,
  rationale?: string
) {
  return prisma.draftPick.create({
    data: {
      mockDraftId,
      prospectId,
      overall,
      round,
      pickInRound,
      teamName,
      rationale: rationale || 'User selection',
    },
    include: { prospect: true },
  });
}

// ─────────────────────────────────────────────────────────────
// Seed NFL Team Needs
// ─────────────────────────────────────────────────────────────

export async function seedNFLTeams(
  teamsWithNeeds: Array<NFLTeamSeed & {
    record?: string;
    draftOrder?: number;
    needs: Record<string, number>;
    capSpace?: string;
  }>
) {
  let count = 0;
  for (const team of teamsWithNeeds) {
    await prisma.nFLTeamNeeds.upsert({
      where: { abbreviation: team.abbreviation },
      create: {
        teamName: team.teamName,
        abbreviation: team.abbreviation,
        city: team.city,
        conference: team.conference,
        division: team.division,
        record: team.record,
        draftOrder: team.draftOrder,
        needs: JSON.stringify(team.needs),
        capSpace: team.capSpace,
      },
      update: {
        record: team.record,
        draftOrder: team.draftOrder,
        needs: JSON.stringify(team.needs),
        capSpace: team.capSpace,
      },
    });
    count++;
  }
  return count;
}
