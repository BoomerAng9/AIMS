/**
 * Docker Runtime — Real Container Lifecycle Management
 *
 * This module bridges the gap between the Plug Deploy Engine (which generates
 * configs) and the actual Docker daemon. It handles:
 *   - Pulling images
 *   - Creating and starting containers
 *   - Health check polling
 *   - Stopping and removing containers
 *   - Generating and deploying nginx reverse proxy configs
 *   - Writing export bundles to disk
 *
 * Uses dockerode to communicate with the Docker daemon via Unix socket.
 */

import Docker from 'dockerode';
import { promises as fs } from 'fs';
import { join } from 'path';
import logger from '../logger';
import type { PlugDefinition, PlugInstance } from './types';

// ---------------------------------------------------------------------------
// Docker client — connects to local Docker daemon
// ---------------------------------------------------------------------------

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';

let docker: Docker | null = null;

function getDocker(): Docker {
  if (!docker) {
    docker = new Docker({ socketPath: DOCKER_SOCKET });
  }
  return docker;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AIMS_NETWORK = 'aims-network';
const SANDBOX_NETWORK = 'sandbox-network';
const NGINX_CONF_DIR = process.env.NGINX_PLUG_CONF_DIR || '/etc/nginx/conf.d/plugs';
const EXPORT_DIR = process.env.PLUG_EXPORT_DIR || '/tmp/aims-exports';
const AIMS_DOMAIN = process.env.AIMS_DOMAIN || 'plugmein.cloud';

// ---------------------------------------------------------------------------
// Docker Runtime
// ---------------------------------------------------------------------------

export class DockerRuntime {
  // -----------------------------------------------------------------------
  // Connection check
  // -----------------------------------------------------------------------

  async isAvailable(): Promise<boolean> {
    try {
      const d = getDocker();
      await d.ping();
      return true;
    } catch (err) {
      logger.warn({ err }, '[DockerRuntime] Docker daemon not reachable');
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Pull image
  // -----------------------------------------------------------------------

  async pullImage(image: string): Promise<{ pulled: boolean; error?: string }> {
    try {
      const d = getDocker();
      logger.info({ image }, '[DockerRuntime] Pulling image');

      const stream = await d.pull(image);

      // Wait for pull to complete
      await new Promise<void>((resolve, reject) => {
        d.modem.followProgress(stream, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      logger.info({ image }, '[DockerRuntime] Image pulled successfully');
      return { pulled: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pull failed';
      logger.error({ image, err }, '[DockerRuntime] Image pull failed');
      return { pulled: false, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Create and start container
  // -----------------------------------------------------------------------

  async createContainer(
    plug: PlugDefinition,
    instance: PlugInstance,
  ): Promise<{ containerId: string; started: boolean; error?: string }> {
    try {
      const d = getDocker();
      const containerName = `aims-plug-${sanitize(instance.name || plug.id)}`;
      const image = plug.docker.image || `aims-${plug.id}:latest`;

      // Ensure network exists
      await this.ensureNetwork(instance);

      // Port bindings
      const portBindings: Docker.PortMap = {};
      const exposedPorts: Record<string, Record<string, never>> = {};
      plug.ports.forEach((p, i) => {
        const hostPort = instance.assignedPort + i;
        const containerPort = `${p.internal}/${p.protocol === 'tcp' ? 'tcp' : 'tcp'}`;
        portBindings[containerPort] = [{ HostPort: String(hostPort) }];
        exposedPorts[containerPort] = {};
      });

      // Environment variables
      const env = Object.entries(instance.envOverrides).map(
        ([key, val]) => `${key}=${val}`,
      );
      env.push('NODE_ENV=production');

      // Volumes
      const binds = plug.volumes.map(v => `${v.name}:${v.mountPath}`);

      // Health check
      const hc = plug.healthCheck;
      const internalPort = plug.ports[0]?.internal || 8000;

      // Create container
      logger.info(
        { containerName, image, port: instance.assignedPort },
        '[DockerRuntime] Creating container',
      );

      const container = await d.createContainer({
        name: containerName,
        Image: image,
        Env: env,
        ExposedPorts: exposedPorts,
        HostConfig: {
          PortBindings: portBindings,
          Binds: binds,
          RestartPolicy: { Name: 'unless-stopped' },
          Memory: parseMemoryLimit(plug.resources.memoryLimit),
          NanoCpus: parseCpuLimit(plug.resources.cpuLimit),
          NetworkMode: plug.networkPolicy.isolatedSandbox ? SANDBOX_NETWORK : AIMS_NETWORK,
        },
        Healthcheck: {
          Test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider',
            `http://localhost:${internalPort}${hc.endpoint}`],
          Interval: parseDuration(hc.interval),
          Timeout: parseDuration(hc.timeout),
          Retries: hc.retries,
          StartPeriod: parseDuration(hc.startPeriod),
        },
        Labels: {
          'aims.plug.id': plug.id,
          'aims.plug.name': plug.name,
          'aims.instance.id': instance.instanceId,
          'aims.instance.user': instance.userId,
          'aims.managed': 'true',
        },
      });

      // Start the container
      await container.start();

      const containerId = container.id;
      logger.info(
        { containerName, containerId, port: instance.assignedPort },
        '[DockerRuntime] Container started',
      );

      return { containerId, started: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Container creation failed';
      logger.error({ err, instanceId: instance.instanceId }, '[DockerRuntime] Container create/start failed');
      return { containerId: '', started: false, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Health check polling
  // -----------------------------------------------------------------------

  async pollHealth(
    instance: PlugInstance,
    plug: PlugDefinition,
    maxRetries: number = 30,
    intervalMs: number = 2000,
  ): Promise<{ healthy: boolean; attempts: number }> {
    const url = `http://127.0.0.1:${instance.assignedPort}${plug.healthCheck.endpoint}`;
    let attempts = 0;

    logger.info({ url, maxRetries }, '[DockerRuntime] Starting health check poll');

    while (attempts < maxRetries) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          logger.info(
            { url, attempts },
            '[DockerRuntime] Health check passed',
          );
          return { healthy: true, attempts };
        }
      } catch {
        // Not ready yet, wait and retry
      }
      await sleep(intervalMs);
    }

    logger.warn({ url, attempts }, '[DockerRuntime] Health check timed out');
    return { healthy: false, attempts };
  }

  // -----------------------------------------------------------------------
  // Stop container
  // -----------------------------------------------------------------------

  async stopContainer(instance: PlugInstance): Promise<{ stopped: boolean; error?: string }> {
    try {
      const d = getDocker();
      const containerName = `aims-plug-${sanitize(instance.name)}`;

      const container = d.getContainer(containerName);
      await container.stop({ t: 10 }); // 10s graceful shutdown

      logger.info({ containerName }, '[DockerRuntime] Container stopped');
      return { stopped: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stop failed';
      // If container is already stopped, that's fine
      if (msg.includes('is not running') || msg.includes('No such container')) {
        return { stopped: true };
      }
      logger.error({ err, instanceId: instance.instanceId }, '[DockerRuntime] Stop failed');
      return { stopped: false, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Remove container (decommission)
  // -----------------------------------------------------------------------

  async removeContainer(instance: PlugInstance): Promise<{ removed: boolean; error?: string }> {
    try {
      const d = getDocker();
      const containerName = `aims-plug-${sanitize(instance.name)}`;

      const container = d.getContainer(containerName);

      // Stop first if running
      try {
        await container.stop({ t: 10 });
      } catch {
        // Already stopped — fine
      }

      // Remove container
      await container.remove({ force: true, v: false });

      logger.info({ containerName }, '[DockerRuntime] Container removed');
      return { removed: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Remove failed';
      if (msg.includes('No such container')) {
        return { removed: true };
      }
      logger.error({ err, instanceId: instance.instanceId }, '[DockerRuntime] Remove failed');
      return { removed: false, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Inspect container (get real status)
  // -----------------------------------------------------------------------

  async inspectContainer(instance: PlugInstance): Promise<{
    running: boolean;
    healthy: boolean;
    uptime: number;
    memory: number;
    error?: string;
  }> {
    try {
      const d = getDocker();
      const containerName = `aims-plug-${sanitize(instance.name)}`;
      const container = d.getContainer(containerName);
      const info = await container.inspect();

      const running = info.State.Running;
      const healthy = info.State.Health?.Status === 'healthy';
      const startedAt = info.State.StartedAt ? new Date(info.State.StartedAt).getTime() : Date.now();
      const uptime = running ? Math.floor((Date.now() - startedAt) / 1000) : 0;

      // Get memory stats
      let memory = 0;
      if (running) {
        try {
          const stats = await container.stats({ stream: false });
          memory = stats.memory_stats?.usage || 0;
        } catch {
          // Stats not available
        }
      }

      return { running, healthy, uptime, memory };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Inspect failed';
      return { running: false, healthy: false, uptime: 0, memory: 0, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // List all AIMS-managed containers
  // -----------------------------------------------------------------------

  async listManagedContainers(): Promise<Array<{
    instanceId: string;
    plugId: string;
    userId: string;
    containerName: string;
    containerId: string;
    state: string;
    status: string;
  }>> {
    try {
      const d = getDocker();
      const containers = await d.listContainers({
        all: true,
        filters: { label: ['aims.managed=true'] },
      });

      return containers.map(c => ({
        instanceId: c.Labels['aims.instance.id'] || '',
        plugId: c.Labels['aims.plug.id'] || '',
        userId: c.Labels['aims.instance.user'] || '',
        containerName: c.Names[0]?.replace(/^\//, '') || '',
        containerId: c.Id.slice(0, 12),
        state: c.State,
        status: c.Status,
      }));
    } catch (err) {
      logger.error({ err }, '[DockerRuntime] Failed to list managed containers');
      return [];
    }
  }

  // -----------------------------------------------------------------------
  // Deploy nginx reverse proxy config for an instance
  // -----------------------------------------------------------------------

  async deployNginxConfig(
    plug: PlugDefinition,
    instance: PlugInstance,
    nginxContent: string,
  ): Promise<{ deployed: boolean; error?: string }> {
    try {
      // Ensure directory exists
      await fs.mkdir(NGINX_CONF_DIR, { recursive: true });

      const filename = `plug-${sanitize(instance.name)}.conf`;
      const filepath = join(NGINX_CONF_DIR, filename);

      await fs.writeFile(filepath, nginxContent, 'utf-8');

      logger.info({ filepath }, '[DockerRuntime] Nginx config deployed');

      // Reload nginx (if container is named "nginx" or "aims-nginx")
      try {
        const d = getDocker();
        const nginx = d.getContainer('aims-nginx');
        await nginx.kill({ signal: 'HUP' });
        logger.info('[DockerRuntime] Nginx reloaded');
      } catch {
        // nginx container might not be named this way — try host reload
        logger.warn('[DockerRuntime] Could not HUP nginx container; manual reload may be needed');
      }

      return { deployed: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nginx deploy failed';
      logger.error({ err }, '[DockerRuntime] Nginx config deploy failed');
      return { deployed: false, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Remove nginx config (on decommission)
  // -----------------------------------------------------------------------

  async removeNginxConfig(instance: PlugInstance): Promise<void> {
    try {
      const filename = `plug-${sanitize(instance.name)}.conf`;
      const filepath = join(NGINX_CONF_DIR, filename);
      await fs.unlink(filepath);
      logger.info({ filepath }, '[DockerRuntime] Nginx config removed');
    } catch {
      // File might not exist — fine
    }
  }

  // -----------------------------------------------------------------------
  // Write export bundle to disk
  // -----------------------------------------------------------------------

  async writeExportBundle(
    bundleId: string,
    files: Record<string, string>,
  ): Promise<{ dir: string; error?: string }> {
    try {
      const bundleDir = join(EXPORT_DIR, bundleId);
      await fs.mkdir(bundleDir, { recursive: true });

      for (const [filename, content] of Object.entries(files)) {
        const filepath = join(bundleDir, filename);
        await fs.writeFile(filepath, content, 'utf-8');

        // Make shell scripts executable
        if (filename.endsWith('.sh')) {
          await fs.chmod(filepath, 0o755);
        }
      }

      logger.info(
        { bundleDir, fileCount: Object.keys(files).length },
        '[DockerRuntime] Export bundle written',
      );

      return { dir: bundleDir };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export write failed';
      logger.error({ err }, '[DockerRuntime] Export bundle write failed');
      return { dir: '', error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Ensure Docker network exists
  // -----------------------------------------------------------------------

  private async ensureNetwork(instance: PlugInstance): Promise<void> {
    const d = getDocker();
    const networkName = instance.envOverrides['__isolated']
      ? SANDBOX_NETWORK
      : AIMS_NETWORK;

    try {
      const network = d.getNetwork(networkName);
      await network.inspect();
    } catch {
      // Network doesn't exist — create it
      logger.info({ networkName }, '[DockerRuntime] Creating network');
      await d.createNetwork({
        Name: networkName,
        Driver: 'bridge',
        Internal: networkName === SANDBOX_NETWORK,
        Labels: { 'aims.managed': 'true' },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)(G|M|K)?$/i);
  if (!match) return 512 * 1024 * 1024; // 512M default
  const value = parseInt(match[1]);
  const unit = (match[2] || 'M').toUpperCase();
  switch (unit) {
    case 'G': return value * 1024 * 1024 * 1024;
    case 'M': return value * 1024 * 1024;
    case 'K': return value * 1024;
    default: return value;
  }
}

function parseCpuLimit(limit: string): number {
  // Docker NanoCpus: 1 CPU = 1e9
  const cpus = parseFloat(limit) || 1;
  return cpus * 1e9;
}

function parseDuration(duration: string): number {
  // Convert "30s", "1m", "5m" to nanoseconds (Docker format)
  const match = duration.match(/^(\d+)(s|m|h)?$/i);
  if (!match) return 30 * 1e9; // 30s default
  const value = parseInt(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  switch (unit) {
    case 'h': return value * 3600 * 1e9;
    case 'm': return value * 60 * 1e9;
    case 's': return value * 1e9;
    default: return value * 1e9;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const dockerRuntime = new DockerRuntime();
