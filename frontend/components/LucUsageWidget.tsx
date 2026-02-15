// frontend/components/LucUsageWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

interface LucQuotas {
  api_calls: number;
  brave_searches: number;
  container_hours: number;
  storage_gb: number;
  elevenlabs_chars: number;
  n8n_executions: number;
}

interface LucUsageData {
  tier: string;
  name: string;
  quotas: LucQuotas;
  used: LucQuotas;
  balance: string;
}

interface UsageBarProps {
  label: string;
  used: number;
  quota: number;
  unit?: string;
}

function UsageBar({ label, used, quota, unit }: UsageBarProps) {
  const pct = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;
  const color =
    pct >= 90
      ? "bg-red-400"
      : pct >= 70
        ? "bg-gold"
        : "bg-emerald-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[0.6rem] font-mono">
        <span className="text-white/50">{label}</span>
        <span className="text-white/40">
          {used}
          {unit ? unit : ""} / {quota}
          {unit ? unit : ""}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/[0.06]">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
        />
      </div>
    </div>
  );
}

interface LucUsageWidgetProps {
  compact?: boolean;
}

export function LucUsageWidget({ compact = false }: LucUsageWidgetProps) {
  const [data, setData] = useState<LucUsageData | null>(null);

  useEffect(() => {
    fetch("/api/luc/usage")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: LucUsageData) => setData(json))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-3 w-20 rounded bg-white/5" />
        <div className="h-1 w-full rounded bg-white/5" />
        <div className="h-1 w-full rounded bg-white/5" />
        <div className="h-1 w-full rounded bg-white/5" />
      </div>
    );
  }

  if (compact) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="space-y-2.5"
      >
        {/* Tier + balance */}
        <div className="flex items-center justify-between">
          <span className="text-[0.6rem] uppercase tracking-[0.15em] text-gold/60 font-mono">
            {data.name}
          </span>
          <span className="text-[0.65rem] font-semibold text-gold">
            {data.balance}
          </span>
        </div>

        {/* Top 3 usage bars */}
        <UsageBar
          label="API calls"
          used={data.used.api_calls}
          quota={data.quotas.api_calls}
        />
        <UsageBar
          label="Storage"
          used={data.used.storage_gb}
          quota={data.quotas.storage_gb}
          unit=" GB"
        />
        <UsageBar
          label="Containers"
          used={data.used.container_hours}
          quota={data.quotas.container_hours}
          unit=" hr"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="wireframe-card p-4 space-y-3"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.18em] text-gold/60 font-mono">
            LUC Usage
          </p>
          <p className="text-sm font-medium text-white mt-0.5">{data.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.55rem] uppercase tracking-[0.12em] text-white/40 font-mono">
            Balance
          </p>
          <p className="text-sm font-semibold text-gold">{data.balance}</p>
        </div>
      </div>

      {/* Tier badge */}
      <div className="inline-flex items-center gap-1.5 rounded-md border border-wireframe-stroke bg-white/[0.02] px-2 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gold/60" />
        <span className="text-[0.55rem] uppercase tracking-[0.12em] text-white/50 font-mono">
          {data.tier} tier
        </span>
      </div>

      {/* Usage bars */}
      <div className="space-y-2">
        <UsageBar
          label="API calls"
          used={data.used.api_calls}
          quota={data.quotas.api_calls}
        />
        <UsageBar
          label="Storage"
          used={data.used.storage_gb}
          quota={data.quotas.storage_gb}
          unit=" GB"
        />
        <UsageBar
          label="Containers"
          used={data.used.container_hours}
          quota={data.quotas.container_hours}
          unit=" hr"
        />
      </div>
    </motion.div>
  );
}
