/**
 * A2A Agent Cards — Capability advertisements for each agent
 *
 * Each agent declares its skills, input/output modes, and hosting type.
 * The discovery service uses these cards for capability-based routing.
 */

import type { AgentCard } from './types';

const GATEWAY_URL = process.env.UEF_GATEWAY_INTERNAL_URL || 'http://uef-gateway:3001';

export const AGENT_CARDS: Record<string, AgentCard> = {
  'acheevy': {
    id: 'acheevy',
    name: 'ACHEEVY',
    description: 'Intent classification, agent delegation, and workflow orchestration. The conductor of the A.I.M.S. orchestra.',
    url: GATEWAY_URL,
    protocolVersion: '1.0',
    capabilities: [
      { id: 'intent-classification', name: 'Intent Classification', description: 'Classify user requests into ACP intents', weight: 1.0, tags: ['nlp', 'routing'] },
      { id: 'agent-delegation', name: 'Agent Delegation', description: 'Route tasks to the best available agent', weight: 0.9, tags: ['orchestration', 'dispatch'] },
      { id: 'workflow-orchestration', name: 'Workflow Orchestration', description: 'Coordinate multi-agent pipelines', weight: 0.9, tags: ['pipeline', 'workflow'] },
      { id: 'vertical-execution', name: 'Vertical Execution', description: 'NLP-triggered business builder verticals with R-R-S downstream pipeline execution, ORACLE gating, ByteRover RAG, and triple audit ledger', weight: 0.95, tags: ['vertical', 'business', 'revenue', 'rrs'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'data'],
    hosting: 'in-process',
    status: 'online',
  },

  'engineer-ang': {
    id: 'engineer-ang',
    name: 'Engineer_Ang',
    description: 'Full-stack builder. Code generation, architecture, infrastructure, database design.',
    url: GATEWAY_URL,
    protocolVersion: '1.0',
    capabilities: [
      { id: 'code-generation', name: 'Code Generation', description: 'Generate production-ready code in TypeScript, Python, React, Node.js', weight: 1.0, tags: ['typescript', 'react', 'nodejs', 'python'] },
      { id: 'architecture', name: 'Architecture Design', description: 'Design system architectures, API contracts, and data models', weight: 0.9, tags: ['design', 'api', 'database'] },
      { id: 'deployment', name: 'Deployment Planning', description: 'Docker, CI/CD, cloud infrastructure setup', weight: 0.7, tags: ['docker', 'cicd', 'cloud', 'deploy'] },
      { id: 'database-design', name: 'Database Design', description: 'Schema design, migrations, query optimization', weight: 0.8, tags: ['postgresql', 'prisma', 'sql'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'code' as 'text', 'file'],
    hosting: 'in-process',
    status: 'online',
  },

  'marketer-ang': {
    id: 'marketer-ang',
    name: 'Marketer_Ang',
    description: 'Marketing and content specialist. SEO, copywriting, campaign strategy.',
    url: GATEWAY_URL,
    protocolVersion: '1.0',
    capabilities: [
      { id: 'seo', name: 'SEO Optimization', description: 'Search engine optimization, keyword research, meta tags', weight: 0.9, tags: ['seo', 'keywords', 'meta'] },
      { id: 'copywriting', name: 'Copywriting', description: 'Marketing copy, landing pages, email sequences', weight: 1.0, tags: ['copy', 'content', 'email'] },
      { id: 'campaign-strategy', name: 'Campaign Strategy', description: 'Marketing campaign planning, audience targeting', weight: 0.8, tags: ['campaign', 'audience', 'strategy'] },
      { id: 'content-creation', name: 'Content Creation', description: 'Blog posts, social media, video scripts', weight: 0.9, tags: ['blog', 'social', 'video'] },
    ],
    inputModes: ['text'],
    outputModes: ['text'],
    hosting: 'in-process',
    status: 'online',
  },

  'analyst-ang': {
    id: 'analyst-ang',
    name: 'Analyst_Ang',
    description: 'Research and data analysis. Market research, competitive analysis, data interpretation.',
    url: GATEWAY_URL,
    protocolVersion: '1.0',
    capabilities: [
      { id: 'market-research', name: 'Market Research', description: 'Industry analysis, market sizing, opportunity identification', weight: 1.0, tags: ['market', 'research', 'industry'] },
      { id: 'competitive-analysis', name: 'Competitive Analysis', description: 'Competitor profiling, SWOT analysis, feature comparison', weight: 0.9, tags: ['competitive', 'swot', 'comparison'] },
      { id: 'data-interpretation', name: 'Data Interpretation', description: 'Data analysis, trend identification, insight extraction', weight: 0.8, tags: ['data', 'analysis', 'trends'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'data'],
    hosting: 'in-process',
    status: 'online',
  },

  'quality-ang': {
    id: 'quality-ang',
    name: 'Quality_Ang',
    description: 'Verification and testing. Security audits, code review, compliance checks.',
    url: GATEWAY_URL,
    protocolVersion: '1.0',
    capabilities: [
      { id: 'security-audit', name: 'Security Audit', description: 'Vulnerability scanning, OWASP checks, dependency review', weight: 1.0, tags: ['security', 'owasp', 'vulnerability'] },
      { id: 'code-review', name: 'Code Review', description: 'Code quality analysis, pattern compliance, best practices', weight: 0.9, tags: ['review', 'quality', 'patterns'] },
      { id: 'compliance-check', name: 'Compliance Check', description: 'Regulatory compliance, data protection, accessibility', weight: 0.7, tags: ['compliance', 'gdpr', 'a11y'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'data'],
    hosting: 'in-process',
    status: 'online',
  },

  'chicken-hawk': {
    id: 'chicken-hawk',
    name: 'Chicken Hawk',
    description: 'Pipeline orchestrator. Step sequencing, cost tracking, multi-agent execution.',
    url: GATEWAY_URL,
    protocolVersion: '1.0',
    capabilities: [
      { id: 'pipeline-execution', name: 'Pipeline Execution', description: 'Execute multi-step build pipelines', weight: 1.0, tags: ['pipeline', 'build', 'execution'] },
      { id: 'step-sequencing', name: 'Step Sequencing', description: 'Order and dependency management for execution steps', weight: 0.9, tags: ['sequence', 'dependency', 'order'] },
      { id: 'cost-tracking', name: 'Cost Tracking', description: 'Track execution cost across pipeline stages', weight: 0.7, tags: ['cost', 'billing', 'luc'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'data'],
    hosting: 'in-process',
    status: 'online',
  },

  // ── Containerized Agents (Tier 1) ─────────────────────────────────────────
  // These cards are registered at discovery time but defined here for
  // the /a2a/agents endpoint to show all known agents even before
  // containers come online. Status is updated dynamically.

  'research-ang': {
    id: 'research-ang',
    name: 'Research_Ang',
    description: 'Deep research and data analysis specialist. Market research, competitive intelligence, trend analysis, strategic insights.',
    url: process.env.RESEARCH_ANG_URL || 'http://research-ang:3020',
    protocolVersion: '1.0',
    capabilities: [
      { id: 'market-research', name: 'Market Research', description: 'Industry analysis, market sizing, TAM/SAM/SOM, opportunity identification', weight: 1.0, tags: ['market', 'research', 'industry', 'tam', 'sam'] },
      { id: 'competitive-analysis', name: 'Competitive Analysis', description: 'Competitor profiling, SWOT analysis, feature comparison, market positioning', weight: 0.95, tags: ['competitive', 'swot', 'comparison', 'positioning'] },
      { id: 'data-interpretation', name: 'Data Interpretation', description: 'Statistical analysis, trend identification, KPI frameworks', weight: 0.85, tags: ['data', 'analysis', 'trends', 'kpi', 'statistics'] },
      { id: 'strategic-insights', name: 'Strategic Insights', description: 'Go-to-market strategy, growth frameworks, risk analysis', weight: 0.90, tags: ['strategy', 'gtm', 'growth', 'risk', 'investment'] },
      { id: 'customer-research', name: 'Customer Research', description: 'Persona development, customer journey mapping, pain point analysis', weight: 0.85, tags: ['customer', 'persona', 'journey', 'icp', 'pain-points'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'data'],
    authentication: { type: 'none' },
    hosting: 'container',
    status: 'offline',  // Updated to 'online' when container is discovered
  },

  'router-ang': {
    id: 'router-ang',
    name: 'Router_Ang',
    description: 'Smart routing agent. Discovers available agents via A2A, classifies intent, and delegates tasks to the best-matched specialist.',
    url: process.env.ROUTER_ANG_URL || 'http://router-ang:3021',
    protocolVersion: '1.0',
    capabilities: [
      { id: 'intent-routing', name: 'Intent Routing', description: 'Classify user intent and route to the most capable agent', weight: 1.0, tags: ['routing', 'intent', 'classification', 'dispatch'] },
      { id: 'agent-discovery', name: 'Agent Discovery', description: 'Discover and health-check available agents across the A2A network', weight: 0.95, tags: ['discovery', 'a2a', 'health', 'registry'] },
      { id: 'load-balancing', name: 'Load Balancing', description: 'Distribute tasks across agents based on capability weight and availability', weight: 0.85, tags: ['load-balancing', 'availability', 'capacity'] },
      { id: 'fallback-orchestration', name: 'Fallback Orchestration', description: 'Retry failed tasks with alternative agents or decompose complex tasks', weight: 0.80, tags: ['fallback', 'retry', 'decompose', 'resilience'] },
    ],
    inputModes: ['text', 'data'],
    outputModes: ['text', 'data'],
    authentication: { type: 'none' },
    hosting: 'container',
    status: 'offline',  // Updated to 'online' when container is discovered
  },
};

/**
 * Get the card for a specific agent.
 */
export function getAgentCard(agentId: string): AgentCard | undefined {
  return AGENT_CARDS[agentId];
}

/**
 * Get all registered agent cards.
 */
export function getAllAgentCards(): AgentCard[] {
  return Object.values(AGENT_CARDS);
}

/**
 * Find agents by capability ID or tag.
 * Returns cards sorted by capability weight (highest first).
 */
export function findAgentsByCapability(capabilityOrTag: string): AgentCard[] {
  const matches: Array<{ card: AgentCard; weight: number }> = [];

  for (const card of Object.values(AGENT_CARDS)) {
    if (card.status !== 'online') continue;

    for (const cap of card.capabilities) {
      if (cap.id === capabilityOrTag || cap.tags.includes(capabilityOrTag)) {
        matches.push({ card, weight: cap.weight });
        break; // Only match once per card
      }
    }
  }

  return matches
    .sort((a, b) => b.weight - a.weight)
    .map(m => m.card);
}
