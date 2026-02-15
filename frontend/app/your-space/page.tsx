'use client';

/**
 * Your Space - Main Page
 *
 * The user's personal space in the A.I.M.S. galaxy.
 * MySpace revival meets No Man's Sky exploration.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarfieldBackground } from '@/components/your-space/StarfieldBackground';
import { SpaceStation } from '@/components/your-space/SpaceStation';
import { Spacecraft } from '@/components/your-space/Spacecraft';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Planet {
  id: string;
  name: string;
  type: 'unexplored' | 'explored' | 'claimed' | 'friendly';
  owner?: string;
  distance: number;
  resources: string[];
  x: number;
  y: number;
  color: string;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const NEARBY_PLANETS: Planet[] = [
  { id: 'p1', name: 'Zephyr-7', type: 'unexplored', distance: 12, resources: ['Helium-3', 'Iron'], x: 75, y: 20, color: '#8B5CF6' },
  { id: 'p2', name: 'Nova Prime', type: 'friendly', owner: 'Captain_Stellar', distance: 24, resources: ['Gold', 'Titanium'], x: 20, y: 35, color: '#F59E0B' },
  { id: 'p3', name: 'Darkholme', type: 'unexplored', distance: 48, resources: ['Dark Matter', 'Crystals'], x: 85, y: 65, color: '#6366F1' },
  { id: 'p4', name: 'Eden-12', type: 'explored', distance: 8, resources: ['Water', 'Organics'], x: 40, y: 80, color: '#22C55E' },
];

// ─────────────────────────────────────────────────────────────
// Planet Marker
// ─────────────────────────────────────────────────────────────

function PlanetMarker({ planet, onClick }: { planet: Planet; onClick: () => void }) {
  const typeIcons = {
    unexplored: '❓',
    explored: '✓',
    claimed: '🏴',
    friendly: '🤝',
  };

  return (
    <motion.button
      onClick={onClick}
      className="absolute group"
      style={{ left: `${planet.x}%`, top: `${planet.y}%` }}
      whileHover={{ scale: 1.2 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Planet */}
      <motion.div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}88)`,
          boxShadow: `0 0 20px ${planet.color}40`,
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${planet.color}40`,
            `0 0 30px ${planet.color}60`,
            `0 0 20px ${planet.color}40`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {typeIcons[planet.type]}
      </motion.div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="font-bold text-white">{planet.name}</p>
        <p className="text-gray-400">{planet.distance} LY away</p>
        {planet.owner && <p className="text-gold">👤 {planet.owner}</p>}
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// Navigation HUD
// ─────────────────────────────────────────────────────────────

