/**
 * A.I.M.S. 3-6-9 Pricing Model — Build-Your-Bill
 *
 * The 3-6-9 model follows Tesla's vortex mathematics:
 *   3 = Entry (Test)    — Validate utility
 *   6 = Balance (Lock)  — Mid-term commitment
 *   9 = Completion (V.I.B.E.) — Pay 9, get 3 free (12-month cycle)
 *   P2P = Proud to Pay  — No commitment, appreciation-based metering
 *
 * Build-Your-Bill: No two users need identical bills.
 * 7 Dimensions:
 *   Base Frequency × Group Structure × Task Multipliers × Usage Modifiers
 *   × Agent Automation × Three Pillars (Confidence · Convenience · Security)
 *
 * "Activity breeds Activity."
 */

// ---------------------------------------------------------------------------
// Dimension 1: Base Frequency (Choose One)
// ---------------------------------------------------------------------------

export type FrequencyId = 'garage' | 'community' | 'enterprise' | 'p2p';

export interface BaseTier {
  id: FrequencyId;
  name: string;
  commitmentMonths: number;   // 3, 6, 9 (delivers 12), or 0 for P2P
  deliveredMonths: number;    // what user actually gets
  monthlyPrice: number;       // per-month cost
  tokensIncluded: number;     // monthly token allocation
  overdraftBuffer: number;    // buffer before overage kicks in
  discount: string;           // human-readable discount
  models: string[];           // accessible model tiers
  agents: number;             // active agent/bot limit (0 = unlimited)
  concurrent: number;         // max concurrent agent executions
  stripePriceId: string;
}

export const BASE_TIERS: BaseTier[] = [
  {
    id: 'garage',
    name: 'Garage',
    commitmentMonths: 3,
    deliveredMonths: 3,
    monthlyPrice: 99,
    tokensIncluded: 100_000,
    overdraftBuffer: 50_000,
    discount: '0% (baseline)',
    models: ['claude-sonnet-4.5', 'gemini-2.5-pro'],
    agents: 3,
    concurrent: 1,
    stripePriceId: process.env.STRIPE_PRICE_GARAGE || '',
  },
  {
    id: 'community',
    name: 'Community',
    commitmentMonths: 6,
    deliveredMonths: 6,
    monthlyPrice: 89,
    tokensIncluded: 250_000,
    overdraftBuffer: 150_000,
    discount: '10% off monthly',
    models: ['claude-sonnet-4.5', 'claude-opus-4.6', 'gemini-2.5-pro'],
    agents: 10,
    concurrent: 5,
    stripePriceId: process.env.STRIPE_PRICE_COMMUNITY || '',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    commitmentMonths: 9,
    deliveredMonths: 12,
    monthlyPrice: 67,
    tokensIncluded: 500_000,
    overdraftBuffer: 500_000,
    discount: '33% off (pay 9 get 3 free)',
    models: ['claude-sonnet-4.5', 'claude-opus-4.6', 'gemini-2.5-pro', 'kimi-k2.5'],
    agents: 50,
    concurrent: 25,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
  },
  {
    id: 'p2p',
    name: 'P2P (Proud to Pay)',
    commitmentMonths: 0,
    deliveredMonths: 0,
    monthlyPrice: 0,
    tokensIncluded: 0,
    overdraftBuffer: 0,
    discount: 'Pay-as-you-go',
    models: ['claude-sonnet-4.5'],
    agents: 0, // unlimited — pay per execution
    concurrent: 1,
    stripePriceId: process.env.STRIPE_PRICE_P2P || '',
  },
];

// ---------------------------------------------------------------------------
// Dimension 2: Usage Modifiers
// ---------------------------------------------------------------------------

export const USAGE_MODIFIERS = {
  overageRatePer1K: 0.06,         // $0.06 per 1K tokens over limit
  p2pRatePer100Tokens: 1.00,     // 100 tokens per $1
  realTimeLucConvenience: 0.10,   // +10% convenience fee on market rate top-ups
  lucCalculator: 'included',      // always included — pre-action cost transparency
};

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
    startingPrice: 'From $499/mo',
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
    startingPrice: 'From $999/mo',
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
    startingPrice: 'From $1,499/mo',
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
