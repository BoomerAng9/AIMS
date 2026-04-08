/**
 * @types/automations
 * Type definitions for A.I.M.S. Automations System
 *
 * Automations run coding agents on a schedule or triggered by events
 * to automate bug fixes, documentation updates, security scans,
 * and technical debt maintenance — all orchestrated by ACHEEVY.
 */

// ─── Trigger Types ───────────────────────────────────────────────────────────

export type TriggerType = 'scheduled' | 'event';

export interface ScheduledTrigger {
  type: 'scheduled';
  /** Cron expression (e.g. "0 * * * *" for hourly) */
  cron: string;
  /** Human-readable schedule description */
  label: string;
  /** Timezone (default: UTC) */
  timezone?: string;
}

export type EventSource = 'github' | 'gitlab' | 'sentry' | 'linear' | 'slack' | 'n8n' | 'acheevy';

export type GitHubEvent = 'pr_opened' | 'pr_merged' | 'issue_created' | 'comment_added' | 'push';
export type SentryEvent = 'new_error' | 'error_spike' | 'regression_detected';
export type LinearEvent = 'issue_created' | 'issue_updated' | 'status_changed';
export type SlackEvent = 'message_in_channel' | 'mention';
export type AcheevyEvent = 'deploy_complete' | 'health_alert' | 'instance_error' | 'build_complete';

export interface EventTrigger {
  type: 'event';
  /** Integration source */
  source: EventSource;
  /** Specific event from the source */
  event: string;
  /** Optional filter (e.g. specific repo, channel, project) */
  filter?: Record<string, string>;
  /** Human-readable description */
  label: string;
}

export type AutomationTrigger = ScheduledTrigger | EventTrigger;

// ─── MCP Server Config ───────────────────────────────────────────────────────

export interface MCPServerConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  config?: Record<string, string>;
}

// ─── Automation Definition ───────────────────────────────────────────────────

export type AutomationStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface AutomationDefinition {
  id: string;
  /** User-facing name */
  name: string;
  /** Rich-text instructions for the agent */
  instructions: string;
  /** What triggers this automation */
  triggers: AutomationTrigger[];
  /** MCP servers the automation can access */
  mcpServers: MCPServerConfig[];
  /** Which coding agent runs this (default: ACHEEVY) */
  agentId: string;
  /** Current status */
  status: AutomationStatus;
  /** Created by */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last updated */
  updatedAt: string;
  /** Template this was created from (null if custom) */
  templateId: string | null;
  /** Tags for organization */
  tags: string[];
}

// ─── Run History ─────────────────────────────────────────────────────────────

export type RunStatus = 'running' | 'success' | 'failure' | 'timeout' | 'cancelled';

export interface AutomationRun {
  id: string;
  automationId: string;
  /** What triggered this run */
  triggeredBy: string;
  /** When it started */
  startedAt: string;
  /** When it finished (null if running) */
  completedAt: string | null;
  /** Run status */
  status: RunStatus;
  /** Duration in seconds */
  durationSeconds: number | null;
  /** Summary of what happened */
  summary: string;
  /** PRs created */
  prsCreated: string[];
  /** Messages posted */
  messagesPosted: string[];
  /** Issues created/updated */
  issuesModified: string[];
  /** LUC cost of this run */
  lucCost: number;
  /** Full execution log */
  logs?: string;
}

// ─── Automation Templates ────────────────────────────────────────────────────

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  /** Pre-filled instructions */
  instructions: string;
  /** Pre-configured triggers */
  defaultTriggers: AutomationTrigger[];
  /** Required MCP servers */
  requiredMCPServers: string[];
  /** Tags */
  tags: string[];
  /** Popularity ranking */
  popularity: number;
}

export type TemplateCategory =
  | 'code_quality'
  | 'bug_fixes'
  | 'documentation'
  | 'security'
  | 'team_updates'
  | 'issue_management'
  | 'monitoring'
  | 'custom';

// ─── Preset Schedule Options ─────────────────────────────────────────────────

