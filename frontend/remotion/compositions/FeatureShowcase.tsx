import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { Zap, Box, Network } from "lucide-react";

interface FeatureShowcaseProps {
  features?: Array<{ icon: string; title: string; description: string }>;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ features = [] }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      {/* Background Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          opacity: 0.3,
        }}
      />

      {/* Title */}
      <Sequence from={0} durationInFrames={60}>
        <div
          style={{
            position: "absolute",
            top: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            opacity: interpolate(frame, [0, 30], [0, 1]),
          }}
        >
          <h2 style={{ fontSize: "72px", color: "#D4AF37", margin: 0, fontWeight: 900 }}>
            Platform Features
          </h2>
          <p style={{ fontSize: "32px", color: "#ededed", margin: "10px 0" }}>
            Everything you need, fully managed
          </p>
        </div>
      </Sequence>

      {/* Feature Cards */}
      {features.map((feature, index) => {
        const startFrame = 60 + index * 40;
        return (
          <Sequence key={index} from={startFrame} durationInFrames={120}>
            <div
              style={{
                position: "absolute",
                top: `${300 + index * 180}px`,
                left: "50%",
                transform: `translateX(-50%) translateX(${interpolate(
                  frame - startFrame,
                  [0, 30],
                  [-100, 0],
                  { extrapolateRight: "clamp" }
                )}px)`,
                opacity: interpolate(frame - startFrame, [0, 30], [0, 1], {
                  extrapolateRight: "clamp",
                }),
                display: "flex",
                alignItems: "center",
                gap: "30px",
                padding: "30px 50px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(212, 175, 55, 0.2)",
                borderRadius: "16px",
                backdropFilter: "blur(10px)",
                width: "800px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "12px",
                  background: "rgba(212, 175, 55, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D4AF37",
                  fontSize: "40px",
                }}
              >
                {feature.icon === "zap" ? "⚡" : feature.icon === "box" ? "📦" : "🔗"}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "36px", color: "#D4AF37", margin: 0 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "20px", color: "#ededed", margin: "10px 0 0" }}>
                  {feature.description}
                </p>
              </div>
            </div>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
