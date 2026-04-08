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
 * Scene 5: Title Card
 * "The Book of V.I.B.E." main title with subtitle reveal.
 * "Visionary Intelligence Building Everything"
 */

export const TitleCard: React.FC<{
  subtitle: string;
  showDoctrine: boolean;
}> = ({ subtitle, showDoctrine }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gold accent line grows from center
  const lineWidth = interpolate(
    frame,
    [0, 0.8 * fps],
    [0, 400],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Main title
  const titleScale = spring({
    frame: Math.max(0, frame - 0.3 * fps),
    fps,
    config: springPresets.smooth,
  });
  const titleOpacity = interpolate(
    frame,
    [0.3 * fps, 1 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtitle
  const subOpacity = interpolate(
    frame,
    [1.5 * fps, 2.2 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const subY = interpolate(
    frame,
    [1.5 * fps, 2.2 * fps],
    [15, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Doctrine line
  const doctrineOpacity = interpolate(
    frame,
    [2.8 * fps, 3.5 * fps],
    [0, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Subtle gold radial ambient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 50%,
            rgba(212, 175, 55, 0.06) 0%,
            transparent 70%)`,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            backgroundColor: aimsTheme.colors.gold,
            boxShadow: `0 0 12px ${aimsTheme.colors.goldGlow}`,
          }}
        />

        {/* THE BOOK OF */}
        <div
          style={{
            ...textStyles.chapterLabel,
            color: aimsTheme.colors.text.secondary,
            opacity: titleOpacity,
            fontSize: 22,
          }}
        >
          The Book of
        </div>

        {/* V.I.B.E. */}
        <div
          style={{
            ...textStyles.h1,
            color: aimsTheme.colors.gold,
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            fontSize: 96,
            letterSpacing: "0.12em",
            textShadow: `0 0 40px ${aimsTheme.colors.goldGlow}`,
          }}
        >
          V.I.B.E.
        </div>

        {/* Subtitle expansion */}
        <div
          style={{
            ...textStyles.bodyLg,
            color: aimsTheme.colors.text.primary,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            letterSpacing: "0.05em",
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            width: lineWidth * 0.6,
            height: 1,
            backgroundColor: aimsTheme.colors.goldDim,
            marginTop: 8,
            opacity: subOpacity,
          }}
        />

        {/* Doctrine */}
        {showDoctrine && (
          <div
            style={{
              ...textStyles.chapterLabel,
              color: aimsTheme.colors.text.muted,
              opacity: doctrineOpacity,
              fontSize: 14,
              marginTop: 32,
            }}
          >
            Activity Breeds Activity
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
