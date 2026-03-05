'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface ServiceHealthData {
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    uptime?: string;
    responseTime?: number;
    lastCheck?: string;
  }>;
  node?: string;
}

const HEALTH_CONFIG: Record<string, { dot: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  healthy: { dot: 'bg-emerald-500', variant: 'success' },
  degraded: { dot: 'bg-amber-500', variant: 'warning' },
  down: { dot: 'bg-red-500', variant: 'destructive' },
  unknown: { dot: 'bg-slate-400', variant: 'secondary' },
};

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function ServiceHealthCard({ block }: Props) {
  const data = block.data as unknown as ServiceHealthData;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            🏥 Service Health
          </CardTitle>
          {data.node && (
            <Badge variant="outline" className="text-xs">
              {data.node}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.services.map((svc) => {
            const health = HEALTH_CONFIG[svc.status] || HEALTH_CONFIG.unknown;
            return (
              <div
                key={svc.name}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${health.dot}`} />
                  <span className="text-sm font-medium text-zinc-300">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {svc.responseTime !== undefined && (
                    <span>{svc.responseTime}ms</span>
                  )}
                  {svc.uptime && <span>{svc.uptime}</span>}
                  <Badge variant={health.variant} className="text-[10px]">
                    {svc.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
