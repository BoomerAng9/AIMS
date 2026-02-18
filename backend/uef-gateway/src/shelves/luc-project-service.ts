/**
 * LUC Project Service — The Pricing & Effort Oracle
 *
 * LUC sits in front of everything. Every serious build becomes a LUC box:
 *   - Project ID, scope, banded time window, token estimate, cost
 *   - Model mix and expected token usage (by model / cloud)
 *   - Status tracking (estimated → in_progress → completed)
 *   - Links to actual runs and assets when work is done
 *
 * When a user describes a project in Chat w/ ACHEEVY, LUC automatically:
 *   1. Creates a new LUC record in the database
 *   2. Computes an initial estimate by combining:
 *      - Known model pricing for Vertex AI and OSS models
 *      - Historical data from similar projects on the shelves
 *   3. Exposes that estimate:
 *      - To the UI as a LUC card
 *      - To Chicken Hawk and Lil_Hawks as a tool endpoint
 */

import { v4 as uuidv4 } from 'uuid';
import { shelfClient } from './firestore-client';
import type {
  LucProject,
  TimeBand,
  ModelMixEntry,
  CostBand,
  AimsProject,
} from './types';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Model Pricing Catalog (Vertex AI + OSS + Personaplex)
// ---------------------------------------------------------------------------

interface ModelPricing {
  modelId: string;
  provider: 'vertex-ai' | 'openrouter' | 'oss-hosted' | 'personaplex';
  inputPer1M: number;
  outputPer1M: number;
}

const MODEL_PRICING: ModelPricing[] = [
  // Vertex AI (Anthropic via Model Garden)
  { modelId: 'claude-opus-4.6', provider: 'vertex-ai', inputPer1M: 5.0, outputPer1M: 25.0 },
  { modelId: 'claude-sonnet-4.5', provider: 'vertex-ai', inputPer1M: 3.0, outputPer1M: 15.0 },
  { modelId: 'claude-haiku-4.5', provider: 'vertex-ai', inputPer1M: 0.80, outputPer1M: 4.0 },
  // Vertex AI (Gemini native)
  { modelId: 'gemini-3-pro', provider: 'vertex-ai', inputPer1M: 1.25, outputPer1M: 10.0 },
  { modelId: 'gemini-2.5-flash', provider: 'vertex-ai', inputPer1M: 0.30, outputPer1M: 2.50 },
  // OSS models (Hostinger VPS / self-hosted)
  { modelId: 'llama-3.1-70b', provider: 'oss-hosted', inputPer1M: 0.0, outputPer1M: 0.0 },
  { modelId: 'mistral-large', provider: 'oss-hosted', inputPer1M: 0.0, outputPer1M: 0.0 },
  { modelId: 'codellama-34b', provider: 'oss-hosted', inputPer1M: 0.0, outputPer1M: 0.0 },
  // Personaplex (voice agent)
  { modelId: 'personaplex-voice', provider: 'personaplex', inputPer1M: 0.50, outputPer1M: 1.50 },
];

// ---------------------------------------------------------------------------
// Complexity → Token Estimation Heuristics
// ---------------------------------------------------------------------------

interface ComplexityProfile {
  planningTokens: number;
  executionTokens: number;
  verificationTokens: number;
  timeBand: TimeBand;
}

