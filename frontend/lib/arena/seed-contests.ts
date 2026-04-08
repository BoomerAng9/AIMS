/**
 * The Arena — Contest & Player Data Templates
 *
 * Empty production-ready arrays. Populate via the database
 * or POST /api/arena/contests with real contest data.
 */

import type { ArenaContest, ArenaPlayer, LeaderboardEntry } from './types';

// ─────────────────────────────────────────────────────────────
// Contests — populate via POST /api/arena/contests
// ─────────────────────────────────────────────────────────────

export const SEED_CONTESTS: ArenaContest[] = [];

// ─────────────────────────────────────────────────────────────
// Players & Leaderboard — populated from user activity
// ─────────────────────────────────────────────────────────────

export const SEED_PLAYERS: ArenaPlayer[] = [];

export const SEED_LEADERBOARD: Omit<LeaderboardEntry, 'player'>[] = [];
