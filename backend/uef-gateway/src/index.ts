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
import { TIER_CONFIGS, TASK_MULTIPLIERS as BILLING_MULTIPLIERS, PILLAR_CONFIGS, checkAllowance, calculatePillarAddon, checkAgentLimit } from './billing';
import { openrouter, MODELS as LLM_MODELS } from './llm';
import { verticalRegistry } from './verticals';

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

app.post('/house-of-ang/spawn', (req, res) => {
  try {
    const { name, type, title, role, specialties } = req.body;
    if (!name || typeof name !== 'string' || name.length > 100) {
      res.status(400).json({ error: 'Invalid name: required string, max 100 chars' });
      return;
    }
    if (!type || !['SUPERVISORY', 'EXECUTION'].includes(type)) {
      res.status(400).json({ error: 'Invalid type: must be SUPERVISORY or EXECUTION' });
      return;
    }
    if (!title || typeof title !== 'string' || title.length > 200) {
      res.status(400).json({ error: 'Invalid title: required string, max 200 chars' });
      return;
    }
    if (!role || typeof role !== 'string' || role.length > 500) {
      res.status(400).json({ error: 'Invalid role: required string, max 500 chars' });
      return;
    }
    if (specialties && !Array.isArray(specialties)) {
      res.status(400).json({ error: 'specialties must be an array' });
      return;
    }
    const ang = houseOfAng.spawn(name, type, title, role, specialties || []);
    res.status(201).json(ang);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Spawn failed';
    res.status(409).json({ error: message });
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
          'Dispatch AnalystAng for data gathering',
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
      return `Research request queued. AnalystAng will compile findings. LUC estimate attached.${suffix}`;
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

    // Reject anonymous requests in production — frontend must supply authenticated userId
    if (process.env.NODE_ENV === 'production' && (!rawBody.userId || rawBody.userId === 'anon')) {
      res.status(401).json({ status: 'ERROR', message: 'Authenticated userId required' });
      return;
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
  server.close(() => {
    logger.info('[UEF] All connections drained. Exiting.');
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