const COMPLEXITY_PROFILES: Record<string, ComplexityProfile> = {
  simple: { planningTokens: 2000, executionTokens: 15000, verificationTokens: 3000, timeBand: 'INSTANT' },
  intermediate: { planningTokens: 8000, executionTokens: 60000, verificationTokens: 12000, timeBand: '1H' },
  complex: { planningTokens: 25000, executionTokens: 200000, verificationTokens: 40000, timeBand: '4H' },
  enterprise: { planningTokens: 80000, executionTokens: 800000, verificationTokens: 120000, timeBand: '1D' },
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class LucProjectService {

  /**
   * Estimate the complexity class of a scope description.
   */
  private classifyComplexity(scope: string, requirements: string): string {
    const combined = `${scope} ${requirements}`.toLowerCase();
    const len = combined.length;

    // Simple keyword signals
    const complexSignals = ['enterprise', 'multi-tenant', 'real-time', 'ml pipeline', 'distributed', 'microservices'];
    const intermediateSignals = ['api', 'database', 'auth', 'dashboard', 'integration', 'workflow'];
    const simpleSignals = ['landing', 'static', 'form', 'simple', 'basic', 'prototype'];

    if (complexSignals.some(s => combined.includes(s)) || len > 2000) return 'enterprise';
    if (intermediateSignals.filter(s => combined.includes(s)).length >= 3 || len > 800) return 'complex';
    if (intermediateSignals.some(s => combined.includes(s)) || len > 300) return 'intermediate';
    if (simpleSignals.some(s => combined.includes(s)) || len < 200) return 'simple';
    return 'intermediate';
  }

  /**
   * Build a model mix for a project based on its complexity.
   */
  private buildModelMix(complexity: string, requestedModels?: string[]): ModelMixEntry[] {
    const profile = COMPLEXITY_PROFILES[complexity] || COMPLEXITY_PROFILES.intermediate;
    const totalTokens = profile.planningTokens + profile.executionTokens + profile.verificationTokens;

    // Default model mix: planning=Sonnet, execution=Opus/Gemini, verification=Haiku
    const defaultMix: Array<{ modelId: string; role: string; tokenShare: number }> = [
      { modelId: 'claude-sonnet-4.5', role: 'planning', tokenShare: 0.10 },
      { modelId: 'claude-opus-4.6', role: 'execution-premium', tokenShare: 0.30 },
      { modelId: 'gemini-2.5-flash', role: 'execution-fast', tokenShare: 0.35 },
      { modelId: 'claude-haiku-4.5', role: 'verification', tokenShare: 0.15 },
      { modelId: 'llama-3.1-70b', role: 'oss-fallback', tokenShare: 0.10 },
    ];

    // If user requested specific models, adjust the mix
    const mix = requestedModels && requestedModels.length > 0
      ? requestedModels.map((id, i) => ({
          modelId: id,
          role: i === 0 ? 'primary' : 'secondary',
          tokenShare: 1.0 / requestedModels.length,
        }))
      : defaultMix;

    return mix.map(entry => {
      const pricing = MODEL_PRICING.find(m => m.modelId === entry.modelId);
      const tokens = Math.round(totalTokens * entry.tokenShare);
      const inputTokens = Math.round(tokens * 0.4);
      const outputTokens = Math.round(tokens * 0.6);
      const cost = pricing
        ? (inputTokens / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M
        : 0;

      return {
        modelId: entry.modelId,
        provider: pricing?.provider || 'vertex-ai',
        estimatedTokens: tokens,
        pricePerMillionInput: pricing?.inputPer1M || 0,
        pricePerMillionOutput: pricing?.outputPer1M || 0,
        estimatedCostUsd: Math.round(cost * 10000) / 10000,
      };
    });
  }

  /**
   * Compute cost bands from model mix.
   */
  private computeCostBand(modelMix: ModelMixEntry[]): CostBand {
    const mid = modelMix.reduce((sum, m) => sum + m.estimatedCostUsd, 0);
    return {
      low: Math.round(mid * 0.7 * 100) / 100,
      mid: Math.round(mid * 100) / 100,
      high: Math.round(mid * 1.5 * 100) / 100,
      currency: 'USD',
    };
  }

  /**
   * Compute time bands from complexity.
   */
  private computeTimeBands(complexity: string): { optimistic: TimeBand; expected: TimeBand; pessimistic: TimeBand } {
    const bandMap: Record<string, { optimistic: TimeBand; expected: TimeBand; pessimistic: TimeBand }> = {
      simple: { optimistic: 'INSTANT', expected: 'INSTANT', pessimistic: '1H' },
      intermediate: { optimistic: '1H', expected: '4H', pessimistic: '1D' },
      complex: { optimistic: '4H', expected: '1D', pessimistic: '3D' },
      enterprise: { optimistic: '1D', expected: '1W', pessimistic: '2W' },
    };
    return bandMap[complexity] || bandMap.intermediate;
  }

  /**
   * Find historically similar projects for estimation refinement.
   */
  private async findSimilarProjects(scope: string): Promise<{ matchedProjectIds: string[]; confidenceScore: number }> {
    try {
      const results = await shelfClient.searchShelves(scope.slice(0, 100), ['luc_projects']);
      const matchedIds = results.map(r => r.id).slice(0, 5);
      const confidence = matchedIds.length > 0 ? Math.min(0.3 + matchedIds.length * 0.15, 0.95) : 0.1;
      return { matchedProjectIds: matchedIds, confidenceScore: confidence };
    } catch {
      return { matchedProjectIds: [], confidenceScore: 0.1 };
    }
  }

  // ---- Public API ----

  /**
   * Create a new LUC project record from a scope description.
   * This is the main entry point when a user describes a project in chat.
   */
  async createLucProject(params: {
    projectId: string;
    userId: string;
    scope: string;
    requirements: string;
    requestedModels?: string[];
  }): Promise<LucProject> {
    const { projectId, userId, scope, requirements, requestedModels } = params;

    // 1. Classify complexity
    const complexity = this.classifyComplexity(scope, requirements);

    // 2. Build model mix
    const modelMix = this.buildModelMix(complexity, requestedModels);

    // 3. Compute cost and time bands
    const costBand = this.computeCostBand(modelMix);
    const timeBands = this.computeTimeBands(complexity);
    const totalTokens = modelMix.reduce((sum, m) => sum + m.estimatedTokens, 0);

    // 4. Find similar projects for estimate refinement
    const similarity = await this.findSimilarProjects(scope);

    // 5. Build the LUC project record
    const now = new Date().toISOString();
    const lucProject: LucProject = {
      id: `luc_${uuidv4().slice(0, 12)}`,
      projectId,
      userId,
      scope,
      requirements,
      status: 'estimated',
      timeBand: timeBands.expected,
      estimatedTimeBands: timeBands,
      modelMix,
      totalEstimatedTokens: totalTokens,
      costBand,
      actualTokensUsed: 0,
      actualCostUsd: 0,
      historicalSimilarity: similarity,
      linkedRunIds: [],
      linkedAssetIds: [],
      createdAt: now,
      updatedAt: now,
    };

    // 6. Persist to shelf
    await shelfClient.create('luc_projects', lucProject);

    // 7. Link to parent project if it exists
    try {
      const project = await shelfClient.get<AimsProject>('projects', projectId);
      if (project) {
        await shelfClient.update<AimsProject>('projects', projectId, { lucProjectId: lucProject.id, updatedAt: now } as Partial<AimsProject>);
      }
    } catch {
      // Non-critical — project may not exist on shelves yet
    }

    logger.info({
      lucId: lucProject.id,
      projectId,
      complexity,
      costMid: costBand.mid,
      timeBand: timeBands.expected,
      models: modelMix.length,
    }, '[LUC] Project estimated');

    return lucProject;
  }

  /**
   * Get a LUC estimate without creating a project record.
   * Used for quick cost previews in chat.
   */
  async estimate(scope: string, requestedModels?: string[]): Promise<{
    complexity: string;
    modelMix: ModelMixEntry[];
    costBand: CostBand;
    timeBands: { optimistic: TimeBand; expected: TimeBand; pessimistic: TimeBand };
    totalEstimatedTokens: number;
    historicalSimilarity: { matchedProjectIds: string[]; confidenceScore: number };
  }> {
    const complexity = this.classifyComplexity(scope, '');
    const modelMix = this.buildModelMix(complexity, requestedModels);
    const costBand = this.computeCostBand(modelMix);
    const timeBands = this.computeTimeBands(complexity);
    const totalTokens = modelMix.reduce((sum, m) => sum + m.estimatedTokens, 0);
    const similarity = await this.findSimilarProjects(scope);

    return { complexity, modelMix, costBand, timeBands, totalEstimatedTokens: totalTokens, historicalSimilarity: similarity };
  }

  /**
   * Get a LUC project by ID.
   */
  async getProject(id: string): Promise<LucProject | null> {
    return shelfClient.get<LucProject>('luc_projects', id);
  }

  /**
   * Update LUC project status and actual costs.
   */
  async updateProject(id: string, updates: Partial<LucProject>): Promise<LucProject | null> {
    return shelfClient.update<LucProject>('luc_projects', id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Record actual usage against a LUC project (called after runs complete).
   */
  async recordUsage(lucProjectId: string, tokensUsed: number, costUsd: number, runId?: string): Promise<void> {
    const project = await this.getProject(lucProjectId);
    if (!project) return;

    const updates: Partial<LucProject> = {
      actualTokensUsed: project.actualTokensUsed + tokensUsed,
      actualCostUsd: Math.round((project.actualCostUsd + costUsd) * 10000) / 10000,
      updatedAt: new Date().toISOString(),
    };

    if (runId) {
      updates.linkedRunIds = [...project.linkedRunIds, runId];
    }

    await shelfClient.update('luc_projects', lucProjectId, updates);
  }

  /**
   * Complete a LUC project.
   */
  async completeProject(id: string): Promise<LucProject | null> {
    return this.updateProject(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }
}

export const lucProjectService = new LucProjectService();
