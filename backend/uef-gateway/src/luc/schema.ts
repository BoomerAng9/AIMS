/**
 * LUC allocator — ledger schema (SQLite).
 *
 * This is the ACTIVE schema. It is the single source of truth, consumed by:
 *   - the gateway boot migration (src/db/migrations.ts, version 009), and
 *   - the adapter test (so test and prod can never drift).
 *
 * Money is stored as integer micro-USD (1 USD = 1_000_000) to avoid float
 * drift. Money-safety: reserve() is a single conditional UPDATE that succeeds
 * ONLY when (budget - reserved - spent) >= est, so it can never over-commit.
 * There is deliberately NO `available >= 0` style guard on the wallet: settle()
 * records the real cost of an ALREADY-AUTHORIZED call and may push available
 * slightly negative (bounded, priced overage — never silent). The reserve WHERE
 * clause is the cap.
 *
 * NOTE: `luc_wallets` (customer plan token budget: usd_budget/reserved/spent,
 * plan_id, byok, reserve→settle) is a DIFFERENT concept from the existing
 * `agent_wallets` (migration 005 — the X402 agent-commerce balance). Distinct
 * tables, distinct purpose; do not merge without an explicit reconciliation.
 *
 * PROPRIETARY — A.I.M.S.
 */

export const LUC_LEDGER_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS luc_wallets (
    id                  TEXT PRIMARY KEY,
    account_id          TEXT NOT NULL,
    seat_id             TEXT,
    plan_id             TEXT NOT NULL,
    byok                INTEGER NOT NULL DEFAULT 0,
    usd_budget_micro    INTEGER NOT NULL DEFAULT 0,
    usd_reserved_micro  INTEGER NOT NULL DEFAULT 0 CHECK (usd_reserved_micro >= 0),
    usd_spent_micro     INTEGER NOT NULL DEFAULT 0 CHECK (usd_spent_micro >= 0),
    cycle_start         TEXT NOT NULL,
    cycle_end           TEXT NOT NULL,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_luc_wallets_account ON luc_wallets(account_id);

  CREATE TABLE IF NOT EXISTS luc_reservations (
    id          TEXT PRIMARY KEY,
    wallet_id   TEXT NOT NULL REFERENCES luc_wallets(id) ON DELETE CASCADE,
    est_micro   INTEGER NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open',
    created_at  TEXT NOT NULL,
    settled_at  TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_luc_reservations_wallet ON luc_reservations(wallet_id, status);

  CREATE TABLE IF NOT EXISTS luc_ledger_entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id       TEXT NOT NULL REFERENCES luc_wallets(id) ON DELETE CASCADE,
    reservation_id  TEXT,
    model           TEXT,
    est_micro       INTEGER,
    actual_micro    INTEGER NOT NULL,
    created_at      TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_luc_ledger_entries_wallet ON luc_ledger_entries(wallet_id, created_at);
`;
