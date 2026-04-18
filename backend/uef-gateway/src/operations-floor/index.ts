/**
 * UEF Gateway — Operations Floor Event Translator
 * =================================================
 * First concrete module of Gate 2 for the 3D Operations Floor
 * ("Run a Company, Without the Company" premium vertical).
 *
 * Takes a CRUCIBLE event envelope (Planner / Generator / Judge_Hawk)
 * and emits the canonical action shape the downstream rendering
 * stages consume. This module is pure data transformation — no
 * network calls, no database, no state. Runs in-process inside the
 * existing UEF Gateway, no new service stood up.
 *
 * Contract (per gate-1.6-pipeline-audit.md, edges E1 + E2 + E7):
 *
 *   CrucibleEvent  →  translateCrucibleEvent()  →  TranslatedEvent
 *
 * Downstream consumers:
 *   • Stage 2  — Seedance 2.0 via fal.ai (uses narrative + scene_hint)
 *   • Stage 6  — Seedance 2.0 i2v for character motion (uses cast +
 *                  verb + camera_intent)
 *   • Stage 3+ — Headless 3D Proxy World Engine (uses scene_hint +
 *                  camera_intent)  — skipped in Gate 2 dry-run
 *
 * Three event types are supported in this first pass:
 *   - planner.dispatch       — Planner hands a mission to a Generator
 *   - generator.tool_call    — Generator invokes a tool
 *   - judge_hawk.verdict     — Judge_Hawk renders a sprint verdict
 *
 * Additional event types land in Gate 3+.
 *
 * References:
 *   - aims-skills/skills/live-look-in/references/gate-1.6-pipeline-audit.md
 *   - aims-skills/skills/live-look-in/references/gate-2-kickoff.md
 *   - aims-skills/skills/live-look-in/references/vertical-run-a-company-3d-engagement.md
 */

// ─── Canonical vocabulary (locked) ──────────────────────────────────
// Changing these values is a breaking schema change — bump the
// SCHEMA_VERSION constant and coordinate with the render orchestrator.

export const SCHEMA_VERSION = '1.0.0' as const;

/** Five canonical animation verbs per the Gate 1.6 audit. */
export const VERBS = [
  'dispatching',
  'typing',
  'walking',
  'consulting',
  'verdict',
] as const;
export type Verb = (typeof VERBS)[number];

/** Scene hints map to USD scenes in the scene library (Gate 3 onwards). */
export const SCENE_HINTS = [
  'night-port',
  'conference-room',
  'ops-floor',
  'break-room',
  'ceo-office',
] as const;
export type SceneHint = (typeof SCENE_HINTS)[number];

