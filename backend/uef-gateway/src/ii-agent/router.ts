/**
 * ACHEEVY → II-Agent Integration Router
 *
 * This module routes ACHEEVY orchestrator requests to ii-agent
 * for autonomous task execution.
 *
 * Access: OWNER only — gated via requireOwnerRole middleware.
 * All executions are audit-logged to the Gateway Evidence Locker.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getIIAgentClient, IIAgentClient, IIAgentTask } from './client';
import logger from '../logger';

const router = Router();

// ---------------------------------------------------------------------------
// OWNER-Only Middleware — A.I.M.S. Gateway System Protocol
// ---------------------------------------------------------------------------

/**
 * Validates the caller has OWNER role before allowing ii-agent access.
 *
 * Role is resolved from (in priority order):
 *  1. X-User-Role header (set by frontend API proxy after NextAuth session check)
 *  2. X-API-Key match against INTERNAL_API_KEY (service-to-service calls from ACHEEVY orchestrator)
 *
 * All non-health endpoints are gated. Health check remains open for monitoring.
 */
function requireOwnerRole(req: Request, res: Response, next: NextFunction): void {
  // Health check is open for monitoring / Circuit Box
  if (req.path === '/health') {
    next();
    return;
  }

  const userRole = req.headers['x-user-role'] as string | undefined;
  const userId = req.headers['x-user-id'] as string | undefined || req.body?.userId || 'unknown';
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const internalKey = process.env.INTERNAL_API_KEY || '';

  // Path 1: Frontend proxy sets X-User-Role after NextAuth session validation
  if (userRole === 'OWNER') {
    logger.info({ userId, path: req.path }, '[II-Agent] OWNER access granted via role header');
    next();
    return;
  }

  // Path 2: Internal service calls (ACHEEVY orchestrator) use INTERNAL_API_KEY
  if (internalKey && apiKey === internalKey) {
    logger.info({ userId, path: req.path }, '[II-Agent] Access granted via internal API key');
    next();
    return;
  }

  // Deny all others
  logger.warn(
    { userId, userRole, path: req.path },
    '[II-Agent] Access DENIED — OWNER role required',
  );
  res.status(403).json({
    error: 'Forbidden — OWNER role required',
    code: 'II_AGENT_OWNER_ONLY',
    hint: 'ii-agent is restricted to platform owner via A.I.M.S. Gateway System',
  });
}

// Apply OWNER gate to all routes in this router
router.use(requireOwnerRole);

// ---------------------------------------------------------------------------
// Audit helper — logs every ii-agent execution for Gateway evidence trail
// ---------------------------------------------------------------------------

function auditLog(action: string, userId: string, meta: Record<string, unknown> = {}): void {
  logger.info(
    { action, userId, service: 'ii-agent', timestamp: new Date().toISOString(), ...meta },
    `[II-Agent Audit] ${action}`,
  );
}

/**
 * POST /ii-agent/execute
 * Execute a task through ii-agent
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { prompt, type, streaming } = req.body;

    const userId = req.headers['x-user-id'] as string || req.body.userId || 'owner';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    auditLog('execute', userId, { taskType: type, streaming, promptLength: prompt.length });

    const client = getIIAgentClient();

    // Determine task type from intent or explicit type
    const taskType = type || IIAgentClient.mapIntentToTaskType(prompt);

    const task: IIAgentTask = {
      type: taskType,
      prompt,
      context: {
        userId: req.body.userId,
        sessionId: req.body.sessionId,
        previousMessages: req.body.history,
      },
      options: {
        streaming: streaming || false,
        timeout: req.body.timeout || 300000,
      },
    };

    if (streaming) {
      // Set up SSE for streaming responses
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const event of client.executeTaskStream(task)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      res.write('data: {"type":"done"}\n\n');
      res.end();
    } else {
      const result = await client.executeTask(task);
      res.json(result);
    }

  } catch (error: any) {
    console.error('[II-Agent Router] Execution error:', error);
    res.status(500).json({ 
      error: error.message || 'ii-agent execution failed',
      code: 'II_AGENT_ERROR'
    });
  }
});

/**
 * POST /ii-agent/research
 * Specialized endpoint for deep research tasks
 */
