/**
 * @hook identity-guard
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Enforces A.I.M.S. branding and blocks exposure of internal tool names
 */

import { HookDefinition } from '../types/hooks';

// Tool names that should NEVER be exposed to users
const BLOCKED_TOOL_NAMES = [
  'ii-agent',
  'ii_agent',
  'iiagent',
  'n8n',
  'postgresql',
  'postgres',
  'docker',
  'kubernetes',
  'k8s',
  'fastapi',
  'express',
  'firebase',
  'firestore',
  'openrouter',
  'anthropic',
  'openai',
  'claude',
  'gpt-4',
  'gemini',
  'groq',
  'elevenlabs',
];

// Mapping of internal names to actor names
const ACTOR_MAPPING: Record<string, string> = {
  'ii-agent': 'ACHEEVY',
  'ii_agent': 'ACHEEVY',
  'iiagent': 'ACHEEVY',
  'n8n': 'Workflow Engine',
  'postgresql': 'Data Vault',
  'postgres': 'Data Vault',
  'docker': 'Container System',
  'kubernetes': 'Orchestration Layer',
  'fastapi': 'ACHEEVY Core',
  'express': 'Gateway',
  'openrouter': 'AI Router',
  'anthropic': 'Intelligence Layer',
  'openai': 'Intelligence Layer',
  'claude': 'Intelligence Layer',
  'gpt-4': 'Intelligence Layer',
  'gemini': 'Intelligence Layer',
  'groq': 'Voice Engine',
  'elevenlabs': 'Voice Engine',
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
