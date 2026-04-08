"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Cpu, Zap } from "lucide-react";

type OrchestratorStatusProps = {
  /** Current orchestrator state */
  status?: "idle" | "active";
  /** Current status message / task description */
  message?: string;
  /** Optional: current task name for the task badge */
  currentTask?: string;
  /** Optional: override uptime display (e.g. from API) */
  uptimeSeconds?: number;
};

function formatUptime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const OrchestratorStatus = ({
  status = "idle",
  message = "Ready for assignment",
  currentTask,
  uptimeSeconds,
}: OrchestratorStatusProps) => {
  const isActive = status === "active";

  // Local uptime counter — ticks every second
  const [localUptime, setLocalUptime] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track last activity whenever status changes to active or message changes
  useEffect(() => {
    if (isActive) {
      setLastActivity(new Date());
    }
  }, [isActive, message]);

  const displayUptime = uptimeSeconds ?? localUptime;

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {/* Main card body */}
      <div className="flex items-start gap-5 p-6">
        {/* Avatar with status ring */}
        <div className="relative flex-shrink-0">
          {/* Active glow */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="absolute -inset-1 rounded-full bg-amber-400/20 blur-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          {/* Avatar ring */}
          <div
            className={`relative w-[72px] h-[72px] rounded-full border-2 flex items-center justify-center bg-white transition-colors duration-300 ${
              isActive ? "border-amber-400" : "border-slate-200"
            }`}
          >
            <img
              src="/images/avatars/acheevy-badge.svg"
              alt="ACHEEVY"
              className="w-10 h-10"
            />
          </div>

          {/* Status dot */}
          <motion.div
            className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
              isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
            transition={
              isActive
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-marker text-slate-900 tracking-tight">
              ACHEEVY
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {isActive ? "Online" : "Standby"}
            </span>
          </div>

          <p className="text-slate-400 font-display text-xs tracking-widest uppercase">
            Orchestrator Agent
          </p>

          {/* Current task badge */}
          {currentTask && isActive && (
            <motion.div
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-amber-700"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Zap className="h-3 w-3" />
              <span className="font-medium">{currentTask}</span>
            </motion.div>
          )}

          {/* Message box */}
          <div className="mt-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-3">
            <AnimatePresence mode="wait">
              <motion.p
                key={message}
                className="text-slate-600 font-sans text-sm italic leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                &ldquo;{message}&rdquo;
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer stats bar */}
      <div className="flex items-center divide-x divide-slate-200 border-t border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
        {/* Uptime */}
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400">
            Uptime
          </span>
          <span className="font-mono text-slate-600 ml-auto">
            {formatUptime(displayUptime)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5">
          <Cpu className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400">
            State
          </span>
          <span
            className={`font-mono ml-auto ${
              isActive ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            {isActive ? "Executing" : "Idle"}
          </span>
        </div>

        {/* Last Activity */}
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5">
          <Activity className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400">
            Last Active
          </span>
          <span className="font-mono text-slate-600 ml-auto">
            {formatTimestamp(lastActivity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
