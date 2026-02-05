/**
 * Text-to-Speech API Route
 * Converts text to audio using ElevenLabs
 *
 * POST /api/tts
 * Body: { text, voiceId?, speed? }
 * Returns: audio/mpeg stream
 */

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice IDs from ElevenLabs
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - friendly, clear
const VOICE_IDS: Record<string, string> = {
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  rachel: '21m00Tcm4TlvDq8ikWAM',
  drew: '29vD33N1CtxCmqQRPOHJ',
  clyde: '2EiwWnXFnvU5JabPnv8n',
  paul: '5Q0t7uMcjvnagumLfvZi',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  dave: 'CYw3kZ02Hs0563khs1Fj',
  fin: 'D38z5RcWu1voky8WS1ja',
  bella: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  arnold: 'VR6AewLTigWG4xSOukaG',
  adam: 'pNInz6obpgDQGcFmaJgB',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, speed = 1.0 } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.warn('[TTS] No ElevenLabs API key, using browser fallback signal');
      // Return a signal that the client should use browser TTS
      return NextResponse.json({ useBrowserTTS: true, text }, { status: 200 });
    }

    // Resolve voice ID
    const resolvedVoiceId = voiceId
      ? (VOICE_IDS[voiceId.toLowerCase()] || voiceId)
      : DEFAULT_VOICE_ID;

    // Request TTS from ElevenLabs
    const response = await fetch(`${ELEVENLABS_API_URL}/${resolvedVoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Latest fast model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] ElevenLabs error:', errorText);
      return NextResponse.json(
        { error: `TTS failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Stream audio back to client
    const audioData = await response.arrayBuffer();

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      { error: `TTS error: ${error.message}` },
      { status: 500 }
    );
  }
}
