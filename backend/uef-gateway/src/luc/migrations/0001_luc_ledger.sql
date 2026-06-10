-- LUC allocator — ledger schema (Neon / Postgres). Idempotent.
--
-- Money is stored as integer micro-USD (1 USD = 1_000_000) to avoid float drift.
-- Money-safety: reserve() is a conditional UPDATE that succeeds ONLY when
--   (budget - reserved - spent) >= est
-- so concurrent reserves can never collectively over-commit the budget. There is
-- deliberately NO `available >= 0` CHECK on the wallet: settle() records the real
-- cost of an ALREADY-AUTHORIZED call and may push available slightly negative
-- (bounded, priced overage — never silent). The reserve WHERE clause is the cap.

CREATE TABLE IF NOT EXISTS luc_wallets (
  id                  text PRIMARY KEY,
  account_id          text NOT NULL,
  seat_id             text,                      -- per-seat wallets (Family/Team)
  plan_id             text NOT NULL,
  byok                boolean NOT NULL DEFAULT false,
  usd_budget_micro    bigint  NOT NULL DEFAULT 0,
  usd_reserved_micro  bigint  NOT NULL DEFAULT 0 CHECK (usd_reserved_micro >= 0),
  usd_spent_micro     bigint  NOT NULL DEFAULT 0 CHECK (usd_spent_micro    >= 0),
  cycle_start         timestamptz NOT NULL DEFAULT now(),
  cycle_end           timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS luc_wallets_account_idx ON luc_wallets (account_id);

CREATE TABLE IF NOT EXISTS luc_reservations (
  id          text PRIMARY KEY,
  wallet_id   text NOT NULL REFERENCES luc_wallets (id) ON DELETE CASCADE,
  est_micro   bigint NOT NULL,
  status      text   NOT NULL DEFAULT 'open',    -- open | settled | released
  created_at  timestamptz NOT NULL DEFAULT now(),
  settled_at  timestamptz
);
CREATE INDEX IF NOT EXISTS luc_reservations_wallet_idx ON luc_reservations (wallet_id, status);

-- Immutable debit log: one row per settled call (audit + reconciliation).
CREATE TABLE IF NOT EXISTS luc_ledger_entries (
  id              bigserial PRIMARY KEY,
  wallet_id       text NOT NULL REFERENCES luc_wallets (id) ON DELETE CASCADE,
  reservation_id  text,
  model           text,
  est_micro       bigint,
  actual_micro    bigint NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS luc_ledger_entries_wallet_idx ON luc_ledger_entries (wallet_id, created_at);
