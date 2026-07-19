/**
 * LUC allocator — HTTP routes (thin shell over the service).
 *
 * Mounted under /luc on the uef-gateway. Every route requires the internal
 * service key (Authorization: Bearer <key> or x-internal-key) — fail-closed if
 * the key is not configured. GET (read-only) routes ALSO accept the optional
 * dedicated read key (LUC_READ_API_KEY); presenting the read key on a write
 * route is a 401. This is the in-mesh enforcement API the verticals (Charlotte,
 * Warehouse, the gateway's own LLM layer) call to gate/reserve/settle.
 *
 * PROPRIETARY — A.I.M.S.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { LedgerAdapter, clampEntryLimit } from './ledger';
import {
  checkModelAccess,
  reserveForCall,
  settleCall,
  provisionWallet,
  getBalance,
  listWallets,
  getUsage,
  getReservations,
} from './service';
import {
  LUC_USD,
  LANES,
  TIERS,
  CADENCES,
  BMC,
  planChargeUsd,
  planLuc,
  missionBurnLuc,
  LaneId,
} from './pricing';

export interface LucRouterDeps {
  ledger: LedgerAdapter;
  /** Shared service token. Callers present it as Bearer or x-internal-key. */
  internalApiKey?: string;
  /**
   * Optional dedicated READ key (falls back to env LUC_READ_API_KEY). Valid for
   * GET routes ONLY — presenting it on any write route is a 401. The internal
   * key remains valid everywhere.
   */
  readApiKey?: string;
}

/**
 * Constant-time key comparison. Both sides are SHA-256 digested first so the
 * inputs always reach `timingSafeEqual` at equal length — a length mismatch
 * neither throws nor leaks how many prefix bytes matched. A plain `===` here
 * would let a caller probe the key byte-by-byte via response timing.
 */
export function timingSafeKeyEqual(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function requireKey(internalKey?: string, readKey?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!internalKey) {
      // Fail closed: a money endpoint with no configured auth must not serve.
      res.status(503).json({ error: 'luc service auth not configured' });
      return;
    }
    const authz = req.header('authorization');
    const bearer = authz && authz.startsWith('Bearer ') ? authz.slice(7) : undefined;
    const provided = bearer || req.header('x-internal-key');
    if (!provided) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (timingSafeKeyEqual(provided, internalKey)) {
      next();
      return;
    }
    // The read key opens GET (observation) routes only — never writes.
    if (req.method === 'GET' && readKey && timingSafeKeyEqual(provided, readKey)) {
      next();
      return;
    }
    res.status(401).json({ error: 'unauthorized' });
  };
}

/** Wrap an async handler so rejections become 500s instead of unhandled. */
function h(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response): void => {
    fn(req, res).catch((err) => {
      res.status(500).json({ error: 'luc internal error', detail: String(err?.message ?? err) });
    });
  };
}

