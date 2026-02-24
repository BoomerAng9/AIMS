import { NextRequest, NextResponse } from 'next/server';

/**
 * Stepper API — List and search Stepper workflow automations.
 * In production, this proxies to UEF Gateway → Stepper.io.
 * For now, serves the local stepper library definitions.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface StepperWorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  triggerLabel: string;
  triggerApp: string;
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
  createdAt: string;
  updatedAt: string;
  recentRuns: {
    id: string;
    triggeredBy: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    stepsCompleted: number;
    stepsTotal: number;
    creditsCost: number;
    summary: string;
  }[];
}

// ─── Workflow Data ───────────────────────────────────────────────────────────

const WORKFLOWS: StepperWorkflowSummary[] = [
  {
    id: 'stepper-onboarding-pipeline',
    name: 'Onboarding Intake Pipeline',
    description: 'Full onboarding: validate → Firestore → Notion → Drive → email → calendar → ACHEEVY.',
    status: 'active',
    triggerLabel: 'New submission on Onboarding Needs Analysis',
    triggerApp: 'paperform',
    connectedFormId: 'form-onboarding-intake',
    stepsCount: 8,
    appsUsed: ['anthropic', 'firestore', 'notion', 'google_drive', 'gmail', 'google_calendar', 'acheevy'],
    runsTotal: 142,
    runsSuccess: 138,
    runsFailed: 4,
    lastRunAt: '2026-02-23T14:20:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 412.5,
    tags: ['onboarding', 'critical', 'full-pipeline'],
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-23T00:00:00Z',
    recentRuns: [
      { id: 'srun-1', triggeredBy: 'Sarah Chen', startedAt: '2026-02-23T14:20:00Z', completedAt: '2026-02-23T14:20:45Z', status: 'success', stepsCompleted: 8, stepsTotal: 8, creditsCost: 3.2, summary: 'Notion page + Drive folder + welcome email + calendar booking' },
      { id: 'srun-2', triggeredBy: 'Marcus Rivera', startedAt: '2026-02-22T09:15:00Z', completedAt: '2026-02-22T09:15:32Z', status: 'success', stepsCompleted: 7, stepsTotal: 8, creditsCost: 2.8, summary: 'Full pipeline minus calendar (no consultation)' },
    ],
  },
  {
    id: 'stepper-needs-analysis-pipeline',
    name: 'Needs Analysis → Plug Recommendation',
    description: 'AI-analyze requirements → match plugs → recommendation report → notify user.',
    status: 'active',
    triggerLabel: 'New submission on Plug Needs Analysis',
    triggerApp: 'paperform',
    connectedFormId: 'form-plug-needs',
    stepsCount: 5,
    appsUsed: ['anthropic', 'firestore', 'notion', 'gmail', 'acheevy'],
    runsTotal: 67,
    runsSuccess: 64,
    runsFailed: 3,
    lastRunAt: '2026-02-23T11:00:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 268.0,
    tags: ['needs-analysis', 'recommendation', 'enterprise'],
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-02-23T00:00:00Z',
    recentRuns: [
      { id: 'srun-4', triggeredBy: 'TechCorp Inc', startedAt: '2026-02-23T11:00:00Z', completedAt: '2026-02-23T11:01:12Z', status: 'success', stepsCompleted: 5, stepsTotal: 5, creditsCost: 4.1, summary: 'Recommended: OpenClaw Pro + custom agent. Enterprise tier.' },
    ],
  },
  {
    id: 'stepper-feedback-processor',
    name: 'Feedback & NPS Processor',
    description: 'Calculate NPS, detect sentiment, flag detractors, update health score.',
    status: 'active',
    triggerLabel: 'New submission on Feedback & NPS Survey',
    triggerApp: 'paperform',
    connectedFormId: 'form-feedback-nps',
    stepsCount: 6,
    appsUsed: ['anthropic', 'google_sheets', 'slack', 'gmail'],
    runsTotal: 89,
    runsSuccess: 87,
    runsFailed: 2,
    lastRunAt: '2026-02-23T10:30:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 102.3,
    tags: ['feedback', 'nps', 'sentiment'],
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-02-23T00:00:00Z',
    recentRuns: [
      { id: 'srun-5', triggeredBy: 'Alex Kim (NPS: 9)', startedAt: '2026-02-23T10:30:00Z', completedAt: '2026-02-23T10:30:15Z', status: 'success', stepsCompleted: 4, stepsTotal: 6, creditsCost: 1.2, summary: 'Promoter — logged + testimonial follow-up sent' },
    ],
  },
  {
    id: 'stepper-support-triage',
    name: 'Support Request Triage',
    description: 'AI-classify severity → Linear ticket → Slack alert → ack email.',
    status: 'active',
    triggerLabel: 'New submission on Support Request',
    triggerApp: 'paperform',
    connectedFormId: 'form-support-request',
    stepsCount: 5,
    appsUsed: ['anthropic', 'linear', 'slack', 'gmail', 'acheevy'],
    runsTotal: 34,
    runsSuccess: 33,
    runsFailed: 1,
    lastRunAt: '2026-02-23T08:00:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 68.4,
    tags: ['support', 'triage', 'linear'],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-23T00:00:00Z',
    recentRuns: [
      { id: 'srun-6', triggeredBy: 'Auth redirect loop (Critical)', startedAt: '2026-02-23T08:00:00Z', completedAt: '2026-02-23T08:00:22Z', status: 'success', stepsCompleted: 5, stepsTotal: 5, creditsCost: 2.1, summary: 'Ticket ENG-412 created, team notified' },
    ],
  },
  {
    id: 'stepper-booking-confirm',
    name: 'Booking Confirmation',
    description: 'Book calendar → confirmation email → notify team.',
    status: 'active',
    triggerLabel: 'New submission on Consultation Booking',
    triggerApp: 'paperform',
    connectedFormId: 'form-consultation-booking',
    stepsCount: 3,
    appsUsed: ['google_calendar', 'gmail', 'slack'],
    runsTotal: 28,
    runsSuccess: 27,
    runsFailed: 1,
    lastRunAt: '2026-02-22T15:00:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 21.6,
    tags: ['booking', 'calendar', 'confirmation'],
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
    recentRuns: [
      { id: 'srun-7', triggeredBy: 'Maria Gonzalez — Platform Demo', startedAt: '2026-02-22T15:00:00Z', completedAt: '2026-02-22T15:00:18Z', status: 'success', stepsCompleted: 3, stepsTotal: 3, creditsCost: 0.8, summary: 'Booked Feb 25 2PM, confirmed, team notified' },
    ],
  },
  {
    id: 'stepper-payment-receipt',
    name: 'Payment Receipt & Activation',
    description: 'Record payment → receipt email → Notion invoice → activate service.',
    status: 'active',
    triggerLabel: 'New submission on Service Payment',
    triggerApp: 'paperform',
    connectedFormId: 'form-service-payment',
    stepsCount: 4,
    appsUsed: ['firestore', 'gmail', 'notion', 'acheevy'],
    runsTotal: 19,
    runsSuccess: 19,
    runsFailed: 0,
    lastRunAt: '2026-02-22T11:30:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 27.5,
    tags: ['payment', 'billing', 'activation'],
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
    recentRuns: [
      { id: 'srun-8', triggeredBy: 'Custom Build Pro ($2,499)', startedAt: '2026-02-22T11:30:00Z', completedAt: '2026-02-22T11:30:25Z', status: 'success', stepsCompleted: 4, stepsTotal: 4, creditsCost: 1.5, summary: 'Payment recorded, receipt sent, activated' },
    ],
  },
  {
    id: 'stepper-project-setup',
    name: 'Project Setup Pipeline',
    description: 'Notion page → Drive folder → AI project plan → kickoff email.',
    status: 'active',
    triggerLabel: 'New submission on Project Kickoff Brief',
    triggerApp: 'paperform',
    connectedFormId: 'form-project-kickoff',
    stepsCount: 5,
    appsUsed: ['notion', 'google_drive', 'anthropic', 'gmail', 'acheevy'],
    runsTotal: 15,
    runsSuccess: 14,
    runsFailed: 1,
    lastRunAt: '2026-02-22T09:00:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 58.5,
    tags: ['project', 'setup', 'kickoff'],
    createdAt: '2026-02-12T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
    recentRuns: [
      { id: 'srun-9', triggeredBy: 'E-commerce Dashboard Rebuild', startedAt: '2026-02-22T09:00:00Z', completedAt: '2026-02-22T09:01:05Z', status: 'success', stepsCompleted: 5, stepsTotal: 5, creditsCost: 4.2, summary: 'Full project setup + AI plan generated' },
    ],
  },
  {
    id: 'stepper-partial-followup',
    name: 'Partial Submission Follow-up',
    description: 'Chat nudge → wait → email follow-up → mark abandoned.',
    status: 'active',
    triggerLabel: 'Partial submission detected (24h)',
    triggerApp: 'paperform',
    connectedFormId: null,
    stepsCount: 6,
    appsUsed: ['acheevy', 'gmail', 'notion'],
    runsTotal: 23,
    runsSuccess: 18,
    runsFailed: 5,
    lastRunAt: '2026-02-22T00:00:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 11.5,
    tags: ['lead-recovery', 'follow-up', 'partial'],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
    recentRuns: [
      { id: 'srun-10', triggeredBy: 'Anonymous user on Onboarding', startedAt: '2026-02-22T00:00:00Z', completedAt: '2026-02-22T00:00:08Z', status: 'success', stepsCompleted: 2, stepsTotal: 6, creditsCost: 0.5, summary: 'Chat nudge sent' },
    ],
  },
  {
    id: 'stepper-survey-processor',
    name: 'Quarterly Survey Processor',
    description: 'Analyze themes → log to Sheets → detect expansion opportunities.',
    status: 'active',
    triggerLabel: 'New submission on Satisfaction Survey',
    triggerApp: 'paperform',
    connectedFormId: 'form-satisfaction-survey',
    stepsCount: 4,
    appsUsed: ['anthropic', 'google_sheets', 'slack'],
    runsTotal: 52,
    runsSuccess: 50,
    runsFailed: 2,
    lastRunAt: '2026-02-20T09:00:00Z',
    lastRunStatus: 'success',
    creditsCostTotal: 52.0,
    tags: ['survey', 'health-score', 'expansion'],
    createdAt: '2026-01-30T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
    recentRuns: [],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const formId = searchParams.get('formId');
  const search = searchParams.get('q');

  let results = WORKFLOWS;

  if (status) {
    results = results.filter(w => w.status === status);
  }
  if (formId) {
    results = results.filter(w => w.connectedFormId === formId);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      w.tags.some(t => t.includes(q))
    );
  }

  const stats = {
    totalWorkflows: WORKFLOWS.length,
    activeWorkflows: WORKFLOWS.filter(w => w.status === 'active').length,
    totalRuns: WORKFLOWS.reduce((s, w) => s + w.runsTotal, 0),
    totalCredits: WORKFLOWS.reduce((s, w) => s + w.creditsCostTotal, 0),
  };

  return NextResponse.json({ workflows: results, stats });
}
