/**
 * @hook paas-enforcement
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Enforces PaaS operation security at runtime.
 *
 * This hook intercepts all PaaS / Plug Engine operations to guarantee:
 *   1. Every deployment requires a LUC quote approval (human-in-the-loop)
 *   2. Every decommission requires explicit user confirmation
 *   3. Only authorized agents can execute instance lifecycle operations
 *   4. Port allocation stays within the 51000+ managed range
 *   5. No instance operation bypasses the Glass Box event trail
 *
 * PaaS Actions Protected:
 *   DEPLOY_INSTANCE, MONITOR_INSTANCE, SCALE_INSTANCE,
 *   DECOMMISSION_INSTANCE, EXPORT_INSTANCE, BROWSE_CATALOG,
 *   RUN_NEEDS_ANALYSIS
 */

import { HookDefinition } from '../types/hooks';

// Agents authorized to execute PaaS operations
const PAAS_AUTHORIZED_AGENTS = new Set([
  'ACHEEVY',
  'Plug_Ang',
  'Dockmaster_Ang',
  'Runner_Ang',
  'Chicken Hawk',
]);

// Actions that require human-in-the-loop confirmation
const HUMAN_GATE_ACTIONS = new Set([
  'DEPLOY_INSTANCE',
  'DECOMMISSION_INSTANCE',
  'SCALE_INSTANCE',
]);

// Actions that require LUC budget check
const LUC_GATE_ACTIONS = new Set([
  'DEPLOY_INSTANCE',
  'SCALE_INSTANCE',
  'EXPORT_INSTANCE',
]);

// Port range for managed plug instances
const PORT_RANGE_MIN = 51000;
const PORT_RANGE_MAX = 65000;

// All PaaS action names (includes automation actions)
const ALL_PAAS_ACTIONS = new Set([
  'DEPLOY_INSTANCE',
  'MONITOR_INSTANCE',
  'SCALE_INSTANCE',
  'DECOMMISSION_INSTANCE',
  'EXPORT_INSTANCE',
  'BROWSE_CATALOG',
  'RUN_NEEDS_ANALYSIS',
  'CREATE_AUTOMATION',
  'MANAGE_AUTOMATION',
  'RUN_AUTOMATION',
  'VIEW_AUTOMATION_HISTORY',
]);

export const PaaSEnforcementHook: HookDefinition = {
  metadata: {
    name: 'paas_enforcement',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description:
      'Enforces PaaS operation security: LUC gates, decommission confirmation, agent authorization, port range, Glass Box audit trail',
    priority: 95, // High priority — runs before most hooks, after chain-of-command (100)
  },

  lifecycle_points: {
    /**
     * Before any PaaS tool call — validate authorization and gates.
     */
    before_tool_call: {
      execute: async (context: any) => {
        const actionName = context.action_name as string;
        const callerHandle = context.caller_handle as string;

        // Only intercept PaaS actions
        if (!actionName || !ALL_PAAS_ACTIONS.has(actionName)) {
          return context;
        }

        // 1. Agent authorization check
        if (!PAAS_AUTHORIZED_AGENTS.has(callerHandle)) {
          context.blocked = true;
          context.block_reason =
            `PaaS enforcement: "${callerHandle}" is not authorized for PaaS operations. ` +
            `Only ${Array.from(PAAS_AUTHORIZED_AGENTS).join(', ')} may execute instance lifecycle actions.`;
          return context;
        }

        // 2. Human-in-the-loop gate
        if (HUMAN_GATE_ACTIONS.has(actionName)) {
          if (!context.human_approved) {
            context.blocked = true;
            context.block_reason =
              `PaaS enforcement: "${actionName}" requires human-in-the-loop approval. ` +
              `The user must explicitly confirm this operation before it can proceed.`;
            context.awaiting_gate = 'human_approval';
            return context;
          }
        }

        // 3. LUC budget gate
        if (LUC_GATE_ACTIONS.has(actionName)) {
          if (!context.luc_approved && !context.luc_quote_presented) {
            context.blocked = true;
            context.block_reason =
              `PaaS enforcement: "${actionName}" requires a LUC cost estimate and user approval. ` +
              `Present the quote before executing.`;
            context.awaiting_gate = 'luc_approval';
            return context;
          }
        }

        // 4. Port range validation (for DEPLOY and SCALE)
        if (actionName === 'DEPLOY_INSTANCE' || actionName === 'SCALE_INSTANCE') {
          const port = context.allocated_port as number;
          if (port && (port < PORT_RANGE_MIN || port > PORT_RANGE_MAX)) {
            context.blocked = true;
            context.block_reason =
              `PaaS enforcement: Port ${port} is outside the managed range (${PORT_RANGE_MIN}-${PORT_RANGE_MAX}). ` +
              `All plug instances must use ports within the allocated PaaS range.`;
            return context;
          }
        }

        // 5. Decommission double-check: instance ID required
        if (actionName === 'DECOMMISSION_INSTANCE') {
          if (!context.instance_id) {
            context.blocked = true;
            context.block_reason =
              'PaaS enforcement: DECOMMISSION_INSTANCE requires an explicit instance_id. ' +
              'Cannot decommission without specifying the target instance.';
            return context;
          }
        }

        // Inject Glass Box event marker for audit trail
        context.glass_box_required = true;
        context.paas_action = actionName;
        context.paas_enforcement_passed = true;

        return context;
      },
    },

    /**
     * After a PaaS tool call — ensure Glass Box event was emitted
     * and validate the operation result.
     */
    after_tool_call: {
      execute: async (context: any, result: any) => {
        const actionName = context.paas_action as string;

        // Only process PaaS actions
        if (!actionName || !ALL_PAAS_ACTIONS.has(actionName)) {
          return context;
        }

        // Verify Glass Box event was produced
        if (context.glass_box_required && !context.glass_box_event_emitted) {
          context.warnings = context.warnings || [];
          context.warnings.push(
            `PaaS audit: Glass Box event was NOT emitted for "${actionName}". ` +
            `All PaaS operations must produce deploy dock events for observability.`
          );
        }

        // For deployments, verify health check ran
        if (actionName === 'DEPLOY_INSTANCE') {
          if (result && typeof result === 'object' && !result.health_check_passed) {
            context.warnings = context.warnings || [];
            context.warnings.push(
              'PaaS audit: Deployment completed but health check was not confirmed. ' +
              'Instance may not be fully operational.'
            );
          }
        }

        // For decommissions, verify audit trail sealed
        if (actionName === 'DECOMMISSION_INSTANCE') {
          if (result && typeof result === 'object' && !result.audit_trail_sealed) {
            context.warnings = context.warnings || [];
            context.warnings.push(
              'PaaS audit: Decommission completed but audit trail was not sealed. ' +
              'Manual review required for compliance.'
            );
          }
        }

        return context;
      },
    },
  },
};
