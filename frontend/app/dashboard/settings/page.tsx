"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Save, Shield, Bell, Globe, Key, Check, Bot, Copy } from "lucide-react";

interface Settings {
  workspaceName: string;
  industry: string;
  timezone: string;
  sessionTimeout: string;
  chatRuntimeUrl: string;
  openRouterBaseUrl: string;
  openRouterModel: string;
  notifications: Record<string, boolean>;
}

interface OperatorConfigResponse {
  config: Settings;
  keyStatus: {
    openRouterApiKeyConfigured: boolean;
    chatRuntimeBridgeSecretConfigured: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
  workspaceName: "My ACHEEVY Workspace",
  industry: "Technology / SaaS",
  timezone: "America/New_York (EST)",
  sessionTimeout: "30 minutes",
  chatRuntimeUrl: "https://chat.your-domain.com",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  openRouterModel: "anthropic/claude-sonnet-4-5-20250929",
  notifications: {
    taskCompletion: true,
    budgetWarnings: true,
    oracleFailures: false,
    weeklyDigest: false,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState({
    openRouterApiKeyConfigured: false,
    chatRuntimeBridgeSecretConfigured: false,
  });

  useEffect(() => {
    let active = true;

    async function loadServerConfig() {
      try {
        setLoading(true);
        const response = await fetch('/api/operator/config');
        if (!response.ok) throw new Error('Failed to load operator config');
        const data = (await response.json()) as OperatorConfigResponse;
        if (!active) return;
        setSettings({ ...DEFAULT_SETTINGS, ...data.config });
        setKeyStatus(data.keyStatus);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load operator config');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadServerConfig();
    return () => {
      active = false;
    };
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

  const chatEnvBlock = useMemo(() => [
    `CHAT_RUNTIME_URL=${settings.chatRuntimeUrl || "https://chat.your-domain.com"}`,
    'CHAT_RUNTIME_BRIDGE_SECRET=<server-managed>',
    'OPENROUTER_API_KEY=<server-managed>',
    `OPENROUTER_BASE_URL=${settings.openRouterBaseUrl || "https://openrouter.ai/api/v1"}`,
    `OPENROUTER_MODEL=${settings.openRouterModel || "anthropic/claude-sonnet-4-5-20250929"}`,
  ].join("\n"), [settings.chatRuntimeUrl, settings.openRouterBaseUrl, settings.openRouterModel]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch('/api/operator/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'Failed to save operator config');
      }

      const data = (await response.json()) as OperatorConfigResponse;
      setSettings({ ...DEFAULT_SETTINGS, ...data.config });
      setKeyStatus(data.keyStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save operator config');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleCopyBlock = async () => {
    try {
      await navigator.clipboard.writeText(chatEnvBlock);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-72 animate-pulse rounded-2xl bg-white/5 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <motion.header variants={staggerItem} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-gold/50">Configuration</p>
          <h1 className="text-2xl font-display uppercase tracking-wider text-zinc-100 md:text-3xl">Settings</h1>
          <p className="mt-1 text-xs text-zinc-500">Workspace identity, Chat w/ ACHEEVY runtime, and local operator preferences.</p>
        </div>
        <motion.button
          type="button"
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check size={14} /> Saved
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.header>

      {error && (
        <motion.div variants={staggerItem} className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe size={16} className="text-gold" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">Workspace Identity</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">Workspace Name</label>
              <input type="text" aria-label="Workspace Name" value={settings.workspaceName} onChange={(e) => updateField("workspaceName", e.target.value)} className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-100 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20" />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">Industry</label>
              <select aria-label="Industry" value={settings.industry} onChange={(e) => updateField("industry", e.target.value)} className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-100 outline-none transition-all focus:border-gold/40">
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
              <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">Timezone</label>
              <select aria-label="Timezone" value={settings.timezone} onChange={(e) => updateField("timezone", e.target.value)} className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-100 outline-none transition-all focus:border-gold/40">
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

        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-gold" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-[#111113] p-4 transition-all hover:border-gold/20">
              <div>
                <p className="text-sm font-medium text-zinc-100">Two-Factor Authentication</p>
                <p className="text-xs text-zinc-500">Add an extra layer of account protection.</p>
              </div>
              <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-1.5 font-mono text-xs text-gold transition-colors hover:bg-gold/20">
                Enable
              </motion.button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-[#111113] p-4 transition-all hover:border-gold/20">
              <div>
                <p className="text-sm font-medium text-zinc-100">Session Timeout</p>
                <p className="text-xs text-zinc-500">Auto-lock after inactivity.</p>
              </div>
              <select aria-label="Session Timeout" value={settings.sessionTimeout} onChange={(e) => updateField("sessionTimeout", e.target.value)} className="rounded-xl border border-wireframe-stroke bg-[#18181B] px-3 py-1.5 text-xs text-zinc-100 outline-none transition-all focus:border-gold/40">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="wireframe-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Bot size={16} className="text-gold" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">Chat w/ ACHEEVY Runtime</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">Chat Runtime URL</label>
                <input type="url" aria-label="Chat Runtime URL" value={settings.chatRuntimeUrl} onChange={(e) => updateField("chatRuntimeUrl", e.target.value)} className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-100 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20" placeholder="https://chat.your-domain.com" />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">OpenRouter API Key</label>
                <div className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-300">
                  Server-managed via environment secret.
                </div>
                <p className="text-xs text-zinc-500">Set OPENROUTER_API_KEY in secure server environment management. The dashboard does not collect or store this key in the browser.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">OpenRouter Base URL</label>
                  <input type="url" aria-label="OpenRouter Base URL" value={settings.openRouterBaseUrl} onChange={(e) => updateField("openRouterBaseUrl", e.target.value)} className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-100 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20" placeholder="https://openrouter.ai/api/v1" />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">Default Model</label>
                  <input type="text" aria-label="Default OpenRouter Model" value={settings.openRouterModel} onChange={(e) => updateField("openRouterModel", e.target.value)} className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-100 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20" placeholder="anthropic/claude-sonnet-4-5-20250929" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">Chat Runtime Bridge Secret</label>
                <div className="w-full rounded-xl border border-wireframe-stroke bg-[#18181B] p-3 text-sm text-zinc-300">
                  Server-managed via environment secret.
                </div>
                <p className="text-xs text-zinc-500">Set CHAT_RUNTIME_BRIDGE_SECRET (or legacy alias) in secure server environment management.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-wireframe-stroke bg-[#111113] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Runtime Env Block</p>
                  <p className="text-xs text-zinc-500">Paste this into the Chat w/ ACHEEVY runtime environment to enable OpenRouter-backed models.</p>
                </div>
                <button type="button" onClick={handleCopyBlock} className="inline-flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 font-mono text-xs text-gold transition hover:bg-gold/15">
                  <Copy size={12} /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-amber-200 whitespace-pre-wrap">{chatEnvBlock}</pre>
              <div className="mt-4 space-y-3 text-xs text-zinc-500">
                <p>Configured key status: <span className="font-mono text-zinc-300">{keyStatus.openRouterApiKeyConfigured ? 'Configured on server' : 'Not configured'}</span></p>
                <p>Preferred runtime variable names are `CHAT_RUNTIME_URL` and `CHAT_RUNTIME_BRIDGE_SECRET`. `CHAT_INTERFACE_*` and `LIBRECHAT_*` remain supported as legacy aliases.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Key size={16} className="text-gold" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">Operator Key Status</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Chat Runtime URL", value: settings.chatRuntimeUrl || "Not configured", status: settings.chatRuntimeUrl ? "Active" : "Inactive" },
              {
                label: "OpenRouter",
                value: keyStatus.openRouterApiKeyConfigured ? "Configured on server" : "Not configured",
                status: keyStatus.openRouterApiKeyConfigured ? "Active" : "Inactive",
              },
              {
                label: "Bridge Secret",
                value: keyStatus.chatRuntimeBridgeSecretConfigured ? "Configured on server" : "Not configured",
                status: keyStatus.chatRuntimeBridgeSecretConfigured ? "Active" : "Inactive",
              },
            ].map((keyStatus) => (
              <div key={keyStatus.label} className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-[#111113] p-4 transition-all hover:border-gold/20">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{keyStatus.label}</p>
                  <p className="font-mono text-xs text-zinc-500">{keyStatus.value}</p>
                </div>
                <span className={`font-mono text-xs font-bold uppercase tracking-wider ${keyStatus.status === "Active" ? "text-emerald-400" : "text-zinc-600"}`}>{keyStatus.status}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="wireframe-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={16} className="text-gold" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "taskCompletion", label: "Task Completion Alerts", desc: "Notify when tasks finish." },
              { key: "budgetWarnings", label: "Budget Threshold Warnings", desc: "Alert when LUC spend exceeds 80%." },
              { key: "oracleFailures", label: "ORACLE Gate Failures", desc: "Notify on verification failures." },
              { key: "weeklyDigest", label: "Weekly Usage Digest", desc: "Email summary of platform usage." },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-[#111113] p-4 transition-all hover:border-gold/20">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{pref.label}</p>
                  <p className="text-xs text-zinc-500">{pref.desc}</p>
                </div>
                <button type="button" onClick={() => toggleNotification(pref.key)} title={`Toggle ${pref.label}`} className={`h-6 w-11 cursor-pointer rounded-full p-0.5 transition-colors ${settings.notifications[pref.key] ? "bg-gold" : "bg-[#1F1F23]"}`}>
                  <motion.div animate={{ x: settings.notifications[pref.key] ? 20 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="h-5 w-5 rounded-full bg-[#111113]" />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.section variants={staggerItem} className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 transition-all hover:border-red-500/30">
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-red-400">Danger Zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-100">Delete Workspace</p>
            <p className="text-xs text-zinc-500">Permanently remove this workspace and all associated data. This cannot be undone.</p>
          </div>
          <motion.button type="button" whileHover={{ scale: 1.05, backgroundColor: "rgba(239,68,68,0.1)" }} whileTap={{ scale: 0.95 }} className="rounded-lg border border-red-500/40 px-4 py-1.5 font-mono text-xs text-red-400 transition-colors">
            Delete
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  );
}
