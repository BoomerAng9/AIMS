'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { VerdictLevel } from '@/lib/types';
import { getVerdictLabel, getVerdictColor } from '@/lib/neighborhood';

interface VerdictCardProps {
  verdict: VerdictLevel;
  verdictText: string;
  address: string;
  lat: number;
  lng: number;
  price?: number;
  arv?: number;
}

export function VerdictCard({ verdict, verdictText, address, lat, lng, price, arv }: VerdictCardProps) {
  const color = getVerdictColor(verdict);
  const label = getVerdictLabel(verdict);
  const encodedAddress = encodeURIComponent(address);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
    >
      {/* Verdict Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="px-3 py-1 rounded-full text-sm font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {label}
        </span>
        <span className="text-sm text-zinc-400">ACHEEVY Verdict</span>
      </div>

      {/* Verdict Text */}
      <p className="text-zinc-300 leading-relaxed mb-6">{verdictText}</p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/flip?address=${encodedAddress}&lat=${lat}&lng=${lng}${price ? `&price=${price}` : ''}${arv ? `&arv=${arv}` : ''}`}
          className="px-4 py-2 rounded-lg bg-[#D4A843] text-black font-medium text-sm hover:bg-[#c49a3a] transition-colors"
        >
          Run Flip Calculator →
        </Link>
        <Link
          href={`/k1?address=${encodedAddress}&lat=${lat}&lng=${lng}`}
          className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors"
        >
          Generate K1 →
        </Link>
        <button className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors">
          Export PDF
        </button>
      </div>
    </motion.div>
  );
}
