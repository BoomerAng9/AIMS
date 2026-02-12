'use client';

/**
 * A.I.M.S. Circuit Box - System Management Dashboard
 *
 * The clean way to wire everything and store APIs.
 * Central control panel for AI Agents, Integrations, Voice, and Deployment.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircuitBoardPattern, CircuitBorder, AIMS_CIRCUIT_COLORS } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SystemStatus = 'optimal' | 'degraded' | 'critical';
type ToggleState = 'on' | 'off';
type HealthStatus = 'healthy' | 'warning' | 'error';

interface AIAgent {
  id: string;
  name: string;
  type: string;
  enabled: ToggleState;
  load: number;
  lastActivity: string;
}

interface Repository {
  id: string;
  name: string;
  signal: number; // 0-5 bars
  lastSync: string;
  status: 'synced' | 'syncing' | 'error';
  errorCount?: number;
}

interface Integration {
  id: string;
  name: string;
  enabled: ToggleState;
  health: HealthStatus;
}

interface VoiceConfig {
  id: string;
  name: string;
  enabled: ToggleState;
  provider?: string;
}

interface DeploymentService {
  id: string;
  name: string;
  enabled: ToggleState;
  lastCheck: string;
}

interface VoiceAgentConfig {
  apiKey: string;
  rateLimits: string;
  timeout: string;
  retryPolicies: string;
  errorHandling: string;
  currentLoad: number;
  requestCount: number;
  errorRate: string;
  responseTime: string;
  monthlyUsage: string;
}

interface LogEntry {
  level: 'info' | 'alert' | 'warning';
  timestamp: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_AI_AGENTS: AIAgent[] = [
  { id: 'voice', name: 'Voice Agent', type: 'ElevenLabs STT/TTS', enabled: 'on', load: 78, lastActivity: '10:05 AM Today' },
  { id: 'code', name: 'Code Generation Agent', type: '', enabled: 'on', load: 65, lastActivity: '10:05 AM Today' },
  { id: 'backend', name: 'Backend Agent', type: '', enabled: 'on', load: 55, lastActivity: '10:05 AM Today' },
  { id: 'frontend', name: 'Frontend Agent', type: '', enabled: 'on', load: 45, lastActivity: '10:05 AM Today' },
  { id: 'testing', name: 'Testing Agent', type: '', enabled: 'on', load: 30, lastActivity: '10:05 AM Today' },
  { id: 'deploy', name: 'Deploy Agent', type: '', enabled: 'on', load: 20, lastActivity: '10:05 AM Today' },
];

const MOCK_REPOSITORIES: Repository[] = [
  { id: 'core', name: 'Repo 1 - Core', signal: 5, lastSync: '3m ago', status: 'synced' },
  { id: 'ui', name: 'Repo 2 - UI', signal: 4, lastSync: '3m ago', status: 'synced' },
  { id: 'uk', name: 'Repo 2 - UK', signal: 4, lastSync: '3m ago', status: 'synced', errorCount: 0 },
  { id: 'sox', name: 'Repo 4 - Sox', signal: 5, lastSync: '3m ago', status: 'synced', errorCount: 2 },
  { id: 'ub', name: 'Repo 5 - UB', signal: 4, lastSync: '2m ago', status: 'synced' },
  { id: 'ex', name: 'Repo 5 - Ex', signal: 4, lastSync: '3m ago', status: 'synced', errorCount: 0 },
];

const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'stripe', name: 'Stripe (Payments)', enabled: 'on', health: 'healthy' },
  { id: 'github', name: 'GitHub', enabled: 'on', health: 'healthy' },
  { id: 'cloudflare', name: 'CloudFlare Workers', enabled: 'on', health: 'healthy' },
  { id: 'postgres', name: 'PostgreSQL Database', enabled: 'off', health: 'healthy' },
  { id: 'websocket', name: 'WebSocket Service', enabled: 'on', health: 'healthy' },
];

const MOCK_VOICE_CONFIG: VoiceConfig[] = [
  { id: 'elevenlabs', name: 'ElevenLabs Integration', enabled: 'on' },
  { id: 'stt', name: 'Scribe STT circuit breaker', enabled: 'on' },
  { id: 'tts', name: 'TTS circuit breaker', enabled: 'on' },
];

const MOCK_DEPLOYMENT: DeploymentService[] = [
  { id: 'docker', name: 'Docker container registry', enabled: 'on', lastCheck: '3m ago' },
  { id: 'cloudflare', name: 'Cloudflare Pages', enabled: 'on', lastCheck: '3m ago' },
  { id: 'worker', name: 'Worker deployment', enabled: 'on', lastCheck: '3m ago' },
  { id: 'backup', name: 'Database backups', enabled: 'on', lastCheck: '3m ago' },
  { id: 'health', name: 'Health check circuit', enabled: 'on', lastCheck: '3m ago' },
];

const MOCK_LOGS: LogEntry[] = [
  { level: 'info', timestamp: '10:10 AM', message: "User 'Admin_JD' enabled 'Testing Agent' circuit." },
  { level: 'alert', timestamp: '10:08 AM', message: "'Repo 2 - UI' circuit tripped due to connection timeout." },
  { level: 'info', timestamp: '10:05 AM', message: "'Voice Agent' processed 100 requests." },
  { level: 'warning', timestamp: '09:55 AM', message: "'Database backups' storage nearing capacity." },
];

const MOCK_VOICE_AGENT: VoiceAgentConfig = {
  apiKey: '**********',
  rateLimits: '100 req/min',
  timeout: '5000ms',
  retryPolicies: '3 attempts',
  errorHandling: 'Log & Alert',
  currentLoad: 78,
  requestCount: 1245,
  errorRate: '0.1%',
  responseTime: '50ms',
  monthlyUsage: '150,000 chars',
};

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const LockIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SettingsIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const SearchIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const AlertIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const UserIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SystemStatus }) {
  const colors = {
    optimal: { bg: '#22c55e', text: '#22c55e' },
    degraded: { bg: '#eab308', text: '#eab308' },
    critical: { bg: '#ef4444', text: '#ef4444' },
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-lg border"
      style={{
        borderColor: colors[status].bg + '60',
        backgroundColor: colors[status].bg + '10',
      }}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={colors[status].text} strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span style={{ color: colors[status].text }} className="font-mono text-sm uppercase tracking-wider">
        System {status}
      </span>
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={colors[status].text} strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
  );
}

function Toggle({ state, onChange }: { state: ToggleState; onChange?: () => void }) {
  const isOn = state === 'on';
  return (
    <button
      onClick={onChange}
      className={`relative w-14 h-7 rounded-md transition-colors ${
        isOn ? 'bg-green-500/20' : 'bg-gray-600/20'
      }`}
      style={{
        border: `1px solid ${isOn ? '#22c55e60' : '#6b728080'}`,
      }}
    >
      <span
        className={`absolute top-0.5 ${isOn ? 'left-0.5' : 'right-0.5'} w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all`}
        style={{
          backgroundColor: isOn ? '#22c55e' : '#6b7280',
          boxShadow: isOn ? '0 0 10px #22c55e80' : 'none',
        }}
      >
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

function HealthBadge({ health }: { health: HealthStatus }) {
  const colors = {
    healthy: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
  };
  const labels = {
    healthy: 'HEALTHY',
    warning: 'WARNING',
    error: 'ERROR',
  };

  return (
    <span
      className="px-2 py-1 rounded text-xs font-mono flex items-center gap-1"
      style={{
        backgroundColor: colors[health] + '20',
        color: colors[health],
        border: `1px solid ${colors[health]}40`,
      }}
    >
      {labels[health]}
      {health === 'healthy' && (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

function SignalBars({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className="w-1 rounded-sm transition-colors"
          style={{
            height: `${bar * 3 + 2}px`,
            backgroundColor: bar <= level ? '#22c55e' : '#374151',
          }}
        />
      ))}
    </div>
  );
}

function LoadBar({ load, color = '#22c55e' }: { load: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Load</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${load}%` }}
          transition={{ duration: 1 }}
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{load}%</span>
    </div>
  );
}

function MasterToggle({ state }: { state: ToggleState }) {
  const isOn = state === 'on';
  return (
    <div className="relative">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${isOn ? '#ef4444' : '#374151'} 0%, ${isOn ? '#991b1b' : '#1f2937'} 100%)`,
          boxShadow: isOn ? '0 0 30px #ef444480, inset 0 -5px 15px rgba(0,0,0,0.5)' : 'inset 0 -5px 15px rgba(0,0,0,0.5)',
          border: '4px solid #1f2937',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold">
        <span className={`text-sm ${isOn ? 'opacity-100' : 'opacity-30'}`}>ON</span>
        <span className={`text-sm ${!isOn ? 'opacity-100' : 'opacity-30'}`}>OFF</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panel Components
// ─────────────────────────────────────────────────────────────

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid #2d3a4d',
      }}
    >
      <div
        className="px-4 py-2 text-center font-mono text-xs uppercase tracking-wider"
        style={{
          backgroundColor: '#0f1729',
          borderBottom: '1px solid #2d3a4d',
          color: AIMS_CIRCUIT_COLORS.secondary,
        }}
      >
        {title}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

function AIAgentsPanel({ agents }: { agents: AIAgent[] }) {
  return (
    <Panel title="AI Agents Panel">
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-3 rounded-lg"
            style={{
              backgroundColor: '#0f172a',
              border: agent.id === 'voice' ? `1px solid ${AIMS_CIRCUIT_COLORS.primary}60` : '1px solid #2d3a4d',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{agent.name}</span>
                {agent.type && (
                  <span className="text-xs text-gray-400">({agent.type})</span>
                )}
              </div>
              <SettingsIcon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex items-center gap-3">
              <Toggle state={agent.enabled} />
              <div className="flex-1">
                <LoadBar load={agent.load} color={AIMS_CIRCUIT_COLORS.primary} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last activity: {agent.lastActivity}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RepositoriesPanel({ repos }: { repos: Repository[] }) {
  return (
    <Panel title="Repositories Panel">
      <div className="text-center text-xs text-gray-400 mb-3">
        {repos.length} Intelligent Repositories
      </div>
      <div className="grid grid-cols-3 gap-2">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="p-2 rounded text-center"
            style={{
              backgroundColor: '#0f172a',
              border: repo.errorCount ? '1px solid #ef444460' : '1px solid #2d3a4d',
            }}
          >
            <div className="text-xs text-white mb-1 truncate">{repo.name}</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <SignalBars level={repo.signal} />
            </div>
            <div className="text-[10px] text-gray-500">Last sync: {repo.lastSync}</div>
            {repo.errorCount !== undefined && repo.errorCount > 0 && (
              <span
                className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
              >
                {repo.errorCount} Errors
              </span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function IntegrationsPanel({ integrations }: { integrations: Integration[] }) {
  return (
    <Panel title="External Integrations Panel">
      <div className="space-y-2">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between p-2 rounded"
            style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
          >
            <span className="text-sm text-white">{integration.name}</span>
            <div className="flex items-center gap-2">
              <Toggle state={integration.enabled} />
              <HealthBadge health={integration.health} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function VoicePanel({ configs }: { configs: VoiceConfig[] }) {
  const [realTimeStreaming, setRealTimeStreaming] = useState(true);
  const [modelSelection, setModelSelection] = useState('Eleven Turbo v2');
  const [latencyMonitor, setLatencyMonitor] = useState(false);
  const [costTracker, setCostTracker] = useState(false);

  return (
    <Panel title="Voice & STT/TTS Panel">
      <div className="space-y-3">
        {configs.map((config) => (
          <div
            key={config.id}
            className="flex items-center justify-between p-2 rounded"
            style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
          >
            <span className="text-sm text-white">{config.name}</span>
            <Toggle state={config.enabled} />
          </div>
        ))}

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Real-time streaming</span>
            <Toggle state={realTimeStreaming ? 'on' : 'off'} onChange={() => setRealTimeStreaming(!realTimeStreaming)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Model selection</span>
            <select
              value={modelSelection}
              onChange={(e) => setModelSelection(e.target.value)}
              className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600"
            >
              <option>Eleven Turbo v2</option>
              <option>Eleven Multilingual</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Latency monitor</span>
            <div className="flex items-center gap-2">
              <Toggle state={latencyMonitor ? 'on' : 'off'} onChange={() => setLatencyMonitor(!latencyMonitor)} />
              <span className="text-xs text-gray-500">Latency: 50ms</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Cost Tracker</span>
            <div className="flex items-center gap-2">
              <Toggle state={costTracker ? 'on' : 'off'} onChange={() => setCostTracker(!costTracker)} />
              <span className="text-xs text-gray-500">Cost: $0.05/min</span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DeploymentPanel({ services }: { services: DeploymentService[] }) {
  return (
    <Panel title="Deployment & Infrastructure Panel">
      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-2 rounded"
            style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
          >
            <span className="text-sm text-white">{service.name}</span>
            <div className="flex items-center gap-2">
              <Toggle state={service.enabled} />
              <span className="text-[10px] text-gray-500">Last check: {service.lastCheck}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function VoiceAgentPanel({ config }: { config: VoiceAgentConfig }) {
  return (
    <div className="space-y-4">
      <MasterToggle state="on" />

      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
      >
        <h4 className="text-sm font-medium text-white mb-3">Voice Agent</h4>
        <p className="text-xs text-gray-400 mb-3">(ElevenLabs STT/TTS)</p>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">API keys/credentials:</span>
            <span className="text-white font-mono">{config.apiKey}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Rate limits:</span>
            <span className="text-white">{config.rateLimits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Timeout settings:</span>
            <span className="text-white">{config.timeout}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Retry policies:</span>
            <span className="text-white">{config.retryPolicies}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Error handling:</span>
            <span className="text-white">{config.errorHandling}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-700 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Current load:</span>
            <span style={{ color: AIMS_CIRCUIT_COLORS.primary }}>{config.currentLoad}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Request count:</span>
            <span className="text-white">{config.requestCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Error rate:</span>
            <span className="text-green-400">{config.errorRate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Response time:</span>
            <span className="text-white">{config.responseTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Monthly usage:</span>
            <span className="text-white">{config.monthlyUsage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogsPanel({ logs }: { logs: LogEntry[] }) {
  const levelColors = {
    info: '#3b82f6',
    alert: '#ef4444',
    warning: '#eab308',
  };

  return (
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
    >
      <div className="text-xs text-gray-400 mb-2 uppercase">Bottom Panel</div>
      <div className="space-y-1.5">
        {logs.map((log, i) => (
          <div key={i} className="text-xs font-mono">
            <span
              className="font-bold"
              style={{ color: levelColors[log.level] }}
            >
              [{log.level.toUpperCase()}]
            </span>{' '}
            <span className="text-gray-500">{log.timestamp}:</span>{' '}
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsPanel() {
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 uppercase">Bottom Panel</div>

      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-white">Alerts and warnings</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <AlertIcon className="w-4 h-4 text-yellow-500" />
        <span className="text-yellow-500">1 Critical, 2 Warnings</span>
      </div>

      <div className="flex items-center gap-2 text-sm pt-2">
        <UserIcon className="w-4 h-4 text-gray-400" />
        <span className="text-white">User access audit trail</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function CircuitBox() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('optimal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  return (
    <div
      className="min-h-screen p-6 aims-page-bg"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LockIcon className="w-8 h-8" style={{ color: AIMS_CIRCUIT_COLORS.secondary }} />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
              >
                Circuit Box - System Management
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500">SECURE</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>

        <StatusBadge status={systemStatus} />

        <div className="flex items-center gap-4">
          <MasterToggle state="on" />

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase">Search & Filter</div>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-48 pl-9 pr-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
              >
                <option value="all">Status</option>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
              >
                <option value="all">Category</option>
                <option value="agent">Agents</option>
                <option value="integration">Integrations</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Panel Labels */}
      <div className="grid grid-cols-6 gap-4 mb-2">
        {['Panel 1', 'Panel 2', 'Panel 3', 'Panel 4', 'Panel 5', 'Right Panel'].map((label) => (
          <div key={label} className="text-center text-xs text-gray-500 uppercase tracking-wider">
            {label}
          </div>
        ))}
      </div>

      {/* Main Panels Grid */}
      <div className="grid grid-cols-6 gap-4">
        <AIAgentsPanel agents={MOCK_AI_AGENTS} />
        <RepositoriesPanel repos={MOCK_REPOSITORIES} />
        <IntegrationsPanel integrations={MOCK_INTEGRATIONS} />
        <VoicePanel configs={MOCK_VOICE_CONFIG} />
        <DeploymentPanel services={MOCK_DEPLOYMENT} />
        <VoiceAgentPanel config={MOCK_VOICE_AGENT} />
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-6 gap-4 mt-4">
        <div className="col-span-4">
          <LogsPanel logs={MOCK_LOGS} />
        </div>
        <div className="col-span-2">
          <div
            className="p-3 rounded-lg h-full"
            style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
          >
            <AlertsPanel />
          </div>
        </div>
      </div>

      {/* A.I.M.S. Branding Footer */}
      <footer className="mt-8 pt-4 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-black"
            style={{
              background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`,
            }}
          >
            A
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>
              A.I.M.S.
            </div>
            <div className="text-[10px]" style={{ color: AIMS_CIRCUIT_COLORS.primary }}>
              AI Managed Solutions
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Circuit Box v1.0 • All systems operational
        </div>
      </footer>
    </div>
  );
}
