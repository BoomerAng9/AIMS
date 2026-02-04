import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { ACPStandardizedRequest, ACPResponse } from './acp/types';
import { LUCEngine } from './luc';
import logger from './logger';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --------------------------------------------------------------------------
// Health Check
// --------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'UEF Gateway Online', layer: 2 });
});

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
      channel: 'WEB'
    };

    logger.info(`[UEF] Received ACP Request: ${acpReq.reqId} - ${acpReq.intent}`);

    // 2. Routing Logic (SmelterOS Router Stub)
    // If it's a chat/estimate intent, run LUC and return quote.

    // 3. LUC Estimate
    const quote = LUCEngine.estimate(acpReq.naturalLanguage);

    // 4. Construct Response
    const response: ACPResponse = {
      reqId: acpReq.reqId,
      status: 'SUCCESS',
      message: 'UEF processed request. LUC Quote generated.',
      quote: quote,
      executionPlan: {
        steps: [
          'Analyze intent via AVVA NOON',
          'Check specific patterns pattern in ByteRover',
          'Generate Plugs via Chicken Hawk'
        ],
        estimatedDuration: '2 minutes'
      }
    };

    // 5. Simulate 7 Gates (Pre-flight)
    // (Stubbed logic: all gates pass for now)

    res.json(response);

  } catch (error: any) {
    logger.error({ err: error }, 'ACP Ingress Error');
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  logger.info(`UEF Gateway (Layer 2) running on port ${PORT}`);
  logger.info(`ACP Ingress available at http://localhost:${PORT}/ingress/acp`);
});
