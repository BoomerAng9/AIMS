// =============================================================================
// Chicken Hawk — Manifest Types
// The execution packet format. Nothing runs without a valid manifest.
// =============================================================================

export type BadgeLevel = "green" | "amber" | "red";
export type WaveGate = "all_pass" | "majority_pass" | "any_pass";
export type TaskStatus = "pending" | "running" | "success" | "failed" | "rolled_back" | "skipped";
export type ManifestStatus = "received" | "policy_check" | "planning" | "executing" | "verifying" | "completed" | "failed" | "aborted";
export type WrapperType = "SERVICE_WRAPPER" | "JOB_RUNNER_WRAPPER" | "CLI_WRAPPER" | "MCP_BRIDGE_WRAPPER";

export interface ManifestTask {
  task_id: string;
  function: string;
  crew_role: string;
  target: string;
  params: Record<string, unknown>;
  badge_level: BadgeLevel;
  wrapper_type: WrapperType;
  estimated_cost_usd: number;
  timeout_seconds: number;
}

export interface ManifestWave {
  wave_id: number;
  tasks: ManifestTask[];
  concurrency: number;
  gate: WaveGate;
}

export interface ManifestPlan {
  waves: ManifestWave[];
}

export interface Manifest {
  manifest_id: string;
  requested_by: string;
  approved_by: string;
  shift_id: string;
  plan: ManifestPlan;
  budget_limit_usd: number;
  timeout_seconds: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface TaskResult {
  task_id: string;
  lil_hawk_id: string;
  status: TaskStatus;
  output: unknown;
  input_hash: string;
  output_hash: string;
  duration_ms: number;
  luc_cost_usd: number;
  error?: string;
  evidence: EvidenceArtifact[];
}

export interface WaveResult {
  wave_id: number;
  status: TaskStatus;
  task_results: TaskResult[];
  duration_ms: number;
}

export interface ManifestResult {
  manifest_id: string;
  shift_id: string;
  status: ManifestStatus;
  wave_results: WaveResult[];
  total_duration_ms: number;
  total_luc_cost_usd: number;
  completed_at: string;
}

export interface EvidenceArtifact {
  type: "RUN_LOG" | "PROOF_HASHES" | "ATTESTATION" | "SCREENSHOTS" | "DIFF_PATCHES";
  format: string;
  content_hash: string;
  storage_path: string;
  created_at: string;
}
