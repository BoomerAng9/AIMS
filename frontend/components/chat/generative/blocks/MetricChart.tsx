'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface MetricPoint {
  timestamp: string;
  value: number;
}

interface MetricChartData {
  title: string;
  metric: string;
  unit: string;
  current: number;
  points: MetricPoint[];
  threshold?: { warn: number; critical: number };
}

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function MetricChart({ block }: Props) {
  const data = block.data as unknown as MetricChartData;

  // Simple sparkline using SVG
  const maxVal = Math.max(...data.points.map((p) => p.value), 1);
  const width = 240;
  const height = 60;
  const padding = 4;

  const pathPoints = data.points
    .map((p, i) => {
      const x = padding + (i / Math.max(data.points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (p.value / maxVal) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const getStatusVariant = (): 'success' | 'warning' | 'destructive' => {
    if (!data.threshold) return 'success';
    if (data.current >= data.threshold.critical) return 'destructive';
    if (data.current >= data.threshold.warn) return 'warning';
    return 'success';
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            📈 {data.title}
          </CardTitle>
          <Badge variant={getStatusVariant()} className="font-mono">
            {data.current}{data.unit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          {/* Threshold lines */}
          {data.threshold && (
            <>
              <line
                x1={padding}
                x2={width - padding}
                y1={height - padding - (data.threshold.warn / maxVal) * (height - padding * 2)}
                y2={height - padding - (data.threshold.warn / maxVal) * (height - padding * 2)}
                stroke="#f59e0b"
                strokeWidth="0.5"
                strokeDasharray="4,2"
              />
              <line
                x1={padding}
                x2={width - padding}
                y1={height - padding - (data.threshold.critical / maxVal) * (height - padding * 2)}
                y2={height - padding - (data.threshold.critical / maxVal) * (height - padding * 2)}
                stroke="#ef4444"
                strokeWidth="0.5"
                strokeDasharray="4,2"
              />
            </>
          )}
          {/* Sparkline */}
          {data.points.length > 1 && (
            <path
              d={pathPoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{data.metric}</span>
          <span>{data.points.length} points</span>
        </div>
      </CardContent>
    </Card>
  );
}
