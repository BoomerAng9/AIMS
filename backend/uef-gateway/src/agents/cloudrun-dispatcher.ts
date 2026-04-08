/**
 * Cloud Run Dispatcher — Triggers Chicken Hawk builds on GCP Cloud Run
 *
 * Two modes:
 *   1. Job mode   — One-off batch builds (chicken-hawk-build job)
 *   2. Service mode — Long-running interactive builds (chicken-hawk service)
 *
 * The dispatcher handles:
 *   - GCP auth via Application Default Credentials or service account key
 *   - Job execution with environment override (TASK_ID, MANIFEST_URL)
 *   - Service HTTP dispatch for interactive builds
 *   - Execution tracking and status polling
 *   - Fallback to local Chicken Hawk when Cloud Run is unavailable
 *
 * Called by: ACHEEVY orchestrator, pipeline workflows, deployment-hub
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GCP_PROJECT = process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'aims-aimanagedsolutions';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';
const CLOUD_RUN_JOB_NAME = 'chicken-hawk-build';
const CLOUD_RUN_SERVICE_NAME = 'chicken-hawk';
const CLOUD_RUN_BASE_URL = `https://${GCP_REGION}-run.googleapis.com`;

// Service account key JSON (base64 encoded) or path
const GCP_SA_KEY = process.env.GCP_SA_KEY_BASE64 || '';
const GCP_ACCESS_TOKEN = process.env.GCP_ACCESS_TOKEN || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudRunJobRequest {
  taskId: string;
  manifestUrl?: string;
  envOverrides?: Record<string, string>;
  timeout?: number; // seconds
}

export interface CloudRunJobResult {
  dispatched: boolean;
  executionId?: string;
  mode: 'job' | 'service' | 'local-fallback';
  error?: string;
}

export interface CloudRunServiceRequest {
  taskId: string;
  intent: string;
  query: string;
  steps?: string[];
  userId: string;
  context?: Record<string, unknown>;
}

export interface CloudRunServiceResult {
  success: boolean;
  response?: unknown;
  executionId?: string;
  mode: 'service' | 'local-fallback';
  error?: string;
}

// ---------------------------------------------------------------------------
// Auth — Get GCP access token
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string | null> {
  // 1. Direct token (for local dev or short-lived tokens)
  if (GCP_ACCESS_TOKEN) return GCP_ACCESS_TOKEN;

  // 2. Service account key (base64 encoded JSON)
  if (GCP_SA_KEY) {
    try {
      const keyJson = JSON.parse(Buffer.from(GCP_SA_KEY, 'base64').toString('utf-8'));
      // Use Google's JWT flow to get an access token
      const jwt = await createSignedJwt(keyJson);
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });
      if (tokenRes.ok) {
        const data = await tokenRes.json() as { access_token: string };
        return data.access_token;
      }
    } catch (err) {
      logger.warn({ err }, '[CloudRunDispatcher] Service account auth failed');
    }
  }

  // 3. Metadata server (when running on GCP)
  try {
    const res = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(3000) },
    );
    if (res.ok) {
      const data = await res.json() as { access_token: string };
      return data.access_token;
    }
  } catch {
    // Not on GCP — expected in VPS environment
  }

  return null;
}

/**
 * Create a signed JWT for service account auth.
 * Simplified — in production, use google-auth-library.
 */
async function createSignedJwt(keyJson: { client_email: string; private_key: string }): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: keyJson.client_email,
    sub: keyJson.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(keyJson.private_key, 'base64url');

  return `${header}.${payload}.${signature}`;
}

// ---------------------------------------------------------------------------
// Cloud Run Job Dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch a Chicken Hawk build as a Cloud Run Job.
 * Used for queued/scheduled builds triggered by pipeline or ACHEEVY.
 */
export async function dispatchCloudRunJob(request: CloudRunJobRequest): Promise<CloudRunJobResult> {
  const token = await getAccessToken();
  if (!token) {
    logger.info({ taskId: request.taskId }, '[CloudRunDispatcher] No GCP auth — falling back to local Chicken Hawk');
    return { dispatched: false, mode: 'local-fallback', error: 'GCP auth unavailable' };
  }

  const url = `${CLOUD_RUN_BASE_URL}/apis/run.googleapis.com/v1/namespaces/${GCP_PROJECT}/jobs/${CLOUD_RUN_JOB_NAME}:run`;

  const envOverrides = [
    { name: 'TASK_ID', value: request.taskId },
    ...(request.manifestUrl ? [{ name: 'MANIFEST_URL', value: request.manifestUrl }] : []),
    ...Object.entries(request.envOverrides || {}).map(([name, value]) => ({ name, value })),
  ];

  try {
    logger.info({ taskId: request.taskId, url }, '[CloudRunDispatcher] Dispatching Cloud Run job');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        overrides: {
          containerOverrides: [{
            env: envOverrides,
          }],
          ...(request.timeout ? { taskCount: 1, timeout: `${request.timeout}s` } : {}),
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, '[CloudRunDispatcher] Job dispatch failed');
      return { dispatched: false, mode: 'job', error: `HTTP ${res.status}: ${body}` };
    }

    const data = await res.json() as { metadata?: { name?: string } };
    const executionId = data.metadata?.name || `exec-${request.taskId}`;

    logger.info({ taskId: request.taskId, executionId }, '[CloudRunDispatcher] Job dispatched');
    return { dispatched: true, executionId, mode: 'job' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, taskId: request.taskId }, '[CloudRunDispatcher] Job dispatch error');
    return { dispatched: false, mode: 'job', error: msg };
  }
}

// ---------------------------------------------------------------------------
// Cloud Run Service Dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch a Chicken Hawk build to the always-on Cloud Run service.
 * Used for interactive builds that need real-time feedback.
 */
export async function dispatchCloudRunService(request: CloudRunServiceRequest): Promise<CloudRunServiceResult> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, mode: 'local-fallback', error: 'GCP auth unavailable' };
  }

  // Cloud Run service URL (internal via VPC connector or public)
  const serviceUrl = process.env.CHICKENHAWK_CLOUDRUN_URL
    || `https://${CLOUD_RUN_SERVICE_NAME}-${GCP_PROJECT}.${GCP_REGION}.run.app`;

  try {
    const res = await fetch(`${serviceUrl}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: request.taskId,
        intent: request.intent,
        query: request.query,
        steps: request.steps,
        userId: request.userId,
        context: request.context,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, mode: 'service', error: `HTTP ${res.status}: ${body}` };
    }

    const data = await res.json();
    return {
      success: true,
      response: data,
      executionId: request.taskId,
      mode: 'service',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, mode: 'service', error: msg };
  }
}

// ---------------------------------------------------------------------------
// Convenience — Try Cloud Run, fallback to local
// ---------------------------------------------------------------------------

/**
 * Smart dispatch: tries Cloud Run job first, falls back to local execution.
 */
export async function dispatchChickenHawkBuild(
  taskId: string,
  manifestUrl?: string,
  preferService?: boolean,
): Promise<CloudRunJobResult | CloudRunServiceResult> {
  if (preferService) {
    const result = await dispatchCloudRunService({
      taskId,
      intent: 'BUILD_PLUG',
      query: `Execute build ${taskId}`,
      userId: 'system',
    });
    if (result.success) return result;
  }

  // Try job mode
  const jobResult = await dispatchCloudRunJob({ taskId, manifestUrl });
  if (jobResult.dispatched) return jobResult;

  // All Cloud Run attempts failed — caller should use local Chicken Hawk
  logger.info({ taskId }, '[CloudRunDispatcher] All Cloud Run attempts failed — use local Chicken Hawk');
  return jobResult;
}
