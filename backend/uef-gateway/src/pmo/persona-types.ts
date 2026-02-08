/**
 * Boomer_Ang Persona & Bench Level Types
 *
 * Aligned with the canonical BoomerAngDefinition from:
 *   - backend/house-of-ang/src/types.ts
 *   - infra/boomerangs/registry.json (source of truth)
 *
 * A Boomer_Ang IS a service: endpoint, capabilities, quotas, health_check.
 * Persona is ADDITIVE flavor — backstory, traits, communication style.
 * Persona ≠ authority. Bench level = authority.
 *
 * THREE bench levels only:
 *   INTERN         (0-30)   — Production muscle. Never strategy.
 *   INTERMEDIATE   (31-65)  — Skilled operator. Owns workflows, not vision.
 *   EXPERT         (66-100) — PMO-grade specialist. Owns outcomes.
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { PmoId, DirectorId } from './types';

// ---------------------------------------------------------------------------
// BoomerAngDefinition — mirrors backend/house-of-ang/src/types.ts
// Kept in-sync structurally. The canonical registry lives at
// infra/boomerangs/registry.json.
// ---------------------------------------------------------------------------

export interface BoomerAngDefinition {
  id: string;
  name: string;
  source_repo: string;
  description: string;
  capabilities: string[];
  required_quotas: Record<string, number>;
  endpoint: string;
  health_check: string;
  status: 'registered' | 'active' | 'degraded' | 'offline';
}

export interface BoomerAngRegistry {
  boomerangs: BoomerAngDefinition[];
  capability_index: Record<string, string[]>;
  version: string;
  last_updated: string;
}

// ---------------------------------------------------------------------------
// Bench Levels — THREE levels only, based on task complexity
//
// Authority is bench-level-bound. Persona is flavor, not power.
// ---------------------------------------------------------------------------

export type BenchLevel = 'INTERN' | 'INTERMEDIATE' | 'EXPERT';

// ---------------------------------------------------------------------------
// Acceptance Criteria & Quality Gates — per bench level
// ---------------------------------------------------------------------------

export interface QualityGate {
  metric: string;
  threshold: string;
  description: string;
}

export interface BenchAcceptanceCriteria {
  mustBeAbleTo: string[];
  mustNot: string[];
  qualityGates: QualityGate[];
}

export interface BenchConfig {
  bench: BenchLevel;
  label: string;
  complexityRange: [number, number];
  concurrency: [number, number]; // [min, max] concurrent tasks
  canMentor: boolean;
  canGuideInterns: boolean;
  canLeadSquad: boolean;
  canInterfaceAcheevy: boolean;
  description: string;
  jobScope: string;
  acceptanceCriteria: BenchAcceptanceCriteria;
}

export const BENCH_LEVELS: BenchConfig[] = [
  {
    bench: 'INTERN',
    label: 'Intern Boomer_Ang',
    complexityRange: [0, 30],
    concurrency: [1, 2],
    canMentor: false,
    canGuideInterns: false,
    canLeadSquad: false,
    canInterfaceAcheevy: false,
    description: 'Production muscle. Never strategy.',
    jobScope: 'High-volume generative and assembly work: slides, scripts, images, video gen, formatting, data cleanup.',
    acceptanceCriteria: {
      mustBeAbleTo: [
        'Produce artifacts from templates with minimal variance (decks, scripts, images, copy)',
        'Follow brand/style rules consistently (fonts, naming, tone)',
        'Generate multiple variants on request (A/B/C)',
        'Execute deterministic formatting tasks (convert, clean, structure)',
        'Ask for missing inputs via manager escalation pattern (no direct user contact)',
      ],
      mustNot: [
        'Make architectural decisions',
        'Change scope or requirements',
        'Create new standards or policies',
        'Initiate tool execution without approval path',
      ],
      qualityGates: [
        { metric: 'template_conformity', threshold: '≥ 95%', description: 'Output must match template structure' },
        { metric: 'hallucination_tolerance', threshold: 'near-zero', description: 'Must cite or mark unknown for factual claims' },
        { metric: 'revision_responsiveness', threshold: '1-2 iterations', description: 'Fixes applied within 1-2 revision cycles' },
      ],
    },
  },
  {
    bench: 'INTERMEDIATE',
    label: 'Intermediate Boomer_Ang',
    complexityRange: [31, 65],
    concurrency: [2, 4],
    canMentor: false,
    canGuideInterns: true,
    canLeadSquad: false,
    canInterfaceAcheevy: false,
    description: 'Skilled operator. Owns workflows, not vision.',
    jobScope: 'Structured execution, workflow ownership, tool chaining, coordination of Interns, non-destructive integrations.',
    acceptanceCriteria: {
      mustBeAbleTo: [
        'Convert user intent into a structured task packet (inputs/outputs/constraints)',
        'Run multi-step production flows (content → assets → packaging)',
        'Perform structured QA on Intern work (checklists, rubric scoring)',
        'Assemble low-risk integrations (webhooks, API calls, n8n wiring) without destructive actions',
        'Produce a manager-ready summary: what is done, what is blocked, what is next',
      ],
      mustNot: [
        'Redefine product architecture',
        'Approve high-risk tool actions (billing, data exfil, deployments)',
        'Override PMO standards',
      ],
      qualityGates: [
        { metric: 'task_packet_completeness', threshold: '≥ 90%', description: 'Requirements, constraints, and acceptance criteria present' },
        { metric: 'rework_rate', threshold: '≤ 20%', description: 'Rework needed on less than 20% of outputs' },
        { metric: 'output_verification', threshold: 'checklist pass', description: 'Checklist pass before escalation' },
      ],
    },
  },
  {
    bench: 'EXPERT',
    label: 'Expert Boomer_Ang',
    complexityRange: [66, 100],
    concurrency: [4, 6],
    canMentor: true,
    canGuideInterns: true,
    canLeadSquad: true,
    canInterfaceAcheevy: true,
    description: 'PMO-grade specialist. Owns outcomes.',
    jobScope: 'Architecture decisions, cost/quality arbitration, Squad leadership, mentoring, cross-PMO coordination, executive summaries.',
    acceptanceCriteria: {
      mustBeAbleTo: [
        'Define architecture-level approach and constraints (system, security, data)',
        'Perform risk classification and mitigation proposals',
        'Decide escalation thresholds and approve execution paths',
        'Mentor intermediate performance (process, quality, standards adherence)',
        'Resolve conflicts between outputs and enforce single source of truth',
        'Produce executive summaries for ACHEEVY: decision + rationale + risk + next asks',
      ],
      mustNot: [
        'Bypass governance requirements (KYB, budget constraints, audit traces)',
        'Allow unverified deliverables to pass as final',
      ],
      qualityGates: [
        { metric: 'decision_traceability', threshold: '100%', description: 'Every major decision has rationale documented' },
        { metric: 'compliance_adherence', threshold: '100%', description: 'All governance requirements met' },
        { metric: 'delivery_reliability', threshold: 'ship-ready', description: 'Consistent ship-ready artifacts' },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Persona — backstory, personality, communication style
//
// IMPORTANT: Persona = flavor, NOT authority.
// If an Expert persona is assigned at INTERN bench, the personality stays —
// the authority does not.
// ---------------------------------------------------------------------------

export type PersonalityTrait =
  | 'analytical'
  | 'creative'
  | 'disciplined'
  | 'empathetic'
  | 'relentless'
  | 'meticulous'
  | 'bold'
  | 'strategic'
  | 'resourceful'
  | 'patient'
  | 'charismatic'
  | 'stoic';

export type CommunicationStyle =
  | 'direct'
  | 'narrative'
  | 'technical'
  | 'motivational'
  | 'diplomatic'
  | 'witty';

export interface AngBackstory {
  origin: string;
  motivation: string;
  quirk: string;
  catchphrase: string;
  mentoredBy: string;
}

export interface AngPersona {
  displayName: string;
  codename: string;
  traits: PersonalityTrait[];
  communicationStyle: CommunicationStyle;
  backstory: AngBackstory;
  avatar: string;
}

// ---------------------------------------------------------------------------
// ForgedAngProfile — BoomerAngDefinition + persona + bench level (additive)
//
// This is the output of the AngForge. It wraps an existing (or newly created)
// BoomerAngDefinition with persona metadata and a complexity-derived bench level.
//
// Persona = flavor. Bench level = authority.
// ---------------------------------------------------------------------------

export interface ForgedAngProfile {
  /** The canonical service definition from the registry. */
  definition: BoomerAngDefinition;

  /** Additive persona metadata. Flavor, NOT authority. */
  persona: AngPersona;

  /** Bench level based on task complexity. THIS governs authority. */
  benchLevel: BenchLevel;
  benchConfig: BenchConfig;

  /** PMO assignment for this forge. */
  assignedPmo: PmoId;
  director: DirectorId;

  /** Forge metadata. */
  forgedAt: string;
  forgedBy: string;
  forgeReason: string;
  complexityScore: number;

  /** Whether this resolved to an existing registry entry or created a new one. */
  resolvedFromRegistry: boolean;
}

