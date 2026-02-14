/**
 * Vertex AI Integration Layer
 *
 * Connects Boost|Bridge to Google Cloud's ML platform:
 *   - Custom model predictions (identity risk scoring)
 *   - AutoML for training on verification data
 *   - Gemini API for multimodal analysis
 *   - Cloud Run Jobs for batch verification processing
 *
 * GCP Project: ai-managed-services
 */

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'ai-managed-services';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';
const GCP_ACCESS_TOKEN = process.env.GCP_ACCESS_TOKEN || '';

const VERTEX_BASE = `https://${GCP_REGION}-aiplatform.googleapis.com/v1`;
const CLOUD_RUN_BASE = `https://run.googleapis.com/v2`;

// ─── Types ───────────────────────────────────────────────────────────────

export interface VertexPrediction {
  endpoint: string;
  predictions: unknown[];
  model: string;
  latencyMs: number;
}

export interface CloudRunJob {
  jobId: string;
  name: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createTime: string;
  completionTime?: string;
  taskCount: number;
}

export interface GeminiResponse {
  content: string;
  safetyRatings: Array<{ category: string; probability: string }>;
  model: string;
}

// ─── Vertex AI Prediction ────────────────────────────────────────────────

export async function predict(
  endpointId: string,
  instances: Record<string, unknown>[],
): Promise<VertexPrediction> {
  const start = Date.now();
  const url = `${VERTEX_BASE}/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/endpoints/${endpointId}:predict`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GCP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ instances }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vertex AI prediction failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { predictions: unknown[]; deployedModelId: string };
  return {
    endpoint: endpointId,
    predictions: data.predictions,
    model: data.deployedModelId,
    latencyMs: Date.now() - start,
  };
}

// ─── Gemini Multimodal ───────────────────────────────────────────────────

export async function geminiAnalyze(
  prompt: string,
  imageBase64?: string,
  model: string = 'gemini-2.0-flash',
): Promise<GeminiResponse> {
  const url = `${VERTEX_BASE}/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/publishers/google/models/${model}:generateContent`;

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: imageBase64 },
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GCP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini call failed: ${res.status} ${err}`);
  }

  const data = await res.json() as {
    candidates: Array<{
      content: { parts: Array<{ text: string }> };
      safetyRatings: Array<{ category: string; probability: string }>;
    }>;
  };

  const candidate = data.candidates?.[0];
  return {
    content: candidate?.content?.parts?.map(p => p.text).join('') || '',
    safetyRatings: candidate?.safetyRatings || [],
    model,
  };
}

// ─── Cloud Run Jobs ──────────────────────────────────────────────────────

export async function createCloudRunJob(
  jobName: string,
  containerImage: string,
  env: Record<string, string> = {},
  taskCount: number = 1,
): Promise<CloudRunJob> {
  const url = `${CLOUD_RUN_BASE}/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/jobs`;

  const envVars = Object.entries(env).map(([name, value]) => ({ name, value }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GCP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      template: {
        taskCount,
        template: {
          containers: [{
            image: containerImage,
            env: envVars,
            resources: { limits: { cpu: '2', memory: '2Gi' } },
          }],
          maxRetries: 3,
          timeout: '600s',
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud Run Job creation failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { name: string; uid: string; createTime: string };
  return {
    jobId: data.uid,
    name: data.name,
    status: 'QUEUED',
    createTime: data.createTime,
    taskCount,
  };
}

export async function executeCloudRunJob(jobName: string): Promise<{ executionName: string }> {
  const url = `${CLOUD_RUN_BASE}/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/jobs/${jobName}:run`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GCP_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud Run Job execution failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { name: string };
  return { executionName: data.name };
}

export async function getJobStatus(jobName: string): Promise<CloudRunJob> {
  const url = `${CLOUD_RUN_BASE}/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/jobs/${jobName}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GCP_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud Run Job status failed: ${res.status} ${err}`);
  }

  const data = await res.json() as {
    uid: string;
    name: string;
    latestCreatedExecution?: { completionTime?: string };
    terminalCondition?: { type: string };
    createTime: string;
    template?: { taskCount: number };
  };

  const status = data.terminalCondition?.type === 'ExecutionSucceeded' ? 'SUCCEEDED'
    : data.terminalCondition?.type === 'ExecutionFailed' ? 'FAILED'
    : data.latestCreatedExecution ? 'RUNNING' : 'QUEUED';

  return {
    jobId: data.uid,
    name: data.name,
    status: status as CloudRunJob['status'],
    createTime: data.createTime,
    completionTime: data.latestCreatedExecution?.completionTime,
    taskCount: data.template?.taskCount || 1,
  };
}

// ─── Batch Verification Job ──────────────────────────────────────────────

export async function launchBatchVerificationJob(
  verificationIds: string[],
): Promise<CloudRunJob> {
  const containerImage = `gcr.io/${GCP_PROJECT_ID}/boost-bridge-verify:latest`;

  return createCloudRunJob(
    `bb-verify-batch-${Date.now()}`,
    containerImage,
    {
      VERIFICATION_IDS: verificationIds.join(','),
      GCP_PROJECT_ID,
      NODE_ENV: 'production',
    },
    Math.min(verificationIds.length, 10), // Parallel tasks, max 10
  );
}

// ─── Firebase Integration Helpers ────────────────────────────────────────

const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT_ID || GCP_PROJECT_ID;

export async function storeVerificationResult(
  verificationId: string,
  result: Record<string, unknown>,
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/verifications/${verificationId}`;

  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'number') fields[key] = { doubleValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else fields[key] = { stringValue: JSON.stringify(value) };
  }

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GCP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ fields }),
  });
}

export async function getVerificationFromFirestore(
  verificationId: string,
): Promise<Record<string, unknown> | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/verifications/${verificationId}`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${GCP_ACCESS_TOKEN}` },
  });

  if (!res.ok) return null;
  const data = await res.json() as { fields?: Record<string, { stringValue?: string; doubleValue?: number; booleanValue?: boolean }> };
  if (!data.fields) return null;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data.fields)) {
    result[key] = val.stringValue ?? val.doubleValue ?? val.booleanValue ?? null;
  }
  return result;
}
