/**
 * A.I.M.S. Form Library — Paperform via Pipedream MCP
 *
 * Form structure definitions for every A.I.M.S. vertical.
 * Forms are designed in Paperform editor; this library defines
 * the schema/structure for reference and catalog display.
 *
 * Runtime data (submission counts, partial counts) comes from
 * Paperform API via Pipedream MCP — NOT hardcoded here.
 */

import type {
  FormDefinition,
  FormTemplate,
  FormCategory,
  FormStatus,
} from './types';

// ─── Form Definitions (structure only — no fake stats) ───────────────────────

const FORM_LIBRARY: FormDefinition[] = [
  {
    id: 'form-onboarding-intake',
    slug: 'aims-onboarding-needs-analysis',
    name: 'Onboarding Needs Analysis',
    description: 'First form every new user completes. Captures who they are, what they need, and routes them to the right path.',
    category: 'onboarding',
    status: 'draft',
    pages: [
      {
        title: 'About You',
        fields: [
          { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'company', label: 'Company / Organization', type: 'text', required: false },
          { key: 'role', label: 'Your Role', type: 'select', required: true, options: ['Founder / CEO', 'CTO / Technical Lead', 'Marketing / Growth', 'Operations', 'Product Manager', 'Developer', 'Freelancer / Consultant', 'Other'] },
          { key: 'industry', label: 'Industry', type: 'select', required: false, options: ['Technology', 'E-commerce', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Media / Entertainment', 'Professional Services', 'Non-profit', 'Other'] },
          { key: 'team_size', label: 'Team Size', type: 'select', required: false, options: ['Just me', '2-5', '6-20', '21-50', '51-200', '200+'] },
        ],
      },
      {
        title: 'What Brings You Here?',
        fields: [
          { key: 'needs', label: 'What do you need help with?', type: 'multi_select', required: true, options: ['Deploy an AI tool or agent', 'Build a custom application', 'Automate repetitive tasks', 'Manage infrastructure / containers', 'Research & analysis', 'Content creation & publishing', 'Client onboarding & intake', 'Financial tracking & billing', 'Other'] },
          { key: 'primary_goal', label: 'Primary Goal', type: 'textarea', required: true, placeholder: 'In one sentence, what would success look like for you?' },
          { key: 'pain_point', label: "What's your biggest pain point right now?", type: 'textarea', required: false, placeholder: "What's taking too much time, costing too much, or just not working?" },
        ],
      },
      {
        title: 'Tool Deployment',
        conditionalOn: { fieldKey: 'needs', value: 'Deploy an AI tool or agent' },
        fields: [
          { key: 'tool_type', label: 'What kind of tool are you looking for?', type: 'multi_select', required: true, options: ['AI chatbot / assistant', 'Research agent', 'Code generation tool', 'Data analysis platform', 'Content creation tool', 'Monitoring / observability', 'Communication bot', 'Custom agent', 'Not sure — help me decide'] },
          { key: 'hosting_pref', label: 'Hosting preference', type: 'select', required: true, options: ['Managed by A.I.M.S. (recommended)', 'Self-hosted', 'Hybrid'] },
          { key: 'usage_scale', label: 'Expected usage scale', type: 'select', required: false, options: ['Light (testing / personal)', 'Medium (small team)', 'Heavy (production)', 'Enterprise (multi-tenant, SLA)'] },
        ],
      },
      {
        title: 'Timeline & Budget',
        fields: [
          { key: 'timeline', label: 'Timeline', type: 'select', required: true, options: ['ASAP — need it this week', '1-2 weeks', '1 month', '2-3 months', 'No rush — exploring'] },
          { key: 'budget', label: 'Monthly budget range', type: 'select', required: false, options: ['Free tier / testing ($0)', 'Starter ($25-100/mo)', 'Growth ($100-500/mo)', 'Pro ($500-2,000/mo)', 'Enterprise ($2,000+/mo)', 'Not sure — help me estimate'] },
          { key: 'wants_consultation', label: 'Would you like a free consultation?', type: 'select', required: false, options: ['Yes — book a 15-min call', 'Maybe later', 'No thanks — just get started'] },
        ],
      },
      {
        title: 'Book a Consultation',
        conditionalOn: { fieldKey: 'wants_consultation', value: 'Yes — book a 15-min call' },
        fields: [
          { key: 'consultation_datetime', label: 'Preferred date/time', type: 'date', required: true },
          { key: 'contact_method', label: 'Preferred contact method', type: 'select', required: true, options: ['Video call (Zoom/Meet)', 'Phone call', 'Chat on A.I.M.S.'] },
          { key: 'consultation_notes', label: 'Anything specific to discuss?', type: 'textarea', required: false },
        ],
      },
    ],
    calculatedFields: [
      { key: 'calc_tier', label: 'Service Tier', type: 'calculated', required: false },
      { key: 'calc_path', label: 'Recommended Path', type: 'calculated', required: false },
      { key: 'calc_priority', label: 'Priority Score', type: 'calculated', required: false },
      { key: 'calc_luc_estimate', label: 'LUC Estimate', type: 'calculated', required: false },
    ],
    settings: {
      showProgressBar: true,
      allowPartialSubmissions: true,
      redirectOnComplete: 'https://plugmein.cloud/chat',
      successMessage: "Welcome to A.I.M.S.! ACHEEVY is reviewing your submission now. Head to chat to get started.",
    },
    theme: { accent: '#F59E0B', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-onboarding-pipeline'],
    tags: ['onboarding', 'intake', 'critical'],
  },

  {
    id: 'form-plug-needs',
    slug: 'aims-plug-needs-analysis',
    name: 'Plug Needs Analysis',
    description: 'Deep-dive into service requirements for plug recommendation. Used by enterprise clients and complex deployments.',
    category: 'needs_analysis',
    status: 'draft',
    pages: [
      {
        title: 'Current Pain Points',
        fields: [
          { key: 'problem', label: 'What problem are you solving?', type: 'textarea', required: true, placeholder: 'Describe the core problem or need' },
          { key: 'tried_tools', label: 'What tools have you tried?', type: 'textarea', required: false, placeholder: 'List tools or approaches you have used' },
          { key: 'not_working', label: "What's not working?", type: 'textarea', required: false },
        ],
      },
      {
        title: 'Requirements',
        fields: [
          { key: 'must_have', label: 'Must-have features', type: 'multi_select', required: true, options: ['AI-powered automation', 'API integrations', 'Custom dashboards', 'Real-time monitoring', 'Multi-user access', 'Self-hosting option', 'Data export', 'SSO / RBAC', 'Compliance (SOC2/HIPAA)', 'Mobile access'] },
          { key: 'nice_to_have', label: 'Nice-to-have features', type: 'multi_select', required: false, options: ['White-label branding', 'Webhooks', 'Custom workflows', 'Billing / invoicing', 'Marketplace / plug-in system', 'Voice interface', 'Offline mode'] },
          { key: 'integrations', label: 'Integration requirements', type: 'multi_select', required: false, options: ['Slack', 'Email (Gmail/Outlook)', 'CRM (Salesforce, HubSpot)', 'Stripe / payments', 'Calendar', 'Cloud storage', 'CI/CD pipeline', 'Database'] },
        ],
      },
      {
        title: 'Scale & Budget',
        fields: [
          { key: 'expected_users', label: 'Expected users / volume', type: 'select', required: true, options: ['1-10 users', '11-50 users', '51-200 users', '200+ users', '1K+ concurrent'] },
          { key: 'budget', label: 'Budget range', type: 'select', required: true, options: ['< $100/mo', '$100-500/mo', '$500-2,000/mo', '$2,000-10,000/mo', '$10,000+/mo'] },
          { key: 'hosting', label: 'Self-hosted or managed?', type: 'select', required: true, options: ['Managed (recommended)', 'Self-hosted', 'Hybrid', 'Need guidance'] },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      allowPartialSubmissions: true,
      successMessage: "Thanks! ACHEEVY will analyze your requirements and recommend the best plugs within minutes.",
    },
    theme: { accent: '#3B82F6', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-needs-analysis-pipeline'],
    tags: ['enterprise', 'needs-analysis', 'plug-recommendation'],
  },

  {
    id: 'form-feedback-nps',
    slug: 'aims-feedback-nps',
    name: 'Feedback & NPS Survey',
    description: 'Post-delivery satisfaction survey with Net Promoter Score tracking. Sent after each milestone or project completion.',
    category: 'feedback',
    status: 'draft',
    pages: [
      {
        title: 'Your Experience',
        fields: [
          { key: 'overall_rating', label: 'Overall satisfaction (1-10)', type: 'rating', required: true },
          { key: 'nps_score', label: 'How likely are you to recommend A.I.M.S.? (0-10)', type: 'rating', required: true },
          { key: 'what_worked', label: 'What worked well?', type: 'textarea', required: false, placeholder: 'Tell us what you liked most' },
          { key: 'what_didnt', label: "What could we improve?", type: 'textarea', required: false, placeholder: 'Honest feedback helps us get better' },
          { key: 'feature_request', label: 'Any features you wish we had?', type: 'textarea', required: false },
          { key: 'testimonial', label: 'Would you like to share a testimonial?', type: 'select', required: false, options: ['Yes — happy to!', 'Maybe later', 'No thanks'] },
        ],
      },
    ],
    settings: {
      showProgressBar: false,
      allowPartialSubmissions: true,
      successMessage: "Thank you for your feedback! Your input directly shapes how we improve A.I.M.S.",
    },
    theme: { accent: '#10B981', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-feedback-processor'],
    tags: ['feedback', 'nps', 'satisfaction'],
  },

  {
    id: 'form-support-request',
    slug: 'aims-support-request',
    name: 'Support Request',
    description: 'Structured issue intake with category routing, urgency triage, and auto-ticket creation.',
    category: 'support',
    status: 'draft',
    pages: [
      {
        title: 'Issue Details',
        fields: [
          { key: 'category', label: 'Issue Category', type: 'select', required: true, options: ['Bug / Error', 'Performance issue', 'Feature request', 'Billing / Account', 'Integration problem', 'Security concern', 'Other'] },
          { key: 'urgency', label: 'Urgency', type: 'select', required: true, options: ['Critical — service down', 'High — major feature broken', 'Medium — workaround available', 'Low — cosmetic / minor'] },
          { key: 'description', label: 'Describe the issue', type: 'textarea', required: true, placeholder: 'What happened? What did you expect to happen?' },
          { key: 'steps_to_reproduce', label: 'Steps to reproduce', type: 'textarea', required: false, placeholder: '1. Go to...\n2. Click on...\n3. See error...' },
          { key: 'screenshots', label: 'Screenshots (optional)', type: 'file', required: false },
          { key: 'affected_service', label: 'Which service/plug is affected?', type: 'text', required: false, placeholder: 'e.g., ACHEEVY chat, Plug Catalog, LUC' },
        ],
      },
    ],
    settings: {
      showProgressBar: false,
      allowPartialSubmissions: false,
      successMessage: "Support request submitted! ACHEEVY will triage this and you'll get an update within the hour.",
    },
    theme: { accent: '#EF4444', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-support-triage'],
    tags: ['support', 'triage', 'tickets'],
  },

  {
    id: 'form-consultation-booking',
    slug: 'aims-consultation-booking',
    name: 'Consultation Booking',
    description: 'Book a 15-minute consultation with the A.I.M.S. team. Calendar-connected with auto-confirmation.',
    category: 'booking',
    status: 'draft',
    pages: [
      {
        title: 'Book Your Consultation',
        fields: [
          { key: 'full_name', label: 'Full Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'company', label: 'Company', type: 'text', required: false },
          { key: 'topic', label: 'What would you like to discuss?', type: 'select', required: true, options: ['Platform overview / demo', 'Enterprise deployment', 'Custom build scoping', 'Pricing & plans', 'Technical integration', 'Partnership / reseller', 'Other'] },
          { key: 'preferred_date', label: 'Preferred Date', type: 'date', required: true },
          { key: 'preferred_time', label: 'Preferred Time', type: 'select', required: true, options: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] },
          { key: 'contact_method', label: 'Contact method', type: 'select', required: true, options: ['Video call (Zoom/Meet)', 'Phone call', 'Chat on A.I.M.S.'] },
          { key: 'notes', label: 'Anything else to know beforehand?', type: 'textarea', required: false },
        ],
      },
    ],
    settings: {
      showProgressBar: false,
      allowPartialSubmissions: false,
      successMessage: "Consultation booked! You'll receive a calendar invite within minutes.",
    },
    theme: { accent: '#8B5CF6', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-booking-confirm'],
    tags: ['booking', 'consultation', 'calendar'],
  },

  {
    id: 'form-service-payment',
    slug: 'aims-service-payment',
    name: 'Service Payment',
    description: 'One-off payment collection for consulting, custom builds, and premium services. Stripe-connected.',
    category: 'payment',
    status: 'draft',
    pages: [
      {
        title: 'Payment Details',
        fields: [
          { key: 'full_name', label: 'Full Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'service_type', label: 'Service', type: 'select', required: true, options: ['Consultation (1 hour)', 'Custom Build — Starter', 'Custom Build — Professional', 'Enterprise Setup', 'Priority Support (monthly)', 'Custom amount'] },
          { key: 'custom_amount', label: 'Custom amount', type: 'number', required: false, conditionalOn: { fieldKey: 'service_type', value: 'Custom amount' } },
          { key: 'payment', label: 'Payment', type: 'payment', required: true },
          { key: 'invoice_notes', label: 'Invoice notes / PO number', type: 'text', required: false },
        ],
      },
    ],
    settings: {
      showProgressBar: false,
      allowPartialSubmissions: false,
      successMessage: "Payment received! A receipt has been sent to your email. ACHEEVY will follow up in chat.",
    },
    theme: { accent: '#F59E0B', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-payment-receipt'],
    tags: ['payment', 'stripe', 'billing'],
  },

  {
    id: 'form-project-kickoff',
    slug: 'aims-project-kickoff',
    name: 'Project Kickoff Brief',
    description: 'Detailed project scope form for custom builds. Captures objectives, deliverables, stakeholders, and constraints.',
    category: 'needs_analysis',
    status: 'draft',
    pages: [
      {
        title: 'Project Overview',
        fields: [
          { key: 'project_name', label: 'Project Name', type: 'text', required: true },
          { key: 'objective', label: 'Project Objective', type: 'textarea', required: true, placeholder: 'What is this project trying to achieve?' },
          { key: 'success_criteria', label: 'Definition of Success', type: 'textarea', required: true, placeholder: 'How will you know when this project is done?' },
        ],
      },
      {
        title: 'Deliverables & Stakeholders',
        fields: [
          { key: 'deliverables', label: 'Key Deliverables', type: 'textarea', required: true, placeholder: 'List the specific outputs expected' },
          { key: 'stakeholders', label: 'Stakeholders', type: 'textarea', required: false, placeholder: 'Who needs to approve or review?' },
          { key: 'constraints', label: 'Known Constraints', type: 'textarea', required: false, placeholder: 'Budget limits, tech requirements, compliance needs' },
          { key: 'deadline', label: 'Target Deadline', type: 'date', required: false },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      allowPartialSubmissions: true,
      successMessage: "Project brief received! ACHEEVY will create your project workspace and Notion page within minutes.",
    },
    theme: { accent: '#3B82F6', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-project-setup'],
    tags: ['project', 'kickoff', 'scope'],
  },

  {
    id: 'form-satisfaction-survey',
    slug: 'aims-satisfaction-survey',
    name: 'Client Satisfaction Survey',
    description: 'Quarterly satisfaction survey for active clients. Tracks service quality, feature usage, and expansion opportunities.',
    category: 'survey',
    status: 'draft',
    pages: [
      {
        title: 'Service Quality',
        fields: [
          { key: 'quality_rating', label: 'How would you rate the overall service quality?', type: 'rating', required: true },
          { key: 'response_time', label: 'Response time satisfaction', type: 'select', required: true, options: ['Excellent', 'Good', 'Acceptable', 'Needs improvement', 'Poor'] },
          { key: 'reliability', label: 'Platform reliability', type: 'select', required: true, options: ['No downtime noticed', 'Minor issues, quickly resolved', 'Some disruptions', 'Frequent issues'] },
        ],
      },
      {
        title: 'Feature Usage & Growth',
        fields: [
          { key: 'most_used', label: 'Most valuable features', type: 'multi_select', required: false, options: ['ACHEEVY chat', 'Plug deployments', 'Automations', 'Research tools', 'LUC calculator', 'Build tools', 'Custom agents', 'NtNtN Studio'] },
          { key: 'expansion_interest', label: 'Interested in expanding usage?', type: 'select', required: false, options: ['Yes — more users/instances', 'Yes — new use cases', 'Happy at current scale', 'Considering downgrade'] },
          { key: 'open_feedback', label: 'Anything else?', type: 'textarea', required: false },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      allowPartialSubmissions: true,
      successMessage: "Thank you for your feedback! Your responses help us improve A.I.M.S. for everyone.",
    },
    theme: { accent: '#10B981', background: '#F8FAFC' },
    submissionCount: 0,
    partialCount: 0,
    createdAt: '',
    updatedAt: '',
    stepperWorkflowIds: ['stepper-survey-processor'],
    tags: ['survey', 'quarterly', 'satisfaction'],
  },
];

// ─── Form Templates (for "Create from Template") ────────────────────────────

const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'tpl-client-onboarding',
    name: 'Client Onboarding Intake',
    description: 'Multi-step form with conditional routing for new client intake.',
    category: 'onboarding',
    icon: 'user-plus',
    pages: FORM_LIBRARY[0].pages,
    calculatedFields: FORM_LIBRARY[0].calculatedFields,
    defaultSettings: FORM_LIBRARY[0].settings,
    recommendedStepperWorkflow: 'stepper-onboarding-pipeline',
    tags: ['onboarding', 'intake'],
  },
  {
    id: 'tpl-needs-analysis',
    name: 'Plug Needs Analysis',
    description: 'Requirements gathering for plug selection and enterprise deployments.',
    category: 'needs_analysis',
    icon: 'clipboard-check',
    pages: FORM_LIBRARY[1].pages,
    defaultSettings: FORM_LIBRARY[1].settings,
    recommendedStepperWorkflow: 'stepper-needs-analysis-pipeline',
    tags: ['needs-analysis', 'enterprise'],
  },
  {
    id: 'tpl-feedback-nps',
    name: 'Feedback & NPS Survey',
    description: 'Quick satisfaction survey with Net Promoter Score.',
    category: 'feedback',
    icon: 'star',
    pages: FORM_LIBRARY[2].pages,
    defaultSettings: FORM_LIBRARY[2].settings,
    recommendedStepperWorkflow: 'stepper-feedback-processor',
    tags: ['feedback', 'nps'],
  },
  {
    id: 'tpl-support-request',
    name: 'Support Request Form',
    description: 'Structured issue intake with urgency triage and auto-routing.',
    category: 'support',
    icon: 'life-buoy',
    pages: FORM_LIBRARY[3].pages,
    defaultSettings: FORM_LIBRARY[3].settings,
    recommendedStepperWorkflow: 'stepper-support-triage',
    tags: ['support', 'triage'],
  },
  {
    id: 'tpl-booking',
    name: 'Consultation Booking',
    description: 'Calendar-connected booking form with auto-confirmation.',
    category: 'booking',
    icon: 'calendar',
    pages: FORM_LIBRARY[4].pages,
    defaultSettings: FORM_LIBRARY[4].settings,
    recommendedStepperWorkflow: 'stepper-booking-confirm',
    tags: ['booking', 'calendar'],
  },
  {
    id: 'tpl-payment',
    name: 'Service Payment Form',
    description: 'Stripe-connected payment collection for one-off services.',
    category: 'payment',
    icon: 'credit-card',
    pages: FORM_LIBRARY[5].pages,
    defaultSettings: FORM_LIBRARY[5].settings,
    recommendedStepperWorkflow: 'stepper-payment-receipt',
    tags: ['payment', 'stripe'],
  },
  {
    id: 'tpl-project-kickoff',
    name: 'Project Kickoff Brief',
    description: 'Detailed scope capture for custom builds.',
    category: 'needs_analysis',
    icon: 'rocket',
    pages: FORM_LIBRARY[6].pages,
    defaultSettings: FORM_LIBRARY[6].settings,
    recommendedStepperWorkflow: 'stepper-project-setup',
    tags: ['project', 'kickoff'],
  },
  {
    id: 'tpl-satisfaction-survey',
    name: 'Client Satisfaction Survey',
    description: 'Quarterly survey tracking service quality and expansion opportunities.',
    category: 'survey',
    icon: 'bar-chart',
    pages: FORM_LIBRARY[7].pages,
    defaultSettings: FORM_LIBRARY[7].settings,
    recommendedStepperWorkflow: 'stepper-survey-processor',
    tags: ['survey', 'quarterly'],
  },
];

// ─── Form Library Engine ─────────────────────────────────────────────────────

class FormLibraryEngine {
  private forms: Map<string, FormDefinition>;
  private templates: Map<string, FormTemplate>;

  constructor() {
    this.forms = new Map();
    this.templates = new Map();
    for (const form of FORM_LIBRARY) {
      this.forms.set(form.id, form);
    }
    for (const tpl of FORM_TEMPLATES) {
      this.templates.set(tpl.id, tpl);
    }
  }

  listForms(filter?: { category?: FormCategory; status?: FormStatus; search?: string }): FormDefinition[] {
    let results = Array.from(this.forms.values());
    if (filter?.category) {
      results = results.filter(f => f.category === filter.category);
    }
    if (filter?.status) {
      results = results.filter(f => f.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some(t => t.includes(q))
      );
    }
    return results;
  }

  getForm(formId: string): FormDefinition | undefined {
    return this.forms.get(formId);
  }

  getFormBySlug(slug: string): FormDefinition | undefined {
    return Array.from(this.forms.values()).find(f => f.slug === slug);
  }

  listTemplates(category?: FormCategory): FormTemplate[] {
    const templates = Array.from(this.templates.values());
    if (category) return templates.filter(t => t.category === category);
    return templates;
  }

  getTemplate(templateId: string): FormTemplate | undefined {
    return this.templates.get(templateId);
  }

  getStats(): { totalForms: number; totalSubmissions: number; totalPartials: number; formsByCategory: Record<string, number> } {
    const forms = Array.from(this.forms.values());
    const byCategory: Record<string, number> = {};
    for (const f of forms) {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    }
    return {
      totalForms: forms.length,
      totalSubmissions: forms.reduce((sum, f) => sum + f.submissionCount, 0),
      totalPartials: forms.reduce((sum, f) => sum + f.partialCount, 0),
      formsByCategory: byCategory,
    };
  }
}

export const formLibrary = new FormLibraryEngine();
export { FORM_LIBRARY, FORM_TEMPLATES };
