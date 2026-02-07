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
    // ---- C-Suite Boomer_ Angs ----
    makeSupervisory(
      'Boomer_CTO',
      'Boomer_CTO',
      'Chief Technology Officer',
      'Architects platform infrastructure and technology standards across A.I.M.S.',
      'tech-office',
    ),
    makeSupervisory(
      'Boomer_CFO',
      'Boomer_CFO',
      'Chief Financial Officer',
      'Manages budgets, cost tracking, and financial governance.',
      'finance-office',
    ),
    makeSupervisory(
      'Boomer_COO',
      'Boomer_COO',
      'Chief Operating Officer',
      'Oversees day-to-day operations and resource allocation.',
      'ops-office',
    ),
    makeSupervisory(
      'Boomer_CMO',
      'Boomer_CMO',
      'Chief Marketing Officer',
      'Leads marketing strategy, brand positioning, and growth campaigns.',
      'marketing-office',
    ),
    makeSupervisory(
      'Boomer_CDO',
      'Boomer_CDO',
      'Chief Design Officer',
      'Drives creative direction, UX standards, and visual identity.',
      'design-office',
    ),
    makeSupervisory(
      'Boomer_CPO',
      'Boomer_CPO',
      'Chief Publication Officer',
      'Governs content publishing, editorial workflows, and distribution channels.',
      'publishing-office',
    ),

    // ---- Departmental Agents ----
    makeSupervisory(
      'devops-agent',
      'DevOps Agent',
      'DevOps Agent',
      'Manages CI/CD pipelines, infrastructure automation, and deployment workflows.',
      'tech-office',
    ),
    makeSupervisory(
      'value-agent',
      'Value Agent',
      'Value Agent',
      'Tracks value delivery, cost optimisation, and financial impact analysis.',
      'finance-office',
    ),
    makeSupervisory(
      'flow-boss-agent',
      'Flow Boss Agent',
      'Flow Boss Agent',
      'Orchestrates operational workflows, task sequencing, and process efficiency.',
      'ops-office',
    ),
    makeSupervisory(
      'social-campaign-agent',
      'Social Campaign Agent',
      'Social Campaign Agent',
      'Plans and executes social media campaigns, ad targeting, and audience engagement.',
      'marketing-office',
    ),
    makeSupervisory(
      'video-editing-agent',
      'Video Editing Agent',
      'Video Editing Agent',
      'Produces and edits video content, motion graphics, and multimedia assets.',
      'design-office',
    ),
    makeSupervisory(
      'social-agent',
      'Social Agent',
      'Social Agent',
      'Manages social media publishing, community engagement, and content scheduling.',
      'publishing-office',
    ),
  ];
}

function seedExecutionAngs(): DeployedAng[] {
  return [
    makeExecution(
      'engineer-ang',
      'Engineer_Ang',
      'Full-Stack Builder',
      'Builds frontend, backend, and cloud infrastructure.',
      'DEPLOYED',
      12,
      94,
      ['React/Next.js', 'Node.js APIs', 'Cloud Deploy', 'TypeScript'],
    ),
    makeExecution(
      'marketer-ang',
      'Marketer_Ang',
      'Growth & Content Strategist',
      'Creates copy, runs campaigns, and optimises organic reach.',
      'DEPLOYED',
      8,
      91,
      ['SEO Audits', 'Copy Generation', 'Campaign Flows'],
    ),
    makeExecution(
      'analyst-ang',
      'Analyst_Ang',
      'Data & Intelligence Officer',
      'Gathers market intelligence, builds dashboards, and runs analysis.',
      'STANDBY',
      3,
      97,
      ['Market Research', 'Data Pipelines', 'Visualization'],
    ),
    makeExecution(
      'quality-ang',
      'Quality_Ang',
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
