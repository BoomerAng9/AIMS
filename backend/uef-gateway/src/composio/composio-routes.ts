/**
 * Composio Routes — UEF Gateway endpoints for Composio integration
 *
 * Mounted at /composio/* in the gateway Express app.
 * Provides health, tool discovery, action execution, connection management,
 * and playbook orchestration.
 */

import { Router, Request, Response } from 'express';
import logger from '../logger';
import { composioBridge } from './composio-bridge';
import { registry } from '../agents/registry';
import { v4 as uuidv4 } from 'uuid';

export const composioRouter = Router();

// ── Health Check ────────────────────────────────────────────────────

composioRouter.get('/health', async (_req: Request, res: Response) => {
  const health = await composioBridge.healthCheck();
  res.status(health.healthy ? 200 : 503).json({
    service: 'composio-bridge',
    ...health,
  });
});

// ── Tool Discovery ──────────────────────────────────────────────────

composioRouter.get('/tools', async (req: Request, res: Response) => {
  const apps = (req.query.apps as string)?.split(',').filter(Boolean) || [];
  if (apps.length === 0) {
    return res.status(400).json({ error: 'Provide ?apps=github,slack,...' });
  }

  const tools = await composioBridge.getTools(apps);
  res.json({ tools, count: tools.length, apps });
});

// ── Connected Accounts ──────────────────────────────────────────────

composioRouter.get('/connections', async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const connections = await composioBridge.getConnections(userId);
  res.json({ connections, count: connections.length });
});

// ── Execute Action ──────────────────────────────────────────────────

composioRouter.post('/execute', async (req: Request, res: Response) => {
  const { actionName, params, connectedAccountId, userId } = req.body;

  if (!actionName) {
    return res.status(400).json({ error: 'Missing actionName' });
  }

  logger.info({ actionName, userId }, '[Composio Routes] Executing action');

  const result = await composioBridge.executeAction(actionName, params || {}, connectedAccountId);

  if (!result.success) {
    return res.status(502).json({ error: result.error, executionTimeMs: result.executionTimeMs });
  }

  res.json({
    success: true,
    data: result.data,
    executionTimeMs: result.executionTimeMs,
    // n8n-compatible format for webhook chaining
    n8nPayload: composioBridge.formatForN8n(actionName, result),
  });
});

// ── Initiate OAuth Connection ───────────────────────────────────────

composioRouter.post('/connect', async (req: Request, res: Response) => {
  const { appName, userId, redirectUrl } = req.body;

  if (!appName || !userId) {
    return res.status(400).json({ error: 'Missing appName or userId' });
  }

  const connection = await composioBridge.initiateConnection(appName, userId, redirectUrl);
  if (!connection) {
    return res.status(502).json({ error: 'Failed to initiate OAuth connection' });
  }

  res.json(connection);
});

// ── Playbooks Catalog ───────────────────────────────────────────────

composioRouter.get('/playbooks', async (_req: Request, res: Response) => {
  // Import playbooks from Composio_Ang
  // These are the creative "out of the box" use cases
  res.json({
    playbooks: [
      {
        id: 'revenue-ghost',
        name: 'Revenue Ghost Pipeline',
        description: 'Auto-nurture deals: Stripe → CRM → task tracker → communication',
        requiredApps: ['stripe', 'hubspot', 'linear', 'slack'],
        category: 'revenue',
      },
      {
        id: 'codebase-guardian',
        name: 'Codebase Guardian',
        description: 'PR analysis → auto-label → tech debt tracking → Slack reports',
        requiredApps: ['github', 'jira', 'slack'],
        category: 'engineering',
      },
      {
        id: 'content-hydra',
        name: 'Content Hydra',
        description: 'One input → multi-platform distribution with engagement tracking',
        requiredApps: ['notion', 'gmail', 'slack', 'discord'],
        category: 'marketing',
      },
      {
        id: 'client-onboarding',
        name: 'Client Onboarding Autopilot',
        description: 'New customer → full environment setup (CRM, workspace, repo, comms)',
        requiredApps: ['stripe', 'hubspot', 'notion', 'slack', 'github', 'gmail'],
        category: 'operations',
      },
      {
        id: 'competitive-intel',
        name: 'Competitive Intel Radar',
        description: 'Scrape → analyze → compare roadmap → Slack briefing',
        requiredApps: ['firecrawl', 'linear', 'slack'],
        category: 'strategy',
      },
      {
        id: 'meeting-converter',
        name: 'Meeting-to-Action Converter',
        description: 'Calendar event → extract actions → create tasks → email summary',
        requiredApps: ['googlecalendar', 'linear', 'gmail'],
        category: 'productivity',
      },
      {
        id: 'cost-sentinel',
        name: 'Multi-Cloud Cost Sentinel',
        description: 'Pull billing → anomaly detection → optimization alerts → Slack reports',
        requiredApps: ['slack'],
        category: 'infrastructure',
      },
    ],
  });
});

// ── Run Playbook ────────────────────────────────────────────────────

composioRouter.post('/playbook', async (req: Request, res: Response) => {
  const { playbookId, params, userId } = req.body;

  if (!playbookId) {
    return res.status(400).json({ error: 'Missing playbookId' });
  }

  logger.info({ playbookId, userId }, '[Composio Routes] Running playbook');

  // Dispatch to Composio_Ang via the agent registry
  const agent = registry.get('composio-ang');
  if (!agent) {
    return res.status(503).json({ error: 'Composio_Ang not available' });
  }

  const taskId = `playbook-${playbookId}-${uuidv4().slice(0, 8)}`;
  const output = await agent.execute({
    taskId,
    intent: 'AGENTIC_WORKFLOW',
    query: `Run the ${playbookId} playbook with params: ${JSON.stringify(params || {})}`,
    context: { playbookId, params, userId },
  });

  res.json({
    taskId,
    playbookId,
    status: output.status,
    result: output.result,
    cost: output.cost,
  });
});
