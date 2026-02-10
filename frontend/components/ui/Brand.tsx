'use client';

/**
 * Brand Component - Consistent Branding for A.I.M.S.
 *
 * Branding Guidelines:
 * - www.plugmein.cloud
 * - LUC - Locale Universal Calculator (Permanent Marker Font)
 * - AI Managed Solutions (Permanent Marker Font)
 * - A.I.M.S. (DOTO Font)
 * - Per|Form Platform (Permanent Marker Font)
 * - Deploy (Permanent Marker Font)
 * - Boomer_Angs / Boomer_Ang (Permanent Marker Font)
 */

import React from 'react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────
// Brand Types
// ─────────────────────────────────────────────────────────────

type BrandTerm =
  | 'aims'
  | 'ai-managed-solutions'
  | 'luc'
  | 'luc-full'
  | 'perform'
  | 'deploy'
  | 'boomerang'
  | 'boomerangs'
  | 'plugmein';

type BrandSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface BrandProps {
  term: BrandTerm;
  size?: BrandSize;
  className?: string;
  color?: 'gold' | 'white' | 'inherit';
  showSubtitle?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Size Mappings
// ─────────────────────────────────────────────────────────────

const sizeClasses: Record<BrandSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const subtitleSizeClasses: Record<BrandSize, string> = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
  '2xl': 'text-lg',
  '3xl': 'text-xl',
};

// ─────────────────────────────────────────────────────────────
// Brand Component
// ─────────────────────────────────────────────────────────────

export function Brand({
  term,
  size = 'md',
  className,
  color = 'inherit',
  showSubtitle = false,
}: BrandProps) {
  const colorClasses = {
    gold: 'text-gold',
    white: 'text-white',
    inherit: '',
  };

  const renderBrand = () => {
    switch (term) {
      case 'aims':
        // A.I.M.S. uses DOTO font
        return (
          <span className={clsx('font-display tracking-wider', sizeClasses[size], colorClasses[color])}>
            A.I.M.S.
          </span>
        );

      case 'ai-managed-solutions':
        // AI Managed Solutions uses Permanent Marker font
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            AI Managed Solutions
          </span>
        );

      case 'luc':
        // LUC uses Permanent Marker font
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            LUC
          </span>
        );

      case 'luc-full':
        // LUC - Locale Universal Calculator
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            LUC
            {showSubtitle && (
              <span className={clsx('block font-sans font-normal opacity-70', subtitleSizeClasses[size])}>
                Locale Universal Calculator
              </span>
            )}
          </span>
        );

      case 'perform':
        // Per|Form Platform uses Permanent Marker font
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            Per<span className="opacity-60">|</span>Form Platform
          </span>
        );

      case 'deploy':
        // Deploy uses Permanent Marker font
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            Deploy
          </span>
        );

      case 'boomerang':
        // Boomer_Ang (singular) uses Permanent Marker font
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            Boomer_Ang
          </span>
        );

      case 'boomerangs':
        // Boomer_Angs (plural) uses Permanent Marker font
        return (
          <span className={clsx('font-marker', sizeClasses[size], colorClasses[color])}>
            Boomer_Angs
          </span>
        );

      case 'plugmein':
        // www.plugmein.cloud
        return (
          <span className={clsx('font-sans', sizeClasses[size], colorClasses[color])}>
            www.plugmein.cloud
          </span>
        );

      default:
        return null;
    }
  };

  return <span className={className}>{renderBrand()}</span>;
}

// ─────────────────────────────────────────────────────────────
// Brand Logo with Subtitle
// ─────────────────────────────────────────────────────────────

interface BrandLogoProps {
  size?: BrandSize;
  className?: string;
  showSubtitle?: boolean;
  color?: 'gold' | 'white' | 'inherit';
}

export function BrandLogo({
  size = 'lg',
  className,
  showSubtitle = true,
  color = 'gold',
}: BrandLogoProps) {
  return (
    <div className={clsx('flex flex-col', className)}>
      <Brand term="aims" size={size} color={color} />
      {showSubtitle && (
        <Brand
          term="ai-managed-solutions"
          size={size === '3xl' ? 'lg' : size === '2xl' ? 'md' : size === 'xl' ? 'sm' : 'xs'}
          color={color}
          className="opacity-80"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline Brand Text Helper
// ─────────────────────────────────────────────────────────────

export function AIMS({ size = 'md', className }: { size?: BrandSize; className?: string }) {
  return <Brand term="aims" size={size} className={className} />;
}

export function LUC({ size = 'md', className, full = false }: { size?: BrandSize; className?: string; full?: boolean }) {
  return <Brand term={full ? 'luc-full' : 'luc'} size={size} className={className} showSubtitle={full} />;
}

export function BoomerAng({ size = 'md', className, plural = false }: { size?: BrandSize; className?: string; plural?: boolean }) {
  return <Brand term={plural ? 'boomerangs' : 'boomerang'} size={size} className={className} />;
}

export function PerForm({ size = 'md', className }: { size?: BrandSize; className?: string }) {
  return <Brand term="perform" size={size} className={className} />;
}

export function Deploy({ size = 'md', className }: { size?: BrandSize; className?: string }) {
  return <Brand term="deploy" size={size} className={className} />;
}
