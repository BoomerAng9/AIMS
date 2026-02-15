'use client';

/**
 * useVoice — React hook for TTS autoplay + STT recording
 *
 * Wires into any chat interface to:
 * 1. Autoplay ACHEEVY replies via TTS (ElevenLabs → Deepgram fallback)
 * 2. Record user speech via STT (Groq Whisper → Deepgram Nova-3 fallback)
 * 3. Expose voice model selection for both TTS and STT providers
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TtsProvider, SttProvider } from './types';
import { DEFAULT_TTS_CONFIG, DEFAULT_STT_CONFIG } from './types';
import { sanitizeForTTS } from './sanitize';

export interface VoiceSettings {
  ttsEnabled: boolean;
  ttsProvider: TtsProvider;
  ttsVoiceId: string;
  sttProvider: SttProvider;
  sttModel: string;
}

export interface UseVoiceReturn {
  /** Current voice settings. */
  settings: VoiceSettings;
  /** Update a single setting. */
  updateSettings: (patch: Partial<VoiceSettings>) => void;
  /** Speak text via TTS. Returns when playback starts. */
  speak: (text: string) => Promise<void>;
  /** Stop current TTS playback. */
  stopSpeaking: () => void;
  /** Whether TTS is currently playing. */
  isSpeaking: boolean;
  /** Start recording audio for STT. */
  startRecording: () => Promise<void>;
  /** Stop recording and get transcription. */
  stopRecording: () => Promise<string>;
  /** Whether currently recording. */
  isRecording: boolean;
  /** Whether STT is processing. */
  isTranscribing: boolean;
  /** Last TTS provider used (for display). */
  lastTtsProvider: string | null;
}

const SETTINGS_KEY = 'aims_voice_settings';

function loadSettings(): VoiceSettings {
  if (typeof window === 'undefined') {
    return {
      ttsEnabled: true,
      ttsProvider: DEFAULT_TTS_CONFIG.primaryProvider,
      ttsVoiceId: DEFAULT_TTS_CONFIG.defaultVoice[DEFAULT_TTS_CONFIG.primaryProvider],
      sttProvider: DEFAULT_STT_CONFIG.primaryProvider,
      sttModel: DEFAULT_STT_CONFIG.defaultModel[DEFAULT_STT_CONFIG.primaryProvider],
    };
  }
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    ttsEnabled: true,
    ttsProvider: DEFAULT_TTS_CONFIG.primaryProvider,
    ttsVoiceId: DEFAULT_TTS_CONFIG.defaultVoice[DEFAULT_TTS_CONFIG.primaryProvider],
    sttProvider: DEFAULT_STT_CONFIG.primaryProvider,
    sttModel: DEFAULT_STT_CONFIG.defaultModel[DEFAULT_STT_CONFIG.primaryProvider],
  };
}

export function useVoice(): UseVoiceReturn {
  const [settings, setSettings] = useState<VoiceSettings>(loadSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastTtsProvider, setLastTtsProvider] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Persist settings
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  // ─── TTS ──────────────────────────────────────────────────

  const speak = useCallback(async (text: string) => {
    if (!settings.ttsEnabled || !text.trim()) return;

    // Strip markdown formatting so TTS doesn't read "star star", "pound", etc.
    const cleanText = sanitizeForTTS(text);
    if (!cleanText) return;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          provider: settings.ttsProvider,
          voiceId: settings.ttsVoiceId,
        }),
      });

      if (!res.ok) {
        console.warn('[Voice] TTS failed:', res.status);
        return;
      }

      const provider = res.headers.get('X-TTS-Provider');
      setLastTtsProvider(provider);

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('[Voice] TTS error:', err);
      setIsSpeaking(false);
    }
  }, [settings.ttsEnabled, settings.ttsProvider, settings.ttsVoiceId]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  // ─── STT ──────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Collect chunks every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error('[Voice] Mic access denied:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        resolve('');
        return;
      }

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        // Stop all mic tracks
        recorder.stream.getTracks().forEach(t => t.stop());

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('provider', settings.sttProvider);
          formData.append('model', settings.sttModel);

          const res = await fetch('/api/voice/stt', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setIsTranscribing(false);
            resolve(data.text || '');
          } else {
            setIsTranscribing(false);
            resolve('');
          }
        } catch (err) {
          console.error('[Voice] STT error:', err);
          setIsTranscribing(false);
          resolve('');
        }
      };

      recorder.stop();
    });
  }, [settings.sttProvider, settings.sttModel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    settings,
    updateSettings,
    speak,
    stopSpeaking,
    isSpeaking,
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    lastTtsProvider,
  };
}
