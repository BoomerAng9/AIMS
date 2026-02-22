/**
 * Video & Content Pipeline API Router
 *
 * Routes:
 *   POST /api/video/generate           — Direct video generation via KIE.ai
 *   GET  /api/video/status/:taskId     — Check video generation status
 *   GET  /api/video/models             — List available models
 *   GET  /api/video/models/recommend   — Get model recommendation
 *   GET  /api/video/account            — KIE.ai account info
 *
 *   POST /api/content/pipeline         — Launch full content pipeline (URL → video)
 *   GET  /api/content/pipeline/:id     — Check pipeline status
 *   GET  /api/content/pipelines        — List pipelines
 */

import { Router } from 'express';
import { kieVideo, type KieModel, type KieVideoRequest } from './kie-client';
import { contentPipeline, type ContentPipelineRequest } from './content-pipeline';
import logger from '../logger';

export const videoRouter = Router();

// ---------------------------------------------------------------------------
// Direct Video Generation
// ---------------------------------------------------------------------------

videoRouter.post('/video/generate', async (req, res) => {
  try {
    const { model, prompt, duration, aspectRatio, resolution, referenceImageUrl,
            referenceVideoUrl, audioGeneration, cameraPath, negativePrompt, seed } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const request: KieVideoRequest = {
      model: model || 'seedance-2.0',
      prompt,
      duration: duration || 5,
      aspectRatio: aspectRatio || '9:16',
      resolution,
      referenceImageUrl,
      referenceVideoUrl,
      audioGeneration,
      cameraPath,
      negativePrompt,
      seed,
    };

    const result = await kieVideo.generateVideo(request);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Video generation failed';
    logger.error({ err }, '[VideoRouter] Generate error');
    res.status(500).json({ error: msg });
  }
});

videoRouter.get('/video/status/:taskId', async (req, res) => {
  try {
    const result = await kieVideo.getTaskStatus(req.params.taskId);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Status check failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Model Discovery
// ---------------------------------------------------------------------------

videoRouter.get('/video/models', (_req, res) => {
  const models = kieVideo.getAvailableModels();
  const providers = [...new Set(models.map(m => m.provider))];
  res.json({ models, providers, count: models.length });
});

videoRouter.get('/video/models/recommend', (req, res) => {
  const { audio, videoToVideo, maxCredits, provider, duration } = req.query;

  const recommended = kieVideo.recommendModel({
    needsAudio: audio === 'true',
    needsVideoToVideo: videoToVideo === 'true',
    maxBudgetCredits: maxCredits ? parseInt(maxCredits as string) : undefined,
    preferredProvider: provider as string,
    duration: duration ? parseInt(duration as string) : undefined,
  });

  res.json({ recommended });
});

videoRouter.get('/video/account', async (_req, res) => {
  const info = await kieVideo.getAccountInfo();
  if (!info) {
    res.status(503).json({ error: 'KIE.ai account info unavailable', configured: kieVideo.isConfigured() });
    return;
  }
  res.json(info);
});

// ---------------------------------------------------------------------------
// Content Pipeline (URL → Video → Multi-Platform)
// ---------------------------------------------------------------------------

videoRouter.post('/content/pipeline', async (req, res) => {
  try {
    const { source, sourceType, platforms, style, model, duration, withAudio,
            tone, userId, hook, cta } = req.body;

    if (!source) {
      res.status(400).json({ error: 'source is required (product URL, description, or prompt)' });
      return;
    }

    const request: ContentPipelineRequest = {
      source,
      sourceType: sourceType || 'prompt',
      platforms: platforms || ['tiktok', 'instagram-reels'],
      style: style || 'auto',
      model: model || 'auto',
      duration: duration || 15,
      withAudio: withAudio !== false,
      tone,
      userId: userId || 'anonymous',
      hook,
      cta,
    };

    const result = await contentPipeline.launch(request);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pipeline launch failed';
    logger.error({ err }, '[VideoRouter] Pipeline error');
    res.status(500).json({ error: msg });
  }
});

videoRouter.get('/content/pipeline/:id', (req, res) => {
  const result = contentPipeline.getStatus(req.params.id);
  if (!result) {
    res.status(404).json({ error: 'Pipeline not found' });
    return;
  }
  res.json(result);
});

videoRouter.get('/content/pipelines', (req, res) => {
  const userId = req.query.userId as string || 'anonymous';
  const pipelines = contentPipeline.listByUser(userId);
  res.json({ pipelines, count: pipelines.length });
});
