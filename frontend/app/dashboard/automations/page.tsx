'use client';

// frontend/app/dashboard/automations/page.tsx
// Automations — run coding agents on schedules or event triggers
import { useState, useMemo } from 'react';
import {
  Zap, Plus, Play, Pause, Archive, Clock, GitPullRequest,
  AlertTriangle, Shield, Search, FileText, Layers, Wrench,
  Activity, Trash2, ChevronRight, MoreHorizontal, Filter,
  CalendarClock, Radio, CheckCircle2, XCircle, Loader2,
  MessageSquare, Bug, ListChecks, Settings,
} from 'lucide-react';

// ─── Types (mirroring aims-skills/types/automations.ts) ──────────────────────

type AutomationStatus = 'draft' | 'active' | 'paused' | 'archived';
type RunStatus = 'running' | 'success' | 'failure' | 'timeout' | 'cancelled';
type TriggerType = 'scheduled' | 'event';
type TemplateCategory = 'code_quality' | 'bug_fixes' | 'documentation' | 'security' | 'team_updates' | 'issue_management' | 'monitoring' | 'custom';

interface AutomationTrigger {
  type: TriggerType;
  cron?: string;
  source?: string;
  event?: string;
  label: string;
}

interface Automation {
  id: string;
  name: string;
  instructions: string;
  triggers: AutomationTrigger[];
  status: AutomationStatus;
  agentId: string;
  lastRunAt: string | null;
  lastRunStatus: RunStatus | null;
  runsTotal: number;
  runsSuccess: number;
  runsFailed: number;
  tags: string[];
  createdAt: string;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  instructions: string;
  defaultTriggers: AutomationTrigger[];
  requiredServers: string[];
  tags: string[];
  popularity: number;
}

interface AutomationRun {
  id: string;
  automationId: string;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  status: RunStatus;
  summary: string;
  prsCreated: number;
  messagesPosted: number;
  lucCost: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-1',
    name: 'Auto-Generate PR Descriptions',
    instructions: 'When a PR is opened, analyze the diff and generate a description...',
    triggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }],
    status: 'active',
    agentId: 'acheevy',
    lastRunAt: '2026-02-23T07:42:00Z',
    lastRunStatus: 'success',
    runsTotal: 47,
    runsSuccess: 45,
    runsFailed: 2,
    tags: ['github', 'pr'],
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'auto-2',
    name: 'Daily Sentry Error Report',
    instructions: 'Every morning, fetch errors from last 24h, rank by users affected...',
    triggers: [{ type: 'scheduled', cron: '0 8 * * *', label: 'Daily at 8 AM' }],
    status: 'active',
    agentId: 'acheevy',
    lastRunAt: '2026-02-23T08:00:00Z',
    lastRunStatus: 'success',
    runsTotal: 22,
    runsSuccess: 21,
    runsFailed: 1,
    tags: ['sentry', 'monitoring'],
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'auto-3',
    name: 'Security Vulnerability Scan',
    instructions: 'Scan for SQL injection, XSS, hardcoded secrets, auth flaws...',
    triggers: [{ type: 'scheduled', cron: '0 6 * * *', label: 'Daily at 6 AM' }],
    status: 'paused',
    agentId: 'acheevy',
    lastRunAt: '2026-02-20T06:00:00Z',
    lastRunStatus: 'failure',
    runsTotal: 15,
    runsSuccess: 13,
    runsFailed: 2,
    tags: ['security'],
    createdAt: '2026-02-05T00:00:00Z',
  },
  {
    id: 'auto-4',
    name: 'Post-Deploy Health Monitor',
    instructions: 'After each deploy: run health checks, monitor error rates for 15 min...',
    triggers: [{ type: 'event', source: 'acheevy', event: 'deploy_complete', label: 'Deploy complete' }],
    status: 'active',
    agentId: 'acheevy',
    lastRunAt: '2026-02-22T14:30:00Z',
    lastRunStatus: 'success',
    runsTotal: 8,
    runsSuccess: 8,
    runsFailed: 0,
    tags: ['monitoring', 'deploy'],
    createdAt: '2026-02-10T00:00:00Z',
  },
];

