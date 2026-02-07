/**
 * A.I.M.S. Requirements Rigor Module
 *
 * Adds structured risk assessment, Definition-of-Done checklists, and
 * Given/When/Then acceptance criteria to the Intake Engine.
 *
 * This module is the "requirements rigor" layer that sits alongside
 * src/intake/index.ts without modifying it.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import type { ProjectSpec } from '../db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskFactor {
  name: string;
  weight: number;
  triggered: boolean;
  detail: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: RiskFactor[];
  mitigations: string[];
}

export interface DoDItem {
  id: string;
  category: 'functional' | 'security' | 'performance' | 'accessibility' | 'deployment';
  description: string;
  required: boolean;
  testable: boolean;
  verificationMethod: 'automated' | 'manual' | 'review';
}

export interface DoDChecklist {
  items: DoDItem[];
  totalItems: number;
  requiredItems: number;
  generatedAt: string;
}

export interface Criterion {
  id: string;
  given: string;
  when: string;
  then: string;
  priority: 'must' | 'should' | 'could';
}

// ---------------------------------------------------------------------------
// Analysis shape consumed by RiskAssessor
// ---------------------------------------------------------------------------

export interface RiskAnalysisInput {
  complexity: 'simple' | 'intermediate' | 'complex';
  features: string[];
  integrations: string[];
  scale: 'personal' | 'small-business' | 'enterprise';
}

// ---------------------------------------------------------------------------
// Risk Assessor
// ---------------------------------------------------------------------------

/** Data-sensitivity keywords grouped by domain. */
const SENSITIVITY_KEYWORDS: Record<string, string[]> = {
  pii: ['user-auth', 'auth', 'profile', 'account', 'User', 'Contact'],
  payments: ['payments', 'billing', 'Stripe', 'Payment', 'Invoice', 'checkout'],
  health: ['health', 'medical', 'patient', 'HIPAA'],
};

/** Regulatory trigger words mapped to regulation names. */
const REGULATORY_TRIGGERS: Record<string, string> = {
  pii: 'GDPR / CCPA',
  payments: 'PCI-DSS',
  health: 'HIPAA',
};

export class RiskAssessor {
  /**
   * Evaluate risk for a project based on its analysis profile.
   */
  assessRisk(analysis: RiskAnalysisInput): RiskAssessment {
    logger.info(
      { complexity: analysis.complexity, featureCount: analysis.features.length },
      '[Requirements] Assessing risk',
    );

    const allTokens = [
      ...analysis.features,
      ...analysis.integrations,
    ];

    const factors: RiskFactor[] = [];

    // --- Data sensitivity --------------------------------------------------
    for (const [domain, keywords] of Object.entries(SENSITIVITY_KEYWORDS)) {
      const matched = allTokens.some(t =>
        keywords.some(kw => t.toLowerCase().includes(kw.toLowerCase())),
      );
      factors.push({
        name: `data-sensitivity:${domain}`,
        weight: domain === 'health' ? 25 : 20,
        triggered: matched,
        detail: matched
          ? `Project handles ${domain.toUpperCase()} data`
          : `No ${domain.toUpperCase()} data detected`,
      });
    }

    // --- Regulatory exposure -----------------------------------------------
    for (const [domain, regulation] of Object.entries(REGULATORY_TRIGGERS)) {
      const triggered = factors.some(
        f => f.name === `data-sensitivity:${domain}` && f.triggered,
      );
      factors.push({
        name: `regulatory:${regulation}`,
        weight: 15,
        triggered,
        detail: triggered
          ? `${regulation} compliance required`
          : `${regulation} not applicable`,
      });
    }

    // --- Integration count -------------------------------------------------
    const integrationCount = analysis.integrations.length;
    factors.push({
      name: 'integration-count',
      weight: 10,
      triggered: integrationCount >= 3,
      detail: `${integrationCount} third-party integration(s)`,
    });

    // --- Scale -------------------------------------------------------------
    const isLargeScale = analysis.scale === 'enterprise';
    factors.push({
      name: 'scale',
      weight: 15,
      triggered: isLargeScale,
      detail: `Scale: ${analysis.scale}`,
    });

    // --- Custom code ratio -------------------------------------------------
    const isComplex = analysis.complexity === 'complex';
    factors.push({
      name: 'custom-code-ratio',
      weight: 10,
      triggered: isComplex,
      detail: isComplex
        ? 'High custom-code ratio increases attack surface'
        : 'Standard code footprint',
    });

    // --- Score calculation --------------------------------------------------
    const score = factors.reduce((acc, f) => acc + (f.triggered ? f.weight : 0), 0);
    const cappedScore = Math.min(score, 100);

    let level: RiskAssessment['level'];
    if (cappedScore >= 70) level = 'critical';
    else if (cappedScore >= 45) level = 'high';
    else if (cappedScore >= 20) level = 'medium';
    else level = 'low';

    // --- Mitigations -------------------------------------------------------
    const mitigations: string[] = [];

    if (factors.some(f => f.name.startsWith('data-sensitivity') && f.triggered)) {
      mitigations.push('Encrypt PII at rest and in transit (AES-256 / TLS 1.3)');
      mitigations.push('Implement field-level access controls for sensitive data');
    }
    if (factors.some(f => f.name.startsWith('regulatory') && f.triggered)) {
      mitigations.push('Conduct formal compliance audit before launch');
      mitigations.push('Maintain data-processing agreement with all third parties');
    }
    if (factors.find(f => f.name === 'integration-count')?.triggered) {
      mitigations.push('Pin all third-party API versions and monitor deprecation notices');
      mitigations.push('Implement circuit-breakers for external service calls');
    }
    if (factors.find(f => f.name === 'scale')?.triggered) {
      mitigations.push('Load-test to 2x expected peak before launch');
      mitigations.push('Configure auto-scaling and horizontal pod autoscaler');
    }
    if (factors.find(f => f.name === 'custom-code-ratio')?.triggered) {
      mitigations.push('Mandate code review for every merge request');
      mitigations.push('Run SAST/DAST scans in CI pipeline');
    }

    const assessment: RiskAssessment = {
      level,
      score: cappedScore,
      factors,
      mitigations,
    };

    logger.info(
      { level, score: cappedScore, triggeredFactors: factors.filter(f => f.triggered).length },
      '[Requirements] Risk assessment complete',
    );

    return assessment;
  }
}

