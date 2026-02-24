/**
 * Stepper Workflow Library — AI-Native Automation by Paperform
 *
 * Workflow step definitions for Stepper.io automations.
 * Workflows are configured in Stepper UI (stepper.io) — this library
 * defines the schema/structure for reference and dashboard display.
 *
 * Runtime data (run counts, credits, run history) comes from
 * Stepper API — NOT hardcoded here.
 */

import type {
  StepperWorkflow,
  StepperWorkflowTemplate,
  StepperWorkflowStatus,
} from './types';

// ─── Workflow Definitions (structure only — no fake stats) ───────────────────

const STEPPER_WORKFLOWS: StepperWorkflow[] = [
  {
    id: 'stepper-onboarding-pipeline',
    name: 'Onboarding Intake Pipeline',
    description: 'Full onboarding automation: validate submission → Firestore → Notion project page → Drive folder → welcome email → calendar booking → ACHEEVY notification.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-onboarding-intake',
      label: 'New submission on Onboarding Needs Analysis',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'ai_process', app: 'anthropic', action: 'Validate & classify submission', label: 'AI Validation', config: { model: 'claude-haiku-4.5', prompt: 'Validate intake form data: check required fields, classify service tier, recommend path' } },
      { id: 'step-2', order: 2, type: 'store', app: 'firestore', action: 'Store in users/{uid}/intake', label: 'Save to Firestore', config: { collection: 'users/{uid}/intake', includeCalculatedFields: true } },
      { id: 'step-3', order: 3, type: 'create_page', app: 'notion', action: 'Create project page in Projects DB', label: 'Create Notion Page', config: { database: 'Projects', status: 'Intake', properties: ['full_name', 'company', 'needs', 'calc_tier', 'calc_path'] } },
      { id: 'step-4', order: 4, type: 'create_folder', app: 'google_drive', action: 'Create client folder structure', label: 'Create Drive Folders', config: { parent: 'Clients/', subfolders: ['Intake', 'Deliverables', 'Receipts'] } },
      { id: 'step-5', order: 5, type: 'send_email', app: 'gmail', action: 'Send welcome email', label: 'Welcome Email', config: { template: 'onboarding-welcome', includeFields: ['full_name', 'calc_path', 'calc_tier'] } },
      { id: 'step-6', order: 6, type: 'condition', app: 'paperform', action: 'Check if consultation requested', label: 'Consultation Check', config: {}, branches: [{ condition: 'wants_consultation === "Yes — book a 15-min call"', thenSteps: ['step-7'] }] },
      { id: 'step-7', order: 7, type: 'book_calendar', app: 'google_calendar', action: 'Create consultation event', label: 'Book Consultation', config: { duration: 15, title: 'A.I.M.S. Consultation — {full_name}' } },
      { id: 'step-8', order: 8, type: 'webhook', app: 'acheevy', action: 'Notify ACHEEVY chat', label: 'ACHEEVY Notification', config: { webhookUrl: '/api/acheevy/notify', payload: 'onboarding_complete' } },
    ],
    connectedFormId: 'form-onboarding-intake',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['onboarding', 'critical', 'full-pipeline'],
  },

  {
    id: 'stepper-needs-analysis-pipeline',
    name: 'Needs Analysis → Plug Recommendation',
    description: 'Process needs analysis submissions: AI-analyze requirements → match to plug catalog → generate recommendation report → notify user.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-plug-needs',
      label: 'New submission on Plug Needs Analysis',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'ai_process', app: 'anthropic', action: 'Analyze requirements and match to plugs', label: 'AI Analysis', config: { model: 'claude-sonnet-4.6', prompt: 'Analyze requirements, score against plug catalog, generate top 3 recommendations with rationale' } },
      { id: 'step-2', order: 2, type: 'store', app: 'firestore', action: 'Store analysis results', label: 'Save Analysis', config: { collection: 'needs-analysis/{id}', includeRecommendations: true } },
      { id: 'step-3', order: 3, type: 'create_page', app: 'notion', action: 'Create recommendation report page', label: 'Notion Report', config: { database: 'Projects', template: 'needs-analysis-report' } },
      { id: 'step-4', order: 4, type: 'send_email', app: 'gmail', action: 'Send recommendation email', label: 'Send Report', config: { template: 'plug-recommendation', includeFields: ['recommendations', 'cost_estimate'] } },
      { id: 'step-5', order: 5, type: 'webhook', app: 'acheevy', action: 'Notify ACHEEVY with recommendations', label: 'ACHEEVY Alert', config: { webhookUrl: '/api/acheevy/notify', payload: 'needs_analysis_complete' } },
    ],
    connectedFormId: 'form-plug-needs',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['needs-analysis', 'recommendation', 'enterprise'],
  },

  {
    id: 'stepper-feedback-processor',
    name: 'Feedback & NPS Processor',
    description: 'Process feedback submissions: calculate NPS, detect sentiment, flag critical issues, update client health score.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-feedback-nps',
      label: 'New submission on Feedback & NPS Survey',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'ai_process', app: 'anthropic', action: 'Sentiment analysis + NPS classification', label: 'Sentiment Analysis', config: { model: 'claude-haiku-4.5', prompt: 'Classify NPS (promoter/passive/detractor), analyze sentiment, extract key themes' } },
      { id: 'step-2', order: 2, type: 'store', app: 'google_sheets', action: 'Append to NPS tracking sheet', label: 'Log to Sheets', config: { spreadsheet: 'NPS Tracker', sheet: '2026' } },
      { id: 'step-3', order: 3, type: 'condition', app: 'paperform', action: 'Check if detractor (NPS < 7)', label: 'Detractor Check', config: {}, branches: [{ condition: 'nps_score < 7', thenSteps: ['step-4'] }] },
      { id: 'step-4', order: 4, type: 'notify', app: 'slack', action: 'Alert team about detractor feedback', label: 'Detractor Alert', config: { channel: '#client-health', urgency: 'high' } },
      { id: 'step-5', order: 5, type: 'condition', app: 'paperform', action: 'Check if testimonial offered', label: 'Testimonial Check', config: {}, branches: [{ condition: 'testimonial === "Yes — happy to!"', thenSteps: ['step-6'] }] },
      { id: 'step-6', order: 6, type: 'send_email', app: 'gmail', action: 'Send testimonial request follow-up', label: 'Testimonial Follow-up', config: { template: 'testimonial-request' } },
    ],
    connectedFormId: 'form-feedback-nps',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['feedback', 'nps', 'sentiment'],
  },

  {
    id: 'stepper-support-triage',
    name: 'Support Request Triage',
    description: 'Auto-triage support requests: classify severity, create Linear ticket, assign to team, notify Slack.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-support-request',
      label: 'New submission on Support Request',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'ai_process', app: 'anthropic', action: 'Classify and triage issue', label: 'AI Triage', config: { model: 'claude-haiku-4.5', prompt: 'Classify bug category, estimate severity, suggest initial investigation steps' } },
      { id: 'step-2', order: 2, type: 'create_page', app: 'linear', action: 'Create Linear ticket', label: 'Create Ticket', config: { team: 'Engineering', priority: 'from_urgency', labels: ['from_category'] } },
      { id: 'step-3', order: 3, type: 'notify', app: 'slack', action: 'Post to #support-triage', label: 'Slack Alert', config: { channel: '#support-triage', includeFields: ['category', 'urgency', 'description'] } },
      { id: 'step-4', order: 4, type: 'send_email', app: 'gmail', action: 'Send acknowledgment email', label: 'Ack Email', config: { template: 'support-ack', includeTicketId: true } },
      { id: 'step-5', order: 5, type: 'webhook', app: 'acheevy', action: 'Notify ACHEEVY for chat follow-up', label: 'ACHEEVY Follow-up', config: { webhookUrl: '/api/acheevy/notify', payload: 'support_ticket_created' } },
    ],
    connectedFormId: 'form-support-request',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['support', 'triage', 'linear'],
  },

  {
    id: 'stepper-booking-confirm',
    name: 'Consultation Booking Confirmation',
    description: 'Process consultation bookings: check availability → create calendar event → send confirmation → notify team.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-consultation-booking',
      label: 'New submission on Consultation Booking',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'book_calendar', app: 'google_calendar', action: 'Create consultation event', label: 'Book Calendar', config: { duration: 15, title: 'A.I.M.S. Consultation — {full_name}', description: 'Topic: {topic}' } },
      { id: 'step-2', order: 2, type: 'send_email', app: 'gmail', action: 'Send booking confirmation', label: 'Confirm Email', config: { template: 'booking-confirmation', includeCalendarLink: true } },
      { id: 'step-3', order: 3, type: 'notify', app: 'slack', action: 'Notify #consultations channel', label: 'Team Notify', config: { channel: '#consultations' } },
    ],
    connectedFormId: 'form-consultation-booking',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['booking', 'calendar', 'confirmation'],
  },

  {
    id: 'stepper-payment-receipt',
    name: 'Payment Receipt & Activation',
    description: 'Process payments: generate receipt → activate service → create project → notify team.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-service-payment',
      label: 'New submission on Service Payment',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'store', app: 'firestore', action: 'Record payment in billing collection', label: 'Record Payment', config: { collection: 'billing/payments' } },
      { id: 'step-2', order: 2, type: 'send_email', app: 'gmail', action: 'Send payment receipt', label: 'Send Receipt', config: { template: 'payment-receipt', includeFields: ['service_type', 'amount'] } },
      { id: 'step-3', order: 3, type: 'create_page', app: 'notion', action: 'Create invoice page in Billing DB', label: 'Notion Invoice', config: { database: 'Billing', status: 'Paid' } },
      { id: 'step-4', order: 4, type: 'webhook', app: 'acheevy', action: 'Activate service via ACHEEVY', label: 'Activate Service', config: { webhookUrl: '/api/acheevy/activate', payload: 'payment_received' } },
    ],
    connectedFormId: 'form-service-payment',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['payment', 'billing', 'activation'],
  },

  {
    id: 'stepper-project-setup',
    name: 'Project Setup Pipeline',
    description: 'Set up new project workspace: Notion page → Drive folder → Slack channel → team assignment → kickoff email.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-project-kickoff',
      label: 'New submission on Project Kickoff Brief',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'create_page', app: 'notion', action: 'Create project page with scope', label: 'Project Page', config: { database: 'Projects', status: 'Kickoff', template: 'project-kickoff' } },
      { id: 'step-2', order: 2, type: 'create_folder', app: 'google_drive', action: 'Create project folder structure', label: 'Drive Folder', config: { parent: 'Projects/', subfolders: ['Scope', 'Design', 'Deliverables', 'Reviews'] } },
      { id: 'step-3', order: 3, type: 'ai_process', app: 'anthropic', action: 'Generate project plan from brief', label: 'AI Project Plan', config: { model: 'claude-sonnet-4.6', prompt: 'Generate project timeline, milestones, and task breakdown from kickoff brief' } },
      { id: 'step-4', order: 4, type: 'send_email', app: 'gmail', action: 'Send kickoff summary', label: 'Kickoff Email', config: { template: 'project-kickoff', includeFields: ['project_name', 'deliverables', 'deadline'] } },
      { id: 'step-5', order: 5, type: 'webhook', app: 'acheevy', action: 'Initialize project in ACHEEVY', label: 'ACHEEVY Init', config: { webhookUrl: '/api/acheevy/project/init', payload: 'project_kickoff' } },
    ],
    connectedFormId: 'form-project-kickoff',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['project', 'setup', 'kickoff'],
  },

  {
    id: 'stepper-partial-followup',
    name: 'Partial Submission Follow-up',
    description: 'Re-engage users who started but did not finish a form. Nudge via chat, then email, then mark as abandoned.',
    status: 'draft',
    trigger: {
      type: 'partial_submission',
      app: 'paperform',
      label: 'Partial submission detected (24h after start)',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'condition', app: 'acheevy', action: 'Check if user has active chat session', label: 'Session Check', config: {}, branches: [{ condition: 'hasActiveChatSession', thenSteps: ['step-2'] }] },
      { id: 'step-2', order: 2, type: 'webhook', app: 'acheevy', action: 'Send chat nudge', label: 'Chat Nudge', config: { message: "I noticed you started your intake form but didn't finish. Want to pick up where you left off?" } },
      { id: 'step-3', order: 3, type: 'delay', app: 'custom', action: 'Wait 48 hours', label: 'Wait 48h', config: { delayHours: 48 } },
      { id: 'step-4', order: 4, type: 'send_email', app: 'gmail', action: 'Send follow-up email', label: 'Follow-up Email', config: { template: 'form-followup', includeResumeLink: true } },
      { id: 'step-5', order: 5, type: 'delay', app: 'custom', action: 'Wait 7 days', label: 'Wait 7d', config: { delayDays: 7 } },
      { id: 'step-6', order: 6, type: 'store', app: 'notion', action: 'Mark lead as abandoned', label: 'Mark Abandoned', config: { database: 'Leads', status: 'Abandoned' } },
    ],
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['lead-recovery', 'follow-up', 'partial'],
  },

  {
    id: 'stepper-survey-processor',
    name: 'Quarterly Survey Processor',
    description: 'Process quarterly satisfaction surveys: analyze responses → update client health scores → generate insights report.',
    status: 'draft',
    trigger: {
      type: 'form_submission',
      app: 'paperform',
      formId: 'form-satisfaction-survey',
      label: 'New submission on Client Satisfaction Survey',
    },
    steps: [
      { id: 'step-1', order: 1, type: 'ai_process', app: 'anthropic', action: 'Analyze survey response themes', label: 'Theme Analysis', config: { model: 'claude-haiku-4.5', prompt: 'Extract themes, sentiment, expansion signals, churn risk indicators' } },
      { id: 'step-2', order: 2, type: 'store', app: 'google_sheets', action: 'Log to satisfaction tracking sheet', label: 'Log to Sheets', config: { spreadsheet: 'Client Health', sheet: 'Q1-2026' } },
      { id: 'step-3', order: 3, type: 'condition', app: 'paperform', action: 'Check for expansion interest', label: 'Expansion Check', config: {}, branches: [{ condition: 'expansion_interest starts with "Yes"', thenSteps: ['step-4'] }] },
      { id: 'step-4', order: 4, type: 'notify', app: 'slack', action: 'Alert #expansion-opportunities', label: 'Expansion Alert', config: { channel: '#expansion-opportunities' } },
    ],
    connectedFormId: 'form-satisfaction-survey',
    runs: [],
    runsTotal: 0,
    runsSuccess: 0,
    runsFailed: 0,
    lastRunAt: null,
    lastRunStatus: null,
    creditsCostTotal: 0,
    createdAt: '',
    updatedAt: '',
    tags: ['survey', 'health-score', 'expansion'],
  },
];

