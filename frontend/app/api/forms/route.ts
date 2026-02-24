import { NextRequest, NextResponse } from 'next/server';

/**
 * Forms API — List and search forms from the Paperform form library.
 * In production, this proxies to UEF Gateway → Pipedream MCP → Paperform.
 * For now, serves the local form library definitions.
 */

// ─── Types (mirrors backend/uef-gateway/src/forms/types.ts) ─────────────────

interface FormDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: string;
  pageCount: number;
  fieldCount: number;
  submissionCount: number;
  partialCount: number;
  theme: { accent: string; background: string };
  stepperWorkflowIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Form Library (summary data for list view) ──────────────────────────────

const FORMS: FormDefinition[] = [
  {
    id: 'form-onboarding-intake',
    slug: 'aims-onboarding-needs-analysis',
    name: 'Onboarding Needs Analysis',
    description: 'First form every new user completes. Captures identity, goals, and service routing.',
    category: 'onboarding',
    status: 'live',
    pageCount: 5,
    fieldCount: 18,
    submissionCount: 142,
    partialCount: 23,
    theme: { accent: '#F59E0B', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-onboarding-pipeline'],
    tags: ['onboarding', 'intake', 'critical'],
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'form-plug-needs',
    slug: 'aims-plug-needs-analysis',
    name: 'Plug Needs Analysis',
    description: 'Deep-dive requirements for plug recommendation and enterprise deployments.',
    category: 'needs_analysis',
    status: 'live',
    pageCount: 3,
    fieldCount: 9,
    submissionCount: 67,
    partialCount: 12,
    theme: { accent: '#3B82F6', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-needs-analysis-pipeline'],
    tags: ['enterprise', 'needs-analysis', 'plug-recommendation'],
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-02-18T00:00:00Z',
  },
  {
    id: 'form-feedback-nps',
    slug: 'aims-feedback-nps',
    name: 'Feedback & NPS Survey',
    description: 'Post-delivery satisfaction survey with Net Promoter Score tracking.',
    category: 'feedback',
    status: 'live',
    pageCount: 1,
    fieldCount: 6,
    submissionCount: 89,
    partialCount: 8,
    theme: { accent: '#10B981', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-feedback-processor'],
    tags: ['feedback', 'nps', 'satisfaction'],
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'form-support-request',
    slug: 'aims-support-request',
    name: 'Support Request',
    description: 'Structured issue intake with urgency triage and auto-ticket creation.',
    category: 'support',
    status: 'live',
    pageCount: 1,
    fieldCount: 6,
    submissionCount: 34,
    partialCount: 2,
    theme: { accent: '#EF4444', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-support-triage'],
    tags: ['support', 'triage', 'tickets'],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
  },
  {
    id: 'form-consultation-booking',
    slug: 'aims-consultation-booking',
    name: 'Consultation Booking',
    description: 'Calendar-connected booking form with auto-confirmation.',
    category: 'booking',
    status: 'live',
    pageCount: 1,
    fieldCount: 8,
    submissionCount: 28,
    partialCount: 5,
    theme: { accent: '#8B5CF6', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-booking-confirm'],
    tags: ['booking', 'consultation', 'calendar'],
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-02-21T00:00:00Z',
  },
  {
    id: 'form-service-payment',
    slug: 'aims-service-payment',
    name: 'Service Payment',
    description: 'Stripe-connected payment collection for consulting and premium services.',
    category: 'payment',
    status: 'live',
    pageCount: 1,
    fieldCount: 6,
    submissionCount: 19,
    partialCount: 7,
    theme: { accent: '#F59E0B', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-payment-receipt'],
    tags: ['payment', 'stripe', 'billing'],
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
  },
  {
    id: 'form-project-kickoff',
    slug: 'aims-project-kickoff',
    name: 'Project Kickoff Brief',
    description: 'Detailed scope form for custom builds — objectives, deliverables, constraints.',
    category: 'needs_analysis',
    status: 'live',
    pageCount: 2,
    fieldCount: 7,
    submissionCount: 15,
    partialCount: 4,
    theme: { accent: '#3B82F6', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-project-setup'],
    tags: ['project', 'kickoff', 'scope'],
    createdAt: '2026-02-12T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z',
  },
  {
    id: 'form-satisfaction-survey',
    slug: 'aims-satisfaction-survey',
    name: 'Client Satisfaction Survey',
    description: 'Quarterly survey for active clients — quality, reliability, expansion interest.',
    category: 'survey',
    status: 'live',
    pageCount: 2,
    fieldCount: 6,
    submissionCount: 52,
    partialCount: 11,
    theme: { accent: '#10B981', background: '#F8FAFC' },
    stepperWorkflowIds: ['stepper-survey-processor'],
    tags: ['survey', 'quarterly', 'satisfaction'],
    createdAt: '2026-01-30T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const search = searchParams.get('q');

  let results = FORMS;

  if (category) {
    results = results.filter(f => f.category === category);
  }
  if (status) {
    results = results.filter(f => f.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.tags.some(t => t.includes(q))
    );
  }

  const stats = {
    totalForms: FORMS.length,
    totalSubmissions: FORMS.reduce((s, f) => s + f.submissionCount, 0),
    totalPartials: FORMS.reduce((s, f) => s + f.partialCount, 0),
    liveForms: FORMS.filter(f => f.status === 'live').length,
  };

  return NextResponse.json({ forms: results, stats });
}
