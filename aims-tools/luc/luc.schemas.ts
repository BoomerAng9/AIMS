/**
 * LUC Schemas - Zod Validation for Inputs/Outputs
 * @version 2.0.0
 *
 * All schemas are MCP/ACP-safe and can be used for API validation.
 */

import { z } from "zod";
import { SERVICE_KEYS, PLAN_IDS, OVERAGE_POLICIES } from "./luc.constants";

// ─────────────────────────────────────────────────────────────────────────────
// Base Types
// ─────────────────────────────────────────────────────────────────────────────

export const ServiceKeySchema = z.enum([
  SERVICE_KEYS.LLM_TOKENS_IN,
  SERVICE_KEYS.LLM_TOKENS_OUT,
  SERVICE_KEYS.N8N_EXECUTIONS,
  SERVICE_KEYS.NODE_RUNTIME_SECONDS,
  SERVICE_KEYS.SWARM_CYCLES,
  SERVICE_KEYS.BRAVE_QUERIES,
  SERVICE_KEYS.VOICE_CHARS,
  SERVICE_KEYS.STT_MINUTES,
  SERVICE_KEYS.CONTAINER_HOURS,
  SERVICE_KEYS.STORAGE_GB_MONTH,
  SERVICE_KEYS.BANDWIDTH_GB,
  SERVICE_KEYS.BOOMER_ANG_INVOCATIONS,
  SERVICE_KEYS.AGENT_EXECUTIONS,
  SERVICE_KEYS.DEPLOY_OPERATIONS,
  SERVICE_KEYS.API_CALLS,
]);

export const PlanIdSchema = z.enum([
  PLAN_IDS.P2P,
  PLAN_IDS.COFFEE,
  PLAN_IDS.DATA_ENTRY,
  PLAN_IDS.PRO,
  PLAN_IDS.ENTERPRISE,
]);

export const OveragePolicySchema = z.enum([
  OVERAGE_POLICIES.BLOCK,
  OVERAGE_POLICIES.ALLOW_OVERAGE,
  OVERAGE_POLICIES.SOFT_LIMIT,
]);

// ─────────────────────────────────────────────────────────────────────────────
// Account & Workspace
// ─────────────────────────────────────────────────────────────────────────────

export const WorkspaceIdSchema = z.string().min(1).max(64);
export const UserIdSchema = z.string().min(1).max(64);
export const RequestIdSchema = z.string().uuid().optional();

// ─────────────────────────────────────────────────────────────────────────────
// Quota Schema
// ─────────────────────────────────────────────────────────────────────────────

export const QuotaSchema = z.object({
  serviceKey: ServiceKeySchema,
  limit: z.number().int(), // 0 = metered/P2P (no included allocation)
  used: z.number().min(0),
  reserved: z.number().min(0).default(0),
  overage: z.number().min(0).default(0),
});

export type Quota = z.infer<typeof QuotaSchema>;

export const QuotasMapSchema = z.record(ServiceKeySchema, QuotaSchema);

export type QuotasMap = z.infer<typeof QuotasMapSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// LUC Account State
// ─────────────────────────────────────────────────────────────────────────────

