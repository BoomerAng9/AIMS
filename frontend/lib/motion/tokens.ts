/**
 * Motion Tokens — A.I.M.S. Design System
 *
 * Shared duration, easing, and spring constants.
 * All Framer Motion animations MUST reference these tokens.
 * No hard-coded magic numbers in component files.
 */

// ── Durations (seconds) ──

export const duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  emphasis: 0.6,
} as const;

// ── Easing Curves ──

export const easing = {
  /** Standard UI transitions */
  standard: [0.4, 0, 0.2, 1] as const,
  /** Entering elements — decelerate into view */
  enter: [0, 0, 0.2, 1] as const,
  /** Exiting elements — accelerate out of view */
  exit: [0.4, 0, 1, 1] as const,
  /** Emphasized motion — more dramatic curve */
  emphasized: [0.2, 0, 0, 1] as const,
};

// ── Spring Configs ──

export const spring = {
  /** Snappy feedback for buttons/chips */
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  /** Gentle settle for overlays/panels */
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  /** Bouncy for emphasis moments */
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
};

// ── Tween Presets ──

export const transition = {
  fast: { duration: duration.fast, ease: easing.standard },
  normal: { duration: duration.normal, ease: easing.standard },
  slow: { duration: duration.slow, ease: easing.standard },
  enter: { duration: duration.normal, ease: easing.enter },
  exit: { duration: duration.fast, ease: easing.exit },
  emphasis: { duration: duration.emphasis, ease: easing.emphasized },
};

// ── Stagger ──

export const stagger = {
  fast: 0.05,
  normal: 0.08,
  slow: 0.12,
} as const;

// ── Cinematic ──

export const cinematic = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1] as const,
};

// ── Reduced Motion ──

export const reducedMotion = {
  duration: 0,
  ease: "linear" as const,
};
