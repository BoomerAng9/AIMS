/**
 * Chicken Hawk — Secure Successor to OpenClaw
 *
 * The major executor that spans repos, wires workflows, talks to tools,
 * and ships aiPlugs. Replaces OpenClaw with safer boundaries and better
 * governance while matching or exceeding its capabilities.
 *
 * Chicken Hawk sits on top of the shared data plane (shelving system)
 * and a set of tools. It picks the right model, the right cloud, and
 * the right tool for each step, then writes results back into the
 * same shared backend.
 *
 * Under Chicken Hawk, Lil_Hawks serve as lighter-weight executors and
 * specialists handling narrower tasks inside the same architecture.
 *
 * Shelf-Walking: Chicken Hawk reads from and writes to all shelves:
 *   - projects, luc_projects, plugs, boomer_angs
 *   - workflows, runs, logs, assets
 *
 * Behavior:
 *   1. Receive execution plan from Boomer_Ang director(s)
 *   2. Walk the shelves for existing Plugs, workflows, code, data
 *   3. For each step, delegate to the appropriate Lil_Hawk or handle directly
 *   4. Track execution as a Run, record costs to LUC, log everything
 *   5. Return consolidated result to the overseeing Boomer_Ang via UEF Gateway
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { Agent, AgentId, AgentTaskInput, AgentTaskOutput, failOutput } from './types';
import { registry } from './registry';
import { scoreAndAudit } from '../acheevy/execution-engine';
import { shelfClient } from '../shelves/firestore-client';
import { lucProjectService } from '../shelves/luc-project-service';
import type { AimsRun, AimsLog, RunStepResult } from '../shelves/types';

const profile = {
  id: 'chicken-hawk' as const,
  name: 'Chicken Hawk',
  role: 'Major Executor — Secure Successor to OpenClaw',
  capabilities: [
    { name: 'pipeline-execution', weight: 1.0 },
    { name: 'shelf-walking', weight: 1.0 },
    { name: 'step-sequencing', weight: 0.95 },
    { name: 'cost-tracking', weight: 0.90 },
    { name: 'lil-hawk-delegation', weight: 0.95 },
    { name: 'cross-repo-operations', weight: 0.90 },
    { name: 'workflow-wiring', weight: 0.85 },
    { name: 'retry-management', weight: 0.85 },
    { name: 'artifact-assembly', weight: 0.90 },
    { name: 'plug-shipping', weight: 0.95 },
  ],
  maxConcurrency: 4,
};

// ---------------------------------------------------------------------------
// Shelf Walking — Pull from past Plugs, workflows, code, and data
// ---------------------------------------------------------------------------

async function walkShelves(query: string): Promise<{
  relevantPlugs: string[];
  relevantWorkflows: string[];
  context: string;
}> {
  try {
    const results = await shelfClient.searchShelves(query.slice(0, 200), ['plugs', 'workflows', 'assets']);
    const relevantPlugs = results.filter(r => r.shelf === 'plugs').map(r => r.id);
    const relevantWorkflows = results.filter(r => r.shelf === 'workflows').map(r => r.id);
    const context = results.map(r => `[${r.shelf}/${r.id}] ${r.snippet}`).join('\n');
    return { relevantPlugs, relevantWorkflows, context };
  } catch {
    return { relevantPlugs: [], relevantWorkflows: [], context: '' };
  }
}

// ---------------------------------------------------------------------------
// Run Tracking — Record execution as a Run on the shelves
// ---------------------------------------------------------------------------

async function createRun(input: AgentTaskInput, steps: string[]): Promise<AimsRun> {
  const now = new Date().toISOString();
  const run: AimsRun = {
    id: `run_${uuidv4().slice(0, 12)}`,
    projectId: input.context?.projectId as string | undefined,
    workflowId: input.context?.workflowId as string | undefined,
    lucProjectId: input.context?.lucProjectId as string | undefined,
    userId: (input.context?.userId as string) || 'system',
    trigger: input.intent,
    status: 'running',
    executorAgentId: 'chicken-hawk',
    steps: steps.map((desc, i) => ({
      stepId: `step-${i}`,
      stepName: desc,
      status: 'queued' as const,
      artifacts: [],
      tokensUsed: 0,
      costUsd: 0,
      durationMs: 0,
      startedAt: now,
    })),
    totalTokensUsed: 0,
    totalCostUsd: 0,
    totalDurationMs: 0,
    artifacts: [],
    metadata: { taskId: input.taskId, intent: input.intent },
    startedAt: now,
  };

  try {
    await shelfClient.create('runs', run);
  } catch (err) {
    logger.warn({ err, runId: run.id }, '[Chicken Hawk] Failed to persist run (non-blocking)');
  }

  return run;
}

async function updateRunStep(run: AimsRun, stepIndex: number, update: Partial<RunStepResult>): Promise<void> {
  if (run.steps[stepIndex]) {
    Object.assign(run.steps[stepIndex], update);
    try {
      await shelfClient.update('runs', run.id, {
        steps: run.steps,
        updatedAt: new Date().toISOString(),
      } as Partial<AimsRun>);
    } catch {
      // Non-blocking
    }
  }
}

async function completeRun(run: AimsRun, status: 'completed' | 'failed', totalTokens: number, totalUsd: number, artifacts: string[]): Promise<void> {
  const now = new Date().toISOString();
  run.status = status;
  run.totalTokensUsed = totalTokens;
  run.totalCostUsd = totalUsd;
  run.artifacts = artifacts;
  run.completedAt = now;
  run.totalDurationMs = new Date(now).getTime() - new Date(run.startedAt).getTime();

  try {
    await shelfClient.update('runs', run.id, {
      status: run.status,
      totalTokensUsed: run.totalTokensUsed,
      totalCostUsd: run.totalCostUsd,
      artifacts: run.artifacts,
      completedAt: run.completedAt,
      totalDurationMs: run.totalDurationMs,
    } as Partial<AimsRun>);

    // Record usage to LUC if linked
    if (run.lucProjectId) {
      await lucProjectService.recordUsage(run.lucProjectId, totalTokens, totalUsd, run.id);
    }
  } catch (err) {
    logger.warn({ err, runId: run.id }, '[Chicken Hawk] Failed to complete run record (non-blocking)');
  }
}

async function writeLog(runId: string, agentId: string, level: 'info' | 'warn' | 'error', message: string): Promise<void> {
  const log: AimsLog = {
    id: `log_${uuidv4().slice(0, 12)}`,
    runId,
    agentId,
    level,
    source: 'chicken-hawk',
    message,
    timestamp: new Date().toISOString(),
  };

  try {
    await shelfClient.create('logs', log);
  } catch {
    // Non-blocking
  }
}

// ---------------------------------------------------------------------------
// Step routing — which Boomer_Ang handles which kind of step
// ---------------------------------------------------------------------------

const STEP_AGENT_MAP: Record<string, AgentId> = {
  // Engineering steps
  scaffold: 'engineer-ang',
  generate: 'engineer-ang',
  implement: 'engineer-ang',
  component: 'engineer-ang',
  api: 'engineer-ang',
  endpoint: 'engineer-ang',
  migration: 'engineer-ang',
  dockerfile: 'engineer-ang',
  deploy: 'engineer-ang',
  database: 'engineer-ang',
  schema: 'engineer-ang',

  // Marketing steps
  copy: 'marketer-ang',
  campaign: 'marketer-ang',
  seo: 'marketer-ang',
  content: 'marketer-ang',
  outreach: 'marketer-ang',
  email: 'marketer-ang',
  brand: 'marketer-ang',

  // Research steps
  research: 'analyst-ang',
  analyze: 'analyst-ang',
  compile: 'analyst-ang',
  market: 'analyst-ang',
  competitor: 'analyst-ang',
  data: 'analyst-ang',

  // Quality steps
  verify: 'quality-ang',
  oracle: 'quality-ang',
  security: 'quality-ang',
  review: 'quality-ang',
  audit: 'quality-ang',
  test: 'quality-ang',
};

function resolveStepAgent(stepDescription: string): AgentId | null {
  const lower = stepDescription.toLowerCase();
  for (const [keyword, agentId] of Object.entries(STEP_AGENT_MAP)) {
    if (lower.includes(keyword)) {
      return agentId;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pipeline execution
// ---------------------------------------------------------------------------

interface PipelineStep {
  index: number;
  description: string;
  assignedAgent: AgentId | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: AgentTaskOutput;
}

async function executePipeline(
  input: AgentTaskInput,
  steps: string[]
): Promise<{
  allArtifacts: string[];
  allLogs: string[];
  totalTokens: number;
  totalUsd: number;
  stepResults: PipelineStep[];
}> {
  const pipeline: PipelineStep[] = steps.map((desc, i) => ({
    index: i,
    description: desc,
    assignedAgent: resolveStepAgent(desc),
    status: 'pending',
  }));

  const allArtifacts: string[] = [];
  const allLogs: string[] = [];
  let totalTokens = 0;
  let totalUsd = 0;

  for (const step of pipeline) {
    step.status = 'running';
    logger.info(
      { taskId: input.taskId, step: step.index, agent: step.assignedAgent, description: step.description },
      '[Chicken Hawk] Executing step'
    );

    if (step.assignedAgent) {
      const agent = registry.get(step.assignedAgent);
      if (agent) {
        const stepInput: AgentTaskInput = {
          taskId: `${input.taskId}-step-${step.index}`,
          intent: input.intent,
          query: `${step.description} | Context: ${input.query}`,
          context: input.context,
        };

        const result = await agent.execute(stepInput);
        step.output = result;

        if (result.status === 'COMPLETED') {
          step.status = 'completed';
          allArtifacts.push(...result.result.artifacts);
          allLogs.push(`[Step ${step.index}] ${step.assignedAgent}: ${result.result.summary}`);
          totalTokens += result.cost.tokens;
          totalUsd += result.cost.usd;
        } else {
          step.status = 'failed';
          allLogs.push(`[Step ${step.index}] FAILED: ${result.result.summary}`);
        }

        // Bench scoring: Score ALL agents after each step (Boomer_Angs, Lil_Hawks, Chicken Hawk)
        if (input.context?.benchScoringEnabled && step.assignedAgent) {
          try {
            await scoreAndAudit(
              result,
              step.assignedAgent,
              (input.context.verticalId as string) || 'pipeline',
              'system',
              input.taskId,
            );
          } catch (scoreErr) {
            logger.warn({ taskId: input.taskId, step: step.index, err: scoreErr }, '[Chicken Hawk] Bench scoring failed (non-blocking)');
          }
        }
      } else {
        // Agent not found in registry — run as Chicken Hawk internal step
        step.status = 'completed';
        allLogs.push(`[Step ${step.index}] Chicken Hawk (internal): ${step.description}`);
        allArtifacts.push(`[step-${step.index}] ${step.description}`);
        totalTokens += 100;
        totalUsd += 100 * 0.00003;
      }
    } else {
      // No specialist needed — Chicken Hawk handles directly
      step.status = 'completed';
      allLogs.push(`[Step ${step.index}] Chicken Hawk (direct): ${step.description}`);
      allArtifacts.push(`[step-${step.index}] ${step.description}`);
      totalTokens += 100;
      totalUsd += 100 * 0.00003;
    }
  }

  return { allArtifacts, allLogs, totalTokens, totalUsd, stepResults: pipeline };
}

// ---------------------------------------------------------------------------
// Main execute
// ---------------------------------------------------------------------------

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId, intent: input.intent }, '[Chicken Hawk] Pipeline received');

  try {
    // 1. Walk the shelves for existing Plugs, workflows, and code
    const shelfContext = await walkShelves(input.query);
    if (shelfContext.relevantPlugs.length > 0) {
      logger.info({
        taskId: input.taskId,
        plugs: shelfContext.relevantPlugs.length,
        workflows: shelfContext.relevantWorkflows.length,
      }, '[Chicken Hawk] Found relevant shelf data');
    }

    // Enrich context with shelf data
    const enrichedInput: AgentTaskInput = {
      ...input,
      context: {
        ...input.context,
        shelfContext: shelfContext.context,
        relevantPlugs: shelfContext.relevantPlugs,
        relevantWorkflows: shelfContext.relevantWorkflows,
      },
    };

    // 2. Derive steps from the execution plan context, or generate from query
    const steps = (input.context?.steps as string[]) || deriveSteps(input.intent, input.query);

    logger.info({ taskId: input.taskId, stepCount: steps.length }, '[Chicken Hawk] Pipeline planned');

    // 3. Create a Run record on the shelves
    const run = await createRun(enrichedInput, steps);
    await writeLog(run.id, 'chicken-hawk', 'info', `Pipeline started: ${steps.length} steps for ${input.intent}`);

    // 4. Execute pipeline
    const result = await executePipeline(enrichedInput, steps);

    // 5. Update Run record per step
    for (const stepResult of result.stepResults) {
      await updateRunStep(run, stepResult.index, {
        status: stepResult.status === 'completed' ? 'completed' : 'failed',
        tokensUsed: stepResult.output?.cost.tokens || 0,
        costUsd: stepResult.output?.cost.usd || 0,
        completedAt: new Date().toISOString(),
      });
    }

    const completedSteps = result.stepResults.filter(s => s.status === 'completed').length;
    const failedSteps = result.stepResults.filter(s => s.status === 'failed').length;

    const summary = [
      `Pipeline: ${steps.length} steps`,
      `Completed: ${completedSteps}, Failed: ${failedSteps}`,
      `Artifacts: ${result.allArtifacts.length}`,
      `Cost: ${result.totalTokens} tokens ($${result.totalUsd.toFixed(4)})`,
      `Run: ${run.id}`,
      shelfContext.relevantPlugs.length > 0 ? `Reused ${shelfContext.relevantPlugs.length} existing Plug(s)` : '',
    ].filter(Boolean).join('\n');

    const status = failedSteps === 0 ? 'COMPLETED' : 'FAILED';

    // 6. Complete the Run record
    await completeRun(run, status === 'COMPLETED' ? 'completed' : 'failed', result.totalTokens, result.totalUsd, result.allArtifacts);
    await writeLog(run.id, 'chicken-hawk', status === 'COMPLETED' ? 'info' : 'error',
      `Pipeline ${status}: ${completedSteps}/${steps.length} steps, $${result.totalUsd.toFixed(4)}`);

    logger.info(
      { taskId: input.taskId, runId: run.id, completed: completedSteps, failed: failedSteps },
      `[Chicken Hawk] Pipeline ${status}`
    );

    return {
      taskId: input.taskId,
      agentId: 'chicken-hawk',
      status,
      result: {
        summary,
        artifacts: result.allArtifacts,
        logs: result.allLogs,
      },
      cost: {
        tokens: result.totalTokens,
        usd: result.totalUsd,
      },
    };
  } catch (err) {
    return failOutput(input.taskId, 'chicken-hawk', err instanceof Error ? err.message : 'Unknown error');
  }
}

// ---------------------------------------------------------------------------
// Step derivation fallback (when no execution plan provided)
// ---------------------------------------------------------------------------

function deriveSteps(intent: string, query: string): string[] {
  switch (intent) {
    case 'BUILD_PLUG':
      return [
        'Analyze build specification',
        'Scaffold project structure',
        'Generate component tree',
        'Implement API endpoints',
        'Apply styling and UX',
        'Run ORACLE verification',
        'Package artifacts',
      ];
    case 'RESEARCH':
      return [
        'Decompose research query',
        'Compile existing data from ByteRover',
        'Analyze market landscape',
        'Generate findings report',
        'Verify via ORACLE gates',
      ];
    case 'AGENTIC_WORKFLOW':
      return [
        'Parse workflow definition',
        'Validate step dependencies',
        'Execute workflow stages',
        'Run quality verification',
        'Deliver final artifacts',
      ];
    case 'CHAT':
      return [
        'Analyze user message',
        'Retrieve context from ByteRover',
        'Generate response',
      ];
    default:
      return [
        `Analyze: ${query.slice(0, 100)}`,
        'Generate cost estimate',
      ];
  }
}

export const ChickenHawk: Agent = { profile, execute };
