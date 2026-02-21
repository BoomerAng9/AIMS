/**
 * Per|Form NFL Draft Data Template — 2026 NFL Draft
 *
 * Type definitions and empty production arrays for draft prospects,
 * redraft analysis, and NFL team needs. Populate via the database or
 * POST /api/perform/draft endpoints with real data.
 *
 * NOTE: The 2025 class (Ward, Hunter, Sanders, Carter, etc.) is now in
 * the NFL. See REDRAFT_2025_PROSPECTS for rookie season re-evaluation.
 *
 * Tiers:
 *   TOP_5     — Consensus top 5 pick
 *   TOP_15    — First half of round 1
 *   FIRST_ROUND — Late round 1
 *   DAY_2     — Rounds 2-3
 *   DAY_3     — Rounds 4-7
 *   PRIORITY_UDFA — Top undrafted free agents
 *   UDFA      — Undrafted free agent
 */

export interface SeedDraftProspect {
  firstName: string;
  lastName: string;
  position: string;
  college: string;
  conference?: string;
  classYear: string;
  eligibility?: string;
  height?: string;
  weight?: number;
  paiScore: number;
  tier: string;
  performance: number;
  athleticism: number;
  intangibles: number;
  overallRank: number;
  positionRank: number;
  trend: string;
  scoutMemo?: string;
  tags?: string;
  comparisons?: string;
  collegeStats?: string;
  combineInvite?: boolean;
  seniorBowl?: boolean;
  projectedRound?: number;
  projectedPick?: number;
  bullCase?: string;
  bearCase?: string;
  mediationVerdict?: string;
  debateWinner?: string;
  enrichedBy?: string;
}

// ─────────────────────────────────────────────────────────────
// 2026 NFL Draft Prospects — populate via POST /api/perform/draft
// ─────────────────────────────────────────────────────────────

export const SEED_DRAFT_PROSPECTS: SeedDraftProspect[] = [];

// ─────────────────────────────────────────────────────────────
// 2025 Redraft — rookie season re-evaluation
// ─────────────────────────────────────────────────────────────

export interface RedraftProspect extends SeedDraftProspect {
  nflTeam: string;
  draftPick: string;
  rookieStats?: string;
  rookieGrade: number;
  rookieAssessment?: string;
  injuryNote?: string;
}

export const REDRAFT_2025_PROSPECTS: RedraftProspect[] = [];

// ─────────────────────────────────────────────────────────────
// NFL Team Needs — 2026 Draft Order
// Populate via POST /api/perform/draft?action=seed-teams
// ─────────────────────────────────────────────────────────────

export interface TeamNeed {
  team: string;
  abbrev: string;
  projectedPick: number;
  primaryNeeds: string[];
  secondaryNeeds: string[];
  tradeLikelihood: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const NFL_TEAM_NEEDS_2026: TeamNeed[] = [];
