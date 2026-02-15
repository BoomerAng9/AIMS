/**
 * Circuit Metrics - Service Health Monitor
 *
 * Collects health and performance metrics from all A.I.M.S. services.
 * Exposes Prometheus-compatible metrics endpoint.
 */

import express, { Request, Response } from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '9090', 10);

// Service endpoints to monitor
const SERVICES = {
  frontend: process.env.FRONTEND_URL || 'http://frontend:3000',
  uefGateway: process.env.UEF_GATEWAY_URL || 'http://uef-gateway:3001',
  houseOfAng: process.env.HOUSE_OF_ANG_URL || 'http://house-of-ang:3002',
  acheevy: process.env.ACHEEVY_URL || 'http://acheevy:3003',
  agentBridge: process.env.AGENT_BRIDGE_URL || 'http://agent-bridge:3010',
};

interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

const healthCache: Map<string, ServiceHealth> = new Map();

async function checkServiceHealth(name: string, url: string): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    return {
      name,
      status: response.ok ? 'up' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAllServices(): Promise<ServiceHealth[]> {
  const results = await Promise.all(
    Object.entries(SERVICES).map(([name, url]) => checkServiceHealth(name, url))
  );

  results.forEach(health => healthCache.set(health.name, health));
  return results;
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'circuit-metrics' });
});

// All services status
app.get('/status', async (_req: Request, res: Response) => {
  const results = await checkAllServices();
  const allUp = results.every(s => s.status === 'up');

  res.json({
    overall: allUp ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: results,
  });
});

// Prometheus metrics
app.get('/metrics', async (_req: Request, res: Response) => {
  const results = await checkAllServices();

  let metrics = '# HELP aims_service_up Service availability (1=up, 0=down)\n';
  metrics += '# TYPE aims_service_up gauge\n';

  results.forEach(service => {
    const value = service.status === 'up' ? 1 : 0;
    metrics += `aims_service_up{service="${service.name}"} ${value}\n`;
  });

  metrics += '\n# HELP aims_service_response_time_ms Service response time in milliseconds\n';
  metrics += '# TYPE aims_service_response_time_ms gauge\n';

  results.forEach(service => {
    metrics += `aims_service_response_time_ms{service="${service.name}"} ${service.responseTime}\n`;
  });

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Individual service status
app.get('/status/:service', async (req: Request, res: Response) => {
  const { service } = req.params;
  const url = SERVICES[service as keyof typeof SERVICES];

  if (!url) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const health = await checkServiceHealth(service, url);
  res.json(health);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Circuit Metrics] Running on port ${PORT}`);

  // Initial health check
  checkAllServices().then(results => {
    console.log('[Circuit Metrics] Initial health check:');
    results.forEach(s => console.log(`  ${s.name}: ${s.status}`));
  });

  // Periodic health checks every 30 seconds
  setInterval(checkAllServices, 30000);
});