// ---------------------------------------------------------------------------
// Definition of Done
// ---------------------------------------------------------------------------

export class DefinitionOfDone {
  /**
   * Auto-generate a DoD checklist from a ProjectSpec and its risk level.
   */
  generate(spec: ProjectSpec, riskLevel: RiskAssessment['level']): DoDChecklist {
    logger.info(
      { archetype: spec.archetype, riskLevel },
      '[Requirements] Generating Definition of Done',
    );

    const items: DoDItem[] = [];

    // --- Functional items --------------------------------------------------
    for (const page of spec.pages) {
      items.push({
        id: uuidv4(),
        category: 'functional',
        description: `Page ${page} renders correctly`,
        required: true,
        testable: true,
        verificationMethod: 'automated',
      });
    }

    for (const route of spec.apiRoutes) {
      items.push({
        id: uuidv4(),
        category: 'functional',
        description: `API ${route} returns valid response`,
        required: true,
        testable: true,
        verificationMethod: 'automated',
      });
    }

    // --- Security items ----------------------------------------------------
    const securityItems: Array<{ description: string; required: boolean; method: DoDItem['verificationMethod'] }> = [
      { description: 'Authentication required for protected routes', required: true, method: 'automated' },
      { description: 'All user inputs validated and sanitized', required: true, method: 'automated' },
      { description: 'HTTPS enforced in production', required: true, method: 'automated' },
      { description: 'No secrets or credentials committed to source code', required: true, method: 'review' },
      { description: 'CORS configured to allow only trusted origins', required: true, method: 'review' },
    ];

    if (riskLevel === 'high' || riskLevel === 'critical') {
      securityItems.push(
        { description: 'Rate limiting applied to all public endpoints', required: true, method: 'automated' },
        { description: 'SQL injection and XSS protection verified', required: true, method: 'automated' },
        { description: 'Security headers set via Helmet or equivalent', required: true, method: 'automated' },
      );
    }

    for (const sec of securityItems) {
      items.push({
        id: uuidv4(),
        category: 'security',
        description: sec.description,
        required: sec.required,
        testable: true,
        verificationMethod: sec.method,
      });
    }

    // --- Performance items -------------------------------------------------
    const perfItems: Array<{ description: string; required: boolean }> = [
      { description: 'Page load time under 3 seconds on 4G connection', required: true },
      { description: 'API response time under 500ms (p95)', required: true },
      { description: 'No N+1 query patterns in data access layer', required: true },
    ];

    if (riskLevel === 'critical') {
      perfItems.push(
        { description: 'Database queries optimised with proper indexes', required: true },
        { description: 'CDN configured for static assets', required: false },
      );
    }

    for (const perf of perfItems) {
      items.push({
        id: uuidv4(),
        category: 'performance',
        description: perf.description,
        required: perf.required,
        testable: true,
        verificationMethod: 'automated',
      });
    }

    // --- Accessibility items -----------------------------------------------
    items.push(
      {
        id: uuidv4(),
        category: 'accessibility',
        description: 'WCAG 2.1 AA compliance verified',
        required: true,
        testable: true,
        verificationMethod: 'automated',
      },
      {
        id: uuidv4(),
        category: 'accessibility',
        description: 'Full keyboard navigation support',
        required: true,
        testable: true,
        verificationMethod: 'manual',
      },
      {
        id: uuidv4(),
        category: 'accessibility',
        description: 'Screen reader support verified with NVDA/VoiceOver',
        required: true,
        testable: true,
        verificationMethod: 'manual',
      },
    );

    // --- Deployment items --------------------------------------------------
    items.push(
      {
        id: uuidv4(),
        category: 'deployment',
        description: 'Docker image builds successfully',
        required: true,
        testable: true,
        verificationMethod: 'automated',
      },
      {
        id: uuidv4(),
        category: 'deployment',
        description: 'Health check endpoint responds 200 OK',
        required: true,
        testable: true,
        verificationMethod: 'automated',
      },
      {
        id: uuidv4(),
        category: 'deployment',
        description: 'All environment variables documented in .env.example',
        required: true,
        testable: true,
        verificationMethod: 'review',
      },
    );

    const checklist: DoDChecklist = {
      items,
      totalItems: items.length,
      requiredItems: items.filter(i => i.required).length,
      generatedAt: new Date().toISOString(),
    };

    logger.info(
      { totalItems: checklist.totalItems, requiredItems: checklist.requiredItems },
      '[Requirements] DoD checklist generated',
    );

    return checklist;
  }
}

