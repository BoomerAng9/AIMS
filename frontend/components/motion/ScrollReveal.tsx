'use client';

/**
 * ScrollReveal — Viewport-triggered reveal animation
 *
 * Wraps children in a motion.div that animates on viewport entry.
 * Uses tokens from @/lib/motion for consistent timing.
 * Respects prefers-reduced-motion automatically via Framer Motion.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { scrollTransition, viewportMargin } from '@/lib/motion/tokens';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation direction. Default: 'up' */
  direction?: Direction;
  /** Reveal speed. Default: 'reveal' */
  speed?: 'pop' | 'reveal' | 'cinematic';
  /** Viewport margin for early/late trigger. Default: 'standard' */
  margin?: keyof typeof viewportMargin;
  /** Distance in px for slide. Default: 40 */
  distance?: number;
  /** Delay before animation starts (seconds). Default: 0 */
  delay?: number;
  /** Whether to only animate once. Default: true */
  once?: boolean;
}

const directionOffset = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up': return { y: distance };
    case 'down': return { y: -distance };
    case 'left': return { x: distance };
    case 'right': return { x: -distance };
    case 'none': return {};
  }
};

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  speed = 'reveal',
  margin = 'standard',
  distance = 40,
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once,
    margin: viewportMargin[margin],
  });
  const prefersReduced = useReducedMotion();

  const trans = scrollTransition[speed];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, ...directionOffset(direction, distance) }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ ...trans, delay }}
    >
      {children}
    </motion.div>
  );
}
