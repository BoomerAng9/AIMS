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
  {
    version: '003',
    name: 'create_analytics_tables',
    up: (db: Database.Database): void => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugId TEXT NOT NULL,
          event TEXT NOT NULL,
          responseMs INTEGER,
          detail TEXT NOT NULL DEFAULT '{}',
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS analytics_daily (
          plugId TEXT NOT NULL,
          date TEXT NOT NULL,
          requests INTEGER NOT NULL DEFAULT 0,
          errors INTEGER NOT NULL DEFAULT 0,
          avgResponseMs INTEGER NOT NULL DEFAULT 0,
          totalResponseMs INTEGER NOT NULL DEFAULT 0,
          responseCount INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (plugId, date)
        );

        CREATE TABLE IF NOT EXISTS analytics_summary (
          plugId TEXT PRIMARY KEY,
          requests INTEGER NOT NULL DEFAULT 0,
          errors INTEGER NOT NULL DEFAULT 0,
          uptime REAL NOT NULL DEFAULT 100,
          avgResponseMs INTEGER NOT NULL DEFAULT 0,
          totalResponseMs INTEGER NOT NULL DEFAULT 0,
          responseCount INTEGER NOT NULL DEFAULT 0,
          lastActive TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_analytics_events_plugId ON analytics_events(plugId);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_createdAt ON analytics_events(createdAt);
        CREATE INDEX IF NOT EXISTS idx_analytics_daily_plugId ON analytics_daily(plugId);
      `);
    },
  },
  {
    version: '004',
    name: 'create_memories_table',
    up: (db: Database.Database): void => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          projectId TEXT NOT NULL DEFAULT '',
          type TEXT NOT NULL,
          scope TEXT NOT NULL DEFAULT 'user',
          summary TEXT NOT NULL,
          content TEXT NOT NULL,
          payload TEXT NOT NULL DEFAULT '{}',
          tags TEXT NOT NULL DEFAULT '[]',
          relevanceScore REAL NOT NULL DEFAULT 0.5,
          useCount INTEGER NOT NULL DEFAULT 0,
          feedbackSignal INTEGER NOT NULL DEFAULT 0,
          source TEXT NOT NULL DEFAULT 'system',
          expiresAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          lastRecalledAt TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_memories_userId ON memories(userId);
        CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
        CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);
        CREATE INDEX IF NOT EXISTS idx_memories_projectId ON memories(projectId);
        CREATE INDEX IF NOT EXISTS idx_memories_userId_type ON memories(userId, type);
        CREATE INDEX IF NOT EXISTS idx_memories_relevance ON memories(relevanceScore DESC);
        CREATE INDEX IF NOT EXISTS idx_memories_expiresAt ON memories(expiresAt);
        CREATE INDEX IF NOT EXISTS idx_memories_userId_summary ON memories(userId, summary, type);
      `);
    },
  },
  {
    version: '005',
    name: 'create_billing_tables',
    up: (db: Database.Database): void => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS billing_provisions (
          userId TEXT PRIMARY KEY,
          tierId TEXT NOT NULL DEFAULT 'p2p',
          tierName TEXT NOT NULL DEFAULT 'Pay-per-Use',
          stripeCustomerId TEXT NOT NULL DEFAULT '',
          stripeSubscriptionId TEXT NOT NULL DEFAULT '',
          provisionedAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payment_sessions (
          id TEXT PRIMARY KEY,
          resourceType TEXT NOT NULL,
          resourceId TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          network TEXT NOT NULL DEFAULT 'stripe',
          status TEXT NOT NULL DEFAULT 'pending',
          agentId TEXT,
          metadata TEXT NOT NULL DEFAULT '{}',
          receipt TEXT,
          stripePaymentIntentId TEXT,
          stripeCheckoutSessionId TEXT,
          createdAt TEXT NOT NULL,
          completedAt TEXT,
          expiresAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS x402_receipts (
          paymentId TEXT PRIMARY KEY,
          network TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          resourceId TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          expiresAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS agent_wallets (
          agentId TEXT PRIMARY KEY,
          lucBalance REAL NOT NULL DEFAULT 1000,
          limitPerTransaction REAL NOT NULL DEFAULT 100,
          limitPerHour REAL NOT NULL DEFAULT 500,
          limitPerDay REAL NOT NULL DEFAULT 2000,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS agent_transactions (
          id TEXT PRIMARY KEY,
          agentId TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          description TEXT NOT NULL,
          counterparty TEXT NOT NULL DEFAULT 'aims-platform',
          protocol TEXT NOT NULL DEFAULT 'stripe',
          timestamp TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);
        CREATE INDEX IF NOT EXISTS idx_payment_sessions_agentId ON payment_sessions(agentId);
        CREATE INDEX IF NOT EXISTS idx_payment_sessions_expiresAt ON payment_sessions(expiresAt);
        CREATE INDEX IF NOT EXISTS idx_x402_receipts_resourceId ON x402_receipts(resourceId);
        CREATE INDEX IF NOT EXISTS idx_agent_transactions_agentId ON agent_transactions(agentId);
        CREATE INDEX IF NOT EXISTS idx_agent_transactions_timestamp ON agent_transactions(timestamp);
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
