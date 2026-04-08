/**
 * The Arena — Types & Constants
 *
 * Type definitions for the contest and gamification platform.
 * Supports trivia, pick'em, prospect ranking, and streak contests.
 */

// ─────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────

export type ContestType = 'TRIVIA' | 'PICKEM' | 'PROSPECT_RANK' | 'OVER_UNDER' | 'STREAK';
export type ContestStatus = 'UPCOMING' | 'LIVE' | 'SCORING' | 'COMPLETED' | 'CANCELLED';
export type ContestCategory = 'SPORTS' | 'GENERAL' | 'ENTERTAINMENT' | 'SCIENCE' | 'HISTORY' | 'MIXED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type PlayerTier = 'ROOKIE' | 'CONTENDER' | 'VETERAN' | 'ELITE' | 'LEGEND';
export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' | 'SEASON_1';
export type TxType = 'DEPOSIT' | 'ENTRY_FEE' | 'WINNINGS' | 'REFUND' | 'BONUS';

// ─────────────────────────────────────────────────────────────
// Data Interfaces
// ─────────────────────────────────────────────────────────────

export interface ArenaPlayer {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  tier: PlayerTier;
  xp: number;
  level: number;
  winCount: number;
  totalContests: number;
  winRate: number;
  streak: number;
  bestStreak: number;
}

export interface ArenaWallet {
  id: string;
  playerId: string;
  balance: number;
  totalDeposited: number;
  totalWon: number;
  totalSpent: number;
}

export interface WalletTransaction {
  id: string;
  type: TxType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface TriviaQuestionData {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  type: 'multiple' | 'boolean';
}

export interface PickEmQuestion {
  id: string;
  type: 'SPREAD' | 'OVER_UNDER' | 'MONEYLINE' | 'PROP';
  prompt: string;
  optionA: string;
  optionB: string;
  correctAnswer?: string;
  metadata?: Record<string, unknown>;
}

export interface ProspectRankQuestion {
  id: string;
  prompt: string;
  prospects: { id: string; name: string; position: string; school: string }[];
  correctOrder?: string[];
}

export interface ContestData {
  questions?: TriviaQuestionData[];
  picks?: PickEmQuestion[];
  prospectRanks?: ProspectRankQuestion[];
  timeLimit?: number; // seconds per question
  rules?: string[];
}

export interface PrizeStructure {
  [place: string]: number; // percentage of prize pool
}

export interface ArenaContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ContestType;
  category: ContestCategory;
  status: ContestStatus;
  entryFee: number;
  prizePool: number;
  rakePercent: number;
  maxEntries: number;
  minEntries: number;
  currentEntries: number;
  startsAt: string;
  endsAt: string;
  scoredAt?: string;
  contestData: ContestData;
  prizeStructure: PrizeStructure;
  generatedBy: string;
  difficulty: Difficulty;
  featured: boolean;
}

export interface ArenaEntry {
  id: string;
  contestId: string;
  playerId: string;
  answers: string[];
  submittedAt?: string;
  isSubmitted: boolean;
  score?: number;
  rank?: number;
  correctCount?: number;
  totalQuestions?: number;
  payout: number;
  entryFeePaid: number;
}

export interface LeaderboardEntry {
  id: string;
  playerId: string;
  player: ArenaPlayer;
  period: LeaderboardPeriod;
  periodKey: string;
  rank: number;
  score: number;
  wins: number;
  entries: number;
  earnings: number;
  accuracy: number;
}

// ─────────────────────────────────────────────────────────────
// UI Constants
// ─────────────────────────────────────────────────────────────

export const CONTEST_TYPE_STYLES: Record<ContestType, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  TRIVIA: {
    label: 'Trivia',
    icon: '?',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    glow: 'shadow-[0_0_20px_rgba(147,51,234,0.1)]',
  },
  PICKEM: {
    label: "Pick'em",
    icon: 'VS',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.1)]',
  },
  PROSPECT_RANK: {
    label: 'Rank It',
    icon: '#',
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/20',
    glow: 'shadow-[0_0_20px_rgba(212,175,55,0.1)]',
  },
  OVER_UNDER: {
    label: 'Over/Under',
    icon: 'O/U',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]',
  },
  STREAK: {
    label: 'Streak',
    icon: 'S',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.1)]',
  },
};

export const STATUS_STYLES: Record<ContestStatus, {
  label: string;
  color: string;
  bg: string;
  pulse: boolean;
}> = {
  UPCOMING: { label: 'Upcoming', color: 'text-blue-400', bg: 'bg-blue-400/10', pulse: false },
  LIVE: { label: 'LIVE', color: 'text-emerald-400', bg: 'bg-emerald-400/10', pulse: true },
  SCORING: { label: 'Scoring...', color: 'text-amber-400', bg: 'bg-amber-400/10', pulse: true },
  COMPLETED: { label: 'Final', color: 'text-white/40', bg: 'bg-white/5', pulse: false },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/10', pulse: false },
};

export const TIER_CONFIG: Record<PlayerTier, {
  label: string;
  color: string;
  bg: string;
  border: string;
  minXp: number;
  icon: string;
}> = {
  ROOKIE: { label: 'Rookie', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', minXp: 0, icon: 'R' },
  CONTENDER: { label: 'Contender', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', minXp: 500, icon: 'C' },
  VETERAN: { label: 'Veteran', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', minXp: 2000, icon: 'V' },
  ELITE: { label: 'Elite', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', minXp: 5000, icon: 'E' },
  LEGEND: { label: 'Legend', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20', minXp: 15000, icon: 'L' },
};

export const DIFFICULTY_STYLES: Record<Difficulty, {
  label: string;
  color: string;
  multiplier: number;
}> = {
  EASY: { label: 'Easy', color: 'text-emerald-400', multiplier: 1 },
  MEDIUM: { label: 'Medium', color: 'text-blue-400', multiplier: 1.5 },
  HARD: { label: 'Hard', color: 'text-amber-400', multiplier: 2 },
  EXPERT: { label: 'Expert', color: 'text-red-400', multiplier: 3 },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getPlayerTier(xp: number): PlayerTier {
  if (xp >= 15000) return 'LEGEND';
  if (xp >= 5000) return 'ELITE';
  if (xp >= 2000) return 'VETERAN';
  if (xp >= 500) return 'CONTENDER';
  return 'ROOKIE';
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getContestSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
