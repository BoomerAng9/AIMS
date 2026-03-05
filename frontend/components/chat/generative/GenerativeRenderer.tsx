'use client';

/**
 * Generative UI Renderer
 *
 * Routes GenerativeBlock types to their corresponding React components.
 * Uses dynamic imports for code-splitting.
 */

import React, { Suspense, lazy } from 'react';
import type { GenerativeBlock } from '@/lib/bridge/types';

// Lazy-load each block component for code-splitting
const PlugDeployCard = lazy(() => import('./blocks/PlugDeployCard'));
const ApprovalGate = lazy(() => import('./blocks/ApprovalGate'));
const ServiceHealthCard = lazy(() => import('./blocks/ServiceHealthCard'));
const ProgressTracker = lazy(() => import('./blocks/ProgressTracker'));
const CostEstimateCard = lazy(() => import('./blocks/CostEstimateCard'));
const ConfigForm = lazy(() => import('./blocks/ConfigForm'));
const MetricChart = lazy(() => import('./blocks/MetricChart'));
const FileDeliverable = lazy(() => import('./blocks/FileDeliverable'));
const SandboxExecutionCard = lazy(() => import('./blocks/SandboxExecutionCard'));

const BLOCK_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ block: GenerativeBlock; onAction?: (action: string, data?: Record<string, unknown>) => void }>>> = {
  plug_deploy: PlugDeployCard,
  approval_gate: ApprovalGate,
  service_health: ServiceHealthCard,
  progress_tracker: ProgressTracker,
  cost_estimate: CostEstimateCard,
  config_form: ConfigForm,
  metric_chart: MetricChart,
  file_deliverable: FileDeliverable,
  sandbox_execution: SandboxExecutionCard,
};

function BlockSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/8 bg-white/5 p-4">
      <div className="h-4 w-1/3 rounded bg-white/10 mb-3" />
      <div className="h-3 w-2/3 rounded bg-white/10 mb-2" />
      <div className="h-3 w-1/2 rounded bg-white/10" />
    </div>
  );
}

function UnknownBlock({ block }: { block: GenerativeBlock }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
      Unknown block type: <code className="font-mono text-amber-200">{block.blockType}</code>
    </div>
  );
}

interface GenerativeRendererProps {
  blocks: GenerativeBlock[];
  onAction?: (blockId: string, action: string, data?: Record<string, unknown>) => void;
}

export function GenerativeRenderer({ blocks, onAction }: GenerativeRendererProps) {
  return (
    <div className="flex flex-col gap-3 my-2">
      {blocks.map((block) => {
        const Component = BLOCK_MAP[block.blockType];

        if (!Component) {
          return <UnknownBlock key={block.blockId} block={block} />;
        }

        return (
          <Suspense key={block.blockId} fallback={<BlockSkeleton />}>
            <Component
              block={block}
              onAction={(action, data) => onAction?.(block.blockId, action, data)}
            />
          </Suspense>
        );
      })}
    </div>
  );
}

export default GenerativeRenderer;
