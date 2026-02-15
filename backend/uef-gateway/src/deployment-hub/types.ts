/**
 * Deployment Hub — Type Definitions
 *
 * Canonical types for spawning, managing, and decommissioning
 * Boomer_Angs and Lil_Hawks under ACHEEVY's delegation.
 */

// ── Spawn Types ─────────────────────────────────────────────

export type SpawnType = 'BOOMER_ANG' | 'LIL_HAWK' | 'AUTONOMOUS_SESSION';

export type SpawnStatus =
  | 'REQUESTED'
  | 'GATE_CHECK'
  | 'SPAWNING'
  | 'ACTIVE'
  | 'DRAINING'
  | 'DECOMMISSIONED'
  | 'FAILED';

export type EnvironmentTarget =
  | 'PRODUCTION'
  | 'LIVESIM'
  | 'PERFORM_PLATFORM'
  | 'DOJO'
  | 'SANDBOX';

// ── Visual Identity ─────────────────────────────────────────

export interface VisualIdentity {
  accentColor: string;
  accentName: string;
  helmetStyle: string;
  roleTool: string;
  description: string;
  angPlacement: 'chest_plate' | 'shoulder_sleeve';
}

// ── Role Card (loaded from JSON) ────────────────────────────

export interface RoleCardIdentity {
  display_name: string;
  origin: string;
  motivation: string;
  quirk: string;
  catchphrase: string;
  communication_style: string;
}

export interface RoleCard {
  schema_version: string;
  handle: string;
  role_type: string;
  pmo_office: string;
  bench_level: string;
  identity: RoleCardIdentity;
  visual_identity?: VisualIdentity;
  chain_of_command: {
    reports_to: string | null;
    can_message: string[];
    cannot_message: string[];
  };
  capabilities: {
    specialties: string[];
    allowed_actions: string[];
    forbidden_actions: string[];
    allowed_tools: string[];
    forbidden_tools: string[];
  };
  gates: {
    luc_budget: {
      required: boolean;
      max_estimated_cost_usd: number | null;
      max_estimated_tokens: number | null;
      on_exceed: string;
    };
    evidence: {
      required_artifacts: string[];
      no_proof_no_done: boolean;
    };
    security: Record<string, boolean | string[]>;
    approval: {
      required_for_actions: string[];
      approvers: string[];
    };
  };
  evaluation: {
    kpis: string[];
    review_cycle: string;
    reviewed_by: string[];
  };
}

// ── Spawn Request & Record ──────────────────────────────────

export interface SpawnRequest {
  spawnType: SpawnType;
  handle: string;
  requestedBy: string;
  taskId?: string;
  environment: EnvironmentTarget;
  budgetCapUsd?: number;
  sessionDurationMaxS?: number | null;
  context?: Record<string, unknown>;
}

export interface SpawnRecord {
  spawnId: string;
  spawnType: SpawnType;
  handle: string;
  requestedBy: string;
  taskId: string | null;
  environment: EnvironmentTarget;
  status: SpawnStatus;
  roleCard: RoleCard | null;
  visualIdentity: VisualIdentity | null;
  budgetCapUsd: number | null;
  sessionDurationMaxS: number | null;
  gatesPassed: string[];
  createdAt: string;
  updatedAt: string;
  decommissionedAt: string | null;
}

// ── Audit Entry ─────────────────────────────────────────────

export interface SpawnAuditEntry {
  entryId: string;
  spawnId: string;
  action: 'SPAWN' | 'GATE_PASS' | 'GATE_FAIL' | 'ACTIVATE' | 'DECOMMISSION' | 'ERROR';
  actor: string;
  details: string;
  timestamp: string;
}

// ── Deployment Hub Response ─────────────────────────────────

export interface SpawnResponse {
  success: boolean;
  spawnId: string;
  handle: string;
  status: SpawnStatus;
  roleCard: RoleCard | null;
  visualIdentity: VisualIdentity | null;
  gatesPassed: string[];
  auditTrail: SpawnAuditEntry[];
  error?: string;
}

export interface RosterEntry {
  handle: string;
  spawnType: SpawnType;
  status: SpawnStatus;
  environment: EnvironmentTarget;
  accentColor: string;
  pmoOffice: string;
  catchphrase: string;
  spawnId: string;
  createdAt: string;
}
