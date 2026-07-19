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

function main(): void {
  if (process.env.NODE_ENV === 'production') {
    console.error('[dev-serve] refusing to run: NODE_ENV=production');
    process.exit(1);
  }

  const dbPath = process.env.LUC_DEV_DB;
  if (!dbPath) {
    console.error('[dev-serve] set LUC_DEV_DB to a THROWAWAY sqlite file path (never a real data file)');
    process.exit(1);
    return;
  }
  if (path.basename(dbPath) === 'aims.db') {
    console.error('[dev-serve] refusing to touch aims.db — use a throwaway path');
    process.exit(1);
    return;
  }

  const internalApiKey = process.env.LUC_INTERNAL_API_KEY;
  if (!internalApiKey) {
    console.error('[dev-serve] set LUC_INTERNAL_API_KEY (dev-only value, e.g. devtest-internal)');
    process.exit(1);
    return;
  }

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

main();
