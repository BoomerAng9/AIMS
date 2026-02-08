/**
 * AngForge — Boomer_Ang Resolution & Bench Assignment Engine
 *
 * The forge resolves tasks to REAL Boomer_Angs from the canonical registry
 * (infra/boomerangs/registry.json) and layers on persona + bench level metadata.
 *
 * Resolution flow:
 *   1. Score task complexity → determine bench level (INTERN / INTERMEDIATE / EXPERT)
 *   2. Map PMO office → registry Boomer_Ang IDs (via PMO_ANG_ROSTER)
 *   3. Pick the best-fit Boomer_Ang from the capability index
 *   4. Assign persona from the catalog (persona = flavor, NOT authority)
 *   5. Return ForgedAngProfile = BoomerAngDefinition + persona + bench
 *
 * THREE bench levels:
 *   INTERN         (0-30)   — Production muscle. Never strategy.
 *   INTERMEDIATE   (31-65)  — Skilled operator. Owns workflows, not vision.
 *   EXPERT         (66-100) — PMO-grade specialist. Owns outcomes.
 *
 * A Boomer_Ang IS a service. The forge never invents fictional endpoints.
 * It either resolves to an existing registry entry or returns a
 * "pending_provision" placeholder for services not yet deployed.
 *
 * Chain of Command:
 *   User → ACHEEVY → PMO Manager → Expert/Intermediate Ang → Chicken_Hawk → Lil_Hawks
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import fs from 'fs';
import path from 'path';
import logger from '../logger';
import type { PmoId, DirectorId } from './types';
import {
  BenchLevel,
  BenchConfig,
  BENCH_LEVELS,
  AngPersona,
  BoomerAngDefinition,
  BoomerAngRegistry,
  ForgedAngProfile,
  AngForgeRequest,
  AngForgeResult,
} from './persona-types';
import { getPersonaForAng, getAngIdsForOffice } from './persona-catalog';
import { getJobsForBench } from './pmo-job-map';

// ---------------------------------------------------------------------------
// Registry Loader — reads infra/boomerangs/registry.json
// ---------------------------------------------------------------------------

const REGISTRY_PATH = process.env.BOOMERANG_REGISTRY_PATH
  || path.resolve(__dirname, '../../../../infra/boomerangs/registry.json');

let cachedRegistry: BoomerAngRegistry | null = null;

function loadRegistry(): BoomerAngRegistry {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    const parsed: BoomerAngRegistry = JSON.parse(raw);
    logger.info(
      { version: parsed.version, count: parsed.boomerangs.length },
      '[AngForge] Registry loaded from disk',
    );
    return parsed;
  } catch (err) {
    logger.warn({ path: REGISTRY_PATH, err }, '[AngForge] Failed to load registry — using empty fallback');
    return { boomerangs: [], capability_index: {}, version: '0.0.0', last_updated: new Date().toISOString() };
  }
}

function getRegistry(): BoomerAngRegistry {
  if (!cachedRegistry) {
    cachedRegistry = loadRegistry();
  }
  return cachedRegistry;
}

export function reloadRegistry(): void {
  cachedRegistry = loadRegistry();
}

// ---------------------------------------------------------------------------
// Complexity Scorer — analyzes task message to determine bench level
// ---------------------------------------------------------------------------

interface ComplexityFactors {
  wordCount: number;
  technicalDepth: number;
  multiStepSignals: number;
  integrationCount: number;
  riskSignals: number;
  score: number;
}

const COMPLEXITY_KEYWORDS: Record<string, number> = {
  // High complexity (+8)
  'architecture': 8, 'migrate': 8, 'production': 8, 'enterprise': 8,
  'kubernetes': 8, 'distributed': 8, 'microservice': 8, 'multi-tenant': 8,
  'compliance': 8, 'audit': 8, 'security': 8,

  // Medium-high (+5)
  'pipeline': 5, 'orchestrate': 5, 'integrate': 5, 'deploy': 5,
  'database': 5, 'schema': 5, 'api': 5, 'authentication': 5,
  'workflow': 5, 'automate': 5, 'campaign': 5, 'analytics': 5,
  'optimization': 5, 'scale': 5, 'performance': 5,

  // Medium (+3)
  'build': 3, 'create': 3, 'implement': 3, 'design': 3,
  'test': 3, 'refactor': 3, 'update': 3, 'configure': 3,
  'publish': 3, 'schedule': 3, 'monitor': 3, 'report': 3,
  'video': 3, 'render': 3, 'content': 3,

  // Low (+1)
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
  'aws', 'gcp', 'vercel', 'cloudflare', 'elevenlabs',
];

const RISK_SIGNALS = [
  'production', 'security', 'financial', 'billing', 'payment',
  'credentials', 'secrets', 'ssl', 'certificate', 'compliance',
  'gdpr', 'pci', 'hipaa', 'delete', 'drop', 'rollback',
];

export function scoreComplexity(message: string): ComplexityFactors {
  const lower = message.toLowerCase();
  const words = message.split(/\s+/);

  const wordCount = words.length;
  const wordScore = Math.min(wordCount / 5, 15);

  let technicalDepth = 0;
  for (const [keyword, weight] of Object.entries(COMPLEXITY_KEYWORDS)) {
    if (lower.includes(keyword)) technicalDepth += weight;
  }
  technicalDepth = Math.min(technicalDepth, 40);

  let multiStepSignals = 0;
  for (const signal of MULTI_STEP_SIGNALS) {
    if (lower.includes(signal)) multiStepSignals++;
  }
  const multiStepScore = Math.min(multiStepSignals * 5, 20);

  let integrationCount = 0;
  for (const sig of INTEGRATION_SIGNALS) {
    if (lower.includes(sig)) integrationCount++;
  }
  const integrationScore = Math.min(integrationCount * 4, 15);

  let riskSignals = 0;
  for (const sig of RISK_SIGNALS) {
    if (lower.includes(sig)) riskSignals++;
  }
  const riskScore = Math.min(riskSignals * 3, 10);

  const score = Math.min(
    Math.round(wordScore + technicalDepth + multiStepScore + integrationScore + riskScore),
    100,
  );

  return { wordCount, technicalDepth, multiStepSignals, integrationCount, riskSignals, score };
}

// ---------------------------------------------------------------------------
// Bench Resolver — complexity score → bench level
//
// INTERN:       0-30   — They do, they do not think.
// INTERMEDIATE: 31-65  — They execute with judgment, but don't set direction.
// EXPERT:       66-100 — They think, decide, and are accountable.
// ---------------------------------------------------------------------------

export function resolveBench(complexityScore: number): BenchConfig {
  for (const bench of BENCH_LEVELS) {
    if (complexityScore >= bench.complexityRange[0] && complexityScore <= bench.complexityRange[1]) {
      return bench;
    }
  }
  return BENCH_LEVELS[1]; // default INTERMEDIATE
}

// ---------------------------------------------------------------------------
// Capability Matcher — matches task keywords to registry capabilities
// ---------------------------------------------------------------------------

/**
 * Maps task keywords to registry capability names.
 * These align with the capability_index in infra/boomerangs/registry.json.
 */
