/**
 * useVoiceInput Hook
 * Captures audio from microphone and transcribes via Groq Whisper
 *
 * Flow: Mic → MediaRecorder → Blob → API → Groq Whisper → Text
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceInputState, TranscriptionResult, VoiceInputConfig } from '@/lib/chat/types';

interface UseVoiceInputOptions {
  onTranscript?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  config?: VoiceInputConfig;
}

interface UseVoiceInputReturn {
  state: VoiceInputState;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string | null;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<TranscriptionResult | null>;
  cancelListening: () => void;
  audioLevel: number;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onTranscript, onError, config } = options;

  const [state, setState] = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ─────────────────────────────────────────────────────────
  // Audio Level Visualization
  // ─────────────────────────────────────────────────────────

  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Start Listening
  // ─────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript(null);
    audioChunksRef.current = [];

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      startAudioLevelMonitoring(stream);

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording failed');
        setState('error');
        onError?.('Recording failed');
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setState('listening');
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Microphone access denied'
        : `Failed to start recording: ${err.message}`;

      setError(errorMsg);
      setState('error');
      onError?.(errorMsg);
    }
  }, [startAudioLevelMonitoring, onError]);

  // ─────────────────────────────────────────────────────────
  // Stop Listening & Transcribe
  // ─────────────────────────────────────────────────────────

  const stopListening = useCallback(async (): Promise<TranscriptionResult | null> => {
    if (!mediaRecorderRef.current || state !== 'listening') {
      return null;
    }

    setState('processing');
    stopAudioLevelMonitoring();

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Check if we have audio data
        if (audioBlob.size < 1000) {
          setError('No audio detected');
          setState('idle');
          resolve(null);
          return;
        }

        try {
          // Send to transcription API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('provider', config?.provider || 'groq');
          if (config?.language) {
            formData.append('language', config.language);
          }

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Transcription failed: ${response.statusText}`);
          }

          const result: TranscriptionResult = await response.json();

          setTranscript(result.text);
          setState('idle');
          onTranscript?.(result);
          resolve(result);
        } catch (err: any) {
          const errorMsg = `Transcription error: ${err.message}`;
          setError(errorMsg);
          setState('error');
          onError?.(errorMsg);
          resolve(null);
        }
      };

      mediaRecorder.stop();
    });
  }, [state, config, stopAudioLevelMonitoring, onTranscript, onError]);

  // ─────────────────────────────────────────────────────────
  // Cancel Listening
  // ─────────────────────────────────────────────────────────

  const cancelListening = useCallback(() => {
    if (mediaRecorderRef.current && state === 'listening') {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach(track => track.stop());
    stopAudioLevelMonitoring();

    audioChunksRef.current = [];
    setTranscript(null);
    setError(null);
    setState('idle');
  }, [state, stopAudioLevelMonitoring]);

  // ─────────────────────────────────────────────────────────
  // Cleanup on unmount
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      stopAudioLevelMonitoring();
    };
  }, [stopAudioLevelMonitoring]);

  return {
    state,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    transcript,
    error,
    startListening,
    stopListening,
    cancelListening,
    audioLevel,
  };
}
