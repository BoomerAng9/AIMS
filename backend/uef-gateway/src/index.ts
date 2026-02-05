import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { ACPStandardizedRequest, ACPResponse } from './acp/types';
import { LUCEngine } from './luc';
import { Oracle } from './oracle';

const app = express();
const PORT = process.env.PORT || 3001;
const ACHEEVY_URL = process.env.ACHEEVY_URL || 'http://localhost:3003';
const HOUSE_OF_ANG_URL = process.env.HOUSE_OF_ANG_URL || 'http://localhost:3002';

app.use(cors());
app.use(bodyParser.json());

// --------------------------------------------------------------------------
// Health Check
// --------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'UEF Gateway Online', layer: 2 });
});

// --------------------------------------------------------------------------
// LUC Status Proxy (for frontend useLuc hook)
// --------------------------------------------------------------------------
app.get('/luc/status', (req, res) => {
  const userId = (req.query.userId as string) || 'anon';
  // Return default free-tier quotas (in production, read from Firestore via LUC ADK)
  res.json({
    userId,
    tier: 'free',
    billing_cycle_start: new Date().toISOString(),
    billing_cycle_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    can_execute: true,
    blocking_quotas: [],
    usage_summary: {
      api_calls:        { used: 0, limit: 50, pct: 0 },
      brave_searches:   { used: 0, limit: 10, pct: 0 },
      container_hours:  { used: 0, limit: 0.5, pct: 0 },
      storage_gb:       { used: 0, limit: 1, pct: 0 },
      elevenlabs_chars: { used: 0, limit: 5000, pct: 0 },
      n8n_executions:   { used: 0, limit: 5, pct: 0 },
    },
  });
});

// --------------------------------------------------------------------------
// Intent-specific execution plan generation
// --------------------------------------------------------------------------
function buildExecutionPlan(intent: string, query: string): { steps: string[]; estimatedDuration: string } {
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

    // 1. Normalize Request
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

    console.log(`[UEF] Received ACP Request: ${acpReq.reqId} - ${acpReq.intent}`);

    // 2. For CHAT intent, forward to ACHEEVY orchestrator if available
    if (acpReq.intent === 'CHAT') {
      try {
        const acheevyRes = await fetch(`${ACHEEVY_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: acpReq.userId,
            sessionId: acpReq.sessionId,
            message: acpReq.naturalLanguage,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (acheevyRes.ok) {
          const acheevyData = await acheevyRes.json();
          const response: ACPResponse = {
            reqId: acpReq.reqId,
            status: 'SUCCESS',
            message: acheevyData.reply,
            quote: LUCEngine.estimate(acpReq.naturalLanguage),
            taskId: acheevyData.sessionId,
            executionPlan: acheevyData.action_plan
              ? {
                  steps: acheevyData.action_plan.map((s: any) => s.description),
                  estimatedDuration: `${acheevyData.action_plan.length} steps`,
                }
              : buildExecutionPlan('CHAT', acpReq.naturalLanguage),
          };
          return res.json(response);
        }
      } catch {
        console.warn('[UEF] ACHEEVY unreachable, falling back to local processing');
      }
    }

    // 3. SmelterOS Routing — choose processing path by intent
    const executionPlan = buildExecutionPlan(acpReq.intent, acpReq.naturalLanguage);

    // 4. LUC Estimate
    const quote = LUCEngine.estimate(acpReq.naturalLanguage);

    // 5. ORACLE 7-Gate Pre-flight
    const oracleResult = await Oracle.runGates(
      { intent: acpReq.intent, query: acpReq.naturalLanguage, budget: acpReq.budget },
      { quote }
    );

    console.log(`[UEF] ORACLE result: passed=${oracleResult.passed}, score=${oracleResult.score}`);

    // 6. Construct Response
    const response: ACPResponse = {
      reqId: acpReq.reqId,
      status: oracleResult.passed ? 'SUCCESS' : 'ERROR',
      message: buildResponseMessage(acpReq.intent, oracleResult.passed),
      quote: quote,
      executionPlan: executionPlan
    };

    res.json(response);

  } catch (error: any) {
    console.error('ACP Ingress Error:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n>>> UEF Gateway (Layer 2) running on port ${PORT}`);
  console.log(`>>> ACP Ingress available at http://localhost:${PORT}/ingress/acp\n`);
});
