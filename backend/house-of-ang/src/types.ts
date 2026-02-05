/**
 * House of Ang — Type Definitions
 * Core types for the BoomerAng registry and routing system.
 */

export interface BoomerAngDefinition {
  id: string;
  name: string;
  source_repo: string;
  description: string;
  capabilities: string[];
  required_quotas: Record<string, number>;
  endpoint: string;
  health_check: string;
  status: 'registered' | 'active' | 'degraded' | 'offline';
}

export interface BoomerAngRegistry {
  boomerangs: BoomerAngDefinition[];
  capability_index: Record<string, string[]>;
  version: string;
  last_updated: string;
}

export interface BoomerAngHealthStatus {
  id: string;
  name: string;
  healthy: boolean;
  latencyMs: number | null;
  lastChecked: string;
}

export interface RouteResult {
  matched: BoomerAngDefinition[];
  unmatched_capabilities: string[];
}

export interface BoomerAngInvocation {
  boomerang_id: string;
  user_id: string;
  intent: string;
  payload: Record<string, any>;
}

export interface BoomerAngExecutionResult {
  boomerang_id: string;
  status: 'success' | 'error' | 'timeout';
  data?: any;
  error?: string;
  duration_ms: number;
}
