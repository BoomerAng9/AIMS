/**
 * ACHEEVY — Executive Orchestrator
 * Receives user requests, analyzes intent, routes to House of Ang,
 * synthesizes responses, and tracks conversation state.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AcheevyRequest,
  AcheevyResponse,
  ConversationContext,
  ChatMessage,
  DispatchedBoomerAng,
  ActionStep,
} from './types';
import { analyzeIntent } from './intent-analyzer';

const HOUSE_OF_ANG_URL = process.env.HOUSE_OF_ANG_URL || 'http://house-of-ang:3002';

// In-memory session store (replace with Firestore/Redis in production)
const sessions = new Map<string, ConversationContext>();

/**
 * Get or create a conversation context.
 */
function getContext(sessionId: string): ConversationContext {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      history: [],
      onboardingComplete: false,
      activeGoals: [],
    });
  }
  return sessions.get(sessionId)!;
}

/**
 * Route capabilities through the House of Ang service.
 */
async function routeToHouseOfAng(capabilities: string[]): Promise<{
  agents: Array<{ id: string; name: string; description: string; endpoint: string }>;
  gaps: string[];
}> {
  try {
    const res = await fetch(`${HOUSE_OF_ANG_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capabilities }),
    });
    if (!res.ok) throw new Error(`House of Ang returned ${res.status}`);
    return await res.json() as { agents: Array<{ id: string; name: string; description: string; endpoint: string }>; gaps: string[] };
  } catch (err) {
    console.warn('[ACHEEVY] House of Ang unreachable, running in standalone mode');
    return { agents: [], gaps: capabilities };
  }
}

/**
 * Build an action plan from matched BoomerAngs.
 */
function buildActionPlan(
  agents: Array<{ id: string; name: string }>,
  intent: string
): ActionStep[] {
  const steps: ActionStep[] = [
    {
      step: 1,
      description: `Analyze "${intent}" request via AVVA NOON`,
      boomerang_id: null,
      status: 'done',
    },
  ];

  agents.forEach((agent, i) => {
    steps.push({
      step: i + 2,
      description: `Execute via ${agent.name}`,
      boomerang_id: agent.id,
      status: 'pending',
    });
  });

  steps.push({
    step: steps.length + 1,
    description: 'Run ORACLE 7-Gate verification',
    boomerang_id: 'quality_ang',
    status: 'pending',
  });

  return steps;
}

/**
 * Generate a response message based on intent and routing results.
 */
function synthesize(
  message: string,
  intent: string,
  agents: Array<{ id: string; name: string }>,
  gaps: string[],
): string {
  if (intent === 'chat') {
    return 'I received your message. How can I help you today? You can ask me to research topics, build websites, generate content, automate workflows, and more.';
  }

  const agentNames = agents.map(a => a.name).join(', ');

  let reply = `I understand you want to **${intent.replace(/_/g, ' ')}**. `;

  if (agents.length > 0) {
    reply += `I've identified ${agents.length} Boomer_Ang${agents.length > 1 ? 's' : ''} for this task: **${agentNames}**. `;
    reply += 'An action plan and LUC cost estimate are attached. ';
    reply += 'Reply **"go"** to approve and execute, or refine your request.';
  } else {
    reply += 'However, no Boomer_Angs are currently online to handle this. ';
    reply += 'The required capabilities will be available once the agent containers are deployed.';
  }

  if (gaps.length > 0) {
    reply += ` (Missing capabilities: ${gaps.join(', ')})`;
  }

  return reply;
}

/**
 * Main orchestration method.
 */
export async function processRequest(req: AcheevyRequest): Promise<AcheevyResponse> {
  const context = getContext(req.sessionId);

  // 1. Analyze intent
  const intent = analyzeIntent(req.message);
  console.log(`[ACHEEVY] Intent: ${intent.primary_intent} (confidence: ${intent.confidence})`);

  // 2. Route through House of Ang
  const { agents, gaps } = intent.capabilities_needed.length > 0
    ? await routeToHouseOfAng(intent.capabilities_needed)
    : { agents: [], gaps: [] };

  // 3. Build action plan
  const actionPlan = agents.length > 0
    ? buildActionPlan(agents, intent.primary_intent)
    : undefined;

  // 4. Build dispatched list (all queued, actual execution happens on approval)
  const dispatched: DispatchedBoomerAng[] = agents.map(a => ({
    id: a.id,
    name: a.name,
    status: 'queued' as const,
  }));

  // 5. Synthesize response
  const reply = synthesize(req.message, intent.primary_intent, agents, gaps);

  // 6. Estimate LUC cost (heuristic: ~500 tokens per agent interaction)
  const estimatedTokens = 500 + agents.length * 500;
  const estimatedUsd = estimatedTokens * 0.000004; // flash model rate

  // 7. Save to conversation history
  const userMsg: ChatMessage = {
    role: 'user',
    content: req.message,
    timestamp: new Date().toISOString(),
  };
  const acheevyMsg: ChatMessage = {
    role: 'acheevy',
    content: reply,
    timestamp: new Date().toISOString(),
    metadata: {
      intent: intent.primary_intent,
      boomerangs_invoked: agents.map(a => a.id),
      luc_cost: estimatedUsd,
    },
  };
  context.history.push(userMsg, acheevyMsg);

  return {
    sessionId: req.sessionId,
    reply,
    intent,
    boomerangs_dispatched: dispatched,
    luc_debit: {
      tokens_used: estimatedTokens,
      usd_cost: estimatedUsd,
    },
    action_plan: actionPlan,
  };
}

/**
 * Retrieve conversation history for a session.
 */
export function getSessionHistory(sessionId: string): ChatMessage[] {
  return getContext(sessionId).history;
}
