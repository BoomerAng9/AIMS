/**
 * Cloudflare KV Sync — Push port allocations to Edge
 *
 * When a plug instance is deployed/decommissioned, this module pushes
 * the subdomain → port mapping to the Agent Gateway Worker's KV namespace.
 * The worker uses this for direct plug routing at the edge.
 *
 * Two sync modes:
 *   1. Incremental: Push/delete individual routes on deploy/decommission
 *   2. Full: Reconcile all routes (called on startup or manually)
 *
 * Communicates via the /_worker/routes management API on the Agent Gateway.
 */

import logger from '../logger';
import { portAllocator } from './port-allocator';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WORKER_URL = process.env.AGENT_GATEWAY_WORKER_URL || 'https://plugmein.cloud';
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || '';

// ---------------------------------------------------------------------------
// KV Sync Client
// ---------------------------------------------------------------------------

export class KVSync {
  private enabled = false;

  constructor() {
    this.enabled = GATEWAY_SECRET.length > 0;
    if (!this.enabled) {
      logger.warn('[KVSync] GATEWAY_SECRET not configured — KV sync disabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // -----------------------------------------------------------------------
  // Push a single route (on deploy)
  // -----------------------------------------------------------------------

  async pushRoute(subdomain: string, port: number, instanceId: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const res = await fetch(`${WORKER_URL}/_worker/routes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GATEWAY_SECRET}`,
        },
        body: JSON.stringify({
          subdomain,
          port,
          protocol: 'http',
          instanceId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        logger.error({ subdomain, port, status: res.status, body: text }, '[KVSync] Push failed');
        return false;
      }

      logger.info({ subdomain, port }, '[KVSync] Route pushed');
      return true;
    } catch (err) {
      logger.error({ err, subdomain }, '[KVSync] Push error');
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Remove a single route (on decommission)
  // -----------------------------------------------------------------------

  async removeRoute(subdomain: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const res = await fetch(`${WORKER_URL}/_worker/routes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GATEWAY_SECRET}`,
        },
        body: JSON.stringify({ subdomain }),
      });

      if (!res.ok) {
        const text = await res.text();
        logger.error({ subdomain, status: res.status, body: text }, '[KVSync] Remove failed');
        return false;
      }

      logger.info({ subdomain }, '[KVSync] Route removed');
      return true;
    } catch (err) {
      logger.error({ err, subdomain }, '[KVSync] Remove error');
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Full reconciliation — push all active allocations
  // -----------------------------------------------------------------------

  async fullSync(): Promise<{ pushed: number; failed: number }> {
    if (!this.enabled) return { pushed: 0, failed: 0 };

    const allocations = portAllocator.getAllocations();
    let pushed = 0;
    let failed = 0;

    for (const alloc of allocations) {
      // Derive subdomain from instance ID (same logic as instance lifecycle)
      const subdomain = alloc.instanceId.split('-')[0] || alloc.plugId;
      const success = await this.pushRoute(subdomain, alloc.port, alloc.instanceId);
      if (success) pushed++;
      else failed++;
    }

    logger.info({ pushed, failed, total: allocations.length }, '[KVSync] Full sync complete');
    return { pushed, failed };
  }

  // -----------------------------------------------------------------------
  // Get current routes from worker (for verification)
  // -----------------------------------------------------------------------

  async getRoutes(): Promise<Record<string, unknown> | null> {
    if (!this.enabled) return null;

    try {
      const res = await fetch(`${WORKER_URL}/_worker/routes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GATEWAY_SECRET}`,
        },
      });

      if (!res.ok) return null;
      return await res.json() as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const kvSync = new KVSync();
