'use client';

/**
 * GlowBorder — Huly.io-style rotating gradient border
 *
 * Creates a rotating conic gradient border effect using CSS @property.
 * The glow-border class must be defined in globals.css.
 * Gold accent (#D4AF37) by default, customizable via props.
 */

import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Border radius. Default: 'rounded-2xl' */
  rounded?: string;
  /** Whether the glow is active. Default: true */
  active?: boolean;
  /** Glow color theme. Default: 'gold' */
  theme?: 'gold' | 'emerald' | 'violet';
}

const themeColors = {
  gold: 'from-amber-500/60 via-transparent to-amber-500/60',
  emerald: 'from-emerald-500/60 via-transparent to-emerald-500/60',
  violet: 'from-violet-500/60 via-transparent to-violet-500/60',
};

export function GlowBorder({
  children,
  className,
  rounded = 'rounded-2xl',
  active = true,
  theme = 'gold',
}: GlowBorderProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced || !active) {
    return <div className={clsx(rounded, className)}>{children}</div>;
  }

  return (
    <div className={clsx('glow-border relative p-[2px]', rounded, className)} data-theme={theme}>
      {/* Rotating gradient border */}
      <div
        className={clsx(
          'absolute inset-0 bg-conic-gradient animate-glow-spin opacity-75',
          rounded,
          themeColors[theme]
        )}
        style={{
          background: `conic-gradient(from var(--glow-angle, 0deg), transparent 0%, ${
            theme === 'gold' ? 'rgba(212,175,55,0.6)' : theme === 'emerald' ? 'rgba(5,150,105,0.6)' : 'rgba(139,92,246,0.6)'
          } 10%, transparent 20%, transparent 80%, ${
            theme === 'gold' ? 'rgba(212,175,55,0.6)' : theme === 'emerald' ? 'rgba(5,150,105,0.6)' : 'rgba(139,92,246,0.6)'
          } 90%, transparent 100%)`,
        }}
      />
      {/* Content */}
      <div className={clsx('relative bg-white', rounded)}>
        {children}
      </div>
    </div>
  );
}
