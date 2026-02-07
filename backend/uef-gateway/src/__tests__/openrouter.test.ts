import { openrouter, MODELS, DEFAULT_MODEL } from '../llm';
import { AGENT_SYSTEM_PROMPTS } from '../llm/agent-prompts';
import { agentChat } from '../llm/agent-llm';
import { Engineer_Ang } from '../agents/boomerangs/engineer-ang';
import { Marketer_Ang } from '../agents/boomerangs/marketer-ang';
import { Analyst_Ang } from '../agents/boomerangs/analyst-ang';
import { Quality_Ang } from '../agents/boomerangs/quality-ang';

describe('OpenRouter LLM Module', () => {
  describe('Model Catalog', () => {
    it('has at least 5 models defined', () => {
      const models = Object.keys(MODELS);
      expect(models.length).toBeGreaterThanOrEqual(5);
    });

    it('each model has required pricing fields', () => {
      for (const spec of Object.values(MODELS)) {
        expect(spec.id).toBeDefined();
        expect(spec.name).toBeDefined();
        expect(spec.provider).toBeDefined();
        expect(typeof spec.inputPer1M).toBe('number');
        expect(typeof spec.outputPer1M).toBe('number');
        expect(spec.contextWindow).toBeGreaterThan(0);
        expect(['premium', 'standard', 'fast', 'economy']).toContain(spec.tier);
      }
    });

    it('DEFAULT_MODEL resolves to a valid model', () => {
      expect(MODELS[DEFAULT_MODEL]).toBeDefined();
      expect(MODELS[DEFAULT_MODEL].id).toContain('/');
    });

    it('lists models via openrouter.listModels()', () => {
      const list = openrouter.listModels();
      expect(list.length).toBeGreaterThanOrEqual(5);
      expect(list[0].id).toBeDefined();
    });
  });

  describe('Client State', () => {
    it('reports not configured when no API key is set', () => {
      // In test env, no OPENROUTER_API_KEY is set
      expect(openrouter.isConfigured()).toBe(false);
    });

    it('returns stub response when not configured', async () => {
      const result = await openrouter.prompt('Hello world');
      expect(result.content).toContain('LLM Offline');
      expect(result.model).toBe('stub');
      expect(result.tokens.total).toBe(0);
      expect(result.cost.usd).toBe(0);
    });

    it('chat returns stub response when not configured', async () => {
      const result = await openrouter.chat({
        model: 'claude-sonnet',
        messages: [
          { role: 'system', content: 'You are a test.' },
          { role: 'user', content: 'Test message' },
        ],
      });
      expect(result.content).toContain('LLM Offline');
      expect(result.tokens.total).toBe(0);
    });
  });

  describe('Agent System Prompts', () => {
    it('has prompts for all 5 core agents', () => {
      expect(AGENT_SYSTEM_PROMPTS['engineer-ang']).toBeDefined();
      expect(AGENT_SYSTEM_PROMPTS['marketer-ang']).toBeDefined();
      expect(AGENT_SYSTEM_PROMPTS['analyst-ang']).toBeDefined();
      expect(AGENT_SYSTEM_PROMPTS['quality-ang']).toBeDefined();
      expect(AGENT_SYSTEM_PROMPTS['chicken-hawk']).toBeDefined();
    });

    it('prompts reference A.I.M.S. and ACHIEVEMOR', () => {
      for (const prompt of Object.values(AGENT_SYSTEM_PROMPTS)) {
        expect(prompt).toContain('A.I.M.S.');
        expect(prompt).toContain('ACHIEVEMOR');
      }
    });

    it('prompts reference Boomer_Ang identity (except Chicken Hawk)', () => {
      expect(AGENT_SYSTEM_PROMPTS['engineer-ang']).toContain('Boomer_Ang');
      expect(AGENT_SYSTEM_PROMPTS['marketer-ang']).toContain('Boomer_Ang');
      expect(AGENT_SYSTEM_PROMPTS['analyst-ang']).toContain('Boomer_Ang');
      expect(AGENT_SYSTEM_PROMPTS['quality-ang']).toContain('Boomer_Ang');
    });
  });

  describe('Agent LLM Bridge', () => {
    it('returns null when OpenRouter is not configured', async () => {
      const result = await agentChat({
        agentId: 'engineer-ang',
        query: 'Build a dashboard',
        intent: 'BUILD_PLUG',
      });
      expect(result).toBeNull();
    });

    it('returns null for unknown agent ID', async () => {
      const result = await agentChat({
        agentId: 'nonexistent-agent',
        query: 'Test query',
        intent: 'CHAT',
      });
      expect(result).toBeNull();
    });
  });

  describe('Agents work in heuristic mode (no API key)', () => {
    // Existing agents must still work when OpenRouter is not configured
    const input = {
      taskId: 'openrouter-test-001',
      intent: 'BUILD_PLUG',
      query: 'Build a dashboard with analytics',
    };

    it('Engineer_Ang falls back to heuristics', async () => {
      const result = await Engineer_Ang.execute(input);
      expect(result.status).toBe('COMPLETED');
      expect(result.result.summary).toBeDefined();
      expect(result.result.logs).toContainEqual(
        expect.stringContaining('heuristic')
      );
    });

    it('Marketer_Ang falls back to heuristics', async () => {
      const result = await Marketer_Ang.execute({
        ...input,
        intent: 'CHAT',
        query: 'Write landing page copy for our SaaS product',
      });
      expect(result.status).toBe('COMPLETED');
      expect(result.result.logs).toContainEqual(
        expect.stringContaining('heuristic')
      );
    });

    it('Analyst_Ang falls back to heuristics', async () => {
      const result = await Analyst_Ang.execute({
        ...input,
        intent: 'RESEARCH',
        query: 'Research the competitive market landscape',
      });
      expect(result.status).toBe('COMPLETED');
      expect(result.result.logs).toContainEqual(
        expect.stringContaining('heuristic')
      );
    });

    it('Quality_Ang falls back to heuristics', async () => {
      const result = await Quality_Ang.execute(input);
      expect(result.status).toBe('COMPLETED');
      expect(result.result.logs).toContainEqual(
        expect.stringContaining('heuristic')
      );
    });
  });
});
