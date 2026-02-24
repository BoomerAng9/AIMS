'use client';

// frontend/app/dashboard/automations/page.tsx
// Automations Hub — Agent automations, Paperform library, and Stepper workflows
import { useState, useMemo } from 'react';
import {
  Zap, Plus, Play, Pause, Clock, GitPullRequest,
  AlertTriangle, Shield, Search, FileText, Layers, Wrench,
  Activity, Trash2, ChevronRight, MoreHorizontal, Filter,
  CalendarClock, Radio, CheckCircle2, XCircle, Loader2,
  MessageSquare, Bug, ListChecks, Settings,
  // Forms & Stepper icons
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

// ─── Mock Data: Automations ──────────────────────────────────────────────────

const MOCK_AUTOMATIONS: Automation[] = [
  { id: 'auto-1', name: 'Auto-Generate PR Descriptions', instructions: 'When a PR is opened, analyze the diff and generate a description...', triggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], status: 'active', agentId: 'acheevy', lastRunAt: '2026-02-23T07:42:00Z', lastRunStatus: 'success', runsTotal: 47, runsSuccess: 45, runsFailed: 2, tags: ['github', 'pr'], createdAt: '2026-02-01T00:00:00Z' },
  { id: 'auto-2', name: 'Daily Sentry Error Report', instructions: 'Every morning, fetch errors from last 24h, rank by users affected...', triggers: [{ type: 'scheduled', cron: '0 8 * * *', label: 'Daily at 8 AM' }], status: 'active', agentId: 'acheevy', lastRunAt: '2026-02-23T08:00:00Z', lastRunStatus: 'success', runsTotal: 22, runsSuccess: 21, runsFailed: 1, tags: ['sentry', 'monitoring'], createdAt: '2026-02-01T00:00:00Z' },
  { id: 'auto-3', name: 'Security Vulnerability Scan', instructions: 'Scan for SQL injection, XSS, hardcoded secrets, auth flaws...', triggers: [{ type: 'scheduled', cron: '0 6 * * *', label: 'Daily at 6 AM' }], status: 'paused', agentId: 'acheevy', lastRunAt: '2026-02-20T06:00:00Z', lastRunStatus: 'failure', runsTotal: 15, runsSuccess: 13, runsFailed: 2, tags: ['security'], createdAt: '2026-02-05T00:00:00Z' },
  { id: 'auto-4', name: 'Post-Deploy Health Monitor', instructions: 'After each deploy: run health checks, monitor error rates for 15 min...', triggers: [{ type: 'event', source: 'acheevy', event: 'deploy_complete', label: 'Deploy complete' }], status: 'active', agentId: 'acheevy', lastRunAt: '2026-02-22T14:30:00Z', lastRunStatus: 'success', runsTotal: 8, runsSuccess: 8, runsFailed: 0, tags: ['monitoring', 'deploy'], createdAt: '2026-02-10T00:00:00Z' },
];

const MOCK_RUNS: AutomationRun[] = [
  { id: 'run-1', automationId: 'auto-1', triggeredBy: 'PR #142 opened', startedAt: '2026-02-23T07:42:00Z', completedAt: '2026-02-23T07:42:18Z', status: 'success', summary: 'Generated description for PR #142: "Add mHC research module"', prsCreated: 0, messagesPosted: 1, lucCost: 0.12 },
  { id: 'run-2', automationId: 'auto-2', triggeredBy: 'Schedule: Daily 8 AM', startedAt: '2026-02-23T08:00:00Z', completedAt: '2026-02-23T08:01:45Z', status: 'success', summary: 'Posted 3 high-priority errors to #engineering-bugs, created 3 Linear tickets', prsCreated: 0, messagesPosted: 1, lucCost: 0.35 },
  { id: 'run-3', automationId: 'auto-4', triggeredBy: 'Deploy: frontend v2.4.1', startedAt: '2026-02-22T14:30:00Z', completedAt: '2026-02-22T14:45:00Z', status: 'success', summary: 'Health checks passed. No error rate regression detected.', prsCreated: 0, messagesPosted: 1, lucCost: 0.28 },
  { id: 'run-4', automationId: 'auto-3', triggeredBy: 'Schedule: Daily 6 AM', startedAt: '2026-02-20T06:00:00Z', completedAt: '2026-02-20T06:03:22Z', status: 'failure', summary: 'Scan timeout: repository too large for allocated sandbox memory', prsCreated: 0, messagesPosted: 0, lucCost: 0.15 },
  { id: 'run-5', automationId: 'auto-1', triggeredBy: 'PR #141 opened', startedAt: '2026-02-22T16:10:00Z', completedAt: '2026-02-22T16:10:12Z', status: 'success', summary: 'Generated description for PR #141: "Fix auth redirect loop"', prsCreated: 0, messagesPosted: 1, lucCost: 0.10 },
];

