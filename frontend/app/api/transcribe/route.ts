/**
 * Transcription API Route
 * Converts audio to text using Groq Whisper (or OpenAI Whisper fallback)
 *
 * POST /api/transcribe
 * Body: FormData with 'audio' file and optional 'provider', 'language'
 */

import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const provider = (formData.get('provider') as string) || 'groq';
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Select API based on provider
    const apiUrl = provider === 'openai' ? OPENAI_API_URL : GROQ_API_URL;
    const apiKey = provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn(`[Transcribe] No API key for ${provider}, using mock response`);
      return NextResponse.json({
        text: '[Transcription service not configured]',
        confidence: 0,
      });
    }

    // Prepare request to Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', provider === 'openai' ? 'whisper-1' : 'whisper-large-v3');

    if (language) {
      whisperFormData.append('language', language);
    }

    // Request transcription
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Transcribe] ${provider} error:`, errorText);
      return NextResponse.json(
        { error: `Transcription failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.text || '',
      confidence: 0.95, // Whisper doesn't return confidence, assume high
      language: result.language,
      duration: result.duration,
    });
  } catch (error: any) {
    console.error('[Transcribe] Error:', error);
    return NextResponse.json(
      { error: `Transcription error: ${error.message}` },
      { status: 500 }
    );
  }
}
