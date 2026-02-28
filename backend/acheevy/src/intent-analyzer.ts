/**
 * ACHEEVY — Intent Analyzer
 * Heuristic intent classification from natural language.
 * Runs locally without external API calls. When an LLM is configured,
 * this can be replaced with a Claude-based analyzer.
 */

import { IntentAnalysis } from './types';

// ---------------------------------------------------------------------------
// NtNtN Engine integration — creative build intent detection
// ---------------------------------------------------------------------------

export interface NtNtNClassification {
  isBuildIntent: boolean;
  scopeTier: 'component' | 'page' | 'application' | 'platform';
  matchedCategories: Array<{
    category: string;
    techniqueGroup?: string;
    primaryAng: string;
    keywordHits: number;
  }>;
}

// NtNtN intent keywords (mirrors aims-skills/ntntn-engine/index.ts)
const NTNTN_INTENT_MAP = [
  { keywords: ['react', 'next', 'nextjs', 'vue', 'nuxt', 'svelte', 'angular', 'astro', 'solid', 'qwik'], category: 'frontend_frameworks', primaryAng: 'Picker_Ang' },
  { keywords: ['animate', 'animation', 'motion', 'framer', 'gsap', 'lottie', 'rive', 'spring', 'transition', 'kinetic'], category: 'animation_motion', techniqueGroup: 'micro_interactions', primaryAng: 'Picker_Ang' },
  { keywords: ['style', 'theme', 'dark mode', 'tailwind', 'css', 'sass', 'color', 'typography', 'gradient', 'design token'], category: 'styling_systems', primaryAng: 'Picker_Ang' },
  { keywords: ['3d', 'three', 'threejs', 'webgl', 'webgpu', 'babylon', 'spline', 'shader', 'glsl', 'gltf'], category: '3d_visual', techniqueGroup: '3d_immersive', primaryAng: 'Picker_Ang' },
  { keywords: ['scroll', 'parallax', 'reveal', 'scrollytelling', 'sticky', 'snap', 'horizontal scroll', 'smooth scroll'], category: 'scroll_interaction', techniqueGroup: 'scroll', primaryAng: 'Picker_Ang' },
  { keywords: ['component', 'button', 'form', 'modal', 'dialog', 'table', 'card', 'input', 'dropdown', 'menu', 'shadcn', 'radix'], category: 'ui_components', primaryAng: 'Picker_Ang' },
  { keywords: ['layout', 'grid', 'flexbox', 'responsive', 'mobile', 'adaptive', 'bento', 'masonry'], category: 'layout_responsive', primaryAng: 'Picker_Ang' },
  { keywords: ['api', 'backend', 'server', 'database', 'auth', 'express', 'fastapi', 'graphql', 'trpc'], category: 'backend_fullstack', primaryAng: 'Picker_Ang' },
  { keywords: ['cms', 'content', 'blog', 'article', 'sanity', 'strapi', 'contentful', 'mdx'], category: 'cms_content', primaryAng: 'Picker_Ang' },
  { keywords: ['deploy', 'host', 'docker', 'netlify', 'cloud', 'vps', 'ci', 'ssl', 'domain'], category: 'deployment_infra', primaryAng: 'Picker_Ang' },
  { keywords: ['hover', 'cursor', 'tilt', 'magnetic', 'drag', 'gesture', 'swipe', 'ripple'], category: 'animation_motion', techniqueGroup: 'hover_interaction', primaryAng: 'Picker_Ang' },
  { keywords: ['typewriter', 'text reveal', 'split text', 'counter', 'ticker', 'marquee', 'scramble'], category: 'animation_motion', techniqueGroup: 'text_typography', primaryAng: 'Picker_Ang' },
  { keywords: ['particle', 'grain', 'noise', 'glass', 'glassmorphism', 'blur', 'glow', 'bloom', 'blob', 'morph', 'aurora'], category: 'animation_motion', techniqueGroup: 'visual_effects', primaryAng: 'Picker_Ang' },
  { keywords: ['page transition', 'route transition', 'view transition', 'crossfade', 'skeleton', 'shimmer'], category: 'animation_motion', techniqueGroup: 'page_transitions', primaryAng: 'Picker_Ang' },
  { keywords: ['chart', 'graph', 'data viz', 'visualization', 'd3', 'recharts', 'dashboard', 'kpi'], category: '3d_visual', primaryAng: 'Picker_Ang' },
];

const BUILD_TRIGGERS = ['build', 'create', 'make', 'design', 'develop', 'code', 'scaffold', 'generate', 'launch', 'set up', 'implement', 'construct', 'prototype', 'wireframe', 'mockup'];
const BUILD_TARGETS = ['website', 'page', 'app', 'application', 'dashboard', 'landing', 'portfolio', 'site', 'interface', 'ui', 'frontend', 'component', 'section', 'hero', 'form', 'panel', 'screen', 'view', 'layout'];

