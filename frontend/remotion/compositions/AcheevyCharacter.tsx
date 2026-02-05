import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from "remotion";
import React from "react";

interface AcheevyCharacterProps {
  variant?: "intro" | "talking" | "working";
  message?: string;
}

export const AcheevyCharacter: React.FC<AcheevyCharacterProps> = ({ 
  variant = "intro",
  message = "Let's build something great."
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === ENTRANCE ANIMATION ===
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const characterY = interpolate(entranceProgress, [0, 1], [200, 0]);
  const characterOpacity = interpolate(entranceProgress, [0, 1], [0, 1]);

  // === IDLE BREATHING ANIMATION ===
  const breathCycle = Math.sin((frame / fps) * 2 * Math.PI * 0.3); // 0.3 Hz breathing
  const breathScale = 1 + breathCycle * 0.015; // Subtle 1.5% scale variation

  // === HELMET VISOR GLOW ===
  const glowIntensity = interpolate(
    Math.sin((frame / fps) * Math.PI * 2), // 1Hz pulse
    [-1, 1],
    [0.4, 1]
  );

  // === FLOATING EFFECT ===
  const floatY = Math.sin((frame / fps) * Math.PI * 0.5) * 8; // Gentle float

  // === TEXT TYPEWRITER ===
  const charsToShow = Math.floor(
    interpolate(frame, [30, 30 + message.length * 2], [0, message.length], {
      extrapolateRight: "clamp",
    })
  );
  const displayedMessage = message.slice(0, charsToShow);

  // === PARTICLE EFFECTS ===
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: 50 + Math.sin(i * 0.7) * 40,
    y: 20 + (frame * 0.5 + i * 30) % 100,
    size: 2 + Math.sin(i) * 2,
    opacity: 0.3 + Math.sin(frame * 0.05 + i) * 0.2,
  }));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 100%)",
        overflow: "hidden",
      }}
    >
      {/* Background Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          opacity: 0.5,
        }}
      />

      {/* Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#D4AF37",
            opacity: p.opacity,
            filter: "blur(1px)",
          }}
        />
      ))}

      {/* Main Character Container */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${characterY + floatY}px) scale(${breathScale})`,
          opacity: characterOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Helmet Glow Effect */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 180,
            height: 80,
            background: `radial-gradient(ellipse, rgba(255, 140, 0, ${glowIntensity * 0.6}) 0%, transparent 70%)`,
            filter: "blur(20px)",
            zIndex: 2,
          }}
        />

        {/* Character Image */}
        <Img
          src={staticFile("images/acheevy/hero-character.png")}
          style={{
            height: 600,
            objectFit: "contain",
            filter: `drop-shadow(0 20px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(212, 175, 55, ${glowIntensity * 0.3}))`,
            zIndex: 1,
          }}
        />

        {/* Name Badge */}
        <div
          style={{
            marginTop: 30,
            padding: "12px 40px",
            background: "rgba(212, 175, 55, 0.1)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: 8,
            opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame, [40, 60], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: 42,
              color: "#D4AF37",
              letterSpacing: "0.1em",
            }}
          >
            ACHEEVY
          </span>
        </div>

        {/* Speech Bubble */}
        {variant === "talking" && (
          <div
            style={{
              marginTop: 20,
              padding: "16px 30px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              maxWidth: 500,
              opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 24,
                color: "#ededed",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              "{displayedMessage}"
              <span
                style={{
                  opacity: frame % 30 < 15 ? 1 : 0,
                  color: "#D4AF37",
                }}
              >
                |
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Bottom Accent */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ width: 100, height: 2, background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
        <span style={{ fontFamily: "monospace", fontSize: 14, color: "#666", letterSpacing: "0.2em" }}>
          A.I.M.S. ORCHESTRATOR
        </span>
        <div style={{ width: 100, height: 2, background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};
