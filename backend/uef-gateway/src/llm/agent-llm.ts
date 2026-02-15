/**
 * Agent LLM Bridge — Connects Boomer_Angs to the Unified LLM Gateway
 *
 * Each agent calls agentChat() to get LLM-powered responses.
 * When no LLM provider is configured, returns null so agents
 * can fall back to their heuristic logic.
 *
 * Routing: Vertex AI (Claude/Gemini) → OpenRouter fallback → stub.
 * All calls are metered through the usage tracker for LUC billing.
 */

import { llmGateway } from './gateway';
import { DEFAULT_MODEL } from './openrouter';
import type { LLMResult, ChatMessage } from './openrouter';
import { AGENT_SYSTEM_PROMPTS } from './agent-prompts';
import logger from '../logger';

export interface AgentChatOptions {
  agentId: string;
  query: string;
  intent: string;
  context?: string;
  model?: string;
  maxTokens?: number;
  userId?: string;
  sessionId?: string;
}

/**
 * Send a task to the LLM as a specific agent persona.
 * Returns null if no LLM provider is configured (agents fall back to heuristics).
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

  try {
    const result = await llmGateway.chat({
      model: opts.model || DEFAULT_MODEL,
      messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: 0.7,
      agentId: opts.agentId,
      userId: opts.userId || 'agent-system',
      sessionId: opts.sessionId || 'agent-dispatch',
    });
    return result;
  } catch (err) {
    logger.error({ agentId: opts.agentId, err }, '[AgentLLM] LLM call failed — agent will use heuristic fallback');
    return null;
  }
}
