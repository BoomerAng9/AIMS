/**
 * LUC SDK - Monetary Ledger Types
 *
 * A monetary wallet with reserve -> settle accounting, layered alongside the
 * quota engine. Where the quota engine counts UNITS of a service, the ledger
 * tracks real money (USD) so usage can be capped against an actual-dollar
 * budget with "pause at the limit, no silent overage" semantics.
 *
 * The flow is two-phase:
 *   reserve(estUsd)  -> atomically holds an estimate against available budget
 *   settle(actualUsd) -> releases the hold and records the real provider cost
 *   release()         -> cancels a hold when the underlying call failed
 *   credit(usd)       -> tops the budget up (e.g. a starter-token purchase)
 */

/** A monetary wallet. available = budget - reserved - spent. */
export interface WalletRecord {
  id: string;
  accountId: string;
  /** Present for per-seat wallets (Family/Team); omitted for a single-holder plan. */
  seatId?: string;
  planId: string;
  /** Bring-your-own-key: enforcement still applies, but provider-$ is not debited. */
  byok: boolean;
  usdBudget: number;
  usdReserved: number;
  usdSpent: number;
  cycleStart: Date;
  cycleEnd: Date;
  createdAt: Date;
  updatedAt: Date;
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

/** Result of a reserve() hold. */
export interface ReserveResult {
  ok: boolean;
  reservationId?: string;
  /** Available budget after the call (or the available that blocked it). */
  available: number;
  reason?: string;
}

/** Result of a settle() reconciliation. */
export interface SettleResult {
  ok: boolean;
  actualUsd: number;
  estUsd: number;
  walletSpent: number;
  walletAvailable: number;
  reason?: string;
}

/** A point-in-time view of a wallet's money. */
export interface WalletBalance {
  budget: number;
  reserved: number;
  spent: number;
  available: number;
}

export type ReservationStatus = 'open' | 'settled' | 'released';

export interface ReservationRecord {
  id: string;
  walletId: string;
  estUsd: number;
  status: ReservationStatus;
  createdAt: Date;
}

/**
 * Storage-agnostic ledger. Implementations MUST make reserve() atomic:
 * a reserve may only succeed when estUsd <= available, and concurrent reserves
 * must never collectively commit more than the budget. The in-memory adapter
 * achieves this via the single-threaded event loop; a SQL adapter achieves it
 * via a conditional UPDATE (`SET reserved = reserved + :est WHERE available >= :est`).
 */
export interface LedgerAdapter {
  createWallet(input: CreateWalletInput): Promise<WalletRecord>;
  balance(walletId: string): Promise<WalletBalance | null>;
  reserve(walletId: string, estUsd: number): Promise<ReserveResult>;
  settle(reservationId: string, actualUsd: number): Promise<SettleResult>;
  release(reservationId: string): Promise<void>;
  credit(walletId: string, usd: number): Promise<void>;
}
