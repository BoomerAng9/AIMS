import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import React from "react";

export const PortTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Ken Burns effect: Slow scale and pan
  const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.2], {
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(frame, [0, durationInFrames], [0, -50], {
    extrapolateRight: "clamp",
  });
  
  const translateY = interpolate(frame, [0, durationInFrames], [0, -20], {
    extrapolateRight: "clamp",
  });

  // Logo subtle pulse animation
  const logoOpacity = interpolate(
    Math.sin((frame / fps) * Math.PI * 0.4),
    [-1, 1],
    [0.15, 0.25]
  );

  const logoScale = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  // Text fade-in
  const textOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const statusOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Background Port Image with Ken Burns */}
      <AbsoluteFill style={{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }}>
        <Img
          src={staticFile("assets/port_dock_v2.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Gold ACHIEVEMOR Logo - Built into the scene as watermark */}
      <AbsoluteFill
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${logoScale})`,
        }}
      >
        <img
          src="/images/logos/achievemor-gold.png"
          alt="ACHIEVEMOR"
          style={{
            width: 400,
            height: 400,
            objectFit: "contain",
            opacity: logoOpacity,
            filter: "blur(4px) drop-shadow(0 0 30px rgba(212, 175, 55, 0.3))",
          }}
        />
      </AbsoluteFill>

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      
      {/* Bottom Gradient Overlay */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 35%)",
        }}
      />
      
      {/* HUD Overlay */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: 60 }}>
        <h2 style={{ 
          fontFamily: "'Permanent Marker', cursive", 
          color: '#D4AF37',
          fontSize: 56,
          textTransform: 'uppercase',
          letterSpacing: 4,
          margin: 0,
          opacity: textOpacity,
          textShadow: '0 4px 30px rgba(0,0,0,0.8)'
        }}>
          A.I.M.S. PORT
        </h2>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 20,
          margin: '8px 0 0 0',
          opacity: textOpacity,
        }}>
          Containerized AI Tools • Deployed on Demand
        </p>
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
          alignItems: 'center',
          opacity: statusOpacity,
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#00ff00',
            boxShadow: '0 0 12px #00ff00'
          }} />
          <span style={{
            fontFamily: 'monospace',
            color: '#00ff00',
            fontSize: 14,
            letterSpacing: '0.1em'
          }}>
            BOOMER_ANGS ACTIVE
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
