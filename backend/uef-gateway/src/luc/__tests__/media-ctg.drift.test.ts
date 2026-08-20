/**
 * LUC — media-rate-card.json cross-repo drift guard (AIMS side).
 *
 * See broad-cast-app's lib/luc/__tests__/rate-card-drift.test.ts for the full
 * rationale — this is the same guard, pinned to the same bytes, on the CANON
 * side. Both pins must move together whenever the card changes.
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

const PINNED_SHA256 =
  '76b3769fa86ab27ad4ded7b51b1f577d3908516e1a0f316baf609d57d803ac4e';

describe('media-rate-card.json — cross-repo drift guard', () => {
  it('matches the pinned hash shared with broad-cast-app', () => {
    const file = path.resolve(__dirname, '../media-rate-card.json');
    const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
    expect(actual).toBe(PINNED_SHA256);
  });
});
