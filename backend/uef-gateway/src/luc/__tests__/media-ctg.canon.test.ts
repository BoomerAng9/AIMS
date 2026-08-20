/**
 * LUC — media-rate-card.json canon-alignment + drift proof.
 *
 * This card is byte-identical in two repos (AIMS = canon,
 * broad-cast-app = mirror). Two things must always hold:
 *
 *   1. Its `tokenLanes` block is not a second, hand-typed pricing table — it
 *      is required to equal the REAL v6 Tesla Matrix platform columns in this
 *      same file (pricing.ts LANES), computed here, not copy-pasted.
 *   2. It never grows a wholesale/vendor-cost/margin field — the owner's hard
 *      rule ("never the actual cost of the model, just the cost we are
 *      giving per generation") enforced structurally, at the data level,
 *      independent of any code that reads it.
 *
 * PROPRIETARY — A.I.M.S.
 */
import card from '../media-rate-card.json';
import { LANES, LUC_USD } from '../pricing';

const FORBIDDEN_KEY_PATTERN =
  /wholesale|vendor.?cost|margin|rate.?factor|platformratefactor|cogs|markup/i;

describe('media-rate-card.json — canon alignment', () => {
  it('lucUsd matches the real LUC_USD constant', () => {
    expect(card.lucUsd).toBe(LUC_USD);
  });

  it('tokenLanes equals the REAL v6 Tesla Matrix platform columns, lane for lane', () => {
    const laneIds: Array<keyof typeof LANES> = ['economy', 'standard', 'frontier', 'super'];
    for (const id of laneIds) {
      const real = LANES[id];
      const mirrored = (card.tokenLanes.lanes as Record<string, { inLucPer1k: number; outLucPer1k: number }>)[id];
      expect(mirrored).toBeDefined();
      expect(mirrored.inLucPer1k).toBe(real.inPlatformPer1k);
      expect(mirrored.outLucPer1k).toBe(real.outPlatformPer1k);
    }
  });

  it('carries no wholesale/margin/vendor-cost/rate-factor field anywhere, at any depth', () => {
    const seen: string[] = [];
    const walk = (obj: unknown, path: string): void => {
      if (obj === null || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (FORBIDDEN_KEY_PATTERN.test(k)) seen.push(`${path}.${k}`);
        walk(v, `${path}.${k}`);
      }
    };
    walk(card, 'card');
    expect(seen).toEqual([]);
  });

  it('never names platformRateFactor as a key (the wholesale relationship itself)', () => {
    // NOTE: a bare numeric collision check (e.g. "does some media rate equal
    // some wholesale-column number") was deliberately NOT used here — with a
    // handful of human-picked round numbers (0.1, 0.5, ...) on both sides,
    // coincidental matches are expected and prove nothing about a leak. The
    // real, non-coincidental adversarial proof — that a wholesale price
    // COMPUTED for a specific real job never appears in that job's serialized
    // customer receipt — lives in broad-cast-app's no-leak.test.ts, which
    // checks a full derived dollar figure, not a bare rate constant.
    const serialized = JSON.stringify(card);
    expect(serialized).not.toMatch(/"platformRateFactor"/i);
  });

  it('every proposed rate is explicitly flagged for owner confirmation — none silently promoted to canon', () => {
    for (const rate of card.rates as Array<{ provenance: string; needsOwnerConfirmation: boolean }>) {
      if (rate.provenance === 'proposed') {
        expect(rate.needsOwnerConfirmation).toBe(true);
      }
    }
  });
});
