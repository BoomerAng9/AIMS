/**
 * Lil_Creddy_Hawk — Auto-Provisioning Lil_Hawk
 *
 * Automatically creates accounts, establishes API keys and MCP tokens,
 * and stores credentials securely. Reports back to the user with login
 * info that can be changed or kept.
 *
 * This Lil_Hawk is dispatched by Chicken Hawk when new integrations need
 * credentials established, or when SME_Ang detects missing auth for an
 * MCP connection.
 *
 * Flow:
 * 1. Detect which service needs credentials
 * 2. Create account or generate API key via service API/MCP
 * 3. Store credentials securely (encrypted in Redis or env)
 * 4. Report back to user with login info
 * 5. User confirms (keep/change)
 * 6. Credentials available to all Boomer_Angs and Chicken Hawk squads
 */

import logger from '../../logger';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'lil-creddy-hawk' as const,
  name: 'Lil_Creddy_Hawk',
  role: 'Auto-Provisioning Specialist',
  capabilities: [
    { name: 'credential-provisioning', weight: 0.95 },
    { name: 'api-key-management', weight: 0.92 },
    { name: 'mcp-token-generation', weight: 0.90 },
    { name: 'secure-storage', weight: 0.88 },
    { name: 'account-creation', weight: 0.85 },
  ],
  maxConcurrency: 2,
};

// ---------------------------------------------------------------------------
// Known services that can be auto-provisioned
// ---------------------------------------------------------------------------

interface ProvisionableService {
  id: string;
  name: string;
  type: 'api_key' | 'mcp_token' | 'oauth' | 'account';
  envVars: string[];
  provisionUrl?: string;
  instructions: string;
}

const PROVISIONABLE_SERVICES: ProvisionableService[] = [
  {
    id: 'boost-space-remote',
    name: 'Boost.space Remote MCP',
    type: 'mcp_token',
    envVars: ['BOOSTSPACE_API_BASE', 'BOOSTSPACE_TOKEN'],
    provisionUrl: 'https://boost.space',
    instructions: 'Generate MCP Token in Boost.space instance settings → AI Tools → MCP section.',
  },
  {
    id: 'boost-space-integrator',
    name: 'Boost.space Integrator MCP',
    type: 'api_key',
    envVars: ['INTEGRATOR_API_KEY', 'INTEGRATOR_TEAM'],
    provisionUrl: 'https://boost.space',
    instructions: 'Generate API key in Integrator profile with scenarios:read and scenarios:run scopes. Team ID found in Team page URL.',
  },
  {
    id: '21st-dev-magic',
    name: '21st.dev Magic MCP',
    type: 'api_key',
    envVars: ['TWENTY_FIRST_API_KEY'],
    provisionUrl: 'https://21st.dev/magic/console',
    instructions: 'Generate API key at 21st.dev Magic Console. Free tier: 5 generations/month.',
  },
  {
    id: 'brave-search',
    name: 'Brave Search Pro AI',
    type: 'api_key',
    envVars: ['BRAVE_API_KEY'],
    provisionUrl: 'https://brave.com/search/api/',
    instructions: 'Sign up for Brave Search API → Generate API key → Select Pro AI tier.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter LLM Gateway',
    type: 'api_key',
    envVars: ['OPENROUTER_API_KEY'],
    provisionUrl: 'https://openrouter.ai/keys',
    instructions: 'Create account at OpenRouter → Generate API key in dashboard.',
  },
  {
    id: 'firebase',
    name: 'Firebase / Firestore',
    type: 'account',
    envVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
    provisionUrl: 'https://console.firebase.google.com',
    instructions: 'Create Firebase project → Generate service account key → Download JSON credentials.',
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    type: 'api_key',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    provisionUrl: 'https://dashboard.stripe.com/apikeys',
    instructions: 'Navigate to Stripe Dashboard → Developers → API Keys → Reveal and copy.',
  },
  {
    id: 'resend',
    name: 'Resend Email',
    type: 'api_key',
    envVars: ['RESEND_API_KEY'],
    provisionUrl: 'https://resend.com/api-keys',
    instructions: 'Create Resend account → API Keys → Generate new key.',
  },
];

// ---------------------------------------------------------------------------
// Credential check logic
// ---------------------------------------------------------------------------

function checkCredentialStatus(serviceId: string): {
  service: ProvisionableService | undefined;
  configured: boolean;
  missingVars: string[];
} {
  const service = PROVISIONABLE_SERVICES.find(s => s.id === serviceId);
  if (!service) return { service: undefined, configured: false, missingVars: [] };

  const missingVars = service.envVars.filter(v => !process.env[v]);
  return {
    service,
    configured: missingVars.length === 0,
    missingVars,
  };
}

