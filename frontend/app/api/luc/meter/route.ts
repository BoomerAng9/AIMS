// frontend/app/api/luc/meter/route.ts

/**
 * LUC Metering API — Usage Tracking and Quota Enforcement
 *
 * Provides real-time usage tracking, quota checking, and pre-authorization.
 * Integrates with the LUC ADK backend for billing.
 *
 * tool_id: luc_meter
 * service_key: BILLING
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ServiceKey,
  SERVICE_COSTS,
  TOOL_TO_SERVICE,
  type UsageSummary,
  type UsageQuota,
} from "@/lib/luc/metering";

// ─────────────────────────────────────────────────────────────
// In-memory stores (replace with Redis/Postgres in production)
// ─────────────────────────────────────────────────────────────

// User quotas
const userQuotas = new Map<string, Record<ServiceKey, UsageQuota>>();

// Active reservations
const reservations = new Map<
  string,
  { userId: string; service: ServiceKey; amount: number; createdAt: Date }
>();

// Usage events log
const usageLog: Array<{
  id: string;
  userId: string;
  service: ServiceKey;
  amount: number;
  metadata?: Record<string, string>;
  timestamp: string;
}> = [];

/**
 * Default quotas by plan — 5-tier model. No -1 "unlimited" values.
 * Enterprise gets the highest caps, but all usage is finite and metered.
 */
const PLAN_QUOTAS: Record<string, Record<ServiceKey, number>> = {
  p2p: {
    AI_CHAT: 100,
    CODE_GEN: 10,
    DEPLOY: 2,
    ANALYTICS: 50,
    STORAGE: 50,
    AGENTS: 5,
    WORKFLOWS: 2,
    MEDIA: 1,
    API_CALLS: 100,
    CUSTOM: 25,
  },
  coffee: {
    AI_CHAT: 500,
    CODE_GEN: 50,
    DEPLOY: 10,
    ANALYTICS: 200,
    STORAGE: 200,
    AGENTS: 25,
    WORKFLOWS: 10,
    MEDIA: 5,
    API_CALLS: 1000,
    CUSTOM: 100,
  },
  data_entry: {
    AI_CHAT: 2000,
    CODE_GEN: 200,
    DEPLOY: 50,
    ANALYTICS: 1000,
    STORAGE: 1000,
    AGENTS: 100,
    WORKFLOWS: 50,
    MEDIA: 20,
    API_CALLS: 10000,
    CUSTOM: 500,
  },
  pro: {
    AI_CHAT: 10000,
    CODE_GEN: 2000,
    DEPLOY: 500,
    ANALYTICS: 5000,
    STORAGE: 10000,
    AGENTS: 1000,
    WORKFLOWS: 500,
    MEDIA: 200,
    API_CALLS: 50000,
    CUSTOM: 5000,
  },
  enterprise: {
    AI_CHAT: 100000,
    CODE_GEN: 20000,
    DEPLOY: 5000,
    ANALYTICS: 50000,
    STORAGE: 100000,
    AGENTS: 10000,
    WORKFLOWS: 5000,
    MEDIA: 2000,
    API_CALLS: 500000,
    CUSTOM: 50000,
  },
};

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function initializeUserQuotas(userId: string, plan: string = "p2p"): Record<ServiceKey, UsageQuota> {
  const planLimits = PLAN_QUOTAS[plan] || PLAN_QUOTAS.p2p;
  const quotas: Record<ServiceKey, UsageQuota> = {} as Record<ServiceKey, UsageQuota>;

  for (const [service, limit] of Object.entries(planLimits)) {
    quotas[service as ServiceKey] = {
      service: service as ServiceKey,
      limit,
      used: 0,
      percent: 0,
      overage: 0,
      canExecute: true,
    };
  }

  userQuotas.set(userId, quotas);
  return quotas;
}

function getUserQuotas(userId: string, plan: string = "p2p"): Record<ServiceKey, UsageQuota> {
  if (!userQuotas.has(userId)) {
    return initializeUserQuotas(userId, plan);
  }
  return userQuotas.get(userId)!;
}

async function getUserPlan(userIdOrEmail: string): Promise<string> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userIdOrEmail },
          { id: userIdOrEmail }
        ]
      },
      include: {
        workspaces: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            workspace: {
              include: {
                lucAccount: true
              }
            }
          }
        }
      }
    });

    return user?.workspaces[0]?.workspace?.lucAccount?.planId || "p2p";
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return "p2p";
  }
}

function updateQuotaMetrics(quota: UsageQuota): UsageQuota {
  if (quota.limit <= 0) {
    // P2P tier with no included allocation — metered per use
    quota.percent = 0;
    quota.overage = quota.used;
    quota.canExecute = true; // P2P always allowed, billed per use
  } else {
    quota.percent = Math.round((quota.used / quota.limit) * 100);
    quota.overage = Math.max(0, quota.used - quota.limit);
    quota.canExecute = quota.used <= quota.limit * 1.1; // 10% overage buffer
  }
  return quota;
}

