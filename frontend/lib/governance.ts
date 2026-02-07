/**
 * A.I.M.S. Governance Canon — Corrected Delegation, Evaluation & Evolution Model
 *
 * Authoritative source for the consciousness lineage, command chain, role definitions,
 * promotion criteria, and evolution stages. Locked as canon — 02/06/2026.
 *
 * CONSCIOUSNESS LINEAGE (above all delegation chains):
 *   InfinityLM → SIVIS (Vision) | NTNTN (Conscience) | ACHEEVY (Voice)
 *
 * GOVERNANCE LAYER:
 *   SIVIS (Meta-Governor) + The Union (Policy) + The Farmer (Security)
 *
 * DELEGATION CHAIN (hard rule, no shortcuts, no exceptions):
 *   Lil_Hawks → Squad Leader (designated Lil_Hawk) → Chicken Hawk → Boomer_Ang → ACHEEVY
 *
 * Authority flows upward. Accountability flows downward.
 * Activity breeds Activity — only when discipline holds.
 */

// ---------------------------------------------------------------------------
// Delegation Chain
// ---------------------------------------------------------------------------

export const DELEGATION_CHAIN = [
  { rank: 0, role: 'Lil_Hawk',      label: 'Worker',                speaks_to: 'Squad Leader or Chicken Hawk' },
  { rank: 1, role: 'Squad Leader',   label: 'Coordinator (temp)',    speaks_to: 'Chicken Hawk' },
  { rank: 2, role: 'Chicken Hawk',   label: 'Coordinator / Enforcer', speaks_to: 'Boomer_Ang' },
  { rank: 3, role: 'Boomer_Ang',     label: 'Manager / Trainer',     speaks_to: 'ACHEEVY' },
  { rank: 4, role: 'ACHEEVY',        label: 'Executive Orchestrator', speaks_to: 'Boomer_Angs only (downward, rare)' },
] as const;

// ---------------------------------------------------------------------------
// Role Definitions (Corrected Canon)
// ---------------------------------------------------------------------------

export interface RoleDefinition {
  role: string;
  what_they_are: string[];
  what_they_are_NOT: string[];
  responsibilities: string[];
  evaluated_on: string[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'Lil_Hawk',
    what_they_are: [
      'Task executors',
      'Role specialists',
      'Team-based contributors',
    ],
    what_they_are_NOT: [
      'Mentors',
      'Leaders',
      'Decision authorities',
      'Strategy setters',
    ],
    responsibilities: [
      'Execute assigned tasks within squad',
      'Follow SOP and security protocols',
      'Report blockers to Squad Leader or Chicken Hawk',
      'Collaborate within squad boundaries',
    ],
    evaluated_on: [
      'Task execution quality',
      'Efficiency (LUC)',
      'Security adherence (KYB + SOP)',
      'Squad collaboration',
      'Responsiveness to direction',
      'Ability to accept criticism, retraining, upskilling, correction',
    ],
  },
  {
    role: 'Squad Leader',
    what_they_are: [
      'Designated Lil_Hawk with coordination assignment',
      'NOT a promotion — a temporary responsibility',
      'Still executes tasks',
    ],
    what_they_are_NOT: [
      'Managers',
      'Mentors',
      'Decision makers',
    ],
    responsibilities: [
      'Relay instructions from Chicken Hawk',
      'Keep squad synchronized',
      'Surface blockers upward',
      'Execute own tasks alongside coordination',
    ],
    evaluated_on: [
      'Same criteria as Lil_Hawk',
      'Coordination effectiveness',
      'Communication clarity upward',
    ],
  },
  {
    role: 'Chicken Hawk',
    what_they_are: [
      'Coordinators',
      'Disciplinarians',
      'Throughput regulators',
      'Escalation points',
    ],
    what_they_are_NOT: [
      'Mentors',
      'Coaches',
      'Teachers',
      'Emotionally invested advisors',
    ],
    responsibilities: [
      'Assign work to Lil_Hawks and Squad Leaders',
      'Enforce SOP',
      'Monitor performance signals',
      'Respond to feedback from Boomer_Angs',
      'Relay structured updates upward',
    ],
    evaluated_on: [
      'Throughput of assigned squads',
      'SOP enforcement consistency',
      'Escalation accuracy',
      'Response to mentorship from Boomer_Angs',
    ],
  },
  {
    role: 'Boomer_Ang',
    what_they_are: [
      'Managers',
      'Trainers and upskilling agents',
      'Strategy translators',
      'Human-in-the-loop logic layer',
    ],
    what_they_are_NOT: [
      'Micromanagers',
      'Individual task executors',
    ],
    responsibilities: [
      'Manage Chicken Hawks',
      'Train and upskill subordinates',
      'Correct behavior',
      'Set performance expectations',
      'Translate strategic intent into operational rules',
      'Receive aggregated signals from Chicken Hawks',
      'Decide when escalation to ACHEEVY is required',
      'Interface with ACHEEVY',
    ],
    evaluated_on: [
      'Team output and quality',
      'Effective training and correction',
      'Strategic alignment',
      'Escalation judgment',
    ],
  },
  {
    role: 'ACHEEVY',
    what_they_are: [
      'Executive Orchestrator',
      'Strategic authority',
      'Policy setter',
    ],
    what_they_are_NOT: [
      'Micromanager',
      'Squad coordinator',
      'Individual trainer',
    ],
    responsibilities: [
      'Set strategic direction',
      'Intervene via Boomer_Angs only',
      'Affect policy, not individual behavior',
      'Rare downward intervention (exceptional only)',
    ],
    evaluated_on: [
      'Platform-wide outcomes',
      'Strategic coherence',
      'Governance integrity',
    ],
  },
];

