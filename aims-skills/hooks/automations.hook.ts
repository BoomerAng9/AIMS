/**
 * @hook automations-lifecycle
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Cross-cutting automation hook — injects automation awareness
 *   into every ACHEEVY response, every Boomer_Ang delegation, and every
 *   vertical execution.
 *
 * This is NOT a standalone page hook. It's a lifecycle hook that ensures
 * Automations is a peripheral capability available to all actors:
 *
 *   1. ACHEEVY can suggest automations when it detects repetitive user tasks
 *   2. Boomer_Angs can trigger automations as part of their execution flow
 *   3. Verticals can chain automations into their Phase B execution
 *   4. Chat context always shows active automations relevant to the conversation
 *   5. Any agent can propose "automate this" after completing a manual task
 *
 * Priority: 70 (runs after identity guard but before response generation)
 */

import { HookDefinition, HookContext } from '../types/hooks';

// ─── Automation Awareness Context ────────────────────────────────────────────

/**
 * Patterns that suggest the user is doing something that COULD be automated.
 * When detected, ACHEEVY should offer to create an automation.
 */
const AUTOMATABLE_PATTERNS = [
  { pattern: /review\s*(this|my|the)\s*pr/i, suggestion: 'Auto-review PRs', template: 'auto-pr-review' },
  { pattern: /check\s*(for)?\s*(security|vulnerab)/i, suggestion: 'Daily security scans', template: 'security-scan' },
  { pattern: /write\s*(a|the)?\s*pr\s*description/i, suggestion: 'Auto-generate PR descriptions', template: 'auto-pr-description' },
  { pattern: /sentry\s*(error|issue|bug)/i, suggestion: 'Auto-prioritize Sentry errors', template: 'sentry-prioritize' },
  { pattern: /clean\s*up\s*(todo|tech\s*debt|dead\s*code)/i, suggestion: 'Weekly tech debt cleanup', template: 'weekly-tech-debt' },
  { pattern: /deploy\s*(health|monitor|check)/i, suggestion: 'Post-deploy health monitoring', template: 'deploy-health' },
  { pattern: /enrich\s*(linear|issue|ticket)/i, suggestion: 'Auto-enrich Linear issues', template: 'enrich-issues' },
  { pattern: /(fix|patch)\s*(this|the)?\s*(bug|error)/i, suggestion: 'Auto-fix Sentry errors', template: 'auto-fix-sentry' },
];

/**
 * Actions that verticals and agents can use to interact with automations.
 */
export const AUTOMATION_ACTIONS = {
  /** Suggest creating an automation to the user */
  SUGGEST_AUTOMATION: 'suggest_automation',
  /** Trigger an existing automation on-demand */
  TRIGGER_AUTOMATION: 'trigger_automation',
  /** Check if an automation already exists for this pattern */
  CHECK_EXISTING: 'check_existing_automation',
  /** Register a new automation from a completed task */
  REGISTER_FROM_TASK: 'register_automation_from_task',
  /** List automations relevant to the current context */
  LIST_RELEVANT: 'list_relevant_automations',
} as const;

/**
 * Agents authorized to interact with the automation system.
 * Every Boomer_Ang can suggest, Chicken Hawk can trigger, ACHEEVY can manage.
 */
const AUTOMATION_ROLES = {
  // Full CRUD + execution
  managers: new Set(['ACHEEVY']),
  // Can trigger and suggest
  operators: new Set(['Plug_Ang', 'Dockmaster_Ang', 'Runner_Ang', 'Chicken Hawk']),
  // Can suggest automations
  suggesters: new Set(['engineer-ang', 'analyst-ang', 'marketer-ang', 'quality-ang']),
};

// ─── Hook Definition ─────────────────────────────────────────────────────────

