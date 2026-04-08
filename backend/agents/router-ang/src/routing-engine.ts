/**
 * Router_Ang — Smart Routing Engine
 *
 * Classifies user intent, discovers the best agent via A2A capabilities,
 * and delegates the task. Supports fallback routing and task decomposition.
 *
 * Routing strategy:
 *   1. Classify intent → extract keywords
 *   2. Find best-matched agent via discovery client
 *   3. Delegate via A2A task/send to target agent
 *   4. If target fails → try next-best agent (fallback)
 *   5. If no agent found → handle directly with degraded response
 */

import { v4 as uuidv4 } from 'uuid';
import { discoveryClient, DiscoveredAgent } from './discovery-client';
import { logger } from './logger';

// UEF Gateway for delegating back to in-process agents
const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || 'http://uef-gateway:3001';
const DELEGATION_TIMEOUT_MS = 120_000; // 2 minutes

// ---------------------------------------------------------------------------
// Intent Classification
// ---------------------------------------------------------------------------

interface ClassifiedIntent {
  category: string;
  keywords: string[];
  confidence: number;
}

const INTENT_PATTERNS: Array<{
  category: string;
  keywords: string[];
  patterns: RegExp[];
}> = [
  {
    category: 'engineering',
    keywords: ['code', 'typescript', 'react', 'deploy', 'docker', 'api', 'database'],
    patterns: [
      /\b(build|code|develop|implement|scaffold|deploy|docker|api|endpoint|database|schema|migration|component|frontend|backend)\b/i,
    ],
  },
  {
    category: 'research',
    keywords: ['research', 'market', 'analysis', 'data', 'trends', 'competitive'],
    patterns: [
      /\b(research|analy[sz]e|market|competitor|trend|data|survey|study|investigate|report|benchmark|swot|tam|sam)\b/i,
    ],
  },
  {
    category: 'marketing',
    keywords: ['copy', 'content', 'seo', 'campaign', 'email', 'social', 'brand'],
    patterns: [
      /\b(market(ing)?|copy|content|seo|campaign|email|social|brand|outreach|landing\s*page|blog|newsletter)\b/i,
    ],
  },
  {
    category: 'quality',
    keywords: ['security', 'review', 'audit', 'test', 'verify', 'compliance'],
    patterns: [
      /\b(security|audit|review|test|verify|compliance|vulnerab|owasp|penetration|qa|quality)\b/i,
    ],
  },
  {
    category: 'pipeline',
    keywords: ['pipeline', 'build', 'execution', 'workflow', 'sequence'],
    patterns: [
      /\b(pipeline|workflow|automat|sequence|orchestrat|multi.?step|chain)\b/i,
    ],
  },
  {
    category: 'strategy',
    keywords: ['strategy', 'gtm', 'growth', 'plan', 'roadmap'],
    patterns: [
      /\b(strateg|go.?to.?market|gtm|growth|roadmap|vision|architect|plan)\b/i,
    ],
  },
];

