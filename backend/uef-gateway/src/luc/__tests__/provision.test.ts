/**
 * LUC allocator — provisioning bridge (v6 pricing -> ledger wallet).
 *
 * Proves the offer: "$6.54 -> 654 LUC provisioned through the ledger" plus the
 * Tesla-Matrix plan wallets, and that a provisioned wallet meters real burn and
 * pauses at its LUC allotment — pricing and ledger working as one.
 */

import { InMemoryLedger } from '../ledger';
import { provisionPlan, provisionBmc, creditBmc, applyBmcPurchase } from '../service';
import { missionBurnLuc, lucToUsd } from '../pricing';

describe('provisioning v6 plans through the ledger', () => {
  let ledger: InMemoryLedger;
  beforeEach(() => {
    ledger = new InMemoryLedger();
  });

  it('BMC provisions a $6.54 (654 LUC) wallet', async () => {
    const w = await provisionBmc(ledger, { id: 'w1', accountId: 'a1' });
    expect(w.planId).toBe('bmc');
    expect(w.usdBudget).toBeCloseTo(6.54, 6);
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(6.54, 6);
  });

  it('Medium 3mo provisions a $60 (6000 LUC) wallet', async () => {
    const w = await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'medium', cadence: '3mo' });
    expect(w.planId).toBe('medium-3mo');
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(60, 6);
  });

  it('Superior 9->12 provisions a $960 (96000 LUC) wallet', async () => {
    await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'superior', cadence: '9mo' });
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(960, 6);
  });

  it('creditBmc tops up an existing wallet by $6.54', async () => {
    await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'light', cadence: '3mo' }); // $30
    await creditBmc(ledger, 'w1');
    expect((await ledger.balance('w1'))!.available).toBeCloseTo(36.54, 6);
  });

  it('carries byok + seat through', async () => {
    const w = await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'medium', cadence: '6mo', byok: true, seatId: 's2' });
    expect(w.byok).toBe(true);
    expect(w.seatId).toBe('s2');
  });

  it('BMC reload: stacks $6.54 each purchase (the no-commitment lane)', async () => {
    // First coffee on a brand-new account creates the wallet.
    const r1 = await applyBmcPurchase(ledger, { id: 'w1', accountId: 'a1' });
    expect(r1.created).toBe(true);
    expect(r1.available).toBeCloseTo(6.54, 6);
    // Buy another coffee anytime -> stacks.
    const r2 = await applyBmcPurchase(ledger, { id: 'w1', accountId: 'a1' });
    expect(r2.created).toBe(false);
    expect(r2.available).toBeCloseTo(13.08, 6);
    const r3 = await applyBmcPurchase(ledger, { id: 'w1', accountId: 'a1' });
    expect(r3.available).toBeCloseTo(19.62, 6);
  });

  it('BMC reload stacks on top of a commitment wallet too', async () => {
    await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'light', cadence: '3mo' }); // $30
    const r = await applyBmcPurchase(ledger, { id: 'w1', accountId: 'a1' });
    expect(r.created).toBe(false);
    expect(r.available).toBeCloseTo(36.54, 6);
  });

  it('PROOF: a Medium 3mo wallet ($60) meters Standard-lane burn and pauses', async () => {
    await provisionPlan(ledger, { id: 'w1', accountId: 'a1', tier: 'medium', cadence: '3mo' });
    const perMission = lucToUsd(missionBurnLuc('standard', 10_000, 5_000)); // 21 LUC = $0.21
    expect(perMission).toBeCloseTo(0.21, 6);

    let granted = 0;
    for (let i = 0; i < 400; i++) {
      const r = await ledger.reserve('w1', perMission);
      if (r.ok) granted++;
      else break;
    }
    // 6000 LUC / 21 LUC per mission = 285 full Standard missions, then pause.
    expect(granted).toBe(285);
    const b = await ledger.balance('w1');
    expect(b!.available).toBeGreaterThanOrEqual(0);
    expect(b!.available).toBeCloseTo(0.15, 2); // $60 - 285*$0.21
  });
});
