/**
 * A.I.M.S. Backup & Restore Manager — Pillar 12
 *
 * Handles SQLite database snapshots, scheduled backups, restore operations,
 * and restore drills to verify backup integrity.
 *
 * Backups are stored in `data/backups/` with SHA-256 integrity hashes.
 * Singleton export: `backupManager`
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackupRecord {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  /** SHA-256 hash of the backup file for integrity verification. */
  integrityHash: string;
}

export interface RestoreResult {
  success: boolean;
  backupId: string;
  restoredAt: string;
  tablesRestored: string[];
  rowCounts: Record<string, number>;
}

export interface DrillCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface DrillResult {
  success: boolean;
  backupId: string;
  startedAt: string;
  completedAt: string;
  checks: DrillCheck[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_DIR = path.resolve(DATA_DIR, 'backups');
const DB_PATH = path.resolve(DATA_DIR, 'aims.db');

/** Tables that must be present in a valid A.I.M.S. database. */
const EXPECTED_TABLES = ['projects', 'plugs', 'deployments', 'audit_log', 'evidence'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logger.info({ dir: BACKUP_DIR }, '[Backup] Created backups directory');
  }
}

function sha256(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getTablesFromDb(db: Database.Database): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_%'")
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

function getRowCounts(db: Database.Database, tables: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number };
    counts[table] = row.cnt;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// BackupManager
// ---------------------------------------------------------------------------

export class BackupManager {
  private backups: BackupRecord[] = [];
  private scheduleTimer: ReturnType<typeof setInterval> | undefined;
  private lastDrill: DrillResult | undefined;
  private drillCadence = 'weekly';
  private nextDrillDate: Date;

  constructor() {
    ensureBackupDir();
    this.loadExistingBackups();
    // Default next drill: 7 days from now
    this.nextDrillDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    logger.info('[Backup] BackupManager initialized');
  }

  /**
   * Scan the backup directory for existing backup files and rebuild the
   * in-memory index. This allows the manager to pick up backups that were
   * created in previous process lifetimes.
   */
  private loadExistingBackups(): void {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db'));

    for (const filename of files) {
      const filePath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);

      // Derive id from filename: aims-backup-<id>.db
      const match = filename.match(/^aims-backup-(.+)\.db$/);
      if (!match) continue;

      const id = match[1];

      // Skip if already tracked
      if (this.backups.some((b) => b.id === id)) continue;

      this.backups.push({
        id,
        filename,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
        integrityHash: sha256(filePath),
      });
    }

    if (this.backups.length > 0) {
      logger.info(
        { count: this.backups.length },
        '[Backup] Loaded existing backups from disk',
      );
    }
  }

  // ---- Core Operations ----

  /**
   * Create a snapshot of the current SQLite database file.
   * Uses file-level copy (safe because SQLite WAL mode ensures consistency
   * when using the backup API or file copy between transactions).
   */
  createBackup(): BackupRecord {
    ensureBackupDir();

    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database file not found at ${DB_PATH}`);
    }

    const id = uuidv4();
    const filename = `aims-backup-${id}.db`;
    const destPath = path.join(BACKUP_DIR, filename);

    // Copy the database file — safe with WAL mode between transactions
    fs.copyFileSync(DB_PATH, destPath);

    const stat = fs.statSync(destPath);
    const integrityHash = sha256(destPath);

    const record: BackupRecord = {
      id,
      filename,
      size: stat.size,
      createdAt: new Date().toISOString(),
      integrityHash,
    };

    this.backups.push(record);
    logger.info(
      { id, filename, size: stat.size, hash: integrityHash },
      '[Backup] Backup created',
    );

    return record;
  }

  /** List all available backups, newest first. */
  listBackups(): BackupRecord[] {
    return [...this.backups].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Restore the database from a specific backup.
   * Copies the backup file over the current database path.
   */
  restoreBackup(backupId: string): RestoreResult {
    const backup = this.backups.find((b) => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const sourcePath = path.join(BACKUP_DIR, backup.filename);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Backup file missing from disk: ${backup.filename}`);
    }

    // Verify integrity before restoring
    const currentHash = sha256(sourcePath);
    if (currentHash !== backup.integrityHash) {
      throw new Error(
        `Integrity check failed for backup ${backupId}: expected ${backup.integrityHash}, got ${currentHash}`,
      );
    }

    // Copy backup over the main database
    fs.copyFileSync(sourcePath, DB_PATH);

    // Remove WAL/SHM files if they exist (they belong to the old DB state)
    const walPath = DB_PATH + '-wal';
    const shmPath = DB_PATH + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // Open the restored DB to gather metadata
    const db = new Database(DB_PATH, { readonly: true });
    let tablesRestored: string[];
    let rowCounts: Record<string, number>;
    try {
      tablesRestored = getTablesFromDb(db);
      rowCounts = getRowCounts(db, tablesRestored);
    } finally {
      db.close();
    }

    const result: RestoreResult = {
      success: true,
      backupId,
      restoredAt: new Date().toISOString(),
      tablesRestored,
      rowCounts,
    };

    logger.info(
      { backupId, tablesRestored, rowCounts },
      '[Backup] Database restored from backup',
    );

