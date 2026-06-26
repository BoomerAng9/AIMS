/**
 * UEF Gateway -- Operations Floor Matting Client (Stage 7.5)
 * ============================================================
 * Calls the Python matting service to turn a Seedance character MP4
 * into a VP9-alpha WebM ready for the Compositor (Stage 8+9) to
 * overlay on the Cosmos environment video without the old
 * `mix-blend-mode: screen` hack.
 *
 * Deployed service: services/operations-floor-matting/DEPLOY.md
 * Service URL via env: OPERATIONS_FLOOR_MATTING_URL
 * Bearer token via env: OPERATIONS_FLOOR_MATTING_TOKEN (required)
 *
 * Pure module: one POST + parse. Retries / caching / circuit-breaking
 * belong to the Gate 3 orchestrator, not this client.
 */

// ─── Types (mirror the FastAPI Pydantic schema) ─────────────────────

export interface MatteRequest {
  /** HTTPS URL of the character MP4 to matte (GCS signed URL in prod). */
  sourceUrl: string;
  /** Destination gs:// URI. Must end in .webm (VP9 alpha) or .mov (ProRes 4444). */
  outputGcsUri: string;
  /** Source event id for tracing back to the CRUCIBLE event. */
  sourceEventId?: string;
  /**
   * Minimum average foreground ratio required to accept the output.
   * Default on the server is 0.002 (0.2%). Set higher to be stricter.
   * The server returns HTTP 422 if the actual ratio falls below this.
   */
  emptyMatteThreshold?: number;
}

export interface MatteResponse {
  output_gcs_uri: string;
  duration_s: number;
  frame_count: number;
  size_bytes: number;
  backend: string;
  source_event_id?: string;
  avg_foreground_ratio: number;
}

export interface MattingHealth {
  status: 'ok' | 'warming';
  backend: string;
  ready: boolean;
}

/** Discriminated error class so callers can branch on the specific failure mode. */
export class MattingClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly kind:
      | 'auth'
      | 'source_too_big'
      | 'source_fetch_failed'
      | 'empty_matte'
      | 'server_error'
      | 'network'
      | 'malformed',
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'MattingClientError';
  }
}

// ─── Configuration ──────────────────────────────────────────────────

export interface MattingClientConfig {
  /** Service base URL. Default: OPERATIONS_FLOOR_MATTING_URL env. */
  serviceUrl?: string;
  /** Bearer token. REQUIRED. Default: OPERATIONS_FLOOR_MATTING_TOKEN env. */
  bearerToken?: string;
  /** Per-request timeout ms. Default 15 min (worst-case 6s @ 24fps render). */
  timeoutMs?: number;
}

function resolveConfig(cfg: MattingClientConfig): {
  base: string;
  token: string;
  timeoutMs: number;
} {
  const rawUrl = cfg.serviceUrl ?? process.env.OPERATIONS_FLOOR_MATTING_URL ?? '';
  if (!rawUrl) {
    throw new Error(
      'matting-client: service URL missing (set OPERATIONS_FLOOR_MATTING_URL or pass serviceUrl)'
    );
  }
  const token = cfg.bearerToken ?? process.env.OPERATIONS_FLOOR_MATTING_TOKEN ?? '';
  if (!token) {
    throw new Error(
      'matting-client: bearer token missing (set OPERATIONS_FLOOR_MATTING_TOKEN or pass bearerToken)'
    );
  }
  return {
    base: rawUrl.replace(/\/+$/, ''),
    token,
    timeoutMs: cfg.timeoutMs ?? 15 * 60_000,
  };
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Submit a character video for background matting. Resolves to the
 * uploaded WebM-alpha GCS URI on success. Throws `MattingClientError`
 * with a discriminated `kind` on failure so the orchestrator can
 * differentiate e.g. "subject not detected" (retryable with a
 * different Seedance prompt) from "bearer rejected" (config bug).
 */
export async function matteCharacterVideo(
  req: MatteRequest,
  cfg: MattingClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<MatteResponse> {
  const { base, token, timeoutMs } = resolveConfig(cfg);

  const body = {
    source_url: req.sourceUrl,
    output_gcs_uri: req.outputGcsUri,
    source_event_id: req.sourceEventId,
    empty_matte_threshold: req.emptyMatteThreshold,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(`${base}/matte`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw toClientError(res.status, text);
    }

    const data = (await res.json()) as MatteResponse;
    if (!data.output_gcs_uri) {
      throw new MattingClientError(
        'malformed response (missing output_gcs_uri)',
        200,
        'malformed'
      );
    }
    return data;
  } catch (e) {
    if (e instanceof MattingClientError) throw e;
    if ((e as { name?: string })?.name === 'AbortError') {
      throw new MattingClientError(
        `timed out after ${timeoutMs}ms`,
        0,
        'network'
      );
    }
    throw new MattingClientError(String(e), 0, 'network');
  } finally {
    clearTimeout(timer);
  }
}

export async function mattingHealth(
  cfg: MattingClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<MattingHealth> {
  const { base } = resolveConfig(cfg);
  // /health is intentionally unauthenticated — it's a readiness probe
  // for the orchestrator, not a user-facing surface.
  const res = await fetchImpl(`${base}/health`);
  if (!res.ok) {
    throw new MattingClientError(`health HTTP ${res.status}`, res.status, 'server_error');
  }
  return (await res.json()) as MattingHealth;
}

// ─── Internals ──────────────────────────────────────────────────────

function toClientError(status: number, text: string): MattingClientError {
  const snippet = text.slice(0, 400);
  switch (status) {
    case 401:
      return new MattingClientError('bad bearer', status, 'auth', snippet);
    case 413:
      return new MattingClientError('source too big', status, 'source_too_big', snippet);
    case 422:
      return new MattingClientError(
        'empty matte (subject likely not detected)',
        status,
        'empty_matte',
        snippet
      );
    case 502:
      return new MattingClientError(
        'source fetch failed',
        status,
        'source_fetch_failed',
        snippet
      );
    default:
      return new MattingClientError(
        `matting HTTP ${status} -- ${snippet}`,
        status,
        'server_error',
        snippet
      );
  }
}