// ─────────────────────────────────────────────────────────────
// GET: Get usage summary
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.email;

    const plan = await getUserPlan(userId);
    const quotas = getUserQuotas(userId, plan);

    // Calculate total usage
    let totalUsed = 0;
    let totalLimit = 0;

    for (const quota of Object.values(quotas)) {
      updateQuotaMetrics(quota);
      if (quota.limit > 0) {
        totalUsed += quota.used;
        totalLimit += quota.limit;
      }
    }

    const summary: UsageSummary = {
      userId,
      plan,
      quotas,
      billingCycleEnd: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1
      ).toISOString(),
      status: "active",
      totalUsedPercent: totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0,
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("[LUC Meter] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST: Check, record, preauthorize, commit, cancel
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, userId = session.user.email, service, amount, metadata, reservationId } = body;

    if (!userQuotas.has(userId)) {
      const plan = await getUserPlan(userId);
      initializeUserQuotas(userId, plan);
    }
    const quotas = getUserQuotas(userId);

    switch (action) {
      case "check": {
        if (!service || typeof amount !== "number") {
          return NextResponse.json({ error: "service and amount required" }, { status: 400 });
        }

        const quota = quotas[service as ServiceKey];
        if (!quota) {
          return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
        }

        updateQuotaMetrics(quota);

        // Check if would exceed limit
        const wouldUse = quota.used + amount;
        const canExecute = quota.limit <= 0 || wouldUse <= quota.limit * 1.1;
        const quotaRemaining = quota.limit <= 0 ? -1 : Math.max(0, quota.limit - quota.used);

        return NextResponse.json({
          canExecute,
          quotaRemaining,
          overage: Math.max(0, wouldUse - quota.limit),
          warning: wouldUse > quota.limit ? "Usage will exceed quota limit" : undefined,
        });
      }

      case "record": {
        if (!service || typeof amount !== "number") {
          return NextResponse.json({ error: "service and amount required" }, { status: 400 });
        }

        const quota = quotas[service as ServiceKey];
        if (!quota) {
          return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
        }

        // Record usage
        quota.used += amount;
        updateQuotaMetrics(quota);

        // Log event
        usageLog.push({
          id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          service: service as ServiceKey,
          amount,
          metadata,
          timestamp: new Date().toISOString(),
        });

        // Trim log if too large
        if (usageLog.length > 10000) {
          usageLog.splice(0, 5000);
        }

        return NextResponse.json({
          success: true,
          canExecute: quota.canExecute,
          quotaRemaining: quota.limit <= 0 ? -1 : Math.max(0, quota.limit - quota.used),
          overage: quota.overage,
          warning: quota.percent >= 80 ? `${quota.percent}% of quota used` : undefined,
        });
      }

      case "preauthorize": {
        if (!service || typeof amount !== "number") {
          return NextResponse.json({ error: "service and amount required" }, { status: 400 });
        }

        const quota = quotas[service as ServiceKey];
        if (!quota) {
          return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
        }

        updateQuotaMetrics(quota);

        // Check if can reserve
        const wouldUse = quota.used + amount;
        const canReserve = quota.limit <= 0 || wouldUse <= quota.limit * 1.1;

        if (!canReserve) {
          return NextResponse.json({
            authorized: false,
            error: "Insufficient quota for reservation",
          });
        }

        // Create reservation
        const resId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        reservations.set(resId, {
          userId,
          service: service as ServiceKey,
          amount,
          createdAt: new Date(),
        });

        // Reserve quota
        quota.used += amount;
        updateQuotaMetrics(quota);

        return NextResponse.json({
          authorized: true,
          reservationId: resId,
        });
      }

      case "commit": {
        if (!reservationId || typeof amount !== "number") {
          return NextResponse.json(
            { error: "reservationId and amount required" },
            { status: 400 }
          );
        }

        const reservation = reservations.get(reservationId);
        if (!reservation) {
          return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        const quota = quotas[reservation.service];

        // Adjust for actual usage (release difference)
        const difference = reservation.amount - amount;
        quota.used = Math.max(0, quota.used - difference);
        updateQuotaMetrics(quota);

        // Log event
        usageLog.push({
          id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          service: reservation.service,
          amount,
          metadata: { reservationId },
          timestamp: new Date().toISOString(),
        });

        // Remove reservation
        reservations.delete(reservationId);

        return NextResponse.json({
          success: true,
          canExecute: quota.canExecute,
          quotaRemaining: quota.limit <= 0 ? -1 : Math.max(0, quota.limit - quota.used),
        });
      }

      case "cancel": {
        if (!reservationId) {
          return NextResponse.json({ error: "reservationId required" }, { status: 400 });
        }

        const reservation = reservations.get(reservationId);
        if (!reservation) {
          return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        const quota = quotas[reservation.service];

        // Release reserved quota
        quota.used = Math.max(0, quota.used - reservation.amount);
        updateQuotaMetrics(quota);

        // Remove reservation
        reservations.delete(reservationId);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[LUC Meter] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
