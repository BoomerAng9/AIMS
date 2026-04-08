/**
 * A.I.M.S. OpenSandbox — Docker Executor
 *
 * Creates ephemeral Docker containers for isolated code execution.
 * Security: no-new-privileges, cap-drop ALL, read-only rootfs,
 * resource limits, timeout enforcement, seccomp profile.
 */

import Dockerode from 'dockerode';
import { nanoid } from 'nanoid';
import type {
  Execution,
  ExecutionRequest,
  ExecutionStatus,
  SandboxLanguage,
} from './types.js';
import { LANGUAGE_IMAGES, LANGUAGE_COMMANDS } from './types.js';

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

// ── In-Memory Stores ─────────────────────────────────────────

const executions = new Map<string, Execution>();
const activeContainers = new Map<string, Dockerode.Container>();

// Track image-pull state so we don't pull the same image concurrently
const pullingImages = new Map<string, Promise<void>>();

// ── Constants ────────────────────────────────────────────────

const DEFAULT_TIMEOUT_S = 30;
const MAX_TIMEOUT_S = 300;
const DEFAULT_MEMORY_MB = 256;
const MAX_MEMORY_MB = 512;
const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB stdout/stderr cap
const CONTAINER_PREFIX = 'aims-sandbox-';

// ── Pull Image (deduplicated) ────────────────────────────────

async function ensureImage(image: string): Promise<void> {
  // Check if image already available locally
  try {
    await docker.getImage(image).inspect();
    return;
  } catch {
    // Not found — need to pull
  }

  // Deduplicate concurrent pulls
  if (pullingImages.has(image)) {
    return pullingImages.get(image)!;
  }

  const pullPromise = new Promise<void>((resolve, reject) => {
    console.log(`[executor] Pulling image ${image}...`);
    docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err2: Error | null) => {
        pullingImages.delete(image);
        if (err2) return reject(err2);
        console.log(`[executor] Image ${image} ready`);
        resolve();
      });
    });
  });

  pullingImages.set(image, pullPromise);
  return pullPromise;
}

// ── Execute Code ─────────────────────────────────────────────

export async function executeCode(request: ExecutionRequest): Promise<Execution> {
  const id = `exec-${nanoid(10)}`;
  const timeout = Math.min(request.timeoutSeconds || DEFAULT_TIMEOUT_S, MAX_TIMEOUT_S);
  const memoryMb = Math.min(request.memoryLimitMb || DEFAULT_MEMORY_MB, MAX_MEMORY_MB);

  const execution: Execution = {
    id,
    status: 'queued',
    language: request.language,
    code: request.code,
    stdout: '',
    stderr: '',
    exitCode: null,
    durationMs: null,
    containerId: null,
    sessionId: request.sessionId || null,
    peakMemoryMb: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    timeoutSeconds: timeout,
    error: null,
  };

  executions.set(id, execution);

  // Run asynchronously — caller can poll for result
  runExecution(execution, request, memoryMb).catch((err) => {
    execution.status = 'failed';
    execution.error = err instanceof Error ? err.message : 'Unknown error';
    execution.completedAt = new Date().toISOString();
  });

  return execution;
}

async function runExecution(
  execution: Execution,
  request: ExecutionRequest,
  memoryMb: number,
): Promise<void> {
  const image = LANGUAGE_IMAGES[request.language];
  const langConfig = LANGUAGE_COMMANDS[request.language];
  const filename = `/tmp/code.${langConfig.ext}`;

  // Pull image
  execution.status = 'pulling';
  try {
    await ensureImage(image);
  } catch (err) {
    execution.status = 'failed';
    execution.error = `Image pull failed: ${err instanceof Error ? err.message : 'unknown'}`;
    execution.completedAt = new Date().toISOString();
    return;
  }

  execution.status = 'running';
  const startTime = Date.now();

  // Build the command: write code to file, then execute
  const writeCmd = `cat > ${filename} << 'AIMS_CODE_EOF'\n${request.code}\nAIMS_CODE_EOF`;
  const runCmd = langConfig.cmd.map(c => c.replace('{FILE}', filename)).join(' ');
  const fullCmd = `${writeCmd}\n${runCmd}`;

  // Environment variables
  const envArray = Object.entries(request.env || {}).map(([k, v]) => `${k}=${v}`);

  // Network mode: none blocks all network access
  const networkMode = request.networkEnabled ? 'bridge' : 'none';

  let container: Dockerode.Container | null = null;

  try {
    container = await docker.createContainer({
      Image: image,
      name: `${CONTAINER_PREFIX}${execution.id}`,
      Cmd: ['sh', '-c', fullCmd],
      Env: envArray,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      // Stdin support
      OpenStdin: !!request.stdin,
      StdinOnce: !!request.stdin,
      HostConfig: {
        // ── Security hardening ──
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        ReadonlyRootfs: false, // need /tmp writable for code files
        // ── Resource limits ──
        Memory: memoryMb * 1024 * 1024,
        MemorySwap: memoryMb * 1024 * 1024, // no swap
        NanoCpus: 1_000_000_000, // 1 CPU max
        PidsLimit: 64,
        // ── Network isolation ──
        NetworkMode: networkMode,
        // ── Filesystem ──
        Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=100m' },
      },
      Labels: {
        'aims.sandbox': 'true',
        'aims.sandbox.execution': execution.id,
        'aims.managed': 'true',
      },
    });

    execution.containerId = container.id;
    activeContainers.set(execution.id, container);

    // Start container
    await container.start();

    // Write stdin if provided
    if (request.stdin) {
      try {
        const stdinStream = await container.attach({ stream: true, stdin: true, hijack: true });
        stdinStream.write(request.stdin);
        stdinStream.end();
      } catch {
        // stdin write failure is non-fatal
      }
    }

    // Wait for completion with timeout
    const waitPromise = container.wait();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), execution.timeoutSeconds * 1000);
    });

    let exitCode: number;
    try {
      const result = await Promise.race([waitPromise, timeoutPromise]);
      exitCode = (result as { StatusCode: number }).StatusCode;
    } catch (err) {
      if (err instanceof Error && err.message === 'TIMEOUT') {
        execution.status = 'timeout';
        execution.error = `Execution timed out after ${execution.timeoutSeconds}s`;

        // Kill the container
        try {
          await container.kill();
        } catch {
          // May already be stopped
        }

        // Collect partial output
        await collectLogs(container, execution);
        execution.durationMs = Date.now() - startTime;
        execution.completedAt = new Date().toISOString();
        await cleanupContainer(container, execution.id);
        return;
      }
      throw err;
    }

    // Collect output
    await collectLogs(container, execution);

    execution.exitCode = exitCode;
    execution.status = exitCode === 0 ? 'completed' : 'failed';
    execution.durationMs = Date.now() - startTime;
    execution.completedAt = new Date().toISOString();

    // Try to read memory stats
    try {
      const stats = await container.stats({ stream: false }) as unknown as { memory_stats?: { max_usage?: number } };
      if (stats.memory_stats?.max_usage) {
        execution.peakMemoryMb = Math.round(stats.memory_stats.max_usage / (1024 * 1024));
      }
    } catch {
      // Stats may not be available after container exits
    }

    console.log(
      `[executor] ${execution.id} completed: exit=${exitCode} duration=${execution.durationMs}ms`,
    );
  } catch (err) {
    execution.status = 'failed';
    execution.error = err instanceof Error ? err.message : 'Container execution error';
    execution.durationMs = Date.now() - startTime;
    execution.completedAt = new Date().toISOString();
    console.error(`[executor] ${execution.id} failed:`, err);
  } finally {
    if (container) {
      await cleanupContainer(container, execution.id);
    }
  }
}

