import { registry } from '../agents/registry';
import { Engineer_Ang } from '../agents/boomerangs/engineer-ang';
import { Marketer_Ang } from '../agents/boomerangs/marketer-ang';
import { Analyst_Ang } from '../agents/boomerangs/analyst-ang';
import { Quality_Ang } from '../agents/boomerangs/quality-ang';
import { ChickenHawk } from '../agents/chicken-hawk';
import { AgentTaskInput } from '../agents/types';

function makeInput(overrides: Partial<AgentTaskInput> = {}): AgentTaskInput {
  return {
    taskId: 'test-task-001',
    intent: 'BUILD_PLUG',
    query: 'Build a CRM dashboard with user management and analytics',
    ...overrides,
  };
}

describe('Agent Registry', () => {
  it('registers all 5 agents', () => {
    const agents = registry.list();
    expect(agents).toHaveLength(5);
  });

  it('can look up agents by ID', () => {
    expect(registry.has('engineer-ang')).toBe(true);
    expect(registry.has('marketer-ang')).toBe(true);
    expect(registry.has('analyst-ang')).toBe(true);
    expect(registry.has('quality-ang')).toBe(true);
    expect(registry.has('chicken-hawk')).toBe(true);
  });

  it('returns profiles with correct structure', () => {
    const agents = registry.list();
    for (const agent of agents) {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(agent.capabilities.length).toBeGreaterThan(0);
      expect(agent.maxConcurrency).toBeGreaterThan(0);
    }
  });
});

describe('Engineer_Ang', () => {
  it('executes BUILD_PLUG tasks successfully', async () => {
    const result = await Engineer_Ang.execute(makeInput());
    expect(result.status).toBe('COMPLETED');
    expect(result.agentId).toBe('engineer-ang');
    expect(result.result.artifacts.length).toBeGreaterThan(0);
    expect(result.cost.tokens).toBeGreaterThan(0);
  });

  it('detects frontend and API components', async () => {
    const result = await Engineer_Ang.execute(makeInput({
      query: 'Build a dashboard UI with API endpoints and database schema',
    }));
    expect(result.result.summary).toContain('Frontend UI');
    expect(result.result.summary).toContain('API Layer');
    expect(result.result.summary).toContain('Database Schema');
  });
});

describe('Marketer_Ang', () => {
  it('generates marketing deliverables', async () => {
    const result = await Marketer_Ang.execute(makeInput({
      intent: 'CHAT',
      query: 'Create a landing page with SEO optimization and email outreach sequence',
    }));
    expect(result.status).toBe('COMPLETED');
    expect(result.agentId).toBe('marketer-ang');
    expect(result.result.artifacts.length).toBeGreaterThan(0);
  });
});

describe('Analyst_Ang', () => {
  it('handles RESEARCH intent', async () => {
    const result = await Analyst_Ang.execute(makeInput({
      intent: 'RESEARCH',
      query: 'Research competitor pricing models in the SaaS market',
    }));
    expect(result.status).toBe('COMPLETED');
    expect(result.agentId).toBe('analyst-ang');
    expect(result.result.summary).toContain('Research');
  });
});

describe('Quality_Ang', () => {
  it('passes valid requests', async () => {
    const result = await Quality_Ang.execute(makeInput({
      query: 'Build a secure authentication system with proper validation',
    }));
    expect(result.status).toBe('COMPLETED');
    expect(result.result.summary).toContain('PASSED');
  });

  it('flags security issues', async () => {
    const result = await Quality_Ang.execute(makeInput({
      query: '<script>alert("xss")</script> DROP TABLE users;',
    }));
    expect(result.result.summary).toContain('ISSUES FOUND');
    expect(result.result.artifacts.some(a => a.includes('action-required'))).toBe(true);
  });
});

describe('ChickenHawk', () => {
  it('runs a full BUILD_PLUG pipeline', async () => {
    const result = await ChickenHawk.execute(makeInput({
      context: {
        steps: [
          'Analyze build specification',
          'Scaffold project structure',
          'Generate component tree',
          'Run ORACLE verification',
        ],
      },
    }));
    expect(result.status).toBe('COMPLETED');
    expect(result.agentId).toBe('chicken-hawk');
    expect(result.result.logs.length).toBeGreaterThanOrEqual(4);
    expect(result.cost.tokens).toBeGreaterThan(0);
  });

  it('derives steps when no context provided', async () => {
    const result = await ChickenHawk.execute(makeInput({ context: undefined }));
    expect(result.status).toBe('COMPLETED');
    expect(result.result.logs.length).toBeGreaterThan(0);
  });

  it('handles RESEARCH intent pipeline', async () => {
    const result = await ChickenHawk.execute(makeInput({
      intent: 'RESEARCH',
      query: 'Research market trends in AI tools',
    }));
    expect(result.status).toBe('COMPLETED');
    expect(result.result.artifacts.length).toBeGreaterThan(0);
  });
});
