/**
 * A.I.M.S. 3-6-9 Pricing Model — Build-Your-Bill
 *
 * The 3-6-9 model follows Tesla's vortex mathematics:
 *   Pay-per-Use = No commitment, highest token markup (25%)
 *   3 months    = Entry — 20% token markup
 *   6 months    = Balance — 15% token markup
 *   9 months    = Completion — 10% token markup, receive 12 months of access
 *
 * Token pricing: Users pay our cost + markup percentage.
 * Markup decreases with longer commitments to reward loyalty.
 *
 * Free LLMs available for exploration (chat, basic tasks).
 * Opus 4.6 default for building apps — pay-per-use token rates apply.
 *
 * "Activity breeds Activity."
 */

// ---------------------------------------------------------------------------
// Dimension 1: Plan Duration (Choose One)
// ---------------------------------------------------------------------------

export type FrequencyId = '3mo' | '6mo' | '9mo' | 'p2p';

export interface BaseTier {
  id: FrequencyId;
  name: string;
  commitmentMonths: number;   // 3, 6, 9, or 0 for Pay-per-Use
  deliveredMonths: number;    // what user actually gets (9 → 12)
  monthlyPrice: number;       // per-month subscription cost
  tokensIncluded: number;     // monthly token allocation
  overdraftBuffer: number;    // buffer before overage kicks in
  tokenMarkup: number;        // markup over API cost (0.25 = 25%)
  discount: string;           // human-readable discount
  models: string[];           // accessible model tiers
  agents: number;             // active agent/bot limit (0 = pay-per-use, metered)
  concurrent: number;         // max concurrent agent executions
  stripePriceId: string;
}

export const BASE_TIERS: BaseTier[] = [
  {
    id: 'p2p',
    name: 'Pay-per-Use',
    commitmentMonths: 0,
    deliveredMonths: 0,
    monthlyPrice: 0,
    tokensIncluded: 0,
    overdraftBuffer: 0,
    tokenMarkup: 0.25,
    discount: 'No commitment — pay as you go',
    models: ['free-models', 'claude-opus-4-6', 'gemini-2.5-pro'],
    agents: 0, // metered — pay per execution, no included allocation
    concurrent: 1,
    stripePriceId: process.env.STRIPE_PRICE_P2P || '',
  },
  {
    id: '3mo',
    name: '3 Months',
    commitmentMonths: 3,
    deliveredMonths: 3,
    monthlyPrice: 19.99,
    tokensIncluded: 100_000,
    overdraftBuffer: 50_000,
    tokenMarkup: 0.20,
    discount: 'Best entry commitment',
    models: ['free-models', 'claude-opus-4-6', 'gemini-2.5-pro'],
    agents: 5,
    concurrent: 2,
    stripePriceId: process.env.STRIPE_PRICE_3MO || '',
  },
  {
    id: '6mo',
    name: '6 Months',
    commitmentMonths: 6,
    deliveredMonths: 6,
    monthlyPrice: 17.99,
    tokensIncluded: 250_000,
    overdraftBuffer: 150_000,
    tokenMarkup: 0.15,
    discount: 'Best balance of value and access',
    models: ['free-models', 'claude-opus-4-6', 'gemini-2.5-pro', 'kimi-k2.5'],
    agents: 15,
    concurrent: 5,
    stripePriceId: process.env.STRIPE_PRICE_6MO || '',
  },
  {
    id: '9mo',
    name: '9 Months',
    commitmentMonths: 9,
    deliveredMonths: 12,
    monthlyPrice: 14.99,
    tokensIncluded: 500_000,
    overdraftBuffer: 500_000,
    tokenMarkup: 0.10,
    discount: 'Best rate — pay 9, get 12',
    models: ['free-models', 'claude-opus-4-6', 'gemini-2.5-pro', 'kimi-k2.5', 'glm-4.7', 'qwen-coder'],
    agents: 50,
    concurrent: 25,
    stripePriceId: process.env.STRIPE_PRICE_9MO || '',
  },
];

// ---------------------------------------------------------------------------
// Dimension 2: Usage Modifiers
// ---------------------------------------------------------------------------

export const USAGE_MODIFIERS = {
  overageRatePer1K: 0.06,         // $0.06 per 1K tokens over limit
  realTimeLucConvenience: 0.10,   // +10% convenience fee on market rate top-ups
  lucCalculator: 'included',      // always included — pre-action cost transparency
  maintenanceFee: 5.00,           // $5.00 mandatory platform maintenance fee per invoice
  p2pTransactionFee: 0.99,        // $0.99 fee on every Pay-per-Use transaction
  savingsSplitUser: 0.70,         // 70% of these two fees go to user savings plan
  savingsSplitPlatform: 0.30,     // 30% of these two fees retained by platform
};

