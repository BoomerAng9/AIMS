// frontend/components/luc/LucPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  lucApi,
  formatQuota,
  formatCost,
  formatPercent,
  getWarningColor,
  getWarningBgColor,
  getServiceDisplayInfo,
  getAllServiceKeys,
  groupServicesByCategory,
} from "@/aims-tools/luc/luc.adapters";
import type {
  SummaryResponse,
  EstimateResponse,
} from "@/aims-tools/luc/luc.schemas";
import type { ServiceKey } from "@/aims-tools/luc/luc.constants";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LucPanelProps {
  workspaceId?: string;
  mode?: "simulate" | "live";
  onModeChange?: (mode: "simulate" | "live") => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LucPanel({ workspaceId, mode = "simulate", onModeChange }: LucPanelProps) {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceKey | "">("");
  const [units, setUnits] = useState<number>(0);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [estimating, setEstimating] = useState(false);

  const effectiveWorkspaceId = workspaceId || session?.user?.email || "default";
  const servicesByCategory = groupServicesByCategory();

  // Fetch summary
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchSummary = async () => {
      try {
        const data = await lucApi.getSummary(effectiveWorkspaceId, {
          includeBreakdown: true,
        });
        setSummary(data);
      } catch (error) {
        console.error("[LucPanel] Failed to fetch summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [session?.user?.email, effectiveWorkspaceId]);

  // Handle estimate
  const handleEstimate = async () => {
    if (!selectedService || units <= 0) return;

    setEstimating(true);
    try {
      const data = await lucApi.estimate({
        workspaceId: effectiveWorkspaceId,
        services: [{ serviceKey: selectedService as ServiceKey, units }],
      });
      setEstimate(data);
    } catch (error) {
      console.error("[LucPanel] Failed to estimate:", error);
    } finally {
      setEstimating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-32 bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">LUC Calculator</h2>
          <p className="text-sm text-white/50 mt-1">
            Ledger Usage Calculator - Track and estimate resource consumption
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange?.("simulate")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              mode === "simulate"
                ? "bg-gold/10 border-gold/40 text-gold"
                : "border-wireframe-stroke/30 text-white/50 hover:text-white/70"
            }`}
          >
            Simulate
          </button>
          <button
            onClick={() => onModeChange?.("live")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              mode === "live"
                ? "bg-green-500/10 border-green-500/40 text-green-400"
                : "border-wireframe-stroke/30 text-white/50 hover:text-white/70"
            }`}
          >
            Live
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-black/30 border border-wireframe-stroke/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Plan
              </span>
              <p className="text-lg font-medium text-white capitalize">
                {summary.planId}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Period Ends
              </span>
              <p className="text-sm text-white/70">
                {new Date(summary.periodEnd).toLocaleDateString()} ({summary.daysRemaining}d)
              </p>
            </div>
          </div>

          {/* Overall usage bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Overall Usage</span>
              <span className={getWarningColor(summary.overallWarningLevel)}>
                {formatPercent(summary.overallPercentUsed)}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(summary.overallPercentUsed, 100)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  summary.overallWarningLevel === "none"
                    ? "bg-green-500"
                    : summary.overallWarningLevel === "soft"
                    ? "bg-yellow-500"
                    : summary.overallWarningLevel === "hard"
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
              />
            </div>
          </div>

          {/* Estimated cost */}
          <div className="mt-4 pt-4 border-t border-wireframe-stroke/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Estimated Cost</span>
              <span className="text-lg font-mono text-gold">
                {formatCost(summary.totalEstimatedCost)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Calculator */}
      <div className="p-4 rounded-xl bg-black/30 border border-wireframe-stroke/30">
        <h3 className="text-sm font-medium text-white/80 mb-4">Estimate Impact</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Service selector */}
          <div>
            <label className="block text-xs text-white/40 mb-1">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as ServiceKey)}
              className="w-full px-3 py-2 bg-black/40 border border-wireframe-stroke/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold/40"
            >
              <option value="">Select service...</option>
              {Object.entries(servicesByCategory).map(([category, keys]) => (
                <optgroup key={category} label={category.toUpperCase()}>
                  {keys.map((key) => {
                    const info = getServiceDisplayInfo(key);
                    return (
                      <option key={key} value={key}>
                        {info.name}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Units input */}
          <div>
            <label className="block text-xs text-white/40 mb-1">
              Units{" "}
              {selectedService && (
                <span className="text-white/30">
                  ({getServiceDisplayInfo(selectedService as ServiceKey).unitPlural})
                </span>
              )}
            </label>
            <input
              type="number"
              min="0"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black/40 border border-wireframe-stroke/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold/40"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <button
          onClick={handleEstimate}
          disabled={!selectedService || units <= 0 || estimating}
          className="w-full py-2 px-4 bg-gold/10 border border-gold/30 rounded-lg text-gold text-sm font-medium hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {estimating ? "Estimating..." : "Calculate Impact"}
        </button>

        {/* Estimate result */}
        <AnimatePresence>
          {estimate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-wireframe-stroke/20"
            >
              {estimate.items.map((item) => (
                <div key={item.serviceKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">
                      {getServiceDisplayInfo(item.serviceKey).name}
                    </span>
                    <span className="text-sm font-mono text-gold">
                      {formatCost(item.cost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Quota remaining</span>
                    <span className={item.wouldExceed ? "text-red-400" : "text-white/60"}>
                      {item.quotaRemaining <= 0
                        ? "Metered"
                        : item.quotaRemaining.toLocaleString()}
                    </span>
                  </div>
                  {item.warning && (
                    <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                      {item.warning}
                    </div>
                  )}
                  {item.wouldExceed && (
                    <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                      This operation would exceed your quota limit
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quota Breakdown */}
      {summary && summary.quotas.length > 0 && (
        <div className="p-4 rounded-xl bg-black/30 border border-wireframe-stroke/30">
          <h3 className="text-sm font-medium text-white/80 mb-4">Quota Breakdown</h3>
          <div className="space-y-3">
            {summary.quotas
              .filter((q) => q.limit > 0) // Hide metered-only quotas (no included allocation)
              .sort((a, b) => b.percentUsed - a.percentUsed)
              .map((quota) => (
                <div key={quota.serviceKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{quota.serviceName}</span>
                    <span className={getWarningColor(quota.warningLevel)}>
                      {formatQuota({
                        serviceKey: quota.serviceKey as ServiceKey,
                        limit: quota.limit,
                        used: quota.used,
                        reserved: quota.reserved,
                        overage: quota.overage,
                      })}
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quota.warningLevel === "none"
                          ? "bg-green-500/70"
                          : quota.warningLevel === "soft"
                          ? "bg-yellow-500/70"
                          : quota.warningLevel === "hard"
                          ? "bg-orange-500/70"
                          : "bg-red-500/70"
                      }`}
                      style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LucPanel;
