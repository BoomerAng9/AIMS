/**
 * @skill automations
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Autonomous automation engine — run coding agents on schedules or event triggers
 *
 * Automations let ACHEEVY run coding agents in the background:
 *   - On a schedule (hourly, daily, weekly, monthly)
 *   - Triggered by events (GitHub PRs, Sentry errors, Linear issues, Slack messages)
 *
 * Each automation runs in a secure sandbox with full repository access
 * and configured MCP servers, orchestrated through ACHEEVY's execution loop.
 */

import { SkillDefinition } from '../types/skills';

export const AutomationsSkill: SkillDefinition = {
  metadata: {
    name: 'automations',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'Run coding agents on schedules or event triggers to automate bug fixes, documentation, security scans, and maintenance',
    category: 'platform_automation',
    tags: ['automations', 'scheduling', 'event-driven', 'coding-agents', 'ci-cd'],
  },

  triggers: [
    {
      event: 'automation_create',
      condition: 'User wants to create a new automation or use a template',
    },
    {
      event: 'automation_trigger_fired',
      condition: 'A scheduled or event trigger has fired for an active automation',
    },
    {
      event: 'automation_manage',
      condition: 'User wants to view, edit, pause, or archive an automation',
    },
  ],

  dependencies: {
    services: ['UEF_GATEWAY', 'N8N_BRIDGE', 'DOCKER_API', 'AUDIT_LOG'],
    skills: ['claude_agent_sdk_loop'],
  },

  inputs: {
    action: {
      type: 'string',
      required: true,
      description: 'The automation action to perform',
      enum: ['create', 'create_from_template', 'update', 'pause', 'resume', 'archive', 'run_now', 'view_history'],
    },
    automation_id: {
      type: 'string',
      required: false,
      description: 'ID of existing automation (for update/pause/resume/archive/run_now)',
    },
    template_id: {
      type: 'string',
      required: false,
      description: 'Template ID (for create_from_template)',
    },
    config: {
      type: 'object',
      required: false,
      description: 'Automation configuration (name, instructions, triggers, MCP servers)',
    },
  },

  outputs: {
    automation: {
      type: 'object',
      description: 'The automation definition (created or updated)',
    },
    run_history: {
      type: 'array',
      description: 'Recent run history for the automation',
    },
    status: {
      type: 'string',
      description: 'Result status message',
    },
  },

  chain_steps: [
    {
      step: 1,
      name: 'Parse Automation Intent',
      purpose: 'Understand what the user wants to automate and classify the action',
      acheevy_behavior: `
        - Classify intent: create, manage, or inspect
        - If creating: identify trigger type (schedule vs event)
        - If managing: locate the existing automation
        - Match to templates if applicable
        - Estimate LUC cost for the automation
      `,
      output_schema: {
        action: 'string',
        trigger_type: 'string',
        matched_template: 'string | null',
        estimated_luc_cost: 'number',
      },
    },
    {
      step: 2,
      name: 'Configure Automation',
      purpose: 'Build the full automation configuration with triggers, MCP servers, and instructions',
      acheevy_behavior: `
        - Set up trigger (cron schedule or event webhook)
        - Configure MCP server access
        - Validate instructions for the coding agent
        - Set up sandbox environment spec
        - Register with n8n for scheduling/webhooks
      `,
      output_schema: {
        automation_config: 'AutomationDefinition',
        n8n_workflow_id: 'string',
        sandbox_spec: 'object',
      },
    },
    {
      step: 3,
      name: 'Execute Automation Run',
      purpose: 'Run the coding agent with the automation instructions in a sandboxed environment',
      acheevy_behavior: `
        - Spin up sandbox container with repo access
        - Connect configured MCP servers
        - Execute coding agent with automation instructions
        - Capture all outputs: PRs created, messages posted, issues modified
        - Log execution to audit ledger
      `,
      output_schema: {
        run_id: 'string',
        status: 'string',
        prs_created: 'string[]',
        messages_posted: 'string[]',
        duration_seconds: 'number',
        luc_cost: 'number',
      },
    },
    {
      step: 4,
      name: 'Report & Learn',
      purpose: 'Deliver results and update automation metrics',
      acheevy_behavior: `
        - Compile run summary with evidence
        - Update automation run history
        - Notify user via configured channels (Slack, dashboard)
        - Log to ACHEEVY audit ledger for RAG learning
        - Adjust next run if needed (backoff on failures)
      `,
      output_schema: {
        summary: 'string',
        evidence: 'object',
        next_run: 'string',
      },
    },
  ],

  final_synthesis: {
    template: 'Automation {{action}} complete. {{summary}}',
    output_format: 'structured_receipt',
  },
};
