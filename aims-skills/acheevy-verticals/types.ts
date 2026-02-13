/**
 * ACHEEVY Revenue Verticals — Type Definitions
 *
 * Types for the two-phase vertical lifecycle:
 *   Phase A: Conversational chain (NLP trigger → collect requirements)
 *   Phase B: Execution pipeline (R-R-S → governance → agents → artifacts)
 *
 * Plus governance types:
 *   - Triple Audit Ledger (platform, user, web3-ready)
 *   - Digital Twin Rolodex (expert personas)
 *   - Bench scoring integration for ALL agents
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { ChainStep } from '../types/skills';

// Agent ID type — mirrors backend/uef-gateway/src/agents/types.ts
// Defined locally to avoid cross-boundary imports between aims-skills and backend
export type AgentId =
  | 'engineer-ang'
  | 'marketer-ang'
  | 'analyst-ang'
  | 'quality-ang'
  | 'chicken-hawk'
  | 'research-ang'
  | 'router-ang'
  | 'workflow-smith-squad'
  | 'vision-scout-squad';

// ---------------------------------------------------------------------------
// Vertical Phases & Categories
// ---------------------------------------------------------------------------

export type VerticalPhase =
  | 'conversation'       // Phase A: collecting requirements via chain steps
  | 'ready_to_execute'   // User confirmed, awaiting Phase B launch
  | 'executing'          // Phase B: pipeline running through agents
  | 'completed';         // Done — artifacts + receipts delivered

export type VerticalCategory =
  | 'ideation'
  | 'research'
  | 'branding'
  | 'marketing'
  | 'engineering'
  | 'automation';

export type AcheevyMode = 'business-builder' | 'growth-mode';

// ---------------------------------------------------------------------------
// Vertical Definition — Both conversation chain AND execution blueprint
// ---------------------------------------------------------------------------

export interface VerticalDefinition {
  id: string;
  name: string;
  category: VerticalCategory;
  tags: string[];
  triggers: RegExp[];

  /** Phase A: Conversational chain steps */
  chain_steps: ChainStep[];

  /** ACHEEVY instruction mode for this vertical */
  acheevy_mode: AcheevyMode;

  /** Domain tags for digital twin auto-matching */
  expert_domain: string[];

  /** Phase B: Execution blueprint */
  execution: ExecutionBlueprint;

  /** Revenue signal — what A.I.M.S. service this upsells */
  revenue_signal: {
    service: string;
    transition_prompt: string;
  };
}

// ---------------------------------------------------------------------------
// Execution Blueprint — How Phase B generates + runs the pipeline
// ---------------------------------------------------------------------------

export interface ExecutionBlueprint {
  /** Primary agent to dispatch pipeline to */
  primary_agent: string;

  /**
   * LLM meta-prompt with {placeholders} filled from collected Phase A data.
   * Instructs the LLM to generate step descriptions containing
   * STEP_AGENT_MAP keywords so Chicken Hawk can route them.
   */
  step_generation_prompt: string;

  /** Keys required from Phase A collectedData */
  required_context: string[];

  /** Fallback steps if LLM is unavailable */
  fallback_steps: string[];

  /** Whether Quality_Ang verification runs on final output */
  requires_verification: boolean;

  /** Max number of steps the LLM can generate */
  max_steps: number;
}

// ---------------------------------------------------------------------------
// Vertical Session — Runtime state for an active vertical
// ---------------------------------------------------------------------------

export interface VerticalSession {
  verticalId: string;
  userId: string;
  sessionId: string;
  phase: VerticalPhase;
  currentStep: number;
  collectedData: Record<string, unknown>;

  /** A2A task ID when in 'executing' phase */
  executionTaskId?: string;

  /** Which digital twin is active (if any) */
  activeTwinId?: string;

  /** Which ACHEEVY persona is active */
  activePersonaId?: string;

  startedAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Dynamic Pipeline — Output of R-R-S step generation
// ---------------------------------------------------------------------------

export interface DynamicPipeline {
  /** Generated step descriptions (contain STEP_AGENT_MAP keywords) */
  steps: string[];

  /** Agents estimated to handle each step */
  estimated_agents: string[];

  /** LLM rationale for the generated pipeline */
  rationale: string;

  /** ByteRover context from similar past executions */
  ragContext?: string;

  /** ORACLE gate score on generated steps */
  oracleScore?: number;

  /** Whether fallback steps were used (LLM unavailable) */
  usedFallback: boolean;
}

// ---------------------------------------------------------------------------
// Triple Audit Ledger Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'step_generated'
  | 'step_executed'
  | 'oracle_gated'
  | 'rag_retrieved'
  | 'rag_stored'
  | 'bench_scored'
  | 'vertical_completed'
  | 'pipeline_dispatched'
  | 'verification_passed'
  | 'verification_failed';

export interface AuditEntry {
  id: string;
  timestamp: string;
  verticalId: string;
  userId: string;
  sessionId: string;
  action: AuditAction;
  agentId?: string;
  data: Record<string, unknown>;
  cost?: { tokens: number; usd: number };
}

export interface PlatformLedgerEntry extends AuditEntry {
  ledger: 'platform';
  /** Link to CollaborationSession feed entry */
  feedEntryId?: string;
  /** Internal operational metrics */
  metrics?: Record<string, number>;
}

export interface UserLedgerEntry extends AuditEntry {
  ledger: 'user';
  /** Link to UCPSettlement receipt */
  receiptId?: string;
  /** IDs of artifacts produced */
  artifactIds?: string[];
}

export interface Web3LedgerEntry extends AuditEntry {
  ledger: 'web3';
  /** SHA-256 hash of this entry */
  hash: string;
  /** Previous entry's hash — forms the chain */
  previousHash: string;
  /** Hash of produced artifact (if any) */
  artifactHash?: string;
}

export type LedgerEntry = PlatformLedgerEntry | UserLedgerEntry | Web3LedgerEntry;

// ---------------------------------------------------------------------------
// Digital Twin Types — Expert personas ACHEEVY can channel
// ---------------------------------------------------------------------------

export type TwinEra = 'Modern' | 'Classic' | 'Legend';

export interface DigitalTwin {
  id: string;
  name: string;
  expertise: string;
  era: TwinEra;
  style: string;

  /** Named frameworks they're known for */
  signature_frameworks: string[];

  /** Pre-loaded contrarian perspectives */
  contrarian_insights: string[];

  /** How they give actionable advice */
  tactical_advice_style: string;

  /** Iconic phrases */
  catchphrases: string[];

  /** Mapped to VerticalCategory for auto-matching */
  domains: string[];
}

// ---------------------------------------------------------------------------
// Execution Engine Results
// ---------------------------------------------------------------------------

export interface VerticalExecutionResult {
  taskId: string;
  status: 'submitted' | 'executing' | 'completed' | 'failed';
  pipeline?: DynamicPipeline;
  auditSessionId: string;
  error?: string;
}

export interface StepScoreRecord {
  agentId: string;
  stepDescription: string;
  benchLevel: string;
  weightedTotal: number;
  passed: boolean;
  failedCategories: string[];
  timestamp: string;
}
