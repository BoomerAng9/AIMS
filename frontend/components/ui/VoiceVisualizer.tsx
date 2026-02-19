'use client';

import React from 'react';
import { useAudioLevel } from '@/hooks/useAudioLevel';

interface VoiceVisualizerProps {
  stream: MediaStream | null;
  isListening: boolean;
  state: 'idle' | 'listening' | 'processing' | 'error';
}

export function VoiceVisualizer({ stream, isListening, state }: VoiceVisualizerProps) {
  const audioLevel = useAudioLevel(stream, isListening);
  const bars = 32;

  if (state === 'processing') {
    return (
      <div className="flex items-center justify-center gap-1 h-12 px-4">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-6 bg-gold/60 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
        <span className="ml-3 text-xs text-gold/80 font-mono uppercase tracking-wider animate-pulse">
          Transcribing
        </span>
      </div>
    );
  }

  if (state !== 'listening') return null;

  return (
    <div className="flex items-end justify-center gap-[2px] h-12 px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const position = Math.sin((i / bars) * Math.PI);
        const height = Math.max(
          3,
          audioLevel * 48 * position * (0.7 + Math.random() * 0.3)
        );
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              backgroundColor: `rgba(212, 175, 55, ${0.4 + audioLevel * 0.6})`,
            }}
          />
        );
      })}
    </div>
  );
}
