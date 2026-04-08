'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { Property } from '@/lib/types';
import { getStreetViewUrl } from '@/lib/google-maps';

interface PropertyCardProps {
  property: Property;
  selected: boolean;
  onClick: () => void;
}

const DEAL_STATUS_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#D4A843',
  marginal: '#f97316',
  pass: '#ef4444',
  unknown: '#71717a',
};

const DEAL_STATUS_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  marginal: 'Marginal',
  pass: 'Pass',
  unknown: 'Unknown',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function PropertyCard({ property, selected, onClick }: PropertyCardProps) {
  const streetViewSrc = getStreetViewUrl(property.lat, property.lng, 400, 250);
  const statusColor = DEAL_STATUS_COLORS[property.dealStatus] || DEAL_STATUS_COLORS.unknown;
  const statusLabel = DEAL_STATUS_LABELS[property.dealStatus] || 'Unknown';

  const analyzeHref = `/analyze?address=${encodeURIComponent(property.address)}&lat=${property.lat}&lng=${property.lng}`;
  const flipHref = `/flip?address=${encodeURIComponent(property.address)}&price=${property.price}&arv=${property.estimatedArv ?? ''}`;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl cursor-pointer
        bg-white/5 backdrop-blur-xl border
        transition-colors duration-200
        ${selected ? 'border-[#D4A843]' : 'border-white/10'}
      `}
    >
      {/* Street View Thumbnail */}
      <div className="relative w-full h-[200px] overflow-hidden">
        <Image
          src={streetViewSrc}
          alt={`Street view of ${property.address}`}
          width={400}
          height={250}
          className="w-full h-full object-cover"
          unoptimized
        />

        {/* Deal Status Badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            border: `1px solid ${statusColor}40`,
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Address */}
        <h3 className="text-white font-semibold text-sm leading-tight truncate" title={property.address}>
          {property.address}
        </h3>

        {/* Price */}
        <div className="text-2xl font-bold text-white tracking-tight">
          {formatPrice(property.price)}
        </div>

        {/* Property Details Row */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
              <path d="M21 7L12 2L3 7" />
              <path d="M7 11h0" />
              <path d="M17 11h0" />
            </svg>
            {property.bedrooms} bd
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a1 1 0 0 1 1-1z" />
              <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" />
            </svg>
            {property.bathrooms} ba
          </span>
          <span className="text-white/20">|</span>
          <span>{property.sqft.toLocaleString()} sqft</span>
          <span className="text-white/20">|</span>
          <span>Built {property.yearBuilt}</span>
        </div>

        {/* ARV & ROI Row */}
        {(property.estimatedArv !== null || property.estimatedRoi !== null) && (
          <div className="flex items-center gap-4 pt-1">
            {property.estimatedArv !== null && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Est. ARV</div>
                <div className="text-sm font-semibold text-[#D4A843]">
                  {formatPrice(property.estimatedArv)}
                </div>
              </div>
            )}
            {property.estimatedRoi !== null && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Est. ROI</div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: property.estimatedRoi >= 0 ? '#22c55e' : '#ef4444' }}
                >
                  {formatPercent(property.estimatedRoi)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Link
            href={analyzeHref}
            onClick={(e) => e.stopPropagation()}
            className="
              flex-1 text-center px-3 py-2 rounded-lg text-xs font-semibold
              bg-[#D4A843] text-black
              hover:bg-[#c49a3a] transition-colors duration-150
            "
          >
            Analyze
          </Link>
          <Link
            href={flipHref}
            onClick={(e) => e.stopPropagation()}
            className="
              flex-1 text-center px-3 py-2 rounded-lg text-xs font-semibold
              bg-white/10 text-white border border-white/10
              hover:bg-white/15 transition-colors duration-150
            "
          >
            Flip Calc
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
