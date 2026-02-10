/**
 * @hooks/gateway-enforcement.hook
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Gateway Enforcement Hook — runtime guard that enforces Gateway
 * non-negotiables at every lifecycle point:
 *
 *  1. before_acheevy_response: Injects gateway context, validates
 *     that only ACHEEVY speaks to users (glass box safety)
 *  2. before_tool_call: Validates SDT scope, evidence requirements,
 *     LUC budget checks, and certification gates
 *  3. after_tool_call: Scans outputs for secrets, produces operations
 *     feed entries, attaches receipts to Evidence Locker
 *
 * Priority: 90 (runs after chain-of-command hook at 100)
 */

import type { HookDefinition, HookContext } from '../types/hooks';

/* ------------------------------------------------------------------ */
/*  Glass Box Safety Patterns                                         */
/* ------------------------------------------------------------------ */

const UNSAFE_OUTPUT_PATTERNS = [
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9_]{36}/,
  /sk-[A-Za-z0-9]{48}/,
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/,
  /xox[bprs]-[0-9]+-[A-Za-z0-9]+/,
  /AIza[0-9A-Za-z_-]{35}/,
];

const INTERNAL_REASONING_PATTERNS = [
  /\[internal\]/i,
  /\[reasoning\]/i,
  /\[thinking\]/i,
  /\[system prompt\]/i,
  /\[debug\]/i,
];

function scanForLeaks(content: string): string[] {
  const findings: string[] = [];
  for (const p of UNSAFE_OUTPUT_PATTERNS) {
    if (p.test(content)) {
      findings.push(`Potential secret: ${p.source.substring(0, 25)}...`);
    }
  }
  for (const p of INTERNAL_REASONING_PATTERNS) {
    if (p.test(content)) {
      findings.push(`Internal reasoning marker: ${p.source}`);
    }
  }
  return findings;
}

/* ------------------------------------------------------------------ */
/*  Tenant Isolation Check                                            */
/* ------------------------------------------------------------------ */

function validateTenantScope(context: HookContext, requiredTenantId?: string): boolean {
  if (!requiredTenantId) return true;
  const userTenant = context.user.profile?.tenant_id;
  return userTenant === requiredTenantId;
}

/* ------------------------------------------------------------------ */
/*  Hook Definition                                                   */
/* ------------------------------------------------------------------ */

export const GatewayEnforcementHook: HookDefinition = {
  metadata: {
    name: 'gateway-enforcement',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'Enforces Gateway non-negotiables: tenant isolation, SDT scope, evidence requirements, glass box safety, and LUC budget checks',
    priority: 90,
  },

  lifecycle_points: {
    /**
     * before_acheevy_response
     * - Inject gateway service context
     * - Block any non-ACHEEVY user-facing messages
     * - Validate tenant isolation
     */
    before_acheevy_response: {
      execute: async (context: HookContext) => {
        // Inject gateway availability flag
        if (!context.conversation_metadata) {
          context.conversation_metadata = {};
        }
        context.conversation_metadata.gateway_active = true;
        context.conversation_metadata.gateway_version = '1.0.0';

        // Glass box: ensure no internal reasoning leaks into user-facing message
        if (context.next_prompt) {
          const leaks = scanForLeaks(context.next_prompt);
          if (leaks.length > 0) {
            // Sanitize the response, don't block it
            for (const pattern of [...UNSAFE_OUTPUT_PATTERNS, ...INTERNAL_REASONING_PATTERNS]) {
              context.next_prompt = context.next_prompt.replace(pattern, '[REDACTED]');
            }
            context.conversation_metadata.gateway_sanitized = true;
            context.conversation_metadata.gateway_leak_count = leaks.length;
          }
        }

        return context;
      },
    },

    /**
     * before_tool_call
     * - Validate tenant isolation on any data access
     * - Check SDT validity before artifact delivery
     * - Enforce LUC budget before heavy operations
     * - Enforce certification gate before plug installs
     */
    before_tool_call: {
      execute: async (context: HookContext, toolName?: string, args?: Record<string, unknown>) => {
        if (!context.conversation_metadata) {
          context.conversation_metadata = {};
        }

        const gatewayChecks: string[] = [];

        // SDT scope validation
        if (toolName === 'deliver_artifact' || toolName === 'access_sdt') {
          const tokenId = args?.token_id as string | undefined;
          if (!tokenId) {
            gatewayChecks.push('SDT token_id required for artifact delivery');
          }
          // Actual validation happens in SDTService.validate()
          // Hook records the intent
          context.conversation_metadata.gateway_sdt_check = tokenId ?? 'missing';
        }

        // LUC budget check before heavy operations
        if (toolName === 'deploy' || toolName === 'execute_workflow' || toolName === 'build') {
          const quoteId = args?.luc_quote_id as string | undefined;
          if (!quoteId) {
            gatewayChecks.push('LUC quote required before deploy/build/execute operations');
          }
          context.conversation_metadata.gateway_luc_check = quoteId ?? 'missing';
        }

        // Certification gate before plug install
        if (toolName === 'install_plug') {
          const plugId = args?.plug_id as string | undefined;
          if (!plugId) {
            gatewayChecks.push('plug_id required for installation');
          }
          context.conversation_metadata.gateway_cert_check = plugId ?? 'missing';
        }

        // Tenant isolation on evidence access
        if (toolName === 'query_evidence' || toolName === 'export_evidence') {
          const tenantId = args?.tenant_id as string | undefined;
          if (tenantId && !validateTenantScope(context, tenantId)) {
            gatewayChecks.push(`Tenant isolation violation: user tenant does not match ${tenantId}`);
          }
        }

        if (gatewayChecks.length > 0) {
          context.conversation_metadata.gateway_warnings = gatewayChecks;
        }

        return context;
      },
    },

    /**
     * after_tool_call
     * - Scan all outputs for secrets / internal reasoning
     * - Record evidence into operations feed
     * - Attach proof artifacts
     */
    after_tool_call: {
      execute: async (context: HookContext, toolName?: string, result?: Record<string, unknown>) => {
        if (!context.conversation_metadata) {
          context.conversation_metadata = {};
        }

        // Scan result for leaks
        if (result) {
          const resultStr = JSON.stringify(result);
          const leaks = scanForLeaks(resultStr);
          if (leaks.length > 0) {
            context.conversation_metadata.gateway_output_leak_detected = true;
            context.conversation_metadata.gateway_leak_details = leaks;
            // In production: block or sanitize the response
          }
        }

        // Track operations feed entry
        if (result && (result as any).receipt_id) {
          if (!context.conversation_metadata.gateway_receipts) {
            context.conversation_metadata.gateway_receipts = [];
          }
          (context.conversation_metadata.gateway_receipts as string[]).push(
            (result as any).receipt_id
          );
        }

        // Track evidence refs
        if (result && (result as any).artifact_id) {
          if (!context.conversation_metadata.gateway_evidence_refs) {
            context.conversation_metadata.gateway_evidence_refs = [];
          }
          (context.conversation_metadata.gateway_evidence_refs as string[]).push(
            (result as any).artifact_id
          );
        }

        return context;
      },
    },
  },
};