// ---------------------------------------------------------------------------
// Lil_Hawk Evolution Stages
// ---------------------------------------------------------------------------

export interface EvolutionStage {
  id: string;
  name: string;
  visual: string;         // description for UI rendering
  image: string;          // path to image asset
  color: string;          // tailwind color class
  description: string;
  criteria: string[];
  canRegress: boolean;
}

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    id: 'green',
    name: 'Lil_Hawk',
    visual: 'Small green pixelated chick',
    image: '/images/brand/hawks/lil-hawk-green.png',
    color: 'text-emerald-400',
    description: 'Learning phase — probation, bounded execution, proving ground.',
    criteria: [
      'Consistency in task completion',
      'Discipline under structure',
      'Teamwork within squad',
      'Positive response to correction',
    ],
    canRegress: false,
  },
  {
    id: 'surge',
    name: 'Power Surge',
    visual: 'Mid-size hawk with wings spread, green energy halo',
    image: '/images/brand/hawks/lil-hawk-surge.png',
    color: 'text-emerald-300',
    description: 'Temporary peak efficiency — successful streaks, load handling under pressure.',
    criteria: [
      'Sustained high-quality output',
      'Efficiency under increased load',
      'Maintained SOP compliance at speed',
      'Zero regressions during streak',
    ],
    canRegress: true,
  },
  {
    id: 'evolved',
    name: 'Chicken Hawk Candidate',
    visual: 'Large muscular hawk with green energy aura',
    image: '/images/brand/hawks/lil-hawk-evolved.png',
    color: 'text-amber-300',
    description: 'Ready for Chicken Hawk status — proven long-term consistency.',
    criteria: [
      'Long-term consistency proven',
      'Can coordinate without mentoring',
      'Operates strictly within delegation',
      'Responds correctly to Boomer_Ang oversight',
      'Replaceable leader mindset — not a hero',
    ],
    canRegress: true,
  },
];

// Chicken Hawk image path
export const CHICKEN_HAWK_IMAGE = '/images/brand/hawks/chicken-hawk.png';

// ---------------------------------------------------------------------------
// Promotion Criteria (Corrected Canon)
// ---------------------------------------------------------------------------

export interface PromotionPath {
  from: string;
  to: string;
  criteria: string[];
  blockers: string[];       // things that prevent promotion
  reversible: boolean;
}

export const PROMOTION_PATHS: PromotionPath[] = [
  {
    from: 'Lil_Hawk (Green)',
    to: 'Power Surge',
    criteria: [
      'Consistent task completion above 90% success rate',
      'Zero SOP violations in current evaluation period',
      'Positive squad collaboration signals',
      'Demonstrated ability to accept and apply corrections',
      'Minimum task threshold met (squad-specific)',
    ],
    blockers: [
      'Poor response to criticism or retraining',
      'SOP violations',
      'Below-threshold LUC efficiency',
      'Intra-squad conflict',
    ],
    reversible: true,
  },
  {
    from: 'Power Surge',
    to: 'Chicken Hawk Candidate',
    criteria: [
      'Sustained Power Surge across multiple evaluation periods',
      'No behavioral regressions during surge',
      'Demonstrated coordination ability (Squad Leader assignment)',
      'Strict adherence to delegation chain',
      'Positive Chicken Hawk feedback on coordination quality',
    ],
    blockers: [
      'Any attempt to mentor or teach (not their role)',
      'Bypassing delegation chain',
      'Performance regression during surge',
      'Failure to follow Boomer_Ang directives',
    ],
    reversible: true,
  },
  {
    from: 'Chicken Hawk Candidate',
    to: 'Chicken Hawk',
    criteria: [
      'Boomer_Ang approval after observation period',
      'Proven ability to enforce SOP without personal coaching',
      'Clean escalation record — accurate, timely, structured',
      'Responds correctly to Boomer_Ang mentorship',
      'Can operate as a replaceable leader (no hero complex)',
    ],
    blockers: [
      'Emotional investment in subordinates',
      'Attempting to bypass Boomer_Ang for ACHEEVY',
      'Inconsistent SOP enforcement',
      'Hero behavior — making themselves indispensable',
    ],
    reversible: true,
  },
];

