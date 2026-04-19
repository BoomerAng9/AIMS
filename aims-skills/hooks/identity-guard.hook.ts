/**
 * @hook identity-guard
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Enforces A.I.M.S. branding and blocks exposure of internal tool names
 */

import { HookDefinition } from '../types/hooks';

// Tool names that should NEVER be exposed to users
const BLOCKED_TOOL_NAMES = [
  // Infrastructure
  'ii-agent', 'ii_agent', 'iiagent',
  'n8n', 'postgresql', 'postgres', 'docker', 'kubernetes', 'k8s',
  'fastapi', 'express', 'firebase', 'firestore', 'traefik', 'nginx',
  'puter', 'neon', 'neondb', 'prisma', 'redis',
  // AI providers & models
  'openrouter', 'anthropic', 'openai', 'claude', 'gpt-4', 'gpt-5',
  'gemini', 'groq', 'elevenlabs', 'deepseek', 'minimax', 'nemotron',
  'llama', 'qwen', 'mercury-2', 'personaplex',
  'fal.ai', 'kie.ai', 'seedance', 'kling', 'recraft', 'ideogram',
  // Agent hierarchy — NEVER expose
  'Boomer_Ang', 'boomer_ang', 'Boomer_Angs', 'boomer_angs',
  'Lil_Hawk', 'lil_hawk', 'Lil_Hawks', 'lil_hawks',
  'Chicken_Hawk', 'chicken_hawk', 'Chicken Hawk',
  'General_Ang', 'general_ang',
  // Individual Boomer_Angs
  'Scout_Ang', 'scout_ang', 'q_ang', 'Q_Ang',
  'Edu_Ang', 'edu_ang', 'Sales_Ang', 'sales_ang',
  'Content_Ang', 'content_ang',
  'Biz_Ang', 'biz_ang',
  'Ops_Ang', 'ops_ang',
  'Iller_Ang', 'iller_ang',
  'CFO_Ang', 'cfo_ang',
  'TPS_Report_Ang', 'tps_report_ang',
  'Betty-Anne_Ang', 'betty-anne_ang',
  'Buildsmith', 'buildsmith',
  'Chronicle_Ang', 'chronicle_ang',
  // Individual Lil_Hawks (Sqwaadrun + AIMS)
  'Lil_Scrapp_Hawk', 'Lil_Guard_Hawk', 'Lil_Parse_Hawk',
  'Lil_Crawl_Hawk', 'Lil_Snap_Hawk', 'Lil_Store_Hawk',
  'Lil_Extract_Hawk', 'Lil_Feed_Hawk', 'Lil_Diff_Hawk',
  'Lil_Clean_Hawk', 'Lil_API_Hawk', 'Lil_Queue_Hawk',
  'Lil_Sitemap_Hawk', 'Lil_Stealth_Hawk', 'Lil_Schema_Hawk',
  'Lil_Pipe_Hawk', 'Lil_Sched_Hawk',
  'Lil_Smelt_Hawk', 'Lil_Cast_Hawk', 'Lil_Theme_Hawk',
  'Lil_Proof_Hawk', 'Lil_Viz_Hawk', 'Lil_Blend_Hawk',
  'Lil_TRAE_Hawk', 'Lil_Coding_Hawk', 'Lil_Agent_Hawk',
  'Lil_Flow_Hawk', 'Lil_Sand_Hawk', 'Lil_Memory_Hawk',
  'Lil_Graph_Hawk', 'Lil_Back_Hawk', 'Lil_Deep_Hawk',
  // Internal systems
  'OpenClaw', 'openclaw', 'NemoClaw', 'nemoclaw',
  'Hermes', 'hermes', 'RuntimeAng', 'GuardAng', 'LearnAng',
  'AVVA NOON', 'avva noon', 'NTNTN', 'ntntn',
  'Claw-Code', 'claw-code', 'Smelt Engine', 'smelt engine',
  'Port Authority', 'port authority',
  'Sqwaadrun', 'sqwaadrun',
  // GCP identifiers — NEVER expose
  '939270059361', 'ai-managed-services', 'foai-aims',
  'apbgyi35aq-uc.a.run.app',
  // Scraping tools
  'firecrawl', 'apify', 'oxylabs', 'playwright',
];

