/**
 * LUC Tool Manifest - Tool Registration and Service Catalog
 * @version 2.0.0
 *
 * PRONUNCIATION: "LUKE" (not L-U-C)
 *
 * This manifest registers LUC as a tool in the A.I.M.S. ecosystem.
 * It defines the tool's capabilities, service catalog, and integration points.
 */

import {
  SERVICE_KEYS,
  SERVICE_CATALOG,
  PLAN_IDS,
  LUC_DEFAULTS,
  type ServiceKey,
  type ServiceDefinition,
  type PlanId,
} from "./luc.constants";

// ─────────────────────────────────────────────────────────────────────────────
// Tool Manifest Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  capabilities: ToolCapability[];
  serviceCatalog: ServiceDefinition[];
  integrations: ToolIntegration[];
  configuration: ToolConfiguration;
  metadata: Record<string, unknown>;
}

export interface ToolCapability {
  id: string;
  name: string;
  description: string;
  serviceKey?: ServiceKey;
  requiresAuth: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface ToolIntegration {
  type: "api" | "ui" | "cli" | "mcp" | "acp";
  endpoint?: string;
  component?: string;
  commands?: string[];
}

export interface ToolConfiguration {
  defaults: Record<string, unknown>;
  required: string[];
  optional: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LUC Tool Manifest
// ─────────────────────────────────────────────────────────────────────────────

export const LUC_MANIFEST: ToolManifest = {
  id: "luc",
  name: "LUC (Ledger Usage Calculator)",
  version: "2.0.0",
  description:
    "Production-grade usage tracking, quota management, and billing engine for A.I.M.S. workspaces.",
  category: "billing",

  capabilities: [
    {
      id: "can_execute",
      name: "Can Execute",
      description: "Check if an operation can be executed within quota limits",
      requiresAuth: true,
      rateLimit: { requests: 1000, windowMs: 60000 },
    },
    {
      id: "estimate",
      name: "Estimate Impact",
      description: "Estimate the impact of operations without mutating state",
      requiresAuth: true,
      rateLimit: { requests: 500, windowMs: 60000 },
    },
    {
      id: "record_usage",
      name: "Record Usage",
      description: "Record actual usage and update quota aggregates",
      requiresAuth: true,
      rateLimit: { requests: 1000, windowMs: 60000 },
    },
    {
      id: "credit_usage",
      name: "Credit Usage",
      description: "Credit usage back (rollback, refund)",
      requiresAuth: true,
      rateLimit: { requests: 100, windowMs: 60000 },
    },
    {
      id: "get_summary",
      name: "Get Summary",
      description: "Get usage summary with breakdown",
      requiresAuth: true,
      rateLimit: { requests: 100, windowMs: 60000 },
    },
    {
      id: "get_state",
      name: "Get LUC State",
      description: "Get current LUC state for status strip",
      requiresAuth: true,
      rateLimit: { requests: 1000, windowMs: 60000 },
    },
    {
      id: "preset_calculate",
      name: "Preset Calculate",
      description: "Run calculations using a preset (e.g., Flip Secrets)",
      requiresAuth: true,
      rateLimit: { requests: 500, windowMs: 60000 },
    },
  ],

  serviceCatalog: Object.values(SERVICE_CATALOG),

  integrations: [
    {
      type: "api",
      endpoint: "/api/luc/can-execute",
    },
    {
      type: "api",
      endpoint: "/api/luc/estimate",
    },
    {
      type: "api",
      endpoint: "/api/luc/record",
    },
    {
      type: "api",
      endpoint: "/api/luc/credit",
    },
    {
      type: "api",
      endpoint: "/api/luc/summary",
    },
    {
      type: "ui",
      component: "/workspace/luc",
    },
    {
      type: "ui",
      component: "/components/shell/StatusStrip",
    },
    {
      type: "mcp",
      commands: ["luc.can_execute", "luc.estimate", "luc.record", "luc.credit"],
    },
    {
      type: "acp",
      commands: ["ESTIMATE_ONLY", "EXECUTE_WITH_LUC", "GET_LUC_STATE"],
    },
  ],

  configuration: {
    defaults: {
      softWarnThreshold: LUC_DEFAULTS.SOFT_WARN_THRESHOLD,
      hardWarnThreshold: LUC_DEFAULTS.HARD_WARN_THRESHOLD,
      overageBuffer: LUC_DEFAULTS.OVERAGE_BUFFER,
      billingCycleDays: LUC_DEFAULTS.BILLING_CYCLE_DAYS,
    },
    required: ["workspaceId"],
    optional: ["userId", "requestId", "metadata"],
  },

  metadata: {
    pronunciation: "LUKE",
    author: "A.I.M.S. Team",
    license: "Proprietary",
    repository: "https://github.com/BoomerAng9/AIMS",
    documentation: "/docs/luc",
    changelog: "/docs/luc/changelog",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Service Key Registry (Stable, Do Not Modify)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all registered service keys
 */
export function getRegisteredServiceKeys(): ServiceKey[] {
  return Object.values(SERVICE_KEYS);
}

/**
 * Get service definition by key
 */
export function getServiceDefinition(key: ServiceKey): ServiceDefinition | undefined {
  return SERVICE_CATALOG[key];
}

/**
 * Check if a service key is registered
 */
export function isServiceKeyRegistered(key: string): key is ServiceKey {
  return Object.values(SERVICE_KEYS).includes(key as ServiceKey);
}

/**
 * Get all plan IDs
 */
export function getRegisteredPlanIds(): PlanId[] {
  return Object.values(PLAN_IDS);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Registration Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register LUC tool with the A.I.M.S. tool registry
 */
export function registerLucTool(registry: {
  register: (manifest: ToolManifest) => void;
}): void {
  registry.register(LUC_MANIFEST);
}

/**
 * Get tool manifest
 */
export function getManifest(): ToolManifest {
  return LUC_MANIFEST;
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP/ACP Integration Types
// ─────────────────────────────────────────────────────────────────────────────

export interface McpLucCommand {
  tool: "luc";
  command: string;
  params: Record<string, unknown>;
}

export interface AcpLucIntent {
  intent: "ESTIMATE_ONLY" | "EXECUTE_WITH_LUC" | "GET_LUC_STATE";
  workspaceId: string;
  services?: { serviceKey: ServiceKey; units: number }[];
}

/**
 * Parse MCP command for LUC
 */
export function parseMcpCommand(input: string): McpLucCommand | null {
  const match = input.match(/^luc\.(\w+)\s*(.*)$/);
  if (!match) return null;

  const [, command, paramsStr] = match;
  let params: Record<string, unknown> = {};

  if (paramsStr) {
    try {
      params = JSON.parse(paramsStr);
    } catch {
      // Try to parse as key=value pairs
      const pairs = paramsStr.split(/\s+/);
      for (const pair of pairs) {
        const [key, value] = pair.split("=");
        if (key && value) {
          params[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    }
  }

  return { tool: "luc", command, params };
}

// Export default manifest
export default LUC_MANIFEST;