const KEYWORD_CAPABILITY_MAP: Record<string, string[]> = {
  // Research
  'research': ['brave_web_search', 'academic_research'],
  'search': ['brave_web_search'],
  'investigate': ['brave_web_search', 'fact_verification'],
  'verify': ['fact_verification', 'gate_verification'],

  // Voice / Audio
  'voice': ['text_to_speech', 'audio_transcription'],
  'speech': ['text_to_speech'],
  'transcri': ['audio_transcription'],
  'tts': ['text_to_speech'],

  // Video / Vision
  'video': ['video_transcoding', 'scene_detection'],
  'image': ['image_analysis', 'ocr_extraction'],
  'ocr': ['ocr_extraction'],
  'thumbnail': ['image_analysis'],

  // Automation / Workflows
  'automate': ['workflow_creation', 'scheduled_tasks'],
  'workflow': ['workflow_creation', 'webhook_triggers'],
  'webhook': ['webhook_triggers'],
  'schedule': ['scheduled_tasks'],
  'cron': ['scheduled_tasks'],
  'n8n': ['workflow_creation', 'webhook_triggers'],

  // Site Building
  'website': ['page_creation', 'template_deployment'],
  'landing': ['page_creation', 'visual_editing'],
  'page': ['page_creation'],
  'cms': ['cms_management'],

  // Code / Development
  'code': ['code_generation', 'sandbox_execution'],
  'build': ['code_generation'],
  'debug': ['debugging'],
  'refactor': ['refactoring'],
  'develop': ['code_generation', 'debugging'],

  // Orchestration
  'orchestrate': ['task_decomposition', 'parallel_execution'],
  'multi-agent': ['agent_spawning', 'parallel_execution'],
  'pipeline': ['task_decomposition'],

  // Marketing
  'seo': ['seo_audit', 'copy_generation'],
  'campaign': ['campaign_flows', 'social_scheduling'],
  'marketing': ['seo_audit', 'campaign_flows'],
  'social': ['social_scheduling'],
  'copy': ['copy_generation'],

  // Data / Analytics
  'data': ['data_extraction', 'data_transformation'],
  'analytics': ['data_extraction', 'report_generation'],
  'dashboard': ['visualization', 'report_generation'],
  'report': ['report_generation'],
  'etl': ['data_extraction', 'data_transformation'],

  // Quality / Audit
  'audit': ['security_audit', 'compliance_check'],
  'quality': ['gate_verification', 'code_review'],
  'security': ['security_audit'],
  'review': ['code_review'],
  'oracle': ['gate_verification'],
};

