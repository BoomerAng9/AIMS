/**
 * UEF Gateway -- Operations Floor Compositor Client (Stage 8 + 9)
 * =================================================================
 * Calls the Remotion + FFmpeg compositor service to stitch a Cosmos
 * environment MP4 (Stage 5 output) with a Seedance character MP4
 * (Stage 6 output) into a final composited MP4 (Stage 8), which the
 * service also encodes to H.264 and uploads to GCS (Stage 9).
 *
 * Deployed service: services/operations-floor-compositor/DEPLOY.md
 * Service URL via env: OPERATIONS_FLOOR_COMPOSITOR_URL
 *
 * This module is pure: one POST + parse. Retries / timeouts / caching
 * are the caller's responsibility (will live in the Gate 3 backend
 * orchestrator).
 */

// ─── Types (mirror the service Zod schema) ──────────────────────────

export interface CharacterPositioning {
  anchorX: number;
  anchorY: number;
  scale: number;
  fadeInFrames: number;
}

export interface ComposeRequest {
  environmentVideoUrl: string;
  /**
   * HTTPS URL of the **matted character clip** (VP9-alpha WebM or
   * ProRes 4444 MOV) produced by the operations-floor-matting service.
   * Raw Seedance output must be routed through that service first;
   * the compositor no longer accepts non-alpha character video
   * (`characterVideoUrl` was retired with the `mix-blend-mode: screen`
   * fake-alpha path).
   */
  characterCutoutUrl: string;
  durationSeconds?: number;
  fps?: 24 | 30;
  characterStartFrame?: number;
  characterPositioning?: CharacterPositioning;
  endLockupText?: string;
  outputGcsPrefix: string;
  sourceEventId?: string;
}

export interface ComposeResponse {
  output_video_gcs_uri: string;
  duration_s: number;
  frame_count: number;
  size_bytes: number;
  source_event_id?: string;
}

export interface CompositorHealth {
  status: string;
  service: string;
  stage: string;
  project: string;
  node: string;
}

// ─── Configuration ──────────────────────────────────────────────────

export interface CompositorClientConfig {
  /** Service base URL. Default: OPERATIONS_FLOOR_COMPOSITOR_URL env. */
  serviceUrl?: string;
  /** Optional bearer token; service is allow-unauthenticated by default. */
  bearerToken?: string;
  /** Per-request timeout ms. Default: 10 min (render-safe). */
  timeoutMs?: number;
}

function resolveUrl(cfg: CompositorClientConfig): string {
  const url = cfg.serviceUrl ?? process.env.OPERATIONS_FLOOR_COMPOSITOR_URL ?? '';
  if (!url) {
    throw new Error(
      'compositor-client: service URL missing (set OPERATIONS_FLOOR_COMPOSITOR_URL or pass serviceUrl)'
    );
  }
  return url.replace(/\/+$/, '');
}

// ─── Public API ─────────────────────────────────────────────────────

export async function composeNightPort(
  req: ComposeRequest,
  cfg: CompositorClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<ComposeResponse> {
  const base = resolveUrl(cfg);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg.bearerToken) {
    headers.Authorization = `Bearer ${cfg.bearerToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    cfg.timeoutMs ?? 10 * 60_000
  );

  try {
    const res = await fetchImpl(`${base}/compose`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `compositor-client: HTTP ${res.status} -- ${text.slice(0, 400)}`
      );
    }

    const data = (await res.json()) as ComposeResponse;
    if (!data.output_video_gcs_uri) {
      throw new Error(
        'compositor-client: malformed response (missing output_video_gcs_uri)'
      );
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function compositorHealth(
  cfg: CompositorClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<CompositorHealth> {
  const base = resolveUrl(cfg);
  const res = await fetchImpl(`${base}/health`, {
    method: 'GET',
    headers: cfg.bearerToken
      ? { Authorization: `Bearer ${cfg.bearerToken}` }
      : {},
  });
  if (!res.ok) {
    throw new Error(`compositor-client: health HTTP ${res.status}`);
  }
  return (await res.json()) as CompositorHealth;
}