const TEMPLATES: AutomationTemplate[] = [
  { id: 'auto-pr-description', name: 'Auto-Generate PR Descriptions', description: 'Create clear PR descriptions when PRs are opened.', category: 'code_quality', icon: 'file-text', instructions: '', defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], requiredServers: ['github'], tags: ['github', 'pr'], popularity: 95 },
  { id: 'auto-fix-sentry', name: 'Auto-Fix Sentry Errors', description: 'Generate fix PRs for new Sentry errors.', category: 'bug_fixes', icon: 'wrench', instructions: '', defaultTriggers: [{ type: 'event', source: 'sentry', event: 'new_error', label: 'New Sentry error' }], requiredServers: ['sentry', 'github'], tags: ['sentry', 'auto-fix'], popularity: 90 },
  { id: 'auto-pr-review', name: 'Automated PR Reviews', description: 'Instant code reviews on every pull request.', category: 'code_quality', icon: 'search', instructions: '', defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }], requiredServers: ['github'], tags: ['code-review'], popularity: 92 },
  { id: 'security-scan', name: 'Security Vulnerability Scan', description: 'Scan your codebase daily for security issues.', category: 'security', icon: 'shield', instructions: '', defaultTriggers: [{ type: 'scheduled', cron: '0 6 * * *', label: 'Daily at 6 AM' }], requiredServers: ['github', 'linear'], tags: ['security'], popularity: 85 },
  { id: 'sentry-prioritize', name: 'Prioritize Sentry Errors', description: 'Daily report ranked by users affected.', category: 'bug_fixes', icon: 'alert-triangle', instructions: '', defaultTriggers: [{ type: 'scheduled', cron: '0 8 * * *', label: 'Daily at 8 AM' }], requiredServers: ['sentry', 'slack', 'linear'], tags: ['sentry', 'monitoring'], popularity: 88 },
  { id: 'deploy-health', name: 'Post-Deploy Health Monitor', description: 'Monitor health after every deployment.', category: 'monitoring', icon: 'activity', instructions: '', defaultTriggers: [{ type: 'event', source: 'acheevy', event: 'deploy_complete', label: 'Deploy complete' }], requiredServers: ['github', 'slack'], tags: ['monitoring', 'deploy'], popularity: 82 },
];

// ─── Mock Data: Form Library ─────────────────────────────────────────────────