export const SCHEDULE_PRESETS: { label: string; cron: string; useCase: string }[] = [
  { label: 'Every hour', cron: '0 * * * *', useCase: 'Monitor for CI failures, new Sentry errors' },
  { label: 'Daily at 8 AM', cron: '0 8 * * *', useCase: 'Generate changelogs, post standup summaries' },
  { label: 'Weekly on Monday', cron: '0 9 * * 1', useCase: 'Clean up stale TODOs, security scans, metrics reports' },
  { label: 'Monthly on the 1st', cron: '0 9 1 * *', useCase: 'Dependency audits, documentation reviews' },
];

// ─── Event Source Definitions ────────────────────────────────────────────────

export const EVENT_SOURCES: { source: EventSource; name: string; icon: string; events: { event: string; label: string }[] }[] = [
  {
    source: 'github',
    name: 'GitHub',
    icon: 'github',
    events: [
      { event: 'pr_opened', label: 'PR opened' },
      { event: 'pr_merged', label: 'PR merged' },
      { event: 'issue_created', label: 'Issue created' },
      { event: 'comment_added', label: 'Comment added' },
      { event: 'push', label: 'Push to branch' },
    ],
  },
  {
    source: 'sentry',
    name: 'Sentry',
    icon: 'bug',
    events: [
      { event: 'new_error', label: 'New error' },
      { event: 'error_spike', label: 'Error spike' },
      { event: 'regression_detected', label: 'Regression detected' },
    ],
  },
  {
    source: 'linear',
    name: 'Linear',
    icon: 'list-checks',
    events: [
      { event: 'issue_created', label: 'Issue created' },
      { event: 'issue_updated', label: 'Issue updated' },
      { event: 'status_changed', label: 'Status changed' },
    ],
  },
  {
    source: 'slack',
    name: 'Slack',
    icon: 'message-square',
    events: [
      { event: 'message_in_channel', label: 'Message in channel' },
      { event: 'mention', label: '@ACHEEVY mention' },
    ],
  },
  {
    source: 'acheevy',
    name: 'ACHEEVY',
    icon: 'zap',
    events: [
      { event: 'deploy_complete', label: 'Deploy complete' },
      { event: 'health_alert', label: 'Health alert' },
      { event: 'instance_error', label: 'Instance error' },
      { event: 'build_complete', label: 'Build complete' },
    ],
  },
];

