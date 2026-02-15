// =============================================================================
// Chicken Hawk — Tool Adapter Base
// Every tool access goes through an adapter. No direct execution.
// Per tool-registry-contract.json v2: "Chicken Hawk and Lil_Hawks don't get
// direct tool authority unless a Boomer_Ang explicitly delegates."
// =============================================================================

import type { CircuitBoxConfig, WrapperType } from "../types";

export interface ExecutionContext {
  shift_id: string;
  lil_hawk_id: string;
  squad_id: string;
  budget_remaining_usd: number;
  policy_snapshot: CircuitBoxConfig;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
  duration_ms: number;
}

export interface ToolAdapter {
  id: string;
  wrapper_type: WrapperType;
  required_permissions: string[];
  luc_metered: boolean;
  execute(params: Record<string, unknown>, context: ExecutionContext): Promise<unknown>;
}
