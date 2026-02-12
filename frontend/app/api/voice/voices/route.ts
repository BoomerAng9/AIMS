/**
 * Voice List API — Fetches available voices from ElevenLabs + Deepgram
 *
 * GET /api/voice/voices
 * Returns: { voices: VoiceOption[], provider: string }
 *
 * Pulls real voices from ElevenLabs API (tenant-bound).
 * Falls back to Deepgram Aura-2 voices if no ElevenLabs key.
 */

import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

interface VoiceOption {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'deepgram';
  category: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

// Deepgram Aura-2 premium voices (static — no list API available)
const DEEPGRAM_VOICES: VoiceOption[] = [
  { id: 'aura-2-orion-en', name: 'Orion', provider: 'deepgram', category: 'Male — Authoritative' },
  { id: 'aura-2-asteria-en', name: 'Asteria', provider: 'deepgram', category: 'Female — Professional' },
  { id: 'aura-2-zeus-en', name: 'Zeus', provider: 'deepgram', category: 'Male — Commanding' },
  { id: 'aura-2-athena-en', name: 'Athena', provider: 'deepgram', category: 'Female — Clear' },
  { id: 'aura-2-apollo-en', name: 'Apollo', provider: 'deepgram', category: 'Male — Warm' },
  { id: 'aura-2-luna-en', name: 'Luna', provider: 'deepgram', category: 'Female — Calm' },
  { id: 'aura-2-hermes-en', name: 'Hermes', provider: 'deepgram', category: 'Male — Energetic' },
  { id: 'aura-2-hera-en', name: 'Hera', provider: 'deepgram', category: 'Female — Authoritative' },
];

export async function GET() {
  const voices: VoiceOption[] = [];

  // Pull real voices from ElevenLabs API
  if (ELEVENLABS_API_KEY) {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      });

      if (res.ok) {
        const data = await res.json();
        for (const v of data.voices || []) {
          voices.push({
            id: v.voice_id,
            name: v.name,
            provider: 'elevenlabs',
            category: v.labels?.use_case || v.category || 'General',
            preview_url: v.preview_url,
            labels: v.labels,
          });
        }
      }
    } catch (err) {
      console.error('[Voices] ElevenLabs fetch failed:', err);
    }
  }

  // Add Deepgram voices if key is available
  if (DEEPGRAM_API_KEY) {
    voices.push(...DEEPGRAM_VOICES);
  }

  if (voices.length === 0) {
    return NextResponse.json(
      { error: 'No voice providers configured. Set ELEVENLABS_API_KEY or DEEPGRAM_API_KEY.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    voices,
    providers: {
      elevenlabs: Boolean(ELEVENLABS_API_KEY),
      deepgram: Boolean(DEEPGRAM_API_KEY),
    },
  });
}
