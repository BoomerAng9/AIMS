import { LUCEngine } from '../luc';

describe('LUCEngine', () => {
  describe('estimate', () => {
    it('returns a valid quote structure', () => {
      const quote = LUCEngine.estimate('Build a landing page');

      expect(quote.quoteId).toMatch(/^qt-/);
      expect(quote.validForSeconds).toBe(3600);
      expect(quote.variants).toHaveLength(2);
    });

    it('produces two variants: Standard and Premium', () => {
      const quote = LUCEngine.estimate('Build a landing page');
      const names = quote.variants.map(v => v.name);

      expect(names).toContain('Fast (Sonnet 4.5)');
      expect(names).toContain('Premium (Opus 4.6)');
    });

    it('standard variant is cheaper than premium', () => {
      const quote = LUCEngine.estimate('Build a complex SaaS dashboard');
      const standard = quote.variants.find(v => v.name.includes('Sonnet'));
      const premium = quote.variants.find(v => v.name.includes('Opus'));

      expect(standard!.estimate.totalUsd).toBeLessThan(premium!.estimate.totalUsd);
    });

    it('breakdown has three components per variant', () => {
      const quote = LUCEngine.estimate('Research market trends');

      for (const variant of quote.variants) {
        expect(variant.estimate.breakdown).toHaveLength(3);
        const names = variant.estimate.breakdown.map(b => b.componentName);
        expect(names).toContain('Planning (AVVA NOON)');
        expect(names).toContain('Execution (Chicken Hawk)');
        expect(names).toContain('Verification (ORACLE)');
      }
    });

    it('applies ByteRover discount', () => {
      const quote = LUCEngine.estimate('Build a full-stack SaaS application with authentication and payments');

      for (const variant of quote.variants) {
        expect(variant.estimate.byteRoverDiscountApplied).toBe(true);
        expect(variant.estimate.byteRoverSavingsUsd).toBeGreaterThan(0);
        expect(variant.estimate.byteRover).toBeDefined();
        expect(variant.estimate.byteRover.relevance).toBeGreaterThan(0);
        expect(variant.estimate.byteRover.tokensSaved).toBeGreaterThan(0);
        expect(variant.estimate.byteRover.preSavingsTokens).toBeGreaterThan(
          variant.estimate.byteRover.postSavingsTokens
        );
      }
    });

    it('handles empty input without crashing', () => {
      const quote = LUCEngine.estimate('');
      expect(quote.quoteId).toBeDefined();
      expect(quote.variants).toHaveLength(2);
    });
  });
});
