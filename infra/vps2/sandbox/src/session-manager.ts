/**
 * A.I.M.S. OpenSandbox — Session Manager
 *
 * Manages persistent sandbox sessions — long-lived containers
 * where users can run multiple executions, install packages,
 * and work with files.
 */

import Dockerode from 'dockerode';
import { nanoid } from 'nanoid';
import type { Session, SessionRequest, SandboxLanguage } from './types.js';
import { LANGUAGE_IMAGES, LANGUAGE_COMMANDS } from './types.js';

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

// ── In-Memory Store ──────────────────────────────────────────

const sessions = new Map<string, Session>();
const sessionContainers = new Map<string, Dockerode.Container>();

// ── Constants ────────────────────────────────────────────────

const DEFAULT_TTL_MIN = 60;
const MAX_TTL_MIN = 480;
const DEFAULT_MEMORY_MB = 512;
const MAX_SESSIONS = 20;
const SESSION_PREFIX = 'aims-session-';

// ── Create Session ───────────────────────────────────────────

export async function createSession(request: SessionRequest): Promise<Session> {
  // Check capacity
  const activeSessions = Array.from(sessions.values())
    .filter(s => s.status !== 'expired' && s.status !== 'destroyed');

  if (activeSessions.length >= MAX_SESSIONS) {
    throw new Error(`Maximum ${MAX_SESSIONS} active sessions reached`);
  }

  const id = `session-${nanoid(8)}`;
  const ttl = Math.min(request.ttlMinutes || DEFAULT_TTL_MIN, MAX_TTL_MIN);
  const memoryMb = Math.min(request.memoryLimitMb || DEFAULT_MEMORY_MB, DEFAULT_MEMORY_MB);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 60 * 1000).toISOString();

  const session: Session = {
    id,
    status: 'creating',
    language: request.language,
    name: request.name || `Sandbox ${request.language}`,
    containerId: null,
    executionCount: 0,
    files: [],
    packages: request.packages || [],
    ttlMinutes: ttl,
    expiresAt,
    memoryLimitMb: memoryMb,
    networkEnabled: request.networkEnabled ?? false,
    userId: request.userId || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  sessions.set(id, session);

  // Create persistent container asynchronously
  setupSessionContainer(session, request).catch((err) => {
    session.status = 'expired';
    session.updatedAt = new Date().toISOString();
    console.error(`[session-manager] Failed to create session ${id}:`, err);
  });

  return session;
}

