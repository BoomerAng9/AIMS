import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { ACPStandardizedRequest, ACPResponse } from './acp/types';
import { LUCEngine } from './luc';
import { Oracle } from './oracle';
import { routeToAgents } from './agents/router';
import { registry } from './agents/registry';
import { cardStyleRegistry } from './perform/registry/card-styles';
import { runAthletePageFactory } from './perform/pipeline/athlete-page-factory';
import { SQUAD_PROFILES } from './agents/lil-hawks/workflow-smith-squad';
import { VISION_SQUAD_PROFILES } from './agents/lil-hawks/vision-scout-squad';
import { PREP_SQUAD_PROFILES, runPrepSquad } from './agents/lil-hawks/prep-squad-alpha';
import { JSON_SQUAD_PROFILES } from './agents/lil-hawks/json-expert-squad';
import { pmoRegistry } from './pmo/registry';
import { houseOfAng } from './pmo/house-of-ang';
import { runCollaborationDemo, renderJSON } from './collaboration';
import { TIER_CONFIGS, TASK_MULTIPLIERS as BILLING_MULTIPLIERS, PILLAR_CONFIGS, checkAllowance, calculatePillarAddon, checkAgentLimit } from './billing';
import { openrouter, MODELS as LLM_MODELS, llmGateway, usageTracker } from './llm';
import { verticalRegistry } from './verticals';
import { projectStore, plugStore, deploymentStore, auditStore, evidenceStore, startCleanupSchedule, stopCleanupSchedule, closeDb } from './db';
import { getQuestions, analyzeRequirements, generateProjectSpec, createProject } from './intake';
import { riskAssessor, definitionOfDone, acceptanceCriteria } from './intake/requirements';
import { templateLibrary } from './templates';
import { scaffolder } from './scaffolder';
import { pipeline } from './pipeline';
import { deployer } from './deployer';
import { integrationRegistry } from './integrations';
import { analytics } from './analytics';
import { makeItMine } from './make-it-mine';
import { ownershipEnforcer } from './auth';
import { secrets } from './secrets';
import { supplyChain } from './supply-chain';
import { sandboxEnforcer } from './sandbox';
import { securityTester } from './security';
import { alertEngine, correlationManager, metricsExporter } from './observability';
import { releaseManager } from './release';
import { backupManager } from './backup';
import { incidentManager } from './backup/incident-runbook';

import { a2aRouter } from './a2a';
import { getOrchestrator } from './acheevy/orchestrator';
import { shelfRouter } from './shelves/shelf-router';
import { lucProjectService } from './shelves/luc-project-service';
import { allShelfTools } from './shelves/mcp-tools';
import { ossModels } from './llm/oss-models';
import { personaplex } from './llm/personaplex';
import { N8nClient } from './n8n';
import { plugRouter } from './plug-catalog/router';
import { cloudflareRouter, markdownForAgents } from './cloudflare';
import { paymentsRouter } from './payments';
import logger from './logger';

// Custom Lil_Hawks — User-Created Bots
import {
  createCustomHawk, listUserHawks, getHawk, updateHawkStatus, deleteHawk,
  executeHawk, getAvailableDomains, getAvailableTools, getHawkExecutionHistory,
  getGlobalStats as getHawkGlobalStats,
} from './custom-hawks';
import type { CustomHawkSpec, HawkExecutionRequest } from './custom-hawks';

// Playground/Sandbox — Isolated Execution Environments
import {
  createPlayground, executeInPlayground, getPlayground, listPlaygrounds,
  pausePlayground, resumePlayground, completePlayground, addFile,
  getPlaygroundStats,
} from './playground';
import type { CreatePlaygroundRequest, ExecuteInPlaygroundRequest } from './playground';

// Memory System — Persistent Agent Memory
import { getMemoryEngine } from './memory';
import type { RememberInput, RecallQuery, MemoryFeedback } from './memory';

// Twelve Labs Video Intelligence + ScoutVerify
import { getTwelveLabsClient } from './twelve-labs';
import { runScoutVerify } from './perform/scout-verify';
import type { ScoutVerifyInput } from './perform/scout-verify';

const app = express();
const PORT = process.env.PORT || 3001;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// --------------------------------------------------------------------------
// Security Middleware
// --------------------------------------------------------------------------
app.use(helmet({ contentSecurityPolicy: false }));

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Correlation ID middleware — every request gets a trace ID
app.use(correlationManager.correlationMiddleware());

// Request metrics middleware — track all HTTP requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsExporter.record('http_requests_total', 1, { method: req.method, path: req.path, status: String(res.statusCode) });
    metricsExporter.record('http_request_duration_ms', duration, { method: req.method, path: req.path });
    if (res.statusCode >= 400) {
      metricsExporter.record('http_errors_total', 1, { method: req.method, path: req.path, status: String(res.statusCode) });
    }
    // Evaluate alert thresholds
    if (res.statusCode >= 500) {
      alertEngine.evaluate('error_rate', 1);
    }
    alertEngine.evaluate('response_time', duration);
  });
  next();
});

// Start data lifecycle cleanup schedule
startCleanupSchedule();

// Global rate limit: 100 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Activity breeds Activity — but pace yourself.' },
});
app.use(globalLimiter);

// Stricter limiter for ACP ingress: 30 req / min per IP
const acpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'ACP rate limit exceeded. Please wait before sending more requests.' },
});

// --------------------------------------------------------------------------
// API Key Authentication — all routes except /health require X-API-Key
// --------------------------------------------------------------------------
function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction): void {
  // In dev without a key configured, allow requests through
  if (!INTERNAL_API_KEY && process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const provided = req.headers['x-api-key'];
  if (!provided || provided !== INTERNAL_API_KEY) {
    logger.warn({ path: req.path, ip: req.ip }, '[UEF] Rejected: invalid or missing API key');
    res.status(401).json({ error: 'Unauthorized — invalid or missing API key' });
    return;
  }
  next();
}

// --------------------------------------------------------------------------
// Health Check — open (no API key) for Docker probes and uptime monitors
// --------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'UEF Gateway Online', layer: 2, uptime: process.uptime() });
});

// --------------------------------------------------------------------------
// A2A Discovery — /.well-known/agent.json is public per A2A spec
// --------------------------------------------------------------------------
app.use(a2aRouter);

// --------------------------------------------------------------------------
// Cloudflare — LLM.txt, AI Index, and markdown-for-agents (public)
// --------------------------------------------------------------------------
app.use(cloudflareRouter);
app.use(markdownForAgents);

// --------------------------------------------------------------------------
// Apply API key gate to ALL subsequent routes
// --------------------------------------------------------------------------
app.use(requireApiKey);

// --------------------------------------------------------------------------
// Agent Payments — X402, Stripe Agent Commerce, Wallets
// --------------------------------------------------------------------------
app.use(paymentsRouter);

// --------------------------------------------------------------------------
// Agent Registry — list available agents and their profiles
// --------------------------------------------------------------------------
app.get('/agents', (_req, res) => {
  res.json({ agents: registry.list() });
});

// --------------------------------------------------------------------------
// Per|Form — Card Style Registry
// --------------------------------------------------------------------------
app.get('/perform/styles', (_req, res) => {
  res.json({ styles: cardStyleRegistry.list() });
});

app.get('/perform/styles/:styleId', (req, res) => {
  const style = cardStyleRegistry.get(req.params.styleId);
  res.json(style);
});

// --------------------------------------------------------------------------
// Per|Form — Athlete Page Factory (Closed-Loop v1)
// --------------------------------------------------------------------------
app.post('/perform/athlete', async (req, res) => {
  try {
    const { athleteName, athleteId, cardStyleId } = req.body;
    if (!athleteName || typeof athleteName !== 'string' || athleteName.length > 200) {
      res.status(400).json({ error: 'Invalid athleteName: required string, max 200 chars' });
      return;
    }
    if (!athleteId || typeof athleteId !== 'string' || athleteId.length > 100) {
      res.status(400).json({ error: 'Invalid athleteId: required string, max 100 chars' });
      return;
    }
    const result = await runAthletePageFactory({ athleteName, athleteId, cardStyleId });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Per|Form Pipeline Error');
    res.status(500).json({ status: 'ERROR', message });
  }
});

// --------------------------------------------------------------------------
// Per|Form Platform — Sports Analytics Pipeline Proxy
// Routes /api/perform/* to the Per|Form service containers
// Gridiron (football) is one category within Per|Form
// --------------------------------------------------------------------------
const PERFORM_SCOUT_HUB = process.env.PERFORM_SCOUT_HUB_URL || 'http://scout-hub:5001';
const PERFORM_FILM_ROOM = process.env.PERFORM_FILM_ROOM_URL || 'http://film-room:5002';
const PERFORM_WAR_ROOM = process.env.PERFORM_WAR_ROOM_URL || 'http://war-room:5003';

