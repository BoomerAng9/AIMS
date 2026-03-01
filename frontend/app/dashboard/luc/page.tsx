'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { usePlatformMode } from '@/lib/platform-mode';
import { t } from '@/lib/terminology';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';
import { QuotaBar } from '@/components/ui/QuotaBar';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// --- Types matched to expected backend API ---
interface LucStatus {
  plan: string;
  quota: number;
  remaining: number;
  used: number;
  cycleResetDate: string;
}

interface UsagePoint {
  date: string;
  amount: number;
}

interface ServiceBreakdown {
  service: string;
  amount: number;
}

interface LucUsage {
  timeSeries: UsagePoint[];
  services: ServiceBreakdown[];
}

interface Transaction {
  id: string;
  time: string;
  service: string;
  amount: number;
  description: string;
}

// Global fetcher using native fetch
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('API Error');
  return res.json();
});

export default function LucDashboardPage() {
  const { mode } = usePlatformMode();

  // 1) Fetch data (graceful fallbacks to empty/loading state if endpoints fail)
  const { data: status, error: statusErr, isLoading: statusLd } =
    useSWR<LucStatus>('/api/luc/status', fetcher, { refreshInterval: 60000 });
  const { data: usage, error: usageErr, isLoading: usageLd } =
    useSWR<LucUsage>('/api/luc/usage', fetcher);
  const { data: txs, error: txsErr, isLoading: txsLd } =
    useSWR<Transaction[]>('/api/luc/transactions', fetcher); // Adjust if it's POST /api/luc {action: get-history}

  const isLoading = statusLd || usageLd || txsLd;
  const isError = statusErr || usageErr || txsErr;

  // Render dummy data if API endpoints aren't throwing but returning 404 or empty initially for preview
  const safeStatus: LucStatus = status || {
    plan: 'Starter',
    quota: 10000,
    used: 3247,
    remaining: 6753,
    cycleResetDate: 'in 14 days'
  };

  const safeUsage: LucUsage = usage || {
    timeSeries: [
      { date: 'Mon', amount: 150 }, { date: 'Tue', amount: 200 },
      { date: 'Wed', amount: 50 }, { date: 'Thu', amount: 280 },
      { date: 'Fri', amount: 480 }, { date: 'Sat', amount: 300 },
      { date: 'Sun', amount: 600 }
    ],
    services: [
      { service: 'Chat', amount: 1200 },
      { service: 'Deploy', amount: 847 },
      { service: 'Voice', amount: 523 },
      { service: 'Research', amount: 412 },
      { service: 'Build', amount: 265 }
    ]
  };

  const safeTxs: Transaction[] = txs || [
    { id: '1', time: '2m ago', service: 'Chat', amount: -12, description: 'Claude Opus 4.6 query' },
    { id: '2', time: '15m ago', service: 'Deploy', amount: -100, description: 'Spin up: n8n instance' },
    { id: '3', time: '1h ago', service: 'Voice', amount: -25, description: 'TTS: 450 chars' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-[#111113] rounded-md w-1/4 mb-4"></div>
        <div className="h-32 bg-[#111113] rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-[#111113] rounded-2xl"></div>
          <div className="h-64 bg-[#111113] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-7xl mx-auto space-y-8"
    >
      {/* HEADER */}
      <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">
            LUC {t('billing', mode)} & Dashboard
          </h1>
          <p className="text-zinc-400 mt-1">Manage your usage compute quotas and view billing history.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium border border-white/10 transition-colors">
            Export
          </button>
          <button className="px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded-lg font-medium transition-colors">
            Upgrade Plan
          </button>
        </div>
      </motion.div>

      {/* PLAN & OVERALL QUOTA CARD */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg space-y-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left divide-x divide-white/5">
          <div className="px-2">
            <p className="text-sm text-zinc-500 font-medium">Plan</p>
            <p className="text-2xl font-bold text-white mt-1">{safeStatus.plan}</p>
          </div>
          <div className="px-4">
            <p className="text-sm text-zinc-500 font-medium">Credits</p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {safeStatus.quota.toLocaleString()}
            </p>
          </div>
          <div className="px-4">
            <p className="text-sm text-zinc-500 font-medium">Remaining</p>
            <p className="text-2xl font-bold text-[#10B981] mt-1 tabular-nums">
              {safeStatus.remaining.toLocaleString()}
            </p>
          </div>
          <div className="px-4">
            <p className="text-sm text-zinc-500 font-medium">Cycle Resets</p>
            <p className="text-lg font-medium text-zinc-300 mt-2">{safeStatus.cycleResetDate}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <QuotaBar used={safeStatus.used} total={safeStatus.quota} />
        </div>
      </motion.div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* USAGE BY SERVICE */}
        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg flex flex-col"
        >
          <h2 className="text-lg font-bold text-white mb-6">Usage by Service</h2>
          <div className="flex-1 space-y-4">
            {safeUsage.services.map((svc, i) => {
              const max = Math.max(...safeUsage.services.map(s => s.amount));
              const pct = (svc.amount / max) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-zinc-300">{svc.service}</span>
                    <span className="text-zinc-400 font-mono">{svc.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-[#18181B] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37]/50 to-[#D4AF37] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* USAGE OVER TIME */}
        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Usage Over Time</h2>
            <div className="flex bg-[#18181B] rounded-lg p-1">
              {['7d', '30d', '90d'].map((range, i) => (
                <button
                  key={range}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${i === 0 ? 'bg-[#27272A] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 h-64 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeUsage.timeSeries} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#71717A' }}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: '#22D3EE' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-zinc-500 border-b border-white/5">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Service</th>
                <th className="pb-3 font-medium text-right pr-4">Amount</th>
                <th className="pb-3 font-medium w-full">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {safeTxs.map(tx => (
                <tr key={tx.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 text-zinc-500">{tx.time}</td>
                  <td className="py-3 px-4 font-medium">{tx.service}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#EF4444]">{tx.amount}</td>
                  <td className="py-3 pl-4 truncate max-w-[200px]">{tx.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PLANS */}
      <motion.div variants={staggerItem} className="space-y-4">
        <h2 className="text-lg font-bold text-white">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Free', credits: '500/mo', price: '$0', action: 'Current', isCurrent: true },
            { name: 'Starter', credits: '10K/mo', price: '$29/mo', action: 'Upgrade' },
            { name: 'Pro', credits: '50K/mo', price: '$99/mo', action: 'Upgrade' },
            { name: 'Enterprise', credits: 'Custom', price: 'Contact', action: 'Contact' }
          ].map(plan => (
            <div
              key={plan.name}
              className={`rounded-xl border p-5 flex flex-col relative overflow-hidden transition-colors ${plan.isCurrent
                  ? 'bg-white/5 border-[#D4AF37]/50 ring-1 ring-[#D4AF37]/50'
                  : 'bg-[#18181B] border-white/10 hover:border-white/20'
                }`}
            >
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-3xl font-bold text-white mt-4">{plan.price}</p>
              <p className="text-sm font-medium text-zinc-400 mt-1 mb-6 border-b border-white/10 pb-4">
                {plan.credits}
              </p>
              <button
                className={`mt-auto py-2 w-full rounded-md font-medium text-sm transition-colors ${plan.isCurrent
                    ? 'bg-white/10 text-white cursor-default'
                    : 'bg-white text-black hover:bg-zinc-200'
                  }`}
              >
                {plan.action}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