const PLATFORM_KEYWORDS = ['saas', 'platform', 'multi-tenant', 'enterprise', 'admin panel', 'billing'];
const APP_KEYWORDS = ['app', 'application', 'auth', 'login', 'database', 'api', 'user accounts', 'checkout', 'e-commerce'];
const PAGE_KEYWORDS = ['page', 'landing', 'portfolio', 'homepage', 'hero', 'section'];
const COMPONENT_KEYWORDS = ['component', 'button', 'card', 'table', 'form', 'modal', 'widget'];

/**
 * Classify a message against the NtNtN Engine taxonomy.
 * Returns matched categories, scope tier, and whether it's a build intent.
 */
export function classifyNtNtN(message: string): NtNtNClassification {
  const lower = message.toLowerCase();

  const hasTrigger = BUILD_TRIGGERS.some(t => lower.includes(t));
  const hasTarget = BUILD_TARGETS.some(t => lower.includes(t));
  const isBuildIntent = hasTrigger && hasTarget;

  // Classify categories
  const matchedCategories = NTNTN_INTENT_MAP
    .map(mapping => {
      const hits = mapping.keywords.filter(kw => lower.includes(kw)).length;
      return { ...mapping, keywordHits: hits };
    })
    .filter(m => m.keywordHits > 0)
    .sort((a, b) => b.keywordHits - a.keywordHits);

  // Determine scope tier
  let scopeTier: NtNtNClassification['scopeTier'] = 'page';
  if (PLATFORM_KEYWORDS.some(kw => lower.includes(kw))) scopeTier = 'platform';
  else if (APP_KEYWORDS.some(kw => lower.includes(kw))) scopeTier = 'application';
  else if (PAGE_KEYWORDS.some(kw => lower.includes(kw))) scopeTier = 'page';
  else if (COMPONENT_KEYWORDS.some(kw => lower.includes(kw))) scopeTier = 'component';

  return { isBuildIntent, scopeTier, matchedCategories };
}

interface PatternRule {
  patterns: RegExp[];
  intent: string;
  capabilities: string[];
  strategy: 'parallel' | 'sequential' | 'single';
}

