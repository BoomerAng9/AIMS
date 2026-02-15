/**
 * Lil_Hawks — Ephemeral Shift-Scoped Specialist Agents
 *
 * Unlike Boomer_Angs (persistent domain specialists), Lil_Hawks are
 * lightweight, task-scoped workers that operate in squads.
 *
 * Naming convention: FUNCTION_LIL_HAWK (all caps, underscore separated)
 *
 * Squads:
 *   PREP_SQUAD_ALPHA    — Pre-execution intelligence (6 hawks)
 *   WORKFLOW_SMITH_SQUAD — n8n workflow integrity (4 hawks)
 *   VISION_SCOUT_SQUAD  — Video/footage assessment (3 hawks)
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

// ---------------------------------------------------------------------------
// Lil_Hawk identifiers — canonical NAME_LIL_HAWK convention
// ---------------------------------------------------------------------------

export type LilHawkId =
  // PREP_SQUAD_ALPHA — Pre-Execution Intelligence
  | 'INTAKE_LIL_HAWK'
  | 'DECOMP_LIL_HAWK'
  | 'CONTEXT_LIL_HAWK'
  | 'POLICY_LIL_HAWK'
  | 'COST_LIL_HAWK'
  | 'ROUTER_LIL_HAWK'
  // WORKFLOW_SMITH_SQUAD — n8n Workflow Integrity
  | 'AUTHOR_LIL_HAWK'
  | 'VALIDATE_LIL_HAWK'
  | 'FAILURE_LIL_HAWK'
  | 'GATE_LIL_HAWK'
  // VISION_SCOUT_SQUAD — Video/Footage Assessment
  | 'VISION_LIL_HAWK'
  | 'SIGNAL_LIL_HAWK'
  | 'COMPLIANCE_LIL_HAWK';

export type SquadId = 'prep-squad-alpha' | 'workflow-smith' | 'vision-scout';

export interface LilHawkProfile {
  id: LilHawkId;
  name: string;
  squad: SquadId;
  role: string;
  gate: boolean;       // true = this hawk is a gate (can block progression)
}

// ---------------------------------------------------------------------------
// PREP_SQUAD_ALPHA types — Pre-Execution Intelligence
// ---------------------------------------------------------------------------

export interface NormalizedIntent {
  raw: string;
  normalized: string;
  signals: string[];           // extracted intent signals
  ambiguities: string[];       // detected ambiguities
  noiseFiltered: string[];     // filtered noise tokens
  language: string;            // detected language
}

export interface TaskNode {
  id: string;
  objective: string;
  dependencies: string[];      // IDs of nodes that must complete first
  parallelizable: boolean;
  missingInputs: string[];
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TaskGraph {
  nodes: TaskNode[];
  entryPoints: string[];       // node IDs with no dependencies
  criticalPath: string[];      // longest dependency chain
  totalNodes: number;
}

export interface ContextBundle {
  domains: string[];           // knowledge domains required
  scopedContext: Record<string, unknown>;
  payloadSizeTokens: number;
  sources: string[];           // where context was pulled from
}

export interface PolicyManifest {
  cleared: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  permissions: string[];       // KYB-cleared permissions
  sandboxRequired: boolean;
  toolsEligible: string[];     // which tools this task can use
  blockers: string[];          // reasons for denial
}

export interface CostEstimate {
  tokenClass: 'LIGHT' | 'STANDARD' | 'HEAVY' | 'ENTERPRISE';
  estimatedTokens: number;
  estimatedUsd: number;
  executionDepth: number;      // how many agent hops
  highCostFlags: string[];     // patterns that inflate cost
}

export interface ExecutionPacket {
  packetId: string;
  normalizedIntent: NormalizedIntent;
  taskGraph: TaskGraph;
  contextBundle: ContextBundle;
  policyManifest: PolicyManifest;
  costEstimate: CostEstimate;
  routingDecision: {
    engine: 'ORACLE' | 'N8N' | 'HYBRID';
    executionOwner: string;    // Boomer_Ang ID or squad
    fallback: string | null;
  };
  timestamp: string;
}

// ---------------------------------------------------------------------------
// WORKFLOW_SMITH_SQUAD types — n8n Workflow Integrity
// ---------------------------------------------------------------------------

export interface WorkflowArtifacts {
  workflowJson: Record<string, unknown>;
  manifest: WorkflowManifest;
  testPack: TestPack;
  failureMatrix: FailureCase[];
  versionStamp: VersionStamp;
}

export interface WorkflowManifest {
  workflowId: string;
  name: string;
  description: string;
  inputs: Array<{ name: string; type: string; required: boolean }>;
  outputs: Array<{ name: string; type: string }>;
  dependencies: string[];
  secretsRequired: string[];
  estimatedDurationMs: number;
  nodeCount: number;
}

export interface TestPack {
  cases: TestCase[];
  coveragePercent: number;
}

export interface TestCase {
  name: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  expectSuccess: boolean;
}

export interface FailureCase {
  scenario: string;
  trigger: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string;
  handled: boolean;
}

export interface VersionStamp {
  version: string;
  author: LilHawkId;
  reviewedBy: LilHawkId[];
  timestamp: string;
  changeSummary: string;
  checksum: string;
}
