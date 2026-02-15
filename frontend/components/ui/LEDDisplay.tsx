'use client';

/**
 * LED Dot-Matrix Display Components
 *
 * Airport/industrial style LED displays for A.I.M.S.
 * Uses champagne/amber/gold brand colors.
 */

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Brand Colors
// ─────────────────────────────────────────────────────────────

export const AIMS_COLORS = {
  champagne: '#D4AF37',
  amber: '#F5DEB3',
  gold: '#FFD700',
  deepsea: '#0A1628',
  surface: '#111827',
  glow: '#D4AF3788',
};

// ─────────────────────────────────────────────────────────────
// 5x7 Dot Matrix Font
// ─────────────────────────────────────────────────────────────

const DOT_MATRIX_FONT: Record<string, number[]> = {
  'A': [0x1F, 0x28, 0x48, 0x28, 0x1F],
  'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7F, 0x41, 0x41, 0x41, 0x3E],
  'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7F, 0x48, 0x48, 0x48, 0x40],
  'G': [0x3E, 0x41, 0x49, 0x49, 0x2E],
  'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
  'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
  'J': [0x06, 0x01, 0x01, 0x01, 0x7E],
  'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7F, 0x01, 0x01, 0x01, 0x01],
  'M': [0x7F, 0x20, 0x10, 0x20, 0x7F],
  'N': [0x7F, 0x10, 0x08, 0x04, 0x7F],
  'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
  'P': [0x7F, 0x48, 0x48, 0x48, 0x30],
  'Q': [0x3E, 0x41, 0x45, 0x42, 0x3D],
  'R': [0x7F, 0x48, 0x4C, 0x4A, 0x31],
  'S': [0x32, 0x49, 0x49, 0x49, 0x26],
  'T': [0x40, 0x40, 0x7F, 0x40, 0x40],
  'U': [0x7E, 0x01, 0x01, 0x01, 0x7E],
  'V': [0x7C, 0x02, 0x01, 0x02, 0x7C],
  'W': [0x7F, 0x02, 0x04, 0x02, 0x7F],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x60, 0x10, 0x0F, 0x10, 0x60],
  'Z': [0x43, 0x45, 0x49, 0x51, 0x61],
  '0': [0x3E, 0x45, 0x49, 0x51, 0x3E],
  '1': [0x00, 0x21, 0x7F, 0x01, 0x00],
  '2': [0x27, 0x49, 0x49, 0x49, 0x31],
  '3': [0x22, 0x41, 0x49, 0x49, 0x36],
  '4': [0x0C, 0x14, 0x24, 0x7F, 0x04],
  '5': [0x72, 0x51, 0x51, 0x51, 0x4E],
  '6': [0x3E, 0x49, 0x49, 0x49, 0x26],
  '7': [0x40, 0x47, 0x48, 0x50, 0x60],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x32, 0x49, 0x49, 0x49, 0x3E],
  '.': [0x00, 0x00, 0x01, 0x00, 0x00],
  ',': [0x00, 0x00, 0x05, 0x06, 0x00],
  ':': [0x00, 0x00, 0x36, 0x00, 0x00],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '$': [0x24, 0x2A, 0x7F, 0x2A, 0x12],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62],
  '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
  '!': [0x00, 0x00, 0x7D, 0x00, 0x00],
  '?': [0x20, 0x40, 0x4D, 0x48, 0x30],
  '/': [0x01, 0x02, 0x04, 0x08, 0x10],
  '(': [0x00, 0x1C, 0x22, 0x41, 0x00],
  ')': [0x00, 0x41, 0x22, 0x1C, 0x00],
};

// ─────────────────────────────────────────────────────────────
// LED Dot Matrix Character
// ─────────────────────────────────────────────────────────────

interface LEDCharProps {
  char: string;
  size?: number;
  color?: string;
  dimColor?: string;
}

