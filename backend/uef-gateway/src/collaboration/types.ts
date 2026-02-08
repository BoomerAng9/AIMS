/**
 * Collaboration Feed — Type Definitions
 *
 * The live look-in system for A.I.M.S. agent collaboration.
 * Shows agents reasoning, conversing, and handing off through
 * the chain of command — each speaking in their persona voice.
 *
 * Inspired by: transparent agent reasoning UIs (Manus, Devin, etc.)
 * Differentiated by: AIMS persona framework, chain-of-command pipeline,
 * bench-level authority, and overlay-safe sidebar nuggets.
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { BenchLevel } from '../pmo/persona-types';
import type { PmoId, DirectorId } from '../pmo/types';
import type { ChainStep, ExecutionLane, ShiftStatus } from '../n8n/types';

// ---------------------------------------------------------------------------
// Agent Identity — who is speaking in the feed
// ---------------------------------------------------------------------------

export type AgentRole =
  | 'system'       // AIMS platform messages
  | 'acheevy'      // ACHEEVY orchestrator (the only user-facing voice)
  | 'boomer_ang'   // Boomer_Ang (PMO manager / Expert)
  | 'chicken_hawk' // Chicken_Hawk (shift spawner)
  | 'lil_hawk'     // Lil_Hawk (execution worker)
  | 'verifier'     // Verification gate runner
  | 'receipt';     // Receipt sealer

export interface AgentIdentity {
  displayName: string;
  kunya?: string;               // e.g., "The Gardener", "North Star"
  systemHandle?: string;        // e.g., "hr-betty-ann", "dtpmo-astra"
  benchLevel?: BenchLevel;
  role: AgentRole;
  pmoOffice?: string;
  avatar?: string;
}

// ---------------------------------------------------------------------------
// Feed Entry Types — what kind of message this is
// ---------------------------------------------------------------------------

export type FeedEntryType =
  | 'intake'          // User request received, ACHEEVY acknowledging
  | 'thinking'        // Agent reasoning / analysis
  | 'classification'  // PMO routing decision
  | 'directive'       // Boomer_Ang issuing orders
  | 'handoff'         // Chain step transition
  | 'squad_assembly'  // Chicken_Hawk assembling the squad
  | 'execution'       // Lil_Hawk executing a step
  | 'wave_summary'    // Wave completion summary
  | 'verification'    // Gate check result
  | 'nugget'          // Sidebar nugget (overlay-safe persona snippet)
  | 'receipt'         // Receipt sealed
  | 'debrief'         // Final summary back to user
  | 'escalation'      // Escalation trigger
  | 'coaching'        // HR PMO coaching note
  | 'system';         // System/platform message

// ---------------------------------------------------------------------------
// Feed Entry — a single line in the collaboration transcript
// ---------------------------------------------------------------------------

export interface FeedEntry {
  id: string;
  timestamp: string;
  speaker: AgentIdentity;
  type: FeedEntryType;
  message: string;
  /** Optional structured metadata for frontend rendering. */
  metadata?: Record<string, unknown>;
  /** If this entry is part of an expandable group (like Manus tasks). */
  group?: string;
  /** Indentation level for nested entries. */
  depth: number;
}

// ---------------------------------------------------------------------------
// Collaboration Session — wraps a full pipeline run
// ---------------------------------------------------------------------------

export interface CollaborationSession {
  sessionId: string;
  userName: string;
  projectLabel: string;
  startedAt: string;
  completedAt?: string;
  feed: FeedEntry[];
  chainPosition: {
    step: number;
    current: ChainStep;
    next: ChainStep | 'User';
  };
  status: 'active' | 'completed' | 'failed';
  /** Summary stats for the session. */
  stats: SessionStats;
}

export interface SessionStats {
  totalEntries: number;
  agentsSeen: string[];
  nuggetsDelivered: number;
  stepsCompleted: number;
  stepsFailed: number;
  totalDurationMs: number;
  pmoOffice?: PmoId;
  director?: DirectorId;
  executionLane?: ExecutionLane;
  shiftStatus?: ShiftStatus;
}

// ---------------------------------------------------------------------------
// Feed Configuration — controls verbosity and persona expression
// ---------------------------------------------------------------------------

export interface FeedConfig {
  /** User's first name — used in ACHEEVY greetings and nuggets. */
  userName: string;
  /** Project label — used to refer to the work. */
  projectLabel: string;
  /** Show thinking/reasoning entries. */
  showThinking: boolean;
  /** Show sidebar nuggets from persona framework. */
  showNuggets: boolean;
  /** Show wave-level execution detail. */
  showWaveDetail: boolean;
  /** Show verification gate breakdowns. */
  showVerificationDetail: boolean;
  /** Maximum nuggets per session (snippet policy compliance). */
  maxNuggets: number;
}

export const DEFAULT_FEED_CONFIG: FeedConfig = {
  userName: 'Boss',
  projectLabel: 'your project',
  showThinking: true,
  showNuggets: true,
  showWaveDetail: true,
  showVerificationDetail: true,
  maxNuggets: 3,
};
