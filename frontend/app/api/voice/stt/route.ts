/**
 * STT API Route — Speech-to-Text for ACHEEVY Voice Input
 *
 * Primary: Groq Whisper (whisper-large-v3-turbo, 216x real-time)
 * Fallback: Deepgram Nova-3 (sub-300ms, 30+ languages)
 *
 * Accepts audio file upload, returns transcription text.
 */

import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

interface SttResponse {
  text: string;
  provider: string;
  model: string;
  confidence?: number;
  words?: Array<{ word: string; start: number; end: number }>;
}

async function transcribeGroq(
  audioBuffer: ArrayBuffer,
  model: string,
  language?: string,
): Promise<SttResponse | null> {
  if (!GROQ_API_KEY) return null;

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', model || 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    if (language) formData.append('language', language);

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
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
      model: model || 'whisper-large-v3-turbo',
      words: data.words?.map((w: any) => ({ word: w.word, start: w.start, end: w.end })),
    };
  } catch (err) {
    console.error('[STT] Groq error:', err);
    return null;
  }
}

async function transcribeDeepgram(
  audioBuffer: ArrayBuffer,
  model: string,
  language?: string,
): Promise<SttResponse | null> {
  if (!DEEPGRAM_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      model: model || 'nova-3',
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
      model: model || 'nova-3',
      confidence: alt?.confidence,
      words: alt?.words?.map((w: any) => ({ word: w.word, start: w.start, end: w.end })),
    };
  } catch (err) {
    console.error('[STT] Deepgram error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const provider = formData.get('provider') as string | null;
    const model = formData.get('model') as string | null;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 });
    }

    const audioBuffer = await audioFile.arrayBuffer();

    // Try primary provider first, then fallback
    const tryOrder = provider === 'deepgram'
      ? ['deepgram', 'groq'] as const
      : ['groq', 'deepgram'] as const;

    for (const p of tryOrder) {
      let result: SttResponse | null = null;

      if (p === 'groq') {
        result = await transcribeGroq(audioBuffer, model || 'whisper-large-v3-turbo', language || undefined);
      } else {
        result = await transcribeDeepgram(audioBuffer, model || 'nova-3', language || undefined);
      }

      if (result && result.text) {
        return NextResponse.json(result);
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
