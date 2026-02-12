/**
 * ACHEEVY Vertical Execution Engine — R-R-S (React to Real Scenarios)
 *
 * Bridges conversational verticals to real pipeline execution:
 *   1. ByteRover RAG checks for similar past requests → learn from repetition
 *   2. LLM generates dynamic pipeline steps based on collected data + RAG context
 *   3. ORACLE 8-gate verification on generated steps → prevent hallucinated steps
 *   4. PREP_SQUAD_ALPHA governance + cost estimation
 *   5. LUC metering + triple audit ledger write (platform, user, web3-ready)
 *   6. Chicken Hawk executes pipeline → steps route to Boomer_Angs
 *   7. Every agent step scored via bench-scoring (ALL agents — Boomer_Angs, Lil_Hawks, Chicken Hawk)
 *   8. Quality_Ang verification on final output
 *   9. Artifacts + receipts returned via A2A task events (SSE)
 *   10. ByteRover stores successful execution for future RAG improvement
 *   11. Betty-Ann_Ang evaluates team performance → maturation signals
 *
 * KEY INSIGHT: The LLM generates pipeline steps, not hardcoded templates.
 * The step_generation_prompt is a meta-prompt with {placeholders} that:
 *   - Receives SPECIFIC user data from Phase A
 *   - Instructs the LLM to generate steps containing STEP_AGENT_MAP keywords
 *   - Chicken Hawk routes each step to the right Boomer_Ang via keyword matching
 *
 * This is how infinite user scenarios are handled — R-R-S.
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  VerticalDefinition,
  DynamicPipeline,
  VerticalExecutionResult,
  StepScoreRecord,
} from './types';
import { auditLedger, createAuditEntry } from './audit-ledger';

// ── External System Imports ────────────────────────────────────────────────
// These reference existing systems we're wiring into, not rebuilding.

// Oracle 8-Gate Verification
import { Oracle } from '../../backend/uef-gateway/src/oracle/index';
import type { OracleResult } from '../../backend/uef-gateway/src/oracle/index';

// ByteRover RAG — Semantic Memory & Pattern Retrieval
import { ByteRover } from '../../backend/uef-gateway/src/byterover/index';

// Bench Scoring — Performance Evaluation Engine
import { evaluateScores, computeWeightedTotal } from '../../backend/uef-gateway/src/pmo/bench-scoring';
import type { ScoreSheet } from '../../backend/uef-gateway/src/pmo/bench-scoring';

// LUC Engine — Cost Estimation
import { LUCEngine } from '../../backend/uef-gateway/src/luc/index';

// A2A Task Manager — Pipeline Dispatch
import { taskManager } from '../../backend/uef-gateway/src/a2a/task-manager';

// LLM Gateway — For dynamic step generation
import { llmGateway } from '../../backend/uef-gateway/src/llm/gateway';

// PREP_SQUAD_ALPHA — Governance Gate
import { runPrepSquad } from '../../backend/uef-gateway/src/agents/lil-hawks/prep-squad-alpha';

// Agent Types
import type { AgentTaskOutput } from '../../backend/uef-gateway/src/agents/types';

// ---------------------------------------------------------------------------
// STEP_AGENT_MAP Keywords (mirrors chicken-hawk.ts)
// Used to validate generated steps contain routable keywords
// ---------------------------------------------------------------------------

const ROUTABLE_KEYWORDS = [
  // Engineer_Ang
  'scaffold', 'generate', 'implement', 'build', 'code', 'api', 'schema',
  'database', 'migration', 'component', 'endpoint', 'deploy',
  // Marketer_Ang
  'brand', 'campaign', 'copy', 'content', 'email', 'seo', 'social',
  'outreach', 'landing', 'headline',
  // Analyst_Ang
  'research', 'analyze', 'market', 'data', 'competitive', 'report',
  'survey', 'trend', 'benchmark',
  // Quality_Ang
  'verify', 'audit', 'test', 'security', 'review', 'compliance',
  'check', 'validate',
];

/**
 * Check if a step description contains at least one routable keyword.
 */