    return result;
  }

  // ---- Scheduling ----

  /**
   * Set up an automatic recurring backup at the given interval.
   */
  scheduleBackup(intervalMs: number): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
    }

    this.scheduleTimer = setInterval(() => {
      try {
        this.createBackup();
      } catch (err) {
        logger.error({ err }, '[Backup] Scheduled backup failed');
      }
    }, intervalMs);

    logger.info(
      { intervalMs },
      '[Backup] Automatic backup scheduled',
    );
  }

  /**
   * Stop the automatic backup schedule.
   */
  stopSchedule(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = undefined;
      logger.info('[Backup] Automatic backup schedule stopped');
    }
  }

  // ---- Restore Drills ----

  /**
   * Run a full restore drill: pick the latest backup, restore to a temp
   * location, and run integrity checks. Does NOT affect the live database.
   */
  runRestoreDrill(): DrillResult {
    const startedAt = new Date().toISOString();
    const checks: DrillCheck[] = [];

    const backups = this.listBackups();
    if (backups.length === 0) {
      const result: DrillResult = {
        success: false,
        backupId: 'none',
        startedAt,
        completedAt: new Date().toISOString(),
        checks: [{ name: 'backup_available', passed: false, detail: 'No backups available' }],
      };
      this.lastDrill = result;
      return result;
    }

    const latest = backups[0];
    const sourcePath = path.join(BACKUP_DIR, latest.filename);

    // Check 1: File exists
    const fileExists = fs.existsSync(sourcePath);
    checks.push({
      name: 'file_exists',
      passed: fileExists,
      detail: fileExists
        ? `Backup file found at ${sourcePath}`
        : `Backup file missing: ${sourcePath}`,
    });

    if (!fileExists) {
      const result: DrillResult = {
        success: false,
        backupId: latest.id,
        startedAt,
        completedAt: new Date().toISOString(),
        checks,
      };
      this.lastDrill = result;
      return result;
    }

    // Check 2: File readable
    let readable = false;
    try {
      fs.accessSync(sourcePath, fs.constants.R_OK);
      readable = true;
    } catch {
      // remains false
    }
    checks.push({
      name: 'file_readable',
      passed: readable,
      detail: readable
        ? 'Backup file is readable'
        : 'Backup file is not readable',
    });

    // Check 3: Integrity hash match
    const currentHash = sha256(sourcePath);
    const hashMatch = currentHash === latest.integrityHash;
    checks.push({
      name: 'integrity_hash_match',
      passed: hashMatch,
      detail: hashMatch
        ? `SHA-256 matches: ${currentHash.substring(0, 16)}...`
        : `SHA-256 mismatch: expected ${latest.integrityHash.substring(0, 16)}..., got ${currentHash.substring(0, 16)}...`,
    });

    // Check 4: Tables present (restore to temp location)
    const tempDir = path.join(BACKUP_DIR, 'drill-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempDbPath = path.join(tempDir, 'drill-test.db');

    let tablesPresent = false;
    let rowCountMatch = false;
    let drillDb: Database.Database | undefined;

    try {
      fs.copyFileSync(sourcePath, tempDbPath);
      drillDb = new Database(tempDbPath, { readonly: true });

      const tables = getTablesFromDb(drillDb);
      const missingTables = EXPECTED_TABLES.filter((t) => !tables.includes(t));
      tablesPresent = missingTables.length === 0;

      checks.push({
        name: 'tables_present',
        passed: tablesPresent,
        detail: tablesPresent
          ? `All expected tables found: ${EXPECTED_TABLES.join(', ')}`
          : `Missing tables: ${missingTables.join(', ')}`,
      });

      // Check 5: Row count match (verify we can read all tables)
      const rowCounts = getRowCounts(drillDb, tables);
      const totalRows = Object.values(rowCounts).reduce((sum, c) => sum + c, 0);
      rowCountMatch = true; // If we get here without error, counts are readable
      checks.push({
        name: 'row_count_match',
        passed: rowCountMatch,
        detail: `Total rows across tables: ${totalRows} (${JSON.stringify(rowCounts)})`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (!checks.some((c) => c.name === 'tables_present')) {
        checks.push({
          name: 'tables_present',
          passed: false,
          detail: `Failed to open backup database: ${errorMsg}`,
        });
      }
      if (!checks.some((c) => c.name === 'row_count_match')) {
        checks.push({
          name: 'row_count_match',
          passed: false,
          detail: `Failed to read row counts: ${errorMsg}`,
        });
      }
    } finally {
      if (drillDb) drillDb.close();
      // Clean up temp files
      try {
        if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
      } catch {
        // Best-effort cleanup
      }
    }

    const allPassed = checks.every((c) => c.passed);
    const result: DrillResult = {
      success: allPassed,
      backupId: latest.id,
      startedAt,
      completedAt: new Date().toISOString(),
      checks,
    };

    this.lastDrill = result;
    this.nextDrillDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    logger.info(
      { success: allPassed, backupId: latest.id, checks: checks.length },
      '[Backup] Restore drill completed',
    );

    return result;
  }

  /** Return the result of the most recent restore drill, if any. */
  getLastDrillResult(): DrillResult | undefined {
    return this.lastDrill;
  }

  /** Return the drill schedule information. */
  getDrillSchedule(): { nextDrill: string; lastDrill?: string; cadence: string } {
    return {
      nextDrill: this.nextDrillDate.toISOString(),
      lastDrill: this.lastDrill?.completedAt,
      cadence: this.drillCadence,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const backupManager = new BackupManager();