const MOCK_RUNS: AutomationRun[] = [
  { id: 'run-1', automationId: 'auto-1', triggeredBy: 'PR #142 opened', startedAt: '2026-02-23T07:42:00Z', completedAt: '2026-02-23T07:42:18Z', status: 'success', summary: 'Generated description for PR #142: "Add mHC research module"', prsCreated: 0, messagesPosted: 1, lucCost: 0.12 },
  { id: 'run-2', automationId: 'auto-2', triggeredBy: 'Schedule: Daily 8 AM', startedAt: '2026-02-23T08:00:00Z', completedAt: '2026-02-23T08:01:45Z', status: 'success', summary: 'Posted 3 high-priority errors to #engineering-bugs, created 3 Linear tickets', prsCreated: 0, messagesPosted: 1, lucCost: 0.35 },
  { id: 'run-3', automationId: 'auto-4', triggeredBy: 'Deploy: frontend v2.4.1', startedAt: '2026-02-22T14:30:00Z', completedAt: '2026-02-22T14:45:00Z', status: 'success', summary: 'Health checks passed. No error rate regression detected. Deploy stable.', prsCreated: 0, messagesPosted: 1, lucCost: 0.28 },
  { id: 'run-4', automationId: 'auto-3', triggeredBy: 'Schedule: Daily 6 AM', startedAt: '2026-02-20T06:00:00Z', completedAt: '2026-02-20T06:03:22Z', status: 'failure', summary: 'Scan timeout: repository too large for allocated sandbox memory', prsCreated: 0, messagesPosted: 0, lucCost: 0.15 },
  { id: 'run-5', automationId: 'auto-1', triggeredBy: 'PR #141 opened', startedAt: '2026-02-22T16:10:00Z', completedAt: '2026-02-22T16:10:12Z', status: 'success', summary: 'Generated description for PR #141: "Fix auth redirect loop"', prsCreated: 0, messagesPosted: 1, lucCost: 0.10 },
];

const TEMPLATES: AutomationTemplate[] = [
  { id: 'auto-pr-description', name: 'Auto-Generate PR Descriptions', description: 'Create clear, well-formatted PR descriptions when PRs are opened.', category: 'code_quality', icon: 'file-text', instructions: 'When a PR is opened, analyze the diff and generate a description:\n1. Summarize what changed and why\n2. List key modifications\n3. Note any breaking changes\n4. Add testing instructions', defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], requiredServers: ['github'], tags: ['github', 'pr'], popularity: 95 },
  { id: 'auto-fix-sentry', name: 'Auto-Fix Sentry Errors', description: 'Generate fix PRs for new Sentry errors within seconds of detection.', category: 'bug_fixes', icon: 'wrench', instructions: 'When a new Sentry error is detected:\n1. Analyze the stack trace\n2. Find the relevant source code\n3. Generate a fix\n4. Open a PR with the fix', defaultTriggers: [{ type: 'event', source: 'sentry', event: 'new_error', label: 'New Sentry error' }], requiredServers: ['sentry', 'github'], tags: ['sentry', 'auto-fix'], popularity: 90 },
  { id: 'auto-pr-review', name: 'Automated PR Reviews', description: 'Get instant code reviews on every pull request.', category: 'code_quality', icon: 'search', instructions: 'Review this PR for:\n- Bugs and logic errors\n- Security vulnerabilities\n- Performance issues\n- Style guide compliance\n\nLeave inline comments.', defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], requiredServers: ['github'], tags: ['code-review'], popularity: 92 },
  { id: 'security-scan', name: 'Security Vulnerability Scan', description: 'Scan your codebase daily for security issues.', category: 'security', icon: 'shield', instructions: 'Scan for:\n- SQL injection\n- XSS vulnerabilities\n- Hardcoded secrets\n- Auth flaws\n\nCreate tickets for findings. Generate fix PRs for critical issues.', defaultTriggers: [{ type: 'scheduled', cron: '0 6 * * *', label: 'Daily at 6 AM' }], requiredServers: ['github', 'linear'], tags: ['security'], popularity: 85 },
  { id: 'sentry-prioritize', name: 'Prioritize Sentry Errors', description: 'Daily report of the most impactful bugs, ranked by users affected.', category: 'bug_fixes', icon: 'alert-triangle', instructions: 'Every morning:\n1. Fetch errors from last 24 hours\n2. Rank by users affected\n3. Post top 3 to #engineering-bugs\n4. Create Linear tickets for each', defaultTriggers: [{ type: 'scheduled', cron: '0 8 * * *', label: 'Daily at 8 AM' }], requiredServers: ['sentry', 'slack', 'linear'], tags: ['sentry', 'monitoring'], popularity: 88 },
  { id: 'enrich-issues', name: 'Enrich Linear Issues', description: 'Add codebase context to new Linear issues automatically.', category: 'issue_management', icon: 'layers', instructions: 'When a new issue is created:\n1. Search codebase for relevant files\n2. Find related Slack conversations\n3. Add a comment with implementation hints', defaultTriggers: [{ type: 'event', source: 'linear', event: 'issue_created', label: 'Issue created' }], requiredServers: ['linear', 'github', 'slack'], tags: ['linear', 'issues'], popularity: 78 },
  { id: 'weekly-tech-debt', name: 'Weekly Tech Debt Cleanup', description: 'Find and fix stale TODOs, unused imports, and dead code.', category: 'code_quality', icon: 'trash-2', instructions: 'Every Monday:\n1. Scan for TODO/FIXME/HACK older than 30 days\n2. Identify unused imports and dead code\n3. Create fix PRs\n4. Post summary to #engineering', defaultTriggers: [{ type: 'scheduled', cron: '0 9 * * 1', label: 'Weekly on Monday' }], requiredServers: ['github', 'slack'], tags: ['tech-debt', 'cleanup'], popularity: 75 },
  { id: 'deploy-health', name: 'Post-Deploy Health Monitor', description: 'Monitor instance health after every deployment.', category: 'monitoring', icon: 'activity', instructions: 'After deploy:\n1. Run health checks on affected instances\n2. Monitor error rates for 15 minutes\n3. Compare to pre-deploy baseline\n4. Alert if regression detected', defaultTriggers: [{ type: 'event', source: 'acheevy', event: 'deploy_complete', label: 'Deploy complete' }], requiredServers: ['github', 'slack'], tags: ['monitoring', 'deploy'], popularity: 82 },
];

