/**
 * UEF Gateway -- Puter.fs Client (Stage 10: Storage + Delivery)
 * ==============================================================
 * Uploads the composited Operations Floor MP4 from GCS (Compositor
 * output, Stage 9) into Puter.fs and returns a public playback URL
 * the Puter-native viewer app at services/operations-floor-viewer/
 * can load directly.
 *
 * Routes through Puter's public REST API. The `puter.js` browser SDK
 * is used by the viewer app itself; this module is Node-side only.
 *
 * Gate 2.f MVP contract:
 *   uploadComposedClip({ sourceUrl, puterPath, sourceEventId })
 *     -> { puterUrl, puterPath, publicPlaybackUrl }
 *
 * Retries, resumable uploads, and a real Puter OAuth flow come at
 * Gate 3 when the orchestrator owns the delivery leg. This module is
 * pure: one download + one upload + one link creation call.
 *
 * Env:
 *   PUTER_API_TOKEN    -- Puter API token (API keys page in Puter)
 *   PUTER_API_BASE     -- default https://api.puter.com
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface UploadComposedClipRequest {
  /**
   * Source URL to fetch the composed MP4 from. Most commonly a GCS
   * signed URL produced by the compositor, but any HTTPS URL the
   * gateway can reach works.
   */
  sourceUrl: string;

  /** Target path inside the user's Puter.fs. Starts with `/`. */
  puterPath: string;

  /** Source event id -- propagated for traceability. */
  sourceEventId?: string;

  /** Mark the uploaded file public so the viewer can play without auth. */
  makePublic?: boolean;

  /** Content-type override. Defaults to video/mp4. */
  contentType?: string;
}

export interface UploadComposedClipResult {
  /** Puter.fs canonical URL (puter://...) */
  puterUrl: string;
  /** The requested puterPath, echoed for consumer convenience. */
  puterPath: string;
  /** Public HTTPS playback URL the viewer <video> element can load. */
  publicPlaybackUrl: string;
  /** File size in bytes, as reported by Puter after upload. */
  sizeBytes: number;
  /** Source event id, echoed. */
  sourceEventId?: string;
}

// ─── Configuration ──────────────────────────────────────────────────

export interface PuterClientConfig {
  /** API token. Default: PUTER_API_TOKEN env. */
  apiToken?: string;
  /** API base URL. Default: PUTER_API_BASE env or https://api.puter.com */
  apiBase?: string;
  /** Per-request timeout in ms. Default 5 min for upload. */
  timeoutMs?: number;
}

function resolveConfig(cfg: PuterClientConfig): {
  apiToken: string;
  apiBase: string;
  timeoutMs: number;
} {
  const apiToken = cfg.apiToken ?? process.env.PUTER_API_TOKEN ?? '';
  if (!apiToken) {
    throw new Error(
      'puter-client: PUTER_API_TOKEN missing (set env or pass apiToken)'
    );
  }
  const apiBase = (
    cfg.apiBase ??
    process.env.PUTER_API_BASE ??
    'https://api.puter.com'
  ).replace(/\/+$/, '');
  return { apiToken, apiBase, timeoutMs: cfg.timeoutMs ?? 5 * 60_000 };
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch the composed MP4 from `sourceUrl`, stream it into Puter.fs at
 * `puterPath`, optionally mark it public, and return a playback URL.
 */
export async function uploadComposedClip(
  req: UploadComposedClipRequest,
  cfg: PuterClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<UploadComposedClipResult> {
  if (!req.sourceUrl) {
    throw new Error('puter-client: sourceUrl is required');
  }
  if (!req.puterPath || !req.puterPath.startsWith('/')) {
    throw new Error(
      "puter-client: puterPath must start with '/' (e.g. '/operations-floor/night-port-v1.mp4')"
    );
  }

  const { apiToken, apiBase, timeoutMs } = resolveConfig(cfg);
  const contentType = req.contentType ?? 'video/mp4';

  // Step 1 -- pull the source MP4 into memory (OK for Gate 2.f: 6s
  // clips are ~10MB; streaming-proxy path lands at Gate 3).
  const srcRes = await fetchImpl(req.sourceUrl, { method: 'GET' });
  if (!srcRes.ok) {
    throw new Error(
      `puter-client: source fetch HTTP ${srcRes.status} (${req.sourceUrl.slice(0, 80)})`
    );
  }
  const body = await srcRes.arrayBuffer();
  const sizeBytes = body.byteLength;

  // Step 2 -- write to Puter.fs via the drivers/call RPC shape.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let puterUrl: string;
  try {
    const writeRes = await fetchImpl(`${apiBase}/drivers/call`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interface: 'puter-fs',
        method: 'write',
        args: {
          path: req.puterPath,
          data_base64: arrayBufferToBase64(body),
          content_type: contentType,
          overwrite: true,
        },
      }),
      signal: controller.signal,
    });

    if (!writeRes.ok) {
      const txt = await writeRes.text().catch(() => '');
      throw new Error(
        `puter-client: write HTTP ${writeRes.status} -- ${txt.slice(0, 400)}`
      );
    }

    const data = (await writeRes.json()) as {
      result?: { puter_url?: string };
    };
    puterUrl = data.result?.puter_url ?? `puter://${req.puterPath}`;
  } finally {
    clearTimeout(timer);
  }

  // Step 3 -- generate a public link (optional, required for the MVP
  // viewer which can't hold a Puter bearer token).
  let publicPlaybackUrl = puterUrl;
  if (req.makePublic !== false) {
    const linkRes = await fetchImpl(`${apiBase}/drivers/call`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interface: 'puter-fs',
        method: 'link',
        args: { path: req.puterPath, public: true },
      }),
    });

    if (!linkRes.ok) {
      const txt = await linkRes.text().catch(() => '');
      throw new Error(
        `puter-client: link HTTP ${linkRes.status} -- ${txt.slice(0, 400)}`
      );
    }

    const linkData = (await linkRes.json()) as {
      result?: { url?: string };
    };
    publicPlaybackUrl = linkData.result?.url ?? publicPlaybackUrl;
  }

  return {
    puterUrl,
    puterPath: req.puterPath,
    publicPlaybackUrl,
    sizeBytes,
    sourceEventId: req.sourceEventId,
  };
}

// ─── Health probe ───────────────────────────────────────────────────

export interface PuterHealth {
  status: 'ok' | 'degraded' | 'error';
  reachable: boolean;
  whoami?: string;
}

/**
 * Light reachability probe against Puter. Does NOT perform a write.
 * Useful in the UEF Gateway's /health surface to confirm env wiring.
 */
export async function puterHealth(
  cfg: PuterClientConfig = {},
  fetchImpl: typeof fetch = fetch
): Promise<PuterHealth> {
  try {
    const { apiToken, apiBase } = resolveConfig(cfg);
    const res = await fetchImpl(`${apiBase}/whoami`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) {
      return { status: 'degraded', reachable: res.status !== undefined };
    }
    const data = (await res.json()) as { username?: string };
    return {
      status: 'ok',
      reachable: true,
      whoami: data.username,
    };
  } catch (e) {
    return {
      status: 'error',
      reachable: false,
    };
  }
}

// ─── Internals ──────────────────────────────────────────────────────

function arrayBufferToBase64(buf: ArrayBuffer): string {
  // Node 16+ supports Buffer.from(ArrayBuffer).toString('base64'); use
  // a path that works in both Node and modern browsers for portability.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buf).toString('base64');
  }
  // Browser / edge fallback
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunk, bytes.length))
    );
  }
  return btoa(binary);
}