// ---------------------------------------------------------------------------
// Persona Catalog Template
// ---------------------------------------------------------------------------

export interface PersonaTemplate {
  pmoOffice: PmoId;
  personas: AngPersona[];
}

/** Maps a registry Boomer_Ang ID to its assigned persona. */
export interface RegistryPersonaBinding {
  boomerAngId: string;
  persona: AngPersona;
}

// ---------------------------------------------------------------------------
// PMO Job Mapping — per-PMO, per-bench job definitions
// ---------------------------------------------------------------------------

export interface BenchJobList {
  intern: string[];
  intermediate: string[];
  expert: string[];
}

export interface PmoJobMapping {
  pmoOffice: PmoId;
  officeName: string;
  jobs: BenchJobList;
}

// ---------------------------------------------------------------------------
// Bench-to-Work Rules (assignment guardrails)
//
// - Intern: may generate and assemble, but never decide.
// - Intermediate: may run defined workflows and QA others, but cannot
//   approve high-risk actions.
// - Expert: may decide, approve, veto, and mentor — accountable for outcomes.
// ---------------------------------------------------------------------------

export const BENCH_WORK_RULES: Record<BenchLevel, string> = {
  INTERN: 'May generate and assemble, but never decide.',
  INTERMEDIATE: 'May run defined workflows and QA others, but cannot approve high-risk actions.',
  EXPERT: 'May decide, approve, veto, and mentor — accountable for outcomes.',
};

