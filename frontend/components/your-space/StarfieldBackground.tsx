'use client';

/**
 * Starfield Background
 *
 * Animated space background with:
 * - Twinkling stars at multiple depths
 * - Distant planets/nebulae
 * - Parallax scrolling effect
 * - Smooth 60fps animations
 */

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  layer: 'far' | 'mid' | 'near';
}

interface Planet {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  hasRings: boolean;
  glowColor: string;
}

// ─────────────────────────────────────────────────────────────
// Star Generation
// ─────────────────────────────────────────────────────────────

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const layer = i < count * 0.5 ? 'far' : i < count * 0.8 ? 'mid' : 'near';
    stars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: layer === 'far' ? 1 : layer === 'mid' ? 1.5 : 2,
      opacity: layer === 'far' ? 0.3 : layer === 'mid' ? 0.5 : 0.8,
      twinkleSpeed: 2 + Math.random() * 4,
      layer,
    });
  }
  return stars;
}

// ─────────────────────────────────────────────────────────────
// Planet Component
// ─────────────────────────────────────────────────────────────

function SpacePlanet({ planet }: { planet: Planet }) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${planet.x}%`,
        top: `${planet.y}%`,
        width: planet.size,
        height: planet.size,
      }}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Planet body */}
      <div
        className="rounded-full"
        style={{
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}88 50%, ${planet.color}44 100%)`,
          boxShadow: `
            inset -${planet.size / 4}px -${planet.size / 4}px ${planet.size / 2}px rgba(0,0,0,0.5),
            0 0 ${planet.size}px ${planet.glowColor}44,
            0 0 ${planet.size * 2}px ${planet.glowColor}22
          `,
        }}
      />

      {/* Rings (if applicable) */}
      {planet.hasRings && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: planet.size * 1.8,
            height: planet.size * 0.4,
            border: `2px solid ${planet.color}66`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotateX(70deg)',
          }}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shooting Star
// ─────────────────────────────────────────────────────────────

function ShootingStar() {
  const startX = Math.random() * 100;
  const startY = Math.random() * 50;

  return (
    <motion.div
      className="absolute w-1 h-1 bg-white rounded-full"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        boxShadow: '0 0 4px #fff, 0 0 8px #fff',
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, 200],
        y: [0, 100],
      }}
      transition={{
        duration: 1.5,
        ease: 'easeOut',
        repeat: Infinity,
        repeatDelay: 5 + Math.random() * 10,
      }}
    >
      {/* Trail */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 h-px"
        style={{
          width: 50,
          background: 'linear-gradient(to left, white, transparent)',
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nebula Cloud
// ─────────────────────────────────────────────────────────────

function Nebula({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: 300,
        height: 200,
        background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

interface StarfieldBackgroundProps {
  starCount?: number;
  showPlanets?: boolean;
  showNebulae?: boolean;
  showShootingStars?: boolean;
  interactive?: boolean;
  className?: string;
  /** 'dark' = original deep-space look; 'light' = soft white/blue for light-themed pages */
  theme?: 'dark' | 'light';
  /** When true the starfield uses absolute positioning instead of fixed, so it stays within its parent container */
  contained?: boolean;
}

export function StarfieldBackground({
  starCount = 200,
  showPlanets = true,
  showNebulae = true,
  showShootingStars = true,
  interactive = false,
  className = '',
  theme = 'dark',
  contained = false,
}: StarfieldBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  // Generate stars once
  const stars = useMemo(() => generateStars(starCount), [starCount]);

  // Static planets for the background
  const planets: Planet[] = useMemo(() => [
    {
      id: 'planet-1',
      x: 85,
      y: 15,
      size: 60,
      color: '#F59E0B',
      hasRings: true,
      glowColor: '#FBBF24',
    },
    {
      id: 'planet-2',
      x: 10,
      y: 70,
      size: 40,
      color: '#F59E0B',
      hasRings: false,
      glowColor: '#FBBF24',
    },
    {
      id: 'planet-3',
      x: 75,
      y: 80,
      size: 25,
      color: '#3B82F6',
      hasRings: false,
      glowColor: '#60A5FA',
    },
  ], []);

  // Theme-aware colors
  const containerBg = isLight
    ? 'radial-gradient(ellipse at bottom, #F0F4FF 0%, #F8FAFC 100%)'
    : 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)';

  const overlayBg = isLight
    ? `
      radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(255, 180, 0, 0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(0, 100, 255, 0.03) 0%, transparent 70%)
    `
    : `
      radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(255, 100, 0, 0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(0, 100, 255, 0.05) 0%, transparent 70%)
    `;

  const starFill = isLight ? '#94A3B8' : 'white';
  const starOpacityScale = isLight ? 0.4 : 1.0;

  const vignetteBg = isLight
    ? 'radial-gradient(ellipse at center, transparent 40%, rgba(248,250,252,0.8) 100%)'
    : 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)';

  return (
    <div
      ref={containerRef}
      className={`${contained ? 'absolute' : 'fixed'} inset-0 overflow-hidden ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#030014]'} ${className}`}
      style={{ background: containerBg }}
    >
      {/* Deep space / soft sky gradient */}
      <div
        className="absolute inset-0"
        style={{ background: overlayBg }}
      />

      {/* Nebulae */}
      {showNebulae && (
        <>
          <Nebula x={20} y={30} color={isLight ? '#FDE68A' : '#F59E0B'} />
          <Nebula x={70} y={60} color={isLight ? '#FBCFE8' : '#EC4899'} />
          <Nebula x={40} y={80} color={isLight ? '#BFDBFE' : '#3B82F6'} />
        </>
      )}

      {/* Stars / sparkles */}
      <svg className="absolute inset-0 w-full h-full">
        {stars.map((star) => (
          <motion.circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill={starFill}
            initial={{ opacity: star.opacity * starOpacityScale }}
            animate={{
              opacity: [
                star.opacity * starOpacityScale,
                star.opacity * 0.3 * starOpacityScale,
                star.opacity * starOpacityScale,
              ],
            }}
            transition={{
              duration: star.twinkleSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </svg>

      {/* Planets */}
      {showPlanets && planets.map((planet) => (
        <SpacePlanet key={planet.id} planet={planet} />
      ))}

      {/* Shooting stars */}
      {showShootingStars && !isLight && (
        <>
          <ShootingStar />
          <ShootingStar />
        </>
      )}

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: vignetteBg }}
      />
    </div>
  );
}

export default StarfieldBackground;
