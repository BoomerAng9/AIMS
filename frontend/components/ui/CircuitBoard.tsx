'use client';

/**
 * Circuit Board Background Pattern
 *
 * Animated circuit board aesthetic for A.I.M.S. backgrounds.
 * Adapts the NurdsCode green circuit pattern to champagne/amber/gold.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Brand Colors
// ─────────────────────────────────────────────────────────────

export const AIMS_CIRCUIT_COLORS = {
  primary: '#D4AF37',     // Champagne gold
  secondary: '#F5DEB3',   // Amber wheat
  accent: '#FFD700',      // Pure gold
  background: '#0A0A0A',  // Obsidian
  glow: 'rgba(212, 175, 55, 0.6)',
  dimLine: 'rgba(212, 175, 55, 0.15)',
  brightLine: 'rgba(255, 215, 0, 0.4)',
};

// ─────────────────────────────────────────────────────────────
// Circuit Board SVG Pattern
// ─────────────────────────────────────────────────────────────

interface CircuitBoardPatternProps {
  className?: string;
  animated?: boolean;
  density?: 'sparse' | 'medium' | 'dense';
  glowIntensity?: number;
}

export function CircuitBoardPattern({
  className = '',
  animated = true,
  density = 'medium',
  glowIntensity = 0.6,
}: CircuitBoardPatternProps) {
  const patternSize = density === 'sparse' ? 120 : density === 'medium' ? 80 : 50;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Circuit Board Pattern */}
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width={patternSize}
            height={patternSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal lines */}
            <line
              x1="0"
              y1={patternSize / 4}
              x2={patternSize / 2}
              y2={patternSize / 4}
              stroke={AIMS_CIRCUIT_COLORS.dimLine}
              strokeWidth="1"
            />
            <line
              x1={patternSize / 2}
              y1={patternSize * 0.75}
              x2={patternSize}
              y2={patternSize * 0.75}
              stroke={AIMS_CIRCUIT_COLORS.dimLine}
              strokeWidth="1"
            />

            {/* Vertical lines */}
            <line
              x1={patternSize / 4}
              y1="0"
              x2={patternSize / 4}
              y2={patternSize / 2}
              stroke={AIMS_CIRCUIT_COLORS.dimLine}
              strokeWidth="1"
            />
            <line
              x1={patternSize * 0.75}
              y1={patternSize / 2}
              x2={patternSize * 0.75}
              y2={patternSize}
              stroke={AIMS_CIRCUIT_COLORS.dimLine}
              strokeWidth="1"
            />

            {/* Corner turns */}
            <path
              d={`M ${patternSize / 2} ${patternSize / 4} L ${patternSize / 2} ${patternSize / 2} L ${patternSize * 0.75} ${patternSize / 2}`}
              fill="none"
              stroke={AIMS_CIRCUIT_COLORS.dimLine}
              strokeWidth="1"
            />

            {/* Junction nodes */}
            <circle
              cx={patternSize / 4}
              cy={patternSize / 4}
              r="2"
              fill={AIMS_CIRCUIT_COLORS.brightLine}
            />
            <circle
              cx={patternSize * 0.75}
              cy={patternSize * 0.75}
              r="2"
              fill={AIMS_CIRCUIT_COLORS.brightLine}
            />
            <circle
              cx={patternSize / 2}
              cy={patternSize / 2}
              r="3"
              fill="none"
              stroke={AIMS_CIRCUIT_COLORS.brightLine}
              strokeWidth="1"
            />

            {/* IC chip representation */}
            <rect
              x={patternSize * 0.1}
              y={patternSize * 0.6}
              width={patternSize * 0.2}
              height={patternSize * 0.15}
              fill="none"
              stroke={AIMS_CIRCUIT_COLORS.dimLine}
              strokeWidth="1"
              rx="1"
            />
          </pattern>

          {/* Glow filter */}
          <filter id="circuit-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated gradient for data flow */}
          <linearGradient id="data-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor={AIMS_CIRCUIT_COLORS.accent}>
              {animated && (
                <animate
                  attributeName="offset"
                  values="0;1"
                  dur="3s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="60%" stopColor={AIMS_CIRCUIT_COLORS.accent}>
              {animated && (
                <animate
                  attributeName="offset"
                  values="0;1"
                  dur="3s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Background pattern */}
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />

        {/* Animated trace lines */}
        {animated && (
          <g filter="url(#circuit-glow)" opacity={glowIntensity}>
            <AnimatedTrace delay={0} />
            <AnimatedTrace delay={1.5} />
            <AnimatedTrace delay={3} />
          </g>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Animated Trace Line
// ─────────────────────────────────────────────────────────────

function AnimatedTrace({ delay }: { delay: number }) {
  const [path, setPath] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    const generatePath = () => {
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      let d = `M ${startX}% ${startY}%`;

      let x = startX;
      let y = startY;

      for (let i = 0; i < 4 + Math.floor(Math.random() * 3); i++) {
        const horizontal = Math.random() > 0.5;
        if (horizontal) {
          x = Math.max(0, Math.min(100, x + (Math.random() - 0.5) * 30));
          d += ` L ${x}% ${y}%`;
        } else {
          y = Math.max(0, Math.min(100, y + (Math.random() - 0.5) * 30));
          d += ` L ${x}% ${y}%`;
        }
      }

      return d;
    };

    const interval = setInterval(() => {
      setPath(generatePath());
      setKey(k => k + 1);
    }, 6000);

    setPath(generatePath());

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.path
      key={key}
      d={path}
      fill="none"
      stroke={AIMS_CIRCUIT_COLORS.accent}
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 3,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Circuit Border
// ─────────────────────────────────────────────────────────────

interface CircuitBorderProps {
  children: React.ReactNode;
  className?: string;
  glowing?: boolean;
  pulseSpeed?: 'slow' | 'normal' | 'fast';
}

export function CircuitBorder({
  children,
  className = '',
  glowing = true,
  pulseSpeed = 'normal',
}: CircuitBorderProps) {
  const pulseClass = {
    slow: 'animate-pulse-slow',
    normal: 'animate-pulse',
    fast: 'animate-pulse-fast',
  }[pulseSpeed];

  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      {glowing && (
        <div
          className={`absolute -inset-px rounded-lg ${pulseClass}`}
          style={{
            background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}40, transparent, ${AIMS_CIRCUIT_COLORS.accent}40)`,
            filter: 'blur(4px)',
          }}
        />
      )}

      {/* Border with circuit corners */}
      <div
        className="relative rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}30, ${AIMS_CIRCUIT_COLORS.background}, ${AIMS_CIRCUIT_COLORS.primary}30)`,
          padding: '1px',
        }}
      >
        {/* Corner nodes */}
        <div
          className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
          style={{
            backgroundColor: AIMS_CIRCUIT_COLORS.accent,
            boxShadow: `0 0 8px ${AIMS_CIRCUIT_COLORS.glow}`,
          }}
        />
        <div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{
            backgroundColor: AIMS_CIRCUIT_COLORS.accent,
            boxShadow: `0 0 8px ${AIMS_CIRCUIT_COLORS.glow}`,
          }}
        />
        <div
          className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full"
          style={{
            backgroundColor: AIMS_CIRCUIT_COLORS.accent,
            boxShadow: `0 0 8px ${AIMS_CIRCUIT_COLORS.glow}`,
          }}
        />
        <div
          className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
          style={{
            backgroundColor: AIMS_CIRCUIT_COLORS.accent,
            boxShadow: `0 0 8px ${AIMS_CIRCUIT_COLORS.glow}`,
          }}
        />

        {/* Content */}
        <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: AIMS_CIRCUIT_COLORS.background }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Circuit Card
// ─────────────────────────────────────────────────────────────

interface CircuitCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  status?: 'active' | 'idle' | 'warning' | 'error';
  showPattern?: boolean;
}

export function CircuitCard({
  children,
  className = '',
  title,
  status = 'idle',
  showPattern = true,
}: CircuitCardProps) {
  const statusColors = {
    active: '#22c55e',
    idle: AIMS_CIRCUIT_COLORS.primary,
    warning: '#eab308',
    error: '#ef4444',
  };

  return (
    <CircuitBorder glowing={status === 'active'}>
      <div className={`relative ${className}`}>
        {/* Background pattern */}
        {showPattern && <CircuitBoardPattern density="sparse" animated={false} glowIntensity={0.2} />}

        {/* Status indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${status === 'active' ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: statusColors[status],
              boxShadow: `0 0 8px ${statusColors[status]}`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative p-4">
          {title && (
            <h3
              className="text-sm font-mono uppercase tracking-wider mb-3"
              style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
            >
              {title}
            </h3>
          )}
          {children}
        </div>
      </div>
    </CircuitBorder>
  );
}

// ─────────────────────────────────────────────────────────────
// Data Node (connection point visualization)
// ─────────────────────────────────────────────────────────────

interface DataNodeProps {
  label: string;
  value?: string | number;
  active?: boolean;
  className?: string;
}

export function DataNode({ label, value, active = false, className = '' }: DataNodeProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Node circle */}
      <div className="relative">
        <div
          className={`w-4 h-4 rounded-full border-2 ${active ? 'animate-pulse' : ''}`}
          style={{
            borderColor: active ? AIMS_CIRCUIT_COLORS.accent : AIMS_CIRCUIT_COLORS.dimLine,
            backgroundColor: active ? AIMS_CIRCUIT_COLORS.accent : 'transparent',
            boxShadow: active ? `0 0 12px ${AIMS_CIRCUIT_COLORS.glow}` : 'none',
          }}
        />
        {/* Connecting line */}
        <div
          className="absolute top-1/2 left-full w-8 h-px"
          style={{ backgroundColor: AIMS_CIRCUIT_COLORS.dimLine }}
        />
      </div>

      {/* Label and value */}
      <div className="pl-6">
        <span
          className="text-xs font-mono uppercase tracking-wider block"
          style={{ color: AIMS_CIRCUIT_COLORS.secondary + '80' }}
        >
          {label}
        </span>
        {value !== undefined && (
          <span
            className="text-lg font-mono"
            style={{ color: active ? AIMS_CIRCUIT_COLORS.accent : AIMS_CIRCUIT_COLORS.secondary }}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Full Page Circuit Background
// ─────────────────────────────────────────────────────────────

interface CircuitBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function CircuitBackground({ children, className = '' }: CircuitBackgroundProps) {
  return (
    <div
      className={`relative min-h-screen ${className}`}
      style={{ backgroundColor: AIMS_CIRCUIT_COLORS.background }}
    >
      <CircuitBoardPattern animated density="medium" glowIntensity={0.4} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default {
  CircuitBoardPattern,
  CircuitBorder,
  CircuitCard,
  DataNode,
  CircuitBackground,
  AIMS_CIRCUIT_COLORS,
};