async function performProxy(serviceUrl: string, path: string, method: string, body?: unknown): Promise<unknown> {
  const url = `${serviceUrl}${path}`;
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

app.all('/api/perform/scout-hub/*', async (req, res) => {
  try {
    const path = req.path.replace('/api/perform/scout-hub', '');
    const data = await performProxy(PERFORM_SCOUT_HUB, path || '/health', req.method, req.body);
    res.json(data);
  } catch (error: unknown) {
    logger.error({ err: error }, 'Per|Form Scout Hub proxy error');
    res.status(502).json({ error: 'Scout Hub unreachable' });
  }
});

app.all('/api/perform/film-room/*', async (req, res) => {
  try {
    const path = req.path.replace('/api/perform/film-room', '');
    const data = await performProxy(PERFORM_FILM_ROOM, path || '/health', req.method, req.body);
    res.json(data);
  } catch (error: unknown) {
    logger.error({ err: error }, 'Per|Form Film Room proxy error');
    res.status(502).json({ error: 'Film Room unreachable' });
  }
});

app.all('/api/perform/war-room/*', async (req, res) => {
  try {
    const path = req.path.replace('/api/perform/war-room', '');
    const data = await performProxy(PERFORM_WAR_ROOM, path || '/health', req.method, req.body);
    res.json(data);
  } catch (error: unknown) {
    logger.error({ err: error }, 'Per|Form War Room proxy error');
    res.status(502).json({ error: 'War Room unreachable' });
  }
});

// --------------------------------------------------------------------------
// Per|Form Film Room — Twelve Labs Video Intelligence + ScoutVerify
// Powered by Twelve Labs Marengo (search/embeddings) + Pegasus (generation)
// --------------------------------------------------------------------------

// Film Room: Check Twelve Labs integration status
app.get('/api/perform/film-room/status', async (_req, res) => {
  const client = getTwelveLabsClient();
  if (!client) {
    res.json({ status: 'disabled', reason: 'TWELVELABS_API_KEY not configured' });
    return;
  }
  const healthy = await client.healthCheck();
  res.json({ status: healthy ? 'connected' : 'error', provider: 'twelve-labs' });
});

// Film Room: List video indexes
app.get('/api/perform/film-room/indexes', async (_req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  try {
    const indexes = await client.listIndexes();
    res.json(indexes);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Failed to list indexes');
    res.status(500).json({ error: 'Failed to list indexes' });
  }
});

// Film Room: Create a new video index
app.post('/api/perform/film-room/indexes', async (req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    const index = await client.createIndex(name);
    res.json(index);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Failed to create index');
    res.status(500).json({ error: 'Failed to create index' });
  }
});

// Film Room: Index a video by URL
app.post('/api/perform/film-room/videos', async (req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  const { indexId, videoUrl, metadata } = req.body;
  if (!indexId || !videoUrl) {
    res.status(400).json({ error: 'indexId and videoUrl are required' });
    return;
  }
  try {
    const task = await client.indexVideoByUrl(indexId, videoUrl, metadata);
    res.json(task);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Failed to index video');
    res.status(500).json({ error: 'Failed to index video' });
  }
});

// Film Room: Check video indexing task status
app.get('/api/perform/film-room/tasks/:taskId', async (req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  try {
    const task = await client.getTask(req.params.taskId);
    res.json(task);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Failed to get task status');
    res.status(500).json({ error: 'Failed to get task status' });
  }
});

// Film Room: Semantic search over game film
app.post('/api/perform/film-room/search', async (req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  const { indexId, query, options } = req.body;
  if (!indexId || !query) {
    res.status(400).json({ error: 'indexId and query are required' });
    return;
  }
  try {
    const results = await client.search(indexId, query, options);
    res.json(results);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Search failed');
    res.status(500).json({ error: 'Search failed' });
  }
});

// Film Room: Generate scouting report from video
app.post('/api/perform/film-room/report', async (req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  const { videoId, prompt } = req.body;
  if (!videoId) {
    res.status(400).json({ error: 'videoId is required' });
    return;
  }
  try {
    const report = await client.generate(
      videoId,
      prompt || 'Generate a professional scouting report from this game film. Include strengths, areas for improvement, bull case, bear case, and an overall verdict with specific play examples.'
    );
    res.json(report);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Report generation failed');
    res.status(500).json({ error: 'Report generation failed' });
  }
});

// Film Room: Summarize game film
app.post('/api/perform/film-room/summarize', async (req, res) => {
  const client = getTwelveLabsClient();
  if (!client) { res.status(503).json({ error: 'Twelve Labs not configured' }); return; }
  const { videoId, type, prompt } = req.body;
  if (!videoId) {
    res.status(400).json({ error: 'videoId is required' });
    return;
  }
  try {
    const summary = await client.summarize(videoId, type || 'summary', prompt);
    res.json(summary);
  } catch (err) {
    logger.error({ err }, '[FilmRoom] Summarize failed');
    res.status(500).json({ error: 'Summarize failed' });
  }
});

// ScoutVerify: Automated prospect evaluation verification
app.post('/api/perform/scout-verify', async (req, res) => {
  const { prospectName, videoId, videoUrl, position, school, classYear } = req.body;
  if (!prospectName || typeof prospectName !== 'string') {
    res.status(400).json({ error: 'prospectName is required' });
    return;
  }
  try {
    const input: ScoutVerifyInput = { prospectName, videoId, videoUrl, position, school, classYear };
    const report = await runScoutVerify(input);
    res.json(report);
  } catch (err) {
    logger.error({ err }, '[ScoutVerify] Verification failed');
    res.status(500).json({ error: 'ScoutVerify pipeline failed' });
  }
});

// --------------------------------------------------------------------------
// PMO Offices — Project Management Governance
// --------------------------------------------------------------------------
app.get('/pmo', (_req, res) => {
  res.json({ offices: pmoRegistry.list(), directors: pmoRegistry.getDirectors() });
});

app.get('/pmo/:pmoId', (req, res) => {
  const office = pmoRegistry.get(req.params.pmoId as Parameters<typeof pmoRegistry.get>[0]);
  if (!office) {
    res.status(404).json({ error: `PMO office "${req.params.pmoId}" not found` });
    return;
  }
  res.json(office);
});

// --------------------------------------------------------------------------
// House of Ang — Boomer_Ang Factory & Deployment Center
// --------------------------------------------------------------------------
app.get('/house-of-ang', (_req, res) => {
  res.json({
    roster: houseOfAng.list(),
    stats: houseOfAng.getStats(),
    spawnLog: houseOfAng.getSpawnLog(),
  });
});

app.get('/house-of-ang/roster', (req, res) => {
  const type = req.query?.type as string | undefined;
  if (type === 'SUPERVISORY' || type === 'EXECUTION') {
    res.json({ roster: houseOfAng.listByType(type) });
  } else {
    res.json({ roster: houseOfAng.list() });
  }
});

app.post('/house-of-ang/forge', (req, res) => {
  try {
    const { message, pmoOffice, director, requestedBy } = req.body;
    if (!message || typeof message !== 'string' || message.length > 2000) {
      res.status(400).json({ error: 'Invalid message: required string, max 2000 chars' });
      return;
    }
    if (!pmoOffice || typeof pmoOffice !== 'string') {
      res.status(400).json({ error: 'Invalid pmoOffice: required string' });
      return;
    }
    if (!director || typeof director !== 'string') {
      res.status(400).json({ error: 'Invalid director: required string' });
      return;
    }
    const result = houseOfAng.forgeForTask(message, pmoOffice as any, director as any, requestedBy || 'API');
    res.status(201).json(result);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Forge failed';
    res.status(409).json({ error: errMessage });
  }
});


// --------------------------------------------------------------------------
// Collaboration Feed — Live Look-In (Agent Collaboration Transcript)
// --------------------------------------------------------------------------
app.post('/collaboration/demo', async (req, res) => {
  try {
    const { userName, message, projectLabel } = req.body;
    if (!message || typeof message !== 'string' || message.length > 2000) {
      res.status(400).json({ error: 'Invalid message: required string, max 2000 chars' });
      return;
    }
    const session = await runCollaborationDemo(
      userName || 'Boss',
      message,
      projectLabel,
    );
    res.json(renderJSON(session));
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Collaboration demo failed';
    res.status(500).json({ error: errMessage });
  }
});

// --------------------------------------------------------------------------
// Admin — API Key Status (OWNER-only, called via frontend proxy)
// --------------------------------------------------------------------------
app.get('/admin/api-keys', (_req, res) => {
  const mask = (val: string | undefined): { configured: boolean; masked: string } => {
    if (!val) return { configured: false, masked: '' };
    if (val.length <= 8) return { configured: true, masked: '****' };
    return { configured: true, masked: `${val.slice(0, 4)}${'*'.repeat(Math.min(val.length - 8, 20))}${val.slice(-4)}` };
  };

  res.json({
    keys: [
      { id: 'INTERNAL_API_KEY', label: 'Internal API Key', scope: 'Frontend ↔ Backend auth', ...mask(process.env.INTERNAL_API_KEY) },
      { id: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', scope: 'Session signing', ...mask(process.env.NEXTAUTH_SECRET) },
      { id: 'GOOGLE_CLIENT_ID', label: 'Google OAuth Client ID', scope: 'Google sign-in', ...mask(process.env.GOOGLE_CLIENT_ID) },
      { id: 'GOOGLE_CLIENT_SECRET', label: 'Google OAuth Secret', scope: 'Google sign-in', ...mask(process.env.GOOGLE_CLIENT_SECRET) },
      { id: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', scope: 'Payment processing', ...mask(process.env.STRIPE_SECRET_KEY) },
      { id: 'STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key', scope: 'Client-side payments', ...mask(process.env.STRIPE_PUBLISHABLE_KEY) },
      { id: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', scope: 'Webhook verification', ...mask(process.env.STRIPE_WEBHOOK_SECRET) },
      { id: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', scope: 'LLM power source (all agents)', ...mask(process.env.OPENROUTER_API_KEY) },
      { id: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', scope: 'Claude Code CLI', ...mask(process.env.ANTHROPIC_API_KEY) },
      { id: 'GEMINI_API_KEY', label: 'Gemini API Key', scope: 'Gemini CLI (YOLO)', ...mask(process.env.GEMINI_API_KEY) },
    ],
  });
});

// --------------------------------------------------------------------------
// Admin — LLM Models (The Park — model catalog from OpenRouter)
// --------------------------------------------------------------------------
app.get('/admin/models', (_req, res) => {
  res.json({
    provider: 'OpenRouter',
    configured: openrouter.isConfigured(),
    models: Object.entries(LLM_MODELS).map(([key, spec]) => ({
      key,
      id: spec.id,
      name: spec.name,
      provider: spec.provider,
      tier: spec.tier,
      contextWindow: spec.contextWindow,
      pricing: {
        inputPer1M: spec.inputPer1M,
        outputPer1M: spec.outputPer1M,
      },
    })),
  });
});

// --------------------------------------------------------------------------
// Unified LLM Gateway — Vertex AI + OpenRouter
// --------------------------------------------------------------------------
app.post('/llm/chat', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature, agentId, userId, sessionId, thinking_level } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Missing or empty messages array' });
      return;
    }
    const result = await llmGateway.chat({ model, messages, max_tokens, temperature, agentId, userId, sessionId, thinking_level });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM chat failed';
    logger.error({ err }, '[LLM] Chat error');
    res.status(500).json({ error: msg });
  }
});

app.post('/llm/stream', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature, agentId, userId, sessionId, thinking_level } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Missing or empty messages array' });
      return;
    }

    const { stream, provider, model: resolvedModel } = await llmGateway.stream({ model, messages, max_tokens, temperature, agentId, userId, sessionId, thinking_level });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-LLM-Provider': provider,
      'X-LLM-Model': resolvedModel,
    });

    const reader = stream.getReader();
    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      res.write(`data: ${JSON.stringify({ text: value })}\n\n`);
      return pump();
    };
    await pump();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM stream failed';
    logger.error({ err }, '[LLM] Stream error');
    if (!res.headersSent) {
      res.status(500).json({ error: msg });
    } else {
      res.end();
    }
  }
});

