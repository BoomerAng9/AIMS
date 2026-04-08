import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { aimsTheme } from "../../../styles/theme";
import { textStyles } from "../../../styles/typography";
import { springPresets } from "../../../styles/animations";

/**
 * Scene 4: ACHEEVY Rises — The Executive Orchestrator
 * Gold pentaharmonic burst → five colored harmonic lines converge → ACHEEVY emerges.
 * Quote: "I am ACHEEVY, at your service."
 */

const HARMONICS = [
  { color: aimsTheme.colors.vibe.acheevy, angle: 270, label: "Architect" },
  { color: aimsTheme.colors.vibe.sentinels, angle: 342, label: "Sentinel" },
  { color: aimsTheme.colors.vibe.weavers, angle: 54, label: "Weaver" },
  { color: aimsTheme.colors.vibe.heralds, angle: 126, label: "Herald" },
  { color: aimsTheme.colors.vibe.drift, angle: 198, label: "Drift" },
];

export const AcheevyRises: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Five harmonic beams converge
  const beamProgress = (i: number) =>
    interpolate(
      frame,
      [i * 0.15 * fps, (i * 0.15 + 0.8) * fps],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

  // Central gold burst after beams converge
  const burstDelay = 1.2 * fps;
  const burstScale = spring({
    frame: Math.max(0, frame - burstDelay),
    fps,
    config: springPresets.popIn,
  });
  const burstOpacity = interpolate(
    frame,
    [burstDelay, burstDelay + 0.3 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Name
  const nameOpacity = interpolate(
    frame,
    [2 * fps, 2.6 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const nameY = interpolate(
    frame,
    [2 * fps, 2.6 * fps],
    [30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Quote
  const quoteOpacity = interpolate(
    frame,
    [2.8 * fps, 3.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Radial gold ambient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%,
            rgba(212, 175, 55, ${burstOpacity * 0.1}) 0%,
            transparent 50%)`,
        }}
      />

      {/* Five harmonic beams converging to center */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          {HARMONICS.map((h, i) => {
            const progress = beamProgress(i);
            const rad = (h.angle * Math.PI) / 180;
            const outerR = 500;
            const x1 = 960 + Math.cos(rad) * outerR;
            const y1 = 540 + Math.sin(rad) * outerR;
            // Beam shrinks toward center
            const x2 = 960 + Math.cos(rad) * outerR * (1 - progress);
            const y2 = 540 + Math.sin(rad) * outerR * (1 - progress);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={h.color}
                strokeWidth={3}
                opacity={progress * 0.8}
              />
            );
          })}
        </svg>
      </AbsoluteFill>

      {/* Central gold orb */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            backgroundColor: aimsTheme.colors.gold,
            transform: `scale(${burstScale})`,
            opacity: burstOpacity,
            boxShadow: `
              0 0 40px ${aimsTheme.colors.goldGlow},
              0 0 80px ${aimsTheme.colors.goldGlow},
              0 0 120px rgba(212, 175, 55, 0.2)
            `,
          }}
        />
      </AbsoluteFill>

      {/* Pentaharmonic ring after burst */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: `1.5px solid ${aimsTheme.colors.goldDim}`,
            transform: `scale(${burstScale})`,
            opacity: burstOpacity * 0.5,
          }}
        />
      </AbsoluteFill>

      {/* ACHEEVY name + quote */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 130,
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            ...textStyles.h2,
            color: aimsTheme.colors.gold,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            letterSpacing: "0.08em",
          }}
        >
          ACHEEVY
        </div>
        <div
          style={{
            ...textStyles.quote,
            color: aimsTheme.colors.text.primary,
            opacity: quoteOpacity,
            fontSize: 30,
            textAlign: "center",
          }}
        >
          &ldquo;I am ACHEEVY, at your service.&rdquo;
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