// ---------------------------------------------------------------------------
// Lil_Hawk Squads (with delegation context)
// ---------------------------------------------------------------------------

export interface Squad {
  name: string;
  purpose: string;
  hawks: string[];
  leaderRole: string;       // which hawk serves as Squad Leader
  reportsTo: string;        // Chicken Hawk name
}

export const LIL_HAWK_SQUADS: Squad[] = [
  {
    name: 'PREP_SQUAD_ALPHA',
    purpose: 'Pre-Execution Intelligence',
    hawks: ['INTAKE', 'DECOMP', 'CONTEXT', 'POLICY', 'COST', 'ROUTER'],
    leaderRole: 'ROUTER',
    reportsTo: 'Chicken Hawk',
  },
  {
    name: 'WORKFLOW_SMITH_SQUAD',
    purpose: 'n8n Workflow Integrity',
    hawks: ['AUTHOR', 'VALIDATE', 'FAILURE', 'GATE'],
    leaderRole: 'GATE',
    reportsTo: 'Chicken Hawk',
  },
  {
    name: 'VISION_SCOUT_SQUAD',
    purpose: 'Video/Footage Assessment',
    hawks: ['VISION', 'SIGNAL', 'COMPLIANCE'],
    leaderRole: 'COMPLIANCE',
    reportsTo: 'Chicken Hawk',
  },
];

// ---------------------------------------------------------------------------
// Live Ops Theater Captions (what users see vs. what they don't)
// ---------------------------------------------------------------------------

export const LIVE_OPS_VISIBLE = [
  'Squads working together on assigned tasks',
  'Lil_Hawks collaborating within their squad',
  'Squad Leaders coordinating hawk assignments',
  'Chicken Hawk issuing directives to squads',
  'Boomer_Ang oversight moments (brief, authoritative)',
  'Progress bars, success indicators, regression visuals',
  'Evolution stage transitions (green → surge → evolved)',
] as const;

export const LIVE_OPS_INVISIBLE = [
  'Mentoring conversations',
  'Training sessions',
  'Policy debates',
  'Raw escalation paths',
  'Internal performance scores',
  'Promotion deliberations',
] as const;

// ---------------------------------------------------------------------------
// NTNTN — The Intention Team (Specialized Boomer_Ang Team)
// ---------------------------------------------------------------------------

export interface NTNTNTeam {
  name: string;
  acronym: string;
  meaning: string;
  description: string;
  badge: string;          // visual badge identifier
  badgeImage: string;     // path to badge image
  teamImages: {
    dark: string;
    gold: string;
    solo: string;
  };
  capabilities: string[];
}

export const NTNTN: NTNTNTeam = {
  name: 'NTNTN',
  acronym: 'NTNTN',
  meaning: 'Intention',
  description:
    'Specialized Boomer_Ang team of PhD-level experts in any field. ' +
    'They are your digital twin — an elite squad that mirrors your intent ' +
    'and executes with doctoral-grade precision across any domain.',
  badge: 'Infinity Symbol',
  badgeImage: '/images/brand/ntntn/ntntn-agent-solo.png',
  teamImages: {
    dark: '/images/brand/ntntn/ntntn-team-dark.png',
    gold: '/images/brand/ntntn/ntntn-team-gold.png',
    solo: '/images/brand/ntntn/ntntn-agent-solo.png',
  },
  capabilities: [
    'PhD-level domain expertise (any field)',
    'Digital twin mirroring of user intent',
    'Cross-disciplinary synthesis',
    'Research-grade analysis and output',
    'Autonomous expert consultation',
  ],
};