function extractCapabilities(message: string): string[] {
  const lower = message.toLowerCase();
  const caps = new Set<string>();
  for (const [keyword, capabilities] of Object.entries(KEYWORD_CAPABILITY_MAP)) {
    if (lower.includes(keyword)) {
      for (const cap of capabilities) caps.add(cap);
    }
  }
  return Array.from(caps);
}

function resolveFromCapabilities(capabilities: string[]): BoomerAngDefinition[] {
  const registry = getRegistry();
  const matchedIds = new Set<string>();
  for (const cap of capabilities) {
    const ids = registry.capability_index[cap];
    if (ids) {
      for (const id of ids) matchedIds.add(id);
    }
  }
  return registry.boomerangs.filter(b => matchedIds.has(b.id));
}

function resolveFromPmo(pmoOffice: PmoId): BoomerAngDefinition[] {
  const registry = getRegistry();
  const ids = getAngIdsForOffice(pmoOffice);
  return registry.boomerangs.filter(b => ids.includes(b.id));
}

// ---------------------------------------------------------------------------
// Fallback Persona
// ---------------------------------------------------------------------------

function fallbackPersona(angDef: BoomerAngDefinition): AngPersona {
  return {
    displayName: angDef.name,
    codename: angDef.id.replace(/_ang$/, ''),
    traits: ['disciplined', 'resourceful'],
    communicationStyle: 'direct',
    backstory: {
      origin: `Registered as ${angDef.name} in the AIMS Boomer_Ang registry.`,
      motivation: angDef.description,
      quirk: 'Stays focused on the task. No small talk.',
      catchphrase: 'Activity breeds Activity.',
      mentoredBy: 'ACHEEVY',
    },
    avatar: 'bot',
  };
}

// ---------------------------------------------------------------------------
// AngForge — Main engine
// ---------------------------------------------------------------------------

export class AngForge {
  private forgeCount = 0;
  private forgeLog: Array<{ angId: string; bench: BenchLevel; pmo: PmoId; at: string }> = [];

