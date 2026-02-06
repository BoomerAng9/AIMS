import { pmoRegistry, PMO_OFFICES } from '../pmo/registry';
import { houseOfAng } from '../pmo/house-of-ang';
import { runProcurementPipeline } from '../workflows/ats-procurement';

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

  it('DT-PMO has 3 team members', () => {
    const dtPmo = pmoRegistry.get('dt-pmo');
    expect(dtPmo).toBeDefined();
    expect(dtPmo!.team).toHaveLength(3);
    expect(dtPmo!.director.id).toBe('CDTO_Ang');
  });

  it('all 6 PMO IDs are unique', () => {
    const ids = pmoRegistry.list().map(o => o.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('getHouseConfig returns valid stats', () => {
    const config = pmoRegistry.getHouseConfig();
    expect(config.totalAngs).toBeGreaterThan(0);
    expect(config.activePmos).toBe(6);
    expect(config.spawnCapacity).toBeGreaterThan(0);
  });
});

describe('House of Ang', () => {
  it('has 14 Angs in initial roster (9 supervisory + 5 execution)', () => {
    const stats = houseOfAng.getStats();
    expect(stats.total).toBe(14);
    expect(stats.supervisory).toBe(9);
    expect(stats.execution).toBe(5);
  });

  it('lists all supervisory Angs as DEPLOYED', () => {
    const supervisory = houseOfAng.listByType('SUPERVISORY');
    expect(supervisory).toHaveLength(9);
    for (const ang of supervisory) {
      expect(ang.status).toBe('DEPLOYED');
    }
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

  it('can filter Angs by PMO', () => {
    const dtAngs = houseOfAng.listByPmo('dt-pmo');
    expect(dtAngs.length).toBeGreaterThanOrEqual(3);
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
    const ang = houseOfAng.assignToPmo('testang', 'innov-pmo');
    expect(ang.assignedPmo).toBe('innov-pmo');
  });

  it('can transition Ang status', () => {
    const ang = houseOfAng.setStatus('testang', 'DEPLOYED');
    expect(ang.status).toBe('DEPLOYED');
  });

  it('tracks spawn log', () => {
    const log = houseOfAng.getSpawnLog();
    expect(log.length).toBeGreaterThanOrEqual(15); // 14 seed + 1 test spawn
  });
});

describe('ATS Procurement Pipeline', () => {
  it('runs a full procurement pipeline', async () => {
    const pipeline = await runProcurementPipeline(
      'Consolidate all vendor contracts across IT infrastructure, office supplies, and professional services to achieve cost reduction through volume-based pricing',
      'test-proc-001'
    );

    expect(pipeline.pipelineId).toMatch(/^proc-/);
    expect(pipeline.status).toBe('COMPLETE');
    expect(pipeline.categories.length).toBeGreaterThan(0);
    expect(pipeline.rfpTemplates.length).toBeGreaterThan(0);
    expect(pipeline.bids.length).toBeGreaterThan(0);
    expect(pipeline.projections.length).toBeGreaterThan(0);
    expect(pipeline.totalProjectedSavings).toBeGreaterThan(0);
    expect(pipeline.governedBy).toBe('COO_Ang');
    expect(pipeline.executedBy).toContain('analyst-ang');
    expect(pipeline.executedBy).toContain('engineer-ang');
  });

  it('generates RFPs only for non-LOW consolidation categories', async () => {
    const pipeline = await runProcurementPipeline(
      'Optimize procurement across all spend categories and generate RFP templates for vendor consolidation',
      'test-proc-002'
    );

    for (const tmpl of pipeline.rfpTemplates) {
      const category = pipeline.categories.find(c => c.id === tmpl.categoryId);
      expect(category).toBeDefined();
      expect(category!.consolidationPotential).not.toBe('LOW');
    }
  });

  it('produces 3 bids per RFP template', async () => {
    const pipeline = await runProcurementPipeline(
      'Run full procurement analysis with vendor bid collection',
      'test-proc-003'
    );

    for (const tmpl of pipeline.rfpTemplates) {
      const templateBids = pipeline.bids.filter(b => b.rfpTemplateId === tmpl.templateId);
      expect(templateBids).toHaveLength(3);
    }
  });

  it('savings projections have positive savings for consolidatable categories', async () => {
    const pipeline = await runProcurementPipeline(
      'Project cost savings from vendor consolidation across all departments',
      'test-proc-004'
    );

    for (const proj of pipeline.projections) {
      expect(proj.savingsUsd).toBeGreaterThanOrEqual(0);
      expect(proj.projectedCost).toBeLessThanOrEqual(proj.currentCost);
    }
  });
});
