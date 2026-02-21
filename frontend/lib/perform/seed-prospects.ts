/**
 * Per|Form Prospect Data Template
 *
 * Type definition and empty production array for prospects with P.A.I.
 * scoring, adversarial debate results, and scouting memos.
 *
 * Populate via the database or POST /api/perform/ingest with real data.
 * Prospects can be enriched with live data via the /api/perform/enrich
 * endpoint using Brave Search.
 */

export interface SeedProspect {
  firstName: string;
  lastName: string;
  position: string;
  classYear: string;
  school: string;
  state: string;
  pool: string;
  height?: string;
  weight?: number;
  gpa?: number;
  paiScore: number;
  tier: string;
  performance: number;
  athleticism: number;
  intangibles: number;
  nationalRank: number;
  stateRank: number;
  positionRank: number;
  trend: string;
  previousRank?: number;
  nilEstimate: string;
  scoutMemo: string;
  tags: string[];
  comparisons: string[];
  stats: Record<string, string | number>;
  bullCase: string;
  bearCase: string;
  mediationVerdict: string;
  debateWinner: string;
  stars?: number;
  enrichedBy?: string;
}

export const SEED_PROSPECTS: SeedProspect[] = [];