// ─── Stepper Workflow Templates ──────────────────────────────────────────────

const STEPPER_TEMPLATES: StepperWorkflowTemplate[] = [
  {
    id: 'stpl-form-to-notion-drive-email',
    name: 'Form → Notion + Drive + Email',
    description: 'Full onboarding pipeline: validate form → Notion page → Drive folder → welcome email.',
    icon: 'git-branch',
    triggerType: 'form_submission',
    triggerApp: 'paperform',
    steps: [
      { order: 1, type: 'ai_process', app: 'anthropic', action: 'Validate and classify', label: 'AI Validate', config: {} },
      { order: 2, type: 'create_page', app: 'notion', action: 'Create project page', label: 'Notion Page', config: {} },
      { order: 3, type: 'create_folder', app: 'google_drive', action: 'Create folder structure', label: 'Drive Folder', config: {} },
      { order: 4, type: 'send_email', app: 'gmail', action: 'Send welcome email', label: 'Welcome Email', config: {} },
    ],
    requiredApps: ['paperform', 'anthropic', 'notion', 'google_drive', 'gmail'],
    estimatedCreditsPerRun: 3.0,
    tags: ['onboarding', 'full-pipeline'],
  },
  {
    id: 'stpl-form-to-crm',
    name: 'Form → CRM + Slack Alert',
    description: 'Push form submissions to HubSpot as new contacts/deals and notify the team via Slack.',
    icon: 'users',
    triggerType: 'form_submission',
    triggerApp: 'paperform',
    steps: [
      { order: 1, type: 'store', app: 'hubspot', action: 'Create/update contact', label: 'HubSpot Contact', config: {} },
      { order: 2, type: 'store', app: 'hubspot', action: 'Create deal', label: 'HubSpot Deal', config: {} },
      { order: 3, type: 'notify', app: 'slack', action: 'Post to #new-leads', label: 'Slack Alert', config: {} },
    ],
    requiredApps: ['paperform', 'hubspot', 'slack'],
    estimatedCreditsPerRun: 1.5,
    tags: ['crm', 'leads'],
  },
  {
    id: 'stpl-form-to-ticket',
    name: 'Form → Linear Ticket + Slack',
    description: 'Automatically create Linear tickets from form submissions with AI-powered triage.',
    icon: 'ticket',
    triggerType: 'form_submission',
    triggerApp: 'paperform',
    steps: [
      { order: 1, type: 'ai_process', app: 'anthropic', action: 'Classify and prioritize', label: 'AI Triage', config: {} },
      { order: 2, type: 'create_page', app: 'linear', action: 'Create ticket', label: 'Linear Ticket', config: {} },
      { order: 3, type: 'notify', app: 'slack', action: 'Alert team channel', label: 'Slack Alert', config: {} },
    ],
    requiredApps: ['paperform', 'anthropic', 'linear', 'slack'],
    estimatedCreditsPerRun: 2.0,
    tags: ['support', 'tickets'],
  },
  {
    id: 'stpl-form-to-calendar',
    name: 'Form → Calendar + Confirmation',
    description: 'Create calendar events from booking forms and send automatic confirmation emails.',
    icon: 'calendar-check',
    triggerType: 'form_submission',
    triggerApp: 'paperform',
    steps: [
      { order: 1, type: 'book_calendar', app: 'google_calendar', action: 'Create calendar event', label: 'Book Slot', config: {} },
      { order: 2, type: 'send_email', app: 'gmail', action: 'Send confirmation', label: 'Confirm Email', config: {} },
    ],
    requiredApps: ['paperform', 'google_calendar', 'gmail'],
    estimatedCreditsPerRun: 0.8,
    tags: ['booking', 'calendar'],
  },
  {
    id: 'stpl-form-to-ai-report',
    name: 'Form → AI Analysis + Report',
    description: 'Use AI to analyze form responses, generate insights, and share a report via email or Notion.',
    icon: 'brain',
    triggerType: 'form_submission',
    triggerApp: 'paperform',
    steps: [
      { order: 1, type: 'ai_process', app: 'anthropic', action: 'Analyze responses with Claude', label: 'AI Analysis', config: {} },
      { order: 2, type: 'create_page', app: 'notion', action: 'Create report page', label: 'Notion Report', config: {} },
      { order: 3, type: 'send_email', app: 'gmail', action: 'Email report to stakeholders', label: 'Email Report', config: {} },
    ],
    requiredApps: ['paperform', 'anthropic', 'notion', 'gmail'],
    estimatedCreditsPerRun: 3.5,
    tags: ['analysis', 'reporting'],
  },
  {
    id: 'stpl-partial-recovery',
    name: 'Partial Submit → Lead Recovery',
    description: 'Re-engage users who abandon forms: chat nudge → email follow-up → mark abandoned.',
    icon: 'user-x',
    triggerType: 'partial_submission',
    triggerApp: 'paperform',
    steps: [
      { order: 1, type: 'webhook', app: 'acheevy', action: 'Send chat nudge', label: 'Chat Nudge', config: {} },
      { order: 2, type: 'delay', app: 'custom', action: 'Wait 48 hours', label: 'Wait 48h', config: {} },
      { order: 3, type: 'send_email', app: 'gmail', action: 'Follow-up email', label: 'Follow-up', config: {} },
    ],
    requiredApps: ['paperform', 'acheevy', 'gmail'],
    estimatedCreditsPerRun: 0.5,
    tags: ['lead-recovery', 'follow-up'],
  },
];

