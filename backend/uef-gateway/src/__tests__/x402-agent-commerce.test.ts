/**
 * X402 + Agent Commerce Wiring Tests
 *
 * Proves that:
 *   - x402Gate middleware returns 402 with correct headers for agents
 *   - x402Gate passes through for non-agent requests
 *   - Receipt generation produces valid base64
 *   - Receipt round-trips: generate → decode → validate fields
 *   - Billing engine calculations are correct
 *   - Resource pricing is accessible
 */

import { generateReceipt, getAllPricing, getResourcePricing, x402Gate } from '../billing/x402';
import { meterTokens, checkAllowance, checkAgentLimit, calculatePillarAddon, calculateFees, generateInvoiceLineItems, TIER_CONFIGS, TASK_MULTIPLIERS } from '../billing';

// ---------------------------------------------------------------------------
// X402 Protocol
// ---------------------------------------------------------------------------

describe('x402 receipt generation', () => {
  it('generates a valid base64 receipt', () => {
    const receipt = generateReceipt(
      'pi_test_12345',
      'stripe',
      5.00,
      'usd',
      'n8n-plug',
    );

    expect(typeof receipt).toBe('string');
    expect(receipt.length).toBeGreaterThan(0);

    // Decode and verify
    const decoded = JSON.parse(Buffer.from(receipt, 'base64').toString('utf-8'));
    expect(decoded.paymentId).toBe('pi_test_12345');
    expect(decoded.network).toBe('stripe');
    expect(decoded.amount).toBe(5.00);
    expect(decoded.currency).toBe('usd');
    expect(decoded.resourceId).toBe('n8n-plug');
    expect(decoded.timestamp).toBeDefined();
  });

  it('generates unique receipts for different payments', () => {
    const r1 = generateReceipt('pi_aaa', 'stripe', 5.00, 'usd', 'plug-a');
    const r2 = generateReceipt('pi_bbb', 'coinbase', 0.10, 'usdc', 'plug-b');
    expect(r1).not.toBe(r2);
  });
});

describe('resource pricing', () => {
  it('returns pricing for known resource types', () => {
    const plugDeploy = getResourcePricing('plug-deploy');
    expect(plugDeploy).toBeDefined();
    expect(plugDeploy!.usd).toBe(5.00);

    const apiCall = getResourcePricing('api-call');
    expect(apiCall).toBeDefined();
    expect(apiCall!.usd).toBe(0.001);
  });

  it('returns undefined for unknown resource type', () => {
    expect(getResourcePricing('nonexistent')).toBeUndefined();
  });

  it('getAllPricing returns all resources', () => {
    const pricing = getAllPricing();
    expect(Object.keys(pricing).length).toBeGreaterThanOrEqual(5);
    expect(pricing['plug-deploy']).toBeDefined();
    expect(pricing['plug-access']).toBeDefined();
    expect(pricing['api-call']).toBeDefined();
    expect(pricing['export-bundle']).toBeDefined();
  });
});

describe('x402Gate middleware', () => {
  // Mock request/response
  const mockReq = (headers: Record<string, string> = {}) => ({
    headers: { 'content-type': 'application/json', ...headers },
    params: { id: 'test-plug' },
  });

  const mockRes = () => {
    const res: any = {
      _status: 0,
      _headers: {} as Record<string, string>,
      _body: null,
      status(s: number) { res._status = s; return res; },
      setHeader(k: string, v: string) { res._headers[k] = v; },
      json(body: unknown) { res._body = body; },
    };
    return res;
  };

  it('passes through for non-agent requests (no x-agent-protocol)', (done) => {
    const gate = x402Gate('plug-deploy');
    const req = mockReq();
    const res = mockRes();

    gate(req as any, res as any, () => {
      // next() was called — pass-through
      done();
    });
  });

  it('returns 402 for agent requests without receipt', (done) => {
    const gate = x402Gate('plug-deploy');
    const req = mockReq({ 'x-agent-protocol': 'acp/1.0' });
    const res = mockRes();

    gate(req as any, res as any, () => {
      done.fail('Should not call next()');
    });

    // The gate is async, so wait a tick
    setTimeout(() => {
      expect(res._status).toBe(402);
      expect(res._headers['X-402-Version']).toBe('1.0');
      expect(res._headers['X-402-Currency']).toBe('usd');
      expect(res._body.error).toBe('Payment Required');
      expect(res._body.payment).toBeDefined();
      expect(res._body.payment.amount).toBe(5.00);
      done();
    }, 50);
  });

  it('accepts valid receipt header', (done) => {
    // Generate a receipt first
    const receipt = generateReceipt('pi_gate_test', 'stripe', 5.00, 'usd', 'test-plug');
    const gate = x402Gate('plug-deploy');
    const req = mockReq({ 'x-402-receipt': receipt });
    const res = mockRes();

    gate(req as any, res as any, () => {
      // next() was called — receipt accepted
      expect((req as any).__x402Receipt).toBeDefined();
      expect((req as any).__x402Receipt.paymentId).toBe('pi_gate_test');
      done();
    });
  });

  it('rejects garbage receipt header', (done) => {
    const gate = x402Gate('plug-deploy');
    const req = mockReq({ 'x-402-receipt': 'not-valid-base64!' });
    const res = mockRes();

    gate(req as any, res as any, () => {
      done.fail('Should not call next()');
    });

    setTimeout(() => {
      expect(res._status).toBe(403);
      done();
    }, 50);
  });
});

