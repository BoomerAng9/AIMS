/**
 * Transaction Model — Every Agent Action is an Owned, Accountable Transaction
 *
 * In a PMO, every action is a transaction. Not necessarily monetary —
 * it's a unit of work with clear ownership, accountability, and audit trail.
 * Just like in business: if you touch it, you own it.
 *
 * Every Boomer_Ang, Lil_Hawk, Chicken Hawk, and ACHEEVY itself
 * generates transactions when they act. Each transaction:
 *   1. Has an OWNER (the agent who initiated or executed)
 *   2. Is METERED through LUC (cost, resource usage, quota impact)
 *   3. Is AUDITED in the Triple Audit Ledger (platform, user, web3-ready)
 *   4. Has a LIFECYCLE (initiated → approved → executing → verified → settled)
 *   5. Can be GATED (human-in-the-loop, LUC budget check, evidence required)
 *
 * "You own the task. The task doesn't own you. But if you drop it, everyone knows."
 */

import { v4 as uuidv4 } from 'uuid';
import { auditLedger, createAuditEntry } from './audit-ledger';
import type { AuditAction } from './types';

// ---------------------------------------------------------------------------
// Transaction Types
// ---------------------------------------------------------------------------

/** Every action category that can be transacted */
export type TransactionCategory =
  | 'deployment'       // Plug spin-up, configure, scale, decommission
  | 'build'            // Code generation, scaffolding, implementation
  | 'research'         // Analysis, data gathering, market research
  | 'content'          // Writing, media creation, design
  | 'automation'       // Workflow creation, n8n, scheduled tasks
  | 'communication'    // Outreach, messaging, notifications
  | 'analysis'         // Needs analysis, DMAIC/DMADV cycles
  | 'monitoring'       // Health checks, performance, alerts
  | 'administrative'   // User management, settings, config
  | 'financial';       // Billing, invoicing, subscription changes

/** Transaction lifecycle states */
export type TransactionStatus =
  | 'initiated'        // Created, not yet approved
  | 'pending_approval' // Waiting for human-in-the-loop or LUC gate
  | 'approved'         // Approved, ready to execute
  | 'executing'        // Currently being worked on
  | 'pending_verify'   // Done, awaiting evidence/QA gate
  | 'verified'         // Evidence accepted, ready to settle
  | 'settled'          // LUC debited, audit sealed, done
  | 'rejected'         // Denied at approval gate
  | 'failed'           // Execution failed
  | 'rolled_back';     // Reversed after settlement (credit issued)

/** Gate types that can block a transaction */
export type GateType =
  | 'luc_budget'       // Does the user have budget for this?
  | 'human_approval'   // Does this need user sign-off?
  | 'evidence_required'// Must provide proof of completion
  | 'security_review'  // PaaS enforcement, sensitive data
  | 'chain_of_command' // Does this agent have authority?
  | 'oracle_verify';   // ORACLE 8-gate quality check

/** Individual gate result */
export interface GateResult {
  gate: GateType;
  passed: boolean;
  reason: string;
  checkedAt: string;
  checkedBy: string; // agent or system that checked
}

/** LUC cost estimate attached to a transaction */
export interface TransactionCost {
  estimatedTokens: number;
  estimatedUsd: number;
  actualTokens?: number;
  actualUsd?: number;
  serviceKeys: string[];  // Which LUC service keys are debited
  quoted: boolean;        // Was a LUC quote presented to user?
  settled: boolean;       // Has the debit been finalized?
}

/** The core transaction record */
export interface Transaction {
  id: string;
  timestamp: string;

  // ── Ownership ─────────────────────────────────────────────────────────
  ownerId: string;          // Agent ID that owns this transaction
  ownerRole: string;        // Role card title (e.g., 'Forge_Ang', 'ACHEEVY')
  delegatedBy?: string;     // Who assigned this (e.g., ACHEEVY → Forge_Ang)
  department: string;       // Functional area (engineering, marketing, ops, etc.)

