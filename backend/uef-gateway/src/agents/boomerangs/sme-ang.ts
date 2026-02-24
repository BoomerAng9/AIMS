/**
 * SME_Ang — Subject Matter Expert / MCP Integration Specialist
 *
 * Handles MCP_DISPATCH intents — routes requests to the correct MCP connection
 * (Boost.space Remote, Boost.space Integrator, 21st.dev Magic, and all other
 * configured MCP services). Ingests skill documentation for every MCP tool
 * and provides expert guidance on capabilities, parameters, and best practices.
 *
 * Specialties: MCP Routing, Integration Knowledge, Tool Dispatch, Skill Ingestion
 */

import logger from '../../logger';
import { ByteRover } from '../../byterover';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'sme-ang' as const,
  name: 'SME_Ang',
  role: 'Subject Matter Expert — MCP Integration Specialist',
  capabilities: [
    { name: 'mcp-dispatch', weight: 0.98 },
    { name: 'integration-knowledge', weight: 0.95 },
    { name: 'tool-routing', weight: 0.92 },
    { name: 'skill-ingestion', weight: 0.90 },
    { name: 'data-query', weight: 0.85 },
    { name: 'workflow-trigger', weight: 0.85 },
    { name: 'ui-component-generation', weight: 0.80 },
    { name: 'credential-management', weight: 0.75 },
  ],
  maxConcurrency: 6,
};

// ---------------------------------------------------------------------------
// MCP Tool Registry — all known MCP connections and their capabilities
// ---------------------------------------------------------------------------

interface MCPTool {
  id: string;
  name: string;
  category: string;
  triggers: string[];
  skillFile: string;
  toolFile: string;
}

const MCP_TOOLS: MCPTool[] = [
  {
    id: 'boost-space-remote',
    name: 'Boost.space Remote MCP',
    category: 'data-automation',
    triggers: ['boost space', 'boostspace', 'business data', 'data sync', 'crm', 'connected apps', 'single source of truth'],
    skillFile: 'aims-skills/skills/integrations/boost-space-automation.skill.md',
    toolFile: 'aims-skills/tools/boost-space-remote.tool.md',
  },
  {
    id: 'boost-space-integrator',
    name: 'Boost.space Integrator MCP',
    category: 'workflow-automation',
    triggers: ['deploy apps', 'deployapps', 'integrator', 'trigger scenario', 'run scenario', 'automation scenario', 'workflow trigger'],
    skillFile: 'aims-skills/skills/integrations/boost-space-deployapps.skill.md',
    toolFile: 'aims-skills/tools/boost-space-integrator.tool.md',
  },
  {
    id: '21st-dev-magic',
    name: '21st.dev Magic MCP',
    category: 'ui-generation',
    triggers: ['21st', '21st.dev', 'magic component', 'magic ui', '/ui', 'generate component', 'ui component', 'logo search'],
    skillFile: 'aims-skills/skills/integrations/magic-ui-components.skill.md',
    toolFile: 'aims-skills/tools/21st-dev-magic.tool.md',
  },
  {
    id: 'brave-search',
    name: 'Brave Search Pro AI',
    category: 'search',
    triggers: ['search', 'web search', 'find online', 'look up', 'research'],
    skillFile: 'aims-skills/skills/brave-search.skill.md',
    toolFile: 'aims-skills/tools/brave-search.tool.md',
  },
];

// ---------------------------------------------------------------------------
// MCP Routing Logic
// ---------------------------------------------------------------------------

