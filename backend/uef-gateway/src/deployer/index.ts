/**
 * Multi-Tenant Deployment Manager
 *
 * Manages Docker-based deployments for customer Plugs. Each Plug gets an
 * isolated container with its own port, domain mapping, and environment.
 *
 * In the current implementation all operations are simulated in-memory.
 * Production will execute real Docker and nginx commands via child_process.
 *
 * Port allocation starts at 50100 and auto-increments.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeploymentConfig {
  plugId: string;
  projectName: string;
  provider: 'docker' | 'cdn' | 'vps';
  domain?: string;
  port: number;
  envVars: Record<string, string>;
  sslEnabled: boolean;
}

export interface DeploymentStatus {
  deploymentId: string;
  plugId: string;
  status:
    | 'pending'
    | 'provisioning'
    | 'building-image'
    | 'starting'
    | 'running'
    | 'health-check'
    | 'stopped'
    | 'failed';
  url?: string;
  containerId?: string;
  port?: number;
  healthCheckUrl?: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_PORT = 50100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function sanitiseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// DeploymentManager
// ---------------------------------------------------------------------------

export class DeploymentManager {
  private deployments = new Map<string, DeploymentStatus>();

  /** Maps plugId -> userId for multi-tenant lookups. */
  private plugOwnership = new Map<string, string>();

  /** Monotonically increasing port counter. */
  private nextPort = BASE_PORT;

  // -----------------------------------------------------------------------
  // deploy
  // -----------------------------------------------------------------------

  /**
   * Start a full deployment workflow for the given config.
   * Each phase is logged and the status object is updated in-place.
   *
   * NOTE: This is a simulated deployment. In production, each status
   * transition would invoke real Docker / cloud-provider commands.
   */
  deploy(config: DeploymentConfig): DeploymentStatus {
    // 1. Validate config
    if (!config.plugId || !config.projectName) {
      const errorMsg = 'Invalid deployment config — plugId and projectName are required.';
      logger.error({ config }, `[Deployer] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const deploymentId = uuidv4();
    const timestamp = now();
    const containerName = sanitiseName(config.projectName);

    const status: DeploymentStatus = {
      deploymentId,
      plugId: config.plugId,
      status: 'pending',
      logs: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.deployments.set(deploymentId, status);
    this.appendLog(status, `Deployment ${deploymentId} created for plug "${config.plugId}"`);

    // 2. Provisioning
    this.transition(status, 'provisioning');
    this.appendLog(status, `Provisioning ${config.provider} resources for "${config.projectName}"`);

    // 3. Generate Docker compose config (for audit / reference)
    const composeYml = this.generateDockerCompose(config);
    this.appendLog(status, `Docker Compose config generated (${composeYml.length} bytes)`);

    // 4. Building image
    this.transition(status, 'building-image');
    status.containerId = `aims-${containerName}-${deploymentId.slice(0, 8)}`;
    this.appendLog(status, `Building image for container "${status.containerId}"`);

    // 5. Assign port
    const assignedPort = this.allocatePort();
    status.port = assignedPort;
    this.appendLog(status, `Port ${assignedPort} allocated`);

    // 6. Starting
    this.transition(status, 'starting');
    this.appendLog(status, `Starting container "${status.containerId}" on port ${assignedPort}`);

    // 7. Generate URL
    if (config.domain && config.sslEnabled) {
      status.url = `https://${config.domain}`;
    } else if (config.domain) {
      status.url = `http://${config.domain}`;
    } else {
      status.url = `http://${containerName}.aims.local:${assignedPort}`;
    }
    status.healthCheckUrl = `${status.url}/health`;
    this.appendLog(status, `URL resolved to ${status.url}`);

    // 8. Running
    this.transition(status, 'running');
    this.appendLog(status, `Container "${status.containerId}" is running — deployment complete`);

    logger.info(
      { deploymentId, plugId: config.plugId, url: status.url, port: assignedPort },
      '[Deployer] Deployment succeeded',
    );

    return status;
  }

  // -----------------------------------------------------------------------
  // Status queries
  // -----------------------------------------------------------------------

  getStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  listAll(): DeploymentStatus[] {
    return Array.from(this.deployments.values());
  }

  /**
   * List deployments owned by a specific user.
   * Requires prior registration of plugId -> userId via `registerOwnership`.
   */
  listByUser(userId: string): DeploymentStatus[] {
    const ownedPlugIds = new Set<string>();
    for (const [plugId, owner] of this.plugOwnership.entries()) {
      if (owner === userId) {
        ownedPlugIds.add(plugId);
      }
    }
    return Array.from(this.deployments.values()).filter((d) =>
      ownedPlugIds.has(d.plugId),
    );
  }

  /**
   * Register ownership mapping so `listByUser` can resolve plug -> user.
   */
  registerOwnership(plugId: string, userId: string): void {
    this.plugOwnership.set(plugId, userId);
    logger.info({ plugId, userId }, '[Deployer] Ownership registered');
  }

  // -----------------------------------------------------------------------
  // Lifecycle controls
  // -----------------------------------------------------------------------

  stop(deploymentId: string): DeploymentStatus {
    const status = this.requireDeployment(deploymentId);

    if (status.status === 'stopped') {
      logger.warn({ deploymentId }, '[Deployer] Already stopped');
      return status;
    }

    this.transition(status, 'stopped');
    this.appendLog(status, `Container "${status.containerId}" stopped`);

    logger.info({ deploymentId, plugId: status.plugId }, '[Deployer] Deployment stopped');
    return status;
  }

  restart(deploymentId: string): DeploymentStatus {
    const status = this.requireDeployment(deploymentId);

    if (status.status === 'running') {
      logger.warn({ deploymentId }, '[Deployer] Already running');
      return status;
    }

    this.transition(status, 'starting');
    this.appendLog(status, `Restarting container "${status.containerId}"`);

    this.transition(status, 'health-check');
    this.appendLog(status, `Running health check at ${status.healthCheckUrl}`);

    this.transition(status, 'running');
    this.appendLog(status, `Container "${status.containerId}" restarted successfully`);

    logger.info({ deploymentId, plugId: status.plugId }, '[Deployer] Deployment restarted');
    return status;
  }

  remove(deploymentId: string): boolean {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      logger.warn({ deploymentId }, '[Deployer] remove — deployment not found');
      return false;
    }

    // Stop first if running
    if (status.status === 'running' || status.status === 'starting') {
      this.transition(status, 'stopped');
      this.appendLog(status, `Container "${status.containerId}" stopped before removal`);
    }

    this.deployments.delete(deploymentId);
    logger.info({ deploymentId, plugId: status.plugId }, '[Deployer] Deployment removed');
    return true;
  }

  // -----------------------------------------------------------------------
  // Config generators
  // -----------------------------------------------------------------------

  /**
   * Generate a docker-compose.yml string for the given deployment config.
   */
  generateDockerCompose(config: DeploymentConfig): string {
    const serviceName = sanitiseName(config.projectName);
    const envLines = Object.entries(config.envVars)
      .map(([key, value]) => `      - ${key}=${value}`)
      .join('\n');

    const portMapping = `${config.port}:${config.port}`;

    return [
      'version: "3.8"',
      '',
      'services:',
      `  ${serviceName}:`,
      `    build: .`,
      `    container_name: aims-${serviceName}`,
      `    restart: unless-stopped`,
      '    ports:',
      `      - "${portMapping}"`,
      '    environment:',
      `      - NODE_ENV=production`,
      `      - PORT=${config.port}`,
      envLines ? envLines : '',
      '    healthcheck:',
      `      test: ["CMD", "curl", "-f", "http://localhost:${config.port}/health"]`,
      '      interval: 30s',
      '      timeout: 10s',
      '      retries: 3',
      '      start_period: 40s',
      '    networks:',
      '      - aims-network',
      '',
      'networks:',
      '  aims-network:',
      '    driver: bridge',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  /**
   * Generate an nginx server block for reverse-proxying to the Plug container.
   */
  generateNginxConfig(config: DeploymentConfig): string {
    const upstream = `http://127.0.0.1:${config.port}`;
    const serverName = config.domain ?? `${sanitiseName(config.projectName)}.aims.local`;

    if (config.sslEnabled && config.domain) {
      return [
        'server {',
        '    listen 80;',
        `    server_name ${serverName};`,
        `    return 301 https://$host$request_uri;`,
        '}',
        '',
        'server {',
        '    listen 443 ssl http2;',
        `    server_name ${serverName};`,
        '',
        `    ssl_certificate     /etc/letsencrypt/live/${config.domain}/fullchain.pem;`,
        `    ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;`,
        '',
        '    location / {',
        `        proxy_pass ${upstream};`,
        '        proxy_http_version 1.1;',
        '        proxy_set_header Upgrade $http_upgrade;',
        '        proxy_set_header Connection "upgrade";',
        '        proxy_set_header Host $host;',
        '        proxy_set_header X-Real-IP $remote_addr;',
        '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
        '        proxy_set_header X-Forwarded-Proto $scheme;',
        '    }',
        '',
        '    location /health {',
        `        proxy_pass ${upstream}/health;`,
        '    }',
        '}',
      ].join('\n');
    }

    return [
      'server {',
      '    listen 80;',
      `    server_name ${serverName};`,
      '',
      '    location / {',
      `        proxy_pass ${upstream};`,
      '        proxy_http_version 1.1;',
      '        proxy_set_header Upgrade $http_upgrade;',
      '        proxy_set_header Connection "upgrade";',
      '        proxy_set_header Host $host;',
      '        proxy_set_header X-Real-IP $remote_addr;',
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
      '        proxy_set_header X-Forwarded-Proto $scheme;',
      '    }',
      '',
      '    location /health {',
      `        proxy_pass ${upstream}/health;`,
      '    }',
      '}',
    ].join('\n');
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private allocatePort(): number {
    const port = this.nextPort;
    this.nextPort += 1;
    return port;
  }

  private transition(
    status: DeploymentStatus,
    to: DeploymentStatus['status'],
  ): void {
    status.status = to;
    status.updatedAt = now();

    logger.info(
      { deploymentId: status.deploymentId, status: to },
      `[Deployer] Status -> ${to}`,
    );
  }

  private appendLog(status: DeploymentStatus, message: string): void {
    const entry = `[${now()}] ${message}`;
    status.logs.push(entry);
  }

  private requireDeployment(deploymentId: string): DeploymentStatus {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      const msg = `Deployment "${deploymentId}" not found.`;
      logger.error({ deploymentId }, `[Deployer] ${msg}`);
      throw new Error(msg);
    }
    return status;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const deployer = new DeploymentManager();
