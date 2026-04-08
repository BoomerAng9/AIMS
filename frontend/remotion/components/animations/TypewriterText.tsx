import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const TypewriterText: React.FC<{
  text: string;
  charsPerSecond?: number;
  style?: React.CSSProperties;
  showCursor?: boolean;
}> = ({ text, charsPerSecond = 25, style, showCursor = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visibleChars = Math.floor((frame / fps) * charsPerSecond);
  const done = visibleChars >= text.length;

  return (
    <span style={style}>
      {text.slice(0, visibleChars)}
      {showCursor && !done && (
        <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>
      )}
    </span>
  );
};
