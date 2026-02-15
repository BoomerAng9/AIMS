/**
 * TTS API Route — Text-to-Speech for ACHEEVY Replies
 *
 * Primary: ElevenLabs (pulls premium voices from user's account)
 * Fallback: Deepgram Aura-2 (premium voices, sub-200ms TTFB)
 *
 * Returns audio/mpeg stream for browser autoplay.
 */

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

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
          model_id: model || 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
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
    const { text, provider, voiceId, model } = await req.json();

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
        // Use provided voiceId or fall back to first available voice
        audioRes = await synthesizeElevenLabs(
          safeText,
          voiceId || 'pNInz6obpgDQGcFmaJgB', // Default: Adam
          model || 'eleven_turbo_v2_5',
        );
      } else {
        audioRes = await synthesizeDeepgram(
          safeText,
          voiceId || 'aura-2-orion-en',
        );
      }

      if (audioRes?.body) {
        return new NextResponse(audioRes.body, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'X-TTS-Provider': p,
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
