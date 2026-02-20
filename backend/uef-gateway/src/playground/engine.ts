/**
 * Playground Engine — Sandbox Execution & Management
 *
 * Manages playground sessions for code execution, prompt testing,
 * agent testing, training data work, and education.
 *
 * In production, code playgrounds connect to E2B sandboxes.
 * Prompt playgrounds route through the LLM gateway.
 * Agent playgrounds use the Custom Lil_Hawks engine.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import type {
  PlaygroundSession,
  PlaygroundExecution,
  PlaygroundFile,
  PlaygroundType,
  PlaygroundConfig,
  CreatePlaygroundRequest,
  ExecuteInPlaygroundRequest,
  PlaygroundResponse,
} from './types';

// ── In-Memory Store (Production: Firestore + Redis) ──────────

const sessionStore = new Map<string, PlaygroundSession>();

// ── Session Limits ───────────────────────────────────────────

const DEFAULT_MAX_DURATION_MINUTES = 60;
const MAX_SESSIONS_PER_USER = 5;
const MAX_EXECUTIONS_PER_SESSION = 100;
const MAX_FILES_PER_SESSION = 50;

// ── Create Playground Session ────────────────────────────────

export function createPlayground(request: CreatePlaygroundRequest): PlaygroundResponse {
  // Validate user session count
  const userSessions = Array.from(sessionStore.values())
    .filter(s => s.userId === request.userId && s.status !== 'completed' && s.status !== 'expired');

  if (userSessions.length >= MAX_SESSIONS_PER_USER) {
    return { success: false, error: `Maximum ${MAX_SESSIONS_PER_USER} active playground sessions` };
  }

  // Validate config matches type
  if (request.config.type !== request.type) {
    return { success: false, error: `Config type "${request.config.type}" doesn't match playground type "${request.type}"` };
  }

  const maxDuration = request.maxDurationMinutes || DEFAULT_MAX_DURATION_MINUTES;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxDuration * 60 * 1000).toISOString();

  const session: PlaygroundSession = {
    sessionId: `pg_${uuidv4()}`,
    userId: request.userId,
    type: request.type,
    status: 'ready',
    name: request.name,
    config: request.config,
    executions: [],
    files: getDefaultFiles(request.type, request.config),
    maxDurationMinutes: maxDuration,
    expiresAt,
    cost: { totalTokens: 0, totalComputeSeconds: 0, totalUsd: 0 },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  sessionStore.set(session.sessionId, session);
  logger.info({ sessionId: session.sessionId, type: session.type, userId: session.userId }, '[Playground] Created');

  return { success: true, session };
}

// ── Execute in Playground ────────────────────────────────────

export async function executeInPlayground(request: ExecuteInPlaygroundRequest): Promise<PlaygroundResponse> {
  const session = sessionStore.get(request.sessionId);

  if (!session) {
    return { success: false, error: 'Playground session not found' };
  }

  if (session.userId !== request.userId) {
    return { success: false, error: 'Not authorized for this playground' };
  }

  if (session.status === 'completed' || session.status === 'expired') {
    return { success: false, error: `Playground is ${session.status}` };
  }

  // Check expiry
  if (new Date() > new Date(session.expiresAt)) {
    session.status = 'expired';
    session.updatedAt = new Date().toISOString();
    return { success: false, error: 'Playground session has expired' };
  }

  if (session.executions.length >= MAX_EXECUTIONS_PER_SESSION) {
    return { success: false, error: `Maximum ${MAX_EXECUTIONS_PER_SESSION} executions per session` };
  }

  session.status = 'running';
  const startTime = Date.now();

  let execution: PlaygroundExecution;

  switch (session.type) {
    case 'code':
      execution = await executeCode(session, request.input, request.target);
      break;
    case 'prompt':
      execution = await executePrompt(session, request.input, request.target);
      break;
    case 'agent':
      execution = await executeAgent(session, request.input);
      break;
    case 'training':
      execution = executeTraining(session, request.input);
      break;
    case 'education':
      execution = await executeEducation(session, request.input);
      break;
    default:
      execution = {
        executionId: uuidv4(),
        input: request.input,
        output: 'Unknown playground type',
        status: 'error',
        durationMs: Date.now() - startTime,
        costUsd: 0,
        timestamp: new Date().toISOString(),
      };
  }

  session.executions.push(execution);
  session.cost.totalUsd += execution.costUsd;
  if (execution.tokens) {
    session.cost.totalTokens += execution.tokens.input + execution.tokens.output;
  }
  session.cost.totalComputeSeconds += execution.durationMs / 1000;
  session.status = 'ready';
  session.updatedAt = new Date().toISOString();

  return { success: true, session };
}

// ── Type-Specific Executors ──────────────────────────────────

async function executeCode(
  session: PlaygroundSession,
  code: string,
  filename?: string,
): Promise<PlaygroundExecution> {
  const startTime = Date.now();
  const config = session.config as { type: 'code'; language: string; maxExecutionSeconds: number };

  // In production: POST to E2B sandbox API
  // E2B_API_KEY should be in env
  // const sandbox = await Sandbox.create({ template: config.language });
  // const result = await sandbox.runCode(code);
  // await sandbox.close();

  // Simulated execution for now
  const output = `[${config.language}] Code executed successfully.\n` +
    `Lines: ${code.split('\n').length}\n` +
    `Characters: ${code.length}\n` +
    `Sandbox: E2B (when connected)`;

  return {
    executionId: uuidv4(),
    input: code,
    output,
    status: 'success',
    durationMs: Date.now() - startTime,
    costUsd: 0.001, // E2B pricing per execution
    timestamp: new Date().toISOString(),
  };
}

async function executePrompt(
  session: PlaygroundSession,
  prompt: string,
  model?: string,
): Promise<PlaygroundExecution> {
  const startTime = Date.now();
  const config = session.config as { type: 'prompt'; models: string[]; systemPrompt: string };
  const targetModel = model || config.models[0] || 'claude-sonnet-4-20250514';

  // In production: llmGateway.chat({ model: targetModel, messages: [...] })
  const estimatedTokens = { input: prompt.length * 1.3, output: prompt.length * 2 };
  const costUsd = ((estimatedTokens.input + estimatedTokens.output) / 1_000_000) * 3;

  return {
    executionId: uuidv4(),
    input: prompt,
    output: `[Prompt Playground] Model: ${targetModel}\n` +
      `System prompt: ${config.systemPrompt.slice(0, 50)}...\n` +
      `Response would appear here via LLM gateway.`,
    status: 'success',
    durationMs: Date.now() - startTime,
    tokens: { input: Math.round(estimatedTokens.input), output: Math.round(estimatedTokens.output) },
    costUsd,
    timestamp: new Date().toISOString(),
  };
}

async function executeAgent(
  session: PlaygroundSession,
  message: string,
): Promise<PlaygroundExecution> {
  const startTime = Date.now();
  const config = session.config as { type: 'agent'; hawkId: string; enabledTools: string[] };

  // In production: executeHawk({ hawkId: config.hawkId, userId: session.userId, message })
  return {
    executionId: uuidv4(),
    input: message,
    output: `[Agent Sandbox] Hawk: ${config.hawkId}\n` +
      `Tools enabled: ${config.enabledTools.join(', ')}\n` +
      `Agent response would appear here via Custom Hawks engine.`,
    status: 'success',
    durationMs: Date.now() - startTime,
    costUsd: 0.005,
    timestamp: new Date().toISOString(),
  };
}

function executeTraining(
  session: PlaygroundSession,
  annotation: string,
): PlaygroundExecution {
  const startTime = Date.now();
  const config = session.config as { type: 'training'; taskType: string; labels: string[] };

  return {
    executionId: uuidv4(),
    input: annotation,
    output: `[Training] Task: ${config.taskType}\n` +
      `Annotation submitted. Available labels: ${config.labels.join(', ')}\n` +
      `Quality check: pending review.`,
    status: 'success',
    durationMs: Date.now() - startTime,
    costUsd: 0,
    timestamp: new Date().toISOString(),
  };
}

async function executeEducation(
  session: PlaygroundSession,
  input: string,
): Promise<PlaygroundExecution> {
  const startTime = Date.now();
  const config = session.config as { type: 'education'; subject: string; tutorEnabled: boolean };

  return {
    executionId: uuidv4(),
    input,
    output: `[Education] Subject: ${config.subject}\n` +
      `Tutor: ${config.tutorEnabled ? 'Active' : 'Disabled'}\n` +
      `Student submission recorded. ${config.tutorEnabled ? 'AI tutor feedback would appear here.' : ''}`,
    status: 'success',
    durationMs: Date.now() - startTime,
    costUsd: config.tutorEnabled ? 0.003 : 0,
    timestamp: new Date().toISOString(),
  };
}

// ── Default Files per Playground Type ────────────────────────

function getDefaultFiles(type: PlaygroundType, config: PlaygroundConfig): PlaygroundFile[] {
  const now = new Date().toISOString();

  switch (type) {
    case 'code': {
      const lang = (config as { language: string }).language;
      const ext = lang === 'python' ? 'py' : lang === 'typescript' ? 'ts' : 'js';
      const greeting = lang === 'python' ? 'print("Hello from A.I.M.S. Playground!")' :
        'console.log("Hello from A.I.M.S. Playground!");';
      return [
        { path: `main.${ext}`, content: greeting, language: lang, sizeBytes: greeting.length, lastModified: now },
        { path: 'README.md', content: `# A.I.M.S. Playground\n\nWrite and execute ${lang} code in an isolated sandbox.`, language: 'markdown', sizeBytes: 80, lastModified: now },
      ];
    }
    case 'prompt':
      return [
        { path: 'system-prompt.md', content: (config as { systemPrompt: string }).systemPrompt, language: 'markdown', sizeBytes: 0, lastModified: now },
      ];
    case 'education':
      return [
        { path: 'assignment.md', content: (config as { assignment?: string }).assignment || '# Assignment\n\nNo assignment set.', language: 'markdown', sizeBytes: 0, lastModified: now },
      ];
    default:
      return [];
  }
}

// ── Session Management ───────────────────────────────────────

export function getPlayground(sessionId: string, userId: string): PlaygroundSession | null {
  const session = sessionStore.get(sessionId);
  if (!session || session.userId !== userId) return null;
  return session;
}

export function listPlaygrounds(userId: string): PlaygroundSession[] {
  return Array.from(sessionStore.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function pausePlayground(sessionId: string, userId: string): PlaygroundResponse {
  const session = sessionStore.get(sessionId);
  if (!session || session.userId !== userId) {
    return { success: false, error: 'Session not found' };
  }
  session.status = 'paused';
  session.updatedAt = new Date().toISOString();
  return { success: true, session };
}

export function resumePlayground(sessionId: string, userId: string): PlaygroundResponse {
  const session = sessionStore.get(sessionId);
  if (!session || session.userId !== userId) {
    return { success: false, error: 'Session not found' };
  }
  if (new Date() > new Date(session.expiresAt)) {
    session.status = 'expired';
    return { success: false, error: 'Session has expired' };
  }
  session.status = 'ready';
  session.updatedAt = new Date().toISOString();
  return { success: true, session };
}

export function completePlayground(sessionId: string, userId: string): PlaygroundResponse {
  const session = sessionStore.get(sessionId);
  if (!session || session.userId !== userId) {
    return { success: false, error: 'Session not found' };
  }
  session.status = 'completed';
  session.updatedAt = new Date().toISOString();
  return { success: true, session };
}

export function addFile(sessionId: string, userId: string, file: PlaygroundFile): PlaygroundResponse {
  const session = sessionStore.get(sessionId);
  if (!session || session.userId !== userId) {
    return { success: false, error: 'Session not found' };
  }
  if (session.files.length >= MAX_FILES_PER_SESSION) {
    return { success: false, error: `Maximum ${MAX_FILES_PER_SESSION} files per session` };
  }

  // Replace if file with same path exists
  const existingIndex = session.files.findIndex(f => f.path === file.path);
  if (existingIndex >= 0) {
    session.files[existingIndex] = file;
  } else {
    session.files.push(file);
  }

  session.updatedAt = new Date().toISOString();
  return { success: true, session };
}

export function getPlaygroundStats(): {
  totalSessions: number;
  activeSessions: number;
  byType: Record<string, number>;
  totalExecutions: number;
} {
  const all = Array.from(sessionStore.values());
  const byType: Record<string, number> = {};
  let totalExecutions = 0;

  for (const session of all) {
    byType[session.type] = (byType[session.type] || 0) + 1;
    totalExecutions += session.executions.length;
  }

  return {
    totalSessions: all.length,
    activeSessions: all.filter(s => s.status === 'ready' || s.status === 'running').length,
    byType,
    totalExecutions,
  };
}