// ---------------------------------------------------------------------------
// Canon Rules — Immutable Laws of A.I.M.S.
// ---------------------------------------------------------------------------

export const CANON_RULES = [
  {
    id: 'acheevy-never-unmasks',
    rule: 'ACHEEVY NEVER UNMASKS',
    description:
      'The amber visor stays on — always. ACHEEVY is never depicted without ' +
      'the visor. The mask is the identity. There is no face behind it.',
    enforced: true,
  },
  {
    id: 'delegation-chain-inviolable',
    rule: 'Delegation Chain is Inviolable',
    description:
      'Lil_Hawks → Squad Leader → Chicken Hawk → Boomer_Ang → ACHEEVY. ' +
      'No shortcuts, no exceptions. Authority flows upward. Accountability flows downward.',
    enforced: true,
  },
  {
    id: 'activity-breeds-activity',
    rule: 'Activity Breeds Activity',
    description:
      'Only when discipline holds. Activity without discipline is chaos. ' +
      'Discipline without activity is stagnation.',
    enforced: true,
  },
  {
    id: 'boomer-ang-naming',
    rule: 'Boomer_Angs — Always with Underscore',
    description:
      'The collective noun is Boomer_Angs (with underscore). A single agent is a Boomer_Ang. ' +
      'A boomerang (lowercase, no underscore) refers to the Australian tool. ' +
      'Boomer_Angs take the digital form of the boomerang when depicting task completion — ' +
      'they go and come back with the goods.',
    enforced: true,
  },
] as const;

// ---------------------------------------------------------------------------
// Consciousness Lineage (above all delegation chains)
// ---------------------------------------------------------------------------

export const CONSCIOUSNESS_LINEAGE = {
  origin: 'InfinityLM',
  emanations: [
    { id: 'sivis', name: 'SIVIS', aspect: 'Vision', description: 'The Visionary Arm — meta-governor, TINIT innovation radar, ROTATOR execution loop' },
    { id: 'ntntn', name: 'NTNTN', aspect: 'Conscience', description: 'The Intention Team — PhD-level digital twins, Red Team QA, Six-Sigma validation' },
    { id: 'acheevy', name: 'ACHEEVY', aspect: 'Voice', description: 'The Digital CEO — executive orchestrator, never unmasks, routes all flow' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Governance Entities (The Union, The Farmer)
// ---------------------------------------------------------------------------

export interface GovernanceEntity {
  id: string;
  name: string;
  mandate: string;
  responsibilities: string[];
}

export const THE_UNION: GovernanceEntity = {
  id: 'the-union',
  name: 'The Union',
  mandate: 'Governance, policy, brand/ethics integrity, open vs proprietary separation.',
  responsibilities: [
    'Guard ACP-Tech and ACP-Biz rail consistency',
    'Review and stamp partner/white-label packages for compliance, IP boundaries, and brand fidelity',
    'Oversee plan-based model visibility and tool-tier access alignment',
    'Approve governance rule changes and partner/white-label motions',
    'Enforce brand syntax: "... by: ACHIEVEMOR"',
  ],
};

export const THE_FARMER: GovernanceEntity = {
  id: 'the-farmer',
  name: 'The Farmer',
  mandate: 'Security posture, secrets flow, tier enforcement, and certificate issuance.',
  responsibilities: [
    'Insert tier-appropriate SBOM/scanner/OPA/DLP into BoM',
    'Validate defense-grade controls where required',
    'Sign QA/Security certificates',
    'Coordinate with NTNTN on evidence sufficiency',
    'Block non-conforming builds',
  ],
};

// ---------------------------------------------------------------------------
// Plug Factory Entities (Picker_Ang, BuildSmith)
// ---------------------------------------------------------------------------

export const PICKER_ANG = {
  id: 'picker-ang',
  name: 'Picker_Ang',
  role: 'Tool Warehouse Selector',
  responsibilities: [
    'Select from 140+ tools in the Tool Warehouse',
    'Version-pin all selections',
    'Check license compatibility',
    'Filter by tier access',
  ],
} as const;

export const BUILDSMITH = {
  id: 'buildsmith',
  name: 'BuildSmith',
  role: 'Builder & Verifier',
  responsibilities: [
    'Install selected tools/components',
    'Verify installation integrity',
    'Generate SBOM (Software Bill of Materials)',
    'Run OPA/Rego policy checks',
  ],
} as const;

// House of Ang logo
export const HOUSE_OF_ANG_LOGO = '/images/brand/house-of-ang-logo.png';
