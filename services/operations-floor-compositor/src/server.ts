/**
 * Operations Floor Compositor Service
 * ====================================
 * Stages 8 + 9 of the 3D Operations Floor pipeline.
 *
 *   POST /compose
 *     Given a Cosmos environment MP4 URL + Seedance character MP4 URL,
 *     programmatically composite them via Remotion + FFmpeg and upload
 *     the final MP4 to GCS. Returns the output URI + duration/bytes.
 *
 *   GET /health
 *     Reports bundler + ffmpeg + chromium availability.
 *
 * Runs as a Cloud Run Service (NOT a Job) — renders are sub-minute
 * but state-less; scale-to-zero fine.
 *
 * Deploy per services/operations-floor-compositor/DEPLOY.md.
 */

import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { Storage } from '@google-cloud/storage';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const PORT = parseInt(process.env.PORT ?? '8080', 10);
const PROJECT_ID = process.env.GCP_PROJECT_ID ?? 'ai-managed-services';

const app = express();
app.use(express.json({ limit: '1mb' }));

const storage = new Storage();

// ─── Request schema ─────────────────────────────────────────────────

const ComposeRequestSchema = z.object({
  environmentVideoUrl: z.string().url(),
  characterVideoUrl: z.string().url(),
  durationSeconds: z.number().positive().max(60).default(6),
  fps: z.union([z.literal(24), z.literal(30)]).default(24),
  characterStartFrame: z.number().int().min(0).optional(),
  characterPositioning: z
    .object({
      anchorX: z.number().min(0).max(1),
      anchorY: z.number().min(0).max(1),
      scale: z.number().min(0.1).max(1.5),
      fadeInFrames: z.number().int().min(0).max(60),
    })
    .optional(),
  endLockupText: z.string().max(64).optional(),
  outputGcsPrefix: z.string().startsWith('gs://'),
  sourceEventId: z.string().optional(),
});

// ─── Health ─────────────────────────────────────────────────────────

app.get('/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'operations-floor-compositor',
    stage: '8+9',
    project: PROJECT_ID,
    node: process.version,
  });
});

// ─── Compose ────────────────────────────────────────────────────────

app.post('/compose', async (req: Request, res: Response) => {
  const parsed = ComposeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'bad request', issues: parsed.error.issues });
  }
  const body = parsed.data;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compositor-'));
  const outFile = path.join(tmpDir, 'composed.mp4');

  try {
    const serveUrl = await bundle({
      entryPoint: path.resolve('src/Remotion.tsx'),
      onProgress: () => {},
    });

    const composition = await selectComposition({
      serveUrl,
      id: 'night-port-composite',
    });

    const durationInFrames = Math.round(body.durationSeconds * body.fps);

    await renderMedia({
      serveUrl,
      composition: {
        ...composition,
        durationInFrames,
        fps: body.fps,
      },
      codec: 'h264',
      outputLocation: outFile,
      inputProps: {
        environmentVideoUrl: body.environmentVideoUrl,
        characterVideoUrl: body.characterVideoUrl,
        fps: body.fps,
        durationInFrames,
        characterStartFrame: body.characterStartFrame ?? 0,
        characterPositioning: body.characterPositioning,
        endLockupText: body.endLockupText,
      },
    });

    const outUri = await uploadToGcs(outFile, body.outputGcsPrefix);
    const stat = await fs.stat(outFile);

    return res.json({
      output_video_gcs_uri: outUri,
      duration_s: body.durationSeconds,
      frame_count: durationInFrames,
      size_bytes: stat.size,
      source_event_id: body.sourceEventId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'compose failed', detail: msg });
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
});

// ─── GCS helper ─────────────────────────────────────────────────────

async function uploadToGcs(localPath: string, gcsPrefix: string): Promise<string> {
  const [, bucketName, ...rest] = gcsPrefix.replace('gs://', '').split('/');
  const bucket = storage.bucket(bucketName);
  const keyDir = rest.join('/').replace(/\/+$/, '');
  const fileName = path.basename(localPath);
  const targetKey = keyDir ? `${keyDir}/${fileName}` : fileName;
  await bucket.upload(localPath, { destination: targetKey });
  return `gs://${bucketName}/${targetKey}`;
}

// ─── Boot ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`operations-floor-compositor listening on :${PORT}`);
});