function LEDChar({ char, size = 3, color = AIMS_COLORS.champagne, dimColor = '#1a1a1a' }: LEDCharProps) {
  const pattern = DOT_MATRIX_FONT[char.toUpperCase()] || DOT_MATRIX_FONT[' '];

  return (
    <div className="flex gap-px">
      {pattern.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-px">
          {[...Array(7)].map((_, rowIdx) => {
            const isOn = (col >> (6 - rowIdx)) & 1;
            return (
              <div
                key={rowIdx}
                className="rounded-full transition-all duration-100"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: isOn ? color : dimColor,
                  boxShadow: isOn ? `0 0 ${size * 2}px ${color}` : 'none',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LED Text Display
// ─────────────────────────────────────────────────────────────

interface LEDTextProps {
  text: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const SIZE_MAP = { sm: 2, md: 3, lg: 4, xl: 5 };

export function LEDText({ text, size = 'md', color = AIMS_COLORS.champagne, className = '' }: LEDTextProps) {
  const dotSize = SIZE_MAP[size];

  return (
    <div className={`flex gap-1 ${className}`}>
      {text.split('').map((char, idx) => (
        <LEDChar key={idx} char={char} size={dotSize} color={color} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LED Panel (with screws/rivets)
// ─────────────────────────────────────────────────────────────

interface LEDPanelProps {
  children: React.ReactNode;
  className?: string;
  showScrews?: boolean;
}

export function LEDPanel({ children, className = '', showScrews = true }: LEDPanelProps) {
  return (
    <div
      className={`
        relative rounded-xl p-4
        bg-gradient-to-b from-zinc-900/95 to-black
        border border-zinc-700/50
        ${className}
      `}
      style={{
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.05),
          inset 0 -2px 10px rgba(0,0,0,0.5),
          0 4px 20px rgba(0,0,0,0.5)
        `,
      }}
    >
      {/* Corner screws */}
      {showScrews && (
        <>
          <Screw position="top-left" />
          <Screw position="top-right" />
          <Screw position="bottom-left" />
          <Screw position="bottom-right" />
        </>
      )}
      {children}
    </div>
  );
}

function Screw({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600`}
      style={{
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-0.5 bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Voice Waveform Visualizer
// ─────────────────────────────────────────────────────────────

interface VoiceWaveformProps {
  isActive?: boolean;
  audioLevel?: number;
  color?: string;
  height?: number;
  bars?: number;
}

export function VoiceWaveform({
  isActive = false,
  audioLevel = 0,
  color = AIMS_COLORS.champagne,
  height = 60,
  bars = 40,
}: VoiceWaveformProps) {
  const [levels, setLevels] = useState<number[]>(Array(bars).fill(0.1));

  useEffect(() => {
    if (!isActive) {
      setLevels(Array(bars).fill(0.1));
      return;
    }

    const interval = setInterval(() => {
      setLevels(prev => prev.map((_, i) => {
        // Create wave pattern from center
        const center = bars / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const baseLevel = 0.2 + (audioLevel * 0.8 * (1 - distFromCenter * 0.5));
        const noise = Math.random() * 0.3;
        return Math.min(1, Math.max(0.1, baseLevel + noise));
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, audioLevel, bars]);

  return (
    <div
      className="flex items-center justify-center gap-px"
      style={{ height }}
    >
      {levels.map((level, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            backgroundColor: color,
            boxShadow: isActive ? `0 0 8px ${color}` : 'none',
          }}
          animate={{
            height: level * height,
            opacity: 0.4 + level * 0.6,
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LED Balance Display
// ─────────────────────────────────────────────────────────────

interface LEDBalanceProps {
  value: number;
  label?: string;
  prefix?: string;
  color?: string;
}

export function LEDBalance({
  value,
  label = 'BALANCE',
  prefix = '$',
  color = AIMS_COLORS.champagne,
}: LEDBalanceProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <LEDPanel className="inline-block">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">{label}</p>
      <LEDText text={`${prefix}${formatted}`} size="lg" color={color} />
    </LEDPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// Voice Command Button
// ─────────────────────────────────────────────────────────────

interface VoiceButtonProps {
  isListening?: boolean;
  isProcessing?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceButton({
  isListening = false,
  isProcessing = false,
  onClick,
  size = 'md',
}: VoiceButtonProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={`
        relative ${sizeClasses[size]} rounded-full
        bg-gradient-to-b from-zinc-800 to-zinc-900
        border-2 border-zinc-700
        flex items-center justify-center
        transition-all hover:border-gold/20
        disabled:opacity-50
      `}
      style={{
        boxShadow: isListening
          ? `0 0 30px ${AIMS_COLORS.champagne}44, inset 0 0 20px ${AIMS_COLORS.champagne}22`
          : 'inset 0 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      {/* Pulsing ring when listening */}
      {isListening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: AIMS_COLORS.champagne }}
            animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: AIMS_COLORS.champagne }}
            animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}

      {/* Mic icon */}
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isListening ? AIMS_COLORS.champagne : '#71717a'}
        strokeWidth="2"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Activity List Item
// ─────────────────────────────────────────────────────────────

interface ActivityItemProps {
  label: string;
  value: string;
  type?: 'default' | 'positive' | 'negative';
}

export function ActivityItem({ label, value, type = 'default' }: ActivityItemProps) {
  const colors = {
    default: AIMS_COLORS.champagne,
    positive: '#22c55e',
    negative: '#ef4444',
  };

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800"
    >
      <span className="text-zinc-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className="font-mono font-medium"
          style={{ color: colors[type] }}
        >
          {value}
        </span>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[type],
            boxShadow: `0 0 8px ${colors[type]}`,
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: 'active' | 'listening' | 'processing' | 'idle';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    active: { color: '#22c55e', text: label || 'ACTIVE' },
    listening: { color: AIMS_COLORS.champagne, text: label || 'LISTENING' },
    processing: { color: '#3b82f6', text: label || 'PROCESSING' },
    idle: { color: '#71717a', text: label || 'IDLE' },
  };

  const config = configs[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
        animate={status !== 'idle' ? { opacity: [1, 0.4, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <LEDText text={config.text} size="sm" color={config.color} />
    </div>
  );
}

export default {
  LEDText,
  LEDPanel,
  LEDBalance,
  VoiceWaveform,
  VoiceButton,
  ActivityItem,
  StatusBadge,
  AIMS_COLORS,
};
