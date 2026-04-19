/**
 * UEF Gateway — Cosmos-Transfer2.5 Vertex AI Client
 * ==================================================
 * In-process client that POSTs prediction requests to the deployed
 * Cosmos-Transfer2.5 custom-container endpoint on GCP Vertex AI.
 *
 * Mirrors the pattern in services/boost-bridge/src/gcp/vertex-ai.ts
 * but scoped to the Cosmos use case (video-in / video-out rather than
 * JSON prediction). Same auth envelope, same Vertex predict URL.
 *
 * Endpoint contract defined at services/operations-floor-cosmos/DEPLOY.md
 * + services/operations-floor-cosmos/main.py.
 *
 * This module is deliberately pure: no Express routing, no in-process
 * caching, no retry loop. Caller (Gate 2.e or Gate 3 orchestrator)
 * handles retries, timeouts, and result caching.
 */

// ─── Types (mirror the FastAPI server Pydantic shapes) ──────────────

export interface ControlSpec {
  enabled: boolean;
  strength: number;
  source_gcs_uri?: string | null;
  canny_low_threshold?: number;
  canny_high_threshold?: number;
}

export interface MulticontrolSpec {
  depth?: ControlSpec;
  edge?: ControlSpec;
  segmentation?: ControlSpec;
  blur?: ControlSpec;
}

export interface InferenceSettings {
  guidance: number;
  steps: number;
  seed: number;
}

export interface CosmosPredictInstance {
  video_gcs_uri: string;
  prompt: string;
  negative_prompt?: string;
  multicontrol_spec?: MulticontrolSpec;
  inference?: InferenceSettings;
  output_gcs_prefix: string;
}

export interface CosmosPrediction {
  output_video_gcs_uri: string;
  frame_count: number;
  duration_s: number;
  inference_latency_s: number;
  gpu_seconds_used: number;
  seed: number;
  model: string;
}

export interface CosmosPredictResponse {
  predictions: CosmosPrediction[];
  deployedModelId?: string | null;
}

// ─── Configuration ──────────────────────────────────────────────────

export interface CosmosClientConfig {
  /** Full Vertex endpoint resource name or just the numeric id. */
  endpointId: string;
  /** GCP project id. Defaults to GCP_PROJECT_ID env. */
  projectId?: string;
  /** GCP region. Defaults to GCP_REGION env. */
  region?: string;
  /** Bearer token. Caller must refresh. Default from GCP_ACCESS_TOKEN. */
  accessToken?: string;
  /** Per-request timeout in ms. */
  timeoutMs?: number;
}

function resolveConfig(cfg: CosmosClientConfig): Required<CosmosClientConfig> {
  const endpointId = cfg.endpointId;
  if (!endpointId) throw new Error('cosmos-client: endpointId is required');

  const projectId =
    cfg.projectId ??
    process.env.GCP_PROJECT_ID ??
    'ai-managed-services';

  const region =
    cfg.region ?? process.env.GCP_REGION ?? 'us-central1';

  const accessToken =
    cfg.accessToken ?? process.env.GCP_ACCESS_TOKEN ?? '';

  if (!accessToken)
    throw new Error(
      'cosmos-client: access token missing (set GCP_ACCESS_TOKEN or pass accessToken)'
    );

  return {
    endpointId,
    projectId,
    region,
    accessToken,
    timeoutMs: cfg.timeoutMs ?? 15 * 60_000, // 15 min; Cosmos can be slow
  };
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Call the deployed Cosmos-Transfer2.5 endpoint with one or more
 * instances. Returns the parsed prediction payload on 2xx; throws
 * with the upstream error on non-2xx.
 */
export async function cosmosPredict(
  instances: CosmosPredictInstance[],
  cfg: CosmosClientConfig,
  fetchImpl: typeof fetch = fetch
): Promise<CosmosPredictResponse> {
  if (instances.length === 0) {
    throw new Error('cosmos-client: instances must not be empty');
  }

  const resolved = resolveConfig(cfg);
  const url = buildPredictUrl(resolved);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    resolved.timeoutMs
  );

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolved.accessToken}`,
      },
      body: JSON.stringify({ instances }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `cosmos-client: Vertex returned ${res.status}: ${text.slice(0, 500)}`
      );
    }

    const data = (await res.json()) as CosmosPredictResponse;
    if (!Array.isArray(data.predictions)) {
      throw new Error(
        'cosmos-client: malformed response — missing predictions[]'
      );
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lightweight liveness probe. Uses Vertex's custom-container health
 * route via the endpoint's REST surface.
 */
export async function cosmosHealth(
  cfg: CosmosClientConfig,
  fetchImpl: typeof fetch = fetch
): Promise<{
  status: string;
  gpu_available: boolean;
  cuda_version: string;
  cosmos_version: string;
  model_loaded: boolean;
}> {
  const resolved = resolveConfig(cfg);
  const url = buildHealthUrl(resolved);
  const res = await fetchImpl(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${resolved.accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`cosmos-client: health ${res.status}`);
  }
  return (await res.json()) as Awaited<ReturnType<typeof cosmosHealth>>;
}

// ─── URL builders (exported for test visibility) ────────────────────

export function buildPredictUrl(
  cfg: Required<CosmosClientConfig>
): string {
  const resourceName = normalizeEndpoint(cfg);
  return `https://${cfg.region}-aiplatform.googleapis.com/v1/${resourceName}:predict`;
}

export function buildHealthUrl(
  cfg: Required<CosmosClientConfig>
): string {
  // Vertex exposes custom container health via rawPredict or through
  // the endpoint's HTTP surface. For custom containers, the standard
  // approach is invoke-custom-command (gcloud) or private service
  // connect. For in-process calls, we hit rawPredict :rawPredict with
  // a health verb; DEPLOY.md documents the gcloud alternative.
  const resourceName = normalizeEndpoint(cfg);
  return `https://${cfg.region}-aiplatform.googleapis.com/v1/${resourceName}:rawPredict`;
}

export function normalizeEndpoint(
  cfg: Required<CosmosClientConfig>
): string {
  const id = cfg.endpointId;
  if (id.startsWith('projects/')) return id;
  return `projects/${cfg.projectId}/locations/${cfg.region}/endpoints/${id}`;
}
