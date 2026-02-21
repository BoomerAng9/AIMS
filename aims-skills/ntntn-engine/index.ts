/**
 * NtNtN Engine — A.I.M.S. Creative Development Library
 *
 * The NtNtN Engine is a platform-level feature of A.I.M.S. (AI Managed Solutions).
 * It provides the taxonomy, techniques, patterns, and implementation references
 * that power creative web development builds.
 *
 * Connected Boomer_Angs:
 *   - Picker_Ang: Selects components and techniques from the library
 *   - Buildsmith: Constructs the end product from selections
 *
 * Accessible by: ACHEEVY, all Boomer_Angs, Chicken Hawk, all Lil_Hawks
 */

// ---------------------------------------------------------------------------
// Category Definitions
// ---------------------------------------------------------------------------

export const NTNTN_CATEGORIES = [
  'frontend_frameworks',
  'animation_motion',
  'styling_systems',
  '3d_visual',
  'scroll_interaction',
  'ui_components',
  'layout_responsive',
  'backend_fullstack',
  'cms_content',
  'deployment_infra',
] as const;

export type NtNtNCategory = (typeof NTNTN_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Technique Types
// ---------------------------------------------------------------------------

export const TECHNIQUE_GROUPS = [
  'scroll',
  'hover_interaction',
  'page_transitions',
  'text_typography',
  'visual_effects',
  '3d_immersive',
  'micro_interactions',
] as const;

export type TechniqueGroup = (typeof TECHNIQUE_GROUPS)[number];

// ---------------------------------------------------------------------------
// NLP Intent → Category Mapping
// ---------------------------------------------------------------------------

export interface IntentMapping {
  keywords: string[];
  category: NtNtNCategory;
  technique_group?: TechniqueGroup;
  primary_boomer_ang: 'Picker_Ang' | 'Buildsmith';
  fallback_boomer_ang?: string;
}

/**
 * ACHEEVY's NLP classifier uses this map to route creative build requests
 * to the correct NtNtN Engine category and Boomer_Ang.
 */
export const INTENT_MAP: IntentMapping[] = [
  // Frontend Frameworks
  {
    keywords: ['react', 'next', 'nextjs', 'next.js', 'vue', 'nuxt', 'svelte', 'sveltekit', 'angular', 'astro', 'solid', 'qwik', 'web component'],
    category: 'frontend_frameworks',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Animation & Motion
  {
    keywords: ['animate', 'animation', 'motion', 'framer', 'gsap', 'greensock', 'lottie', 'rive', 'spring', 'transition', 'effect', 'kinetic'],
    category: 'animation_motion',
    technique_group: 'micro_interactions',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Styling Systems
  {
    keywords: ['style', 'theme', 'dark mode', 'light mode', 'tailwind', 'css', 'sass', 'scss', 'color', 'typography', 'font', 'gradient', 'design token'],
    category: 'styling_systems',
    primary_boomer_ang: 'Picker_Ang',
  },

  // 3D & Visual
  {
    keywords: ['3d', 'three', 'threejs', 'three.js', 'webgl', 'webgpu', 'babylon', 'spline', 'scene', 'orbit', 'shader', 'glsl', 'gltf', 'model'],
    category: '3d_visual',
    technique_group: '3d_immersive',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Scroll & Interaction
  {
    keywords: ['scroll', 'parallax', 'reveal', 'scrollytelling', 'sticky', 'snap', 'horizontal scroll', 'smooth scroll', 'lenis', 'locomotive'],
    category: 'scroll_interaction',
    technique_group: 'scroll',
    primary_boomer_ang: 'Picker_Ang',
  },

  // UI Component Systems
  {
    keywords: ['component', 'button', 'form', 'modal', 'dialog', 'table', 'card', 'input', 'select', 'dropdown', 'menu', 'tab', 'accordion', 'shadcn', 'radix', 'headless'],
    category: 'ui_components',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Layout & Responsive
  {
    keywords: ['layout', 'grid', 'flexbox', 'responsive', 'mobile', 'adaptive', 'container query', 'bento', 'masonry', 'fluid', 'breakpoint'],
    category: 'layout_responsive',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Backend & Fullstack
  {
    keywords: ['api', 'backend', 'server', 'database', 'auth', 'authentication', 'express', 'fastapi', 'django', 'graphql', 'trpc', 'rest', 'endpoint'],
    category: 'backend_fullstack',
    primary_boomer_ang: 'Picker_Ang',
    fallback_boomer_ang: 'Patchsmith_Ang',
  },

  // CMS & Content
  {
    keywords: ['cms', 'content', 'blog', 'article', 'post', 'sanity', 'strapi', 'contentful', 'mdx', 'markdown', 'headless cms'],
    category: 'cms_content',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Deployment & Infra
  {
    keywords: ['deploy', 'host', 'hosting', 'docker', 'vercel', 'netlify', 'cloud', 'server', 'vps', 'ci', 'cd', 'pipeline', 'ssl', 'domain'],
    category: 'deployment_infra',
    primary_boomer_ang: 'Picker_Ang',
    fallback_boomer_ang: 'Forge_Ang',
  },

  // Hover & Interaction (technique-level)
  {
    keywords: ['hover', 'cursor', 'tilt', 'magnetic', 'drag', 'gesture', 'swipe', 'pinch', 'ripple', 'tooltip'],
    category: 'animation_motion',
    technique_group: 'hover_interaction',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Text & Typography (technique-level)
  {
    keywords: ['typewriter', 'text reveal', 'split text', 'counter', 'ticker', 'marquee', 'scramble', 'decode', 'kinetic type'],
    category: 'animation_motion',
    technique_group: 'text_typography',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Visual Effects (technique-level)
  {
    keywords: ['particle', 'grain', 'noise', 'glass', 'glassmorphism', 'blur', 'glow', 'bloom', 'blob', 'morph', 'aurora', 'matrix', 'fluid', 'liquid'],
    category: 'animation_motion',
    technique_group: 'visual_effects',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Page Transitions (technique-level)
  {
    keywords: ['page transition', 'route transition', 'view transition', 'crossfade', 'slide transition', 'shared element', 'skeleton', 'shimmer', 'loading'],
    category: 'animation_motion',
    technique_group: 'page_transitions',
    primary_boomer_ang: 'Picker_Ang',
  },

  // Data Visualization
  {
    keywords: ['chart', 'graph', 'data viz', 'visualization', 'd3', 'recharts', 'dashboard', 'kpi', 'metric', 'analytics'],
    category: '3d_visual',
    primary_boomer_ang: 'Picker_Ang',
  },
];

// ---------------------------------------------------------------------------
// Build Intent Detection
// ---------------------------------------------------------------------------

export const BUILD_INTENT_TRIGGERS = [
  'build', 'create', 'make', 'design', 'develop', 'code', 'scaffold',
  'generate', 'launch', 'set up', 'implement', 'construct', 'prototype',
  'wireframe', 'mockup', 'layout',
] as const;

export const BUILD_CONTEXT_TARGETS = [
  'website', 'page', 'app', 'application', 'dashboard', 'landing',
  'portfolio', 'site', 'interface', 'ui', 'frontend', 'component',
  'section', 'hero', 'form', 'panel', 'screen', 'view', 'layout',
] as const;

/**
 * Determines whether a user message contains a creative build intent
 * that should activate the NtNtN Engine routing.
 */
export function detectBuildIntent(message: string): boolean {
  const lower = message.toLowerCase();
  const hasTrigger = BUILD_INTENT_TRIGGERS.some((t) => lower.includes(t));
  const hasTarget = BUILD_CONTEXT_TARGETS.some((t) => lower.includes(t));
  return hasTrigger && hasTarget;
}

/**
 * Given a user message with build intent, returns the matched NtNtN categories
 * and technique groups, sorted by relevance (number of keyword hits).
 */
export function classifyBuildIntent(message: string): IntentMapping[] {
  const lower = message.toLowerCase();

  const scored = INTENT_MAP.map((mapping) => {
    const hits = mapping.keywords.filter((kw) => lower.includes(kw)).length;
    return { mapping, hits };
  });

  return scored
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(({ mapping }) => mapping);
}

// ---------------------------------------------------------------------------
// Stack Recommendation Types
// ---------------------------------------------------------------------------

export interface StackRecommendation {
  recommendation_id: string;
  creative_intent: string;
  primary_stack: {
    framework: string;
    styling: string;
    animation: string;
  };
  supplementary: Array<{
    tool: string;
    reason: string;
  }>;
  techniques: Array<{
    id: string;
    category: TechniqueGroup;
    library: string;
  }>;
  compatibility_check: 'PASS' | 'FAIL';
  estimated_bundle_kb: number;
  notes: string;
}

export interface BuildManifest {
  manifest_id: string;
  recommendation_id: string;
  build_name: string;
  phases: Array<{
    phase: number;
    name: string;
    tasks: Array<{
      task: string;
      lil_hawk: string;
    }>;
    gate: 'all_pass' | 'one_pass';
  }>;
  total_estimated_cost_usd: number;
  timeout_seconds: number;
}

// ---------------------------------------------------------------------------
// A.I.M.S. Default Stack
// ---------------------------------------------------------------------------

export const AIMS_DEFAULT_STACK = {
  framework: 'Next.js 15 (App Router)',
  styling: 'Tailwind CSS v4',
  animation: 'Motion (Framer Motion v12+)',
  ui_components: 'shadcn/ui (Radix + Tailwind)',
  state: 'React Server Components + Zustand',
  deployment: 'Docker Compose on VPS',
} as const;

// ---------------------------------------------------------------------------
// Execution Pipeline Types
// ---------------------------------------------------------------------------

export type ExecutionPillar = 'image' | 'interface' | 'integrations';

export type ScopeTier = 'component' | 'page' | 'application' | 'platform';

export type BuildPhase =
  | 'intake'
  | 'image'
  | 'interface'
  | 'integrations'
  | 'verification'
  | 'sign';

export interface ExecutionPipelineStatus {
  manifest_id: string;
  scope_tier: ScopeTier;
  current_phase: BuildPhase;
  pillars: {
    image: 'not_started' | 'in_progress' | 'complete' | 'skipped';
    interface: 'not_started' | 'in_progress' | 'complete';
    integrations: 'not_started' | 'in_progress' | 'complete' | 'skipped';
  };
  preview_url: string | null;
  live_url: string | null;
  signed: boolean;
}

// ---------------------------------------------------------------------------
// Scope Tier Detection
// ---------------------------------------------------------------------------

/**
 * Determines the build scope tier based on the user's description.
 * This informs which execution pipeline phases to activate.
 */
export function detectScopeTier(message: string): ScopeTier {
  const lower = message.toLowerCase();

  const platformKeywords = ['saas', 'platform', 'multi-tenant', 'enterprise', 'admin panel', 'team management', 'billing'];
  const appKeywords = ['app', 'application', 'auth', 'login', 'database', 'api', 'user accounts', 'checkout', 'e-commerce'];
  const pageKeywords = ['page', 'landing', 'portfolio', 'homepage', 'hero', 'section'];
  const componentKeywords = ['component', 'button', 'card', 'table', 'form', 'modal', 'widget'];

  if (platformKeywords.some((kw) => lower.includes(kw))) return 'platform';
  if (appKeywords.some((kw) => lower.includes(kw))) return 'application';
  if (pageKeywords.some((kw) => lower.includes(kw))) return 'page';
  if (componentKeywords.some((kw) => lower.includes(kw))) return 'component';

  return 'page'; // Default to page-level builds
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
  categories: NTNTN_CATEGORIES,
  techniqueGroups: TECHNIQUE_GROUPS,
  intentMap: INTENT_MAP,
  buildIntentTriggers: BUILD_INTENT_TRIGGERS,
  buildContextTargets: BUILD_CONTEXT_TARGETS,
  detectBuildIntent,
  classifyBuildIntent,
  detectScopeTier,
  defaultStack: AIMS_DEFAULT_STACK,
};
