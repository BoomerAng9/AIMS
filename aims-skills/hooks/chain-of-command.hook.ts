/**
 * @hook chain-of-command
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Enforces the canonical Chain of Command at runtime.
 *
 * This hook intercepts message routing, action execution, and overlay
 * event production to guarantee that:
 *   1. Only ACHEEVY speaks to the user
 *   2. No agent bypasses the chain
 *   3. "No proof, no done" is enforced per stage
 *   4. Overlay events are safe and policy-compliant
 */

import { HookDefinition } from '../types/hooks';
import {
  createRegistry,
  evaluateRoute,
  authorizeAction,
  authorizeTool,
  checkEvidenceGate,
  scanForUnsafeContent,
  formatOverlaySnippet,
  ENFORCEMENT_POLICY,
  OVERLAY_SNIPPET_POLICY,
} from '../chain-of-command';
import type {
  RouteRequest,
  EventType,
  PipelineStage,
} from '../types/chain-of-command';

// Singleton registry — loaded once, shared across hook invocations
const registry = createRegistry();

export const ChainOfCommandHook: HookDefinition = {
  metadata: {
    name: 'chain_of_command',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description:
      'Enforces the canonical Chain of Command: routing, gates, evidence, overlay safety',
    priority: 100,
  },

  lifecycle_points: {
    /**
     * Before ACHEEVY responds — inject chain-of-command context and
     * validate that only ACHEEVY is producing the user-facing message.
     */
    before_acheevy_response: {
      execute: async (context: any) => {
        // Inject the full registry into context for downstream consumers
        context.chain_of_command = {
          registry,
          policy: ENFORCEMENT_POLICY,
          snippet_policy: OVERLAY_SNIPPET_POLICY,
          stats: registry.stats(),
        };

        // If there's a pending_sender that isn't ACHEEVY, block it
        if (
          context.pending_sender &&
          context.pending_sender !== 'ACHEEVY'
        ) {
          const route: RouteRequest = {
            from_handle: context.pending_sender,
            to_handle: 'USER',
            action: 'MESSAGE',
          };
          const decision = registry.evaluateRoute(route);
          if (!decision.allowed) {
            context.blocked = true;
            context.block_reason = decision.reason;
            return context;
          }
        }

        return context;
      },
    },

    /**
     * Before a tool call — verify the calling agent is authorized
     * to use the tool and perform the action.
     */
    before_tool_call: {
      execute: async (context: any) => {
        const callerHandle = context.caller_handle;
        const toolName = context.tool_name;
        const actionName = context.action_name;

        if (!callerHandle) return context;

        const card = registry.getCard(callerHandle);
        if (!card) {
          context.blocked = true;
          context.block_reason = `Unknown agent handle: ${callerHandle}`;
          return context;
        }

        // Check tool authorization
        if (toolName) {
          const toolAuth = authorizeTool(card, toolName);
          if (!toolAuth.authorized) {
            context.blocked = true;
            context.block_reason = toolAuth.reason;
            return context;
          }
        }

        // Check action authorization
        if (actionName) {
          const actionAuth = authorizeAction(card, actionName);
          if (!actionAuth.authorized) {
            context.blocked = true;
            context.block_reason = actionAuth.reason;
            return context;
          }
        }

        return context;
      },
    },

    /**
     * After a tool call — validate evidence, scan for unsafe content,
     * and produce safe overlay events.
     */
    after_tool_call: {
      execute: async (context: any, result: any) => {
        const callerHandle = context.caller_handle;

        // Scan any output text for unsafe content
        if (result && typeof result === 'string') {
          const safety = scanForUnsafeContent(result, ENFORCEMENT_POLICY);
          if (!safety.safe) {
            context.safety_violations = safety.violations;
            // Redact the unsafe content from any overlay output
            context.overlay_redacted = true;
          }
        }

        // If there's a stage and artifacts, check evidence gate
        if (context.pipeline_stage && context.artifacts) {
          const evidenceResult = checkEvidenceGate(
            context.pipeline_stage as PipelineStage,
            context.artifacts as string[],
            ENFORCEMENT_POLICY
          );
          if (!evidenceResult.valid) {
            context.evidence_gate_failed = true;
            context.evidence_errors = evidenceResult.errors;
          }
        }

        // Produce overlay event if applicable
        if (callerHandle && context.event_type) {
          const event = registry.produceEvent(
            callerHandle,
            context.event_type as EventType,
            {
              artifact_ref: context.artifact_ref,
              short_status: context.short_status,
            }
          );
          if (event) {
            const snippet = formatOverlaySnippet(event, OVERLAY_SNIPPET_POLICY);
            context.overlay_snippet = snippet;
            context.overlay_event = event;
          }
        }

        return context;
      },
    },
  },
};
