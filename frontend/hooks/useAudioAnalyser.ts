import { useState, useRef, useEffect } from 'react';

export function useAudioAnalyser(stream: MediaStream | null, isListening: boolean): AnalyserNode | null {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isListening && stream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const newAnalyser = audioContext.createAnalyser();
      newAnalyser.fftSize = 256;
      source.connect(newAnalyser);

      setAnalyser(newAnalyser);

      return () => {
        // Cleanup nodes
        source.disconnect();
        newAnalyser.disconnect();
        // We don't close the context here as it might be reused or managed externally,
        // but we ensure nodes are disconnected to prevent leaks.
      };
    } else {
      setAnalyser(null);
    }
  }, [isListening, stream]);

  return analyser;
}
