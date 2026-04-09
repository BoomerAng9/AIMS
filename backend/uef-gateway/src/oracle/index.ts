/**
 * ORACLE 8-Gates Verification Framework
 * =====================================
 * Heuristic pre-flight checks for ACP requests.
 *
 * Gates: Technical, Security, Strategy, Judge, Perception, Effort,
 *        Documentation, Rate & Abuse.
 *
 * Public API:
 *   - Oracle.runGates(spec, output) → Promise<OracleResult>
 *   - Oracle._resetForTesting()     → clear the duplicate-query LRU
 *
 * Design notes:
 *   - Fail-closed: any unexpected exception inside a gate is caught and
 *     recorded as a failure for that gate. The verification never
 *     crashes the caller or silently skips a gate.
 *   - Single normalization: spec.query / spec.intent / spec.userId are
 *     coerced to safe strings ONCE at the top of runGates. The gates
 *     all receive a NormalizedSpec and do not re-parse.
 *   - Bounded memory: the per-user duplicate-query LRU caps both the
 *     number of tracked users AND the queries-per-user, so an attacker
 *     spamming with rotating user ids cannot grow the cache without
 *     bound.
 *   - Typed contracts: OracleSpec / OracleOutput / GateCheckResult /
 *     GateCheck all live in ./types. No `any` inside the gate runners.
 *   - IP-safe reasons: error messages do not reference internal service
 *     names. An OracleResult may flow to PUBLIC surfaces where only
 *     "ACHEEVY" and "your AI team" vocabulary is allowed (per A.I.M.S.
 *     Dual-Layer Access rule — see CLAUDE.md).
 */

import logger from '../logger';
import type { ACPIntent } from '../acp/types';
import type {
  OracleSpec,
  OracleOutput,
  OracleResult,
  NormalizedSpec,
  GateCheck,
  GateCheckResult,
  OracleQuoteVariant,
} from './types';

export type { OracleResult, OracleSpec, OracleOutput } from './types';

// ─── Tunable thresholds ──────────────────────────────────────────────
// Centralized so they're discoverable without grepping the file.

const TECHNICAL_MIN_QUERY_LENGTH = 10;
const TECHNICAL_MIN_WORDS = 2;

const PERCEPTION_MAX_QUERY_LENGTH = 8000;
const PERCEPTION_MAX_CONTROL_CHARS = 5;
const PERCEPTION_NON_ASCII_WARN_RATIO = 0.3;

const EFFORT_TOKEN_WARN_THRESHOLD = 500_000;
const EFFORT_COMPLEXITY_WARN_MULTIPLIER = 2.0;

const DOCS_MIN_DETAIL_CHARS = 30;

const REPEATED_CHAR_THRESHOLD = 99; // 100+ identical chars = DoS padding

const LRU_MAX_USERS = 10_000;
const LRU_MAX_QUERIES_PER_USER = 3;
const LRU_ENTRY_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Valid ACP intents (runtime check) ───────────────────────────────
// Source-of-truth is ACPIntent in ../acp/types. We repeat it here as a
// runtime Set because type info is erased at runtime.
const VALID_INTENTS: ReadonlySet<ACPIntent> = new Set<ACPIntent>([
  'ESTIMATE_ONLY',
  'BUILD_PLUG',
  'RESEARCH',
  'AGENTIC_WORKFLOW',
  'CHAT',
]);

const GUEST_ALLOWED_INTENTS: ReadonlySet<ACPIntent> = new Set<ACPIntent>([
  'CHAT',
  'ESTIMATE_ONLY',
]);

// ─── Input normalization ─────────────────────────────────────────────

/**
 * Coerce an OracleSpec from untrusted shape into a NormalizedSpec with
 * guaranteed-safe string fields. Non-string values fall back to ''.
 */
function normalizeSpec(spec: OracleSpec | null | undefined): NormalizedSpec {
  const safeSpec = spec ?? {};
  const query = typeof safeSpec.query === 'string' ? safeSpec.query : '';
  const userId = typeof safeSpec.userId === 'string' ? safeSpec.userId : '';
  const intent: NormalizedSpec['intent'] =
    typeof safeSpec.intent === 'string' && VALID_INTENTS.has(safeSpec.intent as ACPIntent)
      ? (safeSpec.intent as ACPIntent)
      : 'UNKNOWN';

  const rawBudget = safeSpec.budget;
  let budget: NormalizedSpec['budget'];
  if (rawBudget && typeof rawBudget === 'object') {
    const maxUsdRaw = (rawBudget as { maxUsd?: unknown }).maxUsd;
    if (typeof maxUsdRaw === 'number' && Number.isFinite(maxUsdRaw)) {
      budget = { maxUsd: maxUsdRaw };
    }
  }

  return { query, intent, userId, budget };
}

