// frontend/app/dashboard/settings/page.tsx
"use client";

import React, { useState } from "react";
import { Save, Shield, Bell, Globe, Key, Palette } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
            SETTINGS
          </h1>
          <p className="text-sm text-amber-100/70">
            Workspace and team configuration.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-xs font-semibold text-black shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <Save size={14} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workspace Identity */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-amber-300" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              Workspace Identity
            </h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">Workspace Name</label>
              <input
                type="text"
                defaultValue="My ACHEEVY Workspace"
                className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">Industry</label>
              <select className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300">
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
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">Timezone</label>
              <select className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300">
                <option>America/New_York (EST)</option>
                <option>America/Chicago (CST)</option>
                <option>America/Denver (MST)</option>
                <option>America/Los_Angeles (PST)</option>
                <option>Europe/London (GMT)</option>
                <option>Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-amber-300" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              Security
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-4">
              <div>
                <p className="text-sm font-medium text-amber-50">Two-Factor Authentication</p>
                <p className="text-xs text-amber-100/50">Add an extra layer of security.</p>
              </div>
              <button className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-300/20 transition-colors">
                Enable
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-4">
              <div>
                <p className="text-sm font-medium text-amber-50">Session Timeout</p>
                <p className="text-xs text-amber-100/50">Auto-lock after inactivity.</p>
              </div>
              <select className="rounded-xl border border-white/5 bg-black/80 px-3 py-1.5 text-xs text-amber-50 outline-none focus:border-amber-300">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </section>

        {/* API Keys */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-amber-300" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              API Keys
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "LLM Provider", value: "sk-****...7f3a", status: "Active" },
              { label: "ByteRover Token", value: "br-****...2e1d", status: "Active" },
              { label: "Stripe (BAMARAM)", value: "Not configured", status: "Inactive" },
            ].map((key) => (
              <div key={key.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-4">
                <div>
                  <p className="text-sm font-medium text-amber-50">{key.label}</p>
                  <p className="font-mono text-xs text-amber-100/40">{key.value}</p>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  key.status === "Active" ? "text-emerald-400" : "text-amber-100/30"
                }`}>
                  {key.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-amber-300" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Task Completion Alerts", desc: "Notify when Boomer_Angs finish tasks.", enabled: true },
              { label: "Budget Threshold Warnings", desc: "Alert when LUC spend exceeds 80%.", enabled: true },
              { label: "ORACLE Gate Failures", desc: "Notify on verification failures.", enabled: false },
              { label: "Weekly Usage Digest", desc: "Email summary of platform usage.", enabled: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-4">
                <div>
                  <p className="text-sm font-medium text-amber-50">{pref.label}</p>
                  <p className="text-xs text-amber-100/50">{pref.desc}</p>
                </div>
                <div className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                  pref.enabled ? "bg-amber-300" : "bg-white/10"
                }`}>
                  <div className={`h-5 w-5 rounded-full bg-black transition-transform ${
                    pref.enabled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <section className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400 font-display mb-4">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-50">Delete Workspace</p>
            <p className="text-xs text-amber-100/50">
              Permanently remove this workspace and all associated data. This cannot be undone.
            </p>
          </div>
          <button className="rounded-full border border-red-500/40 px-4 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
