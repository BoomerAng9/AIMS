/**
 * Voice Router — Unified Voice Pipeline with LUC Metering
 *
 * Wires PersonaPlex + Deepgram Nova + ElevenLabs into a single,
 * quota-enforced voice routing layer. Every voice action is metered
 * through LUC before execution.
 *
 * Provider priority:
 *   TTS: ElevenLabs (eleven_turbo_v2_5) → Deepgram (aura-2) → PersonaPlex (avatar)
 *   STT: ElevenLabs (scribe_v2) → Deepgram (nova-3)
 *   Avatar: PersonaPlex only (requires GPU endpoint)
 *
 * LUC service keys:
 *   - voice_chars: Characters synthesized to speech (TTS metering)
 *   - stt_minutes: Audio transcription minutes (STT metering)
 */

import { Router, Request, Response } from 'express';
import { personaplex } from '../llm/personaplex';
import {
  canExecute,
  recordUsage,
  estimate,
  SERVICE_KEYS,
  type ServiceKey,
  type LucAccount,
} from '../billing/luc-engine';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Provider Configuration
// ---------------------------------------------------------------------------

export type TtsProvider = 'elevenlabs' | 'deepgram' | 'personaplex';
export type SttProvider = 'elevenlabs' | 'deepgram';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

export interface VoiceProviderStatus {
  elevenlabs: boolean;
  deepgram: boolean;
  personaplex: boolean;
}

export function getProviderStatus(): VoiceProviderStatus {
  return {
    elevenlabs: ELEVENLABS_API_KEY.length > 0,
    deepgram: DEEPGRAM_API_KEY.length > 0,
    personaplex: personaplex.isConfigured(),
  };
}

// ---------------------------------------------------------------------------
// TTS — Text-to-Speech with LUC metering
// ---------------------------------------------------------------------------

interface TtsResult {
  audioBuffer: Buffer | null;
  provider: TtsProvider;
  contentType: string;
  charCount: number;
  durationMs?: number;
}

async function synthesizeElevenLabs(
  text: string,
  voiceId = 'pNInz6obpgDQGcFmaJgB', // Adam (ACHEEVY default)
  model = 'eleven_turbo_v2_5',
): Promise<Buffer | null> {
  if (!ELEVENLABS_API_KEY) return null;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: 0.42,
            similarity_boost: 0.75,
            style: 0.65,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!res.ok) {
      logger.error({ status: res.status }, '[VoiceRouter] ElevenLabs TTS failed');
      return null;
    }

    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    logger.error({ err }, '[VoiceRouter] ElevenLabs TTS error');
    return null;
  }
}

