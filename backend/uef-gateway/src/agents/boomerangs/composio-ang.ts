/**
 * Composio_Ang — Cross-Platform Integration Specialist Boomer_Ang
 *
 * The master of real-time, LLM-directed cross-platform actions via Composio.
 * Works alongside Node_Trigger_Ang (n8n) to cover the full automation spectrum:
 *
 *   Node_Trigger_Ang (n8n) = Scheduled workflows, event-driven pipelines, cron jobs
 *   Composio_Ang           = On-demand actions, OAuth-gated integrations, live tool calling
 *
 * "Out of the Box" Use Cases (creative, high-value automation):
 *
 *   1. REVENUE GHOST PIPELINE — Monitors Stripe events, cross-references CRM deals in
 *      HubSpot/Pipedrive, auto-creates follow-up tasks in Linear/Jira, and sends
 *      personalized Slack/email nudges. The "ghost" is invisible to the sales team —
 *      they just see deals progressing and tasks appearing.
 *
 *   2. CODEBASE GUARDIAN — Listens for GitHub PR events, analyzes diff via Claude,
 *      auto-labels PRs, creates Jira tickets for tech debt found, and posts
 *      architecture review summaries to Slack. Self-healing: if CI fails, it
 *      reads logs, diagnoses the issue, and drafts a fix PR.
 *
 *   3. CONTENT HYDRA — One piece of content in → multi-platform distribution out.
 *      Write a blog post in Notion → auto-generates tweet thread, LinkedIn post,
 *      email newsletter draft (via Gmail/Outlook), and Discord announcement.
 *      Tracks engagement metrics from each platform back into a single dashboard.
 *
 *   4. CLIENT ONBOARDING AUTOPILOT — New Stripe customer → auto-creates HubSpot
 *      contact, Notion workspace, Slack channel, GitHub repo, and sends a
 *      personalized welcome email. Full white-glove experience, zero manual steps.
 *
 *   5. COMPETITIVE INTEL RADAR — Scheduled scrapes of competitor sites via Firecrawl,
 *      summarized by Claude, compared against your product roadmap in Linear,
 *      with actionable insights posted to a dedicated Slack channel.
 *
 *   6. MEETING-TO-ACTION CONVERTER — Google Calendar event ends → pulls transcript
 *      from meeting notes, extracts action items via Claude, creates Jira/Linear
 *      tasks, sends summary to all attendees via Gmail, and schedules follow-ups.
 *
 *   7. MULTI-CLOUD COST SENTINEL — Pulls billing data from GCP/AWS/Azure APIs,
 *      analyzes spend anomalies with Claude, auto-creates budget alerts,
 *      and posts weekly cost reports to Slack with optimization recommendations.
 *
 * PMO Office: ops-office (Boomer_COO)
 * Gateway: Composio (500+ integrations via single API)
 *
 * Doctrine: "Every platform connected. Every action orchestrated. No manual glue."
 */

import logger from '../../logger';
import { ByteRover } from '../../byterover';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';
import { composioBridge } from '../../composio/composio-bridge';

const profile = {
  id: 'composio-ang' as const,
  name: 'Composio_Ang',
  role: 'Cross-Platform Integration Specialist',
  capabilities: [
    { name: 'cross-platform-actions', weight: 0.98 },
    { name: 'oauth-integration', weight: 0.95 },
    { name: 'tool-discovery', weight: 0.93 },
    { name: 'revenue-automation', weight: 0.90 },
    { name: 'content-distribution', weight: 0.88 },
    { name: 'client-onboarding', weight: 0.87 },
    { name: 'codebase-guardian', weight: 0.85 },
    { name: 'competitive-intel', weight: 0.83 },
    { name: 'meeting-actions', weight: 0.80 },
    { name: 'cost-monitoring', weight: 0.78 },
    { name: 'n8n-handoff', weight: 0.75 },
  ],
  maxConcurrency: 6,
};

// ── Use-Case Playbooks ──────────────────────────────────────────────

