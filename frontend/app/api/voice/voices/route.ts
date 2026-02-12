/**
 * Voice Listing API — Fetches available voices from providers
 *
 * GET /api/voice/voices
 *
 * Returns voices from:
 * - ElevenLabs (user's premium voices from their account)
 * - DeepGram Aura-2 (built-in premium voices)
 */

import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

interface Voice {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'deepgram';
  preview_url?: string;
  labels?: Record<string, string>;
}

// DeepGram Aura-2 built-in voices
const DEEPGRAM_VOICES: Voice[] = [
  { id: 'aura-2-orion-en', name: 'Orion', provider: 'deepgram' },
  { id: 'aura-2-luna-en', name: 'Luna', provider: 'deepgram' },
  { id: 'aura-2-stella-en', name: 'Stella', provider: 'deepgram' },
  { id: 'aura-2-athena-en', name: 'Athena', provider: 'deepgram' },
  { id: 'aura-2-hera-en', name: 'Hera', provider: 'deepgram' },
  { id: 'aura-2-zeus-en', name: 'Zeus', provider: 'deepgram' },
  { id: 'aura-2-arcas-en', name: 'Arcas', provider: 'deepgram' },
  { id: 'aura-2-perseus-en', name: 'Perseus', provider: 'deepgram' },
];

export async function GET() {
  const voices: Voice[] = [];

  // Fetch ElevenLabs voices from user's account
  if (ELEVENLABS_API_KEY) {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      });

      if (res.ok) {
        const data = await res.json();
        const elVoices: Voice[] = (data.voices || []).map((v: any) => ({
          id: v.voice_id,
          name: v.name,
          provider: 'elevenlabs' as const,
          preview_url: v.preview_url,
          labels: v.labels,
        }));
        voices.push(...elVoices);
      } else {
        console.error(`[Voices] ElevenLabs returned ${res.status}`);
      }
    } catch (err) {
      console.error('[Voices] ElevenLabs fetch error:', err);
    }
  }

  // Add DeepGram voices if API key is configured
  if (DEEPGRAM_API_KEY) {
    voices.push(...DEEPGRAM_VOICES);
  }

  return NextResponse.json({
    voices,
    providers: {
      elevenlabs: !!ELEVENLABS_API_KEY,
      deepgram: !!DEEPGRAM_API_KEY,
    },
  });
}