function NavigationHUD({ fuel, onOpenGalaxyMap }: { fuel: number; onOpenGalaxyMap: () => void }) {
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
      {/* Left: Coordinates */}
      <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-wireframe-stroke rounded-xl px-4 py-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Location</p>
        <p className="text-sm text-gold font-mono">Sector 7-Alpha</p>
      </div>

      {/* Center: Galaxy Map Button */}
      <button
        onClick={onOpenGalaxyMap}
        className="pointer-events-auto px-6 py-2 bg-gold/20 border border-gold/30 rounded-full text-sm text-gold hover:bg-gold/30 transition-colors"
      >
        🗺️ Galaxy Map
      </button>

      {/* Right: Quick Stats */}
      <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-wireframe-stroke rounded-xl px-4 py-2 flex gap-6">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Fuel</p>
          <p className="text-sm text-gold font-mono">{fuel} LUC</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Range</p>
          <p className="text-sm text-green-400 font-mono">{Math.floor(fuel / 10)} LY</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Planet Detail Modal
// ─────────────────────────────────────────────────────────────

function PlanetDetail({ planet, onClose, onTravel }: { planet: Planet; onClose: () => void; onTravel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0a0a0a] border border-wireframe-stroke rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Planet Visual */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            className="w-20 h-20 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}44)`,
              boxShadow: `0 0 30px ${planet.color}60`,
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
          <div>
            <h2 className="text-xl font-bold text-white">{planet.name}</h2>
            <p className="text-sm text-gray-400">{planet.distance} Light Years</p>
            {planet.owner && (
              <p className="text-sm text-gold">👤 Owned by {planet.owner}</p>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Resources</p>
          <div className="flex flex-wrap gap-2">
            {planet.resources.map((resource) => (
              <span
                key={resource}
                className="px-3 py-1 text-sm bg-white/5 border border-wireframe-stroke rounded-full text-gray-300"
              >
                {resource}
              </span>
            ))}
          </div>
        </div>

        {/* Cost */}
        <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Travel Cost</span>
            <span className="text-lg font-bold text-gold">{planet.distance * 10} LUC</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-wireframe-stroke text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onTravel}
            className="flex-1 py-3 rounded-xl bg-gold text-black font-medium hover:bg-gold-light transition-colors"
          >
            🚀 Launch
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function YourSpacePage() {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [showStation, setShowStation] = useState(true);

  // Mock user data
  const [userData, setUserData] = useState({
    spaceName: 'Nebula Station',
    level: 'moon' as const,
    fuel: 847,
    maxFuel: 1000,
    materials: 234,
    crewCount: 23,
    visitors: 156,
    ship: {
      name: 'Star Chaser',
      class: 'cruiser' as const,
      fuel: 450,
      maxFuel: 500,
      speed: 12,
      cargo: 45,
      maxCargo: 100,
    },
  });

  const handleTravel = () => {
    if (selectedPlanet) {
      setIsExploring(true);
      setShowStation(false);
      // Simulate travel
      setTimeout(() => {
        setIsExploring(false);
        setSelectedPlanet(null);
      }, 3000);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Starfield Background */}
      <StarfieldBackground
        starCount={300}
        showPlanets
        showNebulae
        showShootingStars
      />

      {/* Navigation HUD */}
      <NavigationHUD
        fuel={userData.fuel}
        onOpenGalaxyMap={() => console.log('Open galaxy map')}
      />

      {/* Planet Markers */}
      <div className="absolute inset-0 pointer-events-none">
        {NEARBY_PLANETS.map((planet) => (
          <PlanetMarker
            key={planet.id}
            planet={planet}
            onClick={() => setSelectedPlanet(planet)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-end p-6">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {/* Ship */}
          <AnimatePresence>
            {!showStation && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <Spacecraft
                  name={userData.ship.name}
                  shipClass={userData.ship.class}
                  fuel={userData.ship.fuel}
                  maxFuel={userData.ship.maxFuel}
                  speed={userData.ship.speed}
                  cargo={userData.ship.cargo}
                  maxCargo={userData.ship.maxCargo}
                  isLaunched={isExploring}
                  onCustomize={() => console.log('Customize ship')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Space Station */}
          <AnimatePresence>
            {showStation && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <SpaceStation
                  name={userData.spaceName}
                  level={userData.level}
                  fuel={userData.fuel}
                  maxFuel={userData.maxFuel}
                  materials={userData.materials}
                  crewCount={userData.crewCount}
                  visitors={userData.visitors}
                  onLaunch={() => setShowStation(false)}
                  onMine={() => {
                    setUserData(prev => ({
                      ...prev,
                      fuel: Math.min(prev.fuel + 50, prev.maxFuel),
                      materials: prev.materials + 10,
                    }));
                  }}
                  onInvite={() => console.log('Invite modal')}
                  onBuild={() => console.log('Build with Claude Code')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowStation(!showStation)}
              className="px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showStation ? '🚀 View Ship' : '🏠 Return to Station'}
            </button>
          </div>
        </div>
      </div>

      {/* Planet Detail Modal */}
      <AnimatePresence>
        {selectedPlanet && (
          <PlanetDetail
            planet={selectedPlanet}
            onClose={() => setSelectedPlanet(null)}
            onTravel={handleTravel}
          />
        )}
      </AnimatePresence>

      {/* Exploring Overlay */}
      <AnimatePresence>
        {isExploring && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                🚀
              </motion.div>
              <p className="text-xl text-white mb-2">Traveling...</p>
              <p className="text-sm text-gray-400">Hold tight, explorer!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
