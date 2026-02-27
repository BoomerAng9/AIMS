'use client';

// frontend/app/dashboard/automations/page.tsx
// Automations Hub — Agent automations, Paperform forms, and Stepper workflows
// Data comes from API endpoints — no hardcoded mock data.
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Zap, Plus, Play, Pause, Clock, GitPullRequest,
  AlertTriangle, Shield, Search, FileText, Layers, Wrench,
  Activity, Trash2, ChevronRight, MoreHorizontal, Filter,
  CalendarClock, Radio, CheckCircle2, XCircle, Loader2,
  MessageSquare, Bug, ListChecks, Settings,
  ClipboardList, UserPlus, Star, LifeBuoy, Calendar, CreditCard,
  Rocket, BarChart3, GitBranch, Users, Ticket, CalendarCheck,
  Brain, UserX, ExternalLink, ArrowRight, Link2, Eye, Hash,
} from 'lucide-react';

// ─── Shared Types ────────────────────────────────────────────────────────────

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

// ─── Form Types ──────────────────────────────────────────────────────────────

type FormCategory = 'onboarding' | 'needs_analysis' | 'feedback' | 'support' | 'booking' | 'payment' | 'survey' | 'custom';

interface FormEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: FormCategory;
  status: 'live' | 'draft' | 'archived';
  pageCount: number;
  fieldCount: number;
  submissionCount: number;
  partialCount: number;
  accent: string;
  stepperWorkflowIds: string[];
  tags: string[];
  updatedAt: string;
}

// ─── Stepper Types ───────────────────────────────────────────────────────────

interface StepperWorkflowEntry {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  triggerLabel: string;
  connectedFormId: string | null;
  stepsCount: number;
  appsUsed: string[];
  runsTotal: number;
  runsSuccess: number;
  runsFailed: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  creditsCostTotal: number;
  tags: string[];
  recentRuns: { id: string; triggeredBy: string; startedAt: string; status: string; creditsCost: number; summary: string }[];
}

// ─── Automation Templates (these are real product templates, not fake data) ──

const TEMPLATES: AutomationTemplate[] = [
  { id: 'auto-pr-description', name: 'Auto-Generate PR Descriptions', description: 'Create clear PR descriptions when PRs are opened.', category: 'code_quality', icon: 'file-text', instructions: '', defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], requiredServers: ['github'], tags: ['github', 'pr'], popularity: 95 },
  { id: 'auto-fix-sentry', name: 'Auto-Fix Sentry Errors', description: 'Generate fix PRs for new Sentry errors.', category: 'bug_fixes', icon: 'wrench', instructions: '', defaultTriggers: [{ type: 'event', source: 'sentry', event: 'new_error', label: 'New Sentry error' }], requiredServers: ['sentry', 'github'], tags: ['sentry', 'auto-fix'], popularity: 90 },
  { id: 'auto-pr-review', name: 'Automated PR Reviews', description: 'Instant code reviews on every pull request.', category: 'code_quality', icon: 'search', instructions: '', defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], requiredServers: ['github'], tags: ['code-review'], popularity: 92 },
  { id: 'security-scan', name: 'Security Vulnerability Scan', description: 'Scan your codebase daily for security issues.', category: 'security', icon: 'shield', instructions: '', defaultTriggers: [{ type: 'scheduled', cron: '0 6 * * *', label: 'Daily at 6 AM' }], requiredServers: ['github', 'linear'], tags: ['security'], popularity: 85 },
  { id: 'sentry-prioritize', name: 'Prioritize Sentry Errors', description: 'Daily report ranked by users affected.', category: 'bug_fixes', icon: 'alert-triangle', instructions: '', defaultTriggers: [{ type: 'scheduled', cron: '0 8 * * *', label: 'Daily at 8 AM' }], requiredServers: ['sentry', 'slack', 'linear'], tags: ['sentry', 'monitoring'], popularity: 88 },
  { id: 'deploy-health', name: 'Post-Deploy Health Monitor', description: 'Monitor health after every deployment.', category: 'monitoring', icon: 'activity', instructions: '', defaultTriggers: [{ type: 'event', source: 'acheevy', event: 'deploy_complete', label: 'Deploy complete' }], requiredServers: ['github', 'slack'], tags: ['monitoring', 'deploy'], popularity: 82 },
];

// ─── Icon Maps ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Zap> = {
  'file-text': FileText, 'alert-triangle': AlertTriangle, 'search': Search,
  'shield': Shield, 'layers': Layers, 'wrench': Wrench, 'trash-2': Trash2,
  'activity': Activity, 'github': GitPullRequest, 'bug': Bug,
  'list-checks': ListChecks, 'message-square': MessageSquare, 'zap': Zap,
};