// ─── Stepper Library Engine ──────────────────────────────────────────────────

class StepperLibraryEngine {
  private workflows: Map<string, StepperWorkflow>;
  private templates: Map<string, StepperWorkflowTemplate>;

  constructor() {
    this.workflows = new Map();
    this.templates = new Map();
    for (const wf of STEPPER_WORKFLOWS) {
      this.workflows.set(wf.id, wf);
    }
    for (const tpl of STEPPER_TEMPLATES) {
      this.templates.set(tpl.id, tpl);
    }
  }

  listWorkflows(filter?: { status?: StepperWorkflowStatus; formId?: string; search?: string }): StepperWorkflow[] {
    let results = Array.from(this.workflows.values());
    if (filter?.status) {
      results = results.filter(w => w.status === filter.status);
    }
    if (filter?.formId) {
      results = results.filter(w => w.connectedFormId === filter.formId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.tags.some(t => t.includes(q))
      );
    }
    return results;
  }

  getWorkflow(workflowId: string): StepperWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowsForForm(formId: string): StepperWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.connectedFormId === formId);
  }

  listTemplates(): StepperWorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(templateId: string): StepperWorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  getStats(): { totalWorkflows: number; activeWorkflows: number; totalRuns: number; totalCredits: number } {
    const workflows = Array.from(this.workflows.values());
    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'active').length,
      totalRuns: workflows.reduce((sum, w) => sum + w.runsTotal, 0),
      totalCredits: workflows.reduce((sum, w) => sum + w.creditsCostTotal, 0),
    };
  }
}

export const stepperLibrary = new StepperLibraryEngine();
export { STEPPER_WORKFLOWS, STEPPER_TEMPLATES };
