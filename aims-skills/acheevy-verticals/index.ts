/**
 * ACHEEVY Revenue Verticals — Barrel Export
 *
 * Two-phase vertical lifecycle:
 *   Phase A: Conversational chain (NLP → collect requirements)
 *   Phase B: Execution pipeline (R-R-S → governance → agents → artifacts)
 *
 * Full governance stack:
 *   - ORACLE 8-gate verification on generated steps
 *   - ByteRover RAG for learning from repetitive requests
 *   - Bench scoring for ALL agents (not just Lil_Hawks)
 *   - Triple audit ledger (platform, user, web3-ready hash chain)
 *   - Digital Twin Rolodex (20+ expert personas)
 *   - HR PMO maturation signals (promotion/coaching)
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

// ── Vertical Definitions ────────────────────────────────────────────────
export {
  VERTICALS,
  getVertical,
  getAllVerticals,
  matchVertical,
  detectBusinessIntent,
  getVerticalsByCategory,
} from './vertical-definitions';

// ── Execution Engine (R-R-S) ────────────────────────────────────────────
export {
  generateDynamicSteps,
  executeVertical,
  scoreAndAudit,
  postExecutionHooks,
} from './execution-engine';

// ── Triple Audit Ledger ─────────────────────────────────────────────────
export { auditLedger, createAuditEntry } from './audit-ledger';

// ── Digital Twin Rolodex ────────────────────────────────────────────────
export {
  DIGITAL_TWINS,
  findBestTwin,
  buildTwinPrompt,
  findTwinById,
  searchTwins,
  getTwinsByDomain,
} from './digital-twin-rolodex';

// ── Instructions ────────────────────────────────────────────────────────
export { BUSINESS_BUILDER_INSTRUCTIONS } from './instructions/business-builder.instructions';
export { GROWTH_MODE_INSTRUCTIONS } from './instructions/growth-mode.instructions';

// ── Lifecycle Hook ──────────────────────────────────────────────────────
export {
  verticalDetectionHook,
  beforeAcheevyResponse,
  afterUserMessage,
  getSession,
  clearSession,
  updateCollectedData,
  completeSession,
} from './hooks/vertical-detection.hook';

// ── Types ───────────────────────────────────────────────────────────────
export type {
  VerticalDefinition,
  VerticalSession,
  VerticalPhase,
  VerticalCategory,
  AcheevyMode,
  ExecutionBlueprint,
  DynamicPipeline,
  VerticalExecutionResult,
  StepScoreRecord,
  AuditEntry,
  AuditAction,
  PlatformLedgerEntry,
  UserLedgerEntry,
  Web3LedgerEntry,
  LedgerEntry,
  DigitalTwin,
  TwinEra,
} from './types';
