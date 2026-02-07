/**
 * A.I.M.S. Incident Manager & Runbook — Pillar 12
 *
 * Tracks incidents from creation to resolution with a full timeline.
 * Provides severity-based runbooks (P1-P4) with procedural steps.
 *
 * Singleton export: `incidentManager`
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'open' | 'investigating' | 'mitigating' | 'resolved';

export interface TimelineEntry {
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
}

export interface Incident {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  status: IncidentStatus;
  assignee?: string;
  timeline: TimelineEntry[];
  createdAt: string;
  resolvedAt?: string;
}

export interface RunbookStep {
  order: number;
  action: string;
  responsible: string;
  escalation?: string;
  automated: boolean;
}

export interface IncidentFilter {
  status?: IncidentStatus;
  severity?: Severity;
}

// ---------------------------------------------------------------------------
// Runbook Definitions
// ---------------------------------------------------------------------------

const RUNBOOKS: Record<Severity, RunbookStep[]> = {
  P1: [
    {
      order: 1,
      action: 'Alert on-call engineer and Chicken Hawk coordinator immediately',
      responsible: 'Monitoring System',
      escalation: 'Page CTO (Boomer_CTO) if no response in 5 minutes',
      automated: true,
    },
    {
      order: 2,
      action: 'Open incident bridge/war room channel',
      responsible: 'Chicken Hawk',
      escalation: 'Escalate to ACHEEVY if unresolved after 15 minutes',
      automated: false,
    },
    {
      order: 3,
      action: 'Identify blast radius: which services, users, and Plugs are affected',
      responsible: 'EngineerAng',
      automated: false,
    },
    {
      order: 4,
      action: 'Execute database backup before any remediation',
      responsible: 'BackupManager',
      automated: true,
    },
    {
      order: 5,
      action: 'Apply emergency mitigation (rollback, failover, or feature flag disable)',
      responsible: 'EngineerAng',
      escalation: 'Engage DevOps Agent for infrastructure-level issues',
      automated: false,
    },
    {
      order: 6,
      action: 'Verify service restoration and run health checks',
      responsible: 'QualityAng',
      automated: true,
    },
    {
      order: 7,
      action: 'Notify affected users of resolution',
      responsible: 'MarketerAng',
      automated: false,
    },
    {
      order: 8,
      action: 'Schedule post-mortem within 24 hours',
      responsible: 'Chicken Hawk',
      automated: false,
    },
  ],

  P2: [
    {
      order: 1,
      action: 'Alert on-call engineer via standard notification channels',
      responsible: 'Monitoring System',
      escalation: 'Escalate to P1 if degradation worsens within 30 minutes',
      automated: true,
    },
    {
      order: 2,
      action: 'Assess scope of partial outage: affected services and endpoints',
      responsible: 'EngineerAng',
      automated: false,
    },
    {
      order: 3,
      action: 'Create database backup as precaution',
      responsible: 'BackupManager',
      automated: true,
    },
    {
      order: 4,
      action: 'Implement targeted fix or workaround for affected component',
      responsible: 'EngineerAng',
      escalation: 'Engage Boomer_CTO if root cause unclear after 1 hour',
      automated: false,
    },
    {
      order: 5,
      action: 'Run ORACLE verification gates on the fix',
      responsible: 'QualityAng',
      automated: true,
    },
    {
      order: 6,
      action: 'Monitor for recurrence over next 2 hours',
      responsible: 'AnalystAng',
      automated: true,
    },
    {
      order: 7,
      action: 'Document incident and resolution in post-mortem',
      responsible: 'Chicken Hawk',
      automated: false,
    },
  ],

  P3: [
    {
      order: 1,
      action: 'Log incident and notify engineering team during business hours',
      responsible: 'Monitoring System',
      automated: true,
    },
    {
      order: 2,
      action: 'Triage: identify affected feature and user impact',
      responsible: 'EngineerAng',
      escalation: 'Escalate to P2 if user-facing impact exceeds expectations',
      automated: false,
    },
    {
      order: 3,
      action: 'Develop and test fix in staging environment',
      responsible: 'EngineerAng',
      automated: false,
    },
    {
      order: 4,
      action: 'Run QualityAng ORACLE gate verification on fix',
      responsible: 'QualityAng',
      automated: true,
    },
    {
      order: 5,
      action: 'Deploy fix during next maintenance window or standard release',
      responsible: 'DevOps Agent',
      automated: false,
    },
    {
      order: 6,
      action: 'Update incident log with resolution details',
      responsible: 'Chicken Hawk',
      automated: false,
    },
  ],

  P4: [
    {
      order: 1,
      action: 'Log cosmetic or low-priority issue in tracking system',
      responsible: 'Monitoring System',
      automated: true,
    },
    {
      order: 2,
      action: 'Add to backlog for next sprint prioritization',
      responsible: 'Chicken Hawk',
      automated: false,
    },
    {
      order: 3,
      action: 'Implement fix as part of regular development cycle',
      responsible: 'EngineerAng',
      automated: false,
    },
    {
      order: 4,
      action: 'Verify fix and close incident',
      responsible: 'QualityAng',
      automated: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// IncidentManager
// ---------------------------------------------------------------------------

export class IncidentManager {
  private incidents: Map<string, Incident> = new Map();

  constructor() {
    logger.info('[Incident] IncidentManager initialized');
  }

  /**
   * Create a new incident record with an initial timeline entry.
   */
  createIncident(severity: Severity, title: string, description: string): Incident {
    const id = uuidv4();
    const now = new Date().toISOString();

    const incident: Incident = {
      id,
      severity,
      title,
      description,
      status: 'open',
      timeline: [
        {
          timestamp: now,
          action: 'Incident created',
          actor: 'system',
          detail: `${severity} incident opened: ${title}`,
        },
      ],
      createdAt: now,
    };

    this.incidents.set(id, incident);

    logger.info(
      { id, severity, title },
      '[Incident] Incident created',
    );

    return { ...incident, timeline: [...incident.timeline] };
  }

  /**
   * Update an incident's status, assignee, or add a timeline note.
   */
  updateIncident(
    id: string,
    updates: {
      status?: IncidentStatus;
      assignee?: string;
      note?: string;
      actor?: string;
    },
  ): Incident {
    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    const now = new Date().toISOString();
    const actor = updates.actor ?? 'system';

    if (updates.status && updates.status !== incident.status) {
      incident.status = updates.status;
      incident.timeline.push({
        timestamp: now,
        action: `Status changed to ${updates.status}`,
        actor,
        detail: `Incident moved to ${updates.status}`,
      });
    }

    if (updates.assignee && updates.assignee !== incident.assignee) {
      const prev = incident.assignee ?? 'unassigned';
      incident.assignee = updates.assignee;
      incident.timeline.push({
        timestamp: now,
        action: 'Assignee changed',
        actor,
        detail: `Reassigned from ${prev} to ${updates.assignee}`,
      });
    }

    if (updates.note) {
      incident.timeline.push({
        timestamp: now,
        action: 'Note added',
        actor,
        detail: updates.note,
      });
    }

    logger.info({ id, updates: Object.keys(updates) }, '[Incident] Incident updated');

    return { ...incident, timeline: [...incident.timeline] };
  }

  /**
   * Resolve an incident with a resolution description.
   */
  resolveIncident(id: string, resolution: string, actor: string = 'system'): Incident {
    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    const now = new Date().toISOString();
    incident.status = 'resolved';
    incident.resolvedAt = now;

    incident.timeline.push({
      timestamp: now,
      action: 'Incident resolved',
      actor,
      detail: resolution,
    });

    logger.info({ id, resolution }, '[Incident] Incident resolved');

    return { ...incident, timeline: [...incident.timeline] };
  }

  /**
   * List incidents, optionally filtered by status and/or severity.
   */
  listIncidents(filter?: IncidentFilter): Incident[] {
    let results = Array.from(this.incidents.values());

    if (filter?.status) {
      results = results.filter((i) => i.status === filter.status);
    }
    if (filter?.severity) {
      results = results.filter((i) => i.severity === filter.severity);
    }

    // Return copies to prevent external mutation
    return results.map((i) => ({
      ...i,
      timeline: [...i.timeline],
    }));
  }

  /**
   * Get the procedural runbook for a given severity level.
   */
  getRunbook(severity: Severity): RunbookStep[] {
    const steps = RUNBOOKS[severity];
    if (!steps) {
      throw new Error(`No runbook defined for severity: ${severity}`);
    }
    return [...steps];
  }

  /**
   * Get a single incident by ID.
   */
  getIncident(id: string): Incident | undefined {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    return { ...incident, timeline: [...incident.timeline] };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const incidentManager = new IncidentManager();