// ─── Icon Map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Zap> = {
  'file-text': FileText,
  'alert-triangle': AlertTriangle,
  'search': Search,
  'shield': Shield,
  'layers': Layers,
  'wrench': Wrench,
  'trash-2': Trash2,
  'activity': Activity,
  'github': GitPullRequest,
  'bug': Bug,
  'list-checks': ListChecks,
  'message-square': MessageSquare,
  'zap': Zap,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Zap;
}

// ─── Status & Trigger Badges ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: AutomationStatus }) {
  const styles: Record<AutomationStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-slate-50 text-slate-500 border-slate-200',
    archived: 'bg-slate-50 text-slate-400 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : status === 'paused' ? 'bg-amber-500' : 'bg-slate-300'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RunStatusIcon({ status }: { status: RunStatus }) {
  switch (status) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'failure': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'timeout': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'cancelled': return <XCircle className="w-4 h-4 text-slate-300" />;
  }
}

function TriggerBadge({ trigger }: { trigger: AutomationTrigger }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-md bg-slate-50 text-slate-500 border border-slate-200">
      {trigger.type === 'scheduled' ? <CalendarClock className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
      {trigger.label}
    </span>
  );
}

// ─── Tab Views ───────────────────────────────────────────────────────────────

type TabKey = 'automations' | 'templates' | 'history';

