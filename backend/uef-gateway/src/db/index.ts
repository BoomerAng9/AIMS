/**
 * A.I.M.S. Data Store — SQLite Persistence Layer
 *
 * Replaces the in-memory Map-based store with a proper SQLite-backed
 * persistence layer using better-sqlite3 in WAL mode.
 *
 * Maintains the same Store<T> interface (create/get/update/delete/list/findBy)
 * so all existing consumers continue to work unchanged.
 *
 * Tables: projects, plugs, deployments, audit_log, evidence
 * Features: prepared statements, JSON auto-serialization, TTL cleanup
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../logger';
import { runMigrations } from './migrations';

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

export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface EvidenceRecord {
  id: string;
  gateId: string;
  projectId: string;
  type: string;
  passed: boolean;
  report: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Retention Policy Configuration
// ---------------------------------------------------------------------------

export interface RetentionPolicy {
  /** Default TTL in milliseconds. 0 = no expiry. */
  defaultTtlMs: number;
  /** Per-table TTL overrides (ms). */
  tableTtls: Record<string, number>;
  /** How often to run cleanup (ms). */
  cleanupIntervalMs: number;
}

const DEFAULT_RETENTION: RetentionPolicy = {
  defaultTtlMs: 0, // no expiry by default
  tableTtls: {
    audit_log: 90 * 24 * 60 * 60 * 1000,   // 90 days
    evidence: 180 * 24 * 60 * 60 * 1000,    // 180 days
  },
  cleanupIntervalMs: 60 * 60 * 1000, // hourly
};

// ---------------------------------------------------------------------------
// Column Schema Definitions (for auto-serialization)
// ---------------------------------------------------------------------------

/**
 * Describes which columns of a table hold JSON data and which hold booleans
 * so the Store can auto-serialize/deserialize them.
 */
interface TableSchema {
  jsonColumns: string[];
  boolColumns: string[];
}

const TABLE_SCHEMAS: Record<string, TableSchema> = {
  projects: {
    jsonColumns: ['features', 'integrations', 'branding', 'spec'],
    boolColumns: [],
  },
  plugs: {
    jsonColumns: ['files', 'metrics'],
    boolColumns: [],
  },
  deployments: {
    jsonColumns: [],
    boolColumns: ['sslEnabled'],
  },
  audit_log: {
    jsonColumns: ['detail'],
    boolColumns: [],
  },
  evidence: {
    jsonColumns: ['report'],
    boolColumns: ['passed'],
  },
};

// ---------------------------------------------------------------------------
// Database Initialization
// ---------------------------------------------------------------------------

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DB_DIR, 'aims.db');
const IS_TEST = process.env.NODE_ENV === 'test';

function ensureDataDir(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    logger.info({ dir: DB_DIR }, '[DB] Created data directory');
  }
}

let _db: Database.Database | undefined;

/**
 * Returns the singleton database connection. Creates and initializes on
 * first call: WAL mode, migrations, etc.
 *
 * In test environments (NODE_ENV=test) an in-memory database is used so
 * that each Jest worker gets full isolation with zero file contention.
 */
export function getDb(): Database.Database {
  if (_db) return _db;

  if (IS_TEST) {
    _db = new Database(':memory:');
  } else {
    ensureDataDir();
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
  }

  _db.pragma('foreign_keys = ON');
  runMigrations(_db);

  const dbLabel = IS_TEST ? ':memory:' : DB_PATH;
  logger.info({ path: dbLabel }, '[DB] SQLite database initialized');
  return _db;
}

/**
 * Close the database connection (useful for tests / shutdown).
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = undefined;
    logger.info('[DB] Database connection closed');
  }
}

/**
 * Reset the singleton (for testing purposes). Does NOT close old connection.
 */
export function resetDbForTesting(testDb?: Database.Database): void {
  _db = testDb;
}

// ---------------------------------------------------------------------------
// Generic Store (SQLite-backed)
// ---------------------------------------------------------------------------

export class Store<T extends { id: string }> {
  private readonly tableName: string;
  private readonly entityName: string;
  private readonly schema: TableSchema;
  private tableEnsured = false;

  constructor(entityName: string, tableName?: string) {
    this.entityName = entityName;
    this.tableName = tableName ?? entityName;
    this.schema = TABLE_SCHEMAS[this.tableName] ?? { jsonColumns: [], boolColumns: [] };
  }

  private get db(): Database.Database {
    return getDb();
  }

