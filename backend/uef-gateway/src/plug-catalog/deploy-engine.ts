/**
 * Plug Deploy Engine — One-Click Spin Up + Export
 *
 * Takes a PlugDefinition + user customization and:
 *   HOSTED:   Generates Docker Compose → deploys container → assigns port → generates URL
 *   EXPORTED: Generates Docker Compose + .env template + README + setup script → bundle
 *
 * Integrates with:
 * - DeploymentManager (deployer/) for container lifecycle
 * - Deploy Security Packet (DSP) for enterprise security
 * - LUC metering for cost tracking
 *
 * The structure never changes. Only the plug does.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { plugCatalog } from './catalog';
import { dockerRuntime } from './docker-runtime';
import { portAllocator } from './port-allocator';
import { instanceStore } from './instance-store';
import { tenantNetworks } from './tenant-networks';
import { liveSim } from '../livesim';
import { Oracle } from '../oracle';
import type {
  PlugDefinition,
  PlugInstance,
  PlugInstanceStatus,
  SpinUpRequest,
  SpinUpResult,
  ExportRequest,
  ExportResult,
  DeliveryMode,
  SecurityLevel,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_PORT = 51000;
const AIMS_DOMAIN = 'plugmein.cloud';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function sanitize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Plug Deploy Engine
// ---------------------------------------------------------------------------

export class PlugDeployEngine {
  private instances = new Map<string, PlugInstance>();
  private nextPort = BASE_PORT;

  /**
   * Hydrate the in-memory Map from SQLite on startup.
   * Called during instanceLifecycle.initialize() so instances survive restarts.
   */
  loadFromStore(): number {
    try {
      const persisted = instanceStore.listAll();
      for (const inst of persisted) {
        this.instances.set(inst.instanceId, inst);
        if (inst.assignedPort >= this.nextPort) {
          this.nextPort = inst.assignedPort + 10;
        }
      }
      logger.info({ count: persisted.length }, '[PlugDeploy] Loaded instances from SQLite');
      return persisted.length;
    } catch (err) {
      logger.warn({ err }, '[PlugDeploy] Failed to load instances from SQLite — starting fresh');
      return 0;
    }
  }

  // -----------------------------------------------------------------------
  // SPIN UP — One-click deployment
  // -----------------------------------------------------------------------

  async spinUp(request: SpinUpRequest): Promise<SpinUpResult> {
    const plug = plugCatalog.get(request.plugId);
    if (!plug) {
      throw new Error(`Plug "${request.plugId}" not found in catalog`);
    }

    if (plug.comingSoon && !request.allowExperimental) {
      throw new Error(
        `Plug "${plug.name}" is marked as coming soon. ` +
        `Set allowExperimental: true to deploy it in experimental mode.`,
      );
    }

    logger.info(
      { plugId: plug.id, userId: request.userId, delivery: request.deliveryMode },
      '[PlugDeploy] Spin-up requested',
    );

    const instanceId = uuidv4();
    const events: SpinUpResult['events'] = [];
    const addEvent = (stage: string, message: string) => {
      events.push({ timestamp: now(), stage, message });
      // Broadcast to LiveSim clients in real-time
      liveSim.emitDeployEvent(instanceId, stage, message, {
        plugId: plug.id,
        plugName: plug.name,
        userId: request.userId,
      });
    };

    // 0. ORACLE 8-gate verification — pre-flight security and governance check
    const oracleSpec = {
      query: `Deploy plug "${plug.name}" (${plug.id}) for user ${request.userId} in ${request.deliveryMode} mode`,
      intent: 'BUILD_PLUG',
      userId: request.userId,
      budget: { maxUsd: 10 }, // Default per-deploy budget cap
    };
    const oracleOutput = {
      quote: {
        variants: [{ model: 'docker-deploy', estimate: { totalTokens: 1000, totalUsd: (plug as any).pricing?.hourlyUsd || 0.01 } }],
      },
    };
    const oracleResult = await Oracle.runGates(oracleSpec, oracleOutput);
    addEvent('oracle', `ORACLE 8-gate: ${oracleResult.passed ? 'PASS' : 'FAIL'} (score: ${oracleResult.score}/100)`);

    if (!oracleResult.passed) {
      const failures = oracleResult.gateFailures.join('; ');
      logger.warn({ plugId: plug.id, userId: request.userId, failures }, '[PlugDeploy] ORACLE gate failed');
      throw new Error(`Deployment blocked by ORACLE 8-gate: ${failures}`);
    }

    if (oracleResult.warnings.length > 0) {
      for (const warning of oracleResult.warnings) {
        addEvent('oracle-warn', warning);
      }
    }

    // 1. Validate delivery mode
    if (!plug.supportedDelivery.includes(request.deliveryMode)) {
      throw new Error(
        `Plug "${plug.name}" does not support ${request.deliveryMode} delivery. ` +
        `Supported: ${plug.supportedDelivery.join(', ')}`,
      );
    }

    addEvent('validate', `Validated plug "${plug.name}" for ${request.deliveryMode} delivery`);

    // 2. Resolve customizations → env overrides
    const resolvedEnv = this.resolveEnvironment(plug, request);
    addEvent('configure', `Resolved ${Object.keys(resolvedEnv).length} environment variables`);

    // 3. Assign port (persistent allocation)
    const assignedPort = await this.allocatePortForInstance(instanceId, plug.id, request.userId);
    addEvent('provision', `Allocated port ${assignedPort}`);

    // 4. Create instance record
    const instance: PlugInstance = {
      instanceId,
      plugId: plug.id,
      userId: request.userId,
      name: request.instanceName,
      status: 'configuring',
      deliveryMode: request.deliveryMode,
      assignedPort,
      domain: request.domain,
      envOverrides: resolvedEnv,
      customizationValues: request.customizations,
      securityLevel: request.securityLevel || plug.securityLevel,
      lucCost: 0,
      uptimeSeconds: 0,
      healthStatus: 'unknown',
      createdAt: now(),
    };

    this.instances.set(instanceId, instance);
    instanceStore.upsert(instance);

    // 5. Handle by delivery mode
    if (request.deliveryMode === 'exported') {
      return this.handleExport(instance, plug, events);
    }

    // 6. HOSTED: Generate Docker Compose (kept for reference/export)
    const composeYml = this.generatePlugCompose(plug, instance);
    addEvent('build', `Generated Docker Compose (${composeYml.length} bytes)`);
    this.transition(instance, 'building');

    // 7. Generate nginx reverse proxy config
    const nginxConf = this.generatePlugNginx(plug, instance);
    addEvent('provision', `Generated nginx config for ${instance.domain || `${sanitize(instance.name)}.${AIMS_DOMAIN}`}`);

    // 8. Check Docker daemon availability
    const dockerAvailable = await dockerRuntime.isAvailable();
    if (!dockerAvailable) {
      // Fallback: store configs but mark as provisioning (will deploy when Docker is available)
      this.transition(instance, 'provisioning');
      addEvent('warn', 'Docker daemon not reachable — instance queued for deployment');
      instance.exportBundle = {
        composeFile: composeYml,
        envTemplate: this.generateEnvTemplate(plug, instance),
        readmeContent: this.generateReadme(plug, instance),
        setupScript: this.generateSetupScript(plug, instance),
        generatedAt: now(),
      };

      const lucQuote = this.estimateLucCost(plug);
      return {
        instance,
        deploymentId: instanceId,
        estimatedReadyTime: 'Queued — Docker unavailable',
        lucQuote,
        events,
      };
    }

    // 8.5. Ensure per-user tenant network isolation
    const tenantNetwork = await tenantNetworks.ensureTenantNetwork(request.userId);
    instance.envOverrides['__tenantNetwork'] = tenantNetwork;
    addEvent('isolate', `Tenant network: ${tenantNetwork}`);

    // 9. Pull Docker image
    const image = plug.docker.image;
    if (image) {
      this.transition(instance, 'provisioning');
      addEvent('pull', `Pulling image: ${image}`);
      const pullResult = await dockerRuntime.pullImage(image);
      if (!pullResult.pulled) {
        addEvent('warn', `Image pull failed: ${pullResult.error}. Attempting to use local image.`);
      } else {
        addEvent('pull', `Image pulled successfully: ${image}`);
      }
    }

    // 10. Create and start container via Docker API
    this.transition(instance, 'starting');
    addEvent('deploy', `Creating container on port ${assignedPort}`);

    const createResult = await dockerRuntime.createContainer(plug, instance);
    if (!createResult.started) {
      this.transition(instance, 'failed');
      addEvent('error', `Container failed to start: ${createResult.error}`);
      logger.error(
        { instanceId, error: createResult.error },
        '[PlugDeploy] Container start failed',
      );
      return {
        instance,
        deploymentId: instanceId,
        estimatedReadyTime: 'Failed',
        lucQuote: 0,
        events,
      };
    }

    addEvent('deploy', `Container started (${createResult.containerId.slice(0, 12)})`);

    // 11. Deploy nginx reverse proxy config
    const nginxResult = await dockerRuntime.deployNginxConfig(plug, instance, nginxConf);
    if (nginxResult.deployed) {
      addEvent('provision', 'Nginx reverse proxy config deployed');
    } else {
      addEvent('warn', `Nginx config deploy skipped: ${nginxResult.error}`);
    }

    // 12. Poll health check
    addEvent('health', `Polling health at http://127.0.0.1:${assignedPort}${plug.healthCheck.endpoint}`);

    const healthResult = await dockerRuntime.pollHealth(instance, plug);
    if (healthResult.healthy) {
      this.transition(instance, 'running');
      instance.startedAt = now();
      instance.healthStatus = 'healthy';
      instance.lastHealthCheck = now();
      addEvent('ready', `Plug "${plug.name}" is healthy after ${healthResult.attempts} checks`);
    } else {
      // Container is running but health check didn't pass yet — still mark as running
      this.transition(instance, 'running');
      instance.startedAt = now();
      instance.healthStatus = 'unhealthy';
      instance.lastHealthCheck = now();
      addEvent('warn', `Health check did not pass after ${healthResult.attempts} attempts — container is running but may need time`);
    }

    // 13. Estimate LUC cost
    const lucQuote = this.estimateLucCost(plug);

    logger.info(
      { instanceId, plugId: plug.id, port: assignedPort, containerId: createResult.containerId.slice(0, 12) },
      '[PlugDeploy] Spin-up complete',
    );

    return {
      instance,
      deploymentId: instanceId,
      estimatedReadyTime: healthResult.healthy ? 'Ready' : '30-60 seconds',
      lucQuote,
      events,
    };
  }

  // -----------------------------------------------------------------------
  // EXPORT — Package for self-hosting
  // -----------------------------------------------------------------------

  async export(request: ExportRequest): Promise<ExportResult> {
    const instance = this.instances.get(request.instanceId);
    if (!instance) {
      throw new Error(`Instance "${request.instanceId}" not found`);
    }

    const plug = plugCatalog.get(instance.plugId);
    if (!plug) {
      throw new Error(`Plug "${instance.plugId}" not found in catalog`);
    }

    logger.info(
      { instanceId: request.instanceId, format: request.format },
      '[PlugDeploy] Export requested',
    );

    const files: Record<string, string> = {};

    // 1. Docker Compose
    files['docker-compose.yml'] = this.generatePlugCompose(plug, instance);

    // 2. Environment template
    files['.env.example'] = this.generateEnvTemplate(plug, instance);

    // 3. Nginx config
    files['nginx.conf'] = this.generatePlugNginx(plug, instance);

    // 4. Setup script
    files['setup.sh'] = this.generateSetupScript(plug, instance);

    // 5. README
    files['README.md'] = this.generateReadme(plug, instance);

    // 6. Health check script
    files['healthcheck.sh'] = this.generateHealthCheckScript(plug);

    const bundleId = uuidv4();

    // Write files to disk
    const writeResult = await dockerRuntime.writeExportBundle(bundleId, files);

    const result: ExportResult = {
      bundleId,
      files,
      instructions: `1. Copy all files to your server\n2. cp .env.example .env && edit .env with your keys\n3. chmod +x setup.sh && ./setup.sh\n4. Access at http://localhost:${instance.assignedPort}`,
      downloadUrl: writeResult.dir ? `/api/plugs/export/${bundleId}` : undefined,
      generatedAt: now(),
    };

    // Update instance
    instance.status = 'exported';
    instance.exportBundle = {
      composeFile: files['docker-compose.yml'],
      envTemplate: files['.env.example'],
      readmeContent: files['README.md'],
      setupScript: files['setup.sh'],
      generatedAt: now(),
    };

    logger.info(
      { bundleId, fileCount: Object.keys(files).length, dir: writeResult.dir },
      '[PlugDeploy] Export complete — files written to disk',
    );

    return result;
  }

  // -----------------------------------------------------------------------
  // Instance management
  // -----------------------------------------------------------------------

  getInstance(instanceId: string): PlugInstance | undefined {
    return this.instances.get(instanceId);
  }

  listByUser(userId: string): PlugInstance[] {
    return Array.from(this.instances.values()).filter(i => i.userId === userId);
  }

  async stopInstance(instanceId: string): Promise<PlugInstance> {
    const instance = this.requireInstance(instanceId);

    // Stop real container
    const result = await dockerRuntime.stopContainer(instance);
    if (!result.stopped) {
      logger.warn({ instanceId, error: result.error }, '[PlugDeploy] Docker stop failed, updating status anyway');
    }

    this.transition(instance, 'stopped');
    instance.stoppedAt = now();
    logger.info({ instanceId }, '[PlugDeploy] Instance stopped');
    return instance;
  }

  async restartInstance(instanceId: string): Promise<PlugInstance> {
    const instance = this.requireInstance(instanceId);
    const plug = plugCatalog.get(instance.plugId);

    // Stop then recreate
    await dockerRuntime.stopContainer(instance);
    this.transition(instance, 'starting');

    if (plug) {
      const createResult = await dockerRuntime.createContainer(plug, instance);
      if (createResult.started) {
        this.transition(instance, 'running');
        instance.startedAt = now();
        logger.info({ instanceId }, '[PlugDeploy] Instance restarted via Docker');
      } else {
        this.transition(instance, 'failed');
        logger.error({ instanceId, error: createResult.error }, '[PlugDeploy] Restart failed');
      }
    } else {
      this.transition(instance, 'running');
      instance.startedAt = now();
    }

    return instance;
  }

  async removeInstance(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    // Remove real container
    const result = await dockerRuntime.removeContainer(instance);
    if (!result.removed) {
      logger.warn({ instanceId, error: result.error }, '[PlugDeploy] Docker remove failed');
    }

    // Remove nginx config
    await dockerRuntime.removeNginxConfig(instance);

    this.instances.delete(instanceId);
    instanceStore.delete(instanceId);
    logger.info({ instanceId }, '[PlugDeploy] Instance fully decommissioned');
    return true;
  }

  // -----------------------------------------------------------------------
  // Instance health refresh — poll real container status
  // -----------------------------------------------------------------------

  async refreshInstanceHealth(instanceId: string): Promise<PlugInstance | undefined> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') return instance;

    const status = await dockerRuntime.inspectContainer(instance);
    instance.healthStatus = status.healthy ? 'healthy' : status.running ? 'unhealthy' : 'unknown';
    instance.uptimeSeconds = status.uptime;
    instance.lastHealthCheck = now();

    if (!status.running && instance.status === 'running') {
      this.transition(instance, 'stopped');
      instance.stoppedAt = now();
    }

    return instance;
  }

  // -----------------------------------------------------------------------
  // Config Generators
  // -----------------------------------------------------------------------

  private generatePlugCompose(plug: PlugDefinition, instance: PlugInstance): string {
    const serviceName = sanitize(instance.name || plug.id);
    const image = plug.docker.image || `aims-${plug.id}:latest`;
    const buildSection = plug.docker.buildContext
      ? `    build:\n      context: ${plug.docker.buildContext}\n`
      : '';
    const imageSection = plug.docker.image
      ? `    image: ${plug.docker.image}\n`
      : '';

    // Env vars
    const envLines = plug.envVars
      .map(ev => {
        const val = instance.envOverrides[ev.key] || ev.default || '';
        return `      - ${ev.key}=${ev.sensitive ? '${' + ev.key + '}' : val}`;
      })
      .join('\n');

    // Ports
    const portLines = plug.ports
      .map((p, i) => {
        const hostPort = instance.assignedPort + i;
        return `      - "${hostPort}:${p.internal}"  # ${p.description}`;
      })
      .join('\n');

    // Volumes
    const volumeLines = plug.volumes
      .map(v => `      - ${v.name}:${v.mountPath}  # ${v.description}`)
      .join('\n');

    const volumeDecls = plug.volumes
      .map(v => `  ${v.name}:`)
      .join('\n');

    // Health check
    const hc = plug.healthCheck;

    // Resource limits
    const resources = plug.resources;

    // Network
    const network = plug.networkPolicy.isolatedSandbox ? 'sandbox-network' : 'aims-network';

    return `# Auto-generated by A.I.M.S. Plug Deploy Engine
# Plug: ${plug.name} (${plug.id})
# Instance: ${instance.name} (${instance.instanceId})
# Generated: ${now()}
#
# SAFETY: Do not edit env vars directly — use .env file
# SECURITY: Level ${instance.securityLevel}

version: "3.8"

services:
  ${serviceName}:
${imageSection}${buildSection}    container_name: aims-plug-${serviceName}
    restart: unless-stopped
    ports:
${portLines}
    environment:
      - NODE_ENV=production
${envLines}
    volumes:
${volumeLines}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:${plug.ports[0]?.internal || 8000}${hc.endpoint}"]
      interval: ${hc.interval}
      timeout: ${hc.timeout}
      retries: ${hc.retries}
      start_period: ${hc.startPeriod}
    networks:
      - ${network}
    deploy:
      resources:
        limits:
          cpus: '${resources.cpuLimit}'
          memory: ${resources.memoryLimit}

networks:
  ${network}:
    driver: bridge${plug.networkPolicy.isolatedSandbox ? '\n    internal: true' : ''}

volumes:
${volumeDecls}
`;
  }

  private generateEnvTemplate(plug: PlugDefinition, instance: PlugInstance): string {
    const lines = [
      `# ${plug.name} — Environment Configuration`,
      `# Generated by A.I.M.S. Plug Deploy Engine`,
      `# Instance: ${instance.name}`,
      `# Date: ${now()}`,
      '',
      '# IMPORTANT: Fill in all REQUIRED values before running setup.sh',
      '# Sensitive values are marked with [SENSITIVE]',
      '',
    ];

    // Group by category
    const categories = new Map<string, typeof plug.envVars>();
    for (const ev of plug.envVars) {
      const cat = ev.category;
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(ev);
    }

    for (const [category, vars] of categories) {
      lines.push(`# ── ${category.toUpperCase()} ${'─'.repeat(60 - category.length)}`);
      for (const ev of vars) {
        const req = ev.required ? 'REQUIRED' : 'optional';
        const sens = ev.sensitive ? ' [SENSITIVE]' : '';
        lines.push(`# ${ev.description} (${req}${sens})`);
        lines.push(`${ev.key}=${ev.default || ''}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generatePlugNginx(plug: PlugDefinition, instance: PlugInstance): string {
    const serverName = instance.domain || `${sanitize(instance.name)}.${AIMS_DOMAIN}`;
    const upstream = `http://127.0.0.1:${instance.assignedPort}`;

    return `# Auto-generated by A.I.M.S. Plug Deploy Engine
# Plug: ${plug.name} | Instance: ${instance.name}

upstream plug_${sanitize(instance.name)} {
    server 127.0.0.1:${instance.assignedPort};
}

server {
    listen 80;
    server_name ${serverName};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass ${upstream};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long-running agent tasks
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location ${plug.healthCheck.endpoint} {
        proxy_pass ${upstream}${plug.healthCheck.endpoint};
        access_log off;
    }
}
`;
  }

  private generateSetupScript(plug: PlugDefinition, instance: PlugInstance): string {
    return `#!/bin/bash
# A.I.M.S. Plug Setup Script
# Plug: ${plug.name}
# Instance: ${instance.name}
# Generated: ${now()}
#
# Usage: chmod +x setup.sh && ./setup.sh

set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  A.I.M.S. Plug Deploy — ${plug.name}"
echo "  Powered by AI Managed Solutions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Check Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed. Install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed."
    exit 1
fi

echo "[OK] Docker and Docker Compose detected"

# 2. Check .env
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[INFO] Created .env from .env.example"
        echo "[ACTION] Edit .env with your API keys before continuing"
        echo "Press Enter when ready..."
        read -r
    else
        echo "[ERROR] No .env or .env.example found"
        exit 1
    fi
fi

# 3. Validate required env vars
echo ""
echo "Validating environment..."
MISSING=0
${plug.envVars
  .filter(ev => ev.required)
  .map(ev => `
if [ -z "\${${ev.key}:-}" ] && grep -q "^${ev.key}=$" .env 2>/dev/null; then
    echo "[WARN] ${ev.key} is empty (${ev.description})"
    MISSING=$((MISSING + 1))
fi`)
  .join('')}

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "[WARN] $MISSING required variable(s) may be empty. Continue? (y/N)"
    read -r REPLY
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
        exit 1
    fi
fi

echo "[OK] Environment validated"

# 4. Pull/Build
echo ""
echo "Building containers..."
docker compose build --pull 2>&1 || docker compose pull 2>&1

# 5. Deploy
echo ""
echo "Starting ${plug.name}..."
docker compose up -d --remove-orphans

# 6. Health check
echo ""
echo "Waiting for health check..."
RETRIES=0
MAX_RETRIES=30
until docker compose exec ${sanitize(instance.name)} wget --no-verbose --tries=1 --spider http://localhost:${plug.ports[0]?.internal || 8000}${plug.healthCheck.endpoint} 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
        echo "[WARN] Health check timed out — check logs with: docker compose logs"
        break
    fi
    sleep 2
done

if [ "$RETRIES" -lt "$MAX_RETRIES" ]; then
    echo "[OK] ${plug.name} is healthy"
fi

# 7. Done
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ${plug.name} is running!"
echo "  URL: http://localhost:${instance.assignedPort}"
echo "  Health: http://localhost:${instance.assignedPort}${plug.healthCheck.endpoint}"
echo ""
echo "  Commands:"
echo "    docker compose logs -f     # View logs"
echo "    docker compose stop        # Stop"
echo "    docker compose restart     # Restart"
echo "    docker compose down        # Remove"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Powered by A.I.M.S. — AI Managed Solutions"
echo "https://plugmein.cloud"
`;
  }

  private generateReadme(plug: PlugDefinition, instance: PlugInstance): string {
    return `# ${plug.name} — Deployed by A.I.M.S.

> ${plug.tagline}

## Quick Start

\`\`\`bash
# 1. Configure your environment
cp .env.example .env
nano .env  # Fill in your API keys

# 2. Run setup
chmod +x setup.sh
./setup.sh
\`\`\`

## About This Plug

${plug.description}

- **Category:** ${plug.category}
- **Version:** ${plug.version}
- **License:** ${plug.license}
- **Security Level:** ${instance.securityLevel}
${plug.sourceUrl ? `- **Source:** ${plug.sourceUrl}` : ''}

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
${plug.envVars.map(ev => `| \`${ev.key}\` | ${ev.required ? 'Yes' : 'No'} | ${ev.description} |`).join('\n')}

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
${plug.ports.map(p => `| ${p.internal} | ${p.protocol} | ${p.description} |`).join('\n')}

## Resource Requirements

- **CPU:** ${plug.resources.cpuLimit} core(s)
- **Memory:** ${plug.resources.memoryLimit}
${plug.resources.gpuRequired ? `- **GPU:** Required (${plug.resources.gpuType || 'any'})` : '- **GPU:** Not required'}

## Customizations Applied

${Object.entries(instance.customizationValues).map(([k, v]) => `- **${k}:** ${v}`).join('\n') || 'Default configuration'}

## Management Commands

\`\`\`bash
docker compose logs -f          # Stream logs
docker compose ps               # Service status
docker compose restart           # Restart
docker compose stop              # Stop
docker compose down              # Remove containers
docker compose down -v           # Remove containers + data
\`\`\`

## Health Check

\`\`\`bash
curl http://localhost:${instance.assignedPort}${plug.healthCheck.endpoint}
\`\`\`

## Support

This plug was deployed by **A.I.M.S. — AI Managed Solutions**.

- Website: https://plugmein.cloud
- Dashboard: https://plugmein.cloud/dashboard/deploy-dock

---

*Generated ${now()} by A.I.M.S. Plug Deploy Engine*
`;
  }

  private generateHealthCheckScript(plug: PlugDefinition): string {
    return `#!/bin/bash
# Health check for ${plug.name}
curl -sf http://localhost:${plug.ports[0]?.internal || 8000}${plug.healthCheck.endpoint} > /dev/null 2>&1
exit $?
`;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async handleExport(
    instance: PlugInstance,
    plug: PlugDefinition,
    events: SpinUpResult['events'],
  ): Promise<SpinUpResult> {
    events.push({ timestamp: now(), stage: 'export', message: 'Generating export bundle...' });

    const exportResult = await this.export({
      instanceId: instance.instanceId,
      format: 'docker-compose',
      includeData: false,
    });

    events.push({
      timestamp: now(),
      stage: 'ready',
      message: `Export bundle ready (${Object.keys(exportResult.files).length} files)` +
        (exportResult.downloadUrl ? ` — download at ${exportResult.downloadUrl}` : ''),
    });

    return {
      instance,
      deploymentId: instance.instanceId,
      estimatedReadyTime: 'Instant (export)',
      lucQuote: 0,
      events,
    };
  }

  private resolveEnvironment(
    plug: PlugDefinition,
    request: SpinUpRequest,
  ): Record<string, string> {
    const env: Record<string, string> = {};

    // Start with defaults
    for (const ev of plug.envVars) {
      if (ev.default) {
        env[ev.key] = ev.default;
      }
    }

    // Apply customization env mappings
    for (const customization of plug.customizations) {
      if (customization.envMapping && request.customizations[customization.id] !== undefined) {
        env[customization.envMapping] = String(request.customizations[customization.id]);
      }
    }

    // Apply explicit overrides (highest priority)
    for (const [key, value] of Object.entries(request.envOverrides)) {
      env[key] = value;
    }

    return env;
  }

  private estimateLucCost(plug: PlugDefinition): number {
    // Base cost per tier
    const tierCosts: Record<string, number> = {
      free: 0,
      starter: 50,
      pro: 200,
      enterprise: 500,
    };

    let cost = tierCosts[plug.tier] || 100;

    // GPU adds cost
    if (plug.resources.gpuRequired) {
      cost += 300;
    }

    // Memory factor
    const memGB = parseInt(plug.resources.memoryLimit) || 1;
    cost += memGB * 20;

    return cost;
  }

  /**
   * Allocate a port for an instance. Uses the persistent PortAllocator
   * when available, falls back to in-memory counter.
   */
  async allocatePortForInstance(instanceId: string, plugId: string, userId: string): Promise<number> {
    try {
      return await portAllocator.allocate(instanceId, plugId, userId);
    } catch {
      // Fallback to in-memory counter if allocator fails
      return this.allocatePort();
    }
  }

  private allocatePort(): number {
    const port = this.nextPort;
    this.nextPort += 10;
    return port;
  }

  private transition(instance: PlugInstance, status: PlugInstanceStatus): void {
    instance.status = status;
    try { instanceStore.updateStatus(instance.instanceId, status, instance); } catch (_) { /* best-effort */ }
    logger.info(
      { instanceId: instance.instanceId, status },
      `[PlugDeploy] Status → ${status}`,
    );
  }

  private requireInstance(instanceId: string): PlugInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance "${instanceId}" not found`);
    }
    return instance;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const plugDeployEngine = new PlugDeployEngine();