export const AutomationsLifecycleHook: HookDefinition = {
  metadata: {
    name: 'automations_lifecycle',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'Injects automation awareness into all ACHEEVY interactions. Detects automatable patterns, surfaces active automations, and enables any actor to propose or trigger automations.',
    attached_to: [
      'ACHEEVY.before_response',
      'ACHEEVY.after_task_complete',
      'Boomer_Ang.delegation',
      'Vertical.phase_b_execution',
    ],
    priority: 70,
  },

  lifecycle_points: {
    /**
     * BEFORE every ACHEEVY response:
     *  - Inject active automation context into the system prompt
     *  - Detect if the user is doing something that could be automated
     */
    before_acheevy_response: {
      async execute(context: HookContext) {
        const message = context.message || '';

        // 1. Inject automation awareness into system prompt
        const automationContext = buildAutomationContext(context);
        if (automationContext) {
          context.system_prompt = (context.system_prompt || '') + automationContext;
        }

        // 2. Detect automatable patterns in user message
        const detectedPattern = detectAutomatablePattern(message);
        if (detectedPattern) {
          context.conversation_metadata = {
            ...context.conversation_metadata,
            automation_suggestion: detectedPattern,
            automation_template_id: detectedPattern.template,
          };
        }

        return context;
      },
    },

    /**
     * AFTER every ACHEEVY response:
     *  - If a manual task was just completed, offer to automate it
     *  - Log automation metrics for the audit ledger
     */
    after_acheevy_response: {
      async execute(context: HookContext) {
        // Check if we just completed a task that could be automated
        const metadata = context.conversation_metadata || {};

        if (metadata.task_completed && metadata.task_type) {
          const canAutomate = checkIfTaskIsAutomatable(metadata.task_type);
          if (canAutomate) {
            context.next_prompt = `[AUTOMATION OPPORTUNITY] The task "${metadata.task_type}" was just completed manually. Consider suggesting: "Would you like me to automate this so it runs automatically next time?" Template: ${canAutomate.template}`;
          }
        }

        return context;
      },
    },

    /**
     * BEFORE any tool call:
     *  - Check if this tool call should trigger an automation event
     *  - Enforce automation RBAC (only authorized agents)
     */
    before_tool_call: {
      async execute(context: HookContext, toolName?: string, agentId?: string) {
        // If the tool is an automation action, check RBAC
        if (toolName && isAutomationAction(toolName)) {
          const agent = agentId || 'unknown';
          const authorized = checkAutomationRBAC(agent, toolName);

          if (!authorized) {
            return {
              ...context,
              system_prompt: (context.system_prompt || '') +
                `\n[BLOCKED] Agent "${agent}" is not authorized to perform automation action "${toolName}". Only ACHEEVY can manage automations.`,
            };
          }
        }

        return context;
      },
    },

    /**
     * AFTER tool calls:
     *  - If a deploy/build/monitor completed, check if it should trigger an automation
     */
    after_tool_call: {
      async execute(context: HookContext, toolName?: string) {
        if (!toolName) return context;

        // Map completed actions to potential automation triggers
        const eventMap: Record<string, string> = {
          DEPLOY_INSTANCE: 'deploy_complete',
          BUILD_COMPLETE: 'build_complete',
          HEALTH_CHECK: 'health_alert',
        };

        const automationEvent = eventMap[toolName];
        if (automationEvent) {
          context.conversation_metadata = {
            ...context.conversation_metadata,
            pending_automation_event: automationEvent,
          };
        }

        return context;
      },
    },
  },

  state_schema: {
    active_automations_count: 'number',
    last_suggestion_time: 'string',
    automation_events_fired: 'number',
    patterns_detected: 'string[]',
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function buildAutomationContext(context: HookContext): string | null {
  // Only inject if relevant (not during onboarding, etc.)
  if (context.conversation_mode === 'onboarding') return null;

  return `

[AUTOMATION AWARENESS]
You have access to the Automations system. Capabilities:
- CREATE_AUTOMATION: Create a new automation (schedule or event-triggered)
- TRIGGER_AUTOMATION: Manually run an existing automation
- LIST_RELEVANT: Show automations relevant to the current context

When the user does something repetitive or mentions wanting something to "run automatically",
offer to create an automation. Reference templates when appropriate.
Active automation templates: PR descriptions, Sentry triage, security scans, PR reviews,
tech debt cleanup, deploy monitoring, Linear enrichment, auto-fix bugs.
`;
}

function detectAutomatablePattern(message: string): { suggestion: string; template: string } | null {
  for (const { pattern, suggestion, template } of AUTOMATABLE_PATTERNS) {
    if (pattern.test(message)) {
      return { suggestion, template };
    }
  }
  return null;
}

function checkIfTaskIsAutomatable(taskType: string): { template: string } | null {
  const taskTemplateMap: Record<string, string> = {
    pr_review: 'auto-pr-review',
    pr_description: 'auto-pr-description',
    security_scan: 'security-scan',
    error_triage: 'sentry-prioritize',
    deploy_check: 'deploy-health',
    code_cleanup: 'weekly-tech-debt',
  };
  const template = taskTemplateMap[taskType];
  return template ? { template } : null;
}

function isAutomationAction(toolName: string): boolean {
  return Object.values(AUTOMATION_ACTIONS).includes(toolName as any);
}

function checkAutomationRBAC(agentId: string, action: string): boolean {
  if (AUTOMATION_ROLES.managers.has(agentId)) return true;
  if (action === AUTOMATION_ACTIONS.TRIGGER_AUTOMATION && AUTOMATION_ROLES.operators.has(agentId)) return true;
  if (action === AUTOMATION_ACTIONS.SUGGEST_AUTOMATION && AUTOMATION_ROLES.suggesters.has(agentId)) return true;
  if (action === AUTOMATION_ACTIONS.LIST_RELEVANT) return true; // Read-only, anyone can list
  return false;
}

export default AutomationsLifecycleHook;
