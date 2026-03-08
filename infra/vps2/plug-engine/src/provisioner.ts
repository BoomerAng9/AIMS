/**
 * A.I.M.S. Plug Engine — Container Provisioner
 * Manages the full lifecycle of plug instances via Docker
 */

import Dockerode from 'dockerode';
import { nanoid } from 'nanoid';
import { allocatePorts, releasePorts, getPortsForPlug, type PortAllocation } from './port-registry.js';
import { generateNginxConfig, removeNginxConfig } from './nginx-configurator.js';

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

export type PlugStatus = 'provisioning' | 'configuring' | 'running' | 'stopped' | 'error' | 'decommissioned';

export interface PlugInstance {
  id: string;
  name: string;
  image: string;
  status: PlugStatus;
  ports: PortAllocation | null;
  containerId: string | null;
  subdomain: string;
  env: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  healthEndpoint: string;
  lastHealthCheck: string | null;
  healthy: boolean;
}

// In-memory registry (persisted via port-registry)
const instances = new Map<string, PlugInstance>();

export async function provisionPlug(opts: {
  name: string;
  image: string;
  env?: Record<string, string>;
  healthEndpoint?: string;
}): Promise<PlugInstance> {
  const id = `plug-${nanoid(8)}`;
  const subdomain = opts.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  console.log(`[provisioner] Provisioning plug ${id} (${opts.name})`);

  // Allocate ports
  const ports = await allocatePorts(id);
  console.log(`[provisioner] Allocated ports ${ports.basePort}-${ports.basePort + 9} for ${id}`);

  const instance: PlugInstance = {
    id,
    name: opts.name,
    image: opts.image,
    status: 'provisioning',
    ports,
    containerId: null,
    subdomain,
    env: opts.env || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    healthEndpoint: opts.healthEndpoint || '/health',
    lastHealthCheck: null,
    healthy: false,
  };

  instances.set(id, instance);

  try {
    // Pull image if needed
    console.log(`[provisioner] Pulling image ${opts.image}...`);
    await new Promise<void>((resolve, reject) => {
      docker.pull(opts.image, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err2: Error | null) => {
          if (err2) return reject(err2);
          resolve();
        });
      });
    });

    instance.status = 'configuring';
    instance.updatedAt = new Date().toISOString();

    // Create container
    const portBindings: Record<string, Array<{ HostPort: string }>> = {};
    const mainPort = ports.basePort;
    // Map the first port as the main service port
    portBindings[`${mainPort}/tcp`] = [{ HostPort: String(mainPort) }];

    const envArray = Object.entries({ ...opts.env, PORT: String(mainPort) })
      .map(([k, v]) => `${k}=${v}`);

    const container = await docker.createContainer({
      Image: opts.image,
      name: `aims-plug-${subdomain}`,
      Env: envArray,
      ExposedPorts: { [`${mainPort}/tcp`]: {} },
      HostConfig: {
        PortBindings: portBindings,
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: 512 * 1024 * 1024, // 512MB limit per plug
        NanoCpus: 500000000, // 0.5 CPU
      },
      Labels: {
        'aims.plug.id': id,
        'aims.plug.name': opts.name,
        'aims.managed': 'true',
      },
    });

    await container.start();

    instance.containerId = container.id;
    instance.status = 'running';
    instance.updatedAt = new Date().toISOString();

    // Generate nginx reverse proxy config
    await generateNginxConfig(subdomain, mainPort);

    console.log(`[provisioner] Plug ${id} running on port ${mainPort}`);
    return instance;
  } catch (err) {
    instance.status = 'error';
    instance.updatedAt = new Date().toISOString();
    console.error(`[provisioner] Failed to provision ${id}:`, err);
    // Release ports on failure
    await releasePorts(id);
    throw err;
  }
}

export async function stopPlug(plugId: string): Promise<PlugInstance> {
  const instance = instances.get(plugId);
  if (!instance) throw new Error(`Plug ${plugId} not found`);
  if (!instance.containerId) throw new Error(`Plug ${plugId} has no container`);

  console.log(`[provisioner] Stopping plug ${plugId}`);
  const container = docker.getContainer(instance.containerId);
  await container.stop({ t: 10 });

  instance.status = 'stopped';
  instance.updatedAt = new Date().toISOString();
  return instance;
}

export async function startPlug(plugId: string): Promise<PlugInstance> {
  const instance = instances.get(plugId);
  if (!instance) throw new Error(`Plug ${plugId} not found`);
  if (!instance.containerId) throw new Error(`Plug ${plugId} has no container`);

  console.log(`[provisioner] Starting plug ${plugId}`);
  const container = docker.getContainer(instance.containerId);
  await container.start();

  instance.status = 'running';
  instance.updatedAt = new Date().toISOString();
  return instance;
}

export async function decommissionPlug(plugId: string): Promise<void> {
  const instance = instances.get(plugId);
  if (!instance) throw new Error(`Plug ${plugId} not found`);

  console.log(`[provisioner] Decommissioning plug ${plugId}`);

  // Stop and remove container
  if (instance.containerId) {
    try {
      const container = docker.getContainer(instance.containerId);
      await container.stop({ t: 5 }).catch(() => {});
      await container.remove({ force: true });
    } catch {
      console.warn(`[provisioner] Container cleanup failed for ${plugId}`);
    }
  }

  // Clean up nginx
  await removeNginxConfig(instance.subdomain);

  // Release ports
  await releasePorts(plugId);

  instance.status = 'decommissioned';
  instance.updatedAt = new Date().toISOString();
  instances.delete(plugId);

  console.log(`[provisioner] Plug ${plugId} fully decommissioned`);
}

export function getPlug(plugId: string): PlugInstance | undefined {
  return instances.get(plugId);
}

export function listPlugs(): PlugInstance[] {
  return Array.from(instances.values());
}

export async function checkPlugHealth(plugId: string): Promise<boolean> {
  const instance = instances.get(plugId);
  if (!instance || !instance.ports || instance.status !== 'running') return false;

  try {
    const url = `http://localhost:${instance.ports.basePort}${instance.healthEndpoint}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    instance.healthy = res.ok;
    instance.lastHealthCheck = new Date().toISOString();
    return res.ok;
  } catch {
    instance.healthy = false;
    instance.lastHealthCheck = new Date().toISOString();
    return false;
  }
}