function matchMCPTool(query: string): MCPTool | null {
  const lower = query.toLowerCase();
  let bestMatch: MCPTool | null = null;
  let bestScore = 0;

  for (const tool of MCP_TOOLS) {
    let score = 0;
    for (const trigger of tool.triggers) {
      if (lower.includes(trigger)) {
        score += trigger.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tool;
    }
  }

  return bestMatch;
}

function classifyMCPIntent(query: string): {
  action: string;
  tool: MCPTool | null;
  confidence: number;
} {
  const lower = query.toLowerCase();
  const tool = matchMCPTool(query);

  let action = 'general-query';
  if (lower.includes('trigger') || lower.includes('run') || lower.includes('execute')) {
    action = 'workflow-trigger';
  } else if (lower.includes('generate') || lower.includes('create') || lower.includes('build') || lower.includes('/ui')) {
    action = 'ui-generation';
  } else if (lower.includes('query') || lower.includes('show me') || lower.includes('get') || lower.includes('find')) {
    action = 'data-query';
  } else if (lower.includes('sync') || lower.includes('connect') || lower.includes('integrate')) {
    action = 'data-sync';
  } else if (lower.includes('search') || lower.includes('look up') || lower.includes('research')) {
    action = 'web-search';
  }

  const confidence = tool ? Math.min(70 + (tool.triggers.filter(t => lower.includes(t)).length * 10), 98) : 40;

  return { action, tool, confidence };
}

// ---------------------------------------------------------------------------
// Agent execution
// ---------------------------------------------------------------------------

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[SME_Ang] Starting MCP dispatch task');

  try {
    const ctx = await ByteRover.retrieveContext(input.query);
    const { action, tool, confidence } = classifyMCPIntent(input.query);
    const logs: string[] = [
      `Retrieved ${ctx.patterns.length} knowledge patterns`,
      `MCP action: ${action}`,
      `Matched tool: ${tool?.name ?? 'none'}`,
      `Confidence: ${confidence}%`,
    ];

    // Try LLM-powered dispatch via OpenRouter
    const systemContext = tool
      ? `You are SME_Ang, the Subject Matter Expert for MCP integrations in A.I.M.S.
         The matched MCP tool is: ${tool.name} (${tool.category}).
         Skill file: ${tool.skillFile}
         Tool file: ${tool.toolFile}
         Action type: ${action}
         Known patterns: ${ctx.patterns.join(', ') || 'none'}`
      : `You are SME_Ang, the Subject Matter Expert for MCP integrations in A.I.M.S.
         No specific MCP tool matched. Available tools: ${MCP_TOOLS.map(t => t.name).join(', ')}.
         Help the user identify which MCP tool they need.`;

    const llmResult = await agentChat({
      agentId: 'sme-ang',
      query: input.query,
      intent: input.intent,
      context: systemContext,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens used: ${llmResult.tokens.total}`);

      const artifacts = [
        `[mcp-dispatch] Routed to ${tool?.name ?? 'general'} via ${action}`,
        ...(tool ? [`[skill] ${tool.skillFile}`, `[tool] ${tool.toolFile}`] : []),
      ];

      return makeOutput(
        input.taskId,
        'sme-ang',
        llmResult.content,
        artifacts,
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    // Fallback: Heuristic dispatch
    logs.push('Mode: heuristic (configure OPENROUTER_API_KEY for LLM-powered dispatch)');

    const artifacts: string[] = [];
    let summary: string;

    if (tool) {
      summary = [
        `MCP Dispatch: ${tool.name}`,
        `Category: ${tool.category}`,
        `Action: ${action}`,
        `Confidence: ${confidence}%`,
        `Skill: ${tool.skillFile}`,
        `Tool Reference: ${tool.toolFile}`,
        '',
        `Recommendation: Route this request through ${tool.name} for ${action}.`,
      ].join('\n');

      artifacts.push(`[dispatch] → ${tool.name} (${tool.category})`);
      artifacts.push(`[skill] ${tool.skillFile}`);
      artifacts.push(`[tool] ${tool.toolFile}`);
    } else {
      summary = [
        `MCP Dispatch: No specific tool matched`,
        `Available MCP Tools:`,
        ...MCP_TOOLS.map(t => `  - ${t.name} (${t.category}): ${t.triggers.slice(0, 3).join(', ')}`),
        '',
        'Recommendation: Clarify the request to match a specific MCP integration.',
      ].join('\n');

      artifacts.push('[dispatch] → no match — routing to general');
    }

    const tokens = summary.length * 2;
    const usd = tokens * 0.00003;

    logger.info({ taskId: input.taskId, tool: tool?.id }, '[SME_Ang] Dispatch complete');
    return makeOutput(input.taskId, 'sme-ang', summary, artifacts, logs, tokens, usd);
  } catch (err) {
    return failOutput(input.taskId, 'sme-ang', err instanceof Error ? err.message : 'Unknown error');
  }
}

export const SME_Ang: Agent = { profile, execute };
