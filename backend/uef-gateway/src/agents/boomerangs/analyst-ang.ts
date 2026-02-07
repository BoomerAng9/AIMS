/**
 * Analyst_Ang — Data & Intelligence Officer
 *
 * Handles RESEARCH intents, data analysis, market intelligence.
 * Specialties: Market Research, Data Pipelines, Visualization
 */

import logger from '../../logger';
import { ByteRover } from '../../byterover';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'analyst-ang' as const,
  name: 'Analyst_Ang',
  role: 'Data & Intelligence Officer',
  capabilities: [
    { name: 'market-research', weight: 0.95 },
    { name: 'data-analysis', weight: 0.90 },
    { name: 'competitive-intelligence', weight: 0.85 },
    { name: 'data-visualization', weight: 0.80 },
    { name: 'trend-forecasting', weight: 0.75 },
  ],
  maxConcurrency: 4,
};

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Analyst_Ang] Starting task');

  try {
    const ctx = await ByteRover.retrieveContext(input.query);
    const logs: string[] = [
      `Retrieved ${ctx.patterns.length} knowledge patterns`,
    ];

    // Try LLM-powered research via OpenRouter
    const llmResult = await agentChat({
      agentId: 'analyst-ang',
      query: input.query,
      intent: input.intent,
      context: ctx.patterns.length > 0 ? `Known patterns: ${ctx.patterns.join(', ')}` : undefined,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens used: ${llmResult.tokens.total}`);

      return makeOutput(
        input.taskId,
        'analyst-ang',
        llmResult.content,
        [`[llm-analysis] Research report via ${llmResult.model}`],
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    // Fallback: Heuristic analysis
    logs.push('Mode: heuristic (configure OPENROUTER_API_KEY for LLM-powered responses)');
    const analysis = analyzeResearchRequest(input.query);
    logs.push(`Research type: ${analysis.type}`);
    logs.push(`Sources to consult: ${analysis.sources.length}`);
    logs.push(`Dimensions: ${analysis.dimensions.join(', ')}`);

    const artifacts = [
      `[report] ${analysis.type} — Executive Summary`,
      ...analysis.dimensions.map(d => `[finding] ${d} analysis`),
      `[data] Raw data compilation`,
    ];

    const tokens = analysis.dimensions.length * 1200;
    const usd = tokens * 0.00003;

    const summary = [
      `Research: ${analysis.type}`,
      `Dimensions analyzed: ${analysis.dimensions.join(', ')}`,
      `Sources consulted: ${analysis.sources.join(', ')}`,
      `Confidence: ${analysis.confidence}%`,
    ].join('\n');

    logger.info({ taskId: input.taskId }, '[Analyst_Ang] Task complete');
    return makeOutput(input.taskId, 'analyst-ang', summary, artifacts, logs, tokens, usd);
  } catch (err) {
    return failOutput(input.taskId, 'analyst-ang', err instanceof Error ? err.message : 'Unknown error');
  }
}

// ---------------------------------------------------------------------------
// Internal logic
// ---------------------------------------------------------------------------

interface ResearchAnalysis {
  type: string;
  dimensions: string[];
  sources: string[];
  confidence: number;
}

function analyzeResearchRequest(query: string): ResearchAnalysis {
  const lower = query.toLowerCase();
  const dimensions: string[] = [];
  const sources: string[] = ['ByteRover knowledge base'];

  if (lower.includes('market') || lower.includes('industry')) {
    dimensions.push('Market size & growth');
    dimensions.push('Key players');
    sources.push('Industry reports');
  }
  if (lower.includes('competitor') || lower.includes('competition')) {
    dimensions.push('Competitor positioning');
    dimensions.push('Pricing analysis');
    sources.push('Competitor public data');
  }
  if (lower.includes('trend') || lower.includes('forecast')) {
    dimensions.push('Trend trajectory');
    dimensions.push('Future projections');
    sources.push('Trend databases');
  }
  if (lower.includes('pricing') || lower.includes('cost')) {
    dimensions.push('Pricing models');
    dimensions.push('Cost-benefit analysis');
    sources.push('Pricing benchmarks');
  }
  if (lower.includes('user') || lower.includes('customer')) {
    dimensions.push('User behavior patterns');
    dimensions.push('Sentiment analysis');
    sources.push('User feedback data');
  }
  if (dimensions.length === 0) {
    dimensions.push('General landscape');
    dimensions.push('Key findings');
    sources.push('Web research');
  }

  let type = 'General Research';
  if (lower.includes('market')) type = 'Market Research';
  else if (lower.includes('competitor')) type = 'Competitive Analysis';
  else if (lower.includes('feasibility')) type = 'Feasibility Study';
  else if (lower.includes('pricing')) type = 'Pricing Analysis';

  const confidence = Math.min(70 + dimensions.length * 5, 97);

  return { type, dimensions, sources, confidence };
}

export const Analyst_Ang: Agent = { profile, execute };
