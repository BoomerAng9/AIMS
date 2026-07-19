/**
 * LUC allocator — dev wallet provisioning script (LOCAL DEV ONLY).
 *
 * Provisions a dev wallet through the REAL provisionPlan path (tier medium,
 * cadence 3mo) and prints the resulting balance via the real balance read.
 * No fabricated numbers anywhere: the budget comes from planWalletUsdBudget
 * inside provisionPlan, and the printed balance is read back from the ledger
 * (ML-3: the ledger is truth).
 *
 * DB resolution: the gateway's getDb() derives its file from
 * process.cwd()/data/aims.db with NO env override, so this script deliberately
 * does NOT touch getDb. It opens its OWN throwaway database at $LUC_DEV_DB
 * (required) via node:sqlite (no native build needed — same SQLite engine),
 * applies the canonical schema from schema.ts, and drives the SAME
 * SqliteLedgerAdapter production runs.
 *
 * Guard rails: refuses to run when NODE_ENV=production, refuses to run without
 * an explicit LUC_DEV_DB path, and refuses any path named aims.db (the real
 * gateway store).
 *
 * Usage:
 *   LUC_DEV_DB=/tmp/luc-dev.sqlite npx ts-node src/luc/scripts/dev-wallet.ts
 *
 * PROPRIETARY — A.I.M.S.
 */

import * as path from 'path';
import { LUC_LEDGER_SCHEMA_SQL } from '../schema';
import { SqliteLedgerAdapter, SqlDb } from '../sqlite-ledger';
import { provisionPlan, getBalance } from '../service';

const WALLET_ID = 'wal_devtest_operator';
const ACCOUNT_ID = 'acct_devtest';
const TIER = 'medium';
const CADENCE = '3mo';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('[dev-wallet] refusing to run: NODE_ENV=production');
    process.exit(1);
  }

  const dbPath = process.env.LUC_DEV_DB;
  if (!dbPath) {
    console.error('[dev-wallet] set LUC_DEV_DB to a THROWAWAY sqlite file path (never a real data file)');
    process.exit(1);
    return;
  }
  if (path.basename(dbPath) === 'aims.db') {
    console.error('[dev-wallet] refusing to touch aims.db — use a throwaway path');
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

  const existing = await ledger.getWallet(WALLET_ID);
  if (existing) {
    console.log(`[dev-wallet] wallet ${WALLET_ID} already provisioned (plan ${existing.planId}) — reading balance`);
  } else {
    const w = await provisionPlan(ledger, {
      id: WALLET_ID,
      accountId: ACCOUNT_ID,
      tier: TIER,
      cadence: CADENCE,
    });
    console.log(`[dev-wallet] provisioned ${w.id} account=${w.accountId} plan=${w.planId}`);
  }

  const bal = await getBalance(ledger, { walletId: WALLET_ID });
  if (!bal) {
    console.error('[dev-wallet] balance read failed after provision');
    process.exit(1);
    return;
  }
  console.log(
    `[dev-wallet] balance: budget=$${bal.budget.toFixed(2)} reserved=$${bal.reserved.toFixed(2)} spent=$${bal.spent.toFixed(2)} available=$${bal.available.toFixed(2)} (db=${dbPath})`
  );
}

main().catch((err) => {
  console.error('[dev-wallet] failed:', err);
  process.exit(1);
});
