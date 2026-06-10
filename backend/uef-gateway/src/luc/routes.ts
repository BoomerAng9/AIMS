/**
 * LUC allocator — HTTP routes (thin shell over the service).
 *
 * Mounted under /luc on the uef-gateway. Every route requires the internal
 * service key (Authorization: Bearer <key> or x-internal-key) — fail-closed if
 * the key is not configured. This is the in-mesh enforcement API the verticals
 * (Charlotte, Warehouse, the gateway's own LLM layer) call to gate/reserve/settle.
 *
 * PROPRIETARY — A.I.M.S.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { LedgerAdapter } from './ledger';
import {
  checkModelAccess,
  reserveForCall,
  settleCall,
  provisionWallet,
  getBalance,
} from './service';

export interface LucRouterDeps {
  ledger: LedgerAdapter;
  /** Shared service token. Callers present it as Bearer or x-internal-key. */
  internalApiKey?: string;
}

function requireInternalKey(key?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!key) {
      // Fail closed: a money endpoint with no configured auth must not serve.
      res.status(503).json({ error: 'luc service auth not configured' });
      return;
    }
    const authz = req.header('authorization');
    const bearer = authz && authz.startsWith('Bearer ') ? authz.slice(7) : undefined;
    const provided = bearer || req.header('x-internal-key');
    if (!provided || provided !== key) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
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

  router.use(requireInternalKey(deps.internalApiKey));

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

  return router;
}
