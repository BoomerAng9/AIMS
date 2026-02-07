/**
 * Agent Router — Intent-to-Agent Dispatch
 *
 * Maps ACP intents to the right agent (or agent team) and runs the task.
 *
 * Routing strategy:
 *   CHAT             → Marketer_Ang (conversational) + Quality_Ang (verify)
 *   BUILD_PLUG       → ChickenHawk (pipeline) orchestrating Engineer_Ang
 *   RESEARCH         → Analyst_Ang (primary) + Quality_Ang (verify)
 *   AGENTIC_WORKFLOW → ChickenHawk (full pipeline, multi-agent)
 *   ESTIMATE_ONLY    → No agent execution (LUC handles it)
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { registry } from './registry';
import { AgentTaskInput, AgentTaskOutput, AgentId } from './types';

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
      logger.info({ reqId }, '[Router] BUILD_PLUG → ChickenHawk pipeline');
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
      logger.info({ reqId }, '[Router] AGENTIC_WORKFLOW → ChickenHawk multi-agent pipeline');
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

  const primaryAgent = outputs.length > 0 ? outputs[0].agentId : null;

  logger.info(
    { reqId, intent, agentCount: outputs.length, primaryAgent },
    '[Router] Dispatch complete'
  );

  return { executed: outputs.length > 0, agentOutputs: outputs, primaryAgent };
}
