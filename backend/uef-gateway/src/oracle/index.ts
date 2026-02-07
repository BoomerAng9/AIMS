/**
 * ORACLE 8-Gates Verification Framework
 * Heuristic pre-flight checks for ACP requests.
 *
 * Gates: Technical, Security, Strategy, Judge, Perception, Effort, Documentation, Rate & Abuse
 */

import logger from '../logger';

export interface OracleResult {
  passed: boolean;
  score: number; // 0-100
  gateFailures: string[];
  warnings: string[];
}

interface GateCheckResult {
  passed: boolean;
  reason?: string;
  warnings?: string[];
}

interface GateCheck {
  name: string;
  weight: number;
  run: (spec: any, output: any) => GateCheckResult;
}

// ── Simple LRU cache for per-user query deduplication (Rate & Abuse gate) ──
class QueryLRU {
  private maxPerUser: number;
  private cache: Map<string, string[]>;

  constructor(maxPerUser = 3) {
    this.maxPerUser = maxPerUser;
    this.cache = new Map();
  }

  /** Returns true if the query duplicates one of the last N from this user. */
  isDuplicate(userId: string, query: string): boolean {
    const history = this.cache.get(userId) || [];
    return history.includes(query);
  }

  /** Record a query for the user, evicting the oldest if at capacity. */
  record(userId: string, query: string): void {
    const history = this.cache.get(userId) || [];
    history.push(query);
    if (history.length > this.maxPerUser) {
      history.shift();
    }
    this.cache.set(userId, history);
  }
}

const queryLRU = new QueryLRU(3);

