// @ts-nocheck
/**
 * LUC Engine - Pure Functions for Usage Tracking and Billing
 * @version 2.0.0
 *
 * PRONUNCIATION: "LUKE" (not L-U-C)
 *
 * This module contains all business logic for LUC operations.
 * All functions are pure and side-effect free - they take inputs and return outputs.
 * Persistence is handled by adapters, not this module.
 */

import { v4 as uuidv4 } from "uuid";
import {
  SERVICE_KEYS,
  SERVICE_CATALOG,
  LUC_DEFAULTS,
  OVERAGE_POLICIES,
  type ServiceKey,
  type ServiceDefinition,
  type OveragePolicy,
} from "./luc.constants";
import {
  type LucAccount,
  type Quota,
  type QuotasMap,
  type UsageEvent,
  type CanExecuteResponse,
  type EstimateRequest,
  type EstimateResponse,
  type RecordUsageRequest,
  type RecordUsageResponse,
  type CreditUsageRequest,
  type CreditUsageResponse,
  type SummaryResponse,
  type QuotaSummaryItemSchema,
  type LucState,
} from "./luc.schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Quota Calculation Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the percentage of quota used
 */
export function calculatePercentUsed(quota: Quota): number {
  if (quota.limit <= 0) return 0; // Metered / P2P
  if (quota.limit === 0) return 100;
  return Math.min(100, Math.round((quota.used / quota.limit) * 100));
}

/**
 * Calculate remaining quota
 */
export function calculateRemaining(quota: Quota): number {
  if (quota.limit <= 0) return 0; // Metered/P2P — no included allocation remaining
  return Math.max(0, quota.limit - quota.used - quota.reserved);
}

/**
 * Calculate overage amount
 */
export function calculateOverage(quota: Quota): number {
  if (quota.limit <= 0) return 0;
  return Math.max(0, quota.used - quota.limit);
}

/**
 * Determine warning level based on usage percentage
 */
export function determineWarningLevel(
  percentUsed: number,
  softThreshold = LUC_DEFAULTS.SOFT_WARN_THRESHOLD,
  hardThreshold = LUC_DEFAULTS.HARD_WARN_THRESHOLD
): "none" | "soft" | "hard" | "exceeded" {
  if (percentUsed >= 100) return "exceeded";
  if (percentUsed >= hardThreshold * 100) return "hard";
  if (percentUsed >= softThreshold * 100) return "soft";
  return "none";
}

/**
 * Generate warning message based on level
 */
