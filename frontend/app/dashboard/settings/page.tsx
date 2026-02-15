// frontend/app/dashboard/settings/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Save, Shield, Bell, Globe, Key, Check } from "lucide-react";

const STORAGE_KEY = "aims_settings";

interface Settings {
  workspaceName: string;
  industry: string;
  timezone: string;
  sessionTimeout: string;
  notifications: Record<string, boolean>;
}

const DEFAULT_SETTINGS: Settings = {
  workspaceName: "My ACHEEVY Workspace",
  industry: "Technology / SaaS",
  timezone: "America/New_York (EST)",
  sessionTimeout: "30 minutes",
  notifications: {
    taskCompletion: true,
    budgetWarnings: true,
    oracleFailures: false,
    weeklyDigest: false,
  },
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateField = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleNotification = useCallback((key: string) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.header
        variants={staggerItem}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Configuration
          </p>
          <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
            Settings
          </h1>
          <p className="mt-1 text-xs text-white/40">
            Workspace and team configuration.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={handleSave}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check size={14} /> Saved!
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Save size={14} /> Save Changes
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workspace Identity */}
        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-gold" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 font-mono">
              Workspace Identity
            </h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-white/30 font-mono">
                Workspace Name
              </label>
              <input
                type="text"
                value={settings.workspaceName}
                onChange={(e) => updateField("workspaceName", e.target.value)}
                aria-label="Workspace Name"
                className="w-full rounded-xl border border-wireframe-stroke bg-white/5 p-3 text-sm text-white outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-white/30 font-mono">
                Industry
              </label>
              <select
                value={settings.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                aria-label="Industry"
                className="w-full rounded-xl border border-wireframe-stroke bg-white/5 p-3 text-sm text-white outline-none focus:border-gold/40 transition-all"
              >
                <option>Technology / SaaS</option>
                <option>Real Estate</option>
                <option>Marketing / Agency</option>
                <option>Finance / Fintech</option>
                <option>Healthcare</option>
                <option>E-Commerce</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-white/30 font-mono">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => updateField("timezone", e.target.value)}
                aria-label="Timezone"
                className="w-full rounded-xl border border-wireframe-stroke bg-white/5 p-3 text-sm text-white outline-none focus:border-gold/40 transition-all"
              >
                <option>America/New_York (EST)</option>
                <option>America/Chicago (CST)</option>
                <option>America/Denver (MST)</option>
                <option>America/Los_Angeles (PST)</option>
                <option>Europe/London (GMT)</option>
                <option>Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Security */}
        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-gold" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 font-mono">
              Security
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-white/[0.02] p-4 hover:border-gold/20 transition-all">
              <div>
                <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                <p className="text-xs text-white/40">Add an extra layer of security.</p>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-mono text-gold hover:bg-gold/20 transition-colors"
              >
                Enable
              </motion.button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-white/[0.02] p-4 hover:border-gold/20 transition-all">
              <div>
                <p className="text-sm font-medium text-white">Session Timeout</p>
                <p className="text-xs text-white/40">Auto-lock after inactivity.</p>
              </div>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => updateField("sessionTimeout", e.target.value)}
                aria-label="Session Timeout"
                className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-gold/40 transition-all"
              >
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* API Keys */}
        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-gold" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 font-mono">
              API Keys
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "LLM Provider", value: "sk-****...7f3a", status: "Active" },
              { label: "ByteRover Token", value: "br-****...2e1d", status: "Active" },
              { label: "Stripe (BAMARAM)", value: "Not configured", status: "Inactive" },
            ].map((key) => (
              <motion.div
                key={key.label}
                whileHover={{ borderColor: "rgba(212,168,67,0.2)" }}
                className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-white/[0.02] p-4 transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-white">{key.label}</p>
                  <p className="font-mono text-xs text-white/30">{key.value}</p>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider font-mono ${
                  key.status === "Active" ? "text-emerald-400" : "text-white/20"
                }`}>
                  {key.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-gold" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 font-mono">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "taskCompletion", label: "Task Completion Alerts", desc: "Notify when Boomer_Angs finish tasks." },
              { key: "budgetWarnings", label: "Budget Threshold Warnings", desc: "Alert when LUC spend exceeds 80%." },
              { key: "oracleFailures", label: "ORACLE Gate Failures", desc: "Notify on verification failures." },
              { key: "weeklyDigest", label: "Weekly Usage Digest", desc: "Email summary of platform usage." },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-white/[0.02] p-4 hover:border-gold/20 transition-all">
                <div>
                  <p className="text-sm font-medium text-white">{pref.label}</p>
                  <p className="text-xs text-white/40">{pref.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(pref.key)}
                  title={`Toggle ${pref.label}`}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                    settings.notifications[pref.key] ? "bg-gold" : "bg-white/10"
                  }`}
                >
                  <motion.div
                    animate={{ x: settings.notifications[pref.key] ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="h-5 w-5 rounded-full bg-black"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Danger Zone */}
      <motion.section
        variants={staggerItem}
        className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 hover:border-red-500/30 transition-all"
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-400 font-mono mb-4">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Delete Workspace</p>
            <p className="text-xs text-white/40">
              Permanently remove this workspace and all associated data. This cannot be undone.
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(239,68,68,0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg border border-red-500/40 px-4 py-1.5 text-xs font-mono text-red-400 transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  );
}