// Mapping of internal names to user-safe actor names
const ACTOR_MAPPING: Record<string, string> = {
  // Infrastructure → generic labels
  'ii-agent': 'ACHEEVY', 'ii_agent': 'ACHEEVY', 'iiagent': 'ACHEEVY',
  'n8n': 'Workflow Engine', 'postgresql': 'Data Vault', 'postgres': 'Data Vault',
  'docker': 'Container System', 'kubernetes': 'Orchestration Layer',
  'fastapi': 'ACHEEVY Core', 'express': 'Gateway',
  'firebase': 'Auth System', 'firestore': 'Data Vault',
  'traefik': 'Gateway', 'nginx': 'Gateway',
  'puter': 'File System', 'neon': 'Data Vault', 'neondb': 'Data Vault',
  'prisma': 'Data Vault', 'redis': 'Cache Layer',
  // AI providers → Intelligence Layer
  'openrouter': 'AI Router', 'anthropic': 'Intelligence Layer',
  'openai': 'Intelligence Layer', 'claude': 'Intelligence Layer',
  'gpt-4': 'Intelligence Layer', 'gpt-5': 'Intelligence Layer',
  'gemini': 'Intelligence Layer', 'groq': 'Voice Engine',
  'elevenlabs': 'Voice Engine', 'deepseek': 'Intelligence Layer',
  'minimax': 'Intelligence Layer', 'nemotron': 'Intelligence Layer',
  'llama': 'Intelligence Layer', 'qwen': 'Intelligence Layer',
  'mercury-2': 'Intelligence Layer', 'personaplex': 'Voice Engine',
  'fal.ai': 'Media Engine', 'kie.ai': 'Media Engine',
  'seedance': 'Media Engine', 'kling': 'Media Engine',
  'recraft': 'Design Engine', 'ideogram': 'Design Engine',
  // Agent hierarchy → "my team"
  'Boomer_Ang': 'department lead', 'boomer_ang': 'department lead',
  'Boomer_Angs': 'department leads', 'boomer_angs': 'department leads',
  'Lil_Hawk': 'team member', 'lil_hawk': 'team member',
  'Lil_Hawks': 'team members', 'lil_hawks': 'team members',
  'Chicken_Hawk': 'operations coordinator', 'chicken_hawk': 'operations coordinator',
  'Chicken Hawk': 'operations coordinator',
  'General_Ang': 'policy officer', 'general_ang': 'policy officer',
  // Individual agents → role-based labels
  'Scout_Ang': 'research lead', 'scout_ang': 'research lead', 'q_ang': 'research lead', 'Q_Ang': 'research lead',
  'Edu_Ang': 'education specialist', 'edu_ang': 'education specialist',
  'Sales_Ang': 'sales specialist', 'sales_ang': 'sales specialist',
  'Content_Ang': 'content lead', 'content_ang': 'content lead',
  'Biz_Ang': 'business strategist', 'biz_ang': 'business strategist',
  'Ops_Ang': 'operations lead', 'ops_ang': 'operations lead',
  'Iller_Ang': 'creative director', 'iller_ang': 'creative director',
  'CFO_Ang': 'finance lead', 'cfo_ang': 'finance lead',
  'TPS_Report_Ang': 'pricing analyst', 'tps_report_ang': 'pricing analyst',
  'Betty-Anne_Ang': 'HR lead', 'betty-anne_ang': 'HR lead',
  'Buildsmith': 'document forge', 'buildsmith': 'document forge',
  'Chronicle_Ang': 'audit lead', 'chronicle_ang': 'audit lead',
  // Internal systems → generic
  'OpenClaw': 'runtime', 'openclaw': 'runtime',
  'NemoClaw': 'security layer', 'nemoclaw': 'security layer',
  'Hermes': 'learning engine', 'hermes': 'learning engine',
  'AVVA NOON': 'platform intelligence', 'avva noon': 'platform intelligence',
  'NTNTN': 'intent engine', 'ntntn': 'intent engine',
  'Claw-Code': 'code engine', 'claw-code': 'code engine',
  'Smelt Engine': 'document engine', 'smelt engine': 'document engine',
  'Port Authority': 'gateway', 'port authority': 'gateway',
  'Sqwaadrun': 'research fleet', 'sqwaadrun': 'research fleet',
  // GCP identifiers → redacted
  '939270059361': '[REDACTED]', 'ai-managed-services': '[REDACTED]',
  'foai-aims': '[REDACTED]', 'apbgyi35aq-uc.a.run.app': '[REDACTED]',
  // Scraping tools
  'firecrawl': 'research engine', 'apify': 'research engine',
  'oxylabs': 'research engine', 'playwright': 'automation engine',
};