// ---------------------------------------------------------------------------
// Acceptance Criteria
// ---------------------------------------------------------------------------

/**
 * Pre-defined Given/When/Then templates for common features.
 * Each key maps to a list of criteria templates.
 */
const CRITERIA_TEMPLATES: Record<string, Array<{ given: string; when: string; then: string; priority: Criterion['priority'] }>> = {
  auth: [
    { given: 'an unauthenticated user', when: 'they submit valid registration credentials', then: 'a new account is created and they are logged in', priority: 'must' },
    { given: 'a registered user', when: 'they submit correct login credentials', then: 'they receive a valid session token', priority: 'must' },
    { given: 'a registered user', when: 'they submit incorrect credentials 5 times', then: 'the account is temporarily locked for 15 minutes', priority: 'should' },
    { given: 'an authenticated user', when: 'they click logout', then: 'their session is invalidated and they are redirected to the login page', priority: 'must' },
    { given: 'an unauthenticated user', when: 'they try to access a protected route', then: 'they are redirected to the login page with a return URL', priority: 'must' },
  ],
  payments: [
    { given: 'a user with items in their cart', when: 'they proceed to checkout and enter valid payment info', then: 'the payment is processed and an order confirmation is shown', priority: 'must' },
    { given: 'a user making a payment', when: 'the payment provider declines the card', then: 'the user sees a clear error message and can retry', priority: 'must' },
    { given: 'a completed payment', when: 'the user views their order history', then: 'the transaction appears with correct amount and status', priority: 'must' },
    { given: 'a subscription user', when: 'their billing period renews', then: 'the subscription charge is processed automatically', priority: 'should' },
    { given: 'a user requesting a refund', when: 'an admin approves the refund', then: 'the payment provider issues the refund within 5-10 business days', priority: 'could' },
  ],
  search: [
    { given: 'a user on the search page', when: 'they type a query into the search bar', then: 'results appear within 500ms matching the query', priority: 'must' },
    { given: 'a user searching for a non-existent term', when: 'no results match', then: 'a friendly empty-state message is displayed with suggestions', priority: 'should' },
    { given: 'a user viewing search results', when: 'they apply filters', then: 'the results update without a full page reload', priority: 'should' },
    { given: 'a user performing a search', when: 'the query contains special characters', then: 'the search handles them safely without errors', priority: 'must' },
  ],
  'file-upload': [
    { given: 'an authenticated user', when: 'they select a file under the size limit', then: 'the file uploads successfully with a progress indicator', priority: 'must' },
    { given: 'an authenticated user', when: 'they select a file exceeding the size limit', then: 'an error message explains the size restriction', priority: 'must' },
    { given: 'an authenticated user', when: 'they upload a file with a disallowed extension', then: 'the upload is rejected with a clear message about allowed types', priority: 'must' },
    { given: 'a user uploading a file', when: 'the upload is interrupted', then: 'the system allows resuming or retrying the upload', priority: 'could' },
  ],
  'user-auth': [
    { given: 'a visitor to the application', when: 'they navigate to the signup page', then: 'they see a registration form with required fields', priority: 'must' },
    { given: 'a new user', when: 'they register with a valid email', then: 'a confirmation email is sent within 60 seconds', priority: 'should' },
    { given: 'an authenticated user', when: 'they visit their profile page', then: 'they see their account details with edit capability', priority: 'must' },
  ],
  'admin-panel': [
    { given: 'an admin user', when: 'they access the admin dashboard', then: 'they see system metrics, user counts, and recent activity', priority: 'must' },
    { given: 'an admin user', when: 'they search for a specific user', then: 'matching user records are displayed with action options', priority: 'should' },
    { given: 'a non-admin user', when: 'they try to access the admin panel', then: 'they receive a 403 Forbidden response', priority: 'must' },
  ],
  analytics: [
    { given: 'an admin user', when: 'they view the analytics dashboard', then: 'they see real-time metrics updated within the last 60 seconds', priority: 'must' },
    { given: 'an admin user', when: 'they select a date range', then: 'all charts and tables update to reflect the selected period', priority: 'should' },
  ],
  'real-time': [
    { given: 'two connected users', when: 'one user sends a message', then: 'the other user receives it within 1 second without refreshing', priority: 'must' },
    { given: 'a connected user', when: 'the server restarts', then: 'the client reconnects automatically within 5 seconds', priority: 'should' },
  ],
  email: [
    { given: 'a triggered email event (e.g. signup)', when: 'the event fires', then: 'the corresponding email is sent within 60 seconds', priority: 'must' },
    { given: 'a user receiving an email', when: 'they open it', then: 'the email renders correctly in major email clients', priority: 'should' },
  ],
  api: [
    { given: 'an authenticated API consumer', when: 'they make a valid request', then: 'the API returns the correct data with appropriate status code', priority: 'must' },
    { given: 'an unauthenticated API consumer', when: 'they make a request to a protected endpoint', then: 'the API returns 401 Unauthorized', priority: 'must' },
    { given: 'any API consumer', when: 'they exceed the rate limit', then: 'the API returns 429 Too Many Requests with a Retry-After header', priority: 'should' },
  ],
};

