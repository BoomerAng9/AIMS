import { pmoRegistry, PMO_OFFICES } from '../pmo/registry';
import { houseOfAng } from '../pmo/house-of-ang';

describe('PMO Registry', () => {
  it('has 6 PMO offices', () => {
    expect(PMO_OFFICES).toHaveLength(6);
    expect(pmoRegistry.list()).toHaveLength(6);
  });

  it('each office has an ACTIVE status', () => {
    for (const office of pmoRegistry.list()) {
      expect(office.status).toBe('ACTIVE');
    }
  });

  it('each office has a director reporting to ACHEEVY', () => {
    const directors = pmoRegistry.getDirectors();
    expect(directors).toHaveLength(6);
    for (const dir of directors) {
      expect(dir.reportsTo).toBe('ACHEEVY');
    }
  });

  it('TECH OFFICE has Boomer_CTO director and DevOps departmental agent', () => {
    const techOffice = pmoRegistry.get('tech-office');
    expect(techOffice).toBeDefined();
    expect(techOffice!.director.id).toBe('Boomer_CTO');
    expect(techOffice!.director.title).toBe('Chief Technology Officer');
    expect(techOffice!.departmentalAgent.name).toBe('DevOps Agent');
    expect(techOffice!.departmentalAgent.reportsTo).toBe('Boomer_CTO');
  });

  it('all 6 canonical offices exist with correct IDs', () => {
    const ids = pmoRegistry.list().map(o => o.id);
    expect(ids).toContain('tech-office');
    expect(ids).toContain('finance-office');
    expect(ids).toContain('ops-office');
    expect(ids).toContain('marketing-office');
    expect(ids).toContain('design-office');
    expect(ids).toContain('publishing-office');
    expect(new Set(ids).size).toBe(6);
  });

  it('each office has a departmental agent reporting to its director', () => {
    for (const office of pmoRegistry.list()) {
      expect(office.departmentalAgent).toBeDefined();
      expect(office.departmentalAgent.reportsTo).toBe(office.director.id);
    }
  });

  it('all 6 Boomer_ directors are present', () => {
    const directors = pmoRegistry.getDirectors();
    const dirIds = directors.map(d => d.id);
    expect(dirIds).toContain('Boomer_CTO');
    expect(dirIds).toContain('Boomer_CFO');
    expect(dirIds).toContain('Boomer_COO');
    expect(dirIds).toContain('Boomer_CMO');
    expect(dirIds).toContain('Boomer_CDO');
    expect(dirIds).toContain('Boomer_CPO');
  });

  it('all 6 departmental agents are present', () => {
    const agents = pmoRegistry.getDepartmentalAgents();
    const names = agents.map(a => a.name);
    expect(names).toContain('DevOps Agent');
    expect(names).toContain('Value Agent');
    expect(names).toContain('Flow Boss Agent');
    expect(names).toContain('Social Campaign Agent');
    expect(names).toContain('Video Editing Agent');
    expect(names).toContain('Social Agent');
  });

  it('getHouseConfig returns valid stats', () => {
    const config = pmoRegistry.getHouseConfig();
    expect(config.totalAngs).toBeGreaterThan(0);
    expect(config.activePmos).toBe(6);
    expect(config.spawnCapacity).toBeGreaterThan(0);
  });
});

describe('House of Ang', () => {
  it('has 17 Angs in initial roster (12 supervisory + 5 execution)', () => {
    const stats = houseOfAng.getStats();
    expect(stats.total).toBe(17);
    expect(stats.supervisory).toBe(12);
    expect(stats.execution).toBe(5);
  });

  it('lists all supervisory Angs as DEPLOYED', () => {
    const supervisory = houseOfAng.listByType('SUPERVISORY');
    expect(supervisory).toHaveLength(12);
    for (const ang of supervisory) {
      expect(ang.status).toBe('DEPLOYED');
    }
  });

  it('has 6 C-Suite Boomer_ directors in supervisory roster', () => {
    const supervisory = houseOfAng.listByType('SUPERVISORY');
    const names = supervisory.map(a => a.name);
    expect(names).toContain('Boomer_CTO');
    expect(names).toContain('Boomer_CFO');
    expect(names).toContain('Boomer_COO');
    expect(names).toContain('Boomer_CMO');
    expect(names).toContain('Boomer_CDO');
    expect(names).toContain('Boomer_CPO');
  });

  it('has 6 departmental agents in supervisory roster', () => {
    const supervisory = houseOfAng.listByType('SUPERVISORY');
    const names = supervisory.map(a => a.name);
    expect(names).toContain('DevOps Agent');
    expect(names).toContain('Value Agent');
    expect(names).toContain('Flow Boss Agent');
    expect(names).toContain('Social Campaign Agent');
    expect(names).toContain('Video Editing Agent');
    expect(names).toContain('Social Agent');
  });

  it('execution Angs have correct task counts', () => {
    const engineer = houseOfAng.get('engineer-ang');
    expect(engineer).toBeDefined();
    expect(engineer!.tasksCompleted).toBe(12);
    expect(engineer!.successRate).toBe(94);

    const hawk = houseOfAng.get('chicken-hawk');
    expect(hawk).toBeDefined();
    expect(hawk!.tasksCompleted).toBe(28);
  });

  it('can filter Angs by PMO office', () => {
    const techAngs = houseOfAng.listByPmo('tech-office');
    expect(techAngs.length).toBeGreaterThanOrEqual(2); // Boomer_CTO + DevOps Agent
  });

  it('spawns a new Ang', () => {
    const before = houseOfAng.getStats().total;
    const newAng = houseOfAng.spawn('TestAng', 'EXECUTION', 'Test Builder', 'Testing', ['Unit Tests']);
    expect(newAng.status).toBe('SPAWNING');
    expect(newAng.id).toBe('testang');
    expect(houseOfAng.getStats().total).toBe(before + 1);
  });

  it('rejects duplicate spawn', () => {
    expect(() => houseOfAng.spawn('TestAng', 'EXECUTION', 'Test', 'Test', [])).toThrow();
  });

  it('can assign Ang to PMO', () => {
    const ang = houseOfAng.assignToPmo('testang', 'tech-office');
    expect(ang.assignedPmo).toBe('tech-office');
  });

  it('can transition Ang status', () => {
    const ang = houseOfAng.setStatus('testang', 'DEPLOYED');
    expect(ang.status).toBe('DEPLOYED');
  });

  it('tracks spawn log', () => {
    const log = houseOfAng.getSpawnLog();
    expect(log.length).toBeGreaterThanOrEqual(18); // 17 seed + 1 test spawn
  });
});

