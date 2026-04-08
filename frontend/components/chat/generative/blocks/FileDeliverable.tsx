'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface FileDeliverableData {
  fileName: string;
  fileType: string;
  size: number;
  downloadUrl: string;
  sha256?: string;
  description?: string;
  evidence?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  zip: '📦',
  tar: '📦',
  gz: '📦',
  png: '🖼️',
  jpg: '🖼️',
  svg: '🖼️',
  json: '📋',
  yaml: '📋',
  yml: '📋',
  log: '📝',
  txt: '📝',
  md: '📝',
  sh: '⚙️',
  dockerfile: '🐋',
};

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function FileDeliverable({ block, onAction }: Props) {
  const data = block.data as unknown as FileDeliverableData;
  const ext = data.fileName.split('.').pop()?.toLowerCase() || '';
  const icon = FILE_ICONS[ext] || '📎';

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            {icon} File Deliverable
          </CardTitle>
          {data.evidence && (
            <Badge variant="success" className="text-[10px]">
              Evidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-zinc-300">{data.fileName}</span>
          <span className="text-xs text-slate-400">{formatFileSize(data.size)}</span>
        </div>
        {data.description && (
          <p className="text-xs text-slate-500">{data.description}</p>
        )}
        {data.sha256 && (
          <div className="rounded bg-white/5 p-2 font-mono text-[10px] text-slate-400 break-all">
            SHA-256: {data.sha256}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="glass"
          size="sm"
          onClick={() => {
            if (data.downloadUrl) window.open(data.downloadUrl, '_blank');
            onAction?.('download', { fileName: data.fileName });
          }}
        >
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
