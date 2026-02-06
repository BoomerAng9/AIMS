import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ACPStandardizedRequest, ACPResponse } from './acp/types';
import { LUCEngine } from './luc';
import { Oracle } from './oracle';
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
function buildResponseMessage(intent: string, oraclePassed: boolean): string {
  if (!oraclePassed) {
    return 'ORACLE pre-flight check flagged issues. Review gate failures before proceeding.';
  }
  switch (intent) {
    case 'CHAT':
      return 'ACHEEVY received your message. Here is the analysis and cost estimate for any actionable items detected.';
    case 'BUILD_PLUG':
      return 'Build request accepted. Execution plan generated and LUC quote attached. Approve to begin.';
    case 'RESEARCH':
      return 'Research request queued. AnalystAng will compile findings. LUC estimate attached.';
    case 'AGENTIC_WORKFLOW':
      return 'Workflow pipeline validated. Multi-stage execution plan ready. Approve the LUC quote to launch.';
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

    const executionPlan = buildExecutionPlan(acpReq.intent, acpReq.naturalLanguage);
    const quote = LUCEngine.estimate(acpReq.naturalLanguage);

    const oracleResult = await Oracle.runGates(
      { intent: acpReq.intent, query: acpReq.naturalLanguage, budget: acpReq.budget },
      { quote }
    );

    logger.info({ passed: oracleResult.passed, score: oracleResult.score }, '[UEF] ORACLE result');

    const response: ACPResponse = {
      reqId: acpReq.reqId,
      status: oracleResult.passed ? 'SUCCESS' : 'ERROR',
      message: buildResponseMessage(acpReq.intent, oracleResult.passed),
      quote: quote,
      executionPlan: executionPlan
    };

    res.json(response);

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
  logger.info({ port: PORT }, 'UEF Gateway (Layer 2) running');
  logger.info(`ACP Ingress available at http://localhost:${PORT}/ingress/acp`);
});

export default app;