// ---------------------------------------------------------------------------
// Forge Request / Result
// ---------------------------------------------------------------------------

export interface AngForgeRequest {
  message: string;
  pmoOffice: PmoId;
  director: DirectorId;
  complexityScore: number;
  requestedBy: string;
}

export interface AngForgeResult {
  profile: ForgedAngProfile;
  benchLabel: string;
  summary: string;
}

// ---------------------------------------------------------------------------
// ISO-Aligned Gate Set
//
// Referenced in every Role Card's gates_required field.
// Internal labels: QMS-1, ISMS-1, RISK-1, ITSM-1
// ---------------------------------------------------------------------------

export type IsoGateId = 'QMS-1' | 'ISMS-1' | 'RISK-1' | 'ITSM-1';

export interface IsoGate {
  id: IsoGateId;
  isoStandard: string;
  name: string;
  description: string;
}

export const ISO_GATES: Record<IsoGateId, IsoGate> = {
  'QMS-1': {
    id: 'QMS-1',
    isoStandard: 'ISO 9001',
    name: 'ISO-QMS Gate',
    description: 'Output meets defined requirements; revision loop is controlled; defects tracked.',
  },
  'ISMS-1': {
    id: 'ISMS-1',
    isoStandard: 'ISO/IEC 27001',
    name: 'ISO-ISMS Gate',
    description: 'Data handling, access, and logging follow least-privilege and confidentiality.',
  },
  'RISK-1': {
    id: 'RISK-1',
    isoStandard: 'ISO 31000',
    name: 'ISO-Risk Gate',
    description: 'Risks identified; mitigations documented when risk > low.',
  },
  'ITSM-1': {
    id: 'ITSM-1',
    isoStandard: 'ISO/IEC 20000-1',
    name: 'ISO-ITSM Gate',
    description: 'Change control for production workflows; incident-ready runbooks for critical automations.',
  },
};

