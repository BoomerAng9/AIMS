/**
 * LUC allocator — MODEL_CATALOG + model-access gate.
 *
 * The catalog REFERENCES the gateway's existing provider pricing
 * (src/llm/openrouter MODELS) so metered-$ == billed-$ — it does not
 * duplicate a second price table. It adds two gating dimensions on top:
 *   isFree        — zero-cost demo/chat models (usable before paying)
 *   premiumBuild  — the flagship build model (Fable 5)
 *
 * The reframed access model (L/M/H/S DROPPED): free models are always
 * allowed; paid models require an active plan + (budget OR byok).
 */

import { MODEL_CATALOG, resolveModel, estimateCostUsd } from '../model-catalog';
import { evaluateModelAccess } from '../gate';

describe('MODEL_CATALOG', () => {
  it('includes Fable 5 as the premium build model at $10/$50 per 1M', () => {
    const fable = MODEL_CATALOG['claude-fable-5'];
    expect(fable).toBeDefined();
    expect(fable.inputPer1M).toBe(10);
    expect(fable.outputPer1M).toBe(50);
    expect(fable.premiumBuild).toBe(true);
    expect(fable.isFree).toBe(false);
  });

  it('exposes a non-empty free (demo) tier, all zero-cost', () => {
    const freeEntries = Object.values(MODEL_CATALOG).filter((e) => e.isFree);
    expect(freeEntries.length).toBeGreaterThan(0);
    for (const e of freeEntries) {
      expect(e.inputPer1M).toBe(0);
      expect(e.outputPer1M).toBe(0);
    }
  });

  it('references gateway provider pricing without divergence (Opus 4.6 stays $5/$25)', () => {
    const opus = MODEL_CATALOG['claude-opus-4.6'];
    expect(opus.inputPer1M).toBe(5);
    expect(opus.outputPer1M).toBe(25);
  });

  it('resolves by short key or full provider id, null for unknown', () => {
    expect(resolveModel('claude-fable-5')?.key).toBe('claude-fable-5');
    expect(resolveModel('anthropic/claude-fable-5')?.key).toBe('claude-fable-5');
    expect(resolveModel('nonexistent/model')).toBeNull();
  });

  it('estimates input+output cost in USD', () => {
    // Fable 5: 1M prompt @ $10 + 1M completion @ $50 = $60
    expect(
      estimateCostUsd('claude-fable-5', { promptTokens: 1_000_000, maxTokens: 1_000_000 })
    ).toBeCloseTo(60, 6);
    const free = Object.values(MODEL_CATALOG).find((e) => e.isFree)!;
    expect(estimateCostUsd(free.key, { promptTokens: 1000, maxTokens: 1000 })).toBe(0);
    expect(estimateCostUsd('nope/unknown', { maxTokens: 1000 })).toBe(0);
  });
});

describe('evaluateModelAccess (model gate)', () => {
  const freeKey = Object.values(MODEL_CATALOG).find((e) => e.isFree)!.key;

  it('allows free demo models with no plan', () => {
    expect(
      evaluateModelAccess(freeKey, { hasActivePlan: false, walletAvailableUsd: 0 }).allowed
    ).toBe(true);
  });

  it('denies a paid model without an active plan (fail closed)', () => {
    const d = evaluateModelAccess('claude-fable-5', { hasActivePlan: false, walletAvailableUsd: 100 });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/active plan/i);
  });

  it('allows a paid model with an active plan and available budget', () => {
    expect(
      evaluateModelAccess('claude-fable-5', { hasActivePlan: true, walletAvailableUsd: 5 }).allowed
    ).toBe(true);
  });

  it('denies a paid model when budget is exhausted (not BYOK)', () => {
    const d = evaluateModelAccess('claude-fable-5', { hasActivePlan: true, walletAvailableUsd: 0 });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/budget/i);
  });

  it('allows BYOK on an active plan even with zero platform budget (no $ debit)', () => {
    expect(
      evaluateModelAccess('claude-fable-5', {
        hasActivePlan: true,
        walletAvailableUsd: 0,
        byok: true,
      }).allowed
    ).toBe(true);
  });

  it('denies an unknown model (fail closed)', () => {
    expect(
      evaluateModelAccess('totally/unknown', { hasActivePlan: true, walletAvailableUsd: 100 }).allowed
    ).toBe(false);
  });
});
