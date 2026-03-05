'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface ApprovalData {
  requestId: string;
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  expiresAt?: string;
}

const RISK_CONFIG: Record<string, { color: string; variant: 'success' | 'warning' | 'destructive' | 'info'; icon: string }> = {
  low: { color: 'text-emerald-400', variant: 'success', icon: '✅' },
  medium: { color: 'text-amber-400', variant: 'warning', icon: '⚠️' },
  high: { color: 'text-orange-400', variant: 'warning', icon: '🔶' },
  critical: { color: 'text-red-400', variant: 'destructive', icon: '🛑' },
};

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function ApprovalGate({ block, onAction }: Props) {
  const data = block.data as unknown as ApprovalData;
  const riskInfo = RISK_CONFIG[data.risk] || RISK_CONFIG.medium;

  return (
    <Card className="border-amber-500/20 bg-amber-500/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            {riskInfo.icon} Approval Required
          </CardTitle>
          <Badge variant={riskInfo.variant}>
            {data.risk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-300">{data.description}</p>
        <Alert variant="warning">
          <AlertDescription className="text-xs">
            <strong>Action:</strong> {data.action}
          </AlertDescription>
        </Alert>
        {data.details && Object.keys(data.details).length > 0 && (
          <div className="rounded-lg bg-white/5 p-3 text-xs space-y-1">
            {Object.entries(data.details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-slate-500">{key}</span>
                <span className="font-mono text-zinc-300">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        {data.expiresAt && (
          <p className="text-xs text-slate-400">
            Expires: {new Date(data.expiresAt).toLocaleString()}
          </p>
        )}
      </CardContent>
      {block.interactive && (
        <CardFooter className="gap-2">
          <Button
            variant="acheevy"
            size="sm"
            onClick={() => onAction?.('approve', { requestId: data.requestId })}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction?.('reject', { requestId: data.requestId })}
          >
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
