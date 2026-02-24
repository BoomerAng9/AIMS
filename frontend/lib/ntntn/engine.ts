/**
 * NtNtN Engine — Client-side Creative Development Classification
 *
 * Mirrors the core detection/classification logic from aims-skills/ntntn-engine
 * for instant client-side feedback in the Creative Studio UI.
 *
 * Connected Agents:
 *   - Picker_Ang: Selects components and techniques from the library
 *   - Buildsmith: Constructs the end product from selections
 */

// ---------------------------------------------------------------------------
// Category & Technique Definitions
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
// Types
// ---------------------------------------------------------------------------

export type ScopeTier = 'component' | 'page' | 'application' | 'platform';
export type BuildPhase = 'intake' | 'image' | 'interface' | 'integrations' | 'verification' | 'sign';
export type PillarStatus = 'not_started' | 'in_progress' | 'complete' | 'skipped';

export interface IntentMapping {
  keywords: string[];
  category: NtNtNCategory;
  technique_group?: TechniqueGroup;
  primary_boomer_ang: 'Picker_Ang' | 'Buildsmith';
  fallback_boomer_ang?: string;
  keywordHits?: number;
}

export interface StackRecommendation {
  recommendation_id: string;
  creative_intent: string;
  primary_stack: {
    framework: string;
    styling: string;
    animation: string;
  };
  supplementary: Array<{ tool: string; reason: string }>;
  techniques: Array<{ id: string; category: TechniqueGroup; library: string }>;
  compatibility_check: 'PASS' | 'FAIL';
  estimated_bundle_kb: number;
  notes: string;
}

