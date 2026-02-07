/**
 * NTNTN & The Union Integration Playbook v1.0 + Enablement Pack v1.0
 *
 * Program: AI Managed Solutions (A.I.M.S.)
 * Engine: ACHEEVY (Digital CEO — Voice of InfinityLM)
 * Vision: SIVIS (Self-Intelligent Virtual Interactive System — Vision of InfinityLM)
 * Governance: NTNTN (Conscience) + The Union (Policy) + The Farmer (Security)
 *
 * Stack: Next.js 14 + Express/UEF Gateway + ORACLE 7-Gate + Boomer_Ang PMO
 * Pricing: 3-6-9 Token Model + White Label + ByteRover Optimization
 *
 * Grounded to PRD v3.0:
 *   RFP → Proposal → Quote → SoW/Tech → Build → QA/Sec → Delivery → Adoption → Growth
 *   Picker_Ang → BuildSmith, HITL gates, ICAR + ACP rails, tiered security, public-only pricing.
 *
 * Classification: Internal Canon — Governance, QA/HITL, Audit, White-Label/Partnerships
 */

// ---------------------------------------------------------------------------
// Governance Topology — Decision Rights
// ---------------------------------------------------------------------------

export interface GovernanceEntity {
  id: string;
  name: string;
  mandate: string;
  decisionRights: string[];
  duties: string[];
}

export const GOVERNANCE_TOPOLOGY: GovernanceEntity[] = [
  {
    id: 'ntntn',
    name: 'NTNTN (Intention Team)',
    mandate: 'Quality gate for content and decisions; ensure rationale is explicit, logged, and auditable (no silent updates).',
    decisionRights: [
      'Approve/Reject: Proposal, Quote, SoW/Tech, QA/Sec, Growth packs',
      'Trigger FDH refinement loops on contradictions, low confidence (<0.85), or policy tension',
      'Maintain rationale ledger & Story Baton deltas; record maker→checker→HITL outcomes',
    ],
    duties: [
      'Proposal: Test Four-Question Lens, KNR, Blue Ocean; require concrete CTQs/KPIs and audience resonance',
      'Quote: Validate public-only surfaces; confirm token pool, buffer math, overage statements; flag unrealistic promises',
      'SoW/Tech: Confirm DMAIC vs DMADV track, acceptance criteria (DoR/DoD), verification plan (DMADV adds Design/Verify)',
      'QA/Sec: Validate evidence bundle (SBOM, scans, policy checks, QA report) and Farmer certificate completeness',
      'Growth: Validate white-label/partner materials and governance fit',
    ],
  },
  {
    id: 'the-union',
    name: 'The Union',
    mandate: 'Keep the system\'s orchestration rules and brand/ethics intact; ensure clean separation of open community artifacts vs proprietary layers.',
    decisionRights: [
      'Approve/Reject: Governance rule changes; partner/white-label motions; ACP-Tech/ACP-Biz rail updates',
      'Maintain policy corpus, branding rules, cultural precision, and community-edition boundaries',
    ],
    duties: [
      'Guard ACP-Tech (technical milestones) and ACP-Biz (commercial lifecycle) consistency; ensure every material transition is logged via ICAR',
      'Review and stamp partner/white-label packages for compliance, IP boundaries, and brand fidelity',
      'Oversee plan-based model visibility and tool-tier access alignment',
    ],
  },
  {
    id: 'the-farmer',
    name: 'The Farmer',
    mandate: 'Security posture, secrets flow, tier enforcement, and certificate issuance.',
    decisionRights: [
      'Block non-conforming builds',
      'Sign QA/Security certificates',
      'Validate defense-grade controls where required',
    ],
    duties: [
      'Insert tier-appropriate SBOM/scanner/OPA/DLP into BoM; run enforcement',
      'Validate defense-grade controls where required; sign QA/Security certs',
      'Coordinate with NTNTN on evidence sufficiency',
    ],
  },
  {
    id: 'acheevy',
    name: 'ACHEEVY (Digital CEO)',
    mandate: 'Route the flow, assign Boomer_Angs, choose DMAIC/DMADV, ensure pricing, audit, and security policies are followed.',
    duties: [
      'Drive Persona Architect step; apply Four-Question Lens, KNR embedding, and Blue Ocean prompts',
      'Uphold confidence threshold and HITL sequencing',
      'Assign Boomer_Angs to engagement stages',
    ],
    decisionRights: [
      'Prime orchestrator — route all engagement flow',
      'DMAIC/DMADV track selection',
      'Boomer_Ang assignment and delegation',
    ],
  },
];

