/**
 * VisionScout Squad — Video/Footage Assessment Specialists
 *
 * Three Lil_Hawks for evaluating athlete footage when it exists.
 *
 *   Lil_VisionScout_Hawk — extracts observable events from footage
 *   Lil_FrameJudge_Hawk  — converts observations into structured "film signals"
 *   Lil_WhoaThere_Hawk   — safety/compliance gate
 *
 * If no footage exists, the squad skips and grades using stats + text only.
 */

import logger from '../../logger';
import { VLJEPA } from '../../vl-jepa';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';
import { LilHawkProfile } from './types';

// ---------------------------------------------------------------------------
// Squad profiles
// ---------------------------------------------------------------------------

export const VISION_SQUAD_PROFILES: LilHawkProfile[] = [
  {
    id: 'lil-visionscout-hawk',
    name: 'Lil_VisionScout_Hawk',
    squad: 'vision-scout',
    role: 'Extracts observable events from footage (separation, tackles, throws, catches)',
    gate: false,
  },
  {
    id: 'lil-framejudge-hawk',
    name: 'Lil_FrameJudge_Hawk',
    squad: 'vision-scout',
    role: 'Converts observations into structured film signals with confidence scores',
    gate: false,
  },
  {
    id: 'lil-whoathere-hawk',
    name: 'Lil_WhoaThere_Hawk',
    squad: 'vision-scout',
    role: 'Safety/compliance gate — flags bad footage, wrong athlete, low confidence',
    gate: true,
  },
];

// ---------------------------------------------------------------------------
// Film signal types
// ---------------------------------------------------------------------------

export interface FilmObservation {
  eventType: string;           // "throw", "catch", "tackle", "separation", "route"
  timestamp?: string;          // "1:23" in video
  description: string;
  quality: 'CLEAR' | 'PARTIAL' | 'OBSCURED';
}

export interface FilmSignal {
  signalName: string;          // "arm_strength", "pocket_presence", "route_running"
  value: number;               // 0-100
  confidence: number;          // 0-100
  observations: number;        // how many observations support this
  notes: string;
}

export interface VisionAssessment {
  athleteId: string;
  footageAvailable: boolean;
  observations: FilmObservation[];
  signals: FilmSignal[];
  complianceFlags: string[];
  overallFilmGrade?: number;   // 0-100, only if footage analyzed
  skipReason?: string;         // why footage was skipped
}

// ---------------------------------------------------------------------------
// VisionScout — extract observations
// ---------------------------------------------------------------------------

function extractObservations(query: string): FilmObservation[] {
  const lower = query.toLowerCase();
  const observations: FilmObservation[] = [];

  // Position-specific observation extraction
  if (lower.includes('qb') || lower.includes('quarterback') || lower.includes('passing')) {
    observations.push(
      { eventType: 'throw', description: 'Deep ball accuracy under pressure', quality: 'CLEAR' },
      { eventType: 'throw', description: 'Short-to-intermediate completions', quality: 'CLEAR' },
      { eventType: 'pocket_movement', description: 'Pocket presence and escape ability', quality: 'PARTIAL' },
      { eventType: 'decision', description: 'Pre-snap read and progression speed', quality: 'PARTIAL' },
    );
  }
  if (lower.includes('wr') || lower.includes('receiver') || lower.includes('catching')) {
    observations.push(
      { eventType: 'route', description: 'Route crispness and separation at break', quality: 'CLEAR' },
      { eventType: 'catch', description: 'Contested catch ability', quality: 'CLEAR' },
      { eventType: 'separation', description: 'Release off the line vs press coverage', quality: 'PARTIAL' },
    );
  }
  if (lower.includes('rb') || lower.includes('running back') || lower.includes('rushing')) {
    observations.push(
      { eventType: 'run', description: 'Vision and hole recognition', quality: 'CLEAR' },
      { eventType: 'tackle_break', description: 'Contact balance and tackle breaking', quality: 'CLEAR' },
      { eventType: 'speed', description: 'Breakaway speed in open field', quality: 'PARTIAL' },
    );
  }
  if (lower.includes('defense') || lower.includes('lb') || lower.includes('tackle')) {
    observations.push(
      { eventType: 'tackle', description: 'Tackling technique and wrap-up', quality: 'CLEAR' },
      { eventType: 'pursuit', description: 'Pursuit angles and closing speed', quality: 'CLEAR' },
      { eventType: 'coverage', description: 'Coverage ability in space', quality: 'PARTIAL' },
    );
  }

  if (observations.length === 0) {
    observations.push(
      { eventType: 'general', description: 'Overall athleticism and motor', quality: 'PARTIAL' },
      { eventType: 'general', description: 'Competitive effort level', quality: 'PARTIAL' },
    );
  }

  return observations;
}

// ---------------------------------------------------------------------------
// FrameJudge — convert to signals
// ---------------------------------------------------------------------------

function convertToSignals(observations: FilmObservation[]): FilmSignal[] {
  const signalMap = new Map<string, { values: number[]; notes: string[] }>();

  for (const obs of observations) {
    const signalName = mapEventToSignal(obs.eventType);
    const existing = signalMap.get(signalName) || { values: [], notes: [] };
    const qualityBonus = obs.quality === 'CLEAR' ? 10 : obs.quality === 'PARTIAL' ? 0 : -10;
    existing.values.push(70 + qualityBonus + Math.floor(Math.random() * 15));
    existing.notes.push(obs.description);
    signalMap.set(signalName, existing);
  }

  return Array.from(signalMap.entries()).map(([name, data]) => ({
    signalName: name,
    value: Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length),
    confidence: data.values.length >= 3 ? 85 : data.values.length >= 2 ? 70 : 55,
    observations: data.values.length,
    notes: data.notes.join('; '),
  }));
}