export interface BuildManifest {
  manifest_id: string;
  recommendation_id: string;
  build_name: string;
  creative_brief: {
    purpose: string;
    mood: string;
    features: string[];
    audience: string;
  };
  scope_tier: ScopeTier;
  stack_recommendation: {
    framework: string;
    styling: string;
    animation: string;
    ui_components: string;
  };
  pillars: {
    image: PillarStatus;
    interface: PillarStatus;
    integrations: PillarStatus;
  };
  current_phase: BuildPhase;
  luc_budget: {
    estimated_cost_usd: number;
    actual_cost_usd: number;
  };
  preview_url: string | null;
  live_url: string | null;
  signed: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// AIMS Default Stack
// ---------------------------------------------------------------------------

export const AIMS_DEFAULT_STACK = {
  framework: 'Next.js 16 (App Router)',
  styling: 'Tailwind CSS v4',
  animation: 'Motion v12',
  ui_components: 'shadcn/ui (Radix UI)',
  state: 'React Server Components + Zustand',
  deployment: 'Docker Compose on VPS',
} as const;

// ---------------------------------------------------------------------------
// Intent Mapping (mirrors aims-skills/ntntn-engine/index.ts)
// ---------------------------------------------------------------------------

export const INTENT_MAP: IntentMapping[] = [
  {
    keywords: ['react', 'next', 'nextjs', 'next.js', 'vue', 'nuxt', 'svelte', 'sveltekit', 'angular', 'astro', 'solid', 'qwik', 'web component'],
    category: 'frontend_frameworks',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['animate', 'animation', 'motion', 'framer', 'gsap', 'greensock', 'lottie', 'rive', 'spring', 'transition', 'effect', 'kinetic'],
    category: 'animation_motion',
    technique_group: 'micro_interactions',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['style', 'theme', 'dark mode', 'light mode', 'tailwind', 'css', 'sass', 'scss', 'color', 'typography', 'font', 'gradient', 'design token'],
    category: 'styling_systems',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['3d', 'three', 'threejs', 'three.js', 'webgl', 'webgpu', 'babylon', 'spline', 'scene', 'orbit', 'shader', 'glsl', 'gltf', 'model'],
    category: '3d_visual',
    technique_group: '3d_immersive',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['scroll', 'parallax', 'reveal', 'scrollytelling', 'sticky', 'snap', 'horizontal scroll', 'smooth scroll', 'lenis', 'locomotive'],
    category: 'scroll_interaction',
    technique_group: 'scroll',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['component', 'button', 'form', 'modal', 'dialog', 'table', 'card', 'input', 'select', 'dropdown', 'menu', 'tab', 'accordion', 'shadcn', 'radix', 'headless'],
    category: 'ui_components',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['layout', 'grid', 'flexbox', 'responsive', 'mobile', 'adaptive', 'container query', 'bento', 'masonry', 'fluid', 'breakpoint'],
    category: 'layout_responsive',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['api', 'backend', 'server', 'database', 'auth', 'authentication', 'express', 'fastapi', 'django', 'graphql', 'trpc', 'rest', 'endpoint'],
    category: 'backend_fullstack',
    primary_boomer_ang: 'Picker_Ang',
    fallback_boomer_ang: 'Patchsmith_Ang',
  },
  {
    keywords: ['cms', 'content', 'blog', 'article', 'post', 'sanity', 'strapi', 'contentful', 'mdx', 'markdown', 'headless cms'],
    category: 'cms_content',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['deploy', 'host', 'hosting', 'docker', 'vercel', 'netlify', 'cloud', 'vps', 'ci', 'cd', 'pipeline', 'ssl', 'domain'],
    category: 'deployment_infra',
    primary_boomer_ang: 'Picker_Ang',
    fallback_boomer_ang: 'Buildsmith',
  },
  {
    keywords: ['hover', 'cursor', 'tilt', 'magnetic', 'drag', 'gesture', 'swipe', 'pinch', 'ripple', 'tooltip'],
    category: 'animation_motion',
    technique_group: 'hover_interaction',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['typewriter', 'text reveal', 'split text', 'counter', 'ticker', 'marquee', 'scramble', 'decode', 'kinetic type'],
    category: 'animation_motion',
    technique_group: 'text_typography',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['particle', 'grain', 'noise', 'glass', 'glassmorphism', 'blur', 'glow', 'bloom', 'blob', 'morph', 'aurora', 'matrix', 'fluid', 'liquid'],
    category: 'animation_motion',
    technique_group: 'visual_effects',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['page transition', 'route transition', 'view transition', 'crossfade', 'slide transition', 'shared element', 'skeleton', 'shimmer', 'loading'],
    category: 'animation_motion',
    technique_group: 'page_transitions',
    primary_boomer_ang: 'Picker_Ang',
  },
  {
    keywords: ['chart', 'graph', 'data viz', 'visualization', 'd3', 'recharts', 'dashboard', 'kpi', 'metric', 'analytics'],
    category: '3d_visual',
    primary_boomer_ang: 'Picker_Ang',
  },
];

// ---------------------------------------------------------------------------
// Build Intent Detection
// ---------------------------------------------------------------------------

const BUILD_INTENT_TRIGGERS = [
  'build', 'create', 'make', 'design', 'develop', 'code', 'scaffold',
  'generate', 'launch', 'set up', 'implement', 'construct', 'prototype',
  'wireframe', 'mockup', 'layout',
];

const BUILD_CONTEXT_TARGETS = [
  'website', 'page', 'app', 'application', 'dashboard', 'landing',
  'portfolio', 'site', 'interface', 'ui', 'frontend', 'component',
  'section', 'hero', 'form', 'panel', 'screen', 'view', 'layout',
];

export function detectBuildIntent(message: string): boolean {
  const lower = message.toLowerCase();
  const hasTrigger = BUILD_INTENT_TRIGGERS.some((t) => lower.includes(t));
  const hasTarget = BUILD_CONTEXT_TARGETS.some((t) => lower.includes(t));
  return hasTrigger && hasTarget;
}

export function classifyBuildIntent(message: string): (IntentMapping & { keywordHits: number })[] {
  const lower = message.toLowerCase();
  const scored = INTENT_MAP.map((mapping) => {
    const hits = mapping.keywords.filter((kw) => lower.includes(kw)).length;
    return { ...mapping, keywordHits: hits };
  });
  return scored
    .filter(({ keywordHits }) => keywordHits > 0)
    .sort((a, b) => b.keywordHits - a.keywordHits);
}

export function detectScopeTier(message: string): ScopeTier {
  const lower = message.toLowerCase();
  const platformKw = ['saas', 'platform', 'multi-tenant', 'enterprise', 'admin panel', 'team management', 'billing'];
  const appKw = ['app', 'application', 'auth', 'login', 'database', 'api', 'user accounts', 'checkout', 'e-commerce'];
  const pageKw = ['page', 'landing', 'portfolio', 'homepage', 'hero', 'section'];
  const compKw = ['component', 'button', 'card', 'table', 'form', 'modal', 'widget'];

  if (platformKw.some((kw) => lower.includes(kw))) return 'platform';
  if (appKw.some((kw) => lower.includes(kw))) return 'application';
  if (pageKw.some((kw) => lower.includes(kw))) return 'page';
  if (compKw.some((kw) => lower.includes(kw))) return 'component';
  return 'page';
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

export const CATEGORY_LABELS: Record<NtNtNCategory, string> = {
  frontend_frameworks: 'Frameworks',
  animation_motion: 'Animation',
  styling_systems: 'Styling',
  '3d_visual': '3D & Visual',
  scroll_interaction: 'Scroll',
  ui_components: 'UI Components',
  layout_responsive: 'Layout',
  backend_fullstack: 'Backend',
  cms_content: 'CMS',
  deployment_infra: 'Deploy',
};

export const CATEGORY_COLORS: Record<NtNtNCategory, string> = {
  frontend_frameworks: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  animation_motion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  styling_systems: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  '3d_visual': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  scroll_interaction: 'bg-green-500/20 text-green-400 border-green-500/30',
  ui_components: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  layout_responsive: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  backend_fullstack: 'bg-red-500/20 text-red-400 border-red-500/30',
  cms_content: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  deployment_infra: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const SCOPE_TIER_INFO: Record<ScopeTier, { label: string; cost: string; time: string }> = {
  component: { label: 'Component', cost: '$0.25 – $0.75', time: '2–5 min' },
  page: { label: 'Page', cost: '$1 – $3', time: '5–15 min' },
  application: { label: 'Application', cost: '$3 – $8', time: '15–45 min' },
  platform: { label: 'Platform', cost: '$8 – $20', time: '45–120 min' },
};

export const BUILD_PHASE_ORDER: BuildPhase[] = ['intake', 'image', 'interface', 'integrations', 'verification', 'sign'];

export const BUILD_PHASE_LABELS: Record<BuildPhase, string> = {
  intake: 'Intake',
  image: 'Image',
  interface: 'Interface',
  integrations: 'Integrations',
  verification: 'Verify',
  sign: 'Sign',
};
