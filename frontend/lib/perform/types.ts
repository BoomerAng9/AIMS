/**
 * Per|Form Shared Types
 *
 * Canonical type definitions for the Per|Form scouting platform.
 * These mirror the backend contracts at backend/uef-gateway/src/perform/contracts/
 *
 * PROPRIETARY BOUNDARY:
 * - Grade scores and tiers are PUBLIC (shown to users)
 * - Formula weights, GROC internals, and Luke adjustments are PRIVATE (never sent to frontend)
 */

// ─────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────

export type Tier = 'ELITE' | 'BLUE_CHIP' | 'PROSPECT' | 'SLEEPER' | 'DEVELOPMENTAL';
export type Trend = 'UP' | 'DOWN' | 'STEADY' | 'NEW';
export type Pool = 'HIGH_SCHOOL' | 'COLLEGE';
export type DebateWinner = 'BULL' | 'BEAR' | 'SPLIT';
export type ContentType = 'BLOG' | 'PODCAST' | 'RANKING_UPDATE' | 'SCOUTING_REPORT' | 'DEBATE_RECAP';

// ─────────────────────────────────────────────────────────────
// Prospect (public-safe fields only)
// ─────────────────────────────────────────────────────────────

export interface Prospect {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  classYear: string;
  school: string;
  conference?: string;
  state: string;
  pool: Pool;
  height: string;
  weight: number;
  gpa?: number;

  // P.A.I. Grade — score and tier are public, formula is not
  paiScore: number;
  tier: Tier | string;

  // Component scores — values are public, weights are NOT
  performance: number;
  athleticism: number;
  intangibles: number;

  // Rankings
  nationalRank: number;
  stateRank: number;
  positionRank: number;
  trend: Trend;
  previousRank?: number;

  // NIL
  nilEstimate: string;

  // Scouting
  scoutMemo: string;
  tags: string[];
  comparisons: string[];
  stats: Record<string, string | number>;

  // Debate
  bullCase: string;
  bearCase: string;
  mediationVerdict: string;
  debateWinner: DebateWinner;

  // Media
  highlightsUrl?: string;

  // Meta
  lastUpdated: string;
}

// ─────────────────────────────────────────────────────────────
// Content Article
// ─────────────────────────────────────────────────────────────

export interface ContentArticle {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  prospectName?: string;
  prospectId?: string;
  generatedBy: string;
  generatedAt: string;
  readTimeMin: number;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────
// Grade Display Config — styling only, no formula exposure
// ─────────────────────────────────────────────────────────────

export const TIER_STYLES: Record<Tier, {
  label: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
}> = {
  ELITE: {
    label: 'Elite',
    bg: 'bg-gold/15',
    border: 'border-gold/30',
    text: 'text-gold',
    glow: 'shadow-[0_0_12px_rgba(212,175,55,0.2)]',
  },
  BLUE_CHIP: {
    label: 'Blue Chip',
    bg: 'bg-blue-400/15',
    border: 'border-blue-400/30',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(96,165,250,0.2)]',
  },
  PROSPECT: {
    label: 'Prospect',
    bg: 'bg-emerald-400/15',
    border: 'border-emerald-400/30',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
  },
  SLEEPER: {
    label: 'Sleeper',
    bg: 'bg-amber-400/15',
    border: 'border-amber-400/30',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]',
  },
  DEVELOPMENTAL: {
    label: 'Developmental',
    bg: 'bg-zinc-400/15',
    border: 'border-zinc-400/30',
    text: 'text-zinc-400',
    glow: '',
  },
};

export const TREND_STYLES: Record<Trend, {
  icon: string;
  color: string;
  label: string;
}> = {
  UP: { icon: '▲', color: 'text-emerald-400', label: 'Rising' },
  DOWN: { icon: '▼', color: 'text-red-400', label: 'Falling' },
  STEADY: { icon: '—', color: 'text-white/40', label: 'Steady' },
  NEW: { icon: '★', color: 'text-gold', label: 'New Entry' },
};

export const CONTENT_TYPE_STYLES: Record<ContentType, {
  label: string;
  color: string;
  bg: string;
}> = {
  BLOG: { label: 'Article', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  PODCAST: { label: 'Podcast', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  RANKING_UPDATE: { label: 'Rankings', color: 'text-gold', bg: 'bg-gold/10' },
  SCOUTING_REPORT: { label: 'Scout Report', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  DEBATE_RECAP: { label: 'Bull vs Bear', color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

// ─────────────────────────────────────────────────────────────
// NFL Draft Types & Styles
// ─────────────────────────────────────────────────────────────

export type DraftTier = 'TOP_5' | 'TOP_15' | 'FIRST_ROUND' | 'DAY_2' | 'DAY_3' | 'PRIORITY_UDFA' | 'UDFA';

export const DRAFT_TIER_STYLES: Record<DraftTier, {
  label: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
}> = {
  TOP_5: {
    label: 'Top 5',
    bg: 'bg-gold/15',
    border: 'border-gold/30',
    text: 'text-gold',
    glow: 'shadow-[0_0_12px_rgba(212,175,55,0.2)]',
  },
  TOP_15: {
    label: 'Top 15',
    bg: 'bg-blue-400/15',
    border: 'border-blue-400/30',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(96,165,250,0.2)]',
  },
  FIRST_ROUND: {
    label: 'Round 1',
    bg: 'bg-emerald-400/15',
    border: 'border-emerald-400/30',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
  },
  DAY_2: {
    label: 'Day 2',
    bg: 'bg-amber-400/15',
    border: 'border-amber-400/30',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]',
  },
  DAY_3: {
    label: 'Day 3',
    bg: 'bg-zinc-400/15',
    border: 'border-zinc-400/30',
    text: 'text-zinc-400',
    glow: '',
  },
  PRIORITY_UDFA: {
    label: 'Priority UDFA',
    bg: 'bg-orange-400/15',
    border: 'border-orange-400/30',
    text: 'text-orange-400',
    glow: '',
  },
  UDFA: {
    label: 'UDFA',
    bg: 'bg-zinc-500/15',
    border: 'border-zinc-500/30',
    text: 'text-zinc-500',
    glow: '',
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getProspectSlug(prospect: { firstName: string; lastName: string }): string {
  return `${prospect.firstName}-${prospect.lastName}`.toLowerCase();
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-gold';
  if (score >= 80) return 'text-blue-400';
  if (score >= 70) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-zinc-400';
}
