/**
 * LLM Module — A.I.M.S. Language Model Interface
 *
 * Multi-model, multi-cloud, multi-tool:
 *   1. Vertex AI (Claude + Gemini) — GCP managed
 *   2. OpenRouter — fallback for any model
 *   3. Together.ai — Kimi K2.5, Llama 4 Maverick, and open-weight models
 *   4. OSS Models — self-hosted on Hostinger VPS (vLLM, Ollama, TGI)
 *   5. Personaplex — voice/engagement agent
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

// Together.ai — Llama 4 Maverick, Kimi K2.5, and open-weight models
export { together } from './together';
export type { TogetherRequest } from './together';

// Kimi K2.5 — Moonshot AI visual agentic model (thinking mode via Together/Fireworks)
export { kimi } from './kimi';
export type { KimiRequest, KimiResult, KimiMode } from './kimi';

// Agent bridge
export { agentChat } from './agent-llm';
export type { AgentChatOptions } from './agent-llm';
export { AGENT_SYSTEM_PROMPTS } from './agent-prompts';
