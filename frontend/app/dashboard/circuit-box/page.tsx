'use client';

/**
 * Circuit Box — Central Command Hub (Owner/User Role-Gated)
 *
 * Panelized "control console" layout inspired by breaker box UI.
 * - Owners: full access to all panels, policies, secrets (masked), live events, kill switch.
 * - Users: reduced view — allowed service bays, BYOK fields, no infrastructure panels.
 *
 * Design tokens: ink, gold, cb-cyan, cb-green, cb-amber, cb-red, cb-fog
 * Motion: instrument-grade (120–180ms toggles, 180–240ms panels)
 */

import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AIMS_CIRCUIT_COLORS, CircuitBoardPattern } from '@/components/ui/CircuitBoard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────
// Lazy-loaded panel components
// ─────────────────────────────────────────────────────────────

const LUCPanel = lazy(() => import('@/app/dashboard/luc/page'));
const ModelGardenPanel = lazy(() => import('@/app/dashboard/model-garden/page'));
const SettingsPanel = lazy(() => import('@/app/dashboard/settings/page'));
const WorkstreamsPanel = lazy(() => import('@/app/dashboard/workstreams/page'));
const PlanPanel = lazy(() => import('@/app/dashboard/plan/page'));
const WorkbenchPanel = lazy(() => import('@/app/dashboard/lab/page'));
const ResearchPanel = lazy(() => import('@/app/dashboard/research/page'));

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type CircuitBoxTab =
  | 'services' | 'topology' | 'integrations' | 'social-channels' | 'security' | 'control-plane'
  | 'model-garden' | 'boomerangs' | 'live-events'
  | 'luc' | 'workbench' | 'workstreams' | 'plan'
  | 'settings' | 'research';

interface ServiceStatus {
  id: string;
  name: string;
  type: 'core' | 'agent' | 'tool' | 'external' | 'social';
  status: 'online' | 'offline' | 'degraded' | 'sandbox' | 'inactive';
  endpoint: string;
  version?: string;
  features?: string[];
  ownerOnly?: boolean;
}

interface Integration {
  id: string;
  name: string;
  provider: string;
  type: 'ai_model' | 'search' | 'voice' | 'storage' | 'payment' | 'automation' | 'social';
  status: 'active' | 'inactive' | 'error';
  apiKeySet: boolean;
  usageToday?: number;
  costToday?: number;
  ownerOnly?: boolean;
  byokAllowed?: boolean;
}

interface BoomerAngConfig {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'standby' | 'disabled';
  model: string;
  tasks: string[];
  permissions: string[];
  sandboxed: boolean;
}

interface LiveEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'warn' | 'error' | 'route' | 'security';
  source: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// Section definitions (owner vs user filtering)
// ─────────────────────────────────────────────────────────────

interface SectionGroup {
  label: string;
  tabs: { id: CircuitBoxTab; label: string; icon: string; ownerOnly?: boolean }[];
}

const OWNER_SECTIONS: SectionGroup[] = [
  {
    label: 'Operations',
    tabs: [
      { id: 'services', label: 'Services', icon: '⚡' },
      { id: 'topology', label: 'Topology', icon: '🗺' },
      { id: 'integrations', label: 'Integrations', icon: '🔗' },
      { id: 'social-channels', label: 'Social Channels', icon: '💬' },
      { id: 'security', label: 'Security', icon: '🛡' },
      { id: 'control-plane', label: 'Control Plane', icon: '🎛', ownerOnly: true },
      { id: 'live-events', label: 'Live Events', icon: '📡', ownerOnly: true },
    ],
  },
  {
    label: 'Intelligence',
    tabs: [
      { id: 'model-garden', label: 'Model Garden', icon: '🌱' },
      { id: 'boomerangs', label: 'Boomer_Angs', icon: '🤖' },
    ],
  },
  {
    label: 'Workspace',
    tabs: [
      { id: 'luc', label: 'LUC', icon: '📊' },
      { id: 'workbench', label: 'Workbench', icon: '🔬' },
      { id: 'workstreams', label: 'Workstreams', icon: '📋' },
      { id: 'plan', label: 'Plan', icon: '🎯' },
    ],
  },
  {
    label: 'Configuration',
    tabs: [
      { id: 'settings', label: 'Settings', icon: '⚙' },
      { id: 'research', label: 'R&D Hub', icon: '🧪', ownerOnly: true },
    ],
  },
];

function getUserSections(): SectionGroup[] {
  return OWNER_SECTIONS.map(g => ({
    ...g,
    tabs: g.tabs.filter(t => !t.ownerOnly),
  })).filter(g => g.tabs.length > 0);
}

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG — no external deps)
// ─────────────────────────────────────────────────────────────

const CircuitIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" />
    <circle cx="8" cy="16" r="2" /><circle cx="16" cy="16" r="2" />
    <line x1="10" y1="8" x2="14" y2="8" /><line x1="8" y1="10" x2="8" y2="14" />
    <line x1="16" y1="10" x2="16" y2="14" /><line x1="10" y1="16" x2="14" y2="16" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="9 12 12 15 16 10" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const PowerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const BotIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const SliderIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ToggleOnIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 20" fill="none">
    <rect x="0.5" y="0.5" width="35" height="19" rx="9.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeOpacity="0.4" />
    <circle cx="26" cy="10" r="7" fill="currentColor" />
  </svg>
);

const ToggleOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 20" fill="none">
    <rect x="0.5" y="0.5" width="35" height="19" rx="9.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" />
    <circle cx="10" cy="10" r="7" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Service data — fetched from circuit-metrics at runtime
// ─────────────────────────────────────────────────────────────

const DEFAULT_SERVICES: ServiceStatus[] = [
  { id: 'frontend', name: 'Frontend', type: 'core', status: 'offline', endpoint: 'https://plugmein.cloud', features: ['Dashboard', 'LUC', 'Model Garden'] },
  { id: 'uef-gateway', name: 'UEF Gateway', type: 'core', status: 'offline', endpoint: 'http://uef-gateway:4000', features: ['ACP', 'UCP', 'Orchestration'], ownerOnly: true },
  { id: 'acheevy', name: 'ACHEEVY', type: 'core', status: 'offline', endpoint: 'http://acheevy:3003', features: ['Intent Analysis', 'Executive Control'] },
  { id: 'house-of-ang', name: 'House of Ang', type: 'core', status: 'offline', endpoint: 'http://house-of-ang:3002', features: ['Agent Registry', 'Routing'], ownerOnly: true },
  { id: 'agent-bridge', name: 'Agent Bridge', type: 'core', status: 'offline', endpoint: 'http://agent-bridge:3010', features: ['Security Gateway', 'Rate Limiting'], ownerOnly: true },
  { id: 'chickenhawk-core', name: 'Chickenhawk Core', type: 'core', status: 'offline', endpoint: 'http://chickenhawk-core:4001', features: ['Task Execution', 'SOP Enforcement'], ownerOnly: true },
  { id: 'n8n', name: 'n8n Automation', type: 'tool', status: 'offline', endpoint: 'http://n8n:5678', features: ['Workflows', 'Webhooks'], ownerOnly: true },
  { id: 'redis', name: 'Redis', type: 'tool', status: 'offline', endpoint: 'redis://redis:6379', features: ['Session Store', 'Cache'], ownerOnly: true },
  { id: 'ii-agent', name: 'II Agent', type: 'agent', status: 'offline', endpoint: 'http://ii-agent:8000', features: ['Research', 'Analysis'], ownerOnly: true },
];

