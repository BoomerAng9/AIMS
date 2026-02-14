// frontend/components/ui/GlassCard.tsx
'use client';

/**
 * GlassCard — "Window" in the Brick & Window design system
 *
 * Frosted glass surface cut into the obsidian "Brick" background.
 * Used for all elevated content across the Digital Guild layout.
 *
 * Design: Obsidian & Gold Circuitry theme
 * Ref: aims-skills/skills/design/frontend-design-spec.md
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type GlassVariant = 'default' | 'gold' | 'cyan' | 'green' | 'red' | 'premium';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  glow?: boolean;
  noPadding?: boolean;
}

const VARIANT_STYLES: Record<GlassVariant, string> = {
  default: 'border-wireframe-stroke bg-black/40',
  gold: 'border-gold/20 bg-gold/5',
  cyan: 'border-cb-cyan/20 bg-cb-cyan/5',
  green: 'border-cb-green/20 bg-cb-green/5',
  red: 'border-cb-red/20 bg-cb-red/5',
  premium: 'border-gold/30 bg-gradient-to-br from-gold/5 to-black/80',
};

const GLOW_STYLES: Record<GlassVariant, string> = {
  default: '',
  gold: 'shadow-[0_0_20px_rgba(212,175,55,0.08)]',
  cyan: 'shadow-[0_0_20px_rgba(34,211,238,0.08)]',
  green: 'shadow-[0_0_20px_rgba(34,197,94,0.08)]',
  red: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
  premium: 'shadow-[0_0_40px_rgba(212,175,55,0.1)]',
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glow = false, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border backdrop-blur-xl transition-all duration-200',
          VARIANT_STYLES[variant],
          glow && GLOW_STYLES[variant],
          !noPadding && 'p-5',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = 'GlassCard';

export { GlassCard };
export type { GlassCardProps, GlassVariant };