// Internal-only markup rates — NEVER expose to user-facing UI
// These are applied server-side in billing calculations only
// NOT exported: markup rates must stay server-side (see backend/uef-gateway/src/billing/)
const _INTERNAL_MARKUP_RATES = {
  p2p: 0.25,
  '3mo': 0.20,
  '6mo': 0.15,
  '9mo': 0.10,
} as const;

// ---------------------------------------------------------------------------
// Dimension 3: Group Structures (Add-On)
// ---------------------------------------------------------------------------

export type GroupId = 'individual' | 'family' | 'team' | 'enterprise-group';

export interface GroupStructure {
  id: GroupId;
  name: string;
  seats: string;
  multiplier: number;     // applied to base tier price
  perSeatAddon: number;   // extra per seat (0 for individual/family)
}

export const GROUP_STRUCTURES: GroupStructure[] = [
  { id: 'individual', name: 'Individual', seats: '1', multiplier: 1.0, perSeatAddon: 0 },
  { id: 'family', name: 'Family', seats: 'Up to 4', multiplier: 1.5, perSeatAddon: 0 },
  { id: 'team', name: 'Team', seats: '5–20', multiplier: 2.5, perSeatAddon: 10 },
  { id: 'enterprise-group', name: 'Enterprise', seats: '21+', multiplier: 0, perSeatAddon: 0 }, // custom contract
];

// ---------------------------------------------------------------------------
// Dimension 4: Task-Based Multipliers (Per-Action)
// ---------------------------------------------------------------------------

export type TaskTypeId =
  | 'code_gen' | 'code_review' | 'architecture'
  | 'agent_swarm' | 'security_audit' | 'deployment'
  | 'workflow_auto' | 'biz_intel' | 'full_autonomous';

export interface TaskMultiplier {
  id: TaskTypeId;
  name: string;
  multiplier: number;
  description: string;
}

export const TASK_MULTIPLIERS: TaskMultiplier[] = [
  { id: 'code_gen', name: 'Code Generation', multiplier: 1.0, description: 'Standard token consumption — baseline' },
  { id: 'code_review', name: 'Code Review', multiplier: 1.2, description: 'Contextual analysis + suggestions' },
  { id: 'workflow_auto', name: 'Workflow Automation', multiplier: 1.3, description: 'Sequential bot pipelines + triggers' },
  { id: 'security_audit', name: 'Security Audit', multiplier: 1.45, description: 'ORACLE-driven vulnerability scanning' },
  { id: 'architecture', name: 'Architecture Planning', multiplier: 1.5, description: 'Multi-system design + blueprints' },
  { id: 'biz_intel', name: 'Business Intelligence', multiplier: 1.6, description: 'Data analysis + market reports' },
  { id: 'deployment', name: 'Deployment Jobs', multiplier: 1.1, description: 'CI/CD pipeline orchestration' },
  { id: 'agent_swarm', name: 'Multi-Agent Orchestration', multiplier: 2.0, description: 'Parallel agent coordination' },
  { id: 'full_autonomous', name: 'Full Autonomous', multiplier: 3.0, description: 'Self-healing recursive agent swarm' },
];

// ---------------------------------------------------------------------------
// Dimension 5: Three Pillars — Confidence · Convenience · Security
// ---------------------------------------------------------------------------

export type PillarLevel = 'standard' | 'enhanced' | 'maximum';

export interface PillarOption {
  id: PillarLevel;
  name: string;
  addon: number;        // % addon (0 = included, 0.15 = +15%, etc.)
  features: string[];
}

export interface Pillar {
  id: 'confidence' | 'convenience' | 'security';
  name: string;
  icon: string;
  tagline: string;
  options: PillarOption[];
}

