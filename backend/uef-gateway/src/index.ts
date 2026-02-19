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
import logger from './logger';

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
// Apply API key gate to ALL subsequent routes
// --------------------------------------------------------------------------
app.use(requireApiKey);

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
    const { model, messages, max_tokens, temperature, agentId, userId, sessionId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Missing or empty messages array' });
      return;
    }
    const result = await llmGateway.chat({ model, messages, max_tokens, temperature, agentId, userId, sessionId });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM chat failed';
    logger.error({ err }, '[LLM] Chat error');
    res.status(500).json({ error: msg });
  }
});

app.post('/llm/stream', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature, agentId, userId, sessionId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Missing or empty messages array' });
      return;
    }

    const { stream, provider, model: resolvedModel } = await llmGateway.stream({ model, messages, max_tokens, temperature, agentId, userId, sessionId });

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
      userId: userId || 'web-user',
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

    // Intent classification based on keywords
    const lower = message.toLowerCase();

    // Check for build/engineering intents
    if (/\b(build|create|scaffold|deploy|generate|implement|code|develop|launch|mvp)\b/.test(lower)) {
      if (/\b(plug|app|site|website|saas|platform|tool)\b/.test(lower)) {
        res.json({ intent: 'plug-factory:custom', confidence: 0.9, requiresAgent: true });
        return;
      }
      res.json({ intent: 'skill:build', confidence: 0.75, requiresAgent: true });
      return;
    }

    // Check for research intents
    if (/\b(research|analyze|investigate|study|compare|benchmark|audit)\b/.test(lower)) {
      res.json({ intent: 'skill:research', confidence: 0.8, requiresAgent: true });
      return;
    }

    // Check for vertical/business intents
    if (/\b(business|startup|entrepreneur|side hustle|monetize|revenue|scale)\b/.test(lower)) {
      res.json({ intent: 'vertical:idea-generator', confidence: 0.85, requiresAgent: true });
      return;
    }

    // Check for PMO/workflow intents
    if (/\b(workflow|pipeline|automate|chain|team|assign|delegate)\b/.test(lower)) {
      res.json({ intent: 'pmo-route', confidence: 0.7, requiresAgent: true });
      return;
    }

    // Default: conversational (no agent needed, use LLM stream)
    res.json({ intent: 'conversational', confidence: 0.5, requiresAgent: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Classification failed';
    res.status(500).json({ error: msg });
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

// --------------------------------------------------------------------------
// Lil_Hawks — Squad profiles
// --------------------------------------------------------------------------
app.get('/lil-hawks', (_req, res) => {
  res.json({
    squads: {
      'prep-squad-alpha': PREP_SQUAD_PROFILES,
      'workflow-smith': SQUAD_PROFILES,
      'vision-scout': VISION_SQUAD_PROFILES,
    },
  });
});

// --------------------------------------------------------------------------
// Shelving System — First-Class Data Collections (Firestore + Memory)
// All shelves: projects, luc_projects, plugs, boomer_angs, workflows,
// runs, logs, assets
// --------------------------------------------------------------------------
app.use(shelfRouter);

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
