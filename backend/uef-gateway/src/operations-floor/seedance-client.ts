/**
 * UEF Gateway — Seedance 2.0 i2v Client (Stage 6 Character Motion)
 * ================================================================
 * Generates character-motion clips for the 3D Operations Floor by
 * feeding a canonical character reference PNG + a verb-derived motion
 * prompt into Seedance 2.0 image-to-video via OpenRouter.
 *
 * Consumes: TranslatedEvent from the Event Translator (Stage 1) + a
 * character reference image URL (e.g. Port_Ang's canonical portrait).
 *
 * Produces: video task handle + polling helper. Caller awaits completion
 * and receives the clip URL for compositing at Stage 8 (Remotion).
 *
 * Routes through OpenRouter (canonical video gateway per 2026-04-16
 * consolidation — supersedes direct fal.ai / Kie.ai paths). Seedance
 * 2.0 standard + fast variants selectable per call.
 *
 * Alpha-channel extraction is a downstream concern (Remotion chromakey
 * or dedicated matting service at Gate 2.e). This client returns a
 * plain MP4 — no alpha.
 *
 * References:
 *   - cti-hub/src/lib/video/openrouter-video.ts (sibling client for
 *     Broad|Cast / user-facing video)
 *   - Iller_Ang skill: references/seedance-video.md
 *   - gate-1.6-pipeline-audit.md — Stage 6 contract
 *   - gate-2-kickoff.md — Seedance i2v is the PRIMARY character-motion
 *     path; Higgsfield is the self-hosted fallback
 */

const OR_BASE = 'https://openrouter.ai';

// ─── Types ──────────────────────────────────────────────────────────

export type Verb =
  | 'dispatching'
  | 'typing'
  | 'walking'
  | 'consulting'
  | 'verdict';

export interface CameraIntent {
  orbit: boolean;
  dolly_in: boolean;
  follow: boolean;
  over_shoulder: boolean;
  close_up: boolean;
}

export interface CharacterClipRequest {
  /** Character reference image URL (public HTTPS). */
  characterRefUrl: string;
  /** Canonical verb from the Event Translator. */
  verb: Verb;
  /** Camera intent from the Event Translator (affects prompt shaping). */
  cameraIntent?: CameraIntent;
  /** Seconds of output video. Seedance 2.0 supports 3-15. */
  durationS?: number;
  /** Output aspect. Use 9:16 for Operations Floor full-body portraits. */
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9';
  /** Source event id — propagated for traceability. */
  sourceEventId?: string;
  /** 'fast' for dev iteration, 'standard' (default) for production clips. */
  quality?: 'standard' | 'fast';
}

export interface CharacterClipTask {
  taskId: string;
  status: string;
  sourceEventId?: string;
  error?: string;
}

export interface CharacterClipStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error' | 'unknown';
  progress?: number;
  /** Unsigned OpenRouter URL — requires Bearer auth to GET. */
  videoUrl?: string;
  error?: string;
}

// ─── Verb → motion prompt map ───────────────────────────────────────
// Seedance 2.0 i2v preserves subject identity from the reference image,
// so prompts only need to describe the MOTION + context, not the
// character. Keep these concise and unambiguous.

const VERB_PROMPTS: Record<Verb, string> = {
  dispatching:
    'the subject stands with composed authoritative posture and extends one gloved arm forward, presenting a holographic mission brief, measured and deliberate motion',
  typing:
    'the subject works rapidly at a holographic workstation, fingers gliding across a floating keyboard interface, focused forward gaze through the visor, minimal torso movement',
  walking:
    'the subject walks forward with purpose through the scene, steady tactical gait, shoulders squared, head level, arms swinging naturally',
  consulting:
    'the subject leans in slightly with measured attentive gestures, one gloved hand raised in open consulting pose, head tilting toward an unseen interlocutor, calm deliberative motion',
  verdict:
    'the subject delivers a decisive final gesture, one hand closing into a firm fist then opening flat in a ruling motion, stern commanding posture, unwavering stance',
};

function buildPrompt(
  verb: Verb,
  cameraIntent?: CameraIntent
): string {
  const motion = VERB_PROMPTS[verb];
  const cam: string[] = [];
  if (cameraIntent?.orbit) cam.push('slow orbital camera around the subject');
  if (cameraIntent?.dolly_in) cam.push('slow cinematic dolly-in');
  if (cameraIntent?.follow) cam.push('follow camera tracking the subject');
  if (cameraIntent?.over_shoulder) cam.push('over-the-shoulder framing');
  if (cameraIntent?.close_up) cam.push('tight close-up framing on the head and shoulders');

  const camSuffix = cam.length > 0 ? `. Camera: ${cam.join(', ')}` : '';

  return (
    `${motion}${camSuffix}. Cinematic night port environment: ` +
    `wet obsidian concrete, warm amber sodium lamps, faint cyan ` +
    `holographic grid. Photoreal quality, consistent subject identity, ` +
    `preserve the reference subject's exact appearance (visor, mask, ` +
    `hoodie, patches, colorway) — do not alter features or clothing.`
  );
}

