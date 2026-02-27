/**
 * TTS API Route — Text-to-Speech for ACHEEVY Replies
 *
 * Primary: ElevenLabs (eleven_turbo_v2_5)
 * Fallback: Deepgram Aura-2 (premium voices, sub-200ms TTFB)
 *
 * LUC metering: Records voice_chars usage after successful synthesis.
 * Returns audio/mpeg stream for browser autoplay.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ELEVENLABS_ACHEEVY_PRESET, DEEPGRAM_ACHEEVY_PRESET } from '@/lib/acheevy/voiceConfig';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const UEF_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || process.env.UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

/** Fire-and-forget LUC metering call to the backend voice router */
function meterTtsUsage(userId: string, charCount: number, provider: string) {
  fetch(`${UEF_GATEWAY_URL}/api/billing/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_API_KEY ? { 'x-api-key': INTERNAL_API_KEY } : {}),
    },
    body: JSON.stringify({
      userId,
      serviceKey: 'voice_chars',
      units: charCount,
      metadata: { provider, source: 'frontend-tts' },
    }),
  }).catch(() => { /* non-blocking */ });
}

async function synthesizeElevenLabs(
  text: string,
  voiceId: string,
  model: string,
): Promise<Response | null> {
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
          model_id: model || ELEVENLABS_ACHEEVY_PRESET.model,
          voice_settings: {
            stability: ELEVENLABS_ACHEEVY_PRESET.stability,
            similarity_boost: ELEVENLABS_ACHEEVY_PRESET.similarity_boost,
            style: ELEVENLABS_ACHEEVY_PRESET.style,
            use_speaker_boost: ELEVENLABS_ACHEEVY_PRESET.use_speaker_boost,
          },
        }),
      },
    );

    if (res.ok) return res;
    console.error(`[TTS] ElevenLabs returned ${res.status}`);
    return null;
  } catch (err) {
    console.error('[TTS] ElevenLabs error:', err);
    return null;
  }
}

async function synthesizeDeepgram(
  text: string,
  model: string,
): Promise<Response | null> {
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

    if (res.ok) return res;
    console.error(`[TTS] Deepgram returned ${res.status}`);
    return null;
  } catch (err) {
    console.error('[TTS] Deepgram error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, provider, voiceId, model, userId } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    // Truncate for safety (TTS shouldn't process novels)
    const safeText = text.slice(0, 5000);

    // Try primary provider first, then fallback
    const tryOrder = provider === 'deepgram'
      ? ['deepgram', 'elevenlabs'] as const
      : ['elevenlabs', 'deepgram'] as const;

    for (const p of tryOrder) {
      let audioRes: Response | null = null;

      if (p === 'elevenlabs') {
        audioRes = await synthesizeElevenLabs(
          safeText,
          voiceId || ELEVENLABS_ACHEEVY_PRESET.voiceId,
          model || ELEVENLABS_ACHEEVY_PRESET.model,
        );
      } else {
        audioRes = await synthesizeDeepgram(
          safeText,
          voiceId || DEEPGRAM_ACHEEVY_PRESET.model,
        );
      }

      if (audioRes?.body) {
        // Meter voice_chars through LUC (fire-and-forget)
        meterTtsUsage(userId || 'anonymous', safeText.length, p);

        return new NextResponse(audioRes.body, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'X-TTS-Provider': p,
            'X-Voice-Chars': String(safeText.length),
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'All TTS providers failed. Check API keys.' },
      { status: 503 },
    );
  } catch (err) {
    console.error('[TTS] Route error:', err);
    return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 });
  }
}
