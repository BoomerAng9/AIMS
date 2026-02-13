/**
 * Vibe Session Vertical — aiPLUG Builder
 *
 * "Conversate your way to a working aiPLUG."
 *
 * This is the 11th revenue vertical. Unlike the other 10 (which are
 * business-building tools), this one BUILDS THE ACTUAL PRODUCT.
 *
 * Phase A: 5-step conversational chain to collect the aiPLUG spec
 * Phase B: Full build pipeline → scaffold → code → style → test → deploy
 *
 * STEP_AGENT_MAP keyword routing for Phase B:
 *   scaffold/generate/boilerplate → Lil_Scaffold_Hawk
 *   implement/code/feature/api    → Lil_Code_Hawk
 *   style/design/ui/ux/css        → Lil_Style_Hawk
 *   test/lint/typecheck/a11y      → Lil_Test_Hawk
 *   deploy/containerize/preview   → Lil_Deploy_Hawk
 *   verify/audit/oracle           → Quality_Ang
 *
 * "Enough with users trying to prompt their way to a successful app."
 */

import type { VerticalDefinition } from '../../acheevy-verticals/types';

// ---------------------------------------------------------------------------
// Vibe Session Vertical Definition
// ---------------------------------------------------------------------------

export const VIBE_CODING_VERTICAL: VerticalDefinition = {
  id: 'vibe-coding',
  name: 'Managed Vibe Coding — aiPLUG Builder',
  category: 'engineering',
  tags: [
    'build', 'app', 'vibe coding', 'aiPLUG', 'create app',
    'make me an app', 'build my app', 'website', 'saas',
    'tool', 'dashboard', 'landing page', 'prototype',
    'code it', 'build it', 'ship it',
  ],
  triggers: [
    /build\s*(me\s*)?(an?\s*)?app/i,
    /create\s*(me\s*)?(an?\s*)?app/i,
    /make\s*(me\s*)?(an?\s*)?(app|website|tool|dashboard|saas)/i,
    /vibe\s*cod(e|ing)/i,
    /aiPlug/i,
    /ai\s*plug/i,
    /build\s*(my|the|a)\s*(product|platform|service|site|website)/i,
    /i\s*need\s*(an?\s*)(app|tool|site|website|platform)/i,
    /can\s*you\s*build/i,
    /ship\s*(me\s*)?(an?\s*)?(app|tool|product)/i,
    /code\s*(me\s*)?(an?\s*)?(app|tool|website)/i,
    /prototype\s*(my|an?|the)/i,
    /i\s*want\s*to\s*build/i,
    /help\s*me\s*build/i,
  ],

  // ── Phase A: Vibe Session (5-step conversational chain) ──────────────

  chain_steps: [
    {
      step: 1,
      name: 'The Vision',
      purpose: 'Understand what the aiPLUG does and who it serves',
      acheevy_behavior: `Ask: "What does this app DO? Not the features — the OUTCOME. 'It helps freelancers get paid faster' or 'It lets teams track bugs without the bloat.' Who is the user? Paint me the picture."`,
      output_schema: { vision: 'string', target_user: 'string' },
    },
    {
      step: 2,
      name: 'The Vibe',
      purpose: 'Capture the design feel, aesthetic, and brand energy',
      acheevy_behavior: `Ask: "What's the VIBE? Minimal and clean like Linear? Bold and loud like Figma? Dark mode default? Give me colors, inspirations, anything. If you don't know — tell me the vibe in 3 words and I'll design the rest."`,
      output_schema: { design_vibe: 'string', colors: 'string[]', inspirations: 'string[]' },
    },
    {
      step: 3,
      name: 'The Features',
      purpose: 'Define must-have features for v1 — ruthlessly',
      acheevy_behavior: `Present: "Here's what I'm hearing. Let me list what's day-1 essential vs. what can wait. Be ruthless — shipping a tight v1 beats a bloated v-never. I'll recommend the cut line."`,
      output_schema: { features: 'string[]', deferred_features: 'string[]' },
    },
    {
      step: 4,
      name: 'The Stack',
      purpose: 'Recommend tech stack based on requirements',
      acheevy_behavior: `Present the recommended stack: "Based on what you need, here's my recommendation: [frontend] + [backend] + [database] on [hosting]. I picked this because [rationale]. Want to change anything? Otherwise, I'm ready to build."`,
      output_schema: {
        frontend: 'string',
        backend: 'string',
        database: 'string',
        hosting: 'string',
        styling: 'string',
        auth: 'string',
        rationale: 'string',
      },
    },
    {
      step: 5,
      name: 'The Go',
      purpose: 'Final confirmation — name it and launch the build',
      acheevy_behavior: `Ask: "Last thing — what do you want to call this aiPLUG? Give it a name. Once you confirm, I'm dispatching the build squad. Scaffold → Code → Style → Test → Deploy. You'll get a live preview link."`,
      output_schema: { plug_name: 'string', plug_type: 'string', confirmed: 'boolean' },
    },
  ],

  acheevy_mode: 'business-builder',
  expert_domain: ['engineering', 'ideation'],

  // ── Phase B: Build Pipeline ──────────────────────────────────────────

  execution: {
    primary_agent: 'chicken-hawk',
    step_generation_prompt: `
Generate a full-stack build pipeline for an aiPLUG with these specs:

Name: {plug_name}
Vision: {vision}
Target user: {target_user}
Design vibe: {design_vibe}
Features: {features}
Tech stack: {frontend} + {backend} + {database} on {hosting}
Styling: {styling}
Auth: {auth}
Type: {plug_type}

Generate 7-10 step descriptions for the build pipeline. Each step MUST
contain keywords so the pipeline router assigns the correct specialist:

- "scaffold" or "boilerplate" → project structure, config files, deps
- "implement" or "code" or "api" → feature code, routes, components
- "style" or "design" or "ui" → styling, responsive layout, animations
- "test" or "lint" or "typecheck" → quality checks, unit tests
- "deploy" or "containerize" or "preview" → build + deploy preview
- "verify" or "audit" → ORACLE verification gate

The pipeline should follow this order:
1. Scaffold the project structure and install dependencies
2. Implement database schema and API endpoints
3. Implement frontend components for each feature
4. Style the UI with the specified design vibe
5. Implement authentication (if needed)
6. Test with linting, type-checking, and unit tests
7. Containerize and deploy a preview environment
8. Verify with ORACLE 8-gate verification

Return ONLY a JSON array of step description strings.
    `.trim(),
    required_context: [
      'plug_name', 'vision', 'target_user', 'design_vibe',
      'features', 'frontend', 'backend', 'database', 'hosting',
      'styling', 'plug_type',
    ],
    fallback_steps: [
      'Scaffold the project structure with the selected framework and install all dependencies',
      'Generate the database schema and create migration files for core data models',
      'Implement API endpoints and server-side logic for all must-have features',
      'Generate frontend components: pages, layouts, and interactive elements',
      'Implement authentication flow with user registration and login',
      'Style the entire UI with the specified design vibe, responsive breakpoints, and micro-animations',
      'Implement state management and client-server data fetching',
      'Run lint, typecheck, and generate unit tests for critical paths',
      'Containerize the application with Docker and deploy to Cloud Run preview',
      'Verify the build with ORACLE 8-gate audit: security, a11y, performance, correctness',
    ],
    requires_verification: true,
    max_steps: 12,
  },

  revenue_signal: {
    service: 'Plug Factory (Vibe_Ang + full build pipeline)',
    transition_prompt:
      "Ready to build this? I'm dispatching the squad now. " +
      "Scaffold → Code → Style → Test → Deploy. " +
      "You'll get a live preview link when it's done.",
  },
};

// ---------------------------------------------------------------------------
// Intent Detection — Broader than vertical triggers
// ---------------------------------------------------------------------------

/**
 * Detect any app-building intent in a user message.
 * Broader than the vertical trigger patterns — catches general "build me" energy.
 */
export function matchVibeIntent(message: string): boolean {
  const VIBE_PATTERNS = [
    /build\s*(me|my|a|an|the)/i,
    /create\s*(me|my|a|an|the)\s*(app|site|tool|dashboard|api)/i,
    /i\s*want\s*(an?|my|to\s*build)\s*(app|site|tool|product|platform)/i,
    /make\s*(this|it|me)\s*(an?\s*)?(app|real|live|work)/i,
    /can\s*you\s*(build|code|make|create|ship)/i,
    /ship\s*(this|it|something)/i,
    /turn\s*this\s*into\s*(an?\s*)?(app|product|site)/i,
    /vibe\s*cod/i,
    /aiPlug/i,
  ];
  return VIBE_PATTERNS.some(p => p.test(message));
}