  /**
   * Forge a Boomer_Ang assignment for a task.
   *
   * Resolution order:
   *   1. Extract capabilities from message → match in registry
   *   2. Fall back to PMO office roster
   *   3. Assign persona from catalog (persona = flavor, NOT authority)
   *   4. Determine bench level from complexity (bench = authority)
   */
  forge(request: AngForgeRequest): AngForgeResult {
    const { message, pmoOffice, director, complexityScore, requestedBy } = request;

    // Resolve bench level (THIS governs authority)
    const benchConfig = resolveBench(complexityScore);

    // Step 1: Try capability-based resolution
    const capabilities = extractCapabilities(message);
    let matched = resolveFromCapabilities(capabilities);

    // Step 2: Fall back to PMO roster
    if (matched.length === 0) {
      matched = resolveFromPmo(pmoOffice);
    }

    // Step 3: Pick best-fit
    let resolvedFromRegistry = true;
    let definition: BoomerAngDefinition;

    if (matched.length > 0) {
      const pmoIds = new Set(getAngIdsForOffice(pmoOffice));
      const pmoFiltered = matched.filter(m => pmoIds.has(m.id));
      definition = pmoFiltered.length > 0 ? pmoFiltered[0] : matched[0];
    } else {
      resolvedFromRegistry = false;
      const placeholderId = `pending_${pmoOffice.replace('-office', '')}_ang`;
      definition = {
        id: placeholderId,
        name: `Pending_${pmoOffice.replace('-office', '').charAt(0).toUpperCase() + pmoOffice.replace('-office', '').slice(1)}_Ang`,
        source_repo: 'aims/pending-provision',
        description: `Pending Boomer_Ang for ${pmoOffice} — awaiting service provisioning`,
        capabilities,
        required_quotas: { api_calls: 5 },
        endpoint: `http://${placeholderId.replace(/_/g, '-')}:8200/execute`,
        health_check: `http://${placeholderId.replace(/_/g, '-')}:8200/health`,
        status: 'registered',
      };
      logger.warn(
        { placeholderId, pmoOffice, capabilities },
        '[AngForge] No registry match — created pending provision placeholder',
      );
    }

    // Step 4: Assign persona (flavor, NOT authority)
    const catalogPersona = getPersonaForAng(definition.id);
    const persona = catalogPersona ?? fallbackPersona(definition);

    // Build profile
    this.forgeCount++;
    const now = new Date().toISOString();

    const profile: ForgedAngProfile = {
      definition,
      persona,
      benchLevel: benchConfig.bench,
      benchConfig,
      assignedPmo: pmoOffice,
      director,
      forgedAt: now,
      forgedBy: requestedBy,
      forgeReason: message.slice(0, 200),
      complexityScore,
      resolvedFromRegistry,
    };

    this.forgeLog.push({ angId: definition.id, bench: benchConfig.bench, pmo: pmoOffice, at: now });

    logger.info(
      {
        angId: definition.id,
        name: definition.name,
        persona: persona.codename,
        bench: benchConfig.bench,
        pmo: pmoOffice,
        director,
        complexity: complexityScore,
        resolvedFromRegistry,
        canLeadSquad: benchConfig.canLeadSquad,
        canMentor: benchConfig.canMentor,
      },
      '[AngForge] Boomer_Ang resolved — bench level assigned',
    );

    // Get PMO-specific jobs for this bench level
    const pmoJobs = getJobsForBench(pmoOffice, benchConfig.bench);
    const ac = benchConfig.acceptanceCriteria;

    // Build summary
    const summary = [
      `--- Boomer_Ang Forged ---`,
      `Service: ${definition.name} (${definition.id})`,
      `Endpoint: ${definition.endpoint}`,
      `Capabilities: ${definition.capabilities.join(', ')}`,
      `Status: ${definition.status}`,
      `Registry: ${resolvedFromRegistry ? 'RESOLVED' : 'PENDING_PROVISION'}`,
      ``,
      `--- Bench Level ---`,
      `Bench: ${benchConfig.bench} (${benchConfig.label})`,
      `Complexity: ${complexityScore}/100`,
      `Concurrency: ${benchConfig.concurrency[0]}-${benchConfig.concurrency[1]}`,
      `Authority: Mentor=${benchConfig.canMentor} | Guide=${benchConfig.canGuideInterns} | LeadSquad=${benchConfig.canLeadSquad} | ACHEEVY=${benchConfig.canInterfaceAcheevy}`,
      ``,
      `--- PMO Job Scope (${pmoOffice}) ---`,
      ...pmoJobs.map(j => `  • ${j}`),
      ``,
      `--- Quality Gates ---`,
      ...ac.qualityGates.map(g => `  ${g.metric}: ${g.threshold} — ${g.description}`),
      ``,
      `--- Assignment ---`,
      `PMO: ${pmoOffice} | Director: ${director}`,
      ``,
      `--- Persona (flavor only) ---`,
      `Name: ${persona.displayName} (${persona.codename})`,
      `Traits: ${persona.traits.join(', ')}`,
      `Style: ${persona.communicationStyle}`,
      `Catchphrase: "${persona.backstory.catchphrase}"`,
    ].join('\n');

    return { profile, benchLabel: benchConfig.label, summary };
  }

  /**
   * Quick forge — auto-scores complexity from message.
   */
  forgeFromMessage(
    message: string,
    pmoOffice: PmoId,
    director: DirectorId,
    requestedBy = 'ACHEEVY',
  ): AngForgeResult {
    const factors = scoreComplexity(message);
    return this.forge({
      message,
      pmoOffice,
      director,
      complexityScore: factors.score,
      requestedBy,
    });
  }

  /** Return the forge history. */
  getForgeLog() {
    return [...this.forgeLog];
  }

  /** Get total count of forge operations. */
  getSpawnCount(): number {
    return this.forgeCount;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const angForge = new AngForge();