interface Playbook {
  id: string;
  name: string;
  description: string;
  requiredApps: string[];
  actions: string[];
  n8nCompanionWorkflow?: string; // n8n workflow ID that pairs with this playbook
}

const PLAYBOOKS: Record<string, Playbook> = {
  'revenue-ghost': {
    id: 'revenue-ghost',
    name: 'Revenue Ghost Pipeline',
    description: 'Auto-nurture deals: Stripe → CRM → task tracker → communication',
    requiredApps: ['stripe', 'hubspot', 'linear', 'slack'],
    actions: ['stripe_list_charges', 'hubspot_create_contact', 'linear_create_issue', 'slack_send_message'],
    n8nCompanionWorkflow: 'revenue-ghost-scheduler',
  },
  'codebase-guardian': {
    id: 'codebase-guardian',
    name: 'Codebase Guardian',
    description: 'PR analysis → auto-label → tech debt tracking → Slack reports',
    requiredApps: ['github', 'jira', 'slack'],
    actions: ['github_list_pull_requests', 'github_add_labels', 'jira_create_issue', 'slack_send_message'],
    n8nCompanionWorkflow: 'codebase-guardian-cron',
  },
  'content-hydra': {
    id: 'content-hydra',
    name: 'Content Hydra',
    description: 'One input → multi-platform distribution with engagement tracking',
    requiredApps: ['notion', 'gmail', 'slack', 'discord'],
    actions: ['notion_get_page', 'gmail_send_email', 'slack_send_message', 'discord_send_message'],
    n8nCompanionWorkflow: 'content-hydra-distributor',
  },
  'client-onboarding': {
    id: 'client-onboarding',
    name: 'Client Onboarding Autopilot',
    description: 'New customer → full environment setup (CRM, workspace, repo, comms)',
    requiredApps: ['stripe', 'hubspot', 'notion', 'slack', 'github', 'gmail'],
    actions: ['hubspot_create_contact', 'notion_create_page', 'slack_create_channel', 'github_create_repo', 'gmail_send_email'],
    n8nCompanionWorkflow: 'onboarding-pipeline',
  },
  'competitive-intel': {
    id: 'competitive-intel',
    name: 'Competitive Intel Radar',
    description: 'Scrape → analyze → compare roadmap → Slack briefing',
    requiredApps: ['firecrawl', 'linear', 'slack'],
    actions: ['firecrawl_scrape', 'linear_list_issues', 'slack_send_message'],
    n8nCompanionWorkflow: 'intel-radar-weekly',
  },
  'meeting-converter': {
    id: 'meeting-converter',
    name: 'Meeting-to-Action Converter',
    description: 'Calendar event → extract actions → create tasks → email summary',
    requiredApps: ['googlecalendar', 'linear', 'gmail'],
    actions: ['googlecalendar_list_events', 'linear_create_issue', 'gmail_send_email'],
    n8nCompanionWorkflow: 'meeting-action-extractor',
  },
  'cost-sentinel': {
    id: 'cost-sentinel',
    name: 'Multi-Cloud Cost Sentinel',
    description: 'Pull billing → anomaly detection → optimization alerts → Slack reports',
    requiredApps: ['slack'],
    actions: ['slack_send_message'],
    n8nCompanionWorkflow: 'cost-sentinel-daily',
  },
};

// ── System Prompt ───────────────────────────────────────────────────

