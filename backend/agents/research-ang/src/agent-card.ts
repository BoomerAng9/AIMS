/**
 * Research_Ang Agent Card — A2A Capability Advertisement
 *
 * Declares this agent's skills, input/output modes, and hosting type.
 * Served at /.well-known/agent.json and registered with the UEF Gateway.
 */

export interface AgentCard {
  id: string;
  name: string;
  description: string;
  url: string;
  protocolVersion: '1.0';
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    tags: string[];
  }>;
  inputModes: Array<'text' | 'file' | 'data'>;
  outputModes: Array<'text' | 'file' | 'data'>;
  authentication?: {
    type: 'none' | 'api-key' | 'bearer';
    headerName?: string;
  };
  hosting: 'in-process' | 'container' | 'external';
  status: 'online' | 'offline' | 'degraded';
}

const SELF_URL = process.env.AGENT_URL || 'http://research-ang:3020';

export const agentCard: AgentCard = {
  id: 'research-ang',
  name: 'Research_Ang',
  description: 'Deep research and data analysis specialist. Market research, competitive intelligence, trend analysis, and strategic insights.',
  url: SELF_URL,
  protocolVersion: '1.0',
  capabilities: [
    {
      id: 'market-research',
      name: 'Market Research',
      description: 'Industry analysis, market sizing, TAM/SAM/SOM, opportunity identification',
      weight: 1.0,
      tags: ['market', 'research', 'industry', 'tam', 'sam'],
    },
    {
      id: 'competitive-analysis',
      name: 'Competitive Analysis',
      description: 'Competitor profiling, SWOT analysis, feature comparison, market positioning',
      weight: 0.95,
      tags: ['competitive', 'swot', 'comparison', 'positioning'],
    },
    {
      id: 'data-interpretation',
      name: 'Data Interpretation',
      description: 'Statistical analysis, trend identification, KPI frameworks, data storytelling',
      weight: 0.85,
      tags: ['data', 'analysis', 'trends', 'kpi', 'statistics'],
    },
    {
      id: 'strategic-insights',
      name: 'Strategic Insights',
      description: 'Go-to-market strategy, growth frameworks, investment thesis, risk analysis',
      weight: 0.90,
      tags: ['strategy', 'gtm', 'growth', 'risk', 'investment'],
    },
    {
      id: 'customer-research',
      name: 'Customer Research',
      description: 'Persona development, customer journey mapping, pain point analysis, ICP definition',
      weight: 0.85,
      tags: ['customer', 'persona', 'journey', 'icp', 'pain-points'],
    },
  ],
  inputModes: ['text', 'data'],
  outputModes: ['text', 'data'],
  authentication: {
    type: 'none',
  },
  hosting: 'container',
  status: 'online',
};