export class AcceptanceCriteria {
  /**
   * Generate Given/When/Then acceptance criteria for a feature.
   * Falls back to generic criteria if the feature is not in the template library.
   */
  generate(feature: string, _archetype: string): Criterion[] {
    logger.info({ feature, archetype: _archetype }, '[Requirements] Generating acceptance criteria');

    const templates = CRITERIA_TEMPLATES[feature];

    if (templates && templates.length > 0) {
      return templates.map(t => ({
        id: uuidv4(),
        given: t.given,
        when: t.when,
        then: t.then,
        priority: t.priority,
      }));
    }

    // Generic fallback for features without explicit templates
    return [
      {
        id: uuidv4(),
        given: `a user interacting with the ${feature} feature`,
        when: 'they perform the primary action',
        then: 'the system responds correctly within acceptable time limits',
        priority: 'must' as const,
      },
      {
        id: uuidv4(),
        given: `a user interacting with the ${feature} feature`,
        when: 'they provide invalid input',
        then: 'the system displays a clear, actionable error message',
        priority: 'must' as const,
      },
      {
        id: uuidv4(),
        given: `an unauthenticated user`,
        when: `they attempt to use the ${feature} feature`,
        then: 'access is denied if the feature requires authentication',
        priority: 'should' as const,
      },
    ];
  }
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------

export const riskAssessor = new RiskAssessor();
export const definitionOfDone = new DefinitionOfDone();
export const acceptanceCriteria = new AcceptanceCriteria();
