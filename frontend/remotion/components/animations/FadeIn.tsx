import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, duration = 20, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity, ...style }}>{children}</div>;
};