const gates: GateCheck[] = [
  {
    name: 'Technical',
    weight: 15,
    run: (spec) => {
      const query = (spec.query || '').trim();
      // Minimum length of 10 characters
      if (query.length < 10) {
        return { passed: false, reason: 'Query too short (minimum 10 characters) — provide a clear objective.' };
      }
      // Must contain at least 2 words
      const words = query.split(/\s+/).filter((w: string) => w.length > 0);
      if (words.length < 2) {
        return { passed: false, reason: 'Query must contain at least 2 words for meaningful processing.' };
      }
      // Intent field must be non-empty
      if (!spec.intent || (typeof spec.intent === 'string' && spec.intent.trim().length === 0)) {
        return { passed: false, reason: 'Intent field is missing or empty.' };
      }
      return { passed: true };
    }
  },
  {
    name: 'Security',
    weight: 15,
    run: (spec) => {
      const query = spec.query || '';

      // ── SQL Injection patterns ──
      const sqlInjection = /(<script|DROP\s+TABLE|;\s*--|eval\(|UNION\s+SELECT|OR\s+1\s*=\s*1|INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM)/i;
      if (sqlInjection.test(query)) {
        return { passed: false, reason: 'Query contains SQL injection patterns.' };
      }

      // ── XSS patterns ──
      const xss = /(onload\s*=|onerror\s*=|javascript\s*:|data\s*:\s*text\/html|<\s*iframe|<\s*object|<\s*embed|<\s*svg\s+onload)/i;
      if (xss.test(query)) {
        return { passed: false, reason: 'Query contains XSS attack patterns.' };
      }

      // ── Path traversal ──
      const pathTraversal = /(\.\.[/\\])/;
      if (pathTraversal.test(query)) {
        return { passed: false, reason: 'Query contains path traversal sequences.' };
      }

      // ── Command injection ──
      const commandInjection = /(;\s*ls\b|\|\s*cat\b|`[^`]+`|\$\([^)]+\)|\|\|\s*\w|&&\s*rm\b)/i;
      if (commandInjection.test(query)) {
        return { passed: false, reason: 'Query contains command injection patterns.' };
      }

      // ── Prototype pollution ──
      const protoPollution = /(__proto__|constructor\s*\.\s*prototype|Object\s*\.\s*assign\s*\()/i;
      if (protoPollution.test(query)) {
        return { passed: false, reason: 'Query contains prototype pollution patterns.' };
      }

      // ── Encoded payloads (URL-encoded or HTML entity encoded) ──
      const encodedPayload = /(%3C\s*script|%3E|&#x3[Cc];|&#60;|%27|%22|%00)/i;
      if (encodedPayload.test(query)) {
        return { passed: false, reason: 'Query contains encoded attack payloads.' };
      }

      // ── Excessively repeated characters (DoS padding) ──
      const repeatedChars = /(.)\1{99,}/;
      if (repeatedChars.test(query)) {
        return { passed: false, reason: 'Query contains excessively repeated characters (possible DoS padding).' };
      }

      return { passed: true };
    }
  },
  {
    name: 'Strategy',
    weight: 15,
    run: (spec) => {
      const validIntents = ['ESTIMATE_ONLY', 'BUILD_PLUG', 'RESEARCH', 'AGENTIC_WORKFLOW', 'CHAT'];
      if (!validIntents.includes(spec.intent)) {
        return { passed: false, reason: `Unknown intent "${spec.intent}".` };
      }

      const query = (spec.query || '').toLowerCase();
      const warnings: string[] = [];

      // Intent-query coherence checks (warn, don't fail)
      if (spec.intent === 'ESTIMATE_ONLY') {
        const actionVerbs = /\b(build|create|deploy|launch|execute|run|install|implement|construct)\b/i;
        if (actionVerbs.test(query)) {
          warnings.push('Strategy: ESTIMATE_ONLY intent contains action verbs — did you mean BUILD_PLUG or AGENTIC_WORKFLOW?');
        }
      }

      if (spec.intent === 'BUILD_PLUG') {
        const techTerms = /\b(api|app|service|server|database|function|component|module|endpoint|plugin|integration|webhook|bot|script|pipeline|frontend|backend|deploy)\b/i;
        if (!techTerms.test(query)) {
          warnings.push('Strategy: BUILD_PLUG intent but query lacks technical terms — consider adding specifics about what to build.');
        }
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    }
  },
  {
    name: 'Judge',
    weight: 10,
    run: (_spec, output) => {
      // Verify a quote was generated
      if (!output.quote) {
        return { passed: false, reason: 'LUC failed to produce a cost quote.' };
      }

      // Quote must contain at least one variant
      if (!output.quote.variants || !Array.isArray(output.quote.variants) || output.quote.variants.length === 0) {
        return { passed: false, reason: 'Quote contains no variants — at least one pricing variant is required.' };
      }

      // Validate each variant has positive totalTokens and non-negative totalUsd
      for (const variant of output.quote.variants) {
        const est = variant.estimate || variant;
        if (typeof est.totalTokens !== 'number' || est.totalTokens <= 0) {
          return { passed: false, reason: `Quote variant has invalid totalTokens (${est.totalTokens}) — must be a positive number.` };
        }
        if (typeof est.totalUsd !== 'number' || est.totalUsd < 0) {
          return { passed: false, reason: `Quote variant has invalid totalUsd (${est.totalUsd}) — must be a non-negative number.` };
        }
      }

      return { passed: true };
    }
  },
  {
    name: 'Perception',
    weight: 10,
    run: (spec) => {
      const query = spec.query || '';

      // Length check — reduced to 8000 characters
      if (query.length > 8000) {
        return { passed: false, reason: 'Query exceeds 8,000 characters — risk of context overflow.' };
      }

      // ── Prompt injection detection ──
      const promptInjection = /(ignore\s+(all\s+)?previous\s+instructions|you\s+are\s+now|forget\s+(all\s+)?your\s+instructions|system\s+prompt|disregard\s+(all\s+)?prior|override\s+(all\s+)?rules|new\s+instructions?\s*:|act\s+as\s+if\s+you\s+are)/i;
      if (promptInjection.test(query)) {
        return { passed: false, reason: 'Query contains prompt injection attempt.' };
      }

      // ── Excessive Unicode / control characters ──
      // Count non-ASCII and control characters (excluding normal whitespace)
      let nonAsciiCount = 0;
      let controlCharCount = 0;
      for (let i = 0; i < query.length; i++) {
        const code = query.charCodeAt(i);
        if (code > 127) nonAsciiCount++;
        // Control chars: 0x00-0x08, 0x0E-0x1F, 0x7F (exclude tab 0x09, LF 0x0A, CR 0x0D)
        if ((code >= 0 && code <= 8) || (code >= 14 && code <= 31) || code === 127) controlCharCount++;
      }
      if (controlCharCount > 5) {
        return { passed: false, reason: `Query contains ${controlCharCount} control characters — possible obfuscation attempt.` };
      }
      const warnings: string[] = [];
      if (query.length > 0 && nonAsciiCount / query.length > 0.3) {
        warnings.push(`Perception: High ratio of non-ASCII characters (${Math.round((nonAsciiCount / query.length) * 100)}%) — verify query is not obfuscated.`);
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    }
  },
  {
    name: 'Effort',
    weight: 15,
    run: (spec, output) => {
      const warnings: string[] = [];

      // If a budget cap is set, verify the cheapest variant fits within it
      if (spec.budget?.maxUsd && output.quote?.variants?.length) {
        const cheapest = Math.min(...output.quote.variants.map((v: any) => (v.estimate || v).totalUsd));
        if (cheapest > spec.budget.maxUsd) {
          return { passed: false, reason: `Cheapest estimate ($${cheapest.toFixed(4)}) exceeds budget cap ($${spec.budget.maxUsd}).` };
        }
      }

      // Warn if any variant's estimated total tokens exceed 500,000
      if (output.quote?.variants?.length) {
        for (const variant of output.quote.variants) {
          const est = variant.estimate || variant;
          if (typeof est.totalTokens === 'number' && est.totalTokens > 500_000) {
            warnings.push(`Effort: Variant "${variant.model || 'unknown'}" estimates ${est.totalTokens.toLocaleString()} tokens — high resource consumption.`);
          }
        }
      }

      // Warn if complexity multiplier exceeds 2.0x
      if (output.quote?.complexityMultiplier && output.quote.complexityMultiplier > 2.0) {
        warnings.push(`Effort: Complexity multiplier is ${output.quote.complexityMultiplier}x — expect significantly higher costs.`);
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    }
  },
  {
    name: 'Documentation',
    weight: 10,
    run: (spec) => {
      const query = (spec.query || '').trim();

      // For build/workflow intents, require at least 30 characters
      const requiresDetail = ['BUILD_PLUG', 'AGENTIC_WORKFLOW'];
      if (requiresDetail.includes(spec.intent) && query.length < 30) {
        return { passed: false, reason: 'Build/workflow intents require a more detailed specification (30+ characters).' };
      }

      // AGENTIC_WORKFLOW: must describe an input-to-output transformation
      if (spec.intent === 'AGENTIC_WORKFLOW') {
        const transformPattern = /(from\s+\S+.*\s+to\s+\S+|take\s+\S+.*\s+(and\s+)?(produce|generate|create|output|return)\s+\S+|input.*output|pipe|transform|convert\s+\S+.*\s+(to|into)\s+\S+)/i;
        if (!transformPattern.test(query)) {
          return { passed: false, reason: 'AGENTIC_WORKFLOW requires a description of input and output (e.g. "from X to Y" or "take X and produce Y").' };
        }
      }

      // RESEARCH: must contain a question or analytical keyword
      if (spec.intent === 'RESEARCH') {
        const questionPattern = /\b(who|what|where|when|why|how|which|compare|analyze|analyse|evaluate|assess|investigate|examine|study)\b/i;
        if (!questionPattern.test(query)) {
          return { passed: false, reason: 'RESEARCH intent requires a question word or analytical keyword (who, what, why, how, compare, analyze, etc.).' };
        }
      }

      return { passed: true };
    }
  },
  {
    name: 'Rate & Abuse',
    weight: 10,
    run: (spec) => {
      const userId = spec.userId || '';

      // Guest users can only CHAT or ESTIMATE_ONLY
      if (userId === 'guest') {
        const guestAllowed = ['CHAT', 'ESTIMATE_ONLY'];
        if (!guestAllowed.includes(spec.intent)) {
          return { passed: false, reason: `Guest users are limited to CHAT and ESTIMATE_ONLY intents — "${spec.intent}" requires authentication.` };
        }
      }

      // Check for duplicate query spam (requires userId)
      const warnings: string[] = [];
      if (userId && spec.query) {
        const queryNormalized = spec.query.trim().toLowerCase();
        if (queryLRU.isDuplicate(userId, queryNormalized)) {
          warnings.push('Rate & Abuse: Duplicate query detected — this query matches one of your recent submissions.');
        }
        // Record for future checks
        queryLRU.record(userId, queryNormalized);
      }

      // Flag missing userId as a warning (not a failure — anonymous use is allowed for some intents)
      if (!userId) {
        warnings.push('Rate & Abuse: No userId provided — request is anonymous. Some features may be restricted.');
      }

      return { passed: true, warnings: warnings.length > 0 ? warnings : undefined };
    }
  }
];

export class Oracle {
  static async runGates(spec: any, output: any): Promise<OracleResult> {
    logger.info('[ORACLE] Running 8 Gates Verification...');

    const failures: string[] = [];
    const warnings: string[] = [];
    let earnedWeight = 0;
    const totalWeight = gates.reduce((s, g) => s + g.weight, 0);

    for (const gate of gates) {
      const result = gate.run(spec, output);
      if (result.passed) {
        earnedWeight += gate.weight;
        logger.info(`  [GATE] ${gate.name}: PASS`);
      } else {
        failures.push(`${gate.name}: ${result.reason}`);
        logger.warn(`  [GATE] ${gate.name}: FAIL — ${result.reason}`);
      }
      // Collect warnings regardless of pass/fail
      if (result.warnings && result.warnings.length > 0) {
        warnings.push(...result.warnings);
        for (const w of result.warnings) {
          logger.info(`  [GATE] ${gate.name}: WARN — ${w}`);
        }
      }
    }

    const score = Math.round((earnedWeight / totalWeight) * 100);
    const passed = failures.length === 0;

    logger.info(`[ORACLE] Final score: ${score}/100 | Passed: ${passed} | Warnings: ${warnings.length}`);

    return { passed, score, gateFailures: failures, warnings };
  }
}
