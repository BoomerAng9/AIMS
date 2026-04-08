'use client';

/**
 * ParallaxSection — Scroll-driven depth layer
 *
 * Creates a parallax effect where the background moves at a
 * different rate than the foreground content.
 */

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Background element to parallax */
  background?: React.ReactNode;
  /** Parallax speed multiplier. 0 = no parallax, 1 = full speed. Default: 0.3 */
  speed?: number;
  /** Offset range in px. Default: [-100, 100] */
  range?: [number, number];
}

export function ParallaxSection({
  children,
  className,
  background,
  speed = 0.3,
  range = [-100, 100],
}: ParallaxSectionProps) {
  const ref = useRef(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [range[0] * speed, range[1] * speed]
  );

  if (prefersReduced) {
    return (
      <div ref={ref} className={className}>
        {background && <div className="absolute inset-0 overflow-hidden">{background}</div>}
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      {background && (
        <motion.div className="absolute inset-0" style={{ y }}>
          {background}
        </motion.div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