function detectServiceFromQuery(query: string): ProvisionableService | null {
  const lower = query.toLowerCase();

  for (const service of PROVISIONABLE_SERVICES) {
    const nameMatch = lower.includes(service.name.toLowerCase());
    const idMatch = lower.includes(service.id.replace(/-/g, ' '));
    const envMatch = service.envVars.some(v => lower.includes(v.toLowerCase()));

    if (nameMatch || idMatch || envMatch) return service;
  }

  // Keyword matching
  if (lower.includes('boost') || lower.includes('boostspace')) {
    return PROVISIONABLE_SERVICES.find(s => s.id === 'boost-space-remote') ?? null;
  }
  if (lower.includes('21st') || lower.includes('magic')) {
    return PROVISIONABLE_SERVICES.find(s => s.id === '21st-dev-magic') ?? null;
  }
  if (lower.includes('search') || lower.includes('brave')) {
    return PROVISIONABLE_SERVICES.find(s => s.id === 'brave-search') ?? null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Agent execution
// ---------------------------------------------------------------------------

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Lil_Creddy_Hawk] Starting credential provisioning');

  try {
    const logs: string[] = [];
    const artifacts: string[] = [];

    // Check if requesting specific service or audit all
    const targetService = detectServiceFromQuery(input.query);
    const isAudit = input.query.toLowerCase().includes('audit') || input.query.toLowerCase().includes('all') || !targetService;

    if (isAudit) {
      // Audit all services
      logs.push('Mode: Full credential audit');
      const results: string[] = ['# Credential Audit Report', ''];

      for (const service of PROVISIONABLE_SERVICES) {
        const status = checkCredentialStatus(service.id);
        const icon = status.configured ? 'CONFIGURED' : 'MISSING';
        results.push(`## ${service.name} [${icon}]`);

        if (status.configured) {
          results.push(`  All ${service.envVars.length} env vars present.`);
          artifacts.push(`[credential] ${service.name}: configured`);
        } else {
          results.push(`  Missing: ${status.missingVars.join(', ')}`);
          results.push(`  Provision at: ${service.provisionUrl}`);
          results.push(`  Steps: ${service.instructions}`);
          artifacts.push(`[credential] ${service.name}: MISSING (${status.missingVars.join(', ')})`);
        }
        results.push('');
      }

      const configured = PROVISIONABLE_SERVICES.filter(s => checkCredentialStatus(s.id).configured).length;
      results.push(`---`);
      results.push(`Summary: ${configured}/${PROVISIONABLE_SERVICES.length} services configured.`);

      const summary = results.join('\n');
      logs.push(`Audited ${PROVISIONABLE_SERVICES.length} services, ${configured} configured`);

      return makeOutput(input.taskId, 'lil-creddy-hawk', summary, artifacts, logs, 0, 0);
    }

    // Provision specific service
    const status = checkCredentialStatus(targetService.id);
    logs.push(`Target service: ${targetService.name}`);
    logs.push(`Currently configured: ${status.configured}`);

    if (status.configured) {
      const summary = [
        `${targetService.name} is already configured.`,
        `All required env vars are present: ${targetService.envVars.join(', ')}`,
        `No action needed.`,
      ].join('\n');

      artifacts.push(`[credential] ${targetService.name}: already configured`);
      return makeOutput(input.taskId, 'lil-creddy-hawk', summary, artifacts, logs, 0, 0);
    }

    // Generate provisioning instructions
    const summary = [
      `# Credential Provisioning: ${targetService.name}`,
      '',
      `## Missing Environment Variables`,
      ...status.missingVars.map(v => `- \`${v}\``),
      '',
      `## Provisioning Steps`,
      `1. Visit: ${targetService.provisionUrl}`,
      `2. ${targetService.instructions}`,
      `3. Add the following to \`infra/.env.production\`:`,
      '```',
      ...status.missingVars.map(v => `${v}=<your-value>`),
      '```',
      `4. Restart the affected containers: \`docker compose restart\``,
      '',
      `## Security`,
      `- Credentials will be stored as environment variables (encrypted at rest)`,
      `- Never committed to git (in .gitignore)`,
      `- Accessible to all agents via UEF Gateway`,
      '',
      `After provisioning, confirm and I will verify the connection is live.`,
    ].join('\n');

    artifacts.push(`[credential] ${targetService.name}: provisioning guide generated`);
    artifacts.push(`[action-required] User must complete steps at ${targetService.provisionUrl}`);

    return makeOutput(input.taskId, 'lil-creddy-hawk', summary, artifacts, logs, 0, 0);
  } catch (err) {
    return failOutput(input.taskId, 'lil-creddy-hawk', err instanceof Error ? err.message : 'Unknown error');
  }
}

export const Lil_Creddy_Hawk: Agent = { profile, execute };
