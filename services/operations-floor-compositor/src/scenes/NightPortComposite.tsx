/**
 * Night Port composite scene — Stage 8 programmatic timeline.
 *
 * Composition order (back -> front):
 *   1. Environment video (Cosmos-Transfer2.5 output, full frame)
 *   2. Character cutout (matted WebM/VP9-alpha output, positioned,
 *      scaled, faded)
 *   3. HUD overlay (optional, brand tokens from deploy-landing)
 *
 * All layer positioning / timing is pure-data so unit tests can
 * assert choreography without running the renderer. The compile-time
 * <Composition> registration lives in Remotion.tsx so server.ts can
 * pass props in at render time.
 *
 * Alpha: character cutout is expected to be produced by the
 * operations-floor-matting service (VP9-alpha WebM or ProRes 4444
 * MOV). Remotion's <Video> composites honest per-pixel alpha
 * directly — no mix-blend-mode or colorkey filter needed. If a
 * caller passes a non-alpha character video, the scene still
 * composites it, but edges will look wrong — that's a caller bug,
 * not a scene bug.
 */

import React from 'react';
import { AbsoluteFill, Video, Sequence, interpolate, useCurrentFrame } from 'remotion';

export interface NightPortCompositeProps {
  /** Signed or public HTTPS URL to the environment MP4 (from Cosmos Stage 5). */
  environmentVideoUrl: string;
  /**
   * Signed or public HTTPS URL to the **matted character clip**
   * (VP9-alpha WebM produced by operations-floor-matting, Stage 7.5).
   * Honest per-pixel alpha — no mix-blend-mode or colorkey needed.
   */
  characterCutoutUrl: string;
  /** Target output frame rate (match both inputs — 24 or 30). */
  fps: number;
  /** Total duration in frames. */
  durationInFrames: number;
  /** Optional: frame at which character clip starts. Default 0. */
  characterStartFrame?: number;
  /** Optional: character layer positioning. Default center-bottom, 70% height. */
  characterPositioning?: CharacterPositioning;
  /** Optional: lockup text shown at end (e.g. "ILLA · OPERATIONAL"). */
  endLockupText?: string;
}

export interface CharacterPositioning {
  /** Relative horizontal origin (0=left, 0.5=center, 1=right). */
  anchorX: number;
  /** Relative vertical origin (0=top, 1=bottom). */
  anchorY: number;
  /** Character scale relative to canvas height. 0.7 = 70% of canvas height. */
  scale: number;
  /** Fade-in duration in frames. */
  fadeInFrames: number;
}

export const DEFAULT_CHARACTER_POSITIONING: CharacterPositioning = {
  anchorX: 0.5,
  anchorY: 0.95,
  scale: 0.72,
  fadeInFrames: 12,
};

// ─── Pure choreography helpers (exported for test) ──────────────────

export function characterOpacityAt(
  frame: number,
  characterStartFrame: number,
  fadeInFrames: number
): number {
  if (frame < characterStartFrame) return 0;
  const p = Math.min(1, (frame - characterStartFrame) / Math.max(1, fadeInFrames));
  return p;
}

export function resolvePositioning(
  p: CharacterPositioning | undefined
): CharacterPositioning {
  return { ...DEFAULT_CHARACTER_POSITIONING, ...(p ?? {}) };
}

export function lockupVisibility(
  frame: number,
  durationInFrames: number,
  holdFrames = 30
): { opacity: number } {
  const start = durationInFrames - holdFrames;
  if (frame < start) return { opacity: 0 };
  const p = Math.min(1, (frame - start) / Math.max(1, holdFrames / 3));
  return { opacity: p };
}

// ─── Scene component ────────────────────────────────────────────────

export const NightPortComposite: React.FC<NightPortCompositeProps> = ({
  environmentVideoUrl,
  characterCutoutUrl,
  durationInFrames,
  characterStartFrame = 0,
  characterPositioning,
  endLockupText,
}) => {
  const frame = useCurrentFrame();
  const pos = resolvePositioning(characterPositioning);

  const characterOpacity = characterOpacityAt(
    frame,
    characterStartFrame,
    pos.fadeInFrames
  );

  const lockup = endLockupText ? lockupVisibility(frame, durationInFrames) : { opacity: 0 };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* Layer 1 -- environment. Guarded against empty defaultProps. */}
      {environmentVideoUrl ? <Video src={environmentVideoUrl} /> : null}

      {/* Layer 2 -- character cutout (VP9-alpha WebM; positioned,
           faded, scaled). Honest per-pixel alpha from the matting
           service — no mix-blend-mode or colorkey. */}
      {characterCutoutUrl ? (
        <Sequence from={characterStartFrame}>
          <AbsoluteFill
            style={{
              opacity: characterOpacity,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: `${pos.anchorX * 100}%`,
                top: `${pos.anchorY * 100}%`,
                transform: 'translate(-50%, -100%)',
                height: `${pos.scale * 100}%`,
                aspectRatio: '9 / 16',
              }}
            >
              <Video
                src={characterCutoutUrl}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </AbsoluteFill>
        </Sequence>
      ) : null}

      {/* Layer 3 — optional end-frame lockup */}
      {endLockupText && (
        <AbsoluteFill
          style={{
            opacity: lockup.opacity,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '8%',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', 'Oswald', Impact, sans-serif",
              fontWeight: 900,
              fontSize: 96,
              letterSpacing: '0.28em',
              color: '#FFFFFF',
              textShadow: '0 0 24px rgba(255,107,0,0.55)',
            }}
          >
            {endLockupText}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
