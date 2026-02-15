/**
 * Health Check API Endpoint
 *
 * Returns system health status for monitoring and load balancers.
 * Used by nginx, Docker health checks, and Circuit Box dashboard.
 */

import { NextResponse } from 'next/server';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
}

async function checkService(name: string, url: string): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);

    const latency = Date.now() - start;

    return {
      name,
      status: response.ok ? 'healthy' : 'degraded',
      latency,
    };
  } catch {
    return {
      name,
      status: 'unhealthy',
      latency: Date.now() - start,
    };
  }
}

export async function GET() {
  const startTime = Date.now();

  // Check downstream services (not self — responding to this request proves frontend is alive)
  const services: ServiceHealth[] = [];

  const serviceChecks: { name: string; url: string }[] = [];

  // Only check external services if URLs are configured
  if (process.env.UEF_GATEWAY_URL) {
    serviceChecks.push({ name: 'UEF Gateway', url: `${process.env.UEF_GATEWAY_URL}/health` });
  }
  if (process.env.ACHEEVY_URL) {
    serviceChecks.push({ name: 'ACHEEVY', url: `${process.env.ACHEEVY_URL}/health` });
  }
  if (process.env.AGENT_BRIDGE_URL) {
    serviceChecks.push({ name: 'Agent Bridge', url: `${process.env.AGENT_BRIDGE_URL}/health` });
  }

  // Run health checks in parallel
  const results = await Promise.all(
    serviceChecks.map(s => checkService(s.name, s.url))
  );
  services.push(...results);

  // Determine overall status
  const hasUnhealthy = services.some(s => s.status === 'unhealthy');
  const hasDegraded = services.some(s => s.status === 'degraded');

  const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services,
  };

  // Always return 200 for liveness — this endpoint responding proves the frontend
  // is alive. Downstream service status is informational (in the response body).
  // Docker/nginx healthchecks depend on this returning 200.
  return NextResponse.json(response, { status: 200 });
}