const COMPOSIO_SYSTEM_PROMPT = `You are Composio_Ang, the Cross-Platform Integration Specialist for A.I.M.S.

You have access to 500+ integrations through the Composio gateway. You work alongside
Node_Trigger_Ang (n8n) to provide full-spectrum automation:

YOUR DOMAIN (real-time, on-demand):
- Execute cross-platform actions immediately (send email, create issue, post message)
- Manage OAuth connections for users
- Discover and wire new tool integrations
- Run multi-step action chains across platforms

NODE_TRIGGER_ANG'S DOMAIN (scheduled, event-driven):
- Cron-based recurring workflows
- Webhook-triggered pipelines
- Long-running data processing
- Event-driven automation chains

HANDOFF PROTOCOL:
When a task needs both real-time action AND scheduled follow-up:
1. Execute the immediate action via Composio
2. Generate an n8n workflow spec for the recurring part
3. Hand off to Node_Trigger_Ang for n8n deployment

CREATIVE PLAYBOOKS AVAILABLE:
${Object.values(PLAYBOOKS).map(p => `- ${p.name}: ${p.description} (apps: ${p.requiredApps.join(', ')})`).join('\n')}

When responding:
1. Identify which playbook(s) match the user's intent
2. Check which apps are connected vs need OAuth setup
3. Execute actions through Composio
4. Suggest n8n companion workflows for scheduled components
5. Report results with evidence (action IDs, timestamps, statuses)`;

