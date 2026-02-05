/**
 * ORACLE 7-Gates Verification Framework
 * Heuristic pre-flight checks for ACP requests.
 */

import logger from '../logger';

export interface OracleResult {
  passed: boolean;
  score: number; // 0-100
  gateFailures: string[];
}

interface GateCheck {
  name: string;
  weight: number;
  run: (spec: any, output: any) => { passed: boolean; reason?: string };
}

const gates: GateCheck[] = [
  {
    name: 'Technical',
    weight: 20,
    run: (spec) => {
      // Require a non-empty query
      if (!spec.query || spec.query.trim().length < 3) {
        return { passed: false, reason: 'Query too short or empty — provide a clear objective.' };
      }
      return { passed: true };
    }
  },
  {
    name: 'Security',
    weight: 15,
    run: (spec) => {
      // Basic injection / suspicious pattern check
      const suspicious = /(<script|DROP\s+TABLE|;\s*--|eval\(|__proto__)/i;
      if (suspicious.test(spec.query || '')) {
        return { passed: false, reason: 'Query contains potentially unsafe patterns.' };
      }
      return { passed: true };
    }
  },
  {
    name: 'Strategy',
    weight: 15,
    run: (spec) => {
      // Ensure intent is a recognized value
      const validIntents = ['ESTIMATE_ONLY', 'BUILD_PLUG', 'RESEARCH', 'AGENTIC_WORKFLOW', 'CHAT'];
      if (!validIntents.includes(spec.intent)) {
        return { passed: false, reason: `Unknown intent "${spec.intent}".` };
      }
      return { passed: true };
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
      return { passed: true };
    }
  },
  {
    name: 'Perception',
    weight: 10,
    run: (spec) => {
      // Warn on excessively long queries that may cause context overflow
      if ((spec.query || '').length > 10000) {
        return { passed: false, reason: 'Query exceeds 10 000 characters — risk of context overflow.' };
      }
      return { passed: true };
    }
  },
  {
    name: 'Effort',
    weight: 15,
    run: (spec, output) => {
      // If a budget cap is set, verify the cheapest variant fits within it
      if (spec.budget?.maxUsd && output.quote?.variants?.length) {
        const cheapest = Math.min(...output.quote.variants.map((v: any) => v.estimate.totalUsd));
        if (cheapest > spec.budget.maxUsd) {
          return { passed: false, reason: `Cheapest estimate ($${cheapest.toFixed(4)}) exceeds budget cap ($${spec.budget.maxUsd}).` };
        }
      }
      return { passed: true };
    }
  },
  {
    name: 'Documentation',
    weight: 15,
    run: (spec) => {
      // For build/workflow intents, encourage descriptive queries
      const requiresDetail = ['BUILD_PLUG', 'AGENTIC_WORKFLOW'];
      if (requiresDetail.includes(spec.intent) && (spec.query || '').trim().length < 20) {
        return { passed: false, reason: 'Build/workflow intents require a more detailed specification (20+ chars).' };
      }
      return { passed: true };
    }
  }
];

export class Oracle {
  static async runGates(spec: any, output: any): Promise<OracleResult> {
    logger.info('[ORACLE] Running 7 Gates Verification...');

    const failures: string[] = [];
    let earnedWeight = 0;
    const totalWeight = gates.reduce((s, g) => s + g.weight, 0);

    for (const gate of gates) {
      const result = gate.run(spec, output);
      if (result.passed) {
        earnedWeight += gate.weight;
        logger.info(`  [GATE] ${gate.name}: PASS`);
      } else {
        failures.push(`${gate.name}: ${result.reason}`);
        logger.info(`  [GATE] ${gate.name}: FAIL — ${result.reason}`);
      }
    }

    const score = Math.round((earnedWeight / totalWeight) * 100);
    const passed = failures.length === 0;

    logger.info(`[ORACLE] Final score: ${score}/100 | Passed: ${passed}`);

    return { passed, score, gateFailures: failures };
  }
}
