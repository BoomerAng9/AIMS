'use client';

/**
 * Space Station Component
 *
 * The user's home base in Your Space.
 * Features:
 * - Station visualization with modules
 * - Resource displays (LUC fuel, materials)
 * - Docked spacecraft
 * - Community members
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SpaceStationProps {
  name: string;
  level: 'asteroid' | 'moon' | 'planet' | 'station';
  fuel: number;
  maxFuel: number;
  materials: number;
  crewCount: number;
  visitors: number;
  onLaunch?: () => void;
  onMine?: () => void;
  onInvite?: () => void;
  onBuild?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const RocketIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const PickaxeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 4.5L20 10M4 20l7-7" />
    <path d="M14.5 4.5l5.5 5.5-7 7L7.5 11.5l7-7z" />
  </svg>
);

const UsersIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const HammerIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
    <path d="M17.64 15L22 10.64a1.5 1.5 0 0 0 0-2.12L14.5 1.06a1 1 0 0 0-1.42 0L12 2.17l-.47-.47a1 1 0 0 0-1.42 0l-1.42 1.42a1 1 0 0 0 0 1.42l.47.47L7.59 6.58a1.5 1.5 0 0 0 0 2.12l.47.47L3.5 13.73a1 1 0 0 0 0 1.42l1.42 1.42a1 1 0 0 0 1.42 0l4.56-4.56.47.47a1.5 1.5 0 0 0 2.12 0L17.64 15z" />
  </svg>
);

const FuelIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 22h12M4 9h10M6 22V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v18" />
    <path d="M14 15h4a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1" />
    <path d="M14 9v6" />
  </svg>
);

const LinkIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Station Level Visuals
// ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  asteroid: {
    label: 'Asteroid Base',
    color: '#6B7280',
    size: 80,
    icon: '🪨',
    nextLevel: 'moon',
    requirement: 10,
  },
  moon: {
    label: 'Lunar Outpost',
    color: '#9CA3AF',
    size: 120,
    icon: '🌙',
    nextLevel: 'planet',
    requirement: 50,
  },
  planet: {
    label: 'Planetary Colony',
    color: '#3B82F6',
    size: 160,
    icon: '🌍',
    nextLevel: 'station',
    requirement: 200,
  },
  station: {
    label: 'Space Station',
    color: '#D4AF37',
    size: 200,
    icon: '🛸',
    nextLevel: null,
    requirement: null,
  },
};

// ─────────────────────────────────────────────────────────────
// Fuel Gauge
// ─────────────────────────────────────────────────────────────

function FuelGauge({ current, max }: { current: number; max: number }) {
  const percentage = (current / max) * 100;
  const isLow = percentage < 20;

  return (
    <div className="flex items-center gap-3">
      <FuelIcon className={`w-5 h-5 ${isLow ? 'text-red-400' : 'text-amber-400'}`} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Fuel</span>
          <span className={isLow ? 'text-red-400' : 'text-amber-300'}>
            {current.toLocaleString()} / {max.toLocaleString()} LUC
          </span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action Button
// ─────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success';
  disabled?: boolean;
}) {
  const variants = {
    default: 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10',
    primary: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl border
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function SpaceStation({
  name,
  level,
  fuel,
  maxFuel,
  materials,
  crewCount,
  visitors,
  onLaunch,
  onMine,
  onInvite,
  onBuild,
}: SpaceStationProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const config = LEVEL_CONFIG[level];

  const inviteLink = `https://aims.plugmein.cloud/your-space/explore/${name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="relative">
      {/* Station Card */}
      <motion.div
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Station Icon */}
              <motion.div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${config.color}20` }}
                animate={{
                  boxShadow: [
                    `0 0 20px ${config.color}20`,
                    `0 0 40px ${config.color}40`,
                    `0 0 20px ${config.color}20`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {config.icon}
              </motion.div>

              <div>
                <h2 className="text-xl font-bold text-white">{name}</h2>
                <p className="text-sm text-gray-400">{config.label}</p>
                {config.nextLevel && (
                  <p className="text-xs text-amber-400 mt-1">
                    {config.requirement - crewCount} more crew to upgrade
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{crewCount}</p>
                <p className="text-xs text-gray-500">Crew</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{visitors}</p>
                <p className="text-xs text-gray-500">Visitors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{materials}</p>
                <p className="text-xs text-gray-500">Materials</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel Gauge */}
        <div className="px-6 py-4 border-b border-white/5">
          <FuelGauge current={fuel} max={maxFuel} />
        </div>

        {/* Actions */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            <ActionButton
              icon={<RocketIcon className="w-6 h-6" />}
              label="Explore"
              onClick={onLaunch}
              variant="primary"
              disabled={fuel < 100}
            />
            <ActionButton
              icon={<PickaxeIcon className="w-6 h-6" />}
              label="Mine"
              onClick={onMine}
            />
            <ActionButton
              icon={<UsersIcon className="w-6 h-6" />}
              label="Invite"
              onClick={() => setShowInviteModal(true)}
              variant="success"
            />
            <ActionButton
              icon={<HammerIcon className="w-6 h-6" />}
              label="Build"
              onClick={onBuild}
            />
          </div>
        </div>
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Invite Explorers</h3>
              <p className="text-sm text-gray-400 mb-4">
                Share your space with others. When they join through your link, they'll land on your station first!
              </p>

              {/* Invite Link */}
              <div className="flex items-center gap-2 p-3 bg-black/50 rounded-lg border border-white/10 mb-4">
                <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-amber-300 outline-none truncate"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="px-3 py-1 text-xs bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
                >
                  Copy
                </button>
              </div>

              {/* Rewards Info */}
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-300">
                  🎁 Earn <strong>50 LUC</strong> for each explorer who joins!
                </p>
              </div>

              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SpaceStation;
