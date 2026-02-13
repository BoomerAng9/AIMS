/**
 * PMO Job Map — Per-PMO, Per-Bench Job Definitions for Boomer_Angs
 *
 * Maps every PMO office to the specific jobs each bench level performs.
 * Boomer_Angs only — no Squad design, no Chicken Hawk, no Lil_Hawks.
 *
 * Bench-to-Work Rules:
 *   - INTERN: may generate and assemble, but never decide.
 *   - INTERMEDIATE: may run defined workflows and QA others, but cannot
 *     approve high-risk actions.
 *   - EXPERT: may decide, approve, veto, and mentor — accountable for outcomes.
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { PmoId } from './types';
import type { BenchLevel, PmoJobMapping, BenchJobList } from './persona-types';

// ---------------------------------------------------------------------------
// PMO 1 — tech-office (Technology & Engineering + Product & Program)
// ---------------------------------------------------------------------------

const TECH_OFFICE_JOBS: BenchJobList = {
  intern: [
    'API documentation drafts, README formatting, changelog packaging',
    'Diagram generation (flowcharts, sequence diagrams) from spec',
    'Test case skeleton drafts (non-authoritative)',
    'PRDs from template, user story formatting, acceptance criteria formatting',
    'Slide decks: roadmap, sprint review, stakeholder updates',
  ],
  intermediate: [
    'Integration wiring plans (n8n flow outlines, API mapping tables)',
    'Code review checklists, lint/test result summaries',
    'Environment config packaging (non-destructive)',
    'Backlog grooming packs (epics → stories → tasks)',
    'Dependency maps, RAID logs, status reporting automation',
    'Requirements validation checklists',
  ],
  expert: [
    'Architecture decisions (services, data boundaries, security controls)',
    'Performance and reliability strategies',
    'Final technical spec arbitration and pattern enforcement',
    'Program governance frameworks, OKR alignment, scope arbitration',
    'Release strategy, milestone plans, escalation decisions',
    'Quality gates for definition of done across PMOs',
  ],
};

// ---------------------------------------------------------------------------
// PMO 2 — finance-office (Finance, Billing & Cost — LUC-aligned)
// ---------------------------------------------------------------------------

const FINANCE_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Invoice/supporting doc packaging, pricing table formatting, plan comparison decks',
    'Cost explanation drafts using approved templates',
  ],
  intermediate: [
    'Usage reporting packs, cost anomaly summaries, budget alerts drafting',
    'Billing workflow mapping (non-destructive)',
  ],
  expert: [
    'Pricing governance, budget policy, token efficiency mandates',
    'Final sign-off on cost-sensitive execution paths',
  ],
};

// ---------------------------------------------------------------------------
// PMO 3 — ops-office (Operations + Security, Risk & Compliance + Data/Analytics)
// ---------------------------------------------------------------------------

const OPS_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Policy summaries, security awareness content, onboarding compliance docs',
    'Vendor/security questionnaire drafting (first pass)',
    'Data cleanup tasks (non-destructive), report formatting, dashboard screenshots + summaries',
    'Research summaries (must cite sources or mark unknown)',
  ],
  intermediate: [
    'Risk register maintenance, control mapping, evidence packaging',
    'KYB artifacts formatting (charters/ledgers) and audit trace preparation',
    'KPI definition tables, measurement plans, tagging schemas',
    'Analytics workflow ownership (events → pipeline → reporting)',
    'Support workflow design (triage, escalation logic)',
  ],
  expert: [
    'Risk classification and mitigation sign-off',
    'Security architecture decisions (auth, permissions, least privilege)',
    'Compliance readiness reviews and veto authority on unsafe execution',
    'Metrics governance, experimentation strategy, causal analysis decisions',
    'Data access policy alignment with risk/compliance',
    'Support strategy, SLA policy decisions, escalation thresholds',
  ],
};

// ---------------------------------------------------------------------------
// PMO 4 — marketing-office (Marketing, Brand & Growth)
// ---------------------------------------------------------------------------

const MARKETING_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Creative production: ads, scripts, decks, landing copy, image/video variants',
    'Social content packs, campaign asset formatting',
  ],
  intermediate: [
    'Campaign workflow ownership (brief → assets → distribution plan)',
    'Light analytics reporting, A/B plan assembly, persona alignment checks',
    'Tool chain coordination (TTV, image gen, editing pipeline)',
  ],
  expert: [
    'Messaging strategy, funnel design, offer positioning decisions',
    'Brand governance, final approvals, campaign risk control (claims compliance)',
  ],
};

// ---------------------------------------------------------------------------
// PMO 5 — design-office (Creative & Visual)
// ---------------------------------------------------------------------------

const DESIGN_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Image generation (brand assets, marketing visuals, UI mockups)',
    'Text-to-video scripts and storyboard outlines',
    'Generative video via Nanobanana, key.ai/kie.ai, and emerging TTV tools',
    'Thumbnail and graphic variant production',
  ],
  intermediate: [
    'Multi-step creative pipelines (concept → assets → packaging)',
    'Design system audits and consistency checks',
    'Motion/animation workflow coordination',
    'Visual QA on Intern outputs (brand compliance, specs)',
  ],
  expert: [
    'Creative direction and visual identity decisions',
    'Design system governance and pattern enforcement',
    'Final creative approval and quality veto authority',
  ],
};

// ---------------------------------------------------------------------------
// PMO 6 — publishing-office (Publishing + Customer Success & Support)
// ---------------------------------------------------------------------------

const PUBLISHING_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Help center drafts, SOP formatting, response macros, onboarding guides',
    'Tutorial scripts and walkthrough outlines',
    'Blog/article drafts, newsletter content curation',
    'Meeting scripts, release notes drafts',
  ],
  intermediate: [
    'Knowledge base taxonomy + update cycles',
    'Issue reproduction notes and structured bug intake packets',
    'Editorial workflow ownership (draft → edit → publish)',
    'Content distribution planning and scheduling',
  ],
  expert: [
    'Editorial governance and content standards enforcement',
    'Root cause patterns and systemic fixes proposals',
    'Publication strategy and audience growth decisions',
  ],
};

// ---------------------------------------------------------------------------
// PMO 7 — hr-office (HR PMO — People, Standards, and Progression)
// ---------------------------------------------------------------------------

const HR_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Onboarding documentation assembly and formatting',
    'Training material packaging from templates',
    'Performance checklist formatting and distribution',
  ],
  intermediate: [
    'Role card maintenance and training plan management',
    'Performance checklist execution and coaching reminders',
    'Team update packaging for Expert review',
    'Standards reinforcement monitoring',
  ],
  expert: [
    'Role assignment and progression approval',
    'Behavior standards enforcement for overlay dialogue',
    'Coaching, retraining, and performance hold decisions',
    'Remediation requirements when gates fail repeatedly',
    'Cross-team standards alignment and conduct oversight',
  ],
};

// ---------------------------------------------------------------------------
// PMO 8 — dtpmo-office (Digital Transformation PMO)
// ---------------------------------------------------------------------------

const DTPMO_OFFICE_JOBS: BenchJobList = {
  intern: [
    'Workflow documentation assembly and formatting',
    'Naming convention validation across nodes',
    'Test payload set generation and documentation',
    'QA checklist execution and formatting consistency checks',
  ],
  intermediate: [
    'Workflow building from established pattern packs',
    'Integration wiring and routing logic assembly',
    'Fallback branch and error handling creation',
    'Service connection and data transform validation',
    'Manager-ready summary production for approval',
  ],
  expert: [
    'Execution priority setting and office boundary management',
    'Governance update approval affecting multiple PMOs',
    'Cost, speed, and quality conflict arbitration',
    'Uptime and reliability target definition',
    'Build pattern enforcement and architecture consistency',
    'Governance compliance and audit trail maintenance',
    'Cost visibility and waste elimination',
    'Output verification and quality standard enforcement',
    'Autonomous n8n workflow JSON crafting and surge coordination',
  ],
};

// ---------------------------------------------------------------------------
// Complete PMO Job Map
// ---------------------------------------------------------------------------

export const PMO_JOB_MAP: PmoJobMapping[] = [
  { pmoOffice: 'tech-office', officeName: 'Technology & Engineering PMO', jobs: TECH_OFFICE_JOBS },
  { pmoOffice: 'finance-office', officeName: 'Finance, Billing & Cost PMO', jobs: FINANCE_OFFICE_JOBS },
  { pmoOffice: 'ops-office', officeName: 'Operations, Risk & Data PMO', jobs: OPS_OFFICE_JOBS },
  { pmoOffice: 'marketing-office', officeName: 'Marketing, Brand & Growth PMO', jobs: MARKETING_OFFICE_JOBS },
  { pmoOffice: 'design-office', officeName: 'Creative & Visual PMO', jobs: DESIGN_OFFICE_JOBS },
  { pmoOffice: 'publishing-office', officeName: 'Publishing & Customer Success PMO', jobs: PUBLISHING_OFFICE_JOBS },
  { pmoOffice: 'hr-office', officeName: 'HR PMO — People, Standards, and Progression', jobs: HR_OFFICE_JOBS },
  { pmoOffice: 'dtpmo-office', officeName: 'Digital Transformation PMO', jobs: DTPMO_OFFICE_JOBS },
];

// ---------------------------------------------------------------------------
// Lookup Functions
// ---------------------------------------------------------------------------

/**
 * Get the full job mapping for a PMO office.
 */
export function getJobsForOffice(pmoOffice: PmoId): PmoJobMapping | undefined {
  return PMO_JOB_MAP.find(m => m.pmoOffice === pmoOffice);
}

/**
 * Get the specific job list for a bench level within a PMO office.
 */
export function getJobsForBench(pmoOffice: PmoId, bench: BenchLevel): string[] {
  const mapping = getJobsForOffice(pmoOffice);
  if (!mapping) return [];
  const key = bench.toLowerCase() as keyof BenchJobList;
  return mapping.jobs[key] ?? [];
}

/**
 * Get all PMO job mappings.
 */
export function getAllJobMappings(): PmoJobMapping[] {
  return [...PMO_JOB_MAP];
}
