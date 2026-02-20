/**
 * Custom Lil_Hawks — User-Created Bot System
 *
 * Lets users create their own Lil_Hawks with custom names, specialties,
 * and task configurations. Think "Lil_Increase_My_Money_Hawk" for trading,
 * "Lil_Grade_My_Essay_Hawk" for education, etc.
 *
 * Users name them, configure them, and deploy them into sandboxes,
 * LiveSim rooms, or persistent automation slots.
 *
 * Spawned hawks are always scoped to the user who created them and
 * supervised by the nearest matching Boomer_Ang.
 */

// ── Custom Hawk Definition ───────────────────────────────────

export interface CustomHawkSpec {
  /** User-chosen name: "Lil_<UserName>_Hawk" pattern enforced */
  name: string;

  /** What this hawk does in plain English */
  purpose: string;

  /** Domain category for routing to the right Boomer_Ang supervisor */
  domain: CustomHawkDomain;

  /** Specific capabilities the user wants this hawk to have */
  capabilities: string[];

  /** Tools this hawk can access (subset of AIMS tool catalog) */
  tools: CustomHawkTool[];

  /** How the hawk should behave — system prompt overlay */
  personality?: string;

  /** Trigger phrases that activate this hawk in chat */
  triggers?: string[];

  /** Schedule for recurring tasks (cron-like) */
  schedule?: HawkSchedule | null;

  /** Max budget per execution in USD */
  budgetCapUsd: number;

  /** Whether the hawk can run autonomously or needs user approval per action */
  autonomyLevel: 'manual' | 'semi-auto' | 'full-auto';
}

export type CustomHawkDomain =
  | 'trading'        // Finance, crypto, stocks, portfolio
  | 'research'       // Web research, data analysis, reports
  | 'content'        // Writing, social media, copywriting
  | 'code'           // Code generation, debugging, deployment
  | 'automation'     // Workflow automation, integrations
  | 'education'      // Tutoring, grading, lesson planning
  | 'marketing'      // Ads, campaigns, SEO, outreach
  | 'data'           // Data processing, ETL, visualization
  | 'communication'  // Email, messaging, scheduling
  | 'creative'       // Design, video, audio generation
  | 'custom';        // User-defined domain

export type CustomHawkTool =
  | 'web_search'     // Brave/Tavily/Serper
  | 'web_scrape'     // Firecrawl/Apify
  | 'code_sandbox'   // E2B code execution
  | 'llm_chat'       // LLM conversation
  | 'file_generate'  // Document/spreadsheet generation
  | 'email_send'     // Resend/SendGrid
  | 'telegram_send'  // Telegram notifications
  | 'discord_send'   // Discord notifications
  | 'n8n_workflow'   // n8n automation trigger
  | 'data_analyze'   // Data analysis + visualization
  | 'image_generate' // Image generation
  | 'video_generate' // Kling AI video
  | 'calendar'       // Calendar management
  | 'crm_update';    // CRM record management

export interface HawkSchedule {
  /** Cron expression (e.g., "0 9 * * 1-5" for weekdays at 9am) */
  cron: string;

  /** Timezone */
  timezone: string;

  /** What the hawk does on schedule */
  taskDescription: string;

  /** Whether to notify user on completion */
  notifyOnComplete: boolean;
}

// ── Domain → Boomer_Ang Mapping ───────────────────────────────

export const DOMAIN_SUPERVISOR_MAP: Record<CustomHawkDomain, string> = {
  trading: 'analyst-ang',
  research: 'Scout_Ang',
  content: 'marketer-ang',
  code: 'Patchsmith_Ang',
  automation: 'OpsConsole_Ang',
  education: 'Scribe_Ang',
  marketing: 'marketer-ang',
  data: 'Index_Ang',
  communication: 'Runner_Ang',
  creative: 'Showrunner_Ang',
  custom: 'Forge_Ang',
};

// ── Custom Hawk Record (persisted) ─────────────────────────────

export interface CustomHawkRecord {
  /** Unique ID */
  hawkId: string;

  /** User who created this hawk */
  userId: string;

  /** Full Lil_Hawk name (validated pattern) */
  hawkName: string;

  /** The user-provided spec */
  spec: CustomHawkSpec;

  /** Auto-assigned supervisor Boomer_Ang */
  supervisorAng: string;

  /** Current status */
  status: 'draft' | 'active' | 'paused' | 'retired';

  /** System prompt compiled from spec */
  compiledSystemPrompt: string;

  /** Execution stats */
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalCostUsd: number;
    lastRunAt: string | null;
  };

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

// ── Custom Hawk Execution ──────────────────────────────────────

export interface HawkExecutionRequest {
  hawkId: string;
  userId: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface HawkExecutionResult {
  executionId: string;
  hawkId: string;
  hawkName: string;
  status: 'completed' | 'failed' | 'pending_approval';
  result?: {
    summary: string;
    artifacts: string[];
    toolsUsed: string[];
  };
  cost: {
    tokens: number;
    usd: number;
  };
  supervisorAng: string;
  auditTrailId: string;
  timestamp: string;
  error?: string;
}

// ── API Response Types ─────────────────────────────────────────

export interface CreateHawkResponse {
  success: boolean;
  hawk?: CustomHawkRecord;
  error?: string;
  validationErrors?: string[];
}

export interface ListHawksResponse {
  hawks: CustomHawkRecord[];
  count: number;
  userId: string;
}
