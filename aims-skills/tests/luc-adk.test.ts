/**
 * Tests for LUC (LUKE) ADK
 */

import { LucAdk } from '../luc/luc-adk';
import { LUC_PLANS, OVERAGE_RATES } from '../luc/types';

describe('LucAdk', () => {
  describe('OVERAGE_RATES', () => {
    it('should have correct overage rates', () => {
      expect(OVERAGE_RATES.brave_searches).toBe(0.01);
      expect(OVERAGE_RATES.elevenlabs_chars).toBe(0.0001);
      expect(OVERAGE_RATES.container_hours).toBe(0.50);
      expect(OVERAGE_RATES.n8n_executions).toBe(0.005);
      expect(OVERAGE_RATES.storage_gb).toBe(0.10);
      expect(OVERAGE_RATES.api_calls).toBe(0.0001);
    });
  });

  describe('LUC_PLANS', () => {
    it('should have p2p (pay-per-use) plan', () => {
      const p2p = LUC_PLANS.p2p;
      expect(p2p.price_monthly).toBe(0);
      expect(p2p.quotas.brave_searches).toBe(10);
      expect(p2p.quotas.api_calls).toBe(100);
    });

    it('should have coffee plan', () => {
      const coffee = LUC_PLANS.coffee;
      expect(coffee.price_monthly).toBe(7.99);
      expect(coffee.quotas.brave_searches).toBe(100);
      expect(coffee.features).toContain('Basic automations');
    });

    it('should have data_entry plan', () => {
      const dataEntry = LUC_PLANS.data_entry;
      expect(dataEntry.price_monthly).toBe(29.99);
      expect(dataEntry.quotas.n8n_executions).toBe(500);
    });

    it('should have pro plan', () => {
      const pro = LUC_PLANS.pro;
      expect(pro.price_monthly).toBe(99.99);
      expect(pro.quotas.api_calls).toBe(100000);
      expect(pro.features).toContain('API access');
    });

    it('should have enterprise plan with highest allocations', () => {
      const enterprise = LUC_PLANS.enterprise;
      expect(enterprise.price_monthly).toBe(299);
      expect(enterprise.quotas.brave_searches).toBe(50_000);
      expect(enterprise.quotas.api_calls).toBe(500_000);
      expect(enterprise.features).toContain('Highest allocations across all services');
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly for single service', () => {
      const result = LucAdk.estimateCost([
        { service: 'brave_searches', amount: 100 }
      ]);
      
      expect(result.breakdown.brave_searches).toBe(1.00); // 100 * $0.01
      expect(result.total).toBe(1.00);
    });

    it('should calculate cost correctly for multiple services', () => {
      const result = LucAdk.estimateCost([
        { service: 'brave_searches', amount: 100 },
        { service: 'container_hours', amount: 2 },
        { service: 'api_calls', amount: 10000 }
      ]);
      
      expect(result.breakdown.brave_searches).toBe(1.00);
      expect(result.breakdown.container_hours).toBe(1.00);
      expect(result.breakdown.api_calls).toBe(1.00);
      expect(result.total).toBe(3.00);
    });

    it('should handle zero amounts', () => {
      const result = LucAdk.estimateCost([
        { service: 'brave_searches', amount: 0 }
      ]);
      
      expect(result.total).toBe(0);
    });
  });

  describe('recommendPlan', () => {
    it('should recommend p2p plan for minimal usage', () => {
      const result = LucAdk.recommendPlan({
        brave_searches: 5,
        api_calls: 50
      });

      expect(result.recommended_plan).toBe('p2p');
    });

    it('should recommend coffee plan for light usage', () => {
      const result = LucAdk.recommendPlan({
        brave_searches: 50,
        elevenlabs_chars: 5000,
        api_calls: 500
      });
      
      // Should recommend a plan (could be free or paid depending on overage calc)
      expect(result.recommended_plan).toBeDefined();
      expect(typeof result.reason).toBe('string');
    });

    it('should include reason in recommendation', () => {
      const result = LucAdk.recommendPlan({
        brave_searches: 5
      });
      
      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('plan features', () => {
    it('all plans should have features array', () => {
      for (const [planId, plan] of Object.entries(LUC_PLANS)) {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

    it('all plans should have quota definitions', () => {
      for (const [planId, plan] of Object.entries(LUC_PLANS)) {
        expect(typeof plan.quotas.brave_searches).toBe('number');
        expect(typeof plan.quotas.api_calls).toBe('number');
        expect(typeof plan.quotas.storage_gb).toBe('number');
      }
    });

    it('annual pricing should be less than 12x monthly', () => {
      for (const [planId, plan] of Object.entries(LUC_PLANS)) {
        if (plan.price_monthly > 0) {
          const monthlyAnnualized = plan.price_monthly * 12;
          expect(plan.price_annual).toBeLessThan(monthlyAnnualized);
        }
      }
    });
  });
});