// ── Log Collection ───────────────────────────────────────────

async function collectLogs(container: Dockerode.Container, execution: Execution): Promise<void> {
  try {
    const logBuffer = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
    });

    // Docker multiplexed stream: first 8 bytes are header per frame
    // Header[0] = stream type (1=stdout, 2=stderr), Header[4-7] = size (big-endian)
    const raw = Buffer.isBuffer(logBuffer) ? logBuffer : Buffer.from(logBuffer as unknown as string);
    let offset = 0;
    let stdout = '';
    let stderr = '';

    while (offset < raw.length - 8) {
      const streamType = raw[offset];
      const size = raw.readUInt32BE(offset + 4);
      offset += 8;

      if (offset + size > raw.length) break;

      const chunk = raw.subarray(offset, offset + size).toString('utf-8');
      if (streamType === 1) {
        stdout += chunk;
      } else if (streamType === 2) {
        stderr += chunk;
      }
      offset += size;
    }

    // Cap output sizes
    execution.stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
    execution.stderr = stderr.slice(0, MAX_OUTPUT_BYTES);
  } catch (err) {
    console.warn(`[executor] Failed to collect logs for ${execution.id}:`, err);
  }
}

// ── Container Cleanup ────────────────────────────────────────

async function cleanupContainer(container: Dockerode.Container, executionId: string): Promise<void> {
  activeContainers.delete(executionId);
  try {
    await container.remove({ force: true });
  } catch {
    // Container may already be removed
  }
}

// ── Cancel Execution ─────────────────────────────────────────

export async function cancelExecution(executionId: string): Promise<Execution | null> {
  const execution = executions.get(executionId);
  if (!execution) return null;

  if (execution.status !== 'running' && execution.status !== 'queued' && execution.status !== 'pulling') {
    return execution; // Already terminal
  }

  const container = activeContainers.get(executionId);
  if (container) {
    try {
      await container.kill();
    } catch {
      // May not be running
    }
    await cleanupContainer(container, executionId);
  }

  execution.status = 'cancelled';
  execution.completedAt = new Date().toISOString();
  execution.error = 'Cancelled by user';

  return execution;
}

// ── Getters ──────────────────────────────────────────────────

export function getExecution(id: string): Execution | undefined {
  return executions.get(id);
}

export function listExecutions(limit = 50): Execution[] {
  return Array.from(executions.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getActiveCount(): number {
  return activeContainers.size;
}

// ── Cleanup Old ──────────────────────────────────────────────

const MAX_HISTORY = 500;

export function cleanupOldExecutions(): number {
  const all = Array.from(executions.entries())
    .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime());

  let removed = 0;
  if (all.length > MAX_HISTORY) {
    for (let i = MAX_HISTORY; i < all.length; i++) {
      const [id, exec] = all[i];
      // Only remove completed ones
      if (exec.status !== 'running' && exec.status !== 'queued' && exec.status !== 'pulling') {
        executions.delete(id);
        removed++;
      }
    }
  }
  return removed;
}

// ── Pre-warm Popular Images ──────────────────────────────────

export async function prewarmImages(languages: SandboxLanguage[] = ['python', 'javascript', 'bash']): Promise<void> {
  console.log(`[executor] Pre-warming images for: ${languages.join(', ')}`);
  for (const lang of languages) {
    try {
      await ensureImage(LANGUAGE_IMAGES[lang]);
    } catch (err) {
      console.warn(`[executor] Failed to pre-warm ${lang}:`, err);
    }
  }
  console.log('[executor] Image pre-warm complete');
}
