'use client';

/**
 * Nixie Tube Display Component
 *
 * Retro vacuum tube aesthetic for real-time numerical displays.
 * Perfect for stats, costs, tokens, scores, and live data.
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Single Nixie Digit
// ─────────────────────────────────────────────────────────────

interface NixieDigitProps {
  value: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowColor?: string;
}

const SIZES = {
  sm: { tube: 'w-8 h-12', digit: 'text-2xl', glow: 4 },
  md: { tube: 'w-12 h-18', digit: 'text-4xl', glow: 6 },
  lg: { tube: 'w-16 h-24', digit: 'text-5xl', glow: 8 },
  xl: { tube: 'w-20 h-32', digit: 'text-6xl', glow: 12 },
};

function NixieDigit({ value, size = 'md', glowColor = '#ff6b1a' }: NixieDigitProps) {
  const sizeConfig = SIZES[size];

  return (
    <div
      className={`
        relative ${sizeConfig.tube} rounded-t-full rounded-b-lg
        bg-gradient-to-b from-zinc-800/80 via-zinc-900/90 to-zinc-950
        border border-zinc-700/50
        flex items-center justify-center
        overflow-hidden
      `}
      style={{
        boxShadow: `
          inset 0 -20px 30px rgba(0,0,0,0.8),
          inset 0 2px 10px rgba(255,255,255,0.05)
        `,
      }}
    >
      {/* Glass reflection */}
      <div
        className="absolute inset-0 rounded-t-full"
        style={{
          background: `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.1) 0%,
              transparent 40%,
              transparent 60%,
              rgba(255,255,255,0.03) 100%
            )
          `,
        }}
      />

      {/* Tube base rings */}
      <div className="absolute bottom-0 left-0 right-0 h-4">
        <div className="absolute bottom-3 left-1 right-1 h-1 bg-zinc-600 rounded-full" />
        <div className="absolute bottom-1 left-0 right-0 h-2 bg-gradient-to-t from-zinc-700 to-zinc-800 rounded-b-lg" />
      </div>

      {/* Internal mesh/grid */}
      <div
        className="absolute inset-x-2 top-2 bottom-6 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(100,100,100,0.3) 2px,
              rgba(100,100,100,0.3) 3px
            )
          `,
        }}
      />

      {/* Glowing digit */}
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className={`
            relative z-10 font-mono font-bold ${sizeConfig.digit}
            select-none
          `}
          style={{
            color: glowColor,
            textShadow: `
              0 0 ${sizeConfig.glow}px ${glowColor},
              0 0 ${sizeConfig.glow * 2}px ${glowColor},
              0 0 ${sizeConfig.glow * 3}px ${glowColor}88,
              0 0 ${sizeConfig.glow * 5}px ${glowColor}44
            `,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>

      {/* Ambient tube glow */}
      <div
        className="absolute inset-0 rounded-t-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center 40%, ${glowColor}15 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nixie Tube Display (Multi-digit)
// ─────────────────────────────────────────────────────────────

interface NixieTubeDisplayProps {
  value: number | string;
  digits?: number;
  decimals?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowColor?: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  animate?: boolean;
}

export function NixieTubeDisplay({
  value,
  digits = 4,
  decimals = 0,
  size = 'md',
  glowColor = '#ff6b1a',
  label,
  prefix,
  suffix,
  animate = true,
}: NixieTubeDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);

  // Animate value changes
  useEffect(() => {
    if (!animate || typeof value !== 'number' || typeof displayValue !== 'number') {
      setDisplayValue(value);
      return;
    }

    const numValue = value as number;
    const numDisplay = displayValue as number;
    const diff = numValue - numDisplay;

    if (Math.abs(diff) < 0.01) {
      setDisplayValue(value);
      return;
    }

    const step = diff / 10;
    const timer = setTimeout(() => {
      setDisplayValue(numDisplay + step);
    }, 30);

    return () => clearTimeout(timer);
  }, [value, displayValue, animate]);

  // Format the display string
  const displayString = useMemo(() => {
    let str: string;

    if (typeof displayValue === 'number') {
      str = displayValue.toFixed(decimals);
    } else {
      str = String(displayValue);
    }

    // Pad with leading zeros if needed
    const [intPart, decPart] = str.split('.');
    const paddedInt = intPart.padStart(digits - (decimals > 0 ? decimals + 1 : 0), '0');

    return decimals > 0 ? `${paddedInt}.${decPart || '0'.repeat(decimals)}` : paddedInt;
  }, [displayValue, digits, decimals]);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs uppercase tracking-wider text-white/40 font-medium">
          {label}
        </span>
      )}

      <div className="flex items-end gap-1">
        {prefix && (
          <span
            className="text-lg font-medium mb-2 mr-1"
            style={{ color: glowColor, opacity: 0.8 }}
          >
            {prefix}
          </span>
        )}

        {displayString.split('').map((char, i) => (
          <div key={i} className={char === '.' ? 'flex items-end' : ''}>
            {char === '.' ? (
              <div
                className="w-2 h-2 rounded-full mb-2 mx-0.5"
                style={{
                  backgroundColor: glowColor,
                  boxShadow: `0 0 8px ${glowColor}, 0 0 16px ${glowColor}88`,
                }}
              />
            ) : (
              <NixieDigit value={char} size={size} glowColor={glowColor} />
            )}
          </div>
        ))}

        {suffix && (
          <span
            className="text-lg font-medium mb-2 ml-1"
            style={{ color: glowColor, opacity: 0.8 }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nixie Stats Panel (Multiple displays)
// ─────────────────────────────────────────────────────────────

interface NixieStat {
  id: string;
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  digits?: number;
  decimals?: number;
  glowColor?: string;
}

interface NixieStatsPanelProps {
  stats: NixieStat[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NixieStatsPanel({ stats, size = 'sm', className = '' }: NixieStatsPanelProps) {
  return (
    <div
      className={`
        flex flex-wrap gap-6 p-4 rounded-xl
        bg-gradient-to-b from-zinc-900/95 to-black
        border border-zinc-800/50
        backdrop-blur-sm
        ${className}
      `}
      style={{
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.05),
          0 4px 20px rgba(0,0,0,0.5)
        `,
      }}
    >
      {stats.map((stat) => (
        <NixieTubeDisplay
          key={stat.id}
          value={stat.value}
          label={stat.label}
          prefix={stat.prefix}
          suffix={stat.suffix}
          digits={stat.digits || 4}
          decimals={stat.decimals || 0}
          size={size}
          glowColor={stat.glowColor || '#ff6b1a'}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nixie Clock Display
// ─────────────────────────────────────────────────────────────

interface NixieClockProps {
  showSeconds?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NixieClock({ showSeconds = true, size = 'md' }: NixieClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {hours.split('').map((d, i) => (
          <NixieDigit key={`h${i}`} value={d} size={size} />
        ))}
      </div>

      <div className="flex flex-col gap-2 mx-1">
        <div className="w-2 h-2 rounded-full bg-orange-500" style={{ boxShadow: '0 0 8px #ff6b1a' }} />
        <div className="w-2 h-2 rounded-full bg-orange-500" style={{ boxShadow: '0 0 8px #ff6b1a' }} />
      </div>

      <div className="flex gap-1">
        {minutes.split('').map((d, i) => (
          <NixieDigit key={`m${i}`} value={d} size={size} />
        ))}
      </div>

      {showSeconds && (
        <>
          <div className="flex flex-col gap-2 mx-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" style={{ boxShadow: '0 0 8px #ff6b1a' }} />
            <div className="w-2 h-2 rounded-full bg-orange-500" style={{ boxShadow: '0 0 8px #ff6b1a' }} />
          </div>
          <div className="flex gap-1">
            {seconds.split('').map((d, i) => (
              <NixieDigit key={`s${i}`} value={d} size={size} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nixie Counter (Animated counting)
// ─────────────────────────────────────────────────────────────

interface NixieCounterProps {
  target: number;
  duration?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  glowColor?: string;
}

export function NixieCounter({
  target,
  duration = 2000,
  size = 'md',
  label,
  prefix,
  suffix,
  decimals = 0,
  glowColor = '#ff6b1a',
}: NixieCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = count;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  const digits = Math.max(4, Math.ceil(Math.log10(target + 1)) + (decimals > 0 ? decimals + 1 : 0));

  return (
    <NixieTubeDisplay
      value={count}
      digits={digits}
      decimals={decimals}
      size={size}
      glowColor={glowColor}
      label={label}
      prefix={prefix}
      suffix={suffix}
      animate={false}
    />
  );
}

export default NixieTubeDisplay;
