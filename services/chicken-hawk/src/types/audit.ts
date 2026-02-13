// =============================================================================
// Chicken Hawk — Audit Types
// Immutable event log and evidence locker types.
// =============================================================================

export type AuditEventType =
  | "manifest_received"
  | "policy_check"
  | "squad_spawned"
  | "lil_hawk_spawned"
  | "wave_started"
  | "task_started"
  | "task_completed"
  | "task_failed"
  | "wave_completed"
  | "wave_failed"
  | "rollback_initiated"
  | "evidence_collected"
  | "shift_completed"
  | "shift_failed"
  | "emergency_stop"
  | "budget_exceeded"
  | "approval_requested"
  | "approval_granted"
  | "approval_denied";

export interface AuditEvent {
  event_id: string;
  event_type: AuditEventType;
  timestamp: string;
  shift_id: string;
  squad_id?: string;
  lil_hawk_id?: string;
  manifest_id: string;
  action: string;
  input_hash?: string;
  output_hash?: string;
  status: string;
  duration_ms?: number;
  luc_cost_usd?: number;
  policy_ref?: string;
  approved_by?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface FlightRecorderEntry {
  action: string;
  input: unknown;
  output: unknown;
  duration: number;
  status: string;
  error?: string;
  squad_id: string;
  timestamp: string;
}

export interface EvidenceLockerItem {
  evidence_id: string;
  shift_id: string;
  task_id: string;
  artifact_type: "RUN_LOG" | "PROOF_HASHES" | "ATTESTATION" | "SCREENSHOTS" | "DIFF_PATCHES";
  content_hash: string;
  storage_path: string;
  created_at: string;
  retention_expires_at: string;
}