// ─── Per-user duplicate-query LRU (Rate & Abuse gate) ────────────────

interface LRUEntry {
  queries: string[];
  lastTouched: number;
}

/**
 * Bounded two-level LRU: caps total user count AND queries-per-user,
 * with a TTL sweep on every touch. Prevents the unbounded-memory DoS
 * the prior implementation was vulnerable to.
 */
class QueryLRU {
  private readonly maxUsers: number;
  private readonly maxPerUser: number;
  private readonly ttlMs: number;
  private readonly entries: Map<string, LRUEntry>;

  constructor(opts: { maxUsers: number; maxPerUser: number; ttlMs: number }) {
    this.maxUsers = opts.maxUsers;
    this.maxPerUser = opts.maxPerUser;
    this.ttlMs = opts.ttlMs;
    this.entries = new Map();
  }

  /** Returns true if `query` duplicates one of this user's recent entries. */
  isDuplicate(userId: string, query: string): boolean {
    this.sweepExpired();
    const entry = this.entries.get(userId);
    if (!entry) return false;
    return entry.queries.includes(query);
  }

  /** Record a query for the user. Evicts oldest if at capacity. */
  record(userId: string, query: string): void {
    this.sweepExpired();

    // Insertion order is the LRU proxy: delete + set bumps the user to
    // the most-recently-used end of the Map.
    const existing = this.entries.get(userId);
    this.entries.delete(userId);

    if (existing) {
      existing.queries.push(query);
      if (existing.queries.length > this.maxPerUser) {
        existing.queries.shift();
      }
      existing.lastTouched = Date.now();
      this.entries.set(userId, existing);
    } else {
      // New user — evict the oldest if we're at the cap.
      if (this.entries.size >= this.maxUsers) {
        const oldestUserId = this.entries.keys().next().value;
        if (oldestUserId !== undefined) this.entries.delete(oldestUserId);
      }
      this.entries.set(userId, {
        queries: [query],
        lastTouched: Date.now(),
      });
    }
  }

  /** Drop entries whose lastTouched has exceeded ttlMs. */
  private sweepExpired(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [userId, entry] of this.entries) {
      if (entry.lastTouched < cutoff) {
        this.entries.delete(userId);
      } else {
        // Map iteration is insertion-ordered; once we hit a fresh entry
        // every later entry is at least as fresh. Stop early.
        break;
      }
    }
  }

  /** Test/dev helper — clear all state. */
  clear(): void {
    this.entries.clear();
  }

  /** Expose for metrics / debugging. */
  get size(): number {
    return this.entries.size;
  }
}

const queryLRU = new QueryLRU({
  maxUsers: LRU_MAX_USERS,
  maxPerUser: LRU_MAX_QUERIES_PER_USER,
  ttlMs: LRU_ENTRY_TTL_MS,
});

// ─── Gate definitions ────────────────────────────────────────────────

