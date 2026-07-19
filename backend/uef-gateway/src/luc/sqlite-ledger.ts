/**
 * LUC allocator — SQLite ledger adapter (gateway, durable).
 *
 * The production LedgerAdapter. Backs the two-phase reserve -> settle wallet
 * with the gateway's existing better-sqlite3 store (getDb()), alongside the
 * billing tables. Same contract as InMemoryLedger; the difference is durability
 * (survives restart) and that the atomic gate is enforced by SQLite, not by a
 * "no await in the critical section" convention.
 *
 * Money-safety: reserve() is ONE conditional UPDATE —
 *   UPDATE luc_wallets SET usd_reserved_micro = usd_reserved_micro + :est
 *   WHERE id = :id AND (usd_budget_micro - usd_reserved_micro - usd_spent_micro) >= :est
 * granted iff `result.changes === 1`. The UPDATE + the reservation INSERT run
 * inside one transaction, so a reservation row exists only for a granted hold.
 * The gateway is a single Node process with a synchronous SQLite driver, so
 * reserves serialize — a check can never interleave with a competing mutation.
 *
 * The adapter depends only on the structural `SqlDb` interface below, so it
 * imports no native module: prod passes better-sqlite3's `Database`; tests pass
 * Node's built-in `node:sqlite` `DatabaseSync`. Both wrap the same SQLite C
 * engine with identical SQL semantics for these queries.
 *
 * PROPRIETARY — A.I.M.S.
 */

import {
  LedgerAdapter,
  WalletRecord,
  CreateWalletInput,
  ReserveResult,
  SettleResult,
  WalletBalance,
  LedgerEntryRecord,
  OpenReservationRecord,
  LedgerEntriesOpts,
  clampEntryLimit,
} from './ledger';

const MICRO = 1_000_000;
const toMicro = (usd: number): number => Math.round(usd * MICRO);
const fromMicro = (micro: number): number => micro / MICRO;

