/**
 * Voice Service — Public API
 *
 * Voice stack for A.I.M.S.:
 * - TTS: ElevenLabs (primary) → Deepgram Aura-2 (fallback)
 * - STT: Groq Whisper (primary) → Deepgram Nova-3 (fallback)
 * - Autoplay: ACHEEVY replies are spoken automatically
 */

export type {
  TtsProvider,
  TtsVoice,
  TtsRequest,
  TtsConfig,
  SttProvider,
  SttModel,
  SttRequest,
  SttResult,
  SttConfig,
} from './types';

export {
  DEFAULT_TTS_CONFIG,
  DEFAULT_STT_CONFIG,
  TTS_VOICES,
  STT_MODELS,
} from './types';

export { sanitizeForTTS } from './sanitize';

export { useVoice } from './use-voice';
export type { VoiceSettings, UseVoiceReturn } from './use-voice';
