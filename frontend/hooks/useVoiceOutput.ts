/**
 * useVoiceOutput Hook
 * Text-to-Speech via ElevenLabs with autoplay support
 *
 * Features:
 * - Autoplay when new text arrives
 * - Queue management for multiple messages
 * - Playback controls (pause, resume, stop)
 * - Audio caching for repeated phrases
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceOutputState, VoiceOutputConfig } from '@/lib/chat/types';

interface UseVoiceOutputOptions {
  config?: VoiceOutputConfig;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseVoiceOutputReturn {
  state: VoiceOutputState;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentText: string | null;
  error: string | null;
  progress: number;
  speak: (text: string, immediate?: boolean) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setAutoPlay: (enabled: boolean) => void;
  autoPlayEnabled: boolean;
}

// Audio cache for frequently used phrases
const audioCache = new Map<string, ArrayBuffer>();

export function useVoiceOutput(options: UseVoiceOutputOptions = {}): UseVoiceOutputReturn {
  const { config, onStart, onEnd, onError } = options;

  const [state, setState] = useState<VoiceOutputState>('idle');
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(config?.autoPlay ?? true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // ─────────────────────────────────────────────────────────
  // Initialize Audio Context
  // ─────────────────────────────────────────────────────────

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  // ─────────────────────────────────────────────────────────
  // Fetch TTS Audio from ElevenLabs
  // ─────────────────────────────────────────────────────────

  const fetchAudio = useCallback(async (text: string): Promise<ArrayBuffer> => {
    // Check cache first
    const cacheKey = `${config?.voiceId || 'default'}-${text}`;
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey)!;
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId: config?.voiceId,
        speed: config?.speed || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.statusText}`);
    }

    const audioData = await response.arrayBuffer();

    // Cache short phrases (under 200 chars)
    if (text.length < 200) {
      audioCache.set(cacheKey, audioData);
    }

    return audioData;
  }, [config?.voiceId, config?.speed]);

  // ─────────────────────────────────────────────────────────
  // Play Audio Buffer
  // ─────────────────────────────────────────────────────────

  const playAudioBuffer = useCallback(async (audioData: ArrayBuffer, startOffset = 0) => {
    const audioContext = getAudioContext();

    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));

    // Stop any currently playing audio
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    // Create new source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNodeRef.current!);

    sourceNodeRef.current = source;
    durationRef.current = audioBuffer.duration;
    startTimeRef.current = audioContext.currentTime - startOffset;

    // Handle completion
    source.onended = () => {
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        setProgress(1);
        setState('idle');
        setCurrentText(null);
        onEnd?.();

        // Process queue
        if (queueRef.current.length > 0) {
          const nextText = queueRef.current.shift()!;
          speak(nextText);
        }
      }
    };

    // Start playback
    source.start(0, startOffset);
    isPlayingRef.current = true;

    // Update progress
    const updateProgress = () => {
      if (isPlayingRef.current && audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setProgress(Math.min(elapsed / durationRef.current, 1));
        requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
  }, [getAudioContext, onEnd]);

  // ─────────────────────────────────────────────────────────
  // Main Speak Function
  // ─────────────────────────────────────────────────────────

  const speak = useCallback(async (text: string, immediate = false) => {
    if (!text.trim()) return;

    // If already playing and not immediate, queue it
    if (isPlayingRef.current && !immediate) {
      queueRef.current.push(text);
      return;
    }

    // If immediate, stop current playback
    if (immediate && isPlayingRef.current) {
      stop();
    }

    setError(null);
    setCurrentText(text);
    setState('loading');
    setProgress(0);

    try {
      const audioData = await fetchAudio(text);
      setState('playing');
      onStart?.();
      await playAudioBuffer(audioData);
    } catch (err: any) {
      const errorMsg = `Voice output error: ${err.message}`;
      setError(errorMsg);
      setState('error');
      onError?.(errorMsg);
      isPlayingRef.current = false;

      // Try next in queue
      if (queueRef.current.length > 0) {
        const nextText = queueRef.current.shift()!;
        speak(nextText);
      }
    }
  }, [fetchAudio, playAudioBuffer, onStart, onError]);

  // ─────────────────────────────────────────────────────────
  // Playback Controls
  // ─────────────────────────────────────────────────────────

  const pause = useCallback(() => {
    if (state === 'playing' && audioContextRef.current) {
      pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      sourceNodeRef.current?.stop();
      isPlayingRef.current = false;
      setState('paused');
    }
  }, [state]);

  const resume = useCallback(async () => {
    if (state === 'paused' && currentText) {
      try {
        const audioData = await fetchAudio(currentText);
        setState('playing');
        isPlayingRef.current = true;
        await playAudioBuffer(audioData, pausedAtRef.current);
      } catch (err: any) {
        setError(`Resume failed: ${err.message}`);
        setState('error');
      }
    }
  }, [state, currentText, fetchAudio, playAudioBuffer]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    isPlayingRef.current = false;
    queueRef.current = [];
    setProgress(0);
    setCurrentText(null);
    setState('idle');
  }, []);

  const setAutoPlay = useCallback((enabled: boolean) => {
    setAutoPlayEnabled(enabled);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    state,
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isLoading: state === 'loading',
    currentText,
    error,
    progress,
    speak,
    pause,
    resume,
    stop,
    setAutoPlay,
    autoPlayEnabled,
  };
}
