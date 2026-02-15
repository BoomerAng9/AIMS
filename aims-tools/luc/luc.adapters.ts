// @ts-nocheck
/**
 * LUC Adapters - Bindings for UI and API Consumers
 * @version 2.0.0
 *
 * This module provides the interface layer between the headless LUC engine
 * and external consumers (UI, API routes, etc.). All math/logic lives in
 * luc.engine.ts - this module only handles data transformation and API calls.
 */

import {
  canExecute,
  estimate,
  recordUsage,
  creditUsage,
  generateSummary,
  generateLucState,
  calculatePercentUsed,
  calculateRemaining,
  determineWarningLevel,
} from "./luc.engine";
import {
  SERVICE_CATALOG,
  SERVICE_KEYS,
  LUC_DEFAULTS,
  type ServiceKey,
} from "./luc.constants";
import {
  CanExecuteRequestSchema,
  EstimateRequestSchema,
  RecordUsageRequestSchema,
  CreditUsageRequestSchema,
  SummaryRequestSchema,
  type LucAccount,
  type CanExecuteRequest,
  type CanExecuteResponse,
  type EstimateRequest,
  type EstimateResponse,
  type RecordUsageRequest,
  type RecordUsageResponse,
  type CreditUsageRequest,
  type CreditUsageResponse,
  type SummaryRequest,
  type SummaryResponse,
  type LucState,
  type Quota,
} from "./luc.schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Adapter Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LucStorageAdapter {
  getAccount(workspaceId: string): Promise<LucAccount | null>;
  updateQuota(workspaceId: string, serviceKey: ServiceKey, quota: Quota): Promise<void>;
  appendUsageEvent(event: any): Promise<void>;
  getUsageBreakdown(
    workspaceId: string,
    days: number
  ): Promise<Record<ServiceKey, { date: string; units: number; cost: number }[]>>;
  getActiveBoomerAngs(workspaceId: string): Promise<string[]>;
}

export interface LucPolicyAdapter {
  getEffectivePolicy(scope: string, scopeId?: string): Promise<Record<string, any>>;
  getPlanLimits(planId: string): Promise<Record<ServiceKey, number>>;
  canShowBoomerAngNames(workspaceId: string): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LUC Service Adapter
// ─────────────────────────────────────────────────────────────────────────────

export class LucAdapter {
  constructor(
    private storage: LucStorageAdapter,
    private policy: LucPolicyAdapter
  ) {}

  /**
   * Check if an operation can be executed
   */
  async canExecute(request: CanExecuteRequest): Promise<CanExecuteResponse> {
    // Validate request
    const validated = CanExecuteRequestSchema.parse(request);

    // Get account
    const account = await this.storage.getAccount(validated.workspaceId);
    if (!account) {
      return {
        canExecute: false,
        reason: "Account not found",
        quotaRemaining: 0,
        quotaLimit: 0,
        percentUsed: 0,
        wouldExceed: true,
        overage: 0,
        warning: "Workspace not found",
        warningLevel: "blocked",
      };
    }

    // Delegate to engine
    return canExecute(account, validated.serviceKey, validated.units);
  }

  /**
   * Estimate impact without mutating
   */
  async estimate(request: EstimateRequest): Promise<EstimateResponse> {
    const validated = EstimateRequestSchema.parse(request);

    const account = await this.storage.getAccount(validated.workspaceId);
    if (!account) {
      throw new Error("Account not found");
    }

    return estimate(account, validated);
  }

