'use client';

import React, { useRef, useEffect } from 'react';
import { useAudioAnalyser } from '@/hooks/useAudioAnalyser';

interface VoiceVisualizerProps {
  stream: MediaStream | null;
  isListening: boolean;
  state: 'idle' | 'listening' | 'processing' | 'error';
}

export function VoiceVisualizer({ stream, isListening, state }: VoiceVisualizerProps) {
  // Use custom hook to get AnalyserNode directly, avoiding frequent React state updates
  const analyser = useAudioAnalyser(stream, isListening);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    // If we are processing, or not listening, or no analyser, stop animation
    if (state !== 'listening' || !analyser || !canvasRef.current) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = 0;
        }
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration to match original design
    const bars = 32;
    const barWidth = 4; // w-1 = 4px
    const gap = 2;      // gap-[2px] = 2px
    const totalWidth = bars * barWidth + (bars - 1) * gap;

    // Ensure canvas size matches the design
    canvas.width = totalWidth;
    canvas.height = 48; // h-12 = 48px

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume for the "bouncing arch" effect
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      const audioLevel = average / 255;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        // Calculate arch position (sine wave)
        const position = Math.sin((i / bars) * Math.PI);

        // Add random jitter (0.7 to 1.0) to match original "organic" look
        const jitter = 0.7 + Math.random() * 0.3;

        // Calculate height: max 48px, scaled by audioLevel, position, and jitter
        // Min height 3px
        const height = Math.max(
          3,
          audioLevel * 48 * position * jitter
        );

        const x = i * (barWidth + gap);
        const y = canvas.height - height;

        // Color: Gold with opacity based on level
        const alpha = 0.4 + audioLevel * 0.6;
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;

        // Draw rounded bar
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
           (ctx as any).roundRect(x, y, barWidth, height, barWidth / 2);
        } else {
           // Fallback for older browsers
           ctx.rect(x, y, barWidth, height);
        }
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [analyser, state]);

  // Render "Processing" state separately as before
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
    <div className="flex items-center justify-center h-12 px-4">
      <canvas
        ref={canvasRef}
        // Width and height are set in useEffect for high DPI sharpness if needed,
        // but here we set default intrinsic size to match calculation
        width={190}
        height={48}
        // No CSS width/height to force scaling, we let it be intrinsic size
      />
    </div>
  );
}
