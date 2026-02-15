/**
 * PlugMeIn — Remotion Hero Composition
 *
 * Wireframe platform motif: concentric rings + glowing center node
 * with gold connector lines tracing outward to "PLUG ME IN." text.
 *
 * 5-second sequence (150 frames at 30fps):
 *   0-30:  Ring base draws in (SVG stroke-dashoffset)
 *   20-60: Center node materializes
 *   40-90: Gold connector lines trace outward
 *   70-120: "PLUG ME IN." text fades up
 *   120-150: Idle loop (slow rotation, pulse)
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212, 175, 55, 0.15)";
const GOLD_GLOW = "rgba(212, 175, 55, 0.4)";
const WHITE_DIM = "rgba(255, 255, 255, 0.06)";

export const PlugMeIn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Ring draw-in (frames 0-30) ──
  const ringProgress = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Center node (frames 20-60) ──
  const nodeScale = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 200 } });
  const nodeOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Connector lines (frames 40-90) ──
  const connectorProgress = interpolate(frame, [40, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Text (frames 70-120) ──
  const textOpacity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [70, 100], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Idle rotation (frames 120+) ──
  const idleRotation = frame > 120
    ? interpolate(frame - 120, [0, 300], [0, 360], { extrapolateRight: "extend" })
    : 0;

  // ── Idle pulse (frames 120+) ──
  const idlePulse = frame > 120
    ? 0.8 + 0.2 * Math.sin((frame - 120) * 0.08)
    : 1;

  // Ring circumferences
  const r1 = 120, r2 = 180, r3 = 240;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const c3 = 2 * Math.PI * r3;

  // Connector angles (8 lines radiating outward)
  const connectorAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      {/* Dot matrix background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Fine grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Center group */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${idleRotation}deg)`,
        }}
      >
        {/* SVG rings */}
        <svg
          width="600"
          height="600"
          viewBox="-300 -300 600 600"
          style={{ overflow: "visible" }}
        >
          {/* Ring 3 (outermost) */}
          <circle
            cx="0"
            cy="0"
            r={r3}
            fill="none"
            stroke={GOLD_DIM}
            strokeWidth="1"
            strokeDasharray={c3}
            strokeDashoffset={c3 * (1 - ringProgress * 0.8)}
          />
          {/* Ring 2 */}
          <circle
            cx="0"
            cy="0"
            r={r2}
            fill="none"
            stroke={GOLD_DIM}
            strokeWidth="1"
            strokeDasharray={c2}
            strokeDashoffset={c2 * (1 - ringProgress * 0.9)}
          />
          {/* Ring 1 (innermost) */}
          <circle
            cx="0"
            cy="0"
            r={r1}
            fill="none"
            stroke={GOLD_GLOW}
            strokeWidth="1.5"
            strokeDasharray={c1}
            strokeDashoffset={c1 * (1 - ringProgress)}
          />

          {/* Connector lines */}
          {connectorAngles.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const innerR = r1 + 10;
            const outerR = r3 + 40;
            const x1 = Math.cos(rad) * innerR;
            const y1 = Math.sin(rad) * innerR;
            const x2 = Math.cos(rad) * outerR * connectorProgress;
            const y2 = Math.sin(rad) * outerR * connectorProgress;

            // Stagger each connector slightly
            const delay = i * 3;
            const lineProgress = interpolate(frame, [40 + delay, 90 + delay], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x1 + (x2 - x1) * lineProgress}
                y2={y1 + (y2 - y1) * lineProgress}
                stroke={GOLD}
                strokeWidth="1"
                opacity={lineProgress * 0.6}
              />
            );
          })}

          {/* Terminal dots at connector ends */}
          {connectorAngles.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const outerR = r3 + 40;
            const dotOpacity = interpolate(frame, [80 + i * 2, 100 + i * 2], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <circle
                key={`dot-${angle}`}
                cx={Math.cos(rad) * outerR}
                cy={Math.sin(rad) * outerR}
                r="3"
                fill={GOLD}
                opacity={dotOpacity * idlePulse}
              />
            );
          })}
        </svg>

        {/* Center node */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${nodeScale})`,
            opacity: nodeOpacity,
            width: 60,
            height: 60,
            borderRadius: "16px",
            border: `2px solid ${GOLD}`,
            background: `radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)`,
            boxShadow: `0 0 40px ${GOLD_GLOW}, inset 0 0 20px ${GOLD_DIM}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inner diamond */}
          <div
            style={{
              width: 16,
              height: 16,
              background: GOLD,
              transform: "rotate(45deg)",
              borderRadius: 2,
              boxShadow: `0 0 20px ${GOLD_GLOW}`,
            }}
          />
        </div>
      </div>

      {/* "PLUG ME IN." text — outside rotation group */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: `translateX(-50%) translateY(${textY}px)`,
          opacity: textOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Doto', monospace",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: GOLD,
            textShadow: `0 0 30px ${GOLD_GLOW}`,
          }}
        >
          PLUG ME IN.
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          A.I.M.S. by ACHIEVEMOR
        </div>
      </div>
    </AbsoluteFill>
  );
};
