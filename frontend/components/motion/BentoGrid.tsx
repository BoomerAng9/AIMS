'use client';

/**
 * BentoGrid — Asymmetric feature grid with stagger reveal
 *
 * Huly.io-inspired bento layout with viewport-triggered stagger.
 * Each cell animates in sequence on scroll entry.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { scrollTransition, stagger, viewportMargin } from '@/lib/motion/tokens';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns on desktop. Default: 3 */
  columns?: 2 | 3 | 4;
}

const colClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function BentoGrid({ children, className, columns = 3 }: BentoGridProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: viewportMargin.standard });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={`grid gap-4 ${colClasses[columns]} ${className || ''}`}
      initial={prefersReduced ? undefined : 'hidden'}
      animate={isInView ? 'visible' : undefined}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger.normal,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  /** Span 2 columns. Default: false */
  span2?: boolean;
  /** Span 2 rows. Default: false */
  rowSpan2?: boolean;
}

export function BentoItem({ children, className, span2, rowSpan2 }: BentoItemProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={`${span2 ? 'sm:col-span-2' : ''} ${rowSpan2 ? 'sm:row-span-2' : ''} ${className || ''}`}
      variants={
        prefersReduced
          ? undefined
          : {
              hidden: { opacity: 0, y: 20, scale: 0.97 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: scrollTransition.pop,
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}
