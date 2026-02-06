/**
 * PMO Registry — All 6 Project Management Offices
 *
 * Command chain: User -> ACHEEVY -> PMO Director -> Team -> Execution
 */

import { PmoOffice, PmoId, PmoDirector, HouseOfAngConfig } from './types';
import logger from '../logger';

const PMO_OFFICES: PmoOffice[] = [
  // 1. DT-PMO — Digital Transformation
  {
    id: 'dt-pmo',
    name: 'DT-PMO',
    fullName: 'Digital Transformation PMO',
    mission:
      'Drive end-to-end digital transformation across all platform capabilities. Owns architecture decisions, tech stack alignment, and deployment standards.',
    director: {
      id: 'CDTO_Ang',
      title: 'Chief Digital Transformation Officer',
      fullName: 'CDTO_Ang',
      scope: 'Strategy, architecture, final authority on digital transformation initiatives',
      authority: 'Approve/reject architecture changes, tech stack decisions, deployment gates',
      reportsTo: 'ACHEEVY',
    },
    team: [
      {
        id: 'CTO_Ang',
        title: 'Chief Technology Officer',
        role: 'Agent design, schemas, stack alignment',
        department: 'dt-pmo',
      },
      {
        id: 'CFO_Ang',
        title: 'Chief Financial Officer',
        role: 'Token efficiency, LUC alignment, cost governance',
        department: 'dt-pmo',
      },
      {
        id: 'QA_Ang',
        title: 'Quality Assurance Lead',
        role: 'Output verification, ORACLE gate readiness',
        department: 'dt-pmo',
      },
    ],
    kpis: [
      'Deployment frequency',
      'System uptime',
      'Architecture compliance score',
      'Technical debt ratio',
    ],
    status: 'ACTIVE',
  },

  // 2. STRAT-PMO — Strategy
  {
    id: 'strat-pmo',
    name: 'STRAT-PMO',
    fullName: 'Strategy PMO',
    mission:
      'Manage strategic portfolio, align initiatives to business objectives, and ensure resource allocation matches priority.',
    director: {
      id: 'CSO_Ang',
      title: 'Chief Strategy Officer',
      fullName: 'CSO_Ang',
      scope: 'Portfolio management, business alignment, initiative prioritization',
      authority: 'Prioritize/deprioritize initiatives, allocate budgets, approve strategic pivots',
      reportsTo: 'ACHEEVY',
    },
    team: [
      {
        id: 'portfolio-analyst',
        title: 'Portfolio Analyst',
        role: 'Initiative tracking, ROI modeling, resource utilization',
        department: 'strat-pmo',
      },
      {
        id: 'market-strategist',
        title: 'Market Strategist',
        role: 'Market positioning, competitive intelligence, opportunity mapping',
        department: 'strat-pmo',
      },
    ],
    kpis: [
      'Strategic alignment score',
      'Portfolio ROI',
      'Initiative completion rate',
      'Resource utilization',
    ],
    status: 'ACTIVE',
  },

  // 3. OPS-PMO — Operations
  {
    id: 'ops-pmo',
    name: 'OPS-PMO',
    fullName: 'Operations PMO',
    mission:
      'Ensure operational excellence across all agent execution. Owns throughput, SLA management, and runtime health.',
    director: {
      id: 'COO_Ang',
      title: 'Chief Operating Officer',
      fullName: 'COO_Ang',
      scope: 'Runtime health, throughput, SLAs, execution efficiency',
      authority: 'Scale agent capacity, enforce SLAs, pause degraded pipelines',
      reportsTo: 'ACHEEVY',
    },
    team: [
      {
        id: 'ops-monitor',
        title: 'Operations Monitor',
        role: 'Real-time pipeline health, alert triage, incident response',
        department: 'ops-pmo',
      },
      {
        id: 'capacity-planner',
        title: 'Capacity Planner',
        role: 'Agent load balancing, scaling thresholds, performance tuning',
        department: 'ops-pmo',
      },
      {
        id: 'sla-manager',
        title: 'SLA Manager',
        role: 'Service level tracking, breach prevention, client SLA reporting',
        department: 'ops-pmo',
      },
    ],
    kpis: [
      'Pipeline throughput',
      'SLA compliance rate',
      'Mean time to resolution',
      'Agent utilization',
    ],
    status: 'ACTIVE',
  },

  // 4. INNOV-PMO — Innovation
  {
    id: 'innov-pmo',
    name: 'INNOV-PMO',
    fullName: 'Innovation PMO',
    mission:
      'Drive R&D initiatives, evaluate emerging technologies, and incubate new platform capabilities before production rollout.',
    director: {
      id: 'CIO_Ang',
      title: 'Chief Innovation Officer',
      fullName: 'CIO_Ang',
      scope: 'R&D pipeline, emerging tech evaluation, prototype incubation',
      authority: 'Approve R&D experiments, allocate innovation budget, promote prototypes to production',
      reportsTo: 'ACHEEVY',
    },
    team: [
      {
        id: 'research-lead',
        title: 'Research Lead',
        role: 'Emerging tech scouting, proof-of-concept development',
        department: 'innov-pmo',
      },
      {
        id: 'prototype-eng',
        title: 'Prototype Engineer',
        role: 'Rapid prototyping, MVP builds, experimentation',
        department: 'innov-pmo',
      },
    ],
    kpis: [
      'Experiments launched',
      'Prototype-to-production rate',
      'Innovation adoption rate',
      'Time to prototype',
    ],
    status: 'ACTIVE',
  },

  // 5. COMPLY-PMO — Compliance
  {
    id: 'comply-pmo',
    name: 'COMPLY-PMO',
    fullName: 'Compliance PMO',
    mission:
      'Enforce regulatory compliance, security standards, audit readiness, and risk management across all operations.',
    director: {
      id: 'CISO_Ang',
      title: 'Chief Information Security Officer',
      fullName: 'CISO_Ang',
      scope: 'KYB enforcement, permissions, sandbox boundaries, audit trails',
      authority: 'Block non-compliant operations, mandate security reviews, enforce data governance',
      reportsTo: 'ACHEEVY',
    },
    team: [
      {
        id: 'audit-analyst',
        title: 'Audit Analyst',
        role: 'Compliance auditing, regulatory tracking, documentation',
        department: 'comply-pmo',
      },
      {
        id: 'risk-assessor',
        title: 'Risk Assessor',
        role: 'Risk classification, threat modeling, mitigation planning',
        department: 'comply-pmo',
      },
      {
        id: 'data-guardian',
        title: 'Data Guardian',
        role: 'Data governance, PII protection, retention policies',
        department: 'comply-pmo',
      },
    ],
    kpis: [
      'Compliance score',
      'Audit pass rate',
      'Risk mitigation coverage',
      'Security incident rate',
    ],
    status: 'ACTIVE',
  },

  // 6. GROWTH-PMO — Growth
  {
    id: 'growth-pmo',
    name: 'GROWTH-PMO',
    fullName: 'Growth PMO',
    mission:
      'Accelerate user acquisition, retention, and revenue growth. Owns marketing strategy, partnerships, and customer success.',
    director: {
      id: 'CGO_Ang',
      title: 'Chief Growth Officer',
      fullName: 'CGO_Ang',
      scope: 'Revenue growth, user acquisition, partnerships, customer success',
      authority: 'Approve campaigns, allocate marketing budget, establish partnership terms',
      reportsTo: 'ACHEEVY',
    },
    team: [
      {
        id: 'growth-hacker',
        title: 'Growth Hacker',
        role: 'Acquisition funnels, A/B testing, conversion optimization',
        department: 'growth-pmo',
      },
      {
        id: 'partnership-mgr',
        title: 'Partnership Manager',
        role: 'Strategic partnerships, co-marketing, channel development',
        department: 'growth-pmo',
      },
      {
        id: 'success-lead',
        title: 'Customer Success Lead',
        role: 'Retention strategy, onboarding flows, NPS management',
        department: 'growth-pmo',
      },
    ],
    kpis: [
      'User acquisition rate',
      'Revenue growth',
      'Customer retention',
      'NPS score',
    ],
    status: 'ACTIVE',
  },
];

