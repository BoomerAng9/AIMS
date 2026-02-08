/**
 * n8n Schema Pool — Elastic Boomer_Ang Team for Workflow JSON Crafting
 *
 * Led by Juno_Ang (Expert, "Workflow Scribe"), this pool produces autonomous,
 * verifiable n8n workflow JSON under the DT-PMO Automation Systems Office.
 *
 * Always-On Core:
 *   1 Expert:       Juno_Ang    (n8n-juno)  — owner, approver, safety gating
 *   2 Intermediate: Rio_Ang     (n8n-rio)   — workflow builder
 *                   Koda_Ang    (n8n-koda)  — integration joiner
 *   2 Intern:       Lumen_Ang   (n8n-lumen) — packaging, docs, naming
 *                   Nova_Ang    (n8n-nova)  — QA checklists, formatting
 *
 * Surge Expansion (activated during elevated calls):
 *   +2 Intermediate (builders / integrators)
 *   +4 Intern (packaging / documentation / variants / testing scripts)
 *
 * Placement: dtpmo-office (DT-PMO → Automation Systems Office)
 *
 * "If it cannot run twice safely, it cannot run once."
 */

import logger from '../logger';
import type { BenchLevel } from './persona-types';

// ---------------------------------------------------------------------------
// Pool Member Types
// ---------------------------------------------------------------------------

export interface PoolMember {
  id: string;
  name: string;
  bench: BenchLevel;
  role: string;
  isCore: boolean; // true = always-on, false = surge-only
  status: 'active' | 'standby' | 'surged';
}

export type PoolMode = 'NORMAL' | 'SURGE';

export interface SurgeSignal {
  signal: string;
  value: number;
  threshold: number;
  triggered: boolean;
}

export interface PoolSnapshot {
  mode: PoolMode;
  active: number;
  standby: number;
  total: number;
  surgeSignals: SurgeSignal[];
  members: PoolMember[];
}

// ---------------------------------------------------------------------------
// Workflow Artifact — what the pool produces
// ---------------------------------------------------------------------------

export interface WorkflowArtifact {
  workflowJson: Record<string, unknown>;
  runbookNotes: string[];
  testPlan: TestPlan;
  auditFields: string[];
  approvedBy: string | null;
  shipReady: boolean;
}

export interface TestPlan {
  scenarios: TestScenario[];
}

export interface TestScenario {
  name: string;
  payload: Record<string, unknown>;
  expectedOutput: string;
}

// ---------------------------------------------------------------------------
// Ship-Ready Criteria
// ---------------------------------------------------------------------------

export const SHIP_READY_CRITERIA = [
  'Node naming is consistent and traceable',
  'Failure paths exist (timeouts, retries, fallback)',
  'Idempotency is addressed (safe re-run behavior)',
  'Credentials are scoped minimally (least privilege)',
  'Minimal audit fields are emitted per run',
  'Test payloads + expected outputs are provided',
  'Juno_Ang approves the final artifact',
] as const;

// ---------------------------------------------------------------------------
// Surge Policy
// ---------------------------------------------------------------------------

export interface SurgePolicy {
  activationRequiresSignals: number; // any N of these = activate
  signals: SurgePolicySignal[];
  deactivationCriteria: string[];
}

export interface SurgePolicySignal {
  name: string;
  description: string;
}

export const SURGE_POLICY: SurgePolicy = {
  activationRequiresSignals: 2,
  signals: [
    { name: 'request_rate_spike', description: 'Request rate spikes beyond baseline' },
    { name: 'queue_backlog', description: 'Workflow queue backlog exceeds threshold' },
    { name: 'error_rate_climb', description: 'Error rate climbs beyond threshold' },
    { name: 'resource_pressure', description: 'CPU/memory pressure on VPS sustained over threshold' },
    { name: 'parallel_demand', description: 'Multiple PMOs requesting workflows simultaneously' },
  ],
  deactivationCriteria: [
    'Backlog clears',
    'Error rate stabilizes',
    'Resource pressure returns to baseline for a sustained window',
  ],
};

