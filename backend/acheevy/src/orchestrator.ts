/**
 * ACHEEVY — Executive Orchestrator
 * Receives user requests, analyzes intent, routes to House of Ang,
 * synthesizes responses, and tracks conversation state.
 *
 * Sessions are persisted to Redis with 7-day TTL.
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
import { analyzeIntent, classifyNtNtN, type NtNtNClassification } from './intent-analyzer';
import { redisGet, redisSet } from './redis';

const HOUSE_OF_ANG_URL = process.env.HOUSE_OF_ANG_URL || 'http://house-of-ang:3002';

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const SESSION_PREFIX = 'acheevy:session:';

/**
 * Get or create a conversation context from Redis.
 */
async function getContext(sessionId: string): Promise<ConversationContext> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  const raw = await redisGet(key);

  if (raw) {
    try {
      return JSON.parse(raw) as ConversationContext;
    } catch {
      console.warn(`[ACHEEVY] Corrupt session data for ${sessionId}, creating new`);
    }
  }

  return {
    sessionId,
    history: [],
    onboardingComplete: false,
    activeGoals: [],
  };
}

/**
 * Save conversation context to Redis.
 */
async function saveContext(context: ConversationContext): Promise<void> {
  const key = `${SESSION_PREFIX}${context.sessionId}`;

  // Cap history at 200 messages to prevent unbounded growth
  if (context.history.length > 200) {
    context.history = context.history.slice(-200);
  }

  await redisSet(key, JSON.stringify(context), SESSION_TTL);
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
    description: 'Run ORACLE 8-Gate verification',
    boomerang_id: 'quality_ang',
    status: 'pending',
  });

  return steps;
}

/**
 * Synthesize a NtNtN Engine response for creative build intents.
 */
function synthesizeNtNtN(
  message: string,
  classification: NtNtNClassification,
  agents: Array<{ id: string; name: string }>,
): string {
  const { scopeTier, matchedCategories } = classification;

  const scopeLabel = {
    component: 'a component',
    page: 'a page',
    application: 'an application',
    platform: 'a platform',
  }[scopeTier];

  let reply = `I understand you want to build **${scopeLabel}**. `;
  reply += `NtNtN Engine classified this as a **${scopeTier}-tier** build.\n\n`;

  if (matchedCategories.length > 0) {
    reply += '**Matched categories:**\n';
    for (const cat of matchedCategories.slice(0, 5)) {
      reply += `- **${cat.category.replace(/_/g, ' ')}**`;
      if (cat.techniqueGroup) reply += ` (${cat.techniqueGroup.replace(/_/g, ' ')})`;
      reply += ` \u2192 routed to **${cat.primaryAng}**\n`;
    }
    reply += '\n';
  }

  reply += '**Default stack:** Next.js 16 + Tailwind v4 + Motion v12 + shadcn/ui\n\n';

  if (agents.length > 0) {
    reply += `**Execution chain:** ${agents.map(a => a.name).join(' \u2192 ')}\n\n`;
  } else {
    reply += '**Execution chain:** Picker_Ang \u2192 Buildsmith \u2192 Chicken Hawk \u2192 Lil_Hawks\n\n';
  }

  reply += 'Reply **"go"** to start the build pipeline, or refine your requirements.';

  return reply;
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
  const context = await getContext(req.sessionId);

  // 1. Analyze intent
  const intent = analyzeIntent(req.message);
  console.log(`[ACHEEVY] Intent: ${intent.primary_intent} (confidence: ${intent.confidence})`);

  // 1b. Check for NtNtN creative build intent
  const ntntn = classifyNtNtN(req.message);
  if (ntntn.isBuildIntent) {
    console.log(`[ACHEEVY] NtNtN build detected \u2014 scope: ${ntntn.scopeTier}, categories: ${ntntn.matchedCategories.map(c => c.category).join(', ')}`);
  }

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

  // 5. Synthesize response — use NtNtN synthesis for creative builds
  const reply = ntntn.isBuildIntent
    ? synthesizeNtNtN(req.message, ntntn, agents)
    : synthesize(req.message, intent.primary_intent, agents, gaps);

  // 6. Estimate LUC cost (heuristic: ~500 tokens per agent interaction)
  const estimatedTokens = 500 + agents.length * 500;
  const estimatedUsd = estimatedTokens * 0.000004; // flash model rate

  // 7. Save to conversation history (persisted to Redis)
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
  await saveContext(context);

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
export async function getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  const context = await getContext(sessionId);
  return context.history;
}
