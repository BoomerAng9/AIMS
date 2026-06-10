/**
 * LUC allocator — monetary ledger (gateway).
 *
 * A USD wallet with two-phase reserve -> settle accounting:
 *   reserve(estUsd)   atomically holds an estimate against available budget
 *   settle(actualUsd) releases the hold and records the real provider cost
 *   release()         cancels a hold when the underlying call failed
 *   credit(usd)       tops the budget up (e.g. the $6.54 starter purchase)
 *
 * Money is held as integer micro-USD (1 USD = 1_000_000) so repeated arithmetic
 * never accumulates float drift. InMemoryLedger is the process-local reference
 * (tests, fallback); NeonLedgerAdapter implements the same contract via a
 * conditional SQL UPDATE for durable, cross-process atomicity.
 *
 * PROPRIETARY — A.I.M.S.
 */

const MICRO = 1_000_000;
const toMicro = (usd: number): number => Math.round(usd * MICRO);
const fromMicro = (micro: number): number => micro / MICRO;

export interface WalletRecord {
  id: string;
  accountId: string;
  seatId?: string;
  planId: string;
  byok: boolean;
  usdBudget: number;
  usdReserved: number;
  usdSpent: number;
  cycleStart: Date;
  cycleEnd: Date;
}

export interface CreateWalletInput {
  id: string;
  accountId: string;
  planId: string;
  usdBudget: number;
  seatId?: string;
  byok?: boolean;
  cycleStart?: Date;
  cycleEnd?: Date;
}

export interface ReserveResult {
  ok: boolean;
  reservationId?: string;
  available: number;
  reason?: string;
}

export interface SettleResult {
  ok: boolean;
  actualUsd: number;
  estUsd: number;
  walletSpent: number;
  walletAvailable: number;
  reason?: string;
}

export interface WalletBalance {
  budget: number;
  reserved: number;
  spent: number;
  available: number;
}

/**
 * Storage-agnostic ledger. reserve() MUST be atomic: it succeeds only when
 * estUsd <= available, and concurrent reserves must never collectively commit
 * more than the budget.
 */
export interface LedgerAdapter {
  createWallet(input: CreateWalletInput): Promise<WalletRecord>;
  balance(walletId: string): Promise<WalletBalance | null>;
  getWallet(walletId: string): Promise<WalletRecord | null>;
  reserve(walletId: string, estUsd: number): Promise<ReserveResult>;
  settle(reservationId: string, actualUsd: number): Promise<SettleResult>;
  release(reservationId: string): Promise<void>;
  credit(walletId: string, usd: number): Promise<void>;
}

type ReservationStatus = 'open' | 'settled' | 'released';

interface WalletInternal {
  id: string;
  accountId: string;
  seatId?: string;
  planId: string;
  byok: boolean;
  budgetMicro: number;
  reservedMicro: number;
  spentMicro: number;
  cycleStart: Date;
  cycleEnd: Date;
}

interface ReservationInternal {
  id: string;
  walletId: string;
  estUsd: number;
  status: ReservationStatus;
}

let _seq = 0;
function genId(prefix: string): string {
  const g = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g && typeof g.randomUUID === 'function') return `${prefix}_${g.randomUUID()}`;
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq}`;
}

export class InMemoryLedger implements LedgerAdapter {
  private wallets = new Map<string, WalletInternal>();
  private reservations = new Map<string, ReservationInternal>();

  async createWallet(input: CreateWalletInput): Promise<WalletRecord> {
    const now = new Date();
    const cycleStart = input.cycleStart ?? now;
    let cycleEnd = input.cycleEnd;
    if (!cycleEnd) {
      cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    }
    const wallet: WalletInternal = {
      id: input.id,
      accountId: input.accountId,
      seatId: input.seatId,
      planId: input.planId,
      byok: input.byok ?? false,
      budgetMicro: toMicro(input.usdBudget),
      reservedMicro: 0,
      spentMicro: 0,
      cycleStart,
      cycleEnd,
    };
    this.wallets.set(wallet.id, wallet);
    return this.toRecord(wallet);
  }

  async balance(walletId: string): Promise<WalletBalance | null> {
    const w = this.wallets.get(walletId);
    if (!w) return null;
    return {
      budget: fromMicro(w.budgetMicro),
      reserved: fromMicro(w.reservedMicro),
      spent: fromMicro(w.spentMicro),
      available: fromMicro(w.budgetMicro - w.reservedMicro - w.spentMicro),
    };
  }

  async getWallet(walletId: string): Promise<WalletRecord | null> {
    const w = this.wallets.get(walletId);
    return w ? this.toRecord(w) : null;
  }

  async reserve(walletId: string, estUsd: number): Promise<ReserveResult> {
    const w = this.wallets.get(walletId);
    if (!w) return { ok: false, available: 0, reason: 'unknown wallet' };

    const estMicro = toMicro(estUsd);
    const availableMicro = w.budgetMicro - w.reservedMicro - w.spentMicro;
    if (estMicro < 0) {
      return { ok: false, available: fromMicro(availableMicro), reason: 'negative estimate' };
    }
    if (estMicro > availableMicro) {
      return {
        ok: false,
        available: fromMicro(availableMicro),
        reason: `insufficient budget: need ${estUsd}, have ${fromMicro(availableMicro)}`,
      };
    }

    // Critical section: no `await` between the check above and this mutation.
    w.reservedMicro += estMicro;
    const id = genId('rsv');
    this.reservations.set(id, { id, walletId, estUsd, status: 'open' });
    return {
      ok: true,
      reservationId: id,
      available: fromMicro(w.budgetMicro - w.reservedMicro - w.spentMicro),
    };
  }

  async settle(reservationId: string, actualUsd: number): Promise<SettleResult> {
    const r = this.reservations.get(reservationId);
    if (!r || r.status !== 'open') {
      return {
        ok: false,
        actualUsd,
        estUsd: r?.estUsd ?? 0,
        walletSpent: 0,
        walletAvailable: 0,
        reason: r ? `reservation already ${r.status}` : 'unknown reservation',
      };
    }
    const w = this.wallets.get(r.walletId);
    if (!w) {
      return { ok: false, actualUsd, estUsd: r.estUsd, walletSpent: 0, walletAvailable: 0, reason: 'unknown wallet' };
    }
    w.reservedMicro -= toMicro(r.estUsd);
    w.spentMicro += toMicro(actualUsd);
    r.status = 'settled';
    return {
      ok: true,
      actualUsd,
      estUsd: r.estUsd,
      walletSpent: fromMicro(w.spentMicro),
      walletAvailable: fromMicro(w.budgetMicro - w.reservedMicro - w.spentMicro),
    };
  }

  async release(reservationId: string): Promise<void> {
    const r = this.reservations.get(reservationId);
    if (!r || r.status !== 'open') return;
    const w = this.wallets.get(r.walletId);
    if (w) w.reservedMicro -= toMicro(r.estUsd);
    r.status = 'released';
  }

  async credit(walletId: string, usd: number): Promise<void> {
    const w = this.wallets.get(walletId);
    if (!w) return;
    w.budgetMicro += toMicro(usd);
  }

  private toRecord(w: WalletInternal): WalletRecord {
    return {
      id: w.id,
      accountId: w.accountId,
      seatId: w.seatId,
      planId: w.planId,
      byok: w.byok,
      usdBudget: fromMicro(w.budgetMicro),
      usdReserved: fromMicro(w.reservedMicro),
      usdSpent: fromMicro(w.spentMicro),
      cycleStart: w.cycleStart,
      cycleEnd: w.cycleEnd,
    };
  }
}