router.post('/research', async (req: Request, res: Response) => {
  try {
    const { topic, depth, outputFormat } = req.body;

    const userId = req.headers['x-user-id'] as string || req.body.userId || 'owner';

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    auditLog('research', userId, { topic, depth });

    const client = getIIAgentClient();

    const prompt = `Conduct comprehensive research on: ${topic}
    
Research depth: ${depth || 'comprehensive'}
Output format: ${outputFormat || 'structured report with sources'}

Please provide:
1. Executive summary
2. Key findings
3. Detailed analysis
4. Sources and citations
5. Actionable recommendations`;

    const result = await client.executeTask({
      type: 'research',
      prompt,
      context: {
        userId: req.body.userId,
        sessionId: req.body.sessionId,
      },
    });

    res.json(result);

  } catch (error: any) {
    console.error('[II-Agent Router] Research error:', error);
    res.status(500).json({ 
      error: error.message || 'Research task failed',
      code: 'RESEARCH_ERROR'
    });
  }
});

/**
 * POST /ii-agent/build
 * Specialized endpoint for full-stack development tasks
 */
router.post('/build', async (req: Request, res: Response) => {
  try {
    const { description, stack, features } = req.body;

    const userId = req.headers['x-user-id'] as string || req.body.userId || 'owner';

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    auditLog('build', userId, { description: description.substring(0, 100), stack });

    const client = getIIAgentClient();

    const prompt = `Build a web application with the following requirements:

Description: ${description}

Tech Stack: ${stack || 'React/Next.js frontend, Node.js backend'}

Required Features:
${features ? features.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n') : 'Based on the description'}

Please:
1. Create the project structure
2. Implement core functionality
3. Add basic styling
4. Include error handling
5. Provide setup instructions`;

    // Use streaming for long-running build tasks
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of client.executeTaskStream({
      type: 'fullstack',
      prompt,
      context: {
        userId: req.body.userId,
        sessionId: req.body.sessionId,
      },
      options: { streaming: true, timeout: 600000 }, // 10 min timeout for builds
    })) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: {"type":"done"}\n\n');
    res.end();

  } catch (error: any) {
    console.error('[II-Agent Router] Build error:', error);
    res.status(500).json({ 
      error: error.message || 'Build task failed',
      code: 'BUILD_ERROR'
    });
  }
});

/**
 * POST /ii-agent/slides
 * Specialized endpoint for presentation creation
 */
router.post('/slides', async (req: Request, res: Response) => {
  try {
    const { topic, slideCount, audience, style } = req.body;

    const userId = req.headers['x-user-id'] as string || req.body.userId || 'owner';

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    auditLog('slides', userId, { topic, slideCount, audience });

    const client = getIIAgentClient();

    const prompt = `Create a professional presentation:

Topic: ${topic}
Number of slides: ${slideCount || '10-15'}
Target audience: ${audience || 'general professional'}
Style: ${style || 'modern, clean, business'}

Include:
1. Title slide
2. Agenda/overview
3. Main content sections
4. Key takeaways
5. Q&A or closing slide`;

    const result = await client.executeTask({
      type: 'slides',
      prompt,
      context: {
        userId: req.body.userId,
        sessionId: req.body.sessionId,
      },
    });

    res.json(result);

  } catch (error: any) {
    console.error('[II-Agent Router] Slides error:', error);
    res.status(500).json({ 
      error: error.message || 'Slides creation failed',
      code: 'SLIDES_ERROR'
    });
  }
});

/**
 * GET /ii-agent/health
 * Check ii-agent service health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const client = getIIAgentClient();
    const health = await client.healthCheck();
    res.json({
      status: 'healthy',
      iiAgent: health,
      connected: client.isConnected(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      connected: false,
    });
  }
});

/**
 * POST /ii-agent/cancel/:taskId
 * Cancel a running task
 */
router.post('/cancel/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.headers['x-user-id'] as string || req.body?.userId || 'owner';
    auditLog('cancel', userId, { taskId });
    const client = getIIAgentClient();
    await client.cancelTask(taskId);
    res.json({ success: true, taskId });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Failed to cancel task',
      code: 'CANCEL_ERROR'
    });
  }
});

export default router;
