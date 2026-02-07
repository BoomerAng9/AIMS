/**
 * Agent LLM Bridge — Connects Boomer_Angs to OpenRouter
 *
 * Each agent calls agentChat() to get LLM-powered responses.
 * When OpenRouter is not configured, returns null so agents
 * can fall back to their heuristic logic.
 *
 * Voltron piece: This is the neural link between the power source
 * (OpenRouter) and each individual lion (Boomer_Ang).
 */

import { openrouter, DEFAULT_MODEL } from './openrouter';
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
}

/**
 * Send a task to the LLM as a specific agent persona.
 * Returns null if OpenRouter is not configured (agents fall back to heuristics).
 */
export async function agentChat(opts: AgentChatOptions): Promise<LLMResult | null> {
  if (!openrouter.isConfigured()) {
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
    return await openrouter.chat({
      model: opts.model || DEFAULT_MODEL,
      messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: 0.7,
    });
  } catch (err) {
    logger.error({ agentId: opts.agentId, err }, '[AgentLLM] LLM call failed — agent will use heuristic fallback');
    return null;
  }
}
