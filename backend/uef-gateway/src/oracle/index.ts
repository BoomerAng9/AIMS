/**
 * ORACLE 7-Gates Verification Framework
 * Real implementation with weighted heuristic gates.
 */

import { ACPStandardizedRequest } from '../acp/types';

export interface GateResult {
  name: string;
  passed: boolean;
  score: number; // 0-100
  message: string;
}

export interface OracleResult {
  passed: boolean;
  score: number; // 0-100 weighted average
  gateResults: GateResult[];
  gateFailures: string[];
}

// Gate weights (must sum to 100)
const GATE_WEIGHTS = {
  technical: 15,
  security: 20,
  strategy: 15,
  judge: 15,
  perception: 10,
  effort: 15,
  documentation: 10,
};

// Security patterns to block
const INJECTION_PATTERNS = [
  /DROP\s+TABLE/i,
  /DELETE\s+FROM/i,
  /INSERT\s+INTO.*VALUES/i,
  /UPDATE.*SET.*WHERE/i,
  /--/,
  /;\s*$/,
  /<script>/i,
  /eval\s*\(/i,
  /rm\s+-rf/i,
  /sudo\s+/i,
  /exec\s*\(/i,
];

// Valid intents
const VALID_INTENTS = ['ESTIMATE_ONLY', 'BUILD_PLUG', 'RESEARCH', 'AGENTIC_WORKFLOW', 'CHAT'];

export class Oracle {
  /**
   * Run all 7 gates against a request and its output
   */
  static async runGates(request: ACPStandardizedRequest, output: any): Promise<OracleResult> {
    console.log('[ORACLE] Running 7 Gates Verification...');

    const gates: GateResult[] = [];

    // Gate 1: Technical - Query must be non-empty and parseable
    gates.push(this.runTechnicalGate(request));

    // Gate 2: Security - Check for injection patterns
    gates.push(this.runSecurityGate(request));

    // Gate 3: Strategy - Valid intent mapping
    gates.push(this.runStrategyGate(request));

    // Gate 4: Judge - Quote was generated
    gates.push(this.runJudgeGate(output));

    // Gate 5: Perception - Context/token limits
    gates.push(this.runPerceptionGate(request));

    // Gate 6: Effort - Budget/cost constraints
    gates.push(this.runEffortGate(request, output));

    // Gate 7: Documentation - Sufficient detail for builds
    gates.push(this.runDocumentationGate(request));

    // Calculate weighted score
    const weightedScore = this.calculateWeightedScore(gates);
    
    // Collect failures
    const failures = gates.filter(g => !g.passed).map(g => g.name);

    // Pass if score >= 70 and no critical failures (security)
    const securityPassed = gates.find(g => g.name === 'Security')?.passed ?? false;
    const passed = weightedScore >= 70 && securityPassed;

    const result: OracleResult = {
      passed,
      score: Math.round(weightedScore),
      gateResults: gates,
      gateFailures: failures,
    };

    console.log(`[ORACLE] Final Score: ${result.score}/100, Passed: ${result.passed}`);
    if (failures.length > 0) {
      console.log(`[ORACLE] Failed Gates: ${failures.join(', ')}`);
    }

    return result;
  }

  // Gate 1: Technical
  private static runTechnicalGate(request: ACPStandardizedRequest): GateResult {
    const query = request.naturalLanguage?.trim() || '';
    
    if (!query) {
      return { name: 'Technical', passed: false, score: 0, message: 'Empty query' };
    }
    
    if (query.length < 3) {
      return { name: 'Technical', passed: false, score: 30, message: 'Query too short' };
    }

    if (query.length > 10000) {
      return { name: 'Technical', passed: false, score: 50, message: 'Query exceeds max length' };
    }

    return { name: 'Technical', passed: true, score: 100, message: 'Query valid' };
  }

  // Gate 2: Security
  private static runSecurityGate(request: ACPStandardizedRequest): GateResult {
    const query = request.naturalLanguage || '';
    
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(query)) {
        return { 
          name: 'Security', 
          passed: false, 
          score: 0, 
          message: `Potential injection detected: ${pattern.source}` 
        };
      }
    }

    // Check for suspicious metadata
    if (request.metadata) {
      const metaStr = JSON.stringify(request.metadata);
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(metaStr)) {
          return { 
            name: 'Security', 
            passed: false, 
            score: 0, 
            message: 'Suspicious metadata detected' 
          };
        }
      }
    }

    return { name: 'Security', passed: true, score: 100, message: 'No threats detected' };
  }

  // Gate 3: Strategy
  private static runStrategyGate(request: ACPStandardizedRequest): GateResult {
    if (!VALID_INTENTS.includes(request.intent)) {
      return { 
        name: 'Strategy', 
        passed: false, 
        score: 0, 
        message: `Invalid intent: ${request.intent}` 
      };
    }

    // Check intent-query alignment
    const query = request.naturalLanguage.toLowerCase();
    let alignment = 50; // Base score

    if (request.intent === 'BUILD_PLUG' && (query.includes('build') || query.includes('create') || query.includes('make'))) {
      alignment = 100;
    } else if (request.intent === 'RESEARCH' && (query.includes('research') || query.includes('find') || query.includes('analyze'))) {
      alignment = 100;
    } else if (request.intent === 'CHAT') {
      alignment = 100; // Chat is always aligned
    } else if (request.intent === 'ESTIMATE_ONLY') {
      alignment = 100; // Estimate is always aligned
    } else if (request.intent === 'AGENTIC_WORKFLOW') {
      alignment = query.length > 50 ? 100 : 70; // Workflows need detail
    }

    return { 
      name: 'Strategy', 
      passed: alignment >= 50, 
      score: alignment, 
      message: alignment >= 100 ? 'Intent aligned' : 'Partial intent alignment' 
    };
  }

  // Gate 4: Judge
  private static runJudgeGate(output: any): GateResult {
    if (!output) {
      return { name: 'Judge', passed: false, score: 0, message: 'No output generated' };
    }

    if (!output.quote && !output.response && !output.message) {
      return { name: 'Judge', passed: false, score: 30, message: 'Output missing key fields' };
    }

    if (output.quote) {
      return { name: 'Judge', passed: true, score: 100, message: 'Quote generated successfully' };
    }

    return { name: 'Judge', passed: true, score: 80, message: 'Output generated' };
  }

  // Gate 5: Perception
  private static runPerceptionGate(request: ACPStandardizedRequest): GateResult {
    const query = request.naturalLanguage || '';
    const estimatedTokens = Math.ceil(query.length / 4); // Rough estimate

    if (estimatedTokens > 100000) {
      return { 
        name: 'Perception', 
        passed: false, 
        score: 0, 
        message: 'Context overflow: query exceeds token limits' 
      };
    }

    if (estimatedTokens > 50000) {
      return { 
        name: 'Perception', 
        passed: true, 
        score: 60, 
        message: 'Large context: may require chunking' 
      };
    }

    return { name: 'Perception', passed: true, score: 100, message: 'Context within limits' };
  }

  // Gate 6: Effort
  private static runEffortGate(request: ACPStandardizedRequest, output: any): GateResult {
    const budget = request.budget;
    
    if (!budget) {
      // No budget specified = unlimited, always pass
      return { name: 'Effort', passed: true, score: 100, message: 'No budget constraints' };
    }

    // Check against quote if available
    if (output?.quote?.totalUsd) {
      const estimatedCost = output.quote.totalUsd;
      
      if (estimatedCost > budget.maxUsd) {
        return { 
          name: 'Effort', 
          passed: false, 
          score: Math.min(100, Math.round((budget.maxUsd / estimatedCost) * 100)), 
          message: `Cost $${estimatedCost.toFixed(2)} exceeds budget $${budget.maxUsd.toFixed(2)}` 
        };
      }
    }

    // Check token budget
    if (budget.maxTokens && output?.totalTokens) {
      if (output.totalTokens > budget.maxTokens) {
        return { 
          name: 'Effort', 
          passed: false, 
          score: Math.min(100, Math.round((budget.maxTokens / output.totalTokens) * 100)), 
          message: `Tokens ${output.totalTokens} exceeds budget ${budget.maxTokens}` 
        };
      }
    }

    return { name: 'Effort', passed: true, score: 100, message: 'Within budget' };
  }

  // Gate 7: Documentation
  private static runDocumentationGate(request: ACPStandardizedRequest): GateResult {
    const intent = request.intent;
    const query = request.naturalLanguage || '';
    
    // BUILD_PLUG and AGENTIC_WORKFLOW need sufficient detail
    if (intent === 'BUILD_PLUG' || intent === 'AGENTIC_WORKFLOW') {
      if (query.length < 50) {
        return { 
          name: 'Documentation', 
          passed: false, 
          score: 30, 
          message: 'Insufficient detail for build/workflow intent' 
        };
      }

      // Check for key requirements indicators
      const hasRequirements = /should|must|need|require|want|feature|functionality/i.test(query);
      if (!hasRequirements && query.length < 100) {
        return { 
          name: 'Documentation', 
          passed: true, 
          score: 60, 
          message: 'Low detail: consider adding requirements' 
        };
      }
    }

    return { name: 'Documentation', passed: true, score: 100, message: 'Documentation sufficient' };
  }

  // Calculate weighted score
  private static calculateWeightedScore(gates: GateResult[]): number {
    const weights: Record<string, number> = {
      'Technical': GATE_WEIGHTS.technical,
      'Security': GATE_WEIGHTS.security,
      'Strategy': GATE_WEIGHTS.strategy,
      'Judge': GATE_WEIGHTS.judge,
      'Perception': GATE_WEIGHTS.perception,
      'Effort': GATE_WEIGHTS.effort,
      'Documentation': GATE_WEIGHTS.documentation,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const gate of gates) {
      const weight = weights[gate.name] || 10;
      totalWeight += weight;
      weightedSum += gate.score * weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
}
