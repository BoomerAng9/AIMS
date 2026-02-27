/**
 * STT API Route — Speech-to-Text for ACHEEVY Voice Input
 *
 * Primary: ElevenLabs Scribe v2 (99% accuracy, 90+ languages, word timestamps)
 * Fallback: Deepgram Nova-3 (sub-300ms, 30+ languages)
 *
 * LUC metering: Records stt_minutes usage after successful transcription.
 * Duration is calculated from word timestamps (preferred) or estimated from buffer size.
 *
 * Accepts audio file upload, returns transcription text.
 *
 * NOTE: Groq Whisper was removed — exposed key deprecated.
 */

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const UEF_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || process.env.UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

/** Estimate audio duration from buffer size (WebM/Opus ~12kbps) */
function estimateDurationMinutes(bufferSize: number): number {
  const bytesPerSecond = 1500; // WebM/Opus average
  const seconds = bufferSize / bytesPerSecond;
  return Math.max(0.1, seconds / 60);
}

/** Fire-and-forget LUC metering call for STT minutes */
function meterSttUsage(userId: string, durationMinutes: number, provider: string) {
  fetch(`${UEF_GATEWAY_URL}/api/billing/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_API_KEY ? { 'x-api-key': INTERNAL_API_KEY } : {}),
    },
    body: JSON.stringify({
      userId,
      serviceKey: 'stt_minutes',
      units: durationMinutes,
      metadata: { provider, source: 'frontend-stt' },
    }),
  }).catch(() => { /* non-blocking */ });
}

interface SttResponse {
  text: string;
  provider: string;
  model: string;
  confidence?: number;
  words?: Array<{ word: string; start: number; end: number }>;
}

async function transcribeElevenLabs(
  audioBuffer: ArrayBuffer,
  language?: string,
): Promise<SttResponse | null> {
  if (!ELEVENLABS_API_KEY) return null;

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model_id', 'scribe_v2');
    if (language) formData.append('language_code', language);

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: formData,
    });

    if (!res.ok) {
      console.error(`[STT] ElevenLabs Scribe returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      text: data.text || '',
      provider: 'elevenlabs',
      model: 'scribe_v2',
      confidence: data.language_probability,
      words: data.words?.map((w: any) => ({ word: w.text, start: w.start, end: w.end })),
    };
  } catch (err) {
    console.error('[STT] ElevenLabs Scribe error:', err);
    return null;
  }
}

async function transcribeDeepgram(
  audioBuffer: ArrayBuffer,
  language?: string,
): Promise<SttResponse | null> {
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
      body: audioBuffer,
    });

    if (!res.ok) {
      console.error(`[STT] Deepgram returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const alt = data.results?.channels?.[0]?.alternatives?.[0];
    return {
      text: alt?.transcript || '',
      provider: 'deepgram',
      model: 'nova-3',
      confidence: alt?.confidence,
      words: alt?.words?.map((w: any) => ({ word: w.word, start: w.start, end: w.end })),
    };
  } catch (err) {
    console.error('[STT] Deepgram error:', err);
    return null;
  }
}

async function transcribeGroq(
  audioBuffer: ArrayBuffer,
  language?: string,
): Promise<SttResponse | null> {
  if (!GROQ_API_KEY) return null;

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    if (language) formData.append('language', language);

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      console.error(`[STT] Groq returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      text: data.text || '',
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
    };
  } catch (err) {
    console.error('[STT] Groq error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const provider = formData.get('provider') as string | null;
    const language = formData.get('language') as string | null;
    const userId = formData.get('userId') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 });
    }

    const audioBuffer = await audioFile.arrayBuffer();

    // Try primary provider first, then fallback
    const tryOrder = provider === 'groq'
      ? ['groq', 'elevenlabs', 'deepgram'] as const
      : provider === 'deepgram'
        ? ['deepgram', 'groq', 'elevenlabs'] as const
        : ['elevenlabs', 'groq', 'deepgram'] as const;

    for (const p of tryOrder) {
      let result: SttResponse | null = null;

      if (p === 'elevenlabs') {
        result = await transcribeElevenLabs(audioBuffer, language || undefined);
      } else if (p === 'deepgram') {
        result = await transcribeDeepgram(audioBuffer, language || undefined);
      } else if (p === 'groq') {
        result = await transcribeGroq(audioBuffer, language || undefined);
      }

      if (result && result.text) {
        // Calculate duration from word timestamps or estimate from buffer size
        const words = result.words;
        const durationMinutes = words?.length
          ? Math.max(0.1, (words[words.length - 1].end / 60))
          : estimateDurationMinutes(audioBuffer.byteLength);

        // Meter stt_minutes through LUC (fire-and-forget)
        meterSttUsage(userId || 'anonymous', durationMinutes, p);

        return NextResponse.json({
          ...result,
          durationMinutes,
        });
      }
    }

    return NextResponse.json(
      { error: 'All STT providers failed. Check API keys.' },
      { status: 503 },
    );
  } catch (err) {
    console.error('[STT] Route error:', err);
    return NextResponse.json({ error: 'STT transcription failed' }, { status: 500 });
  }
}