/** Event types we handle today. Unknown types fall through to null. */
export const EVENT_TYPES = [
  'planner.dispatch',
  'generator.tool_call',
  'judge_hawk.verdict',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// ─── Input shape: CRUCIBLE event envelope ───────────────────────────

export interface CrucibleEvent {
  /** UUID or ULID from the emitter; opaque to the translator. */
  event_id: string;
  /** One of EVENT_TYPES; anything else returns null. */
  event_type: string;
  /** Event-type-specific payload. Shape varies per type. */
  payload: Record<string, unknown>;
  /**
   * Character slugs hinted by the emitter (e.g. ["acheevy",
   * "port_ang"]). Translator may honor, override, or augment.
   */
  cast_hints?: string[];
}

// ─── Output shape: canonical action for downstream stages ───────────

export interface CameraIntent {
  /** Orbit the subject (e.g. full-body reveal). */
  orbit: boolean;
  /** Dolly from wide to close during the clip. */
  dolly_in: boolean;
  /** Follow subject as they move between stations. */
  follow: boolean;
  /** Over-the-shoulder framing (e.g. to show a workstation). */
  over_shoulder: boolean;
  /** Tight close-up on the subject's head/visor. */
  close_up: boolean;
}

export interface TranslatedEvent {
  schema_version: typeof SCHEMA_VERSION;
  /** Prompt-ready English. Feeds Seedance 2.0 storyboard (Stage 2). */
  narrative: string;
  /** Character slugs in frame, ordered by prominence. */
  cast: string[];
  /** Scene for the Headless 3D Proxy World to build (Stage 3). */
  scene_hint: SceneHint;
  /** Canonical verb driving the character motion clip (Stage 6). */
  verb: Verb;
  /** Camera choreography hints. */
  camera_intent: CameraIntent;
  /** Original event_id — makes debugging a rendered clip trivial. */
  source_event_id: string;
}

// ─── Guards ─────────────────────────────────────────────────────────

export function isKnownEventType(t: string): t is EventType {
  return (EVENT_TYPES as readonly string[]).includes(t);
}

function defaultCameraIntent(): CameraIntent {
  return {
    orbit: false,
    dolly_in: false,
    follow: false,
    over_shoulder: false,
    close_up: false,
  };
}

function firstString(
  v: unknown,
  fallback: string
): string {
  return typeof v === 'string' && v.trim().length > 0 ? v : fallback;
}

// ─── Handlers ───────────────────────────────────────────────────────

/**
 * Planner dispatches a mission brief to a Generator.
 * Canonical scene: ACHEEVY or Chicken Hawk hands a brief off.
 * Night Port is our canonical opening scene (matches deploy-landing hero).
 */
function handlePlannerDispatch(ev: CrucibleEvent): TranslatedEvent {
  const payload = ev.payload;
  const mission_title = firstString(payload.mission_title, 'a new mission');
  const assigned_to = firstString(payload.assigned_to, 'a Boomer_Ang');
  const dispatched_by = firstString(payload.dispatched_by, 'ACHEEVY');

  const cast = Array.from(
    new Set([
      dispatched_by.toLowerCase().replace(/\s+/g, '_'),
      assigned_to.toLowerCase().replace(/\s+/g, '_'),
      ...(ev.cast_hints ?? []),
    ])
  );

  return {
    schema_version: SCHEMA_VERSION,
    narrative:
      `${dispatched_by} dispatches a mission brief for ` +
      `"${mission_title}" to ${assigned_to} on the Night Port ops floor.`,
    cast,
    scene_hint: 'night-port',
    verb: 'dispatching',
    camera_intent: {
      ...defaultCameraIntent(),
      dolly_in: true,
      over_shoulder: false,
      follow: false,
    },
    source_event_id: ev.event_id,
  };
}

/**
 * Generator invokes a tool as part of a sprint.
 * Canonical scene: character at a workstation, typing.
 * Camera is over-the-shoulder to show work happening.
 */
function handleGeneratorToolCall(ev: CrucibleEvent): TranslatedEvent {
  const payload = ev.payload;
  const actor = firstString(payload.actor, 'a Lil_Hawk');
  const tool_name = firstString(payload.tool_name, 'a platform tool');

  const cast = Array.from(
    new Set([
      actor.toLowerCase().replace(/\s+/g, '_'),
      ...(ev.cast_hints ?? []),
    ])
  );

  return {
    schema_version: SCHEMA_VERSION,
    narrative:
      `${actor} invokes ${tool_name}, working at a tactical workstation ` +
      `on the Ops Floor.`,
    cast,
    scene_hint: 'ops-floor',
    verb: 'typing',
    camera_intent: {
      ...defaultCameraIntent(),
      over_shoulder: true,
    },
    source_event_id: ev.event_id,
  };
}

/**
 * Judge_Hawk renders a pass/fail verdict on a sprint contract.
 * Canonical scene: Judge_Hawk close-up, tactical CEO office or bench.
 * Camera is close-up for the dramatic beat.
 */
function handleJudgeHawkVerdict(ev: CrucibleEvent): TranslatedEvent {
  const payload = ev.payload;
  const sprint_id = firstString(payload.sprint_id, 'sprint');
  const outcome = firstString(payload.outcome, 'pending');
  const grader = firstString(payload.grader, 'Judge_Hawk');

  const cast = Array.from(
    new Set(['judge_hawk', ...(ev.cast_hints ?? [])])
  );

  return {
    schema_version: SCHEMA_VERSION,
    narrative:
      `${grader} renders verdict "${outcome}" on sprint "${sprint_id}" ` +
      `from the Judge's bench.`,
    cast,
    scene_hint: 'ceo-office',
    verb: 'verdict',
    camera_intent: {
      ...defaultCameraIntent(),
      close_up: true,
    },
    source_event_id: ev.event_id,
  };
}

// ─── Public entry ───────────────────────────────────────────────────

/**
 * Translate a CRUCIBLE event envelope into the canonical action
 * shape downstream stages consume. Returns null for unknown event
 * types so callers can decide whether to log-and-skip or hard-fail.
 */
export function translateCrucibleEvent(
  ev: CrucibleEvent
): TranslatedEvent | null {
  if (!isKnownEventType(ev.event_type)) return null;

  switch (ev.event_type as EventType) {
    case 'planner.dispatch':
      return handlePlannerDispatch(ev);
    case 'generator.tool_call':
      return handleGeneratorToolCall(ev);
    case 'judge_hawk.verdict':
      return handleJudgeHawkVerdict(ev);
  }
}
