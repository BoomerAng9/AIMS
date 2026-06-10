/**
 * LUC allocator — v6 Tesla Matrix pricing config.
 *
 * Every value here is script-verified against AIMS-PRICING-V6-TESLA-MATRIX.md.
 * The test IS the spec: the burn table, the full 12-cell Tesla grid (charge +
 * total LUC + floor GM), BMC, and the model->lane classifier are all asserted
 * against the published numbers. A drift in the config fails here.
 */

import {
  LUC_USD,
  PLATFORM_RATE_FACTOR,
  LANES,
  TIERS,
  CADENCES,
  BMC,
  lucToUsd,
  usdToLuc,
  missionBurnLuc,
  laneForOutputUsdPerM,
  laneForModel,
  planLuc,
  planChargeUsd,
  planFloorGmPct,
  planWalletUsdBudget,
} from '../pricing';

describe('v6 unit + constants', () => {
  it('1 LUC = $0.01; platform rate = 2.0x wholesale', () => {
    expect(LUC_USD).toBe(0.01);
    expect(PLATFORM_RATE_FACTOR).toBe(2.0);
  });
  it('converts LUC <-> USD', () => {
    expect(lucToUsd(654)).toBeCloseTo(6.54, 6);
    expect(usdToLuc(6.54)).toBe(654);
    expect(usdToLuc(20)).toBe(2000);
  });
});

describe('BMC (Buy Me a Coffee) entry', () => {
  it('is $6.54 -> 654 LUC, all lanes', () => {
    expect(BMC.priceUsd).toBe(6.54);
    expect(BMC.luc).toBe(654);
    expect(usdToLuc(BMC.priceUsd)).toBe(BMC.luc);
  });
});

describe('burn table — Standard Mission (10K in / 5K out) in platform LUC', () => {
  const cases: Array<[string, number]> = [
    ['economy', 7],
    ['standard', 21],
    ['frontier', 40],
    ['super', 70],
  ];
  it.each(cases)('%s lane standard mission = %i LUC', (lane, luc) => {
    expect(missionBurnLuc(lane, 10_000, 5_000)).toBeCloseTo(luc, 6);
  });

  it('free-roster (economy at zero) — a tiny job still prices on the lane rate', () => {
    // Burn is rate-based; the "free roster" zeroing happens at model resolution,
    // not in the lane rate. Lane rates are the published platform table.
    expect(missionBurnLuc('economy', 1_000, 1_000)).toBeCloseTo(0.2 + 1.0, 6);
  });
});

describe('tiers (monthly)', () => {
  it('Light/Medium/Heavy/Superior price + LUC + ceiling lane', () => {
    expect(TIERS.light).toMatchObject({ monthlyPriceUsd: 9.99, lucPerMonth: 1000, lane: 'economy' });
    expect(TIERS.medium).toMatchObject({ monthlyPriceUsd: 19.99, lucPerMonth: 2000, lane: 'standard' });
    expect(TIERS.heavy).toMatchObject({ monthlyPriceUsd: 39.99, lucPerMonth: 4000, lane: 'frontier' });
    expect(TIERS.superior).toMatchObject({ monthlyPriceUsd: 79.99, lucPerMonth: 8000, lane: 'super' });
  });
});

describe('Tesla Matrix — full 12-cell grid (charge / total LUC / floor GM%)', () => {
  // [tier, cadence, charge, totalLuc, floorGmPct] — verbatim from v6 §5.
  const grid: Array<[string, string, number, number, number]> = [
    ['light', '3mo', 29.97, 3000, 49.9],
    ['light', '6mo', 53.95, 6000, 44.4],
    ['light', '9mo', 89.91, 12000, 33.3],
    ['medium', '3mo', 59.97, 6000, 50.0],
    ['medium', '6mo', 107.95, 12000, 44.4],
    ['medium', '9mo', 179.91, 24000, 33.3],
    ['heavy', '3mo', 119.97, 12000, 50.0],
    ['heavy', '6mo', 215.95, 24000, 44.4],
    ['heavy', '9mo', 359.91, 48000, 33.3],
    ['superior', '3mo', 239.97, 24000, 50.0],
    ['superior', '6mo', 431.95, 48000, 44.4],
    ['superior', '9mo', 719.91, 96000, 33.3],
  ];
  it.each(grid)('%s %s', (tier, cadence, charge, totalLuc, gm) => {
    expect(planChargeUsd(tier, cadence)).toBeCloseTo(charge, 2);
    expect(planLuc(tier, cadence)).toBe(totalLuc);
    expect(planFloorGmPct(tier, cadence)).toBeCloseTo(gm, 1);
  });

  it('9mo is "pay 9, get 12" — charge is 9 months, LUC is 12 months', () => {
    expect(planChargeUsd('medium', '9mo')).toBeCloseTo(19.99 * 9, 2);
    expect(planLuc('medium', '9mo')).toBe(2000 * 12);
  });

  it('6mo carries the 10% discount', () => {
    expect(planChargeUsd('light', '6mo')).toBeCloseTo(9.99 * 6 * 0.9, 2);
  });
});

describe('wallet budget = LUC allotment in platform-$ (what the ledger holds)', () => {
  it('BMC funds a $6.54 wallet', () => {
    expect(planWalletUsdBudget('bmc', 'once')).toBeCloseTo(6.54, 6);
  });
  it('Medium 3mo funds a $60 wallet (6000 LUC x $0.01)', () => {
    expect(planWalletUsdBudget('medium', '3mo')).toBeCloseTo(60, 6);
  });
  it('Superior 9->12 funds a $960 wallet (96000 LUC x $0.01)', () => {
    expect(planWalletUsdBudget('superior', '9mo')).toBeCloseTo(960, 6);
  });
});

describe('model -> lane (by wholesale output $/M)', () => {
  it('classifies by band thresholds (<=5 / <=25 / <=50 / else)', () => {
    expect(laneForOutputUsdPerM(0)).toBe('economy');
    expect(laneForOutputUsdPerM(5)).toBe('economy');
    expect(laneForOutputUsdPerM(15)).toBe('standard');
    expect(laneForOutputUsdPerM(25)).toBe('standard');
    expect(laneForOutputUsdPerM(50)).toBe('frontier');
    expect(laneForOutputUsdPerM(50.01)).toBe('super');
    expect(laneForOutputUsdPerM(150)).toBe('super');
  });
  it('Fable 5 ($50/M out) is the Frontier (Heavy) ceiling', () => {
    expect(laneForModel('claude-fable-5')).toBe('frontier');
  });
  it('a free-roster model classifies Economy', () => {
    expect(laneForModel('qwen3-coder:free')).toBe('economy');
  });
  it('unknown model -> null (gate denies separately)', () => {
    expect(laneForModel('no-such-model')).toBeNull();
  });
});

describe('LANES table integrity', () => {
  it('platform = 2x wholesale on every lane', () => {
    for (const lane of Object.values(LANES)) {
      expect(lane.inPlatformPer1k).toBeCloseTo(lane.inWholesalePer1k * PLATFORM_RATE_FACTOR, 6);
      expect(lane.outPlatformPer1k).toBeCloseTo(lane.outWholesalePer1k * PLATFORM_RATE_FACTOR, 6);
    }
  });
  it('CADENCES expose the 3/6/9 ladder', () => {
    expect(Object.keys(CADENCES).sort()).toEqual(['3mo', '6mo', '9mo']);
  });
});
