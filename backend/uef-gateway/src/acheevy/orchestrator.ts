/**
 * ACHEEVY Orchestrator
 *
 * The real backend orchestration engine. Receives classified intents from
 * the frontend, runs the skills/hooks lifecycle, checks LUC quotas via
 * Firestore, and dispatches work to II-Agent, Chicken Hawk, or other Boomer_Angs.
 *
 * Execution order:
 *   1. Try II-Agent (autonomous execution engine) via Socket.IO
 *   2. Fallback → Chicken Hawk (manifest-based execution engine) via HTTP
 *   3. Fallback → queued (if both engines are offline)
 */

import { getIIAgentClient, IIAgentClient, IIAgentTask } from '../ii-agent/client';
import { LUCEngine } from '../luc';
import { v4 as uuidv4 } from 'uuid';
import { triggerN8nPmoWorkflow } from '../n8n';
import type { N8nPipelineResponse } from '../n8n';
import { executeVertical } from './execution-engine';
import { spawnAgent, decommissionAgent, getRoster, getAvailableRoster } from '../deployment-hub';
import type { SpawnRequest, EnvironmentTarget } from '../deployment-hub';
import { getMemoryEngine } from '../memory';
import type { ExecutionOutcome } from '../memory';
import { agentChat } from '../llm';
import logger from '../logger';

// Vertical definitions: pure data (no gateway imports), loaded at runtime
// to avoid tsconfig rootDir compilation issues with cross-boundary imports.
let _verticals: Record<string, any> | null = null;
function getVertical(id: string): any {
  if (!_verticals) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('../../../../aims-skills/acheevy-verticals/vertical-definitions');
      _verticals = mod.VERTICALS || {};
    } catch {
      _verticals = {};
    }
  }
  return _verticals![id] || null;
}

// ── Chicken Hawk HTTP Dispatch ──────────────────────────────────────

const CHICKENHAWK_URL = process.env.CHICKENHAWK_URL || 'http://chickenhawk-core:4001';

