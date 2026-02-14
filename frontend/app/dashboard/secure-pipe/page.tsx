// frontend/app/dashboard/secure-pipe/page.tsx
'use client';

/**
 * Zone C: The A.I.M.S. Secure Data Pipe (Business OS)
 *
 * Centralized module for compliance, finance, and external API links.
 * Three modules: Vault, Token Forge, Virtual Office.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Zone C
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureUpload } from '@/components/secure-pipe/SecureUpload';
import { TokenGenerator } from '@/components/secure-pipe/TokenGenerator';
import { VirtualOffice } from '@/components/secure-pipe/VirtualOffice';
import { ShieldCheck, Key, BarChart3 } from 'lucide-react';

type PipeTab = 'vault' | 'tokens' | 'office';

const TABS: { id: PipeTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'vault', label: 'The Vault', icon: <ShieldCheck className="w-4 h-4" />, description: 'Secure document drop zone' },
  { id: 'tokens', label: 'Token Forge', icon: <Key className="w-4 h-4" />, description: 'API access tokens' },
  { id: 'office', label: 'Virtual Office', icon: <BarChart3 className="w-4 h-4" />, description: 'Financial health dashboard' },
];

export default function SecurePipePage() {
  const [activeTab, setActiveTab] = useState<PipeTab>('vault');

  return (
    <main>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gold font-display">Secure Data Pipe</h1>
        <p className="text-sm text-white/40 mt-1">
          Compliance, finance, and structured reporting — powered by Boomer_Angs
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-gold/10 text-gold border-gold/30 shadow-[0_0_12px_rgba(212,175,55,0.08)]'
                : 'bg-white/[0.02] text-white/40 border-wireframe-stroke hover:text-white/60 hover:border-white/15'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'vault' && <SecureUpload />}
          {activeTab === 'tokens' && <TokenGenerator />}
          {activeTab === 'office' && <VirtualOffice />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
