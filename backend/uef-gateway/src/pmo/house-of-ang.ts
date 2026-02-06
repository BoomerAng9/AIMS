/**
 * House of Ang — Boomer_Ang Factory & Deployment Center
 *
 * The birthplace and command center for all Boomer_Angs.
 * Supervisory Angs govern through PMO offices.
 * Execution Angs build, research, market, audit, and orchestrate.
 *
 * "Activity breeds Activity."
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AngStatus = 'DEPLOYED' | 'STANDBY' | 'SPAWNING' | 'OFFLINE';
export type AngType = 'SUPERVISORY' | 'EXECUTION';

export interface DeployedAng {
  id: string;
  name: string;
  type: AngType;
  title: string;
  role: string;
  assignedPmo: string | null;
  status: AngStatus;
  spawnedAt: string;
  tasksCompleted: number;
  successRate: number;
  specialties: string[];
}

export interface SpawnEvent {
  angId: string;
  angName: string;
  type: AngType;
  spawnedAt: string;
  spawnedBy: string;
}

export interface HouseStats {
  total: number;
  deployed: number;
  standby: number;
  supervisory: number;
  execution: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GENESIS_TIMESTAMP = '2025-01-01T00:00:00.000Z';

function makeSupervisory(
  id: string,
  name: string,
  title: string,
  role: string,
  assignedPmo: string,
): DeployedAng {
  return {
    id,
    name,
    type: 'SUPERVISORY',
    title,
    role,
    assignedPmo,
    status: 'DEPLOYED',
    spawnedAt: GENESIS_TIMESTAMP,
    tasksCompleted: 0,
    successRate: 100,
    specialties: [],
  };
}

function makeExecution(
  id: string,
  name: string,
  title: string,
  role: string,
  status: AngStatus,
  tasksCompleted: number,
  successRate: number,
  specialties: string[],
): DeployedAng {
  return {
    id,
    name,
    type: 'EXECUTION',
    title,
    role,
    assignedPmo: null,
    status,
    spawnedAt: GENESIS_TIMESTAMP,
    tasksCompleted,
    successRate,
    specialties,
  };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function seedSupervisoryAngs(): DeployedAng[] {
  return [
    makeSupervisory(
      'CDTO_Ang',
      'CDTO_Ang',
      'Chief Digital Transformation Officer',
      'Governs all digital transformation initiatives across A.I.M.S.',
      'dt-pmo',
    ),
    makeSupervisory(
      'CSO_Ang',
      'CSO_Ang',
      'Chief Strategy Officer',
      'Defines strategic direction and long-term roadmap.',
      'strat-pmo',
    ),
    makeSupervisory(
      'COO_Ang',
      'COO_Ang',
      'Chief Operating Officer',
      'Oversees day-to-day operations and resource allocation.',
      'ops-pmo',
    ),
    makeSupervisory(
      'CIO_Ang',
      'CIO_Ang',
      'Chief Innovation Officer',
      'Drives R&D, emerging tech exploration, and innovation sprints.',
      'innov-pmo',
    ),
    makeSupervisory(
      'CISO_Ang',
      'CISO_Ang',
      'Chief Information Security Officer',
      'Enforces security policy, compliance audits, and ORACLE gate integrity.',
      'comply-pmo',
    ),
    makeSupervisory(
      'CGO_Ang',
      'CGO_Ang',
      'Chief Growth Officer',
      'Leads user acquisition, market expansion, and growth campaigns.',
      'growth-pmo',
    ),
    makeSupervisory(
      'CTO_Ang',
      'CTO_Ang',
      'Chief Technology Officer',
      'Architects platform infrastructure and technology standards.',
      'dt-pmo',
    ),
    makeSupervisory(
      'CFO_Ang',
      'CFO_Ang',
      'Chief Financial Officer',
      'Manages budgets, cost tracking, and financial governance.',
      'dt-pmo',
    ),
    makeSupervisory(
      'QA_Ang',
      'QA_Ang',
      'Quality Assurance Lead',
      'Ensures quality standards and test coverage across all deliverables.',
      'dt-pmo',
    ),
  ];
}

function seedExecutionAngs(): DeployedAng[] {
  return [
    makeExecution(
      'engineer-ang',
      'EngineerAng',
      'Full-Stack Builder',
      'Builds frontend, backend, and cloud infrastructure.',
      'DEPLOYED',
      12,
      94,
      ['React/Next.js', 'Node.js APIs', 'Cloud Deploy', 'TypeScript'],
    ),
    makeExecution(
      'marketer-ang',
      'MarketerAng',
      'Growth & Content Strategist',
      'Creates copy, runs campaigns, and optimises organic reach.',
      'DEPLOYED',
      8,
      91,
      ['SEO Audits', 'Copy Generation', 'Campaign Flows'],
    ),
    makeExecution(
      'analyst-ang',
      'AnalystAng',
      'Data & Intelligence Officer',
      'Gathers market intelligence, builds dashboards, and runs analysis.',
      'STANDBY',
      3,
      97,
      ['Market Research', 'Data Pipelines', 'Visualization'],
    ),
    makeExecution(
      'quality-ang',
      'QualityAng',
      'ORACLE Gate Verifier',
      'Runs 7-gate verification, security audits, and code reviews.',
      'STANDBY',
      5,
      100,
      ['7-Gate Checks', 'Security Audits', 'Code Review'],
    ),
    makeExecution(
      'chicken-hawk',
      'Chicken Hawk',
      'Pipeline Executor',
      'Sequences multi-agent pipelines and delegates to Boomer_Angs.',
      'DEPLOYED',
      28,
      96,
      ['Multi-agent orchestration', 'Step sequencing', 'Pipeline execution'],
    ),
  ];
}

// ---------------------------------------------------------------------------
// HouseOfAng class
// ---------------------------------------------------------------------------

export class HouseOfAng {
  private readonly roster: Map<string, DeployedAng> = new Map();
  private readonly spawnLog: SpawnEvent[] = [];

  constructor() {
    const supervisory = seedSupervisoryAngs();
    const execution = seedExecutionAngs();

    for (const ang of [...supervisory, ...execution]) {
      this.roster.set(ang.id, ang);
      this.spawnLog.push({
        angId: ang.id,
        angName: ang.name,
        type: ang.type,
        spawnedAt: ang.spawnedAt,
        spawnedBy: 'system',
      });
    }

    logger.info(
      { supervisory: supervisory.length, execution: execution.length },
      'House of Ang initialised — roster populated',
    );
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  /** Return every Ang in the roster. */
  list(): DeployedAng[] {
    return Array.from(this.roster.values());
  }

  /** Look up a single Ang by ID. */
  get(id: string): DeployedAng | undefined {
    return this.roster.get(id);
  }

  /** Filter Angs by type (SUPERVISORY | EXECUTION). */
  listByType(type: AngType): DeployedAng[] {
    return this.list().filter((a) => a.type === type);
  }

  /** Return all Angs assigned to a specific PMO office. */
  listByPmo(pmoId: string): DeployedAng[] {
    return this.list().filter((a) => a.assignedPmo === pmoId);
  }

  /** Return all Angs currently in a given status. */
  listByStatus(status: AngStatus): DeployedAng[] {
    return this.list().filter((a) => a.status === status);
  }

  /** Return the full spawn history. */
  getSpawnLog(): SpawnEvent[] {
    return [...this.spawnLog];
  }

  /** Aggregate stats about the roster. */
  getStats(): HouseStats {
    const all = this.list();
    return {
      total: all.length,
      deployed: all.filter((a) => a.status === 'DEPLOYED').length,
      standby: all.filter((a) => a.status === 'STANDBY').length,
      supervisory: all.filter((a) => a.type === 'SUPERVISORY').length,
      execution: all.filter((a) => a.type === 'EXECUTION').length,
    };
  }

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  /**
   * Spawn a brand-new Boomer_Ang.
   *
   * The Ang starts in SPAWNING status. The caller is responsible for
   * transitioning it to DEPLOYED or STANDBY once initialisation completes.
   */
  spawn(
    name: string,
    type: AngType,
    title: string,
    role: string,
    specialties: string[],
    spawnedBy = 'ACHEEVY',
  ): DeployedAng {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const now = new Date().toISOString();

    if (this.roster.has(id)) {
      logger.warn({ id }, 'Spawn rejected — Ang ID already exists in roster');
      throw new Error(`Ang with id "${id}" already exists`);
    }

    const ang: DeployedAng = {
      id,
      name,
      type,
      title,
      role,
      assignedPmo: null,
      status: 'SPAWNING',
      spawnedAt: now,
      tasksCompleted: 0,
      successRate: 100,
      specialties,
    };

    this.roster.set(id, ang);

    const event: SpawnEvent = {
      angId: id,
      angName: name,
      type,
      spawnedAt: now,
      spawnedBy,
    };
    this.spawnLog.push(event);

    logger.info(
      { id, name, type, spawnedBy },
      'New Boomer_Ang spawned in House of Ang',
    );

    return ang;
  }

  /**
   * Assign an existing Ang to a PMO office.
   * Pass `null` to un-assign (float).
   */
  assignToPmo(angId: string, pmoId: string | null): DeployedAng {
    const ang = this.roster.get(angId);
    if (!ang) {
      throw new Error(`Ang "${angId}" not found in roster`);
    }
    const previous = ang.assignedPmo;
    ang.assignedPmo = pmoId;

    logger.info(
      { angId, from: previous, to: pmoId },
      'Ang PMO assignment updated',
    );

    return ang;
  }

  /**
   * Transition an Ang to a new status.
   */
  setStatus(angId: string, status: AngStatus): DeployedAng {
    const ang = this.roster.get(angId);
    if (!ang) {
      throw new Error(`Ang "${angId}" not found in roster`);
    }
    const previous = ang.status;
    ang.status = status;

    logger.info(
      { angId, from: previous, to: status },
      'Ang status transitioned',
    );

    return ang;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const houseOfAng = new HouseOfAng();
