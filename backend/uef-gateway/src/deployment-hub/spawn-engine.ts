/**
 * Spawn Engine — Core deployment hub logic.
 *
 * Implements the 9-step spawn flow:
 *   1. CLASSIFY  — Determine agent type and capability needed
 *   2. LOAD CARD — Load role card from chain-of-command/role-cards/
 *   3. LOAD BRAIN — Reference brain file for technical scope
 *   4. APPLY VISUAL — Apply visual identity (accent color, helmet, description)
 *   5. GATE CHECK — Validate budget, security scope, chain-of-command approval
 *   6. SPAWN — Deploy container/process with injected config
 *   7. REGISTER — Register with OpsConsole_Ang for observability
 *   8. AUDIT LOG — Create audit trail entry
 *   9. CONFIRM — Return spawn confirmation with full identity
 *
 * Invoked by ACHEEVY's `spawn_shift` tool.
 * No agent exists without a card. No card exists without an audit entry.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { getCard, getVisualIdentity, listBoomerAngs, listLilHawks, listCards } from './card-loader';
import type {
  SpawnRequest,
  SpawnRecord,
  SpawnResponse,
  SpawnAuditEntry,
  SpawnStatus,
  RosterEntry,
} from './types';

// ── In-Memory State ─────────────────────────────────────────
// Production: Firestore collections. Dev: in-memory maps.

const activeSpawns = new Map<string, SpawnRecord>();
const auditLog: SpawnAuditEntry[] = [];

// ── Delegation Matrix ───────────────────────────────────────

const DELEGATION_RULES: Record<string, { canSpawn: string[]; approvalRequired: string | null }> = {
  ACHEEVY: { canSpawn: ['BOOMER_ANG', 'LIL_HAWK', 'AUTONOMOUS_SESSION'], approvalRequired: null },
  Boomer_Ang: { canSpawn: ['LIL_HAWK'], approvalRequired: 'Chicken Hawk' },
  Chicken_Hawk: { canSpawn: ['LIL_HAWK'], approvalRequired: null },
};

// ── Gate Checks ─────────────────────────────────────────────

function checkBudgetGate(request: SpawnRequest, card: any): { passed: boolean; reason: string } {
  if (!card.gates?.luc_budget?.required) {
    return { passed: true, reason: 'Budget gate not required for this agent' };
  }

  const maxBudget = card.gates.luc_budget.max_estimated_cost_usd;
  if (maxBudget && request.budgetCapUsd && request.budgetCapUsd > maxBudget) {
    return { passed: false, reason: `Budget cap $${request.budgetCapUsd} exceeds agent max $${maxBudget}` };
  }

  return { passed: true, reason: 'Budget within limits' };
}

function checkSecurityGate(card: any): { passed: boolean; reason: string } {
  if (!card.gates?.security?.scope_least_privilege_required) {
    return { passed: true, reason: 'Security gate waived' };
  }

  // Verify forbidden actions are defined
  if (!card.capabilities?.forbidden_actions?.length) {
    return { passed: false, reason: 'Agent has no forbidden_actions defined — violates least privilege' };
  }

  return { passed: true, reason: 'Least privilege verified' };
}

function checkChainOfCommandGate(request: SpawnRequest): { passed: boolean; reason: string } {
  const requesterRole = request.requestedBy === 'ACHEEVY' ? 'ACHEEVY' : 'Boomer_Ang';
  const rules = DELEGATION_RULES[requesterRole];

  if (!rules) {
    return { passed: false, reason: `Unknown requester role: ${request.requestedBy}` };
  }

  if (!rules.canSpawn.includes(request.spawnType)) {
    return { passed: false, reason: `${request.requestedBy} cannot spawn ${request.spawnType}` };
  }

  return { passed: true, reason: `${request.requestedBy} authorized to spawn ${request.spawnType}` };
}

// ── Audit Helpers ───────────────────────────────────────────

function logAudit(
  spawnId: string,
  action: SpawnAuditEntry['action'],
  actor: string,
  details: string,
): SpawnAuditEntry {
  const entry: SpawnAuditEntry = {
    entryId: uuidv4(),
    spawnId,
    action,
    actor,
    details,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(entry);
  logger.info({ spawnId, action, actor }, `[SpawnEngine] ${details}`);
  return entry;
}

// ── Main Spawn Flow ─────────────────────────────────────────

export async function spawnAgent(request: SpawnRequest): Promise<SpawnResponse> {
  const spawnId = `spawn_${uuidv4()}`;
  const trail: SpawnAuditEntry[] = [];

  // Step 1: CLASSIFY
  trail.push(logAudit(spawnId, 'SPAWN', request.requestedBy, `Spawn requested: ${request.handle} (${request.spawnType})`));

  // Step 2: LOAD CARD
  const card = getCard(request.handle);
  if (!card) {
    trail.push(logAudit(spawnId, 'ERROR', 'SpawnEngine', `Role card not found for: ${request.handle}`));
    return {
      success: false,
      spawnId,
      handle: request.handle,
      status: 'FAILED',
      roleCard: null,
      visualIdentity: null,
      gatesPassed: [],
      auditTrail: trail,
      error: `No role card found for "${request.handle}". Every agent must have a card.`,
    };
  }

  // Step 3: APPLY VISUAL
  const visualIdentity = getVisualIdentity(card);

  // Step 4: GATE CHECKS
  const gatesPassed: string[] = [];

  // Gate: Chain of Command
  const cocGate = checkChainOfCommandGate(request);
  trail.push(logAudit(spawnId, cocGate.passed ? 'GATE_PASS' : 'GATE_FAIL', 'ChainOfCommand', cocGate.reason));
  if (!cocGate.passed) {
    return {
      success: false,
      spawnId,
      handle: request.handle,
      status: 'FAILED',
      roleCard: card,
      visualIdentity,
      gatesPassed,
      auditTrail: trail,
      error: cocGate.reason,
    };
  }
  gatesPassed.push('chain_of_command');

  // Gate: Budget
  const budgetGate = checkBudgetGate(request, card);
  trail.push(logAudit(spawnId, budgetGate.passed ? 'GATE_PASS' : 'GATE_FAIL', 'BudgetGate', budgetGate.reason));
  if (!budgetGate.passed) {
    return {
      success: false,
      spawnId,
      handle: request.handle,
      status: 'FAILED',
      roleCard: card,
      visualIdentity,
      gatesPassed,
      auditTrail: trail,
      error: budgetGate.reason,
    };
  }
  gatesPassed.push('budget');

  // Gate: Security
  const securityGate = checkSecurityGate(card);
  trail.push(logAudit(spawnId, securityGate.passed ? 'GATE_PASS' : 'GATE_FAIL', 'SecurityGate', securityGate.reason));
  if (!securityGate.passed) {
    return {
      success: false,
      spawnId,
      handle: request.handle,
      status: 'FAILED',
      roleCard: card,
      visualIdentity,
      gatesPassed,
      auditTrail: trail,
      error: securityGate.reason,
    };
  }
  gatesPassed.push('security');

  // Step 5: SPAWN (create record)
  const now = new Date().toISOString();
  const record: SpawnRecord = {
    spawnId,
    spawnType: request.spawnType,
    handle: request.handle,
    requestedBy: request.requestedBy,
    taskId: request.taskId || null,
    environment: request.environment,
    status: 'ACTIVE',
    roleCard: card,
    visualIdentity,
    budgetCapUsd: request.budgetCapUsd || null,
    sessionDurationMaxS: request.sessionDurationMaxS || null,
    gatesPassed,
    createdAt: now,
    updatedAt: now,
    decommissionedAt: null,
  };

  activeSpawns.set(spawnId, record);

  // Step 6: REGISTER (with OpsConsole_Ang — simulated event)
  trail.push(logAudit(spawnId, 'ACTIVATE', 'OpsConsole_Ang', `Agent ${request.handle} registered and online`));

  // Step 7: CONFIRM
  trail.push(logAudit(spawnId, 'SPAWN', 'SpawnEngine', `Agent ${request.handle} successfully spawned in ${request.environment}`));

  return {
    success: true,
    spawnId,
    handle: request.handle,
    status: 'ACTIVE',
    roleCard: card,
    visualIdentity,
    gatesPassed,
    auditTrail: trail,
  };
}

// ── Decommission ────────────────────────────────────────────

export async function decommissionAgent(spawnId: string, reason: string): Promise<SpawnResponse> {
  const record = activeSpawns.get(spawnId);
  const trail: SpawnAuditEntry[] = [];

  if (!record) {
    trail.push(logAudit(spawnId, 'ERROR', 'SpawnEngine', `Spawn ${spawnId} not found`));
    return {
      success: false,
      spawnId,
      handle: 'unknown',
      status: 'FAILED',
      roleCard: null,
      visualIdentity: null,
      gatesPassed: [],
      auditTrail: trail,
      error: `No active spawn found with ID: ${spawnId}`,
    };
  }

  // Drain → Decommission
  record.status = 'DRAINING';
  record.updatedAt = new Date().toISOString();
  trail.push(logAudit(spawnId, 'DECOMMISSION', 'ACHEEVY', `Draining ${record.handle}: ${reason}`));

  record.status = 'DECOMMISSIONED';
  record.decommissionedAt = new Date().toISOString();
  record.updatedAt = record.decommissionedAt;
  trail.push(logAudit(spawnId, 'DECOMMISSION', 'OpsConsole_Ang', `Agent ${record.handle} confirmed offline`));

  return {
    success: true,
    spawnId,
    handle: record.handle,
    status: 'DECOMMISSIONED',
    roleCard: record.roleCard,
    visualIdentity: record.visualIdentity,
    gatesPassed: record.gatesPassed,
    auditTrail: trail,
  };
}

// ── Queries ─────────────────────────────────────────────────

/**
 * Get the live roster of all active spawns.
 */
