/**
 * Managed Vibe Coding Department — Build Manifest Generator
 *
 * Transforms collected Vibe Session data into a Chicken Hawk-compatible
 * build manifest with waves, steps, and Lil_Hawk assignments.
 *
 * Called by Vibe_Ang when Phase A completes and user confirms.
 */

import { randomUUID } from 'crypto';
import type {
  BuildManifest,
  AiPlugSpec,
  VibeSessionData,
  TechStackRecommendation,
  AiPlugType,
  BuildWave,
  BuildStep,
} from './types';

// ---------------------------------------------------------------------------
// Tech Stack Recommendation Engine
// ---------------------------------------------------------------------------

/**
 * Recommend a tech stack based on the aiPLUG type and features.
 */
export function recommendTechStack(
  plugType: AiPlugType,
  features: string[],
  designVibe: string
): TechStackRecommendation {
  const hasAuth = features.some(f => /auth|login|sign.?up|account/i.test(f));
  const hasPayments = features.some(f => /pay|billing|subscri|checkout|stripe/i.test(f));
  const hasDB = features.some(f => /data|store|save|crud|dashboard|table/i.test(f));
  const isRealtime = features.some(f => /realtime|live|chat|socket|notification/i.test(f));

  const base: TechStackRecommendation = {
    frontend: 'Next.js 15 (App Router)',
    backend: 'Next.js API Routes',
    database: 'SQLite + Prisma',
    hosting: 'Cloud Run',
    styling: 'Tailwind CSS',
    rationale: '',
  };

  // Adjust based on plug type
  switch (plugType) {
    case 'landing-page':
      base.backend = 'Static (no backend)';
      base.database = 'None';
      base.rationale = 'Landing page — static frontend, no backend needed. Fast to build, fast to load.';
      break;

    case 'api-service':
      base.frontend = 'None (API only)';
      base.backend = 'Hono on Bun';
      base.styling = 'None';
      base.rationale = 'API-only service — Hono is ultra-fast and lightweight. Perfect for microservices.';
      break;

    case 'full-stack':
    case 'saas':
      base.database = 'PostgreSQL + Prisma';
      base.auth = hasAuth ? 'NextAuth.js' : undefined;
      base.payments = hasPayments ? 'Stripe' : undefined;
      base.rationale = 'Full-stack SaaS needs PostgreSQL for reliability, Prisma for type-safe queries.';
      break;

    case 'dashboard':
      base.database = hasDB ? 'PostgreSQL + Prisma' : 'Firebase Firestore';
      base.rationale = 'Dashboard apps need fast reads — Firestore for simple cases, Postgres for complex queries.';
      break;

    case 'marketplace':
      base.database = 'PostgreSQL + Prisma';
      base.auth = 'NextAuth.js';
      base.payments = 'Stripe Connect';
      base.rationale = 'Marketplace needs multi-tenant data isolation and Stripe Connect for vendor payouts.';
      break;

    default:
      base.database = hasDB ? 'PostgreSQL + Prisma' : 'SQLite + Prisma';
      base.rationale = 'Balanced stack — Next.js handles everything, Prisma for type-safe data access.';
  }

  // Realtime upgrade
  if (isRealtime) {
    base.backend = 'Next.js API Routes + Socket.io';
    base.rationale += ' Added Socket.io for realtime features.';
  }

  return base;
}

// ---------------------------------------------------------------------------
// Build Manifest Generator
// ---------------------------------------------------------------------------

/**
 * Generate a complete build manifest from Vibe Session data.
 * This is what gets dispatched to Chicken Hawk.
 */
