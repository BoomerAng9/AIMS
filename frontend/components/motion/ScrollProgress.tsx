'use client';

/**
 * ScrollProgress — Fixed scroll progress bar
 *
 * Shows a thin bar at the top of the viewport that fills
 * as the user scrolls down the page. Uses motion tokens.
 */

import { motion, useScroll, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

interface ScrollProgressProps {
  className?: string;
  /** Bar color. Default: amber-500 */
  color?: string;
  /** Bar height in px. Default: 3 */
  height?: number;
  /** Z-index. Default: 50 */
  zIndex?: number;
}

export function ScrollProgress({
  className,
  color = 'bg-amber-500',
  height = 3,
  zIndex = 50,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return null;

  return (
    <motion.div
      className={clsx('fixed top-0 left-0 right-0 origin-left', color, className)}
      style={{
        scaleX: scrollYProgress,
        height,
        zIndex,
      }}
    />
  );
}
