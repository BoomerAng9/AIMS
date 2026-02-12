/**
 * LLM Module — A.I.M.S. Language Model Interface
 *
 * Unified gateway: Vertex AI (Claude/Gemini) → OpenRouter fallback.
 * All calls metered through usage tracker for LUC billing.
 */

// Unified gateway (preferred entry point)
export { llmGateway } from './gateway';
export type { GatewayRequest, GatewayStreamRequest } from './gateway';

// Usage tracking
export { usageTracker } from './usage-tracker';
export type { UsageRecord, UsageSummary } from './usage-tracker';

// Vertex AI client (used internally by gateway)
export { vertexAI, VERTEX_MODELS } from './vertex-ai';

// OpenRouter client (used internally by gateway, kept for backward compat)
export { openrouter, MODELS, DEFAULT_MODEL } from './openrouter';
export type { LLMResult, ChatMessage, ChatRequest, ModelSpec } from './openrouter';

// Agent bridge
export { agentChat } from './agent-llm';
export type { AgentChatOptions } from './agent-llm';
export { AGENT_SYSTEM_PROMPTS } from './agent-prompts';
