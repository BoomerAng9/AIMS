/**
 * Router_Ang — Smart Routing A2A Agent
 *
 * Standalone microservice that discovers available agents via A2A protocol,
 * classifies user intent, and delegates tasks to the best-matched specialist.
 *
 * Endpoints:
 *   GET  /health                 — Healthcheck with routing stats
 *   GET  /.well-known/agent.json — A2A Agent Card
 *   POST /a2a/tasks/send         — Accept task → classify → delegate
 *   GET  /a2a/tasks/:id          — Get task status (proxied from delegate)
 *   GET  /a2a/agents             — List discovered agents
 *   POST /a2a/agents/register    — Manual agent registration
 *   POST /a2a/agents/refresh     — Force discovery refresh
 *   GET  /routing/stats          — Routing statistics
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { agentCard } from './agent-card';
import { discoveryClient } from './discovery-client';
import { routeTask, getRoutingStats } from './routing-engine';
import { logger } from './logger';

const PORT = parseInt(process.env.PORT || '3021', 10);
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/health', (_req, res) => {
  const stats = getRoutingStats();
  res.json({
    status: 'healthy',
    agent: 'router-ang',
    version: '1.0.0',
    uptime: process.uptime(),
    routing: stats,
  });
});

// ---------------------------------------------------------------------------
// A2A: Agent Card Discovery
// ---------------------------------------------------------------------------

app.get('/.well-known/agent.json', (_req, res) => {
  res.json(agentCard);
});

// ---------------------------------------------------------------------------
// A2A: Task Submission → Route → Delegate
// ---------------------------------------------------------------------------

app.post('/a2a/tasks/send', async (req, res) => {
  try {
    const { message, requestedBy, metadata } = req.body;

    if (!message?.parts || message.parts.length === 0) {
      res.status(400).json({ error: 'Missing message.parts' });
      return;
    }

    // Extract query text from parts
    const textParts = message.parts
      .filter((p: { type: string }) => p.type === 'text')
      .map((p: { text: string }) => p.text);
    const query = textParts.join('\n');

    // Extract data context
    const context = message.parts
      .filter((p: { type: string }) => p.type === 'data')
      .reduce((acc: Record<string, unknown>, p: { data: Record<string, unknown> }) => ({ ...acc, ...p.data }), {});

    logger.info({ query: query.slice(0, 100), requestedBy }, '[Router_Ang] Task received');

    const result = await routeTask(query, context, requestedBy || 'unknown');

    const statusCode = result.status === 'failed' ? 500 : 201;
    res.status(statusCode).json({
      task: {
        id: result.taskId,
        agentId: result.delegatedTo,
        status: result.status === 'delegated' || result.status === 'fallback' ? 'submitted' : result.status,
        intent: result.intent,
        delegatedTo: result.delegatedTo,
        routingLog: result.routingLog,
      },
      result: result.result,
      error: result.error,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Routing failed';
    logger.error({ err }, '[Router_Ang] Task routing error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// A2A: Discovered Agents
// ---------------------------------------------------------------------------

app.get('/a2a/agents', (req, res) => {
  const capability = req.query.capability as string | undefined;

  if (capability) {
    const matches = discoveryClient.findByCapability(capability);
    res.json({ agents: matches, count: matches.length, filter: { capability } });
  } else {
    const agents = discoveryClient.getAll();
    res.json({ agents, count: agents.length });
  }
});

// ---------------------------------------------------------------------------
// Manual Agent Registration
// ---------------------------------------------------------------------------

app.post('/a2a/agents/register', (req, res) => {
  const { id, name, description, url, capabilities, hosting } = req.body;

  if (!id || !url) {
    res.status(400).json({ error: 'Missing required fields: id, url' });
    return;
  }

  discoveryClient.register({
    id,
    name: name || id,
    description: description || '',
    url,
    capabilities: capabilities || [],
    hosting: hosting || 'container',
    status: 'online',
    lastHealthCheck: new Date().toISOString(),
  });

  res.json({ registered: true, agentId: id });
});

// ---------------------------------------------------------------------------
// Force Discovery Refresh
// ---------------------------------------------------------------------------

app.post('/a2a/agents/refresh', async (_req, res) => {
  await discoveryClient.refreshFromGateway();
  const agents = discoveryClient.getAll();
  res.json({ refreshed: true, agentCount: agents.length });
});

// ---------------------------------------------------------------------------
// Routing Statistics
// ---------------------------------------------------------------------------

app.get('/routing/stats', (_req, res) => {
  res.json(getRoutingStats());
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  // Initialize discovery before accepting traffic
  await discoveryClient.initialize();

  app.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT }, '[Router_Ang] Agent online — smart routing active');
  });
}

start().catch(err => {
  logger.error({ err }, '[Router_Ang] Failed to start');
  process.exit(1);
});
