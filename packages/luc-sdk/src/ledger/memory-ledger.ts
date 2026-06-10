/**
 * LUC SDK - In-Memory Ledger Adapter
 *
 * Reference implementation of {@link LedgerAdapter}. Money is held as integer
 * micro-USD (1 USD = 1_000_000) so repeated reserve/settle arithmetic never
 * accumulates floating-point drift.
 *
 * Atomicity: each method's critical section (read available -> mutate) runs
 * synchronously with no `await` in between, so under the single-threaded event
 * loop concurrent reserves serialize and can never collectively over-commit the
 * budget. A SQL adapter must reproduce this with a conditional UPDATE.
 *
 * This adapter is process-local and non-durable — intended for tests and the
 * SDK's reference behavior. Production durability/cross-process atomicity comes
 * from a database-backed adapter.
 */

import type {
  LedgerAdapter,
  WalletRecord,
  CreateWalletInput,
  ReserveResult,
  SettleResult,
  WalletBalance,
  ReservationRecord,
} from './types';

const MICRO = 1_000_000;
const toMicro = (usd: number): number => Math.round(usd * MICRO);
const fromMicro = (micro: number): number => micro / MICRO;

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
  createdAt: Date;
  updatedAt: Date;
}

let _seq = 0;
function genId(prefix: string): string {
  const g = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g && typeof g.randomUUID === 'function') return `${prefix}_${g.randomUUID()}`;
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq}`;
}

export class MemoryLedgerAdapter implements LedgerAdapter {
  private wallets = new Map<string, WalletInternal>();
  private reservations = new Map<string, ReservationRecord>();

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
      createdAt: now,
      updatedAt: now,
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
    w.updatedAt = new Date();

    const id = genId('rsv');
    this.reservations.set(id, {
      id,
      walletId,
      estUsd,
      status: 'open',
      createdAt: new Date(),
    });

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

    // Release the held estimate, record the real cost.
    w.reservedMicro -= toMicro(r.estUsd);
    w.spentMicro += toMicro(actualUsd);
    w.updatedAt = new Date();
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
    if (w) {
      w.reservedMicro -= toMicro(r.estUsd);
      w.updatedAt = new Date();
    }
    r.status = 'released';
  }

  async credit(walletId: string, usd: number): Promise<void> {
    const w = this.wallets.get(walletId);
    if (!w) return;
    w.budgetMicro += toMicro(usd);
    w.updatedAt = new Date();
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
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    };
  }
}

export function createMemoryLedgerAdapter(): MemoryLedgerAdapter {
  return new MemoryLedgerAdapter();
}
