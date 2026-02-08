/**
 * Motion Variants — A.I.M.S. Design System
 *
 * Reusable variant presets for common UI animation patterns.
 * Import these instead of writing inline animation objects.
 */

import type { Variants } from "framer-motion";
import { transition, stagger, spring } from "./tokens";

// ── Fade ──

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.normal },
  exit: { opacity: 0, transition: transition.exit },
};

// ── Fade + Slide Up ──

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transition.enter },
  exit: { opacity: 0, y: 8, transition: transition.exit },
};

// ── Fade + Slide Down (for dropdowns) ──

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: transition.enter },
  exit: { opacity: 0, y: -6, transition: transition.exit },
};

// ── Scale + Fade (for overlays, modals) ──

export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring.gentle },
  exit: { opacity: 0, scale: 0.97, transition: transition.exit },
};

// ── Stagger Container ──

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.fast,
    },
  },
};

// ── Stagger Item (child of stagger container) ──

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transition.enter },
};

// ── Slide from Right (for panels/drawers) ──

export const slideRight: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: spring.gentle },
  exit: { x: "100%", opacity: 0, transition: transition.exit },
};

// ── Slide from Left (for sidebars) ──

export const slideLeft: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: spring.gentle },
  exit: { x: "-100%", opacity: 0, transition: transition.exit },
};

// ── Tap / Hover Feedback ──

export const tapScale = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
};

export const tapScaleSmall = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: spring.snappy,
};

// ── Progress Bar ──

export const progressBar: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (width: number) => ({
    scaleX: width / 100,
    originX: 0,
    transition: { duration: 0.8, ease: [0.2, 0, 0, 1] },
  }),
};

// ── Pulse Glow (for status indicators) ──

export const pulseGlow: Variants = {
  idle: { scale: 1, opacity: 0.8 },
  active: {
    scale: [1, 1.15, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};