/** The minimal synchronous SQLite surface the adapter needs. */
export interface SqlStatement {
  run(...params: unknown[]): { changes: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
export interface SqlDb {
  prepare(sql: string): SqlStatement;
  exec(sql: string): void;
}

interface WalletRow {
  id: string;
  account_id: string;
  seat_id: string | null;
  plan_id: string;
  byok: number;
  usd_budget_micro: number;
  usd_reserved_micro: number;
  usd_spent_micro: number;
  cycle_start: string;
  cycle_end: string;
}

interface ReservationRow {
  id: string;
  wallet_id: string;
  est_micro: number;
  status: string;
}

let _seq = 0;
function genId(prefix: string): string {
  const g = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g && typeof g.randomUUID === 'function') return `${prefix}_${g.randomUUID()}`;
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq}`;
}

const availableMicro = (w: WalletRow): number =>
  w.usd_budget_micro - w.usd_reserved_micro - w.usd_spent_micro;

export class SqliteLedgerAdapter implements LedgerAdapter {
  constructor(private readonly db: SqlDb) {}

  /** Run a unit of work atomically. Portable across better-sqlite3 & node:sqlite. */
  private tx<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        /* ignore rollback failure — original error is what matters */
      }
      throw err;
    }
  }

  private readWallet(walletId: string): WalletRow | undefined {
    return this.db.prepare('SELECT * FROM luc_wallets WHERE id = ?').get(walletId) as
      | WalletRow
      | undefined;
  }

  private readReservation(reservationId: string): ReservationRow | undefined {
    return this.db.prepare('SELECT * FROM luc_reservations WHERE id = ?').get(reservationId) as
      | ReservationRow
      | undefined;
  }

  async createWallet(input: CreateWalletInput): Promise<WalletRecord> {
    const now = new Date();
    const cycleStart = input.cycleStart ?? now;
    let cycleEnd = input.cycleEnd;
    if (!cycleEnd) {
      cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    }
    const nowIso = now.toISOString();
    this.db
      .prepare(
        `INSERT INTO luc_wallets
           (id, account_id, seat_id, plan_id, byok, usd_budget_micro, usd_reserved_micro, usd_spent_micro, cycle_start, cycle_end, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.accountId,
        input.seatId ?? null,
        input.planId,
        input.byok ? 1 : 0,
        toMicro(input.usdBudget),
        cycleStart.toISOString(),
        cycleEnd.toISOString(),
        nowIso,
        nowIso
      );
    return (await this.getWallet(input.id))!;
  }

  async balance(walletId: string): Promise<WalletBalance | null> {
    const w = this.readWallet(walletId);
    if (!w) return null;
    return {
      budget: fromMicro(w.usd_budget_micro),
      reserved: fromMicro(w.usd_reserved_micro),
      spent: fromMicro(w.usd_spent_micro),
      available: fromMicro(availableMicro(w)),
    };
  }

  private rowToRecord(w: WalletRow): WalletRecord {
    return {
      id: w.id,
      accountId: w.account_id,
      seatId: w.seat_id ?? undefined,
      planId: w.plan_id,
      byok: w.byok === 1,
      usdBudget: fromMicro(w.usd_budget_micro),
      usdReserved: fromMicro(w.usd_reserved_micro),
      usdSpent: fromMicro(w.usd_spent_micro),
      cycleStart: new Date(w.cycle_start),
      cycleEnd: new Date(w.cycle_end),
    };
  }

  async getWallet(walletId: string): Promise<WalletRecord | null> {
    const w = this.readWallet(walletId);
    if (!w) return null;
    return this.rowToRecord(w);
  }

  async reserve(walletId: string, estUsd: number): Promise<ReserveResult> {
    const estMicro = toMicro(estUsd);
    if (estMicro < 0) {
      const w = this.readWallet(walletId);
      return {
        ok: false,
        available: w ? fromMicro(availableMicro(w)) : 0,
        reason: 'negative estimate',
      };
    }

    const now = new Date().toISOString();
    const reservationId = genId('rsv');

    const granted = this.tx(() => {
      // Single atomic gate: succeeds ONLY when est <= available.
      const upd = this.db
        .prepare(
          `UPDATE luc_wallets
             SET usd_reserved_micro = usd_reserved_micro + ?, updated_at = ?
           WHERE id = ?
             AND (usd_budget_micro - usd_reserved_micro - usd_spent_micro) >= ?`
        )
        .run(estMicro, now, walletId, estMicro);
      if (Number(upd.changes) !== 1) return false;
      this.db
        .prepare(
          `INSERT INTO luc_reservations (id, wallet_id, est_micro, status, created_at)
           VALUES (?, ?, ?, 'open', ?)`
        )
        .run(reservationId, walletId, estMicro, now);
      return true;
    });

    const w = this.readWallet(walletId);
    const available = w ? fromMicro(availableMicro(w)) : 0;
    if (!granted) {
      if (!w) return { ok: false, available: 0, reason: 'unknown wallet' };
      return {
        ok: false,
        available,
        reason: `insufficient budget: need ${estUsd}, have ${available}`,
      };
    }
    return { ok: true, reservationId, available };
  }

  async settle(reservationId: string, actualUsd: number): Promise<SettleResult> {
    const r = this.readReservation(reservationId);
    if (!r || r.status !== 'open') {
      return {
        ok: false,
        actualUsd,
        estUsd: r ? fromMicro(r.est_micro) : 0,
        walletSpent: 0,
        walletAvailable: 0,
        reason: r ? `reservation already ${r.status}` : 'unknown reservation',
      };
    }
    const w = this.readWallet(r.wallet_id);
    if (!w) {
      return {
        ok: false,
        actualUsd,
        estUsd: fromMicro(r.est_micro),
        walletSpent: 0,
        walletAvailable: 0,
        reason: 'unknown wallet',
      };
    }

    const now = new Date().toISOString();
    const actualMicro = toMicro(actualUsd);

    this.tx(() => {
      this.db
        .prepare(
          `UPDATE luc_wallets
             SET usd_reserved_micro = usd_reserved_micro - ?, usd_spent_micro = usd_spent_micro + ?, updated_at = ?
           WHERE id = ?`
        )
        .run(r.est_micro, actualMicro, now, r.wallet_id);
      this.db
        .prepare(`UPDATE luc_reservations SET status = 'settled', settled_at = ? WHERE id = ?`)
        .run(now, reservationId);
      this.db
        .prepare(
          `INSERT INTO luc_ledger_entries (wallet_id, reservation_id, model, est_micro, actual_micro, created_at)
           VALUES (?, ?, NULL, ?, ?, ?)`
        )
        .run(r.wallet_id, reservationId, r.est_micro, actualMicro, now);
    });

    const after = this.readWallet(r.wallet_id)!;
    return {
      ok: true,
      actualUsd,
      estUsd: fromMicro(r.est_micro),
      walletSpent: fromMicro(after.usd_spent_micro),
      walletAvailable: fromMicro(availableMicro(after)),
    };
  }

  async release(reservationId: string): Promise<void> {
    const r = this.readReservation(reservationId);
    if (!r || r.status !== 'open') return;
    const now = new Date().toISOString();
    this.tx(() => {
      this.db
        .prepare(`UPDATE luc_wallets SET usd_reserved_micro = usd_reserved_micro - ?, updated_at = ? WHERE id = ?`)
        .run(r.est_micro, now, r.wallet_id);
      this.db
        .prepare(`UPDATE luc_reservations SET status = 'released', settled_at = ? WHERE id = ?`)
        .run(now, reservationId);
    });
  }

  async credit(walletId: string, usd: number): Promise<void> {
    this.db
      .prepare(`UPDATE luc_wallets SET usd_budget_micro = usd_budget_micro + ?, updated_at = ? WHERE id = ?`)
      .run(toMicro(usd), new Date().toISOString(), walletId);
  }

  // --- Read side (GET-only, pure SELECTs — no writes, no money-moves) ---

  async listWalletsByAccount(accountId: string): Promise<WalletRecord[]> {
    const rows = this.db
      .prepare('SELECT * FROM luc_wallets WHERE account_id = ? ORDER BY created_at, id')
      .all(accountId) as WalletRow[];
    return rows.map((w) => this.rowToRecord(w));
  }

  async ledgerEntries(walletId: string, opts?: LedgerEntriesOpts): Promise<LedgerEntryRecord[]> {
    const limit = clampEntryLimit(opts?.limit);
    // The `model` column is DELIBERATELY never selected: model identity is
    // internal-only and must not cross the serialization boundary.
    const base =
      'SELECT id, reservation_id, est_micro, actual_micro, created_at FROM luc_ledger_entries WHERE wallet_id = ?';
    const rows = (
      opts?.beforeId !== undefined
        ? this.db.prepare(`${base} AND id < ? ORDER BY id DESC LIMIT ?`).all(walletId, opts.beforeId, limit)
        : this.db.prepare(`${base} ORDER BY id DESC LIMIT ?`).all(walletId, limit)
    ) as Array<{
      id: number;
      reservation_id: string | null;
      est_micro: number | null;
      actual_micro: number;
      created_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      reservationId: r.reservation_id,
      estUsd: r.est_micro === null ? null : fromMicro(r.est_micro),
      actualUsd: fromMicro(r.actual_micro),
      createdAt: r.created_at,
    }));
  }

  async openReservations(walletId: string): Promise<OpenReservationRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT id, est_micro, created_at FROM luc_reservations
         WHERE wallet_id = ? AND status = 'open' ORDER BY created_at, id`
      )
      .all(walletId) as Array<{ id: string; est_micro: number; created_at: string }>;
    return rows.map((r) => ({ id: r.id, estUsd: fromMicro(r.est_micro), createdAt: r.created_at }));
  }
}