const FORM_LIBRARY: FormEntry[] = [
  { id: 'form-onboarding-intake', slug: 'aims-onboarding-needs-analysis', name: 'Onboarding Needs Analysis', description: 'First form every new user completes. Captures identity, goals, and service routing.', category: 'onboarding', status: 'live', pageCount: 5, fieldCount: 18, submissionCount: 142, partialCount: 23, accent: '#F59E0B', stepperWorkflowIds: ['stepper-onboarding-pipeline'], tags: ['onboarding', 'intake', 'critical'], updatedAt: '2026-02-20T00:00:00Z' },
  { id: 'form-plug-needs', slug: 'aims-plug-needs-analysis', name: 'Plug Needs Analysis', description: 'Deep-dive requirements for plug recommendation and enterprise deployments.', category: 'needs_analysis', status: 'live', pageCount: 3, fieldCount: 9, submissionCount: 67, partialCount: 12, accent: '#3B82F6', stepperWorkflowIds: ['stepper-needs-analysis-pipeline'], tags: ['enterprise', 'needs-analysis'], updatedAt: '2026-02-18T00:00:00Z' },
  { id: 'form-feedback-nps', slug: 'aims-feedback-nps', name: 'Feedback & NPS Survey', description: 'Post-delivery satisfaction survey with Net Promoter Score tracking.', category: 'feedback', status: 'live', pageCount: 1, fieldCount: 6, submissionCount: 89, partialCount: 8, accent: '#10B981', stepperWorkflowIds: ['stepper-feedback-processor'], tags: ['feedback', 'nps'], updatedAt: '2026-02-15T00:00:00Z' },
  { id: 'form-support-request', slug: 'aims-support-request', name: 'Support Request', description: 'Structured issue intake with urgency triage and auto-ticket creation.', category: 'support', status: 'live', pageCount: 1, fieldCount: 6, submissionCount: 34, partialCount: 2, accent: '#EF4444', stepperWorkflowIds: ['stepper-support-triage'], tags: ['support', 'triage'], updatedAt: '2026-02-22T00:00:00Z' },
  { id: 'form-consultation-booking', slug: 'aims-consultation-booking', name: 'Consultation Booking', description: 'Calendar-connected booking form with auto-confirmation.', category: 'booking', status: 'live', pageCount: 1, fieldCount: 8, submissionCount: 28, partialCount: 5, accent: '#8B5CF6', stepperWorkflowIds: ['stepper-booking-confirm'], tags: ['booking', 'calendar'], updatedAt: '2026-02-21T00:00:00Z' },
  { id: 'form-service-payment', slug: 'aims-service-payment', name: 'Service Payment', description: 'Stripe-connected payment collection for consulting and premium services.', category: 'payment', status: 'live', pageCount: 1, fieldCount: 6, submissionCount: 19, partialCount: 7, accent: '#F59E0B', stepperWorkflowIds: ['stepper-payment-receipt'], tags: ['payment', 'stripe'], updatedAt: '2026-02-22T00:00:00Z' },
  { id: 'form-project-kickoff', slug: 'aims-project-kickoff', name: 'Project Kickoff Brief', description: 'Detailed scope form for custom builds — objectives, deliverables, constraints.', category: 'needs_analysis', status: 'live', pageCount: 2, fieldCount: 7, submissionCount: 15, partialCount: 4, accent: '#3B82F6', stepperWorkflowIds: ['stepper-project-setup'], tags: ['project', 'kickoff'], updatedAt: '2026-02-22T00:00:00Z' },
  { id: 'form-satisfaction-survey', slug: 'aims-satisfaction-survey', name: 'Client Satisfaction Survey', description: 'Quarterly survey for active clients — quality, reliability, expansion.', category: 'survey', status: 'live', pageCount: 2, fieldCount: 6, submissionCount: 52, partialCount: 11, accent: '#10B981', stepperWorkflowIds: ['stepper-survey-processor'], tags: ['survey', 'quarterly'], updatedAt: '2026-02-20T00:00:00Z' },
];

// ─── Mock Data: Stepper Workflows ────────────────────────────────────────────

