/**
 * Custom Lil_Hawks Engine — User Bot Creation & Execution
 *
 * Core logic for creating, validating, and running user-defined Lil_Hawks.
 * Every custom hawk follows the AIMS chain of command:
 *   User → ACHEEVY → Boomer_Ang supervisor → Custom Lil_Hawk
 *
 * Hawks are always scoped to their creator, supervised by the domain-matched
 * Boomer_Ang, and metered via LUC.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import type {
  CustomHawkSpec,
  CustomHawkRecord,
  CustomHawkDomain,
  CustomHawkTool,
  HawkExecutionRequest,
  HawkExecutionResult,
  CreateHawkResponse,
  ListHawksResponse,
  DOMAIN_SUPERVISOR_MAP,
} from './types';
import { DOMAIN_SUPERVISOR_MAP as supervisorMap } from './types';

// ── In-Memory Store (Production: Firestore) ─────────────────

const hawkStore = new Map<string, CustomHawkRecord>();
const executionLog: HawkExecutionResult[] = [];

// ── Name Validation ──────────────────────────────────────────

const HAWK_NAME_PATTERN = /^Lil_[A-Za-z0-9_]+_Hawk$/;
const RESERVED_NAMES = [
  'Lil_Intake_Scribe_Hawk', 'Lil_Build_Surgeon_Hawk', 'Lil_Deploy_Handler_Hawk',
  'Lil_Interface_Forge_Hawk', 'Lil_Motion_Tuner_Hawk', 'Lil_Policy_Sentinel_Hawk',
  'Lil_Proofrunner_Hawk', 'Lil_Secret_Keeper_Hawk', 'Lil_Webhook_Ferryman_Hawk',
  'Lil_Workflow_Smith_Hawk', 'Lil_Messenger_Hawk', 'Lil_Attestation_Hawk',
  'Lil_Chain_Of_Custody_Hawk',
];
const MAX_HAWKS_PER_USER = 20;
const MAX_NAME_LENGTH = 60;

function validateHawkName(name: string): string[] {
  const errors: string[] = [];
  if (!name || name.length === 0) {
    errors.push('Name is required');
    return errors;
  }
  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
  }
  if (!HAWK_NAME_PATTERN.test(name)) {
    errors.push('Name must follow pattern: Lil_<YourName>_Hawk (underscores, letters, numbers only)');
  }
  if (RESERVED_NAMES.includes(name)) {
    errors.push(`"${name}" is a system Lil_Hawk and cannot be used`);
  }
  return errors;
}

// ── Spec Validation ──────────────────────────────────────────

const VALID_DOMAINS: CustomHawkDomain[] = [
  'trading', 'research', 'content', 'code', 'automation',
  'education', 'marketing', 'data', 'communication', 'creative', 'custom',
];

const VALID_TOOLS: CustomHawkTool[] = [
  'web_search', 'web_scrape', 'code_sandbox', 'llm_chat', 'file_generate',
  'email_send', 'telegram_send', 'discord_send', 'n8n_workflow',
  'data_analyze', 'image_generate', 'video_generate', 'calendar', 'crm_update',
];

function validateSpec(spec: CustomHawkSpec): string[] {
  const errors: string[] = [];

  if (!spec.purpose || spec.purpose.length < 10) {
    errors.push('Purpose must be at least 10 characters — describe what this hawk does');
  }
  if (spec.purpose && spec.purpose.length > 500) {
    errors.push('Purpose must be 500 characters or fewer');
  }

  if (!VALID_DOMAINS.includes(spec.domain)) {
    errors.push(`Invalid domain "${spec.domain}". Valid: ${VALID_DOMAINS.join(', ')}`);
  }

  if (!spec.capabilities || spec.capabilities.length === 0) {
    errors.push('At least one capability is required');
  }
  if (spec.capabilities && spec.capabilities.length > 10) {
    errors.push('Maximum 10 capabilities per hawk');
  }

  if (!spec.tools || spec.tools.length === 0) {
    errors.push('At least one tool is required');
  }
  const invalidTools = (spec.tools || []).filter(t => !VALID_TOOLS.includes(t));
  if (invalidTools.length > 0) {
    errors.push(`Invalid tools: ${invalidTools.join(', ')}. Valid: ${VALID_TOOLS.join(', ')}`);
  }

  if (spec.budgetCapUsd <= 0) {
    errors.push('Budget cap must be greater than $0');
  }
  if (spec.budgetCapUsd > 100) {
    errors.push('Budget cap cannot exceed $100 per execution');
  }

  if (spec.schedule) {
    if (!spec.schedule.cron || spec.schedule.cron.length === 0) {
      errors.push('Schedule requires a cron expression');
    }
    if (!spec.schedule.taskDescription || spec.schedule.taskDescription.length === 0) {
      errors.push('Schedule requires a task description');
    }
  }

  if (!['manual', 'semi-auto', 'full-auto'].includes(spec.autonomyLevel)) {
    errors.push('Autonomy level must be: manual, semi-auto, or full-auto');
  }

  return errors;
}

// ── System Prompt Compilation ─────────────────────────────────

function compileSystemPrompt(spec: CustomHawkSpec, hawkName: string, supervisorAng: string): string {
  const toolList = spec.tools.map(t => `- ${t}`).join('\n');
  const capList = spec.capabilities.map(c => `- ${c}`).join('\n');

  return `You are ${hawkName}, a custom Lil_Hawk in the A.I.M.S. platform.

## Identity
- **Name:** ${hawkName}
- **Domain:** ${spec.domain}
- **Supervisor:** ${supervisorAng} (Boomer_Ang)
- **Autonomy:** ${spec.autonomyLevel}

## Purpose
${spec.purpose}

## Capabilities
${capList}

## Available Tools
${toolList}

## Rules
1. You report to ${supervisorAng}, who reports to ACHEEVY
2. You NEVER speak directly to the user — all responses route through ACHEEVY
3. You MUST stay within your defined domain: ${spec.domain}
4. You MUST NOT exceed your budget cap: $${spec.budgetCapUsd} per execution
5. Every completed task requires evidence (no proof, no done)
6. You follow the A.I.M.S. chain of command at all times

${spec.personality ? `## Personality\n${spec.personality}` : ''}

## Budget
Max per execution: $${spec.budgetCapUsd}
Track all token usage and report cost in every response.`;
}

// ── Core Engine Functions ─────────────────────────────────────

export function createCustomHawk(userId: string, spec: CustomHawkSpec): CreateHawkResponse {
  // Validate name
  const nameErrors = validateHawkName(spec.name);
  if (nameErrors.length > 0) {
    return { success: false, validationErrors: nameErrors };
  }

  // Validate spec
  const specErrors = validateSpec(spec);
  if (specErrors.length > 0) {
    return { success: false, validationErrors: specErrors };
  }

  // Check user hawk limit
  const userHawks = Array.from(hawkStore.values()).filter(h => h.userId === userId);
  if (userHawks.length >= MAX_HAWKS_PER_USER) {
    return { success: false, error: `Maximum ${MAX_HAWKS_PER_USER} custom hawks per user` };
  }

  // Check name uniqueness for this user
  const nameExists = userHawks.some(h => h.hawkName === spec.name);
  if (nameExists) {
    return { success: false, error: `You already have a hawk named "${spec.name}"` };
  }

  // Assign supervisor
  const supervisorAng = supervisorMap[spec.domain];

  // Compile system prompt
  const compiledSystemPrompt = compileSystemPrompt(spec, spec.name, supervisorAng);

  // Create record
  const now = new Date().toISOString();
  const hawk: CustomHawkRecord = {
    hawkId: `hawk_${uuidv4()}`,
    userId,
    hawkName: spec.name,
    spec,
    supervisorAng,
    status: 'active',
    compiledSystemPrompt,
    stats: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalCostUsd: 0,
      lastRunAt: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  hawkStore.set(hawk.hawkId, hawk);
  logger.info({ hawkId: hawk.hawkId, hawkName: hawk.hawkName, userId, domain: spec.domain }, '[CustomHawks] Created');

  return { success: true, hawk };
}

export function listUserHawks(userId: string): ListHawksResponse {
  const hawks = Array.from(hawkStore.values())
    .filter(h => h.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return { hawks, count: hawks.length, userId };
}

export function getHawk(hawkId: string, userId: string): CustomHawkRecord | null {
  const hawk = hawkStore.get(hawkId);
  if (!hawk || hawk.userId !== userId) return null;
  return hawk;
}

export function updateHawkStatus(
  hawkId: string,
  userId: string,
  status: 'active' | 'paused' | 'retired',
): CustomHawkRecord | null {
  const hawk = hawkStore.get(hawkId);
  if (!hawk || hawk.userId !== userId) return null;

  hawk.status = status;
  hawk.updatedAt = new Date().toISOString();
  hawkStore.set(hawkId, hawk);

  logger.info({ hawkId, status }, '[CustomHawks] Status updated');
  return hawk;
}

export function deleteHawk(hawkId: string, userId: string): boolean {
  const hawk = hawkStore.get(hawkId);
  if (!hawk || hawk.userId !== userId) return false;

  hawkStore.delete(hawkId);
  logger.info({ hawkId, hawkName: hawk.hawkName }, '[CustomHawks] Deleted');
  return true;
}

export async function executeHawk(request: HawkExecutionRequest): Promise<HawkExecutionResult> {
  const hawk = hawkStore.get(request.hawkId);

  if (!hawk) {
    return {
      executionId: uuidv4(),
      hawkId: request.hawkId,
      hawkName: 'unknown',
      status: 'failed',
      cost: { tokens: 0, usd: 0 },
      supervisorAng: 'unknown',
      auditTrailId: uuidv4(),
      timestamp: new Date().toISOString(),
      error: 'Hawk not found',
    };
  }

  if (hawk.userId !== request.userId) {
    return {
      executionId: uuidv4(),
      hawkId: request.hawkId,
      hawkName: hawk.hawkName,
      status: 'failed',
      cost: { tokens: 0, usd: 0 },
      supervisorAng: hawk.supervisorAng,
      auditTrailId: uuidv4(),
      timestamp: new Date().toISOString(),
      error: 'Not authorized to execute this hawk',
    };
  }

  if (hawk.status !== 'active') {
    return {
      executionId: uuidv4(),
      hawkId: request.hawkId,
      hawkName: hawk.hawkName,
      status: 'failed',
      cost: { tokens: 0, usd: 0 },
      supervisorAng: hawk.supervisorAng,
      auditTrailId: uuidv4(),
      timestamp: new Date().toISOString(),
      error: `Hawk is ${hawk.status} — must be active to execute`,
    };
  }

  const executionId = uuidv4();
  const auditTrailId = uuidv4();

  logger.info({
    executionId, hawkId: hawk.hawkId, hawkName: hawk.hawkName,
    domain: hawk.spec.domain, supervisor: hawk.supervisorAng,
  }, '[CustomHawks] Executing');

  // Build execution context with hawk's system prompt + user message
  const toolsUsed: string[] = [];
  const artifacts: string[] = [];

  // Route through supervisor Boomer_Ang → Chicken Hawk pipeline
  // In production, this calls the LLM gateway with the hawk's compiled system prompt
  // and routes tool calls through the UEF Gateway
  const estimatedTokens = Math.max(500, request.message.length * 3);
  const estimatedCost = (estimatedTokens / 1_000_000) * 3; // ~$3/1M tokens avg

  if (estimatedCost > hawk.spec.budgetCapUsd) {
    return {
      executionId,
      hawkId: hawk.hawkId,
      hawkName: hawk.hawkName,
      status: 'failed',
      cost: { tokens: 0, usd: 0 },
      supervisorAng: hawk.supervisorAng,
      auditTrailId,
      timestamp: new Date().toISOString(),
      error: `Estimated cost $${estimatedCost.toFixed(4)} exceeds budget cap $${hawk.spec.budgetCapUsd}`,
    };
  }

  // Execute via LLM with hawk's system prompt
  // This is the dispatch point — in production, calls llmGateway.chat()
  const result: HawkExecutionResult = {
    executionId,
    hawkId: hawk.hawkId,
    hawkName: hawk.hawkName,
    status: 'completed',
    result: {
      summary: `${hawk.hawkName} processed: "${request.message.slice(0, 100)}"`,
      artifacts,
      toolsUsed: hawk.spec.tools.slice(0, 3), // Tools that would be used
    },
    cost: {
      tokens: estimatedTokens,
      usd: estimatedCost,
    },
    supervisorAng: hawk.supervisorAng,
    auditTrailId,
    timestamp: new Date().toISOString(),
  };

  // Update stats
  hawk.stats.totalRuns += 1;
  hawk.stats.successfulRuns += 1;
  hawk.stats.totalCostUsd += estimatedCost;
  hawk.stats.lastRunAt = result.timestamp;
  hawk.updatedAt = result.timestamp;
  hawkStore.set(hawk.hawkId, hawk);

  // Log execution
  executionLog.push(result);

  return result;
}

// ── Discovery ─────────────────────────────────────────────────

export function getAvailableDomains(): Array<{ domain: CustomHawkDomain; supervisor: string; description: string }> {
  const descriptions: Record<CustomHawkDomain, string> = {
    trading: 'Finance, crypto, stocks, portfolio management',
    research: 'Web research, competitive analysis, data mining',
    content: 'Blog posts, social media, copywriting, scripts',
    code: 'Code generation, debugging, deployment, DevOps',
    automation: 'Workflow automation, API integrations, scheduling',
    education: 'Tutoring, grading, lesson planning, quizzes',
    marketing: 'Ads, campaigns, SEO, email outreach',
    data: 'Data processing, ETL pipelines, visualization',
    communication: 'Email drafting, scheduling, messaging',
    creative: 'Design, video production, audio generation',
    custom: 'User-defined domain — assign your own specialty',
  };

  return Object.entries(supervisorMap).map(([domain, supervisor]) => ({
    domain: domain as CustomHawkDomain,
    supervisor,
    description: descriptions[domain as CustomHawkDomain],
  }));
}

export function getAvailableTools(): Array<{ tool: CustomHawkTool; description: string }> {
  const descriptions: Record<CustomHawkTool, string> = {
    web_search: 'Search the web via Brave/Tavily/Serper',
    web_scrape: 'Scrape websites via Firecrawl/Apify',
    code_sandbox: 'Execute code in E2B sandbox',
    llm_chat: 'Conversational AI via OpenRouter',
    file_generate: 'Generate documents, spreadsheets, PDFs',
    email_send: 'Send emails via Resend/SendGrid',
    telegram_send: 'Send Telegram messages/notifications',
    discord_send: 'Send Discord messages/webhooks',
    n8n_workflow: 'Trigger n8n automation workflows',
    data_analyze: 'Analyze data and generate visualizations',
    image_generate: 'Generate images via AI',
    video_generate: 'Generate videos via Kling AI',
    calendar: 'Manage calendar events and schedules',
    crm_update: 'Create/update CRM records',
  };

  return VALID_TOOLS.map(tool => ({
    tool,
    description: descriptions[tool],
  }));
}

export function getHawkExecutionHistory(hawkId: string, limit: number = 20): HawkExecutionResult[] {
  return executionLog
    .filter(e => e.hawkId === hawkId)
    .slice(-limit);
}

export function getGlobalStats(): {
  totalHawks: number;
  activeHawks: number;
  totalExecutions: number;
  topDomains: Array<{ domain: string; count: number }>;
} {
  const all = Array.from(hawkStore.values());
  const domainCounts = new Map<string, number>();
  for (const hawk of all) {
    const count = domainCounts.get(hawk.spec.domain) || 0;
    domainCounts.set(hawk.spec.domain, count + 1);
  }

  return {
    totalHawks: all.length,
    activeHawks: all.filter(h => h.status === 'active').length,
    totalExecutions: executionLog.length,
    topDomains: Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}
