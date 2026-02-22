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
 *   - Transaction Model (every agent action is an owned, accountable transaction)
 *   - Methodology Engine (DMAIC, DMADV, FOSTER, DEVELOP, HONE, Look-Listen-Learn)
 *   - L.I.B. Instructions (Logic, Instructions, Behaviors — not "soul.md")
 *   - Look-Listen-Learn Engine (OCR, active listening, trigger detection, adaptation)
 *   - Personality Inheritance (Boomer_Ang trait index from ACHEEVY DNA)
 *   - Enterprise Workspace (org-level container, RBAC, multi-instance)
 *   - Enterprise Security (tenant isolation, compliance gates, network segmentation)
 *   - Enterprise Fleet Manager (bulk spin-up, fleet health, resource pooling)
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

// ── Transaction Model ───────────────────────────────────────────────────
export { transactionManager } from './transaction-model';
export type {
  Transaction,
  TransactionCategory,
  TransactionStatus,
  TransactionCost,
  GateType,
  GateResult,
} from './transaction-model';

// ── Methodology Engine ──────────────────────────────────────────────────
export {
  methodologyEngine,
  DMAIC,
  DMADV,
  FOSTER,
  DEVELOP,
  HONE,
  LOOK_LISTEN_LEARN,
  METHODOLOGIES,
} from './methodology-engine';
export type {
  MethodologyId,
  MethodologyPhase,
  MethodologyDefinition,
  MethodologySession,
} from './methodology-engine';

// ── Look-Listen-Learn Engine ────────────────────────────────────────────
export {
  analyzeLook,
  analyzeListen,
  analyzeEngagement,
  learnEngine,
} from './look-listen-learn';
export type {
  LookAnalysis,
  ExtractedEntity,
  ListenAnalysis,
  EmotionalSignal,
  EngagementTrigger,
  LearnEntry,
  UserLearningProfile,
} from './look-listen-learn';

// ── Personality Inheritance ─────────────────────────────────────────────
export {
  inheritPersonality,
  getMasterTraitLibrary,
  getRolePreference,
  getAllRolePreferences,
} from './personality-inheritance';
export type {
  PersonalityTrait,
  BoomerAngPersonality,
  RoleTraitPreference,
} from './personality-inheritance';

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
export {
  ACHEEVY_LOGIC,
  ACHEEVY_INSTRUCTIONS,
  ACHEEVY_BEHAVIORS,
  buildLIBPrompt,
} from './instructions/acheevy-lib.instructions';

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

// ── Enterprise Workspace ─────────────────────────────────────────────────
export {
  workspaceManager,
  ENTERPRISE_PLANS,
  ROLE_PERMISSIONS,
} from './enterprise-workspace';
export type {
  EnterpriseWorkspace,
  WorkspaceStatus,
  WorkspaceRole,
  WorkspaceMember,
  WorkspacePermission,
  WorkspaceEnvironment,
  ComplianceProfile,
  NetworkIsolation,
  WorkspaceResourceLimits,
  EnterprisePlanDefinition,
} from './enterprise-workspace';

// ── Enterprise Security ─────────────────────────────────────────────────
export {
  enterpriseSecurity,
  COMPLIANCE_GATES,
} from './enterprise-security';
export type {
  SecurityEvent,
  SecuritySeverity,
  SecurityEventCategory,
  ComplianceGate,
  ComplianceCheckResult,
  NetworkSecurityRule,
  DataBoundary,
} from './enterprise-security';

// ── Enterprise Fleet Manager ────────────────────────────────────────────
export { fleetManager } from './enterprise-fleet';
export type {
  FleetInstance,
  DeploymentManifest,
  ManifestInstance,
  FleetHealthSnapshot,
  BulkOperationResult,
} from './enterprise-fleet';

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
