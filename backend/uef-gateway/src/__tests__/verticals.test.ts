import { verticalRegistry } from '../verticals';

describe('Verticals Registry', () => {
  it('has 3 verticals registered (II Agent, II Commons)', () => {
    const all = verticalRegistry.list();
    expect(all).toHaveLength(3);
  });

  it('has 1 Agent vertical', () => {
    const agents = verticalRegistry.listByCategory('AGENT');
    expect(agents).toHaveLength(1);
    expect(agents.map(v => v.id)).toEqual(
      expect.arrayContaining(['agent-zero'])
    );
  });

  it('has 2 Commons verticals', () => {
    const commons = verticalRegistry.listByCategory('COMMONS');
    expect(commons).toHaveLength(2);
    expect(commons.map(v => v.id)).toEqual(
      expect.arrayContaining(['claude-code', 'gemini-cli'])
    );
  });

  it('can look up verticals by ID', () => {
    expect(verticalRegistry.get('agent-zero')?.name).toBe('Agent Zero');
    expect(verticalRegistry.get('claude-code')?.name).toBe('Claude Code');
    expect(verticalRegistry.get('gemini-cli')?.name).toBe('Gemini CLI');
  });

  it('returns undefined for unknown IDs', () => {
    expect(verticalRegistry.get('nonexistent')).toBeUndefined();
  });

  it('each vertical has required fields', () => {
    for (const v of verticalRegistry.list()) {
      expect(v.id).toBeDefined();
      expect(v.name).toBeDefined();
      expect(v.category).toMatch(/^(AGENT|COMMONS)$/);
      expect(v.description).toBeDefined();
      expect(v.homepage).toMatch(/^https?:\/\//);
      expect(v.repo).toMatch(/^https?:\/\//);
      expect(v.install).toBeDefined();
      expect(v.invoke).toBeDefined();
      expect(v.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('Agent verticals use OpenRouter key', () => {
    const agents = verticalRegistry.listByCategory('AGENT');
    for (const agent of agents) {
      expect(agent.envKey).toBe('OPENROUTER_API_KEY');
    }
  });

  it('Commons verticals have distinct API keys', () => {
    const claude = verticalRegistry.get('claude-code');
    const gemini = verticalRegistry.get('gemini-cli');
    expect(claude?.envKey).toBe('ANTHROPIC_API_KEY');
    expect(gemini?.envKey).toBe('GEMINI_API_KEY');
  });

  it('getStats returns correct counts', () => {
    const stats = verticalRegistry.getStats();
    expect(stats.total).toBe(3);
    expect(stats.agents).toBe(1);
    expect(stats.commons).toBe(2);
  });

  it('Agent Zero has Docker image', () => {
    const az = verticalRegistry.get('agent-zero');
    expect(az?.dockerImage).toBe('frdel/agent-zero-run');
    expect(az?.port).toBe(50001);
  });

  it('CLI verticals have no Docker image', () => {
    const cc = verticalRegistry.get('claude-code');
    const gc = verticalRegistry.get('gemini-cli');
    expect(cc?.dockerImage).toBeNull();
    expect(gc?.dockerImage).toBeNull();
  });
});