app.get('/llm/models', (_req, res) => {
  res.json({
    configured: llmGateway.isConfigured(),
    models: llmGateway.listModels(),
  });
});

app.get('/llm/usage', (req, res) => {
  const userId = req.query.userId as string | undefined;
  const sessionId = req.query.sessionId as string | undefined;

  if (userId && sessionId) {
    res.json(usageTracker.getSummary(userId, sessionId));
  } else if (userId) {
    res.json(usageTracker.getUserUsage(userId));
  } else {
    res.json(usageTracker.getGlobalStats());
  }
});

// --------------------------------------------------------------------------
// ACHEEVY Orchestrator — Intent classification → agent dispatch
// This is the PRIMARY execution path for the chat interface.
// Frontend sends: { userId, message, intent, context }
// Gateway routes to II-Agent, A2A agents, n8n, or verticals.
// --------------------------------------------------------------------------
app.post('/acheevy/execute', async (req, res) => {
  try {
    const { userId, message, intent, conversationId, plugId, skillId, context } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Missing message field' });
      return;
    }
    if (!intent || typeof intent !== 'string') {
      res.status(400).json({ error: 'Missing intent field' });
      return;
    }

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      userId: userId || req.headers['x-user-id'] as string || 'anon-unknown',
      message,
      intent,
      conversationId: conversationId || 'chat-ui',
      plugId,
      skillId,
      context,
    });

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Orchestrator execution failed';
    logger.error({ err }, '[ACHEEVY] Execute error');
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Vertical Execute — Phase B: dispatch vertical to n8n workflow pipeline
// Called by the frontend after Phase A step-progression completes.
// --------------------------------------------------------------------------
app.post('/vertical/execute', async (req, res) => {
  try {
    const { verticalId, userId, collectedData, sessionId } = req.body;
    if (!verticalId || !userId) {
      res.status(400).json({ error: 'Missing verticalId or userId' });
      return;
    }

    const { triggerVerticalWorkflow } = await import('./n8n/client');
    const result = await triggerVerticalWorkflow({
      verticalId,
      userId: userId || req.headers['x-user-id'] as string || 'anon-unknown',
      collectedData: collectedData || {},
      sessionId: sessionId || `session-${userId}`,
      requestId: `VRT-${Date.now()}`,
    });

    logger.info(
      { verticalId, userId, requestId: result.requestId, status: result.status },
      '[Vertical] Phase B execution dispatched',
    );

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Vertical execution failed';
    logger.error({ err }, '[Vertical] Execute error');
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// ACHEEVY Classify — Quick intent classification for the chat route
// Frontend can call this to determine if a message needs agent dispatch
// --------------------------------------------------------------------------
app.post('/acheevy/classify', (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Missing message field' });
      return;
    }

    // ── Vertical Trigger Patterns ────────────────────────────────
    // Mirrors aims-skills/acheevy-verticals/vertical-definitions.ts
    // Each vertical has NLP trigger patterns; we test them in priority order.
    const VERTICAL_TRIGGERS: Array<{ id: string; name: string; patterns: RegExp[] }> = [
      // Custom Hawk creation (high priority — user wants to create a bot)
      {
        id: 'custom-hawk',
        name: 'Custom Lil_Hawks',
        patterns: [
          /custom\s*(hawk|bot|agent)/i,
          /create\s*(a|my|an?)?\s*(hawk|bot|agent)/i,
          /make\s*(a|my|an?)?\s*(hawk|bot|agent)/i,
          /build\s*me\s*(a|an?)?\s*(hawk|bot|agent)/i,
          /my\s*own\s*(hawk|bot|agent|assistant)/i,
          /personal\s*(assistant|agent|bot)/i,
          /lil_\w+_hawk/i,
        ],
      },
      // Playground / Sandbox (high priority — user wants to test/run code)
      {
        id: 'playground',
        name: 'Playground/Sandbox',
        patterns: [
          /playground/i,
          /sandbox/i,
          /run\s*(some|this|my)?\s*code/i,
          /test\s*(some|this|my)?\s*(code|prompt|agent)/i,
          /code\s*sandbox/i,
          /training\s*(data|task|annotation)/i,
          /student\s*workspace/i,
          /prompt\s*(test|playground)/i,
        ],
      },
      // Chicken Hawk (code/deploy agent)
      {
        id: 'chicken-hawk',
        name: 'Chicken Hawk Code Agent',
        patterns: [
          /chicken\s*hawk/i,
          /build\s*me\s*(an?\s*)?(app|tool|website|api|service)/i,
          /deploy\s*(my|this|the)\s*(app|project|code)/i,
          /claw\s*(agent|build|code)/i,
          /code\s*agent/i,
        ],
      },
      // LiveSim
      {
        id: 'livesim',
        name: 'LiveSim Agent Space',
        patterns: [
          /live\s*sim/i,
          /simulation\s*space/i,
          /autonomous\s*space/i,
          /agent\s*simulation/i,
          /let\s*the\s*agents?\s*work/i,
          /watch\s*the\s*team/i,
        ],
      },
      // Business Idea Generator
      {
        id: 'idea-generator',
        name: 'Business Idea Generator',
        patterns: [
          /business\s*ideas?/i,
          /startup\s*ideas?/i,
          /what\s*should\s*i\s*build/i,
          /suggest.*ideas/i,
          /start(ing)?\s*(a|my)?\s*business/i,
          /entrepreneur/i,
          /side\s*hustle/i,
        ],
      },
      // Pain Points
      {
        id: 'pain-points',
        name: 'Customer Pain Point Finder',
        patterns: [
          /pain\s*points?/i,
          /problems?\s*in/i,
          /market\s*gaps?/i,
          /customer\s*frustrations?/i,
        ],
      },
      // Brand Name
      {
        id: 'brand-name',
        name: 'Brand Name Generator',
        patterns: [
          /brand\s*name/i,
          /company\s*name/i,
          /what\s*to\s*call/i,
          /name.*business/i,
        ],
      },
      // Value Proposition
      {
        id: 'value-prop',
        name: 'Value Proposition Builder',
        patterns: [
          /value\s*proposition/i,
          /why\s*us/i,
          /unique\s*selling/i,
          /\busp\b/i,
        ],
      },
      // MVP Plan
      {
        id: 'mvp-plan',
        name: 'MVP Launch Planner',
        patterns: [
          /\bmvp\b/i,
          /launch\s*plan/i,
          /get\s*started/i,
          /first\s*steps?/i,
          /minimum\s*viable/i,
        ],
      },
      // Customer Persona
      {
        id: 'persona',
        name: 'Customer Persona Builder',
        patterns: [
          /target\s*customer/i,
          /who\s*buys/i,
          /ideal\s*customer/i,
          /customer\s*persona/i,
          /buyer\s*persona/i,
        ],
      },
      // Social Hooks
      {
        id: 'social-hooks',
        name: 'Social Media Hooks',
        patterns: [
          /launch\s*tweet/i,
          /social\s*post/i,
          /announce/i,
          /twitter\s*hook/i,
          /x\s*hook/i,
        ],
      },
      // Cold Outreach
      {
        id: 'cold-outreach',
        name: 'Cold Outreach Engine',
        patterns: [
          /cold\s*email/i,
          /outreach/i,
          /pitch\s*email/i,
          /reach\s*out/i,
        ],
      },
      // Automation
      {
        id: 'automation',
        name: 'Automation Builder',
        patterns: [
          /automat/i,
          /save\s*time/i,
          /streamline/i,
          /repetitive\s*tasks?/i,
        ],
      },
      // Content Calendar
      {
        id: 'content-calendar',
        name: 'Content Calendar Planner',
        patterns: [
          /content\s*plan/i,
          /posting\s*schedule/i,
          /content\s*calendar/i,
          /social\s*media\s*plan/i,
        ],
      },

      // ── PaaS / Plug Operations ──────────────────────────────────────
      {
        id: 'paas-catalog',
        name: 'Browse Plug Catalog',
        patterns: [
          /what\s*(tools?|plugs?|agents?)\s*(do\s*you|are|can)/i,
          /show\s*me.*catalog/i,
          /browse.*tools/i,
          /what\s*can\s*(you|i)\s*(deploy|use|install|set\s*up)/i,
          /available\s*(tools?|services?|plugs?)/i,
        ],
      },
      {
        id: 'paas-deploy',
        name: 'Deploy Plug Instance',
        patterns: [
          /deploy\s*(a|an|the)?\s*(plug|tool|agent|instance|container)/i,
          /spin\s*up/i,
          /install\s*(a|an|the)?\s*(tool|agent|service)/i,
          /set\s*up\s*(a|an)?\s*(tool|agent|service|n8n|openclaw)/i,
          /launch\s*(a|an)?\s*(tool|agent|container)/i,
          /\brun\s*(a|an)?\s*(tool|agent|service)\b/i,
        ],
      },
      {
        id: 'paas-status',
        name: 'Check Instance Status',
        patterns: [
          /status\s*of\s*my/i,
          /what('s|\s*is)\s*running/i,
          /my\s*(instances?|services?|containers?)/i,
          /check\s*(on|up\s*on)?\s*my/i,
          /how('s|\s*is)\s*my.*doing/i,
        ],
      },

      // ── Content / Video / UGC Pipeline ──────────────────────────────
      {
        id: 'content-pipeline',
        name: 'Content Generation Pipeline',
        patterns: [
          /make.*video/i,
          /generate.*video/i,
          /create.*content/i,
          /ugc/i,
          /product\s*(video|ad|content)/i,
          /turn.*into.*(video|content|ad)/i,
          /amazon.*link.*video/i,
          /seedance/i,
          /marketing\s*(video|content|campaign)/i,
          /ad\s*(creative|video|content)/i,
          /social\s*(media\s*)?(video|content|ad)/i,
        ],
      },

      // ── Automation / Workflow Pipeline ───────────────────────────────
      {
        id: 'workflow-pipeline',
        name: 'Automation Pipeline Builder',
        patterns: [
          /whenever.*then/i,
          /when.*happens.*do/i,
          /automatically/i,
          /every\s*(day|hour|week|morning|night)/i,
          /schedule/i,
          /trigger\s*when/i,
          /if\s*this\s*then\s*that/i,
          /connect.*to/i,
          /integrate.*with/i,
        ],
      },
    ];

    // ── Vague Intent Refinement ───────────────────────────────────
    // When input is too vague for keyword matching, detect the DOMAIN
    // the user is thinking about and offer guided clarification.
    const VAGUE_INTENT_MAP: Array<{ domain: string; hints: RegExp[]; refinement: string }> = [
      {
        domain: 'creation',
        hints: [/i\s*want\s*to\s*make/i, /i\s*need\s*to\s*create/i, /help\s*me\s*(make|build|create)/i, /can\s*you\s*(make|build|create)/i],
        refinement: 'I can help you create that. Are you looking to: (1) Build an app/website, (2) Generate content/videos, (3) Set up an automation, or (4) Deploy an AI tool?',
      },
      {
        domain: 'money',
        hints: [/make\s*money/i, /earn/i, /income/i, /revenue/i, /profit/i, /sell/i, /charge/i],
        refinement: 'I can help with monetization. Are you looking to: (1) Launch a product/service, (2) Set up payment processing, (3) Build a business plan, or (4) Automate sales/outreach?',
      },
      {
        domain: 'growth',
        hints: [/grow/i, /scale/i, /more\s*(users|customers|traffic)/i, /marketing/i, /get\s*the\s*word\s*out/i],
        refinement: 'Let\'s grow your reach. Are you looking to: (1) Create marketing content, (2) Automate outreach, (3) Build a content calendar, or (4) Set up analytics?',
      },
      {
        domain: 'frustration',
        hints: [/too\s*slow/i, /wasting\s*time/i, /takes\s*forever/i, /boring\s*task/i, /hate\s*doing/i, /repetitive/i],
        refinement: 'Sounds like you need automation. Tell me what task is eating your time and I\'ll set up a workflow to handle it.',
      },
      {
        domain: 'curiosity',
        hints: [/what\s*can\s*you\s*do/i, /how\s*does\s*this\s*work/i, /what\s*is\s*this/i, /tell\s*me\s*about/i],
        refinement: 'I\'m ACHEEVY — I deploy AI tools, build apps, automate workflows, and manage infrastructure. What are you working on? I\'ll match you with the right tools.',
      },
    ];

    // ── Try vertical trigger matching first ────────────────────────
    for (const vertical of VERTICAL_TRIGGERS) {
      if (vertical.patterns.some(p => p.test(message))) {
        res.json({
          intent: `vertical:${vertical.id}`,
          verticalName: vertical.name,
          confidence: 0.9,
          requiresAgent: true,
        });
        return;
      }
    }

    const lower = message.toLowerCase();

    // ── Plug fabrication (build app/site/tool) ────────────────────
    if (/\b(build|create|scaffold|deploy|generate|implement|code|develop|launch)\b/.test(lower)) {
      if (/\b(plug|app|site|website|saas|platform|tool)\b/.test(lower)) {
        res.json({ intent: 'plug-factory:custom', confidence: 0.9, requiresAgent: true });
        return;
      }
      res.json({ intent: 'skill:build', confidence: 0.75, requiresAgent: true });
      return;
    }

    // ── Research intents ──────────────────────────────────────────
    if (/\b(research|analyze|investigate|study|compare|benchmark|audit)\b/.test(lower)) {
      res.json({ intent: 'skill:research', confidence: 0.8, requiresAgent: true });
      return;
    }

    // ── Broad business intent (catches anything the verticals missed) ──
    if (/\b(business|startup|monetize|revenue|scale|profit|income)\b/.test(lower)) {
      res.json({ intent: 'vertical:idea-generator', confidence: 0.7, requiresAgent: true });
      return;
    }

    // ── Per|Form sports analytics ─────────────────────────────────
    if (/\b(draft|prospect|athlete|scout|football|nfl|recruit|big\s*board|mock\s*draft|gridiron)\b/.test(lower)) {
      res.json({ intent: 'perform-stack', confidence: 0.85, requiresAgent: true });
      return;
    }

    // ── PMO/workflow routing ──────────────────────────────────────
    if (/\b(workflow|pipeline|chain|team|assign|delegate)\b/.test(lower)) {
      res.json({ intent: 'pmo-route', confidence: 0.7, requiresAgent: true });
      return;
    }

    // ── Spawn agent ───────────────────────────────────────────────
    if (/\b(spawn|activate|deploy)\s*(an?\s*)?(agent|boomer|ang)\b/.test(lower)) {
      res.json({ intent: 'deployment-hub', confidence: 0.85, requiresAgent: true });
      return;
    }

    // ── Vague intent refinement ─────────────────────────────────
    // User's input didn't match any specific trigger. Try to detect
    // the domain they're thinking about and offer guided refinement.
    for (const vague of VAGUE_INTENT_MAP) {
      if (vague.hints.some(h => h.test(message))) {
        res.json({
          intent: `refine:${vague.domain}`,
          confidence: 0.6,
          requiresAgent: false,
          refinement: vague.refinement,
          domain: vague.domain,
        });
        return;
      }
    }

    // Default: conversational (no agent needed, use LLM stream)
    res.json({ intent: 'conversational', confidence: 0.5, requiresAgent: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Classification failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Chicken Hawk — Execution Engine Proxy
// Forwards manifests to the Chicken Hawk Core service for real execution.
// Command chain: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawk
// --------------------------------------------------------------------------
const CHICKENHAWK_URL = process.env.CHICKENHAWK_URL || 'http://chickenhawk-core:4001';

app.post('/chickenhawk/manifest', async (req, res) => {
  try {
    const manifest = req.body;
    if (!manifest.manifest_id || !manifest.shift_id || !manifest.plan?.waves) {
      res.status(400).json({ error: 'Invalid manifest: requires manifest_id, shift_id, and plan.waves' });
      return;
    }
    logger.info({ manifestId: manifest.manifest_id }, '[CH] Forwarding manifest to Chicken Hawk');
    const chRes = await fetch(`${CHICKENHAWK_URL}/api/manifest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
    });
    const data = await chRes.json();
    res.status(chRes.status).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Chicken Hawk unreachable';
    logger.error({ err }, '[CH] Manifest dispatch error');
    res.status(502).json({ error: `Chicken Hawk unreachable: ${msg}` });
  }
});

app.get('/chickenhawk/status', async (_req, res) => {
  try {
    const chRes = await fetch(`${CHICKENHAWK_URL}/status`);
    const data = await chRes.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Chicken Hawk unreachable' });
  }
});

app.get('/chickenhawk/health', async (_req, res) => {
  try {
    const chRes = await fetch(`${CHICKENHAWK_URL}/health`);
    const data = await chRes.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Chicken Hawk offline' });
  }
});

app.get('/chickenhawk/squads', async (_req, res) => {
  try {
    const chRes = await fetch(`${CHICKENHAWK_URL}/api/squads`);
    const data = await chRes.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Chicken Hawk unreachable' });
  }
});

app.post('/chickenhawk/emergency-stop', async (_req, res) => {
  try {
    logger.warn('[CH] EMERGENCY STOP triggered via gateway');
    const chRes = await fetch(`${CHICKENHAWK_URL}/api/emergency-stop`, { method: 'POST' });
    const data = await chRes.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Chicken Hawk unreachable for emergency stop' });
  }
});

// --------------------------------------------------------------------------
// Verticals — External Tool Integrations (II Agent, II Commons)
// --------------------------------------------------------------------------
app.get('/verticals', (_req, res) => {
  res.json({
    stats: verticalRegistry.getStats(),
    verticals: verticalRegistry.list().map(v => ({
      ...v,
      keyed: verticalRegistry.isKeyed(v.id),
    })),
  });
});

app.get('/verticals/:category', (req, res) => {
  const cat = req.params.category.toUpperCase();
  if (cat !== 'AGENT' && cat !== 'COMMONS') {
    res.status(400).json({ error: 'Category must be AGENT or COMMONS' });
    return;
  }
  res.json({
    category: cat,
    verticals: verticalRegistry.listByCategory(cat).map(v => ({
      ...v,
      keyed: verticalRegistry.isKeyed(v.id),
    })),
  });
});

// --------------------------------------------------------------------------
// Templates — App Archetypes Library
// --------------------------------------------------------------------------
app.get('/templates', (_req, res) => {
  res.json({
    templates: templateLibrary.list(),
    count: templateLibrary.list().length,
  });
});

app.get('/templates/:id', (req, res) => {
  const tmpl = templateLibrary.get(req.params.id);
  if (!tmpl) {
    res.status(404).json({ error: `Template "${req.params.id}" not found` });
    return;
  }
  res.json(tmpl);
});

// --------------------------------------------------------------------------
// Intake — Needs Analysis Engine
// --------------------------------------------------------------------------
app.get('/intake/questions', (req, res) => {
  const archetype = req.query.archetype as string | undefined;
  res.json({ questions: getQuestions(archetype) });
});

app.post('/intake/analyze', (req, res) => {
  try {
    const { responses, description } = req.body;
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'Missing description field' });
      return;
    }
    const analysis = analyzeRequirements(responses || [], description);
    const spec = generateProjectSpec(analysis);
    res.json({ analysis, spec });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Projects — CRUD
// --------------------------------------------------------------------------
app.post('/projects', (req, res) => {
  try {
    const { userId, name, description, responses } = req.body;
    if (!name || typeof name !== 'string' || name.length > 200) {
      res.status(400).json({ error: 'Invalid name: required string, max 200 chars' });
      return;
    }
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'Missing description' });
      return;
    }
    const analysis = analyzeRequirements(responses || [], description);
    const spec = generateProjectSpec(analysis);
    const project = createProject(userId || 'anon', name, description, spec);

    // Auto-start pipeline
    const pipelineState = pipeline.start(project.id);

    res.status(201).json({ project, pipeline: pipelineState });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Project creation failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/projects', (req, res) => {
  const userId = req.query.userId as string | undefined;
  const projects = userId
    ? projectStore.findBy(p => p.userId === userId)
    : projectStore.list();
  res.json({ projects, count: projects.length });
});

app.get('/projects/:id', (req, res) => {
  const project = projectStore.get(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  const pipelineState = pipeline.getState(req.params.id);
  res.json({ project, pipeline: pipelineState || null });
});

app.post('/projects/:id/advance', (req, res) => {
  try {
    const project = projectStore.get(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const result = pipeline.advanceStage(req.params.id);
    res.json({ result, pipeline: pipeline.getState(req.params.id) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pipeline advance failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Plugs — Built Artifacts
// --------------------------------------------------------------------------
app.get('/plugs', (req, res) => {
  const userId = req.query.userId as string | undefined;
  const plugs = userId
    ? plugStore.findBy(p => p.userId === userId)
    : plugStore.list();
  res.json({ plugs, count: plugs.length });
});

app.get('/plugs/:id', (req, res) => {
  const plug = plugStore.get(req.params.id);
  if (!plug) {
    res.status(404).json({ error: 'Plug not found' });
    return;
  }
  const metrics = analytics.getMetrics(req.params.id);
  const deployment = plug.deploymentId ? deploymentStore.get(plug.deploymentId) : null;
  res.json({ plug, metrics, deployment });
});

// --------------------------------------------------------------------------
// Scaffolder — Generate Project Files
// --------------------------------------------------------------------------
app.post('/scaffold', (req, res) => {
  try {
    const { projectId } = req.body;
    const project = projectStore.get(projectId);
    if (!project || !project.spec) {
      res.status(400).json({ error: 'Project not found or missing spec' });
      return;
    }
    const result = scaffolder.scaffold(project.spec, project.name, {
      primaryColor: project.branding?.primaryColor || '#f59e0b',
    });
    res.json({ scaffold: { projectName: result.projectName, totalFiles: result.totalFiles, fileList: result.files.map(f => ({ path: f.path, type: f.type, description: f.description })) } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scaffolding failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Deploy — Multi-Tenant Deployment
// --------------------------------------------------------------------------
app.post('/deploy', (req, res) => {
  try {
    const { plugId, projectName, domain, provider } = req.body;
    if (!plugId || typeof plugId !== 'string') {
      res.status(400).json({ error: 'Missing plugId' });
      return;
    }
    const status = deployer.deploy({
      plugId,
      projectName: projectName || 'aims-plug',
      provider: provider || 'docker',
      domain,
      port: 0, // auto-assigned
      envVars: {},
      sslEnabled: !!domain,
    });
    res.status(201).json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Deployment failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/deployments', (_req, res) => {
  res.json({ deployments: deployer.listAll() });
});

app.get('/deployments/:id', (req, res) => {
  const status = deployer.getStatus(req.params.id);
  if (!status) {
    res.status(404).json({ error: 'Deployment not found' });
    return;
  }
  res.json(status);
});

app.post('/deployments/:id/stop', (req, res) => {
  const status = deployer.stop(req.params.id);
  if (!status) {
    res.status(404).json({ error: 'Deployment not found' });
    return;
  }
  res.json(status);
});

// --------------------------------------------------------------------------
// Integrations — Third-Party Connectors
// --------------------------------------------------------------------------
app.get('/integrations', (req, res) => {
  const category = req.query.category as string | undefined;
  if (category) {
    res.json({ integrations: integrationRegistry.getByCategory(category as Parameters<typeof integrationRegistry.getByCategory>[0]) });
  } else {
    res.json({ integrations: integrationRegistry.list(), stats: integrationRegistry.getStats() });
  }
});

app.get('/integrations/:id', (req, res) => {
  const integration = integrationRegistry.get(req.params.id);
  if (!integration) {
    res.status(404).json({ error: `Integration "${req.params.id}" not found` });
    return;
  }
  res.json(integration);
});

// --------------------------------------------------------------------------
// Analytics — Per-Plug Metrics
// --------------------------------------------------------------------------
app.get('/analytics/:plugId', (req, res) => {
  const metrics = analytics.getMetrics(req.params.plugId);
  res.json(metrics);
});

app.get('/analytics/:plugId/daily', (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const stats = analytics.getDailyStats(req.params.plugId, days);
  res.json({ plugId: req.params.plugId, days, stats });
});

// --------------------------------------------------------------------------
// Make It Mine — Clone & Customize Engine
// --------------------------------------------------------------------------
app.post('/make-it-mine/clone', (req, res) => {
  try {
    const result = makeItMine.clone(req.body);
    res.status(201).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Clone failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/make-it-mine/suggest', (req, res) => {
  const templateId = req.query.templateId as string;
  const industry = req.query.industry as string;
  if (!templateId || !industry) {
    res.status(400).json({ error: 'templateId and industry query params required' });
    return;
  }
  const suggestions = makeItMine.suggestCustomizations(templateId, industry);
  res.json(suggestions);
});

// --------------------------------------------------------------------------
// Pipeline — Active Build Pipelines
// --------------------------------------------------------------------------
app.get('/pipelines', (_req, res) => {
  res.json({ active: pipeline.listActive() });
});

app.get('/pipelines/:projectId', (req, res) => {
  const state = pipeline.getState(req.params.projectId);
  if (!state) {
    res.status(404).json({ error: 'Pipeline not found' });
    return;
  }
  res.json(state);
});

// --------------------------------------------------------------------------
// Billing — 3-6-9 Pricing Model
// --------------------------------------------------------------------------
app.get('/billing/tiers', (_req, res) => {
  res.json({ tiers: TIER_CONFIGS, taskMultipliers: BILLING_MULTIPLIERS, pillars: PILLAR_CONFIGS });
});

app.post('/billing/check-allowance', (req, res) => {
  const { tierId, monthlyUsedTokens } = req.body;
  if (!tierId) {
    res.status(400).json({ error: 'Missing tierId' });
    return;
  }
  const allowance = checkAllowance(tierId, monthlyUsedTokens || 0);
  res.json(allowance);
});

app.post('/billing/pillar-addon', (req, res) => {
  const { confidence, convenience, security } = req.body;
  const addon = calculatePillarAddon(
    confidence || 'standard',
    convenience || 'standard',
    security || 'standard',
  );
  res.json(addon);
});

app.post('/billing/check-agents', (req, res) => {
  const { tierId, activeAgents } = req.body;
  if (!tierId) {
    res.status(400).json({ error: 'Missing tierId' });
    return;
  }
  const result = checkAgentLimit(tierId, activeAgents || 0);
  res.json(result);
});

// Provision tier — called by Stripe webhook after checkout/subscription events
const provisionedTiers = new Map<string, { tierId: string; tierName: string; stripeCustomerId: string; stripeSubscriptionId: string; provisionedAt: string }>();

app.post('/billing/provision', (req, res) => {
  const { userId, tierId, tierName, stripeCustomerId, stripeSubscriptionId, provisionedAt, reason } = req.body;
  if (!userId || !tierId) {
    res.status(400).json({ error: 'Missing userId or tierId' });
    return;
  }

  provisionedTiers.set(userId, {
    tierId,
    tierName: tierName || tierId,
    stripeCustomerId: stripeCustomerId || '',
    stripeSubscriptionId: stripeSubscriptionId || '',
    provisionedAt: provisionedAt || new Date().toISOString(),
  });

  logger.info({ userId, tierId, tierName, reason }, '[Billing] Tier provisioned');
  res.json({ success: true, userId, tierId, tierName, provisionedAt });
});

app.get('/billing/provision', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  const tier = provisionedTiers.get(userId);
  if (!tier) {
    res.json({ userId, tierId: 'p2p', tierName: 'Pay-per-Use', provisioned: false });
    return;
  }
  res.json({ userId, ...tier, provisioned: true });
});

// --------------------------------------------------------------------------
// Lil_Hawks — Squad profiles
// --------------------------------------------------------------------------
app.get('/lil-hawks', (_req, res) => {
  res.json({
    squads: {
      'prep-squad-alpha': PREP_SQUAD_PROFILES,
      'workflow-smith': SQUAD_PROFILES,
      'vision-scout': VISION_SQUAD_PROFILES,
      'json-expert': JSON_SQUAD_PROFILES,
    },
  });
});

// --------------------------------------------------------------------------
// Custom Lil_Hawks — User-Created Bots
// Users can create their own Lil_Hawks with custom names and specialties.
// "Lil_Increase_My_Money_Hawk", "Lil_Grade_My_Essay_Hawk", etc.
// --------------------------------------------------------------------------
app.post('/custom-hawks', (req, res) => {
  try {
    const { userId, spec } = req.body as { userId: string; spec: CustomHawkSpec };
    if (!userId || !spec) {
      res.status(400).json({ error: 'Missing userId or spec' });
      return;
    }
    const result = createCustomHawk(userId, spec);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Custom hawk creation failed';
    logger.error({ err }, '[CustomHawks] Create error');
    res.status(500).json({ error: msg });
  }
});

app.get('/custom-hawks', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query param' });
    return;
  }
  res.json(listUserHawks(userId));
});

app.get('/custom-hawks/domains', (_req, res) => {
  res.json({ domains: getAvailableDomains(), tools: getAvailableTools() });
});

app.get('/custom-hawks/stats', (_req, res) => {
  res.json(getHawkGlobalStats());
});

app.get('/custom-hawks/:hawkId', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query param' });
    return;
  }
  const hawk = getHawk(req.params.hawkId, userId);
  if (!hawk) {
    res.status(404).json({ error: 'Hawk not found' });
    return;
  }
  res.json({ hawk });
});

app.patch('/custom-hawks/:hawkId/status', (req, res) => {
  const { userId, status } = req.body as { userId: string; status: 'active' | 'paused' | 'retired' };
  if (!userId || !status) {
    res.status(400).json({ error: 'Missing userId or status' });
    return;
  }
  const hawk = updateHawkStatus(req.params.hawkId, userId, status);
  if (!hawk) {
    res.status(404).json({ error: 'Hawk not found or not authorized' });
    return;
  }
  res.json({ hawk });
});

app.delete('/custom-hawks/:hawkId', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query param' });
    return;
  }
  const deleted = deleteHawk(req.params.hawkId, userId);
  if (!deleted) {
    res.status(404).json({ error: 'Hawk not found or not authorized' });
    return;
  }
  res.json({ deleted: true });
});

app.post('/custom-hawks/:hawkId/execute', async (req, res) => {
  try {
    const { userId, message, context } = req.body as HawkExecutionRequest;
    if (!userId || !message) {
      res.status(400).json({ error: 'Missing userId or message' });
      return;
    }
    const result = await executeHawk({
      hawkId: req.params.hawkId,
      userId,
      message,
      context,
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hawk execution failed';
    logger.error({ err }, '[CustomHawks] Execute error');
    res.status(500).json({ error: msg });
  }
});

app.get('/custom-hawks/:hawkId/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json({ executions: getHawkExecutionHistory(req.params.hawkId, limit) });
});

// --------------------------------------------------------------------------
// Playground/Sandbox — Isolated Execution Environments
// Code sandboxes, prompt testing, agent testing, training data, education
// --------------------------------------------------------------------------
app.post('/playground', (req, res) => {
  try {
    const request = req.body as CreatePlaygroundRequest;
    if (!request.userId || !request.type || !request.name || !request.config) {
      res.status(400).json({ error: 'Missing required fields: userId, type, name, config' });
      return;
    }
    const result = createPlayground(request);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Playground creation failed';
    logger.error({ err }, '[Playground] Create error');
    res.status(500).json({ error: msg });
  }
});

app.get('/playground', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query param' });
    return;
  }
  res.json({ sessions: listPlaygrounds(userId) });
});

app.get('/playground/stats', (_req, res) => {
  res.json(getPlaygroundStats());
});

app.get('/playground/:sessionId', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query param' });
    return;
  }
  const session = getPlayground(req.params.sessionId, userId);
  if (!session) {
    res.status(404).json({ error: 'Playground session not found' });
    return;
  }
  res.json({ session });
});

app.post('/playground/:sessionId/execute', async (req, res) => {
  try {
    const { userId, input, target } = req.body as ExecuteInPlaygroundRequest;
    if (!userId || !input) {
      res.status(400).json({ error: 'Missing userId or input' });
      return;
    }
    const result = await executeInPlayground({
      sessionId: req.params.sessionId,
      userId,
      input,
      target,
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Playground execution failed';
    logger.error({ err }, '[Playground] Execute error');
    res.status(500).json({ error: msg });
  }
});

app.post('/playground/:sessionId/pause', (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  res.json(pausePlayground(req.params.sessionId, userId));
});

app.post('/playground/:sessionId/resume', (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  res.json(resumePlayground(req.params.sessionId, userId));
});

app.post('/playground/:sessionId/complete', (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  res.json(completePlayground(req.params.sessionId, userId));
});

app.post('/playground/:sessionId/files', (req, res) => {
  const { userId, file } = req.body as { userId: string; file: { path: string; content: string; language: string } };
  if (!userId || !file) {
    res.status(400).json({ error: 'Missing userId or file' });
    return;
  }
  const result = addFile(req.params.sessionId, userId, {
    ...file,
    sizeBytes: file.content.length,
    lastModified: new Date().toISOString(),
  });
  res.json(result);
});

// --------------------------------------------------------------------------
// Shelving System — First-Class Data Collections (Firestore + Memory)
// All shelves: projects, luc_projects, plugs, boomer_angs, workflows,
// runs, logs, assets
// --------------------------------------------------------------------------
app.use(shelfRouter);

// --------------------------------------------------------------------------
// Plug Catalog & Instance Management — PaaS Operations
// --------------------------------------------------------------------------
app.use('/api', plugRouter);

// --------------------------------------------------------------------------
// LUC Project Service — Pricing & Effort Oracle
// --------------------------------------------------------------------------
app.post('/luc/project', async (req, res) => {
  try {
    const { projectId, userId, scope, requirements, models } = req.body;
    if (!projectId || !userId || !scope) {
      res.status(400).json({ error: 'Missing required fields: projectId, userId, scope' });
      return;
    }
    const lucProject = await lucProjectService.createLucProject({
      projectId,
      userId,
      scope,
      requirements: requirements || '',
      requestedModels: models,
    });
    res.status(201).json({ lucProject });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LUC project creation failed';
    logger.error({ err }, '[LUC] Project creation error');
    res.status(500).json({ error: msg });
  }
});

app.post('/luc/estimate-project', async (req, res) => {
  try {
    const { scope, models } = req.body;
    if (!scope || typeof scope !== 'string') {
      res.status(400).json({ error: 'Missing scope field' });
      return;
    }
    const estimate = await lucProjectService.estimate(scope, models);
    res.json({ estimate });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LUC estimation failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/luc/project/:id', async (req, res) => {
  try {
    const project = await lucProjectService.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'LUC project not found' });
      return;
    }
    res.json({ lucProject: project });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LUC project retrieval failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// MCP Tool Definitions — Exposed for agent discovery
// --------------------------------------------------------------------------
app.get('/mcp/tools', (_req, res) => {
  res.json({ tools: allShelfTools, count: allShelfTools.length });
});

// --------------------------------------------------------------------------
// OSS Models — Self-hosted model catalog
// --------------------------------------------------------------------------
app.get('/llm/oss-models', (_req, res) => {
  res.json({
    configured: ossModels.isConfigured(),
    models: ossModels.listModels(),
  });
});

// --------------------------------------------------------------------------
// Personaplex — Voice agent status
// --------------------------------------------------------------------------
app.get('/personaplex/status', (_req, res) => {
  res.json({ configured: personaplex.isConfigured() });
});

app.post('/personaplex/speak', async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Missing text field' });
      return;
    }
    const result = await personaplex.speak(text, sessionId);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Personaplex speak failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Pillar 1 — Requirements Rigor (Risk, DoD, Acceptance Criteria)
// --------------------------------------------------------------------------
app.post('/requirements/risk', (req, res) => {
  try {
    const { complexity, features, integrations, scale } = req.body;
    if (!complexity) {
      res.status(400).json({ error: 'Missing complexity field' });
      return;
    }
    const assessment = riskAssessor.assessRisk({ complexity, features: features || [], integrations: integrations || [], scale: scale || 'personal' });
    res.json(assessment);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Risk assessment failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/requirements/dod', (req, res) => {
  try {
    const { spec, riskLevel } = req.body;
    if (!spec) {
      res.status(400).json({ error: 'Missing spec field' });
      return;
    }
    const checklist = definitionOfDone.generate(spec, riskLevel || 'low');
    res.json(checklist);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DoD generation failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/requirements/acceptance', (req, res) => {
  try {
    const { feature, archetype } = req.body;
    if (!feature) {
      res.status(400).json({ error: 'Missing feature field' });
      return;
    }
    const criteria = acceptanceCriteria.generate(feature, archetype || 'custom');
    res.json({ feature, criteria });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Acceptance criteria generation failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Pillar 3 — Authorization (Ownership + Roles)
// --------------------------------------------------------------------------
app.get('/auth/roles/:projectId', (req, res) => {
  const roles = ownershipEnforcer.listRoles(req.params.projectId);
  res.json({ projectId: req.params.projectId, roles });
});

app.post('/auth/roles', (req, res) => {
  try {
    const { projectId, userId, role } = req.body;
    if (!projectId || !userId || !role) {
      res.status(400).json({ error: 'Missing projectId, userId, or role' });
      return;
    }
    ownershipEnforcer.grantRole(projectId, userId, role);
    res.json({ granted: true, projectId, userId, role });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Role grant failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/auth/check', (req, res) => {
  const { userId, projectId, permission } = req.body;
  if (!userId || !projectId || !permission) {
    res.status(400).json({ error: 'Missing userId, projectId, or permission' });
    return;
  }
  const result = ownershipEnforcer.checkProjectAccess(userId, projectId, permission);
  res.json(result);
});

// --------------------------------------------------------------------------
// Pillar 5 — Secrets Management
// --------------------------------------------------------------------------
app.get('/secrets/audit', (_req, res) => {
  res.json(secrets.audit());
});

app.get('/secrets/validate', (_req, res) => {
  res.json(secrets.validateRequired());
});

app.get('/secrets/keys', (_req, res) => {
  res.json({ keys: secrets.listKeys() });
});

app.get('/secrets/rotation/:key', (req, res) => {
  const history = secrets.getRotationHistory(req.params.key);
  res.json({ key: req.params.key, history });
});

// --------------------------------------------------------------------------
// Pillar 6 — Supply Chain Security
// --------------------------------------------------------------------------
app.get('/supply-chain/sbom', (_req, res) => {
  try {
    const sbom = supplyChain.generateSBOM();
    res.json(sbom);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SBOM generation failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/supply-chain/lockfile', (_req, res) => {
  try {
    const result = supplyChain.verifyLockfile();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lockfile verification failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/supply-chain/audit', (_req, res) => {
  try {
    const result = supplyChain.runAudit();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Audit failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/supply-chain/report', (_req, res) => {
  try {
    const report = supplyChain.getReport();
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Report generation failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Pillar 7 — Execution Safety (Sandbox)
// --------------------------------------------------------------------------
app.post('/sandbox/config', (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName || typeof projectName !== 'string') {
      res.status(400).json({ error: 'Missing projectName' });
      return;
    }
    const config = sandboxEnforcer.generateSandboxConfig(projectName);
    res.json(config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sandbox config generation failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/sandbox/validate', (req, res) => {
  try {
    const result = sandboxEnforcer.validateSandbox(req.body);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sandbox validation failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/sandbox/posture', (_req, res) => {
  res.json(sandboxEnforcer.getSecurityPosture());
});

app.get('/sandbox/seccomp', (_req, res) => {
  res.json(sandboxEnforcer.generateSeccompProfile());
});

// --------------------------------------------------------------------------
// Pillar 9 — Security Testing
// --------------------------------------------------------------------------
app.get('/security/sast', async (_req, res) => {
  try {
    const result = await securityTester.runSAST();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SAST scan failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/security/sca', (_req, res) => {
  try {
    const result = securityTester.runSCA();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SCA scan failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/security/input-validation', async (_req, res) => {
  try {
    const result = await securityTester.runInputValidation();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Input validation scan failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/security/report', async (_req, res) => {
  try {
    const report = await securityTester.runFullScan();
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Security scan failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Pillar 10 — Observability (Alerts, Metrics)
// --------------------------------------------------------------------------
app.get('/observability/alerts', (_req, res) => {
  res.json({ active: alertEngine.getActiveAlerts(), history: alertEngine.getAlertHistory(50) });
});

app.post('/observability/alerts/acknowledge', (req, res) => {
  const { alertId } = req.body;
  if (!alertId) {
    res.status(400).json({ error: 'Missing alertId' });
    return;
  }
  alertEngine.acknowledge(alertId);
  res.json({ acknowledged: true, alertId });
});

app.get('/observability/metrics', (_req, res) => {
  res.json(metricsExporter.exportJSON());
});

app.get('/observability/metrics/prometheus', (_req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metricsExporter.exportPrometheus());
});

// --------------------------------------------------------------------------
// Pillar 11 — Release Engineering
// --------------------------------------------------------------------------
app.get('/releases', (_req, res) => {
  res.json({ releases: releaseManager.listReleases() });
});

app.post('/releases', (req, res) => {
  try {
    const { version, changelog, artifacts } = req.body;
    if (!version || typeof version !== 'string') {
      res.status(400).json({ error: 'Missing version' });
      return;
    }
    const release = releaseManager.createRelease(version, changelog || '', artifacts || []);
    res.status(201).json(release);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Release creation failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/releases/:id', (req, res) => {
  const release = releaseManager.getRelease(req.params.id);
  if (!release) {
    res.status(404).json({ error: 'Release not found' });
    return;
  }
  res.json(release);
});

app.post('/releases/:id/promote', (req, res) => {
  try {
    const { from, to } = req.body;
    const result = releaseManager.promote(req.params.id, from, to);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Promotion failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/releases/rollback', (req, res) => {
  try {
    const { environment } = req.body;
    if (!environment) {
      res.status(400).json({ error: 'Missing environment' });
      return;
    }
    const result = releaseManager.rollback(environment);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Rollback failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/environments', (_req, res) => {
  const envs = (['development', 'staging', 'production'] as const).map(env => releaseManager.getEnvironmentState(env));
  res.json({ environments: envs });
});

app.get('/releases/api/versions', (_req, res) => {
  res.json({ versions: releaseManager.getActiveVersions() });
});

// --------------------------------------------------------------------------
// Pillar 12 — Backup & Restore + Incidents
// --------------------------------------------------------------------------
app.post('/backups', (_req, res) => {
  try {
    const backup = backupManager.createBackup();
    res.status(201).json(backup);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Backup failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/backups', (_req, res) => {
  res.json({ backups: backupManager.listBackups() });
});

app.post('/backups/:id/restore', (req, res) => {
  try {
    const result = backupManager.restoreBackup(req.params.id);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Restore failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/backups/drill', (_req, res) => {
  try {
    const result = backupManager.runRestoreDrill();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Restore drill failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/backups/drill/status', (_req, res) => {
  const lastDrill = backupManager.getLastDrillResult();
  const schedule = backupManager.getDrillSchedule();
  res.json({ lastDrill, schedule });
});

// Incidents
app.post('/incidents', (req, res) => {
  try {
    const { severity, title, description } = req.body;
    if (!severity || !title) {
      res.status(400).json({ error: 'Missing severity or title' });
      return;
    }
    const incident = incidentManager.createIncident(severity, title, description || '');
    res.status(201).json(incident);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Incident creation failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/incidents', (req, res) => {
  const status = req.query.status as string | undefined;
  const severity = req.query.severity as string | undefined;
  const filter: Record<string, string> = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  res.json({ incidents: incidentManager.listIncidents(Object.keys(filter).length > 0 ? filter as any : undefined) });
});

app.post('/incidents/:id/update', (req, res) => {
  try {
    const incident = incidentManager.updateIncident(req.params.id, req.body);
    res.json(incident);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Incident update failed';
    res.status(500).json({ error: msg });
  }
});

app.post('/incidents/:id/resolve', (req, res) => {
  try {
    const { resolution } = req.body;
    const incident = incidentManager.resolveIncident(req.params.id, resolution || 'Resolved');
    res.json(incident);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Incident resolution failed';
    res.status(500).json({ error: msg });
  }
});

app.get('/incidents/runbook/:severity', (req, res) => {
  const runbook = incidentManager.getRunbook(req.params.severity as any);
  res.json({ severity: req.params.severity, steps: runbook });
});

// --------------------------------------------------------------------------
// Audit Trail
// --------------------------------------------------------------------------
app.get('/audit', (req, res) => {
  const actor = req.query.actor as string | undefined;
  const records = actor
    ? auditStore.findBy(r => r.actor === actor)
    : auditStore.list();
  res.json({ records, count: records.length });
});

// --------------------------------------------------------------------------
// Evidence Locker
// --------------------------------------------------------------------------
app.get('/evidence', (req, res) => {
  const projectId = req.query.projectId as string | undefined;
  const records = projectId
    ? evidenceStore.findBy(r => r.projectId === projectId)
    : evidenceStore.list();
  res.json({ records, count: records.length });
});

app.get('/evidence/:gateId', (req, res) => {
  const records = evidenceStore.findBy(r => r.gateId === req.params.gateId);
  res.json({ gateId: req.params.gateId, records, count: records.length });
});

// --------------------------------------------------------------------------
// Intent-specific execution plan generation
// --------------------------------------------------------------------------
function buildExecutionPlan(intent: string, _query: string): { steps: string[]; estimatedDuration: string } {
  switch (intent) {
    case 'CHAT':
      return {
        steps: [
          'Parse natural language via AVVA NOON',
          'Retrieve relevant context from ByteRover',
          'Generate conversational response',
          'Attach LUC quote for any actionable items'
        ],
        estimatedDuration: '15 seconds'
      };
    case 'BUILD_PLUG':
      return {
        steps: [
          'Analyze build spec via AVVA NOON',
          'Check existing patterns in ByteRover',
          'Delegate sub-tasks to Boomer_Ang team',
          'Execute build via Chicken Hawk',
          'Run ORACLE 7-Gate verification',
          'Package and deploy Plug artifact'
        ],
        estimatedDuration: '5 minutes'
      };
    case 'RESEARCH':
      return {
        steps: [
          'Decompose research query',
          'Retrieve known context from ByteRover',
          'Dispatch Analyst_Ang for data gathering',
          'Compile findings and verify via ORACLE'
        ],
        estimatedDuration: '3 minutes'
      };
    case 'AGENTIC_WORKFLOW':
      return {
        steps: [
          'Parse workflow definition via AVVA NOON',
          'Validate dependencies and ordering',
          'Provision Boomer_Ang agents for each stage',
          'Execute pipeline with LUC metering',
          'Run ORACLE 7-Gate post-flight checks',
          'Deliver final artifacts and settlement'
        ],
        estimatedDuration: '10 minutes'
      };
    case 'ESTIMATE_ONLY':
    default:
      return {
        steps: [
          'Analyze intent via AVVA NOON',
          'Check existing patterns in ByteRover',
          'Generate LUC cost estimate'
        ],
        estimatedDuration: '5 seconds'
      };
  }
}

// --------------------------------------------------------------------------
// Intent-specific response message
// --------------------------------------------------------------------------
function buildResponseMessage(intent: string, oraclePassed: boolean, agentExecuted: boolean): string {
  if (!oraclePassed) {
    return 'ORACLE pre-flight check flagged issues. Review gate failures before proceeding.';
  }
  const suffix = agentExecuted ? ' Agents have executed the task.' : '';
  switch (intent) {
    case 'CHAT':
      return `ACHEEVY received your message. Here is the analysis and cost estimate for any actionable items detected.${suffix}`;
    case 'BUILD_PLUG':
      return `Build request accepted. Execution plan generated and LUC quote attached.${suffix}`;
    case 'RESEARCH':
      return `Research request queued. Analyst_Ang will compile findings. LUC estimate attached.${suffix}`;
    case 'AGENTIC_WORKFLOW':
      return `Workflow pipeline validated. Multi-stage execution plan ready.${suffix}`;
    case 'ESTIMATE_ONLY':
    default:
      return 'UEF processed request. LUC Quote generated.';
  }
}

// --------------------------------------------------------------------------
// ACP Ingress (Layer 1)
// --------------------------------------------------------------------------
app.post('/ingress/acp', acpLimiter, async (req, res) => {
  try {
    const rawBody = req.body;

    // Assign guest userId if none provided
    if (!rawBody.userId || rawBody.userId === 'anon') {
      rawBody.userId = 'guest';
    }

    // Validate message input
    if (!rawBody.message || typeof rawBody.message !== 'string') {
      res.status(400).json({ status: 'ERROR', message: 'Missing or invalid message field' });
      return;
    }
    if (rawBody.message.length > 10000) {
      res.status(400).json({ status: 'ERROR', message: 'Message exceeds 10,000 character limit' });
      return;
    }

    const VALID_INTENTS = ['CHAT', 'BUILD_PLUG', 'RESEARCH', 'AGENTIC_WORKFLOW', 'ESTIMATE_ONLY'];
    const intent = rawBody.intent || 'ESTIMATE_ONLY';
    if (!VALID_INTENTS.includes(intent)) {
      res.status(400).json({ status: 'ERROR', message: `Invalid intent: ${intent}` });
      return;
    }

    const acpReq: ACPStandardizedRequest = {
      reqId: uuidv4(),
      userId: rawBody.userId || 'anon',
      sessionId: rawBody.sessionId || 'sched-1',
      timestamp: new Date().toISOString(),
      intent,
      naturalLanguage: rawBody.message,
      channel: 'WEB',
      budget: rawBody.budget,
      metadata: rawBody.metadata
    };

    logger.info({ reqId: acpReq.reqId, intent: acpReq.intent, userId: acpReq.userId }, '[UEF] Received ACP Request');

    // 1. PREP_SQUAD_ALPHA — Pre-execution intelligence pipeline
    const prepPacket = await runPrepSquad(acpReq.naturalLanguage, acpReq.reqId);

    // 2. Build execution plan (enriched by prep packet)
    const executionPlan = buildExecutionPlan(acpReq.intent, acpReq.naturalLanguage);

    // 3. LUC cost estimate
    const quote = LUCEngine.estimate(acpReq.naturalLanguage);

    // 4. ORACLE 7-Gate pre-flight
    const oracleResult = await Oracle.runGates(
      { intent: acpReq.intent, query: acpReq.naturalLanguage, budget: acpReq.budget },
      { quote }
    );

    logger.info({ passed: oracleResult.passed, score: oracleResult.score }, '[UEF] ORACLE result');

    // 5. Agent dispatch (only if ORACLE passes AND policy is cleared)
    let agentResult = { executed: false, agentOutputs: [] as Array<{ status: string; agentId: string; result: { summary: string; artifacts: string[] } }>, primaryAgent: null as string | null };
    if (oracleResult.passed && prepPacket.policyManifest.cleared) {
      agentResult = await routeToAgents(
        acpReq.intent,
        acpReq.naturalLanguage,
        executionPlan.steps,
        acpReq.reqId
      );
    }

    // 6. Construct response
    const response: ACPResponse = {
      reqId: acpReq.reqId,
      status: oracleResult.passed ? 'SUCCESS' : 'ERROR',
      message: buildResponseMessage(acpReq.intent, oracleResult.passed, agentResult.executed),
      quote: quote,
      executionPlan: executionPlan,
    };

    // Attach prep intelligence + agent outputs
    const payload: Record<string, unknown> = { ...response };
    payload.prepIntelligence = {
      packetId: prepPacket.packetId,
      signals: prepPacket.normalizedIntent.signals,
      taskCount: prepPacket.taskGraph.totalNodes,
      riskLevel: prepPacket.policyManifest.riskLevel,
      tokenClass: prepPacket.costEstimate.tokenClass,
      engine: prepPacket.routingDecision.engine,
      executionOwner: prepPacket.routingDecision.executionOwner,
      cleared: prepPacket.policyManifest.cleared,
    };

    if (agentResult.executed) {
      payload.agentResults = {
        primaryAgent: agentResult.primaryAgent,
        outputs: agentResult.agentOutputs.map(o => ({
          agentId: o.agentId,
          status: o.status,
          summary: o.result.summary,
          artifacts: o.result.artifacts,
        })),
      };
    }

    res.json(payload);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'ACP Ingress Error');
    res.status(500).json({ status: 'ERROR', message });
  }
});

// --------------------------------------------------------------------------
// n8n Management — Workflow Deploy, Activate, List, Health
// --------------------------------------------------------------------------

const n8nClient = new N8nClient();

// n8n health check
app.get('/n8n/health', async (_req, res) => {
  try {
    const health = await n8nClient.healthCheck();
    res.json(health);
  } catch (err) {
    res.json({ ok: false, error: err instanceof Error ? err.message : 'Health check failed' });
  }
});

// List n8n workflows
app.get('/n8n/workflows', async (_req, res) => {
  try {
    const workflows = await n8nClient.listWorkflows();
    res.json({ workflows, count: workflows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list workflows';
    res.status(500).json({ error: msg });
  }
});

// Deploy a workflow to n8n
app.post('/n8n/workflows/deploy', async (req, res) => {
  try {
    const { workflowJson } = req.body;
    if (!workflowJson) {
      res.status(400).json({ error: 'Missing workflowJson in body' });
      return;
    }
    const result = await n8nClient.deployWorkflow(workflowJson);
    res.status(201).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Workflow deploy failed';
    res.status(500).json({ error: msg });
  }
});

// Activate a workflow on n8n
app.post('/n8n/workflows/:workflowId/activate', async (req, res) => {
  try {
    await n8nClient.activateWorkflow(req.params.workflowId);
    res.json({ success: true, workflowId: req.params.workflowId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Workflow activation failed';
    res.status(500).json({ error: msg });
  }
});

// Trigger PMO pipeline via n8n (or local fallback)
app.post('/n8n/trigger', async (req, res) => {
  try {
    const { userId, message, context } = req.body;
    if (!userId || !message) {
      res.status(400).json({ error: 'Missing userId or message' });
      return;
    }
    const result = await n8nClient.triggerPmoWorkflow({ userId, message, context });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'n8n trigger failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Memory System — Persistent Agent Memory
// --------------------------------------------------------------------------

const memoryEngine = getMemoryEngine();

// Remember: store a memory
app.post('/memory/remember', (req, res) => {
  try {
    const input = req.body as RememberInput;
    if (!input.userId || !input.summary || !input.content || !input.type) {
      res.status(400).json({ error: 'Missing required fields: userId, type, summary, content' });
      return;
    }
    const memory = memoryEngine.remember(input);
    res.status(201).json({ success: true, memory });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory store failed';
    logger.error({ err }, '[Memory] Remember error');
    res.status(500).json({ error: msg });
  }
});

// Recall: search memories by query
app.post('/memory/recall', (req, res) => {
  try {
    const query = req.body as RecallQuery;
    if (!query.userId || !query.query) {
      res.status(400).json({ error: 'Missing required fields: userId, query' });
      return;
    }
    const result = memoryEngine.recall(query);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory recall failed';
    logger.error({ err }, '[Memory] Recall error');
    res.status(500).json({ error: msg });
  }
});

// Feedback: apply feedback signal to a memory
app.post('/memory/feedback', (req, res) => {
  try {
    const feedback = req.body as MemoryFeedback;
    if (!feedback.memoryId || !feedback.signal) {
      res.status(400).json({ error: 'Missing required fields: memoryId, signal' });
      return;
    }
    memoryEngine.feedback(feedback);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory feedback failed';
    res.status(500).json({ error: msg });
  }
});

// List memories for a user
app.get('/memory', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId query parameter' });
      return;
    }
    const type = req.query.type as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const memories = memoryEngine.listMemories(userId, {
      type: type as any,
      projectId,
      limit,
    });
    res.json({ memories, count: memories.length, userId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory list failed';
    res.status(500).json({ error: msg });
  }
});

// Get memory stats for a user
app.get('/memory/stats', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId query parameter' });
      return;
    }
    const stats = memoryEngine.getStats(userId);
    res.json(stats);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory stats failed';
    res.status(500).json({ error: msg });
  }
});

// Delete a memory
app.delete('/memory/:memoryId', (req, res) => {
  try {
    const deleted = memoryEngine.deleteMemory(req.params.memoryId);
    res.json({ success: deleted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory delete failed';
    res.status(500).json({ error: msg });
  }
});

/// Maintenance: purge expired + decay relevance + evict over-cap
app.post('/memory/maintenance', (_req, res) => {
  try {
    const result = memoryEngine.runMaintenance();
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Memory maintenance failed';
    res.status(500).json({ error: msg });
  }
});

// Store a user preference
app.post('/memory/preference', (req, res) => {
  try {
    const { userId, key, value, context } = req.body;
    if (!userId || !key || !value) {
      res.status(400).json({ error: 'Missing required fields: userId, key, value' });
      return;
    }
    const memory = memoryEngine.rememberPreference(userId, key, value, context);
    res.status(201).json({ success: true, memory });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Preference store failed';
    res.status(500).json({ error: msg });
  }
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
export const server = app.listen(PORT, () => {
  const agents = registry.list();
  logger.info({ port: PORT, agents: agents.length }, 'UEF Gateway (Layer 2) running');
  logger.info(`Agents online: ${agents.map(a => a.name).join(', ')}`);
  logger.info(`ACP Ingress available at http://localhost:${PORT}/ingress/acp`);
});

// --------------------------------------------------------------------------
// Graceful Shutdown — let Docker stop containers cleanly
// --------------------------------------------------------------------------
function shutdown(signal: string) {
  logger.info({ signal }, '[UEF] Received shutdown signal, draining connections...');
  stopCleanupSchedule();
  memoryEngine.stopMaintenance();
  server.close(() => {
    closeDb();
    logger.info('[UEF] All connections drained. DB closed. Exiting.');
    process.exit(0);
  });
  // Force exit after 10s if connections don't drain
  setTimeout(() => {
    logger.warn('[UEF] Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
