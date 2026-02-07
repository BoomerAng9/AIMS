import { Oracle } from '../oracle';

describe('Oracle', () => {
  describe('runGates', () => {
    it('passes all gates for a valid CHAT request', async () => {
      const spec = { intent: 'CHAT', query: 'Hello, how are you today?', userId: 'user-1' };
      const output = { quote: { quoteId: 'qt-1', variants: [{ model: 'test', estimate: { totalTokens: 100, totalUsd: 0.001 } }] } };

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.gateFailures).toHaveLength(0);
      expect(result.warnings).toBeDefined();
    });

    it('fails Technical gate for empty query', async () => {
      const spec = { intent: 'CHAT', query: '' };
      const output = { quote: { quoteId: 'qt-1', variants: [] } };

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(false);
      expect(result.gateFailures.some(f => f.includes('Technical'))).toBe(true);
    });

    it('fails Security gate for suspicious patterns', async () => {
      const spec = { intent: 'CHAT', query: '<script>alert("xss")</script>' };
      const output = { quote: { quoteId: 'qt-1', variants: [] } };

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(false);
      expect(result.gateFailures.some(f => f.includes('Security'))).toBe(true);
    });

    it('fails Strategy gate for unknown intent', async () => {
      const spec = { intent: 'INVALID_INTENT', query: 'Do something' };
      const output = { quote: { quoteId: 'qt-1', variants: [] } };

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(false);
      expect(result.gateFailures.some(f => f.includes('Strategy'))).toBe(true);
    });

    it('fails Judge gate when quote is missing', async () => {
      const spec = { intent: 'CHAT', query: 'Hello world test' };
      const output = {};

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(false);
      expect(result.gateFailures.some(f => f.includes('Judge'))).toBe(true);
    });

    it('fails Effort gate when budget is exceeded', async () => {
      const spec = {
        intent: 'CHAT',
        query: 'Build me something nice please',
        userId: 'user-effort',
        budget: { maxUsd: 0.0001, maxTokens: 10 }
      };
      const output = {
        quote: {
          quoteId: 'qt-1',
          variants: [{ name: 'Test', estimate: { totalUsd: 100, totalTokens: 5000 } }]
        }
      };

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(false);
      expect(result.gateFailures.some(f => f.includes('Effort'))).toBe(true);
    });

    it('fails Documentation gate for short BUILD_PLUG specs', async () => {
      const spec = { intent: 'BUILD_PLUG', query: 'build a quick api thing', userId: 'user-doc' };
      const output = { quote: { quoteId: 'qt-1', variants: [{ model: 'test', estimate: { totalTokens: 100, totalUsd: 0.001 } }] } };

      const result = await Oracle.runGates(spec, output);

      expect(result.passed).toBe(false);
      expect(result.gateFailures.some(f => f.includes('Documentation'))).toBe(true);
    });

    it('calculates score proportionally to passed gates', async () => {
      const spec = { intent: 'CHAT', query: 'Hello, how are you today?', userId: 'user-score' };
      const output = { quote: { quoteId: 'qt-1', variants: [{ model: 'test', estimate: { totalTokens: 100, totalUsd: 0.001 } }] } };

      const result = await Oracle.runGates(spec, output);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
