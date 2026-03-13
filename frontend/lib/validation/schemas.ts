/**
 * A.I.M.S. — Zod Validation Schemas
 *
 * Centralized input validation for all forms and API routes.
 * Used both client-side (react-hook-form) and server-side (API routes).
 */
import { z } from 'zod';

// ── Chat ─────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(32_000, 'Message exceeds maximum length'),
  model: z.string().optional(),
  conversationId: z.string().uuid().optional(),
  contextPacks: z.array(z.string()).optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

const requestAttachmentSchema = z.object({
  type: z.string().optional(),
  name: z.string().max(255).optional(),
  mimeType: z.string().max(255).optional(),
});

const requestMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().min(1, 'Message content is required').max(32_000),
  attachments: z.array(requestAttachmentSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const chatRequestSchema = z.object({
  messages: z.array(requestMessageSchema).min(1, 'At least one message is required'),
  model: z.string().max(255).optional(),
  personaId: z.string().max(255).optional(),
  contextPackIds: z.array(z.string().max(255)).max(20).optional(),
  userId: z.string().max(255).optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

// ── Auth / Onboarding ────────────────────────────────────────

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().max(60).optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  businessName: z.string().max(120).optional().or(z.literal('')),
  businessType: z.string().max(80).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  state: z.string().max(80).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const onboardingProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(80),
  company: z.string().max(100).optional(),
  role: z.string().max(80).optional(),
  industry: z.string().max(80).optional(),
});

export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;

export const onboardingRequestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  region: z.string().max(120).optional().or(z.literal('')),
  objective: z.string().max(240).optional().or(z.literal('')),
  industry: z.string().max(120).optional().or(z.literal('')),
  companyName: z.string().max(120).optional().or(z.literal('')),
});

export type OnboardingRequestInput = z.infer<typeof onboardingRequestSchema>;

export const onboardingGoalSchema = z.object({
  goals: z.array(z.string()).min(1, 'Select at least one goal'),
});

export type OnboardingGoalInput = z.infer<typeof onboardingGoalSchema>;

// ── Billing ──────────────────────────────────────────────────

export const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ── Plug Management ──────────────────────────────────────────

export const plugDeploySchema = z.object({
  plugId: z.string().min(1, 'Plug ID is required'),
  name: z.string().min(1, 'Instance name is required').max(64, 'Name too long')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Name must be lowercase alphanumeric with hyphens only'),
  envVars: z.record(z.string(), z.string()).optional(),
});

export type PlugDeployInput = z.infer<typeof plugDeploySchema>;

export const plugActionSchema = z.object({
  instanceId: z.string().min(1, 'Instance ID is required'),
  action: z.enum(['start', 'stop', 'restart', 'destroy', 'scale']),
  replicas: z.number().int().min(0).max(10).optional(),
});

export type PlugActionInput = z.infer<typeof plugActionSchema>;

// ── Projects ─────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const arenaContestCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(160),
  description: z.string().max(2_000).optional(),
  type: z.string().min(1, 'Type is required').max(80),
  category: z.string().max(80).optional(),
  entryFee: z.number().min(0).max(10_000).optional(),
  maxEntries: z.number().int().min(2).max(100_000).optional(),
  startsAt: z.string().datetime('startsAt must be a valid ISO datetime'),
  endsAt: z.string().datetime('endsAt must be a valid ISO datetime'),
  contestData: z.record(z.unknown()).optional(),
  prizeStructure: z.record(z.number()).optional(),
  difficulty: z.string().max(40).optional(),
});

export type ArenaContestCreateInput = z.infer<typeof arenaContestCreateSchema>;

export const codeExecuteSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50_000),
  language: z.enum(['python', 'node', 'bash']).optional(),
  packages: z.array(z.string().max(100)).max(100).optional(),
});

export type CodeExecuteInput = z.infer<typeof codeExecuteSchema>;

const personaplexBaseSchema = z.object({
  action: z.enum(['start', 'speak', 'chat', 'status']),
  sessionId: z.string().max(255).optional(),
  text: z.string().max(10_000).optional(),
  messages: z.array(z.record(z.unknown())).max(100).optional(),
  type: z.string().max(80).optional(),
  projectName: z.string().max(255).optional(),
  summary: z.string().max(4_000).optional(),
});

export const personaplexRequestSchema = personaplexBaseSchema.superRefine((data, ctx) => {
  if ((data.action === 'speak' || data.action === 'chat' || data.action === 'status') && !data.sessionId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sessionId'], message: 'sessionId is required for this action' });
  }
  if (data.action === 'speak' && !data.text) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'text is required for speak action' });
  }
  if (data.action === 'chat' && (!data.messages || data.messages.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['messages'], message: 'messages are required for chat action' });
  }
});

export type PersonaplexRequestInput = z.infer<typeof personaplexRequestSchema>;

// ── Gateway: SDT ─────────────────────────────────────────────

export const sdtIssueSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required').max(200),
  recipientId: z.string().min(1, 'Recipient is required'),
  expiresInHours: z.number().int().min(1).max(720).default(24),
});

export type SDTIssueInput = z.infer<typeof sdtIssueSchema>;

// ── Gateway: Evidence Locker ─────────────────────────────────

export const evidenceLockSchema = z.object({
  artifactId: z.string().min(1, 'Artifact ID is required'),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export type EvidenceLockInput = z.infer<typeof evidenceLockSchema>;

// ── Contact / Intake Form ────────────────────────────────────

export const intakeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  company: z.string().max(100).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  type: z.enum(['general', 'demo', 'enterprise', 'support']).default('general'),
});

export type IntakeFormInput = z.infer<typeof intakeFormSchema>;

// ── Memory / Session ─────────────────────────────────────────

export const sessionSnapshotSchema = z.object({
  sessionId: z.string().min(1),
  contextPacks: z.array(z.string()).optional(),
  modelChoice: z.string().optional(),
  speechEnabled: z.boolean().optional(),
});

export type SessionSnapshotInput = z.infer<typeof sessionSnapshotSchema>;

// ── Upload ───────────────────────────────────────────────────

export const uploadMetadataSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255)
    .refine(name => !/[<>:"/\\|?*\x00-\x1f]/.test(name), 'Invalid characters in filename'),
  contentType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Invalid content type'),
  size: z.number().int().min(1).max(50 * 1024 * 1024, 'File exceeds 50MB limit'),
});

export type UploadMetadataInput = z.infer<typeof uploadMetadataSchema>;

// ── Utility: Parse and return typed errors ───────────────────

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate input against a Zod schema.
 * Returns parsed data on success, or an array of field-level errors.
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
