/**
 * Per|Form — NCAA Data Templates
 *
 * Empty production-ready arrays for Coaching Carousel, Transfer Portal,
 * NIL Tracker, and School Revenue Budgets. Populate via the database
 * or POST /api/perform endpoints with real data.
 */

// ─────────────────────────────────────────────────────────────
// Coaching Carousel
// ─────────────────────────────────────────────────────────────

export const SEED_COACHING_CHANGES: Array<{
  coachName: string;
  previousRole: string | null;
  newRole: string | null;
  previousTeamAbbrev: string | null;
  newTeamAbbrev: string | null;
  changeType: 'HIRED' | 'FIRED' | 'RESIGNED' | 'RETIRED' | 'INTERIM';
  season: number;
  effectiveDate: string;
  contractYears?: number | null;
  contractValue?: string | null;
  buyout?: string;
  record?: string;
  notes?: string;
  verified: boolean;
  verifiedBy: string | null;
}> = [];

// ─────────────────────────────────────────────────────────────
// Transfer Portal Seed
// ─────────────────────────────────────────────────────────────

export const SEED_TRANSFER_PORTAL: Array<{
  playerName: string;
  position: string;
  eligibility: string;
  previousTeamAbbrev: string;
  newTeamAbbrev: string | null;
  status: 'IN_PORTAL' | 'COMMITTED' | 'WITHDRAWN' | 'SIGNED';
  season: number;
  enteredDate: string;
  committedDate?: string;
  stars: number;
  previousStats: Record<string, number>;
  nilValuation: string;
  paiScore: number;
  tier: string;
  transferWindow: 'SPRING' | 'SUMMER' | 'WINTER';
  verified: boolean;
  verifiedBy: string | null;
}> = [];

// ─────────────────────────────────────────────────────────────
// NIL Deals Seed
// ─────────────────────────────────────────────────────────────

export const SEED_NIL_DEALS: Array<{
  playerName: string;
  teamAbbrev: string;
  position: string;
  dealType: 'ENDORSEMENT' | 'COLLECTIVE' | 'SOCIAL_MEDIA' | 'APPEARANCE' | 'LICENSING';
  brandOrCollective: string;
  estimatedValue: number;
  duration: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  announcedDate: string;
  season: number;
}> = [];

// ─────────────────────────────────────────────────────────────
// NIL Team Rankings Seed (2025 season)
// ─────────────────────────────────────────────────────────────

export const SEED_NIL_TEAM_RANKINGS: Array<{
  teamAbbrev: string;
  rank: number;
  totalNilValue: number;
  avgPerPlayer: number;
  topDealValue: number;
  dealCount: number;
  collectiveCount: number;
  trend: 'UP' | 'DOWN' | 'STEADY';
  previousRank: number;
}> = [];

// ─────────────────────────────────────────────────────────────
// School Revenue Budget Seed (2025 estimates, NFL free agency style)
// ─────────────────────────────────────────────────────────────

export const SEED_SCHOOL_BUDGETS: Array<{
  teamAbbrev: string;
  totalRevenue: number;
  footballRevenue: number;
  nilBudget: number;
  nilSpent: number;
  coachingSalary: number;
  operatingBudget: number;
  tvRevenue: number;
  ticketRevenue: number;
  donorRevenue: number;
  merchandiseRev: number;
  conferenceShare: number;
  spendingTier: 'ELITE' | 'HIGH' | 'MID' | 'LOW';
  rosterSize: number;
}> = [];
