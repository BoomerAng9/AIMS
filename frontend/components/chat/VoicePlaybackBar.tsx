'use client';

import { useState, useEffect } from 'react';

// Minimal interface to avoid circular dependency or waiting for types
// This matches the new UseVoiceOutputReturn interface we will implement
interface VoiceOutputInterface {
  isPlaying: boolean;
  isPaused: boolean;
  onProgress: (callback: (p: number) => void) => () => void;
}

export function VoicePlaybackBar({ voiceOutput }: { voiceOutput: VoiceOutputInterface }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset progress when not playing/paused
    if (!voiceOutput.isPlaying && !voiceOutput.isPaused) {
      setProgress(0);
      return;
    }

    // Subscribe to progress updates
    // The subscription function returns an unsubscribe function
    const unsubscribe = voiceOutput.onProgress((p) => {
      setProgress(p);
    });

    return unsubscribe;
  }, [voiceOutput, voiceOutput.isPlaying, voiceOutput.isPaused]);

  if (!voiceOutput.isPlaying && !voiceOutput.isPaused && progress === 0) return null;

  return (
    <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-gold/60 rounded-full transition-all duration-200"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