  // ── Context ───────────────────────────────────────────────────────────
  userId: string;
  sessionId: string;
  verticalId?: string;
  category: TransactionCategory;
  description: string;      // Human-readable: "Deploy n8n instance for user X"

  // ── Lifecycle ─────────────────────────────────────────────────────────
  status: TransactionStatus;
  statusHistory: Array<{
    from: TransactionStatus;
    to: TransactionStatus;
    at: string;
    by: string;
    reason?: string;
  }>;

  // ── Gates ─────────────────────────────────────────────────────────────
  requiredGates: GateType[];
  gateResults: GateResult[];

  // ── Cost ──────────────────────────────────────────────────────────────
  cost: TransactionCost;

  // ── Evidence ──────────────────────────────────────────────────────────
  artifacts: string[];       // IDs of produced artifacts
  evidence: string[];        // Proof of completion (logs, screenshots, URLs)

  // ── Audit ─────────────────────────────────────────────────────────────
  auditTrail: {
    platformId?: string;
    userReceiptId?: string;
    web3Hash?: string;
  };

  // ── Timing ────────────────────────────────────────────────────────────
  startedAt?: string;
  completedAt?: string;
  settledAt?: string;
}

// ---------------------------------------------------------------------------
// Department Mapping — Agent → Department
// ---------------------------------------------------------------------------

const AGENT_DEPARTMENT_MAP: Record<string, string> = {
  // ACHEEVY — Executive
  'ACHEEVY': 'executive',

  // Engineering
  'Forge_Ang': 'engineering',
  'Patchsmith_Ang': 'engineering',
  'Runner_Ang': 'engineering',
  'Dockmaster_Ang': 'engineering',
  'Buildsmith': 'engineering',
  'Chicken Hawk': 'engineering',

  // Research & Analysis
  'Scout_Ang': 'research',
  'Lab_Ang': 'research',
  'Index_Ang': 'research',

  // Content & Marketing
  'Chronicle_Ang': 'marketing',
  'Showrunner_Ang': 'marketing',
  'Scribe_Ang': 'content',

  // Operations
  'Bridge_Ang': 'operations',
  'Gatekeeper_Ang': 'operations',
  'OpsConsole_Ang': 'operations',
  'Picker_Ang': 'operations',

  // Legal & Compliance
  'Licensing_Ang': 'legal',
};

// ---------------------------------------------------------------------------
// Gate Requirements by Category
// ---------------------------------------------------------------------------

const CATEGORY_GATES: Record<TransactionCategory, GateType[]> = {
  deployment: ['luc_budget', 'human_approval', 'security_review', 'chain_of_command'],
  build: ['luc_budget', 'chain_of_command', 'evidence_required'],
  research: ['luc_budget', 'chain_of_command'],
  content: ['luc_budget', 'chain_of_command', 'evidence_required'],
  automation: ['luc_budget', 'chain_of_command', 'evidence_required'],
  communication: ['chain_of_command', 'human_approval'],
  analysis: ['luc_budget', 'chain_of_command'],
  monitoring: ['chain_of_command'],
  administrative: ['chain_of_command', 'human_approval'],
  financial: ['luc_budget', 'human_approval', 'security_review', 'chain_of_command'],
};

// ---------------------------------------------------------------------------
// Transaction Manager
// ---------------------------------------------------------------------------

class TransactionManager {
  private transactions: Map<string, Transaction> = new Map();