const FORM_ICON_MAP: Record<FormCategory, typeof Zap> = {
  onboarding: UserPlus, needs_analysis: ClipboardList, feedback: Star,
  support: LifeBuoy, booking: Calendar, payment: CreditCard,
  survey: BarChart3, custom: FileText,
};

const CATEGORY_LABELS: Record<FormCategory, string> = {
  onboarding: 'Onboarding', needs_analysis: 'Needs Analysis', feedback: 'Feedback',
  support: 'Support', booking: 'Booking', payment: 'Payment',
  survey: 'Survey', custom: 'Custom',
};

function getIcon(name: string) { return ICON_MAP[name] || Zap; }

// ─── Shared UI Components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    draft: 'bg-zinc-800 text-zinc-400 border-white/10',
    archived: 'bg-zinc-800 text-zinc-500 border-white/10',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const dotColor: Record<string, string> = {
    active: 'bg-emerald-500 animate-pulse', live: 'bg-emerald-500 animate-pulse',
    paused: 'bg-amber-500', error: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${styles[status] || styles.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] || 'bg-zinc-600'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RunStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'failure': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'timeout': return <Clock className="w-4 h-4 text-amber-500" />;
    default: return <XCircle className="w-4 h-4 text-zinc-600" />;
  }
}

function TriggerBadge({ trigger }: { trigger: AutomationTrigger }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-md bg-zinc-800 text-zinc-400 border border-white/10">
      {trigger.type === 'scheduled' ? <CalendarClock className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
      {trigger.label}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-lg bg-[#111113] border border-white/10">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${accent || 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}

// ─── Empty State Component ───────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: {
  icon: typeof Zap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-zinc-600" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Automations Tab Content ─────────────────────────────────────────────────

function AutomationsList({ automations, onSelect }: { automations: Automation[]; onSelect: (id: string) => void }) {
  if (automations.length === 0) {
    return <EmptyState icon={Zap} title="No automations yet" description="Create your first automation to run tasks on a schedule or in response to events." actionLabel="Create Automation" onAction={() => {}} />;
  }
  return (
    <div className="space-y-3">
      {automations.map(auto => (
        <button key={auto.id} onClick={() => onSelect(auto.id)} className="w-full text-left p-4 rounded-xl bg-[#111113] border border-white/10 hover:border-amber-500/20 transition-all group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="text-sm font-medium text-zinc-100 truncate">{auto.name}</h3>
                <StatusBadge status={auto.status} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {auto.triggers.map((t, i) => <TriggerBadge key={i} trigger={t} />)}
                {auto.tags.map(tag => <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{tag}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {auto.lastRunStatus && <RunStatusIcon status={auto.lastRunStatus} />}
                  <span>{auto.lastRunAt ? timeAgo(auto.lastRunAt) : 'Never'}</span>
                </div>
                <div className="mt-0.5">
                  <span className="text-emerald-600">{auto.runsSuccess}</span>/<span className={auto.runsFailed > 0 ? 'text-red-500' : ''}>{auto.runsFailed}</span>
                  <span className="ml-1 text-zinc-600">runs</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function AutomationDetail({ automation, runs, onClose }: { automation: Automation; runs: AutomationRun[]; onClose: () => void }) {
  const autoRuns = runs.filter(r => r.automationId === automation.id);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300 mb-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back
          </button>
          <h2 className="text-lg font-semibold text-zinc-100">{automation.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={automation.status} />
            {automation.triggers.map((t, i) => <TriggerBadge key={i} trigger={t} />)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[Play, Pause, Settings, MoreHorizontal].map((Icon, i) => (
            <button key={i} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors border border-white/10">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Runs" value={automation.runsTotal.toString()} />
        <StatCard label="Success Rate" value={automation.runsTotal > 0 ? `${Math.round((automation.runsSuccess / automation.runsTotal) * 100)}%` : '-'} />
        <StatCard label="Last Run" value={automation.lastRunAt ? timeAgo(automation.lastRunAt) : 'Never'} />
        <StatCard label="Total LUC" value={autoRuns.reduce((a, b) => a + b.lucCost, 0).toFixed(2)} />
      </div>
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Instructions</h3>
        <div className="p-4 rounded-lg bg-zinc-800 border border-white/10">
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">{automation.instructions}</pre>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Recent Runs</h3>
        <AutomationRunHistory runs={autoRuns} />
      </div>
    </div>
  );
}

function AutomationRunHistory({ runs }: { runs: AutomationRun[] }) {
  if (runs.length === 0) return <p className="text-sm text-zinc-500">No runs yet.</p>;
  return (
    <div className="space-y-2">
      {runs.map(run => (
        <div key={run.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#111113] border border-white/10">
          <RunStatusIcon status={run.status} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-200 truncate">{run.summary}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Triggered by: {run.triggeredBy}</div>
          </div>
          <div className="text-right text-xs text-zinc-500 shrink-0">
            <div>{timeAgo(run.startedAt)}</div>
            <div className="mt-0.5">
              {run.prsCreated > 0 && <span className="text-emerald-600">{run.prsCreated} PR{run.prsCreated > 1 ? 's' : ''}</span>}
              {run.messagesPosted > 0 && <span className="ml-1">{run.messagesPosted} msg</span>}
              <span className="ml-2 text-amber-500/60">{run.lucCost.toFixed(2)} LUC</span>
            </div>
          </div>
        </div>
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
          <div key={tpl.id} className="p-4 rounded-xl bg-[#111113] border border-white/10 hover:border-amber-500/20 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-zinc-100 mb-1">{tpl.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{tpl.description}</p>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {tpl.defaultTriggers.map((t, i) => <TriggerBadge key={i} trigger={t} />)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {tpl.requiredServers.map(s => <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize">{s}</span>)}
                  </div>
                  <button onClick={() => onUse(tpl.id)} className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 transition-colors font-medium border border-amber-500/20">
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

// ─── Forms Library Tab ───────────────────────────────────────────────────────

function FormsLibrary({ forms }: { forms: FormEntry[] }) {
  const [categoryFilter, setCategoryFilter] = useState<FormCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return forms.filter(f => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.tags.some(t => t.includes(q));
      }
      return true;
    });
  }, [forms, categoryFilter, searchQuery]);

  if (forms.length === 0) {
    return <EmptyState icon={ClipboardList} title="No forms connected" description="Connect your Paperform account via Pipedream MCP to see your forms here. Forms are designed in Paperform editor." />;
  }

  const totalSubs = forms.reduce((s, f) => s + f.submissionCount, 0);
  const totalPartials = forms.reduce((s, f) => s + f.partialCount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Forms" value={forms.length.toString()} />
        <StatCard label="Submissions" value={totalSubs.toLocaleString()} accent="text-emerald-400" />
        <StatCard label="Partial / Abandoned" value={totalPartials.toString()} accent="text-amber-400" />
        <StatCard label="Live Forms" value={forms.filter(f => f.status === 'live').length.toString()} accent="text-blue-400" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input type="text" placeholder="Search forms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#111113] border border-white/10 rounded-lg text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-500/20" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-600" />
          {(['all', 'onboarding', 'needs_analysis', 'feedback', 'support', 'booking', 'payment', 'survey'] as const).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${categoryFilter === c ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(form => {
          const Icon = FORM_ICON_MAP[form.category] || FileText;
          return (
            <div key={form.id} className="text-left p-4 rounded-xl bg-[#111113] border border-white/10 hover:border-amber-500/20 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${form.accent}15` }}>
                  <Icon className="w-5 h-5" style={{ color: form.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-zinc-100 truncate">{form.name}</h3>
                    <StatusBadge status={form.status} />
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mb-2">{form.description}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{form.pageCount} pages</span>
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{form.fieldCount} fields</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{form.submissionCount} subs</span>
                  </div>
                  <div className="flex gap-1">
                    {form.tags.slice(0, 3).map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No forms match your filters</p>
        </div>
      )}
    </div>
  );
}

// ─── Stepper Workflows Tab ───────────────────────────────────────────────────

function StepperWorkflows({ workflows }: { workflows: StepperWorkflowEntry[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');

  const filtered = useMemo(() => {
    return workflows.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.tags.some(t => t.includes(q));
      }
      return true;
    });
  }, [workflows, searchQuery, statusFilter]);

  if (workflows.length === 0) {
    return <EmptyState icon={GitBranch} title="No Stepper workflows" description="Connect Stepper.io to automate post-submission workflows. Workflows are configured in the Stepper dashboard." />;
  }

  const totalRuns = workflows.reduce((s, w) => s + w.runsTotal, 0);
  const totalCredits = workflows.reduce((s, w) => s + w.creditsCostTotal, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Workflows" value={workflows.length.toString()} />
        <StatCard label="Total Runs" value={totalRuns.toLocaleString()} accent="text-emerald-400" />
        <StatCard label="Active" value={workflows.filter(w => w.status === 'active').length.toString()} accent="text-blue-400" />
        <StatCard label="Credits Used" value={totalCredits.toFixed(1)} accent="text-amber-400" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input type="text" placeholder="Search workflows..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#111113] border border-white/10 rounded-lg text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-500/20" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-zinc-600" />
          {(['all', 'active', 'paused', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${statusFilter === s ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(wf => (
          <div key={wf.id} className="w-full text-left p-4 rounded-xl bg-[#111113] border border-white/10 hover:border-blue-500/20 transition-all group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <GitBranch className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-zinc-100 truncate">{wf.name}</h3>
                    <StatusBadge status={wf.status} />
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mb-2">{wf.description}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                    <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{wf.triggerLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{wf.stepsCount} steps</span>
                    {wf.appsUsed.slice(0, 4).map(app => (
                      <span key={app} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize">{app.replace(/_/g, ' ')}</span>
                    ))}
                    {wf.appsUsed.length > 4 && <span className="text-xs text-zinc-600">+{wf.appsUsed.length - 4} more</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {wf.lastRunStatus && <RunStatusIcon status={wf.lastRunStatus} />}
                    <span>{wf.lastRunAt ? timeAgo(wf.lastRunAt) : 'Never'}</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-emerald-600">{wf.runsSuccess}</span>/<span className={wf.runsFailed > 0 ? 'text-red-500' : ''}>{wf.runsFailed}</span>
                    <span className="ml-1 text-zinc-600">runs</span>
                  </div>
                  {wf.creditsCostTotal > 0 && <div className="mt-0.5 text-amber-500/60">{wf.creditsCostTotal.toFixed(1)} credits</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <GitBranch className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No workflows match your filters</p>
        </div>
      )}
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

type TabKey = 'automations' | 'forms' | 'stepper' | 'templates' | 'history';

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('automations');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetched from API (starts empty — no fake data)
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [stepperWorkflows, setStepperWorkflows] = useState<StepperWorkflowEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch forms from API
  const fetchForms = useCallback(async () => {
    try {
      const res = await fetch('/api/forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms || []);
      }
    } catch {
      // API not available yet — leave empty
    }
  }, []);

  // Fetch stepper workflows from API
  const fetchStepper = useCallback(async () => {
    try {
      const res = await fetch('/api/stepper');
      if (res.ok) {
        const data = await res.json();
        setStepperWorkflows(data.workflows || []);
      }
    } catch {
      // API not available yet — leave empty
    }
  }, []);

  useEffect(() => {
    fetchForms();
    fetchStepper();
  }, [fetchForms, fetchStepper]);

  const filteredAutomations = useMemo(() => {
    return automations.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [automations, statusFilter, searchQuery]);

  const selectedAutomation = automations.find(a => a.id === selectedId);

  const tabs: { key: TabKey; label: string; icon: typeof Zap; count?: number }[] = [
    { key: 'automations', label: 'Automations', icon: Zap, count: automations.filter(a => a.status === 'active').length },
    { key: 'forms', label: 'Form Library', icon: ClipboardList, count: forms.length },
    { key: 'stepper', label: 'Stepper Flows', icon: GitBranch, count: stepperWorkflows.filter(w => w.status === 'active').length },
    { key: 'templates', label: 'Templates', icon: Layers, count: TEMPLATES.length },
    { key: 'history', label: 'Run History', icon: Clock },
  ];

  const handleBack = () => setSelectedId(null);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-500/20">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Automations</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl">
            Agent automations, Paperform intake library, and Stepper post-submission workflows — all in one place.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-zinc-100 font-medium text-sm hover:bg-amber-700 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/10 pb-px overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedId(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-amber-400 border-b-2 border-amber-600 bg-amber-500/5'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'automations' && selectedAutomation ? (
        <AutomationDetail automation={selectedAutomation} runs={runs} onClose={handleBack} />
      ) : (
        <>
          {activeTab === 'automations' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input type="text" placeholder="Search automations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#111113] border border-white/10 rounded-lg text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-500/20" />
                </div>
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-zinc-600" />
                  {(['all', 'active', 'paused', 'draft'] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${statusFilter === s ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <AutomationsList automations={filteredAutomations} onSelect={setSelectedId} />
            </>
          )}

          {activeTab === 'forms' && (
            <FormsLibrary forms={forms} />
          )}

          {activeTab === 'stepper' && (
            <StepperWorkflows workflows={stepperWorkflows} />
          )}

          {activeTab === 'templates' && (
            <TemplateGrid templates={TEMPLATES} onUse={() => {}} />
          )}

          {activeTab === 'history' && (
            runs.length > 0
              ? <AutomationRunHistory runs={runs} />
              : <EmptyState icon={Clock} title="No run history" description="Automation runs will appear here once you create and execute automations." />
          )}
        </>
      )}
    </div>
  );
}
