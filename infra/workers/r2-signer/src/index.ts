/**
 * AIMS R2 Signer Worker
 *
 * Generates presigned download URLs for R2 objects and handles direct
 * uploads/downloads. Called by the UEF Gateway for export bundles,
 * plug artifacts, and agent data.
 *
 * Endpoints:
 *   POST /sign    — Generate a presigned download URL for an R2 object
 *   POST /upload  — Upload an object to R2
 *   GET  /health  — Health check
 */

export interface Env {
  EXPORTS_BUCKET: R2Bucket;
  SIGNING_SECRET: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGIN: string;
}

interface SignRequest {
  key: string;
  expiresIn?: number; // seconds, default 3600
  disposition?: string; // Content-Disposition for download
}

interface UploadRequest {
  key: string;
  contentType?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(env.ALLOWED_ORIGIN, request);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case '/sign':
          return handleSign(request, env, corsHeaders);
        case '/upload':
          return handleUpload(request, env, corsHeaders);
        case '/download':
          return handleDownload(request, env, corsHeaders);
        case '/delete':
          return handleDelete(request, env, corsHeaders);
        case '/list':
          return handleList(request, env, corsHeaders);
        case '/health':
          return json({ status: 'ok', worker: 'aims-r2-signer', env: env.ENVIRONMENT }, corsHeaders);
        default:
          return json({ error: 'Not found' }, corsHeaders, 404);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return json({ error: message }, corsHeaders, 500);
    }
  },
};

// ---------------------------------------------------------------------------
// Auth — validate requests come from our gateway
// ---------------------------------------------------------------------------

function validateAuth(request: Request, secret: string): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  // Bearer <signing-secret>
  const token = auth.replace('Bearer ', '');
  return token === secret;
}

// ---------------------------------------------------------------------------
// POST /sign — Generate presigned download URL
// ---------------------------------------------------------------------------

async function handleSign(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, cors, 405);
  }

  if (!validateAuth(request, env.SIGNING_SECRET)) {
    return json({ error: 'Unauthorized' }, cors, 401);
  }

  const body = await request.json<SignRequest>();
  if (!body.key) {
    return json({ error: 'key is required' }, cors, 400);
  }

  // Check the object exists
  const obj = await env.EXPORTS_BUCKET.head(body.key);
  if (!obj) {
    return json({ error: 'Object not found', key: body.key }, cors, 404);
  }

  // Generate a time-limited signed path via the Worker itself.
  // The Worker acts as the signer — clients hit /download?token=xxx&key=yyy
  const expiresIn = Math.min(body.expiresIn || 3600, 86400); // Max 24h
  const expiresAt = Date.now() + expiresIn * 1000;
  const token = await generateToken(body.key, expiresAt, env.SIGNING_SECRET);

  const workerUrl = new URL(request.url);
  const signedUrl = `${workerUrl.origin}/download?key=${encodeURIComponent(body.key)}&token=${token}&expires=${expiresAt}`;

  return json({
    url: signedUrl,
    key: body.key,
    size: obj.size,
    expiresAt: new Date(expiresAt).toISOString(),
  }, cors);
}

// ---------------------------------------------------------------------------
// GET /download?key=xxx&token=xxx&expires=xxx — Serve R2 object
// ---------------------------------------------------------------------------

async function handleDownload(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, cors, 405);
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const token = url.searchParams.get('token');
  const expires = url.searchParams.get('expires');

  if (!key || !token || !expires) {
    return json({ error: 'Missing key, token, or expires parameter' }, cors, 400);
  }

  const expiresAt = parseInt(expires, 10);
  if (Date.now() > expiresAt) {
    return json({ error: 'Link expired' }, cors, 410);
  }

  // Verify the token
  const expected = await generateToken(key, expiresAt, env.SIGNING_SECRET);
  if (token !== expected) {
    return json({ error: 'Invalid token' }, cors, 403);
  }

  // Fetch from R2
  const obj = await env.EXPORTS_BUCKET.get(key);
  if (!obj) {
    return json({ error: 'Object not found' }, cors, 404);
  }

  // Determine filename from key (last segment)
  const filename = key.split('/').pop() || 'download';

  const headers = new Headers(cors as Record<string, string>);
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Content-Length', obj.size.toString());
  headers.set('Cache-Control', 'private, no-cache');
  headers.set('ETag', obj.etag);

  return new Response(obj.body, { headers });
}

// ---------------------------------------------------------------------------
// POST /upload — Upload object to R2
// ---------------------------------------------------------------------------

async function handleUpload(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, cors, 405);
  }

  if (!validateAuth(request, env.SIGNING_SECRET)) {
    return json({ error: 'Unauthorized' }, cors, 401);
  }

  const key = request.headers.get('X-R2-Key');
  if (!key) {
    return json({ error: 'X-R2-Key header is required' }, cors, 400);
  }

  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

  const obj = await env.EXPORTS_BUCKET.put(key, request.body, {
    httpMetadata: { contentType },
  });

  return json({
    uploaded: true,
    key,
    size: obj.size,
    etag: obj.etag,
  }, cors);
}

// ---------------------------------------------------------------------------
// POST /delete — Delete object from R2
// ---------------------------------------------------------------------------

async function handleDelete(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, cors, 405);
  }

  if (!validateAuth(request, env.SIGNING_SECRET)) {
    return json({ error: 'Unauthorized' }, cors, 401);
  }

  const body = await request.json<{ key: string }>();
  if (!body.key) {
    return json({ error: 'key is required' }, cors, 400);
  }

  await env.EXPORTS_BUCKET.delete(body.key);
  return json({ deleted: true, key: body.key }, cors);
}

// ---------------------------------------------------------------------------
// POST /list — List objects in R2 bucket
// ---------------------------------------------------------------------------

async function handleList(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, cors, 405);
  }

  if (!validateAuth(request, env.SIGNING_SECRET)) {
    return json({ error: 'Unauthorized' }, cors, 401);
  }

  const body = await request.json<{ prefix?: string; limit?: number }>();

  const listed = await env.EXPORTS_BUCKET.list({
    prefix: body.prefix,
    limit: Math.min(body.limit || 100, 1000),
  });

  return json({
    objects: listed.objects.map(o => ({
      key: o.key,
      size: o.size,
      etag: o.etag,
      uploaded: o.uploaded.toISOString(),
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
  }, cors);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

async function generateToken(key: string, expiresAt: number, secret: string): Promise<string> {
  const data = `${key}:${expiresAt}:${secret}`;
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
  false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', keyData, encoder.encode(data));
  // Convert to hex
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCorsHeaders(allowedOrigin: string, request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  // Allow the configured origin, plus localhost for dev
  const allowed = origin === allowedOrigin || origin.startsWith('http://localhost');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-R2-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data: unknown, cors: HeadersInit, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(cors as Record<string, string>),
    },
  });
}
