/**
 * LUC allocator — minimal dev server (LOCAL DEV ONLY).
 *
 * Boots ONLY the /luc routes (createLucRouter — the exact production router)
 * over a throwaway sqlite database, so the read API can be exercised
 * end-to-end without the rest of the gateway's env. Same guard rails as
 * dev-wallet.ts: refuses NODE_ENV=production, requires an explicit LUC_DEV_DB
 * throwaway path, refuses any path named aims.db (the real gateway store).
 *
 * The auth key is NOT baked in: set LUC_INTERNAL_API_KEY (required — the
 * router fail-closes with 503 when unset, this script refuses to start
 * instead so a misconfigured run is loud). Binds 127.0.0.1 only.
 *
 * Usage:
 *   LUC_DEV_DB=/tmp/luc-dev.sqlite LUC_INTERNAL_API_KEY=devtest-internal \
 *     npx ts-node src/luc/scripts/dev-serve.ts
 *
 * PROPRIETARY — A.I.M.S.
 */

import * as path from 'path';
import express from 'express';
import { LUC_LEDGER_SCHEMA_SQL } from '../schema';
import { SqliteLedgerAdapter, SqlDb } from '../sqlite-ledger';
import { createLucRouter } from '../routes';

/** Structural verdict of the dev-only guard rails — pure, testable. */
export type DevServeGuardVerdict =
  | { ok: true; dbPath: string; internalApiKey: string }
  | { ok: false; reason: string };

/**
 * The guard rails as a PURE function over an environment, so the production
 * refusal is provable by test rather than by reading main(). Refuses:
 * NODE_ENV=production, a missing throwaway-db path, any path whose basename
 * is aims.db in ANY case (Windows filesystems are case-insensitive — AIMS.DB
 * IS the real store there), and a missing auth key.
 */
export function guardDevServe(env: NodeJS.ProcessEnv): DevServeGuardVerdict {
  if (env.NODE_ENV === 'production') {
    return { ok: false, reason: 'refusing to run: NODE_ENV=production' };
  }
  const dbPath = env.LUC_DEV_DB;
  if (!dbPath) {
    return {
      ok: false,
      reason: 'set LUC_DEV_DB to a THROWAWAY sqlite file path (never a real data file)',
    };
  }
  if (path.basename(dbPath).toLowerCase() === 'aims.db') {
    return { ok: false, reason: 'refusing to touch aims.db — use a throwaway path' };
  }
  const internalApiKey = env.LUC_INTERNAL_API_KEY;
  if (!internalApiKey) {
    return {
      ok: false,
      reason: 'set LUC_INTERNAL_API_KEY (dev-only value, e.g. devtest-internal)',
    };
  }
  return { ok: true, dbPath, internalApiKey };
}

function main(): void {
  const guard = guardDevServe(process.env);
  if (!guard.ok) {
    console.error(`[dev-serve] ${guard.reason}`);
    process.exit(1);
    return;
  }
  const { dbPath, internalApiKey } = guard;

  // node:sqlite is a Node 22.5+ builtin; same SQLite C engine as prod's
  // better-sqlite3, and the adapter only needs the structural SqlDb surface.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (p: string) => SqlDb & { exec(sql: string): void };
  };
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(LUC_LEDGER_SCHEMA_SQL);

  const ledger = new SqliteLedgerAdapter(db);

  const app = express();
  app.use(express.json());
  // The production mount, verbatim: same router, same auth model.
  app.use('/luc', createLucRouter({ ledger, internalApiKey }));

  const port = Number(process.env.LUC_DEV_PORT) || 4390;
  app.listen(port, '127.0.0.1', () => {
    console.log(`[dev-serve] /luc routes listening on http://127.0.0.1:${port} (db=${dbPath})`);
  });
}

// Boot ONLY when executed directly. An import (production code, a test) gets
// the guard function and nothing else — no server, no process.exit.
if (require.main === module) {
  main();
}
