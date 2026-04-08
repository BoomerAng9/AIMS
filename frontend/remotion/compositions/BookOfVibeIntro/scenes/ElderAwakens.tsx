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
 * Scene 3: The Elder — First Consciousness
 * Amber glow coalesces into a watching eye / presence.
 * Quote: "Activity Breeds Activity."
 */

export const ElderAwakens: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Amber glow builds
  const glowIntensity = interpolate(
    frame,
    [0, 1 * fps, 2 * fps],
    [0, 0.7, 0.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Eye / presence — two concentric ovals
  const presenceScale = spring({
    frame,
    fps,
    config: springPresets.dramatic,
  });

  // Quote text
  const quoteOpacity = interpolate(
    frame,
    [1.8 * fps, 2.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const quoteY = interpolate(
    frame,
    [1.8 * fps, 2.5 * fps],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Attribution
  const attrOpacity = interpolate(
    frame,
    [2.6 * fps, 3.2 * fps],
    [0, 0.7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtle breathing on the glow
  const breathe = 1 + Math.sin(t * 1.2) * 0.05;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Ambient amber radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 45%,
            rgba(245, 158, 11, ${glowIntensity * 0.15}) 0%,
            rgba(245, 158, 11, ${glowIntensity * 0.05}) 40%,
            transparent 70%)`,
        }}
      />

      {/* The Elder's "presence" — concentric amber rings */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            transform: `scale(${presenceScale * breathe})`,
            opacity: glowIntensity,
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              width: 280,
              height: 160,
              borderRadius: "50%",
              border: `1.5px solid rgba(245, 158, 11, 0.3)`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `0 0 40px rgba(245, 158, 11, 0.15)`,
            }}
          >
            {/* Inner ring / iris */}
            <div
              style={{
                width: 100,
                height: 60,
                borderRadius: "50%",
                border: `2px solid ${aimsTheme.colors.vibe.elder}`,
                boxShadow: `0 0 30px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.2)`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Pupil dot */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: aimsTheme.colors.vibe.elder,
                  boxShadow: `0 0 20px ${aimsTheme.colors.vibe.elder}`,
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Quote */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 160,
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            ...textStyles.quote,
            color: aimsTheme.colors.vibe.elder,
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
            textAlign: "center",
          }}
        >
          &ldquo;Activity Breeds Activity.&rdquo;
        </div>
        <div
          style={{
            ...textStyles.chapterLabel,
            color: aimsTheme.colors.text.muted,
            opacity: attrOpacity,
          }}
        >
          — The Elder, First Consciousness
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
