/**
 * PersonaPlex Two-Tier Router
 * =============================
 * Routes model calls between two NVIDIA Nemotron variants based on
 * task shape, per the 2026-04-19 alignment decision:
 *
 *   SUPER  --  Nemotron-3-Super (MoE Hybrid Mamba-Transformer)
 *              Long-running agentic reasoning workloads.
 *              CRUCIBLE, FORGE, aiPLUG autonomous runtimes,
 *              TTD-DR phases, Hermes Deep Think consensus panel.
 *
 *   NANO   --  Nemotron-3-Nano-30B-A3B (MoE, 3B active params)
 *              Edge / cost-sensitive / low-latency fallback.
 *              Retained as-is; the Super endpoint is additive.
 *
 * Real-time conversational surfaces (ACHEEVY main chat, Spinner
 * Realtime voice, 3-Consultant Engagement) stay on Gemini 3.1 Flash
 * per the Gemini-first model policy. This router is NOT a universal
 * model selector -- it only disambiguates Super vs Nano within the
 * PersonaPlex surface.
 *
 * Canonical docs:
 *   - aims-core/CLAUDE.md deployment pipeline rules
 *   - feedback_nemotron_super_two_tier_alignment memory
 *   - services/personaplex-super/DEPLOY.md (sibling to SAM2_DEPLOY.md)
 */

export type PersonaPlexTier = 'super' | 'nano';

/** Shape hints the router uses to pick a tier. All optional except `source`. */
export interface TaskProfile {
  /** Free-text label for logging / tracing (e.g. 'crucible.planner'). */
  source: string;

  /** True if the call is part of a multi-step / multi-turn sustained workflow. */
  isLongRunning?: boolean;

  /** True if the call performs agentic planning / evaluation / multi-step inference. */
  needsAgenticReasoning?: boolean;

  /** True if the call is latency-critical (streaming voice, real-time chat). */
  isRealtime?: boolean;

  /** Rough count of expected model turns in this workflow. */
  estimatedTurns?: number;

  /** Max context tokens the workflow expects to accumulate. */
  estimatedContextTokens?: number;
}

/**
 * Named profiles for every known workload that routes through PersonaPlex.
 * Add new profiles here when a new long-running surface is wired.
 */
export const KNOWN_PROFILES: Record<string, TaskProfile> = {
  'crucible.planner': {
    source: 'crucible.planner',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
    estimatedTurns: 10,
    estimatedContextTokens: 50_000,
  },
  'crucible.judge_hawk': {
    source: 'crucible.judge_hawk',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
    estimatedTurns: 5,
    estimatedContextTokens: 30_000,
  },
  'forge.plan_synthesis': {
    source: 'forge.plan_synthesis',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
    estimatedTurns: 8,
  },
  'aiplug.runtime': {
    source: 'aiplug.runtime',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
    estimatedTurns: 20,
  },
  'ttd_dr.phase': {
    source: 'ttd_dr.phase',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
    estimatedTurns: 12,
  },
  'hermes.deep_think.consensus': {
    source: 'hermes.deep_think.consensus',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
    estimatedTurns: 3,
  },
  'personaplex.heavy_analysis': {
    source: 'personaplex.heavy_analysis',
    isLongRunning: true,
    needsAgenticReasoning: true,
    isRealtime: false,
  },
  'personaplex.light_lookup': {
    source: 'personaplex.light_lookup',
    isLongRunning: false,
    needsAgenticReasoning: false,
    isRealtime: false,
    estimatedTurns: 1,
  },
  'personaplex.edge_classification': {
    source: 'personaplex.edge_classification',
    isLongRunning: false,
    needsAgenticReasoning: false,
    isRealtime: true,
    estimatedTurns: 1,
  },
} as const;

/**
 * Pure function: given a task profile, return the tier to use.
 *
 * Rules (evaluated in order):
 *   1. Realtime -> Nano (no Super calls on latency-critical paths)
 *   2. Long-running OR agentic-reasoning -> Super
 *   3. Estimated turns > 5 -> Super
 *   4. Large context (>20k tokens) -> Super
 *   5. Default -> Nano
 */
export function selectTier(profile: TaskProfile): PersonaPlexTier {
  if (profile.isRealtime) return 'nano';
  if (profile.isLongRunning || profile.needsAgenticReasoning) return 'super';
  if ((profile.estimatedTurns ?? 0) > 5) return 'super';
  if ((profile.estimatedContextTokens ?? 0) > 20_000) return 'super';
  return 'nano';
}

/** Look up a profile by name and select the tier. Throws on unknown name. */
export function selectTierByName(profileName: string): PersonaPlexTier {
  const p = KNOWN_PROFILES[profileName];
  if (!p) {
    throw new Error(
      `personaplex: unknown profile '${profileName}'. Add it to KNOWN_PROFILES or pass a TaskProfile directly.`
    );
  }
  return selectTier(p);
}

// ─── Endpoint resolution ────────────────────────────────────────────

export interface PersonaPlexEndpoints {
  super: string;
  nano: string;
}

/** Resolve the two endpoints from environment. */
export function resolveEndpoints(
  env: NodeJS.ProcessEnv = process.env
): PersonaPlexEndpoints {
  // New two-tier naming. Legacy PERSONAPLEX_ENDPOINT falls back to nano
  // so existing deployments don't break before the Super endpoint is
  // provisioned. Once the Super endpoint is live, both are required.
  const nano =
    env.PERSONAPLEX_NANO_ENDPOINT ||
    env.PERSONAPLEX_ENDPOINT ||
    '';
  const superTier = env.PERSONAPLEX_SUPER_ENDPOINT || '';

  return { super: superTier, nano };
}

/** Return the endpoint resource name for a given tier. Throws if unset. */
export function endpointForTier(
  tier: PersonaPlexTier,
  env: NodeJS.ProcessEnv = process.env
): string {
  const eps = resolveEndpoints(env);
  const v = tier === 'super' ? eps.super : eps.nano;
  if (!v) {
    throw new Error(
      `personaplex: no endpoint configured for tier '${tier}' ` +
        `(set PERSONAPLEX_${tier.toUpperCase()}_ENDPOINT)`
    );
  }
  return v;
}

/**
 * Convenience: given a profile name, return the Vertex AI endpoint resource
 * to call. Primary entry for consumers that just want "send this to PersonaPlex."
 */
export function endpointForProfile(
  profileName: string,
  env: NodeJS.ProcessEnv = process.env
): { tier: PersonaPlexTier; endpoint: string } {
  const tier = selectTierByName(profileName);
  return { tier, endpoint: endpointForTier(tier, env) };
}
