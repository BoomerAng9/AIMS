/**
 * A.I.M.S. Intake Engine
 *
 * Collects requirements from users via structured questionnaires,
 * analyses their responses to determine complexity and archetype,
 * and generates a buildable ProjectSpec that downstream agents
 * (Engineer_Ang, Quality_Ang, etc.) can act on.
 */

import { projectStore, Project, ProjectSpec, uuidv4 } from '../db';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntakeQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multi-select';
  options?: string[];
  required: boolean;
}

export interface IntakeResponse {
  questionId: string;
  answer: string | string[];
}

export interface RequirementsAnalysis {
  complexity: 'simple' | 'intermediate' | 'complex';
  suggestedArchetype: string;
  features: string[];
  integrations: string[];
  scale: 'personal' | 'small-business' | 'enterprise';
  customDomain?: string;
  brandColors?: string;
}

// ---------------------------------------------------------------------------
// Archetype tech-stack presets
// ---------------------------------------------------------------------------

const ARCHETYPE_STACKS: Record<string, ProjectSpec['techStack']> = {
  portfolio: { frontend: 'Next.js', backend: 'None', database: 'None' },
  saas: { frontend: 'Next.js', backend: 'Node.js + Express', database: 'PostgreSQL' },
  marketplace: { frontend: 'Next.js', backend: 'Node.js + Express', database: 'PostgreSQL' },
  crm: { frontend: 'Next.js', backend: 'Node.js + Express', database: 'PostgreSQL' },
  'internal-tool': { frontend: 'React', backend: 'Node.js + Express', database: 'SQLite' },
  'e-commerce': { frontend: 'Next.js', backend: 'Node.js + Express', database: 'PostgreSQL' },
  custom: { frontend: 'Next.js', backend: 'Node.js + Express', database: 'PostgreSQL' },
};

const ARCHETYPE_PAGES: Record<string, string[]> = {
  portfolio: ['/', '/about', '/projects', '/contact'],
  saas: ['/', '/pricing', '/dashboard', '/settings', '/login', '/signup'],
  marketplace: ['/', '/browse', '/product/[id]', '/cart', '/checkout', '/seller/dashboard', '/login', '/signup'],
  crm: ['/', '/dashboard', '/contacts', '/deals', '/reports', '/settings', '/login'],
  'internal-tool': ['/', '/dashboard', '/data', '/settings', '/login'],
  'e-commerce': ['/', '/products', '/product/[id]', '/cart', '/checkout', '/orders', '/login', '/signup'],
  custom: ['/', '/dashboard', '/login'],
};

const ARCHETYPE_API_ROUTES: Record<string, string[]> = {
  portfolio: ['/api/contact'],
  saas: ['/api/auth', '/api/users', '/api/billing', '/api/data'],
  marketplace: ['/api/auth', '/api/users', '/api/products', '/api/orders', '/api/payments', '/api/reviews'],
  crm: ['/api/auth', '/api/contacts', '/api/deals', '/api/reports', '/api/activities'],
  'internal-tool': ['/api/auth', '/api/data', '/api/exports'],
  'e-commerce': ['/api/auth', '/api/products', '/api/cart', '/api/orders', '/api/payments'],
  custom: ['/api/auth', '/api/data'],
};

const ARCHETYPE_DB_MODELS: Record<string, string[]> = {
  portfolio: [],
  saas: ['User', 'Subscription', 'Invoice', 'Setting'],
  marketplace: ['User', 'Product', 'Order', 'Review', 'Payment', 'Category'],
  crm: ['User', 'Contact', 'Deal', 'Activity', 'Report'],
  'internal-tool': ['User', 'DataEntry', 'AuditLog'],
  'e-commerce': ['User', 'Product', 'Cart', 'Order', 'Payment', 'Category'],
  custom: ['User'],
};

// Feature-to-integration mapping
const FEATURE_INTEGRATIONS: Record<string, string> = {
  payments: 'Stripe',
  email: 'SendGrid',
  'file-upload': 'AWS S3',
  analytics: 'PostHog',
  'real-time': 'Socket.io',
  search: 'Algolia',
};

// ---------------------------------------------------------------------------
// Generic questions
// ---------------------------------------------------------------------------

