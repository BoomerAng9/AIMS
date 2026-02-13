// =============================================================================
// Chicken Hawk — Lil_Hawk Types
// Identity, lifecycle, and KYB registration for spawned workers.
// =============================================================================

export type CrewRole = "CraneOps" | "YardOps" | "SafetyOps" | "LoadOps" | "DispatchOps";

export type LilHawkFunction =
  | "Deploy" | "Scale" | "Update" | "Swap" | "Canary" | "Rollback" | "Terminate" | "Health"
  | "Assign" | "Bind" | "Attach" | "Release" | "Quarantine" | "Rebalance"
  | "Dispatch" | "Split" | "Pause" | "Resume" | "Route"
  | "Guard" | "Limit" | "Kill" | "Incident"
  | "Cleanup" | "Rotate" | "Prewarm" | "Heal" | "Detect"
  | "Move" | "Verify" | "Check" | "Export" | "Import" | "Sync" | "Monitor";

export type LilHawkStatus = "spawning" | "ready" | "executing" | "reporting" | "terminated";

export interface KYBRegistration {
  identity: string;               // KYB-LH-<shift_id>-<serial>
  moniker: string;                 // Deploy_CraneOps_Lil_Hawk_SFT-221-LH041
  persona_handle: string;          // Harbor_Lil_Hawk
  shift_id: string;
  squad_id: string;
  crew_role: CrewRole;
  function: LilHawkFunction;
  spawned_at: string;
  spawned_by: string;              // "chickenhawk-core"
  contract_ref: string;            // manifest_id
  capabilities: string[];          // capability IDs from registry
  flight_recorder_stream: string;  // audit stream ID
}

export interface LilHawk {
  id: string;                      // KYB identity
  moniker: string;
  persona_handle: string;
  kyb: KYBRegistration;
  status: LilHawkStatus;
  task_id: string;
  started_at?: string;
  completed_at?: string;
  output?: unknown;
  error?: string;
}

export interface Squad {
  squad_id: string;                // Squad_SFT-221-B03
  shift_id: string;
  manifest_id: string;
  lil_hawks: LilHawk[];
  created_at: string;
  status: "active" | "completed" | "aborted";
}
