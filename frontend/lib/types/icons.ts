/**
 * Standardized icon props for custom SVG icon components
 * Use this interface for all custom icons to ensure consistency
 */

import type { CSSProperties } from 'react';

export interface IconProps {
  className?: string;
  style?: CSSProperties;
  size?: number | string;
  color?: string;
}

/**
 * Helper to apply icon props to SVG element
 */
export function getIconStyle(props: IconProps): CSSProperties {
  const style: CSSProperties = { ...props.style };

  if (props.size) {
    style.width = props.size;
    style.height = props.size;
  }

  if (props.color) {
    style.color = props.color;
  }

  return style;
}
