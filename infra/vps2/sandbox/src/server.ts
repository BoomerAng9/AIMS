/**
 * A.I.M.S. OpenSandbox — HTTP Server
 * Hono-based REST API for secure code execution
 *
 * Port: 4400 (WireGuard-only, 10.0.0.2:4400)
 *
 * Endpoints:
 *   GET  /health                          — Health check
 *   POST /api/sandbox/execute             — Execute code (ephemeral)
 *   GET  /api/sandbox/executions          — List recent executions
 *   GET  /api/sandbox/executions/:id      — Get execution status/result
 *   POST /api/sandbox/executions/:id/cancel — Cancel running execution
 *   POST /api/sandbox/sessions            — Create persistent sandbox
 *   GET  /api/sandbox/sessions            — List sessions
 *   GET  /api/sandbox/sessions/:id        — Get session info
 *   POST /api/sandbox/sessions/:id/execute — Execute in persistent session
 *   DELETE /api/sandbox/sessions/:id      — Destroy session
 *   GET  /api/sandbox/stats               — Execution statistics
 *   GET  /api/sandbox/languages           — Supported languages
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import {
  executeCode,
  getExecution,
  listExecutions,
  cancelExecution,
  getActiveCount,
  cleanupOldExecutions,
  prewarmImages,
} from './executor.js';
import {
  createSession,
  getSession,
  listSessions,
  destroySession,
  executeInSession,
  getActiveSessionCount,
  cleanupAll,
} from './session-manager.js';
import type { ExecutionRequest, SessionRequest, SandboxStats, SandboxLanguage } from './types.js';
import { LANGUAGE_IMAGES } from './types.js';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '4400');
const startedAt = Date.now();

// Execution counters for stats
let totalExecutions = 0;
let totalDurationMs = 0;
const executionsByLanguage: Record<string, number> = {};
const executionsByStatus: Record<string, number> = {};

// Only allow requests from VPS1 WireGuard and local
app.use('*', cors({ origin: ['http://10.0.0.1:3001', 'http://10.0.0.1', 'http://localhost'] }));

// ─── Health ─────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'open-sandbox',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    activeExecutions: getActiveCount(),
    activeSessions: getActiveSessionCount(),
    timestamp: new Date().toISOString(),
  })
);

// ─── Execute Code (Ephemeral) ───────────────────────────────
app.post('/api/sandbox/execute', async (c) => {
  try {
    const body = await c.req.json() as ExecutionRequest;

    // Validate
    if (!body.code || typeof body.code !== 'string') {
      return c.json({ error: 'code is required (string)' }, 400);
    }
    if (!body.language || !(body.language in LANGUAGE_IMAGES)) {
      return c.json({
        error: `language is required. Supported: ${Object.keys(LANGUAGE_IMAGES).join(', ')}`,
      }, 400);
    }
    if (body.code.length > 100_000) {
      return c.json({ error: 'code must be under 100KB' }, 400);
    }

    const execution = await executeCode(body);

    // Track stats
    totalExecutions++;
    executionsByLanguage[body.language] = (executionsByLanguage[body.language] || 0) + 1;

    return c.json({ ok: true, execution }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Execution failed';
    return c.json({ error: msg }, 500);
  }
});

// ─── List Executions ────────────────────────────────────────
app.get('/api/sandbox/executions', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  return c.json({ executions: listExecutions(limit) });
});

// ─── Get Execution ──────────────────────────────────────────
app.get('/api/sandbox/executions/:id', (c) => {
  const execution = getExecution(c.req.param('id'));
  if (!execution) return c.json({ error: 'Execution not found' }, 404);

  // Update stats when we see a terminal state
  if (execution.completedAt && execution.durationMs) {
    const key = execution.status;
    executionsByStatus[key] = (executionsByStatus[key] || 0) + 1;
    totalDurationMs += execution.durationMs;
  }

  return c.json({ execution });
});

// ─── Cancel Execution ───────────────────────────────────────
app.post('/api/sandbox/executions/:id/cancel', async (c) => {
  const execution = await cancelExecution(c.req.param('id'));
  if (!execution) return c.json({ error: 'Execution not found' }, 404);
  return c.json({ ok: true, execution });
});

// ─── Create Session ─────────────────────────────────────────
app.post('/api/sandbox/sessions', async (c) => {
  try {
    const body = await c.req.json() as SessionRequest;

    if (!body.language || !(body.language in LANGUAGE_IMAGES)) {
      return c.json({
        error: `language is required. Supported: ${Object.keys(LANGUAGE_IMAGES).join(', ')}`,
      }, 400);
    }

    const session = await createSession(body);
    return c.json({ ok: true, session }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session creation failed';
    return c.json({ error: msg }, 500);
  }
});

// ─── List Sessions ──────────────────────────────────────────
app.get('/api/sandbox/sessions', (c) => {
  return c.json({ sessions: listSessions() });
});

// ─── Get Session ────────────────────────────────────────────
app.get('/api/sandbox/sessions/:id', (c) => {
  const session = getSession(c.req.param('id'));
  if (!session) return c.json({ error: 'Session not found' }, 404);
  return c.json({ session });
});

// ─── Execute in Session ─────────────────────────────────────
app.post('/api/sandbox/sessions/:id/execute', async (c) => {
  try {
    const body = await c.req.json() as { code: string; timeoutSeconds?: number };

    if (!body.code || typeof body.code !== 'string') {
      return c.json({ error: 'code is required (string)' }, 400);
    }

    const timeout = Math.min(body.timeoutSeconds || 30, 300);
    const result = await executeInSession(c.req.param('id'), body.code, timeout);

    return c.json({ ok: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session execution failed';
    return c.json({ error: msg }, 400);
  }
});

// ─── Destroy Session ────────────────────────────────────────
app.delete('/api/sandbox/sessions/:id', async (c) => {
  const session = await destroySession(c.req.param('id'));
  if (!session) return c.json({ error: 'Session not found' }, 404);
  return c.json({ ok: true, message: 'Session destroyed' });
});

// ─── Stats ──────────────────────────────────────────────────
app.get('/api/sandbox/stats', (c) => {
  const stats: SandboxStats = {
    totalExecutions,
    activeExecutions: getActiveCount(),
    activeSessions: getActiveSessionCount(),
    executionsByLanguage: { ...executionsByLanguage },
    executionsByStatus: { ...executionsByStatus },
    avgDurationMs: totalExecutions > 0 ? Math.round(totalDurationMs / totalExecutions) : 0,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  };
  return c.json(stats);
});

// ─── Supported Languages ────────────────────────────────────
app.get('/api/sandbox/languages', (c) => {
  const languages = Object.entries(LANGUAGE_IMAGES).map(([lang, image]) => ({
    language: lang,
    image,
    available: true,
  }));
  return c.json({ languages });
});

// ─── Bootstrap & Serve ──────────────────────────────────────
console.log(`[open-sandbox] Starting on port ${PORT}...`);

// Pre-warm popular images in background
prewarmImages(['python', 'javascript', 'bash'] as SandboxLanguage[]).catch(() => {});

// Periodic cleanup of old execution records
setInterval(() => {
  const removed = cleanupOldExecutions();
  if (removed > 0) {
    console.log(`[open-sandbox] Cleaned up ${removed} old execution records`);
  }
}, 5 * 60 * 1000); // every 5 minutes

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[open-sandbox] SIGTERM received, cleaning up...');
  await cleanupAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[open-sandbox] SIGINT received, cleaning up...');
  await cleanupAll();
  process.exit(0);
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[open-sandbox] A.I.M.S. OpenSandbox running on :${PORT}`);
  console.log(`[open-sandbox] Supported languages: ${Object.keys(LANGUAGE_IMAGES).join(', ')}`);
});
