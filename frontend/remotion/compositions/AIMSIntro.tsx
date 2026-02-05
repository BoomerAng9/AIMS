import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface AIMSIntroProps {
  title: string;
  subtitle: string;
}

export const AIMSIntro: React.FC<AIMSIntroProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const logoScale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background Logo Effect */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${logoScale})`,
          opacity: titleOpacity * 0.1,
          fontSize: "400px",
          fontWeight: 900,
          color: "#D4AF37",
          letterSpacing: "-0.05em",
        }}
      >
        A.I.M.S.
      </div>

      {/* Main Title */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "120px",
            fontWeight: 900,
            color: "#D4AF37",
            margin: 0,
            opacity: titleOpacity,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textShadow: "0 0 40px rgba(212, 175, 55, 0.5)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "48px",
            color: "#ededed",
            margin: "20px 0 0 0",
            opacity: subtitleOpacity,
            letterSpacing: "0.05em",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Bottom Accent Line */}
      <div
        style={{
          position: "absolute",
          bottom: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [60, 90], [0, 600], {
            extrapolateRight: "clamp",
          }),
          height: "4px",
          background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
