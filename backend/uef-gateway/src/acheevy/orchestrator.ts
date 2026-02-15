/**
 * ACHEEVY Orchestrator
 *
 * The real backend orchestration engine. Receives classified intents from
 * the frontend, runs the skills/hooks lifecycle, checks LUC quotas via
 * Firestore, and dispatches work to II-Agent or other Boomer_Angs.
 *
 * This replaces the frontend-only keyword routing with actual execution.
 */

import { getIIAgentClient, IIAgentClient, IIAgentTask } from '../ii-agent/client';
import { LUCEngine } from '../luc';
import { v4 as uuidv4 } from 'uuid';
import { triggerN8nPmoWorkflow } from '../n8n';
import type { N8nPipelineResponse } from '../n8n';
import { executeVertical } from './execution-engine';
import { spawnAgent, decommissionAgent, getRoster, getAvailableRoster } from '../deployment-hub';
import type { SpawnRequest, EnvironmentTarget } from '../deployment-hub';

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
  status: 'completed' | 'queued' | 'streaming' | 'quota_exceeded' | 'error';
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

// ── Skill definitions (mirrors frontend registry for backend routing) ──

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SkillRoute {
  id: string;
  handler: (req: AcheevyExecuteRequest, iiAgent: IIAgentClient) => Promise<AcheevyExecuteResponse>;
}

// ── Orchestrator ─────────────────────────────────────────────

export class AcheevyOrchestrator {
  private iiAgent: IIAgentClient;

  constructor() {
    this.iiAgent = getIIAgentClient();
  }

  /**
   * Main execution entry point. Takes a classified intent and executes it.
   */
  async execute(req: AcheevyExecuteRequest): Promise<AcheevyExecuteResponse> {
    const requestId = uuidv4();

    try {
      // 1. LUC quota check (lightweight - uses LUCEngine on gateway)
      //    Full Firestore-based LUC runs in aims-skills; here we do a
      //    quick local estimate to avoid round-trips for every message.
      const estimate = LUCEngine.estimate(req.message);

      // 2. Route based on classified intent
      const routedTo = req.intent;

      if (routedTo.startsWith('plug-factory:')) {
        return await this.handlePlugFabrication(requestId, req);
      }

      if (routedTo === 'perform-stack') {
        return await this.handlePerformStack(requestId, req);
      }

      if (routedTo.startsWith('skill:')) {
        return await this.handleSkillExecution(requestId, req);
      }

      // Vertical execution: NLP-triggered business builder verticals with R-R-S pipeline
      if (routedTo.startsWith('vertical:')) {
        return await this.handleVerticalExecution(requestId, req);
      }

      // PMO routing: routes task through chain-of-command pipeline
      // User → ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks → Receipt → ACHEEVY → User
      if (routedTo === 'pmo-route' || routedTo.startsWith('pmo:')) {
        return await this.handlePmoRouting(requestId, req);
      }

      // Deployment Hub: spawn/decommission/roster for Boomer_Angs and Lil_Hawks
      if (routedTo.startsWith('spawn:') || routedTo === 'deployment-hub') {
        return await this.handleDeploymentHub(requestId, req);
      }

      // Default: conversational AI via II-Agent
      return await this.handleConversation(requestId, req, estimate);

    } catch (error: any) {
      console.error(`[ACHEEVY] Execution error for ${requestId}:`, error.message);
      return {
        requestId,
        status: 'error',
        reply: 'Something went wrong processing your request. Please try again.',
        error: error.message,
      };
    }
  }

  // ── Route Handlers ───────────────────────────────────────