// ---------------------------------------------------------------------------
// Core Pool Members (always-on)
// ---------------------------------------------------------------------------

function coreMembers(): PoolMember[] {
  return [
    {
      id: 'n8n-juno',
      name: 'Juno_Ang',
      bench: 'EXPERT',
      role: 'Pool lead (Workflow Scribe): triage, pattern selection, approvals, safety gating',
      isCore: true,
      status: 'active',
    },
    {
      id: 'n8n-rio',
      name: 'Rio_Ang',
      bench: 'INTERMEDIATE',
      role: 'The Builder: build workflows from established packs, wire integrations, maintain clean failure paths',
      isCore: true,
      status: 'active',
    },
    {
      id: 'n8n-koda',
      name: 'Koda_Ang',
      bench: 'INTERMEDIATE',
      role: 'The Joiner: connect services and data transforms, keep contracts stable',
      isCore: true,
      status: 'active',
    },
    {
      id: 'n8n-lumen',
      name: 'Lumen_Ang',
      bench: 'INTERN',
      role: 'Polish: package workflows, documentation, naming checks, test payload sets, variant builds',
      isCore: true,
      status: 'active',
    },
    {
      id: 'n8n-nova',
      name: 'Nova_Ang',
      bench: 'INTERN',
      role: 'Checklist: run QA checklists, verify formatting consistency before review',
      isCore: true,
      status: 'active',
    },
  ];
}

// ---------------------------------------------------------------------------
// Surge Members (activated during elevated calls)
// ---------------------------------------------------------------------------

function surgeMembers(): PoolMember[] {
  return [
    // +2 Intermediate (surge builders)
    {
      id: 'n8n-surge-builder-1',
      name: 'Surge_Builder_1',
      bench: 'INTERMEDIATE',
      role: 'Surge builder: parallel workflow construction, error handling branches',
      isCore: false,
      status: 'standby',
    },
    {
      id: 'n8n-surge-builder-2',
      name: 'Surge_Builder_2',
      bench: 'INTERMEDIATE',
      role: 'Surge builder: integration wiring, routing logic assembly',
      isCore: false,
      status: 'standby',
    },
    // +4 Intern (surge packagers)
    {
      id: 'n8n-surge-packager-1',
      name: 'Surge_Packager_1',
      bench: 'INTERN',
      role: 'Surge packager: documentation assembly',
      isCore: false,
      status: 'standby',
    },
    {
      id: 'n8n-surge-packager-2',
      name: 'Surge_Packager_2',
      bench: 'INTERN',
      role: 'Surge packager: variant generation',
      isCore: false,
      status: 'standby',
    },
    {
      id: 'n8n-surge-packager-3',
      name: 'Surge_Packager_3',
      bench: 'INTERN',
      role: 'Surge packager: test script generation',
      isCore: false,
      status: 'standby',
    },
    {
      id: 'n8n-surge-packager-4',
      name: 'Surge_Packager_4',
      bench: 'INTERN',
      role: 'Surge packager: consistency checks and naming validation',
      isCore: false,
      status: 'standby',
    },
  ];
}

// ---------------------------------------------------------------------------
// N8nSchemaPool — Main class
// ---------------------------------------------------------------------------

export class N8nSchemaPool {
  private members: PoolMember[];
  private mode: PoolMode = 'NORMAL';
  private surgeHistory: Array<{ mode: PoolMode; at: string; signals: string[] }> = [];