const RULES: PatternRule[] = [
  // ── PaaS Operations (HIGHEST PRIORITY — this is what A.I.M.S. literally does) ──
  {
    patterns: [
      /spin\s*up/i, /deploy\s+(a\s+)?(tool|agent|instance|service|container)/i,
      /launch\s+(a\s+)?(tool|agent|instance|service)/i, /start\s+(an?\s+)?instance/i,
      /one\s*click\s*(deploy|setup)/i, /provision/i,
    ],
    intent: 'paas_deploy',
    capabilities: ['plug_spin_up', 'container_provisioning', 'port_allocation', 'nginx_config', 'health_check'],
    strategy: 'sequential',
  },
  {
    patterns: [
      /what.?s\s*running/i, /instance\s*status/i, /show\s*(me\s+)?(my\s+)?(instances|services|containers)/i,
      /deploy\s*dock/i, /list\s*(my\s+)?(instances|services|deployments)/i,
      /how.?s\s*(my|the)\s*(instance|service|deployment)/i,
    ],
    intent: 'paas_status',
    capabilities: ['plug_list_instances', 'plug_status', 'health_check'],
    strategy: 'single',
  },
  {
    patterns: [
      /shut\s*down/i, /stop\s+(the\s+)?(instance|service|container)/i,
      /decommission/i, /tear\s*down/i, /remove\s+(the\s+)?(instance|service)/i,
      /kill\s+(the\s+)?(instance|service|container)/i,
    ],
    intent: 'paas_decommission',
    capabilities: ['plug_decommission', 'port_release', 'cleanup'],
    strategy: 'sequential',
  },
  {
    patterns: [
      /scale\s*(up|down|out)/i, /more\s+(resources|memory|cpu)/i,
      /resize\s+(the\s+)?(instance|service|container)/i,
    ],
    intent: 'paas_scale',
    capabilities: ['plug_scale', 'resource_adjustment'],
    strategy: 'single',
  },
  {
    patterns: [
      /export/i, /self.?host/i, /ship\s*it/i, /docker\s*export/i,
      /download\s*(the\s+)?compose/i, /take\s*it\s*with\s*me/i, /give\s*me\s*(the\s+)?bundle/i,
    ],
    intent: 'paas_export',
    capabilities: ['plug_export', 'bundle_generation'],
    strategy: 'sequential',
  },
  {
    patterns: [
      /browse\s*(tools?|catalog|plugs?)/i, /what\s*(tools?|agents?|services?)\s*(are\s+)?(available|can\s+i)/i,
      /plug\s*catalog/i, /show\s*me\s*(the\s+)?(tools?|catalog)/i, /what\s*can\s*(i|you)\s*deploy/i,
    ],
    intent: 'paas_catalog',
    capabilities: ['plug_browse', 'catalog_search'],
    strategy: 'single',
  },
  {
    patterns: [
      /needs?\s*analysis/i, /assess\s*(my\s+)?needs/i, /what\s*do\s*i\s*need/i,
      /business\s*intake/i, /help\s*me\s*choose/i, /recommend\s*(tools?|services?)/i,
      /which\s*tools?/i,
    ],
    intent: 'paas_needs_analysis',
    capabilities: ['plug_needs_analysis', 'recommendation_engine'],
    strategy: 'sequential',
  },
  // Research
  {
    patterns: [/research/i, /find\s+(out|info)/i, /look\s+up/i, /investigate/i, /what\s+is/i, /who\s+is/i],
    intent: 'research',
    capabilities: ['brave_web_search', 'academic_research', 'fact_verification', 'source_citation'],
    strategy: 'single',
  },
  // Website / landing page
  {
    patterns: [/build\s+(a\s+)?(website|site|landing\s*page|web\s*page)/i, /create\s+(a\s+)?(website|site)/i, /deploy\s+(a\s+)?site/i],
    intent: 'build_website',
    capabilities: ['page_creation', 'template_deployment', 'visual_editing', 'copy_generation'],
    strategy: 'sequential',
  },
  // Code / app building
  {
    patterns: [/build\s+(a\s+)?(app|application|api|service|component)/i, /code\s+(a|an|the)/i, /write\s+(a\s+)?(function|class|module)/i, /implement/i],
    intent: 'code',
    capabilities: ['code_generation', 'sandbox_execution', 'debugging'],
    strategy: 'sequential',
  },
  // Debugging
  {
    patterns: [/debug/i, /fix\s+(this|the|a|my)/i, /error/i, /bug/i, /broken/i],
    intent: 'debug',
    capabilities: ['debugging', 'code_review'],
    strategy: 'single',
  },
  // Marketing / SEO
  {
    patterns: [/market/i, /seo/i, /campaign/i, /content\s+strateg/i, /social\s+media/i, /growth/i],
    intent: 'marketing',
    capabilities: ['seo_audit', 'copy_generation', 'campaign_flows', 'social_scheduling'],
    strategy: 'parallel',
  },
  // Content writing
  {
    patterns: [/write\s+(a\s+)?(blog|article|post|email|copy|text)/i, /generate\s+copy/i, /draft/i],
    intent: 'write_content',
    capabilities: ['copy_generation', 'seo_audit'],
    strategy: 'single',
  },
  // Voice
  {
    patterns: [/voice/i, /speak/i, /read\s+aloud/i, /text.to.speech/i, /tts/i, /transcri/i],
    intent: 'voice',
    capabilities: ['text_to_speech', 'audio_transcription'],
    strategy: 'single',
  },
  // Video / image
  {
    patterns: [/video/i, /image/i, /photo/i, /screenshot/i, /ocr/i, /visual/i],
    intent: 'media',
    capabilities: ['image_analysis', 'video_transcoding', 'ocr_extraction'],
    strategy: 'single',
  },
  // Automation / workflow
  {
    patterns: [/automat/i, /workflow/i, /schedule/i, /cron/i, /trigger/i, /webhook/i, /n8n/i],
    intent: 'automate',
    capabilities: ['workflow_creation', 'webhook_triggers', 'scheduled_tasks', 'api_integration'],
    strategy: 'sequential',
  },
  // Data / analytics
  {
    patterns: [/data/i, /analyt/i, /report/i, /chart/i, /graph/i, /dashboard/i, /visualiz/i, /pipeline/i],
    intent: 'data_pipeline',
    capabilities: ['data_extraction', 'data_transformation', 'visualization', 'report_generation'],
    strategy: 'sequential',
  },
  // Quality / audit
  {
    patterns: [/audit/i, /review/i, /verify/i, /compliance/i, /security\s+check/i, /oracle/i],
    intent: 'audit',
    capabilities: ['gate_verification', 'security_audit', 'code_review', 'compliance_check'],
    strategy: 'single',
  },
  // Multi-agent orchestration
  {
    patterns: [/orchestrat/i, /coordinate/i, /multi.?step/i, /complex\s+task/i, /decompose/i],
    intent: 'orchestrate',
    capabilities: ['task_decomposition', 'agent_spawning', 'parallel_execution', 'result_synthesis'],
    strategy: 'parallel',
  },
];

/**
 * Analyze user message and classify intent.
 */
export function analyzeIntent(message: string): IntentAnalysis {
  let bestMatch: PatternRule | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && bestScore > 0) {
    const confidence = Math.min(0.5 + bestScore * 0.15, 0.95);
    return {
      primary_intent: bestMatch.intent,
      capabilities_needed: bestMatch.capabilities,
      execution_strategy: bestMatch.strategy,
      confidence,
      requires_confirmation: confidence < 0.7,
    };
  }

  // Fallback — general chat, no specific capabilities
  return {
    primary_intent: 'chat',
    capabilities_needed: [],
    execution_strategy: 'single',
    confidence: 0.3,
    requires_confirmation: false,
  };
}
