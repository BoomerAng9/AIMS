/**
 * Agent Router — Intent-to-Agent Dispatch
 *
 * Maps ACP intents to the right agent (or agent team) and runs the task.
 *
 * Routing strategy (Boomer_Angs direct, Chicken Hawk + Lil_Hawks execute):
 *   CHAT             → Marketer_Ang (director) + Test_Ang/Quality_Ang (verify)
 *   BUILD_PLUG       → Code_Ang/Engineer_Ang (director) + Chicken Hawk (executor) + Test_Ang/Quality_Ang (verify)
 *   RESEARCH         → Research_Ang/Analyst_Ang (director) + Test_Ang/Quality_Ang (verify)
 *   AGENTIC_WORKFLOW → Chicken Hawk (executor, multi-step pipeline under Boomer_Ang oversight)
 *   ESTIMATE_ONLY    → No agent execution (LUC handles it)
 *
 * Agent names follow [Function]_Ang convention per Platform Directive.
 * See pmo/persona-catalog.ts DIRECTIVE_AGENT_ALIASES for name mapping.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { registry } from './registry';
import { AgentTaskInput, AgentTaskOutput, AgentId } from './types';
import { scoreAndAudit } from '../acheevy/execution-engine';

export interface RouterResult {
  executed: boolean;
  agentOutputs: AgentTaskOutput[];
  primaryAgent: AgentId | null;
}

export async function routeToAgents(
  intent: string,
  query: string,
  executionSteps: string[],
  reqId: string
): Promise<RouterResult> {

  if (intent === 'ESTIMATE_ONLY') {
    logger.info({ reqId }, '[Router] ESTIMATE_ONLY — no agent dispatch');
    return { executed: false, agentOutputs: [], primaryAgent: null };
  }

  const baseInput: AgentTaskInput = {
    taskId: `${reqId}-${uuidv4().slice(0, 8)}`,
    intent,
    query,
    context: { steps: executionSteps },
  };

  const outputs: AgentTaskOutput[] = [];

  switch (intent) {
    case 'CHAT': {
      // Chat: lightweight — just run the query through the team
      logger.info({ reqId }, '[Router] CHAT → direct response path');
      const agent = registry.get('marketer-ang') || registry.get('engineer-ang');
      if (agent) {
        const result = await agent.execute(baseInput);
        outputs.push(result);
      }
      break;
    }

    case 'BUILD_PLUG': {
      // Build: Chicken Hawk orchestrates the full pipeline
      logger.info({ reqId }, '[Router] BUILD_PLUG → Chicken Hawk pipeline');
      const hawk = registry.get('chicken-hawk');
      if (hawk) {
        const result = await hawk.execute(baseInput);
        outputs.push(result);
      }

      // Run Quality_Ang verification on the build output
      const qa = registry.get('quality-ang');
      if (qa) {
        const qaResult = await qa.execute({
          ...baseInput,
          taskId: `${baseInput.taskId}-qa`,
        });
        outputs.push(qaResult);
      }
      break;
    }

    case 'RESEARCH': {
      // Research: Analyst_Ang does the heavy lifting
      logger.info({ reqId }, '[Router] RESEARCH → Analyst_Ang');
      const analyst = registry.get('analyst-ang');
      if (analyst) {
        const result = await analyst.execute(baseInput);
        outputs.push(result);
      }

      // QA verification
      const qa = registry.get('quality-ang');
      if (qa) {
        const qaResult = await qa.execute({
          ...baseInput,
          taskId: `${baseInput.taskId}-qa`,
        });
        outputs.push(qaResult);
      }
      break;
    }

    case 'AGENTIC_WORKFLOW': {
      // Full workflow: Chicken Hawk runs entire multi-agent pipeline
      logger.info({ reqId }, '[Router] AGENTIC_WORKFLOW → Chicken Hawk multi-agent pipeline');
      const hawk = registry.get('chicken-hawk');
      if (hawk) {
        const result = await hawk.execute(baseInput);
        outputs.push(result);
      }
      break;
    }

    default: {
      logger.warn({ reqId, intent }, '[Router] Unknown intent — no agent dispatch');
    }
  }

  // Bench scoring: ALL team members are scored after execution
  // Efficiency tracking applies to Boomer_Angs, Chicken Hawk, and Lil_Hawks alike
  for (const output of outputs) {
    try {
      await scoreAndAudit(
        output,
        output.agentId,
        'router-dispatch',
        'system',
        reqId,
      );
    } catch (scoreErr) {
      logger.warn({ reqId, agentId: output.agentId, err: scoreErr }, '[Router] Bench scoring failed (non-blocking)');
    }
  }

  const primaryAgent = outputs.length > 0 ? outputs[0].agentId : null;

  logger.info(
    { reqId, intent, agentCount: outputs.length, primaryAgent },
    '[Router] Dispatch complete'
  );

  return { executed: outputs.length > 0, agentOutputs: outputs, primaryAgent };
}
