// frontend/lib/luc/policy.ts

/**
 * LUC Policy Layer
 *
 * Implements the policy hierarchy:
 * 1. Platform defaults
 * 2. Workspace overrides
 * 3. Project overrides (stub)
 * 4. Environment overrides (stub)
 *
 * Policies are validated before apply, logged to audit, and support rollback.
 */

import { prisma } from "@/lib/db/prisma";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  SERVICE_KEYS,
  LUC_DEFAULTS,
  PLAN_IDS,
  OVERAGE_POLICIES,
  type ServiceKey,
  type PlanId,
  type OveragePolicy,
} from "@/aims-tools/luc/luc.constants";

// ─────────────────────────────────────────────────────────────────────────────
// Policy Schema
// ─────────────────────────────────────────────────────────────────────────────

const QuotaLimitSchema = z.object({
  serviceKey: z.string(),
  limit: z.number().int(),
  rate: z.number().min(0).optional(),
});

const PlanPolicySchema = z.object({
  planId: z.string(),
  displayName: z.string(),
  quotaLimits: z.array(QuotaLimitSchema),
  overagePolicy: z.enum([
    OVERAGE_POLICIES.BLOCK,
    OVERAGE_POLICIES.ALLOW_OVERAGE,
    OVERAGE_POLICIES.SOFT_LIMIT,
  ]),
  softWarnThreshold: z.number().min(0).max(1).default(0.8),
  hardWarnThreshold: z.number().min(0).max(1).default(0.95),
});

const WorkspacePolicySchema = z.object({
  quotaOverrides: z.record(z.string(), z.number()).optional(),
  rateOverrides: z.record(z.string(), z.number()).optional(),
  overagePolicy: z.enum([
    OVERAGE_POLICIES.BLOCK,
    OVERAGE_POLICIES.ALLOW_OVERAGE,
    OVERAGE_POLICIES.SOFT_LIMIT,
  ]).optional(),
  softWarnThreshold: z.number().min(0).max(1).optional(),
  hardWarnThreshold: z.number().min(0).max(1).optional(),
  showBoomerAngNames: z.boolean().optional(),
  customSettings: z.record(z.unknown()).optional(),
});

