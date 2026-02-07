/**
 * Marketer_Ang — Growth & Content Strategist
 *
 * Handles content creation, SEO, campaign strategy, copywriting.
 * Specialties: SEO Audits, Copy Generation, Campaign Flows
 */

import logger from '../../logger';
import { ByteRover } from '../../byterover';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'marketer-ang' as const,
  name: 'Marketer_Ang',
  role: 'Growth & Content Strategist',
  capabilities: [
    { name: 'seo-audit', weight: 0.90 },
    { name: 'copywriting', weight: 0.95 },
    { name: 'campaign-design', weight: 0.85 },
    { name: 'content-strategy', weight: 0.90 },
    { name: 'email-sequences', weight: 0.80 },
  ],
  maxConcurrency: 5,
};

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Marketer_Ang] Starting task');

  try {
    const ctx = await ByteRover.retrieveContext(input.query);
    const logs: string[] = [
      `Retrieved ${ctx.patterns.length} brand patterns`,
    ];

    // Try LLM-powered analysis via OpenRouter
    const llmResult = await agentChat({
      agentId: 'marketer-ang',
      query: input.query,
      intent: input.intent,
      context: ctx.patterns.length > 0 ? `Brand patterns: ${ctx.patterns.join(', ')}` : undefined,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens used: ${llmResult.tokens.total}`);

      return makeOutput(
        input.taskId,
        'marketer-ang',
        llmResult.content,
        [`[llm-analysis] Marketing strategy via ${llmResult.model}`],
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    // Fallback: Heuristic analysis
    logs.push('Mode: heuristic (configure OPENROUTER_API_KEY for LLM-powered responses)');
    const analysis = analyzeMarketingRequest(input.query);
    logs.push(`Type: ${analysis.type}, deliverables: ${analysis.deliverables.length}`);

    const artifacts = analysis.deliverables.map(d => `[deliverable] ${d}`);

    const tokens = analysis.deliverables.length * 800;
    const usd = tokens * 0.00003;

    const summary = [
      `Marketing task: ${analysis.type}`,
      `Deliverables: ${analysis.deliverables.join(', ')}`,
      `Tone: ${analysis.tone}`,
      `Target: ${analysis.audience}`,
    ].join('\n');

    logger.info({ taskId: input.taskId }, '[Marketer_Ang] Task complete');
    return makeOutput(input.taskId, 'marketer-ang', summary, artifacts, logs, tokens, usd);
  } catch (err) {
    return failOutput(input.taskId, 'marketer-ang', err instanceof Error ? err.message : 'Unknown error');
  }
}

// ---------------------------------------------------------------------------
// Internal logic
// ---------------------------------------------------------------------------

interface MarketingAnalysis {
  type: string;
  deliverables: string[];
  tone: string;
  audience: string;
}

function analyzeMarketingRequest(query: string): MarketingAnalysis {
  const lower = query.toLowerCase();
  const deliverables: string[] = [];

  if (lower.includes('landing') || lower.includes('page')) {
    deliverables.push('Landing page copy');
    deliverables.push('Hero headline variants (x3)');
    deliverables.push('CTA button text options');
  }
  if (lower.includes('email') || lower.includes('outreach') || lower.includes('sequence')) {
    deliverables.push('Email sequence (5 emails)');
    deliverables.push('Subject line variants');
  }
  if (lower.includes('seo') || lower.includes('search')) {
    deliverables.push('SEO keyword analysis');
    deliverables.push('Meta descriptions');
    deliverables.push('Content outline');
  }
  if (lower.includes('campaign') || lower.includes('ad')) {
    deliverables.push('Campaign strategy brief');
    deliverables.push('Ad copy variants');
    deliverables.push('Audience targeting criteria');
  }
  if (lower.includes('social') || lower.includes('post')) {
    deliverables.push('Social media post calendar');
    deliverables.push('Post copy (x10)');
  }
  if (deliverables.length === 0) {
    deliverables.push('Content strategy brief');
    deliverables.push('Copy draft');
  }

  const tone = lower.includes('formal') ? 'Professional' :
               lower.includes('casual') ? 'Conversational' :
               lower.includes('urgent') ? 'Urgency-driven' : 'Balanced professional';

  const audience = lower.includes('b2b') ? 'B2B decision-makers' :
                   lower.includes('b2c') ? 'Consumer audience' :
                   lower.includes('developer') ? 'Technical audience' : 'General business';

  let type = 'Content Strategy';
  if (lower.includes('launch')) type = 'Product Launch Campaign';
  else if (lower.includes('outreach')) type = 'Outreach Sequence';
  else if (lower.includes('seo')) type = 'SEO Optimization';
  else if (lower.includes('brand')) type = 'Brand Messaging';

  return { type, deliverables, tone, audience };
}

export const Marketer_Ang: Agent = { profile, execute };
