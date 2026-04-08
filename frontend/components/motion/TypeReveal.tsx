'use client';

/**
 * TypeReveal — Character-by-character stagger reveal
 *
 * Splits text into characters and staggers their appearance.
 * Great for headlines and hero text.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { stagger, viewportMargin } from '@/lib/motion/tokens';

interface TypeRevealProps {
  /** The text to animate */
  text: string;
  className?: string;
  /** Element to render as. Default: 'span' */
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
  /** Stagger speed. Default: 'fast' */
  speed?: keyof typeof stagger;
  /** Delay before starting. Default: 0 */
  delay?: number;
}

export function TypeReveal({
  text,
  className,
  as: Tag = 'span',
  speed = 'fast',
  delay = 0,
}: TypeRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: viewportMargin.standard });
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  const chars = text.split('');

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: 0.3,
            delay: delay + i * stagger[speed],
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
          aria-hidden
        >
          {char}
        </motion.span>
      ))}
    </Tag>
  );
}
