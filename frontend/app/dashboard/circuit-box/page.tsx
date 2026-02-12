'use client';

/**
 * Circuit Box — Central Command Hub
 *
 * The unified control center for all A.I.M.S. operations.
 * Consolidates Services, Integrations, Agents, Security,
 * Model Garden, LUC, Workbench, Workstreams, Plan, Settings, and R&D Hub
 * into organized sections with a grouped tab navigation.
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AIMS_CIRCUIT_COLORS, CircuitBoardPattern } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Lazy-loaded panel components (each page becomes an embeddable panel)
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
  | 'services' | 'integrations' | 'security'
  | 'model-garden' | 'boomerangs'
  | 'luc' | 'workbench' | 'workstreams' | 'plan'
  | 'settings' | 'research';

interface ServiceStatus {
  id: string;
  name: string;
  type: 'core' | 'agent' | 'tool' | 'external';
  status: 'online' | 'offline' | 'degraded' | 'sandbox';
  endpoint: string;
  version?: string;
  features?: string[];
}

interface Integration {
  id: string;
  name: string;
  provider: string;
  type: 'ai_model' | 'search' | 'voice' | 'storage' | 'payment' | 'automation';
  status: 'active' | 'inactive' | 'error';
  apiKeySet: boolean;
  usageToday?: number;
  costToday?: number;
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

// ─────────────────────────────────────────────────────────────
// Section definitions
// ─────────────────────────────────────────────────────────────

interface SectionGroup {
  label: string;
  tabs: { id: CircuitBoxTab; label: string; icon: string }[];
}

const SECTIONS: SectionGroup[] = [
  {
    label: 'Operations',
    tabs: [
      { id: 'services', label: 'Services', icon: '⚡' },
      { id: 'integrations', label: 'Integrations', icon: '🔗' },
      { id: 'security', label: 'Security', icon: '🛡' },
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
      { id: 'research', label: 'R&D Hub', icon: '🧪' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG)
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

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const SERVICES: ServiceStatus[] = [
  { id: 'frontend', name: 'Frontend', type: 'core', status: 'online', endpoint: 'http://localhost:3000', version: '1.0.0', features: ['Dashboard', 'LUC', 'Model Garden'] },
  { id: 'uef-gateway', name: 'UEF Gateway', type: 'core', status: 'online', endpoint: 'http://uef-gateway:3001', version: '1.0.0', features: ['ACP', 'UCP', 'Orchestration'] },
  { id: 'acheevy', name: 'ACHEEVY', type: 'core', status: 'online', endpoint: 'http://acheevy:3003', version: '1.0.0', features: ['Intent Analysis', 'Payment Processing', 'Executive Control'] },
  { id: 'house-of-ang', name: 'House of Ang', type: 'core', status: 'online', endpoint: 'http://house-of-ang:3002', version: '1.0.0', features: ['Agent Registry', 'Routing', 'Task Assignment'] },
  { id: 'openclaw', name: 'OpenClaw', type: 'tool', status: 'sandbox', endpoint: 'http://openclaw:18789', version: '2026.2.3', features: ['Multi-model', 'KIMI K2.5', 'Tool Execution'] },
  { id: 'agent-bridge', name: 'Agent Bridge', type: 'core', status: 'online', endpoint: 'http://agent-bridge:3010', version: '1.0.0', features: ['Security Gateway', 'Rate Limiting', 'Payment Blocking'] },
  { id: 'n8n', name: 'n8n Automation', type: 'tool', status: 'sandbox', endpoint: 'http://n8n:5678', version: 'latest', features: ['Workflows', 'Webhooks', 'Integrations'] },
];

const INTEGRATIONS: Integration[] = [
  { id: 'claude', name: 'Claude Opus 4.6', provider: 'Anthropic', type: 'ai_model', status: 'active', apiKeySet: true, usageToday: 12500, costToday: 0.45 },
  { id: 'kimi', name: 'KIMI K2.5', provider: 'Moonshot', type: 'ai_model', status: 'active', apiKeySet: true, usageToday: 8200, costToday: 0.12 },
  { id: 'deepseek', name: 'DeepSeek V3.2', provider: 'DeepSeek', type: 'ai_model', status: 'active', apiKeySet: true, usageToday: 5400, costToday: 0.08 },
  { id: 'openrouter', name: 'OpenRouter', provider: 'OpenRouter', type: 'ai_model', status: 'active', apiKeySet: true },
  { id: 'brave', name: 'Brave Search', provider: 'Brave', type: 'search', status: 'active', apiKeySet: true, usageToday: 340 },
  { id: 'elevenlabs', name: 'ElevenLabs', provider: 'ElevenLabs', type: 'voice', status: 'inactive', apiKeySet: false },
  { id: 'stripe', name: 'Stripe', provider: 'Stripe', type: 'payment', status: 'active', apiKeySet: true },
];

const BOOMERANGS: BoomerAngConfig[] = [
  { id: 'engineer-ang', name: 'Engineer_Ang', role: 'Software Development', status: 'active', model: 'claude-opus-4.6', tasks: ['Code Generation', 'Refactoring', 'Bug Fixes'], permissions: ['read', 'write', 'execute'], sandboxed: true },
  { id: 'researcher-ang', name: 'Researcher_Ang', role: 'Research & Analysis', status: 'active', model: 'kimi-k2.5', tasks: ['Web Search', 'Data Analysis', 'Summarization'], permissions: ['read', 'search'], sandboxed: true },
  { id: 'marketer-ang', name: 'Marketer_Ang', role: 'Marketing & Content', status: 'standby', model: 'claude-sonnet-4.5', tasks: ['Content Generation', 'SEO', 'Social Media'], permissions: ['read', 'write'], sandboxed: true },
  { id: 'seller-ang', name: 'Seller_Ang', role: 'E-commerce', status: 'active', model: 'deepseek-v3.2', tasks: ['Listing Optimization', 'Market Research', 'Pricing'], permissions: ['read', 'analyze'], sandboxed: true },
  { id: 'quality-ang', name: 'Quality_Ang', role: 'Quality Assurance', status: 'standby', model: 'claude-opus-4.6', tasks: ['ORACLE Verification', 'Testing', 'Code Review'], permissions: ['read', 'test'], sandboxed: true },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-green-500 shadow-green-500/50',
    offline: 'bg-red-500 shadow-red-500/50',
    degraded: 'bg-yellow-500 shadow-yellow-500/50',
    sandbox: 'bg-blue-500 shadow-blue-500/50',
    active: 'bg-green-500 shadow-green-500/50',
    inactive: 'bg-gray-500 shadow-gray-500/50',
    standby: 'bg-gold shadow-gold/50',
    disabled: 'bg-red-500 shadow-red-500/50',
    error: 'bg-red-500 shadow-red-500/50',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${colors[status] || colors.offline}`} />;
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    core: { bg: 'bg-gold/10', border: 'border-gold/30', text: 'text-gold' },
    agent: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    tool: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    external: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  };
  const s = typeColors[service.type];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-4 rounded-xl border ${s.border} ${s.bg} hover:ring-2 hover:ring-white/10 transition-all cursor-default`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={service.status} />
          <h3 className="text-sm font-semibold text-white">{service.name}</h3>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${s.bg} ${s.text}`}>{service.type.toUpperCase()}</span>
      </div>
      <div className="text-xs text-gray-400 mb-2 font-mono truncate">{service.endpoint}</div>
      {service.features && (
        <div className="flex flex-wrap gap-1 mb-2">
          {service.features.map((f) => (
            <span key={f} className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-gray-300">{f}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-wireframe-stroke">
        <span>v{service.version}</span>
        <span className="capitalize font-medium">{service.status}</span>
      </div>
    </motion.div>
  );
}

function IntegrationRow({ integration }: { integration: Integration }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-wireframe-stroke hover:border-white/15 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <StatusDot status={integration.status} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{integration.name}</div>
          <div className="text-xs text-gray-500">{integration.provider}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {integration.usageToday !== undefined && (
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-400">{integration.usageToday.toLocaleString()} tokens</div>
            {integration.costToday !== undefined && <div className="text-xs text-gold font-mono">${integration.costToday.toFixed(2)}</div>}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {integration.apiKeySet ? (
            <span className="flex items-center gap-1 text-xs text-green-400"><LockIcon className="w-3.5 h-3.5" />Set</span>
          ) : (
            <span className="text-xs text-red-400 font-medium">No Key</span>
          )}
          <button type="button" className="p-1 rounded-lg hover:bg-white/10 transition-colors"><SettingsIcon className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      </div>
    </div>
  );
}

function BoomerAngCard({ ang }: { ang: BoomerAngConfig }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-black/40 border border-wireframe-stroke hover:border-gold/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-gold/20 bg-gold/10 flex items-center justify-center">
            <Image src="/images/acheevy/acheevy-helmet.png" alt={ang.name} width={20} height={20} className="w-5 h-5 object-cover" />
          </div>
          <h4 className="text-sm font-semibold text-white">{ang.name}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={ang.status} />
          <span className="text-xs text-gray-400 capitalize font-medium">{ang.status}</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 mb-1">{ang.role}</div>
      <div className="text-[10px] text-gold mb-2 font-mono">Model: {ang.model}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {ang.tasks.map((task) => (
          <span key={task} className="px-2 py-0.5 rounded text-[10px] bg-gold/10 text-gold font-medium">{task}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-wireframe-stroke">
        <div className="flex items-center gap-1">
          {ang.sandboxed && <span className="flex items-center gap-1 text-[10px] text-blue-400"><ShieldIcon className="w-3.5 h-3.5" />Sandboxed</span>}
        </div>
        <div className="flex gap-1.5">
          <button type="button" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><SettingsIcon className="w-3.5 h-3.5 text-gray-400" /></button>
          <button type="button" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><PowerIcon className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      </div>
    </motion.div>
  );
}

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
// Main Component
// ─────────────────────────────────────────────────────────────

function CircuitBoxContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as CircuitBoxTab) || 'services';
  const [activeTab, setActiveTab] = useState<CircuitBoxTab>(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  // Sync tab from URL on mount and when search params change
  useEffect(() => {
    const tab = searchParams.get('tab') as CircuitBoxTab;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const onlineServices = SERVICES.filter((s) => s.status === 'online' || s.status === 'sandbox').length;
  const activeIntegrations = INTEGRATIONS.filter((i) => i.status === 'active').length;
  const activeAngs = BOOMERANGS.filter((a) => a.status === 'active').length;

  return (
    <div className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <CircuitBoardPattern density="sparse" animated={false} glowIntensity={0.1} />

      {/* Ambient logo watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0" aria-hidden="true">
        <div className="w-[400px] h-[400px] opacity-[0.02] bg-contain bg-no-repeat bg-center" style={{ backgroundImage: "url('/images/logos/achievemor-gold.png')" }} />
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
                <p className="text-gray-400 text-sm">Central Command Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-wireframe-stroke bg-white/[0.02] hover:bg-white/5 transition-colors">
                <RefreshIcon className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs text-gray-300 hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <button type="button" onClick={() => setActiveTab('services')} className={`p-3 rounded-xl border transition-all text-left ${activeTab === 'services' ? 'border-green-400/30 bg-green-400/5' : 'border-wireframe-stroke bg-white/[0.02] hover:border-green-400/20'}`}>
              <div className="text-2xl font-bold text-green-400">{onlineServices}/{SERVICES.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Services Online</div>
            </button>
            <button type="button" onClick={() => setActiveTab('integrations')} className={`p-3 rounded-xl border transition-all text-left ${activeTab === 'integrations' ? 'border-gold/30 bg-gold/5' : 'border-wireframe-stroke bg-white/[0.02] hover:border-gold/20'}`}>
              <div className="text-2xl font-bold text-gold">{activeIntegrations}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Integrations</div>
            </button>
            <button type="button" onClick={() => setActiveTab('boomerangs')} className={`p-3 rounded-xl border transition-all text-left ${activeTab === 'boomerangs' ? 'border-blue-400/30 bg-blue-400/5' : 'border-wireframe-stroke bg-white/[0.02] hover:border-blue-400/20'}`}>
              <div className="text-2xl font-bold text-blue-400">{activeAngs}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Boomer_Angs</div>
            </button>
            <button type="button" onClick={() => setActiveTab('security')} className={`p-3 rounded-xl border transition-all text-left ${activeTab === 'security' ? 'border-green-400/30 bg-green-400/5' : 'border-wireframe-stroke bg-white/[0.02] hover:border-green-400/20'}`}>
              <div className="flex items-center gap-1.5">
                <ShieldIcon className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold text-green-400">SECURE</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Payment Isolation</div>
            </button>
          </div>
        </header>

        {/* ── Grouped Tab Navigation ── */}
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 min-w-max">
            {SECTIONS.map((section, si) => (
              <div key={section.label} className="flex items-center gap-1">
                {si > 0 && (
                  <div className="w-px h-6 bg-wireframe-stroke mx-1.5 flex-shrink-0" />
                )}
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] uppercase tracking-widest text-white/20 font-mono mr-1.5 hidden lg:inline">{section.label}</span>
                  {section.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-xs font-medium border ${
                        activeTab === tab.id
                          ? 'border-gold/40 bg-gold/10 text-gold'
                          : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
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

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Services */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SERVICES.map((service) => <ServiceCard key={service.id} service={service} />)}
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">AI Models</h3>
                  <div className="space-y-2">
                    {INTEGRATIONS.filter((i) => i.type === 'ai_model').map((i) => <IntegrationRow key={i.id} integration={i} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Tools & Services</h3>
                  <div className="space-y-2">
                    {INTEGRATIONS.filter((i) => i.type !== 'ai_model').map((i) => <IntegrationRow key={i.id} integration={i} />)}
                  </div>
                </div>
                <button className="w-full p-3 rounded-xl border border-dashed border-white/15 text-gray-400 text-sm hover:border-gold/20 hover:text-gold transition-all">+ Add New Integration</button>
              </div>
            )}

            {/* Boomer_Angs */}
            {activeTab === 'boomerangs' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BOOMERANGS.map((ang) => <BoomerAngCard key={ang.id} ang={ang} />)}
                </div>
                <button className="w-full mt-3 p-3 rounded-xl border border-dashed border-white/15 text-gray-400 text-sm hover:border-gold/20 hover:text-gold transition-all">+ Spawn New Boomer_Ang</button>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldIcon className="w-7 h-7 text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-green-400">Security Status: PROTECTED</h3>
                      <p className="text-xs text-gray-400">All security measures are active</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Agent Sandbox', value: 'Enabled' },
                      { label: 'Payment Isolation', value: 'Enforced' },
                      { label: 'Rate Limiting', value: '100 req/min' },
                      { label: 'Network Isolation', value: 'Active' },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg bg-black/30">
                        <CheckCircleIcon className="w-4 h-4 text-green-400 mb-1.5" />
                        <div className="text-xs text-white">{item.label}</div>
                        <div className="text-[10px] text-gray-500">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-wireframe-stroke bg-white/[0.02]">
                  <h3 className="text-sm font-medium text-white mb-3">Security Rules</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <h4 className="text-xs font-medium text-red-400 mb-1.5">BLOCKED Operations</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['payment', 'transfer', 'purchase', 'checkout', 'credit_card', 'stripe', 'bank', 'invoice'].map((op) => (
                          <span key={op} className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300">{op}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <h4 className="text-xs font-medium text-green-400 mb-1.5">ALLOWED Operations</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['search', 'analyze', 'summarize', 'generate', 'read', 'write', 'code'].map((op) => (
                          <span key={op} className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-300">{op}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <h4 className="text-xs font-medium text-blue-400 mb-1.5">Payment Access (ACHEEVY ONLY)</h4>
                      <p className="text-xs text-gray-400">Only ACHEEVY has access to payment credentials. Boomer_Angs scout and recommend — NEVER execute payments.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Lazy-loaded panels ── */}
            {activeTab === 'model-garden' && (
              <Suspense fallback={<PanelLoader />}>
                <div className="circuit-box-panel">
                  <ModelGardenPanel />
                </div>
              </Suspense>
            )}

            {activeTab === 'luc' && (
              <Suspense fallback={<PanelLoader />}>
                <div className="circuit-box-panel">
                  <LUCPanel />
                </div>
              </Suspense>
            )}

            {activeTab === 'workbench' && (
              <Suspense fallback={<PanelLoader />}>
                <WorkbenchPanel />
              </Suspense>
            )}

            {activeTab === 'workstreams' && (
              <Suspense fallback={<PanelLoader />}>
                <WorkstreamsPanel />
              </Suspense>
            )}

            {activeTab === 'plan' && (
              <Suspense fallback={<PanelLoader />}>
                <PlanPanel />
              </Suspense>
            )}

            {activeTab === 'settings' && (
              <Suspense fallback={<PanelLoader />}>
                <SettingsPanel />
              </Suspense>
            )}

            {activeTab === 'research' && (
              <Suspense fallback={<PanelLoader />}>
                <ResearchPanel />
              </Suspense>
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
