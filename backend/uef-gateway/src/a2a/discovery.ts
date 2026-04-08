/**
 * A2A Discovery — Agent Card endpoints and capability-based routing
 *
 * Exposes the standard /.well-known/agent.json endpoint (ACHEEVY card)
 * and /a2a/agents for full registry discovery.
 */

import { Router, Request, Response } from 'express';
import { getAgentCard, getAllAgentCards, findAgentsByCapability } from './agent-cards';
import { taskManager } from './task-manager';
import type { A2ATaskSendRequest, A2ATaskEvent } from './types';
import logger from '../logger';

export const a2aRouter = Router();

// ---------------------------------------------------------------------------
// /.well-known/agent.json — Standard A2A discovery endpoint
// Returns the primary orchestrator (ACHEEVY) agent card.
// ---------------------------------------------------------------------------
a2aRouter.get('/.well-known/agent.json', (_req: Request, res: Response) => {
  const card = getAgentCard('acheevy');
  if (!card) {
    res.status(500).json({ error: 'ACHEEVY agent card not found' });
    return;
  }
  res.json(card);
});

// ---------------------------------------------------------------------------
// GET /a2a/agents — List all registered agent cards
// ---------------------------------------------------------------------------
a2aRouter.get('/a2a/agents', (req: Request, res: Response) => {
  const capability = req.query.capability as string | undefined;

  if (capability) {
    const matches = findAgentsByCapability(capability);
    res.json({ agents: matches, count: matches.length, filter: { capability } });
  } else {
    const agents = getAllAgentCards();
    res.json({ agents, count: agents.length });
  }
});

// ---------------------------------------------------------------------------
// GET /a2a/agents/:id — Get a specific agent card
// ---------------------------------------------------------------------------
a2aRouter.get('/a2a/agents/:id', (req: Request, res: Response) => {
  const card = getAgentCard(req.params.id);
  if (!card) {
    res.status(404).json({ error: `Agent "${req.params.id}" not found` });
    return;
  }
  res.json(card);
});

// ---------------------------------------------------------------------------
// POST /a2a/tasks/send — Create and dispatch a task
// ---------------------------------------------------------------------------
a2aRouter.post('/a2a/tasks/send', async (req: Request, res: Response) => {
  try {
    const body: A2ATaskSendRequest = req.body;

    if (!body.message?.parts || body.message.parts.length === 0) {
      res.status(400).json({ error: 'Missing message.parts' });
      return;
    }
    if (!body.agentId && !body.capability) {
      res.status(400).json({ error: 'Either agentId or capability must be specified' });
      return;
    }

    const task = await taskManager.send(body);
    res.status(201).json({ task });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Task send failed';
    logger.error({ err }, '[A2A] Task send error');
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /a2a/tasks/:id — Get task status and result
// ---------------------------------------------------------------------------
a2aRouter.get('/a2a/tasks/:id', (req: Request, res: Response) => {
  const task = taskManager.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ task });
});

// ---------------------------------------------------------------------------
// POST /a2a/tasks/:id/cancel — Cancel a running task
// ---------------------------------------------------------------------------
a2aRouter.post('/a2a/tasks/:id/cancel', (req: Request, res: Response) => {
  const canceled = taskManager.cancel(req.params.id);
  if (!canceled) {
    res.status(404).json({ error: 'Task not found or not cancelable' });
    return;
  }
  res.json({ canceled: true, taskId: req.params.id });
});

// ---------------------------------------------------------------------------
// GET /a2a/tasks/:id/stream — SSE stream of task events
// ---------------------------------------------------------------------------
a2aRouter.get('/a2a/tasks/:id/stream', (req: Request, res: Response) => {
  const task = taskManager.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-A2A-Task-Id': task.id,
    'X-A2A-Agent-Id': task.agentId,
  });

  // Send current state as first event
  res.write(`data: ${JSON.stringify({ type: 'status', status: task.status })}\n\n`);

  // If task is already done, close immediately
  if (['completed', 'failed', 'canceled'].includes(task.status)) {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    return;
  }

  // Subscribe to future events
  const unsubscribe = taskManager.subscribe(task.id, (event: A2ATaskEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (event.type === 'done') {
      res.end();
    }
  });

  // Clean up on client disconnect
  req.on('close', () => {
    unsubscribe();
  });
});

// ---------------------------------------------------------------------------
// GET /a2a/tasks — List recent tasks (admin/debugging)
// ---------------------------------------------------------------------------
a2aRouter.get('/a2a/tasks', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const tasks = taskManager.listRecent(limit);
  res.json({ tasks, count: tasks.length });
});

export default a2aRouter;
