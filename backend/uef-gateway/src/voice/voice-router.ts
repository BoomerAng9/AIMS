import { Router } from 'express';

export const voiceRouter = Router();

voiceRouter.get('/api/voice/health', (_req, res) => {
  res.json({
    status: 'degraded',
    service: 'voice-router',
    configured: false,
    message: 'Voice runtime is not configured in this gateway build.',
  });
});

voiceRouter.use('/api/voice', (_req, res) => {
  res.status(501).json({
    error: 'Voice runtime unavailable',
    code: 'VOICE_ROUTER_NOT_CONFIGURED',
  });
});