export function createLucRouter(deps: LucRouterDeps): Router {
  const router = Router();
  const { ledger } = deps;
  const readApiKey = deps.readApiKey ?? process.env.LUC_READ_API_KEY;

  router.use(requireKey(deps.internalApiKey, readApiKey));

  // Provision/seed a wallet (Stripe webhook + $6.54 starter-token credit).
  router.post(
    '/provision',
    h(async (req, res) => {
      const { id, accountId, planId, usdBudget, seatId, byok } = req.body ?? {};
      if (!id || !accountId || !planId || typeof usdBudget !== 'number') {
        res.status(400).json({ error: 'id, accountId, planId, usdBudget required' });
        return;
      }
      res.json(await provisionWallet(ledger, { id, accountId, planId, usdBudget, seatId, byok }));
    })
  );

  // Model-access gate (free vs paid; plan; byok).
  router.post(
    '/gate',
    h(async (req, res) => {
      const { walletId, model } = req.body ?? {};
      if (!walletId || !model) {
        res.status(400).json({ error: 'walletId, model required' });
        return;
      }
      res.json(await checkModelAccess(ledger, { walletId, model }));
    })
  );

  // Reserve budget for a call (no-op success for BYOK).
  router.post(
    '/reserve',
    h(async (req, res) => {
      const { walletId, model, promptTokens, maxTokens, estUsd } = req.body ?? {};
      if (!walletId) {
        res.status(400).json({ error: 'walletId required' });
        return;
      }
      res.json(await reserveForCall(ledger, { walletId, model, promptTokens, maxTokens, estUsd }));
    })
  );

  // Settle a reservation against the real provider cost.
  router.post(
    '/settle',
    h(async (req, res) => {
      const { reservationId, actualUsd } = req.body ?? {};
      if (!reservationId || typeof actualUsd !== 'number') {
        res.status(400).json({ error: 'reservationId, actualUsd required' });
        return;
      }
      res.json(await settleCall(ledger, { reservationId, actualUsd }));
    })
  );

  // Observe a wallet.
  router.get(
    '/balance',
    h(async (req, res) => {
      const walletId = String(req.query.walletId ?? '');
      if (!walletId) {
        res.status(400).json({ error: 'walletId required' });
        return;
      }
      const b = await getBalance(ledger, { walletId });
      if (!b) {
        res.status(404).json({ error: 'wallet not found' });
        return;
      }
      res.json(b);
    })
  );

  // --- Read-side billing pipes (GET-only; ML-3: reads serialize LEDGER state).
  // Per the billing spec these reads stay available under the billing kill
  // switch — no kill-switch logic here, and no writes/money-moves.

  // All wallets under an account.
  router.get(
    '/wallets',
    h(async (req, res) => {
      const accountId = String(req.query.accountId ?? '');
      if (!accountId) {
        res.status(400).json({ error: 'accountId required' });
        return;
      }
      res.json({ accountId, wallets: await listWallets(ledger, { accountId }) });
    })
  );

  // Settled debit-log entries (newest first; limit default 50, max 100).
  router.get(
    '/usage',
    h(async (req, res) => {
      const walletId = String(req.query.walletId ?? '');
      if (!walletId) {
        res.status(400).json({ error: 'walletId required' });
        return;
      }
      const rawLimit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
      const limit = clampEntryLimit(rawLimit === undefined ? 50 : rawLimit, 100);
      const rawBefore = req.query.beforeId !== undefined ? Number(req.query.beforeId) : undefined;
      const beforeId = rawBefore !== undefined && Number.isFinite(rawBefore) ? rawBefore : undefined;
      res.json({ walletId, entries: await getUsage(ledger, { walletId, limit, beforeId }) });
    })
  );

  // Open (unsettled) holds against a wallet.
  router.get(
    '/reservations',
    h(async (req, res) => {
      const walletId = String(req.query.walletId ?? '');
      if (!walletId) {
        res.status(400).json({ error: 'walletId required' });
        return;
      }
      res.json({ walletId, reservations: await getReservations(ledger, { walletId }) });
    })
  );

  // The public price table — COMPUTED from pricing.ts at request time (ML-5:
  // one price table; no constant re-typed). Internal-only values are excluded:
  // floor GM, model ids, the wholesale COGS rates (in/outWholesalePer1k) and
  // the platform rate factor — internal economics never cross this wire. The
  // display surface is the platform LUC rates + band ceilings only.
  router.get(
    '/pricing',
    h(async (_req, res) => {
      res.json(buildPricingPayload());
    })
  );

  return router;
}

/** JSON has no Infinity — an unbounded ceiling serializes as null. */
const finiteOrNull = (n: number): number | null => (Number.isFinite(n) ? n : null);

/**
 * The reference job used to quote lane burn: 1K tokens in + 1K tokens out.
 * A definition of "standard mission", not a price — every price below is
 * computed from pricing.ts.
 */
const STANDARD_MISSION_TOKENS = { tokensIn: 1000, tokensOut: 1000 } as const;

const LANE_IDS: LaneId[] = ['economy', 'standard', 'frontier', 'super'];

function buildPricingPayload(): Record<string, unknown> {
  const skus: Array<{ key: string; amountUsd: number; luc: number }> = [];
  for (const tier of Object.keys(TIERS)) {
    for (const cadence of Object.keys(CADENCES)) {
      skus.push({
        key: `${tier}-${cadence}`,
        amountUsd: planChargeUsd(tier, cadence),
        luc: planLuc(tier, cadence),
      });
    }
  }
  skus.push({ key: BMC.id, amountUsd: planChargeUsd(BMC.id, 'once'), luc: planLuc(BMC.id, 'once') });

  const burn: Record<string, number> = {};
  for (const lane of LANE_IDS) {
    burn[lane] = missionBurnLuc(lane, STANDARD_MISSION_TOKENS.tokensIn, STANDARD_MISSION_TOKENS.tokensOut);
  }

  return {
    lucUsd: LUC_USD,
    lanes: LANE_IDS.map((id) => ({
      id: LANES[id].id,
      maxOutputUsdPerM: finiteOrNull(LANES[id].maxOutputUsdPerM),
      inPlatformPer1k: LANES[id].inPlatformPer1k,
      outPlatformPer1k: LANES[id].outPlatformPer1k,
    })),
    tiers: Object.values(TIERS).map((t) => ({
      id: t.id,
      name: t.name,
      monthlyPriceUsd: t.monthlyPriceUsd,
      lucPerMonth: t.lucPerMonth,
      lane: t.lane,
      maxOutputUsdPerM: finiteOrNull(t.maxOutputUsdPerM),
    })),
    cadences: Object.values(CADENCES).map((c) => ({
      id: c.id,
      chargeMonths: c.chargeMonths,
      lucMonths: c.lucMonths,
      discount: c.discount,
    })),
    bmc: { priceUsd: BMC.priceUsd, luc: BMC.luc },
    skus,
    standardMission: { ...STANDARD_MISSION_TOKENS, ...burn },
  };
}
