/**
 * LLM Module — A.I.M.S. Language Model Interface
 *
 * Voltron piece: The power source.
 * Currently backed by OpenRouter. Swap-friendly by design.
 */

export { openrouter, MODELS, DEFAULT_MODEL } from './openrouter';
export type { LLMResult, ChatMessage, ChatRequest, ModelSpec } from './openrouter';
export { agentChat } from './agent-llm';
export type { AgentChatOptions } from './agent-llm';
export { AGENT_SYSTEM_PROMPTS } from './agent-prompts';
