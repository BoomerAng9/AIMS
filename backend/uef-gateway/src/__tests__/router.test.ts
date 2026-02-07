import { routeToAgents } from '../agents/router';

describe('Agent Router', () => {
  it('does not dispatch for ESTIMATE_ONLY', async () => {
    const result = await routeToAgents('ESTIMATE_ONLY', 'How much does X cost?', [], 'req-001');
    expect(result.executed).toBe(false);
    expect(result.agentOutputs).toHaveLength(0);
    expect(result.primaryAgent).toBeNull();
  });

  it('dispatches CHAT intent', async () => {
    const result = await routeToAgents(
      'CHAT',
      'Tell me about your services and pricing',
      ['Parse message', 'Retrieve context', 'Generate response'],
      'req-002'
    );
    expect(result.executed).toBe(true);
    expect(result.agentOutputs.length).toBeGreaterThan(0);
  });

  it('dispatches BUILD_PLUG to ChickenHawk + Quality_Ang', async () => {
    const result = await routeToAgents(
      'BUILD_PLUG',
      'Build a CRM plug with user management dashboard and API',
      ['Analyze spec', 'Build components', 'Run verification'],
      'req-003'
    );
    expect(result.executed).toBe(true);
    // Should have ChickenHawk output + Quality_Ang verification
    expect(result.agentOutputs.length).toBe(2);
    expect(result.primaryAgent).toBe('chicken-hawk');
  });

  it('dispatches RESEARCH to Analyst_Ang + Quality_Ang', async () => {
    const result = await routeToAgents(
      'RESEARCH',
      'Research competitor pricing in the SaaS market landscape',
      ['Decompose query', 'Gather data', 'Compile findings'],
      'req-004'
    );
    expect(result.executed).toBe(true);
    expect(result.agentOutputs.length).toBe(2);
    expect(result.primaryAgent).toBe('analyst-ang');
  });

  it('dispatches AGENTIC_WORKFLOW to ChickenHawk', async () => {
    const result = await routeToAgents(
      'AGENTIC_WORKFLOW',
      'Run a full product launch workflow with research, build, and deploy',
      ['Parse workflow', 'Execute stages', 'Verify output'],
      'req-005'
    );
    expect(result.executed).toBe(true);
    expect(result.agentOutputs.length).toBe(1);
    expect(result.primaryAgent).toBe('chicken-hawk');
  });

  it('handles unknown intent gracefully', async () => {
    const result = await routeToAgents(
      'UNKNOWN_INTENT',
      'Do something',
      [],
      'req-006'
    );
    expect(result.executed).toBe(false);
    expect(result.agentOutputs).toHaveLength(0);
  });
});
