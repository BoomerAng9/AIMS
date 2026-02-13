/**
 * Chicken Hawk — Execution & Coding Bot
 *
 * The workhorse executor. Receives execution plans from Boomer_Ang directors
 * (via the UEF Gateway) and runs them step-by-step under their oversight.
 * Boomer_Angs are the senior specialists who decide WHAT to build —
 * Chicken Hawk sequences their plan, manages retries, tracks cost accrual,
 * and produces final artifacts.
 *
 * Unlike Boomer_Angs (which are domain directors with strategic authority),
 * Chicken Hawk is a general-purpose executor. They work in unison:
 * Boomer_Angs plan, Chicken Hawk and Lil_Hawks execute.
 *
 * Behavior:
 *   1. Receive execution plan from Boomer_Ang director(s)
 *   2. For each step, delegate to the appropriate Lil_Hawk squad or handle directly
 *   3. Execute steps sequentially, accumulating artifacts and costs
 *   4. Return consolidated result to the overseeing Boomer_Ang via UEF Gateway
 */

import logger from '../logger';
import { Agent, AgentId, AgentTaskInput, AgentTaskOutput, failOutput } from './types';
import { registry } from './registry';
import { scoreAndAudit } from '../acheevy/execution-engine';

const profile = {
  id: 'chicken-hawk' as const,
  name: 'Chicken Hawk',
  role: 'Execution Bot & Pipeline Runner',
  capabilities: [
    { name: 'pipeline-execution', weight: 1.0 },
    { name: 'step-sequencing', weight: 0.95 },
    { name: 'cost-tracking', weight: 0.90 },
    { name: 'retry-management', weight: 0.85 },
    { name: 'artifact-assembly', weight: 0.90 },
  ],
  maxConcurrency: 2,
};

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
    // Derive steps from the execution plan context, or generate from query
    const steps = (input.context?.steps as string[]) || deriveSteps(input.intent, input.query);

    logger.info({ taskId: input.taskId, stepCount: steps.length }, '[Chicken Hawk] Pipeline planned');

    const result = await executePipeline(input, steps);

    const completedSteps = result.stepResults.filter(s => s.status === 'completed').length;
    const failedSteps = result.stepResults.filter(s => s.status === 'failed').length;

    const summary = [
      `Pipeline: ${steps.length} steps`,
      `Completed: ${completedSteps}, Failed: ${failedSteps}`,
      `Artifacts: ${result.allArtifacts.length}`,
      `Cost: ${result.totalTokens} tokens ($${result.totalUsd.toFixed(4)})`,
    ].join('\n');

    const status = failedSteps === 0 ? 'COMPLETED' : 'FAILED';

    logger.info(
      { taskId: input.taskId, completed: completedSteps, failed: failedSteps },
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
