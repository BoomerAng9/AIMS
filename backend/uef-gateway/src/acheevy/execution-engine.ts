/**
 * ACHEEVY Vertical Execution Engine — R-R-S (React to Real Scenarios)
 *
 * MOVED from aims-skills/acheevy-verticals/execution-engine.ts into the
 * gateway source tree because it imports 8+ gateway-internal modules.
 * TypeScript's rootDir constraint requires this file to live under src/.
 *
 * The aims-skills version is now a thin re-export shim.
 *
 * Full governance pipeline:
 *   1. ByteRover RAG → learn from past executions
 *   2. LLM generates dynamic pipeline steps (R-R-S)
 *   3. ORACLE 8-gate verification
 *   4. PREP_SQUAD_ALPHA governance gate
 *   5. LUC metering + triple audit ledger
 *   6. Boomer_Ang directors → Chicken Hawk (executor) + Lil_Hawks → artifacts
 *   7. Bench scoring for ALL agents
 *   8. ByteRover stores successful execution for future RAG
 *   9. HR PMO evaluates team performance
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';

// ── Gateway-local imports (all under src/) ───────────────────────────────

import { Oracle } from '../oracle/index';
import type { OracleResult } from '../oracle/index';
import { ByteRover } from '../byterover/index';
import { evaluateScores } from '../pmo/bench-scoring';
import type { ScoreSheet } from '../pmo/bench-scoring';
import { LUCEngine } from '../luc/index';
import { taskManager } from '../a2a/task-manager';
import { llmGateway } from '../llm/gateway';
import { runPrepSquad } from '../agents/lil-hawks/prep-squad-alpha';
import type { AgentTaskOutput } from '../agents/types';

// ── Types from aims-skills (data-only, no gateway imports) ───────────────
// These types live in aims-skills/ and do NOT import from backend/

export interface VerticalDefinition {
  id: string;
  name: string;
  category: string;
  tags: string[];
  triggers: RegExp[];
  chain_steps: Array<{
    step: number;
    name: string;
    purpose: string;
    acheevy_behavior: string;
    output_schema: Record<string, string>;
  }>;
  acheevy_mode: string;
  expert_domain: string[];
  execution: ExecutionBlueprint;
  revenue_signal: { service: string; transition_prompt: string };
}

export interface ExecutionBlueprint {
  primary_agent: string;
  step_generation_prompt: string;
  required_context: string[];
  fallback_steps: string[];
  requires_verification: boolean;
  max_steps: number;
}

export interface DynamicPipeline {
  steps: string[];
  estimated_agents: string[];
  rationale: string;
  ragContext?: string;
  oracleScore?: number;
  usedFallback: boolean;
}

export interface VerticalExecutionResult {
  taskId: string;
  status: 'submitted' | 'executing' | 'completed' | 'failed';
  pipeline?: DynamicPipeline;
  auditSessionId: string;
  error?: string;
}

export interface StepScoreRecord {
  agentId: string;
  stepDescription: string;
  benchLevel: string;
  weightedTotal: number;
  passed: boolean;
  failedCategories: string[];
  timestamp: string;
}

// ── Audit ledger (inline since it's lightweight, no gateway deps) ────────

import crypto from 'crypto';

type AuditAction =
  | 'step_generated' | 'step_executed' | 'oracle_gated'
  | 'rag_retrieved' | 'rag_stored' | 'bench_scored'
  | 'vertical_completed' | 'pipeline_dispatched'
  | 'verification_passed' | 'verification_failed';

interface AuditEntry {
  id: string;
  timestamp: string;
  verticalId: string;
  userId: string;
  sessionId: string;
  action: AuditAction;
  agentId?: string;
  data: Record<string, unknown>;
  cost?: { tokens: number; usd: number };
}

function createAuditEntry(
  verticalId: string, userId: string, sessionId: string,
  action: AuditAction, data: Record<string, unknown>,
  agentId?: string, cost?: { tokens: number; usd: number },
): AuditEntry {
  return {
    id: uuidv4(), timestamp: new Date().toISOString(),
    verticalId, userId, sessionId, action, agentId, data, cost,
  };
}

interface Web3Entry extends AuditEntry {
  hash: string; previousHash: string; artifactHash?: string;
}

const GENESIS_HASH = '0'.repeat(64);

class InlineAuditLedger {
  private platform: AuditEntry[] = [];
  private user: AuditEntry[] = [];
  private web3: Web3Entry[] = [];

  write(entry: AuditEntry): { platformId: string; userReceiptId: string; web3Hash: string } {
    this.platform.push({ ...entry, id: entry.id || uuidv4() });
    this.user.push({ ...entry, id: entry.id || uuidv4() });

    const prevHash = this.web3.length > 0 ? this.web3[this.web3.length - 1].hash : GENESIS_HASH;
    const hash = crypto.createHash('sha256').update(JSON.stringify({ ...entry, previousHash: prevHash })).digest('hex');
    this.web3.push({ ...entry, id: entry.id || uuidv4(), hash, previousHash: prevHash });

    return { platformId: entry.id, userReceiptId: entry.id, web3Hash: hash };
  }

  getStats() {
    return { platformCount: this.platform.length, userCount: this.user.length, web3Count: this.web3.length };
  }
}

const auditLedger = new InlineAuditLedger();

// ---------------------------------------------------------------------------
// STEP_AGENT_MAP Keywords (mirrors chicken-hawk.ts)
// ---------------------------------------------------------------------------

const ROUTABLE_KEYWORDS = [
  'scaffold', 'generate', 'implement', 'build', 'code', 'api', 'schema',
  'database', 'migration', 'component', 'endpoint', 'deploy',
  'brand', 'campaign', 'copy', 'content', 'email', 'seo', 'social',
  'outreach', 'landing', 'headline',
  'research', 'analyze', 'market', 'data', 'competitive', 'report',
  'survey', 'trend', 'benchmark',
  'verify', 'audit', 'test', 'security', 'review', 'compliance',
  'check', 'validate',
];

function isRoutableStep(step: string): boolean {
  const lower = step.toLowerCase();
  return ROUTABLE_KEYWORDS.some(kw => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// R-R-S: Dynamic Step Generation
// ---------------------------------------------------------------------------

export async function generateDynamicSteps(
  vertical: VerticalDefinition,
  collectedData: Record<string, unknown>,
  userId: string,
  sessionId: string,
): Promise<DynamicPipeline> {

  // 1. ByteRover RAG
  const ragQuery = `${vertical.id}:${JSON.stringify(collectedData).slice(0, 200)}`;
  const ragResult = await ByteRover.retrieveContext(ragQuery, 5000);

  auditLedger.write(createAuditEntry(
    vertical.id, userId, sessionId, 'rag_retrieved',
    { relevance: ragResult.relevance, patterns: ragResult.patterns, cached: ragResult.cached },
  ));

  const ragContext = ragResult.cached
    ? `\n\nPrevious similar execution patterns found (relevance: ${ragResult.relevance}):\n${ragResult.patterns.join(', ')}\nUse these patterns to improve step quality.`
    : '';

  // 2. Fill step_generation_prompt
  let filledPrompt = vertical.execution.step_generation_prompt;
  for (const [key, value] of Object.entries(collectedData)) {
    const placeholder = `{${key}}`;
    const stringValue = Array.isArray(value) ? value.join(', ') : String(value || '');
    filledPrompt = filledPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
  }
  filledPrompt += ragContext;

  // 3. LLM step generation
  let steps: string[] = [];
  let rationale = '';
  let usedFallback = false;

  try {
    const llmResponse = await llmGateway.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: 'You are a pipeline architect for A.I.M.S. Generate execution steps as a JSON array of strings. Each step must be a clear action description containing routing keywords.' },
        { role: 'user', content: filledPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

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
    rationale = `LLM unavailable: ${err instanceof Error ? err.message : 'unknown error'}. Using fallback steps.`;
  }

  if (steps.length === 0) {
    steps = [...vertical.execution.fallback_steps];
    rationale = `Using fallback steps for vertical '${vertical.id}' (LLM response invalid or unavailable).`;
    usedFallback = true;
  }

  // 5. ORACLE 8-Gate
  const oracleSpec = {
    query: steps.join('\n'), intent: 'AGENTIC_WORKFLOW', userId,
    budget: { maxUsd: 50, maxTokens: 500000 },
  };
  const oracleOutput = {
    quote: { variants: [{ estimate: { totalTokens: steps.length * 2000, totalUsd: steps.length * 0.02 } }] },
  };

  const oracleResult: OracleResult = await Oracle.runGates(oracleSpec, oracleOutput);

  auditLedger.write(createAuditEntry(
    vertical.id, userId, sessionId, 'oracle_gated',
    { passed: oracleResult.passed, score: oracleResult.score, gateFailures: oracleResult.gateFailures, warnings: oracleResult.warnings },
  ));

  if (!oracleResult.passed && !usedFallback) {
    steps = [...vertical.execution.fallback_steps];
    rationale = `ORACLE rejected LLM-generated steps (score: ${oracleResult.score}). Using fallback steps.`;
    usedFallback = true;
  }

  // 7. Validate routing keywords
  steps = steps.map(s => isRoutableStep(s) ? s : `Research and analyze: ${s}`);

  // 8. Estimate agent routing
  const estimated_agents = steps.map(step => {
    const lower = step.toLowerCase();
    if (['scaffold', 'generate', 'implement', 'build', 'code', 'deploy', 'schema', 'api', 'migration'].some(k => lower.includes(k))) return 'engineer-ang';
    if (['brand', 'campaign', 'copy', 'content', 'email', 'seo', 'social'].some(k => lower.includes(k))) return 'marketer-ang';
    if (['verify', 'audit', 'test', 'security', 'review', 'compliance'].some(k => lower.includes(k))) return 'quality-ang';
    return 'analyst-ang';
  });

  auditLedger.write(createAuditEntry(
    vertical.id, userId, sessionId, 'step_generated',
    { steps, estimated_agents, usedFallback, oracleScore: oracleResult.score, ragRelevance: ragResult.relevance },
  ));

  return { steps, estimated_agents, rationale, ragContext: ragResult.cached ? ragResult.patterns.join(', ') : undefined, oracleScore: oracleResult.score, usedFallback };
}

// ---------------------------------------------------------------------------
// Vertical Execution — Full governance stack
// ---------------------------------------------------------------------------

export async function executeVertical(
  vertical: VerticalDefinition,
  collectedData: Record<string, unknown>,
  userId: string,
  sessionId: string,
): Promise<VerticalExecutionResult> {
  const auditSessionId = `audit-${uuidv4().slice(0, 8)}`;

  try {
    const pipeline = await generateDynamicSteps(vertical, collectedData, userId, sessionId);

    const prepQuery = `Execute vertical '${vertical.name}': ${pipeline.steps.join('; ')}`;
    const executionPacket = await runPrepSquad(prepQuery, sessionId);

    if (!executionPacket.policyManifest.cleared) {
      const blockers = executionPacket.policyManifest.blockers.join('; ');
      auditLedger.write(createAuditEntry(
        vertical.id, userId, sessionId, 'verification_failed',
        { phase: 'prep_squad', blockers, riskLevel: executionPacket.policyManifest.riskLevel },
      ));
      return { taskId: '', status: 'failed', pipeline, auditSessionId, error: `PREP_SQUAD_ALPHA blocked: ${blockers}` };
    }

    const lucQuote = LUCEngine.estimate(prepQuery);
    const estimatedCost = lucQuote.variants[0]?.estimate;

    auditLedger.write(createAuditEntry(
      vertical.id, userId, sessionId, 'pipeline_dispatched',
      {
        verticalName: vertical.name, primaryAgent: vertical.execution.primary_agent,
        stepCount: pipeline.steps.length, usedFallback: pipeline.usedFallback,
        oracleScore: pipeline.oracleScore, ragContext: pipeline.ragContext,
        estimatedTokens: estimatedCost?.totalTokens || 0, estimatedUsd: estimatedCost?.totalUsd || 0,
        prepSquadCleared: true, riskLevel: executionPacket.policyManifest.riskLevel,
      },
      vertical.execution.primary_agent,
      estimatedCost ? { tokens: estimatedCost.totalTokens, usd: estimatedCost.totalUsd } : undefined,
    ));

    const task = await taskManager.send({
      agentId: vertical.execution.primary_agent,
      message: {
        role: 'user' as const,
        parts: [
          { type: 'text' as const, text: `Execute vertical pipeline: ${vertical.name}\n\nSteps:\n${pipeline.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` },
          { type: 'data' as const, data: { steps: pipeline.steps, collectedData, verticalId: vertical.id, auditSessionId, benchScoringEnabled: true, ragContext: pipeline.ragContext, requiresVerification: vertical.execution.requires_verification } },
        ],
      },
      requestedBy: userId,
      capability: undefined,
    });

    return { taskId: task.id, status: 'executing', pipeline, auditSessionId };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown execution error';
    auditLedger.write(createAuditEntry(
      vertical.id, userId, sessionId, 'verification_failed',
      { phase: 'execution_dispatch', error: errorMessage },
    ));
    return { taskId: '', status: 'failed', auditSessionId, error: errorMessage };
  }
}

// ---------------------------------------------------------------------------
// Score & Audit — Every agent step
// ---------------------------------------------------------------------------

export async function scoreAndAudit(
  stepResult: AgentTaskOutput, agentId: string, verticalId: string,
  userId: string, sessionId: string,
  benchLevel: 'INTERN' | 'INTERMEDIATE' | 'EXPERT' = 'INTERMEDIATE',
): Promise<StepScoreRecord> {
  const scores = generateHeuristicScores(stepResult);
  const scoringResult = evaluateScores(benchLevel, scores);

  auditLedger.write(createAuditEntry(
    verticalId, userId, sessionId, 'bench_scored',
    {
      agentId, benchLevel, weightedTotal: scoringResult.weightedTotal,
      passed: scoringResult.passed,
      failedCategories: scoringResult.failedCategories.map((f: { category: string }) => f.category),
      stepSummary: stepResult.result.summary.slice(0, 200),
      artifactCount: stepResult.result.artifacts.length,
    },
    agentId, stepResult.cost,
  ));

  return {
    agentId, stepDescription: stepResult.result.summary.slice(0, 100),
    benchLevel, weightedTotal: scoringResult.weightedTotal,
    passed: scoringResult.passed,
    failedCategories: scoringResult.failedCategories.map((f: { category: string }) => f.category),
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Post-Execution: RAG Store + HR PMO
// ---------------------------------------------------------------------------

export async function postExecutionHooks(
  verticalId: string, userId: string, sessionId: string,
  pipeline: DynamicPipeline, stepScores: StepScoreRecord[],
): Promise<void> {
  const executionContext = JSON.stringify({
    verticalId, steps: pipeline.steps, agents: pipeline.estimated_agents,
    oracleScore: pipeline.oracleScore, timestamp: new Date().toISOString(),
  });

  const storeResult = await ByteRover.storeContext(executionContext);

  auditLedger.write(createAuditEntry(
    verticalId, userId, sessionId, 'rag_stored',
    { storedTokens: storeResult.storedTokens, success: storeResult.success },
  ));

  const avgScore = stepScores.length > 0 ? stepScores.reduce((s, x) => s + x.weightedTotal, 0) / stepScores.length : 0;
  const passRate = stepScores.length > 0 ? stepScores.filter(s => s.passed).length / stepScores.length : 0;

  auditLedger.write(createAuditEntry(
    verticalId, userId, sessionId, 'vertical_completed',
    { teamAvgScore: Math.round(avgScore * 100) / 100, teamPassRate: Math.round(passRate * 100) / 100, stepCount: stepScores.length, ragStored: storeResult.success },
  ));
}

// ---------------------------------------------------------------------------
// Heuristic Scoring
// ---------------------------------------------------------------------------

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
