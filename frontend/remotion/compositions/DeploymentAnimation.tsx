import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";

interface DeploymentAnimationProps {
  appName?: string;
  steps?: string[];
}

export const DeploymentAnimation: React.FC<DeploymentAnimationProps> = ({
  appName = "Application",
  steps = [],
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A", fontFamily: "monospace" }}>
      {/* Terminal Window */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1200px",
          height: "700px",
          background: "#1A1A1A",
          borderRadius: "12px",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 50px rgba(212, 175, 55, 0.3)",
          padding: "20px",
          opacity: interpolate(frame, [0, 20], [0, 1]),
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
            paddingBottom: "15px",
            borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          }}
        >
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28ca42" }} />
          <span style={{ marginLeft: "10px", color: "#D4AF37", fontSize: "18px" }}>
            A.I.M.S. Deployment Pipeline - {appName}
          </span>
        </div>

        {/* Deployment Steps */}
        <div style={{ color: "#ededed", fontSize: "20px", lineHeight: "1.8" }}>
          {steps.map((step, index) => {
            const stepStartFrame = 30 + index * 40;
            const isVisible = frame >= stepStartFrame;
            const stepOpacity = interpolate(
              frame,
              [stepStartFrame, stepStartFrame + 20],
              [0, 1],
              { extrapolateRight: "clamp" }
            );

            return (
              <div
                key={index}
                style={{
                  opacity: isVisible ? stepOpacity : 0,
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <span style={{ color: "#28ca42" }}>✓</span>
                <span style={{ color: "#06b6d4" }}>[{String(index + 1).padStart(2, "0")}]</span>
                <span>{step}</span>
                {isVisible && frame < stepStartFrame + 30 && (
                  <span
                    style={{
                      color: "#D4AF37",
                      animation: "blink 1s infinite",
                    }}
                  >
                    ▌
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Success Message */}
        <Sequence from={30 + steps.length * 40} durationInFrames={60}>
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "15px 40px",
              background: "rgba(40, 202, 66, 0.2)",
              border: "1px solid #28ca42",
              borderRadius: "8px",
              color: "#28ca42",
              fontSize: "24px",
              fontWeight: "bold",
              opacity: interpolate(
                frame - (30 + steps.length * 40),
                [0, 20],
                [0, 1],
                { extrapolateRight: "clamp" }
              ),
            }}
          >
            🚀 Deployment Complete - {appName} is LIVE
          </div>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
