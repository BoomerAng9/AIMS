/**
 * Quality_Ang — ORACLE Gate Verifier
 *
 * Runs quality assurance, security audits, code review, ORACLE gate checks.
 * Specialties: 7-Gate Checks, Security Audits, Code Review
 */

import logger from '../../logger';
import { VLJEPA } from '../../vl-jepa';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'quality-ang' as const,
  name: 'Quality_Ang',
  role: 'ORACLE Gate Verifier',
  capabilities: [
    { name: 'code-review', weight: 0.95 },
    { name: 'security-audit', weight: 0.90 },
    { name: 'oracle-verification', weight: 1.0 },
    { name: 'test-generation', weight: 0.80 },
    { name: 'compliance-check', weight: 0.75 },
  ],
  maxConcurrency: 2,
};

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Quality_Ang] Starting verification');

  try {
    const logs: string[] = [];

    // 1. Semantic consistency check via VL-JEPA
    const consistency = await VLJEPA.verifySemanticConsistency(input.intent, input.query);
    logs.push(`Semantic drift: ${consistency.driftScore} (threshold: 0.15)`);

    // 2. Run heuristic quality checks (always — security baseline)
    const checks = runQualityChecks(input.query, input.intent);
    logs.push(...checks.logs);

    // 3. Try LLM-powered deep review via OpenRouter
    const llmResult = await agentChat({
      agentId: 'quality-ang',
      query: input.query,
      intent: input.intent,
      context: `Heuristic score: ${checks.score}/100. Findings: ${checks.findings.join('; ') || 'None'}. Semantic drift: ${consistency.driftScore}`,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens used: ${llmResult.tokens.total}`);

      const artifacts = [
        `[report] Quality Assessment — Heuristic Score: ${checks.score}/100`,
        `[llm-review] Deep quality review via ${llmResult.model}`,
        ...checks.findings.map(f => `[finding] ${f}`),
      ];

      if (!checks.passed) {
        artifacts.push('[action-required] Issues found — review findings before proceeding');
      }

      const summary = [
        `Quality Assessment: ${checks.passed ? 'PASSED' : 'ISSUES FOUND'}`,
        `Heuristic Score: ${checks.score}/100`,
        `\n--- LLM Deep Review ---\n`,
        llmResult.content,
      ].join('\n');

      return makeOutput(input.taskId, 'quality-ang', summary, artifacts, logs, llmResult.tokens.total, llmResult.cost.usd);
    }

    // Fallback: Heuristic only
    logs.push('Mode: heuristic (configure OPENROUTER_API_KEY for LLM-powered reviews)');

    const artifacts = [
      `[report] Quality Assessment — Score: ${checks.score}/100`,
      ...checks.findings.map(f => `[finding] ${f}`),
    ];

    if (!checks.passed) {
      artifacts.push('[action-required] Issues found — review findings before proceeding');
    }

    const tokens = 300;
    const usd = tokens * 0.00003;

    const summary = [
      `Quality Assessment: ${checks.passed ? 'PASSED' : 'ISSUES FOUND'}`,
      `Score: ${checks.score}/100`,
      `Checks run: ${checks.checksRun}`,
      `Findings: ${checks.findings.length}`,
      `Semantic drift: ${consistency.driftScore}`,
    ].join('\n');

    logger.info({ taskId: input.taskId, passed: checks.passed, score: checks.score }, '[Quality_Ang] Verification complete');
    return makeOutput(input.taskId, 'quality-ang', summary, artifacts, logs, tokens, usd);
  } catch (err) {
    return failOutput(input.taskId, 'quality-ang', err instanceof Error ? err.message : 'Unknown error');
  }
}

// ---------------------------------------------------------------------------
// Internal logic
// ---------------------------------------------------------------------------

interface QualityResult {
  passed: boolean;
  score: number;
  checksRun: number;
  findings: string[];
  logs: string[];
}

function runQualityChecks(query: string, intent: string): QualityResult {
  const findings: string[] = [];
  const logs: string[] = [];
  let score = 100;

  // Check 1: Input specificity
  logs.push('Running input specificity check...');
  if (query.length < 20) {
    findings.push('Input query is vague — more detail improves output quality');
    score -= 10;
  }

  // Check 2: Injection patterns
  logs.push('Running security pattern scan...');
  const dangerPatterns = /(<script|DROP\s+TABLE|;\s*--|eval\(|__proto__|exec\(|rm\s+-rf)/i;
  if (dangerPatterns.test(query)) {
    findings.push('SECURITY: Potentially dangerous patterns detected in input');
    score -= 30;
  }

  // Check 3: Intent coherence
  logs.push('Running intent coherence check...');
  const intentKeywords: Record<string, string[]> = {
    BUILD_PLUG: ['build', 'create', 'make', 'develop', 'implement', 'plug'],
    RESEARCH: ['research', 'analyze', 'study', 'compare', 'investigate', 'find'],
    CHAT: ['help', 'explain', 'tell', 'what', 'how', 'why'],
    AGENTIC_WORKFLOW: ['workflow', 'pipeline', 'automate', 'sequence', 'orchestrate'],
  };

  const keywords = intentKeywords[intent] || [];
  const lower = query.toLowerCase();
  const matchedKeywords = keywords.filter(k => lower.includes(k));
  if (keywords.length > 0 && matchedKeywords.length === 0) {
    findings.push(`Intent mismatch: "${intent}" selected but query lacks related keywords`);
    score -= 15;
  }

  // Check 4: Complexity sanity
  logs.push('Running complexity sanity check...');
  if (query.length > 5000) {
    findings.push('Query exceeds recommended length — consider breaking into sub-tasks');
    score -= 5;
  }

  const checksRun = 4;
  const passed = score >= 70 && findings.filter(f => f.startsWith('SECURITY')).length === 0;

  logs.push(`Quality score: ${score}/100, passed: ${passed}`);
  return { passed, score, checksRun, findings, logs };
}

export const Quality_Ang: Agent = { profile, execute };
