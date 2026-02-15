// frontend/app/workspace/luc/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LucPanel } from "@/components/luc/LucPanel";

export default function WorkspaceLucPage() {
  const [mode, setMode] = useState<"simulate" | "live">("simulate");
  const [activeTab, setActiveTab] = useState<"calculator" | "flip">("calculator");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-wireframe-stroke/20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">LUC</h1>
              <p className="text-sm text-white/50 mt-1">
                Ledger Usage Calculator - Track and manage your resource consumption
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("calculator")}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  activeTab === "calculator"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-wireframe-stroke/30 text-white/50 hover:text-white/70"
                }`}
              >
                Calculator
              </button>
              <button
                onClick={() => setActiveTab("flip")}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  activeTab === "flip"
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "border-wireframe-stroke/30 text-white/50 hover:text-white/70"
                }`}
              >
                Flip Preset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "calculator" ? (
            <LucPanel mode={mode} onModeChange={setMode} />
          ) : (
            <FlipPresetTab />
          )}
        </motion.div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flip Preset Tab (Placeholder)
// ─────────────────────────────────────────────────────────────────────────────

function FlipPresetTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Real Estate Flip Calculator</h2>
        <p className="text-sm text-white/50 mt-1">
          Calculate potential profits using the Flip Secrets methodology
        </p>
      </div>

      <div className="p-6 rounded-xl bg-black/30 border border-wireframe-stroke/30">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Flip Preset Coming Soon</h3>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            The Real Estate Flip preset is being extracted from the Flip Secrets
            spreadsheets. This will provide a full property flip calculator with
            all formulas ported to our headless engine.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gold/5 border border-gold/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-gold/60 animate-pulse" />
            <span className="text-sm text-gold/70">Extraction in progress</span>
          </div>
        </div>
      </div>

      {/* Placeholder for preset fields */}
      <div className="grid grid-cols-2 gap-4 opacity-50">
        {[
          "Purchase Price",
          "Repair Costs",
          "Holding Period",
          "ARV (After Repair Value)",
          "Closing Costs",
          "Financing Costs",
        ].map((field) => (
          <div key={field} className="p-4 rounded-lg bg-black/20 border border-wireframe-stroke/20">
            <label className="block text-xs text-white/30 mb-2">{field}</label>
            <input
              type="text"
              disabled
              placeholder="Coming soon..."
              className="w-full px-3 py-2 bg-black/30 border border-wireframe-stroke/20 rounded text-white/30 text-sm cursor-not-allowed"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
