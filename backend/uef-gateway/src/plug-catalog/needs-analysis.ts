/**
 * Business Client Needs Analysis
 *
 * A formal intake form that gathers requirements from business clients
 * BEFORE we build anything. We don't implement what they don't want —
 * we gather information, digest it, then create with our tools.
 *
 * Flow:
 * 1. Client answers needs analysis questions (5 sections)
 * 2. Engine analyzes responses → determines recommended plugs, tier, security
 * 3. Risk assessment runs automatically for business clients
 * 4. Recommendations presented to client for approval
 * 5. Approved config flows into Plug Deploy Engine
 *
 * Sections:
 * - Business: Company, industry, goals, team size
 * - Technical: Existing stack, integrations, data sources
 * - Security: Data sensitivity, compliance, access controls
 * - Delivery: Hosted vs self-hosted, SLA, support needs
 * - Budget: Monthly budget, scaling expectations
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { plugCatalog } from './catalog';
import type {
  NeedsQuestion,
  NeedsResponse,
  NeedsAnalysisResult,
  PlugTier,
  DeliveryMode,
  SecurityLevel,
} from './types';

// ---------------------------------------------------------------------------
// Question Bank
// ---------------------------------------------------------------------------

const NEEDS_QUESTIONS: NeedsQuestion[] = [
  // ── BUSINESS ────────────────────────────────────────────────────────────
  {
    id: 'company-name',
    section: 'business',
    question: 'What is your company or project name?',
    type: 'text',
    required: true,
  },
  {
    id: 'industry',
    section: 'business',
    question: 'What industry are you in?',
    type: 'select',
    options: [
      'technology', 'real-estate', 'construction', 'healthcare', 'legal',
      'education', 'fitness', 'finance', 'e-commerce', 'manufacturing',
      'media-entertainment', 'professional-services', 'non-profit', 'other',
    ],
    required: true,
  },
  {
    id: 'team-size',
    section: 'business',
    question: 'How many people will use this tool?',
    type: 'select',
    options: ['just-me', '2-5', '6-20', '21-100', '100+'],
    required: true,
    helpText: 'This helps us determine the right tier and resource allocation.',
  },
  {
    id: 'primary-goal',
    section: 'business',
    question: 'What is your primary goal?',
    type: 'select',
    options: [
      'automate-workflows',
      'build-ai-agents',
      'research-analysis',
      'content-creation',
      'code-development',
      'customer-service',
      'data-extraction',
      'internal-tools',
      'other',
    ],
    required: true,
  },
  {
    id: 'specific-workflows',
    section: 'business',
    question: 'Describe the specific workflows or tasks you want to automate',
    type: 'text',
    required: true,
    helpText: 'Be specific — e.g., "scrape product listings from competitor sites weekly" or "auto-generate social media content from blog posts"',
  },

  // ── TECHNICAL ───────────────────────────────────────────────────────────
  {
    id: 'existing-tools',
    section: 'technical',
    question: 'What tools do you currently use?',
    type: 'multi-select',
    options: [
      'slack', 'microsoft-teams', 'google-workspace', 'notion', 'jira',
      'salesforce', 'hubspot', 'shopify', 'quickbooks', 'zapier',
      'n8n', 'airtable', 'zoho', 'none',
    ],
    required: false,
    helpText: 'We can integrate with your existing stack.',
  },
  {
    id: 'data-sources',
    section: 'technical',
    question: 'Where does your data come from?',
    type: 'multi-select',
    options: [
      'manual-entry', 'spreadsheets', 'databases', 'apis',
      'web-scraping', 'email', 'crm', 'erp', 'legacy-software', 'files',
    ],
    required: true,
  },
  {
    id: 'legacy-systems',
    section: 'technical',
    question: 'Do you have legacy systems that lack APIs?',
    type: 'toggle',
    required: true,
    helpText: 'If yes, we can use computer-use agents to interact with them.',
  },
  {
    id: 'tech-comfort',
    section: 'technical',
    question: 'What is your technical comfort level?',
    type: 'select',
    options: ['non-technical', 'basic', 'intermediate', 'developer'],
    required: true,
  },

  // ── SECURITY ────────────────────────────────────────────────────────────
  {
    id: 'data-sensitivity',
    section: 'security',
    question: 'What type of data will the tool process?',
    type: 'multi-select',
    options: [
      'public-data', 'internal-business', 'customer-pii', 'financial',
      'health-records', 'legal-documents', 'trade-secrets', 'none-sensitive',
    ],
    required: true,
    helpText: 'This determines the security level of your deployment.',
  },
  {
    id: 'compliance',
    section: 'security',
    question: 'Do you need to comply with any regulations?',
    type: 'multi-select',
    options: ['none', 'gdpr', 'ccpa', 'hipaa', 'soc2', 'pci-dss', 'iso-27001', 'fedramp'],
    required: true,
  },
  {
    id: 'access-control',
    section: 'security',
    question: 'Do you need role-based access control?',
    type: 'toggle',
    required: true,
    helpText: 'Restricts who can access and configure the tool.',
  },

  // ── DELIVERY ────────────────────────────────────────────────────────────
  {
    id: 'hosting-preference',
    section: 'delivery',
    question: 'Where do you want the tool hosted?',
    type: 'select',
    options: ['aims-hosted', 'self-hosted', 'hybrid', 'undecided'],
    required: true,
    helpText: 'AIMS-hosted: we manage everything. Self-hosted: we export and you run it. Hybrid: core on AIMS, extensions on your infra.',
  },
  {
    id: 'uptime-requirement',
    section: 'delivery',
    question: 'What uptime do you need?',
    type: 'select',
    options: ['best-effort', '99-percent', '99.9-percent', '99.99-percent'],
    required: true,
  },
  {
    id: 'support-level',
    section: 'delivery',
    question: 'What support level do you need?',
    type: 'select',
    options: ['self-service', 'email-support', 'priority-support', 'dedicated-account'],
    required: true,
  },

  // ── BUDGET ──────────────────────────────────────────────────────────────
  {
    id: 'monthly-budget',
    section: 'budget',
    question: 'What is your monthly budget for this tool?',
    type: 'select',
    options: ['under-50', '50-200', '200-500', '500-2000', '2000-plus', 'flexible'],
    required: true,
  },
  {
    id: 'scaling-plan',
    section: 'budget',
    question: 'Do you expect to scale usage over time?',
    type: 'select',
    options: ['stable', 'moderate-growth', 'rapid-growth', 'unknown'],
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Industry → Plug Recommendation Mapping
// ---------------------------------------------------------------------------

const INDUSTRY_PLUG_MAP: Record<string, string[]> = {
  technology: ['ii-agent', 'n8n', 'agent-zero', 'deerflow', 'windmill'],
  'real-estate': ['n8n', 'browser-use', 'content-engine', 'deerflow'],
  construction: ['n8n', 'browser-use', 'content-engine'],
  healthcare: ['n8n', 'deerflow', 'content-engine'],
  legal: ['deerflow', 'n8n', 'content-engine'],
  education: ['ii-agent', 'n8n', 'content-engine', 'deerflow'],
  fitness: ['n8n', 'content-engine', 'browser-use'],
  finance: ['n8n', 'deerflow', 'browser-use'],
  'e-commerce': ['n8n', 'browser-use', 'content-engine', 'trey-ai'],
  manufacturing: ['n8n', 'browser-use', 'trey-ai'],
  'media-entertainment': ['content-engine', 'deerflow', 'n8n', 'personaplex'],
  'professional-services': ['n8n', 'deerflow', 'content-engine', 'ii-agent'],
  'non-profit': ['n8n', 'content-engine', 'deerflow'],
  other: ['n8n', 'deerflow', 'ii-agent'],
};

const GOAL_PLUG_MAP: Record<string, string[]> = {
  'automate-workflows': ['n8n', 'windmill', 'openclaw'],
  'build-ai-agents': ['agent-zero', 'openclaw', 'ii-agent'],
  'research-analysis': ['deerflow', 'browser-use'],
  'content-creation': ['content-engine', 'n8n'],
  'code-development': ['ii-agent', 'agent-zero'],
  'customer-service': ['personaplex', 'n8n', 'openclaw'],
  'data-extraction': ['browser-use', 'trey-ai', 'n8n'],
  'internal-tools': ['n8n', 'windmill', 'ii-agent'],
  other: ['n8n', 'ii-agent'],
};

// ---------------------------------------------------------------------------
// Needs Analysis Engine
// ---------------------------------------------------------------------------

export class NeedsAnalysisEngine {
  /** Return the full question bank. */
  getQuestions(section?: string): NeedsQuestion[] {
    if (section) {
      return NEEDS_QUESTIONS.filter(q => q.section === section);
    }
    return [...NEEDS_QUESTIONS];
  }

  /** Get section names in order. */
  getSections(): string[] {
    return ['business', 'technical', 'security', 'delivery', 'budget'];
  }

  /** Analyze responses and produce recommendations. */
  analyze(userId: string, responses: NeedsResponse[]): NeedsAnalysisResult {
    logger.info(
      { userId, responseCount: responses.length },
      '[NeedsAnalysis] Analyzing responses',
    );

    const answer = (qId: string): string | string[] | number | boolean | undefined => {
      const r = responses.find(resp => resp.questionId === qId);
      return r?.answer;
    };

    const strAnswer = (qId: string): string =>
      (typeof answer(qId) === 'string' ? answer(qId) as string : '') || '';

    const arrAnswer = (qId: string): string[] => {
      const a = answer(qId);
      if (Array.isArray(a)) return a as string[];
      return [];
    };

    const boolAnswer = (qId: string): boolean =>
      answer(qId) === true || answer(qId) === 'true';

    // Extract key responses
    const companyName = strAnswer('company-name');
    const industry = strAnswer('industry');
    const teamSize = strAnswer('team-size');
    const primaryGoal = strAnswer('primary-goal');
    const dataSensitivity = arrAnswer('data-sensitivity');
    const compliance = arrAnswer('compliance');
    const hostingPref = strAnswer('hosting-preference');
    const budget = strAnswer('monthly-budget');
    const legacySystems = boolAnswer('legacy-systems');
    const uptimeReq = strAnswer('uptime-requirement');

    // ── Recommend Plugs ──────────────────────────────────────────────────
    const plugScores = new Map<string, number>();

    // Industry-based recommendations
    const industryPlugs = INDUSTRY_PLUG_MAP[industry] || INDUSTRY_PLUG_MAP['other'];
    for (const plugId of industryPlugs) {
      plugScores.set(plugId, (plugScores.get(plugId) || 0) + 3);
    }

    // Goal-based recommendations
    const goalPlugs = GOAL_PLUG_MAP[primaryGoal] || GOAL_PLUG_MAP['other'];
    for (const plugId of goalPlugs) {
      plugScores.set(plugId, (plugScores.get(plugId) || 0) + 5);
    }

    // Legacy systems → computer use agents
    if (legacySystems) {
      plugScores.set('openclaw', (plugScores.get('openclaw') || 0) + 4);
      plugScores.set('trey-ai', (plugScores.get('trey-ai') || 0) + 4);
      plugScores.set('browser-use', (plugScores.get('browser-use') || 0) + 3);
    }

    // Sort by score, take top recommendations
    const sorted = Array.from(plugScores.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([plugId]) => plugCatalog.get(plugId))
      .map(([plugId]) => plugId);

    const recommendedPlugs = sorted.slice(0, 5);

    // ── Determine Tier ───────────────────────────────────────────────────
    let recommendedTier: PlugTier = 'starter';
    if (teamSize === '100+' || budget === '2000-plus') {
      recommendedTier = 'enterprise';
    } else if (teamSize === '21-100' || budget === '500-2000') {
      recommendedTier = 'pro';
    } else if (teamSize === '6-20' || budget === '200-500') {
      recommendedTier = 'pro';
    }

    // ── Determine Delivery ───────────────────────────────────────────────
    let recommendedDelivery: DeliveryMode = 'hosted';
    if (hostingPref === 'self-hosted') recommendedDelivery = 'exported';
    if (hostingPref === 'hybrid') recommendedDelivery = 'hybrid';

    // ── Determine Security ───────────────────────────────────────────────
    let securityLevel: SecurityLevel = 'standard';
    const sensitiveData = dataSensitivity.some(d =>
      ['customer-pii', 'financial', 'health-records', 'legal-documents', 'trade-secrets'].includes(d),
    );
    const hasCompliance = compliance.length > 0 && !compliance.includes('none');

    if (sensitiveData && hasCompliance) {
      securityLevel = 'enterprise';
    } else if (sensitiveData || hasCompliance) {
      securityLevel = 'hardened';
    }

    // ── Data Classification ──────────────────────────────────────────────
    let dataClassification: NeedsAnalysisResult['dataClassification'] = 'public';
    if (dataSensitivity.includes('trade-secrets')) dataClassification = 'restricted';
    else if (dataSensitivity.includes('health-records') || dataSensitivity.includes('financial')) dataClassification = 'confidential';
    else if (dataSensitivity.includes('customer-pii') || dataSensitivity.includes('internal-business')) dataClassification = 'internal';

    // ── Compliance Requirements ──────────────────────────────────────────
    const complianceRequirements = compliance.filter(c => c !== 'none').map(c => c.toUpperCase());

    // ── Risk Level ───────────────────────────────────────────────────────
    let riskLevel: NeedsAnalysisResult['riskLevel'] = 'low';
    const riskScore =
      (sensitiveData ? 30 : 0) +
      (hasCompliance ? 20 : 0) +
      (teamSize === '100+' ? 15 : teamSize === '21-100' ? 10 : 0) +
      (legacySystems ? 10 : 0) +
      (uptimeReq === '99.99-percent' ? 15 : uptimeReq === '99.9-percent' ? 10 : 0);

    if (riskScore >= 60) riskLevel = 'critical';
    else if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'medium';

    // ── Estimated Monthly Cost ───────────────────────────────────────────
    let estimatedMonthlyCost = 0;
    for (const plugId of recommendedPlugs) {
      const plug = plugCatalog.get(plugId);
      if (plug) {
        const baseCost = plug.tier === 'enterprise' ? 200 : plug.tier === 'pro' ? 100 : 50;
        estimatedMonthlyCost += baseCost;
      }
    }

    // Adjust for security level
    if (securityLevel === 'enterprise') estimatedMonthlyCost *= 1.5;
    else if (securityLevel === 'hardened') estimatedMonthlyCost *= 1.2;

    const result: NeedsAnalysisResult = {
      id: uuidv4(),
      userId,
      companyName,
      industry,
      scale: teamSize === '100+' ? 'enterprise' : teamSize === '21-100' ? 'department' : teamSize === '6-20' ? 'small-team' : 'solo',
      recommendedPlugs,
      recommendedTier,
      recommendedDelivery,
      securityLevel,
      estimatedMonthlyCost: Math.round(estimatedMonthlyCost),
      dataClassification,
      complianceRequirements,
      riskLevel,
      responses,
      createdAt: new Date().toISOString(),
    };

    logger.info(
      {
        resultId: result.id,
        recommendedPlugs: result.recommendedPlugs.length,
        tier: result.recommendedTier,
        security: result.securityLevel,
        risk: result.riskLevel,
      },
      '[NeedsAnalysis] Analysis complete',
    );

    return result;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const needsAnalysis = new NeedsAnalysisEngine();
