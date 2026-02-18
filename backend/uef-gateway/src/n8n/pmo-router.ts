/**
 * PMO Router — ACHEEVY → Boomer_Ang Delegation Engine
 *
 * Classifies incoming requests and routes them to the correct PMO office.
 * Each Boomer_Ang director validates scope and produces an execution directive
 * for Chicken Hawk.
 *
 * The forge resolves a REAL Boomer_Ang from infra/boomerangs/registry.json
 * and layers on persona + skill tier metadata.
 *
 * Chain: User → ACHEEVY → Boomer_Ang → Chicken Hawk
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { PmoId, DirectorId } from '../pmo/types';
import { pmoRegistry } from '../pmo/registry';
import { houseOfAng } from '../pmo/house-of-ang';
import { scoreComplexity } from '../pmo/ang-forge';
import {
  PmoClassification,
  BoomerDirective,
  CrewSpecialty,
  N8nTriggerPayload,
  ChainPosition,
  PmoPipelinePacket,
} from './types';

// ---------------------------------------------------------------------------
// PMO Keyword Routing Map
// ---------------------------------------------------------------------------

interface PmoKeywordConfig {
  director: DirectorId;
  agent: string;
  keywords: string[];
}

const PMO_KEYWORDS: Record<PmoId, PmoKeywordConfig> = {
  'tech-office': {
    director: 'Boomer_CTO',
    agent: 'DevOps Agent',
    keywords: [
      'deploy', 'infrastructure', 'docker', 'ci/cd', 'pipeline', 'build',
      'server', 'vps', 'architecture', 'devops', 'container', 'kubernetes',
      'api', 'backend', 'database', 'schema', 'migrate', 'nginx', 'ssl', 'dns',
    ],
  },
  'finance-office': {
    director: 'Boomer_CFO',
    agent: 'Value Agent',
    keywords: [
      'budget', 'cost', 'token', 'luc', 'pricing', 'revenue', 'expense',
      'roi', 'financial', 'billing', 'invoice', 'subscription', 'payment', 'stripe',
    ],
  },
  'ops-office': {
    director: 'Boomer_COO',
    agent: 'Flow Boss Agent',
    keywords: [
      'workflow', 'automate', 'schedule', 'cron', 'sla', 'throughput', 'queue',
      'monitor', 'health', 'uptime', 'performance', 'load', 'scaling', 'ops', 'operations',
    ],
  },
  'marketing-office': {
    director: 'Boomer_CMO',
    agent: 'Social Campaign Agent',
    keywords: [
      'campaign', 'marketing', 'social', 'ad', 'seo', 'content', 'brand',
      'growth', 'acquisition', 'funnel', 'conversion', 'twitter', 'linkedin',
      'instagram', 'tiktok', 'outreach', 'email blast',
    ],
  },
  'design-office': {
    director: 'Boomer_CDO',
    agent: 'Video Editing Agent',
    keywords: [
      'video', 'design', 'ui', 'ux', 'graphic', 'thumbnail', 'motion',
      'animation', 'render', 'remotion', 'visual', 'creative', 'logo',
      'brand identity', 'multimedia',
    ],
  },
  'publishing-office': {
    director: 'Boomer_CPO',
    agent: 'Social Agent',
    keywords: [
      'publish', 'post', 'article', 'blog', 'content schedule', 'editorial',
      'newsletter', 'distribution', 'audience', 'engagement', 'community',
    ],
  },
  'hr-office': {
    director: 'Betty-Ann_Ang',
    agent: 'Betty-Ann_Ang',
    keywords: [
      'training', 'coaching', 'progression', 'performance', 'role card', 'onboarding',
      'standards', 'conduct', 'bench level', 'evaluation', 'remediation', 'hr',
      'competency', 'retraining', 'team health',
    ],
  },
  'dtpmo-office': {
    director: 'Astra_Ang',
    agent: 'Astra_Ang',
    keywords: [
      'governance', 'compliance', 'audit', 'risk', 'kyb', 'pattern', 'architecture',
      'reliability', 'uptime', 'cost efficiency', 'quality gate', 'verification',
      'dt-pmo', 'digital transformation', 'automation office',
    ],
  },
};

// ---------------------------------------------------------------------------
// Boomer_Ang Step Generation — per-office execution planning
// ---------------------------------------------------------------------------

interface StepPlan {
  steps: string[];
  crewSpecialties: CrewSpecialty[];
}

function planTechSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('deploy')) {
    steps.push('Prepare deployment manifest', 'Validate Docker configuration', 'Execute deployment to target environment');
  }
  if (message.includes('build')) {
    steps.push('Scaffold project structure', 'Generate component tree', 'Implement core logic');
  }
  if (message.includes('api')) {
    steps.push('Design API schema', 'Implement endpoint handlers', 'Add authentication middleware');
  }
  if (message.includes('database') || message.includes('schema')) {
    steps.push('Design database schema', 'Generate migration files', 'Apply migration');
  }
  if (message.includes('infrastructure') || message.includes('server') || message.includes('vps')) {
    steps.push('Audit current infrastructure', 'Plan infrastructure changes', 'Apply infrastructure updates');
  }
  if (steps.length === 0) {
    steps.push('Analyze technical requirements', 'Plan implementation', 'Execute technical task');
  }
  steps.push('Run ORACLE verification gates');
  return { steps, crewSpecialties: ['crane-ops', 'deploy-ops', 'safety-ops'] };
}

function planFinanceSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('cost') || message.includes('budget')) {
    steps.push('Audit current spending', 'Generate cost breakdown report');
  }
  if (message.includes('pricing') || message.includes('subscription')) {
    steps.push('Analyze pricing tiers', 'Model revenue impact');
  }
  if (message.includes('token') || message.includes('luc')) {
    steps.push('Calculate LUC token efficiency', 'Optimize token allocation');
  }
  if (message.includes('roi')) {
    steps.push('Model return on investment', 'Generate ROI dashboard');
  }
  if (steps.length === 0) {
    steps.push('Analyze financial requirements', 'Generate financial report');
  }
  steps.push('Run financial verification gates');
  return { steps, crewSpecialties: ['load-ops', 'safety-ops'] };
}

function planOpsSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('workflow') || message.includes('automate')) {
    steps.push('Map current workflow', 'Design automation pipeline', 'Implement workflow nodes');
  }
  if (message.includes('schedule') || message.includes('cron')) {
    steps.push('Define schedule parameters', 'Configure cron triggers', 'Set up alerting');
  }
  if (message.includes('monitor') || message.includes('health')) {
    steps.push('Audit system health', 'Configure monitoring dashboards', 'Set up alert thresholds');
  }
  if (message.includes('scaling') || message.includes('performance')) {
    steps.push('Analyze current throughput', 'Identify bottlenecks', 'Implement scaling strategy');
  }
  if (steps.length === 0) {
    steps.push('Analyze operational requirements', 'Design operational workflow', 'Implement operations task');
  }
  steps.push('Run SLA verification gates');
  return { steps, crewSpecialties: ['yard-ops', 'dispatch-ops', 'safety-ops'] };
}

function planMarketingSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('campaign')) {
    steps.push('Define campaign objectives', 'Create campaign assets', 'Schedule campaign distribution');
  }
  if (message.includes('seo')) {
    steps.push('Run SEO audit', 'Generate keyword strategy', 'Implement on-page optimizations');
  }
  if (message.includes('social') || message.includes('twitter') || message.includes('linkedin')) {
    steps.push('Analyze target audience', 'Create social content calendar', 'Draft social media posts');
  }
  if (message.includes('email') || message.includes('outreach')) {
    steps.push('Build email list segments', 'Draft outreach templates', 'Configure send automation');
  }
  if (steps.length === 0) {
    steps.push('Analyze marketing requirements', 'Create marketing strategy', 'Execute marketing campaign');
  }
  steps.push('Run campaign verification gates');
  return { steps, crewSpecialties: ['load-ops', 'dispatch-ops'] };
}

function planDesignSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('video') || message.includes('remotion')) {
    steps.push('Storyboard video concept', 'Generate video assets', 'Render final video');
  }
  if (message.includes('design') || message.includes('ui') || message.includes('ux')) {
    steps.push('Audit current design system', 'Create design mockups', 'Implement design tokens');
  }
  if (message.includes('thumbnail') || message.includes('graphic')) {
    steps.push('Define visual concept', 'Generate graphic assets', 'Optimize for platform specs');
  }
  if (message.includes('animation') || message.includes('motion')) {
    steps.push('Design motion storyboard', 'Build animation keyframes', 'Render motion graphics');
  }
  if (steps.length === 0) {
    steps.push('Analyze design requirements', 'Create design deliverables', 'Review visual consistency');
  }
  steps.push('Run design quality verification gates');
  return { steps, crewSpecialties: ['crane-ops', 'load-ops'] };
}

function planPublishingSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('publish') || message.includes('post')) {
    steps.push('Prepare content for publication', 'Format for target platform', 'Schedule publication');
  }
  if (message.includes('article') || message.includes('blog')) {
    steps.push('Draft article outline', 'Write article content', 'Edit and proofread');
  }
  if (message.includes('newsletter')) {
    steps.push('Curate newsletter content', 'Design newsletter layout', 'Schedule newsletter send');
  }
  if (message.includes('distribution') || message.includes('audience')) {
    steps.push('Analyze audience segments', 'Plan distribution strategy', 'Execute distribution');
  }
  if (steps.length === 0) {
    steps.push('Analyze publishing requirements', 'Create content deliverables', 'Execute publication workflow');
  }
  steps.push('Run editorial verification gates');
  return { steps, crewSpecialties: ['load-ops', 'dispatch-ops'] };
}

function planHrSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('training') || message.includes('coaching')) {
    steps.push('Identify skill gaps', 'Design training plan', 'Schedule coaching sessions');
  }
  if (message.includes('performance') || message.includes('evaluation')) {
    steps.push('Gather performance metrics', 'Run scoring rubric', 'Package evaluation report');
  }
  if (message.includes('onboarding') || message.includes('progression')) {
    steps.push('Prepare role card', 'Set progression milestones', 'Assign mentor');
  }
  if (steps.length === 0) {
    steps.push('Assess HR request', 'Route to appropriate HR specialist', 'Execute HR workflow');
  }
  steps.push('Run HR compliance gates');
  return { steps, crewSpecialties: ['load-ops', 'dispatch-ops'] };
}

function planDtpmoSteps(message: string): StepPlan {
  const steps: string[] = [];
  if (message.includes('governance') || message.includes('compliance')) {
    steps.push('Review governance requirements', 'Validate compliance status', 'Document findings');
  }
  if (message.includes('architecture') || message.includes('pattern')) {
    steps.push('Review architecture proposal', 'Check pattern compliance', 'Approve or recommend changes');
  }
  if (message.includes('cost') || message.includes('efficiency')) {
    steps.push('Analyze cost metrics', 'Identify optimization opportunities', 'Deliver efficiency report');
  }
  if (message.includes('automation') || message.includes('workflow')) {
    steps.push('Evaluate workflow requirements', 'Route to Automation Systems Office', 'Monitor execution');
  }
  if (steps.length === 0) {
    steps.push('Assess DT-PMO request', 'Route to appropriate office lead', 'Execute governance workflow');
  }
  steps.push('Run DT-PMO verification gates');
  return { steps, crewSpecialties: ['load-ops', 'dispatch-ops'] };
}

const STEP_PLANNERS: Record<PmoId, (message: string) => StepPlan> = {
  'tech-office': planTechSteps,
  'finance-office': planFinanceSteps,
  'ops-office': planOpsSteps,
  'marketing-office': planMarketingSteps,
  'design-office': planDesignSteps,
  'publishing-office': planPublishingSteps,
  'hr-office': planHrSteps,
  'dtpmo-office': planDtpmoSteps,
};

// ---------------------------------------------------------------------------
// ACHEEVY Classifier — intent → PMO office
// ---------------------------------------------------------------------------

export function classifyIntent(message: string): PmoClassification {
  const lower = message.toLowerCase();
  let matchedOffice: PmoId = 'ops-office'; // default fallback
  let matchScore = 0;
  let matchedKeywords: string[] = [];

  for (const [officeId, config] of Object.entries(PMO_KEYWORDS) as [PmoId, PmoKeywordConfig][]) {
    let score = 0;
    const hits: string[] = [];
    for (const kw of config.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(' ').length; // multi-word keywords score higher
        hits.push(kw);
      }
    }
    if (score > matchScore) {
      matchScore = score;
      matchedOffice = officeId;
      matchedKeywords = hits;
    }
  }

  const office = PMO_KEYWORDS[matchedOffice];
  const isSimple = matchScore <= 2 && message.length < 200;

  logger.info(
    { office: matchedOffice, director: office.director, confidence: Math.min(matchScore / 5, 1.0), keywords: matchedKeywords },
    '[PMO Router] Intent classified',
  );

  return {
    pmoOffice: matchedOffice,
    director: office.director,
    departmentalAgent: office.agent,
    matchedKeywords,
    confidence: Math.min(matchScore / 5, 1.0),
    executionLane: isSimple ? 'deploy_it' : 'guide_me',
  };
}

// ---------------------------------------------------------------------------
// Boomer_Ang Director — scope validation + step planning
// ---------------------------------------------------------------------------

export function buildDirective(classification: PmoClassification, message: string): BoomerDirective {
  const planner = STEP_PLANNERS[classification.pmoOffice];
  const plan = planner(message.toLowerCase());

  const office = pmoRegistry.get(classification.pmoOffice);
  const authority = office?.director.authority ?? 'General PMO authority';

  logger.info(
    { director: classification.director, office: classification.pmoOffice, steps: plan.steps.length },
    '[PMO Router] Boomer_Ang directive built',
  );

  return {
    director: classification.director,
    office: classification.pmoOffice,
    inScope: true,
    authority,
    executionSteps: plan.steps,
    crewSpecialties: plan.crewSpecialties,
    squadSize: Math.min(plan.steps.length, 6),
  };
}

// ---------------------------------------------------------------------------
// Pipeline Entry — creates the initial PmoPipelinePacket
// ---------------------------------------------------------------------------

export function createPipelinePacket(payload: N8nTriggerPayload): PmoPipelinePacket {
  const requestId = payload.requestId || `REQ-${uuidv4().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  // Step 1: ACHEEVY classifies intent → PMO office
  const classification = classifyIntent(payload.message);

  // Step 2: Forge — resolve a real Boomer_Ang from registry + assign bench level
  const complexity = scoreComplexity(payload.message);
  const forgeResult = houseOfAng.forgeForTask(
    payload.message,
    classification.pmoOffice,
    classification.director,
    payload.userId || 'ACHEEVY',
  );

  const { profile } = forgeResult;

  logger.info(
    {
      requestId,
      resolvedAng: profile.definition.name,
      angId: profile.definition.id,
      endpoint: profile.definition.endpoint,
      bench: profile.benchLevel,
      complexity: complexity.score,
      persona: profile.persona.codename,
      resolvedFromRegistry: profile.resolvedFromRegistry,
      canLeadSquad: profile.benchConfig.canLeadSquad,
      canMentor: profile.benchConfig.canMentor,
    },
    '[PMO Router] Boomer_Ang resolved from registry',
  );

  // Step 3: Resolved Boomer_Ang builds execution directive
  const directive = buildDirective(classification, payload.message);

  const chain: ChainPosition = {
    step: 2,
    current: 'Boomer_Ang',
    next: 'Chicken Hawk',
    path: ['User', 'ACHEEVY', profile.definition.name, 'Chicken Hawk', 'Squad', 'Lil_Hawks', 'Receipt', 'ACHEEVY'],
    startedAt: now,
  };

  logger.info(
    { requestId, userId: payload.userId, office: classification.pmoOffice, director: classification.director, angId: profile.definition.id },
    '[PMO Router] Pipeline packet created — handing to Chicken Hawk',
  );

  return {
    requestId,
    userId: payload.userId,
    message: payload.message,
    timestamp: now,
    classification,
    chainOfCommand: chain,
    boomerDirective: directive,
  };
}
