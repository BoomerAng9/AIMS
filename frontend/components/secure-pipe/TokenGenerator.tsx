// frontend/components/secure-pipe/TokenGenerator.tsx
'use client';

/**
 * TokenGenerator — Module 2: "The API Token Forge"
 *
 * Secure one-way API tokens for external communication.
 * Read-only tokens for accountants, investors, government portals.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Module 2
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Key, Copy, Eye, EyeOff, Trash2, Plus, Shield,
  Clock, User, CheckCircle, AlertTriangle,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  active: boolean;
  accessLog: AccessEntry[];
}

interface AccessEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  ip: string;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_TOKENS: ApiToken[] = [
  {
    id: 'tok-1',
    name: 'Accountant — Q1 Reports',
    prefix: 'aims_ro_abc1',
    permissions: ['read:reports', 'read:invoices'],
    createdAt: '2026-01-15',
    lastUsed: '2h ago',
    expiresAt: '2026-04-15',
    active: true,
    accessLog: [
      { id: 'al-1', actor: 'Accountant', action: 'Read Q1 Revenue Report', timestamp: '2h ago', ip: '192.168.1.42' },
      { id: 'al-2', actor: 'Accountant', action: 'Read Invoice Batch #47', timestamp: '1d ago', ip: '192.168.1.42' },
      { id: 'al-3', actor: 'Accountant', action: 'Read Expense Summary', timestamp: '3d ago', ip: '192.168.1.42' },
    ],
  },
  {
    id: 'tok-2',
    name: 'Investor Portal — Read Only',
    prefix: 'aims_ro_xyz9',
    permissions: ['read:metrics', 'read:financials'],
    createdAt: '2026-02-01',
    lastUsed: '5d ago',
    expiresAt: '2026-08-01',
    active: true,
    accessLog: [
      { id: 'al-4', actor: 'Investor', action: 'Read Monthly Metrics', timestamp: '5d ago', ip: '10.0.0.55' },
    ],
  },
  {
    id: 'tok-3',
    name: 'Tax Filing API',
    prefix: 'aims_ro_tax3',
    permissions: ['read:tax-reports'],
    createdAt: '2025-12-01',
    lastUsed: 'Never',
    expiresAt: '2026-03-01',
    active: false,
    accessLog: [],
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function TokenGenerator() {
  const [tokens, setTokens] = useState(MOCK_TOKENS);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const toggleToken = (id: string) => {
    setTokens((prev) => prev.map((t) =>
      t.id === id ? { ...t, active: !t.active } : t,
    ));
  };

  const revokeToken = (id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cb-cyan/10 border border-cb-cyan/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-cb-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-cb-cyan">API Token Forge</h3>
            <p className="text-xs text-white/40">Secure read-only tokens for external access</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cb-cyan/10 text-cb-cyan text-xs font-bold border border-cb-cyan/30 hover:bg-cb-cyan/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Forge Token
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard variant="cyan">
              <h4 className="text-sm font-semibold text-white mb-3">Forge New Token</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Token Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Accountant — Q2 Reports"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-wireframe-stroke text-white text-xs font-mono placeholder:text-white/20 outline-none focus:border-cb-cyan/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Expires</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-wireframe-stroke text-white text-xs font-mono outline-none focus:border-cb-cyan/50 transition-colors"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {['read:reports', 'read:invoices', 'read:metrics', 'read:financials', 'read:tax-reports'].map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      className="px-2 py-1 rounded-lg text-[10px] font-mono bg-black/30 text-white/40 border border-wireframe-stroke hover:border-cb-cyan/30 hover:text-cb-cyan transition-colors"
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-cb-cyan text-black text-xs font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
                >
                  Generate Token
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg text-white/40 text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token List */}
      <div className="space-y-3">
        {tokens.map((token) => (
          <GlassCard
            key={token.id}
            className={`!p-0 overflow-hidden ${token.active ? 'border-wireframe-stroke' : 'border-cb-red/20 opacity-70'}`}
          >
            {/* Token header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  token.active ? 'bg-cb-green/10 text-cb-green' : 'bg-cb-red/10 text-cb-red'
                }`}>
                  {token.active ? <Shield className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{token.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
                    <span>{token.prefix}••••••••</span>
                    <button type="button" className="text-white/20 hover:text-white/50 transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Active/Revoke toggle */}
                <button
                  type="button"
                  onClick={() => toggleToken(token.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    token.active ? 'bg-cb-green/30' : 'bg-cb-red/30'
                  }`}
                >
                  <motion.div
                    animate={{ x: token.active ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 w-4 h-4 rounded-full ${
                      token.active ? 'bg-cb-green' : 'bg-cb-red'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedToken(expandedToken === token.id ? null : token.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {expandedToken === token.id ? <EyeOff className="w-3.5 h-3.5 text-white/30" /> : <Eye className="w-3.5 h-3.5 text-white/30" />}
                </button>
                <button
                  type="button"
                  onClick={() => revokeToken(token.id)}
                  className="p-1.5 rounded-lg hover:bg-cb-red/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-cb-red/50" />
                </button>
              </div>
            </div>

            {/* Token meta */}
            <div className="flex items-center gap-4 px-4 pb-3 text-[10px] text-white/25 font-mono">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created: {token.createdAt}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expires: {token.expiresAt}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Last: {token.lastUsed}</span>
            </div>

            {/* Permissions */}
            <div className="flex items-center gap-1.5 px-4 pb-3">
              {token.permissions.map((perm) => (
                <span key={perm} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cb-cyan/10 text-cb-cyan/70 border border-cb-cyan/20">
                  {perm}
                </span>
              ))}
            </div>

            {/* Expanded audit trail */}
            <AnimatePresence>
              {expandedToken === token.id && token.accessLog.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-wireframe-stroke overflow-hidden"
                >
                  <div className="p-4 bg-black/20">
                    <h5 className="text-[10px] uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" /> Audit Trail
                    </h5>
                    <div className="space-y-1.5">
                      {token.accessLog.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-[11px] text-white/40">
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 font-medium">{entry.actor}</span>
                            <span className="text-white/20">&mdash;</span>
                            <span>{entry.action}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/20 font-mono">
                            <span>{entry.ip}</span>
                            <span>{entry.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default TokenGenerator;