// ---------------------------------------------------------------------------
// Engagement Flow — 11 Steps (RFP → Growth)
// ---------------------------------------------------------------------------

export interface EngagementStep {
  id: string;
  name: string;
  hitlGate: boolean;
  description: string;
  blockingChecks?: string[];
}

export const ENGAGEMENT_FLOW: EngagementStep[] = [
  {
    id: 'rfp-intake',
    name: 'RFP Intake',
    hitlGate: false,
    description: 'Capture the raw request/requirement from the user or partner.',
  },
  {
    id: 'persona',
    name: 'Persona Architect',
    hitlGate: false,
    description: 'ACHEEVY drives persona creation; Four-Question Lens and KNR embedding applied.',
  },
  {
    id: 'needs-analysis',
    name: 'Needs Analysis',
    hitlGate: false,
    description: 'Deep decomposition of the requirement; SWOT folded into Four-Question Lens Q2.',
  },
  {
    id: 'proposal',
    name: 'Proposal',
    hitlGate: true,
    description: 'Proposal generation with Blue Ocean diffs, KNR citations, and audience resonance.',
    blockingChecks: [
      'Blue Ocean results present',
      'KNR embedded',
      'Four-Question Lens attached',
      'Confidence >= 0.85',
    ],
  },
  {
    id: 'quote',
    name: 'Quote',
    hitlGate: true,
    description: 'Public pricing surfaces only — plan, pool, 25% refundable buffer, overage rate.',
    blockingChecks: [
      'Public surfaces only (plan/pool/buffer/overage)',
      'Feasibility OPA checks',
      'No internal margins exposed',
    ],
  },
  {
    id: 'sow-tech',
    name: 'SoW/Tech',
    hitlGate: true,
    description: 'Statement of Work with DMAIC/DMADV declared, acceptance criteria (DoR/DoD), verification plan.',
    blockingChecks: [
      'DMAIC/DMADV correctness',
      'Acceptance criteria (DoR/DoD)',
      'Verification plan for DMADV',
    ],
  },
  {
    id: 'bom',
    name: 'BoM (Picker_Ang)',
    hitlGate: false,
    description: 'Picker_Ang selects from 140+ Tool Warehouse; BuildSmith installs, verifies, generates SBOM.',
  },
  {
    id: 'build-qa-sec',
    name: 'Build & QA/Sec',
    hitlGate: true,
    description: 'Build execution followed by quality and security verification; Farmer signs certificate.',
    blockingChecks: [
      'SBOM + scans + OPA logs + QA report complete',
      'Confidence >= 0.85',
      'No policy contradictions',
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery',
    hitlGate: false,
    description: 'Artifact delivery with receipt and adoption pack.',
  },
  {
    id: 'adoption',
    name: 'Adoption Pack',
    hitlGate: false,
    description: '5 use cases aligned to partner audience, OKRs, and 14-day KPI checks.',
  },
  {
    id: 'growth',
    name: 'Growth',
    hitlGate: true,
    description: 'White-label/partner materials, governance fit, and expansion planning.',
    blockingChecks: [
      'Brand/cultural precision',
      'Partner governance',
      'Model/tool visibility by plan',
      'IP boundaries',
    ],
  },
];

// ---------------------------------------------------------------------------
// ICAR — Audit Fabric (Intent, Context, Action, Result)
// ---------------------------------------------------------------------------

export interface ICAREntry {
  intent: string;
  context: string;
  action: string;
  result: string;
  confidence: number;
  wnx?: string;
  timestamp: string;
}

export const ICAR_RULES = [
  'ICAR captures Intent, Context, Action, Result for every step',
  'Includes confidence score, WNX reference, and timestamp',
  'No artifact or state change without ICAR and corresponding ACP entry',
  'Failure to record = automatic rollback + NTNTN review',
] as const;

// ---------------------------------------------------------------------------
// ACP Rails — Tech + Biz
// ---------------------------------------------------------------------------

export const ACP_TECH_MILESTONES = [
  'Needs Analysis',
  'SoW/Tech',
  'BoM ready',
  'QA/Sec',
] as const;

export const ACP_BIZ_MILESTONES = [
  'Proposal',
  'Quote',
  'Delivery',
  'Growth/partner',
] as const;

// ---------------------------------------------------------------------------
// HITL Gate Matrix
// ---------------------------------------------------------------------------

export interface HITLGate {
  gate: string;
  requiredApprovals: string[];
  blockingChecks: string[];
}

export const HITL_GATES: HITLGate[] = [
  {
    gate: 'Proposal',
    requiredApprovals: ['NTNTN (approve)', 'ACHEEVY (confirm)'],
    blockingChecks: [
      'Blue Ocean results present',
      'KNR embedded',
      'Four-Question Lens attached',
      'Confidence >= 0.85',
    ],
  },
  {
    gate: 'Quote',
    requiredApprovals: ['NTNTN (approve)', 'ACHEEVY (confirm)'],
    blockingChecks: [
      'Public surfaces only (plan/pool/buffer/overage)',
      'Feasibility OPA checks',
      'No internal margins exposed',
    ],
  },
  {
    gate: 'SoW/Tech',
    requiredApprovals: ['NTNTN (approve)', 'ACHEEVY (confirm)', 'The Farmer (pre-sec sign)'],
    blockingChecks: [
      'DMAIC/DMADV correctness',
      'Acceptance criteria (DoR/DoD)',
      'Verification plan for DMADV',
    ],
  },
  {
    gate: 'QA/Sec',
    requiredApprovals: ['The Farmer (sign)', 'NTNTN (approve)'],
    blockingChecks: [
      'SBOM + scans + OPA logs + QA report complete',
      'Confidence >= 0.85',
      'No policy contradictions',
    ],
  },
  {
    gate: 'Growth',
    requiredApprovals: ['The Union (approve)', 'NTNTN (approve)', 'ACHEEVY (confirm)'],
    blockingChecks: [
      'Brand/cultural precision',
      'Partner governance',
      'Model/tool visibility by plan',
      'IP boundaries',
    ],
  },
];

// ---------------------------------------------------------------------------
// Confidence & Evidence Rules
// ---------------------------------------------------------------------------

export const CONFIDENCE_THRESHOLD = 0.85;

export const EVIDENCE_BUNDLE_REQUIREMENTS = [
  'SBOM (Software Bill of Materials)',
  'Scanner outputs (vulnerability scan results)',
  'OPA/Rego logs (policy check results)',
  'QA test results',
  'The Farmer\'s signed certificate',
] as const;

// ---------------------------------------------------------------------------
// Methodologies
// ---------------------------------------------------------------------------

// Four-Question Lens + KNR
export const FOUR_QUESTION_LENS = [
  { q: 1, label: 'Raw Idea', instruction: 'Capture verbatim.' },
  { q: 2, label: 'Unclear / Risky / Missing', instruction: 'Include SWOT here — what\'s unclear, risky, or missing?' },
  { q: 3, label: 'Audience Resonance', instruction: 'Context, culture, domain fit.' },
  { q: 4, label: 'Top 0.01% SME Path', instruction: 'Decompose to specialist sub-problems + master-grade plan.' },
] as const;

export const KNR_ANCHORS = [
  { id: 'knowledge', label: 'Knowledge', instruction: 'Cite internal artifacts, test evidence, prior results.' },
  { id: 'network', label: 'Network', instruction: 'Partner systems, APIs, data providers, stakeholder alignment.' },
  { id: 'reputation', label: 'Reputation', instruction: 'Provable wins, quality signals, certificates, SLAs.' },
] as const;

// Blue Ocean
export const BLUE_OCEAN_PROMPTS = [
  { action: 'Eliminate', instruction: 'Remove low-value elements or cost centers.' },
  { action: 'Reduce', instruction: 'Reduce over-spec or unnecessary complexity.' },
  { action: 'Raise', instruction: 'Raise critical success factors.' },
  { action: 'Create', instruction: 'Create novel value propositions.' },
] as const;

// DMAIC vs DMADV
export interface MethodologyTrack {
  id: string;
  name: string;
  useCase: string;
  phases: string[];
  extraArtifacts?: string[];
}

export const METHODOLOGY_TRACKS: MethodologyTrack[] = [
  {
    id: 'dmaic',
    name: 'DMAIC',
    useCase: 'Improvements and variants of existing systems',
    phases: ['Define', 'Measure', 'Analyze', 'Improve', 'Control'],
  },
  {
    id: 'dmadv',
    name: 'DMADV',
    useCase: 'Net-new builds requiring design and verification',
    phases: ['Define', 'Measure', 'Analyze', 'Design', 'Verify'],
    extraArtifacts: ['Design blueprint', 'Verify pilot/POC criteria'],
  },
];

// ---------------------------------------------------------------------------
// Security Tiers (Farmer-Led; Union-Visible)
// ---------------------------------------------------------------------------

export interface SecurityTier {
  id: string;
  name: string;
  sbomDepth: string;
  scans: string;
  opaScope: string;
  dlp: string;
  audit: string;
}

export const SECURITY_TIERS: SecurityTier[] = [
  {
    id: 'light',
    name: 'Light',
    sbomDepth: 'Top-level dependencies',
    scans: 'Basic vulnerability scan',
    opaScope: 'Core policies',
    dlp: 'Standard',
    audit: 'Automated log',
  },
  {
    id: 'medium',
    name: 'Medium',
    sbomDepth: 'Two-level dependency tree',
    scans: 'Extended vulnerability + license scan',
    opaScope: 'Core + domain policies',
    dlp: 'Enhanced',
    audit: 'Automated + periodic review',
  },
  {
    id: 'heavy',
    name: 'Heavy',
    sbomDepth: 'Full transitive dependency tree',
    scans: 'Full vulnerability + license + secrets scan',
    opaScope: 'Comprehensive policy pack',
    dlp: 'Strict',
    audit: 'Continuous automated + quarterly review',
  },
  {
    id: 'superior',
    name: 'Superior',
    sbomDepth: 'Full tree + provenance attestation',
    scans: 'All scans + SAST/DAST',
    opaScope: 'Full pack + custom rules',
    dlp: 'Advanced with context-aware filtering',
    audit: 'Continuous + monthly review + incident response',
  },
  {
    id: 'defense-grade',
    name: 'Defense-Grade',
    sbomDepth: 'Full tree + provenance + reproducible builds',
    scans: 'All scans + SAST/DAST + fuzzing',
    opaScope: 'Real-time policy + bespoke controls',
    dlp: 'Military-grade with data classification',
    audit: 'Continuous + classified audit + real-time alerting',
  },
];

// ---------------------------------------------------------------------------
// SLAs & KPIs
// ---------------------------------------------------------------------------

export const SYSTEM_SLOS = [
  { metric: 'Proposal draft latency', target: '<=30s', note: 'cached + retrieval' },
  { metric: 'Enablement activation post-delivery', target: '~<=60s', note: 'target' },
  { metric: 'Service uptime', target: '>=99.9%', note: '' },
  { metric: 'Ethics/policy violations', target: '<=0.1%', note: 'of transactions' },
] as const;

export const GOVERNANCE_KPIS = [
  { metric: 'HITL On-Time Rate', target: '>=95%' },
  { metric: 'Evidence Bundle Completeness at QA/Sec', target: '100%' },
  { metric: 'ICAR/ACP Event Coverage', target: '100% of material actions' },
  { metric: 'DMAIC/DMADV Track Accuracy', target: '>=98%, audited by NTNTN' },
  { metric: 'Partner/White-Label Compliance', target: '100% Union-approved before distribution' },
] as const;

// ---------------------------------------------------------------------------
// RACI Matrix (across 11 Engagement Steps)
// ---------------------------------------------------------------------------

export type RACIRole = 'A' | 'R' | 'C' | 'I' | 'A/R' | 'C/A-Sec';

export interface RACIRow {
  step: string;
  acheevy: RACIRole;
  ntntn: RACIRole;
  theUnion: RACIRole;
  theFarmer: RACIRole;
  boomerAngExecs: RACIRole | string;
}

export const RACI_MATRIX: RACIRow[] = [
  { step: 'RFP Intake',       acheevy: 'A/R', ntntn: 'C',   theUnion: 'C',   theFarmer: 'C',     boomerAngExecs: 'C' },
  { step: 'Persona',          acheevy: 'A/R', ntntn: 'C',   theUnion: 'C',   theFarmer: 'I',     boomerAngExecs: 'C' },
  { step: 'Needs Analysis',   acheevy: 'A/R', ntntn: 'A/R', theUnion: 'C',   theFarmer: 'C',     boomerAngExecs: 'R' },
  { step: 'Proposal (HITL)',  acheevy: 'R',   ntntn: 'A/R', theUnion: 'C',   theFarmer: 'C',     boomerAngExecs: 'R' },
  { step: 'Quote (HITL)',     acheevy: 'R',   ntntn: 'A/R', theUnion: 'C',   theFarmer: 'C',     boomerAngExecs: 'Boomer_CFO A' },
  { step: 'SoW/Tech (HITL)',  acheevy: 'R',   ntntn: 'A/R', theUnion: 'C',   theFarmer: 'C/A-Sec', boomerAngExecs: 'Boomer_CTO/COO/CDO A' },
  { step: 'BoM (Picker_Ang)', acheevy: 'R',   ntntn: 'C',   theUnion: 'C',   theFarmer: 'C/A-Sec', boomerAngExecs: 'Boomer_CTO A' },
  { step: 'Build & QA/Sec',   acheevy: 'R',   ntntn: 'A',   theUnion: 'I',   theFarmer: 'A',     boomerAngExecs: 'R' },
  { step: 'Delivery',         acheevy: 'A/R', ntntn: 'C',   theUnion: 'C',   theFarmer: 'C',     boomerAngExecs: 'R' },
  { step: 'Adoption Pack',    acheevy: 'A/R', ntntn: 'A',   theUnion: 'C',   theFarmer: 'I',     boomerAngExecs: 'Boomer_CMO A' },
  { step: 'Growth (HITL)',    acheevy: 'R',   ntntn: 'A',   theUnion: 'A',   theFarmer: 'C',     boomerAngExecs: 'R' },
];

// ---------------------------------------------------------------------------
// Exceptions, Escalations, and Safe-Stops
// ---------------------------------------------------------------------------

export const EXCEPTION_RULES = [
  {
    trigger: 'Confidence < 0.85',
    action: 'Immediate FDH loop + NTNTN review + status to user; no material outputs.',
  },
  {
    trigger: 'Policy/Security conflict',
    action: 'Farmer blocks; Union notified; corrective path with timestamped ICAR entry.',
  },
  {
    trigger: 'Brand/Culture issue',
    action: 'Union blocks distribution; NTNTN remediates comms and artifacts.',
  },
  {
    trigger: 'Commercial mis-surface (accidental margin reveal)',
    action: 'ACP-Biz rollback; re-issue sanitized Quote.',
  },
] as const;

// ---------------------------------------------------------------------------
// Change Management & Self-Evolution
// ---------------------------------------------------------------------------

export const CHANGE_MANAGEMENT = {
  triggerSources: [
    'TTD-DR (tool/docs feed)',
    'User feedback',
    'Incident post-mortems',
    'Performance telemetry',
  ],
  process: [
    'Maker drafts change',
    'NTNTN checker critique',
    'HITL approve',
    'Union governance stamp (if policy/brand)',
    'Farmer security stamp (if controls)',
    'Story Baton + Rationale Ledger update',
  ],
  auditRule: 'ICAR records "what changed, why, expected impact."',
} as const;

// ---------------------------------------------------------------------------
// White-Label & Partnership Lifecycle (Union-Led)
// ---------------------------------------------------------------------------

export const WHITE_LABEL_LIFECYCLE = [
  { stage: 'Interest Intake', rail: 'ACP-Biz', description: 'Partner profile, use-case, required security tier(s).' },
  { stage: 'Governance Fit', owner: 'The Union', description: 'Policy fit, brand rules, cultural precision, open/proprietary boundaries.' },
  { stage: 'Commercial Terms', rail: 'ACP-Biz', description: 'Plan, pool, buffer, overage; public surfaces only.' },
  { stage: 'Technical Alignment', rail: 'ACP-Tech', description: 'Model visibility by plan; tool access tiering; performance SLOs.' },
  { stage: 'Security Alignment', owner: 'The Farmer', description: 'Tier enforcement, SBOM/OPA/DLP requirements, data residency/retention.' },
  { stage: 'Enablement Pack', owner: 'NTNTN', description: 'Lens card, KPI checklist, 5 use cases aligned to partner audience.' },
  { stage: 'Approval & Record', owner: 'The Union + NTNTN', description: 'ACP-Biz partner event; ICAR record; distribution rules published.' },
] as const;

export const WHITE_LABEL_GOVERNANCE_RULES = [
  'No partner bundle ships without Union approval + NTNTN HITL + Farmer security sign.',
  'White-label assets must preserve brand syntax: "... by: ACHIEVEMOR".',
  'Never reveal internal margins or private rate cards.',
] as const;

// ---------------------------------------------------------------------------
// Compliance Statements
// ---------------------------------------------------------------------------

export const COMPLIANCE_STATEMENTS = [
  'Brand syntax is mandatory: "... by: ACHIEVEMOR"; avoid generic superlatives; never use "comprehensive."',
  'No exposure of internal provider costs, markups, or margin structures in any artifact or UI.',
  'All material transitions must appear in ICAR + ACP rails; absence = breach of canon.',
] as const;

// ---------------------------------------------------------------------------
// Plug Factory Entities
// ---------------------------------------------------------------------------

export interface PlugFactoryEntity {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
}

export const PLUG_FACTORY_ENTITIES: PlugFactoryEntity[] = [
  {
    id: 'picker-ang',
    name: 'Picker_Ang',
    role: 'Tool Warehouse Selector',
    responsibilities: [
      'Select from 140+ tools in the Tool Warehouse',
      'Version-pin all selections',
      'Check license compatibility',
      'Filter by tier access',
    ],
  },
  {
    id: 'buildsmith',
    name: 'BuildSmith',
    role: 'Builder & Verifier',
    responsibilities: [
      'Install selected tools/components',
      'Verify installation integrity',
      'Generate SBOM (Software Bill of Materials)',
      'Run OPA/Rego policy checks',
    ],
  },
];

// ---------------------------------------------------------------------------
// Enablement Pack v1.0
// ---------------------------------------------------------------------------

// Field Lens Card
export const FIELD_LENS_CARD = {
  knr: KNR_ANCHORS,
  fourQuestionLens: FOUR_QUESTION_LENS,
  blueOcean: BLUE_OCEAN_PROMPTS,
  branchingLogic: METHODOLOGY_TRACKS,
  governanceMUSTs: [
    'HITL gates: Proposal, Quote, SoW/Tech, QA/Sec, Growth',
    'Confidence >= 0.85 before material output; maker→checker→HITL enforced',
    'The Farmer injects tiered controls (SBOM/Scans/OPA-Rego/DLP) and signs security cert',
    'Public pricing surfaces only: plan, pool, 25% refundable buffer, overage',
  ],
} as const;

// Adoption Pack — 5 Use Cases
export interface AdoptionUseCase {
  id: string;
  name: string;
  type: string;
  outcome: string;
  okr: string;
  kpis: string[];
}

export const ADOPTION_USE_CASES: AdoptionUseCase[] = [
  {
    id: 'rapid-deploy',
    name: 'Rapid "Manage It" Deployment',
    type: 'Operational Lift',
    outcome: 'Production plug live with KPIs in ~60s post-delivery (target).',
    okr: 'Cut time-to-impact from weeks to hours.',
    kpis: ['Time-to-first-insight', 'First successful job run', 'Incident rate'],
  },
  {
    id: 'guide-me',
    name: '"Guide Me" Co-Design',
    type: 'Risk Reduction + Fit',
    outcome: 'Interactive DMAIC/DMADV with micro-approvals; lower rework.',
    okr: '>=30% defect reduction vs. prior cycle.',
    kpis: ['Rework loops', 'HITL on-time rate', 'Acceptance at first pass'],
  },
  {
    id: 'security-first',
    name: 'Security-First Delivery',
    type: 'Policy Assurance',
    outcome: 'Farmer-signed QA/Security cert; tier-appropriate OPA/Rego policies.',
    okr: '100% evidence bundles at QA/Sec gate.',
    kpis: ['SBOM completeness', 'Scan pass %', 'Policy exceptions (down)'],
  },
  {
    id: 'evidence-backed',
    name: 'Evidence-Backed Decisions',
    type: 'ICAR + ACP',
    outcome: 'Every material action captured; Proposal/Quote/Growth on ACP-Biz, SoW/Tech/BoM/QA on ACP-Tech.',
    okr: '100% ICAR coverage + rationale ledger deltas (no silent updates).',
    kpis: ['ICAR event coverage', 'Unresolved contradictions (down)'],
  },
  {
    id: 'white-label-motion',
    name: 'White-Label / Partner Motion',
    type: 'Union-Governed Growth',
    outcome: 'Partner pack aligned to model visibility by plan + brand/culture rules.',
    okr: 'Reduce partner approval cycle time while holding 100% compliance.',
    kpis: ['Partner approval lead-time', 'Compliance exceptions (down)'],
  },
];

// 14-Day KPI Checklist
export interface KPIChecklistItem {
  metric: string;
  frequency: 'daily' | 'milestone';
  day?: string;
  description: string;
}

export const FOURTEEN_DAY_KPI_CHECKLIST: KPIChecklistItem[] = [
  // Daily (D1-D14)
  { metric: 'Uptime', frequency: 'daily', description: '>=99.9% target' },
  { metric: 'Latency', frequency: 'daily', description: 'Proposal <=30s target; enablement ~<=60s' },
  { metric: 'Errors', frequency: 'daily', description: 'Rate and severity tracking' },
  { metric: 'Policy Flags', frequency: 'daily', description: 'OPA exceptions' },
  { metric: 'Security', frequency: 'daily', description: 'New CVEs affecting BoM' },
  { metric: 'Adoption', frequency: 'daily', description: 'Active users, runs/day' },
  { metric: 'Feedback', frequency: 'daily', description: 'Tickets, NPS proxy' },
  // Key Milestones
  { metric: 'HITL Compliance Audit', frequency: 'milestone', day: 'D3', description: 'Gates met, on-time %' },
  { metric: 'Blue-Ocean Deltas', frequency: 'milestone', day: 'D7', description: 'Eliminate/Reduce/Raise/Create tracked' },
  { metric: 'DMAIC/DMADV Benefits', frequency: 'milestone', day: 'D10', description: 'Defects, rework, verification pass vs baseline' },
  { metric: 'Outcomes Review', frequency: 'milestone', day: 'D14', description: 'NTNTN + The Farmer review → FDH loop + Story Baton update' },
];

export const KPI_DECISION_TRIGGERS = [
  { trigger: 'Confidence dips < 0.85', action: 'Immediate FDH + NTNTN review' },
  { trigger: 'Repeated policy exceptions', action: 'Farmer escalation; reconfigure tier controls' },
  { trigger: 'Adoption lag vs. forecast', action: 'Boomer_CMO enablement push; refine use-cases' },
] as const;

// Partner / White-Label Quick Checklist (Union-led)
export const PARTNER_CHECKLIST = [
  'Governance fit + brand/culture review (The Union)',
  'Public pricing surfaces only (plan/pool/buffer/overage) — no internal margins',
  'Model visibility and tool access align with plan tier',
  'Security tier mapped; Farmer\'s controls documented; certificate path confirmed',
  'Lens Card + 14-day KPIs included in enablement; ICP and audience resonance clear',
] as const;

// Template Index
export const TEMPLATE_INDEX = [
  'ICAR Entry (JSON + human summary)',
  'ACP-Tech / ACP-Biz milestone records',
  'Proposal (customer/staff views, with Blue Ocean diff list)',
  'Quote (plan, pool, 25% buffer, overage)',
  'SoW/Tech Plan (DMAIC/DMADV declared; DoR/DoD; OKRs; Verification for DMADV)',
  'BoM JSON (version pins, install/verify, security add-ons, license notes, rationale)',
  'QA/Security Certificate (Farmer-signed; SBOM + scans + OPA logs + QA report attached)',
  'Delivery Receipt + Adoption Pack (5 use cases + 14-day KPI checks)',
  'Growth Pack (white-label/partner enablement, governance statements)',
] as const;