function isRoutableStep(step: string): boolean {
  const lower = step.toLowerCase();
  return ROUTABLE_KEYWORDS.some(kw => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// R-R-S: Dynamic Step Generation
// ---------------------------------------------------------------------------

/**
 * Generate dynamic pipeline steps using LLM + ByteRover RAG context.
 *
 * 1. ByteRover.retrieveContext() — check for similar past executions
 * 2. Fill step_generation_prompt with collectedData + RAG context
 * 3. Call llmGateway.chat() to generate context-specific pipeline steps
 * 4. Parse JSON array of step strings from LLM response
 * 5. Oracle.runGates() on generated steps — validate no hallucinated/dangerous steps
 * 6. If ORACLE fails → reject steps, use fallback_steps instead
 * 7. Validate each step contains STEP_AGENT_MAP keywords
 * 8. Return DynamicPipeline { steps, estimated_agents, rationale, ragContext, oracleScore }
 */
export async function generateDynamicSteps(
  vertical: VerticalDefinition,
  collectedData: Record<string, unknown>,
  userId: string,
  sessionId: string,
): Promise<DynamicPipeline> {

  // ── 1. ByteRover RAG: Retrieve similar past executions ──────────────────
  const ragQuery = `${vertical.id}:${JSON.stringify(collectedData).slice(0, 200)}`;
  const ragResult = await ByteRover.retrieveContext(ragQuery, 5000);

  // Audit: RAG retrieval
  auditLedger.write(createAuditEntry(
    vertical.id, userId, sessionId, 'rag_retrieved',
    { relevance: ragResult.relevance, patterns: ragResult.patterns, cached: ragResult.cached },
  ));

  const ragContext = ragResult.cached
    ? `\n\nPrevious similar execution patterns found (relevance: ${ragResult.relevance}):\n${ragResult.patterns.join(', ')}\nUse these patterns to improve step quality.`
    : '';

  // ── 2. Fill step_generation_prompt with collected data ──────────────────
  let filledPrompt = vertical.execution.step_generation_prompt;
  for (const [key, value] of Object.entries(collectedData)) {
    const placeholder = `{${key}}`;
    const stringValue = Array.isArray(value) ? value.join(', ') : String(value || '');
    filledPrompt = filledPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
  }
  filledPrompt += ragContext;

  // ── 3. Call LLM to generate pipeline steps ──────────────────────────────
  let steps: string[] = [];
  let rationale = '';
  let usedFallback = false;

  try {
    const llmResponse = await llmGateway.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [
        {
          role: 'system',
          content: 'You are a pipeline architect for A.I.M.S. Generate execution steps as a JSON array of strings. Each step must be a clear action description containing routing keywords.',
        },
        { role: 'user', content: filledPrompt },
      ],
      maxTokens: 2000,
      temperature: 0.3,
    });

    // ── 4. Parse JSON array from response ─────────────────────────────────
    const responseText = llmResponse.content || '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        steps = parsed.map((s: unknown) => String(s)).slice(0, vertical.execution.max_steps);
        rationale = `LLM generated ${steps.length} steps for vertical '${vertical.id}' with RAG relevance ${ragResult.relevance}`;
      }
    }
  } catch (err) {
    // LLM unavailable — will use fallback
    rationale = `LLM unavailable: ${err instanceof Error ? err.message : 'unknown error'}. Using fallback steps.`;
  }

  // If LLM didn't produce valid steps, use fallback
  if (steps.length === 0) {
    steps = [...vertical.execution.fallback_steps];
    rationale = `Using fallback steps for vertical '${vertical.id}' (LLM response invalid or unavailable).`;
    usedFallback = true;
  }

  // ── 5. ORACLE 8-Gate Verification on generated steps ────────────────────
  const oracleSpec = {
    query: steps.join('\n'),
    intent: 'AGENTIC_WORKFLOW',
    userId,
    budget: { maxUsd: 50, maxTokens: 500000 },
  };
  const oracleOutput = {
    quote: {
      variants: [{ estimate: { totalTokens: steps.length * 2000, totalUsd: steps.length * 0.02 } }],
    },
  };

  const oracleResult: OracleResult = await Oracle.runGates(oracleSpec, oracleOutput);

  // Audit: ORACLE gating
  auditLedger.write(createAuditEntry(
    vertical.id, userId, sessionId, 'oracle_gated',
    { passed: oracleResult.passed, score: oracleResult.score, gateFailures: oracleResult.gateFailures, warnings: oracleResult.warnings },
  ));

  // ── 6. If ORACLE fails → reject steps, use fallback ────────────────────
  if (!oracleResult.passed && !usedFallback) {
    steps = [...vertical.execution.fallback_steps];
    rationale = `ORACLE rejected LLM-generated steps (score: ${oracleResult.score}, failures: ${oracleResult.gateFailures.join('; ')}). Using fallback steps.`;
    usedFallback = true;
  }

  // ── 7. Validate routing keywords ────────────────────────────────────────
  const unroutableSteps = steps.filter(s => !isRoutableStep(s));
  if (unroutableSteps.length > 0) {
    // Add generic routing keyword to unroutable steps so they don't stall
    steps = steps.map(s => {
      if (!isRoutableStep(s)) {
        return `Research and analyze: ${s}`;
      }
      return s;
    });
  }

  // ── 8. Estimate agent routing ───────────────────────────────────────────
  const estimated_agents = steps.map(step => {
    const lower = step.toLowerCase();
    if (['scaffold', 'generate', 'implement', 'build', 'code', 'deploy', 'schema', 'api', 'migration'].some(k => lower.includes(k))) {
      return 'engineer-ang';
    }
    if (['brand', 'campaign', 'copy', 'content', 'email', 'seo', 'social'].some(k => lower.includes(k))) {
      return 'marketer-ang';
    }
    if (['verify', 'audit', 'test', 'security', 'review', 'compliance'].some(k => lower.includes(k))) {
      return 'quality-ang';
    }
    return 'analyst-ang'; // Default: research/analysis
  });

  // Audit: Step generation
  auditLedger.write(createAuditEntry(
    vertical.id, userId, sessionId, 'step_generated',
    { steps, estimated_agents, usedFallback, oracleScore: oracleResult.score, ragRelevance: ragResult.relevance },
  ));

  return {
    steps,
    estimated_agents,
    rationale,
    ragContext: ragResult.cached ? ragResult.patterns.join(', ') : undefined,
    oracleScore: oracleResult.score,
    usedFallback,
  };
}