/** Fetch real service health from circuit-metrics via our API proxy */
function useServiceHealth() {
  const [services, setServices] = useState<ServiceStatus[]>(DEFAULT_SERVICES);
  const [lastFetch, setLastFetch] = useState<string>('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/circuit-box/services', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.services && Array.isArray(data.services)) {
        const mapped: ServiceStatus[] = data.services.map((s: { name: string; type?: string; status: string; responseTime?: number }) => ({
          id: s.name,
          name: s.name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          type: (s.type || 'core') as ServiceStatus['type'],
          status: s.status === 'up' ? 'online' : s.status === 'degraded' ? 'degraded' : 'offline',
          endpoint: `internal (${s.responseTime || 0}ms)`,
          ownerOnly: s.type !== 'core' || ['house-of-ang', 'agent-bridge', 'chickenhawk-core'].includes(s.name),
        }));
        setServices(mapped);
        setLastFetch(data.timestamp || new Date().toISOString());
      }
    } catch {
      // Keep defaults on failure
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  return { services, lastFetch, refresh };
}

// For backward compat — initial static reference (overridden by hook in component)
const SERVICES = DEFAULT_SERVICES;

/** Map UEF Gateway API key IDs to display-friendly integration entries */
const KEY_TO_INTEGRATION: Record<string, { name: string; provider: string; type: Integration['type'] }> = {
  OPENROUTER_API_KEY: { name: 'OpenRouter', provider: 'OpenRouter', type: 'ai_model' },
  ANTHROPIC_API_KEY: { name: 'Anthropic (Claude)', provider: 'Anthropic', type: 'ai_model' },
  GEMINI_API_KEY: { name: 'Gemini', provider: 'Google', type: 'ai_model' },
  BRAVE_API_KEY: { name: 'Brave Search', provider: 'Brave', type: 'search' },
  ELEVENLABS_API_KEY: { name: 'ElevenLabs TTS', provider: 'ElevenLabs', type: 'voice' },
  DEEPGRAM_API_KEY: { name: 'Deepgram STT', provider: 'Deepgram', type: 'voice' },
  STRIPE_SECRET_KEY: { name: 'Stripe', provider: 'Stripe', type: 'payment' },
  STRIPE_PUBLISHABLE_KEY: { name: 'Stripe (Client)', provider: 'Stripe', type: 'payment' },
  STRIPE_WEBHOOK_SECRET: { name: 'Stripe Webhooks', provider: 'Stripe', type: 'payment' },
};

/** Fetch real integration & API key status from UEF Gateway */
function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/circuit-box/integrations', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        const mapped: Integration[] = [];

        // Map real API key statuses into integration entries
        if (data.keys && Array.isArray(data.keys)) {
          for (const key of data.keys as { id: string; configured: boolean }[]) {
            const meta = KEY_TO_INTEGRATION[key.id];
            if (!meta) continue; // skip internal keys like NEXTAUTH_SECRET
            mapped.push({
              id: key.id.toLowerCase(),
              name: meta.name,
              provider: meta.provider,
              type: meta.type,
              status: key.configured ? 'active' : 'inactive',
              apiKeySet: key.configured,
              ownerOnly: meta.type === 'payment',
              byokAllowed: ['voice', 'search'].includes(meta.type),
            });
          }
        }

        // Merge any additional integrations from registry
        if (data.integrations && Array.isArray(data.integrations)) {
          for (const integ of data.integrations as { id: string; name: string; provider?: string; category?: string; status?: string }[]) {
            if (!mapped.find(m => m.id === integ.id)) {
              mapped.push({
                id: integ.id,
                name: integ.name,
                provider: integ.provider || 'Unknown',
                type: (integ.category as Integration['type']) || 'automation',
                status: integ.status === 'active' ? 'active' : 'inactive',
                apiKeySet: integ.status === 'active',
              });
            }
          }
        }

        setIntegrations(mapped);
      } catch {
        // Gateway unreachable — show empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { integrations, loading };
}

/** Fetch real Boomer_Ang roster from House of Ang */
function useBoomerangs() {
  const [boomerangs, setBoomerangs] = useState<BoomerAngConfig[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/circuit-box/boomerangs', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.agents && Array.isArray(data.agents)) {
          setBoomerangs(data.agents.map((a: { id: string; name: string; description: string; capabilities: string[]; healthStatus: string }) => ({
            id: a.id,
            name: a.name,
            role: a.description,
            status: a.healthStatus === 'online' ? 'active' : a.healthStatus === 'degraded' ? 'standby' : 'disabled',
            model: 'auto',
            tasks: a.capabilities.slice(0, 3),
            permissions: ['read', 'execute'],
            sandboxed: true,
          })));
        }
      } catch {
        // No agents fetched — show empty state
      }
    })();
  }, []);

  return boomerangs;
}

const BOOMERANGS: BoomerAngConfig[] = [];

// ─────────────────────────────────────────────────────────────
// Live Events — real health-check derived events from circuit-metrics
// ─────────────────────────────────────────────────────────────

function useLiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([{
    id: 'init',
    timestamp: Date.now(),
    type: 'info',
    source: 'Circuit Box',
    message: 'Connecting to circuit-metrics...',
  }]);

  useEffect(() => {
    let mounted = true;
    let prevStatuses: Record<string, string> = {};

    const poll = async () => {
      try {
        const res = await fetch('/api/circuit-box/services', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted || !data.services) return;

        const newEvents: LiveEvent[] = [];

        for (const svc of data.services as { name: string; status: string; responseTime: number }[]) {
          const prev = prevStatuses[svc.name];
          if (prev && prev !== svc.status) {
            newEvents.push({
              id: `${svc.name}_${Date.now()}`,
              timestamp: Date.now(),
              type: svc.status === 'up' ? 'info' : svc.status === 'degraded' ? 'warn' : 'error',
              source: svc.name,
              message: svc.status === 'up'
                ? `Service recovered (${svc.responseTime}ms)`
                : svc.status === 'degraded'
                  ? `Service degraded (${svc.responseTime}ms)`
                  : 'Service went down',
            });
          } else if (!prev) {
            newEvents.push({
              id: `${svc.name}_init_${Date.now()}`,
              timestamp: Date.now(),
              type: svc.status === 'up' ? 'info' : 'warn',
              source: svc.name,
              message: svc.status === 'up' ? `Online (${svc.responseTime}ms)` : `Status: ${svc.status}`,
            });
          }
          prevStatuses[svc.name] = svc.status;
        }

        if (newEvents.length > 0) {
          setEvents(prev => [...newEvents, ...prev].slice(0, 100));
        }
      } catch {
        if (mounted) {
          setEvents(prev => [{
            id: `err_${Date.now()}`,
            timestamp: Date.now(),
            type: 'warn',
            source: 'Circuit Box',
            message: 'Circuit metrics unreachable',
          }, ...prev].slice(0, 100));
        }
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return events;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-cb-green shadow-cb-green/50',
    offline: 'bg-cb-red shadow-cb-red/50',
    degraded: 'bg-cb-amber shadow-cb-amber/50',
    sandbox: 'bg-cb-cyan shadow-cb-cyan/50',
    active: 'bg-cb-green shadow-cb-green/50',
    inactive: 'bg-cb-fog shadow-cb-fog/50',
    standby: 'bg-gold shadow-gold/50',
    disabled: 'bg-cb-red shadow-cb-red/50',
    error: 'bg-cb-red shadow-cb-red/50',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-[0_0_8px] transition-colors duration-cb-toggle ${colors[status] || colors.offline}`} />
  );
}

function ServiceLatencyBar({ latency }: { latency: number }) {
  const pct = Math.min((latency / 500) * 100, 100);
  const color = latency > 300 ? 'bg-cb-amber' : latency > 100 ? 'bg-gold' : 'bg-cb-green';
  return (
    <div className="w-full h-1 rounded-full bg-[#18181B] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

// Latencies are extracted from the real endpoint string (e.g. "internal (142ms)")
function extractLatency(endpoint: string): number {
  const match = endpoint.match(/\((\d+)ms\)/);
  return match ? parseInt(match[1], 10) : 0;
}

function ServiceCard({ service, isOwner }: { service: ServiceStatus; isOwner: boolean }) {
  if (!isOwner && service.ownerOnly) return null;

  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    core: { bg: 'bg-gold/10', border: 'border-gold/30', text: 'text-gold' },
    agent: { bg: 'bg-cb-cyan/10', border: 'border-cb-cyan/30', text: 'text-cb-cyan' },
    tool: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    external: { bg: 'bg-cb-green/10', border: 'border-cb-green/30', text: 'text-cb-green' },
    social: { bg: 'bg-cb-cyan/10', border: 'border-cb-cyan/30', text: 'text-cb-cyan' },
  };
  const s = typeColors[service.type] || typeColors.core;
  const latency = extractLatency(service.endpoint);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`p-cb-sm rounded-xl border ${s.border} ${s.bg} hover:ring-2 hover:ring-slate-200 transition-all duration-cb-panel cursor-default`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={service.status} />
          <h3 className="text-sm font-semibold text-zinc-100">{service.name}</h3>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${s.bg} ${s.text}`}>{service.type.toUpperCase()}</span>
      </div>
      {isOwner && (
        <div className="text-xs text-cb-fog mb-2 font-mono truncate">{service.endpoint}</div>
      )}
      {service.features && (
        <div className="flex flex-wrap gap-1 mb-2">
          {service.features.map((f) => (
            <span key={f} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1F1F23]/60 text-gray-300">{f}</span>
          ))}
        </div>
      )}
      {/* Latency bar */}
      {service.status !== 'inactive' && latency > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-cb-fog">Latency</span>
            <span className={`text-[10px] font-mono font-semibold ${latency > 300 ? 'text-cb-amber' : latency > 100 ? 'text-gold' : 'text-cb-green'}`}>{latency}ms</span>
          </div>
          <ServiceLatencyBar latency={latency} />
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-cb-fog pt-2 border-t border-wireframe-stroke">
        <span>v{service.version}</span>
        <span className="capitalize font-medium">{service.status}</span>
      </div>
    </motion.div>
  );
}

function IntegrationRow({ integration, isOwner }: { integration: Integration; isOwner: boolean }) {
  if (!isOwner && integration.ownerOnly) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]/80 border border-wireframe-stroke hover:border-white/10 transition-all duration-cb-toggle h-cb-row">
      <div className="flex items-center gap-3 min-w-0">
        <StatusDot status={integration.status} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-100 truncate">{integration.name}</div>
          <div className="text-xs text-cb-fog">{integration.provider}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {integration.apiKeySet ? (
            <span className="flex items-center gap-1 text-xs text-cb-green"><LockIcon className="w-3.5 h-3.5" />Set</span>
          ) : integration.byokAllowed ? (
            <button type="button" className="text-xs text-cb-amber hover:text-gold transition-colors font-medium">+ Add Key</button>
          ) : (
            <span className="text-xs text-cb-red font-medium">No Key</span>
          )}
          <button type="button" className="p-1 rounded-lg hover:bg-white/8 transition-colors duration-cb-toggle">
            <SettingsIcon className="w-3.5 h-3.5 text-cb-fog" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BoomerAngCard({ ang }: { ang: BoomerAngConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-cb-sm rounded-xl bg-[#F8FAFC]/80 border border-wireframe-stroke hover:border-gold/20 transition-all duration-cb-panel"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-gold/20 bg-gold/10 flex items-center justify-center">
            <Image src="/images/acheevy/acheevy-helmet.png" alt={ang.name} width={20} height={20} className="w-5 h-5 object-cover" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-100">{ang.name}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={ang.status} />
          <span className="text-xs text-cb-fog capitalize font-medium">{ang.status}</span>
        </div>
      </div>
      <div className="text-xs text-cb-fog mb-1">{ang.role}</div>
      <div className="text-[10px] text-gold mb-2 font-mono">Model: {ang.model}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {ang.tasks.map((task) => (
          <span key={task} className="px-2 py-0.5 rounded text-[10px] bg-gold/10 text-gold font-medium">{task}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-wireframe-stroke">
        <div className="flex items-center gap-1">
          {ang.sandboxed && <span className="flex items-center gap-1 text-[10px] text-cb-cyan"><ShieldIcon className="w-3.5 h-3.5" />Sandboxed</span>}
        </div>
        <div className="flex gap-1.5">
          <button type="button" className="p-1.5 rounded-lg bg-[#18181B] hover:bg-white/8 transition-colors duration-cb-toggle"><SettingsIcon className="w-3.5 h-3.5 text-cb-fog" /></button>
          <button type="button" className="p-1.5 rounded-lg bg-[#18181B] hover:bg-white/8 transition-colors duration-cb-toggle"><PowerIcon className="w-3.5 h-3.5 text-cb-fog" /></button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Social Channels Panel
// ─────────────────────────────────────────────────────────────

/** Setup instructions per channel (static — these are real) */
const CHANNEL_SETUP: Record<string, { steps: string[]; commands: string[] }> = {
  telegram: {
    steps: ['Open Telegram and search for your AIMS bot', 'Send /start to begin', 'Copy the link code provided', 'Paste it in the field below'],
    commands: ['/start — Begin setup', '/help — Show commands', '/disconnect — Unlink account'],
  },
  discord: {
    steps: ['Invite the AIMS bot to your Discord server', 'In any channel, type !link', 'Copy the link code provided', 'Paste it in the field below'],
    commands: ['!link — Begin setup', '!help — Show commands', '!disconnect — Unlink'],
  },
  whatsapp: {
    steps: ['Add the AIMS WhatsApp number to your contacts', 'Send "link" as your first message', 'Copy the link code provided', 'Paste it in the field below'],
    commands: ['Send "link" — Begin setup', 'Send "help" — Show commands', 'Send "disconnect" — Unlink'],
  },
};

function SocialChannelsPanel({ isOwner }: { isOwner: boolean }) {
  const [channels, setChannels] = useState<Array<{ id: string; name: string; icon: string; configured: boolean; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/circuit-box/social', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.channels) setChannels(data.channels);
      } catch {
        // API unreachable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusBadge = (status: string) => {
    if (status === 'configured') return { label: 'BOT TOKEN SET', cls: 'bg-cb-green/10 text-cb-green border-cb-green/30' };
    if (status === 'unreachable') return { label: 'UNREACHABLE', cls: 'bg-cb-red/10 text-cb-red border-cb-red/30' };
    return { label: 'TOKEN MISSING', cls: 'bg-cb-fog/10 text-cb-fog border-cb-fog/30' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">💬</span>
        <div>
          <h2 className="text-lg font-bold text-gold">Social Channels</h2>
          <p className="text-xs text-cb-fog">Connect messaging platforms to chat with ACHEEVY anywhere</p>
        </div>
      </div>

      {isOwner && (
        <div className="p-3 rounded-xl border border-gold/20 bg-gold/5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldIcon className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold text-gold uppercase tracking-wider">Channel Status</span>
          </div>
          <p className="text-xs text-cb-fog mb-3">Real-time status of social channel bot tokens and webhook endpoints.</p>
          <div className="grid grid-cols-3 gap-2">
            {channels.map(ch => {
              const badge = statusBadge(ch.status);
              return (
                <div key={ch.id} className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC]/80 border border-wireframe-stroke">
                  <span className="text-xs text-zinc-100">{ch.icon} {ch.name}</span>
                  {ch.configured
                    ? <CheckCircleIcon className="w-4 h-4 text-cb-green" />
                    : <AlertIcon className="w-4 h-4 text-cb-fog" />
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          <span className="text-xs text-zinc-500">Checking channel status...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {channels.map(ch => {
            const badge = statusBadge(ch.status);
            const setup = CHANNEL_SETUP[ch.id];

            return (
              <div key={ch.id} className="p-cb-sm rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ch.icon}</span>
                    <h3 className="text-sm font-semibold text-zinc-100">{ch.name}</h3>
                  </div>
                  <span className={`h-cb-chip flex items-center px-2.5 rounded-lg text-[10px] font-bold tracking-wider border ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <>
                    {/* Setup steps */}
                    {setup?.steps && setup.steps.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Setup</h4>
                        <ol className="space-y-1">
                          {setup.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-cb-fog">
                              <span className="text-gold font-mono mt-0.5">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Link code input — only if bot token is configured */}
                    {ch.configured && (
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Paste link code"
                          className="flex-1 px-3 py-2 rounded-lg bg-[#1F1F23]/60 border border-wireframe-stroke text-zinc-100 text-xs font-mono placeholder:text-cb-fog/50 outline-none focus:border-gold/50 transition-colors duration-cb-toggle"
                        />
                        <button type="button" className="px-3 py-2 rounded-lg bg-gold/10 text-gold text-xs font-bold border border-gold/30 hover:bg-gold/20 transition-colors duration-cb-toggle">
                          Link
                        </button>
                      </div>
                    )}

                    {!ch.configured && (
                      <div className="p-2 rounded-lg bg-cb-amber/5 border border-cb-amber/20 mb-3">
                        <p className="text-[10px] text-cb-amber">Bot token not set in environment. Set <code className="font-mono">{ch.id === 'whatsapp' ? 'WHATSAPP_API_TOKEN' : `${ch.id.toUpperCase()}_BOT_TOKEN`}</code> to enable.</p>
                      </div>
                    )}

                    {/* Commands */}
                    {setup?.commands && setup.commands.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Commands</h4>
                        <div className="space-y-0.5">
                          {setup.commands.map((cmd, i) => (
                            <div key={i} className="text-[10px] text-cb-fog font-mono">{cmd}</div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Control Plane Panel (OWNER ONLY)
// ─────────────────────────────────────────────────────────────

function ControlPlanePanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <SliderIcon className="w-5 h-5 text-gold" />
        <div>
          <h2 className="text-lg font-bold text-gold">Control Plane</h2>
          <p className="text-xs text-cb-fog">Master breaker toggles and system policy levers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Autonomy Mode */}
        <div className="p-cb-sm rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BotIcon className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-semibold text-zinc-100">Autonomy Mode</h3>
            </div>
            <span className="h-cb-chip flex items-center px-2.5 rounded-lg text-[10px] font-bold tracking-wider bg-gold/15 text-gold border border-gold/30">
              SUPERVISED
            </span>
          </div>
          <p className="text-xs text-cb-fog mb-3">
            Controls whether ACHEEVY can auto-execute or requires approval for each step.
          </p>
          <div className="flex items-center gap-2 cursor-not-allowed opacity-80">
            <ToggleOffIcon className="w-9 h-5 text-gold" />
            <span className="text-[10px] text-cb-fog uppercase tracking-wider">Auto-execute OFF</span>
          </div>
        </div>

        {/* 2. Sandbox Required */}
        <div className="p-cb-sm rounded-xl border border-cb-green/30 bg-cb-green/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-cb-green" />
              <h3 className="text-sm font-semibold text-zinc-100">Sandbox Required</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <LockIcon className="w-3.5 h-3.5 text-cb-green" />
              <span className="h-cb-chip flex items-center px-2 rounded-lg text-[10px] font-bold tracking-wider bg-cb-green/15 text-cb-green border border-cb-green/30">
                LOCKED ON
              </span>
            </div>
          </div>
          <p className="text-xs text-cb-fog mb-3">
            All agent execution runs in sandboxed containers. This cannot be disabled.
          </p>
          <div className="flex items-center gap-2 cursor-not-allowed">
            <ToggleOnIcon className="w-9 h-5 text-cb-green" />
            <span className="text-[10px] text-cb-green/70 uppercase tracking-wider">Always On</span>
            <LockIcon className="w-3 h-3 text-cb-green/50" />
          </div>
        </div>

        {/* 3. Kill Switch — MASTER BREAKER */}
        <div className="p-cb-sm rounded-xl border border-cb-red/30 bg-cb-red/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PowerIcon className="w-4 h-4 text-cb-red" />
              <h3 className="text-sm font-semibold text-zinc-100">Kill Switch</h3>
            </div>
            <span className="h-cb-chip flex items-center px-2.5 rounded-lg text-[10px] font-bold tracking-wider bg-cb-red/15 text-cb-red border border-cb-red/30 animate-cb-breathe">
              ARMED
            </span>
          </div>
          <p className="text-xs text-cb-fog mb-3">
            Emergency halt for all active agent operations. Owner-only master control.
          </p>
          <div className="flex items-center justify-center">
            <div className="relative cursor-pointer group">
              <div className="w-16 h-16 rounded-full border-2 border-cb-red/40 bg-cb-red/10 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)] group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-shadow duration-cb-panel">
                <PowerIcon className="w-7 h-7 text-cb-red" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-cb-red animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>
          </div>
        </div>

        {/* 4. Tool Permissions */}
        <div className="p-cb-sm rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-4 h-4 text-cb-fog" />
            <h3 className="text-sm font-semibold text-zinc-100">Tool Permissions</h3>
          </div>
          <p className="text-xs text-cb-fog mb-3">
            External tool access status and API key health.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'firecrawl', status: 'warn', label: 'WARN — no key' },
              { name: 'serper', status: 'active', label: 'active' },
              { name: 'tavily', status: 'active', label: 'active' },
              { name: 'brave', status: 'active', label: 'active' },
            ].map(tool => (
              <div key={tool.name} className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                tool.status === 'warn'
                  ? 'bg-cb-amber/5 border-cb-amber/20'
                  : 'bg-cb-green/5 border-cb-green/20'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full shadow-[0_0_6px] ${
                  tool.status === 'warn' ? 'bg-cb-amber shadow-cb-amber/50' : 'bg-cb-green shadow-cb-green/50'
                }`} />
                <div>
                  <div className="text-xs font-medium text-zinc-100">{tool.name}</div>
                  <div className={`text-[10px] font-mono ${tool.status === 'warn' ? 'text-cb-amber' : 'text-cb-green'}`}>{tool.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Budget Cap */}
        <div className="p-cb-sm rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CircuitIcon className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-semibold text-zinc-100">Budget Cap</h3>
            </div>
            <span className="text-sm font-mono font-bold text-gold">$50.00 / day</span>
          </div>
          <p className="text-xs text-cb-fog mb-3">
            Daily spend ceiling across all model providers and tool calls.
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-cb-fog">Spent today</span>
              <span className="text-gold font-mono">$6.00 (12%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#18181B]/60 border border-wireframe-stroke overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '12%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
              />
            </div>
          </div>
        </div>

        {/* 6. Persona Mode */}
        <div className="p-cb-sm rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
          <div className="flex items-center gap-2 mb-2">
            <AlertIcon className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-zinc-100">Persona Mode</h3>
          </div>
          <p className="text-xs text-cb-fog mb-3">
            Controls ACHEEVY&apos;s communication style.
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="h-cb-chip px-3 rounded-lg text-xs font-bold tracking-wider bg-gold/15 text-gold border border-gold/30">SMOOTH</button>
            <button type="button" className="h-cb-chip px-3 rounded-lg text-xs font-medium tracking-wider bg-[#F8FAFC] text-cb-fog border border-wireframe-stroke hover:text-zinc-100 transition-colors duration-cb-toggle">CORPORATE</button>
          </div>
        </div>
      </div>

      {/* Chicken Hawk Status — full width */}
      <div className="p-cb-sm rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <RefreshIcon className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-zinc-100">Chicken Hawk Status</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cb-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cb-cyan" />
            </span>
            <span className="text-[10px] text-cb-cyan font-mono uppercase tracking-wider">polling</span>
          </div>
        </div>
        <p className="text-xs text-cb-fog mb-3">
          Live status from the Chicken Hawk execution engine.
        </p>
        <div className="p-3 rounded-lg bg-[#18181B]/60 border border-wireframe-stroke font-mono text-xs text-gray-300">
          <span className="text-cb-cyan">chicken-hawk-core</span>: polling...
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Topology Chart Tooltip
// ─────────────────────────────────────────────────────────────

function TopoTooltip({ active, payload, label, unit = '' }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-wireframe-stroke bg-[#111113]/95 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-zinc-500 mb-1 font-mono">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{unit}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Topology Panel — Service Dependency Map + Telemetry
// ─────────────────────────────────────────────────────────────

interface TopologyNode {
  id: string;
  label: string;
  category: 'core' | 'agent' | 'data' | 'external' | 'social';
  status: 'online' | 'degraded' | 'offline';
  x: number;
  y: number;
  latency: number;
  rpm: number;
}

interface TopologyEdge {
  from: string;
  to: string;
  label: string;
  active: boolean;
}

/**
 * Topology data derived from circuit-metrics.
 * Node layout positions are fixed (architectural truth).
 * Status and latency are fetched live.
 */

// Static layout — these positions reflect the real architecture
const TOPOLOGY_LAYOUT: Record<string, { label: string; category: TopologyNode['category']; x: number; y: number }> = {
  nginx:            { label: 'Nginx',         category: 'core',     x: 50, y: 8 },
  frontend:         { label: 'Frontend',      category: 'core',     x: 20, y: 28 },
  'uef-gateway':    { label: 'UEF Gateway',   category: 'core',     x: 50, y: 28 },
  acheevy:          { label: 'ACHEEVY',       category: 'core',     x: 50, y: 50 },
  'house-of-ang':   { label: 'House of Ang',  category: 'agent',    x: 80, y: 50 },
  'agent-bridge':   { label: 'Agent Bridge',  category: 'agent',    x: 80, y: 28 },
  redis:            { label: 'Redis',         category: 'data',     x: 20, y: 50 },
  n8n:              { label: 'n8n',           category: 'external',  x: 20, y: 72 },
  'circuit-metrics':{ label: 'Metrics',       category: 'data',     x: 80, y: 72 },
  'ii-agent':       { label: 'II Agent',      category: 'agent',    x: 50, y: 72 },
  'chickenhawk-core':{ label: 'Chicken Hawk', category: 'core',     x: 20, y: 92 },
};

// Edges reflect real architectural connections (from docker-compose network)
const TOPOLOGY_EDGES: TopologyEdge[] = [
  { from: 'nginx', to: 'frontend', label: 'static', active: true },
  { from: 'nginx', to: 'uef-gateway', label: 'API', active: true },
  { from: 'uef-gateway', to: 'acheevy', label: 'orchestrate', active: true },
  { from: 'uef-gateway', to: 'agent-bridge', label: 'secure', active: true },
  { from: 'acheevy', to: 'house-of-ang', label: 'dispatch', active: true },
  { from: 'acheevy', to: 'redis', label: 'cache', active: true },
  { from: 'agent-bridge', to: 'house-of-ang', label: 'route', active: true },
  { from: 'acheevy', to: 'n8n', label: 'workflow', active: true },
  { from: 'house-of-ang', to: 'circuit-metrics', label: 'telemetry', active: true },
  { from: 'uef-gateway', to: 'circuit-metrics', label: 'metrics', active: true },
  { from: 'acheevy', to: 'ii-agent', label: 'research', active: true },
  { from: 'acheevy', to: 'chickenhawk-core', label: 'tasks', active: true },
];

/** Fetch live topology node data from circuit-metrics */
function useTopologyNodes() {
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; gateway: number; acheevy: number; agents: number }>>([]);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/circuit-box/services', { cache: 'no-store' });
        if (!res.ok || !mounted) return;
        const data = await res.json();
        if (!data.services || !Array.isArray(data.services)) return;

        const svcMap = new Map<string, { status: string; responseTime: number }>();
        for (const svc of data.services as { name: string; status: string; responseTime: number }[]) {
          svcMap.set(svc.name, { status: svc.status, responseTime: svc.responseTime });
        }

        // Build topology nodes from live data + static layout
        const liveNodes: TopologyNode[] = [];
        for (const [id, layout] of Object.entries(TOPOLOGY_LAYOUT)) {
          const live = svcMap.get(id);
          liveNodes.push({
            id,
            label: layout.label,
            category: layout.category,
            status: live ? (live.status === 'up' ? 'online' : live.status === 'degraded' ? 'degraded' : 'offline') : 'offline',
            x: layout.x,
            y: layout.y,
            latency: live?.responseTime ?? 0,
            rpm: 0, // we don't have real RPM data — so we show 0 instead of faking it
          });
        }
        setNodes(liveNodes);

        // Build latency history point
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const gwLatency = svcMap.get('uef-gateway')?.responseTime ?? 0;
        const acheevyLatency = svcMap.get('acheevy')?.responseTime ?? 0;
        const agentAvg = (['house-of-ang', 'agent-bridge', 'ii-agent']
          .map(id => svcMap.get(id)?.responseTime ?? 0)
          .reduce((a, b) => a + b, 0)) / 3;
        setLatencyHistory(prev => [...prev.slice(-29), { time, gateway: gwLatency, acheevy: acheevyLatency, agents: Math.round(agentAvg) }]);
      } catch {
        // keep existing data on error
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return { nodes, latencyHistory };
}

function TopologyPanel() {
  const { nodes: TOPOLOGY_NODES, latencyHistory: latencyData } = useTopologyNodes();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const categoryColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    core: { bg: 'bg-gold/15', border: 'border-gold/40', text: 'text-gold', glow: 'shadow-[0_0_12px_rgba(212,175,55,0.2)]' },
    agent: { bg: 'bg-cb-cyan/15', border: 'border-cb-cyan/40', text: 'text-cb-cyan', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.2)]' },
    data: { bg: 'bg-purple-400/15', border: 'border-purple-400/40', text: 'text-purple-400', glow: 'shadow-[0_0_12px_rgba(192,132,252,0.2)]' },
    external: { bg: 'bg-cb-amber/15', border: 'border-cb-amber/40', text: 'text-cb-amber', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
    social: { bg: 'bg-cb-cyan/15', border: 'border-cb-cyan/40', text: 'text-cb-cyan', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.2)]' },
  };

  return (
    <div className="space-y-4">
      {/* Category legend */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs text-cb-fog">Category:</span>
        {[
          { cat: 'core', label: 'Core', color: '#D4AF37' },
          { cat: 'agent', label: 'Agents', color: '#22D3EE' },
          { cat: 'data', label: 'Data', color: '#C084FC' },
          { cat: 'external', label: 'External', color: '#F59E0B' },
        ].map(c => (
          <span key={c.cat} className="flex items-center gap-1.5 text-[10px]" style={{ color: c.color }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
          </span>
        ))}
      </div>

      {/* Topology Map */}
      <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-xl relative overflow-hidden" style={{ minHeight: '380px' }}>
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '380px' }}>
          {TOPOLOGY_EDGES.map((edge) => {
            const fromNode = TOPOLOGY_NODES.find(n => n.id === edge.from);
            const toNode = TOPOLOGY_NODES.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const x1 = `${fromNode.x}%`;
            const y1 = `${fromNode.y}%`;
            const x2 = `${toNode.x}%`;
            const y2 = `${toNode.y}%`;
            const isHighlighted = selectedNode === edge.from || selectedNode === edge.to;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isHighlighted ? '#D4AF37' : edge.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={edge.active ? '' : '4 4'}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {TOPOLOGY_NODES.map((node) => {
          const c = categoryColors[node.category];
          const isSelected = selectedNode === node.id;
          const statusDot = node.status === 'online' ? 'bg-cb-green' : node.status === 'degraded' ? 'bg-cb-amber animate-pulse' : 'bg-cb-red';
          return (
            <motion.div
              key={node.id}
              className={`absolute cursor-pointer transition-all duration-200 ${isSelected ? 'z-20' : 'z-10'}`}
              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => setSelectedNode(isSelected ? null : node.id)}
              whileHover={{ scale: 1.1 }}
            >
              <div className={`rounded-xl ${c.bg} border ${c.border} px-3 py-2 ${isSelected ? c.glow : ''} transition-shadow`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusDot}`} />
                  <span className={`text-xs font-semibold ${c.text}`}>{node.label}</span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 pt-2 border-t border-wireframe-stroke space-y-0.5"
                  >
                    <div className="text-[10px] text-cb-fog">Latency: <span className={`font-mono font-bold ${node.latency > 200 ? 'text-cb-amber' : c.text}`}>{node.latency > 0 ? `${node.latency}ms` : '—'}</span></div>
                    <div className="text-[10px] text-cb-fog">Status: <span className={`font-mono font-bold capitalize ${node.status === 'online' ? 'text-cb-green' : node.status === 'degraded' ? 'text-cb-amber' : 'text-cb-red'}`}>{node.status}</span></div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency by service tier */}
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <span className="text-gold">⚡</span> Service Latency (ms)
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-gold"><span className="h-1.5 w-1.5 rounded-full bg-gold" />Gateway</span>
            <span className="flex items-center gap-1 text-[10px] text-cb-cyan"><span className="h-1.5 w-1.5 rounded-full bg-cb-cyan" />ACHEEVY</span>
            <span className="flex items-center gap-1 text-[10px] text-purple-400"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" />Agents</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={latencyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGateway" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAcheevy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAgents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#C084FC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} tickLine={false} axisLine={false} width={30} />
              <Tooltip content={<TopoTooltip unit="ms" />} />
              <Area type="monotone" dataKey="gateway" name="Gateway" stroke="#D4AF37" strokeWidth={1.5} fill="url(#gradGateway)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="acheevy" name="ACHEEVY" stroke="#22D3EE" strokeWidth={1.5} fill="url(#gradAcheevy)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="agents" name="Agents" stroke="#C084FC" strokeWidth={1.5} fill="url(#gradAgents)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Throughput — no real RPM data available yet */}
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <span className="text-cb-cyan">📡</span> Throughput (req/min)
          </h3>
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Throughput monitoring not yet instrumented</p>
              <p className="text-[10px] text-zinc-600">Requires request-level logging in UEF Gateway</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Live Events Panel (OWNER ONLY)
// ─────────────────────────────────────────────────────────────

function LiveEventsPanel({ events }: { events: LiveEvent[] }) {
  const typeStyles: Record<LiveEvent['type'], { dot: string; text: string }> = {
    info: { dot: 'bg-cb-cyan', text: 'text-cb-cyan' },
    route: { dot: 'bg-gold', text: 'text-gold' },
    warn: { dot: 'bg-cb-amber', text: 'text-cb-amber' },
    error: { dot: 'bg-cb-red', text: 'text-cb-red' },
    security: { dot: 'bg-cb-red', text: 'text-cb-red' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">📡</span>
        <div>
          <h2 className="text-lg font-bold text-cb-cyan">Live Events</h2>
          <p className="text-xs text-cb-fog">Real-time system events and audit trail</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cb-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cb-cyan" />
          </span>
          <span className="text-[10px] text-cb-cyan font-mono uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Scanline overlay */}
      <div className="relative rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="w-full h-8 bg-gradient-to-b from-cb-cyan/20 to-transparent animate-cb-scan" />
        </div>

        <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
          {events.map((evt, i) => {
            const style = typeStyles[evt.type];
            const time = new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false });
            return (
              <motion.div
                key={evt.id}
                initial={i === 0 ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-3 px-4 py-2.5 border-b border-wireframe-stroke/50 hover:bg-[#111113] transition-colors"
              >
                <span className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot} shadow-[0_0_6px] ${style.dot}/50`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-cb-fog font-mono">{time}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>{evt.type}</span>
                  </div>
                  <div className="text-xs text-zinc-100">
                    <span className="text-gold font-medium">{evt.source}</span>
                    <span className="text-cb-fog mx-1.5">—</span>
                    <span className="text-gray-300">{evt.message}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Security Panel
// ─────────────────────────────────────────────────────────────

function SecurityPanel({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="space-y-5">
      <div className="p-5 rounded-xl border border-cb-green/30 bg-cb-green/5">
        <div className="flex items-center gap-3 mb-3">
          <ShieldIcon className="w-7 h-7 text-cb-green" />
          <div>
            <h3 className="text-lg font-bold text-cb-green">Security Status: PROTECTED</h3>
            <p className="text-xs text-cb-fog">All security measures are active</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Agent Sandbox', value: 'Enabled' },
            { label: 'Payment Isolation', value: 'Enforced' },
            { label: 'Rate Limiting', value: '100 req/min' },
            { label: 'Network Isolation', value: 'Active' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-[#F8FAFC]/80">
              <CheckCircleIcon className="w-4 h-4 text-cb-green mb-1.5" />
              <div className="text-xs text-zinc-100">{item.label}</div>
              <div className="text-[10px] text-cb-fog">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="p-5 rounded-xl border border-wireframe-stroke bg-[#F8FAFC]/80">
          <h3 className="text-sm font-medium text-zinc-100 mb-3">Security Rules</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-cb-red/10 border border-cb-red/30">
              <h4 className="text-xs font-medium text-cb-red mb-1.5">BLOCKED Operations</h4>
              <div className="flex flex-wrap gap-1.5">
                {['payment', 'transfer', 'purchase', 'checkout', 'credit_card', 'stripe', 'bank', 'invoice'].map((op) => (
                  <span key={op} className="px-2 py-0.5 rounded text-[10px] bg-cb-red/20 text-red-300">{op}</span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-cb-green/10 border border-cb-green/30">
              <h4 className="text-xs font-medium text-cb-green mb-1.5">ALLOWED Operations</h4>
              <div className="flex flex-wrap gap-1.5">
                {['search', 'analyze', 'summarize', 'generate', 'read', 'write', 'code'].map((op) => (
                  <span key={op} className="px-2 py-0.5 rounded text-[10px] bg-cb-green/20 text-green-300">{op}</span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-cb-cyan/10 border border-cb-cyan/30">
              <h4 className="text-xs font-medium text-cb-cyan mb-1.5">Payment Access (ACHEEVY ONLY)</h4>
              <p className="text-xs text-cb-fog">Only ACHEEVY has access to payment credentials. Boomer_Angs scout and recommend — NEVER execute payments.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PanelLoader
// ─────────────────────────────────────────────────────────────

function PanelLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Circuit Box Component
// ─────────────────────────────────────────────────────────────

function CircuitBoxContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as CircuitBoxTab) || 'services';
  const [activeTab, setActiveTab] = useState<CircuitBoxTab>(initialTab);
  const [refreshing, setRefreshing] = useState(false);
  const liveEvents = useLiveEvents();
  const { services: liveServices, refresh: refreshServices } = useServiceHealth();
  const liveBoomerangs = useBoomerangs();
  const { integrations: liveIntegrations } = useIntegrations();

  // Determine role
  const userRole = (session?.user as Record<string, unknown> | undefined)?.role;
  const isOwner = userRole === 'OWNER';
  const sections = isOwner ? OWNER_SECTIONS : getUserSections();

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as CircuitBoxTab;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Policy polling for Control Plane
  useEffect(() => {
    if (activeTab !== 'control-plane' || !isOwner) return;
    const controller = new AbortController();
    const poll = async () => {
      try {
        const res = await fetch('/api/circuit-box/policy', { signal: controller.signal });
        const data = await res.json();
        console.log('[ControlPlane] policy poll:', data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.debug('[ControlPlane] policy poll failed (stub):', err);
      }
    };
    poll();
    const intervalId = setInterval(poll, 2000);
    return () => { controller.abort(); clearInterval(intervalId); };
  }, [activeTab, isOwner]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshServices();
    setRefreshing(false);
  }, [refreshServices]);

  const activeServices = liveServices.length > 0 ? liveServices : SERVICES;
  const activeBoomerangs = liveBoomerangs.length > 0 ? liveBoomerangs : BOOMERANGS;
  const visibleServices = isOwner ? activeServices : activeServices.filter(s => !s.ownerOnly);
  const onlineServices = visibleServices.filter((s) => s.status === 'online' || s.status === 'sandbox').length;
  const visibleIntegrations = isOwner ? liveIntegrations : liveIntegrations.filter(i => !i.ownerOnly);
  const activeIntegrations = visibleIntegrations.filter((i) => i.status === 'active').length;
  const activeAngs = activeBoomerangs.filter((a) => a.status === 'active').length;

  return (
    <div className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <CircuitBoardPattern density="sparse" animated={false} glowIntensity={0.1} />

      {/* Ambient logo watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0" aria-hidden="true">
        <div className="w-[400px] h-[400px] opacity-[0.02] bg-contain bg-no-repeat bg-center" style={{ backgroundImage: "url('/images/acheevy/acheevy-helmet.png')" }} />
      </div>

      <div className="relative z-10">
        {/* ── Header ── */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`, boxShadow: `0 0 24px ${AIMS_CIRCUIT_COLORS.glow}` }}>
                <CircuitIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gold">Circuit Box</h1>
                <p className="text-cb-fog text-sm">
                  {isOwner ? 'Central Command Hub — Owner View' : 'Your Service Console'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <span className="h-cb-chip flex items-center px-2.5 rounded-lg text-[10px] font-bold tracking-wider bg-gold/15 text-gold border border-gold/30">
                  OWNER
                </span>
              )}
              <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-wireframe-stroke bg-[#111113] hover:bg-white/5 transition-colors duration-cb-toggle">
                <RefreshIcon className={`w-4 h-4 text-cb-fog ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs text-gray-300 hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <button type="button" onClick={() => setActiveTab('services')} className={`p-3 rounded-xl border transition-all duration-cb-panel text-left ${activeTab === 'services' ? 'border-cb-green/30 bg-cb-green/5' : 'border-wireframe-stroke bg-[#111113] hover:border-cb-green/20'}`}>
              <div className="text-2xl font-bold text-cb-green">{onlineServices}/{visibleServices.length}</div>
              <div className="text-[10px] text-cb-fog mt-0.5 uppercase tracking-wider">Services Online</div>
            </button>
            <button type="button" onClick={() => setActiveTab('integrations')} className={`p-3 rounded-xl border transition-all duration-cb-panel text-left ${activeTab === 'integrations' ? 'border-gold/30 bg-gold/5' : 'border-wireframe-stroke bg-[#111113] hover:border-gold/20'}`}>
              <div className="text-2xl font-bold text-gold">{activeIntegrations}</div>
              <div className="text-[10px] text-cb-fog mt-0.5 uppercase tracking-wider">Integrations</div>
            </button>
            <button type="button" onClick={() => setActiveTab('boomerangs')} className={`p-3 rounded-xl border transition-all duration-cb-panel text-left ${activeTab === 'boomerangs' ? 'border-cb-cyan/30 bg-cb-cyan/5' : 'border-wireframe-stroke bg-[#111113] hover:border-cb-cyan/20'}`}>
              <div className="text-2xl font-bold text-cb-cyan">{activeAngs}</div>
              <div className="text-[10px] text-cb-fog mt-0.5 uppercase tracking-wider">Boomer_Angs</div>
            </button>
            <button type="button" onClick={() => setActiveTab('security')} className={`p-3 rounded-xl border transition-all duration-cb-panel text-left ${activeTab === 'security' ? 'border-cb-green/30 bg-cb-green/5' : 'border-wireframe-stroke bg-[#111113] hover:border-cb-green/20'}`}>
              <div className="flex items-center gap-1.5">
                <ShieldIcon className="w-5 h-5 text-cb-green" />
                <span className="text-lg font-bold text-cb-green">SECURE</span>
              </div>
              <div className="text-[10px] text-cb-fog mt-0.5 uppercase tracking-wider">Payment Isolation</div>
            </button>
          </div>
        </header>

        {/* ── Grouped Tab Navigation ── */}
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 min-w-max">
            {sections.map((section, si) => (
              <div key={section.label} className="flex items-center gap-1">
                {si > 0 && (
                  <div className="w-px h-6 bg-wireframe-stroke mx-1.5 flex-shrink-0" />
                )}
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono mr-1.5 hidden lg:inline">{section.label}</span>
                  {section.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-cb-toggle whitespace-nowrap text-xs font-medium border ${
                        activeTab === tab.id
                          ? 'border-gold/40 bg-gold/10 text-gold'
                          : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-sm">{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Content Panels ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleServices.map((service) => <ServiceCard key={service.id} service={service} isOwner={isOwner} />)}
              </div>
            )}

            {activeTab === 'topology' && (
              <TopologyPanel />
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100 mb-2">AI Models</h3>
                  <div className="space-y-2">
                    {visibleIntegrations.filter((i) => i.type === 'ai_model').map((i) => <IntegrationRow key={i.id} integration={i} isOwner={isOwner} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-100 mb-2">Voice</h3>
                  <div className="space-y-2">
                    {visibleIntegrations.filter((i) => i.type === 'voice').map((i) => <IntegrationRow key={i.id} integration={i} isOwner={isOwner} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-100 mb-2">Tools & Services</h3>
                  <div className="space-y-2">
                    {visibleIntegrations.filter((i) => !['ai_model', 'voice'].includes(i.type)).map((i) => <IntegrationRow key={i.id} integration={i} isOwner={isOwner} />)}
                  </div>
                </div>
                {isOwner && (
                  <button className="w-full p-3 rounded-xl border border-dashed border-white/10 text-cb-fog text-sm hover:border-gold/20 hover:text-gold transition-all duration-cb-toggle">+ Add New Integration</button>
                )}
              </div>
            )}

            {activeTab === 'social-channels' && (
              <SocialChannelsPanel isOwner={isOwner} />
            )}

            {activeTab === 'boomerangs' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeBoomerangs.map((ang) => <BoomerAngCard key={ang.id} ang={ang} />)}
                </div>
                {isOwner && (
                  <button className="w-full mt-3 p-3 rounded-xl border border-dashed border-white/10 text-cb-fog text-sm hover:border-gold/20 hover:text-gold transition-all duration-cb-toggle">+ Spawn New Boomer_Ang</button>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <SecurityPanel isOwner={isOwner} />
            )}

            {activeTab === 'control-plane' && isOwner && (
              <ControlPlanePanel />
            )}

            {activeTab === 'live-events' && isOwner && (
              <LiveEventsPanel events={liveEvents} />
            )}

            {activeTab === 'model-garden' && (
              <Suspense fallback={<PanelLoader />}>
                <div className="circuit-box-panel"><ModelGardenPanel /></div>
              </Suspense>
            )}

            {activeTab === 'luc' && (
              <Suspense fallback={<PanelLoader />}>
                <div className="circuit-box-panel"><LUCPanel /></div>
              </Suspense>
            )}

            {activeTab === 'workbench' && (
              <Suspense fallback={<PanelLoader />}><WorkbenchPanel /></Suspense>
            )}

            {activeTab === 'workstreams' && (
              <Suspense fallback={<PanelLoader />}><WorkstreamsPanel /></Suspense>
            )}

            {activeTab === 'plan' && (
              <Suspense fallback={<PanelLoader />}><PlanPanel /></Suspense>
            )}

            {activeTab === 'settings' && (
              <Suspense fallback={<PanelLoader />}><SettingsPanel /></Suspense>
            )}

            {activeTab === 'research' && isOwner && (
              <Suspense fallback={<PanelLoader />}><ResearchPanel /></Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CircuitBoxPage() {
  return (
    <Suspense fallback={<PanelLoader />}>
      <CircuitBoxContent />
    </Suspense>
  );
}
