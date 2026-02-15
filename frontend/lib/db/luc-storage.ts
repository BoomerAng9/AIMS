// frontend/lib/db/luc-storage.ts
// LUC Storage Adapter - Prisma Implementation

import { prisma } from "./prisma";
import type {
  LucStorageAdapter,
  LucPolicyAdapter,
} from "@/aims-tools/luc/luc.adapters";
import type { LucAccount, Quota, UsageEvent } from "@/aims-tools/luc/luc.schemas";
import type { ServiceKey } from "@/aims-tools/luc/luc.constants";
import {
  SERVICE_KEYS,
  PLAN_IDS,
  OVERAGE_POLICIES,
  LUC_DEFAULTS,
} from "@/aims-tools/luc/luc.constants";

// ─────────────────────────────────────────────────────────────────────────────
// Default Plan Quotas
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PLAN_QUOTAS: Record<string, Record<ServiceKey, number>> = {
  [PLAN_IDS.FREE]: {
    [SERVICE_KEYS.LLM_TOKENS_IN]: 10000,
    [SERVICE_KEYS.LLM_TOKENS_OUT]: 5000,
    [SERVICE_KEYS.N8N_EXECUTIONS]: 50,
    [SERVICE_KEYS.NODE_RUNTIME_SECONDS]: 300,
    [SERVICE_KEYS.SWARM_CYCLES]: 10,
    [SERVICE_KEYS.BRAVE_QUERIES]: 100,
    [SERVICE_KEYS.VOICE_CHARS]: 10000,
    [SERVICE_KEYS.STT_MINUTES]: 10,
    [SERVICE_KEYS.CONTAINER_HOURS]: 1,
    [SERVICE_KEYS.STORAGE_GB_MONTH]: 1,
    [SERVICE_KEYS.BANDWIDTH_GB]: 1,
    [SERVICE_KEYS.BOOMER_ANG_INVOCATIONS]: 20,
    [SERVICE_KEYS.AGENT_EXECUTIONS]: 50,
    [SERVICE_KEYS.DEPLOY_OPERATIONS]: 5,
    [SERVICE_KEYS.API_CALLS]: 500,
  },
  [PLAN_IDS.STARTER]: {
    [SERVICE_KEYS.LLM_TOKENS_IN]: 100000,
    [SERVICE_KEYS.LLM_TOKENS_OUT]: 50000,
    [SERVICE_KEYS.N8N_EXECUTIONS]: 500,
    [SERVICE_KEYS.NODE_RUNTIME_SECONDS]: 3000,
    [SERVICE_KEYS.SWARM_CYCLES]: 100,
    [SERVICE_KEYS.BRAVE_QUERIES]: 1000,
    [SERVICE_KEYS.VOICE_CHARS]: 100000,
    [SERVICE_KEYS.STT_MINUTES]: 100,
    [SERVICE_KEYS.CONTAINER_HOURS]: 10,
    [SERVICE_KEYS.STORAGE_GB_MONTH]: 10,
    [SERVICE_KEYS.BANDWIDTH_GB]: 10,
    [SERVICE_KEYS.BOOMER_ANG_INVOCATIONS]: 200,
    [SERVICE_KEYS.AGENT_EXECUTIONS]: 500,
    [SERVICE_KEYS.DEPLOY_OPERATIONS]: 50,
    [SERVICE_KEYS.API_CALLS]: 5000,
  },
  [PLAN_IDS.PRO]: {
    [SERVICE_KEYS.LLM_TOKENS_IN]: 1000000,
    [SERVICE_KEYS.LLM_TOKENS_OUT]: 500000,
    [SERVICE_KEYS.N8N_EXECUTIONS]: 5000,
    [SERVICE_KEYS.NODE_RUNTIME_SECONDS]: 30000,
    [SERVICE_KEYS.SWARM_CYCLES]: 1000,
    [SERVICE_KEYS.BRAVE_QUERIES]: 10000,
    [SERVICE_KEYS.VOICE_CHARS]: 1000000,
    [SERVICE_KEYS.STT_MINUTES]: 1000,
    [SERVICE_KEYS.CONTAINER_HOURS]: 100,
    [SERVICE_KEYS.STORAGE_GB_MONTH]: 100,
    [SERVICE_KEYS.BANDWIDTH_GB]: 100,
    [SERVICE_KEYS.BOOMER_ANG_INVOCATIONS]: 2000,
    [SERVICE_KEYS.AGENT_EXECUTIONS]: 5000,
    [SERVICE_KEYS.DEPLOY_OPERATIONS]: 500,
    [SERVICE_KEYS.API_CALLS]: 50000,
  },
  [PLAN_IDS.ENTERPRISE]: {
    // -1 = unlimited
    [SERVICE_KEYS.LLM_TOKENS_IN]: -1,
    [SERVICE_KEYS.LLM_TOKENS_OUT]: -1,
    [SERVICE_KEYS.N8N_EXECUTIONS]: -1,
    [SERVICE_KEYS.NODE_RUNTIME_SECONDS]: -1,
    [SERVICE_KEYS.SWARM_CYCLES]: -1,
    [SERVICE_KEYS.BRAVE_QUERIES]: -1,
    [SERVICE_KEYS.VOICE_CHARS]: -1,
    [SERVICE_KEYS.STT_MINUTES]: -1,
    [SERVICE_KEYS.CONTAINER_HOURS]: -1,
    [SERVICE_KEYS.STORAGE_GB_MONTH]: -1,
    [SERVICE_KEYS.BANDWIDTH_GB]: -1,
    [SERVICE_KEYS.BOOMER_ANG_INVOCATIONS]: -1,
    [SERVICE_KEYS.AGENT_EXECUTIONS]: -1,
    [SERVICE_KEYS.DEPLOY_OPERATIONS]: -1,
    [SERVICE_KEYS.API_CALLS]: -1,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function initializeQuotas(planId: string): Record<ServiceKey, Quota> {
  const limits = DEFAULT_PLAN_QUOTAS[planId] || DEFAULT_PLAN_QUOTAS[PLAN_IDS.FREE];
  const quotas: Record<string, Quota> = {};

  for (const [key, limit] of Object.entries(limits)) {
    quotas[key] = {
      serviceKey: key as ServiceKey,
      limit,
      used: 0,
      reserved: 0,
      overage: 0,
    };
  }

  return quotas as Record<ServiceKey, Quota>;
}

function calculateBillingPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Adapter Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class PrismaLucStorage implements LucStorageAdapter {
  async getAccount(workspaceId: string): Promise<LucAccount | null> {
    const account = await prisma.lucAccount.findUnique({
      where: { workspaceId },
    });

    if (!account) {
      return null;
    }

    const quotas = JSON.parse(account.quotas) as Record<ServiceKey, Quota>;

    return {
      id: account.id,
      workspaceId: account.workspaceId,
      planId: account.planId as any,
      status: account.status.toLowerCase() as any,
      quotas,
      overagePolicy: account.overagePolicy as any,
      periodStart: account.periodStart.toISOString(),
      periodEnd: account.periodEnd.toISOString(),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  async updateQuota(
    workspaceId: string,
    serviceKey: ServiceKey,
    quota: Quota
  ): Promise<void> {
    const account = await prisma.lucAccount.findUnique({
      where: { workspaceId },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const quotas = JSON.parse(account.quotas) as Record<ServiceKey, Quota>;
    quotas[serviceKey] = quota;

    await prisma.lucAccount.update({
      where: { workspaceId },
      data: {
        quotas: JSON.stringify(quotas),
        updatedAt: new Date(),
      },
    });
  }

  async appendUsageEvent(event: UsageEvent): Promise<void> {
    await prisma.usageEvent.create({
      data: {
        id: event.id,
        workspaceId: event.workspaceId,
        userId: event.userId,
        serviceKey: event.serviceKey,
        units: event.units,
        cost: event.cost,
        eventType: event.eventType.toUpperCase() as any,
        requestId: event.requestId,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        timestamp: new Date(event.timestamp),
      },
    });
  }

  async getUsageBreakdown(
    workspaceId: string,
    days: number
  ): Promise<Record<ServiceKey, { date: string; units: number; cost: number }[]>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.usageEvent.findMany({
      where: {
        workspaceId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "asc" },
    });

    // Group by service and date
    const breakdown: Record<string, { date: string; units: number; cost: number }[]> = {};

    for (const event of events) {
      if (!breakdown[event.serviceKey]) {
        breakdown[event.serviceKey] = [];
      }

      const date = event.timestamp.toISOString().split("T")[0];
      const existing = breakdown[event.serviceKey].find((d) => d.date === date);

      if (existing) {
        existing.units += event.units;
        existing.cost += event.cost;
      } else {
        breakdown[event.serviceKey].push({
          date,
          units: event.units,
          cost: event.cost,
        });
      }
    }

    return breakdown as Record<ServiceKey, { date: string; units: number; cost: number }[]>;
  }

  async getActiveBoomerAngs(workspaceId: string): Promise<string[]> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - 5); // 5 minute heartbeat timeout

    const active = await prisma.activeBoomerAng.findMany({
      where: {
        workspaceId,
        lastHeartbeat: { gte: cutoff },
      },
    });

    return active.map((a) => a.boomerAngName);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Management
  // ─────────────────────────────────────────────────────────────────────────

  async createAccount(workspaceId: string, planId: string = "free"): Promise<LucAccount> {
    const { start, end } = calculateBillingPeriod();
    const quotas = initializeQuotas(planId);

    const account = await prisma.lucAccount.create({
      data: {
        workspaceId,
        planId,
        status: "ACTIVE",
        quotas: JSON.stringify(quotas),
        overagePolicy: OVERAGE_POLICIES.BLOCK,
        periodStart: start,
        periodEnd: end,
      },
    });

    return {
      id: account.id,
      workspaceId: account.workspaceId,
      planId: account.planId as any,
      status: "active",
      quotas,
      overagePolicy: OVERAGE_POLICIES.BLOCK,
      periodStart: account.periodStart.toISOString(),
      periodEnd: account.periodEnd.toISOString(),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  async ensureAccount(workspaceId: string, planId: string = "free"): Promise<LucAccount> {
    const existing = await this.getAccount(workspaceId);
    if (existing) {
      return existing;
    }
    return this.createAccount(workspaceId, planId);
  }

  async resetBillingPeriod(workspaceId: string): Promise<void> {
    const account = await prisma.lucAccount.findUnique({
      where: { workspaceId },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const { start, end } = calculateBillingPeriod();
    const quotas = JSON.parse(account.quotas) as Record<ServiceKey, Quota>;

    // Reset usage but keep limits
    for (const key of Object.keys(quotas)) {
      quotas[key as ServiceKey].used = 0;
      quotas[key as ServiceKey].reserved = 0;
      quotas[key as ServiceKey].overage = 0;
    }

    await prisma.lucAccount.update({
      where: { workspaceId },
      data: {
        quotas: JSON.stringify(quotas),
        periodStart: start,
        periodEnd: end,
        updatedAt: new Date(),
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Adapter Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class PrismaLucPolicy implements LucPolicyAdapter {
  async getEffectivePolicy(scope: string, scopeId?: string): Promise<Record<string, any>> {
    const policy = await prisma.policyVersion.findFirst({
      where: {
        scope: scope.toUpperCase() as any,
        scopeId,
        status: "EFFECTIVE",
      },
      orderBy: { version: "desc" },
    });

    if (!policy) {
      // Return defaults
      return {
        softWarnThreshold: LUC_DEFAULTS.SOFT_WARN_THRESHOLD,
        hardWarnThreshold: LUC_DEFAULTS.HARD_WARN_THRESHOLD,
        overageBuffer: LUC_DEFAULTS.OVERAGE_BUFFER,
      };
    }

    return JSON.parse(policy.policy);
  }

  async getPlanLimits(planId: string): Promise<Record<ServiceKey, number>> {
    return DEFAULT_PLAN_QUOTAS[planId] || DEFAULT_PLAN_QUOTAS[PLAN_IDS.FREE];
  }

  async canShowBoomerAngNames(workspaceId: string): Promise<boolean> {
    const policy = await this.getEffectivePolicy("WORKSPACE", workspaceId);
    return policy.showBoomerAngNames ?? false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Instances
// ─────────────────────────────────────────────────────────────────────────────

let storageInstance: PrismaLucStorage | null = null;
let policyInstance: PrismaLucPolicy | null = null;

export function getLucStorage(): PrismaLucStorage {
  if (!storageInstance) {
    storageInstance = new PrismaLucStorage();
  }
  return storageInstance;
}

export function getLucPolicy(): PrismaLucPolicy {
  if (!policyInstance) {
    policyInstance = new PrismaLucPolicy();
  }
  return policyInstance;
}
