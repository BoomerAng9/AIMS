/**
 * useHealthCheck — Shared hook for platform health monitoring.
 * Polls /api/health every 30s and returns current health status.
 *
 * Extracted from DashboardShell.tsx to enable reuse across:
 *   - DashboardShell (sidebar status dot)
 *   - Operations page
 *   - Circuit Box
 *   - Any component needing live health data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'loading';

export interface ServiceHealth {
  name: string;
  status: string;
}

export interface HealthData {
  status: HealthStatus;
  services: ServiceHealth[];
  responseTime?: number;
}

interface UseHealthCheckOptions {
  /** Polling interval in ms (default: 30000) */
  interval?: number;
  /** Whether to start polling immediately (default: true) */
  enabled?: boolean;
}

export function useHealthCheck(options: UseHealthCheckOptions = {}): HealthData & { refresh: () => Promise<void> } {
  const { interval = 30_000, enabled = true } = options;

  const [health, setHealth] = useState<HealthData>({
    status: 'loading',
    services: [],
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('unhealthy');
      const data = await res.json();
      setHealth({
        status: data.status as HealthStatus,
        services: data.services ?? [],
        responseTime: data.responseTime,
      });
    } catch {
      setHealth({ status: 'unhealthy', services: [] });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function check() {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('unhealthy');
        const data = await res.json();
        if (mounted) {
          setHealth({
            status: data.status as HealthStatus,
            services: data.services ?? [],
            responseTime: data.responseTime,
          });
        }
      } catch {
        if (mounted) {
          setHealth({ status: 'unhealthy', services: [] });
        }
      }
    }

    check();
    const timer = setInterval(check, interval);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [enabled, interval]);

  return { ...health, refresh };
}

// ── Status display helpers ──

export function statusDotClass(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-amber-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-zinc-600 animate-pulse';
  }
}

export function statusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'All systems operational';
    case 'degraded':
      return 'Partial degradation detected';
    case 'unhealthy':
      return 'Services unreachable';
    default:
      return 'Checking status...';
  }
}

export function statusMessage(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'All services online and operational.';
    case 'degraded':
      return 'Running with limited capacity. Some services may be slow.';
    case 'unhealthy':
      return 'Services currently unreachable. Retrying automatically.';
    default:
      return 'Connecting to services...';
  }
}
