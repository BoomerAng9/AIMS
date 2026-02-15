// frontend/lib/luc/metering.ts

/**
 * LUC Metering Integration
 *
 * Client-side metering service that tracks usage and enforces quotas.
 * Integrates with the backend LUC ADK for real-time billing.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ServiceKey =
  | "AI_CHAT"
  | "CODE_GEN"
  | "DEPLOY"
  | "ANALYTICS"
  | "STORAGE"
  | "AGENTS"
  | "WORKFLOWS"
  | "MEDIA"
  | "API_CALLS"
  | "CUSTOM";

export interface UsageQuota {
  service: ServiceKey;
  limit: number;
  used: number;
  percent: number;
  overage: number;
  canExecute: boolean;
}

export interface MeteringResult {
  success: boolean;
  canExecute: boolean;
  quotaRemaining?: number;
  overage?: number;
  warning?: string;
  error?: string;
}

export interface UsageSummary {
  userId: string;
  plan: string;
  quotas: Record<ServiceKey, UsageQuota>;
  billingCycleEnd: string;
  status: "active" | "suspended" | "trial" | "overdue";
  totalUsedPercent: number;
}

export interface MeterEvent {
  id: string;
  userId: string;
  service: ServiceKey;
  amount: number;
  toolId?: string;
  deploymentId?: string;
  timestamp: string;
  success: boolean;
}

// ─────────────────────────────────────────────────────────────
// Service Key Mapping
// ─────────────────────────────────────────────────────────────

export const TOOL_TO_SERVICE: Record<string, ServiceKey> = {
  // Deploy Dock
  deploy_dock: "DEPLOY",
  evidence_locker: "STORAGE",
  // ACHEEVY
  acheevy_chat: "AI_CHAT",
  acheevy_execute: "AGENTS",
  // House of Ang
  boomerang_invoke: "AGENTS",
  // n8n
  n8n_workflow: "WORKFLOWS",
  // Code
  code_generation: "CODE_GEN",
  code_review: "CODE_GEN",
  // Media
  video_gen: "MEDIA",
  voice_clone: "MEDIA",
  // General
  api_request: "API_CALLS",
  storage_upload: "STORAGE",
  analytics_query: "ANALYTICS",
};

export const SERVICE_COSTS: Record<ServiceKey, number> = {
  AI_CHAT: 1,
  CODE_GEN: 5,
  DEPLOY: 10,
  ANALYTICS: 2,
  STORAGE: 1,
  AGENTS: 3,
  WORKFLOWS: 5,
  MEDIA: 20,
  API_CALLS: 1,
  CUSTOM: 1,
};

// ─────────────────────────────────────────────────────────────
// Metering Client
// ─────────────────────────────────────────────────────────────

export class LucMeteringClient {
  private userId: string;
  private cache: UsageSummary | null = null;
  private cacheExpiry: number = 0;
  private pendingEvents: MeterEvent[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Check if user can execute a service
   */
  async canExecute(
    service: ServiceKey,
    amount: number = 1
  ): Promise<MeteringResult> {
    try {
      const response = await fetch("/api/luc/meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          userId: this.userId,
          service,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, canExecute: false, error };
      }

      const data = await response.json();
      return {
        success: true,
        canExecute: data.canExecute,
        quotaRemaining: data.quotaRemaining,
        overage: data.overage,
        warning: data.warning,
      };
    } catch (error: any) {
      console.error("[LUC Metering] Check error:", error);
      // Fail open - allow execution but log error
      return { success: false, canExecute: true, error: error.message };
    }
  }

  /**
   * Record usage for a service
   */
  async recordUsage(
    service: ServiceKey,
    amount: number,
    metadata?: {
      toolId?: string;
      deploymentId?: string;
      description?: string;
    }
  ): Promise<MeteringResult> {
    try {
      const response = await fetch("/api/luc/meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record",
          userId: this.userId,
          service,
          amount,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, canExecute: false, error };
      }

      const data = await response.json();

      // Invalidate cache
      this.cache = null;

      return {
        success: true,
        canExecute: data.canExecute,
        quotaRemaining: data.quotaRemaining,
        overage: data.overage,
        warning: data.warning,
      };
    } catch (error: any) {
      console.error("[LUC Metering] Record error:", error);
      // Queue for retry
      this.pendingEvents.push({
        id: `meter-${Date.now()}`,
        userId: this.userId,
        service,
        amount,
        toolId: metadata?.toolId,
        deploymentId: metadata?.deploymentId,
        timestamp: new Date().toISOString(),
        success: false,
      });
      return { success: false, canExecute: true, error: error.message };
    }
  }

  /**
   * Get usage summary for user
   */
  async getUsageSummary(): Promise<UsageSummary | null> {
    // Return cached if valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await fetch(`/api/luc/meter?userId=${this.userId}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      this.cache = data.summary;
      this.cacheExpiry = Date.now() + 60000; // 1 minute cache

      return this.cache;
    } catch (error: any) {
      console.error("[LUC Metering] Get summary error:", error);
      return null;
    }
  }

  /**
   * Pre-authorize usage (reserve quota)
   */
  async preAuthorize(
    service: ServiceKey,
    estimatedAmount: number
  ): Promise<{ authorized: boolean; reservationId?: string; error?: string }> {
    try {
      const response = await fetch("/api/luc/meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preauthorize",
          userId: this.userId,
          service,
          amount: estimatedAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { authorized: false, error };
      }

      const data = await response.json();
      return {
        authorized: data.authorized,
        reservationId: data.reservationId,
      };
    } catch (error: any) {
      console.error("[LUC Metering] Pre-authorize error:", error);
      return { authorized: false, error: error.message };
    }
  }

  /**
   * Commit a pre-authorized reservation
   */
  async commitReservation(
    reservationId: string,
    actualAmount: number
  ): Promise<MeteringResult> {
    try {
      const response = await fetch("/api/luc/meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          userId: this.userId,
          reservationId,
          amount: actualAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, canExecute: false, error };
      }

      const data = await response.json();
      this.cache = null;

      return {
        success: true,
        canExecute: data.canExecute,
        quotaRemaining: data.quotaRemaining,
      };
    } catch (error: any) {
      console.error("[LUC Metering] Commit error:", error);
      return { success: false, canExecute: true, error: error.message };
    }
  }

  /**
   * Cancel a pre-authorized reservation
   */
  async cancelReservation(reservationId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/luc/meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          userId: this.userId,
          reservationId,
        }),
      });

      return response.ok;
    } catch (error: any) {
      console.error("[LUC Metering] Cancel error:", error);
      return false;
    }
  }

  /**
   * Flush pending events (retry failed recordings)
   */
  async flushPendingEvents(): Promise<number> {
    if (this.pendingEvents.length === 0) {
      return 0;
    }

    let successCount = 0;
    const eventsToRetry = [...this.pendingEvents];
    this.pendingEvents = [];
    const results = await Promise.all(
      eventsToRetry.map((event) =>
        this.recordUsage(event.service, event.amount, {
          toolId: event.toolId,
          deploymentId: event.deploymentId,
        })
      )
    );

    successCount = results.filter((r) => r.success).length;

    return successCount;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Get service key from tool ID
 */
export function getServiceFromTool(toolId: string): ServiceKey {
  return TOOL_TO_SERVICE[toolId] || "CUSTOM";
}

/**
 * Calculate estimated cost for a tool execution
 */
export function estimateCost(toolId: string, multiplier: number = 1): number {
  const service = getServiceFromTool(toolId);
  return SERVICE_COSTS[service] * multiplier;
}

/**
 * Format quota display
 */
export function formatQuota(quota: UsageQuota): string {
  if (quota.limit === -1) {
    return "Unlimited";
  }
  return `${quota.used.toLocaleString()} / ${quota.limit.toLocaleString()}`;
}

/**
 * Get quota status color
 */
export function getQuotaStatusColor(quota: UsageQuota): string {
  if (quota.limit === -1) return "text-green-400";
  if (quota.percent >= 100) return "text-red-400";
  if (quota.percent >= 80) return "text-yellow-400";
  return "text-green-400";
}

// ─────────────────────────────────────────────────────────────
// React Hook (client-side only)
// ─────────────────────────────────────────────────────────────

let meteringClientCache: Map<string, LucMeteringClient> = new Map();

export function getMeteringClient(userId: string): LucMeteringClient {
  if (!meteringClientCache.has(userId)) {
    meteringClientCache.set(userId, new LucMeteringClient(userId));
  }
  return meteringClientCache.get(userId)!;
}

/**
 * Wrap an async function with metering
 */
export function withMetering<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    userId: string;
    toolId: string;
    costMultiplier?: number;
  }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const client = getMeteringClient(options.userId);
    const service = getServiceFromTool(options.toolId);
    const cost = estimateCost(options.toolId, options.costMultiplier || 1);

    // Check quota
    const check = await client.canExecute(service, cost);
    if (!check.canExecute) {
      throw new Error(`Quota exceeded for ${service}: ${check.error || check.warning}`);
    }

    // Execute
    const result = await fn(...args);

    // Record usage
    await client.recordUsage(service, cost, { toolId: options.toolId });

    return result;
  }) as T;
}
