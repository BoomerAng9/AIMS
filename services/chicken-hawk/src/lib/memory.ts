// =============================================================================
// Chicken Hawk — Persistent Memory Store
// Cross-execution state so agents never start fresh.
// Backend: file persistence (durable) + in-memory cache (fast).
// Data volume at /app/data/memory survives container restarts.
// =============================================================================

import type { MemorySnapshot } from "../types";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const MEMORY_DIR = process.env.MEMORY_DIR || "/app/data/memory";

export class MemoryStore {
  private cache: Map<string, MemorySnapshot> = new Map();

  constructor() {
    try {
      mkdirSync(MEMORY_DIR, { recursive: true });
    } catch {
      // tmpfs or read-only — use in-memory only
    }
    this.loadFromDisk();
  }

  /**
   * Get memory for an agent. Returns empty snapshot if none exists.
   */
  get(agentId: string): MemorySnapshot {
    return this.cache.get(agentId) || this.emptySnapshot(agentId);
  }

  /**
   * Save/update memory for an agent.
   */
  save(snapshot: MemorySnapshot): void {
    snapshot.updated_at = new Date().toISOString();
    this.cache.set(snapshot.agent_id, snapshot);
    this.persistToDisk(snapshot);
  }

  /**
   * Record an outcome from a completed task.
   */
  recordOutcome(agentId: string, taskId: string, status: string, lesson: string): void {
    const mem = this.get(agentId);
    mem.outcomes.push({ task_id: taskId, status, lesson });
    // Keep last 100 outcomes
    if (mem.outcomes.length > 100) mem.outcomes = mem.outcomes.slice(-100);
    this.save(mem);
  }

  /**
   * Record a decision made during execution.
   */
  recordDecision(agentId: string, decision: string, reason: string): void {
    const mem = this.get(agentId);
    mem.decisions.push({ decision, reason, timestamp: new Date().toISOString() });
    if (mem.decisions.length > 50) mem.decisions = mem.decisions.slice(-50);
    this.save(mem);
  }

  /**
   * Get all stored agent IDs.
   */
  listAgents(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get total memory entries count.
   */
  size(): number {
    return this.cache.size;
  }

  private emptySnapshot(agentId: string): MemorySnapshot {
    return {
      agent_id: agentId,
      shift_id: "",
      manifest_id: "",
      state: {},
      outcomes: [],
      preferences: {},
      decisions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private persistToDisk(snapshot: MemorySnapshot): void {
    try {
      const filePath = join(MEMORY_DIR, `${snapshot.agent_id}.json`);
      writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    } catch {
      // Disk write failed (read-only FS?) — memory stays in cache only
    }
  }

  private loadFromDisk(): void {
    try {
      if (!existsSync(MEMORY_DIR)) return;
      const files = readdirSync(MEMORY_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = JSON.parse(readFileSync(join(MEMORY_DIR, file), "utf-8"));
          if (data.agent_id) this.cache.set(data.agent_id, data);
        } catch {
          // Corrupted file — skip
        }
      }
      if (this.cache.size > 0) {
        console.log(`[memory] Loaded ${this.cache.size} agent memories from disk`);
      }
    } catch {
      console.log("[memory] No disk memories found — starting fresh");
    }
  }
}

export const memory = new MemoryStore();