export const PILLARS: Pillar[] = [
  {
    id: 'confidence',
    name: 'Confidence Shield',
    icon: '◈',
    tagline: 'How verified and reliable your agents are',
    options: [
      {
        id: 'standard',
        name: 'Standard',
        addon: 0,
        features: [
          'Basic ORACLE pre-flight checks',
          'Community support (48h response)',
          'Standard execution monitoring',
          'Basic error recovery',
        ],
      },
      {
        id: 'enhanced',
        name: 'Verified',
        addon: 0.15,
        features: [
          'Full 7-gate ORACLE verification',
          'Priority support (4h response)',
          '99.5% uptime SLA',
          'Execution audit trail',
          'Auto-rollback on failure',
        ],
      },
      {
        id: 'maximum',
        name: 'Guaranteed',
        addon: 0.35,
        features: [
          'Enhanced ORACLE + human review loop',
          'Dedicated support (1h response)',
          '99.9% uptime SLA',
          'Execution insurance',
          'Guaranteed rollback + recovery',
          'Performance benchmarking',
        ],
      },
    ],
  },
  {
    id: 'convenience',
    name: 'Convenience Boost',
    icon: '◉',
    tagline: 'How fast and seamless your automation runs',
    options: [
      {
        id: 'standard',
        name: 'Standard',
        addon: 0,
        features: [
          'Standard execution queue',
          '15-minute scheduling interval',
          'Self-service onboarding',
          'Shared compute pool',
        ],
      },
      {
        id: 'enhanced',
        name: 'Priority',
        addon: 0.20,
        features: [
          'Priority execution queue',
          '1-minute scheduling interval',
          'Assisted onboarding',
          'Faster model routing',
          'Webhook + API triggers',
        ],
      },
      {
        id: 'maximum',
        name: 'Instant',
        addon: 0.45,
        features: [
          'Guaranteed sub-5s execution',
          'Real-time scheduling',
          'White-glove onboarding',
          'Dedicated compute allocation',
          'Custom integration support',
          'Slack/Discord live alerts',
        ],
      },
    ],
  },
  {
    id: 'security',
    name: 'Security Vault',
    icon: '◆',
    tagline: 'How protected your data and operations are',
    options: [
      {
        id: 'standard',
        name: 'Essential',
        addon: 0,
        features: [
          'Encryption at rest & in transit',
          'Basic authentication',
          'Rate limiting',
          'Standard data handling',
        ],
      },
      {
        id: 'enhanced',
        name: 'Professional',
        addon: 0.25,
        features: [
          'ORACLE 7-gate verification',
          'Role-based access control (RBAC)',
          'Full audit logging',
          'Data isolation per workspace',
          'Monthly compliance reports',
        ],
      },
      {
        id: 'maximum',
        name: 'Fortress',
        addon: 0.50,
        features: [
          'Dedicated infrastructure',
          'SOC 2 readiness package',
          'Custom security policies',
          'Zero-trust architecture',
          'Penetration testing (quarterly)',
          'GDPR / CCPA tooling',
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Dimension 6: White Label Enterprise
// ---------------------------------------------------------------------------

export type WhiteLabelMode = 'self_managed' | 'aims_managed' | 'fully_autonomous';

export interface WhiteLabelPlan {
  id: WhiteLabelMode;
  name: string;
  tagline: string;
  startingPrice: string;
  features: string[];
}

export const WHITE_LABEL_PLANS: WhiteLabelPlan[] = [
  {
    id: 'self_managed',
    name: 'Self-Managed',
    tagline: 'Your brand, your control',
    startingPrice: 'Custom Quote',
    features: [
      'Full A.I.M.S. platform under your brand',
      'Custom domain + branding (logo, colors, copy)',
      'You manage users, billing, and operations',
      'All agent types included',
      'Dedicated infrastructure',
      'API access for custom integrations',
      'SOC 2 readiness package',
    ],
  },
  {
    id: 'aims_managed',
    name: 'A.I.M.S. Managed',
    tagline: 'Hire us to run it for you',
    startingPrice: 'Custom Quote',
    features: [
      'Everything in Self-Managed',
      'Dedicated A.I.M.S. operations team',
      'Platform maintenance + updates',
      'User onboarding + support handled',
      'Monthly performance reports',
      'Custom workflow design',
      'Priority escalation path',
      '99.9% uptime SLA',
    ],
  },
  {
    id: 'fully_autonomous',
    name: 'Fully Autonomous',
    tagline: 'ACHEEVY + Boomer_Angs run it all',
    startingPrice: 'Custom Quote',
    features: [
      'Everything in A.I.M.S. Managed',
      'ACHEEVY orchestrates all operations',
      'Boomer_Angs execute tasks autonomously',
      'Chicken Hawk pipelines run 24/7',
      'Lil_Hawks handle micro-tasks continuously',
      'Self-healing agent infrastructure',
      'Autonomous scaling based on demand',
      'Human oversight only when flagged',
      'Full PMO structure deployed',
    ],
  },
];

// ---------------------------------------------------------------------------
// Bill Calculator
// ---------------------------------------------------------------------------

export interface PillarSelection {
  confidence: PillarLevel;
  convenience: PillarLevel;
  security: PillarLevel;
}

export interface BillEstimate {
  baseTier: BaseTier;
  group: GroupStructure;
  taskMix: Array<{ task: TaskMultiplier; weight: number }>;
  effectiveMultiplier: number;
  pillarAddons: { confidence: number; convenience: number; security: number; total: number };
  monthlyBase: number;
  monthlyWithGroup: number;
  monthlyBeforePillars: number;
  monthlyEstimate: number;
  commitmentTotal: number;
  tokensPerMonth: number;
  agents: number;
  concurrent: number;
}

export function calculateBill(
  tierId: FrequencyId,
  groupId: GroupId,
  seatCount: number,
  taskWeights: Partial<Record<TaskTypeId, number>>,
  pillars: PillarSelection = { confidence: 'standard', convenience: 'standard', security: 'standard' },
): BillEstimate {
  const tier = BASE_TIERS.find(t => t.id === tierId)!;
  const group = GROUP_STRUCTURES.find(g => g.id === groupId)!;

  // Build task mix
  const taskMix = TASK_MULTIPLIERS.map(t => ({
    task: t,
    weight: taskWeights[t.id] || 0,
  })).filter(m => m.weight > 0);

  // Calculate effective task multiplier (weighted average)
  const totalWeight = taskMix.reduce((s, m) => s + m.weight, 0);
  const effectiveMultiplier = totalWeight > 0
    ? taskMix.reduce((s, m) => s + (m.task.multiplier * m.weight), 0) / totalWeight
    : 1.0;

  // Base monthly price
  const monthlyBase = tier.monthlyPrice;

  // Group pricing
  const monthlyWithGroup = groupId === 'enterprise-group'
    ? 0 // custom contract
    : (monthlyBase * group.multiplier) + (group.perSeatAddon * Math.max(seatCount - 1, 0));

  // Apply task multiplier
  const monthlyBeforePillars = Math.round(monthlyWithGroup * effectiveMultiplier * 100) / 100;

  // Calculate pillar addons
  const getAddon = (pillarId: Pillar['id'], level: PillarLevel) => {
    const pillar = PILLARS.find(p => p.id === pillarId)!;
    return pillar.options.find(o => o.id === level)?.addon || 0;
  };

  const pillarAddons = {
    confidence: getAddon('confidence', pillars.confidence),
    convenience: getAddon('convenience', pillars.convenience),
    security: getAddon('security', pillars.security),
    total: 0,
  };
  pillarAddons.total = pillarAddons.confidence + pillarAddons.convenience + pillarAddons.security;

  // Final monthly estimate with pillar addons
  const monthlyEstimate = Math.round(monthlyBeforePillars * (1 + pillarAddons.total) * 100) / 100;

  // Commitment total
  const commitmentTotal = Math.round(monthlyEstimate * tier.commitmentMonths * 100) / 100;

  return {
    baseTier: tier,
    group,
    taskMix,
    effectiveMultiplier: Math.round(effectiveMultiplier * 100) / 100,
    pillarAddons,
    monthlyBase,
    monthlyWithGroup: Math.round(monthlyWithGroup * 100) / 100,
    monthlyBeforePillars,
    monthlyEstimate,
    commitmentTotal,
    tokensPerMonth: tier.tokensIncluded,
    agents: tier.agents,
    concurrent: tier.concurrent,
  };
}

// ---------------------------------------------------------------------------
// Dimension 7: Lifetime Deal (LTD) Plans — AppSumo & Marketplace Partners
// ---------------------------------------------------------------------------

export type LtdTier = 'ltd_byok' | 'ltd_platform' | 'ltd_whitelabel';

export interface LtdPlan {
  id: LtdTier;
  name: string;
  tagline: string;
  /** One-time price — displayed on AppSumo listing */
  onetimePrice: number;
  /** What the user gets forever */
  access: PlatformApp[];
  /** BYOK = user provides their own API keys (Bring Your Own Key) */
  byok: boolean;
  /** White label rights */
  whitelabel: boolean;
  features: string[];
  quotaCap: string;
  stripePriceId: string;
}

export const LTD_PLANS: LtdPlan[] = [
  {
    id: 'ltd_byok',
    name: 'LTD — Bring Your Own Key',
    tagline: 'Lifetime access, your API keys',
    onetimePrice: 149,
    access: ['perform', 'luc'],
    byok: true,
    whitelabel: false,
    features: [
      'Lifetime access to Per|Form and LUC platforms',
      'Bring your own key (OpenAI, Anthropic, Google, etc.)',
      'All agent types and workflow templates',
      'Community support',
      'Platform updates included forever',
      'No monthly fees — one-time payment',
    ],
    quotaCap: 'Usage limited by your own API key spend',
    stripePriceId: process.env.STRIPE_PRICE_LTD_BYOK || '',
  },
  {
    id: 'ltd_platform',
    name: 'LTD — Full Platform',
    tagline: 'Lifetime access, our infrastructure',
    onetimePrice: 399,
    access: ['perform', 'luc', 'marketplace'],
    byok: false,
    whitelabel: false,
    features: [
      'Everything in BYOK tier',
      'Platform-managed API keys (no BYOK needed)',
      'Pro-level quotas locked in forever',
      'Marketplace access for publishing apps',
      'Priority execution queue',
      'Priority support',
      'Future app releases included',
    ],
    quotaCap: 'Pro-level monthly quotas (locked at time of purchase)',
    stripePriceId: process.env.STRIPE_PRICE_LTD_PLATFORM || '',
  },
  {
    id: 'ltd_whitelabel',
    name: 'LTD — White Label',
    tagline: 'Your brand, our engine, forever',
    onetimePrice: 997,
    access: ['perform', 'luc', 'marketplace', 'whitelabel'],
    byok: false,
    whitelabel: true,
    features: [
      'Everything in Full Platform tier',
      'White-label rights — your brand, your domain',
      'Custom branding (logo, colors, copy)',
      'Resell to your own clients',
      'API access for custom integrations',
      'Enterprise-level quotas locked in forever',
      'SOC 2 readiness package',
      'Dedicated onboarding session',
    ],
    quotaCap: 'Enterprise-level monthly quotas (locked at time of purchase)',
    stripePriceId: process.env.STRIPE_PRICE_LTD_WHITELABEL || '',
  },
];

// ---------------------------------------------------------------------------
// Dimension 8: Platform App Partitioning
// ---------------------------------------------------------------------------

/**
 * A.I.M.S. is partitioned into discrete applications.
 * Each app is a product that can be accessed independently or bundled.
 * Subscriptions and LTDs grant access to specific apps.
 */
export type PlatformApp = 'perform' | 'luc' | 'marketplace' | 'whitelabel';

export interface PlatformAppConfig {
  id: PlatformApp;
  name: string;
  tagline: string;
  description: string;
  /** What this app does that's unique — the value-add mechanism */
  valueMechanism: string;
  /** Minimum plan tier required for access */
  minTier: string;
}

export const PLATFORM_APPS: PlatformAppConfig[] = [
  {
    id: 'perform',
    name: 'Per|Form',
    tagline: 'Autonomous Execution Engine',
    description: 'The application layer where AI agents execute tasks — code generation, workflow automation, deployments, and multi-agent orchestration.',
    valueMechanism: 'ACHEEVY + Boomer_Angs orchestrate agent swarms on top of LLM APIs. The coordination, verification (ORACLE), and pipeline logic is the value beyond raw model access.',
    minTier: 'p2p',
  },
  {
    id: 'luc',
    name: 'LUC',
    tagline: 'Ledger Usage Control',
    description: 'Real-time cost tracking, quota enforcement, and billing engine. Pre-flight gating ensures users never exceed budget.',
    valueMechanism: 'Metering + quota + savings plan infrastructure that sits between the user and every API call. Cost transparency as a product.',
    minTier: 'p2p',
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    tagline: 'App & Agent Exchange',
    description: 'Publish, discover, and trade agent templates, workflow blueprints, and automation packages built on the A.I.M.S. platform.',
    valueMechanism: 'Two-sided marketplace — creators publish agents/workflows, users buy or subscribe. Revenue share model.',
    minTier: 'data_entry',
  },
  {
    id: 'whitelabel',
    name: 'White Label',
    tagline: 'Your Brand, Our Engine',
    description: 'Deploy the full A.I.M.S. platform under your own brand with custom domain, branding, and client management.',
    valueMechanism: 'Full platform rebrand with isolated infrastructure. Resellers deploy A.I.M.S. to their own customers.',
    minTier: 'enterprise',
  },
];
