'use client';

/**
 * Circuit Box - Central Integration Hub
 *
 * The Circuit Box is where all A.I.M.S. services are wired together.
 * It provides:
 * - Service status monitoring
 * - Integration configuration
 * - BoomerAng routing management
 * - Agent deployment controls
 * - Security status overview
 *
 * All wiring goes through Circuit Box. It's the single source of truth
 * for service connections and configurations.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIMS_CIRCUIT_COLORS, CircuitBoardPattern } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
// Icons
// ─────────────────────────────────────────────────────────────

const CircuitIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <circle cx="8" cy="8" r="2" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="8" cy="16" r="2" />
    <circle cx="16" cy="16" r="2" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="16" y1="10" x2="16" y2="14" />
    <line x1="10" y1="16" x2="14" y2="16" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 12 15 16 10" />
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
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const PowerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const BotIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const SERVICES: ServiceStatus[] = [
  { id: 'frontend', name: 'Frontend', type: 'core', status: 'online', endpoint: 'http://localhost:3000', version: '1.0.0', features: ['Dashboard', 'LUC', 'Model Garden'] },
  { id: 'uef-gateway', name: 'UEF Gateway', type: 'core', status: 'online', endpoint: 'http://uef-gateway:3001', version: '1.0.0', features: ['ACP', 'UCP', 'Orchestration'] },
  { id: 'acheevy', name: 'ACHEEVY', type: 'core', status: 'online', endpoint: 'http://acheevy:3003', version: '1.0.0', features: ['Intent Analysis', 'Payment Processing', 'Executive Control'] },
  { id: 'house-of-ang', name: 'House of Ang', type: 'core', status: 'online', endpoint: 'http://house-of-ang:3002', version: '1.0.0', features: ['Agent Registry', 'Routing', 'Task Assignment'] },
  { id: 'openclaw', name: 'OpenClaw', type: 'agent', status: 'sandbox', endpoint: 'http://openclaw:8001', version: '2026.2.3', features: ['Multi-model', 'KIMI K2.5', 'Tool Execution'] },
  { id: 'agent-bridge', name: 'Agent Bridge', type: 'core', status: 'online', endpoint: 'http://agent-bridge:3010', version: '1.0.0', features: ['Security Gateway', 'Rate Limiting', 'Payment Blocking'] },
  { id: 'n8n', name: 'n8n Automation', type: 'tool', status: 'sandbox', endpoint: 'http://n8n:5678', version: 'latest', features: ['Workflows', 'Webhooks', 'Integrations'] },
];

const INTEGRATIONS: Integration[] = [
  { id: 'claude', name: 'Claude Opus 4.5', provider: 'Anthropic', type: 'ai_model', status: 'active', apiKeySet: true, usageToday: 12500, costToday: 0.45 },
  { id: 'kimi', name: 'KIMI K2.5', provider: 'Moonshot', type: 'ai_model', status: 'active', apiKeySet: true, usageToday: 8200, costToday: 0.12 },
  { id: 'deepseek', name: 'DeepSeek V3.2', provider: 'DeepSeek', type: 'ai_model', status: 'active', apiKeySet: true, usageToday: 5400, costToday: 0.08 },
  { id: 'openrouter', name: 'OpenRouter', provider: 'OpenRouter', type: 'ai_model', status: 'active', apiKeySet: true },
  { id: 'brave', name: 'Brave Search', provider: 'Brave', type: 'search', status: 'active', apiKeySet: true, usageToday: 340 },
  { id: 'elevenlabs', name: 'ElevenLabs', provider: 'ElevenLabs', type: 'voice', status: 'inactive', apiKeySet: false },
  { id: 'stripe', name: 'Stripe', provider: 'Stripe', type: 'payment', status: 'active', apiKeySet: true },
];

const BOOMERANGS: BoomerAngConfig[] = [
  { id: 'engineer-ang', name: 'EngineerAng', role: 'Software Development', status: 'active', model: 'claude-opus-4.5', tasks: ['Code Generation', 'Refactoring', 'Bug Fixes'], permissions: ['read', 'write', 'execute'], sandboxed: true },
  { id: 'researcher-ang', name: 'ResearcherAng', role: 'Research & Analysis', status: 'active', model: 'kimi-k2.5', tasks: ['Web Search', 'Data Analysis', 'Summarization'], permissions: ['read', 'search'], sandboxed: true },
  { id: 'marketer-ang', name: 'MarketerAng', role: 'Marketing & Content', status: 'standby', model: 'claude-sonnet-4.5', tasks: ['Content Generation', 'SEO', 'Social Media'], permissions: ['read', 'write'], sandboxed: true },
  { id: 'seller-ang', name: 'SellerAng', role: 'E-commerce', status: 'active', model: 'deepseek-v3.2', tasks: ['Listing Optimization', 'Market Research', 'Pricing'], permissions: ['read', 'analyze'], sandboxed: true },
  { id: 'quality-ang', name: 'QualityAng', role: 'Quality Assurance', status: 'standby', model: 'claude-opus-4.5', tasks: ['ORACLE Verification', 'Testing', 'Code Review'], permissions: ['read', 'test'], sandboxed: true },
];

// ─────────────────────────────────────────────────────────────
// Components
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
  const typeStyle = typeColors[service.type];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-4 rounded-xl border ${typeStyle.border} ${typeStyle.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={service.status} />
          <h3 className="font-medium text-white">{service.name}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${typeStyle.bg} ${typeStyle.text}`}>{service.type.toUpperCase()}</span>
      </div>
      <div className="text-xs text-gray-400 mb-2 font-mono">{service.endpoint}</div>
      {service.features && (
        <div className="flex flex-wrap gap-1 mb-2">
          {service.features.map((feature) => (
            <span key={feature} className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-gray-300">{feature}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>v{service.version}</span>
        <span className="capitalize">{service.status}</span>
      </div>
    </motion.div>
  );
}

function IntegrationRow({ integration }: { integration: Integration }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-wireframe-stroke">
      <div className="flex items-center gap-3">
        <StatusDot status={integration.status} />
        <div>
          <div className="text-sm font-medium text-white">{integration.name}</div>
          <div className="text-xs text-gray-500">{integration.provider}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {integration.usageToday !== undefined && (
          <div className="text-right">
            <div className="text-xs text-gray-400">{integration.usageToday.toLocaleString()} tokens</div>
            {integration.costToday !== undefined && <div className="text-xs text-gold">${integration.costToday.toFixed(2)}</div>}
          </div>
        )}
        <div className="flex items-center gap-2">
          {integration.apiKeySet ? (
            <span className="flex items-center gap-1 text-xs text-green-400"><LockIcon className="w-3 h-3" />Set</span>
          ) : (
            <span className="text-xs text-red-400">No Key</span>
          )}
          <button className="p-1 rounded hover:bg-white/10"><SettingsIcon className="w-4 h-4 text-gray-400" /></button>
        </div>
      </div>
    </div>
  );
}

function BoomerAngCard({ ang }: { ang: BoomerAngConfig }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-black/40 border border-wireframe-stroke">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BotIcon className="w-5 h-5 text-gold" />
          <h4 className="font-medium text-white">{ang.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={ang.status} />
          <span className="text-xs text-gray-400 capitalize">{ang.status}</span>
        </div>
      </div>
      <div className="text-sm text-gray-400 mb-2">{ang.role}</div>
      <div className="text-xs text-gold mb-3">Model: {ang.model}</div>
      <div className="flex flex-wrap gap-1 mb-3">
        {ang.tasks.map((task) => (
          <span key={task} className="px-2 py-0.5 rounded text-[10px] bg-gold/10 text-gold">{task}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-wireframe-stroke">
        <div className="flex items-center gap-1">
          {ang.sandboxed && <span className="flex items-center gap-1 text-xs text-blue-400"><ShieldIcon className="w-3 h-3" />Sandboxed</span>}
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 rounded bg-white/5 hover:bg-white/10"><SettingsIcon className="w-4 h-4 text-gray-400" /></button>
          <button className="p-1.5 rounded bg-white/5 hover:bg-white/10"><PowerIcon className="w-4 h-4 text-gray-400" /></button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function CircuitBoxPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'integrations' | 'boomerangs' | 'security'>('services');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const onlineServices = SERVICES.filter((s) => s.status === 'online' || s.status === 'sandbox').length;
  const activeIntegrations = INTEGRATIONS.filter((i) => i.status === 'active').length;
  const activeAngs = BOOMERANGS.filter((a) => a.status === 'active').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0f1a' }}>
      <CircuitBoardPattern density="sparse" animated={false} glowIntensity={0.1} />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`, boxShadow: `0 0 20px ${AIMS_CIRCUIT_COLORS.glow}` }}>
                <CircuitIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>Circuit Box</h1>
                <p className="text-gray-400">Central Integration Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}>
                <RefreshIcon className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm text-gray-300">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-black" style={{ background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})` }}>
                Save Configuration
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}>
              <div className="text-2xl font-bold text-green-400">{onlineServices}/{SERVICES.length}</div>
              <div className="text-xs text-gray-400">Services Online</div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}>
              <div className="text-2xl font-bold text-gold">{activeIntegrations}</div>
              <div className="text-xs text-gray-400">Active Integrations</div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}>
              <div className="text-2xl font-bold text-blue-400">{activeAngs}</div>
              <div className="text-xs text-gray-400">Active Boomer_Angs</div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}>
              <div className="flex items-center gap-2">
                <ShieldIcon className="w-6 h-6 text-green-400" />
                <span className="text-lg font-bold text-green-400">SECURE</span>
              </div>
              <div className="text-xs text-gray-400">Payment Isolation Active</div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'services', label: 'Services', icon: CircuitIcon },
            { id: 'integrations', label: 'Integrations', icon: SettingsIcon },
            { id: 'boomerangs', label: 'Boomer_Angs', icon: BotIcon },
            { id: 'security', label: 'Security', icon: ShieldIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap"
              style={{
                backgroundColor: activeTab === tab.id ? AIMS_CIRCUIT_COLORS.primary + '20' : 'transparent',
                color: activeTab === tab.id ? AIMS_CIRCUIT_COLORS.accent : '#9ca3af',
                border: activeTab === tab.id ? `1px solid ${AIMS_CIRCUIT_COLORS.primary}60` : '1px solid transparent',
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'services' && (
            <motion.div key="services" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES.map((service) => <ServiceCard key={service.id} service={service} />)}
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">AI Models</h3>
                <div className="space-y-2">
                  {INTEGRATIONS.filter((i) => i.type === 'ai_model').map((integration) => <IntegrationRow key={integration.id} integration={integration} />)}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Tools & Services</h3>
                <div className="space-y-2">
                  {INTEGRATIONS.filter((i) => i.type !== 'ai_model').map((integration) => <IntegrationRow key={integration.id} integration={integration} />)}
                </div>
              </div>
              <button className="w-full p-4 rounded-xl border border-dashed border-white/20 text-gray-400 hover:border-gold/20 hover:text-gold transition-all">+ Add New Integration</button>
            </motion.div>
          )}

          {activeTab === 'boomerangs' && (
            <motion.div key="boomerangs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BOOMERANGS.map((ang) => <BoomerAngCard key={ang.id} ang={ang} />)}
              </div>
              <button className="w-full mt-4 p-4 rounded-xl border border-dashed border-white/20 text-gray-400 hover:border-gold/20 hover:text-gold transition-all">+ Spawn New Boomer_Ang</button>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldIcon className="w-8 h-8 text-green-400" />
                  <div>
                    <h3 className="text-xl font-bold text-green-400">Security Status: PROTECTED</h3>
                    <p className="text-sm text-gray-400">All security measures are active</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Agent Sandbox', value: 'Enabled' },
                    { label: 'Payment Isolation', value: 'Enforced' },
                    { label: 'Rate Limiting', value: '100 req/min' },
                    { label: 'Network Isolation', value: 'Active' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-black/30">
                      <CheckCircleIcon className="w-5 h-5 text-green-400 mb-2" />
                      <div className="text-sm text-white">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}>
                <h3 className="text-lg font-medium text-white mb-4">Security Rules</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <h4 className="text-sm font-medium text-red-400 mb-2">BLOCKED Operations (Agents Cannot Access)</h4>
                    <div className="flex flex-wrap gap-2">
                      {['payment', 'transfer', 'purchase', 'checkout', 'credit_card', 'stripe', 'bank', 'invoice'].map((op) => (
                        <span key={op} className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">{op}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <h4 className="text-sm font-medium text-green-400 mb-2">ALLOWED Operations (Agent Whitelist)</h4>
                    <div className="flex flex-wrap gap-2">
                      {['search', 'analyze', 'summarize', 'generate', 'read', 'write', 'code'].map((op) => (
                        <span key={op} className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">{op}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Payment Access (ACHEEVY ONLY)</h4>
                    <p className="text-sm text-gray-400">Only ACHEEVY has access to payment credentials. Boomer_Angs scout and recommend - NEVER execute payments.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