export const LucAccountSchema = z.object({
  id: z.string().uuid(),
  workspaceId: WorkspaceIdSchema,
  planId: PlanIdSchema,
  status: z.enum(["active", "suspended", "trial", "overdue"]),
  quotas: QuotasMapSchema,
  overagePolicy: OveragePolicySchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LucAccount = z.infer<typeof LucAccountSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Usage Event (Append-Only)
// ─────────────────────────────────────────────────────────────────────────────

export const UsageEventMetadataSchema = z.object({
  toolId: z.string().optional(),
  route: z.string().optional(),
  boomerAngOwner: z.string().optional(),
  deploymentId: z.string().optional(),
  description: z.string().optional(),
  // Extensible metadata
}).passthrough();

export const UsageEventSchema = z.object({
  id: z.string().uuid(),
  workspaceId: WorkspaceIdSchema,
  userId: UserIdSchema.optional(),
  serviceKey: ServiceKeySchema,
  units: z.number().min(0),
  cost: z.number().min(0),
  requestId: RequestIdSchema,
  metadata: UsageEventMetadataSchema.optional(),
  timestamp: z.string().datetime(),
  eventType: z.enum(["usage", "credit", "adjustment"]),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API Request Schemas
// ─────────────────────────────────────────────────────────────────────────────

// Can Execute Request
export const CanExecuteRequestSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  serviceKey: ServiceKeySchema,
  units: z.number().min(0),
  userId: UserIdSchema.optional(),
  requestId: RequestIdSchema,
});

export type CanExecuteRequest = z.infer<typeof CanExecuteRequestSchema>;

// Can Execute Response
export const CanExecuteResponseSchema = z.object({
  canExecute: z.boolean(),
  reason: z.string().optional(),
  quotaRemaining: z.number(),
  quotaLimit: z.number(),
  percentUsed: z.number().min(0).max(100),
  wouldExceed: z.boolean(),
  overage: z.number().min(0),
  warning: z.string().optional(),
  warningLevel: z.enum(["none", "soft", "hard", "exceeded", "blocked"]),
});

export type CanExecuteResponse = z.infer<typeof CanExecuteResponseSchema>;

// Estimate Request
export const EstimateRequestSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  services: z.array(
    z.object({
      serviceKey: ServiceKeySchema,
      units: z.number().min(0),
    })
  ),
  userId: UserIdSchema.optional(),
});

export type EstimateRequest = z.infer<typeof EstimateRequestSchema>;

// Estimate Response
export const EstimateItemSchema = z.object({
  serviceKey: ServiceKeySchema,
  units: z.number().min(0),
  cost: z.number().min(0),
  quotaRemaining: z.number(),
  wouldExceed: z.boolean(),
  warning: z.string().optional(),
});

export const EstimateResponseSchema = z.object({
  items: z.array(EstimateItemSchema),
  totalCost: z.number().min(0),
  anyWouldExceed: z.boolean(),
  warnings: z.array(z.string()),
});

export type EstimateResponse = z.infer<typeof EstimateResponseSchema>;

// Record Usage Request
export const RecordUsageRequestSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  serviceKey: ServiceKeySchema,
  units: z.number().min(0),
  userId: UserIdSchema.optional(),
  requestId: RequestIdSchema,
  metadata: UsageEventMetadataSchema.optional(),
});

export type RecordUsageRequest = z.infer<typeof RecordUsageRequestSchema>;

// Record Usage Response
export const RecordUsageResponseSchema = z.object({
  success: z.boolean(),
  eventId: z.string().uuid(),
  quotaRemaining: z.number(),
  quotaLimit: z.number(),
  percentUsed: z.number(),
  overage: z.number(),
  warning: z.string().optional(),
});

export type RecordUsageResponse = z.infer<typeof RecordUsageResponseSchema>;

// Credit Usage Request
export const CreditUsageRequestSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  serviceKey: ServiceKeySchema,
  units: z.number().min(0),
  reason: z.string().min(1).max(500),
  userId: UserIdSchema.optional(),
  originalEventId: z.string().uuid().optional(),
});

export type CreditUsageRequest = z.infer<typeof CreditUsageRequestSchema>;

// Credit Usage Response
export const CreditUsageResponseSchema = z.object({
  success: z.boolean(),
  eventId: z.string().uuid(),
  quotaRemaining: z.number(),
  credited: z.number(),
});

export type CreditUsageResponse = z.infer<typeof CreditUsageResponseSchema>;

// Summary Request
export const SummaryRequestSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  includeBreakdown: z.boolean().default(false),
  includeHistory: z.boolean().default(false),
  historyDays: z.number().min(1).max(90).default(7),
});

export type SummaryRequest = z.infer<typeof SummaryRequestSchema>;

// Summary Response
export const QuotaSummaryItemSchema = z.object({
  serviceKey: ServiceKeySchema,
  serviceName: z.string(),
  limit: z.number(),
  used: z.number(),
  reserved: z.number(),
  available: z.number(),
  percentUsed: z.number(),
  warningLevel: z.enum(["none", "soft", "hard", "exceeded"]),
  overage: z.number(),
  estimatedCost: z.number(),
});

