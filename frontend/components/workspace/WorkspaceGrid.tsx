// frontend/components/workspace/WorkspaceGrid.tsx
'use client';

/**
 * WorkspaceGrid — Zone B: YourSpace (The Digital Office)
 *
 * "Mission Control" dashboard showing running Docker containers
 * as "Active Tiles" with real-time status indicators.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Zone B
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Play, Pause, Square, MoreVertical, Terminal, ExternalLink,
  Cpu, HardDrive, Clock, ArrowUpRight, Activity,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ContainerStatus = 'running' | 'stopped' | 'paused' | 'error';

interface ContainerTile {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  port?: number;
  uptime: string;
  cpu: number;
  memory: number;
  category: 'core' | 'plug' | 'tool';
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_CONTAINERS: ContainerTile[] = [
  {
    id: 'ct-1', name: 'ACHEEVY Core', image: 'aims/acheevy:latest',
    status: 'running', port: 3003, uptime: '14d 8h', cpu: 12, memory: 340,
    category: 'core',
  },
  {
    id: 'ct-2', name: 'UEF Gateway', image: 'aims/uef-gateway:latest',
    status: 'running', port: 3001, uptime: '14d 8h', cpu: 8, memory: 210,
    category: 'core',
  },
  {
    id: 'ct-3', name: 'n8n Automation', image: 'n8nio/n8n:latest',
    status: 'running', port: 5678, uptime: '7d 2h', cpu: 5, memory: 420,
    category: 'tool',
  },
  {
    id: 'ct-4', name: 'Invoice OCR Plug', image: 'aims/ocr-plug:v2.1',
    status: 'running', port: 8080, uptime: '2d 14h', cpu: 3, memory: 180,
    category: 'plug',
  },
  {
    id: 'ct-5', name: 'OpenClaw Runner', image: 'aims/openclaw:latest',
    status: 'stopped', uptime: '—', cpu: 0, memory: 0,
    category: 'tool',
  },
  {
    id: 'ct-6', name: 'Content Pipeline', image: 'aims/content-pipe:v1.3',
    status: 'paused', uptime: '5d 19h', cpu: 0, memory: 95,
    category: 'plug',
  },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: ContainerStatus }) {
  const config: Record<ContainerStatus, { color: string; label: string; pulse: boolean }> = {
    running: { color: 'bg-cb-green shadow-cb-green/50', label: 'Running', pulse: true },
    stopped: { color: 'bg-cb-red shadow-cb-red/50', label: 'Stopped', pulse: false },
    paused: { color: 'bg-cb-amber shadow-cb-amber/50', label: 'Paused', pulse: false },
    error: { color: 'bg-cb-red shadow-cb-red/50', label: 'Error', pulse: true },
  };
  const c = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        {c.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.color} opacity-50`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 shadow-[0_0_6px] ${c.color}`} />
      </span>
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">{c.label}</span>
    </div>
  );
}

function ContainerCard({ container }: { container: ContainerTile }) {
  const [showMenu, setShowMenu] = useState(false);

  const categoryStyles: Record<string, { border: string; badge: string; badgeText: string }> = {
    core: { border: 'border-gold/20', badge: 'bg-gold/10', badgeText: 'text-gold' },
    plug: { border: 'border-cb-cyan/20', badge: 'bg-cb-cyan/10', badgeText: 'text-cb-cyan' },
    tool: { border: 'border-purple-500/20', badge: 'bg-purple-500/10', badgeText: 'text-purple-400' },
  };
  const cs = categoryStyles[container.category];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard
        className={`${cs.border} hover:ring-1 hover:ring-white/10 transition-all group relative`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <StatusIndicator status={container.status} />
            <h3 className="text-sm font-semibold text-white truncate">{container.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cs.badge} ${cs.badgeText}`}>
              {container.category}
            </span>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-3.5 h-3.5 text-white/30" />
            </button>
          </div>
        </div>

        {/* Image name */}
        <div className="text-[11px] font-mono text-white/25 mb-3 truncate">{container.image}</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/30 mb-0.5">
              <Cpu className="w-3 h-3" />
            </div>
            <div className="text-xs font-mono text-white">{container.cpu}%</div>
            <div className="text-[9px] text-white/20">CPU</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/30 mb-0.5">
              <HardDrive className="w-3 h-3" />
            </div>
            <div className="text-xs font-mono text-white">{container.memory}MB</div>
            <div className="text-[9px] text-white/20">MEM</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/30 mb-0.5">
              <Clock className="w-3 h-3" />
            </div>
            <div className="text-xs font-mono text-white">{container.uptime}</div>
            <div className="text-[9px] text-white/20">Up</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-wireframe-stroke">
          <div className="flex items-center gap-1">
            {container.status === 'running' && (
              <>
                <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Pause">
                  <Pause className="w-3.5 h-3.5 text-cb-amber" />
                </button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Stop">
                  <Square className="w-3.5 h-3.5 text-cb-red" />
                </button>
              </>
            )}
            {container.status === 'stopped' && (
              <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Start">
                <Play className="w-3.5 h-3.5 text-cb-green" />
              </button>
            )}
            {container.status === 'paused' && (
              <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Resume">
                <Play className="w-3.5 h-3.5 text-cb-green" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Terminal">
              <Terminal className="w-3.5 h-3.5 text-white/30" />
            </button>
            {container.port && (
              <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title={`Open :${container.port}`}>
                <ExternalLink className="w-3.5 h-3.5 text-white/30" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main WorkspaceGrid Component
// ─────────────────────────────────────────────────────────────

export function WorkspaceGrid() {
  const running = MOCK_CONTAINERS.filter((c) => c.status === 'running').length;
  const totalCpu = MOCK_CONTAINERS.reduce((sum, c) => sum + c.cpu, 0);
  const totalMem = MOCK_CONTAINERS.reduce((sum, c) => sum + c.memory, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gold font-display">YourSpace</h2>
          <p className="text-xs text-white/40 mt-0.5">Mission Control — Active containers and tools</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard variant="green" className="!p-3">
          <div className="text-xl font-bold text-cb-green">{running}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Running</div>
        </GlassCard>
        <GlassCard className="!p-3">
          <div className="text-xl font-bold text-white">{MOCK_CONTAINERS.length}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Total</div>
        </GlassCard>
        <GlassCard className="!p-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cb-cyan" />
            <span className="text-xl font-bold text-cb-cyan">{totalCpu}%</span>
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider">CPU Load</div>
        </GlassCard>
        <GlassCard className="!p-3">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-gold" />
            <span className="text-xl font-bold text-gold">{totalMem}MB</span>
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Memory</div>
        </GlassCard>
      </div>

      {/* Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {MOCK_CONTAINERS.map((container) => (
          <ContainerCard key={container.id} container={container} />
        ))}
      </div>
    </div>
  );
}

export default WorkspaceGrid;
