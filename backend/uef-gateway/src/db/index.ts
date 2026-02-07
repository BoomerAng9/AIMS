/**
 * A.I.M.S. Data Store
 *
 * Lightweight in-memory store with typed entity definitions.
 * Provides generic CRUD operations via the Store<T> class and
 * pre-configured singleton stores for Projects, Plugs, and Deployments.
 *
 * No external database dependency — all data lives in-process Maps.
 * This will be swapped for a persistent layer (Postgres/Mongo) later.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectSpec {
  archetype: string;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  pages: string[];
  apiRoutes: string[];
  dbModels: string[];
  integrations: string[];
  estimatedFiles: number;
  estimatedBuildTime: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  complexity: 'simple' | 'intermediate' | 'complex';
  status:
    | 'intake'
    | 'scoping'
    | 'building'
    | 'review'
    | 'deploying'
    | 'live'
    | 'failed';
  archetype: string;
  features: string[];
  integrations: string[];
  branding: {
    primaryColor: string;
    logo?: string;
    domain?: string;
  };
  spec?: ProjectSpec;
  createdAt: string;
  updatedAt: string;
}

export interface FileEntry {
  path: string;
  description: string;
  size: number;
}

export interface Plug {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  version: string;
  status: 'building' | 'review' | 'ready' | 'deployed' | 'disabled';
  files: FileEntry[];
  deploymentId?: string;
  metrics: {
    requests: number;
    errors: number;
    uptime: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  plugId: string;
  userId: string;
  provider: 'docker' | 'cdn' | 'vps';
  status: 'pending' | 'provisioning' | 'running' | 'stopped' | 'failed';
  url?: string;
  domain?: string;
  containerId?: string;
  port?: number;
  sslEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Generic Store
// ---------------------------------------------------------------------------

export class Store<T extends { id: string }> {
  private data: Map<string, T> = new Map();
  private readonly entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
  }

  /** Insert a new record. Returns the stored item. */
  create(item: T): T {
    this.data.set(item.id, item);
    logger.info({ id: item.id }, `[DB] Created ${this.entityName}`);
    return item;
  }

  /** Retrieve a single record by id. */
  get(id: string): T | undefined {
    return this.data.get(id);
  }

  /** Partially update an existing record. Returns the updated item or undefined. */
  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this.data.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, id: existing.id } as T;
    this.data.set(id, updated);
    logger.info({ id }, `[DB] Updated ${this.entityName}`);
    return updated;
  }

  /** Delete a record by id. Returns true if it existed. */
  delete(id: string): boolean {
    const existed = this.data.has(id);
    if (existed) {
      this.data.delete(id);
      logger.info({ id }, `[DB] Deleted ${this.entityName}`);
    }
    return existed;
  }

  /** Return every record. */
  list(): T[] {
    return Array.from(this.data.values());
  }

  /** Return records matching a predicate. */
  findBy(predicate: (item: T) => boolean): T[] {
    return this.list().filter(predicate);
  }
}

// ---------------------------------------------------------------------------
// Singleton stores
// ---------------------------------------------------------------------------

export const projectStore = new Store<Project>('project');
export const plugStore = new Store<Plug>('plug');
export const deploymentStore = new Store<Deployment>('deployment');

// Re-export uuid helper so consumers don't need a direct dependency
export { uuidv4 };