const STEPPER_WORKFLOWS: StepperWorkflowEntry[] = [
  { id: 'stepper-onboarding-pipeline', name: 'Onboarding Intake Pipeline', description: 'Validate → Firestore → Notion → Drive → email → calendar → ACHEEVY.', status: 'active', triggerLabel: 'New submission on Onboarding Needs Analysis', connectedFormId: 'form-onboarding-intake', stepsCount: 8, appsUsed: ['anthropic', 'firestore', 'notion', 'google_drive', 'gmail', 'google_calendar', 'acheevy'], runsTotal: 142, runsSuccess: 138, runsFailed: 4, lastRunAt: '2026-02-23T14:20:00Z', lastRunStatus: 'success', creditsCostTotal: 412.5, tags: ['onboarding', 'critical'], recentRuns: [{ id: 'sr-1', triggeredBy: 'Sarah Chen', startedAt: '2026-02-23T14:20:00Z', status: 'success', creditsCost: 3.2, summary: 'Notion + Drive + email + calendar' }, { id: 'sr-2', triggeredBy: 'Marcus Rivera', startedAt: '2026-02-22T09:15:00Z', status: 'success', creditsCost: 2.8, summary: 'Full pipeline (no consultation)' }] },
  { id: 'stepper-needs-analysis-pipeline', name: 'Needs Analysis → Plug Recommendation', description: 'AI-analyze requirements → match plugs → report → notify.', status: 'active', triggerLabel: 'New submission on Plug Needs Analysis', connectedFormId: 'form-plug-needs', stepsCount: 5, appsUsed: ['anthropic', 'firestore', 'notion', 'gmail', 'acheevy'], runsTotal: 67, runsSuccess: 64, runsFailed: 3, lastRunAt: '2026-02-23T11:00:00Z', lastRunStatus: 'success', creditsCostTotal: 268.0, tags: ['enterprise', 'recommendation'], recentRuns: [{ id: 'sr-3', triggeredBy: 'TechCorp Inc', startedAt: '2026-02-23T11:00:00Z', status: 'success', creditsCost: 4.1, summary: 'Recommended OpenClaw Pro' }] },
  { id: 'stepper-feedback-processor', name: 'Feedback & NPS Processor', description: 'Sentiment analysis → NPS classify → Sheets → detractor alert.', status: 'active', triggerLabel: 'New submission on Feedback & NPS Survey', connectedFormId: 'form-feedback-nps', stepsCount: 6, appsUsed: ['anthropic', 'google_sheets', 'slack', 'gmail'], runsTotal: 89, runsSuccess: 87, runsFailed: 2, lastRunAt: '2026-02-23T10:30:00Z', lastRunStatus: 'success', creditsCostTotal: 102.3, tags: ['feedback', 'nps'], recentRuns: [{ id: 'sr-4', triggeredBy: 'Alex Kim (NPS: 9)', startedAt: '2026-02-23T10:30:00Z', status: 'success', creditsCost: 1.2, summary: 'Promoter logged, testimonial requested' }] },
  { id: 'stepper-support-triage', name: 'Support Request Triage', description: 'AI classify → Linear ticket → Slack → ack email.', status: 'active', triggerLabel: 'New submission on Support Request', connectedFormId: 'form-support-request', stepsCount: 5, appsUsed: ['anthropic', 'linear', 'slack', 'gmail', 'acheevy'], runsTotal: 34, runsSuccess: 33, runsFailed: 1, lastRunAt: '2026-02-23T08:00:00Z', lastRunStatus: 'success', creditsCostTotal: 68.4, tags: ['support', 'triage'], recentRuns: [{ id: 'sr-5', triggeredBy: 'Auth redirect (Critical)', startedAt: '2026-02-23T08:00:00Z', status: 'success', creditsCost: 2.1, summary: 'Ticket ENG-412 created' }] },
  { id: 'stepper-booking-confirm', name: 'Booking Confirmation', description: 'Calendar event → confirmation email → team notify.', status: 'active', triggerLabel: 'New submission on Consultation Booking', connectedFormId: 'form-consultation-booking', stepsCount: 3, appsUsed: ['google_calendar', 'gmail', 'slack'], runsTotal: 28, runsSuccess: 27, runsFailed: 1, lastRunAt: '2026-02-22T15:00:00Z', lastRunStatus: 'success', creditsCostTotal: 21.6, tags: ['booking', 'calendar'], recentRuns: [{ id: 'sr-6', triggeredBy: 'Maria Gonzalez', startedAt: '2026-02-22T15:00:00Z', status: 'success', creditsCost: 0.8, summary: 'Booked Feb 25 2PM' }] },
  { id: 'stepper-payment-receipt', name: 'Payment Receipt & Activation', description: 'Record → receipt → Notion invoice → activate service.', status: 'active', triggerLabel: 'New submission on Service Payment', connectedFormId: 'form-service-payment', stepsCount: 4, appsUsed: ['firestore', 'gmail', 'notion', 'acheevy'], runsTotal: 19, runsSuccess: 19, runsFailed: 0, lastRunAt: '2026-02-22T11:30:00Z', lastRunStatus: 'success', creditsCostTotal: 27.5, tags: ['payment', 'billing'], recentRuns: [{ id: 'sr-7', triggeredBy: 'Custom Build ($2,499)', startedAt: '2026-02-22T11:30:00Z', status: 'success', creditsCost: 1.5, summary: 'Payment recorded, activated' }] },
  { id: 'stepper-project-setup', name: 'Project Setup Pipeline', description: 'Notion → Drive → AI plan → kickoff email.', status: 'active', triggerLabel: 'New submission on Project Kickoff Brief', connectedFormId: 'form-project-kickoff', stepsCount: 5, appsUsed: ['notion', 'google_drive', 'anthropic', 'gmail', 'acheevy'], runsTotal: 15, runsSuccess: 14, runsFailed: 1, lastRunAt: '2026-02-22T09:00:00Z', lastRunStatus: 'success', creditsCostTotal: 58.5, tags: ['project', 'setup'], recentRuns: [{ id: 'sr-8', triggeredBy: 'E-commerce Rebuild', startedAt: '2026-02-22T09:00:00Z', status: 'success', creditsCost: 4.2, summary: 'Full setup + AI plan' }] },
  { id: 'stepper-partial-followup', name: 'Partial Submission Follow-up', description: 'Chat nudge → wait → email → mark abandoned.', status: 'active', triggerLabel: 'Partial submission (24h)', connectedFormId: null, stepsCount: 6, appsUsed: ['acheevy', 'gmail', 'notion'], runsTotal: 23, runsSuccess: 18, runsFailed: 5, lastRunAt: '2026-02-22T00:00:00Z', lastRunStatus: 'success', creditsCostTotal: 11.5, tags: ['lead-recovery', 'follow-up'], recentRuns: [{ id: 'sr-9', triggeredBy: 'Anonymous user', startedAt: '2026-02-22T00:00:00Z', status: 'success', creditsCost: 0.5, summary: 'Chat nudge sent' }] },
  { id: 'stepper-survey-processor', name: 'Quarterly Survey Processor', description: 'Theme analysis → Sheets → expansion alerts.', status: 'active', triggerLabel: 'New submission on Satisfaction Survey', connectedFormId: 'form-satisfaction-survey', stepsCount: 4, appsUsed: ['anthropic', 'google_sheets', 'slack'], runsTotal: 52, runsSuccess: 50, runsFailed: 2, lastRunAt: '2026-02-20T09:00:00Z', lastRunStatus: 'success', creditsCostTotal: 52.0, tags: ['survey', 'expansion'], recentRuns: [] },
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

const STEPPER_ICON_MAP: Record<string, typeof Zap> = {
  'git-branch': GitBranch, 'users': Users, 'ticket': Ticket,
  'calendar-check': CalendarCheck, 'brain': Brain, 'user-x': UserX,
  'rocket': Rocket, 'bar-chart': BarChart3,
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
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${accent || 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}

// ─── Automations Tab Content ─────────────────────────────────────────────────

function AutomationsList({ automations, onSelect }: { automations: Automation[]; onSelect: (id: string) => void }) {
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
                {auto.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{tag}</span>)}
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
                    {tpl.requiredServers.map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize">{s}</span>)}
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

function FormsLibrary({ forms, onSelectForm }: { forms: FormEntry[]; onSelectForm: (id: string) => void }) {
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

  const totalSubs = forms.reduce((s, f) => s + f.submissionCount, 0);
  const totalPartials = forms.reduce((s, f) => s + f.partialCount, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Forms" value={forms.length.toString()} />
        <StatCard label="Submissions" value={totalSubs.toLocaleString()} accent="text-emerald-400" />
        <StatCard label="Partial / Abandoned" value={totalPartials.toString()} accent="text-amber-400" />
        <StatCard label="Live Forms" value={forms.filter(f => f.status === 'live').length.toString()} accent="text-blue-400" />
      </div>

      {/* Filters */}
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

      {/* Form Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(form => {
          const Icon = FORM_ICON_MAP[form.category] || FileText;
          const connectedWorkflow = STEPPER_WORKFLOWS.find(w => form.stepperWorkflowIds.includes(w.id));
          return (
            <button key={form.id} onClick={() => onSelectForm(form.id)} className="text-left p-4 rounded-xl bg-[#111113] border border-white/10 hover:border-amber-500/20 transition-all group">
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
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {form.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>)}
                    </div>
                    {connectedWorkflow && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Stepper
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
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

// ─── Form Detail Panel ───────────────────────────────────────────────────────

function FormDetail({ form, onClose }: { form: FormEntry; onClose: () => void }) {
  const Icon = FORM_ICON_MAP[form.category] || FileText;
  const workflows = STEPPER_WORKFLOWS.filter(w => form.stepperWorkflowIds.includes(w.id));
  const completionRate = form.submissionCount > 0 ? Math.round((form.submissionCount / (form.submissionCount + form.partialCount)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300 mb-2 flex items-center gap-1">
          <ChevronRight className="w-3 h-3 rotate-180" /> Back to Forms
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${form.accent}15` }}>
              <Icon className="w-6 h-6" style={{ color: form.accent }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{form.name}</h2>
              <p className="text-sm text-zinc-400">{form.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={form.status} />
                <span className="text-xs text-zinc-500">{CATEGORY_LABELS[form.category]}</span>
                <span className="text-xs text-zinc-600">slug: {form.slug}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors border border-white/10">
              <ExternalLink className="w-3.5 h-3.5" /> Open in Paperform
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs hover:bg-amber-700 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Submissions" value={form.submissionCount.toLocaleString()} accent="text-emerald-400" />
        <StatCard label="Partial / Abandoned" value={form.partialCount.toString()} accent="text-amber-400" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} />
        <StatCard label="Structure" value={`${form.pageCount}p / ${form.fieldCount}f`} />
      </div>

      {/* Connected Stepper Workflows */}
      {workflows.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Connected Stepper Workflows</h3>
          <div className="space-y-2">
            {workflows.map(w => (
              <div key={w.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#111113] border border-white/10">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200">{w.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{w.stepsCount} steps &middot; {w.appsUsed.length} apps &middot; {w.runsTotal} runs</div>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Tags */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Tags</h3>
        <div className="flex gap-2 flex-wrap">
          {form.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-white/10">{t}</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── Stepper Workflows Tab ───────────────────────────────────────────────────

function StepperWorkflows({ workflows, onSelectWorkflow }: { workflows: StepperWorkflowEntry[]; onSelectWorkflow: (id: string) => void }) {
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

  const totalRuns = workflows.reduce((s, w) => s + w.runsTotal, 0);
  const totalCredits = workflows.reduce((s, w) => s + w.creditsCostTotal, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Workflows" value={workflows.length.toString()} />
        <StatCard label="Total Runs" value={totalRuns.toLocaleString()} accent="text-emerald-400" />
        <StatCard label="Active" value={workflows.filter(w => w.status === 'active').length.toString()} accent="text-blue-400" />
        <StatCard label="Credits Used" value={totalCredits.toFixed(1)} accent="text-amber-400" />
      </div>

      {/* Filters */}
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

      {/* Workflow Cards */}
      <div className="space-y-3">
        {filtered.map(wf => {
          const connectedForm = FORM_LIBRARY.find(f => f.id === wf.connectedFormId);
          return (
            <button key={wf.id} onClick={() => onSelectWorkflow(wf.id)} className="w-full text-left p-4 rounded-xl bg-[#111113] border border-white/10 hover:border-blue-500/20 transition-all group">
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{wf.stepsCount} steps</span>
                      {wf.appsUsed.slice(0, 4).map(app => (
                        <span key={app} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize">{app.replace(/_/g, ' ')}</span>
                      ))}
                      {wf.appsUsed.length > 4 && <span className="text-[10px] text-zinc-600">+{wf.appsUsed.length - 4} more</span>}
                      {connectedForm && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" /> {connectedForm.name}
                        </span>
                      )}
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
                    <div className="mt-0.5 text-amber-500/60">{wf.creditsCostTotal.toFixed(1)} credits</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
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

// ─── Stepper Detail Panel ────────────────────────────────────────────────────

function StepperDetail({ workflow, onClose }: { workflow: StepperWorkflowEntry; onClose: () => void }) {
  const connectedForm = FORM_LIBRARY.find(f => f.id === workflow.connectedFormId);
  const successRate = workflow.runsTotal > 0 ? Math.round((workflow.runsSuccess / workflow.runsTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300 mb-2 flex items-center gap-1">
          <ChevronRight className="w-3 h-3 rotate-180" /> Back to Stepper Flows
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{workflow.name}</h2>
              <p className="text-sm text-zinc-400">{workflow.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={workflow.status} />
                <span className="text-xs text-zinc-500">{workflow.stepsCount} steps</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors border border-white/10">
              <ExternalLink className="w-3.5 h-3.5" /> Open in Stepper
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors">
              <Play className="w-3.5 h-3.5" /> Run Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Runs" value={workflow.runsTotal.toString()} />
        <StatCard label="Success Rate" value={`${successRate}%`} accent={successRate >= 90 ? 'text-emerald-400' : 'text-amber-400'} />
        <StatCard label="Credits Used" value={workflow.creditsCostTotal.toFixed(1)} accent="text-amber-400" />
        <StatCard label="Last Run" value={workflow.lastRunAt ? timeAgo(workflow.lastRunAt) : 'Never'} />
      </div>

      {/* Trigger */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Trigger</h3>
        <div className="p-3 rounded-lg bg-[#111113] border border-white/10 flex items-center gap-3">
          <Radio className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-zinc-200">{workflow.triggerLabel}</span>
          {connectedForm && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 ml-auto">
              <ClipboardList className="w-3 h-3" /> {connectedForm.name}
            </span>
          )}
        </div>
      </div>

      {/* Apps Used */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Connected Apps ({workflow.appsUsed.length})</h3>
        <div className="flex gap-2 flex-wrap">
          {workflow.appsUsed.map(app => (
            <span key={app} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-white/10 capitalize">
              {app.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Runs */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Recent Runs</h3>
        {workflow.recentRuns.length > 0 ? (
          <div className="space-y-2">
            {workflow.recentRuns.map(run => (
              <div key={run.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#111113] border border-white/10">
                <RunStatusIcon status={run.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{run.summary}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Triggered by: {run.triggeredBy}</div>
                </div>
                <div className="text-right text-xs text-zinc-500 shrink-0">
                  <div>{timeAgo(run.startedAt)}</div>
                  <div className="mt-0.5 text-amber-500/60">{run.creditsCost.toFixed(1)} credits</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No recent runs.</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Tags</h3>
        <div className="flex gap-2 flex-wrap">
          {workflow.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-white/10">{t}</span>)}
        </div>
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

type TabKey = 'automations' | 'forms' | 'stepper' | 'templates' | 'history';

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
  const selectedForm = FORM_LIBRARY.find(f => f.id === selectedId);
  const selectedWorkflow = STEPPER_WORKFLOWS.find(w => w.id === selectedId);

  const tabs: { key: TabKey; label: string; icon: typeof Zap; count?: number }[] = [
    { key: 'automations', label: 'Automations', icon: Zap, count: MOCK_AUTOMATIONS.filter(a => a.status === 'active').length },
    { key: 'forms', label: 'Form Library', icon: ClipboardList, count: FORM_LIBRARY.length },
    { key: 'stepper', label: 'Stepper Flows', icon: GitBranch, count: STEPPER_WORKFLOWS.filter(w => w.status === 'active').length },
    { key: 'templates', label: 'Templates', icon: Layers, count: TEMPLATES.length },
    { key: 'history', label: 'Run History', icon: Clock },
  ];

  // Handle back navigation from detail views
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
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {/* Automation detail */}
      {activeTab === 'automations' && selectedAutomation ? (
        <AutomationDetail automation={selectedAutomation} runs={MOCK_RUNS} onClose={handleBack} />
      ) : activeTab === 'forms' && selectedForm ? (
        <FormDetail form={selectedForm} onClose={handleBack} />
      ) : activeTab === 'stepper' && selectedWorkflow ? (
        <StepperDetail workflow={selectedWorkflow} onClose={handleBack} />
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
              {filteredAutomations.length > 0 ? (
                <AutomationsList automations={filteredAutomations} onSelect={setSelectedId} />
              ) : (
                <div className="text-center py-16">
                  <Zap className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No automations found</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'forms' && (
            <FormsLibrary forms={FORM_LIBRARY} onSelectForm={setSelectedId} />
          )}

          {activeTab === 'stepper' && (
            <StepperWorkflows workflows={STEPPER_WORKFLOWS} onSelectWorkflow={setSelectedId} />
          )}

          {activeTab === 'templates' && (
            <TemplateGrid templates={TEMPLATES} onUse={() => {}} />
          )}

          {activeTab === 'history' && (
            <AutomationRunHistory runs={MOCK_RUNS} />
          )}
        </>
      )}
    </div>
  );
}
