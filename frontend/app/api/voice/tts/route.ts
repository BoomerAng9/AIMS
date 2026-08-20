/**
 * TTS API Route — Text-to-Speech for ACHEEVY Replies
 *
 * Primary: Inworld (ACHEEVY's cloned Void-Caster voice — owner directive 2026-08-19: "we're only
 *   pulling over cloned voices from Inworld"; ElevenLabs is removed from this path, no fallback)
 * Fallback: Deepgram Aura-2 (premium voices, sub-200ms TTFB)
 *
 * LUC metering: Records voice_chars usage after successful synthesis.
 * Returns audio/mpeg stream for browser autoplay.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-role';
import { INWORLD_ACHEEVY_PRESET, DEEPGRAM_ACHEEVY_PRESET } from '@/lib/acheevy/voiceConfig';

// same key, same typo-fallback the Python backend resolves (INWORLD_APY_KEY is a live on-box typo for
// "API"); this box has the correctly-spelled INWORLD_API_KEY, checked first.
const INWORLD_API_KEY = process.env.INWORLD_API_KEY || process.env.INWORLD_APY_KEY || '';
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

async function synthesizeInworld(
  text: string,
  voiceId: string,
  model: string,
): Promise<Response | null> {
  if (!INWORLD_API_KEY) return null;

  try {
    const res = await fetch('https://api.inworld.ai/tts/v1/voice', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${INWORLD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        modelId: model || INWORLD_ACHEEVY_PRESET.model,
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    if (!res.ok) {
      console.error(`[TTS] Inworld returned ${res.status}`);
      return null;
    }
    // Inworld returns JSON {audioContent: base64 mp3} — not a raw audio stream like the old
    // ElevenLabs/stream call, so decode it into a real audio/mpeg Response for the caller below.
    const data = await res.json();
    const b64 = data?.audioContent || data?.result?.audioContent;
    if (!b64 || typeof b64 !== 'string') return null;
    const audioBytes = Buffer.from(b64, 'base64');
    return new Response(audioBytes, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (err) {
    console.error('[TTS] Inworld error:', err);
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
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { text, provider, voiceId, model, userId } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    // Truncate for safety (TTS shouldn't process novels)
    const safeText = text.slice(0, 5000);

    // Try primary provider first, then fallback. ElevenLabs is no longer a valid provider on this
    // route — any other value (including a stale 'elevenlabs' from an old client) resolves to the
    // Inworld-first default order.
    const tryOrder = provider === 'deepgram'
      ? ['deepgram', 'inworld'] as const
      : ['inworld', 'deepgram'] as const;

    for (const p of tryOrder) {
      let audioRes: Response | null = null;

      if (p === 'inworld') {
        audioRes = await synthesizeInworld(
          safeText,
          voiceId || INWORLD_ACHEEVY_PRESET.voiceId,
          model || INWORLD_ACHEEVY_PRESET.model,
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
