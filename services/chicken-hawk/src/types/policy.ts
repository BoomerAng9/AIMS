// =============================================================================
// Chicken Hawk — Policy Types
// Circuit Box levers and policy enforcement contracts.
// =============================================================================

export type AutonomyLevel = "manual" | "supervised" | "auto";
export type ToolPermission = "allow" | "deny" | "require_approval";
export type VoiceProvider = "elevenlabs" | "deepgram" | "browser";

export interface CircuitBoxConfig {
  autonomy_level: AutonomyLevel;
  tool_permissions: Record<string, ToolPermission>;
  network_egress: boolean;
  git_write_gate: boolean;
  voice_provider_routing: VoiceProvider;
  evidence_required: boolean;
  emergency_stop: boolean;
  budget_cap_usd: number;
  concurrency_limit: number;
  shift_timeout_seconds: number;
}

export interface PolicyCheckRequest {
  task_id: string;
  capability_id: string;
  badge_level: "green" | "amber" | "red";
  estimated_cost_usd: number;
  shift_id: string;
  lil_hawk_id: string;
  squad_id: string;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  requires_approval: boolean;
  approver?: string;
  policy_snapshot: CircuitBoxConfig;
}
