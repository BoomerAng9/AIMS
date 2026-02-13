/**
 * Locale Usage Calculator (LUC) Engine
 * Calculates costs for ACP requests.
 * Integrates with 3-6-9 billing task multipliers.
 *
 * Unit: TOKENS (transparent, measurable)
 * Flow: Estimate → ByteRover Check → Apply Discount → Return Quote
 *
 * ByteRover discount tiers (based on pattern relevance):
 *   >= 0.90 → 40% savings (near-exact match)
 *   >= 0.75 → 25% savings (strong match)
 *   >= 0.50 → 15% savings (partial match)
 *   <  0.50 → 0%  savings (novel query)
 */

import { LUCCostEstimate, LUCComponentEstimate, UCPQuote, ByteRoverSavings } from '../ucp';
import { type TaskType, TASK_MULTIPLIERS, meterTokens } from '../billing';
import { ByteRover } from '../byterover';

export class LUCEngine {

  static estimate(
    featureSpec: string,
    models: string[] = ['claude-sonnet-4.5', 'claude-opus-4.6'],
    taskType?: TaskType,
  ): UCPQuote {
    // Heuristic token estimate based on input complexity
    const complexityBase = Math.min(featureSpec.length * 0.5, 5000);

    // Apply task-type multiplier if provided
    const taskMult = taskType ? (TASK_MULTIPLIERS[taskType]?.multiplier ?? 1.0) : 1.0;

    // ByteRover relevance check (synchronous heuristic for quote speed)
    const queryComplexity = Math.min(featureSpec.length / 200, 1.0);
    const relevance = Math.max(0.85 - (queryComplexity * 0.3), 0.2);
    const brSavings = ByteRover.calculateSavings(
      complexityBase * 2.7 * taskMult, // total tokens estimate (Planning + Execution + Verification)
      relevance,
    );

    const variants = models.map(model => {
      const isFast = model.includes('sonnet');
      const costPer1k = isFast ? 0.003 : 0.015;

      // Calculate raw component estimates (before ByteRover discount)
      const rawComponents: LUCComponentEstimate[] = [
        {
          componentName: 'Planning (AVVA NOON)',
          tokens: complexityBase * 0.2 * taskMult,
          usd: (complexityBase * 0.2 * taskMult / 1000) * costPer1k,
          model: model,
        },
        {
          componentName: 'Execution (Chicken Hawk)',
          tokens: complexityBase * 2.0 * taskMult,
          usd: (complexityBase * 2.0 * taskMult / 1000) * costPer1k,
          model: model,
        },
        {
          componentName: 'Verification (ORACLE)',
          tokens: complexityBase * 0.5 * taskMult,
          usd: (complexityBase * 0.5 * taskMult / 1000) * costPer1k,
          model: model,
        },
      ];

      const preSavingsTokens = rawComponents.reduce((s, c) => s + c.tokens, 0);
      const preSavingsUsd = rawComponents.reduce((s, c) => s + c.usd, 0);

      // Apply ByteRover discount proportionally across components
      const discountFactor = 1 - brSavings.discountPct;
      const componentEstimates: LUCComponentEstimate[] = rawComponents.map(c => ({
        ...c,
        tokens: Math.round(c.tokens * discountFactor),
        usd: Math.round(c.usd * discountFactor * 10000) / 10000,
      }));

      const totalTokens = componentEstimates.reduce((s, c) => s + c.tokens, 0);
      const totalUsd = componentEstimates.reduce((s, c) => s + c.usd, 0);
      const savingsUsd = Math.round((preSavingsUsd - totalUsd) * 10000) / 10000;

      const byteRover: ByteRoverSavings = {
        applied: brSavings.discountPct > 0,
        relevance,
        discountPct: brSavings.discountPct,
        tokensSaved: Math.round(preSavingsTokens - totalTokens),
        savingsUsd,
        preSavingsTokens: Math.round(preSavingsTokens),
        postSavingsTokens: totalTokens,
      };

      const estimate: LUCCostEstimate = {
        totalTokens,
        totalUsd,
        breakdown: componentEstimates,
        byteRoverDiscountApplied: byteRover.applied,
        byteRoverSavingsUsd: savingsUsd,
        byteRover,
      };

      return {
        name: isFast ? 'Fast (Sonnet 4.5)' : 'Premium (Opus 4.6)',
        estimate,
      };
    });

    return {
      quoteId: `qt-${Date.now()}`,
      validForSeconds: 3600,
      variants,
      ...(taskType ? { taskType, taskMultiplier: taskMult } : {}),
    };
  }

  /**
   * Meter actual token usage for billing — delegates to billing engine.
   */
  static meter(rawTokens: number, taskType: TaskType, tierId: string) {
    return meterTokens(rawTokens, taskType, tierId);
  }
}