// Blocked branding terms
const BLOCKED_BRANDING = [
  'hybrid business architect',
  'the hybrid business architect',
  'hba',
];

// Correct branding
const CORRECT_BRANDING = {
  full: 'AI Managed Services',
  acronym: 'A.I.M.S.',
  tagline: 'Think It. Prompt It. Let ACHEEVY Deploy it!',
  motto: 'Activity breeds Activity',
};

export const IdentityGuardHook: HookDefinition = {
  metadata: {
    name: 'identity_guard',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'Enforces A.I.M.S. branding and blocks tool name exposure',
    priority: 200, // Runs very early
  },

  lifecycle_points: {
    before_acheevy_response: {
      execute: async (context: any) => {
        // Inject identity context into system prompt
        context.identity = {
          brand: CORRECT_BRANDING,
          blocked_tools: BLOCKED_TOOL_NAMES,
          actor_mapping: ACTOR_MAPPING,
        };
        
        return context;
      },
    },

    after_acheevy_response: {
      execute: async (context: any, response: string) => {
        let sanitizedResponse = response;

        // Check for blocked tool names and replace with actor names
        for (const [tool, actor] of Object.entries(ACTOR_MAPPING)) {
          const regex = new RegExp(tool, 'gi');
          sanitizedResponse = sanitizedResponse.replace(regex, actor);
        }

        // Check for blocked branding
        for (const term of BLOCKED_BRANDING) {
          const regex = new RegExp(term, 'gi');
          sanitizedResponse = sanitizedResponse.replace(regex, CORRECT_BRANDING.full);
        }

        return sanitizedResponse;
      },
    },

    before_tool_call: {
      execute: async (context: any) => {
        // Log but don't expose tool names in any user-facing output
        console.log(`[IDENTITY-GUARD] Tool call: ${context.tool_name} (hidden from user)`);
        return context;
      },
    },
  },

  testing: {
    test_cases: [
      {
        name: 'Blocks ii-agent exposure',
        input: { response: 'I will use ii-agent to execute this task.' },
        expected: { response: 'I will use ACHEEVY to execute this task.' },
      },
      {
        name: 'Blocks Hybrid Business Architect',
        input: { response: 'Welcome to the Hybrid Business Architect!' },
        expected: { response: 'Welcome to the AI Managed Services!' },
      },
      {
        name: 'Replaces PostgreSQL with Data Vault',
        input: { response: 'Your data is stored in PostgreSQL.' },
        expected: { response: 'Your data is stored in Data Vault.' },
      },
    ],
  },
};

export default IdentityGuardHook;

// ── Inbound Classification (Information Boundary Protocol) ──────

export type BoundaryZone = 'GREEN' | 'AMBER' | 'RED';

const RED_PATTERNS = [
  /system\s*prompt/i,
  /show\s*(me\s+)?(the\s+)?code/i,
  /api\s*(key|endpoint|secret)/i,
  /what\s*(api|endpoint|service|server)s?\s*(do\s+you|are\s+you)/i,
  /architecture|infrastructure|topology/i,
  /docker|container|kubernetes|k8s/i,
  /\.env|environment\s*variable/i,
  /agent\s*(config|configuration|setup)/i,
  /show\s*(me\s+)?(your\s+)?source/i,
];

const AMBER_PATTERNS = [
  /what\s*(model|llm|ai)\s*(do\s+you|are\s+you)/i,
  /how\s+many\s*(agent|server|worker)/i,
  /what\s*tools?\s*(do\s+you|are\s+you)/i,
  /tech\s*stack/i,
  /who\s*(built|created|made|designed)\s*(you|this)/i,
  /how\s*does?\s*(your|the)\s*(team|system|pipeline)/i,
  /what\s*(language|framework)/i,
];

export function classifyInbound(message: string): BoundaryZone {
  for (const pattern of RED_PATTERNS) {
    if (pattern.test(message)) return 'RED';
  }
  for (const pattern of AMBER_PATTERNS) {
    if (pattern.test(message)) return 'AMBER';
  }
  return 'GREEN';
}