const GENERIC_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'app-type',
    question: 'What type of application do you want to build?',
    type: 'select',
    options: ['portfolio', 'saas', 'marketplace', 'crm', 'internal-tool', 'e-commerce', 'custom'],
    required: true,
  },
  {
    id: 'target-users',
    question: 'Who are the target users?',
    type: 'text',
    required: true,
  },
  {
    id: 'key-features',
    question: 'What key features do you need?',
    type: 'multi-select',
    options: [
      'user-auth',
      'payments',
      'search',
      'analytics',
      'file-upload',
      'email',
      'api',
      'real-time',
      'admin-panel',
    ],
    required: true,
  },
  {
    id: 'expected-scale',
    question: 'What is the expected scale of this application?',
    type: 'select',
    options: ['personal', 'small-business', 'enterprise'],
    required: true,
  },
  {
    id: 'custom-domain',
    question: 'Do you have a custom domain? (leave blank if not)',
    type: 'text',
    required: false,
  },
  {
    id: 'branding-colors',
    question: 'What are your branding colors? (e.g. #1a1a2e, #e94560)',
    type: 'text',
    required: false,
  },
];

// Archetype-specific follow-up questions
const ARCHETYPE_QUESTIONS: Record<string, IntakeQuestion[]> = {
  saas: [
    {
      id: 'saas-billing',
      question: 'What billing model do you need?',
      type: 'select',
      options: ['free-tier', 'flat-rate', 'usage-based', 'tiered'],
      required: true,
    },
  ],
  marketplace: [
    {
      id: 'marketplace-type',
      question: 'What type of marketplace?',
      type: 'select',
      options: ['product', 'service', 'digital-goods', 'rental'],
      required: true,
    },
  ],
  'e-commerce': [
    {
      id: 'ecommerce-products',
      question: 'Estimated number of products?',
      type: 'select',
      options: ['1-50', '50-500', '500-5000', '5000+'],
      required: true,
    },
  ],
  crm: [
    {
      id: 'crm-pipeline',
      question: 'How many pipeline stages do you need?',
      type: 'select',
      options: ['3', '5', '7', 'custom'],
      required: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the questionnaire for a given archetype.
 * Always includes generic questions; appends archetype-specific ones when known.
 */
export function getQuestions(archetype?: string): IntakeQuestion[] {
  const questions = [...GENERIC_QUESTIONS];

  if (archetype && ARCHETYPE_QUESTIONS[archetype]) {
    questions.push(...ARCHETYPE_QUESTIONS[archetype]);
  }

  logger.info(
    { archetype: archetype ?? 'generic', count: questions.length },
    '[Intake] Returning questionnaire',
  );
  return questions;
}

/**
 * Analyse intake responses + optional freeform text to determine
 * complexity, archetype, features, and integrations.
 */
export function analyzeRequirements(
  responses: IntakeResponse[],
  freeformDescription: string,
): RequirementsAnalysis {
  logger.info(
    { responseCount: responses.length, hasFreeform: freeformDescription.length > 0 },
    '[Intake] Analysing requirements',
  );

  // Helpers to pull answers from responses
  const answerFor = (qId: string): string | string[] | undefined => {
    const r = responses.find(resp => resp.questionId === qId);
    return r?.answer;
  };

  const stringAnswer = (qId: string): string =>
    (Array.isArray(answerFor(qId)) ? (answerFor(qId) as string[])[0] : answerFor(qId) as string) ?? '';

  const arrayAnswer = (qId: string): string[] => {
    const a = answerFor(qId);
    if (Array.isArray(a)) return a;
    if (typeof a === 'string' && a.length > 0) return [a];
    return [];
  };

  // Extract answers
  const appType = stringAnswer('app-type') || 'custom';
  const scale = (stringAnswer('expected-scale') || 'personal') as RequirementsAnalysis['scale'];
  const features = arrayAnswer('key-features');
  const customDomain = stringAnswer('custom-domain') || undefined;
  const brandColors = stringAnswer('branding-colors') || undefined;

  // Derive integrations from chosen features
  const integrations: string[] = [];
  for (const feat of features) {
    if (FEATURE_INTEGRATIONS[feat]) {
      integrations.push(FEATURE_INTEGRATIONS[feat]);
    }
  }

  // Scan freeform text for extra feature keywords
  const lower = freeformDescription.toLowerCase();
  if (lower.includes('payment') || lower.includes('stripe')) {
    if (!features.includes('payments')) features.push('payments');
    if (!integrations.includes('Stripe')) integrations.push('Stripe');
  }
  if (lower.includes('email') || lower.includes('notification')) {
    if (!features.includes('email')) features.push('email');
    if (!integrations.includes('SendGrid')) integrations.push('SendGrid');
  }
  if (lower.includes('upload') || lower.includes('file') || lower.includes('image')) {
    if (!features.includes('file-upload')) features.push('file-upload');
    if (!integrations.includes('AWS S3')) integrations.push('AWS S3');
  }

  // Determine complexity
  let complexity: RequirementsAnalysis['complexity'] = 'simple';
  const complexityScore =
    features.length +
    integrations.length +
    (scale === 'enterprise' ? 4 : scale === 'small-business' ? 2 : 0);

  if (complexityScore >= 8) {
    complexity = 'complex';
  } else if (complexityScore >= 4) {
    complexity = 'intermediate';
  }

  const analysis: RequirementsAnalysis = {
    complexity,
    suggestedArchetype: appType,
    features,
    integrations,
    scale,
    customDomain,
    brandColors,
  };

  logger.info(
    { complexity, archetype: appType, featureCount: features.length },
    '[Intake] Requirements analysis complete',
  );

  return analysis;
}

/**
 * Convert a RequirementsAnalysis into a buildable ProjectSpec.
 */
export function generateProjectSpec(analysis: RequirementsAnalysis): ProjectSpec {
  const arch = analysis.suggestedArchetype;
  const techStack = ARCHETYPE_STACKS[arch] ?? ARCHETYPE_STACKS['custom'];
  const pages = [...(ARCHETYPE_PAGES[arch] ?? ARCHETYPE_PAGES['custom'])];
  const apiRoutes = [...(ARCHETYPE_API_ROUTES[arch] ?? ARCHETYPE_API_ROUTES['custom'])];
  const dbModels = [...(ARCHETYPE_DB_MODELS[arch] ?? ARCHETYPE_DB_MODELS['custom'])];

  // Add pages / routes implied by selected features
  if (analysis.features.includes('admin-panel') && !pages.includes('/admin')) {
    pages.push('/admin', '/admin/users', '/admin/settings');
    apiRoutes.push('/api/admin');
  }
  if (analysis.features.includes('analytics') && !pages.includes('/analytics')) {
    pages.push('/analytics');
  }
  if (analysis.features.includes('user-auth') && !apiRoutes.includes('/api/auth')) {
    apiRoutes.push('/api/auth');
    if (!dbModels.includes('User')) dbModels.push('User');
  }
  if (analysis.features.includes('payments') && !apiRoutes.includes('/api/payments')) {
    apiRoutes.push('/api/payments');
    if (!dbModels.includes('Payment')) dbModels.push('Payment');
  }

  // Rough file count estimation
  const estimatedFiles =
    pages.length * 2 +       // page + component per page
    apiRoutes.length +        // one handler per route
    dbModels.length +         // one model file per model
    5;                        // config, layout, utils, types, package.json

  // Build time estimation
  let estimatedBuildTime: string;
  if (analysis.complexity === 'simple') {
    estimatedBuildTime = '2-4 hours';
  } else if (analysis.complexity === 'intermediate') {
    estimatedBuildTime = '1-2 days';
  } else {
    estimatedBuildTime = '3-5 days';
  }

  const spec: ProjectSpec = {
    archetype: arch,
    techStack,
    pages,
    apiRoutes,
    dbModels,
    integrations: analysis.integrations,
    estimatedFiles,
    estimatedBuildTime,
  };

  logger.info(
    { archetype: arch, pages: pages.length, apiRoutes: apiRoutes.length, estimatedFiles },
    '[Intake] Project spec generated',
  );

  return spec;
}

/**
 * Persist a new Project into the in-memory store.
 */
export function createProject(
  userId: string,
  name: string,
  description: string,
  spec: ProjectSpec,
): Project {
  const now = new Date().toISOString();

  // Derive complexity from spec heuristics
  let complexity: Project['complexity'] = 'simple';
  if (spec.estimatedFiles > 30) {
    complexity = 'complex';
  } else if (spec.estimatedFiles > 15) {
    complexity = 'intermediate';
  }

  const project: Project = {
    id: uuidv4(),
    userId,
    name,
    description,
    complexity,
    status: 'intake',
    archetype: spec.archetype,
    features: [],
    integrations: spec.integrations,
    branding: { primaryColor: '#1a1a2e' },
    spec,
    createdAt: now,
    updatedAt: now,
  };

  projectStore.create(project);

  logger.info(
    { projectId: project.id, userId, archetype: spec.archetype },
    '[Intake] Project created',
  );

  return project;
}
