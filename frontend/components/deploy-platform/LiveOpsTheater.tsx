'use client';

/**
 * Live Ops Theater Component
 * Watch-only view of Lil_Hawk operations during a Shift
 *
 * Users never message Lil_Hawks directly - they only WATCH here.
 * All user interaction goes through ACHEEVY.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIMS_CIRCUIT_COLORS } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface LilHawkStatus {
  canonicalId: string;
  personaHandle: string;
  designation: string;
  status: 'idle' | 'working' | 'verifying' | 'complete';
  currentTask?: string;
  careerLevel: string;
}

interface ShiftEvent {
  id: string;
  type: string;
  timestamp: Date;
  description: string;
  lilHawk?: string;
  captionType?: string;
}

interface SecurityIndicators {
  mtls: boolean;
  allowlist: boolean;
  scans: boolean;
  attestation: boolean;
}

interface ShiftStatus {
  shiftId: string;
  squadName: string;
  phase: 'clock_in' | 'execution' | 'verification' | 'debrief' | 'clock_out';
  progressPercent: number;
  currentWave: number;
  totalWaves: number;
  lilHawks: LilHawkStatus[];
  recentCaptions: string[];
  security: SecurityIndicators;
}

interface LiveOpsTheaterProps {
  shiftId?: string;
  isOpen: boolean;
  onClose: () => void;
  minimal?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const ContainerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M12 7V3M7 7V4M17 7V4" />
  </svg>
);

const CraneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 21h16M6 21V8M18 21V8M6 8l6-6 6 6" />
    <path d="M12 8v8M9 14h6" />
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const BirdIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 7h.01M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
    <path d="M20 7c.5 0 1.5 1.5 1.5 2s-1 3-1.5 3" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Yard Animation (Container Stacks)
// ─────────────────────────────────────────────────────────────

function YardAnimation({ phase, progress }: { phase: string; progress: number }) {
  const containers = [
    { x: 10, y: 60, color: '#3B82F6' },
    { x: 30, y: 60, color: '#22C55E' },
    { x: 50, y: 60, color: '#EAB308' },
    { x: 70, y: 60, color: '#EF4444' },
    { x: 90, y: 60, color: '#8B5CF6' },
  ];

  return (
    <div className="relative h-24 bg-black/30 rounded-lg overflow-hidden border border-wireframe-stroke">
      <svg className="w-full h-full" viewBox="0 0 100 80">
        {/* Ground */}
        <rect x="0" y="70" width="100" height="10" fill="#1a2234" />

        {/* Crane */}
        <motion.g
          animate={{ x: phase === 'execution' ? [0, 20, -20, 0] : 0 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <line x1="50" y1="10" x2="50" y2="50" stroke={AIMS_CIRCUIT_COLORS.primary} strokeWidth="2" />
          <line x1="30" y1="10" x2="70" y2="10" stroke={AIMS_CIRCUIT_COLORS.primary} strokeWidth="2" />
          <rect x="45" y="8" width="10" height="4" fill={AIMS_CIRCUIT_COLORS.accent} />
          {phase === 'execution' && (
            <motion.line
              x1="50" y1="50" x2="50" y2="65"
              stroke={AIMS_CIRCUIT_COLORS.accent}
              strokeWidth="1"
              strokeDasharray="2 2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.g>

        {/* Containers */}
        {containers.map((c, i) => (
          <motion.rect
            key={i}
            x={c.x - 8}
            y={c.y - (i < Math.floor(progress / 20) ? 10 : 0)}
            width="16"
            height="10"
            fill={c.color}
            rx="1"
            animate={{
              y: i < Math.floor(progress / 20) ? [c.y, c.y - 5, c.y] : c.y,
              opacity: i < Math.floor(progress / 20) ? 1 : 0.4,
            }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}

        {/* Progress bar */}
        <rect x="5" y="75" width="90" height="3" fill="#1a2234" rx="1" />
        <motion.rect
          x="5" y="75"
          width={90 * (progress / 100)}
          height="3"
          fill={AIMS_CIRCUIT_COLORS.accent}
          rx="1"
          animate={{ width: 90 * (progress / 100) }}
        />
      </svg>

      {/* Phase label */}
      <div className="absolute top-2 left-2 text-xs font-mono text-gold uppercase">
        {phase.replace('_', ' ')}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lil_Hawk Card
// ─────────────────────────────────────────────────────────────

function LilHawkCard({ hawk }: { hawk: LilHawkStatus }) {
  const statusColors = {
    idle: 'bg-gray-500',
    working: 'bg-gold animate-pulse',
    verifying: 'bg-blue-500 animate-pulse',
    complete: 'bg-green-500',
  };

  return (
    <div className="p-2 rounded-lg bg-black/30 border border-wireframe-stroke flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
        <BirdIcon className="w-4 h-4 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-white truncate">{hawk.personaHandle}</div>
        <div className="text-[10px] text-gray-500 truncate">{hawk.currentTask || hawk.designation}</div>
      </div>
      <div className={`w-2 h-2 rounded-full ${statusColors[hawk.status]}`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Security Bar
// ─────────────────────────────────────────────────────────────

function SecurityBar({ indicators }: { indicators: SecurityIndicators }) {
  const items = [
    { key: 'mtls', label: 'mTLS', active: indicators.mtls },
    { key: 'allowlist', label: 'Allowlist', active: indicators.allowlist },
    { key: 'scans', label: 'Scans', active: indicators.scans },
    { key: 'attestation', label: 'Attestation', active: indicators.attestation },
  ];

  return (
    <div className="flex items-center gap-2">
      <ShieldCheckIcon className="w-4 h-4 text-green-400" />
      <div className="flex gap-1">
        {items.map((item) => (
          <div
            key={item.key}
            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              item.active
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-500'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Event Feed
// ─────────────────────────────────────────────────────────────

function EventFeed({ events }: { events: ShiftEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      ref={feedRef}
      className="h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gold/20"
    >
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="p-2 rounded bg-black/20 text-xs"
          >
            <div className="flex items-center gap-2">
              {event.lilHawk && (
                <span className="text-gold font-medium">{event.lilHawk}:</span>
              )}
              <span className="text-white/70">{event.description}</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">
              {event.timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function LiveOpsTheater({ shiftId, isOpen, onClose, minimal = false }: LiveOpsTheaterProps) {
  const [status, setStatus] = useState<ShiftStatus | null>(null);
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [humorEnabled, setHumorEnabled] = useState(true);

  // Simulate shift status updates
  useEffect(() => {
    if (!isOpen || !shiftId) return;

    // Mock initial status
    setStatus({
      shiftId,
      squadName: 'Swift Squad',
      phase: 'execution',
      progressPercent: 45,
      currentWave: 2,
      totalWaves: 4,
      lilHawks: [
        { canonicalId: 'Lil_Packer_Hawk_SFT-001-001', personaHandle: 'Lil_Packer_Hawk', designation: 'Container packaging', status: 'working', currentTask: 'Sealing artifacts', careerLevel: 'Journeyman' },
        { canonicalId: 'Lil_ShipIt_Hawk_SFT-001-002', personaHandle: 'Lil_ShipIt_Hawk', designation: 'Deployment execution', status: 'idle', careerLevel: 'Apprentice' },
        { canonicalId: 'Lil_RedFlag_Hawk_SFT-001-003', personaHandle: 'Lil_RedFlag_Hawk', designation: 'Safety monitoring', status: 'verifying', currentTask: 'Scanning artifacts', careerLevel: 'Foreman' },
        { canonicalId: 'Lil_Tetris_Hawk_SFT-001-004', personaHandle: 'Lil_Tetris_Hawk', designation: 'Space optimization', status: 'complete', careerLevel: 'Hatchling' },
      ],
      recentCaptions: [
        "Wave 2 in progress. Stay in your lanes.",
        "Lil_Packer_Hawk: packaging clean. No loose tape.",
      ],
      security: { mtls: true, allowlist: true, scans: true, attestation: true },
    });

    // Mock events
    const initialEvents: ShiftEvent[] = [
      { id: '1', type: 'shift_start', timestamp: new Date(Date.now() - 300000), description: 'Shift SH-ABC12345 started', lilHawk: undefined },
      { id: '2', type: 'roll_call', timestamp: new Date(Date.now() - 290000), description: 'Roll call complete. All Lil_Hawks present.', lilHawk: undefined },
      { id: '3', type: 'wave_start', timestamp: new Date(Date.now() - 200000), description: 'Wave 1 started with 3 steps', lilHawk: undefined },
      { id: '4', type: 'caption', timestamp: new Date(Date.now() - 150000), description: "Moving containers. Smooth sailing.", lilHawk: 'Lil_Packer_Hawk', captionType: 'execution' },
      { id: '5', type: 'wave_complete', timestamp: new Date(Date.now() - 100000), description: 'Wave 1 complete: 3/3 success', lilHawk: undefined },
      { id: '6', type: 'wave_start', timestamp: new Date(Date.now() - 50000), description: 'Wave 2 started with 4 steps', lilHawk: undefined },
    ];
    setEvents(initialEvents);

    // Simulate live updates
    const interval = setInterval(() => {
      const captions = humorEnabled
        ? [
            "Container sealed tighter than my lips about that rollback.",
            "Running on three espressos and pure determination.",
            "Every manifest is a chance to level up.",
            "Do it right, even when nobody's watching\u2014except the flight recorder.",
          ]
        : [
            "Processing step 3 of 4.",
            "Verification in progress.",
            "Artifact scan complete.",
          ];

      const newEvent: ShiftEvent = {
        id: Date.now().toString(),
        type: 'caption',
        timestamp: new Date(),
        description: captions[Math.floor(Math.random() * captions.length)],
        lilHawk: ['Lil_Packer_Hawk', 'Lil_RedFlag_Hawk', 'Lil_ShipIt_Hawk'][Math.floor(Math.random() * 3)],
        captionType: 'execution',
      };

      setEvents((prev) => [...prev.slice(-19), newEvent]);

      setStatus((prev) =>
        prev
          ? {
              ...prev,
              progressPercent: Math.min(prev.progressPercent + 2, 100),
            }
          : prev
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, shiftId, humorEnabled]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`bg-[#0a1628] rounded-xl border border-gold/20 overflow-hidden shadow-2xl ${
          minimal ? 'w-80' : 'w-full max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-wireframe-stroke">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <CraneIcon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Live Ops Theater</h2>
              <p className="text-xs text-gray-500">
                {status?.squadName} | Shift {status?.shiftId?.slice(0, 12)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={humorEnabled}
                onChange={(e) => setHumorEnabled(e.target.checked)}
                className="rounded border-gray-600 text-gold focus:ring-gold"
              />
              Humor
            </label>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Security Bar */}
          {status && <SecurityBar indicators={status.security} />}

          {/* Yard Animation */}
          {status && <YardAnimation phase={status.phase} progress={status.progressPercent} />}

          {/* Timeline */}
          <div className="flex items-center gap-2">
            {['Plan', 'Execute', 'Verify', 'Receipt'].map((phase, i) => {
              const phases = ['clock_in', 'execution', 'verification', 'clock_out'];
              const currentIndex = phases.indexOf(status?.phase || '');
              const isActive = i <= currentIndex;
              const isCurrent = i === currentIndex;

              return (
                <div key={phase} className="flex-1 flex items-center">
                  <div
                    className={`flex-1 h-1 rounded ${
                      isActive ? 'bg-gold' : 'bg-gray-700'
                    }`}
                  />
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-gold text-black'
                        : isActive
                        ? 'bg-gold/50 text-white'
                        : 'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Crew Panel */}
          {!minimal && status && (
            <div>
              <h3 className="text-xs font-mono text-gray-400 uppercase mb-2">Crew</h3>
              <div className="grid grid-cols-2 gap-2">
                {status.lilHawks.map((hawk) => (
                  <LilHawkCard key={hawk.canonicalId} hawk={hawk} />
                ))}
              </div>
            </div>
          )}

          {/* Event Feed */}
          <div>
            <h3 className="text-xs font-mono text-gray-400 uppercase mb-2">Event Feed</h3>
            <EventFeed events={events} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-wireframe-stroke text-center">
          <p className="text-xs text-gray-500">
            Watch only \u2014 Chat with ACHEEVY to make changes
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LiveOpsTheater;