  /**
   * Record usage and update quotas
   */
  async recordUsage(request: RecordUsageRequest): Promise<RecordUsageResponse> {
    const validated = RecordUsageRequestSchema.parse(request);

    const account = await this.storage.getAccount(validated.workspaceId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Execute in engine
    const { updatedQuota, event, response } = recordUsage(account, validated);

    // Persist changes
    await this.storage.updateQuota(validated.workspaceId, validated.serviceKey, updatedQuota);
    await this.storage.appendUsageEvent(event);

    return response;
  }

  /**
   * Credit usage back
   */
  async creditUsage(request: CreditUsageRequest): Promise<CreditUsageResponse> {
    const validated = CreditUsageRequestSchema.parse(request);

    const account = await this.storage.getAccount(validated.workspaceId);
    if (!account) {
      throw new Error("Account not found");
    }

    const { updatedQuota, event, response } = creditUsage(account, validated);

    await this.storage.updateQuota(validated.workspaceId, validated.serviceKey, updatedQuota);
    await this.storage.appendUsageEvent(event);

    return response;
  }

  /**
   * Get usage summary
   */
  async getSummary(request: SummaryRequest): Promise<SummaryResponse> {
    const validated = SummaryRequestSchema.parse(request);

    const account = await this.storage.getAccount(validated.workspaceId);
    if (!account) {
      throw new Error("Account not found");
    }

    let breakdown: Record<ServiceKey, { date: string; units: number; cost: number }[]> | undefined;
    if (validated.includeBreakdown) {
      breakdown = await this.storage.getUsageBreakdown(
        validated.workspaceId,
        validated.historyDays
      );
    }

    return generateSummary(account, breakdown);
  }

  /**
   * Get LUC state for status strip
   */
  async getLucState(workspaceId: string): Promise<LucState> {
    const account = await this.storage.getAccount(workspaceId);
    if (!account) {
      return {
        overallPercent: 0,
        warningLevel: "none",
        activeBoomerAngs: 0,
        projectedOverage: 0,
        daysRemaining: 0,
        topServices: [],
      };
    }

    const activeBoomerAngs = await this.storage.getActiveBoomerAngs(workspaceId);
    const showNames = await this.policy.canShowBoomerAngNames(workspaceId);

    return generateLucState(account, activeBoomerAngs, showNames);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Helper Functions (No math - just formatting)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format quota for display
 */
export function formatQuota(quota: Quota): string {
  if (quota.limit === -1) {
    return `${quota.used.toLocaleString()} / Unlimited`;
  }
  return `${quota.used.toLocaleString()} / ${quota.limit.toLocaleString()}`;
}

/**
 * Format cost for display
 */
export function formatCost(cost: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

/**
 * Format percentage for display
 */
export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Get color class for warning level
 */
export function getWarningColor(level: "none" | "soft" | "hard" | "exceeded" | "blocked"): string {
  switch (level) {
    case "none":
      return "text-green-400";
    case "soft":
      return "text-yellow-400";
    case "hard":
      return "text-orange-400";
    case "exceeded":
    case "blocked":
      return "text-red-400";
  }
}

/**
 * Get background color class for warning level
 */
export function getWarningBgColor(level: "none" | "soft" | "hard" | "exceeded" | "blocked"): string {
  switch (level) {
    case "none":
      return "bg-green-500/10";
    case "soft":
      return "bg-yellow-500/10";
    case "hard":
      return "bg-orange-500/10";
    case "exceeded":
    case "blocked":
      return "bg-red-500/10";
  }
}

/**
 * Get service display info
 */
export function getServiceDisplayInfo(serviceKey: ServiceKey): {
  name: string;
  unit: string;
  unitPlural: string;
  category: string;
} {
  const service = SERVICE_CATALOG[serviceKey];
  return {
    name: service?.name || serviceKey,
    unit: service?.unit || "unit",
    unitPlural: service?.unitPlural || "units",
    category: service?.category || "unknown",
  };
}

/**
 * Get all service keys
 */
export function getAllServiceKeys(): ServiceKey[] {
  return Object.values(SERVICE_KEYS);
}

/**
 * Group services by category
 */
export function groupServicesByCategory(): Record<string, ServiceKey[]> {
  const groups: Record<string, ServiceKey[]> = {};

  for (const [key, service] of Object.entries(SERVICE_CATALOG)) {
    const category = service.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(key as ServiceKey);
  }

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Client (for frontend use)
// ─────────────────────────────────────────────────────────────────────────────

export class LucApiClient {
  private baseUrl: string;

  constructor(baseUrl = "/api/luc") {
    this.baseUrl = baseUrl;
  }

  async canExecute(request: CanExecuteRequest): Promise<CanExecuteResponse> {
    const response = await fetch(`${this.baseUrl}/can-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LUC canExecute failed: ${response.statusText}`);
    }

    return response.json();
  }

  async estimate(request: EstimateRequest): Promise<EstimateResponse> {
    const response = await fetch(`${this.baseUrl}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LUC estimate failed: ${response.statusText}`);
    }

    return response.json();
  }

  async recordUsage(request: RecordUsageRequest): Promise<RecordUsageResponse> {
    const response = await fetch(`${this.baseUrl}/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LUC recordUsage failed: ${response.statusText}`);
    }

    return response.json();
  }

  async creditUsage(request: CreditUsageRequest): Promise<CreditUsageResponse> {
    const response = await fetch(`${this.baseUrl}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LUC creditUsage failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getSummary(workspaceId: string, options?: Partial<SummaryRequest>): Promise<SummaryResponse> {
    const params = new URLSearchParams({
      workspaceId,
      includeBreakdown: String(options?.includeBreakdown ?? false),
      historyDays: String(options?.historyDays ?? 7),
    });

    const response = await fetch(`${this.baseUrl}/summary?${params}`);

    if (!response.ok) {
      throw new Error(`LUC getSummary failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getLucState(workspaceId: string): Promise<LucState> {
    const response = await fetch(`${this.baseUrl}/state?workspaceId=${workspaceId}`);

    if (!response.ok) {
      throw new Error(`LUC getLucState failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton for convenience
export const lucApi = new LucApiClient();
