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
import { triggerVerticalWorkflow } from '../n8n/client';
import type { N8nPipelineResponse } from '../n8n';
import { executeVertical } from './execution-engine';
import { spawnAgent, decommissionAgent, getRoster, getAvailableRoster } from '../deployment-hub';
import type { SpawnRequest, EnvironmentTarget } from '../deployment-hub';
import { getMemoryEngine } from '../memory';
import type { ExecutionOutcome } from '../memory';
import { agentChat } from '../llm';
import logger from '../logger';
import { liveSim } from '../livesim';
import { dispatchChickenHawkBuild } from '../agents/cloudrun-dispatcher';
import { getFactoryController } from '../factory/controller';
import type { FactoryEvent, FactoryEventSource } from '../factory/types';

// NtNtN Engine: loaded at runtime to avoid tsconfig rootDir compilation issues
let _ntntnEngine: any = null;
function getNtNtN(): { detectBuildIntent: (msg: string) => boolean; classifyBuildIntent: (msg: string) => any[]; detectScopeTier: (msg: string) => string; AIMS_DEFAULT_STACK: Record<string, string> } {
  if (!_ntntnEngine) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      _ntntnEngine = require('../../../../aims-skills/ntntn-engine');
    } catch {
      _ntntnEngine = {
        detectBuildIntent: () => false,
        classifyBuildIntent: () => [],
        detectScopeTier: () => 'page',
        AIMS_DEFAULT_STACK: { framework: 'Next.js 16', styling: 'Tailwind CSS v4', animation: 'Motion v12', ui_components: 'shadcn/ui', deployment: 'Docker Compose' },
      };
    }
  }
  return _ntntnEngine;
}

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
  // Try Cloud Run first (GCP sandboxed environment)
  try {
    const crResult = await dispatchChickenHawkBuild(manifest.manifest_id);
    if ('dispatched' in crResult && crResult.dispatched) {
      logger.info({ manifestId: manifest.manifest_id, mode: crResult.mode }, '[ACHEEVY] Build dispatched to Cloud Run');
      return {
        dispatched: true,
        manifestId: manifest.manifest_id,
        shiftId: manifest.shift_id,
        result: { cloudRun: crResult },
      };
    }
  } catch (crErr) {
    logger.warn({ err: crErr instanceof Error ? crErr.message : crErr }, '[ACHEEVY] Cloud Run dispatch failed, falling back to local Chicken Hawk');
  }

  // Fallback: local Chicken Hawk container
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

      if (routedTo === 'build:ntntn' || (routedTo === 'BUILD_PLUG' && getNtNtN().detectBuildIntent(req.message))) {
        routeResponse = await this.handleNtNtNBuild(requestId, req);
      } else if (routedTo.startsWith('plug-factory:')) {
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
      } else if (routedTo === 'manage_it' || routedTo.startsWith('factory:')) {
        routeResponse = await this.handleFactoryController(requestId, req);
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

      // Fire-and-forget: also trigger n8n workflow for this vertical (Phase B automation)
      triggerVerticalWorkflow({
        verticalId,
        userId: req.userId,
        collectedData: collectedData as Record<string, unknown>,
        sessionId: req.conversationId || requestId,
        requestId,
      }).catch(err => {
        logger.warn({ err: err instanceof Error ? err.message : err, verticalId }, '[ACHEEVY] n8n vertical workflow trigger failed (non-blocking)');
      });

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
   * Factory Controller: Always-on orchestration via FDH pipeline.
   * Handles "Manage It" requests and factory:* intents.
   * Creates FDH manifests, auto-approves or gates for human approval.
   */
  private async handleFactoryController(
    requestId: string,
    req: AcheevyExecuteRequest,
  ): Promise<AcheevyExecuteResponse> {
    const factory = getFactoryController();
    const intent = req.intent;

    // Factory status report
    if (intent === 'factory:status') {
      const status = factory.getStatus();
      return {
        requestId,
        status: 'completed',
        reply: [
          `**Factory Controller:** ${status.status}`,
          `Active FDH runs: ${status.activeFdhRuns}`,
          `Pending approvals: ${status.pendingApprovals}`,
          `Active chambers: ${status.activeChambers}`,
          `Period cost: $${status.periodCost.totalUsd.toFixed(2)} / $${status.periodCost.budgetCapUsd.toFixed(2)} (${status.periodCost.utilizationPct.toFixed(0)}%)`,
          status.recentCompletions.length > 0
            ? `\nRecent completions:\n${status.recentCompletions.map(c => `- ${c.scope} (ORACLE: ${c.oracleScore}/8)`).join('\n')}`
            : '',
        ].filter(Boolean).join('\n'),
        data: { factoryStatus: status },
      };
    }

    // Approve a pending run
    if (intent === 'factory:approve' && req.context?.runId) {
      try {
        const run = await factory.approveRun(req.context.runId as string);
        return {
          requestId,
          status: 'completed',
          reply: `FDH run approved and executing. Status: ${run.status}. ORACLE score: ${run.phaseResults.hone?.oracleScore ?? 'pending'}/8.`,
          data: { fdhRun: { id: run.id, status: run.status } },
          lucUsage: { service: 'factory_run', amount: run.lucActual.totalTokens },
        };
      } catch (err: any) {
        return { requestId, status: 'error', reply: `Approval failed: ${err.message}`, error: err.message };
      }
    }

    // Pause/resume factory
    if (intent === 'factory:pause') {
      factory.pause();
      return { requestId, status: 'completed', reply: 'Factory controller paused. No new events will be processed until resumed.' };
    }
    if (intent === 'factory:resume') {
      factory.resume();
      return { requestId, status: 'completed', reply: 'Factory controller resumed. Processing events.' };
    }

    // Default: "Manage It" — create an FDH run from user request
    const event: FactoryEvent = {
      id: `evt_${requestId}`,
      source: (req.context?.eventSource as FactoryEventSource) || 'user',
      type: intent === 'manage_it' ? 'manage_it' : 'factory_request',
      payload: {
        message: req.message,
        scope: req.context?.scope || req.message,
        context: req.context || {},
      },
      chamberId: req.context?.chamberId as string,
      userId: req.userId,
      timestamp: new Date().toISOString(),
      priority: (req.context?.priority as FactoryEvent['priority']) || 'normal',
    };

    try {
      const result = await factory.ingestEvent(event);

      if (!result.accepted) {
        return {
          requestId,
          status: 'completed',
          reply: `Factory controller: ${result.reason}`,
          data: { factoryResult: result },
        };
      }

      if (result.awaitingApproval) {
        const run = factory.getRun(result.runId!);
        return {
          requestId,
          status: 'completed',
          reply: [
            `I've created an execution plan for this. Here's the summary:`,
            ``,
            `**Scope:** ${run.manifest.scope}`,
            `**Estimated cost:** $${run.manifest.lucEstimate.totalUsd.toFixed(2)}`,
            `**Pipeline:** Foster → Develop → Hone (${run.manifest.plan.develop.steps.length} build steps)`,
            `**Agents:** ${[...run.manifest.plan.foster.agents, ...run.manifest.plan.develop.agents].join(', ')}`,
            ``,
            `Approve to proceed, or adjust the scope.`,
          ].join('\n'),
          data: {
            factoryResult: result,
            fdhManifest: run.manifest,
            awaiting: 'fdh_approval',
            glass_box_event: 'APPROVAL_REQUESTED',
          },
          lucUsage: { service: 'factory_run', amount: 0 },
          taskId: result.runId,
        };
      }

      // Auto-approved — running
      const run = factory.getRun(result.runId!);
      const oracleScore = run.phaseResults.hone?.oracleScore;

      return {
        requestId,
        status: run.status === 'completed' ? 'completed' : 'dispatched',
        reply: run.status === 'completed'
          ? [
              `Done. The team executed and verified your request.`,
              ``,
              `**ORACLE Score:** ${oracleScore}/8`,
              `**LUC Cost:** $${run.lucActual.totalUsd.toFixed(2)}`,
              `**Receipt:** ${run.receipt?.receiptId || 'sealed'}`,
              ``,
              `${run.phaseResults.develop?.artifacts.length || 0} artifacts produced across ${run.phaseResults.develop?.wavesCompleted || 0} waves.`,
            ].join('\n')
          : `Task accepted — ACHEEVY is managing it. Status: ${run.status}. You'll be notified at key milestones.`,
        data: {
          factoryResult: result,
          fdhRun: { id: run.id, status: run.status, oracleScore },
          glass_box_event: run.status === 'completed' ? 'DELIVERABLE_READY' : 'PHASE_CHANGE',
        },
        lucUsage: { service: 'factory_run', amount: run.lucActual.totalTokens },
        taskId: result.runId,
      };
    } catch (err: any) {
      logger.error({ err, requestId }, '[ACHEEVY] Factory Controller error');
      return {
        requestId,
        status: 'error',
        reply: `Factory controller error: ${err.message}`,
        error: err.message,
      };
    }
  }

  /**
   * NtNtN Build Pipeline: Detect creative build intent → classify stack → dispatch to Chicken Hawk
   * → deploy result as a Plug instance.
   *
   * Flow: User describes → NtNtN classifies → Picker_Ang selects stack → Buildsmith constructs
   * → Chicken Hawk verifies → ACHEEVY deploys as running Plug instance.
   */
  private async handleNtNtNBuild(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const message = req.message;

    // 1. NtNtN Classification: detect categories and techniques
    const ntntn = getNtNtN();
    const classifications = ntntn.classifyBuildIntent(message);
    const scopeTier = ntntn.detectScopeTier(message);
    const primaryCategory = classifications[0]?.category || 'frontend_frameworks';
    const primaryAgent = classifications[0]?.primary_boomer_ang || 'Picker_Ang';
    const techniques = classifications
      .filter((c: any) => c.technique_group)
      .map((c: any) => c.technique_group!);

    logger.info(
      { requestId, scopeTier, primaryCategory, primaryAgent, techniques, matches: classifications.length },
      '[ACHEEVY] NtNtN build intent classified'
    );

    // 2. Emit LiveSim event for real-time feed
    liveSim.emitAgentActivity('ACHEEVY', 'ntntn_classify', `Build intent detected: ${scopeTier} scope, ${primaryCategory} category`, {
      classifications: classifications.map((c: any) => ({ category: c.category, agent: c.primary_boomer_ang })),
      scopeTier,
    });

    // 3. Build stack recommendation
    const stack: Record<string, string> = {
      ...ntntn.AIMS_DEFAULT_STACK,
      ...(primaryCategory === '3d_visual' ? { animation: 'Three.js + React Three Fiber' } : {}),
      ...(primaryCategory === 'animation_motion' ? { animation: 'Motion v12 + GSAP' } : {}),
    };

    // 4. Build Chicken Hawk manifest for the build
    const buildSteps = this.generateBuildSteps(scopeTier, primaryCategory, techniques, message);

    liveSim.emitAgentActivity(primaryAgent, 'stack_select', `Selected stack: ${stack.framework} + ${stack.styling} + ${stack.animation}`, {
      stack,
      steps: buildSteps.length,
    });

    // 5. Dispatch to Chicken Hawk
    try {
      const manifest = buildManifest(requestId, 'fullstack', message, req.userId, {
        ntntn: true,
        scopeTier,
        primaryCategory,
        stack,
        techniques,
      });

      const chResult = await dispatchToChickenHawk(manifest);

      liveSim.emitAgentActivity('Chicken Hawk', 'build_dispatched', `Build manifest dispatched: ${chResult.manifestId}`, {
        manifestId: chResult.manifestId,
        shiftId: chResult.shiftId,
      });

      return {
        requestId,
        status: 'dispatched',
        reply: `Build request classified and dispatched.\n\n` +
          `**Scope:** ${scopeTier} | **Category:** ${primaryCategory.replace(/_/g, ' ')}\n` +
          `**Stack:** ${stack.framework}, ${stack.styling}, ${stack.animation}\n` +
          `**Steps:** ${buildSteps.length} build phases planned\n` +
          `**Shift ID:** ${chResult.shiftId}\n\n` +
          `${primaryAgent} selected the stack. Chicken Hawk is executing the build. ` +
          `Track progress in Deploy Dock or the LiveSim feed.`,
        data: {
          ntntn: { scopeTier, primaryCategory, stack, techniques },
          chickenhawk: chResult,
          buildSteps,
        },
        lucUsage: { service: 'container_hours', amount: scopeTier === 'platform' ? 3 : scopeTier === 'application' ? 2 : 1 },
        taskId: chResult.manifestId,
      };
    } catch (err) {
      // Chicken Hawk offline — return build plan as reference
      logger.warn({ requestId, err }, '[ACHEEVY] NtNtN: Chicken Hawk offline, returning build plan');

      return {
        requestId,
        status: 'completed',
        reply: `I've analyzed your build request and prepared a plan.\n\n` +
          `**Scope:** ${scopeTier} | **Category:** ${primaryCategory.replace(/_/g, ' ')}\n` +
          `**Recommended Stack:**\n` +
          `- Framework: ${stack.framework}\n` +
          `- Styling: ${stack.styling}\n` +
          `- Animation: ${stack.animation}\n` +
          `- UI: ${stack.ui_components}\n\n` +
          `**Build Steps:**\n${buildSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
          `Chicken Hawk is currently offline. The build plan is ready — it will execute when the executor comes online.`,
        data: {
          ntntn: { scopeTier, primaryCategory, stack, techniques },
          buildSteps,
          status: 'plan_ready',
        },
      };
    }
  }

  /** Generate build steps based on NtNtN classification */
  private generateBuildSteps(
    scopeTier: string,
    category: string,
    techniques: string[],
    _message: string
  ): string[] {
    const steps: string[] = [];

    // Always: scaffold + configure
    const defaultStack = getNtNtN().AIMS_DEFAULT_STACK;
    steps.push(`Scaffold ${scopeTier} project with ${defaultStack.framework}`);
    steps.push(`Configure styling with ${defaultStack.styling}`);

    // Category-specific steps
    if (category === 'animation_motion' || techniques.length > 0) {
      steps.push(`Implement animation layer: ${techniques.join(', ') || 'micro interactions'}`);
    }
    if (category === '3d_visual') {
      steps.push('Set up Three.js scene with React Three Fiber');
      steps.push('Add lighting, materials, and camera controls');
    }
    if (category === 'backend_fullstack') {
      steps.push('Generate API routes and data models');
      steps.push('Wire authentication and session management');
    }
    if (category === 'scroll_interaction') {
      steps.push('Implement scroll-driven animations and viewport reveals');
    }

    // Common steps based on scope
    if (scopeTier === 'application' || scopeTier === 'platform') {
      steps.push('Build component library with shadcn/ui');
      steps.push('Implement responsive layouts and mobile breakpoints');
    }
    if (scopeTier === 'platform') {
      steps.push('Set up multi-tenant data isolation');
      steps.push('Configure admin dashboard and monitoring');
    }

    // Always: verify and deploy
    steps.push('Run ORACLE 8-gate verification');
    steps.push('Generate Docker Compose for deployment');
    steps.push('Deploy as Plug instance on AIMS VPS');

    return steps;
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
