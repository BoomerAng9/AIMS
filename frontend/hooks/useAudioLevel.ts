import { useState, useRef, useEffect } from 'react';
import { useAudioAnalyser } from './useAudioAnalyser';

export { useAudioAnalyser }; // Re-export for convenience if needed

/**
 * useAudioLevel Hook
 * Analyzes an audio stream and returns the normalized audio level (0-1).
 * Uses requestAnimationFrame to update the level efficiently.
 *
 * Note: This hook triggers frequent state updates (60fps).
 * For high-performance visualizations, use `useAudioAnalyser` directly with a Canvas.
 */
export function useAudioLevel(stream: MediaStream | null, isListening: boolean): number {
  const [audioLevel, setAudioLevel] = useState(0);
  const analyser = useAudioAnalyser(stream, isListening);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser) {
      setAudioLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      // Calculate average volume
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;

      setAudioLevel(average / 255); // Normalize to 0-1
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [analyser]);

  return audioLevel;
}