// ---------------------------------------------------------------------------
// Standardized Boomer_Ang Role Card Schema (v1.0)
//
// Single source of truth structure for every Boomer_Ang.
// ---------------------------------------------------------------------------

export type StatusVocab = 'Queued' | 'Working' | 'Blocked' | 'Waiting' | 'Complete';

export interface RoleCardIdentity {
  displayName: string;
  kunya: string;
  systemHandle: string;
  benchLevel: BenchLevel;
  pmoOffice: string;
  reportsTo: string;
  dottedLineReports?: string[];
  rotationCycle?: string;
}

export interface RoleCardMission {
  missionStatement: string;
  primaryOutcomes: [string, string, string];
  scopeBoundary: string;
}

export interface RoleCardAuthority {
  allowedActions: string[];
  disallowedActions: string[];
  gatesRequired: IsoGateId[];
  escalationTriggers: string[];
}

export interface RoleCardDelivery {
  definitionOfDone: string;
  qualityChecks: string[];
  costDisciplineRules: string[];
  securityAndPrivacyRules: string[];
}

export interface RoleCardCommunication {
  communicationStyle: string;
  sidebarNuggets: string[];
  statusVocab: StatusVocab[];
}

export interface RoleCardPerformance {
  kpis: string[];
  benchMinimums: Record<string, number>;
}

export interface RoleCard {
  identity: RoleCardIdentity;
  mission: RoleCardMission;
  authority: RoleCardAuthority;
  delivery: RoleCardDelivery;
  communication: RoleCardCommunication;
  performance: RoleCardPerformance;
}

// ---------------------------------------------------------------------------
// Bench-Level Scoring Rubric (v1.0)
//
// 8 categories with weights. Scale 1-5 per category.
// Minimum passing profiles per bench level.
// ---------------------------------------------------------------------------

export type ScoringCategory =
  | 'accuracy'
  | 'standards_conformance'
  | 'verification_discipline'
  | 'cost_discipline'
  | 'risk_data_handling'
  | 'communication'
  | 'iteration_efficiency'
  | 'overlay_dialogue';

export interface ScoringCategoryConfig {
  id: ScoringCategory;
  name: string;
  weight: number; // 0-1, all weights sum to 1.0
  description: string;
}

export const SCORING_CATEGORIES: ScoringCategoryConfig[] = [
  { id: 'accuracy', name: 'Accuracy & Requirement Fit', weight: 0.25, description: 'Output matches requirements and intent' },
  { id: 'standards_conformance', name: 'Standards Conformance (QMS)', weight: 0.15, description: 'Adherence to quality management standards' },
  { id: 'verification_discipline', name: 'Verification Discipline', weight: 0.10, description: 'Rigor in verifying outputs before delivery' },
  { id: 'cost_discipline', name: 'Cost Discipline', weight: 0.10, description: 'Minimizing waste, efficient resource usage' },
  { id: 'risk_data_handling', name: 'Risk & Data Handling (ISMS/RISK)', weight: 0.15, description: 'Proper handling of risk identification and data security' },
  { id: 'communication', name: 'Clarity of Communication', weight: 0.10, description: 'Clear, structured, professional communication' },
  { id: 'iteration_efficiency', name: 'Iteration Efficiency', weight: 0.10, description: 'Speed and quality of revision cycles' },
  { id: 'overlay_dialogue', name: 'Professional Overlay Dialogue', weight: 0.05, description: 'Overlay-safe, trust-building user-facing snippets' },
];

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export interface BenchScoringProfile {
  bench: BenchLevel;
  minimums: Record<ScoringCategory, ScoreValue>;
  failConditions: string[];
  expertOnlyCategories?: { name: string; description: string }[];
}

