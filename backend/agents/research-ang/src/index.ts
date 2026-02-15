/**
 * Research_Ang — Containerized A2A Agent
 *
 * Standalone microservice implementing the A2A protocol.
 * Handles market research, competitive analysis, data interpretation,
 * and deep-dive research tasks.
 *
 * Endpoints:
 *   GET  /health                 — Healthcheck
 *   GET  /.well-known/agent.json — A2A Agent Card
 *   POST /a2a/tasks/send         — Accept and execute tasks
 *   GET  /a2a/tasks/:id          — Get task status
 *   GET  /a2a/tasks/:id/stream   — SSE stream of task events
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { agentCard } from './agent-card';
import { executeResearchTask } from './research-engine';
import { taskStore, TaskState } from './task-store';
import { logger } from './logger';

const PORT = parseInt(process.env.PORT || '3020', 10);
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    agent: 'research-ang',
    version: '1.0.0',
    uptime: process.uptime(),
    tasksProcessed: taskStore.countCompleted(),
  });
});

// ---------------------------------------------------------------------------
// A2A: Agent Card Discovery
// ---------------------------------------------------------------------------

app.get('/.well-known/agent.json', (_req, res) => {
  res.json(agentCard);
});

// ---------------------------------------------------------------------------
// A2A: Task Submission
// ---------------------------------------------------------------------------

app.post('/a2a/tasks/send', async (req, res) => {
  try {
    const { message, requestedBy, metadata } = req.body;

    if (!message?.parts || message.parts.length === 0) {
      res.status(400).json({ error: 'Missing message.parts' });
      return;
    }

    const taskId = uuidv4();

    // Extract text from parts
    const textParts = message.parts
      .filter((p: { type: string }) => p.type === 'text')
      .map((p: { text: string }) => p.text);
    const query = textParts.join('\n');

    // Extract data context from parts
    const dataParts = message.parts
      .filter((p: { type: string }) => p.type === 'data')
      .reduce((acc: Record<string, unknown>, p: { data: Record<string, unknown> }) => ({ ...acc, ...p.data }), {});

    const task: TaskState = {
      id: taskId,
      agentId: 'research-ang',
      status: 'submitted',
      query,
      context: dataParts,
      messages: [{ role: 'user', parts: message.parts, timestamp: new Date().toISOString() }],
      artifacts: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requestedBy: requestedBy || 'unknown',
        matchedCapability: metadata?.capability,
      },
    };

    taskStore.set(task);
    logger.info({ taskId, query: query.slice(0, 100) }, '[Research_Ang] Task received');

    // Execute asynchronously
    executeResearchTask(task).catch(err => {
      logger.error({ taskId, err: err.message }, '[Research_Ang] Task execution failed');
      taskStore.updateStatus(taskId, 'failed');
      taskStore.emit(taskId, { type: 'error', error: { code: 'EXECUTION_FAILED', message: err.message } });
      taskStore.emit(taskId, { type: 'done' });
    });

    res.status(201).json({ task: taskStore.get(taskId) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Task submission failed';
    logger.error({ err }, '[Research_Ang] Task send error');
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// A2A: Task Status
// ---------------------------------------------------------------------------

app.get('/a2a/tasks/:id', (req, res) => {
  const task = taskStore.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ task });
});

// ---------------------------------------------------------------------------
// A2A: Task SSE Stream
// ---------------------------------------------------------------------------

app.get('/a2a/tasks/:id/stream', (req, res) => {
  const task = taskStore.get(req.params.id);
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

  // Send current state
  res.write(`data: ${JSON.stringify({ type: 'status', status: task.status })}\n\n`);

  if (['completed', 'failed', 'canceled'].includes(task.status)) {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    return;
  }

  const unsubscribe = taskStore.subscribe(task.id, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (event.type === 'done') {
      res.end();
    }
  });

  req.on('close', () => { unsubscribe(); });
});

// ---------------------------------------------------------------------------
// A2A: List Tasks
// ---------------------------------------------------------------------------

app.get('/a2a/tasks', (_req, res) => {
  const tasks = taskStore.listRecent(20);
  res.json({ tasks, count: tasks.length });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, '[Research_Ang] Agent online — A2A endpoints active');
});