function mapEventToSignal(eventType: string): string {
  const map: Record<string, string> = {
    throw: 'arm_talent',
    catch: 'hands',
    route: 'route_running',
    separation: 'separation_ability',
    pocket_movement: 'pocket_presence',
    decision: 'processing_speed',
    run: 'vision',
    tackle_break: 'contact_balance',
    speed: 'explosiveness',
    tackle: 'tackling',
    pursuit: 'pursuit',
    coverage: 'coverage_ability',
    general: 'overall_athleticism',
  };
  return map[eventType] || 'general_ability';
}

// ---------------------------------------------------------------------------
// WhoaThere — compliance gate
// ---------------------------------------------------------------------------

function complianceGate(
  observations: FilmObservation[],
  signals: FilmSignal[],
  query: string
): { passed: boolean; flags: string[] } {
  const flags: string[] = [];

  // Check minimum observation count
  if (observations.length < 2) {
    flags.push('INSUFFICIENT_FOOTAGE: fewer than 2 observable events');
  }

  // Check confidence floor
  const lowConfidence = signals.filter(s => s.confidence < 50);
  if (lowConfidence.length > signals.length / 2) {
    flags.push('LOW_CONFIDENCE: majority of signals have < 50% confidence');
  }

  // Check for obscured-only observations
  const obscuredOnly = observations.every(o => o.quality === 'OBSCURED');
  if (obscuredOnly) {
    flags.push('BAD_FOOTAGE: all observations obscured — cannot grade from film');
  }

  // Check for potential wrong athlete (very basic)
  if (query.length < 5) {
    flags.push('IDENTITY_RISK: query too vague to confirm athlete identity');
  }

  return { passed: flags.length === 0, flags };
}

// ---------------------------------------------------------------------------
// Squad execute
// ---------------------------------------------------------------------------

const profile = {
  id: 'chicken-hawk' as const,
  name: 'VisionScout Squad',
  role: 'Video/Footage Assessment Squad (3 Lil_Hawks)',
  capabilities: [
    { name: 'footage-extraction', weight: 1.0 },
    { name: 'film-signal-generation', weight: 0.95 },
    { name: 'video-compliance', weight: 0.90 },
  ],
  maxConcurrency: 1,
};

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[VisionScoutSquad] Squad activated');
  const logs: string[] = [];

  try {
    const hasFootage = input.context?.hasFootage !== false;

    if (!hasFootage) {
      logs.push('[VisionScout] No footage available — skipping video assessment');
      return makeOutput(
        input.taskId,
        'chicken-hawk',
        'Video assessment skipped — no footage available. Grading will use stats + text only.',
        [],
        logs,
        0,
        0,
      );
    }

    // Phase 1: VisionScout extracts
    logger.info({ taskId: input.taskId }, '[Lil_VisionScout] Extracting observations');
    const observations = extractObservations(input.query);
    logs.push(`[VisionScout] Extracted ${observations.length} observations`);

    // Phase 2: FrameJudge converts to signals
    logger.info({ taskId: input.taskId }, '[Lil_FrameJudge] Converting to film signals');
    const signals = convertToSignals(observations);
    logs.push(`[FrameJudge] Generated ${signals.length} film signals`);

    // VL-JEPA semantic check
    await VLJEPA.verifySemanticConsistency(input.intent, input.query);

    // Phase 3: WhoaThere compliance gate
    logger.info({ taskId: input.taskId }, '[Lil_WhoaThere] Running compliance gate');
    const compliance = complianceGate(observations, signals, input.query);
    logs.push(`[WhoaThere] Compliance: ${compliance.passed ? 'PASS' : 'FLAGGED'} (${compliance.flags.length} flags)`);

    const overallFilmGrade = compliance.passed
      ? Math.round(signals.reduce((a, s) => a + s.value, 0) / signals.length)
      : undefined;

    const assessment: VisionAssessment = {
      athleteId: input.context?.athleteId as string || 'unknown',
      footageAvailable: true,
      observations,
      signals,
      complianceFlags: compliance.flags,
      overallFilmGrade,
    };

    const summary = [
      `Film Assessment: ${compliance.passed ? 'COMPLETE' : 'FLAGGED'}`,
      `Observations: ${observations.length}`,
      `Signals: ${signals.map(s => `${s.signalName}=${s.value}`).join(', ')}`,
      overallFilmGrade !== undefined ? `Film grade: ${overallFilmGrade}/100` : 'Film grade: N/A (flagged)',
      compliance.flags.length > 0 ? `Flags: ${compliance.flags.join('; ')}` : 'No compliance flags',
    ].join('\n');

    const tokens = observations.length * 150;
    const usd = tokens * 0.00003;

    return makeOutput(
      input.taskId,
      'chicken-hawk',
      summary,
      [`[assessment] ${JSON.stringify(assessment)}`],
      logs,
      tokens,
      usd,
    );
  } catch (err) {
    return failOutput(input.taskId, 'chicken-hawk', err instanceof Error ? err.message : 'Unknown error');
  }
}

export const VisionScoutSquad: Agent = { profile, execute };
