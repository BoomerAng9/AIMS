/**
 * ACHEEVY Voice Configuration — "Smooth, cool-ass muhfukka" timbre presets.
 *
 * ElevenLabs primary, Deepgram fallback.
 * Consumed by the TTS API route and Circuit Box voice settings panel.
 */

// ─────────────────────────────────────────────────────────────
// ElevenLabs — "Velvet-Jet" Timbre Preset
// ─────────────────────────────────────────────────────────────

export const ELEVENLABS_ACHEEVY_PRESET = {
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam — deep, warm baseline
  model: 'eleven_turbo_v2_5',
  stability: 0.42,
  similarity_boost: 0.78,
  style: 0.65,
  use_speaker_boost: true,
} as const;

// ─────────────────────────────────────────────────────────────
// Deepgram Aura — Fallback Suave Preset
// ─────────────────────────────────────────────────────────────

export const DEEPGRAM_ACHEEVY_PRESET = {
  model: 'aura-2-orion-en',
  tone: 'suave',
  speed: 0.93,
} as const;

// ─────────────────────────────────────────────────────────────
// Persona voice map (Circuit Box can switch between modes)
// ─────────────────────────────────────────────────────────────

export type PersonaMode = 'SMOOTH' | 'CORPORATE';

export const VOICE_PRESETS: Record<PersonaMode, {
  elevenlabs: { voiceId: string; model: string; stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean };
  deepgram: { model: string; tone: string; speed: number };
  greeting: string;
  microCopy: { acknowledge: string; sending: string; error: string };
}> = {
  SMOOTH: {
    elevenlabs: ELEVENLABS_ACHEEVY_PRESET,
    deepgram: DEEPGRAM_ACHEEVY_PRESET,
    greeting:
      "I'm ACHEEVY, at your service. What will we deploy today?",
    microCopy: {
      acknowledge: "Got it, let's move.",
      sending: 'All good\u2014sending the container now.',
      error:
        "Hmm. That repo threw shade. I'll re-attempt after a lint pass\u2014stay loose.",
    },
  },
  CORPORATE: {
    elevenlabs: { ...ELEVENLABS_ACHEEVY_PRESET, stability: 0.6, style: 0.3 },
    deepgram: { ...DEEPGRAM_ACHEEVY_PRESET, speed: 1.0 },
    greeting:
      "I'm ACHEEVY, at your service. What will we deploy today?",
    microCopy: {
      acknowledge: 'Acknowledged. Processing.',
      sending: 'Deploying container now.',
      error: 'An error occurred. Retrying with corrected parameters.',
    },
  },
};

export const DEFAULT_PERSONA_MODE: PersonaMode = 'SMOOTH';
