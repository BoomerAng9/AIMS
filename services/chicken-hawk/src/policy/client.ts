// =============================================================================
// Chicken Hawk — Policy Client
// Communicates with chickenhawk-policy service for Circuit Box enforcement.
// "Packet first. Proof always." — nothing runs without policy clearance.
// =============================================================================

import type {
  PolicyCheckRequest,
  PolicyCheckResult,
  CircuitBoxConfig,
} from "../types";

const DEFAULT_CONFIG: CircuitBoxConfig = {
  autonomy_level: "supervised",
  tool_permissions: {},
  network_egress: false,
  git_write_gate: false,
  voice_provider_routing: "elevenlabs",
  evidence_required: true,
  emergency_stop: false,
  budget_cap_usd: 10.0,
  concurrency_limit: 5,
  shift_timeout_seconds: 300,
};

export class PolicyClient {
  private policyUrl: string;
  private configCache: CircuitBoxConfig | null = null;

  constructor(policyUrl?: string) {
    this.policyUrl = policyUrl || process.env.POLICY_URL || "http://chickenhawk-policy:4002";
  }

  /**
   * Check if a task is allowed to execute under current policy.
   * Falls back to local evaluation if policy service is unavailable.
   */
  async check(request: PolicyCheckRequest): Promise<PolicyCheckResult> {
    try {
      const res = await fetch(`${this.policyUrl}/api/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        return res.json() as Promise<PolicyCheckResult>;
      }
    } catch {
      // Policy service unavailable — fall back to local evaluation
      console.warn("[policy-client] Policy service unavailable, using local evaluation");
    }

    return this.localEvaluate(request);
  }

  /**
   * Get current Circuit Box configuration
   */
  async getConfig(): Promise<CircuitBoxConfig> {
    if (this.configCache) return this.configCache;

    try {
      const res = await fetch(`${this.policyUrl}/api/config`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        this.configCache = await res.json() as CircuitBoxConfig;
        return this.configCache;
      }
    } catch {
      // Unavailable — use defaults
    }

    return DEFAULT_CONFIG;
  }

  /**
   * Trigger emergency stop across all services
   */
  async emergencyStop(): Promise<boolean> {
    try {
      const res = await fetch(`${this.policyUrl}/api/emergency-stop`, {
        method: "POST",
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Local policy evaluation when the policy service is down.
   * Conservative: denies amber/red by default, allows green only.
   */
  private async localEvaluate(request: PolicyCheckRequest): Promise<PolicyCheckResult> {
    const config = await this.getConfig();

    // Emergency stop — deny everything
    if (config.emergency_stop) {
      return {
        allowed: false,
        reason: "Emergency stop is active",
        requires_approval: false,
        policy_snapshot: config,
      };
    }

    // Budget check
    if (request.estimated_cost_usd > config.budget_cap_usd) {
      return {
        allowed: false,
        reason: `Estimated cost $${request.estimated_cost_usd} exceeds budget cap $${config.budget_cap_usd}`,
        requires_approval: false,
        policy_snapshot: config,
      };
    }

    // Tool permission check
    const toolPerm = config.tool_permissions[request.capability_id];
    if (toolPerm === "deny") {
      return {
        allowed: false,
        reason: `Tool ${request.capability_id} is explicitly denied by policy`,
        requires_approval: false,
        policy_snapshot: config,
      };
    }

    // Badge level enforcement
    if (request.badge_level === "red") {
      return {
        allowed: false,
        reason: "Red badge operations require explicit owner approval — cannot auto-approve",
        requires_approval: true,
        approver: "owner",
        policy_snapshot: config,
      };
    }

    if (request.badge_level === "amber") {
      if (config.autonomy_level === "auto") {
        return {
          allowed: false,
          reason: "Amber badge operations require Boomer_Ang approval even in auto mode",
          requires_approval: true,
          approver: "boomer_ang",
          policy_snapshot: config,
        };
      }
      return {
        allowed: false,
        reason: "Amber badge operations require Boomer_Ang approval",
        requires_approval: true,
        approver: "boomer_ang",
        policy_snapshot: config,
      };
    }

    // Green badge
    if (config.autonomy_level === "auto" || config.autonomy_level === "supervised") {
      return {
        allowed: true,
        reason: "Green badge — auto-approved under current autonomy level",
        requires_approval: false,
        policy_snapshot: config,
      };
    }

    // Manual mode — everything requires approval
    return {
      allowed: false,
      reason: "Manual autonomy mode — all operations require approval",
      requires_approval: true,
      approver: "boomer_ang",
      policy_snapshot: config,
    };
  }

  invalidateCache(): void {
    this.configCache = null;
  }
}
