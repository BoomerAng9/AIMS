"use client";
/**
 * WelcomeVideo — Remotion composition for the auth page right column.
 * A 6-second looping animation introducing A.I.M.S.
 * 180 frames @ 30fps, portrait 800×1080 to fit the auth layout.
 */
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const WelcomeVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Loop fade (smooth transition at end) ──────────────────
  const loopFade = frame > 160
    ? interpolate(frame, [160, 180], [1, 0], { extrapolateRight: "clamp" })
    : frame < 20
    ? interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  // ── Phase 1: Logo Materialization (0-40) ──────────────────
  const logoOpacity = interpolate(frame, [5, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoScale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 20, stiffness: 100 } });
  const logoGlow = interpolate(frame, [20, 40], [0, 0.4], { extrapolateRight: "clamp" });

  // ── Phase 2: Tagline Sequence (30-80) ─────────────────────
  const line1Opacity = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line1Y = interpolate(frame, [30, 45], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line2Opacity = interpolate(frame, [45, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Y = interpolate(frame, [45, 60], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line3Opacity = interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3Y = interpolate(frame, [60, 75], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── Phase 3: Feature Tiles (100-150) ──────────────────────
  const features = [
    { label: "AI Agents", emoji: "🤖", delay: 0 },
    { label: "Auto-Deploy", emoji: "🚀", delay: 12 },
    { label: "LUC Metering", emoji: "⚡", delay: 24 },
  ];

  // ── Gold accent line (90-120) ─────────────────────────────
  const lineWidth = interpolate(frame, [85, 110], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── Wireframe grid background ─────────────────────────────
  const gridOpacity = interpolate(frame, [0, 30], [0, 0.15], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Doto', 'Inter', monospace",
        opacity: loopFade,
      }}
    >
      {/* ── Wireframe Grid ────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: gridOpacity,
        }}
      />

      {/* ── Radial Glow ───────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,175,55,${logoGlow * 0.15}) 0%, transparent 70%)`,
        }}
      />

      {/* ── Logo ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "#D4AF37",
            letterSpacing: "0.15em",
            textShadow: `0 0 ${30 + logoGlow * 40}px rgba(212,175,55,${logoGlow})`,
          }}
        >
          A.I.M.S.
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginTop: "8px",
          }}
        >
          AI Managed Solutions
        </div>
      </div>

      {/* ── Tagline Sequence ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ opacity: line1Opacity, transform: `translateY(${line1Y}px)`, fontSize: "32px", fontWeight: 700, color: "#ededed", letterSpacing: "0.05em" }}>
          Think It.
        </div>
        <div style={{ opacity: line2Opacity, transform: `translateY(${line2Y}px)`, fontSize: "32px", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.05em" }}>
          Prompt It.
        </div>
        <div style={{ opacity: line3Opacity, transform: `translateY(${line3Y}px)`, fontSize: "32px", fontWeight: 700, color: "#ededed", letterSpacing: "0.05em" }}>
          Let&apos;s Build It.
        </div>
      </div>

      {/* ── Gold Accent Line ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: "50%",
          transform: "translateX(-50%)",
          width: `${lineWidth}px`,
          height: "2px",
          background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
        }}
      />

      {/* ── Feature Tiles ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "68%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "20px",
        }}
      >
        {features.map((feat, i) => {
          const tileStart = 100 + feat.delay;
          const tileOpacity = interpolate(frame, [tileStart, tileStart + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const tileY = interpolate(frame, [tileStart, tileStart + 20], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                opacity: tileOpacity,
                transform: `translateY(${tileY}px)`,
                padding: "16px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: "12px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{feat.emoji}</div>
              <div style={{ fontSize: "13px", color: "#D4AF37", fontWeight: 600, letterSpacing: "0.05em" }}>
                {feat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Tagline ────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: interpolate(frame, [130, 150], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
          Powered by ACHEEVY
        </div>
      </div>
    </AbsoluteFill>
  );
};
