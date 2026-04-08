'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface PlugDeployData {
  plugName: string;
  plugId: string;
  image: string;
  status: 'pending' | 'pulling' | 'building' | 'running' | 'failed';
  port?: number;
  subdomain?: string;
  url?: string;
  memory?: string;
  cpu?: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  pending: { label: 'Pending', variant: 'info' },
  pulling: { label: 'Pulling Image', variant: 'warning' },
  building: { label: 'Building', variant: 'warning' },
  running: { label: 'Running', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function PlugDeployCard({ block, onAction }: Props) {
  const data = block.data as unknown as PlugDeployData;
  const statusInfo = STATUS_CONFIG[data.status] || STATUS_CONFIG.pending;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            🔌 {data.plugName}
          </CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-zinc-400">
        <div className="flex justify-between">
          <span>Image</span>
          <code className="text-xs bg-white/5 px-2 py-0.5 rounded font-mono">{data.image}</code>
        </div>
        {data.port && (
          <div className="flex justify-between">
            <span>Port</span>
            <span className="font-mono text-xs">{data.port}</span>
          </div>
        )}
        {data.subdomain && (
          <div className="flex justify-between">
            <span>URL</span>
            <span className="font-mono text-xs">{data.subdomain}.plugs.plugmein.cloud</span>
          </div>
        )}
        {(data.memory || data.cpu) && (
          <div className="flex justify-between">
            <span>Resources</span>
            <span className="text-xs">{data.memory || '512MB'} / {data.cpu || '0.5 CPU'}</span>
          </div>
        )}
      </CardContent>
      {block.interactive && data.status === 'running' && (
        <CardFooter className="gap-2">
          {data.url && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => window.open(data.url, '_blank')}
            >
              Open
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction?.('stop', { plugId: data.plugId })}
          >
            Stop
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