class PmoRegistry {
  private offices = new Map<PmoId, PmoOffice>();

  constructor(offices: PmoOffice[]) {
    for (const office of offices) {
      this.offices.set(office.id, office);
    }
    logger.info(
      { pmoCount: offices.length, ids: offices.map(o => o.id) },
      'PMO registry initialized'
    );
  }

  /** Return all PMO offices. */
  list(): PmoOffice[] {
    return Array.from(this.offices.values());
  }

  /** Look up a single PMO office by id. */
  get(id: PmoId): PmoOffice | undefined {
    const office = this.offices.get(id);
    if (!office) {
      logger.warn({ pmoId: id }, 'PMO office not found');
    }
    return office;
  }

  /** Return every director across all offices. */
  getDirectors(): PmoOffice['director'][] {
    return this.list().map(o => o.director);
  }

  /** Compute House-of-Ang statistics from the current registry. */
  getHouseConfig(): HouseOfAngConfig {
    const offices = this.list();
    const activeOffices = offices.filter(o => o.status === 'ACTIVE');

    // Each office has 1 director + N team members
    const deployedAngs = offices.reduce(
      (sum, o) => sum + 1 + o.team.length,
      0
    );
    const standbyAngs = offices
      .filter(o => o.status === 'STANDBY')
      .reduce((sum, o) => sum + 1 + o.team.length, 0);

    const MAX_SPAWN_CAPACITY = 100;
    const totalAngs = deployedAngs + standbyAngs;

    const config: HouseOfAngConfig = {
      totalAngs,
      activePmos: activeOffices.length,
      deployedAngs,
      standbyAngs,
      spawnCapacity: Math.max(0, MAX_SPAWN_CAPACITY - totalAngs),
    };

    logger.debug({ houseConfig: config }, 'House-of-Ang config computed');
    return config;
  }
}

export { PMO_OFFICES };
export const pmoRegistry = new PmoRegistry(PMO_OFFICES);