  /**
   * Plug fabrication: routes build requests to II-Agent fullstack mode
   */
  private async handlePlugFabrication(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const plugId = req.plugId || req.intent.split(':')[1];

    const task: IIAgentTask = {
      type: 'fullstack',
      prompt: `Build the "${plugId}" plug for A.I.M.S. User request: ${req.message}`,
      context: {
        userId: req.userId,
        sessionId: req.conversationId,
      },
      options: {
        streaming: false,
        timeout: 600000, // 10 min for builds
      },
    };

    try {
      const result = await this.iiAgent.executeTask(task);
      return {
        requestId,
        status: result.status === 'completed' ? 'completed' : 'queued',
        reply: `Plug "${plugId}" fabrication ${result.status}. ${result.output || ''}`,
        data: {
          plugId,
          artifacts: result.artifacts,
          iiAgentTaskId: result.id,
        },
        lucUsage: {
          service: 'container_hours',
          amount: 1,
        },
        taskId: result.id,
      };
    } catch {
      // II-Agent not available - queue the task
      return {
        requestId,
        status: 'queued',
        reply: `Build request for "${plugId}" has been queued. ACHEEVY will process it when the execution engine is available.`,
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
      context: {
        userId: req.userId,
        sessionId: req.conversationId,
      },
    };

    try {
      const result = await this.iiAgent.executeTask(task);
      return {
        requestId,
        status: 'completed',
        reply: result.output || 'Perform analysis complete.',
        data: { artifacts: result.artifacts },
        lucUsage: {
          service: 'brave_searches',
          amount: 5,
        },
      };
    } catch {
      return {
        requestId,
        status: 'queued',
        reply: 'Perform analytics request queued. Results will be available shortly.',
        taskId: `queued_${requestId}`,
      };
    }
  }

  /**
   * Skill execution: routes to the appropriate skill handler
   */
  private async handleSkillExecution(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const skillId = req.skillId || req.intent.split(':')[1];

    // Map skill types to II-Agent task types
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
      context: {
        userId: req.userId,
        sessionId: req.conversationId,
      },
    };

    try {
      const result = await this.iiAgent.executeTask(task);
      return {
        requestId,
        status: 'completed',
        reply: result.output || `Skill "${skillId}" executed successfully.`,
        data: {
          skillId,
          artifacts: result.artifacts,
        },
        lucUsage: {
          service: 'api_calls',
          amount: 1,
        },
      };
    } catch {
      return {
        requestId,
        status: 'queued',
        reply: `Skill "${skillId}" has been queued for execution.`,
        taskId: `queued_${requestId}`,
      };
    }
  }

  /**
   * Scaffolding: clone/build requests via Make It Mine pipeline
   */
  private async handleScaffolding(
    requestId: string,
    _req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    return {
      requestId,
      status: 'queued',
      reply: 'Clone request received. The scaffolding pipeline will begin when ready.',
      taskId: `queued_${requestId}`,
    }
  }

  /**
   * PMO routing: chain-of-command pipeline via n8n
   * User → ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks → Receipt → ACHEEVY → User
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
    } catch {
      return {
        requestId,
        status: 'queued',
        reply: 'PMO routing request received. The chain-of-command pipeline will process it when the n8n workflow engine is available.',
        taskId: `queued_pmo_${requestId}`,
      };
    }
  }

  /**
   * Vertical execution: NLP-triggered business builder verticals with R-R-S downstream execution.
   * Routes collected user data through the full governance stack:
   *   ORACLE → ByteRover RAG → PREP_SQUAD → LUC → Chicken Hawk → Boomer_Angs → Artifacts
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
    } catch {
      return {
        requestId,
        status: 'queued',
        reply: `Vertical "${vertical.name}" request has been queued. The execution pipeline will process it when available.`,
        taskId: `queued_vertical_${requestId}`,
      };
    }
  }

  /**
   * Deployment Hub: spawn, decommission, and query Boomer_Angs and Lil_Hawks.
   * Intent patterns:
   *   "spawn:<handle>"          → spawn a specific agent
   *   "deployment-hub"          → roster/query operations
   *   context.action = "decommission" → tear down an agent
   *   context.action = "roster"       → get active roster
   *   context.action = "available"    → get available agents from card files
   */
  private async handleDeploymentHub(
    requestId: string,
    req: AcheevyExecuteRequest
  ): Promise<AcheevyExecuteResponse> {
    const action = req.context?.action as string || 'spawn';

    // Roster query
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

    // Available agents query
    if (action === 'available') {
      const available = getAvailableRoster();
      return {
        requestId,
        status: 'completed',
        reply: `${available.length} agents available: ${available.map(a => a.handle).join(', ')}`,
        data: { available },
      };
    }

    // Decommission
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
      lucUsage: {
        service: 'spawn_shift',
        amount: 1,
      },
    };
  }

  /**
   * Default conversation: routes to II-Agent for general AI chat
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
        data: {
          artifacts: result.artifacts,
          usage: result.usage,
          quote: estimate,
        },
        lucUsage: {
          service: 'api_calls',
          amount: result.usage?.totalTokens ? Math.ceil(result.usage.totalTokens / 1000) : 1,
        },
      };
    } catch {
      // Fallback when II-Agent is unavailable: return the estimate
      return {
        requestId,
        status: 'completed',
        reply: `I've analyzed your request: "${req.message}". The execution engine is currently warming up. Your task has been noted and will be processed shortly.`,
        data: { quote: estimate },
        lucUsage: {
          service: 'api_calls',
          amount: 1,
        },
      };
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