  /**
   * For dynamic/ad-hoc stores (e.g. in tests), auto-create a generic table
   * with TEXT columns derived from the first item inserted. Known tables
   * (those in TABLE_SCHEMAS) are handled by migrations, so this is a no-op
   * for them.
   */
  private ensureTable(item: T): void {
    if (this.tableEnsured || TABLE_SCHEMAS[this.tableName]) {
      this.tableEnsured = true;
      return;
    }
    const columns = Object.keys(item as Record<string, unknown>)
      .map((k) => (k === 'id' ? 'id TEXT PRIMARY KEY' : `${k} TEXT`))
      .join(', ');
    this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.tableName} (${columns}, ttl INTEGER)`);
    this.tableEnsured = true;
  }

  // ---- Serialization helpers ----

  /**
   * Convert a JS object to a row suitable for SQLite insertion.
   * JSON fields are stringified, booleans are converted to 0/1.
   */
  private serialize(item: T): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      if (this.schema.jsonColumns.includes(key)) {
        row[key] = value !== undefined && value !== null ? JSON.stringify(value) : null;
      } else if (this.schema.boolColumns.includes(key)) {
        row[key] = value ? 1 : 0;
      } else {
        row[key] = value ?? null;
      }
    }
    return row;
  }

  /**
   * Convert a SQLite row back to a typed JS object.
   * JSON strings are parsed, 0/1 integers are converted to booleans.
   */
  private deserialize(row: Record<string, unknown>): T {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'ttl') continue; // internal column, not part of public type
      if (this.schema.jsonColumns.includes(key)) {
        if (typeof value === 'string') {
          try {
            obj[key] = JSON.parse(value);
          } catch {
            obj[key] = value;
          }
        } else {
          obj[key] = value ?? undefined;
        }
      } else if (this.schema.boolColumns.includes(key)) {
        obj[key] = value === 1 || value === true;
      } else {
        obj[key] = value ?? undefined;
      }
    }
    return obj as T;
  }

  // ---- CRUD Operations ----

  /** Insert a new record. Returns the stored item. */
  create(item: T): T {
    this.ensureTable(item);
    const row = this.serialize(item);
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    this.db.prepare(sql).run(...columns.map((c) => row[c]));
    logger.info({ id: item.id }, `[DB] Created ${this.entityName}`);
    return item;
  }

  /** Retrieve a single record by id. */
  get(id: string): T | undefined {
    const row = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return undefined;
    return this.deserialize(row);
  }

  /** Partially update an existing record. Returns the updated item or undefined. */
  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...updates, id: existing.id } as T;
    const row = this.serialize(merged);

    // Build SET clause excluding 'id'
    const setCols = Object.keys(row).filter((c) => c !== 'id');
    if (setCols.length === 0) return existing;

    const setClause = setCols.map((c) => `${c} = ?`).join(', ');
    const values = setCols.map((c) => row[c]);
    values.push(id);

    this.db.prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`).run(...values);
    logger.info({ id }, `[DB] Updated ${this.entityName}`);
    return merged;
  }

  /** Delete a record by id. Returns true if it existed. */
  delete(id: string): boolean {
    const result = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    const existed = result.changes > 0;
    if (existed) {
      logger.info({ id }, `[DB] Deleted ${this.entityName}`);
    }
    return existed;
  }

  /** Return every record. */
  list(): T[] {
    const rows = this.db.prepare(`SELECT * FROM ${this.tableName}`).all() as Record<string, unknown>[];
    return rows.map((r) => this.deserialize(r));
  }

  /** Return records matching a predicate (loads all rows then filters in JS). */
  findBy(predicate: (item: T) => boolean): T[] {
    return this.list().filter(predicate);
  }

  /** Return the number of records in the table. */
  count(): number {
    const row = this.db.prepare(`SELECT COUNT(*) as cnt FROM ${this.tableName}`).get() as { cnt: number };
    return row.cnt;
  }

  /**
   * Remove rows whose TTL has expired.
   * TTL is stored as a Unix timestamp (ms) in the `ttl` column.
   * Rows with ttl = NULL or ttl = 0 never expire.
   */
  cleanupExpired(): number {
    const now = Date.now();
    const result = this.db
      .prepare(`DELETE FROM ${this.tableName} WHERE ttl IS NOT NULL AND ttl > 0 AND ttl < ?`)
      .run(now);
    if (result.changes > 0) {
      logger.info(
        { table: this.tableName, removed: result.changes },
        `[DB] Cleaned up expired ${this.entityName} records`,
      );
    }
    return result.changes;
  }

  /**
   * Set TTL on a specific record. ttlMs = milliseconds from now.
   * Pass 0 to remove TTL (record never expires).
   */
  setTtl(id: string, ttlMs: number): void {
    const ttlValue = ttlMs > 0 ? Date.now() + ttlMs : null;
    this.db.prepare(`UPDATE ${this.tableName} SET ttl = ? WHERE id = ?`).run(ttlValue, id);
  }
}

// ---------------------------------------------------------------------------
// Data Lifecycle Manager
// ---------------------------------------------------------------------------

let cleanupTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Run cleanup across all stores, removing expired rows based on TTL.
 */
export function cleanupExpired(): void {
  let total = 0;
  total += projectStore.cleanupExpired();
  total += plugStore.cleanupExpired();
  total += deploymentStore.cleanupExpired();
  total += auditStore.cleanupExpired();
  total += evidenceStore.cleanupExpired();
  if (total > 0) {
    logger.info({ total }, '[DB] Lifecycle cleanup completed');
  }
}

/**
 * Start automatic cleanup on a recurring interval.
 */
export function startCleanupSchedule(policy: RetentionPolicy = DEFAULT_RETENTION): void {
  if (cleanupTimer) clearInterval(cleanupTimer);
  cleanupTimer = setInterval(() => {
    cleanupExpired();
  }, policy.cleanupIntervalMs);
  logger.info(
    { intervalMs: policy.cleanupIntervalMs },
    '[DB] Automatic TTL cleanup scheduled',
  );
}

/**
 * Stop the automatic cleanup schedule.
 */
export function stopCleanupSchedule(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = undefined;
    logger.info('[DB] Automatic TTL cleanup stopped');
  }
}

// ---------------------------------------------------------------------------
// Singleton Stores
// ---------------------------------------------------------------------------

export const projectStore = new Store<Project>('project', 'projects');
export const plugStore = new Store<Plug>('plug', 'plugs');
export const deploymentStore = new Store<Deployment>('deployment', 'deployments');
export const auditStore = new Store<AuditRecord>('audit', 'audit_log');
export const evidenceStore = new Store<EvidenceRecord>('evidence', 'evidence');

// Re-export helpers
export { uuidv4 };
export { runMigrations } from './migrations';
export { DEFAULT_RETENTION as defaultRetentionPolicy };
export type { RetentionPolicy as RetentionPolicyType };