// ---------------------------------------------------------------------------
// Vertical Execution — Full governance stack
// ---------------------------------------------------------------------------

/**
 * Execute a vertical's Phase B pipeline with full governance.
 *
 * 1. generateDynamicSteps() → ORACLE-validated pipeline steps
 * 2. PREP_SQUAD_ALPHA governance → cost + routing
 * 3. LUC.estimate() → triple audit ledger write
 * 4. A2A taskManager.send() → dispatch to primary agent
 * 5. Return taskId for SSE streaming
 */
export async function executeVertical(
  vertical: VerticalDefinition,
  collectedData: Record<string, unknown>,
  userId: string,
  sessionId: string,
): Promise<VerticalExecutionResult> {
  const auditSessionId = `audit-${uuidv4().slice(0, 8)}`;

  try {
    // ── 1. Generate ORACLE-validated pipeline steps ──────────────────────
    const pipeline = await generateDynamicSteps(vertical, collectedData, userId, sessionId);

    // ── 2. PREP_SQUAD_ALPHA governance gate ──────────────────────────────
    const prepQuery = `Execute vertical '${vertical.name}': ${pipeline.steps.join('; ')}`;
    const executionPacket = await runPrepSquad(prepQuery, sessionId);

    // Check policy clearance
    if (!executionPacket.policyManifest.cleared) {
      const blockers = executionPacket.policyManifest.blockers.join('; ');
      auditLedger.write(createAuditEntry(
        vertical.id, userId, sessionId, 'verification_failed',
        { phase: 'prep_squad', blockers, riskLevel: executionPacket.policyManifest.riskLevel },
      ));

      return {
        taskId: '',
        status: 'failed',
        pipeline,
        auditSessionId,
        error: `PREP_SQUAD_ALPHA blocked execution: ${blockers}`,
      };
    }

    // ── 3. LUC cost estimation + triple audit ledger ────────────────────
    const lucQuote = LUCEngine.estimate(prepQuery);
    const estimatedCost = lucQuote.variants[0]?.estimate;

    auditLedger.write(createAuditEntry(
      vertical.id, userId, sessionId, 'pipeline_dispatched',
      {
        verticalName: vertical.name,
        primaryAgent: vertical.execution.primary_agent,
        stepCount: pipeline.steps.length,
        usedFallback: pipeline.usedFallback,
        oracleScore: pipeline.oracleScore,
        ragContext: pipeline.ragContext,
        estimatedTokens: estimatedCost?.totalTokens || 0,
        estimatedUsd: estimatedCost?.totalUsd || 0,
        prepSquadCleared: true,
        riskLevel: executionPacket.policyManifest.riskLevel,
      },
      vertical.execution.primary_agent,
      estimatedCost ? { tokens: estimatedCost.totalTokens, usd: estimatedCost.totalUsd } : undefined,
    ));

    // ── 4. Dispatch via A2A task manager ─────────────────────────────────
    const task = await taskManager.send({
      agentId: vertical.execution.primary_agent,
      message: {
        parts: [
          {
            type: 'text' as const,
            text: `Execute vertical pipeline: ${vertical.name}\n\nSteps:\n${pipeline.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          },
          {
            type: 'data' as const,
            data: {
              steps: pipeline.steps,
              collectedData,
              verticalId: vertical.id,
              auditSessionId,
              benchScoringEnabled: true,
              ragContext: pipeline.ragContext,
              requiresVerification: vertical.execution.requires_verification,
            },
          },
        ],
      },
      requestedBy: userId,
      capability: undefined,
    });

    return {
      taskId: task.id,
      status: 'executing',
      pipeline,
      auditSessionId,
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown execution error';

    auditLedger.write(createAuditEntry(
      vertical.id, userId, sessionId, 'verification_failed',
      { phase: 'execution_dispatch', error: errorMessage },
    ));

    return {
      taskId: '',
      status: 'failed',
      auditSessionId,
      error: errorMessage,
    };
  }
}

// ---------------------------------------------------------------------------
// Score & Audit — Called after EVERY step in the pipeline for ALL agents
// ---------------------------------------------------------------------------

/**
 * Score an agent's step output and write to all 3 audit ledgers.
 * Called after each Boomer_Ang / Chicken Hawk / Lil_Hawk completes a step.
 *
 * 1. Bench scoring via evaluateScores() (8 weighted categories)
 * 2. Triple audit write (platform + user + web3)
 * 3. Agent maturation signals (promotion/demotion flagging)
 */
export async function scoreAndAudit(
  stepResult: AgentTaskOutput,
  agentId: string,
  verticalId: string,
  userId: string,
  sessionId: string,
  benchLevel: 'INTERN' | 'INTERMEDIATE' | 'EXPERT' = 'INTERMEDIATE',
): Promise<StepScoreRecord> {

  // ── 1. Generate heuristic scores based on step output ──────────────────
  // In production, these would come from Quality_Ang's analysis.
  // For now, we use heuristic scoring based on output characteristics.
  const scores = generateHeuristicScores(stepResult);

  // ── 2. Run bench-level evaluation ──────────────────────────────────────
  const scoringResult = evaluateScores(benchLevel, scores);

  // ── 3. Triple audit ledger write ───────────────────────────────────────
  auditLedger.write(createAuditEntry(
    verticalId, userId, sessionId, 'bench_scored',
    {
      agentId,
      benchLevel,
      weightedTotal: scoringResult.weightedTotal,
      passed: scoringResult.passed,
      failedCategories: scoringResult.failedCategories.map(f => f.category),
      scores: scoringResult.scores,
      stepSummary: stepResult.result.summary.slice(0, 200),
      artifactCount: stepResult.result.artifacts.length,
    },
    agentId,
    stepResult.cost,
  ));

  // ── 4. Record the score ────────────────────────────────────────────────
  return {
    agentId,
    stepDescription: stepResult.result.summary.slice(0, 100),
    benchLevel,
    weightedTotal: scoringResult.weightedTotal,
    passed: scoringResult.passed,
    failedCategories: scoringResult.failedCategories.map(f => f.category),
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Post-Execution: RAG Store + HR PMO Evaluation
// ---------------------------------------------------------------------------

/**
 * Called after a vertical pipeline completes successfully.
 * Stores execution patterns in ByteRover for future RAG improvement,
 * and triggers HR PMO (Betty-Ann_Ang) evaluation of team performance.
 */
export async function postExecutionHooks(
  verticalId: string,
  userId: string,
  sessionId: string,
  pipeline: DynamicPipeline,
  stepScores: StepScoreRecord[],
): Promise<void> {

  // ── ByteRover: Store successful execution for future RAG ───────────────
  const executionContext = JSON.stringify({
    verticalId,
    steps: pipeline.steps,
    agents: pipeline.estimated_agents,
    oracleScore: pipeline.oracleScore,
    timestamp: new Date().toISOString(),
  });

  const storeResult = await ByteRover.storeContext(executionContext);

  auditLedger.write(createAuditEntry(
    verticalId, userId, sessionId, 'rag_stored',
    { storedTokens: storeResult.storedTokens, success: storeResult.success },
  ));

  // ── HR PMO: Betty-Ann_Ang evaluates aggregate team performance ─────────
  // Calculate average team score
  const avgScore = stepScores.length > 0
    ? stepScores.reduce((sum, s) => sum + s.weightedTotal, 0) / stepScores.length
    : 0;

  const passRate = stepScores.length > 0
    ? stepScores.filter(s => s.passed).length / stepScores.length
    : 0;

  // Flag agents for promotion or coaching
  const agentPerformance: Record<string, { totalScore: number; count: number; passed: number }> = {};
  for (const score of stepScores) {
    if (!agentPerformance[score.agentId]) {
      agentPerformance[score.agentId] = { totalScore: 0, count: 0, passed: 0 };
    }
    agentPerformance[score.agentId].totalScore += score.weightedTotal;
    agentPerformance[score.agentId].count += 1;
    if (score.passed) agentPerformance[score.agentId].passed += 1;
  }

  const maturationSignals: Array<{
    agentId: string;
    avgScore: number;
    passRate: number;
    signal: 'promotion_candidate' | 'coaching_needed' | 'steady';
  }> = [];

  for (const [agentId, perf] of Object.entries(agentPerformance)) {
    const agentAvg = perf.totalScore / perf.count;
    const agentPassRate = perf.passed / perf.count;

    let signal: 'promotion_candidate' | 'coaching_needed' | 'steady' = 'steady';
    if (agentAvg >= 4.0 && agentPassRate >= 0.9) {
      signal = 'promotion_candidate';
    } else if (agentAvg < 2.5 || agentPassRate < 0.5) {
      signal = 'coaching_needed';
    }

    maturationSignals.push({ agentId, avgScore: agentAvg, passRate: agentPassRate, signal });
  }

  // ── Final vertical completion audit ────────────────────────────────────
  auditLedger.write(createAuditEntry(
    verticalId, userId, sessionId, 'vertical_completed',
    {
      teamAvgScore: Math.round(avgScore * 100) / 100,
      teamPassRate: Math.round(passRate * 100) / 100,
      maturationSignals,
      stepCount: stepScores.length,
      ragStored: storeResult.success,
    },
  ));
}

// ---------------------------------------------------------------------------
// Heuristic Scoring — Generates score sheets from step output characteristics
// ---------------------------------------------------------------------------

/**
 * Generate heuristic scores for a step output.
 * In production, Quality_Ang's LLM analysis would replace this.
 */
function generateHeuristicScores(output: AgentTaskOutput): ScoreSheet {
  const hasArtifacts = output.result.artifacts.length > 0;
  const hasLogs = output.result.logs.length > 0;
  const summaryLength = output.result.summary.length;
  const isComplete = output.status === 'COMPLETED';
  const costEfficient = output.cost.usd < 0.10;

  return {
    accuracy: (isComplete && summaryLength > 50 ? 4 : isComplete ? 3 : 2) as 1 | 2 | 3 | 4 | 5,
    standards_conformance: (hasArtifacts ? 4 : 3) as 1 | 2 | 3 | 4 | 5,
    verification_discipline: (hasLogs ? 4 : 3) as 1 | 2 | 3 | 4 | 5,
    cost_discipline: (costEfficient ? 4 : 3) as 1 | 2 | 3 | 4 | 5,
    risk_data_handling: (isComplete ? 4 : 2) as 1 | 2 | 3 | 4 | 5,
    communication: (summaryLength > 100 ? 4 : summaryLength > 30 ? 3 : 2) as 1 | 2 | 3 | 4 | 5,
    iteration_efficiency: (isComplete ? 4 : 2) as 1 | 2 | 3 | 4 | 5,
    overlay_dialogue: 4 as 1 | 2 | 3 | 4 | 5,
  };
}
