/**
 * Agent LLM Bridge — Connects Boomer_Angs to the Unified LLM Gateway
 *
 * Each agent calls agentChat() to get LLM-powered responses.
 * When no LLM provider is configured, returns null so agents
 * can fall back to their heuristic logic.
 *
 * Routing: Vertex AI (Claude/Gemini) → OpenRouter fallback → stub.
 * All calls are metered through the usage tracker for LUC billing.
 *
 * Thinking Level Integration:
 *   Model Intelligence Engine auto-selects the optimal thinking level
 *   based on the agent's intent → task type classification.
 *   This is the 80/20 Rule in action: 80% of agent calls run on
 *   LOW or MEDIUM thinking, 20% get HIGH for deep reasoning.
 */

import { llmGateway } from './gateway';
import { DEFAULT_MODEL } from './openrouter';
import type { LLMResult, ChatMessage } from './openrouter';
import { AGENT_SYSTEM_PROMPTS } from './agent-prompts';
import logger from '../logger';

// Model Intelligence lives in aims-skills (outside this package's tsconfig include).
// Use dynamic require like orchestrator.ts pattern — gracefully degrade if unavailable.
let modelIntelligence: { selectModel: (params: { message: string; agentRole?: string }) => { primaryTask: string; thinkingLevel?: { level: 'low' | 'medium' | 'high'; reason: string } } } | null = null;
try {
  const mod = require('../../../../aims-skills/acheevy-verticals/model-intelligence');
  modelIntelligence = mod.modelIntelligence || null;
} catch {
  logger.info('[AgentLLM] Model Intelligence Engine not available — thinking levels will use defaults');
}

export interface AgentChatOptions {
  agentId: string;
  query: string;
  intent: string;
  context?: string;
  model?: string;
  maxTokens?: number;
  userId?: string;
  sessionId?: string;
  /** Override auto-detected thinking level. If not set, Model Intelligence picks it. */
  thinking_level?: 'low' | 'medium' | 'high';
}

/**
 * Send a task to the LLM as a specific agent persona.
 * Returns null if no LLM provider is configured (agents fall back to heuristics).
 *
 * Thinking level is auto-selected by Model Intelligence from the agent's intent:
 *   - Buildsmith building code → HIGH thinking
 *   - Scout_Ang researching → MEDIUM thinking
 *   - Gatekeeper routing → LOW thinking
 *   - Override with opts.thinking_level when you know better
 */
export async function agentChat(opts: AgentChatOptions): Promise<LLMResult | null> {
  if (!llmGateway.isConfigured()) {
    return null;
  }

  const systemPrompt = AGENT_SYSTEM_PROMPTS[opts.agentId];
  if (!systemPrompt) {
    logger.warn({ agentId: opts.agentId }, '[AgentLLM] No system prompt for agent');
    return null;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add context if provided (e.g., ByteRover patterns, prior step outputs)
  if (opts.context) {
    messages.push({
      role: 'user',
      content: `Context from prior analysis:\n${opts.context}`,
    });
    messages.push({
      role: 'assistant',
      content: 'Understood. I have the context. Please provide the task.',
    });
  }

  // The actual task
  messages.push({
    role: 'user',
    content: `Intent: ${opts.intent}\n\nTask: ${opts.query}`,
  });

  // ── Thinking Level Selection ──────────────────────────────────────
  // Use explicit override, or let Model Intelligence auto-select from intent.
  // The selectModel() call classifies the task and picks the right level.
  let thinkingLevel = opts.thinking_level;
  const selectedModel = opts.model || DEFAULT_MODEL;

  if (!thinkingLevel && modelIntelligence) {
    try {
      const selection = modelIntelligence.selectModel({
        message: `${opts.intent}: ${opts.query}`,
        agentRole: opts.agentId,
      });
      thinkingLevel = selection.thinkingLevel?.level;

      if (thinkingLevel) {
        logger.info({
          agentId: opts.agentId,
          task: selection.primaryTask,
          thinkingLevel,
          reason: selection.thinkingLevel?.reason,
        }, '[AgentLLM] Auto-selected thinking level');
      }
    } catch {
      // Model Intelligence classification failed — proceed without thinking level
    }
  }

  try {
    const result = await llmGateway.chat({
      model: selectedModel,
      messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: 0.7,
      agentId: opts.agentId,
      userId: opts.userId || 'agent-system',
      sessionId: opts.sessionId || 'agent-dispatch',
      thinking_level: thinkingLevel,
    });
    return result;
  } catch (err) {
    logger.error({ agentId: opts.agentId, err }, '[AgentLLM] LLM call failed — agent will use heuristic fallback');
    return null;
  }
}
