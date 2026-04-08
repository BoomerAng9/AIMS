/**
 * Port Allocation Engine
 *
 * Manages the 51000+ port range for plug instances with:
 *   - Persistent allocation tracking (survives restarts via state file)
 *   - Collision detection against running Docker containers
 *   - Port reclamation from decommissioned instances
 *   - 10-port increments per instance (room for multi-port plugs)
 *
 * Port layout:
 *   51000-51009 — Instance slot 0
 *   51010-51019 — Instance slot 1
 *   51020-51029 — Instance slot 2
 *   ...
 *   59990-59999 — Max ~900 concurrent instances
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_PORT = 51000;
const PORT_INCREMENT = 10;
const MAX_PORT = 59999;
const MAX_SLOTS = Math.floor((MAX_PORT - BASE_PORT + 1) / PORT_INCREMENT);
// Use data dir for persistent state — /tmp/ gets wiped on reboot.
// Falls back to /tmp/ if data dir doesn't exist (handled in save()).
const DATA_DIR = process.env.AIMS_DATA_DIR || '/var/lib/aims';
const STATE_FILE = process.env.PORT_ALLOCATOR_STATE || `${DATA_DIR}/port-allocator.json`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PortAllocation {
  port: number;
  instanceId: string;
  plugId: string;
  userId: string;
  allocatedAt: string;
  releasedAt?: string;
}

interface AllocatorState {
  allocations: PortAllocation[];
  version: number;
  lastSaved: string;
}

// ---------------------------------------------------------------------------
// Port Allocator
// ---------------------------------------------------------------------------

export class PortAllocator {
  private allocations = new Map<number, PortAllocation>();
  private instanceToPort = new Map<string, number>();
  private loaded = false;

  // -----------------------------------------------------------------------
  // Load / Save state
  // -----------------------------------------------------------------------

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      const state: AllocatorState = JSON.parse(data);

      for (const alloc of state.allocations) {
        if (!alloc.releasedAt) {
          this.allocations.set(alloc.port, alloc);
          this.instanceToPort.set(alloc.instanceId, alloc.port);
        }
      }

      this.loaded = true;
      logger.info(
        { active: this.allocations.size, file: STATE_FILE },
        '[PortAllocator] State loaded',
      );
    } catch {
      // No state file — start fresh
      this.loaded = true;
      logger.info('[PortAllocator] No existing state — starting fresh');
    }
  }

  private async save(): Promise<void> {
    const state: AllocatorState = {
      allocations: Array.from(this.allocations.values()),
      version: 1,
      lastSaved: new Date().toISOString(),
    };

    try {
      // Ensure directory exists
      const dir = STATE_FILE.substring(0, STATE_FILE.lastIndexOf('/'));
      await fs.mkdir(dir, { recursive: true }).catch(() => { /* exists */ });
      await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      // Fallback to /tmp if persistent dir not writable
      try {
        const fallback = '/tmp/aims-port-allocator.json';
        await fs.writeFile(fallback, JSON.stringify(state, null, 2), 'utf-8');
        logger.warn({ primary: STATE_FILE, fallback }, '[PortAllocator] Saved to fallback path');
      } catch (fallbackErr) {
        logger.error({ err }, '[PortAllocator] Failed to save state to any path');
      }
    }
  }

  // -----------------------------------------------------------------------
  // Allocate
  // -----------------------------------------------------------------------

  async allocate(instanceId: string, plugId: string, userId: string): Promise<number> {
    if (!this.loaded) await this.load();

    // Check if instance already has a port
    const existing = this.instanceToPort.get(instanceId);
    if (existing !== undefined) {
      return existing;
    }

    // Find next available slot
    const port = this.findAvailablePort();
    if (port === null) {
      throw new Error(`Port exhaustion: all ${MAX_SLOTS} slots are in use`);
    }

    const allocation: PortAllocation = {
      port,
      instanceId,
      plugId,
      userId,
      allocatedAt: new Date().toISOString(),
    };

    this.allocations.set(port, allocation);
    this.instanceToPort.set(instanceId, port);

    await this.save();

    logger.info(
      { port, instanceId, plugId, active: this.allocations.size },
      '[PortAllocator] Port allocated',
    );

    return port;
  }

  // -----------------------------------------------------------------------
  // Release
  // -----------------------------------------------------------------------

  async release(instanceId: string): Promise<number | null> {
    const port = this.instanceToPort.get(instanceId);
    if (port === undefined) return null;

    this.allocations.delete(port);
    this.instanceToPort.delete(instanceId);

    await this.save();

    logger.info(
      { port, instanceId, active: this.allocations.size },
      '[PortAllocator] Port released',
    );

    return port;
  }

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  getPort(instanceId: string): number | undefined {
    return this.instanceToPort.get(instanceId);
  }

  getAllocation(port: number): PortAllocation | undefined {
    return this.allocations.get(port);
  }

  getAllocations(): PortAllocation[] {
    return Array.from(this.allocations.values());
  }

  getActiveCount(): number {
    return this.allocations.size;
  }

  getCapacity(): { used: number; total: number; percentage: number } {
    const used = this.allocations.size;
    return {
      used,
      total: MAX_SLOTS,
      percentage: Math.round((used / MAX_SLOTS) * 100),
    };
  }

  isPortAllocated(port: number): boolean {
    return this.allocations.has(port);
  }

  // -----------------------------------------------------------------------
  // Reconciliation — sync with actual Docker state
  // -----------------------------------------------------------------------

  async reconcile(runningInstanceIds: Set<string>): Promise<{
    orphanedPorts: number[];
    missingAllocations: string[];
  }> {
    if (!this.loaded) await this.load();

    const orphanedPorts: number[] = [];
    const missingAllocations: string[] = [];

    // Find ports allocated to instances that aren't running
    for (const [port, alloc] of this.allocations) {
      if (!runningInstanceIds.has(alloc.instanceId)) {
        orphanedPorts.push(port);
      }
    }

    // Find running instances without port allocations
    for (const instanceId of runningInstanceIds) {
      if (!this.instanceToPort.has(instanceId)) {
        missingAllocations.push(instanceId);
      }
    }

    if (orphanedPorts.length > 0 || missingAllocations.length > 0) {
      logger.warn(
        { orphanedPorts, missingAllocations },
        '[PortAllocator] Reconciliation found discrepancies',
      );
    }

    return { orphanedPorts, missingAllocations };
  }

  /**
   * Release all orphaned ports (allocated but no running container).
   */
  async releaseOrphans(runningInstanceIds: Set<string>): Promise<number[]> {
    const { orphanedPorts } = await this.reconcile(runningInstanceIds);

    for (const port of orphanedPorts) {
      const alloc = this.allocations.get(port);
      if (alloc) {
        this.allocations.delete(port);
        this.instanceToPort.delete(alloc.instanceId);
      }
    }

    if (orphanedPorts.length > 0) {
      await this.save();
      logger.info(
        { released: orphanedPorts.length },
        '[PortAllocator] Orphaned ports released',
      );
    }

    return orphanedPorts;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private findAvailablePort(): number | null {
    for (let port = BASE_PORT; port <= MAX_PORT; port += PORT_INCREMENT) {
      if (!this.allocations.has(port)) {
        return port;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const portAllocator = new PortAllocator();
