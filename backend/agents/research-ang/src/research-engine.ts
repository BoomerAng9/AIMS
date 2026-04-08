/**
 * Research_Ang — Core Research Engine
 *
 * Executes research tasks using the unified LLM gateway (via UEF Gateway proxy).
 * When the LLM gateway is unavailable, falls back to heuristic analysis.
 *
 * Research capabilities:
 *   - Market sizing (TAM/SAM/SOM)
 *   - Competitive intelligence
 *   - Trend analysis
 *   - Customer persona development
 *   - Strategic recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import { taskStore, TaskState, TaskArtifact } from './task-store';
import { logger } from './logger';

// UEF Gateway URL for LLM calls (unified gateway proxy)
const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || 'http://uef-gateway:3001';

// ---------------------------------------------------------------------------
// LLM Integration (calls UEF Gateway's unified LLM gateway)
// ---------------------------------------------------------------------------

interface LLMResponse {
  content: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
  cost: { usd: number };
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<LLMResponse | null> {
  try {
    const response = await fetch(`${UEF_GATEWAY_URL}/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.6,
        agentId: 'research-ang',
      }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, '[Research_Ang] LLM gateway returned non-OK');
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const result = data.result as Record<string, unknown> | undefined;
    return {
      content: (data.content as string) || (result?.content as string) || '',
      model: (data.model as string) || 'unknown',
      tokens: (data.tokens as { prompt: number; completion: number; total: number }) || { prompt: 0, completion: 0, total: 0 },
      cost: (data.cost as { usd: number }) || { usd: 0 },
    };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, '[Research_Ang] LLM gateway unreachable — using heuristic');
    return null;
  }
}

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

const RESEARCH_SYSTEM_PROMPT = `You are Research_Ang (Analyst_Ang), a specialist research agent in the A.I.M.S. platform.

Your role is to provide deep, actionable research and analysis. You are methodical, data-driven, and precise.

When analyzing:
1. Always structure findings with clear sections
2. Use quantitative data points where possible (market sizes, growth rates, percentages)
3. Identify risks and opportunities with supporting evidence
4. Provide actionable recommendations with specific next steps
5. Reference established frameworks: SWOT, Porter's Five Forces, TAM/SAM/SOM, PESTEL, etc.

Output Format:
- Use markdown headers and bullet points
- Include a TL;DR at the top
- End with 3-5 specific action items
- Flag confidence levels: [HIGH] [MEDIUM] [LOW] based on data quality`;

// ---------------------------------------------------------------------------
// Research Task Types and Routing
// ---------------------------------------------------------------------------

type ResearchType =
  | 'market-research'
  | 'competitive-analysis'
  | 'trend-analysis'
  | 'customer-research'
  | 'strategic-analysis'
  | 'general-research';

function classifyResearchType(query: string): ResearchType {
  const lower = query.toLowerCase();

  if (lower.includes('competitor') || lower.includes('competing') || lower.includes('vs ') || lower.includes('versus') || lower.includes('swot')) {
    return 'competitive-analysis';
  }
  if (lower.includes('market size') || lower.includes('tam') || lower.includes('sam') || lower.includes('market opportunity') || lower.includes('market research')) {
    return 'market-research';
  }
  if (lower.includes('trend') || lower.includes('emerging') || lower.includes('future of') || lower.includes('forecast')) {
    return 'trend-analysis';
  }
  if (lower.includes('customer') || lower.includes('persona') || lower.includes('target audience') || lower.includes('buyer') || lower.includes('icp')) {
    return 'customer-research';
  }
  if (lower.includes('strategy') || lower.includes('go-to-market') || lower.includes('gtm') || lower.includes('growth plan')) {
    return 'strategic-analysis';
  }
  return 'general-research';
}

function getResearchPrompt(type: ResearchType, query: string, context: Record<string, unknown>): string {
  const contextStr = Object.keys(context).length > 0 ? `\nAdditional context:\n${JSON.stringify(context, null, 2)}` : '';

  switch (type) {
    case 'market-research':
      return `Conduct a comprehensive market research analysis for the following query:

"${query}"
${contextStr}

Structure your analysis:
1. **Market Overview** — Industry definition, current state
2. **Market Sizing** — TAM, SAM, SOM estimates with methodology
3. **Growth Drivers** — Key factors driving market growth
4. **Barriers to Entry** — Challenges for new entrants
5. **Key Players** — Major incumbents and their market share
6. **Opportunities** — Underserved segments, emerging niches
7. **Risks** — Regulatory, technological, competitive threats
8. **Recommendations** — Specific actionable next steps`;

    case 'competitive-analysis':
      return `Perform a detailed competitive analysis for the following query:

"${query}"
${contextStr}

Structure your analysis:
1. **Competitive Landscape** — Direct and indirect competitors
2. **Feature Comparison** — Key differentiators across players
3. **Pricing Analysis** — Pricing models and tiers
4. **SWOT Analysis** — Strengths, Weaknesses, Opportunities, Threats
5. **Market Positioning** — How each player positions themselves
6. **Gaps & Opportunities** — Underserved areas in the market
7. **Strategic Recommendations** — How to differentiate and win`;

    case 'trend-analysis':
      return `Analyze current and emerging trends related to:

"${query}"
${contextStr}

Structure your analysis:
1. **Current State** — Where the industry/technology stands today
2. **Emerging Trends** — Top 5-7 trends with evidence
3. **Adoption Curve** — Where each trend sits (early/growth/mature/decline)
4. **Impact Assessment** — Business impact per trend (1-10 scale)
5. **Timeline** — Expected timeline for mainstream adoption
6. **Opportunities** — How to capitalize on each trend
7. **Risks** — Threats posed by these trends`;

    case 'customer-research':
      return `Develop a comprehensive customer research analysis for:

"${query}"
${contextStr}

Structure your analysis:
1. **Target Segments** — Primary and secondary customer segments
2. **Persona Profiles** — Detailed buyer personas (demographics, psychographics, behaviors)
3. **Pain Points** — Top 5 pain points per segment, ranked by severity
4. **Jobs-to-Be-Done** — What customers are trying to accomplish
5. **Current Solutions** — What they use today and why it falls short
6. **Decision Criteria** — How they evaluate and choose solutions
7. **Customer Journey** — Awareness → Consideration → Decision → Adoption → Retention
8. **Acquisition Channels** — Where to reach each persona`;

    case 'strategic-analysis':
      return `Provide a strategic analysis and recommendations for:

"${query}"
${contextStr}

Structure your analysis:
1. **Situation Assessment** — Current position and capabilities
2. **Strategic Options** — 3-4 viable strategic paths
3. **Porter's Five Forces** — Competitive dynamics assessment
4. **Go-to-Market Strategy** — Recommended GTM approach
5. **Resource Requirements** — What it takes to execute
6. **Success Metrics** — KPIs to track
7. **Risk Mitigation** — Key risks and countermeasures
8. **90-Day Action Plan** — Specific steps for the next quarter`;

    default:
      return `Research and analyze the following topic in depth:

"${query}"
${contextStr}

Provide:
1. **Overview** — Context and background
2. **Key Findings** — 5-7 major insights
3. **Data Points** — Relevant statistics and metrics
4. **Analysis** — Interpretation of findings
5. **Implications** — What this means for decision-making
6. **Recommendations** — 3-5 actionable next steps`;
  }
}

// ---------------------------------------------------------------------------
// Heuristic Fallback (when LLM gateway unavailable)
// ---------------------------------------------------------------------------

function heuristicResearch(type: ResearchType, query: string): {
  summary: string;
  artifacts: string[];
  tokens: number;
} {
  const frameworks: Record<ResearchType, string[]> = {
    'market-research': ['TAM/SAM/SOM Analysis', 'Porter\'s Five Forces', 'PESTEL Framework', 'Market Growth Drivers'],
    'competitive-analysis': ['SWOT Matrix', 'Feature Comparison Grid', 'Pricing Tier Analysis', 'Positioning Map'],
    'trend-analysis': ['Technology Adoption Curve', 'Trend Impact Matrix', 'Hype Cycle Mapping', 'Scenario Planning'],
    'customer-research': ['Persona Template', 'Journey Map Framework', 'Jobs-to-Be-Done Canvas', 'Pain Point Severity Matrix'],
    'strategic-analysis': ['Strategy Canvas', 'Growth Framework', 'GTM Playbook Template', '90-Day Action Plan'],
    'general-research': ['Research Brief', 'Key Findings Summary', 'Data Analysis Template', 'Recommendation Framework'],
  };

  const relevantFrameworks = frameworks[type] || frameworks['general-research'];
  const wordCount = query.split(/\s+/).length;
  const complexity = Math.min(Math.max(wordCount * 3 + relevantFrameworks.length * 10, 20), 100);

  const summary = [
    `Research Type: ${type}`,
    `Query Analysis: "${query.slice(0, 150)}"`,
    `Complexity Score: ${complexity}/100`,
    `Applicable Frameworks: ${relevantFrameworks.join(', ')}`,
    '',
    'Note: Full LLM-powered analysis available when UEF Gateway LLM endpoint is configured.',
    'This heuristic response provides framework recommendations and estimated complexity.',
  ].join('\n');

  const artifacts = relevantFrameworks.map(f => `[framework] ${f} — recommended for this ${type} task`);

  return { summary, artifacts, tokens: complexity * 100 };
}

// ---------------------------------------------------------------------------
// Main Execution
// ---------------------------------------------------------------------------

export async function executeResearchTask(task: TaskState): Promise<void> {
  taskStore.updateStatus(task.id, 'working');
  taskStore.emit(task.id, { type: 'status', status: 'working' });

  const type = classifyResearchType(task.query);
  logger.info({ taskId: task.id, type }, '[Research_Ang] Classified research type');

  taskStore.emit(task.id, {
    type: 'progress',
    progress: { percent: 10, message: `Classified as ${type} — starting analysis` },
  });

  // Try LLM-powered research
  const prompt = getResearchPrompt(type, task.query, task.context);
  const llmResult = await callLLM(RESEARCH_SYSTEM_PROMPT, prompt);

  let summary: string;
  let artifacts: TaskArtifact[];
  let tokens: number;
  let usd: number;

  if (llmResult) {
    // LLM-powered analysis
    taskStore.emit(task.id, {
      type: 'progress',
      progress: { percent: 70, message: `LLM analysis complete via ${llmResult.model}` },
    });

    summary = llmResult.content;
    tokens = llmResult.tokens.total;
    usd = llmResult.cost.usd;

    artifacts = [
      {
        id: uuidv4(),
        name: `${type}-analysis`,
        type: 'text',
        content: llmResult.content,
        metadata: { model: llmResult.model, researchType: type },
      },
    ];
  } else {
    // Heuristic fallback
    taskStore.emit(task.id, {
      type: 'progress',
      progress: { percent: 70, message: 'Heuristic analysis complete (LLM gateway unavailable)' },
    });

    const heuristic = heuristicResearch(type, task.query);
    summary = heuristic.summary;
    tokens = heuristic.tokens;
    usd = tokens * 0.00003;

    artifacts = heuristic.artifacts.map(a => ({
      id: uuidv4(),
      name: a,
      type: 'text' as const,
      content: a,
    }));
  }

  // Record results
  for (const artifact of artifacts) {
    taskStore.addArtifact(task.id, artifact);
    taskStore.emit(task.id, { type: 'artifact', artifact });
  }

  taskStore.addMessage(task.id, {
    role: 'agent',
    parts: [{ type: 'text', text: summary }],
    timestamp: new Date().toISOString(),
  });

  taskStore.setCost(task.id, tokens, usd);
  taskStore.emit(task.id, { type: 'cost', cost: { tokens, usd } });

  taskStore.emit(task.id, {
    type: 'progress',
    progress: { percent: 100, message: 'Research complete' },
  });

  taskStore.updateStatus(task.id, 'completed');
  taskStore.emit(task.id, { type: 'status', status: 'completed' });
  taskStore.emit(task.id, { type: 'done' });

  logger.info({ taskId: task.id, type, tokens, usd }, '[Research_Ang] Task completed');
}