// ─── Configuration ──────────────────────────────────────────────────

export interface SeedanceClientConfig {
  /** OpenRouter API key. Default: OPENROUTER_API_KEY env. */
  apiKey?: string;
  /** Max request timeout ms. */
  timeoutMs?: number;
}

function resolveKey(cfg: SeedanceClientConfig): string {
  const key = cfg.apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
  if (!key) {
    throw new Error(
      'seedance-client: OPENROUTER_API_KEY missing (set env or pass apiKey)'
    );
  }
  return key;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Kick off a character-motion clip. Returns a task handle; caller
 * polls via `pollCharacterClip(task.taskId)` until status='completed'.
 */
export async function generateCharacterClip(
  req: CharacterClipRequest,
  cfg: SeedanceClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<CharacterClipTask> {
  const apiKey = resolveKey(cfg);

  const model =
    req.quality === 'fast'
      ? 'bytedance/seedance-2.0-fast'
      : 'bytedance/seedance-2.0';

  const body: Record<string, unknown> = {
    model,
    prompt: buildPrompt(req.verb, req.cameraIntent),
    duration: req.durationS ?? 6,
    aspect_ratio: req.aspectRatio ?? '9:16',
    resolution: '1080p',
    generate_audio: false, // character clips don't need audio
    reference_image_urls: [req.characterRefUrl],
  };

  const res = await fetchImpl(`${OR_BASE}/api/v1/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeoutMs ?? 30_000),
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    error?: { message?: string } | string;
  };

  if (!res.ok || data.error) {
    const msg =
      (typeof data.error === 'object' ? data.error?.message : data.error) ||
      `OpenRouter HTTP ${res.status}`;
    return {
      taskId: '',
      status: 'error',
      sourceEventId: req.sourceEventId,
      error: String(msg),
    };
  }

  if (!data.id) {
    return {
      taskId: '',
      status: 'error',
      sourceEventId: req.sourceEventId,
      error: 'OpenRouter returned no task id',
    };
  }

  return {
    taskId: data.id,
    status: data.status ?? 'pending',
    sourceEventId: req.sourceEventId,
  };
}

/**
 * Poll OpenRouter for a character-clip task. Returns normalized status
 * + videoUrl (unsigned, requires Bearer auth to GET) when complete.
 */
export async function pollCharacterClip(
  taskId: string,
  cfg: SeedanceClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<CharacterClipStatus> {
  const apiKey = resolveKey(cfg);

  const res = await fetchImpl(`${OR_BASE}/api/v1/videos/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(cfg.timeoutMs ?? 10_000),
  });

  const data = (await res.json()) as {
    status?: string;
    progress?: number;
    unsigned_urls?: string[];
    error?: string;
  };

  if (!res.ok) {
    return { status: 'error', error: `HTTP ${res.status}` };
  }

  const rawStatus = data.status ?? 'unknown';
  const normalized: CharacterClipStatus['status'] =
    rawStatus === 'completed'
      ? 'completed'
      : rawStatus === 'failed'
        ? 'failed'
        : rawStatus === 'pending' || rawStatus === 'processing'
          ? 'processing'
          : (rawStatus as CharacterClipStatus['status']);

  return {
    status: normalized,
    progress: data.progress,
    videoUrl: data.unsigned_urls?.[0],
    error: data.error,
  };
}

/**
 * Await-to-completion convenience. Polls at `intervalMs` (default 5s)
 * up to `maxWaitMs` (default 5 min). Throws on timeout or failure.
 */
export async function awaitCharacterClip(
  taskId: string,
  cfg: SeedanceClientConfig & {
    intervalMs?: number;
    maxWaitMs?: number;
  } = {},
  fetchImpl: typeof fetch = fetch
): Promise<CharacterClipStatus> {
  const interval = cfg.intervalMs ?? 5_000;
  const maxWait = cfg.maxWaitMs ?? 5 * 60_000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const s = await pollCharacterClip(taskId, cfg, fetchImpl);
    if (s.status === 'completed') return s;
    if (s.status === 'failed' || s.status === 'error') {
      throw new Error(`seedance-client: clip ${taskId} ${s.status}: ${s.error ?? 'no error detail'}`);
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`seedance-client: clip ${taskId} timed out after ${maxWait}ms`);
}

// ─── Testing helpers (exported for unit tests) ──────────────────────

export { VERB_PROMPTS, buildPrompt };
