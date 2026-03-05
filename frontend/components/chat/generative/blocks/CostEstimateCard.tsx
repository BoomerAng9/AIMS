'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface CostLineItem {
  label: string;
  amount: number;
  unit?: string;
  recurring?: boolean;
}

interface CostEstimateData {
  title: string;
  items: CostLineItem[];
  total: number;
  currency: string;
  period?: 'monthly' | 'yearly' | 'one-time';
  notes?: string;
}

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function CostEstimateCard({ block, onAction }: Props) {
  const data = block.data as unknown as CostEstimateData;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency || 'USD',
    }).format(amount);

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            💰 {data.title}
          </CardTitle>
          {data.period && (
            <Badge variant="outline" className="text-xs">
              {data.period}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">{item.label}</span>
              {item.recurring && (
                <span className="text-[10px] text-slate-400">(recurring)</span>
              )}
            </div>
            <span className="font-mono text-zinc-300">
              {formatCurrency(item.amount)}
              {item.unit && <span className="text-xs text-slate-400">/{item.unit}</span>}
            </span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between font-semibold">
          <span className="text-zinc-100">Total</span>
          <span className="text-slate-900 font-mono">{formatCurrency(data.total)}</span>
        </div>
        {data.notes && (
          <p className="text-xs text-slate-400 mt-2">{data.notes}</p>
        )}
      </CardContent>
      {block.interactive && (
        <CardFooter className="gap-2">
          <Button
            variant="acheevy"
            size="sm"
            onClick={() => onAction?.('approve_cost', { total: data.total })}
          >
            Approve Cost
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction?.('negotiate', {})}
          >
            Negotiate
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
