'use client';

/**
 * TiltCard — Mouse-tracking 3D perspective tilt
 *
 * Subtle 3D rotation following the cursor position.
 * Uses spring physics from motion tokens.
 */

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, type MouseEvent } from 'react';
import { spring } from '@/lib/motion/tokens';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max tilt angle in degrees. Default: 10 */
  maxTilt?: number;
  /** Perspective distance in px. Default: 1000 */
  perspective?: number;
}

export function TiltCard({
  children,
  className,
  maxTilt = 10,
  perspective = 1000,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: spring.gentle.stiffness, damping: spring.gentle.damping };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  function handleMouseMove(e: MouseEvent) {
    if (!ref.current || prefersReduced) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
}