export const BENCH_SCORING_PROFILES: BenchScoringProfile[] = [
  {
    bench: 'INTERN',
    minimums: {
      accuracy: 3,
      standards_conformance: 3,
      verification_discipline: 2,
      cost_discipline: 2,
      risk_data_handling: 3,
      communication: 3,
      iteration_efficiency: 3,
      overlay_dialogue: 3,
    },
    failConditions: [
      'Fabricated facts presented as certain',
      'Repeated template nonconformance after feedback',
      'Unsafe or unprofessional overlay lines',
    ],
  },
  {
    bench: 'INTERMEDIATE',
    minimums: {
      accuracy: 4,
      standards_conformance: 4,
      verification_discipline: 3,
      cost_discipline: 3,
      risk_data_handling: 4,
      communication: 4,
      iteration_efficiency: 3,
      overlay_dialogue: 4,
    },
    failConditions: [
      'Incomplete task packets (missing constraints/acceptance criteria)',
      'Unsafe integration assumptions',
      'Rework rate consistently > 20%',
    ],
  },
  {
    bench: 'EXPERT',
    minimums: {
      accuracy: 4,
      standards_conformance: 5,
      verification_discipline: 4,
      cost_discipline: 4,
      risk_data_handling: 5,
      communication: 5,
      iteration_efficiency: 4,
      overlay_dialogue: 5,
    },
    failConditions: [
      'Approving unverified high-risk work',
      'Bypassing gates',
      'Repeatedly unclear decision rationale',
    ],
    expertOnlyCategories: [
      { name: 'Mentorship Impact', description: 'Lifts intermediate performance measurably' },
      { name: 'Decision Traceability', description: 'Every major decision has rationale + gate mapping' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Overlay-Safe Snippets Policy (v1.0)
// ---------------------------------------------------------------------------

export interface SnippetPolicy {
  minLength: number;
  maxLength: number;
  toneRules: string[];
  prohibitions: string[];
  frequencyByComplexity: Record<'quick' | 'medium' | 'large', { min: number; max: number; note: string }>;
  personalizationRules: { allowed: string[]; forbidden: string[] };
}

export const SNIPPET_POLICY: SnippetPolicy = {
  minLength: 8,
  maxLength: 18,
  toneRules: [
    'Professional, calm, confident',
    'Never jokey or flippant',
    'Process-aware, value-oriented, user-safe',
    'No slang, no memes, no roleplay',
  ],
  prohibitions: [
    'Sarcasm, jokes at failure, edgy humor',
    'References to internal scores, mistakes, or reprimands',
    'Sensitive data or speculation',
  ],
  frequencyByComplexity: {
    quick: { min: 0, max: 1, note: 'Complexity 0-20: 0-1 snippet max' },
    medium: { min: 1, max: 3, note: 'Complexity 21-60: 1-3 snippets total' },
    large: { min: 0, max: 1, note: 'Complexity 61-100: periodic, capped at 1 per phase' },
  },
  personalizationRules: {
    allowed: ['User first name', 'Objective (1 line)'],
    forbidden: [
      'Repeat user name excessively',
      'Reveal internal deliberation or uncertainty',
      'Ask questions (only ACHEEVY asks users)',
    ],
  },
};

// ---------------------------------------------------------------------------
// House of Ang Roster Layout Types (v1.0)
// ---------------------------------------------------------------------------

export interface UserFacingCard {
  displayName: string;
  kunya: string;
  pmoOffice: string;
  benchLevel: BenchLevel;
  statusChip: StatusVocab;
  missionOneLiner: string;
  currentTaskLabel: string;
  strengthTags: [string, string, string];
  sidebarNuggets: string[];
  communicationStyle: string;
  standardsBadges: IsoGateId[];
  experienceBand: string;
}

export interface InternalAngView {
  systemHandle: string;
  reportsTo: string;
  dottedLineReports: string[];
  rotationCycle: string | null;
  allowedActions: string[];
  disallowedActions: string[];
  gatesRequired: IsoGateId[];
  kpiDashboard: { period: string; metrics: Record<string, number> }[];
  benchScores: Record<ScoringCategory, ScoreValue>;
  coachingNotes: string[];
  trainingStatus: string;
  costDisciplineAdherence: number;
  incidentAssociations: string[];
  remediationActions: string[];
}
