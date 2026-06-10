/**
 * LUC allocator — service layer.
 *
 * Pure enforcement logic over an injected LedgerAdapter. The Express routes are
 * a thin shell over these functions; everything testable lives here.
 *
 *   checkModelAccess  -> the model gate (free vs paid; plan; byok)
 *   reserveForCall    -> size + hold the budget for a call (skip for BYOK)
 *   settleCall        -> reconcile the hold against the real provider cost
 *   provisionWallet   -> create/seed a wallet (Stripe webhook + starter tokens)
 *   getBalance        -> observe a wallet
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
} from './ledger';
import { evaluateModelAccess, AccessDecision } from './gate';
import { estimateCostUsd } from './model-catalog';

export async function provisionWallet(
  ledger: LedgerAdapter,
  input: CreateWalletInput
): Promise<WalletRecord> {
  return ledger.createWallet(input);
}

export async function getBalance(
  ledger: LedgerAdapter,
  { walletId }: { walletId: string }
): Promise<WalletBalance | null> {
  return ledger.balance(walletId);
}

export interface ModelAccessResult extends AccessDecision {
  available: number;
}

export async function checkModelAccess(
  ledger: LedgerAdapter,
  { walletId, model }: { walletId: string; model: string }
): Promise<ModelAccessResult> {
  const wallet = await ledger.getWallet(walletId);
  if (!wallet) {
    // No wallet => no active plan. Free models still pass; paid models fail closed.
    const d = evaluateModelAccess(model, { hasActivePlan: false, walletAvailableUsd: 0 });
    return { ...d, available: 0 };
  }
  const bal = await ledger.balance(walletId);
  const available = bal?.available ?? 0;
  const d = evaluateModelAccess(model, {
    hasActivePlan: true,
    walletAvailableUsd: available,
    byok: wallet.byok,
  });
  return { ...d, available };
}

export interface ReserveInput {
  walletId: string;
  model?: string;
  promptTokens?: number;
  maxTokens?: number;
  /** Override the estimate directly (otherwise derived from model + tokens). */
  estUsd?: number;
}

export interface ReserveForCallResult extends ReserveResult {
  estUsd: number;
  byok?: boolean;
}

export async function reserveForCall(
  ledger: LedgerAdapter,
  input: ReserveInput
): Promise<ReserveForCallResult> {
  const wallet = await ledger.getWallet(input.walletId);
  if (wallet?.byok) {
    // BYOK: same plan limits, but the LLM bill is on the customer's own key —
    // no platform-$ is held or debited. Reserve is a no-op success.
    return { ok: true, available: Number.POSITIVE_INFINITY, estUsd: 0, byok: true };
  }
  const est =
    input.estUsd ??
    (input.model
      ? estimateCostUsd(input.model, { promptTokens: input.promptTokens, maxTokens: input.maxTokens })
      : 0);
  const r = await ledger.reserve(input.walletId, est);
  return { ...r, estUsd: est };
}

export async function settleCall(
  ledger: LedgerAdapter,
  { reservationId, actualUsd }: { reservationId: string; actualUsd: number }
): Promise<SettleResult> {
  return ledger.settle(reservationId, actualUsd);
}
