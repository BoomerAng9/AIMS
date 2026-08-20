/**
 * ACHEEVY Voice Configuration — "Smooth, cool-ass muhfukka" timbre presets.
 *
 * Inworld primary (cloned voice only — owner directive 2026-08-19: "we're only pulling over cloned
 * voices from Inworld"), Deepgram fallback. ElevenLabs is not used anywhere in ACHEEVY's voice path,
 * not even as a fallback.
 * Consumed by the TTS API route and Circuit Box voice settings panel.
 */

// ─────────────────────────────────────────────────────────────
// Inworld — ACHEEVY's cloned Void-Caster voice (canonical)
// ─────────────────────────────────────────────────────────────

export const INWORLD_ACHEEVY_PRESET = {
  // real voiceId proven live against GET /tts/v1/voices (displayName "ACHEEVY-VoidCaster-canonical-v2",
  // tags: acheevy, void-caster, canonical) — the actual API voiceId field, not the display name.
  voiceId: 'default-4zhua1rhxjfl50z1dnkcba__acheevy-voidcaster-canonical-v2',
  model: 'inworld-tts-2',
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
  inworld: { voiceId: string; model: string };
  deepgram: { model: string; tone: string; speed: number };
  greeting: string;
  microCopy: { acknowledge: string; sending: string; error: string };
}> = {
  SMOOTH: {
    inworld: INWORLD_ACHEEVY_PRESET,
    deepgram: DEEPGRAM_ACHEEVY_PRESET,
    greeting:
      "I'm ACHEEVY, at your service. What will we deploy today?",
    microCopy: {
      acknowledge: "Got it, let's move.",
      sending: 'All good—sending the container now.',
      error:
        "Hmm. That repo threw shade. I'll re-attempt after a lint pass—stay loose.",
    },
  },
  CORPORATE: {
    inworld: INWORLD_ACHEEVY_PRESET,
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
