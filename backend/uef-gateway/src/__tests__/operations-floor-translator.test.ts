import {
  translateCrucibleEvent,
  isKnownEventType,
  SCHEMA_VERSION,
  VERBS,
  SCENE_HINTS,
  EVENT_TYPES,
  type CrucibleEvent,
} from '../operations-floor';

// ─── Fixtures ───────────────────────────────────────────────────────

function plannerDispatchFixture(
  overrides: Partial<CrucibleEvent> = {}
): CrucibleEvent {
  return {
    event_id: 'evt-planner-001',
    event_type: 'planner.dispatch',
    payload: {
      mission_title: 'Ship the Q2 pricing refresh',
      dispatched_by: 'ACHEEVY',
      assigned_to: 'Port_Ang',
    },
    cast_hints: [],
    ...overrides,
  };
}

function generatorToolCallFixture(
  overrides: Partial<CrucibleEvent> = {}
): CrucibleEvent {
  return {
    event_id: 'evt-gen-002',
    event_type: 'generator.tool_call',
    payload: {
      actor: 'Lil_Code_Hawk',
      tool_name: 'repo.search',
    },
    cast_hints: [],
    ...overrides,
  };
}

function judgeHawkVerdictFixture(
  overrides: Partial<CrucibleEvent> = {}
): CrucibleEvent {
  return {
    event_id: 'evt-judge-003',
    event_type: 'judge_hawk.verdict',
    payload: {
      sprint_id: 'sprint-2026-w16',
      outcome: 'pass',
      grader: 'Judge_Hawk',
    },
    cast_hints: [],
    ...overrides,
  };
}

// ─── Core contract ──────────────────────────────────────────────────

describe('Operations Floor — Event Translator', () => {
  describe('schema invariants', () => {
    it('exposes a locked schema version', () => {
      expect(SCHEMA_VERSION).toBe('1.0.0');
    });

    it('defines exactly the five canonical verbs from Gate 1.6 audit', () => {
      expect(VERBS).toEqual([
        'dispatching',
        'typing',
        'walking',
        'consulting',
        'verdict',
      ]);
    });

    it('defines exactly the five canonical scene hints', () => {
      expect(SCENE_HINTS).toEqual([
        'night-port',
        'conference-room',
        'ops-floor',
        'break-room',
        'ceo-office',
      ]);
    });

    it('knows the three event types handled in Gate 2', () => {
      expect(EVENT_TYPES).toEqual([
        'planner.dispatch',
        'generator.tool_call',
        'judge_hawk.verdict',
      ]);
    });
  });

  describe('isKnownEventType', () => {
    it('returns true for each supported event type', () => {
      expect(isKnownEventType('planner.dispatch')).toBe(true);
      expect(isKnownEventType('generator.tool_call')).toBe(true);
      expect(isKnownEventType('judge_hawk.verdict')).toBe(true);
    });

    it('returns false for unknown types', () => {
      expect(isKnownEventType('planner.whatever')).toBe(false);
      expect(isKnownEventType('')).toBe(false);
      expect(isKnownEventType('typo_hawk.verdikt')).toBe(false);
    });
  });

  describe('translateCrucibleEvent — planner.dispatch', () => {
    it('produces a dispatching verb on the Night Port scene', () => {
      const out = translateCrucibleEvent(plannerDispatchFixture());
      expect(out).not.toBeNull();
      expect(out!.verb).toBe('dispatching');
      expect(out!.scene_hint).toBe('night-port');
    });

    it('includes both parties in the cast, normalized to slugs', () => {
      const out = translateCrucibleEvent(plannerDispatchFixture())!;
      expect(out.cast).toContain('acheevy');
      expect(out.cast).toContain('port_ang');
    });

    it('dollies in but does not orbit', () => {
      const out = translateCrucibleEvent(plannerDispatchFixture())!;
      expect(out.camera_intent.dolly_in).toBe(true);
      expect(out.camera_intent.orbit).toBe(false);
    });

    it('propagates source_event_id for traceability', () => {
      const ev = plannerDispatchFixture({ event_id: 'evt-trace-xyz' });
      const out = translateCrucibleEvent(ev)!;
      expect(out.source_event_id).toBe('evt-trace-xyz');
    });

    it('merges cast_hints without duplicating', () => {
      const ev = plannerDispatchFixture({
        cast_hints: ['chicken_hawk', 'port_ang'],
      });
      const out = translateCrucibleEvent(ev)!;
      const uniq = new Set(out.cast);
      expect(uniq.size).toBe(out.cast.length);
      expect(out.cast).toContain('chicken_hawk');
    });
  });

  describe('translateCrucibleEvent — generator.tool_call', () => {
    it('produces a typing verb on the Ops Floor scene', () => {
      const out = translateCrucibleEvent(generatorToolCallFixture())!;
      expect(out.verb).toBe('typing');
      expect(out.scene_hint).toBe('ops-floor');
    });

    it('frames over-the-shoulder to show the work', () => {
      const out = translateCrucibleEvent(generatorToolCallFixture())!;
      expect(out.camera_intent.over_shoulder).toBe(true);
      expect(out.camera_intent.close_up).toBe(false);
    });

    it('includes the tool_name in the narrative', () => {
      const out = translateCrucibleEvent(
        generatorToolCallFixture({
          payload: { actor: 'Lil_Vuln_Hawk', tool_name: 'scanner.run' },
        })
      )!;
      expect(out.narrative).toContain('scanner.run');
    });
  });

  describe('translateCrucibleEvent — judge_hawk.verdict', () => {
    it('produces a verdict verb in the CEO office', () => {
      const out = translateCrucibleEvent(judgeHawkVerdictFixture())!;
      expect(out.verb).toBe('verdict');
      expect(out.scene_hint).toBe('ceo-office');
    });

    it('frames close-up for the dramatic beat', () => {
      const out = translateCrucibleEvent(judgeHawkVerdictFixture())!;
      expect(out.camera_intent.close_up).toBe(true);
    });

    it('always includes judge_hawk in the cast', () => {
      const out = translateCrucibleEvent(judgeHawkVerdictFixture())!;
      expect(out.cast).toContain('judge_hawk');
    });

    it('surfaces the outcome in the narrative', () => {
      const out = translateCrucibleEvent(
        judgeHawkVerdictFixture({
          payload: {
            sprint_id: 'sprint-x',
            outcome: 'fail',
            grader: 'Judge_Hawk',
          },
        })
      )!;
      expect(out.narrative).toContain('fail');
    });
  });

  describe('translateCrucibleEvent — unknown types', () => {
    it('returns null for unknown event_type (log-and-skip lane)', () => {
      const out = translateCrucibleEvent({
        event_id: 'evt-x',
        event_type: 'generator.future_expansion',
        payload: {},
      });
      expect(out).toBeNull();
    });
  });

  describe('translateCrucibleEvent — defensive defaults', () => {
    it('fills missing payload fields with safe fallbacks', () => {
      const out = translateCrucibleEvent({
        event_id: 'evt-empty',
        event_type: 'planner.dispatch',
        payload: {},
      })!;
      expect(out.narrative).toContain('ACHEEVY');
      expect(out.narrative).toContain('a new mission');
      expect(out.cast.length).toBeGreaterThan(0);
    });

    it('survives a payload with wrong field types', () => {
      const out = translateCrucibleEvent({
        event_id: 'evt-weird',
        event_type: 'judge_hawk.verdict',
        payload: { outcome: 42, sprint_id: null },
      })!;
      expect(out.verb).toBe('verdict');
    });
  });
});
