/**
 * Form Library & Stepper Automation Types
 *
 * Defines the data model for the A.I.M.S. form library (Paperform via Pipedream MCP)
 * and Stepper workflow automations (stepper.io).
 *
 * Forms are designed in Paperform editor — the API is read-heavy.
 * Stepper automations are configured in Stepper UI but tracked here for display.
 */

// ─── Form Library ─────────────────────────────────────────────────────────────

export type FormCategory =
  | 'onboarding'
  | 'needs_analysis'
  | 'feedback'
  | 'support'
  | 'booking'
  | 'payment'
  | 'survey'
  | 'custom';

export type FormStatus = 'live' | 'draft' | 'archived' | 'template';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'multi_select' | 'number' | 'date' | 'time' | 'textarea' | 'file' | 'payment' | 'rating' | 'signature' | 'calculated' | 'hidden';
  required: boolean;
  options?: string[];
  placeholder?: string;
  conditionalOn?: { fieldKey: string; value: string | string[] };
}

export interface FormPage {
  title: string;
  fields: FormField[];
  conditionalOn?: { fieldKey: string; value: string | string[] };
}

export interface FormDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: FormCategory;
  status: FormStatus;
  pages: FormPage[];
  calculatedFields?: FormField[];
  settings: {
    showProgressBar: boolean;
    allowPartialSubmissions: boolean;
    redirectOnComplete?: string;
    successMessage: string;
  };
  theme: {
    accent: string;
    background: string;
  };
  submissionCount: number;
  partialCount: number;
  createdAt: string;
  updatedAt: string;
  /** Stepper workflow IDs wired to this form's submissions */
  stepperWorkflowIds: string[];
  /** Tags for filtering */
  tags: string[];
}

// ─── Stepper Automations ──────────────────────────────────────────────────────

export type StepperTriggerType = 'form_submission' | 'partial_submission' | 'schedule' | 'api_event' | 'app_trigger';

export type StepperStepType =
  | 'validate'
  | 'store'
  | 'notify'
  | 'create_page'
  | 'create_folder'
  | 'send_email'
  | 'book_calendar'
  | 'ai_process'
  | 'webhook'
  | 'condition'
  | 'delay'
  | 'custom';

export type StepperApp =
  | 'paperform'
  | 'notion'
  | 'google_drive'
  | 'gmail'
  | 'google_calendar'
  | 'slack'
  | 'hubspot'
  | 'stripe'
  | 'anthropic'
  | 'google_sheets'
  | 'airtable'
  | 'linear'
  | 'trello'
  | 'asana'
  | 'calendly'
  | 'twilio'
  | 'acheevy'
  | 'firestore'
  | 'custom';

export type StepperWorkflowStatus = 'active' | 'paused' | 'draft' | 'error';

export interface StepperTrigger {
  type: StepperTriggerType;
  app: StepperApp;
  formId?: string;
  schedule?: string;
  label: string;
}

export interface StepperStep {
  id: string;
  order: number;
  type: StepperStepType;
  app: StepperApp;
  action: string;
  label: string;
  config: Record<string, unknown>;
  /** If type is 'condition', these are the branching paths */
  branches?: { condition: string; thenSteps: string[] }[];
}

export interface StepperRun {
  id: string;
  workflowId: string;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'success' | 'failure' | 'paused';
  stepsCompleted: number;
  stepsTotal: number;
  creditsCost: number;
  summary: string;
}

export interface StepperWorkflow {
  id: string;
  name: string;
  description: string;
  status: StepperWorkflowStatus;
  trigger: StepperTrigger;
  steps: StepperStep[];
  connectedFormId?: string;
  runs: StepperRun[];
  runsTotal: number;
  runsSuccess: number;
  runsFailed: number;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failure' | 'running' | null;
  creditsCostTotal: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// ─── Template Types ───────────────────────────────────────────────────────────

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: FormCategory;
  icon: string;
  pages: FormPage[];
  calculatedFields?: FormField[];
  defaultSettings: FormDefinition['settings'];
  recommendedStepperWorkflow?: string;
  tags: string[];
}

export interface StepperWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  triggerType: StepperTriggerType;
  triggerApp: StepperApp;
  steps: Omit<StepperStep, 'id'>[];
  requiredApps: StepperApp[];
  estimatedCreditsPerRun: number;
  tags: string[];
}
