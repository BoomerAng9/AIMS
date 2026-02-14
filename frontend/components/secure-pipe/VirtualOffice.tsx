// frontend/components/secure-pipe/VirtualOffice.tsx
'use client';

/**
 * VirtualOffice — Module 3: "The Virtual Office" Dashboard
 *
 * Real-time financial health visualization using the LUC engine.
 * Nixie Tube counters + Three Pillars Status indicators.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Module 3
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { NixieTubeDisplay } from '@/components/ui/NixieTube';
import { TrendingUp, TrendingDown, Shield, Zap, Eye, ArrowRight, BarChart3 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type PillarLevel = 'low' | 'standard' | 'high' | 'max';

interface PillarStatus {
  id: 'confidence' | 'convenience' | 'security';
  label: string;
  level: PillarLevel;
  score: number;
  icon: React.ReactNode;
  description: string;
}

interface FinancialMetric {
  id: string;
  label: string;
  value: number;
  prefix: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_METRICS: FinancialMetric[] = [
  { id: 'revenue', label: 'Revenue (MTD)', value: 12450, prefix: '$', trend: 'up', trendValue: '+18%' },
  { id: 'spend', label: 'AI Spend (MTD)', value: 847, prefix: '$', trend: 'down', trendValue: '-5%' },
  { id: 'margin', label: 'Net Margin', value: 93.2, prefix: '', trend: 'up', trendValue: '+2.1%' },
  { id: 'tasks', label: 'Tasks Completed', value: 2847, prefix: '', trend: 'up', trendValue: '+340' },
];

const MOCK_PILLARS: PillarStatus[] = [
  {
    id: 'confidence',
    label: 'Confidence',
    level: 'high',
    score: 92,
    icon: <Eye className="w-5 h-5" />,
    description: 'Agent outputs verified by ORACLE gates',
  },
  {
    id: 'convenience',
    label: 'Convenience',
    level: 'standard',
    score: 78,
    icon: <Zap className="w-5 h-5" />,
    description: 'Task completion speed and automation depth',
  },
  {
    id: 'security',
    label: 'Security',
    level: 'max',
    score: 98,
    icon: <Shield className="w-5 h-5" />,
    description: 'Sandbox isolation, payment blocking, RBAC',
  },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function PillarCard({ pillar }: { pillar: PillarStatus }) {
  const levelColors: Record<PillarLevel, { bar: string; text: string; bg: string }> = {
    low: { bar: 'bg-cb-red', text: 'text-cb-red', bg: 'bg-cb-red/10' },
    standard: { bar: 'bg-cb-amber', text: 'text-cb-amber', bg: 'bg-cb-amber/10' },
    high: { bar: 'bg-cb-green', text: 'text-cb-green', bg: 'bg-cb-green/10' },
    max: { bar: 'bg-gold', text: 'text-gold', bg: 'bg-gold/10' },
  };
  const lc = levelColors[pillar.level];

  return (
    <GlassCard className="!p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${lc.bg} ${lc.text}`}>
            {pillar.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{pillar.label}</h4>
            <span className={`text-[10px] font-mono uppercase tracking-wider ${lc.text}`}>
              {pillar.level}
            </span>
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono ${lc.text}`}>
          {pillar.score}
        </div>
      </div>
      <p className="text-[11px] text-white/30 mb-3">{pillar.description}</p>
      {/* Score bar */}
      <div className="w-full h-2 rounded-full bg-black/50 border border-wireframe-stroke overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pillar.score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`h-full rounded-full ${lc.bar}`}
        />
      </div>
    </GlassCard>
  );
}

function MetricTile({ metric }: { metric: FinancialMetric }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(metric.value * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [metric.value]);

  const formatted = metric.prefix === '$'
    ? `${metric.prefix}${displayValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : metric.id === 'margin'
      ? `${displayValue.toFixed(1)}%`
      : displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <GlassCard className="!p-4">
      <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{metric.label}</div>
      <div className="text-xl font-bold text-white font-mono">{formatted}</div>
      <div className="flex items-center gap-1 mt-1">
        {metric.trend === 'up' ? (
          <TrendingUp className="w-3 h-3 text-cb-green" />
        ) : metric.trend === 'down' ? (
          <TrendingDown className="w-3 h-3 text-cb-red" />
        ) : null}
        <span className={`text-[10px] font-mono ${
          metric.trend === 'up' ? 'text-cb-green' :
          metric.trend === 'down' ? 'text-cb-red' :
          'text-white/30'
        }`}>
          {metric.trendValue}
        </span>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Main VirtualOffice Component
// ─────────────────────────────────────────────────────────────

export function VirtualOffice() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gold">Virtual Office</h3>
          <p className="text-xs text-white/40">Real-time financial health powered by LUC</p>
        </div>
      </div>

      {/* Nixie Tube Hero Display */}
      <GlassCard variant="premium" glow className="text-center !py-8">
        <p className="text-[10px] text-gold/50 uppercase tracking-[0.3em] mb-4">
          Projected Monthly Revenue
        </p>
        <div className="flex justify-center">
          <NixieTubeDisplay value="$24,900" size="lg" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <TrendingUp className="w-4 h-4 text-cb-green" />
          <span className="text-sm text-cb-green font-mono">+22.4% vs last month</span>
        </div>
      </GlassCard>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_METRICS.map((metric) => (
          <MetricTile key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Three Pillars Status */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
          <h3 className="text-xs uppercase tracking-[0.3em] text-gold font-display whitespace-nowrap">
            Three Pillars Status
          </h3>
          <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_PILLARS.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Generate Report', desc: 'Export structured data for filing', action: 'report' },
          { label: 'View Evidence Locker', desc: 'All gate results and audit records', action: 'evidence' },
          { label: 'Schedule Restore Drill', desc: 'Backup verification required by D.U.M.B.', action: 'drill' },
        ].map((item) => (
          <button
            key={item.action}
            type="button"
            className="p-4 rounded-2xl border border-wireframe-stroke bg-black/30 hover:border-gold/20 hover:bg-gold/5 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">{item.label}</span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-gold transition-colors" />
            </div>
            <p className="text-[11px] text-white/30">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default VirtualOffice;
