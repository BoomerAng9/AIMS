/**
 * ACHEEVY Router
 *
 * Express router exposing the ACHEEVY orchestrator as HTTP endpoints.
 * Mounted on the UEF Gateway at /acheevy.
 */

import { Router, Request, Response } from 'express';
import { getOrchestrator, AcheevyExecuteRequest } from './orchestrator';

const router = Router();

/**
 * POST /acheevy/execute
 *
 * Main execution endpoint. Receives a classified intent from the frontend
 * and routes it through the orchestrator.
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const body = req.body as AcheevyExecuteRequest;

    if (!body.message) {
      return res.status(400).json({
        status: 'error',
        reply: 'Message is required.',
        requestId: '',
      });
    }

    if (!body.userId) {
      body.userId = 'anon';
    }

    if (!body.intent) {
      body.intent = 'internal-llm';
    }

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute(body);

    console.log(`[ACHEEVY] ${result.requestId} → ${body.intent} → ${result.status}`);

    return res.json(result);
  } catch (error: any) {
    console.error('[ACHEEVY] Router error:', error.message);
    return res.status(500).json({
      status: 'error',
      reply: 'Internal server error.',
      requestId: '',
      error: error.message,
    });
  }
});

/**
 * GET /acheevy/health
 *
 * Health check for the ACHEEVY orchestrator.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    service: 'ACHEEVY Orchestrator',
    status: 'online',
    version: '1.0.0',
    capabilities: [
      'plug-fabrication',
      'skill-execution',
      'perform-analytics',
      'scaffolding',
      'conversation',
    ],
  });
});

/**
 * GET /acheevy/capabilities
 *
 * Returns the list of available skills and routing targets.
 */
router.get('/capabilities', (_req: Request, res: Response) => {
  res.json({
    routes: [
      { pattern: 'plug-factory:*', description: 'Plug fabrication via II-Agent fullstack mode' },
      { pattern: 'perform-stack', description: 'Sports analytics and scouting' },
      { pattern: 'skill:remotion', description: 'Video composition generation' },
      { pattern: 'skill:gemini-research', description: 'Deep research with Gemini' },
      { pattern: 'skill:n8n-workflow', description: 'Workflow automation' },
      { pattern: 'skill:stitch', description: 'Design system generation' },
      { pattern: 'skill:best-practices', description: 'PRD/SOP/KPI generation' },
      { pattern: 'scaffolding', description: 'Platform cloning and scaffolding via Make It Mine' },
      { pattern: 'internal-llm', description: 'General AI conversation' },
    ],
  });
});

export { router as acheevyRouter };