export const SummaryResponseSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  planId: PlanIdSchema,
  status: z.enum(["active", "suspended", "trial", "overdue"]),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  daysRemaining: z.number(),
  overallPercentUsed: z.number(),
  overallWarningLevel: z.enum(["none", "soft", "hard", "exceeded"]),
  totalEstimatedCost: z.number(),
  quotas: z.array(QuotaSummaryItemSchema),
  breakdown: z
    .record(
      ServiceKeySchema,
      z.array(
        z.object({
          date: z.string(),
          units: z.number(),
          cost: z.number(),
        })
      )
    )
    .optional(),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Policy Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const PolicyScopeSchema = z.enum([
  "platform",
  "workspace",
  "project",
  "environment",
]);

export type PolicyScope = z.infer<typeof PolicyScopeSchema>;

export const QuotaLimitPolicySchema = z.object({
  serviceKey: ServiceKeySchema,
  limit: z.number().int(), // 0 = metered/P2P (no included allocation)
  rate: z.number().min(0), // Cost per unit
});

export const PlanPolicySchema = z.object({
  planId: PlanIdSchema,
  displayName: z.string(),
  quotaLimits: z.array(QuotaLimitPolicySchema),
  overagePolicy: OveragePolicySchema,
  softWarnThreshold: z.number().min(0).max(1).default(0.8),
  hardWarnThreshold: z.number().min(0).max(1).default(0.95),
});

export type PlanPolicy = z.infer<typeof PlanPolicySchema>;

export const PolicyVersionSchema = z.object({
  id: z.string().uuid(),
  scope: PolicyScopeSchema,
  scopeId: z.string().optional(), // workspace/project/env ID
  version: z.number().int().min(1),
  status: z.enum(["draft", "effective", "superseded"]),
  policy: z.record(z.unknown()), // Flexible policy object
  createdBy: UserIdSchema,
  createdAt: z.string().datetime(),
  effectiveAt: z.string().datetime().optional(),
  supersededAt: z.string().datetime().optional(),
});

export type PolicyVersion = z.infer<typeof PolicyVersionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Schema
// ─────────────────────────────────────────────────────────────────────────────

export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  workspaceId: WorkspaceIdSchema.optional(),
  userId: UserIdSchema,
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  reason: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// LUC State (UI-Safe Response Object)
// ─────────────────────────────────────────────────────────────────────────────

export const LucStateSchema = z.object({
  overallPercent: z.number().min(0).max(100),
  warningLevel: z.enum(["none", "soft", "hard", "exceeded"]),
  activeBoomerAngs: z.number().min(0),
  boomerAngNames: z.array(z.string()).optional(), // Only if policy permits
  projectedOverage: z.number().min(0),
  daysRemaining: z.number().min(0),
  topServices: z.array(
    z.object({
      serviceKey: ServiceKeySchema,
      name: z.string(),
      percentUsed: z.number(),
    })
  ),
});

export type LucState = z.infer<typeof LucStateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Preset System Schemas (for Flip Secrets)
// ─────────────────────────────────────────────────────────────────────────────

export const PresetFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["number", "string", "boolean", "currency", "percentage"]),
  category: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  constraints: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      required: z.boolean().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

export type PresetField = z.infer<typeof PresetFieldSchema>;

export const PresetFormulaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  inputs: z.array(z.string()), // Field IDs
  expression: z.string(), // JavaScript expression
  outputType: z.enum(["number", "currency", "percentage", "boolean"]),
});

export type PresetFormula = z.infer<typeof PresetFormulaSchema>;

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  category: z.string(),
  inputFields: z.array(PresetFieldSchema),
  outputFields: z.array(PresetFieldSchema),
  formulas: z.array(PresetFormulaSchema),
  testCases: z
    .array(
      z.object({
        name: z.string(),
        inputs: z.record(z.union([z.string(), z.number(), z.boolean()])),
        expectedOutputs: z.record(z.union([z.string(), z.number(), z.boolean()])),
      })
    )
    .optional(),
});

export type Preset = z.infer<typeof PresetSchema>;
