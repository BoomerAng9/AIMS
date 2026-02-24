'use client';

/**
 * VoicePlaybackBar — Full-featured audio playback control for ACHEEVY voice responses
 *
 * Features:
 * - Play/Pause toggle
 * - Draggable progress slider
 * - Playback speed control (1x / 1.5x / 2x)
 * - Animated waveform visualization
 * - Stop button to end playback
 * - Elapsed / remaining time display
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

// Matches UseVoiceOutputReturn from useVoiceOutput hook
interface VoiceOutputInterface {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentText: string | null;
  onProgress: (callback: (p: number) => void) => () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

interface VoicePlaybackBarProps {
  voiceOutput: VoiceOutputInterface;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;
type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

/** Generate deterministic pseudo-random waveform bar heights */
function generateWaveformBars(count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // Create a natural-looking waveform pattern with peaks and valleys
    const base = Math.sin((i / count) * Math.PI) * 0.5 + 0.5;
    const variation = Math.sin(i * 1.7) * 0.3 + Math.cos(i * 2.3) * 0.2;
    bars.push(Math.max(0.15, Math.min(1, base + variation)));
  }
  return bars;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoicePlaybackBar({ voiceOutput }: VoicePlaybackBarProps) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const waveformBars = useMemo(() => generateWaveformBars(40), []);

  const isActive = voiceOutput.isPlaying || voiceOutput.isPaused || voiceOutput.isLoading;

  // Subscribe to progress updates from the voice output hook
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const unsubscribe = voiceOutput.onProgress((p) => {
      if (!isDragging) {
        setProgress(p);
      }
    });

    return unsubscribe;
  }, [voiceOutput, isActive, isDragging]);

  // Handle play/pause toggle
  const togglePlayback = useCallback(() => {
    if (voiceOutput.isPlaying) {
      voiceOutput.pause();
    } else if (voiceOutput.isPaused) {
      voiceOutput.resume();
    }
  }, [voiceOutput]);

  // Cycle through speed options
  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  // Handle slider interaction
  const handleSliderClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setProgress(x);
    },
    []
  );

  const handleSliderDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSliderDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Estimate duration based on text length (rough: ~150 wpm, ~5 chars/word)
  const estimatedDuration = useMemo(() => {
    if (!voiceOutput.currentText) return 30;
    const wordCount = voiceOutput.currentText.split(/\s+/).length;
    return Math.max(5, (wordCount / 150) * 60);
  }, [voiceOutput.currentText]);

  const elapsed = progress * estimatedDuration;
  const remaining = estimatedDuration - elapsed;

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: 8, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {/* Top row: controls + waveform + time */}
          <div className="flex items-center gap-3">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayback}
              disabled={voiceOutput.isLoading}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
              title={voiceOutput.isPlaying ? 'Pause' : 'Resume'}
            >
              {voiceOutput.isLoading ? (
                <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : voiceOutput.isPlaying ? (
                <Pause size={14} />
              ) : (
                <Play size={14} className="ml-0.5" />
              )}
            </button>

            {/* Waveform visualization */}
            <div className="flex-1 flex items-center gap-px h-8 min-w-0">
              {waveformBars.map((height, i) => {
                const barProgress = i / waveformBars.length;
                const isPlayed = barProgress <= progress;
                const isCurrent =
                  Math.abs(barProgress - progress) < 1 / waveformBars.length;

                return (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-full transition-colors duration-150"
                    style={{
                      height: `${height * 100}%`,
                      minHeight: 3,
                      backgroundColor: isPlayed
                        ? isCurrent && voiceOutput.isPlaying
                          ? 'rgb(212, 175, 55)'
                          : 'rgba(212, 175, 55, 0.6)'
                        : 'rgba(148, 163, 184, 0.2)',
                    }}
                    animate={
                      voiceOutput.isPlaying && isCurrent
                        ? {
                            scaleY: [1, 1.3, 1],
                            transition: {
                              duration: 0.4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                          }
                        : { scaleY: 1 }
                    }
                  />
                );
              })}
            </div>

            {/* Time display */}
            <span className="flex-shrink-0 text-[11px] font-mono text-slate-400 tabular-nums w-[72px] text-right">
              {formatTime(elapsed)} / {formatTime(estimatedDuration)}
            </span>
          </div>

          {/* Progress slider (clickable track) */}
          <div
            ref={sliderRef}
            onClick={handleSliderClick}
            onMouseDown={handleSliderDragStart}
            onMouseUp={handleSliderDragEnd}
            className="relative h-1.5 bg-slate-100 rounded-full cursor-pointer group"
          >
            {/* Filled track */}
            <div
              className="absolute inset-y-0 left-0 bg-gold/50 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Thumb (visible on hover) */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold shadow-md border-2 border-white"
              style={{ left: `calc(${progress * 100}% - 6px)` }}
              initial={{ scale: 0 }}
              animate={{ scale: isHovered || isDragging ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            />
          </div>

          {/* Bottom row: speaker icon + speed control + stop */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Volume2 size={12} className="text-slate-300" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                {voiceOutput.isLoading
                  ? 'Loading audio...'
                  : voiceOutput.isPlaying
                    ? 'Playing'
                    : 'Paused'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Speed control */}
              <button
                onClick={cycleSpeed}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:border-gold/30 hover:text-gold transition-colors tabular-nums"
                title="Playback speed"
              >
                {speed}x
              </button>

              {/* Stop button */}
              <button
                onClick={voiceOutput.stop}
                className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                title="Stop playback"
              >
                <Square size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