// ---------------------------------------------------------------------------
// 3-6-9 Billing Engine
// ---------------------------------------------------------------------------

describe('billing engine', () => {
  it('has 4 tier configs (3mo, 6mo, 9mo, p2p)', () => {
    expect(TIER_CONFIGS.length).toBe(4);
    const ids = TIER_CONFIGS.map(t => t.id);
    expect(ids).toContain('3mo');
    expect(ids).toContain('6mo');
    expect(ids).toContain('9mo');
    expect(ids).toContain('p2p');
  });

  it('has 9 task multipliers', () => {
    expect(Object.keys(TASK_MULTIPLIERS).length).toBe(9);
    expect(TASK_MULTIPLIERS.CODE_GEN.multiplier).toBe(1.0);
    expect(TASK_MULTIPLIERS.FULL_AUTONOMOUS.multiplier).toBe(3.0);
    expect(TASK_MULTIPLIERS.AGENT_SWARM.multiplier).toBe(2.0);
  });
});

describe('meterTokens', () => {
  it('applies task multiplier correctly', () => {
    const result = meterTokens(1000, 'CODE_GEN', 'p2p');
    expect(result.rawTokens).toBe(1000);
    expect(result.multiplier).toBe(1.0);
    expect(result.effectiveTokens).toBe(1000);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('doubles tokens for AGENT_SWARM', () => {
    const result = meterTokens(1000, 'AGENT_SWARM', 'p2p');
    expect(result.multiplier).toBe(2.0);
    expect(result.effectiveTokens).toBe(2000);
  });

  it('triples tokens for FULL_AUTONOMOUS', () => {
    const result = meterTokens(1000, 'FULL_AUTONOMOUS', '6mo');
    expect(result.multiplier).toBe(3.0);
    expect(result.effectiveTokens).toBe(3000);
  });

  it('uses P2P rate for p2p tier', () => {
    const p2p = meterTokens(1000, 'CODE_GEN', 'p2p');
    const sub = meterTokens(1000, 'CODE_GEN', '6mo');
    // P2P rate ($0.01/token) is much higher than overage rate ($0.00006/token)
    expect(p2p.costUsd).toBeGreaterThan(sub.costUsd);
  });
});

describe('checkAllowance', () => {
  it('returns within=true when under quota', () => {
    const result = checkAllowance('6mo', 100_000);
    expect(result.within).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.overage).toBe(0);
  });

  it('returns overage when over quota+buffer', () => {
    const result = checkAllowance('3mo', 200_000); // 3mo = 100K + 50K buffer = 150K ceiling
    expect(result.within).toBe(false);
    expect(result.overage).toBe(50_000); // 200K - 150K
  });

  it('p2p always returns within=true', () => {
    const result = checkAllowance('p2p', 999_999);
    expect(result.within).toBe(true);
  });
});

describe('checkAgentLimit', () => {
  it('enforces tier agent limit', () => {
    const within = checkAgentLimit('3mo', 3); // 3mo = 5 agents
    expect(within.within).toBe(true);
    expect(within.limit).toBe(5);

    const over = checkAgentLimit('3mo', 10);
    expect(over.within).toBe(false);
  });

  it('p2p has no limit (metered)', () => {
    const result = checkAgentLimit('p2p', 100);
    expect(result.within).toBe(true);
    expect(result.limit).toBe(0);
  });
});

describe('calculatePillarAddon', () => {
  it('standard across all pillars is 0%', () => {
    const result = calculatePillarAddon('standard', 'standard', 'standard');
    expect(result.total).toBe(0);
  });

  it('maximum across all pillars stacks correctly', () => {
    const result = calculatePillarAddon('maximum', 'maximum', 'maximum');
    // 35% + 45% + 50% = 130%
    expect(result.total).toBeCloseTo(1.30, 2);
  });
});

describe('calculateFees', () => {
  it('subscription invoice has maintenance fee only', () => {
    const fees = calculateFees(false);
    expect(fees.maintenanceFee).toBe(5.00);
    expect(fees.transactionFee).toBe(0);
    expect(fees.totalFees).toBe(5.00);
    expect(fees.savingsUserPortion).toBeCloseTo(3.50, 2); // 70% of $5
    expect(fees.savingsPlatformPortion).toBeCloseTo(1.50, 2); // 30% of $5
  });

  it('P2P transaction includes transaction fee', () => {
    const fees = calculateFees(true, 3);
    expect(fees.transactionFee).toBeCloseTo(2.97, 2); // 3 × $0.99
    expect(fees.totalFees).toBeCloseTo(7.97, 2); // $5 + $2.97
  });
});

describe('generateInvoiceLineItems', () => {
  it('generates line items with savings credit', () => {
    const items = generateInvoiceLineItems('6mo', 10_000, 0);
    // Should have: maintenance fee + savings credit
    const feeItem = items.find(i => i.category === 'fee');
    const savingsItem = items.find(i => i.category === 'savings_credit');
    expect(feeItem).toBeDefined();
    expect(savingsItem).toBeDefined();
    expect(savingsItem!.total).toBeLessThan(0); // credit is negative
  });

  it('includes overage line item when tokens exceeded', () => {
    const items = generateInvoiceLineItems('3mo', 50_000, 0);
    const overageItem = items.find(i => i.category === 'overage');
    expect(overageItem).toBeDefined();
    expect(overageItem!.total).toBeGreaterThan(0);
  });
});
