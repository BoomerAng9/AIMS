/**
 * Plug Instance Store — SQLite persistence for plug instances
 *
 * Replaces the in-memory Map in PlugDeployEngine with durable storage.
 * Instances survive server restarts, so running containers can be
 * reconciled and managed without data loss.
 */

import { getDb } from '../db';
import logger from '../logger';
import type { PlugInstance, PlugInstanceStatus } from './types';

// ---------------------------------------------------------------------------
// Serialization helpers (JSON columns)
// ---------------------------------------------------------------------------

function serialize(instance: PlugInstance): Record<string, unknown> {
  return {
    instanceId: instance.instanceId,
    plugId: instance.plugId,
    userId: instance.userId,
    name: instance.name,
    status: instance.status,
    deliveryMode: instance.deliveryMode,
    assignedPort: instance.assignedPort,
    domain: instance.domain || null,
    envOverrides: JSON.stringify(instance.envOverrides || {}),
    customizationValues: JSON.stringify(instance.customizationValues || {}),
    securityLevel: instance.securityLevel,
    dspId: instance.dspId || null,
    lucCost: instance.lucCost,
    uptimeSeconds: instance.uptimeSeconds,
    lastHealthCheck: instance.lastHealthCheck || null,
    healthStatus: instance.healthStatus,
    exportBundle: instance.exportBundle ? JSON.stringify(instance.exportBundle) : null,
    createdAt: instance.createdAt,
    startedAt: instance.startedAt || null,
    stoppedAt: instance.stoppedAt || null,
  };
}

function deserialize(row: any): PlugInstance {
  return {
    instanceId: row.instanceId,
    plugId: row.plugId,
    userId: row.userId,
    name: row.name,
    status: row.status as PlugInstanceStatus,
    deliveryMode: row.deliveryMode,
    assignedPort: row.assignedPort,
    domain: row.domain || undefined,
    envOverrides: JSON.parse(row.envOverrides || '{}'),
    customizationValues: JSON.parse(row.customizationValues || '{}'),
    securityLevel: row.securityLevel,
    dspId: row.dspId || undefined,
    lucCost: row.lucCost,
    uptimeSeconds: row.uptimeSeconds,
    lastHealthCheck: row.lastHealthCheck || undefined,
    healthStatus: row.healthStatus || 'unknown',
    exportBundle: row.exportBundle ? JSON.parse(row.exportBundle) : undefined,
    createdAt: row.createdAt,
    startedAt: row.startedAt || undefined,
    stoppedAt: row.stoppedAt || undefined,
  };
}

// ---------------------------------------------------------------------------
// Instance Store
// ---------------------------------------------------------------------------

export const instanceStore = {
  upsert(instance: PlugInstance): void {
    const db = getDb();
    const data = serialize(instance);
    db.prepare(`
      INSERT INTO plug_instances (
        instanceId, plugId, userId, name, status, deliveryMode,
        assignedPort, domain, envOverrides, customizationValues,
        securityLevel, dspId, lucCost, uptimeSeconds, lastHealthCheck,
        healthStatus, exportBundle, createdAt, startedAt, stoppedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(instanceId) DO UPDATE SET
        status = excluded.status,
        healthStatus = excluded.healthStatus,
        uptimeSeconds = excluded.uptimeSeconds,
        lastHealthCheck = excluded.lastHealthCheck,
        lucCost = excluded.lucCost,
        startedAt = excluded.startedAt,
        stoppedAt = excluded.stoppedAt,
        exportBundle = excluded.exportBundle,
        envOverrides = excluded.envOverrides
    `).run(
      data.instanceId, data.plugId, data.userId, data.name, data.status,
      data.deliveryMode, data.assignedPort, data.domain, data.envOverrides,
      data.customizationValues, data.securityLevel, data.dspId, data.lucCost,
      data.uptimeSeconds, data.lastHealthCheck, data.healthStatus,
      data.exportBundle, data.createdAt, data.startedAt, data.stoppedAt,
    );
  },

  get(instanceId: string): PlugInstance | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM plug_instances WHERE instanceId = ?').get(instanceId);
    return row ? deserialize(row) : undefined;
  },

  listByUser(userId: string): PlugInstance[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM plug_instances WHERE userId = ? ORDER BY createdAt DESC').all(userId);
    return rows.map(deserialize);
  },

  listRunning(): PlugInstance[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM plug_instances WHERE status = 'running'").all();
    return rows.map(deserialize);
  },

  listAll(): PlugInstance[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM plug_instances ORDER BY createdAt DESC').all();
    return rows.map(deserialize);
  },

  updateStatus(instanceId: string, status: PlugInstanceStatus, extra?: Partial<PlugInstance>): void {
    const db = getDb();
    const setClauses = ['status = ?'];
    const values: unknown[] = [status];

    if (extra?.healthStatus) { setClauses.push('healthStatus = ?'); values.push(extra.healthStatus); }
    if (extra?.uptimeSeconds !== undefined) { setClauses.push('uptimeSeconds = ?'); values.push(extra.uptimeSeconds); }
    if (extra?.lastHealthCheck) { setClauses.push('lastHealthCheck = ?'); values.push(extra.lastHealthCheck); }
    if (extra?.startedAt) { setClauses.push('startedAt = ?'); values.push(extra.startedAt); }
    if (extra?.stoppedAt) { setClauses.push('stoppedAt = ?'); values.push(extra.stoppedAt); }

    values.push(instanceId);
    db.prepare(`UPDATE plug_instances SET ${setClauses.join(', ')} WHERE instanceId = ?`).run(...values);
  },

  delete(instanceId: string): void {
    const db = getDb();
    db.prepare('DELETE FROM plug_instances WHERE instanceId = ?').run(instanceId);
    logger.info({ instanceId }, '[InstanceStore] Deleted from SQLite');
  },
};
