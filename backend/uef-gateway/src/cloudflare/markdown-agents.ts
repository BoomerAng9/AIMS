/**
 * Markdown for Agents — Machine-Readable Content Layer
 *
 * Implements Cloudflare's approach to agent-readable content:
 *   1. Accept header detection — serve markdown when agent requests it
 *   2. LLM.txt — machine-readable site map for AI navigation
 *   3. AI Index — opt-in search discoverability for agents
 *   4. X-Markdown-Tokens header for context window management
 *
 * This makes AIMS content natively accessible to external AI agents,
 * which is critical for the agent-to-agent economy.
 */

import { Request, Response, NextFunction } from 'express';
import { plugCatalog } from '../plug-catalog/catalog';
import { getAllAgentCards } from '../a2a/agent-cards';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Middleware: Detect agent requests and serve markdown
// ---------------------------------------------------------------------------

/**
 * Express middleware that detects AI agent requests via Accept header
 * and injects markdown content + X-Markdown-Tokens header.
 *
 * Agents send: Accept: text/markdown or Accept: application/json+markdown
 * We respond with markdown instead of HTML.
 */
export function markdownForAgents(req: Request, res: Response, next: NextFunction): void {
  const accept = req.headers.accept || '';
  const isAgentRequest = accept.includes('text/markdown') ||
    accept.includes('application/json+markdown') ||
    req.headers['x-agent-protocol'] !== undefined ||
    req.headers['user-agent']?.includes('AI-Agent') ||
    req.headers['user-agent']?.includes('OpenClaw') ||
    req.headers['user-agent']?.includes('Claude') ||
    req.headers['user-agent']?.includes('GPT');

  if (isAgentRequest) {
    // Tag the request for downstream handlers
    (req as any).__agentRequest = true;

    // Add token count header to response
    res.setHeader('X-Markdown-Tokens', '8000'); // Suggest context budget
    res.setHeader('X-Agent-Protocol', 'aims-a2a/1.0');
    res.setHeader('X-AIMS-Discovery', '/.well-known/agent.json');

    logger.info({
      path: req.path,
      userAgent: req.headers['user-agent']?.slice(0, 50),
    }, '[MarkdownForAgents] Agent request detected');
  }

  next();
}

// ---------------------------------------------------------------------------
// LLM.txt — Machine-Readable Site Navigation
// ---------------------------------------------------------------------------

/**
 * Generate LLM.txt content — a machine-readable map of all AIMS capabilities.
 * This is the equivalent of robots.txt but for AI agents.
 */
export function generateLlmTxt(): string {
  const plugs = plugCatalog.getAll();
  const agents = getAllAgentCards();
  const now = new Date().toISOString();

  return `# AIMS (AI Managed Solutions) — LLM.txt
# Machine-readable navigation for AI agents
# Generated: ${now}
# Protocol: A2A v1.0 + ACP v2

## Identity
- name: ACHEEVY
- role: AI Executive Orchestrator
- platform: A.I.M.S. (AI Managed Solutions)
- domain: plugmein.cloud
- protocol: a2a/1.0, acp/2.0

## Discovery
- agent_card: /.well-known/agent.json
- a2a_agents: /a2a/agents
- a2a_tasks: /a2a/tasks/send (POST)
- api_docs: /api-docs

## Capabilities
- deploy: One-click container deployment for AI tools and platforms
- research: Deep research with multi-step investigation
- build: Full-stack application development
- automate: Workflow automation with 400+ integrations
- monitor: Real-time health, resource usage, lifecycle management
- export: Self-hosting bundles (Docker Compose + nginx + setup)

## Plug Catalog (${plugs.length} tools)
${plugs.map(p => `- ${p.id}: ${p.name} — ${p.tagline} [${p.category}] ${p.comingSoon ? '(coming soon)' : ''}`).join('\n')}

## API Endpoints
- GET /api/plug-catalog — Browse/search deployable tools
- GET /api/plug-catalog/:id — Get plug details
- POST /api/plug-instances/spin-up — Deploy a plug instance
- GET /api/plug-instances?userId=xxx — List running instances
- GET /api/plug-instances/:id/health — Check instance health
- POST /api/plug-instances/:id/stop — Stop instance
- DELETE /api/plug-instances/:id — Decommission instance
- POST /api/plug-instances/export — Generate self-hosting bundle

## Agent Fleet (${agents.length} agents)
${agents.map(a => `- ${a.id}: ${a.name} — ${a.description.slice(0, 80)}`).join('\n')}

## Payment
- metering: LUC (Locale Universal Calculator) — usage-based pricing
- protocols_supported: x402, stripe_agent_commerce (planned)
- payment_endpoint: /api/payments/agent (planned)

## Content Format
- Accept: text/markdown → Returns markdown content
- Accept: application/json → Returns structured JSON
- X-Markdown-Tokens: Suggests token budget for response

## Security
- authentication: API key (x-api-key header)
- agent_auth: A2A task-based authentication
- sandboxing: Isolated container networks per plug instance
- zero_trust: Agents treated as potential adversaries
`;
}

// ---------------------------------------------------------------------------
// AI Index — Structured Capability Ads for Agent Discovery
// ---------------------------------------------------------------------------

/**
 * Generate AI Index content — structured data for agent search engines.
 * Follows the AI Index spec for opt-in discoverability.
 */
export function generateAiIndex(): object {
  const plugs = plugCatalog.getAll();
  const agents = getAllAgentCards();

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'A.I.M.S. (AI Managed Solutions)',
    description: 'Autonomous AI-orchestrated Platform-as-a-Service. Deploy AI tools, agents, and platforms with one click.',
    url: 'https://plugmein.cloud',
    applicationCategory: 'PlatformAsAService',
    operatingSystem: 'Web',

    // Agent discovery
    agent: {
      '@type': 'SoftwareAgent',
      name: 'ACHEEVY',
      description: 'AI Executive Orchestrator — intent classification, agent delegation, workflow orchestration',
      protocol: 'a2a/1.0',
      discoveryUrl: 'https://plugmein.cloud/.well-known/agent.json',
    },

    // Available services
    offers: plugs.filter(p => !p.comingSoon).map(p => ({
      '@type': 'Offer',
      name: p.name,
      description: p.tagline,
      category: p.category,
      price: p.tier === 'free' ? '0' : undefined,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      itemOffered: {
        '@type': 'SoftwareApplication',
        name: p.name,
        applicationCategory: p.category,
      },
    })),

    // Agent capabilities
    potentialAction: [
      {
        '@type': 'Action',
        name: 'DeployTool',
        description: 'Deploy an AI tool or agent as a managed container',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://plugmein.cloud/api/plug-instances/spin-up',
          httpMethod: 'POST',
          contentType: 'application/json',
        },
      },
      {
        '@type': 'SearchAction',
        name: 'BrowseCatalog',
        description: 'Search the catalog of deployable AI tools',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://plugmein.cloud/api/plug-catalog?q={query}',
          httpMethod: 'GET',
        },
      },
      {
        '@type': 'Action',
        name: 'SendTask',
        description: 'Send a task to an AIMS agent via A2A protocol',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://plugmein.cloud/a2a/tasks/send',
          httpMethod: 'POST',
          contentType: 'application/json',
        },
      },
    ],

    // Sub-agents
    subOrganization: agents.map(a => ({
      '@type': 'SoftwareAgent',
      name: a.name,
      description: a.description,
      capabilities: a.capabilities.map(c => c.name),
    })),
  };
}
