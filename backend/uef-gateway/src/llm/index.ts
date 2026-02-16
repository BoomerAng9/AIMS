/**
 * LLM Module — A.I.M.S. Language Model Interface
 *
 * Multi-model, multi-cloud, multi-tool:
 *   1. Vertex AI (Claude + Gemini) — GCP managed
 *   2. OpenRouter — fallback for any model
 *   3. OSS Models — self-hosted on Hostinger VPS (vLLM, Ollama, TGI)
 *   4. Personaplex — voice/engagement agent
 *
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

// OSS Models — self-hosted on Hostinger VPS
export { ossModels, OSS_MODELS } from './oss-models';
export type { OSSModelSpec } from './oss-models';

// Personaplex — voice/engagement agent
export { personaplex } from './personaplex';
export type { PersonaplexConfig, VoiceSession } from './personaplex';

// Agent bridge
export { agentChat } from './agent-llm';
export type { AgentChatOptions } from './agent-llm';
export { AGENT_SYSTEM_PROMPTS } from './agent-prompts';
