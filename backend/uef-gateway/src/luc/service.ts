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
import { planWalletUsdBudget, BMC } from './pricing';

export async function provisionWallet(
  ledger: LedgerAdapter,
  input: CreateWalletInput
): Promise<WalletRecord> {
  return ledger.createWallet(input);
}

/**
 * Provision a wallet for a v6 Tesla-Matrix plan. The wallet budget is the plan's
 * LUC allotment valued in platform-$ (luc x $0.01). planId = `${tier}-${cadence}`.
 */
export async function provisionPlan(
  ledger: LedgerAdapter,
  input: { id: string; accountId: string; tier: string; cadence: string; seatId?: string; byok?: boolean }
): Promise<WalletRecord> {
  return provisionWallet(ledger, {
    id: input.id,
    accountId: input.accountId,
    planId: `${input.tier}-${input.cadence}`,
    usdBudget: planWalletUsdBudget(input.tier, input.cadence),
    seatId: input.seatId,
    byok: input.byok,
  });
}

/** Provision the BMC starter wallet: $6.54 once -> 654 LUC. */
export async function provisionBmc(
  ledger: LedgerAdapter,
  input: { id: string; accountId: string; byok?: boolean }
): Promise<WalletRecord> {
  return provisionWallet(ledger, {
    id: input.id,
    accountId: input.accountId,
    planId: BMC.id,
    usdBudget: BMC.priceUsd,
    byok: input.byok,
  });
}

/** Top up an existing wallet with the BMC grant (the mandatory starter purchase). */
export async function creditBmc(ledger: LedgerAdapter, walletId: string): Promise<void> {
  await ledger.credit(walletId, BMC.priceUsd);
}

/**
 * Apply a BMC purchase — the reload SKU. BMC is buyable at ANY time and STACKS:
 * a fresh account gets a new $6.54 (654 LUC) wallet; an existing wallet (BMC or
 * commitment) is topped up by $6.54. This is the no-commitment lane — same
 * per-LUC rate as the base tier, no advance commitment. The repeatable Stripe
 * one-time SKU fires this on checkout.session.completed.
 */
export async function applyBmcPurchase(
  ledger: LedgerAdapter,
  input: { id: string; accountId: string; byok?: boolean }
): Promise<{ created: boolean; available: number }> {
  const existing = await ledger.getWallet(input.id);
  if (existing) {
    await ledger.credit(input.id, BMC.priceUsd);
  } else {
    await provisionBmc(ledger, input);
  }
  const bal = await ledger.balance(input.id);
  return { created: !existing, available: bal?.available ?? 0 };
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