  constructor() {
    this.members = [...coreMembers(), ...surgeMembers()];
    logger.info(
      {
        core: coreMembers().length,
        surge: surgeMembers().length,
        total: this.members.length,
      },
      '[n8n Schema Pool] Pool initialized',
    );
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  getMode(): PoolMode {
    return this.mode;
  }

  getSnapshot(): PoolSnapshot {
    return {
      mode: this.mode,
      active: this.members.filter(m => m.status === 'active' || m.status === 'surged').length,
      standby: this.members.filter(m => m.status === 'standby').length,
      total: this.members.length,
      surgeSignals: [],
      members: [...this.members],
    };
  }

  getActiveMembers(): PoolMember[] {
    return this.members.filter(m => m.status === 'active' || m.status === 'surged');
  }

  getCoreMembers(): PoolMember[] {
    return this.members.filter(m => m.isCore);
  }

  getSurgeMembers(): PoolMember[] {
    return this.members.filter(m => !m.isCore);
  }

  getMember(id: string): PoolMember | undefined {
    return this.members.find(m => m.id === id);
  }

  // -----------------------------------------------------------------------
  // Surge Management
  // -----------------------------------------------------------------------

  /**
   * Evaluate surge signals. If >= SURGE_POLICY.activationRequiresSignals
   * signals fire, activate surge expansion.
   */
  evaluateSurge(signals: SurgeSignal[]): PoolMode {
    const triggered = signals.filter(s => s.triggered);
    const shouldSurge = triggered.length >= SURGE_POLICY.activationRequiresSignals;

    if (shouldSurge && this.mode === 'NORMAL') {
      this.activateSurge(triggered.map(s => s.signal));
    } else if (!shouldSurge && this.mode === 'SURGE') {
      this.deactivateSurge();
    }

    return this.mode;
  }

  /**
   * Activate surge — bring standby members online.
   */
  activateSurge(triggerSignals: string[] = []): void {
    if (this.mode === 'SURGE') return;

    this.mode = 'SURGE';
    for (const member of this.members) {
      if (!member.isCore && member.status === 'standby') {
        member.status = 'surged';
      }
    }

    this.surgeHistory.push({
      mode: 'SURGE',
      at: new Date().toISOString(),
      signals: triggerSignals,
    });

    const active = this.getActiveMembers();
    logger.info(
      {
        mode: 'SURGE',
        triggers: triggerSignals,
        activeCount: active.length,
        surgedCount: active.filter(m => m.status === 'surged').length,
      },
      '[n8n Schema Pool] SURGE activated — expansion team deployed',
    );
  }

  /**
   * Deactivate surge — return surge members to standby.
   */
  deactivateSurge(): void {
    if (this.mode === 'NORMAL') return;

    this.mode = 'NORMAL';
    for (const member of this.members) {
      if (!member.isCore && member.status === 'surged') {
        member.status = 'standby';
      }
    }

    this.surgeHistory.push({
      mode: 'NORMAL',
      at: new Date().toISOString(),
      signals: [],
    });

    logger.info(
      { mode: 'NORMAL', activeCount: this.getActiveMembers().length },
      '[n8n Schema Pool] SURGE deactivated — returned to normal capacity',
    );
  }

  getSurgeHistory() {
    return [...this.surgeHistory];
  }

  // -----------------------------------------------------------------------
  // Operating Model Helpers
  // -----------------------------------------------------------------------

  /**
   * Get the current operating model description based on pool mode.
   */
  getOperatingModel(): string {
    if (this.mode === 'NORMAL') {
      return [
        '1. Juno_Ang defines workflow approach + selects pattern pack',
        '2. Rio_Ang / Koda_Ang build the workflow JSON draft',
        '3. Lumen_Ang / Nova_Ang package documentation + test payloads',
        '4. Juno_Ang final reviews and approves',
      ].join('\n');
    }
    return [
      'HIGH LOAD MODE:',
      '• Juno_Ang shifts to: triage, pattern selection, approvals, safety gating',
      '• Rio_Ang, Koda_Ang + surge builders execute builds in parallel',
      '• Lumen_Ang, Nova_Ang + surge packagers handle packaging and consistency checks',
    ].join('\n');
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const n8nSchemaPool = new N8nSchemaPool();
