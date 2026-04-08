/**
 * Factory Controller Types
 *
 * Type definitions for the always-on factory controller,
 * FDH pipeline, and machine-job billing.
 */

// ── Event Sources ────────────────────────────────────────────

export type FactoryEventSource =
  | 'git'          // Push, PR merge, branch, tag
  | 'spec'         // New/updated spec in Firestore
  | 'ticket'       // Ticket created/updated
  | 'telemetry'    // Health check failure, resource threshold
  | 'schedule'     // Cron triggers, recurring tasks
  | 'user'         // "Manage It" clicked, manual trigger
  | 'build'        // Chicken Hawk build complete
  | 'deploy'       // Instance deployed, scaled, decommissioned
  | 'automation';  // Automation trigger from automations engine

export interface FactoryEvent {
  id: string;
  source: FactoryEventSource;
  type: string;                    // e.g. "git_push", "spec_change", "health_failure"
  payload: Record<string, unknown>;
  chamberId?: string;              // Which chamber this event belongs to
  userId?: string;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

// ── Factory Policy (Circuit Box Controls) ────────────────────

export interface FactoryPolicy {
  enabled: boolean;
  autoApproveThresholdUsd: number;    // Max LUC cost for auto-approve
  maxConcurrentFdh: number;            // Max parallel FDH pipelines
  hours: 'always' | 'business' | 'custom';
  customHours?: { start: string; end: string; timezone: string };
  stallTimeoutMinutes: number;
  monthlyBudgetCapUsd: number;
  eventSources: FactoryEventSource[] | 'all';
  autoWireEnabled: boolean;
  healthRemediation: 'restart_then_scale' | 'alert_only' | 'auto_scale';
}

// ── FDH Pipeline Types ───────────────────────────────────────

export type FDHPhase = 'foster' | 'develop' | 'hone';

export type FDHRunStatus =
  | 'pending'         // Manifest created, awaiting approval
  | 'approved'        // Manifest approved, ready to execute
  | 'fostering'       // Foster phase active
  | 'foster_complete' // Foster done, moving to develop
  | 'developing'      // Develop phase active
  | 'develop_complete'// Develop done, moving to hone
  | 'honing'          // Hone phase active (ORACLE verification)
  | 'hone_complete'   // Hone passed, ready to deliver
  | 'delivering'      // Deploying / delivering results
  | 'completed'       // Full pipeline done, receipt sealed
  | 'failed'          // Pipeline failed (with reason)
  | 'stalled'         // No progress for > stall timeout
  | 'paused'          // Manually paused
  | 'awaiting_approval'; // HITL gate — waiting for human

export interface FDHManifest {
  id: string;
  triggerId: string;              // Event that triggered this run
  triggerSource: FactoryEventSource;
  chamberId: string;
  userId: string;
  scope: string;                  // What needs to be done
  constraints: string[];
  dependencies: string[];
  risks: string[];
  plan: {
    foster: { steps: string[]; estimatedTokens: number; agents: string[] };
    develop: { steps: string[]; estimatedTokens: number; agents: string[] };
    hone: { steps: string[]; estimatedTokens: number; agents: string[] };
  };
  lucEstimate: {
    totalTokens: number;
    totalUsd: number;
    byteRoverDiscount: number;
  };
  approvalRequired: boolean;       // false = Deploy It lane, true = Guide Me lane
  priority: 'standard' | 'priority' | 'urgent';
  createdAt: string;
}

export interface FDHRun {
  id: string;
  manifestId: string;
  manifest: FDHManifest;
  status: FDHRunStatus;
  currentPhase: FDHPhase | null;
  phaseResults: {
    foster?: FosterResult;
    develop?: DevelopResult;
    hone?: HoneResult;
  };
  shiftId?: string;                // Chicken Hawk shift ID
  overseerAgent?: string;          // Boomer_Ang overseeing this run
  pollIntervalMs: number;
  retryCount: number;
  maxRetries: number;
  lucActual: {
    totalTokens: number;
    totalUsd: number;
  };
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  receipt?: BAMARAMReceipt;
  error?: string;
}

export interface FosterResult {
  context: Record<string, unknown>;      // ByteRover + Chronicle context
  requirements: Record<string, unknown>; // Analyzed requirements
  fosterManifest: FDHManifest;
  completedAt: string;
}

export interface DevelopResult {
  artifacts: DevelopArtifact[];
  buildLogs: string[];
  wavesCompleted: number;
  wavesTotal: number;
  completedAt: string;
}

export interface DevelopArtifact {
  type: 'code' | 'config' | 'workflow' | 'integration' | 'test';
  path: string;
  hash?: string;
}

export interface HoneResult {
  oracleGates: OracleGateResult[];
  oracleScore: number;             // X out of 8
  allGatesPassed: boolean;
  securityScanPassed: boolean;
  performanceScore: number;
  completedAt: string;
}

// ── ORACLE Gates ─────────────────────────────────────────────

export type OracleGateName =
  | 'CODE_QUALITY'
  | 'TEST_PASS'
  | 'SECURITY_SCAN'
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'RESPONSIVE'
  | 'BRAND_COMPLIANCE'
  | 'LUC_ACCURACY';

export interface OracleGateResult {
  gate: OracleGateName;
  passed: boolean;
  score?: number;
  evidence: string;
  details?: Record<string, unknown>;
}

// ── BAMARAM Receipt ──────────────────────────────────────────

export interface BAMARAMReceipt {
  receiptId: string;
  fdhRunId: string;
  oracleScore: number;
  gatesPassed: OracleGateName[];
  gatesFailed: OracleGateName[];
  artifacts: Array<{
    type: string;
    path: string;
    hash: string;
  }>;
  lucActual: {
    totalTokens: number;
    totalUsd: number;
    varianceFromEstimate: string;  // e.g. "+5.2%"
  };
  sealedAt: string;
  sealedBy: string;
  deployApproved: boolean;
}

// ── Chamber State ────────────────────────────────────────────

export type ChamberStatus = 'active' | 'watching' | 'paused' | 'completed';

export interface ChamberState {
  id: string;
  name: string;
  status: ChamberStatus;
  userId: string;
  pollIntervalMs: number;           // 30000 active, 300000 watching
  activeFdhRuns: string[];          // FDH run IDs
  completedFdhRuns: number;
  totalLucSpent: number;
  lastEventAt?: string;
  createdAt: string;
}

// ── Factory Status Report ────────────────────────────────────

export interface FactoryStatusReport {
  factoryEnabled: boolean;
  status: 'active' | 'paused' | 'idle';
  activeChambers: number;
  activeFdhRuns: number;
  pendingApprovals: number;
  recentCompletions: Array<{
    runId: string;
    scope: string;
    completedAt: string;
    oracleScore: number;
  }>;
  periodCost: {
    totalUsd: number;
    budgetCapUsd: number;
    utilizationPct: number;
  };
  uptime: number;                   // Seconds since factory started
}
