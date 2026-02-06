import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
import { runProcurementPipeline } from './workflows/ats-procurement';
import logger from './logger';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// --------------------------------------------------------------------------
// Health Check
// --------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'UEF Gateway Online', layer: 2, uptime: process.uptime() });
});

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
    if (!name || !type || !title || !role) {
      res.status(400).json({ error: 'Missing required fields: name, type, title, role' });
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
// Workflows — ATS Procurement Automation
// --------------------------------------------------------------------------
app.post('/workflows/procurement', async (req, res) => {
  try {
    const { description, reqId } = req.body;
    if (!description) {
      res.status(400).json({ error: 'Missing required field: description' });
      return;
    }
    const pipeline = await runProcurementPipeline(description, reqId || uuidv4());
    res.json(pipeline);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pipeline failed';
    logger.error({ err: error }, 'Procurement pipeline error');
    res.status(500).json({ error: message });
  }
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
          'Delegate sub-tasks to BoomerAng team',
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
          'Provision BoomerAng agents for each stage',
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
app.post('/ingress/acp', async (req, res) => {
  try {
    const rawBody = req.body;

    const acpReq: ACPStandardizedRequest = {
      reqId: uuidv4(),
      userId: rawBody.userId || 'anon',
      sessionId: rawBody.sessionId || 'sched-1',
      timestamp: new Date().toISOString(),
      intent: rawBody.intent || 'ESTIMATE_ONLY',
      naturalLanguage: rawBody.message || '',
      channel: 'WEB',
      budget: rawBody.budget,
      metadata: rawBody.metadata
    };

    logger.info({ reqId: acpReq.reqId, intent: acpReq.intent }, '[UEF] Received ACP Request');

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

export default app;