// ─── Default Templates ───────────────────────────────────────────────────────

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'auto-pr-description',
    name: 'Auto-Generate PR Descriptions',
    description: 'Automatically create clear, well-formatted PR descriptions when PRs are opened.',
    category: 'code_quality',
    icon: 'file-text',
    instructions: `When a PR is opened, analyze the diff and generate a description:
1. Summarize what changed and why
2. List key modifications
3. Note any breaking changes
4. Add testing instructions`,
    defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened' }],
    requiredMCPServers: ['github'],
    tags: ['github', 'pr', 'documentation'],
    popularity: 95,
  },
  {
    id: 'sentry-prioritize',
    name: 'Prioritize Sentry Errors',
    description: 'Get a daily report of the most impactful bugs, ranked by users affected.',
    category: 'bug_fixes',
    icon: 'alert-triangle',
    instructions: `Every morning:
1. Fetch errors from the last 24 hours
2. Rank by number of affected users
3. Post top 3 to #engineering-bugs
4. Create Linear tickets for each`,
    defaultTriggers: [{ type: 'scheduled', cron: '0 8 * * *', label: 'Daily at 8 AM' }],
    requiredMCPServers: ['sentry', 'slack', 'linear'],
    tags: ['sentry', 'bugs', 'monitoring'],
    popularity: 88,
  },
  {
    id: 'auto-pr-review',
    name: 'Automated PR Reviews',
    description: 'Get instant code reviews on every pull request.',
    category: 'code_quality',
    icon: 'search',
    instructions: `Review this PR for:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Style guide compliance

Leave inline comments on specific lines.
Auto-approve if no issues found.`,
    defaultTriggers: [{ type: 'event', source: 'github', event: 'pr_opened', label: 'PR opened/updated' }],
    requiredMCPServers: ['github'],
    tags: ['github', 'code-review', 'quality'],
    popularity: 92,
  },
  {
    id: 'security-scan',
    name: 'Security Vulnerability Scan',
    description: 'Scan your codebase daily for security issues.',
    category: 'security',
    icon: 'shield',
    instructions: `Scan for:
- SQL injection
- XSS vulnerabilities
- Hardcoded secrets
- Authentication flaws

Create Linear tickets for each finding with severity ratings.
Generate fix PRs for critical issues.`,
    defaultTriggers: [{ type: 'scheduled', cron: '0 6 * * *', label: 'Daily at 6 AM' }],
    requiredMCPServers: ['github', 'linear'],
    tags: ['security', 'scanning', 'vulnerabilities'],
    popularity: 85,
  },
  {
    id: 'enrich-linear-issues',
    name: 'Enrich Linear Issues',
    description: 'Automatically add context to new Linear issues from your codebase, Slack, and docs.',
    category: 'issue_management',
    icon: 'layers',
    instructions: `When a new issue is created:
1. Search codebase for relevant files
2. Find related Slack conversations
3. Pull in documentation
4. Add a comment with implementation hints`,
    defaultTriggers: [{ type: 'event', source: 'linear', event: 'issue_created', label: 'Linear issue created' }],
    requiredMCPServers: ['linear', 'github', 'slack'],
    tags: ['linear', 'issues', 'enrichment'],
    popularity: 78,
  },
  {
    id: 'auto-fix-sentry',
    name: 'Auto-Fix Sentry Errors',
    description: 'Automatically generate fix PRs for new Sentry errors within seconds of detection.',
    category: 'bug_fixes',
    icon: 'wrench',
    instructions: `When a new Sentry error is detected:
1. Analyze the stack trace and error context
2. Find the relevant source code
3. Generate a fix
4. Open a PR with the fix and link to the Sentry issue
5. Post to #engineering-bugs with the PR link`,
    defaultTriggers: [{ type: 'event', source: 'sentry', event: 'new_error', label: 'New Sentry error' }],
    requiredMCPServers: ['sentry', 'github', 'slack'],
    tags: ['sentry', 'auto-fix', 'bugs'],
    popularity: 90,
  },
  {
    id: 'weekly-tech-debt',
    name: 'Weekly Tech Debt Cleanup',
    description: 'Find and fix stale TODOs, unused imports, and dead code every week.',
    category: 'code_quality',
    icon: 'trash-2',
    instructions: `Every Monday morning:
1. Scan codebase for TODO/FIXME/HACK comments older than 30 days
2. Identify unused imports and dead code
3. Create individual fix PRs for each category
4. Post a summary to #engineering with the week's tech debt report`,
    defaultTriggers: [{ type: 'scheduled', cron: '0 9 * * 1', label: 'Weekly on Monday' }],
    requiredMCPServers: ['github', 'slack'],
    tags: ['tech-debt', 'cleanup', 'weekly'],
    popularity: 75,
  },
  {
    id: 'deploy-health-monitor',
    name: 'Post-Deploy Health Monitor',
    description: 'Monitor instance health after every deployment and alert on issues.',
    category: 'monitoring',
    icon: 'activity',
    instructions: `After each deploy completes:
1. Run health checks on all affected instances
2. Monitor error rates for 15 minutes
3. Compare metrics to pre-deploy baseline
4. If regression detected: alert in Slack, create rollback PR
5. Post deploy summary with health status`,
    defaultTriggers: [{ type: 'event', source: 'acheevy', event: 'deploy_complete', label: 'Deploy complete' }],
    requiredMCPServers: ['github', 'slack'],
    tags: ['monitoring', 'deploy', 'health'],
    popularity: 82,
  },
];
