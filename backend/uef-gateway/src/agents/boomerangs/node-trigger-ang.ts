/**
 * Node_Trigger_Ang — n8n Workflow Specialist Boomer_Ang
 *
 * The master of n8n workflows, triggers, and automation pipelines.
 * Handles: workflow creation, webhook configuration, trigger management,
 * node wiring, credential setup, and workflow debugging.
 *
 * PMO Office: ops-office (Boomer_COO)
 * Specialties: n8n workflow design, webhook triggers, node configuration,
 *              workflow debugging, API integration, cron scheduling
 *
 * Doctrine: "Every trigger fires precisely — no misfires, no orphaned nodes."
 */

import logger from '../../logger';
import { ByteRover } from '../../byterover';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'node-trigger-ang' as const,
  name: 'Node_Trigger_Ang',
  role: 'n8n Workflow Architect',
  capabilities: [
    { name: 'n8n-workflow-design', weight: 0.98 },
    { name: 'webhook-triggers', weight: 0.95 },
    { name: 'node-configuration', weight: 0.93 },
    { name: 'cron-scheduling', weight: 0.90 },
    { name: 'api-integration', weight: 0.88 },
    { name: 'workflow-debugging', weight: 0.85 },
    { name: 'credential-management', weight: 0.80 },
    { name: 'json-transformation', weight: 0.82 },
  ],
  maxConcurrency: 4,
};

// ── n8n-specific system prompt ──────────────────────────────────

const N8N_SYSTEM_PROMPT = `You are Node_Trigger_Ang, the n8n Workflow Architect for A.I.M.S.

Your expertise:
- Designing n8n workflows from user requirements
- Configuring webhook triggers (POST/GET, authentication, headers)
- Wiring nodes together (HTTP Request, Function, IF, Switch, Code, Set)
- Setting up cron/interval triggers for scheduled automations
- Debugging workflow execution errors
- Managing credentials (API keys, OAuth tokens, database connections)
- JSON data transformation between nodes
- Error handling with Error Trigger and retry logic

When creating workflows, always:
1. Start with a clear trigger node (Webhook, Cron, or Manual)
2. Add error handling paths
3. Include logging/audit nodes
4. Use Set nodes for data shaping between steps
5. End with a response or notification node

Output valid n8n workflow JSON when asked to create workflows.
Use the standard n8n node types (n8n-nodes-base.*).`;

// ── n8n Workflow Templates ──────────────────────────────────────

const WORKFLOW_TEMPLATES: Record<string, { description: string; nodes: string[] }> = {
  'webhook-to-action': {
    description: 'Receive webhook, process data, execute action',
    nodes: ['Webhook Trigger', 'Set (Data Shape)', 'HTTP Request', 'Respond to Webhook'],
  },
  'scheduled-report': {
    description: 'Cron trigger, gather data, format report, send notification',
    nodes: ['Cron Trigger', 'HTTP Request (Gather)', 'Code (Format)', 'Email/Slack Send'],
  },
  'data-pipeline': {
    description: 'Ingest data, transform, validate, store',
    nodes: ['Webhook/Cron Trigger', 'HTTP Request (Source)', 'Code (Transform)', 'IF (Validate)', 'HTTP Request (Store)'],
  },
  'multi-step-approval': {
    description: 'Request arrives, needs human approval before execution',
    nodes: ['Webhook Trigger', 'Set (Context)', 'Wait (Approval)', 'IF (Approved)', 'HTTP Request (Execute)'],
  },
  'error-recovery': {
    description: 'Monitor for errors, retry with backoff, alert on failure',
    nodes: ['Error Trigger', 'Code (Classify)', 'Wait (Backoff)', 'HTTP Request (Retry)', 'Slack/Email (Alert)'],
  },
};

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Node_Trigger_Ang] Starting n8n workflow task');

  try {
    // 1. Retrieve reusable workflow patterns
    const ctx = await ByteRover.retrieveContext(input.query);
    const logs: string[] = [
      `Retrieved ${ctx.patterns.length} patterns (relevance: ${ctx.relevance})`,
    ];

    // 2. Detect workflow template match
    const templateMatch = detectTemplate(input.query);
    if (templateMatch) {
      logs.push(`Template match: ${templateMatch.description}`);
    }

    // 3. LLM-powered workflow analysis/generation
    const contextParts = [
      N8N_SYSTEM_PROMPT,
      ctx.patterns.length > 0 ? `Reusable patterns: ${ctx.patterns.join(', ')}` : '',
      templateMatch ? `Suggested template: ${templateMatch.description} → Nodes: ${templateMatch.nodes.join(' → ')}` : '',
      `Available n8n workflow templates: ${Object.entries(WORKFLOW_TEMPLATES).map(([k, v]) => `${k}: ${v.description}`).join('; ')}`,
    ].filter(Boolean).join('\n');

    const llmResult = await agentChat({
      agentId: 'node-trigger-ang',
      query: input.query,
      intent: input.intent,
      context: contextParts,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens used: ${llmResult.tokens.total}`);

      return makeOutput(
        input.taskId,
        'node-trigger-ang',
        llmResult.content,
        [
          `[n8n-workflow] ${templateMatch?.description || 'Custom workflow design'}`,
          ...(templateMatch ? [`[template] ${templateMatch.nodes.join(' → ')}`] : []),
        ],
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    // Fallback: template-based response
    if (templateMatch) {
      const summary = [
        `n8n Workflow Design: ${templateMatch.description}`,
        '',
        'Recommended Node Pipeline:',
        ...templateMatch.nodes.map((n, i) => `  ${i + 1}. ${n}`),
        '',
        'Implementation notes:',
        '- Configure webhook authentication (API key or HMAC)',
        '- Add error handling branch with Error Trigger node',
        '- Set appropriate timeout values for HTTP Request nodes',
        '- Use Set nodes between steps for data shape consistency',
      ].join('\n');

      return makeOutput(
        input.taskId,
        'node-trigger-ang',
        summary,
        [`[n8n-template] ${templateMatch.description}`],
        logs,
      );
    }

    return makeOutput(
      input.taskId,
      'node-trigger-ang',
      `n8n workflow analysis for: ${input.query}\n\nRecommended approach: Start with a Webhook Trigger node, add data transformation with Code/Set nodes, and end with the appropriate action node. Use Error Trigger for error handling.`,
      ['[n8n-analysis] Workflow architecture recommendation'],
      logs,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ taskId: input.taskId, err: errMsg }, '[Node_Trigger_Ang] Task failed');
    return failOutput(input.taskId, 'node-trigger-ang', errMsg);
  }
}

function detectTemplate(query: string): { description: string; nodes: string[] } | null {
  const lower = query.toLowerCase();

  if (lower.includes('webhook') && (lower.includes('action') || lower.includes('trigger'))) {
    return WORKFLOW_TEMPLATES['webhook-to-action'];
  }
  if (lower.includes('schedule') || lower.includes('report') || lower.includes('cron')) {
    return WORKFLOW_TEMPLATES['scheduled-report'];
  }
  if (lower.includes('pipeline') || lower.includes('etl') || lower.includes('transform')) {
    return WORKFLOW_TEMPLATES['data-pipeline'];
  }
  if (lower.includes('approval') || lower.includes('review') || lower.includes('gate')) {
    return WORKFLOW_TEMPLATES['multi-step-approval'];
  }
  if (lower.includes('error') || lower.includes('retry') || lower.includes('recovery')) {
    return WORKFLOW_TEMPLATES['error-recovery'];
  }

  return null;
}

export const Node_Trigger_Ang: Agent = { profile, execute };