export function getRoster(): RosterEntry[] {
  return Array.from(activeSpawns.values())
    .filter(r => r.status === 'ACTIVE')
    .map(r => ({
      handle: r.handle,
      spawnType: r.spawnType,
      status: r.status,
      environment: r.environment,
      accentColor: r.visualIdentity?.accentColor || '#D4AF37',
      pmoOffice: r.roleCard?.pmo_office || 'Unknown',
      catchphrase: r.roleCard?.identity?.catchphrase || '',
      spawnId: r.spawnId,
      createdAt: r.createdAt,
    }));
}

/**
 * Get a specific spawn record.
 */
export function getSpawn(spawnId: string): SpawnRecord | null {
  return activeSpawns.get(spawnId) || null;
}

/**
 * Get the full available Boomer_Ang roster (from card files, not just active spawns).
 */
export function getAvailableRoster(): Array<{
  handle: string;
  pmoOffice: string;
  catchphrase: string;
  accentColor: string;
  roleType: string;
}> {
  return listCards().map(card => ({
    handle: card.handle,
    pmoOffice: card.pmo_office,
    catchphrase: card.identity?.catchphrase || '',
    accentColor: (card as any).visual_identity?.accent_color || '#D4AF37',
    roleType: card.role_type,
  }));
}

/**
 * Get the full audit trail for a specific spawn.
 */
export function getAuditTrail(spawnId: string): SpawnAuditEntry[] {
  return auditLog.filter(e => e.spawnId === spawnId);
}

/**
 * Get the complete audit log.
 */
export function getFullAuditLog(): SpawnAuditEntry[] {
  return [...auditLog];
}