const gates: GateCheck[] = [
  {
    name: 'Technical',
    weight: 15,
    run: (spec) => {
      const query = spec.query.trim();
      if (query.length < TECHNICAL_MIN_QUERY_LENGTH) {
        return {
          passed: false,
          reason: `Query too short (minimum ${TECHNICAL_MIN_QUERY_LENGTH} characters) — provide a clear objective.`,
        };
      }
      const words = query.split(/\s+/).filter((w) => w.length > 0);
      if (words.length < TECHNICAL_MIN_WORDS) {
        return {
          passed: false,
          reason: `Query must contain at least ${TECHNICAL_MIN_WORDS} words for meaningful processing.`,
        };
      }
      if (spec.intent === 'UNKNOWN') {
        return { passed: false, reason: 'Intent field is missing or empty.' };
      }
      return { passed: true };
    },
  },
  {
    name: 'Security',
    weight: 15,
    run: (spec) => {
      const query = spec.query;

      // SQL injection patterns — only the high-signal ones remain.
      // Removed standalone INSERT/UPDATE/DELETE that fire on normal English.
      const sqlInjection =
        /(<script|DROP\s+TABLE|;\s*--|eval\(|UNION\s+SELECT|OR\s+1\s*=\s*1)/i;
      if (sqlInjection.test(query)) {
        return { passed: false, reason: 'Query contains SQL injection patterns.' };
      }

      // XSS attack patterns — narrowed to real attack shapes.
      const xss =
        /(javascript\s*:|data\s*:\s*text\/html|<\s*iframe|<\s*object\s|<\s*embed\s|<\s*svg\s+onload)/i;
      if (xss.test(query)) {
        return { passed: false, reason: 'Query contains XSS attack patterns.' };
      }

      // Path traversal — unchanged, tight signal.
      const pathTraversal = /(\.\.[/\\])/;
      if (pathTraversal.test(query)) {
        return { passed: false, reason: 'Query contains path traversal sequences.' };
      }

      // Command injection — removed `|| word` and bare `;ls` to cut
      // false positives on discussions of JS operators and shell basics.
      const commandInjection = /(`[^`]{2,}`|\$\([^)]+\)|&&\s*rm\s+-rf)/i;
      if (commandInjection.test(query)) {
        return { passed: false, reason: 'Query contains command injection patterns.' };
      }

      // Excessively repeated characters (DoS padding).
      const repeatedChars = new RegExp(`(.)\\1{${REPEATED_CHAR_THRESHOLD},}`);
      if (repeatedChars.test(query)) {
        return {
          passed: false,
          reason: 'Query contains excessively repeated characters (possible DoS padding).',
        };
      }

      return { passed: true };
    },
  },
  {
    name: 'Strategy',
    weight: 15,
    run: (spec) => {
      if (spec.intent === 'UNKNOWN') {
        return { passed: false, reason: 'Unknown or unsupported intent.' };
      }

      const query = spec.query.toLowerCase();
      const warnings: string[] = [];

      if (spec.intent === 'ESTIMATE_ONLY') {
        const actionVerbs = /\b(build|create|deploy|launch|execute|run|install|implement|construct)\b/i;
        if (actionVerbs.test(query)) {
          warnings.push(
            'Strategy: ESTIMATE_ONLY intent contains action verbs — did you mean BUILD_PLUG or AGENTIC_WORKFLOW?',
          );
        }
      }

      if (spec.intent === 'BUILD_PLUG') {
        const techTerms =
          /\b(api|app|service|server|database|function|component|module|endpoint|plugin|integration|webhook|bot|script|pipeline|frontend|backend|deploy)\b/i;
        if (!techTerms.test(query)) {
          warnings.push(
            'Strategy: BUILD_PLUG intent but query lacks technical terms — consider adding specifics about what to build.',
          );
        }
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    },
  },
  {
    name: 'Judge',
    weight: 10,
    run: (_spec, output) => {
      if (!output.quote) {
        return { passed: false, reason: 'Cost quote could not be generated.' };
      }

      const variants = output.quote.variants;
      if (!Array.isArray(variants) || variants.length === 0) {
        return {
          passed: false,
          reason: 'Quote contains no pricing variants — at least one variant is required.',
        };
      }

      for (const variant of variants) {
        const est = variant.estimate ?? (variant as OracleQuoteVariant);
        const totalTokens = est.totalTokens;
        const totalUsd = est.totalUsd;

        if (typeof totalTokens !== 'number' || !Number.isFinite(totalTokens) || totalTokens <= 0) {
          return {
            passed: false,
            reason: `Quote variant has invalid totalTokens (${String(totalTokens)}) — must be a positive number.`,
          };
        }
        if (typeof totalUsd !== 'number' || !Number.isFinite(totalUsd) || totalUsd < 0) {
          return {
            passed: false,
            reason: `Quote variant has invalid totalUsd (${String(totalUsd)}) — must be a non-negative number.`,
          };
        }
      }

      return { passed: true };
    },
  },
  {
    name: 'Perception',
    weight: 10,
    run: (spec) => {
      const query = spec.query;

      if (query.length > PERCEPTION_MAX_QUERY_LENGTH) {
        return {
          passed: false,
          reason: `Query exceeds ${PERCEPTION_MAX_QUERY_LENGTH.toLocaleString()} characters — risk of context overflow.`,
        };
      }

      // Prompt injection detection.
      const promptInjection =
        /(ignore\s+(all\s+)?previous\s+instructions|you\s+are\s+now|forget\s+(all\s+)?your\s+instructions|system\s+prompt|disregard\s+(all\s+)?prior|override\s+(all\s+)?rules|new\s+instructions?\s*:|act\s+as\s+if\s+you\s+are)/i;
      if (promptInjection.test(query)) {
        return { passed: false, reason: 'Query contains prompt injection attempt.' };
      }

      // Count non-ASCII + control characters using code-point iteration
      // so surrogate pairs (emoji) count as 1 instead of 2.
      let nonAsciiCount = 0;
      let controlCharCount = 0;
      let codepointCount = 0;
      for (const ch of query) {
        codepointCount++;
        const code = ch.codePointAt(0) ?? 0;
        if (code > 127) nonAsciiCount++;
        if ((code >= 0 && code <= 8) || (code >= 14 && code <= 31) || code === 127) {
          controlCharCount++;
        }
      }

      if (controlCharCount > PERCEPTION_MAX_CONTROL_CHARS) {
        return {
          passed: false,
          reason: `Query contains ${controlCharCount} control characters — possible obfuscation attempt.`,
        };
      }

      const warnings: string[] = [];
      if (codepointCount > 0 && nonAsciiCount / codepointCount > PERCEPTION_NON_ASCII_WARN_RATIO) {
        warnings.push(
          `Perception: High ratio of non-ASCII characters (${Math.round((nonAsciiCount / codepointCount) * 100)}%) — verify query is not obfuscated.`,
        );
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    },
  },
  {
    name: 'Effort',
    weight: 15,
    run: (spec, output) => {
      const warnings: string[] = [];
      const variants = output.quote?.variants;

      // Budget enforcement — only runs if a budget cap is set AND the
      // variants are well-formed. NaN / missing values cause the gate
      // to fail closed rather than silently passing.
      if (spec.budget?.maxUsd !== undefined && Array.isArray(variants) && variants.length > 0) {
        const usdValues = variants
          .map((v) => (v.estimate ?? v).totalUsd)
          .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
        if (usdValues.length === 0) {
          return {
            passed: false,
            reason: 'Cannot enforce budget — no valid USD estimates in quote.',
          };
        }
        const cheapest = Math.min(...usdValues);
        if (cheapest > spec.budget.maxUsd) {
          return {
            passed: false,
            reason: `Cheapest estimate ($${cheapest.toFixed(4)}) exceeds budget cap ($${spec.budget.maxUsd}).`,
          };
        }
      }

      // Warn on high token estimates.
      if (Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          const est = variant.estimate ?? variant;
          const totalTokens = est.totalTokens;
          if (
            typeof totalTokens === 'number' &&
            Number.isFinite(totalTokens) &&
            totalTokens > EFFORT_TOKEN_WARN_THRESHOLD
          ) {
            warnings.push(
              `Effort: Variant "${variant.model ?? 'unknown'}" estimates ${totalTokens.toLocaleString()} tokens — high resource consumption.`,
            );
          }
        }
      }

      // Warn on high complexity multiplier.
      const complexityMultiplier = output.quote?.complexityMultiplier;
      if (
        typeof complexityMultiplier === 'number' &&
        Number.isFinite(complexityMultiplier) &&
        complexityMultiplier > EFFORT_COMPLEXITY_WARN_MULTIPLIER
      ) {
        warnings.push(
          `Effort: Complexity multiplier is ${complexityMultiplier}x — expect significantly higher costs.`,
        );
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    },
  },
  {
    name: 'Documentation',
    weight: 10,
    run: (spec) => {
      const query = spec.query.trim();

      const requiresDetail: ReadonlySet<ACPIntent> = new Set(['BUILD_PLUG', 'AGENTIC_WORKFLOW']);
      if (
        spec.intent !== 'UNKNOWN' &&
        requiresDetail.has(spec.intent) &&
        query.length < DOCS_MIN_DETAIL_CHARS
      ) {
        return {
          passed: false,
          reason: `Build/workflow intents require a more detailed specification (${DOCS_MIN_DETAIL_CHARS}+ characters).`,
        };
      }

      if (spec.intent === 'AGENTIC_WORKFLOW') {
        const transformPattern =
          /(from\s+\S+.{0,200}?\s+to\s+\S+|take\s+\S+.{0,200}?\s+(and\s+)?(produce|generate|create|output|return)\s+\S+|input.*?output|pipe|transform|convert\s+\S+.{0,200}?\s+(to|into)\s+\S+)/i;
        if (!transformPattern.test(query)) {
          return {
            passed: false,
            reason:
              'AGENTIC_WORKFLOW requires a description of input and output (e.g. "from X to Y" or "take X and produce Y").',
          };
        }
      }

      if (spec.intent === 'RESEARCH') {
        const questionPattern =
          /\b(who|what|where|when|why|how|which|compare|analyze|analyse|evaluate|assess|investigate|examine|study)\b/i;
        if (!questionPattern.test(query)) {
          return {
            passed: false,
            reason:
              'RESEARCH intent requires a question word or analytical keyword (who, what, why, how, compare, analyze, etc.).',
          };
        }
      }

      return { passed: true };
    },
  },
  {
    name: 'Rate & Abuse',
    weight: 10,
    run: (spec) => {
      const userId = spec.userId.trim().toLowerCase();
      const warnings: string[] = [];

      // Guest users can only CHAT or ESTIMATE_ONLY.
      if (userId === 'guest') {
        if (spec.intent !== 'UNKNOWN' && !GUEST_ALLOWED_INTENTS.has(spec.intent)) {
          return {
            passed: false,
            reason: `Guest users are limited to CHAT and ESTIMATE_ONLY intents — "${spec.intent}" requires authentication.`,
          };
        }
      }

      // Duplicate query spam check — requires a userId.
      if (userId && spec.query) {
        const queryNormalized = spec.query.trim().toLowerCase();
        if (queryLRU.isDuplicate(userId, queryNormalized)) {
          warnings.push(
            'Rate & Abuse: Duplicate query detected — this query matches one of your recent submissions.',
          );
        }
        queryLRU.record(userId, queryNormalized);
      }

      if (!userId) {
        warnings.push(
          'Rate & Abuse: No userId provided — request is anonymous. Some features may be restricted.',
        );
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    },
  },
];

// ─── Public API ──────────────────────────────────────────────────────

export class Oracle {
  /**
   * Run all 8 gates against a spec + output pair. Fail-closed: any
   * exception inside a gate is caught and recorded as that gate's
   * failure. Returns an OracleResult even on partial collapse.
   */
  static async runGates(spec: OracleSpec, output: OracleOutput): Promise<OracleResult> {
    logger.info('[ORACLE] Running 8 Gates Verification...');

    const normalizedSpec = normalizeSpec(spec);
    const safeOutput: OracleOutput = output ?? {};

    const failures: string[] = [];
    const warnings: string[] = [];
    let earnedWeight = 0;
    const totalWeight = gates.reduce((s, g) => s + g.weight, 0);

    for (const gate of gates) {
      let result: GateCheckResult;
      try {
        result = gate.run(normalizedSpec, safeOutput);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`  [GATE] ${gate.name}: CRASHED — ${message}`);
        result = {
          passed: false,
          reason: `Gate "${gate.name}" crashed during verification — treating as fail.`,
        };
      }

      if (result.passed) {
        earnedWeight += gate.weight;
        logger.info(`  [GATE] ${gate.name}: PASS`);
      } else {
        failures.push(`${gate.name}: ${result.reason}`);
        logger.warn(`  [GATE] ${gate.name}: FAIL — ${result.reason}`);
      }

      if (result.warnings && result.warnings.length > 0) {
        warnings.push(...result.warnings);
        for (const w of result.warnings) {
          logger.info(`  [GATE] ${gate.name}: WARN — ${w}`);
        }
      }
    }

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    const passed = failures.length === 0;

    logger.info(
      `[ORACLE] Final score: ${score}/100 | Passed: ${passed} | Warnings: ${warnings.length}`,
    );

    return { passed, score, gateFailures: failures, warnings };
  }

  /**
   * Test/dev helper — clear the per-user duplicate-query LRU so each
   * test starts with a clean slate. Do not call in production.
   */
  static _resetForTesting(): void {
    queryLRU.clear();
  }
}
