/**
 * AngForge — Boomer_Ang Creation & Persona Assignment Engine
 *
 * The forge where new Boomer_Angs are born. Every task that enters the
 * chain-of-command pipeline can spawn a task-specific Boomer_Ang with:
 *
 *   1. Persona — backstory, personality traits, communication style
 *   2. Skill Tier — CADET / VETERAN / ELITE / LEGENDARY based on complexity
 *   3. PMO Assignment — auto-assigned to the relevant C-Suite office
 *   4. Capabilities — weighted skill set matching the task domain
 *
 * The forge respects the naming conventions from the Deploy Platform lore
 * and fits into the chain of command:
 *   User → ACHEEVY → Boomer_Ang (forged here) → Chicken_Hawk → Squad → Lil_Hawks
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { PmoId, DirectorId } from './types';
import { pmoRegistry } from './registry';
import {
  SkillTier,
  SkillTierConfig,
  SKILL_TIERS,
  AngPersona,
  SpawnedAngProfile,
  AngSpawnRequest,
  AngSpawnResult,
} from './persona-types';
import { getPersonasForOffice } from './persona-catalog';

// ---------------------------------------------------------------------------
// Complexity Scorer — analyzes task message to determine skill tier
// ---------------------------------------------------------------------------

interface ComplexityFactors {
  wordCount: number;
  technicalDepth: number;     // how many domain-specific terms
  multiStepSignals: number;   // signals for multi-step work
  integrationCount: number;   // external services/systems mentioned
  riskSignals: number;        // security, production, financial risk terms
  score: number;              // final 0-100 score
}

const COMPLEXITY_KEYWORDS: Record<string, number> = {
  // High complexity signals (+8 each)
  'architecture': 8, 'migrate': 8, 'production': 8, 'enterprise': 8,
  'kubernetes': 8, 'distributed': 8, 'microservice': 8, 'multi-tenant': 8,
  'compliance': 8, 'audit': 8, 'security': 8,

  // Medium-high complexity (+5 each)
  'pipeline': 5, 'orchestrate': 5, 'integrate': 5, 'deploy': 5,
  'database': 5, 'schema': 5, 'api': 5, 'authentication': 5,
  'workflow': 5, 'automate': 5, 'campaign': 5, 'analytics': 5,
  'optimization': 5, 'scale': 5, 'performance': 5,

  // Medium complexity (+3 each)
  'build': 3, 'create': 3, 'implement': 3, 'design': 3,
  'test': 3, 'refactor': 3, 'update': 3, 'configure': 3,
  'publish': 3, 'schedule': 3, 'monitor': 3, 'report': 3,
  'video': 3, 'render': 3, 'content': 3,

  // Low complexity (+1 each)
  'check': 1, 'list': 1, 'show': 1, 'get': 1,
  'status': 1, 'help': 1, 'info': 1,
};

const MULTI_STEP_SIGNALS = [
  'and then', 'after that', 'next', 'also', 'plus',
  'first', 'second', 'finally', 'then', 'followed by',
  'step 1', 'step 2', 'multiple', 'several', 'batch',
];

const INTEGRATION_SIGNALS = [
  'stripe', 'firebase', 'postgres', 'redis', 'docker',
  'n8n', 'github', 'slack', 'twitter', 'linkedin',
  'openrouter', 'brave', 'gemini', 'anthropic', 'openai',
  'aws', 'gcp', 'vercel', 'cloudflare',
];

const RISK_SIGNALS = [
  'production', 'security', 'financial', 'billing', 'payment',
  'credentials', 'secrets', 'ssl', 'certificate', 'compliance',
  'gdpr', 'pci', 'hipaa', 'delete', 'drop', 'rollback',
];

export function scoreComplexity(message: string): ComplexityFactors {
  const lower = message.toLowerCase();
  const words = message.split(/\s+/);

  // Factor 1: Word count (more words = more complex, up to a point)
  const wordCount = words.length;
  const wordScore = Math.min(wordCount / 5, 15); // max 15 from word count

  // Factor 2: Technical depth (domain keywords)
  let technicalDepth = 0;
  for (const [keyword, weight] of Object.entries(COMPLEXITY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      technicalDepth += weight;
    }
  }
  technicalDepth = Math.min(technicalDepth, 40); // cap at 40

  // Factor 3: Multi-step signals
  let multiStepSignals = 0;
  for (const signal of MULTI_STEP_SIGNALS) {
    if (lower.includes(signal)) multiStepSignals++;
  }
  const multiStepScore = Math.min(multiStepSignals * 5, 20); // max 20

  // Factor 4: Integration count
  let integrationCount = 0;
  for (const sig of INTEGRATION_SIGNALS) {
    if (lower.includes(sig)) integrationCount++;
  }
  const integrationScore = Math.min(integrationCount * 4, 15); // max 15

  // Factor 5: Risk signals
  let riskSignals = 0;
  for (const sig of RISK_SIGNALS) {
    if (lower.includes(sig)) riskSignals++;
  }
  const riskScore = Math.min(riskSignals * 3, 10); // max 10

  // Total: max 100
  const score = Math.min(
    Math.round(wordScore + technicalDepth + multiStepScore + integrationScore + riskScore),
    100,
  );

  return {
    wordCount,
    technicalDepth,
    multiStepSignals,
    integrationCount,
    riskSignals,
    score,
  };
}

// ---------------------------------------------------------------------------
// Tier Resolver — complexity score → skill tier
// ---------------------------------------------------------------------------

export function resolveTier(complexityScore: number): SkillTierConfig {
  for (const tier of SKILL_TIERS) {
    if (complexityScore >= tier.complexityRange[0] && complexityScore <= tier.complexityRange[1]) {
      return tier;
    }
  }
  // Default to VETERAN if somehow out of range
  return SKILL_TIERS[1];
}

// ---------------------------------------------------------------------------
// Persona Selector — picks the best-fit persona from the catalog
// ---------------------------------------------------------------------------

function selectPersona(pmoOffice: PmoId, message: string, tier: SkillTier): AngPersona {
  const personas = getPersonasForOffice(pmoOffice);

  if (personas.length === 0) {
    // Fallback: generic persona
    return {
      displayName: 'Operative_Ang',
      codename: 'operative',
      traits: ['disciplined', 'resourceful'],
      communicationStyle: 'direct',
      backstory: {
        origin: 'A generalist born from pure necessity. When no specialist was available, Operative_Ang stepped up.',
        motivation: 'Get it done. Get it done right. Get it done now.',
        quirk: 'Never introduces themselves. Just starts working.',
        catchphrase: 'Activity breeds Activity.',
        mentoredBy: 'ACHEEVY',
      },
      avatar: 'gear',
    };
  }

  // Match persona traits to tier:
  // LEGENDARY/ELITE → prefer strategic, bold, relentless
  // VETERAN → prefer analytical, resourceful
  // CADET → prefer disciplined, patient
  const tierTraitPreference: Record<SkillTier, string[]> = {
    LEGENDARY: ['strategic', 'bold', 'relentless', 'charismatic'],
    ELITE: ['analytical', 'creative', 'resourceful', 'meticulous'],
    VETERAN: ['disciplined', 'resourceful', 'analytical'],
    CADET: ['patient', 'disciplined', 'empathetic'],
  };

  const preferred = tierTraitPreference[tier];

  // Score each persona by trait overlap with tier preference
  let bestPersona = personas[0];
  let bestScore = -1;

  for (const persona of personas) {
    const traitOverlap = persona.traits.filter(t => preferred.includes(t)).length;
    // Add slight randomness so we do not always get the same one
    const noise = Math.random() * 0.5;
    const score = traitOverlap + noise;
    if (score > bestScore) {
      bestScore = score;
      bestPersona = persona;
    }
  }

  return bestPersona;
}

// ---------------------------------------------------------------------------
// Capability Generator — builds capabilities for the Boomer_Ang
// ---------------------------------------------------------------------------

interface CapabilitySet {
  specialties: string[];
  capabilities: Array<{ name: string; weight: number }>;
}

const PMO_CAPABILITIES: Record<PmoId, { specialties: string[]; capabilities: string[] }> = {
  'tech-office': {
    specialties: ['Infrastructure', 'CI/CD', 'Docker', 'API Design', 'Database', 'TypeScript', 'Cloud Deploy', 'Security'],
    capabilities: ['infrastructure-mgmt', 'ci-cd-pipeline', 'container-orchestration', 'api-development', 'database-design', 'security-hardening', 'cloud-deploy', 'monitoring'],
  },
  'finance-office': {
    specialties: ['Cost Analysis', 'Token Efficiency', 'Budget Planning', 'ROI Modeling', 'Revenue Optimization', 'LUC Governance'],
    capabilities: ['cost-analysis', 'token-optimization', 'budget-planning', 'roi-modeling', 'revenue-forecasting', 'financial-reporting'],
  },
  'ops-office': {
    specialties: ['Workflow Design', 'Automation', 'SLA Management', 'Queue Optimization', 'Monitoring', 'Scaling Strategy'],
    capabilities: ['workflow-orchestration', 'process-automation', 'sla-management', 'queue-optimization', 'health-monitoring', 'capacity-scaling'],
  },
  'marketing-office': {
    specialties: ['Campaign Strategy', 'SEO', 'Social Media', 'Copy Writing', 'A/B Testing', 'Audience Targeting'],
    capabilities: ['campaign-management', 'seo-optimization', 'social-media-mgmt', 'copywriting', 'ab-testing', 'audience-analytics'],
  },
  'design-office': {
    specialties: ['UI/UX Design', 'Video Production', 'Motion Graphics', 'Brand Identity', 'Thumbnail Design', 'Design Systems'],
    capabilities: ['ui-design', 'video-production', 'motion-graphics', 'brand-design', 'asset-generation', 'design-system-mgmt'],
  },
  'publishing-office': {
    specialties: ['Content Publishing', 'Editorial Review', 'Distribution Strategy', 'Community Engagement', 'Newsletter Design'],
    capabilities: ['content-publishing', 'editorial-review', 'distribution-strategy', 'community-mgmt', 'newsletter-creation'],
  },
};

function generateCapabilities(pmoOffice: PmoId, tierConfig: SkillTierConfig): CapabilitySet {
  const pmoCaps = PMO_CAPABILITIES[pmoOffice];

  // Limit specialties based on tier
  const specialties = pmoCaps.specialties.slice(0, tierConfig.maxSpecialties);

  // Generate capabilities with weights based on tier floor
  const capabilities = pmoCaps.capabilities
    .slice(0, tierConfig.maxSpecialties)
    .map((name, i) => ({
      name,
      // First capability gets highest weight, descending
      weight: Math.max(
        tierConfig.capabilityWeightFloor,
        1.0 - (i * 0.08),
      ),
    }));

  return { specialties, capabilities };
}

// ---------------------------------------------------------------------------
// AngForge — Main spawning engine
// ---------------------------------------------------------------------------

export class AngForge {
  private spawnCount = 0;
  private forgeLog: Array<{ angId: string; tier: SkillTier; pmo: PmoId; at: string }> = [];

  /**
   * Forge a new Boomer_Ang for a specific task.
   *
   * Analyzes the task message to determine:
   *   1. Complexity score → Skill tier
   *   2. PMO office → Persona selection
   *   3. Capabilities → Domain-specific skill set
   */
  forge(request: AngSpawnRequest): AngSpawnResult {
    const { message, pmoOffice, director, complexityScore, requestedBy } = request;

    // Resolve skill tier from complexity
    const tierConfig = resolveTier(complexityScore);

    // Select persona from catalog
    const persona = selectPersona(pmoOffice, message, tierConfig.tier);

    // Generate capabilities
    const capSet = generateCapabilities(pmoOffice, tierConfig);

    // Generate unique ID
    this.spawnCount++;
    const serial = String(this.spawnCount).padStart(3, '0');
    const angId = `${persona.codename}-ang-${serial}`;
    const now = new Date().toISOString();

    const ang: SpawnedAngProfile = {
      id: angId,
      name: `${persona.displayName}`,
      persona,
      skillTier: tierConfig.tier,
      tierConfig,
      assignedPmo: pmoOffice,
      director,
      specialties: capSet.specialties,
      capabilities: capSet.capabilities,
      spawnedAt: now,
      spawnedBy: requestedBy,
      spawnReason: message.slice(0, 200),
      complexityScore,
      status: 'DEPLOYED',
      tasksCompleted: 0,
      successRate: 100,
    };

    // Log the forge event
    this.forgeLog.push({ angId, tier: tierConfig.tier, pmo: pmoOffice, at: now });

    logger.info(
      {
        angId,
        name: ang.name,
        persona: persona.codename,
        tier: tierConfig.tier,
        pmo: pmoOffice,
        director,
        complexity: complexityScore,
        specialties: capSet.specialties.length,
      },
      '[AngForge] New Boomer_Ang forged',
    );

    // Build summary
    const summary = [
      `--- Boomer_Ang Forged ---`,
      `Name: ${ang.name} (${tierConfig.label})`,
      `Codename: ${persona.codename}`,
      `PMO: ${pmoOffice} | Director: ${director}`,
      `Tier: ${tierConfig.tier} (complexity: ${complexityScore}/100)`,
      `Traits: ${persona.traits.join(', ')}`,
      `Style: ${persona.communicationStyle}`,
      `Specialties: ${capSet.specialties.join(', ')}`,
      ``,
      `--- Backstory ---`,
      `Origin: ${persona.backstory.origin}`,
      `Motivation: ${persona.backstory.motivation}`,
      `Quirk: ${persona.backstory.quirk}`,
      `Catchphrase: "${persona.backstory.catchphrase}"`,
      `Mentored by: ${persona.backstory.mentoredBy}`,
      ``,
      `--- Capabilities ---`,
      ...capSet.capabilities.map(c => `  ${c.name}: ${(c.weight * 100).toFixed(0)}%`),
      ``,
      `Concurrency: ${tierConfig.maxConcurrency} | Can mentor: ${tierConfig.canMentor} | Can lead squad: ${tierConfig.canLeadSquad}`,
    ].join('\n');

    return { ang, tierLabel: tierConfig.label, summary };
  }

  /**
   * Quick forge — auto-scores complexity from message.
   */
  forgeFromMessage(
    message: string,
    pmoOffice: PmoId,
    director: DirectorId,
    requestedBy = 'ACHEEVY',
  ): AngSpawnResult {
    const factors = scoreComplexity(message);

    return this.forge({
      message,
      pmoOffice,
      director,
      complexityScore: factors.score,
      requestedBy,
    });
  }

  /**
   * Return the forge history.
   */
  getForgeLog() {
    return [...this.forgeLog];
  }

  /**
   * Get total count of forged Boomer_Angs.
   */
  getSpawnCount(): number {
    return this.spawnCount;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const angForge = new AngForge();
