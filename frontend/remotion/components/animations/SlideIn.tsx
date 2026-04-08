import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { springPresets } from "../../styles/animations";

export const SlideIn: React.FC<{
  children: React.ReactNode;
  from?: "left" | "right" | "top" | "bottom";
  delay?: number;
  distance?: number;
  preset?: keyof typeof springPresets;
  style?: React.CSSProperties;
}> = ({
  children,
  from = "bottom",
  delay = 0,
  distance = 80,
  preset = "smooth",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: springPresets[preset],
  });

  const axis = from === "left" || from === "right" ? "X" : "Y";
  const sign = from === "left" || from === "top" ? -1 : 1;
  const offset = interpolate(progress, [0, 1], [sign * distance, 0]);

  return (
    <div
      style={{
        transform: `translate${axis}(${offset}px)`,
        opacity: progress,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