  /**
   * Initiate a new transaction.
   * Every agent action starts here. No work without a transaction.
   */
  initiate(params: {
    ownerId: string;
    ownerRole: string;
    delegatedBy?: string;
    userId: string;
    sessionId: string;
    verticalId?: string;
    category: TransactionCategory;
    description: string;
    estimatedTokens?: number;
    estimatedUsd?: number;
    serviceKeys?: string[];
  }): Transaction {
    const id = `txn-${uuidv4()}`;
    const now = new Date().toISOString();
    const department = AGENT_DEPARTMENT_MAP[params.ownerId]
      || AGENT_DEPARTMENT_MAP[params.ownerRole]
      || 'general';

    const requiredGates = CATEGORY_GATES[params.category] || ['chain_of_command'];

    const transaction: Transaction = {
      id,
      timestamp: now,

      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      delegatedBy: params.delegatedBy,
      department,

      userId: params.userId,
      sessionId: params.sessionId,
      verticalId: params.verticalId,
      category: params.category,
      description: params.description,

      status: 'initiated',
      statusHistory: [],

      requiredGates,
      gateResults: [],

      cost: {
        estimatedTokens: params.estimatedTokens || 0,
        estimatedUsd: params.estimatedUsd || 0,
        serviceKeys: params.serviceKeys || [],
        quoted: false,
        settled: false,
      },

      artifacts: [],
      evidence: [],
      auditTrail: {},
    };

    this.transactions.set(id, transaction);

    // Write initiation to audit ledger
    const auditResult = auditLedger.write(
      createAuditEntry(
        params.verticalId || 'system',
        params.userId,
        params.sessionId,
        'transaction_metered',
        {
          transactionId: id,
          category: params.category,
          owner: params.ownerId,
          department,
          description: params.description,
          phase: 'initiated',
        },
        params.ownerId,
      ),
    );

    transaction.auditTrail = auditResult;

    return transaction;
  }

