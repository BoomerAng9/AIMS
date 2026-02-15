/**
 * House of Ang — Boomer_Ang Registry & Forge Integration
 *
 * The birthplace and command center for all Boomer_Angs.
 *
 * Two roster layers:
 *   1. Supervisory — C-Suite directors & departmental agents (static, seed data)
 *   2. Execution — Canonical Boomer_Ang services from infra/boomerangs/registry.json
 *
 * The AngForge resolves tasks to real registry entries and adds persona metadata.
 * This module bridges the PMO governance layer with the service registry.
 *
 * "Activity breeds Activity."
 */

import logger from '../logger';
import { angForge } from './ang-forge';
import type { ForgedAngProfile, AngForgeResult } from './persona-types';
import type { PmoId, DirectorId } from './types';

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

// ---------------------------------------------------------------------------
// Seed data — Supervisory (C-Suite + Departmental Agents)
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

// ---------------------------------------------------------------------------
// HouseOfAng class
// ---------------------------------------------------------------------------

export class HouseOfAng {
  private readonly roster: Map<string, DeployedAng> = new Map();
  private readonly forgedProfiles: Map<string, ForgedAngProfile> = new Map();
  private readonly spawnLog: SpawnEvent[] = [];

  constructor() {
    const supervisory = seedSupervisoryAngs();

    for (const ang of supervisory) {
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
      { supervisory: supervisory.length },
      'House of Ang initialised — supervisory roster populated',
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

  // -----------------------------------------------------------------------
  // AngForge Integration — resolves registry Boomer_Angs + persona
  // -----------------------------------------------------------------------

  /**
   * Forge a Boomer_Ang assignment for a task.
   *
   * Resolves an existing Boomer_Ang from infra/boomerangs/registry.json,
   * assigns persona + skill tier, and tracks the forge in the roster.
   */
  forgeForTask(
    message: string,
    pmoOffice: PmoId,
    director: DirectorId,
    requestedBy = 'ACHEEVY',
  ): AngForgeResult {
    const result = angForge.forgeFromMessage(message, pmoOffice, director, requestedBy);
    const { profile } = result;
    const def = profile.definition;

    // Store forged profile for later lookup
    this.forgedProfiles.set(def.id, profile);

    // Register in main roster as EXECUTION if not already present
    if (!this.roster.has(def.id)) {
      const deployed: DeployedAng = {
        id: def.id,
        name: def.name,
        type: 'EXECUTION',
        title: `${profile.persona.displayName} — ${result.benchLabel}`,
        role: def.description,
        assignedPmo: pmoOffice,
        status: 'DEPLOYED',
        spawnedAt: profile.forgedAt,
        tasksCompleted: 0,
        successRate: 100,
        specialties: def.capabilities,
      };
      this.roster.set(def.id, deployed);

      this.spawnLog.push({
        angId: def.id,
        angName: def.name,
        type: 'EXECUTION',
        spawnedAt: profile.forgedAt,
        spawnedBy: requestedBy,
      });
    }

    logger.info(
      {
        angId: def.id,
        name: def.name,
        bench: profile.benchLevel,
        pmo: pmoOffice,
        resolvedFromRegistry: profile.resolvedFromRegistry,
        endpoint: def.endpoint,
      },
      'Boomer_Ang forged and tracked in House of Ang',
    );

    return result;
  }

  /** Get a forged profile (registry definition + persona + tier). */
  getForgedProfile(angId: string): ForgedAngProfile | undefined {
    return this.forgedProfiles.get(angId);
  }

  /** List all forged profiles. */
  listForged(): ForgedAngProfile[] {
    return Array.from(this.forgedProfiles.values());
  }

  /** List forged profiles by PMO office. */
  listForgedByPmo(pmoId: string): ForgedAngProfile[] {
    return this.listForged().filter(p => p.assignedPmo === pmoId);
  }

  /** Extended stats including forge operations. */
  getExtendedStats(): HouseStats & { forged: number; forgeLog: number } {
    const base = this.getStats();
    return {
      ...base,
      forged: this.forgedProfiles.size,
      forgeLog: angForge.getSpawnCount(),
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const houseOfAng = new HouseOfAng();
