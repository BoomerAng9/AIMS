import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useAudioLevel Hook
 * Analyzes an audio stream and returns the normalized audio level (0-1).
 * Uses requestAnimationFrame to update the level efficiently.
 */
export function useAudioLevel(stream: MediaStream | null, isListening: boolean): number {
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startMonitoring = useCallback((currentStream: MediaStream) => {
    // Create AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    // Create AnalyserNode
    const source = audioContext.createMediaStreamSource(currentStream);
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

  const stopMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    if (isListening && stream) {
      startMonitoring(stream);
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
      // Note: We don't close AudioContext here as it might be reused or managed externally
    };
  }, [isListening, stream, startMonitoring, stopMonitoring]);

  return audioLevel;
}
