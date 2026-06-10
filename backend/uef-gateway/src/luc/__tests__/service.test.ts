/**
 * LUC allocator — service layer (the enforcement core).
 *
 * Pure functions over an injected LedgerAdapter, so the headline proof —
 * "set a $1 budget, fire calls, it PAUSES at the limit with no silent overage" —
 * runs with no HTTP plumbing. The Express routes are a thin shell over these.
 */

import { InMemoryLedger } from '../ledger';
import {
  provisionWallet,
  checkModelAccess,
  reserveForCall,
  settleCall,
  getBalance,
} from '../service';

const FABLE = 'claude-fable-5';

describe('LUC service', () => {
  let ledger: InMemoryLedger;

  beforeEach(() => {
    ledger = new InMemoryLedger();
  });

  describe('provisionWallet', () => {
    it('creates a wallet with the plan budget', async () => {
      const w = await provisionWallet(ledger, { id: 'w1', accountId: 'a1', planId: '3mo', usdBudget: 1.0 });
      expect(w.usdBudget).toBeCloseTo(1.0, 6);
      expect((await getBalance(ledger, { walletId: 'w1' }))!.available).toBeCloseTo(1.0, 6);
    });
  });

  describe('checkModelAccess', () => {
    it('allows free models with no wallet', async () => {
      const free = 'meta-llama/llama-3.3-70b-instruct:free';
      const d = await checkModelAccess(ledger, { walletId: 'absent', model: free });
      expect(d.allowed).toBe(true);
    });

    it('denies a paid model with no wallet (no active plan)', async () => {
      const d = await checkModelAccess(ledger, { walletId: 'absent', model: FABLE });
      expect(d.allowed).toBe(false);
      expect(d.reason).toMatch(/active plan/i);
    });

    it('allows a paid model when the wallet has budget', async () => {
      await provisionWallet(ledger, { id: 'w1', accountId: 'a1', planId: '3mo', usdBudget: 1.0 });
      const d = await checkModelAccess(ledger, { walletId: 'w1', model: FABLE });
      expect(d.allowed).toBe(true);
      expect(d.available).toBeCloseTo(1.0, 6);
    });

    it('allows BYOK wallets at zero budget (plan present, no platform debit)', async () => {
      await provisionWallet(ledger, { id: 'b1', accountId: 'a1', planId: '3mo', usdBudget: 0, byok: true });
      const d = await checkModelAccess(ledger, { walletId: 'b1', model: FABLE });
      expect(d.allowed).toBe(true);
    });
  });

  describe('reserveForCall sizes the hold from the model + tokens', () => {
    it('estimates Fable 5 output cost and holds it', async () => {
      await provisionWallet(ledger, { id: 'w1', accountId: 'a1', planId: '3mo', usdBudget: 1.0 });
      // 6000 output tokens @ $50/1M = $0.30
      const r = await reserveForCall(ledger, { walletId: 'w1', model: FABLE, maxTokens: 6000 });
      expect(r.ok).toBe(true);
      expect(r.estUsd).toBeCloseTo(0.3, 6);
      expect((await getBalance(ledger, { walletId: 'w1' }))!.available).toBeCloseTo(0.7, 6);
    });

    it('BYOK reserve is a no-op that always succeeds (no $ held)', async () => {
      await provisionWallet(ledger, { id: 'b1', accountId: 'a1', planId: '3mo', usdBudget: 0, byok: true });
      const r = await reserveForCall(ledger, { walletId: 'b1', model: FABLE, maxTokens: 6000 });
      expect(r.ok).toBe(true);
      expect(r.byok).toBe(true);
      expect(r.estUsd).toBe(0);
    });
  });

  describe('THE PROOF: $1 budget pauses at the limit, no silent overage', () => {
    it('grants exactly the affordable calls, then pauses; ledger never goes negative', async () => {
      await provisionWallet(ledger, { id: 'w1', accountId: 'a1', planId: '3mo', usdBudget: 1.0 });

      // Each call estimates $0.30 (6000 output tokens of Fable 5). $1.00 fits 3.
      const reservations: string[] = [];
      let pausedAt = -1;
      for (let i = 0; i < 10; i++) {
        const r = await reserveForCall(ledger, { walletId: 'w1', model: FABLE, maxTokens: 6000 });
        if (!r.ok) {
          pausedAt = i;
          break;
        }
        reservations.push(r.reservationId!);
      }

      expect(reservations.length).toBe(3); // exactly the affordable count
      expect(pausedAt).toBe(3); // PAUSE — reserve refused, caller stops
      const afterPause = (await getBalance(ledger, { walletId: 'w1' }))!;
      expect(afterPause.available).toBeCloseTo(0.1, 6);
      expect(afterPause.available).toBeGreaterThanOrEqual(0); // never negative

      // Settle each call at the real cost ($0.25 actual vs $0.30 held) — money reconciles.
      for (const id of reservations) {
        const s = await settleCall(ledger, { reservationId: id, actualUsd: 0.25 });
        expect(s.ok).toBe(true);
      }
      const settled = (await getBalance(ledger, { walletId: 'w1' }))!;
      expect(settled.spent).toBeCloseTo(0.75, 6); // 3 x $0.25
      expect(settled.reserved).toBeCloseTo(0, 6); // all holds released
      expect(settled.available).toBeCloseTo(0.25, 6); // $1.00 - $0.75
    });
  });
});