async function synthesizeDeepgram(
  text: string,
  model = 'aura-2-orion',
): Promise<Buffer | null> {
  if (!DEEPGRAM_API_KEY) return null;

  try {
    const res = await fetch(
      `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      },
    );

    if (!res.ok) {
      logger.error({ status: res.status }, '[VoiceRouter] Deepgram TTS failed');
      return null;
    }

    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    logger.error({ err }, '[VoiceRouter] Deepgram TTS error');
    return null;
  }
}

/**
 * Synthesize text to speech using the best available provider.
 * Tries providers in order: ElevenLabs → Deepgram → PersonaPlex.
 */
export async function synthesize(
  text: string,
  preferredProvider?: TtsProvider,
  voiceId?: string,
  model?: string,
): Promise<TtsResult> {
  const safeText = text.slice(0, 5000);
  const charCount = safeText.length;

  const order: TtsProvider[] = preferredProvider === 'deepgram'
    ? ['deepgram', 'elevenlabs']
    : preferredProvider === 'personaplex'
      ? ['personaplex', 'elevenlabs', 'deepgram']
      : ['elevenlabs', 'deepgram'];

  for (const provider of order) {
    let audioBuffer: Buffer | null = null;

    if (provider === 'elevenlabs') {
      audioBuffer = await synthesizeElevenLabs(safeText, voiceId, model);
    } else if (provider === 'deepgram') {
      audioBuffer = await synthesizeDeepgram(safeText, voiceId || model);
    } else if (provider === 'personaplex') {
      const result = await personaplex.speak(safeText);
      // PersonaPlex returns audioUrl, not a buffer — mark as handled
      if (result.audioUrl) {
        return { audioBuffer: null, provider: 'personaplex', contentType: 'application/json', charCount, durationMs: result.duration };
      }
    }

    if (audioBuffer) {
      return { audioBuffer, provider, contentType: 'audio/mpeg', charCount };
    }
  }

  return { audioBuffer: null, provider: 'elevenlabs', contentType: 'audio/mpeg', charCount };
}

// ---------------------------------------------------------------------------
// STT — Speech-to-Text with LUC metering
// ---------------------------------------------------------------------------

interface SttResult {
  text: string;
  provider: SttProvider;
  model: string;
  confidence?: number;
  words?: { word: string; start: number; end: number }[];
  durationMs?: number;
}

async function transcribeElevenLabs(
  audioBuffer: Buffer,
  language?: string,
): Promise<SttResult | null> {
  if (!ELEVENLABS_API_KEY) return null;

  try {
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model_id', 'scribe_v2');
    if (language) formData.append('language_code', language);

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: formData,
    });

    if (!res.ok) {
      logger.error({ status: res.status }, '[VoiceRouter] ElevenLabs STT failed');
      return null;
    }

    const data = await res.json() as any;
    // Calculate duration from word timestamps if available
    const words = data.words?.map((w: any) => ({ word: w.text, start: w.start, end: w.end }));
    const durationMs = words?.length ? (words[words.length - 1].end * 1000) : undefined;

    return {
      text: data.text || '',
      provider: 'elevenlabs',
      model: 'scribe_v2',
      confidence: data.language_probability,
      words,
      durationMs,
    };
  } catch (err) {
    logger.error({ err }, '[VoiceRouter] ElevenLabs STT error');
    return null;
  }
}

async function transcribeDeepgram(
  audioBuffer: Buffer,
  language?: string,
): Promise<SttResult | null> {
  if (!DEEPGRAM_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      model: 'nova-3',
      smart_format: 'true',
      punctuate: 'true',
    });
    if (language) params.set('language', language);

    const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: new Uint8Array(audioBuffer),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, '[VoiceRouter] Deepgram STT failed');
      return null;
    }

    const data = await res.json() as any;
    const alt = data.results?.channels?.[0]?.alternatives?.[0];
    const durationMs = data.metadata?.duration
      ? data.metadata.duration * 1000
      : undefined;

    return {
      text: alt?.transcript || '',
      provider: 'deepgram',
      model: 'nova-3',
      confidence: alt?.confidence,
      words: alt?.words?.map((w: any) => ({ word: w.word, start: w.start, end: w.end })),
      durationMs,
    };
  } catch (err) {
    logger.error({ err }, '[VoiceRouter] Deepgram STT error');
    return null;
  }
}

/**
 * Transcribe audio using the best available provider.
 * Tries: ElevenLabs Scribe v2 → Deepgram Nova-3.
 */
export async function transcribe(
  audioBuffer: Buffer,
  preferredProvider?: SttProvider,
  language?: string,
): Promise<SttResult | null> {
  const order: SttProvider[] = preferredProvider === 'deepgram'
    ? ['deepgram', 'elevenlabs']
    : ['elevenlabs', 'deepgram'];

  for (const provider of order) {
    let result: SttResult | null = null;

    if (provider === 'elevenlabs') {
      result = await transcribeElevenLabs(audioBuffer, language);
    } else {
      result = await transcribeDeepgram(audioBuffer, language);
    }

    if (result && result.text) return result;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Audio Duration Utility
// ---------------------------------------------------------------------------

/**
 * Estimate audio duration from buffer size and content type.
 * For WebM/Opus: ~12kbps average → ~1500 bytes/sec
 * For MP3: ~128kbps → ~16000 bytes/sec
 * This is a rough estimate; word timestamps are preferred when available.
 */
export function estimateAudioDurationMs(bufferSize: number, contentType = 'audio/webm'): number {
  const bytesPerSecond = contentType.includes('mp3') ? 16000 : 1500;
  return Math.round((bufferSize / bytesPerSecond) * 1000);
}

// ---------------------------------------------------------------------------
// Voice Router — Express Router with LUC-gated endpoints
// ---------------------------------------------------------------------------

export const voiceRouter = Router();

// In-memory LUC account cache lookup (imported from bridge)
// For the voice router, we pass the account in via middleware or body
// Since the voice router runs alongside the LUC-Stripe bridge,
// it uses the same getOrCreateAccount pattern.

import { billingProvisions } from '../billing/persistence';
import {
  initializeQuotas,
  PLAN_IDS,
  PLAN_MULTIPLIERS,
  type PlanId,
  type Quota,
} from '../billing/luc-engine';
import { v4 as uuidv4 } from 'uuid';

const voiceLucAccounts = new Map<string, LucAccount>();

function getVoiceAccount(userId: string): LucAccount {
  const existing = voiceLucAccounts.get(userId);
  if (existing) return existing;

  const provision = billingProvisions.get(userId);
  const planId = (provision?.tierId || 'p2p') as PlanId;
  const multiplier = PLAN_MULTIPLIERS[planId] ?? 1;

  const baseLimits: Record<string, number> = {
    [SERVICE_KEYS.VOICE_CHARS]: planId === 'p2p' ? -1 : Math.round(50_000 * multiplier),
    [SERVICE_KEYS.STT_MINUTES]: planId === 'p2p' ? -1 : Math.round(30 * multiplier),
  };

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const account: LucAccount = {
    id: uuidv4(),
    workspaceId: userId,
    planId,
    status: 'active',
    quotas: initializeQuotas(baseLimits),
    overagePolicy: planId === 'enterprise' ? 'soft_limit' : planId === 'p2p' ? 'allow_overage' : 'block',
    periodStart: now.toISOString(),
    periodEnd: periodEnd.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  voiceLucAccounts.set(userId, account);
  return account;
}

function applyVoiceQuotaUpdate(userId: string, serviceKey: ServiceKey, updatedQuota: Quota): void {
  const account = voiceLucAccounts.get(userId);
  if (account) {
    account.quotas[serviceKey] = updatedQuota;
  }
}

// ---------------------------------------------------------------------------
// POST /api/voice/tts — LUC-gated TTS synthesis
// ---------------------------------------------------------------------------

voiceRouter.post('/api/voice/tts', async (req: Request, res: Response) => {
  const { userId, text, provider, voiceId, model } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const safeText = text.slice(0, 5000);
  const charCount = safeText.length;
  const resolvedUserId = userId || req.headers['x-user-id'] as string || 'anonymous';

  // LUC quota check
  const account = getVoiceAccount(resolvedUserId);
  const check = canExecute(account, SERVICE_KEYS.VOICE_CHARS, charCount);

  if (!check.canExecute) {
    logger.warn({ userId: resolvedUserId, charCount }, '[VoiceRouter] TTS blocked by quota');
    res.status(402).json({
      error: 'Voice character quota exceeded',
      reason: check.reason,
      quota: { remaining: check.quotaRemaining, percentUsed: check.percentUsed },
      upgradeUrl: '/pricing',
    });
    return;
  }

  // Synthesize
  const result = await synthesize(safeText, provider, voiceId, model);

  if (!result.audioBuffer && result.provider !== 'personaplex') {
    res.status(503).json({ error: 'All TTS providers failed' });
    return;
  }

  // Record usage in LUC
  const { updatedQuota, event } = recordUsage(account, {
    workspaceId: resolvedUserId,
    userId: resolvedUserId,
    serviceKey: SERVICE_KEYS.VOICE_CHARS,
    units: charCount,
    metadata: { provider: result.provider, voiceId, model },
  });
  applyVoiceQuotaUpdate(resolvedUserId, SERVICE_KEYS.VOICE_CHARS, updatedQuota);

  logger.info({
    userId: resolvedUserId, provider: result.provider, charCount, eventId: event.id,
  }, '[VoiceRouter] TTS metered');

  // Return audio or PersonaPlex reference
  if (result.provider === 'personaplex') {
    res.json({
      provider: 'personaplex',
      durationMs: result.durationMs,
      charCount,
      eventId: event.id,
    });
    return;
  }

  res.set({
    'Content-Type': result.contentType,
    'X-TTS-Provider': result.provider,
    'X-LUC-Event-Id': event.id,
    'X-Voice-Chars': String(charCount),
    'Cache-Control': 'no-cache',
  });
  res.send(result.audioBuffer);
});

// ---------------------------------------------------------------------------
// POST /api/voice/stt — LUC-gated STT transcription
// ---------------------------------------------------------------------------

voiceRouter.post('/api/voice/stt', async (req: Request, res: Response) => {
  const userId = (req.body?.userId || req.headers['x-user-id'] || 'anonymous') as string;

  // Check for audio in body (expects raw buffer or base64)
  const audioBase64 = req.body?.audio;
  const provider = req.body?.provider as SttProvider | undefined;
  const language = req.body?.language as string | undefined;

  if (!audioBase64) {
    res.status(400).json({ error: 'audio (base64) is required' });
    return;
  }

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const estimatedDurationMs = estimateAudioDurationMs(audioBuffer.length);
  const estimatedMinutes = Math.max(0.1, estimatedDurationMs / 60000); // Min 0.1 minute

  // LUC quota check
  const account = getVoiceAccount(userId);
  const check = canExecute(account, SERVICE_KEYS.STT_MINUTES, estimatedMinutes);

  if (!check.canExecute) {
    logger.warn({ userId, estimatedMinutes }, '[VoiceRouter] STT blocked by quota');
    res.status(402).json({
      error: 'STT minutes quota exceeded',
      reason: check.reason,
      quota: { remaining: check.quotaRemaining, percentUsed: check.percentUsed },
      upgradeUrl: '/pricing',
    });
    return;
  }

  // Transcribe
  const result = await transcribe(audioBuffer, provider, language);

  if (!result) {
    res.status(503).json({ error: 'All STT providers failed' });
    return;
  }

  // Calculate actual duration (prefer word timestamps over estimate)
  const actualDurationMs = result.durationMs || estimatedDurationMs;
  const actualMinutes = Math.max(0.1, actualDurationMs / 60000);

  // Record usage in LUC
  const { updatedQuota, event } = recordUsage(account, {
    workspaceId: userId,
    userId,
    serviceKey: SERVICE_KEYS.STT_MINUTES,
    units: actualMinutes,
    metadata: { provider: result.provider, model: result.model, durationMs: String(actualDurationMs) },
  });
  applyVoiceQuotaUpdate(userId, SERVICE_KEYS.STT_MINUTES, updatedQuota);

  logger.info({
    userId, provider: result.provider, durationMs: actualDurationMs, eventId: event.id,
  }, '[VoiceRouter] STT metered');

  res.json({
    ...result,
    durationMs: actualDurationMs,
    eventId: event.id,
  });
});

// ---------------------------------------------------------------------------
// POST /api/voice/estimate — Pre-execution cost estimate
// ---------------------------------------------------------------------------

voiceRouter.post('/api/voice/estimate', (req: Request, res: Response) => {
  const { userId, type, text, audioDurationMs } = req.body;
  const resolvedUserId = userId || req.headers['x-user-id'] as string || 'anonymous';
  const account = getVoiceAccount(resolvedUserId);

  const services: { serviceKey: ServiceKey; units: number }[] = [];

  if (type === 'tts' && text) {
    services.push({ serviceKey: SERVICE_KEYS.VOICE_CHARS, units: text.length });
  }
  if (type === 'stt' && audioDurationMs) {
    services.push({ serviceKey: SERVICE_KEYS.STT_MINUTES, units: Math.max(0.1, audioDurationMs / 60000) });
  }

  if (services.length === 0) {
    res.status(400).json({ error: 'type and (text or audioDurationMs) are required' });
    return;
  }

  const est = estimate(account, { services });
  const check = type === 'tts'
    ? canExecute(account, SERVICE_KEYS.VOICE_CHARS, services[0].units)
    : canExecute(account, SERVICE_KEYS.STT_MINUTES, services[0].units);

  res.json({
    canExecute: check.canExecute,
    estimate: est,
    quota: {
      remaining: check.quotaRemaining,
      limit: check.quotaLimit,
      percentUsed: check.percentUsed,
      warningLevel: check.warningLevel,
    },
    warning: check.warning,
  });
});

// ---------------------------------------------------------------------------
// POST /api/voice/personaplex/speak — PersonaPlex avatar speak with LUC metering
// ---------------------------------------------------------------------------

voiceRouter.post('/api/voice/personaplex/speak', async (req: Request, res: Response) => {
  const { userId, text, sessionId } = req.body;

  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const resolvedUserId = userId || req.headers['x-user-id'] as string || 'anonymous';
  const charCount = text.length;

  // LUC quota check
  const account = getVoiceAccount(resolvedUserId);
  const check = canExecute(account, SERVICE_KEYS.VOICE_CHARS, charCount);

  if (!check.canExecute) {
    res.status(402).json({
      error: 'Voice character quota exceeded',
      reason: check.reason,
      upgradeUrl: '/pricing',
    });
    return;
  }

  // Call PersonaPlex
  const result = await personaplex.speak(text, sessionId);

  // Record usage
  const { updatedQuota, event } = recordUsage(account, {
    workspaceId: resolvedUserId,
    userId: resolvedUserId,
    serviceKey: SERVICE_KEYS.VOICE_CHARS,
    units: charCount,
    metadata: { provider: 'personaplex', sessionId },
  });
  applyVoiceQuotaUpdate(resolvedUserId, SERVICE_KEYS.VOICE_CHARS, updatedQuota);

  logger.info({
    userId: resolvedUserId, provider: 'personaplex', charCount, eventId: event.id,
  }, '[VoiceRouter] PersonaPlex speak metered');

  res.json({
    ...result,
    charCount,
    eventId: event.id,
    provider: 'personaplex',
  });
});

// ---------------------------------------------------------------------------
// GET /api/voice/providers — Current voice provider status
// ---------------------------------------------------------------------------

voiceRouter.get('/api/voice/providers', (_req: Request, res: Response) => {
  const status = getProviderStatus();
  res.json({
    providers: {
      tts: {
        elevenlabs: { available: status.elevenlabs, model: 'eleven_turbo_v2_5', priority: 1 },
        deepgram: { available: status.deepgram, model: 'aura-2-orion', priority: 2 },
        personaplex: { available: status.personaplex, model: 'nvidia-nemotron', priority: 3 },
      },
      stt: {
        elevenlabs: { available: status.elevenlabs, model: 'scribe_v2', priority: 1 },
        deepgram: { available: status.deepgram, model: 'nova-3', priority: 2 },
      },
    },
    metering: {
      tts: { serviceKey: SERVICE_KEYS.VOICE_CHARS, unit: 'character', rate: 0.00001 },
      stt: { serviceKey: SERVICE_KEYS.STT_MINUTES, unit: 'minute', rate: 0.006 },
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/voice/quota/:userId — Voice quota status
// ---------------------------------------------------------------------------

voiceRouter.get('/api/voice/quota/:userId', (req: Request, res: Response) => {
  const account = getVoiceAccount(req.params.userId);

  const ttsQuota = account.quotas[SERVICE_KEYS.VOICE_CHARS];
  const sttQuota = account.quotas[SERVICE_KEYS.STT_MINUTES];

  res.json({
    userId: req.params.userId,
    planId: account.planId,
    tts: ttsQuota ? {
      used: ttsQuota.used,
      limit: ttsQuota.limit,
      remaining: ttsQuota.limit <= 0 ? 0 : Math.max(0, ttsQuota.limit - ttsQuota.used),
      percentUsed: ttsQuota.limit <= 0 ? 0 : Math.round((ttsQuota.used / ttsQuota.limit) * 100),
    } : null,
    stt: sttQuota ? {
      used: sttQuota.used,
      limit: sttQuota.limit,
      remaining: sttQuota.limit <= 0 ? 0 : Math.max(0, sttQuota.limit - sttQuota.used),
      percentUsed: sttQuota.limit <= 0 ? 0 : Math.round((sttQuota.used / sttQuota.limit) * 100),
    } : null,
  });
});
