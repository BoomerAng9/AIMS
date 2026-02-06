import { cardStyleRegistry, BRYCE_YOUNG_CLASSIC } from '../perform/registry/card-styles';
import { runAthletePageFactory } from '../perform/pipeline/athlete-page-factory';
import { WorkflowSmithSquad } from '../agents/lil-hawks/workflow-smith-squad';
import { VisionScoutSquad } from '../agents/lil-hawks/vision-scout-squad';

describe('CardStyleRegistry', () => {
  it('has BryceYoung_Classic as default style', () => {
    const def = cardStyleRegistry.getDefault();
    expect(def.styleId).toBe('bryce-young-classic');
    expect(def.styleName).toBe('BryceYoung_Classic');
  });

  it('lists registered styles', () => {
    const styles = cardStyleRegistry.list();
    expect(styles.length).toBeGreaterThanOrEqual(1);
    expect(styles[0].styleId).toBe('bryce-young-classic');
  });

  it('falls back to default for unknown style ID', () => {
    const style = cardStyleRegistry.get('nonexistent-style');
    expect(style.styleId).toBe('bryce-young-classic');
  });

  it('BryceYoung_Classic has all required fields', () => {
    expect(BRYCE_YOUNG_CLASSIC.inputsRequired.length).toBeGreaterThan(0);
    expect(BRYCE_YOUNG_CLASSIC.slots.length).toBeGreaterThan(0);
    expect(BRYCE_YOUNG_CLASSIC.complianceRules.length).toBeGreaterThan(0);
    expect(BRYCE_YOUNG_CLASSIC.renderTargets).toContain('card_png');
  });

  it('validates missing inputs correctly', () => {
    const missing = cardStyleRegistry.validateInputs('bryce-young-classic', {});
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain('identity.firstName');
  });

  it('validates complete inputs', () => {
    const payload = {
      identity: {
        firstName: 'Bryce',
        lastName: 'Young',
        position: 'QB',
        school: 'Mater Dei',
        state: 'CA',
        classYear: 2020,
      },
      grade: { overallGrade: 98, tier: 'ELITE' },
      rank: { positionRank: 1 },
      media: { headshotUrl: 'https://example.com/photo.jpg' },
    };
    const missing = cardStyleRegistry.validateInputs('bryce-young-classic', payload);
    expect(missing).toHaveLength(0);
  });
});

describe('Athlete Page Factory', () => {
  it('produces a complete AthleteCardJSON', async () => {
    const result = await runAthletePageFactory({ athleteName: 'Bryce Young' });

    expect(result.athleteCard.contractVersion).toBe('1.0');
    expect(result.athleteCard.identity.firstName).toBe('Bryce');
    expect(result.athleteCard.identity.lastName).toBe('Young');
    expect(result.athleteCard.grade.overallGrade).toBeGreaterThanOrEqual(0);
    expect(result.athleteCard.grade.overallGrade).toBeLessThanOrEqual(100);
    expect(result.athleteCard.grade.tier).toBeDefined();
    expect(result.athleteCard.rank.cohortSize).toBeGreaterThan(0);
    expect(result.athleteCard.bioMemo.bio.length).toBeGreaterThan(20);
    expect(result.athleteCard.bioMemo.scoutMemo.length).toBeGreaterThan(20);
    expect(result.athleteCard.cardStyleId).toBe('bryce-young-classic');
  });

  it('returns artifacts with URLs', async () => {
    const result = await runAthletePageFactory({ athleteName: 'Test Athlete' });

    expect(result.artifacts.cardPngUrl).toBeDefined();
    expect(result.artifacts.webpageUrl).toBeDefined();
    expect(result.pipelineLog.length).toBeGreaterThanOrEqual(7);
  });

  it('tracks total cost', async () => {
    const result = await runAthletePageFactory({ athleteName: 'Cost Test' });

    expect(result.totalCost.tokens).toBeGreaterThan(0);
    expect(result.totalCost.usd).toBeGreaterThan(0);
  });

  it('uses specified card style', async () => {
    const result = await runAthletePageFactory({
      athleteName: 'Style Test',
      cardStyleId: 'bryce-young-classic',
    });
    expect(result.athleteCard.cardStyleId).toBe('bryce-young-classic');
  });
});

describe('WorkflowSmith Squad', () => {
  it('authors and validates an ingest workflow', async () => {
    const result = await WorkflowSmithSquad.execute({
      taskId: 'test-wf-001',
      intent: 'AGENTIC_WORKFLOW',
      query: 'Ingest CSV data and grade athletes',
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.result.summary).toContain('Workflow');
    expect(result.result.logs.length).toBeGreaterThan(0);
    expect(result.result.logs.some(l => l.includes('[WorkflowSmith]'))).toBe(true);
    expect(result.result.logs.some(l => l.includes('[Checkmark]'))).toBe(true);
    expect(result.result.logs.some(l => l.includes('[RedFlag]'))).toBe(true);
    expect(result.result.logs.some(l => l.includes('[Lockstep]'))).toBe(true);
  });

  it('generates a complete workflow for search + render + publish', async () => {
    const result = await WorkflowSmithSquad.execute({
      taskId: 'test-wf-002',
      intent: 'AGENTIC_WORKFLOW',
      query: 'Search Brave for athlete photos, render cards, and publish to CDN',
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.result.summary).toContain('Nodes');
  });
});

describe('VisionScout Squad', () => {
  it('skips when no footage available', async () => {
    const result = await VisionScoutSquad.execute({
      taskId: 'test-vs-001',
      intent: 'BUILD_PLUG',
      query: 'Evaluate QB film',
      context: { hasFootage: false },
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.result.summary).toContain('skipped');
  });

  it('extracts QB observations when footage exists', async () => {
    const result = await VisionScoutSquad.execute({
      taskId: 'test-vs-002',
      intent: 'BUILD_PLUG',
      query: 'Evaluate QB passing footage and pocket presence',
      context: { hasFootage: true, athleteId: 'ath-001' },
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.result.summary).toContain('Film Assessment');
    expect(result.result.logs.some(l => l.includes('[VisionScout]'))).toBe(true);
    expect(result.result.logs.some(l => l.includes('[FrameJudge]'))).toBe(true);
    expect(result.result.logs.some(l => l.includes('[WhoaThere]'))).toBe(true);
  });

  it('generates film signals for WR footage', async () => {
    const result = await VisionScoutSquad.execute({
      taskId: 'test-vs-003',
      intent: 'BUILD_PLUG',
      query: 'Evaluate WR receiver route running and catching ability',
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.result.summary).toContain('Signals');
  });
});
