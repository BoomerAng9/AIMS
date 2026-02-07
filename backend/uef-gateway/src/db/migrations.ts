/**
 * A.I.M.S. Database Migrations
 *
 * Version-tracked schema changes applied on startup.
 * Each migration is recorded in the `_migrations` table so it only runs once.
 * Migrations must be idempotent-safe: they check before creating.
 */

import Database from 'better-sqlite3';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Migration {
  version: string;
  name: string;
  up: (db: Database.Database) => void;
}

interface MigrationRecord {
  version: string;
  name: string;
  applied_at: string;
}

// ---------------------------------------------------------------------------
// Migration Definitions
// ---------------------------------------------------------------------------

const migrations: Migration[] = [
  {
    version: '001',
    name: 'create_base_tables',
    up: (db: Database.Database): void => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          complexity TEXT NOT NULL DEFAULT 'simple',
          status TEXT NOT NULL DEFAULT 'intake',
          archetype TEXT NOT NULL DEFAULT '',
          features TEXT NOT NULL DEFAULT '[]',
          integrations TEXT NOT NULL DEFAULT '[]',
          branding TEXT NOT NULL DEFAULT '{}',
          spec TEXT,
          ttl INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plugs (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          version TEXT NOT NULL DEFAULT '1.0.0',
          status TEXT NOT NULL DEFAULT 'building',
          files TEXT NOT NULL DEFAULT '[]',
          deploymentId TEXT,
          metrics TEXT NOT NULL DEFAULT '{}',
          ttl INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS deployments (
          id TEXT PRIMARY KEY,
          plugId TEXT NOT NULL,
          userId TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'docker',
          status TEXT NOT NULL DEFAULT 'pending',
          url TEXT,
          domain TEXT,
          containerId TEXT,
          port INTEGER,
          sslEnabled INTEGER NOT NULL DEFAULT 0,
          ttl INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY,
          actor TEXT NOT NULL,
          action TEXT NOT NULL,
          resource TEXT NOT NULL,
          resourceId TEXT,
          detail TEXT NOT NULL DEFAULT '{}',
          ttl INTEGER,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY,
          gateId TEXT NOT NULL,
          projectId TEXT NOT NULL,
          type TEXT NOT NULL,
          passed INTEGER NOT NULL DEFAULT 0,
          report TEXT NOT NULL DEFAULT '{}',
          ttl INTEGER,
          createdAt TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: '002',
    name: 'add_indexes',
    up: (db: Database.Database): void => {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);
        CREATE INDEX IF NOT EXISTS idx_plugs_userId ON plugs(userId);
        CREATE INDEX IF NOT EXISTS idx_plugs_projectId ON plugs(projectId);
        CREATE INDEX IF NOT EXISTS idx_deployments_plugId ON deployments(plugId);
        CREATE INDEX IF NOT EXISTS idx_deployments_userId ON deployments(userId);
        CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);
        CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource);
        CREATE INDEX IF NOT EXISTS idx_evidence_gateId ON evidence(gateId);
        CREATE INDEX IF NOT EXISTS idx_evidence_projectId ON evidence(projectId);
      `);
    },
  },
];

// ---------------------------------------------------------------------------
// Migration Runner
// ---------------------------------------------------------------------------

/**
 * Ensures the _migrations tracking table exists.
 */
function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

/**
 * Returns the set of already-applied migration versions.
 */
function getAppliedVersions(db: Database.Database): Set<string> {
  const rows = db.prepare('SELECT version FROM _migrations').all() as MigrationRecord[];
  return new Set(rows.map((r) => r.version));
}

/**
 * Runs all pending migrations inside a transaction.
 * Safe to call on every startup — already-applied migrations are skipped.
 */
export function runMigrations(db: Database.Database): void {
  ensureMigrationsTable(db);
  const applied = getAppliedVersions(db);

  const pending = migrations.filter((m) => !applied.has(m.version));

  if (pending.length === 0) {
    logger.info('[DB] All migrations already applied');
    return;
  }

  const runAll = db.transaction(() => {
    for (const migration of pending) {
      logger.info({ version: migration.version, name: migration.name }, '[DB] Applying migration');
      migration.up(db);
      db.prepare(
        'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)',
      ).run(migration.version, migration.name, new Date().toISOString());
      logger.info({ version: migration.version }, '[DB] Migration applied');
    }
  });

  runAll();
  logger.info({ count: pending.length }, '[DB] All pending migrations applied');
}