function AutomationsList({ automations, onSelect }: { automations: Automation[]; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {automations.map(auto => (
        <button
          key={auto.id}
          onClick={() => onSelect(auto.id)}
          className="w-full text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-200 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="text-sm font-medium text-slate-800 truncate">{auto.name}</h3>
                <StatusBadge status={auto.status} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {auto.triggers.map((t, i) => <TriggerBadge key={i} trigger={t} />)}
                {auto.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {auto.lastRunStatus && <RunStatusIcon status={auto.lastRunStatus} />}
                  <span>{auto.lastRunAt ? timeAgo(auto.lastRunAt) : 'Never'}</span>
                </div>
                <div className="mt-0.5">
                  <span className="text-emerald-600">{auto.runsSuccess}</span>
                  <span className="mx-0.5">/</span>
                  <span className={auto.runsFailed > 0 ? 'text-red-500' : ''}>{auto.runsFailed}</span>
                  <span className="ml-1 text-slate-300">runs</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function TemplateGrid({ templates, onUse }: { templates: AutomationTemplate[]; onUse: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {templates.map(tpl => {
        const Icon = getIcon(tpl.icon);
        return (
          <div
            key={tpl.id}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-800 mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tpl.description}</p>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {tpl.defaultTriggers.map((t, i) => <TriggerBadge key={i} trigger={t} />)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {tpl.requiredServers.map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 capitalize">{s}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => onUse(tpl.id)}
                    className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-medium border border-amber-200"
                  >
                    Use template
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RunHistory({ runs }: { runs: AutomationRun[] }) {
  return (
    <div className="space-y-2">
      {runs.map(run => (
        <div
          key={run.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-white border border-slate-200"
        >
          <RunStatusIcon status={run.status} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-700 truncate">{run.summary}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Triggered by: {run.triggeredBy}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 shrink-0">
            <div>{timeAgo(run.startedAt)}</div>
            <div className="mt-0.5">
              {run.prsCreated > 0 && <span className="text-emerald-600">{run.prsCreated} PR{run.prsCreated > 1 ? 's' : ''}</span>}
              {run.prsCreated > 0 && run.messagesPosted > 0 && <span className="mx-1">|</span>}
              {run.messagesPosted > 0 && <span>{run.messagesPosted} msg</span>}
              <span className="ml-2 text-amber-600/60">{run.lucCost.toFixed(2)} LUC</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Automation Detail Panel ─────────────────────────────────────────────────

function AutomationDetail({
  automation,
  runs,
  onClose,
}: {
  automation: Automation;
  runs: AutomationRun[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 mb-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back to Automations
          </button>
          <h2 className="text-lg font-semibold text-slate-800">{automation.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={automation.status} />
            {automation.triggers.map((t, i) => <TriggerBadge key={i} trigger={t} />)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
            <Play className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
            <Pause className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Runs', value: automation.runsTotal.toString() },
          { label: 'Success Rate', value: automation.runsTotal > 0 ? `${Math.round((automation.runsSuccess / automation.runsTotal) * 100)}%` : '-' },
          { label: 'Last Run', value: automation.lastRunAt ? timeAgo(automation.lastRunAt) : 'Never' },
          { label: 'Total LUC', value: runs.filter(r => r.automationId === automation.id).reduce((a, b) => a + b.lucCost, 0).toFixed(2) },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</div>
            <div className="text-lg font-semibold text-slate-800 mt-0.5">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Instructions</h3>
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-mono">{automation.instructions}</pre>
        </div>
      </div>

      {/* Run History */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Recent Runs</h3>
        <RunHistory runs={runs.filter(r => r.automationId === automation.id)} />
      </div>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('automations');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAutomations = useMemo(() => {
    return MOCK_AUTOMATIONS.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, searchQuery]);

  const selectedAutomation = MOCK_AUTOMATIONS.find(a => a.id === selectedId);

  const tabs: { key: TabKey; label: string; icon: typeof Zap; count?: number }[] = [
    { key: 'automations', label: 'My Automations', icon: Zap, count: MOCK_AUTOMATIONS.filter(a => a.status === 'active').length },
    { key: 'templates', label: 'Templates', icon: Layers, count: TEMPLATES.length },
    { key: 'history', label: 'Run History', icon: Clock },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Automations</h1>
          </div>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Run coding agents on a schedule or triggered by events. Automate bug fixes, documentation updates, security scans, and technical debt — all without lifting a finger.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Automation
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200 pb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedId(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                isActive
                  ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {selectedAutomation ? (
        <AutomationDetail
          automation={selectedAutomation}
          runs={MOCK_RUNS}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        <>
          {activeTab === 'automations' && (
            <>
              {/* Filter Bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search automations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-slate-300" />
                  {(['all', 'active', 'paused', 'draft'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        statusFilter === s
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'text-slate-400 hover:text-slate-600 border border-transparent'
                      }`}
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAutomations.length > 0 ? (
                <AutomationsList automations={filteredAutomations} onSelect={setSelectedId} />
              ) : (
                <div className="text-center py-16">
                  <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No automations found</p>
                  <button className="mt-4 text-sm text-amber-600 hover:text-amber-700 transition-colors">
                    Browse templates to get started
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'templates' && (
            <TemplateGrid templates={TEMPLATES} onUse={(id) => { /* TODO: Create from template */ }} />
          )}

          {activeTab === 'history' && (
            <RunHistory runs={MOCK_RUNS} />
          )}
        </>
      )}
    </div>
  );
}