export function generateBuildManifest(
  sessionData: VibeSessionData,
  userId: string,
  sessionId: string
): BuildManifest {
  const manifestId = `mfst_${randomUUID().slice(0, 8)}`;
  const shiftId = `shift_vibe_${randomUUID().slice(0, 8)}`;

  const aiPlug: AiPlugSpec = {
    name: sessionData.plug_name,
    description: sessionData.vision,
    target_user: sessionData.target_user,
    design_vibe: sessionData.design_vibe,
    colors: sessionData.colors,
    inspirations: sessionData.inspirations,
    features: sessionData.features,
    deferred_features: sessionData.deferred_features,
    tech_stack: sessionData.tech_stack,
    plug_type: sessionData.plug_type,
  };

  // Determine build mode based on complexity
  const isSimple = aiPlug.plug_type === 'landing-page' || aiPlug.plug_type === 'tool';
  const featureCount = aiPlug.features.length;

  const waves = generateBuildWaves(aiPlug);

  return {
    manifest_id: manifestId,
    shift_id: shiftId,
    department: 'vibe-coding',
    aiPlug,
    build_config: {
      mode: isSimple && featureCount <= 3 ? 'sync' : 'async-job',
      cloud_run_job: isSimple ? undefined : 'aims-vibe-coder',
      timeout_seconds: isSimple ? 600 : 1800,
      deploy_preview: true,
      sandbox_template: 'nextjs-developer',
    },
    plan: {
      waves,
      estimated_luc: estimateLuc(aiPlug),
    },
    user_id: userId,
    session_id: sessionId,
    created_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Wave Generation — Break the build into ordered waves
// ---------------------------------------------------------------------------

function generateBuildWaves(aiPlug: AiPlugSpec): BuildWave[] {
  const waves: BuildWave[] = [];

  // Wave 1: Foundation
  waves.push({
    wave_id: 'wave_1_foundation',
    name: 'Foundation',
    steps: [
      {
        step_id: 'scaffold_project',
        description: `Scaffold ${aiPlug.tech_stack.frontend} project with ${aiPlug.tech_stack.styling} and install dependencies`,
        assigned_to: 'Lil_Scaffold_Hawk',
        keywords: ['scaffold', 'boilerplate'],
        inputs: { tech_stack: aiPlug.tech_stack, plug_name: aiPlug.name },
        expected_output: 'project_structure',
      },
      ...(aiPlug.tech_stack.database !== 'None' ? [{
        step_id: 'generate_schema',
        description: `Generate database schema with ${aiPlug.tech_stack.database} for: ${aiPlug.features.join(', ')}`,
        assigned_to: 'Lil_Code_Hawk',
        keywords: ['implement', 'code'],
        inputs: { features: aiPlug.features, database: aiPlug.tech_stack.database },
        expected_output: 'schema_files',
      }] : []),
    ],
  });

  // Wave 2: Implementation
  waves.push({
    wave_id: 'wave_2_implementation',
    name: 'Implementation',
    steps: [
      ...(aiPlug.tech_stack.backend !== 'Static (no backend)' && aiPlug.tech_stack.backend !== 'None (API only)' ? [{
        step_id: 'implement_api',
        description: `Implement API endpoints and server logic for features: ${aiPlug.features.join(', ')}`,
        assigned_to: 'Lil_Code_Hawk',
        keywords: ['implement', 'api', 'code'],
        inputs: { features: aiPlug.features, backend: aiPlug.tech_stack.backend },
        expected_output: 'api_endpoints',
      }] : []),
      {
        step_id: 'implement_frontend',
        description: `Generate frontend components and pages for: ${aiPlug.features.join(', ')}`,
        assigned_to: 'Lil_Code_Hawk',
        keywords: ['implement', 'code', 'feature'],
        inputs: { features: aiPlug.features, frontend: aiPlug.tech_stack.frontend },
        expected_output: 'component_tree',
      },
      ...(aiPlug.tech_stack.auth ? [{
        step_id: 'implement_auth',
        description: `Implement authentication with ${aiPlug.tech_stack.auth}`,
        assigned_to: 'Lil_Code_Hawk',
        keywords: ['implement', 'code'],
        inputs: { auth: aiPlug.tech_stack.auth },
        expected_output: 'auth_flow',
      }] : []),
    ],
  });

  // Wave 3: Polish
  waves.push({
    wave_id: 'wave_3_polish',
    name: 'Polish',
    steps: [
      {
        step_id: 'style_ui',
        description: `Style the UI with "${aiPlug.design_vibe}" vibe using ${aiPlug.tech_stack.styling}. Colors: ${aiPlug.colors?.join(', ') || 'auto'}. Responsive + animations.`,
        assigned_to: 'Lil_Style_Hawk',
        keywords: ['style', 'design', 'ui'],
        inputs: { design_vibe: aiPlug.design_vibe, colors: aiPlug.colors, styling: aiPlug.tech_stack.styling },
        expected_output: 'styled_components',
      },
    ],
  });

  // Wave 4: Quality + Ship
  waves.push({
    wave_id: 'wave_4_ship',
    name: 'Quality + Ship',
    steps: [
      {
        step_id: 'test_all',
        description: 'Run lint, typecheck, unit tests, and accessibility audit on the entire codebase',
        assigned_to: 'Lil_Test_Hawk',
        keywords: ['test', 'lint', 'typecheck'],
        inputs: {},
        expected_output: 'test_results',
      },
      {
        step_id: 'deploy_preview',
        description: 'Containerize the aiPLUG with Docker and deploy preview to Cloud Run',
        assigned_to: 'Lil_Deploy_Hawk',
        keywords: ['deploy', 'containerize', 'preview'],
        inputs: { hosting: aiPlug.tech_stack.hosting },
        expected_output: 'preview_url',
      },
      {
        step_id: 'oracle_verify',
        description: 'Run ORACLE 8-gate verification: security, a11y, performance, correctness, style, docs, tests, deploy',
        assigned_to: 'Quality_Ang',
        keywords: ['verify', 'audit', 'oracle'],
        inputs: {},
        expected_output: 'oracle_report',
      },
    ],
  });

  return waves;
}

// ---------------------------------------------------------------------------
// LUC Cost Estimation
// ---------------------------------------------------------------------------

function estimateLuc(aiPlug: AiPlugSpec): number {
  const BASE_COSTS: Record<string, number> = {
    'landing-page': 20,
    'tool': 40,
    'web-app': 80,
    'api-service': 50,
    'dashboard': 70,
    'full-stack': 120,
    'marketplace': 200,
    'saas': 180,
  };

  const base = BASE_COSTS[aiPlug.plug_type] || 100;
  const featureMultiplier = 1 + (aiPlug.features.length * 0.15);
  const authAddon = aiPlug.tech_stack.auth ? 15 : 0;
  const paymentsAddon = aiPlug.tech_stack.payments ? 25 : 0;

  return Math.round(base * featureMultiplier + authAddon + paymentsAddon);
}
