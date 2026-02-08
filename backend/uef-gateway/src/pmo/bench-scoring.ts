/**
 * Bench-Level Scoring Rubric — Performance Evaluation Engine
 *
 * 8 weighted categories, scale 1-5 per category.
 * Each bench level has minimum passing profiles and fail conditions.
 *
 * Categories (with weights):
 *   Accuracy & Requirement Fit        (25%)
 *   Standards Conformance (QMS)        (15%)
 *   Verification Discipline            (10%)
 *   Cost Discipline                    (10%)
 *   Risk & Data Handling (ISMS/RISK)   (15%)
 *   Clarity of Communication           (10%)
 *   Iteration Efficiency               (10%)
 *   Professional Overlay Dialogue       (5%)
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type {
  BenchLevel,
  ScoringCategory,
  ScoreValue,
  BenchScoringProfile,
  ScoringCategoryConfig,
} from './persona-types';
import {
  SCORING_CATEGORIES,
  BENCH_SCORING_PROFILES,
} from './persona-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScoreSheet = Record<ScoringCategory, ScoreValue>;

export interface ScoringResult {
  bench: BenchLevel;
  scores: ScoreSheet;
  weightedTotal: number;
  passed: boolean;
  failedCategories: { category: ScoringCategory; score: ScoreValue; minimum: ScoreValue }[];
  failConditionsTriggered: string[];
}

// ---------------------------------------------------------------------------
// Scoring Engine
// ---------------------------------------------------------------------------

/**
 * Compute the weighted total from a score sheet.
 */
export function computeWeightedTotal(scores: ScoreSheet): number {
  let total = 0;
  for (const cat of SCORING_CATEGORIES) {
    total += (scores[cat.id] ?? 0) * cat.weight;
  }
  return Math.round(total * 100) / 100;
}

/**
 * Get the scoring profile for a bench level.
 */
export function getScoringProfile(bench: BenchLevel): BenchScoringProfile | undefined {
  return BENCH_SCORING_PROFILES.find(p => p.bench === bench);
}

/**
 * Evaluate a Boomer_Ang's scores against their bench-level minimums.
 */
export function evaluateScores(
  bench: BenchLevel,
  scores: ScoreSheet,
  activeFailConditions: string[] = [],
): ScoringResult {
  const profile = getScoringProfile(bench);
  if (!profile) {
    throw new Error(`Unknown bench level: ${bench}`);
  }

  const weightedTotal = computeWeightedTotal(scores);

  const failedCategories: ScoringResult['failedCategories'] = [];
  for (const cat of SCORING_CATEGORIES) {
    const score = scores[cat.id];
    const minimum = profile.minimums[cat.id];
    if (score < minimum) {
      failedCategories.push({ category: cat.id, score, minimum });
    }
  }

  const failConditionsTriggered = activeFailConditions.filter(
    fc => profile.failConditions.includes(fc),
  );

  const passed = failedCategories.length === 0 && failConditionsTriggered.length === 0;

  return {
    bench,
    scores,
    weightedTotal,
    passed,
    failedCategories,
    failConditionsTriggered,
  };
}

/**
 * Get all category configs with their weights.
 */
export function getCategoryConfigs(): ScoringCategoryConfig[] {
  return [...SCORING_CATEGORIES];
}

/**
 * Check if a specific score meets the minimum for a bench level.
 */
export function meetsMinimum(
  bench: BenchLevel,
  category: ScoringCategory,
  score: ScoreValue,
): boolean {
  const profile = getScoringProfile(bench);
  if (!profile) return false;
  return score >= profile.minimums[category];
}