export type PlanPolicy = z.infer<typeof PlanPolicySchema>;
export type WorkspacePolicy = z.infer<typeof WorkspacePolicySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Platform Defaults
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_DEFAULTS = {
  softWarnThreshold: LUC_DEFAULTS.SOFT_WARN_THRESHOLD,
  hardWarnThreshold: LUC_DEFAULTS.HARD_WARN_THRESHOLD,
  overageBuffer: LUC_DEFAULTS.OVERAGE_BUFFER,
  billingCycleDays: LUC_DEFAULTS.BILLING_CYCLE_DAYS,
  showBoomerAngNames: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Policy Service
// ─────────────────────────────────────────────────────────────────────────────

export class PolicyService {
  /**
   * Get effective policy by merging layers
   */
  async getEffectivePolicy(
    scope: "platform" | "workspace" | "project" | "environment",
    scopeId?: string
  ): Promise<Record<string, unknown>> {
    // Start with platform defaults
    let effective: Record<string, unknown> = { ...PLATFORM_DEFAULTS };

    // Get platform policy
    const platformPolicy = await this.getPolicy("PLATFORM");
    if (platformPolicy) {
      effective = { ...effective, ...platformPolicy };
    }

    // If workspace scope or deeper, apply workspace overrides
    if (scope !== "platform" && scopeId) {
      const workspacePolicy = await this.getPolicy("WORKSPACE", scopeId);
      if (workspacePolicy) {
        effective = { ...effective, ...workspacePolicy };
      }
    }

    // Project and environment overrides (stubs for now)
    // These would be applied similarly when implemented

    return effective;
  }

  /**
   * Get policy for a specific scope
   */
  async getPolicy(
    scope: string,
    scopeId?: string
  ): Promise<Record<string, unknown> | null> {
    const policy = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId: scopeId ?? null,
        status: "EFFECTIVE",
      },
      orderBy: { version: "desc" },
    });

    if (!policy) {
      return null;
    }

    return JSON.parse(policy.policy);
  }

  /**
   * Get draft policy for editing
   */
  async getDraftPolicy(
    scope: string,
    scopeId?: string
  ): Promise<{ id: string; version: number; policy: Record<string, unknown> } | null> {
    const draft = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId: scopeId ?? null,
        status: "DRAFT",
      },
      orderBy: { version: "desc" },
    });

    if (!draft) {
      return null;
    }

    return {
      id: draft.id,
      version: draft.version,
      policy: JSON.parse(draft.policy),
    };
  }

  /**
   * Create or update draft policy
   */
  async saveDraft(
    scope: string,
    scopeId: string | null,
    policy: Record<string, unknown>,
    userId: string
  ): Promise<{ id: string; version: number }> {
    // Validate policy based on scope
    if (scope === "WORKSPACE") {
      WorkspacePolicySchema.parse(policy);
    }

    // Check for existing draft
    const existingDraft = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId,
        status: "DRAFT",
      },
    });

    if (existingDraft) {
      // Update existing draft
      await prisma.policyVersion.update({
        where: { id: existingDraft.id },
        data: {
          policy: JSON.stringify(policy),
        },
      });
      return { id: existingDraft.id, version: existingDraft.version };
    }

    // Get next version number
    const latestVersion = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId,
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new draft
    const draft = await prisma.policyVersion.create({
      data: {
        scope: scope as any,
        scopeId,
        workspaceId: scope === "WORKSPACE" ? scopeId : null,
        version: nextVersion,
        status: "DRAFT",
        policy: JSON.stringify(policy),
        createdById: userId,
      },
    });

    return { id: draft.id, version: draft.version };
  }

  /**
   * Apply a draft policy (make it effective)
   */
  async applyPolicy(
    draftId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const draft = await prisma.policyVersion.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.status !== "DRAFT") {
      throw new Error("Draft policy not found");
    }

    // Validate before apply
    const policy = JSON.parse(draft.policy);
    if (draft.scope === "WORKSPACE") {
      WorkspacePolicySchema.parse(policy);
    }

    // Supersede current effective policy
    await prisma.policyVersion.updateMany({
      where: {
        scope: draft.scope,
        scopeId: draft.scopeId,
        status: "EFFECTIVE",
      },
      data: {
        status: "SUPERSEDED",
        supersededAt: new Date(),
      },
    });

    // Make draft effective
    await prisma.policyVersion.update({
      where: { id: draftId },
      data: {
        status: "EFFECTIVE",
        effectiveAt: new Date(),
      },
    });

    // Log audit entry
    await this.logAuditEntry({
      userId,
      action: "policy.apply",
      resource: "PolicyVersion",
      resourceId: draftId,
      workspaceId: draft.workspaceId,
      newValue: policy,
      reason,
    });
  }

  /**
   * Rollback to a previous policy version
   */
  async rollbackPolicy(
    scope: string,
    scopeId: string | null,
    targetVersion: number,
    userId: string,
    reason: string
  ): Promise<void> {
    const targetPolicy = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId,
        version: targetVersion,
      },
    });

    if (!targetPolicy) {
      throw new Error("Target policy version not found");
    }

    // Get current effective
    const currentEffective = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId,
        status: "EFFECTIVE",
      },
    });

    // Supersede current
    if (currentEffective) {
      await prisma.policyVersion.update({
        where: { id: currentEffective.id },
        data: {
          status: "SUPERSEDED",
          supersededAt: new Date(),
        },
      });
    }

    // Create new version from target
    const nextVersion = await this.getNextVersion(scope, scopeId);
    const newPolicy = await prisma.policyVersion.create({
      data: {
        scope: scope as any,
        scopeId,
        workspaceId: scope === "WORKSPACE" ? scopeId : null,
        version: nextVersion,
        status: "EFFECTIVE",
        policy: targetPolicy.policy,
        createdById: userId,
        effectiveAt: new Date(),
      },
    });

    // Log audit
    await this.logAuditEntry({
      userId,
      action: "policy.rollback",
      resource: "PolicyVersion",
      resourceId: newPolicy.id,
      workspaceId: newPolicy.workspaceId,
      previousValue: currentEffective ? JSON.parse(currentEffective.policy) : null,
      newValue: JSON.parse(targetPolicy.policy),
      reason: `Rollback to version ${targetVersion}: ${reason}`,
    });
  }

  /**
   * Get policy version history
   */
  async getPolicyHistory(
    scope: string,
    scopeId?: string
  ): Promise<Array<{
    id: string;
    version: number;
    status: string;
    createdAt: Date;
    effectiveAt: Date | null;
  }>> {
    const versions = await prisma.policyVersion.findMany({
      where: {
        scope: scope as any,
        scopeId: scopeId ?? null,
      },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        status: true,
        createdAt: true,
        effectiveAt: true,
      },
    });

    return versions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async getNextVersion(scope: string, scopeId: string | null): Promise<number> {
    const latest = await prisma.policyVersion.findFirst({
      where: {
        scope: scope as any,
        scopeId,
      },
      orderBy: { version: "desc" },
    });

    return (latest?.version || 0) + 1;
  }

  private async logAuditEntry(entry: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    workspaceId?: string | null;
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        workspaceId: entry.workspaceId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        previousValue: entry.previousValue ? JSON.stringify(entry.previousValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        reason: entry.reason,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

let policyServiceInstance: PolicyService | null = null;

export function getPolicyService(): PolicyService {
  if (!policyServiceInstance) {
    policyServiceInstance = new PolicyService();
  }
  return policyServiceInstance;
}
