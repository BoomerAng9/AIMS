/**
 * Companion Workflows — Scheduled counterparts to Composio playbooks
 *
 * Each Composio playbook has a real-time component (executed on demand)
 * and an optional scheduled component (cron/webhook-driven pipeline).
 *
 * This file generates workflow JSON templates for each companion workflow.
 *
 * Architecture:
 *   Composio_Ang  → real-time actions (send email, create issue, post message)
 *   Companion     → scheduled triggers (poll for events, cron reports, webhook listeners)
 *   Both → report to ACHEEVY via UEF Gateway for audit trail
 */

interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
}

interface CompanionWorkflow {
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }>;
  active: boolean;
  settings: { executionOrder: string };
}

function buildConnections(nodes: WorkflowNode[]): CompanionWorkflow['connections'] {
  const connections: CompanionWorkflow['connections'] = {};
  for (let i = 0; i < nodes.length - 1; i++) {
    connections[nodes[i].name] = {
      main: [[{ node: nodes[i + 1].name, type: 'main', index: 0 }]],
    };
  }
  return connections;
}

// ── Revenue Ghost Scheduler ─────────────────────────────────────────
// Polls Stripe for new charges every 15 minutes, then triggers Composio
// to update CRM and create follow-up tasks.

function revenueGhostScheduler(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'cron',
      name: 'Every 15 Minutes',
      type: 'n8n-nodes-base.cron',
      position: [0, 300],
      parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } },
    },
    {
      id: 'fetch-charges',
      name: 'Fetch Recent Charges',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'stripe_list_charges', params: { limit: 10 } }),
        headers: { 'Content-Type': 'application/json' },
      },
    },
    {
      id: 'filter-new',
      name: 'Filter New Charges',
      type: 'n8n-nodes-base.filter',
      position: [500, 300],
      parameters: {
        conditions: {
          string: [{ value1: '={{ $json.status }}', value2: 'succeeded', operation: 'equals' }],
        },
      },
    },
    {
      id: 'update-crm',
      name: 'Update CRM via Composio',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'hubspot_create_contact', params: {} }),
      },
    },
    {
      id: 'notify',
      name: 'Slack Notification',
      type: 'n8n-nodes-base.httpRequest',
      position: [1000, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'slack_send_message', params: { channel: '#revenue' } }),
      },
    },
  ];

  return {
    name: '[AIMS] Revenue Ghost Scheduler',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Codebase Guardian Cron ──────────────────────────────────────────
// Runs every hour, checks for new PRs, triggers Composio_Ang for analysis.

function codebaseGuardianCron(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'cron',
      name: 'Every Hour',
      type: 'n8n-nodes-base.cron',
      position: [0, 300],
      parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } },
    },
    {
      id: 'fetch-prs',
      name: 'Fetch Open PRs',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'github_list_pull_requests', params: { state: 'open' } }),
      },
    },
    {
      id: 'analyze',
      name: 'Analyze via ACHEEVY',
      type: 'n8n-nodes-base.httpRequest',
      position: [500, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/api/acheevy/classify',
        method: 'POST',
        body: '={{ JSON.stringify({ message: "Analyze PR: " + $json.title, context: "codebase-guardian" }) }}',
      },
    },
    {
      id: 'create-issues',
      name: 'Create Tech Debt Issues',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'jira_create_issue', params: {} }),
      },
    },
    {
      id: 'slack-report',
      name: 'Post Slack Report',
      type: 'n8n-nodes-base.httpRequest',
      position: [1000, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'slack_send_message', params: { channel: '#engineering' } }),
      },
    },
  ];

  return {
    name: '[AIMS] Codebase Guardian Cron',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Content Hydra Distributor ───────────────────────────────────────
// Webhook listener: when content is published in Notion, distribute everywhere.

function contentHydraDistributor(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'webhook',
      name: 'Content Published Webhook',
      type: 'n8n-nodes-base.webhook',
      position: [0, 300],
      parameters: { path: 'content-hydra', httpMethod: 'POST' },
    },
    {
      id: 'fetch-content',
      name: 'Fetch from Notion',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'notion_get_page', params: {} }),
      },
    },
    {
      id: 'generate-variants',
      name: 'Generate Platform Variants',
      type: 'n8n-nodes-base.httpRequest',
      position: [500, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/api/acheevy/chat',
        method: 'POST',
        body: '={{ JSON.stringify({ message: "Rewrite this content for Twitter, LinkedIn, and email newsletter: " + $json.content }) }}',
      },
    },
    {
      id: 'distribute',
      name: 'Multi-Platform Send',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'gmail_send_email', params: {} }),
      },
    },
    {
      id: 'respond',
      name: 'Webhook Response',
      type: 'n8n-nodes-base.respondToWebhook',
      position: [1000, 300],
      parameters: { respondWith: 'json' },
    },
  ];

  return {
    name: '[AIMS] Content Hydra Distributor',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Client Onboarding Pipeline ──────────────────────────────────────
// Webhook: new Stripe customer → full provisioning chain.

function onboardingPipeline(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'webhook',
      name: 'New Customer Webhook',
      type: 'n8n-nodes-base.webhook',
      position: [0, 300],
      parameters: { path: 'onboarding-pipeline', httpMethod: 'POST' },
    },
    {
      id: 'create-crm',
      name: 'Create CRM Contact',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'hubspot_create_contact', params: {} }),
      },
    },
    {
      id: 'create-workspace',
      name: 'Create Notion Workspace',
      type: 'n8n-nodes-base.httpRequest',
      position: [500, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'notion_create_page', params: {} }),
      },
    },
    {
      id: 'create-channel',
      name: 'Create Slack Channel',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'slack_create_channel', params: {} }),
      },
    },
    {
      id: 'welcome-email',
      name: 'Send Welcome Email',
      type: 'n8n-nodes-base.httpRequest',
      position: [1000, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'gmail_send_email', params: {} }),
      },
    },
    {
      id: 'respond',
      name: 'Webhook Response',
      type: 'n8n-nodes-base.respondToWebhook',
      position: [1250, 300],
      parameters: { respondWith: 'json' },
    },
  ];

  return {
    name: '[AIMS] Client Onboarding Pipeline',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Competitive Intel Radar ─────────────────────────────────────────
// Weekly cron: scrape competitors, analyze, report.

function intelRadarWeekly(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'cron',
      name: 'Every Monday 9am',
      type: 'n8n-nodes-base.cron',
      position: [0, 300],
      parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 9 * * 1' }] } },
    },
    {
      id: 'scrape',
      name: 'Scrape Competitor Sites',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'firecrawl_scrape', params: {} }),
      },
    },
    {
      id: 'analyze',
      name: 'AI Analysis via ACHEEVY',
      type: 'n8n-nodes-base.httpRequest',
      position: [500, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/api/acheevy/chat',
        method: 'POST',
        body: '={{ JSON.stringify({ message: "Analyze competitive intel and compare to our roadmap: " + JSON.stringify($json) }) }}',
      },
    },
    {
      id: 'slack-brief',
      name: 'Post Slack Briefing',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'slack_send_message', params: { channel: '#strategy' } }),
      },
    },
  ];

  return {
    name: '[AIMS] Competitive Intel Radar (Weekly)',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Meeting Action Extractor ────────────────────────────────────────
// Runs every 30 minutes, checks for recently ended calendar events.

function meetingActionExtractor(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'cron',
      name: 'Every 30 Minutes',
      type: 'n8n-nodes-base.cron',
      position: [0, 300],
      parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 30 }] } },
    },
    {
      id: 'fetch-events',
      name: 'Fetch Recent Events',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'googlecalendar_list_events', params: {} }),
      },
    },
    {
      id: 'extract-actions',
      name: 'Extract Action Items',
      type: 'n8n-nodes-base.httpRequest',
      position: [500, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/api/acheevy/chat',
        method: 'POST',
        body: '={{ JSON.stringify({ message: "Extract action items from this meeting: " + JSON.stringify($json) }) }}',
      },
    },
    {
      id: 'create-tasks',
      name: 'Create Linear Tasks',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'linear_create_issue', params: {} }),
      },
    },
    {
      id: 'send-summary',
      name: 'Email Summary to Attendees',
      type: 'n8n-nodes-base.httpRequest',
      position: [1000, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'gmail_send_email', params: {} }),
      },
    },
  ];

  return {
    name: '[AIMS] Meeting Action Extractor',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Cost Sentinel Daily ─────────────────────────────────────────────
// Daily 8am: collect cloud billing, analyze anomalies, report.

function costSentinelDaily(): CompanionWorkflow {
  const nodes: WorkflowNode[] = [
    {
      id: 'cron',
      name: 'Every Day 8am',
      type: 'n8n-nodes-base.cron',
      position: [0, 300],
      parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * *' }] } },
    },
    {
      id: 'fetch-billing',
      name: 'Fetch Cloud Billing',
      type: 'n8n-nodes-base.httpRequest',
      position: [250, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/api/luc/billing',
        method: 'GET',
      },
    },
    {
      id: 'analyze',
      name: 'Anomaly Detection',
      type: 'n8n-nodes-base.httpRequest',
      position: [500, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/api/acheevy/chat',
        method: 'POST',
        body: '={{ JSON.stringify({ message: "Analyze cloud billing for anomalies and optimization opportunities: " + JSON.stringify($json) }) }}',
      },
    },
    {
      id: 'slack-report',
      name: 'Post Cost Report',
      type: 'n8n-nodes-base.httpRequest',
      position: [750, 300],
      parameters: {
        url: '={{ $env.UEF_GATEWAY_URL }}/composio/execute',
        method: 'POST',
        body: JSON.stringify({ actionName: 'slack_send_message', params: { channel: '#infrastructure' } }),
      },
    },
  ];

  return {
    name: '[AIMS] Cost Sentinel Daily Report',
    nodes,
    connections: buildConnections(nodes),
    active: false,
    settings: { executionOrder: 'v1' },
  };
}

// ── Export All Companion Workflows ───────────────────────────────────

export const COMPANION_WORKFLOWS: Record<string, () => CompanionWorkflow> = {
  'revenue-ghost-scheduler': revenueGhostScheduler,
  'codebase-guardian-cron': codebaseGuardianCron,
  'content-hydra-distributor': contentHydraDistributor,
  'onboarding-pipeline': onboardingPipeline,
  'intel-radar-weekly': intelRadarWeekly,
  'meeting-action-extractor': meetingActionExtractor,
  'cost-sentinel-daily': costSentinelDaily,
};