export function generateWarningMessage(
  serviceKey: ServiceKey,
  percentUsed: number,
  level: "none" | "soft" | "hard" | "exceeded"
): string | undefined {
  const service = SERVICE_CATALOG[serviceKey];
  if (!service) return undefined;

  switch (level) {
    case "soft":
      return `${service.name}: ${percentUsed}% of quota used`;
    case "hard":
      return `${service.name}: ${percentUsed}% of quota used - approaching limit`;
    case "exceeded":
      return `${service.name}: Quota exceeded (${percentUsed}%)`;
    default:
      return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Engine Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a usage operation can be executed
 */
export function canExecute(
  account: LucAccount,
  serviceKey: ServiceKey,
  units: number,
  overageBuffer = LUC_DEFAULTS.OVERAGE_BUFFER
): CanExecuteResponse {
  const quota = account.quotas[serviceKey];

  // Service not available
  if (!quota) {
    return {
      canExecute: false,
      reason: `Service ${serviceKey} not available in plan`,
      quotaRemaining: 0,
      quotaLimit: 0,
      percentUsed: 0,
      wouldExceed: true,
      overage: 0,
      warning: `Service ${serviceKey} is not included in your plan`,
      warningLevel: "blocked",
    };
  }

  // P2P / metered quota — no included allocation, always allow, bill per use
  if (quota.limit <= 0) {
    return {
      canExecute: true,
      quotaRemaining: 0,
      quotaLimit: 0,
      percentUsed: 0,
      wouldExceed: false,
      overage: units, // all usage is overage (billed per use)
      warningLevel: "none",
    };
  }

  const wouldUse = quota.used + quota.reserved + units;
  const percentUsed = calculatePercentUsed(quota);
  const percentAfter = Math.round((wouldUse / quota.limit) * 100);
  const remaining = calculateRemaining(quota);
  const overage = Math.max(0, wouldUse - quota.limit);
  const warningLevel = determineWarningLevel(percentAfter);

  // Check overage policy
  const maxAllowed = quota.limit * (1 + overageBuffer);
  let canDoIt = true;
  let reason: string | undefined;

  switch (account.overagePolicy) {
    case OVERAGE_POLICIES.BLOCK:
      if (wouldUse > quota.limit) {
        canDoIt = false;
        reason = "Quota exceeded - operation blocked";
      }
      break;
    case OVERAGE_POLICIES.ALLOW_OVERAGE:
      if (wouldUse > maxAllowed) {
        canDoIt = false;
        reason = "Overage limit exceeded - upgrade required";
      }
      break;
    case OVERAGE_POLICIES.SOFT_LIMIT:
      // Always allow for enterprise
      break;
  }

  // Check account status
  if (account.status === "suspended") {
    canDoIt = false;
    reason = "Account suspended";
  }

  const warning = generateWarningMessage(serviceKey, percentAfter, warningLevel);

  return {
    canExecute: canDoIt,
    reason,
    quotaRemaining: remaining,
    quotaLimit: quota.limit,
    percentUsed: percentAfter,
    wouldExceed: wouldUse > quota.limit,
    overage,
    warning,
    warningLevel: canDoIt ? warningLevel : "blocked",
  };
}

/**
 * Estimate the impact of multiple operations without mutating state
 */
export function estimate(
  account: LucAccount,
  request: EstimateRequest
): EstimateResponse {
  type EstimateItem = { serviceKey: ServiceKey; units: number; cost: number; quotaRemaining: number; wouldExceed: boolean; warning: string | undefined };
  const items: EstimateItem[] = request.services.map((svc: { serviceKey: ServiceKey; units: number }): EstimateItem => {
    const quota = account.quotas[svc.serviceKey];
    const service = SERVICE_CATALOG[svc.serviceKey];
    const rate = service?.defaultRate || 0;
    const cost = svc.units * rate;

    if (!quota) {
      return {
        serviceKey: svc.serviceKey,
        units: svc.units,
        cost,
        quotaRemaining: 0,
        wouldExceed: true,
        warning: `Service ${svc.serviceKey} not available`,
      };
    }

    const remaining = calculateRemaining(quota);
    const wouldExceed = quota.limit > 0 && svc.units > remaining;
    const percentAfter =
      quota.limit <= 0
        ? 0
        : Math.round(((quota.used + svc.units) / quota.limit) * 100);
    const warningLevel = determineWarningLevel(percentAfter);
    const warning = generateWarningMessage(svc.serviceKey, percentAfter, warningLevel);

    return {
      serviceKey: svc.serviceKey,
      units: svc.units,
      cost,
      quotaRemaining: remaining,
      wouldExceed,
      warning,
    };
  });

  const totalCost = items.reduce((sum: number, item: EstimateItem) => sum + item.cost, 0);
  const anyWouldExceed = items.some((item: EstimateItem) => item.wouldExceed);
  const warnings = items.filter((item: EstimateItem) => item.warning).map((item: EstimateItem) => item.warning!);

  return {
    items,
    totalCost,
    anyWouldExceed,
    warnings,
  };
}

/**
 * Record usage and return updated quota state
 * Returns the new quota state and the usage event to persist
 */
export function recordUsage(
  account: LucAccount,
  request: RecordUsageRequest
): { updatedQuota: Quota; event: UsageEvent; response: RecordUsageResponse } {
  const svcKey = request.serviceKey as ServiceKey;
  const quota = account.quotas[svcKey];
  const service = SERVICE_CATALOG[svcKey];
  const rate = service?.defaultRate || 0;
  const cost = request.units * rate;

  if (!quota) {
    throw new Error(`Service ${svcKey} not available in account`);
  }

  // Create updated quota
  const updatedQuota: Quota = {
    ...quota,
    used: quota.used + request.units,
    overage: Math.max(0, quota.used + request.units - quota.limit),
  };

  // Create usage event
  const event: UsageEvent = {
    id: uuidv4(),
    workspaceId: request.workspaceId,
    userId: request.userId,
    serviceKey: svcKey,
    units: request.units,
    cost,
    requestId: request.requestId,
    metadata: request.metadata,
    timestamp: new Date().toISOString(),
    eventType: "usage",
  };

  const percentUsed = calculatePercentUsed(updatedQuota);
  const warningLevel = determineWarningLevel(percentUsed);
  const warning = generateWarningMessage(svcKey, percentUsed, warningLevel);

  const response: RecordUsageResponse = {
    success: true,
    eventId: event.id,
    quotaRemaining: calculateRemaining(updatedQuota),
    quotaLimit: updatedQuota.limit,
    percentUsed,
    overage: updatedQuota.overage,
    warning,
  };

  return { updatedQuota, event, response };
}

/**
 * Credit usage back (rollback/refund)
 * Returns the updated quota state and the credit event to persist
 */
export function creditUsage(
  account: LucAccount,
  request: CreditUsageRequest
): { updatedQuota: Quota; event: UsageEvent; response: CreditUsageResponse } {
  const creditSvcKey = request.serviceKey as ServiceKey;
  const quota = account.quotas[creditSvcKey];

  if (!quota) {
    throw new Error(`Service ${creditSvcKey} not available in account`);
  }

  // Calculate new used (can't go below 0)
  const newUsed = Math.max(0, quota.used - request.units);

  // Create updated quota
  const updatedQuota: Quota = {
    ...quota,
    used: newUsed,
    overage: Math.max(0, newUsed - quota.limit),
  };

  // Create credit event
  const event: UsageEvent = {
    id: uuidv4(),
    workspaceId: request.workspaceId,
    userId: request.userId,
    serviceKey: creditSvcKey,
    units: request.units,
    cost: 0, // Credits don't have cost
    metadata: {
      reason: request.reason,
      originalEventId: request.originalEventId,
    },
    timestamp: new Date().toISOString(),
    eventType: "credit",
  };

  const response: CreditUsageResponse = {
    success: true,
    eventId: event.id,
    quotaRemaining: calculateRemaining(updatedQuota),
    credited: request.units,
  };

  return { updatedQuota, event, response };
}

/**
 * Generate a usage summary for an account
 */
export function generateSummary(
  account: LucAccount,
  breakdown?: Record<ServiceKey, { date: string; units: number; cost: number }[]>
): SummaryResponse {
  const now = new Date();
  const periodEnd = new Date(account.periodEnd);
  const daysRemaining = Math.max(
    0,
    Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate quota summaries
  const quotas = Object.entries(account.quotas).map(([key, rawQuota]) => {
    const serviceKey = key as ServiceKey;
    const quota = rawQuota as Quota;
    const service = SERVICE_CATALOG[serviceKey];
    const percentUsed = calculatePercentUsed(quota);
    const warningLevel = determineWarningLevel(percentUsed);
    const overage = calculateOverage(quota);
    const estimatedCost = quota.used * (service?.defaultRate || 0);

    return {
      serviceKey,
      serviceName: service?.name || serviceKey,
      limit: quota.limit,
      used: quota.used,
      reserved: quota.reserved,
      available: calculateRemaining(quota),
      percentUsed,
      warningLevel,
      overage,
      estimatedCost,
    };
  });

  // Calculate overall metrics
  const totalLimit = quotas.reduce(
    (sum: number, q) => (q.limit <= 0 ? sum : sum + q.limit),
    0
  );
  const totalUsed = quotas.reduce((sum: number, q) => sum + q.used, 0);
  const overallPercentUsed = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
  const overallWarningLevel = determineWarningLevel(overallPercentUsed);
  const totalEstimatedCost = quotas.reduce((sum: number, q) => sum + q.estimatedCost, 0);

  return {
    workspaceId: account.workspaceId,
    planId: account.planId,
    status: account.status,
    periodStart: account.periodStart,
    periodEnd: account.periodEnd,
    daysRemaining,
    overallPercentUsed,
    overallWarningLevel,
    totalEstimatedCost,
    quotas,
    breakdown,
  };
}

/**
 * Generate LUC state for UI status strip
 */
export function generateLucState(
  account: LucAccount,
  activeBoomerAngs: string[] = [],
  showNames = false
): LucState {
  const summary = generateSummary(account);

  // Get top 3 services by percent used
  const topServices = summary.quotas
    .filter((q) => q.limit > 0)
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3)
    .map((q) => ({
      serviceKey: q.serviceKey as ServiceKey,
      name: q.serviceName,
      percentUsed: q.percentUsed,
    }));

  return {
    overallPercent: summary.overallPercentUsed,
    warningLevel: summary.overallWarningLevel,
    activeBoomerAngs: activeBoomerAngs.length,
    boomerAngNames: showNames ? activeBoomerAngs : undefined,
    projectedOverage: summary.quotas.reduce((sum: number, q) => sum + q.overage, 0),
    daysRemaining: summary.daysRemaining,
    topServices,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize default quotas for a plan
 */
export function initializeQuotas(
  planLimits: Record<ServiceKey, number>
): QuotasMap {
  const quotas: Partial<QuotasMap> = {};

  for (const [key, limit] of Object.entries(planLimits)) {
    quotas[key as ServiceKey] = {
      serviceKey: key as ServiceKey,
      limit,
      used: 0,
      reserved: 0,
      overage: 0,
    };
  }

  return quotas as QuotasMap;
}

/**
 * Merge quotas with policy updates
 */
export function mergeQuotasWithPolicy(
  currentQuotas: QuotasMap,
  newLimits: Record<ServiceKey, number>
): QuotasMap {
  const merged: Partial<QuotasMap> = {};

  for (const [key, limit] of Object.entries(newLimits)) {
    const serviceKey = key as ServiceKey;
    const existing = currentQuotas[serviceKey];

    merged[serviceKey] = {
      serviceKey,
      limit,
      used: existing?.used || 0,
      reserved: existing?.reserved || 0,
      overage: Math.max(0, (existing?.used || 0) - limit),
    };
  }

  return merged as QuotasMap;
}

/**
 * Calculate billing cycle end date
 */
export function calculatePeriodEnd(
  periodStart: Date,
  cycleDays = LUC_DEFAULTS.BILLING_CYCLE_DAYS
): Date {
  const end = new Date(periodStart);
  end.setDate(end.getDate() + cycleDays);
  return end;
}

/**
 * Check if billing period has ended
 */
export function isPeriodEnded(periodEnd: string | Date): boolean {
  const end = new Date(periodEnd);
  return new Date() > end;
}

/**
 * Get service definition by key
 */
export function getServiceDefinition(serviceKey: ServiceKey): ServiceDefinition | undefined {
  return SERVICE_CATALOG[serviceKey];
}

/**
 * Validate service key exists
 */
export function isValidServiceKey(key: string): key is ServiceKey {
  return Object.values(SERVICE_KEYS).includes(key as ServiceKey);
}