  /**
   * Transition a transaction through its lifecycle.
   * Every status change is recorded with who did it and why.
   */
  transition(
    transactionId: string,
    newStatus: TransactionStatus,
    by: string,
    reason?: string,
  ): Transaction {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const oldStatus = txn.status;
    txn.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      at: new Date().toISOString(),
      by,
      reason,
    });

    txn.status = newStatus;

    if (newStatus === 'executing') {
      txn.startedAt = new Date().toISOString();
    } else if (newStatus === 'verified' || newStatus === 'failed') {
      txn.completedAt = new Date().toISOString();
    } else if (newStatus === 'settled') {
      txn.settledAt = new Date().toISOString();
      txn.cost.settled = true;
    }

    return txn;
  }

  /**
   * Record a gate check result.
   * All required gates must pass before execution can proceed.
   */
  recordGate(
    transactionId: string,
    gate: GateType,
    passed: boolean,
    reason: string,
    checkedBy: string,
  ): { allGatesPassed: boolean; pendingGates: GateType[] } {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    txn.gateResults.push({
      gate,
      passed,
      reason,
      checkedAt: new Date().toISOString(),
      checkedBy,
    });

    if (!passed) {
      this.transition(transactionId, 'rejected', checkedBy, reason);
    }

    const checkedGates = new Set(txn.gateResults.map(g => g.gate));
    const pendingGates = txn.requiredGates.filter(g => !checkedGates.has(g));
    const allPassed = txn.gateResults.every(g => g.passed);

    return {
      allGatesPassed: pendingGates.length === 0 && allPassed,
      pendingGates,
    };
  }

  /**
   * Attach evidence to a transaction.
   * No proof, no done. Period.
   */
  attachEvidence(transactionId: string, evidence: string[]): void {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    txn.evidence.push(...evidence);
  }

  /**
   * Attach artifact IDs to a transaction.
   */
  attachArtifacts(transactionId: string, artifactIds: string[]): void {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    txn.artifacts.push(...artifactIds);
  }

  /**
   * Record actual cost after execution.
   */
  recordActualCost(
    transactionId: string,
    actualTokens: number,
    actualUsd: number,
  ): void {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    txn.cost.actualTokens = actualTokens;
    txn.cost.actualUsd = actualUsd;
  }

  /**
   * Settle a transaction — finalize LUC debit and seal audit.
   */
  settle(
    transactionId: string,
    by: string,
  ): Transaction {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (txn.evidence.length === 0 && txn.requiredGates.includes('evidence_required')) {
      throw new Error(`Transaction ${transactionId} cannot settle without evidence. No proof, no done.`);
    }

    // Write settlement to audit ledger
    const action: AuditAction = 'fee_charged';
    auditLedger.write(
      createAuditEntry(
        txn.verticalId || 'system',
        txn.userId,
        txn.sessionId,
        action,
        {
          transactionId: txn.id,
          category: txn.category,
          owner: txn.ownerId,
          department: txn.department,
          estimatedUsd: txn.cost.estimatedUsd,
          actualUsd: txn.cost.actualUsd,
          artifacts: txn.artifacts,
          evidence: txn.evidence,
          phase: 'settled',
        },
        txn.ownerId,
        {
          tokens: txn.cost.actualTokens || txn.cost.estimatedTokens,
          usd: txn.cost.actualUsd || txn.cost.estimatedUsd,
        },
      ),
    );

    return this.transition(transactionId, 'settled', by, 'LUC debit finalized, audit sealed');
  }

  /**
   * Roll back a settled transaction — issue LUC credit.
   */
  rollback(
    transactionId: string,
    by: string,
    reason: string,
  ): Transaction {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Write rollback/credit to audit ledger
    auditLedger.write(
      createAuditEntry(
        txn.verticalId || 'system',
        txn.userId,
        txn.sessionId,
        'savings_credited',
        {
          transactionId: txn.id,
          rollbackReason: reason,
          creditedUsd: txn.cost.actualUsd || txn.cost.estimatedUsd,
          phase: 'rolled_back',
        },
        by,
        {
          tokens: -(txn.cost.actualTokens || txn.cost.estimatedTokens),
          usd: -(txn.cost.actualUsd || txn.cost.estimatedUsd),
        },
      ),
    );

    return this.transition(transactionId, 'rolled_back', by, reason);
  }

  // ── Query Methods ───────────────────────────────────────────────────────

  get(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  getByOwner(ownerId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.ownerId === ownerId);
  }

  getBySession(sessionId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.sessionId === sessionId);
  }

  getByUser(userId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId);
  }

  getByDepartment(department: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.department === department);
  }

  getActive(): Transaction[] {
    const activeStatuses: TransactionStatus[] = [
      'initiated', 'pending_approval', 'approved', 'executing', 'pending_verify',
    ];
    return Array.from(this.transactions.values())
      .filter(t => activeStatuses.includes(t.status));
  }

  /**
   * Get ownership summary — who owns what, how much they've spent.
   */
  getOwnershipSummary(): Array<{
    ownerId: string;
    department: string;
    totalTransactions: number;
    activeTransactions: number;
    totalEstimatedUsd: number;
    totalActualUsd: number;
    categories: Record<string, number>;
  }> {
    const ownerMap = new Map<string, Transaction[]>();
    for (const txn of this.transactions.values()) {
      const existing = ownerMap.get(txn.ownerId) || [];
      existing.push(txn);
      ownerMap.set(txn.ownerId, existing);
    }

    const activeStatuses: TransactionStatus[] = [
      'initiated', 'pending_approval', 'approved', 'executing', 'pending_verify',
    ];

    return Array.from(ownerMap.entries()).map(([ownerId, txns]) => {
      const categories: Record<string, number> = {};
      for (const t of txns) {
        categories[t.category] = (categories[t.category] || 0) + 1;
      }

      return {
        ownerId,
        department: txns[0].department,
        totalTransactions: txns.length,
        activeTransactions: txns.filter(t => activeStatuses.includes(t.status)).length,
        totalEstimatedUsd: txns.reduce((sum, t) => sum + t.cost.estimatedUsd, 0),
        totalActualUsd: txns.reduce((sum, t) => sum + (t.cost.actualUsd || 0), 0),
        categories,
      };
    });
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const transactionManager = new TransactionManager();
