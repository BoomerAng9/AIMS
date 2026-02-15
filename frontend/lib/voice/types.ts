/**
 * Voice Service — Type Definitions
 *
 * Provider-agnostic types for TTS and STT services.
 * Supports ElevenLabs, Deepgram Aura-2, Groq Whisper, and Deepgram Nova-3.
 */

// ---------------------------------------------------------------------------
// TTS (Text-to-Speech)
// ---------------------------------------------------------------------------

export type TtsProvider = 'elevenlabs' | 'deepgram';

export interface TtsVoice {
  id: string;
  name: string;
  provider: TtsProvider;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  style?: string;
}

export interface TtsRequest {
  text: string;
  provider?: TtsProvider;
  voiceId?: string;
  model?: string;
  speed?: number;
  outputFormat?: 'mp3' | 'pcm' | 'opus';
}

export interface TtsConfig {
  primaryProvider: TtsProvider;
  fallbackProvider: TtsProvider;
  autoplay: boolean;
  defaultVoice: Record<TtsProvider, string>;
  defaultModel: Record<TtsProvider, string>;
}

// ---------------------------------------------------------------------------
// STT (Speech-to-Text)
// ---------------------------------------------------------------------------

export type SttProvider = 'groq' | 'deepgram';

export interface SttModel {
  id: string;
  name: string;
  provider: SttProvider;
  language: string;
  speed: string;
  price: string;
}

export interface SttRequest {
  provider?: SttProvider;
  model?: string;
  language?: string;
  /** Audio blob or file for transcription. */
  audio: Blob | File;
}

export interface SttResult {
  text: string;
  provider: SttProvider;
  model: string;
  confidence?: number;
  durationMs?: number;
  words?: Array<{ word: string; start: number; end: number; confidence: number }>;
}

export interface SttConfig {
  primaryProvider: SttProvider;
  fallbackProvider: SttProvider;
  defaultModel: Record<SttProvider, string>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TTS_CONFIG: TtsConfig = {
  primaryProvider: 'elevenlabs',
  fallbackProvider: 'deepgram',
  autoplay: true,
  defaultVoice: {
    elevenlabs: 'pNInz6obpgDQGcFmaJgB', // Adam — deep, professional
    deepgram: 'aura-2-orion-en',          // Orion — authoritative male
  },
  defaultModel: {
    elevenlabs: 'eleven_turbo_v2_5',
    deepgram: 'aura-2',
  },
};

export const DEFAULT_STT_CONFIG: SttConfig = {
  primaryProvider: 'groq',
  fallbackProvider: 'deepgram',
  defaultModel: {
    groq: 'whisper-large-v3-turbo',
    deepgram: 'nova-3',
  },
};

// ---------------------------------------------------------------------------
// Voice Catalog — Available Voices & Models
// ---------------------------------------------------------------------------

export const TTS_VOICES: TtsVoice[] = [
  // ElevenLabs voices (top picks for ACHEEVY)
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', provider: 'elevenlabs', language: 'en', gender: 'male', style: 'deep, professional' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs', language: 'en', gender: 'female', style: 'warm, clear' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', provider: 'elevenlabs', language: 'en', gender: 'male', style: 'articulate, precise' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', provider: 'elevenlabs', language: 'en', gender: 'female', style: 'soft, expressive' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: 'elevenlabs', language: 'en', gender: 'male', style: 'energetic, dynamic' },

  // Deepgram Aura-2 premium voices
  { id: 'aura-2-orion-en', name: 'Orion', provider: 'deepgram', language: 'en', gender: 'male', style: 'authoritative' },
  { id: 'aura-2-asteria-en', name: 'Asteria', provider: 'deepgram', language: 'en', gender: 'female', style: 'clear, professional' },
  { id: 'aura-2-zeus-en', name: 'Zeus', provider: 'deepgram', language: 'en', gender: 'male', style: 'commanding' },
  { id: 'aura-2-athena-en', name: 'Athena', provider: 'deepgram', language: 'en', gender: 'female', style: 'articulate, wise' },
  { id: 'aura-2-apollo-en', name: 'Apollo', provider: 'deepgram', language: 'en', gender: 'male', style: 'warm, balanced' },
  { id: 'aura-2-luna-en', name: 'Luna', provider: 'deepgram', language: 'en', gender: 'female', style: 'smooth, friendly' },
  { id: 'aura-2-hermes-en', name: 'Hermes', provider: 'deepgram', language: 'en', gender: 'male', style: 'quick, energetic' },
  { id: 'aura-2-hera-en', name: 'Hera', provider: 'deepgram', language: 'en', gender: 'female', style: 'regal, composed' },
  { id: 'aura-2-atlas-en', name: 'Atlas', provider: 'deepgram', language: 'en', gender: 'male', style: 'steady, reliable' },
  { id: 'aura-2-juno-en', name: 'Juno', provider: 'deepgram', language: 'en', gender: 'female', style: 'bright, confident' },
];

export const STT_MODELS: SttModel[] = [
  // Groq Whisper (primary STT)
  { id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo', provider: 'groq', language: 'multilingual', speed: '216x real-time', price: '$0.04/hr' },
  { id: 'whisper-large-v3', name: 'Whisper Large V3', provider: 'groq', language: 'multilingual', speed: '164x real-time', price: '$0.111/hr' },
  { id: 'distil-whisper-large-v3-en', name: 'Distil Whisper V3 (EN)', provider: 'groq', language: 'en', speed: '240x real-time', price: '$0.02/hr' },

  // Deepgram Nova-3 (fallback STT)
  { id: 'nova-3', name: 'Nova-3 General', provider: 'deepgram', language: 'multilingual', speed: 'sub-300ms', price: '$0.0077/min' },
  { id: 'nova-3-medical', name: 'Nova-3 Medical', provider: 'deepgram', language: 'en', speed: 'sub-300ms', price: '$0.0077/min' },
];