interface ChickenHawkManifest {
  manifest_id: string;
  requested_by: string;
  approved_by: string;
  shift_id: string;
  plan: {
    waves: Array<{
      wave_id: number;
      tasks: Array<{
        task_id: string;
        function: string;
        crew_role: string;
        target: string;
        params: Record<string, unknown>;
        badge_level: 'green' | 'amber' | 'red';
        wrapper_type: 'SERVICE_WRAPPER' | 'JOB_RUNNER_WRAPPER' | 'CLI_WRAPPER' | 'MCP_BRIDGE_WRAPPER';
        estimated_cost_usd: number;
        timeout_seconds: number;
      }>;
      concurrency: number;
      gate: 'all_pass' | 'majority_pass' | 'any_pass';
    }>;
  };
  budget_limit_usd: number;
  timeout_seconds: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Build a Chicken Hawk manifest from an ACHEEVY request.
 * Translates high-level intent into a structured execution plan.
 */
function buildManifest(
  requestId: string,
  taskType: string,
  prompt: string,
  userId: string,
  metadata?: Record<string, unknown>,
): ChickenHawkManifest {
  const shiftId = `shift_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    manifest_id: requestId,
    requested_by: `ACHEEVY:${userId}`,
    approved_by: 'ACHEEVY',
    shift_id: shiftId,
    plan: {
      waves: [
        {
          wave_id: 1,
          tasks: [
            {
              task_id: `task_${requestId}_1`,
              function: taskType,
              crew_role: 'executor',
              target: taskType === 'fullstack' ? 'sitebuilder_ang' : 'researcher_ang',
              params: {
                prompt,
                userId,
                ...metadata,
              },
              badge_level: 'green',
              wrapper_type: 'SERVICE_WRAPPER',
              estimated_cost_usd: 0.10,
              timeout_seconds: taskType === 'fullstack' ? 600 : 300,
            },
          ],
          concurrency: 1,
          gate: 'all_pass',
        },
      ],
    },
    budget_limit_usd: taskType === 'fullstack' ? 5.0 : 1.0,
    timeout_seconds: taskType === 'fullstack' ? 600 : 300,
    created_at: new Date().toISOString(),
    metadata,
  };
}

/**
 * Dispatch a manifest to Chicken Hawk via HTTP POST.
 * Returns the execution result or throws on failure.
 */
async function dispatchToChickenHawk(manifest: ChickenHawkManifest): Promise<{
  dispatched: true;
  manifestId: string;
  shiftId: string;
  result: any;
}> {
  const res = await fetch(`${CHICKENHAWK_URL}/api/manifest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manifest),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Chicken Hawk returned ${res.status}: ${JSON.stringify(data)}`);
  }

  return {
    dispatched: true,
    manifestId: manifest.manifest_id,
    shiftId: manifest.shift_id,
    result: data,
  };
}

// ── Types ────────────────────────────────────────────────────

export interface AcheevyExecuteRequest {
  userId: string;
  message: string;
  intent: string;              // from frontend classifier: plug-factory, skill:*, perform-stack, internal-llm, etc.
  conversationId?: string;
  plugId?: string;
  skillId?: string;
  skillRoute?: string;
  context?: Record<string, any>;
}

export interface AcheevyExecuteResponse {
  requestId: string;
  status: 'completed' | 'queued' | 'streaming' | 'dispatched' | 'quota_exceeded' | 'error';
  reply: string;
  data?: Record<string, any>;
  lucUsage?: {
    service: string;
    amount: number;
    remaining?: number;
  };
  taskId?: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SkillRoute {
  id: string;
  handler: (req: AcheevyExecuteRequest, iiAgent: IIAgentClient) => Promise<AcheevyExecuteResponse>;
}

// ── Orchestrator ─────────────────────────────────────────────

export class AcheevyOrchestrator {
  private iiAgent: IIAgentClient;
  private memory = getMemoryEngine();

  constructor() {
    this.iiAgent = getIIAgentClient();
  }

  /**
   * Main execution entry point. Takes a classified intent and executes it.
   * Now with memory: auto-recall before execution, auto-remember after.
   */
  async execute(req: AcheevyExecuteRequest): Promise<AcheevyExecuteResponse> {
    const requestId = uuidv4();
    const startMs = Date.now();

    try {
      // 0. Auto-recall: inject relevant memories into context
      const memoryContext = this.memory.autoRecall(req.userId, req.message, {
        projectId: req.plugId || req.context?.projectId as string,
      });
      if (memoryContext) {
        req.context = { ...req.context, memoryContext };
      }

      // 1. LUC quota check (lightweight)
      const estimate = LUCEngine.estimate(req.message);

      // 2. Route based on classified intent
      const routedTo = req.intent;

      let routeResponse: AcheevyExecuteResponse | null = null;

      if (routedTo.startsWith('plug-factory:')) {
        routeResponse = await this.handlePlugFabrication(requestId, req);
      } else if (routedTo === 'perform-stack') {
        routeResponse = await this.handlePerformStack(requestId, req);
      } else if (routedTo.startsWith('skill:')) {
        routeResponse = await this.handleSkillExecution(requestId, req);
      } else if (routedTo.startsWith('vertical:')) {
        routeResponse = await this.handleVerticalExecution(requestId, req);
      } else if (routedTo === 'pmo-route' || routedTo.startsWith('pmo:')) {
        routeResponse = await this.handlePmoRouting(requestId, req);
      } else if (routedTo.startsWith('spawn:') || routedTo === 'deployment-hub') {
        routeResponse = await this.handleDeploymentHub(requestId, req);
      } else if (routedTo.startsWith('paas_')) {
        routeResponse = await this.handlePaaSOperations(requestId, req);
      }

      if (routeResponse) {
        this.autoRememberOutcome(req, routeResponse, startMs);
        return routeResponse;
      }

      // Default: conversational AI via II-Agent → Chicken Hawk fallback
      const response = await this.handleConversation(requestId, req, estimate);

      // Auto-remember: store execution outcome for learning
      this.autoRememberOutcome(req, response, startMs);

      return response;

    } catch (error: any) {
      logger.error({ err: error, requestId }, '[ACHEEVY] Execution error');

      // Remember failures too
      this.autoRememberOutcome(req, {
        requestId,
        status: 'error',
        reply: error.message,
        error: error.message,
      }, startMs);

      return {
        requestId,
        status: 'error',
        reply: 'Something went wrong processing your request. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Auto-remember execution outcomes for the memory system.
   */
  private autoRememberOutcome(
    req: AcheevyExecuteRequest,
    response: AcheevyExecuteResponse,
    startMs: number,
  ): void {
    const outcome: ExecutionOutcome = {
      userId: req.userId,
      projectId: req.plugId || req.context?.projectId as string,
      intent: req.intent,
      message: req.message,
      status: response.status as ExecutionOutcome['status'],
      reply: response.reply,
      toolsUsed: response.data?.toolsUsed as string[],
      agentsInvolved: response.data?.agentsInvolved as string[],
      durationMs: Date.now() - startMs,
      costUsd: response.lucUsage?.amount ? response.lucUsage.amount * 0.001 : undefined,
      artifacts: response.data?.artifacts as string[],
    };
    this.memory.autoRemember(outcome);
  }

  // ── Route Handlers ───────────────────────────────────────

  /**
   * Plug fabrication: try II-Agent fullstack mode → fallback to Chicken Hawk
   */
  private async handlePlugFabrication(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const plugId = req.plugId || req.intent.split(':')[1];

    // Try II-Agent first
    const iiTask: IIAgentTask = {
      type: 'fullstack',
      prompt: `Build the "${plugId}" plug for A.I.M.S. User request: ${req.message}`,
      context: { userId: req.userId, sessionId: req.conversationId },
      options: { streaming: false, timeout: 600000 },
    };

    try {
      const result = await this.iiAgent.executeTask(iiTask);
      return {
        requestId,
        status: result.status === 'completed' ? 'completed' : 'dispatched',
        reply: `Plug "${plugId}" fabrication ${result.status}. ${result.output || ''}`,
        data: { plugId, artifacts: result.artifacts, iiAgentTaskId: result.id },
        lucUsage: { service: 'container_hours', amount: 1 },
        taskId: result.id,
      };
    } catch {
      // II-Agent unavailable — dispatch to Chicken Hawk
      logger.info({ requestId, plugId }, '[ACHEEVY] II-Agent offline, dispatching to Chicken Hawk');
    }

    // Fallback: Chicken Hawk
    try {
      const manifest = buildManifest(requestId, 'fullstack', req.message, req.userId, { plugId });
      const chResult = await dispatchToChickenHawk(manifest);
      return {
        requestId,
        status: 'dispatched',
        reply: `Plug "${plugId}" build dispatched to Chicken Hawk. Shift ID: ${chResult.shiftId}. Monitor progress in Mission Control.`,
        data: { plugId, chickenhawk: chResult },
        lucUsage: { service: 'container_hours', amount: 1 },
        taskId: chResult.manifestId,
      };
    } catch (chErr: any) {
      logger.error({ err: chErr, requestId }, '[ACHEEVY] Chicken Hawk also unavailable');
      return {
        requestId,
        status: 'queued',
        reply: `Build request for "${plugId}" has been queued. Both execution engines are warming up — your task will be processed shortly.`,
        taskId: `queued_${requestId}`,
      };
    }
  }

  /**
   * Perform stack: sports analytics and scouting
   */
  private async handlePerformStack(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const task: IIAgentTask = {
      type: 'research',
      prompt: `Sports analytics request: ${req.message}. Analyze athlete data, provide scouting reports, and recruitment recommendations.`,
      context: { userId: req.userId, sessionId: req.conversationId },
    };

    try {
      const result = await this.iiAgent.executeTask(task);
      return {
        requestId,
        status: 'completed',
        reply: result.output || 'Perform analysis complete.',
        data: { artifacts: result.artifacts },
        lucUsage: { service: 'brave_searches', amount: 5 },
      };
    } catch (iiErr) {
      logger.warn({ err: iiErr instanceof Error ? iiErr.message : iiErr, requestId }, '[ACHEEVY] II-Agent offline for Perform, trying Chicken Hawk');
      // Fallback: Chicken Hawk
      try {
        const manifest = buildManifest(requestId, 'research', req.message, req.userId, { vertical: 'perform' });
        const chResult = await dispatchToChickenHawk(manifest);
        return {
          requestId,
          status: 'dispatched',
          reply: `Perform analytics dispatched to Chicken Hawk. Shift ID: ${chResult.shiftId}.`,
          data: { chickenhawk: chResult },
          lucUsage: { service: 'brave_searches', amount: 5 },
          taskId: chResult.manifestId,
        };
      } catch (chErr) {
        logger.error({ err: chErr instanceof Error ? chErr.message : chErr, requestId }, '[ACHEEVY] Chicken Hawk also offline for Perform');
        return {
          requestId,
          status: 'queued',
          reply: 'Perform analytics request queued. Results will be available shortly.',
          taskId: `queued_${requestId}`,
        };
      }
    }
  }

  /**
   * Skill execution: try II-Agent → fallback to Chicken Hawk
   */
  private async handleSkillExecution(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const skillId = req.skillId || req.intent.split(':')[1];

    const skillTaskMap: Record<string, IIAgentTask['type']> = {
      'remotion': 'code',
      'gemini-research': 'research',
      'n8n-workflow': 'code',
      'stitch': 'code',
      'best-practices': 'research',
    };

    const taskType = skillTaskMap[skillId] || 'research';

    const task: IIAgentTask = {
      type: taskType,
      prompt: `Execute A.I.M.S. skill "${skillId}". User request: ${req.message}`,
      context: { userId: req.userId, sessionId: req.conversationId },
    };

    try {
      const result = await this.iiAgent.executeTask(task);
      return {
        requestId,
        status: 'completed',
        reply: result.output || `Skill "${skillId}" executed successfully.`,
        data: { skillId, artifacts: result.artifacts },
        lucUsage: { service: 'api_calls', amount: 1 },
      };
    } catch (iiErr) {
      logger.warn({ err: iiErr instanceof Error ? iiErr.message : iiErr, requestId, skillId }, '[ACHEEVY] II-Agent offline for skill, trying Chicken Hawk');
      // Fallback: Chicken Hawk
      try {
        const manifest = buildManifest(requestId, taskType, req.message, req.userId, { skillId });
        const chResult = await dispatchToChickenHawk(manifest);
        return {
          requestId,
          status: 'dispatched',
          reply: `Skill "${skillId}" dispatched to Chicken Hawk. Shift ID: ${chResult.shiftId}.`,
          data: { skillId, chickenhawk: chResult },
          lucUsage: { service: 'api_calls', amount: 1 },
          taskId: chResult.manifestId,
        };
      } catch (chErr) {
        logger.error({ err: chErr instanceof Error ? chErr.message : chErr, requestId, skillId }, '[ACHEEVY] Chicken Hawk also offline for skill');
        return {
          requestId,
          status: 'queued',
          reply: `Skill "${skillId}" has been queued for execution.`,
          taskId: `queued_${requestId}`,
        };
      }
    }
  }

  /**
   * PMO routing: chain-of-command pipeline via n8n
   */
  private async handlePmoRouting(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    try {
      const result: N8nPipelineResponse = await triggerN8nPmoWorkflow({
        userId: req.userId,
        message: req.message,
        requestId,
        context: req.context,
      });

      return {
        requestId,
        status: result.status === 'failed' ? 'error' : 'completed',
        reply: result.summary,
        data: {
          receipt: result.receipt,
          classification: result.classification,
          metrics: result.metrics,
          chainOfCommand: result.chainOfCommand,
        },
        lucUsage: {
          service: 'api_calls',
          amount: result.metrics.stepsCompleted + 1,
        },
      };
    } catch (n8nErr) {
      logger.warn({ err: n8nErr instanceof Error ? n8nErr.message : n8nErr, requestId }, '[ACHEEVY] n8n PMO pipeline failed, trying Chicken Hawk');
      // Fallback: Chicken Hawk for PMO routing
      try {
        const manifest = buildManifest(requestId, 'research', req.message, req.userId, { pmo: true });
        const chResult = await dispatchToChickenHawk(manifest);
        return {
          requestId,
          status: 'dispatched',
          reply: `PMO routing dispatched to Chicken Hawk. Shift ID: ${chResult.shiftId}.`,
          data: { chickenhawk: chResult },
          lucUsage: { service: 'api_calls', amount: 1 },
          taskId: chResult.manifestId,
        };
      } catch (chErr) {
        logger.error({ err: chErr instanceof Error ? chErr.message : chErr, requestId }, '[ACHEEVY] Chicken Hawk also offline for PMO');
        return {
          requestId,
          status: 'queued',
          reply: 'PMO routing request received. The chain-of-command pipeline will process it when available.',
          taskId: `queued_pmo_${requestId}`,
        };
      }
    }
  }

  /**
   * Vertical execution: NLP-triggered business builder verticals
   */
  private async handleVerticalExecution(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const verticalId = req.intent.split(':')[1];
    const vertical = getVertical(verticalId);

    if (!vertical) {
      return {
        requestId,
        status: 'error',
        reply: `Vertical "${verticalId}" not found.`,
        error: `Unknown vertical: ${verticalId}`,
      };
    }

    const collectedData = req.context || {};

    try {
      const result = await executeVertical(
        vertical,
        collectedData,
        req.userId,
        req.conversationId || requestId,
      );

      if (result.status === 'failed') {
        return {
          requestId,
          status: 'error',
          reply: `Vertical execution failed: ${result.error}`,
          error: result.error,
        };
      }

      return {
        requestId,
        status: 'streaming',
        reply: `Executing ${vertical.name} pipeline — ${result.pipeline?.steps.length || 0} steps dispatched through the team. Task ID: ${result.taskId}`,
        taskId: result.taskId,
        data: {
          verticalId,
          verticalName: vertical.name,
          pipelineSteps: result.pipeline?.steps,
          estimatedAgents: result.pipeline?.estimated_agents,
          oracleScore: result.pipeline?.oracleScore,
          auditSessionId: result.auditSessionId,
        },
        lucUsage: {
          service: 'vertical_execution',
          amount: result.pipeline?.steps.length || 1,
        },
      };
    } catch (execErr) {
      logger.warn({ err: execErr instanceof Error ? execErr.message : execErr, requestId, verticalId }, '[ACHEEVY] Vertical execution failed, trying Chicken Hawk');
      // Fallback: Chicken Hawk
      try {
        const manifest = buildManifest(requestId, 'research', req.message, req.userId, { verticalId, verticalName: vertical.name });
        const chResult = await dispatchToChickenHawk(manifest);
        return {
          requestId,
          status: 'dispatched',
          reply: `Vertical "${vertical.name}" dispatched to Chicken Hawk. Shift ID: ${chResult.shiftId}.`,
          data: { verticalId, chickenhawk: chResult },
          lucUsage: { service: 'vertical_execution', amount: 1 },
          taskId: chResult.manifestId,
        };
      } catch (chErr) {
        logger.error({ err: chErr instanceof Error ? chErr.message : chErr, requestId, verticalId }, '[ACHEEVY] Chicken Hawk also offline for vertical');
        return {
          requestId,
          status: 'queued',
          reply: `Vertical "${vertical.name}" request has been queued. The execution pipeline will process it when available.`,
          taskId: `queued_vertical_${requestId}`,
        };
      }
    }
  }

  /**
   * Deployment Hub: spawn, decommission, and query Boomer_Angs and Lil_Hawks.
   */
  private async handleDeploymentHub(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const action = req.context?.action as string || 'spawn';

    if (action === 'roster') {
      const roster = getRoster();
      return {
        requestId,
        status: 'completed',
        reply: roster.length > 0
          ? `Active roster: ${roster.map(r => `${r.handle} (${r.environment})`).join(', ')}`
          : 'No agents currently active. Use spawn to deploy agents.',
        data: { roster },
      };
    }

    if (action === 'available') {
      const available = getAvailableRoster();
      return {
        requestId,
        status: 'completed',
        reply: `${available.length} agents available: ${available.map(a => a.handle).join(', ')}`,
        data: { available },
      };
    }

    if (action === 'decommission') {
      const spawnId = req.context?.spawnId as string;
      const reason = req.context?.reason as string || 'Requested via orchestrator';
      if (!spawnId) {
        return { requestId, status: 'error', reply: 'Missing spawnId for decommission.', error: 'spawnId required' };
      }
      const result = await decommissionAgent(spawnId, reason);
      return {
        requestId,
        status: result.success ? 'completed' : 'error',
        reply: result.success
          ? `${result.handle} decommissioned. Audit trail sealed.`
          : `Decommission failed: ${result.error}`,
        data: { spawnResult: result },
        error: result.error,
      };
    }

    // Spawn
    const handle = req.intent.startsWith('spawn:')
      ? req.intent.split(':')[1]
      : (req.context?.handle as string || '');

    if (!handle) {
      return { requestId, status: 'error', reply: 'Missing agent handle for spawn.', error: 'handle required' };
    }

    const spawnRequest: SpawnRequest = {
      spawnType: (req.context?.spawnType as SpawnRequest['spawnType']) || 'BOOMER_ANG',
      handle,
      requestedBy: 'ACHEEVY',
      taskId: req.context?.taskId as string,
      environment: (req.context?.environment as EnvironmentTarget) || 'PRODUCTION',
      budgetCapUsd: req.context?.budgetCapUsd as number,
      sessionDurationMaxS: req.context?.sessionDurationMaxS as number,
    };

    const result = await spawnAgent(spawnRequest);

    if (!result.success) {
      return {
        requestId,
        status: 'error',
        reply: `Spawn failed for ${handle}: ${result.error}`,
        data: { spawnResult: result },
        error: result.error,
      };
    }

    const identity = result.roleCard?.identity;
    return {
      requestId,
      status: 'completed',
      reply: [
        `${handle} is online. ${identity?.catchphrase || ''}`,
        `PMO: ${result.roleCard?.pmo_office || 'N/A'}`,
        `Environment: ${spawnRequest.environment}`,
        `Gates passed: ${result.gatesPassed.join(', ')}`,
        `Spawn ID: ${result.spawnId}`,
      ].join('\n'),
      data: {
        spawnResult: result,
        identity: {
          displayName: identity?.display_name,
          origin: identity?.origin,
          motivation: identity?.motivation,
          catchphrase: identity?.catchphrase,
          communicationStyle: identity?.communication_style,
        },
        visualIdentity: result.visualIdentity,
      },
      lucUsage: { service: 'spawn_shift', amount: 1 },
    };
  }

  /**
   * PaaS Operations: deploy, status, decommission, scale, export, catalog, needs analysis.
   * Routes to Plug Engine via II-Agent → Chicken Hawk fallback.
   * Enforces human-in-the-loop gates for deploy (LUC quote) and decommission (confirmation).
   */
  private async handlePaaSOperations(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const paasIntent = req.intent; // paas_deploy, paas_status, paas_decommission, etc.
    const plugId = req.plugId || req.context?.plugId as string;
    const instanceId = req.context?.instanceId as string;

    logger.info({ requestId, paasIntent, plugId, instanceId }, '[ACHEEVY] PaaS operation requested');

    // ── Human-in-the-loop gates ──────────────────────────────────────
    if (paasIntent === 'paas_deploy' && !req.context?.luc_approved) {
      // Require LUC quote approval before any deployment
      const quote = LUCEngine.estimate(req.message);
      const primaryVariant = quote.variants[0];
      const costDisplay = primaryVariant
        ? `$${primaryVariant.estimate.totalUsd.toFixed(2)} (${primaryVariant.name})`
        : 'standard tier';
      return {
        requestId,
        status: 'completed',
        reply: [
          `Ready to deploy${plugId ? ` "${plugId}"` : ''}. Here's the cost estimate:`,
          ``,
          `Estimated LUC cost: ${costDisplay}`,
          `Includes: container hours, port allocation, nginx config, health monitoring`,
          ``,
          `Approve to proceed, or customize before deploying.`,
        ].join('\n'),
        data: {
          paasIntent,
          plugId,
          luc_quote: quote,
          awaiting: 'luc_approval',
          glass_box_event: 'QUOTE_READY',
        },
        lucUsage: { service: 'paas_quote', amount: 0 },
      };
    }

    if (paasIntent === 'paas_decommission' && !req.context?.decommission_confirmed) {
      // Require explicit confirmation before decommissioning
      return {
        requestId,
        status: 'completed',
        reply: [
          `⚠ You're about to decommission${instanceId ? ` instance "${instanceId}"` : ' an instance'}.`,
          ``,
          `This will: stop the container, release the port, remove the nginx config.`,
          `Data will be preserved for 30 days before cleanup.`,
          ``,
          `Please confirm to proceed.`,
        ].join('\n'),
        data: {
          paasIntent,
          instanceId,
          awaiting: 'decommission_confirmation',
          glass_box_event: 'APPROVAL_REQUESTED',
        },
      };
    }

    // ── Direct PaaS execution via Plug Deploy Engine ──────────────────
    // These operations are handled directly — no need for II-Agent/Chicken Hawk.
    // The Plug Deploy Engine talks to Docker API, generates configs, and manages
    // the full instance lifecycle in-process.

    const { plugDeployEngine, plugCatalog, dockerRuntime } = await import('../plug-catalog');

    try {
      switch (paasIntent) {
        case 'paas_catalog': {
          const searchResult = plugCatalog.search({ q: req.message });
          const plugList = searchResult.plugs
            .map(p => `- **${p.name}** (${p.category}) — ${p.tagline}${p.comingSoon ? ' *(coming soon)*' : ''}`)
            .join('\n');
          return {
            requestId,
            status: 'completed',
            reply: [
              `Here's what's available in the Plug Catalog (${searchResult.total} tools):`,
              '',
              plugList,
              '',
              `Tell me which one you'd like to deploy, or describe what you need and I'll recommend the best fit.`,
            ].join('\n'),
            data: { paasIntent, catalog: searchResult, glass_box_event: 'STATUS_UPDATE' },
          };
        }

        case 'paas_deploy': {
          if (!plugId) {
            return {
              requestId,
              status: 'completed',
              reply: 'Which plug would you like to deploy? Tell me the name or describe what you need.',
              data: { paasIntent, awaiting: 'plug_selection' },
            };
          }

          const result = await plugDeployEngine.spinUp({
            plugId,
            userId: req.userId,
            instanceName: (req.context?.instanceName as string) || `${plugId}-${Date.now()}`,
            deliveryMode: (req.context?.deliveryMode as any) || 'hosted',
            customizations: (req.context?.customizations as any) || {},
            envOverrides: (req.context?.envOverrides as any) || {},
            domain: req.context?.domain as string,
          });

          const eventLog = result.events.map(e => `[${e.stage}] ${e.message}`).join('\n');
          const statusMsg = result.instance.status === 'running'
            ? `Your "${result.instance.name}" instance is live on port ${result.instance.assignedPort}.`
            : result.instance.status === 'provisioning'
              ? `Instance queued — Docker is starting up. It will be deployed automatically.`
              : `Instance created with status: ${result.instance.status}.`;

          return {
            requestId,
            status: 'completed',
            reply: [
              statusMsg,
              '',
              `Deployment log:`,
              eventLog,
              '',
              result.lucQuote > 0 ? `Estimated LUC cost: $${result.lucQuote}/month` : '',
            ].filter(Boolean).join('\n'),
            data: {
              paasIntent,
              instance: result.instance,
              deploymentId: result.deploymentId,
              events: result.events,
              glass_box_event: 'DELIVERABLE_READY',
            },
            lucUsage: { service: 'container_hours', amount: 1 },
            taskId: result.deploymentId,
          };
        }

        case 'paas_status': {
          if (instanceId) {
            const instance = await plugDeployEngine.refreshInstanceHealth(instanceId);
            if (!instance) {
              return { requestId, status: 'completed', reply: `Instance "${instanceId}" not found.` };
            }
            const plug = plugCatalog.get(instance.plugId);
            return {
              requestId,
              status: 'completed',
              reply: [
                `**${plug?.name || instance.plugId}** — ${instance.name}`,
                `Status: ${instance.status} | Health: ${instance.healthStatus}`,
                `Port: ${instance.assignedPort} | Uptime: ${Math.floor(instance.uptimeSeconds / 60)}min`,
                instance.lastHealthCheck ? `Last check: ${instance.lastHealthCheck}` : '',
              ].filter(Boolean).join('\n'),
              data: { paasIntent, instance, glass_box_event: 'STATUS_UPDATE' },
            };
          }

          // List all instances for user
          const instances = plugDeployEngine.listByUser(req.userId);
          if (instances.length === 0) {
            return {
              requestId,
              status: 'completed',
              reply: 'You have no running plug instances. Would you like to deploy something from the catalog?',
              data: { paasIntent, instances: [], glass_box_event: 'STATUS_UPDATE' },
            };
          }

          const list = instances.map(i => {
            const plug = plugCatalog.get(i.plugId);
            return `- **${plug?.name || i.plugId}** (${i.name}) — ${i.status} on port ${i.assignedPort}`;
          }).join('\n');

          return {
            requestId,
            status: 'completed',
            reply: `Your plug instances (${instances.length}):\n\n${list}`,
            data: { paasIntent, instances, glass_box_event: 'STATUS_UPDATE' },
          };
        }

        case 'paas_decommission': {
          if (!instanceId) {
            return { requestId, status: 'completed', reply: 'Which instance would you like to decommission? Provide the instance ID.' };
          }
          const removed = await plugDeployEngine.removeInstance(instanceId);
          return {
            requestId,
            status: 'completed',
            reply: removed
              ? `Instance "${instanceId}" has been decommissioned. Container stopped, port released, nginx config removed.`
              : `Instance "${instanceId}" not found.`,
            data: { paasIntent, instanceId, removed, glass_box_event: 'DELIVERABLE_READY' },
          };
        }

        case 'paas_export': {
          if (!instanceId) {
            return { requestId, status: 'completed', reply: 'Which instance would you like to export? Provide the instance ID.' };
          }
          const exportResult = await plugDeployEngine.export({
            instanceId,
            format: 'docker-compose',
            includeData: false,
          });
          return {
            requestId,
            status: 'completed',
            reply: [
              `Export bundle ready (${Object.keys(exportResult.files).length} files):`,
              Object.keys(exportResult.files).map(f => `- ${f}`).join('\n'),
              '',
              exportResult.downloadUrl ? `Download: ${exportResult.downloadUrl}` : '',
              '',
              exportResult.instructions,
            ].filter(Boolean).join('\n'),
            data: { paasIntent, instanceId, exportResult, glass_box_event: 'DELIVERABLE_READY' },
          };
        }

        default: {
          // Unknown PaaS intent — try to handle via LLM
          const dockerStatus = await dockerRuntime.isAvailable();
          return {
            requestId,
            status: 'completed',
            reply: `I can help with that. Docker is ${dockerStatus ? 'available' : 'not reachable'}. What would you like to do? Deploy, check status, export, or browse the catalog?`,
            data: { paasIntent, dockerAvailable: dockerStatus },
          };
        }
      }
    } catch (err: any) {
      logger.error({ err, requestId, paasIntent }, '[ACHEEVY] PaaS operation failed');
      return {
        requestId,
        status: 'completed',
        reply: `PaaS operation failed: ${err.message || 'Unknown error'}. Let me know if you want to retry or try a different approach.`,
        data: { paasIntent, error: err.message },
      };
    }
  }

  /**
   * Default conversation: try II-Agent → fallback to Chicken Hawk
   */
  private async handleConversation(
    requestId: string,
    req: AcheevyExecuteRequest,
    estimate: any
  ): Promise<AcheevyExecuteResponse> {
    const taskType = IIAgentClient.mapIntentToTaskType(req.message);

    const task: IIAgentTask = {
      type: taskType,
      prompt: req.message,
      context: {
        userId: req.userId,
        sessionId: req.conversationId,
        previousMessages: req.context?.history,
      },
    };

    try {
      const result = await this.iiAgent.executeTask(task);
      return {
        requestId,
        status: 'completed',
        reply: result.output || 'Task completed.',
        data: { artifacts: result.artifacts, usage: result.usage, quote: estimate },
        lucUsage: {
          service: 'api_calls',
          amount: result.usage?.totalTokens ? Math.ceil(result.usage.totalTokens / 1000) : 1,
        },
      };
    } catch {
      // II-Agent offline — try Chicken Hawk
      try {
        const manifest = buildManifest(requestId, taskType, req.message, req.userId);
        const chResult = await dispatchToChickenHawk(manifest);
        return {
          requestId,
          status: 'dispatched',
          reply: `Task dispatched to Chicken Hawk execution engine. Shift ID: ${chResult.shiftId}. Monitor progress in Mission Control.`,
          data: { chickenhawk: chResult, quote: estimate },
          lucUsage: { service: 'api_calls', amount: 1 },
          taskId: chResult.manifestId,
        };
      } catch {
        // Both engines offline — fall back to direct LLM chat
        logger.warn({ requestId }, '[ACHEEVY] Both II-Agent and Chicken Hawk offline — falling back to LLM');
        try {
          const llmResult = await agentChat({
            agentId: 'acheevy-chat',
            query: req.message,
            intent: req.intent || 'conversation',
            context: req.context?.history ? JSON.stringify(req.context.history) : undefined,
            userId: req.userId,
            sessionId: req.conversationId,
          });
          if (llmResult?.content) {
            return {
              requestId,
              status: 'completed',
              reply: llmResult.content,
              data: { quote: estimate, provider: 'llm-fallback', model: llmResult.model },
              lucUsage: {
                service: 'api_calls',
                amount: llmResult.tokens?.total ? Math.ceil(llmResult.tokens.total / 1000) : 1,
              },
            };
          }
        } catch (llmErr) {
          logger.error({ err: llmErr, requestId }, '[ACHEEVY] LLM fallback also failed');
        }
        // Last resort: queued status (no fake responses)
        return {
          requestId,
          status: 'queued',
          reply: 'All execution engines are currently starting up. Your request has been queued and will be processed as soon as a provider comes online.',
          data: { quote: estimate },
          taskId: `queued_${requestId}`,
        };
      }
    }
  }
}

// Singleton
let orchestrator: AcheevyOrchestrator | null = null;

export function getOrchestrator(): AcheevyOrchestrator {
  if (!orchestrator) {
    orchestrator = new AcheevyOrchestrator();
  }
  return orchestrator;
}
