/**
 * LUC allocator — MODEL_CATALOG.
 *
 * Single source of model pricing for the allocator: it REFERENCES the gateway's
 * provider price table (src/llm/openrouter `MODELS`) so the dollars we GATE on
 * equal the dollars we BILL — it does not maintain a second, divergent table.
 * On top it layers two access dimensions:
 *   isFree        — zero-cost demo/chat models (usable before paying)
 *   premiumBuild  — the flagship build model (Fable 5)
 * The dropped Lite/Medium/Heavy/Superior bands are intentionally absent.
 *
 * PROPRIETARY — A.I.M.S. Not for redistribution.
 */

import { MODELS, ModelSpec } from '../llm/openrouter';

export interface CatalogEntry extends ModelSpec {
  /** Short catalog key (e.g. 'claude-fable-5'). */
  key: string;
  /** Zero-cost model usable in the free demo before any payment. */
  isFree: boolean;
  /** The flagship premium build model. */
  premiumBuild: boolean;
}

// Fable 5 — the flagship premium BUILD model. Pricing is the canonical Anthropic
// rate from the claude-api skill ($10 in / $50 out per 1M). It is not yet present
// in src/llm/openrouter MODELS; settle() always reconciles against the real
// provider cost.usd, so this rate drives pre-call estimates and gating only.
const FABLE_5: ModelSpec = {
  id: 'anthropic/claude-fable-5',
  name: 'Claude Fable 5',
  provider: 'Anthropic',
  inputPer1M: 10.0,
  outputPer1M: 50.0,
  contextWindow: 1_000_000,
  tier: 'premium',
};

// Free demo tier (zero-cost OpenRouter models). The free-model DEMO is part of the
// reframed billing model (free demo -> $6.54 starter tokens -> plan/PPU). NOTE: the
// exact OpenRouter `:free` ids drift over time — this allowlist is owner-confirmable;
// the gate only depends on cost === 0, not on these specific ids.
const FREE_DEMO_MODELS: Record<string, ModelSpec> = {
  'llama-3.3-70b:free': {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (free)',
    provider: 'Meta',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 131_072,
    tier: 'economy',
  },
  'qwen3-coder:free': {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder (free)',
    provider: 'Qwen',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 262_144,
    tier: 'economy',
  },
};

const EXTRA_MODELS: Record<string, ModelSpec> = {
  'claude-fable-5': FABLE_5,
  ...FREE_DEMO_MODELS,
};

const PREMIUM_BUILD_KEYS = new Set<string>(['claude-fable-5']);

function toEntry(key: string, spec: ModelSpec): CatalogEntry {
  return {
    ...spec,
    key,
    isFree: spec.inputPer1M === 0 && spec.outputPer1M === 0,
    premiumBuild: PREMIUM_BUILD_KEYS.has(key),
  };
}

export const MODEL_CATALOG: Record<string, CatalogEntry> = Object.fromEntries(
  Object.entries({ ...MODELS, ...EXTRA_MODELS }).map(([key, spec]) => [key, toEntry(key, spec)])
);

/** Resolve a model by short catalog key OR full provider id; null if unknown. */
export function resolveModel(modelKeyOrId: string): CatalogEntry | null {
  if (MODEL_CATALOG[modelKeyOrId]) return MODEL_CATALOG[modelKeyOrId];
  const byId = Object.values(MODEL_CATALOG).find((e) => e.id === modelKeyOrId);
  return byId ?? null;
}

/**
 * Pre-call USD cost estimate used to size a reserve(); settle() reconciles the
 * hold against the real provider cost afterward. Unknown models estimate to 0
 * (the gate denies them separately — they never reach reserve()).
 */
export function estimateCostUsd(
  modelKeyOrId: string,
  opts: { promptTokens?: number; maxTokens?: number }
): number {
  const entry = resolveModel(modelKeyOrId);
  if (!entry) return 0;
  const prompt = opts.promptTokens ?? 0;
  const completion = opts.maxTokens ?? 0;
  const cost =
    (prompt / 1_000_000) * entry.inputPer1M + (completion / 1_000_000) * entry.outputPer1M;
  return Math.round(cost * 1_000_000) / 1_000_000; // micro-USD precision
}
