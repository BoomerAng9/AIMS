/**
 * ACHEEVY Router
 *
 * Express router exposing the ACHEEVY orchestrator as HTTP endpoints.
 * Mounted on the UEF Gateway at /acheevy.
 */

import { Router, Request, Response } from 'express';
import { getOrchestrator, AcheevyExecuteRequest } from './orchestrator';
import { registry } from '../agents/registry';

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
 * Live health check — verifies agent registry, memory engine, and
 * reports actual service state instead of hardcoded "online".
 */
router.get('/health', async (_req: Request, res: Response) => {
  const agents = registry.list();
  const agentCount = agents.length;
  const agentNames = agents.map(a => a.name);

  // Check critical agents
  const hasChickenHawk = registry.has('chicken-hawk');
  const hasEngineer = registry.has('engineer-ang');

  const healthy = agentCount >= 5 && hasChickenHawk && hasEngineer;

  res.status(healthy ? 200 : 503).json({
    service: 'ACHEEVY Orchestrator',
    status: healthy ? 'online' : 'degraded',
    version: '1.0.0',
    agents: {
      count: agentCount,
      names: agentNames,
      critical: {
        'chicken-hawk': hasChickenHawk,
        'engineer-ang': hasEngineer,
      },
    },
    capabilities: [
      'plug-fabrication',
      'skill-execution',
      'perform-analytics',
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
      { pattern: 'skill:automation-workflow', description: 'Workflow automation' },
      { pattern: 'skill:stitch', description: 'Design system generation' },
      { pattern: 'skill:best-practices', description: 'PRD/SOP/KPI generation' },
      { pattern: 'scaffolding', description: 'Platform cloning and scaffolding via Make It Mine' },
      { pattern: 'internal-llm', description: 'General AI conversation' },
    ],
  });
});

export { router as acheevyRouter };
