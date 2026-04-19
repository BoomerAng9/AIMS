import {
  KNOWN_PROFILES,
  selectTier,
  selectTierByName,
  resolveEndpoints,
  endpointForTier,
  endpointForProfile,
  type TaskProfile,
} from '../personaplex';

describe('PersonaPlex two-tier router', () => {
  describe('selectTier — rule evaluation', () => {
    it('returns nano for realtime workloads regardless of other flags', () => {
      const p: TaskProfile = {
        source: 'test',
        isRealtime: true,
        isLongRunning: true,
        needsAgenticReasoning: true,
      };
      expect(selectTier(p)).toBe('nano');
    });

    it('returns super for long-running workloads', () => {
      expect(
        selectTier({ source: 'test', isLongRunning: true })
      ).toBe('super');
    });

    it('returns super for agentic-reasoning workloads', () => {
      expect(
        selectTier({ source: 'test', needsAgenticReasoning: true })
      ).toBe('super');
    });

    it('returns super when estimated turns exceed 5', () => {
      expect(selectTier({ source: 'test', estimatedTurns: 6 })).toBe('super');
    });

    it('returns nano for small-turn simple lookups', () => {
      expect(selectTier({ source: 'test', estimatedTurns: 1 })).toBe('nano');
    });

    it('returns super for large-context workloads', () => {
      expect(
        selectTier({ source: 'test', estimatedContextTokens: 30_000 })
      ).toBe('super');
    });

    it('returns nano as the default when no flags are set', () => {
      expect(selectTier({ source: 'test' })).toBe('nano');
    });
  });

  describe('KNOWN_PROFILES — alignment contract', () => {
    it('routes CRUCIBLE Planner to super', () => {
      expect(selectTier(KNOWN_PROFILES['crucible.planner'])).toBe('super');
    });

    it('routes CRUCIBLE Judge_Hawk to super', () => {
      expect(selectTier(KNOWN_PROFILES['crucible.judge_hawk'])).toBe(
        'super'
      );
    });

    it('routes FORGE plan synthesis to super', () => {
      expect(selectTier(KNOWN_PROFILES['forge.plan_synthesis'])).toBe(
        'super'
      );
    });

    it('routes aiPLUG autonomous runtimes to super', () => {
      expect(selectTier(KNOWN_PROFILES['aiplug.runtime'])).toBe('super');
    });

    it('routes TTD-DR phases to super', () => {
      expect(selectTier(KNOWN_PROFILES['ttd_dr.phase'])).toBe('super');
    });

    it('routes Hermes Deep Think consensus to super', () => {
      expect(
        selectTier(KNOWN_PROFILES['hermes.deep_think.consensus'])
      ).toBe('super');
    });

    it('routes heavy PersonaPlex analysis to super', () => {
      expect(
        selectTier(KNOWN_PROFILES['personaplex.heavy_analysis'])
      ).toBe('super');
    });

    it('routes light PersonaPlex lookups to nano', () => {
      expect(selectTier(KNOWN_PROFILES['personaplex.light_lookup'])).toBe(
        'nano'
      );
    });

    it('routes edge classification to nano', () => {
      expect(
        selectTier(KNOWN_PROFILES['personaplex.edge_classification'])
      ).toBe('nano');
    });
  });

  describe('selectTierByName', () => {
    it('resolves a known profile', () => {
      expect(selectTierByName('crucible.planner')).toBe('super');
    });

    it('throws on unknown profile', () => {
      expect(() => selectTierByName('not.a.real.profile')).toThrow(
        /unknown profile/
      );
    });
  });

  describe('resolveEndpoints / endpointForTier', () => {
    it('reads two-tier env vars when both set', () => {
      const env = {
        PERSONAPLEX_SUPER_ENDPOINT: 'super-endpoint-123',
        PERSONAPLEX_NANO_ENDPOINT: 'nano-endpoint-456',
      } as NodeJS.ProcessEnv;
      const eps = resolveEndpoints(env);
      expect(eps.super).toBe('super-endpoint-123');
      expect(eps.nano).toBe('nano-endpoint-456');
    });

    it('falls back to legacy PERSONAPLEX_ENDPOINT for nano only', () => {
      const env = {
        PERSONAPLEX_ENDPOINT: 'legacy-endpoint-789',
      } as NodeJS.ProcessEnv;
      const eps = resolveEndpoints(env);
      expect(eps.nano).toBe('legacy-endpoint-789');
      expect(eps.super).toBe('');
    });

    it('endpointForTier throws when the required env is missing', () => {
      const env = {
        PERSONAPLEX_NANO_ENDPOINT: 'nano-only',
      } as NodeJS.ProcessEnv;
      expect(() => endpointForTier('super', env)).toThrow(
        /no endpoint configured for tier 'super'/
      );
    });

    it('endpointForTier returns nano endpoint when nano selected', () => {
      const env = {
        PERSONAPLEX_SUPER_ENDPOINT: 'sup',
        PERSONAPLEX_NANO_ENDPOINT: 'nan',
      } as NodeJS.ProcessEnv;
      expect(endpointForTier('nano', env)).toBe('nan');
      expect(endpointForTier('super', env)).toBe('sup');
    });
  });

  describe('endpointForProfile — end-to-end', () => {
    it('returns super tier + endpoint for a known super-mapped profile', () => {
      const env = {
        PERSONAPLEX_SUPER_ENDPOINT: 'super-ep',
        PERSONAPLEX_NANO_ENDPOINT: 'nano-ep',
      } as NodeJS.ProcessEnv;
      const { tier, endpoint } = endpointForProfile(
        'crucible.planner',
        env
      );
      expect(tier).toBe('super');
      expect(endpoint).toBe('super-ep');
    });

    it('returns nano tier + endpoint for edge classification', () => {
      const env = {
        PERSONAPLEX_SUPER_ENDPOINT: 'super-ep',
        PERSONAPLEX_NANO_ENDPOINT: 'nano-ep',
      } as NodeJS.ProcessEnv;
      const { tier, endpoint } = endpointForProfile(
        'personaplex.edge_classification',
        env
      );
      expect(tier).toBe('nano');
      expect(endpoint).toBe('nano-ep');
    });
  });
});