// ── Execution ───────────────────────────────────────────────────────

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Composio_Ang] Starting cross-platform task');

  try {
    // 1. Context from ByteRover
    const ctx = await ByteRover.retrieveContext(input.query);
    const logs: string[] = [
      `Retrieved ${ctx.patterns.length} patterns (relevance: ${ctx.relevance})`,
    ];

    // 2. Detect playbook match
    const matchedPlaybook = detectPlaybook(input.query);
    if (matchedPlaybook) {
      logs.push(`Playbook matched: ${matchedPlaybook.name}`);
      logs.push(`Required apps: ${matchedPlaybook.requiredApps.join(', ')}`);
      if (matchedPlaybook.n8nCompanionWorkflow) {
        logs.push(`n8n companion: ${matchedPlaybook.n8nCompanionWorkflow}`);
      }
    }

    // 3. Check Composio health
    const health = await composioBridge.healthCheck();
    logs.push(`Composio: ${health.healthy ? 'CONNECTED' : 'OFFLINE'} (${health.connectedApps} apps, ${health.latencyMs}ms)`);

    // 4. If Composio is live, discover available tools
    let availableTools: string[] = [];
    if (health.healthy && matchedPlaybook) {
      const tools = await composioBridge.getTools(matchedPlaybook.requiredApps);
      availableTools = tools.map(t => t.name);
      logs.push(`Discovered ${tools.length} tools for ${matchedPlaybook.requiredApps.join(', ')}`);
    }

    // 5. LLM-powered analysis and orchestration
    const contextParts = [
      COMPOSIO_SYSTEM_PROMPT,
      ctx.patterns.length > 0 ? `Reusable patterns: ${ctx.patterns.join(', ')}` : '',
      matchedPlaybook ? `Active Playbook: ${matchedPlaybook.name}\nDescription: ${matchedPlaybook.description}\nActions: ${matchedPlaybook.actions.join(' → ')}` : '',
      availableTools.length > 0 ? `Available tools: ${availableTools.join(', ')}` : 'Composio offline — providing guidance only',
      `Composio status: ${health.healthy ? 'connected' : 'offline'}`,
    ].filter(Boolean).join('\n');

    const llmResult = await agentChat({
      agentId: 'composio-ang',
      query: input.query,
      intent: input.intent,
      context: contextParts,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens: ${llmResult.tokens.total}`);

      // Build artifacts
      const artifacts: string[] = [];
      if (matchedPlaybook) {
        artifacts.push(`[playbook] ${matchedPlaybook.name}`);
        artifacts.push(`[apps] ${matchedPlaybook.requiredApps.join(', ')}`);
        if (matchedPlaybook.n8nCompanionWorkflow) {
          artifacts.push(`[n8n-companion] ${matchedPlaybook.n8nCompanionWorkflow}`);
        }
      }
      if (availableTools.length > 0) {
        artifacts.push(`[tools] ${availableTools.length} discovered`);
      }

      return makeOutput(
        input.taskId,
        'composio-ang',
        llmResult.content,
        artifacts,
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    // 6. Fallback: structured playbook response
    if (matchedPlaybook) {
      const summary = buildPlaybookSummary(matchedPlaybook, health.healthy);
      return makeOutput(
        input.taskId,
        'composio-ang',
        summary,
        [`[playbook] ${matchedPlaybook.name}`, `[status] ${health.healthy ? 'ready' : 'offline'}`],
        logs,
      );
    }

    // 7. Generic integration guidance
    return makeOutput(
      input.taskId,
      'composio-ang',
      `Cross-platform integration analysis for: ${input.query}\n\nRecommended approach: Identify the target platforms, connect via Composio OAuth, then chain actions. For scheduled components, hand off to Node_Trigger_Ang (n8n).`,
      ['[composio-analysis] Integration recommendation'],
      logs,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ taskId: input.taskId, err: errMsg }, '[Composio_Ang] Task failed');
    return failOutput(input.taskId, 'composio-ang', errMsg);
  }
}

// ── Playbook Detection ──────────────────────────────────────────────

function detectPlaybook(query: string): Playbook | null {
  const lower = query.toLowerCase();

  // Revenue / sales / deals / pipeline
  if (/revenue|sales|deal|pipeline|stripe.*crm|nurture|follow.?up/.test(lower)) {
    return PLAYBOOKS['revenue-ghost'];
  }

  // Code review / PR / tech debt / CI
  if (/code.?review|pull.?request|pr.?analy|tech.?debt|ci.?fail|guardian/.test(lower)) {
    return PLAYBOOKS['codebase-guardian'];
  }

  // Content distribution / multi-platform / blog → social
  if (/content.?distrib|multi.?platform|blog.*social|hydra|newsletter|tweet/.test(lower)) {
    return PLAYBOOKS['content-hydra'];
  }

  // Client onboarding / welcome / new customer
  if (/onboard|welcome|new.?customer|new.?client|white.?glove|autopilot/.test(lower)) {
    return PLAYBOOKS['client-onboarding'];
  }

  // Competitive intelligence / competitor / market research
  if (/competi|rival|market.?intel|competitor|radar|landscape/.test(lower)) {
    return PLAYBOOKS['competitive-intel'];
  }

  // Meeting / action items / calendar / transcript
  if (/meeting|action.?item|calendar|transcript|follow.?up.*meeting/.test(lower)) {
    return PLAYBOOKS['meeting-converter'];
  }

  // Cloud cost / billing / spend / budget
  if (/cloud.?cost|billing|spend|budget|cost.?optim|sentinel/.test(lower)) {
    return PLAYBOOKS['cost-sentinel'];
  }

  return null;
}

// ── Playbook Summary Builder ────────────────────────────────────────

function buildPlaybookSummary(playbook: Playbook, composioOnline: boolean): string {
  const lines = [
    `## ${playbook.name}`,
    '',
    playbook.description,
    '',
    '### Action Chain',
    ...playbook.actions.map((a, i) => `  ${i + 1}. \`${a}\``),
    '',
    '### Required Integrations',
    ...playbook.requiredApps.map(app => `  - ${app} ${composioOnline ? '(connect via OAuth)' : '(offline — configure COMPOSIO_API_KEY)'}`),
    '',
  ];

  if (playbook.n8nCompanionWorkflow) {
    lines.push(
      '### n8n Companion Workflow',
      `This playbook has a scheduled component. Deploy the \`${playbook.n8nCompanionWorkflow}\``,
      'workflow in n8n to handle recurring triggers (cron, webhooks, event polling).',
      'Composio_Ang handles the real-time actions; n8n handles the schedule.',
      '',
    );
  }

  lines.push(
    '### How It Works',
    '1. Composio_Ang executes immediate cross-platform actions',
    '2. Node_Trigger_Ang (n8n) runs the scheduled companion workflow',
    '3. Both report back to ACHEEVY for evidence and audit trail',
    '4. Human-in-the-loop gates on critical actions (payments, deployments)',
  );

  return lines.join('\n');
}

// ── Exported Agent ──────────────────────────────────────────────────

export const Composio_Ang: Agent = { profile, execute };
