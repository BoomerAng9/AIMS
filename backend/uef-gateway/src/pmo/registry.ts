/**
 * PMO Registry — 6 C-Suite Boomer_Ang Offices
 *
 * Command chain: Human → ACHEEVY → Boomer_[ROLE] → Departmental Agent → Execution
 */

import { PmoOffice, PmoId, HouseOfAngConfig } from './types';
import logger from '../logger';

const PMO_OFFICES: PmoOffice[] = [
  // 1. Boomer_CTO — Technology Office
  {
    id: 'tech-office',
    name: 'TECH OFFICE',
    fullName: 'Chief Technology Office',
    mission:
      'Architect platform infrastructure, agent design, schemas, and technology standards. Owns the full stack.',
    director: {
      id: 'Boomer_CTO',
      title: 'Chief Technology Officer',
      fullName: 'Boomer_CTO',
      scope: 'Platform architecture, agent design, stack alignment, infrastructure',
      authority: 'Approve architecture changes, tech stack decisions, deployment pipelines',
      reportsTo: 'ACHEEVY',
    },
    departmentalAgent: {
      id: 'devops-agent',
      name: 'DevOps Agent',
      role: 'CI/CD pipelines, container orchestration, deployment automation, infrastructure-as-code',
      reportsTo: 'Boomer_CTO',
    },
    kpis: ['Deployment frequency', 'System uptime', 'Build success rate', 'Infrastructure cost'],
    status: 'ACTIVE',
  },

  // 2. Boomer_CFO — Finance Office
  {
    id: 'finance-office',
    name: 'FINANCE OFFICE',
    fullName: 'Chief Financial Office',
    mission:
      'Manage budgets, cost tracking, token efficiency, and LUC alignment. Governs all financial operations.',
    director: {
      id: 'Boomer_CFO',
      title: 'Chief Financial Officer',
      fullName: 'Boomer_CFO',
      scope: 'Token efficiency, LUC cost governance, budget allocation, financial reporting',
      authority: 'Approve spend thresholds, cost optimization, settlement policies',
      reportsTo: 'ACHEEVY',
    },
    departmentalAgent: {
      id: 'value-agent',
      name: 'Value Agent',
      role: 'Cost analysis, ROI modeling, pricing optimization, financial projections',
      reportsTo: 'Boomer_CFO',
    },
    kpis: ['Cost per task', 'Token efficiency ratio', 'Budget utilization', 'Revenue growth'],
    status: 'ACTIVE',
  },

  // 3. Boomer_COO — Operations Office
  {
    id: 'ops-office',
    name: 'OPS OFFICE',
    fullName: 'Chief Operations Office',
    mission:
      'Ensure operational excellence across all agent execution. Owns throughput, SLA management, and runtime health.',
    director: {
      id: 'Boomer_COO',
      title: 'Chief Operating Officer',
      fullName: 'Boomer_COO',
      scope: 'Runtime health, throughput, SLAs, execution efficiency, pipeline orchestration',
      authority: 'Scale agent capacity, enforce SLAs, pause degraded pipelines',
      reportsTo: 'ACHEEVY',
    },
    departmentalAgent: {
      id: 'flow-boss-agent',
      name: 'Flow Boss Agent',
      role: 'Workflow orchestration, pipeline scheduling, load balancing, queue management',
      reportsTo: 'Boomer_COO',
    },
    kpis: ['Pipeline throughput', 'SLA compliance rate', 'Mean time to resolution', 'Agent utilization'],
    status: 'ACTIVE',
  },

  // 4. Boomer_CMO — Marketing Office
  {
    id: 'marketing-office',
    name: 'MARKETING OFFICE',
    fullName: 'Chief Marketing Office',
    mission:
      'Drive user acquisition, brand strategy, content creation, and campaign management across all channels.',
    director: {
      id: 'Boomer_CMO',
      title: 'Chief Marketing Officer',
      fullName: 'Boomer_CMO',
      scope: 'Brand strategy, user acquisition, campaign management, content marketing',
      authority: 'Approve campaigns, allocate marketing budget, brand guidelines enforcement',
      reportsTo: 'ACHEEVY',
    },
    departmentalAgent: {
      id: 'social-campaign-agent',
      name: 'Social Campaign Agent',
      role: 'Social media campaigns, ad copy, A/B testing, conversion funnels, audience targeting',
      reportsTo: 'Boomer_CMO',
    },
    kpis: ['User acquisition rate', 'Campaign ROI', 'Conversion rate', 'Brand awareness score'],
    status: 'ACTIVE',
  },

  // 5. Boomer_CDO — Design Office
  {
    id: 'design-office',
    name: 'DESIGN OFFICE',
    fullName: 'Chief Design Office',
    mission:
      'Own visual identity, UI/UX design, multimedia production, and creative direction across all platform surfaces.',
    director: {
      id: 'Boomer_CDO',
      title: 'Chief Design Officer',
      fullName: 'Boomer_CDO',
      scope: 'Visual identity, UI/UX design, multimedia production, creative direction',
      authority: 'Approve design systems, visual standards, multimedia assets',
      reportsTo: 'ACHEEVY',
    },
    departmentalAgent: {
      id: 'video-editing-agent',
      name: 'Video Editing Agent',
      role: 'Video production, motion graphics, thumbnail generation, visual asset creation',
      reportsTo: 'Boomer_CDO',
    },
    kpis: ['Design consistency score', 'Asset production rate', 'Visual quality rating', 'Brand compliance'],
    status: 'ACTIVE',
  },

  // 6. Boomer_CPO — Publishing Office
  {
    id: 'publishing-office',
    name: 'PUBLISHING OFFICE',
    fullName: 'Chief Publication Office',
    mission:
      'Manage content publishing, editorial standards, distribution channels, and audience engagement.',
    director: {
      id: 'Boomer_CPO',
      title: 'Chief Publication Officer',
      fullName: 'Boomer_CPO',
      scope: 'Content publishing, editorial standards, distribution, audience engagement',
      authority: 'Approve publication schedules, editorial guidelines, distribution strategy',
      reportsTo: 'ACHEEVY',
    },
    departmentalAgent: {
      id: 'social-agent',
      name: 'Social Agent',
      role: 'Content scheduling, community management, engagement tracking, cross-platform publishing',
      reportsTo: 'Boomer_CPO',
    },
    kpis: ['Publishing cadence', 'Engagement rate', 'Audience growth', 'Content quality score'],
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

  list(): PmoOffice[] {
    return Array.from(this.offices.values());
  }

  get(id: PmoId): PmoOffice | undefined {
    const office = this.offices.get(id);
    if (!office) {
      logger.warn({ pmoId: id }, 'PMO office not found');
    }
    return office;
  }

  getDirectors(): PmoOffice['director'][] {
    return this.list().map(o => o.director);
  }

  getDepartmentalAgents(): PmoOffice['departmentalAgent'][] {
    return this.list().map(o => o.departmentalAgent);
  }

  getHouseConfig(): HouseOfAngConfig {
    const offices = this.list();
    const activeOffices = offices.filter(o => o.status === 'ACTIVE');
    // Each office: 1 director + 1 departmental agent = 2 per office
    const deployedAngs = activeOffices.length * 2;
    const standbyAngs = offices.filter(o => o.status === 'STANDBY').length * 2;
    const totalAngs = deployedAngs + standbyAngs;
    const MAX_SPAWN_CAPACITY = 100;

    return {
      totalAngs,
      activePmos: activeOffices.length,
      deployedAngs,
      standbyAngs,
      spawnCapacity: Math.max(0, MAX_SPAWN_CAPACITY - totalAngs),
    };
  }
}

export { PMO_OFFICES };
export const pmoRegistry = new PmoRegistry(PMO_OFFICES);
