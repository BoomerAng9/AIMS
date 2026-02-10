'use client';

/**
 * Spacecraft Component
 *
 * The user's vehicle for exploring the galaxy.
 * Built with Claude Code, customizable, upgradeable.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ShipClass = 'shuttle' | 'cruiser' | 'freighter' | 'flagship';

interface SpacecraftProps {
  name: string;
  shipClass: ShipClass;
  fuel: number;
  maxFuel: number;
  speed: number;
  cargo: number;
  maxCargo: number;
  isLaunched?: boolean;
  onCustomize?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Ship Class Config
// ─────────────────────────────────────────────────────────────

const SHIP_CONFIG = {
  shuttle: {
    label: 'Shuttle',
    color: '#9CA3AF',
    fuelEfficiency: 1.0,
    cargoBonus: 0,
    speedBonus: 0.2,
    visual: '🚀',
  },
  cruiser: {
    label: 'Cruiser',
    color: '#3B82F6',
    fuelEfficiency: 0.8,
    cargoBonus: 50,
    speedBonus: 0,
    visual: '🛸',
  },
  freighter: {
    label: 'Freighter',
    color: '#F59E0B',
    fuelEfficiency: 0.6,
    cargoBonus: 200,
    speedBonus: -0.2,
    visual: '🚢',
  },
  flagship: {
    label: 'Flagship',
    color: '#D4AF37',
    fuelEfficiency: 0.9,
    cargoBonus: 100,
    speedBonus: 0.3,
    visual: '⭐',
  },
};

// ─────────────────────────────────────────────────────────────
// Ship Visual
// ─────────────────────────────────────────────────────────────

function ShipVisual({ shipClass, isLaunched }: { shipClass: ShipClass; isLaunched: boolean }) {
  const config = SHIP_CONFIG[shipClass];

  return (
    <motion.div
      className="relative"
      animate={isLaunched ? {
        y: [-5, 5, -5],
        rotate: [-2, 2, -2],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Ship body */}
      <div
        className="w-32 h-32 rounded-2xl flex items-center justify-center text-6xl relative"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${config.color}40, ${config.color}10)`,
          boxShadow: isLaunched
            ? `0 0 30px ${config.color}60, 0 20px 40px rgba(0,0,0,0.5)`
            : `0 0 20px ${config.color}30`,
        }}
      >
        {config.visual}

        {/* Engine glow when launched */}
        {isLaunched && (
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-12"
            style={{
              background: `linear-gradient(to bottom, ${config.color}, transparent)`,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              height: [40, 60, 40],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat Bar
// ─────────────────────────────────────────────────────────────

function StatBar({
  label,
  current,
  max,
  color,
  icon,
}: {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: string;
}) {
  const percentage = (current / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1">
          <span>{icon}</span>
          {label}
        </span>
        <span style={{ color }}>
          {current} / {max}
        </span>
      </div>
      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function Spacecraft({
  name,
  shipClass,
  fuel,
  maxFuel,
  speed,
  cargo,
  maxCargo,
  isLaunched = false,
  onCustomize,
}: SpacecraftProps) {
  const config = SHIP_CONFIG[shipClass];

  return (
    <motion.div
      className="bg-black/40 backdrop-blur-xl border border-wireframe-stroke rounded-2xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-start gap-6">
        {/* Ship Visual */}
        <ShipVisual shipClass={shipClass} isLaunched={isLaunched} />

        {/* Ship Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-sm" style={{ color: config.color }}>
                {config.label} Class
              </p>
            </div>
            {isLaunched && (
              <motion.span
                className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ● In Flight
              </motion.span>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <StatBar
              label="Fuel"
              current={fuel}
              max={maxFuel}
              color="#F59E0B"
              icon="⛽"
            />
            <StatBar
              label="Cargo"
              current={cargo}
              max={maxCargo}
              color="#3B82F6"
              icon="📦"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">⚡ Speed</span>
              <span className="text-green-400">{speed} LY/hr</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">🔋 Efficiency</span>
              <span className="text-gold">{(config.fuelEfficiency * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Customize Button */}
          {onCustomize && (
            <button
              onClick={onCustomize}
              className="mt-4 w-full py-2 px-4 rounded-lg bg-white/5 border border-wireframe-stroke text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              🔧 Customize with Claude Code
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Spacecraft;