async function setupSessionContainer(session: Session, request: SessionRequest): Promise<void> {
  const image = LANGUAGE_IMAGES[session.language];

  // Pull image
  try {
    await new Promise<void>((resolve, reject) => {
      docker.getImage(image).inspect()
        .then(() => resolve())
        .catch(() => {
          docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (err2: Error | null) => {
              if (err2) return reject(err2);
              resolve();
            });
          });
        });
    });
  } catch (err) {
    throw new Error(`Image pull failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  const networkMode = session.networkEnabled ? 'bridge' : 'none';

  // Create a long-running container that sleeps (stays alive for exec calls)
  const container = await docker.createContainer({
    Image: image,
    name: `${SESSION_PREFIX}${session.id}`,
    Cmd: ['sh', '-c', 'mkdir -p /workspace && sleep infinity'],
    WorkingDir: '/workspace',
    Tty: false,
    HostConfig: {
      SecurityOpt: ['no-new-privileges'],
      CapDrop: ['ALL'],
      ReadonlyRootfs: false,
      Memory: session.memoryLimitMb * 1024 * 1024,
      MemorySwap: session.memoryLimitMb * 1024 * 1024,
      NanoCpus: 1_000_000_000,
      PidsLimit: 128,
      NetworkMode: networkMode,
    },
    Labels: {
      'aims.sandbox': 'true',
      'aims.sandbox.session': session.id,
      'aims.managed': 'true',
    },
  });

  await container.start();
  session.containerId = container.id;
  sessionContainers.set(session.id, container);

  // Pre-load files
  if (request.files && request.files.length > 0) {
    for (const file of request.files) {
      await execInSession(container, `cat > /workspace/${file.path} << 'AIMS_EOF'\n${file.content}\nAIMS_EOF`);
      session.files.push(file.path);
    }
  }

  // Install packages
  if (request.packages && request.packages.length > 0) {
    const installCmd = getInstallCommand(session.language, request.packages);
    if (installCmd) {
      await execInSession(container, installCmd);
    }
  }

  session.status = 'ready';
  session.updatedAt = new Date().toISOString();

  console.log(`[session-manager] Session ${session.id} ready (${session.language}, TTL=${session.ttlMinutes}m)`);

  // Schedule expiry
  setTimeout(async () => {
    await expireSession(session.id);
  }, session.ttlMinutes * 60 * 1000);
}

// ── Execute in Session ───────────────────────────────────────

export async function executeInSession(
  sessionId: string,
  code: string,
  timeoutSeconds = 30,
): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.status !== 'ready' && session.status !== 'busy') {
    throw new Error(`Session ${sessionId} is ${session.status}`);
  }

  const container = sessionContainers.get(sessionId);
  if (!container) throw new Error(`Session container not available`);

  session.status = 'busy';
  session.updatedAt = new Date().toISOString();

  const langConfig = LANGUAGE_COMMANDS[session.language];
  const filename = `/workspace/exec_${Date.now()}.${langConfig.ext}`;
  const writeCmd = `cat > ${filename} << 'AIMS_CODE_EOF'\n${code}\nAIMS_CODE_EOF`;
  const runCmd = langConfig.cmd.map(c => c.replace('{FILE}', filename)).join(' ');

  const startTime = Date.now();

  try {
    // Write file
    await execInSession(container, writeCmd);

    // Execute with timeout
    const result = await execInSessionWithTimeout(container, runCmd, timeoutSeconds);

    session.executionCount++;
    session.status = 'ready';
    session.updatedAt = new Date().toISOString();

    return {
      ...result,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    session.status = 'ready';
    session.updatedAt = new Date().toISOString();

    if (err instanceof Error && err.message === 'EXEC_TIMEOUT') {
      return {
        stdout: '',
        stderr: `Execution timed out after ${timeoutSeconds}s`,
        exitCode: 124,
        durationMs: Date.now() - startTime,
      };
    }
    throw err;
  }
}

// ── Docker Exec Helpers ──────────────────────────────────────

async function execInSession(container: Dockerode.Container, cmd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const exec = await container.exec({
    Cmd: ['sh', '-c', cmd],
    AttachStdout: true,
    AttachStderr: true,
  });

  const stream = await exec.start({ hijack: true, stdin: false });

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    stream.on('data', (chunk: Buffer) => {
      // Docker multiplexed stream
      let offset = 0;
      while (offset < chunk.length - 8) {
        const type = chunk[offset];
        const size = chunk.readUInt32BE(offset + 4);
        offset += 8;
        if (offset + size > chunk.length) break;
        const text = chunk.subarray(offset, offset + size).toString('utf-8');
        if (type === 1) stdout += text;
        else if (type === 2) stderr += text;
        offset += size;
      }
    });

    stream.on('end', async () => {
      const info = await exec.inspect();
      resolve({ stdout, stderr, exitCode: info.ExitCode ?? 1 });
    });

    stream.on('error', () => {
      resolve({ stdout, stderr, exitCode: 1 });
    });
  });
}

async function execInSessionWithTimeout(
  container: Dockerode.Container,
  cmd: string,
  timeoutSeconds: number,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('EXEC_TIMEOUT')), timeoutSeconds * 1000);

    execInSession(container, cmd)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ── Package Install Commands ─────────────────────────────────

function getInstallCommand(language: SandboxLanguage, packages: string[]): string | null {
  if (packages.length === 0) return null;
  const pkgList = packages.join(' ');

  switch (language) {
    case 'python':
      return `pip install --quiet ${pkgList}`;
    case 'javascript':
    case 'typescript':
      return `npm install --silent ${pkgList}`;
    default:
      return null;
  }
}

// ── Session Lifecycle ────────────────────────────────────────

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function listSessions(): Session[] {
  return Array.from(sessions.values())
    .filter(s => s.status !== 'destroyed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function destroySession(id: string): Promise<Session | null> {
  const session = sessions.get(id);
  if (!session) return null;

  const container = sessionContainers.get(id);
  if (container) {
    try {
      await container.kill().catch(() => {});
      await container.remove({ force: true });
    } catch {
      // May already be gone
    }
    sessionContainers.delete(id);
  }

  session.status = 'destroyed';
  session.updatedAt = new Date().toISOString();

  console.log(`[session-manager] Session ${id} destroyed`);
  return session;
}

async function expireSession(id: string): Promise<void> {
  const session = sessions.get(id);
  if (!session || session.status === 'destroyed') return;

  console.log(`[session-manager] Session ${id} expired (TTL=${session.ttlMinutes}m)`);
  await destroySession(id);
  if (session) session.status = 'expired';
}

export function getActiveSessionCount(): number {
  return Array.from(sessions.values())
    .filter(s => s.status === 'ready' || s.status === 'busy' || s.status === 'creating')
    .length;
}

// ── Cleanup All Running Sessions (shutdown) ──────────────────

export async function cleanupAll(): Promise<void> {
  console.log('[session-manager] Cleaning up all sessions...');
  for (const [id] of sessionContainers) {
    await destroySession(id);
  }
}