function classifyIntent(query: string): ClassifiedIntent {
  const lower = query.toLowerCase();
  let bestCategory = 'general';
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    for (const re of pattern.patterns) {
      const matches = lower.match(re);
      if (matches) {
        score += matches.length * 10;
      }
    }
    // Bonus for keyword presence
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = pattern.category;
      bestKeywords = pattern.keywords.filter(kw => lower.includes(kw));
    }
  }

  const confidence = Math.min(bestScore / 50, 1.0);

  return {
    category: bestCategory,
    keywords: bestKeywords.length > 0 ? bestKeywords : [bestCategory],
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Agent-to-Capability Mapping
// ---------------------------------------------------------------------------

const CATEGORY_TO_CAPABILITY: Record<string, string> = {
  engineering: 'code-generation',
  research: 'market-research',
  marketing: 'copywriting',
  quality: 'security-audit',
  pipeline: 'pipeline-execution',
  strategy: 'strategic-insights',
  general: 'intent-classification',
};

// ---------------------------------------------------------------------------
// Task Delegation
// ---------------------------------------------------------------------------

interface DelegationResult {
  success: boolean;
  delegatedTo: string;
  taskId: string;
  response?: any;
  error?: string;
}

async function delegateToAgent(
  agent: DiscoveredAgent,
  query: string,
  context: Record<string, unknown>,
  requestedBy: string,
): Promise<DelegationResult> {
  const targetUrl = agent.hosting === 'container' ? agent.url : UEF_GATEWAY_URL;
  const taskId = uuidv4();

  try {
    const response = await fetch(`${targetUrl}/a2a/tasks/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(DELEGATION_TIMEOUT_MS),
      body: JSON.stringify({
        agentId: agent.id,
        message: {
          role: 'user',
          parts: [
            { type: 'text', text: query },
            ...(Object.keys(context).length > 0 ? [{ type: 'data', data: context }] : []),
          ],
        },
        requestedBy: `router-ang:${requestedBy}`,
        metadata: { routedBy: 'router-ang', originalTaskId: taskId },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        delegatedTo: agent.id,
        taskId,
        error: `Agent returned ${response.status}`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const task = data.task as Record<string, unknown> | undefined;
    return {
      success: true,
      delegatedTo: agent.id,
      taskId: (task?.id as string) || taskId,
      response: data,
    };
  } catch (err) {
    return {
      success: false,
      delegatedTo: agent.id,
      taskId,
      error: (err as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Main Routing Function
// ---------------------------------------------------------------------------

export interface RoutingResult {
  taskId: string;
  intent: ClassifiedIntent;
  delegatedTo: string;
  status: 'delegated' | 'fallback' | 'self-handled' | 'failed';
  result?: any;
  error?: string;
  routingLog: string[];
}

export async function routeTask(
  query: string,
  context: Record<string, unknown>,
  requestedBy: string,
): Promise<RoutingResult> {
  const taskId = uuidv4();
  const routingLog: string[] = [];

  // 1. Classify intent
  const intent = classifyIntent(query);
  routingLog.push(`Intent: ${intent.category} (confidence: ${(intent.confidence * 100).toFixed(0)}%, keywords: ${intent.keywords.join(', ')})`);

  // 2. Find best agent via discovery
  const capability = CATEGORY_TO_CAPABILITY[intent.category] || intent.category;
  const candidates = discoveryClient.findByCapability(capability);

  if (candidates.length === 0) {
    // Try keyword-based matching
    const keywordMatch = discoveryClient.findBestMatch(intent.keywords);
    if (keywordMatch) {
      candidates.push(keywordMatch);
    }
  }

  routingLog.push(`Candidates: ${candidates.map(a => `${a.id} (${a.hosting})`).join(', ') || 'none'}`);

  if (candidates.length === 0) {
    routingLog.push('No agents available — self-handling with degraded response');
    return {
      taskId,
      intent,
      delegatedTo: 'router-ang',
      status: 'self-handled',
      result: {
        summary: `No specialist agent available for ${intent.category}. Query received: "${query.slice(0, 100)}". ` +
          `Router_Ang will queue this for execution when agents come online.`,
        routingLog,
      },
      routingLog,
    };
  }

  // 3. Try delegation (with fallback)
  for (let i = 0; i < Math.min(candidates.length, 3); i++) {
    const candidate = candidates[i];
    routingLog.push(`Attempting delegation to ${candidate.id} (${candidate.url})`);

    const result = await delegateToAgent(candidate, query, context, requestedBy);

    if (result.success) {
      routingLog.push(`Delegated successfully to ${candidate.id} — task ${result.taskId}`);
      return {
        taskId: result.taskId,
        intent,
        delegatedTo: candidate.id,
        status: i === 0 ? 'delegated' : 'fallback',
        result: result.response,
        routingLog,
      };
    }

    routingLog.push(`Delegation to ${candidate.id} failed: ${result.error}`);
  }

  // All candidates failed
  routingLog.push('All delegation attempts failed');
  return {
    taskId,
    intent,
    delegatedTo: 'router-ang',
    status: 'failed',
    error: 'All candidate agents failed to accept the task',
    routingLog,
  };
}

/**
 * Get current routing statistics.
 */
export function getRoutingStats(): {
  onlineAgents: number;
  totalAgents: number;
  agentList: Array<{ id: string; status: string; hosting: string; latencyMs?: number }>;
} {
  const all = discoveryClient.getAll();
  const online = discoveryClient.getOnline();

  return {
    onlineAgents: online.length,
    totalAgents: all.length,
    agentList: all.map(a => ({
      id: a.id,
      status: a.status,
      hosting: a.hosting,
      latencyMs: a.latencyMs,
    })),
  };
}
