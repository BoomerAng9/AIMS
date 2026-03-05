'use client';

/**
 * MagazinePanel — Context Magazine Manager for ACHEEVY Chat
 *
 * The "loaded magazine" UI. Users can:
 * - Browse available magazines (context packs)
 * - Load/unload magazines into active slots (max 3)
 * - Create new magazines with data sources
 * - See which magazines are currently active
 *
 * Renders inside the chat sidebar alongside the Agent Viewport (tabbed).
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  Link,
  Globe,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Magazine, DataSource, MagazineSlot } from '@/lib/magazines/types';
import * as magazineApi from '@/lib/magazines/client';

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function DataSourceIcon({ type }: { type: string }) {
  switch (type) {
    case 'text': return <FileText className="w-3 h-3" />;
    case 'url': return <Link className="w-3 h-3" />;
    case 'file': return <FileText className="w-3 h-3" />;
    case 'api': return <Globe className="w-3 h-3" />;
    default: return <FileText className="w-3 h-3" />;
  }
}

function SlotIndicator({ active, count, max }: { active: boolean; count: number; max: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < count ? 'bg-gold' : 'bg-white/10'
          }`}
        />
      ))}
      <span className="text-[10px] text-zinc-500 ml-1 font-mono">
        {count}/{max}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Magazine Card
// ─────────────────────────────────────────────────────────────

function MagazineCard({
  magazine,
  isLoaded,
  onLoad,
  onUnload,
  onDelete,
  onExpand,
  isExpanded,
}: {
  magazine: Magazine;
  isLoaded: boolean;
  onLoad: () => void;
  onUnload: () => void;
  onDelete: () => void;
  onExpand: () => void;
  isExpanded: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border transition-all ${
        isLoaded
          ? 'border-gold/30 bg-gold/5'
          : 'border-wireframe-stroke bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={onExpand}>
        <span className="text-lg">{magazine.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200 truncate">{magazine.name}</span>
            {isLoaded && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono text-gold uppercase tracking-wider">
                <Check className="w-2.5 h-2.5" /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate">{magazine.description}</p>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-wireframe-stroke pt-2">
              {/* Tags */}
              {magazine.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {magazine.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Data Sources */}
              {magazine.dataSources.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Data Sources</span>
                  {magazine.dataSources.map(ds => (
                    <div key={ds.id} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <DataSourceIcon type={ds.type} />
                      <span className="truncate">{ds.name}</span>
                      <span className="text-zinc-600 text-[10px]">
                        {ds.metadata.wordCount ? `${ds.metadata.wordCount} words` : ds.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {magazine.dataSources.length === 0 && (
                <p className="text-xs text-zinc-600 italic">No data sources attached</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {isLoaded ? (
                  <button
                    onClick={onUnload}
                    className="flex-1 text-xs px-3 py-1.5 rounded-md border border-wireframe-stroke text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                  >
                    Unload
                  </button>
                ) : (
                  <button
                    onClick={onLoad}
                    className="flex-1 text-xs px-3 py-1.5 rounded-md bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors font-medium"
                  >
                    Load Magazine
                  </button>
                )}
                {!magazine.isDefault && (
                  <button
                    onClick={onDelete}
                    className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete magazine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Create Magazine Form
// ─────────────────────────────────────────────────────────────

function CreateMagazineForm({
  onCreated,
  onCancel,
}: {
  onCreated: (mag: Magazine) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📎');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const mag = await magazineApi.createMagazine({
        name: name.trim(),
        description: description.trim(),
        icon,
        systemPrompt: systemPrompt.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onCreated(mag);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create magazine');
    } finally {
      setSaving(false);
    }
  };

  const ICONS = ['📎', '🏗️', '📈', '⚙️', '🎬', '📊', '🎯', '💡', '🔬', '📚', '🛡️', '🎨'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-gold/20 bg-gold/5 p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gold">New Magazine</span>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Icon Picker */}
      <div className="flex flex-wrap gap-1.5">
        {ICONS.map(ic => (
          <button
            key={ic}
            onClick={() => setIcon(ic)}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
              icon === ic ? 'bg-gold/20 border border-gold/30' : 'bg-white/5 border border-transparent hover:border-wireframe-stroke'
            }`}
          >
            {ic}
          </button>
        ))}
      </div>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Magazine name..."
        className="w-full px-3 py-2 text-sm rounded-md bg-white/5 border border-wireframe-stroke text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-gold/30"
      />

      {/* Description */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this magazine for?"
        className="w-full px-3 py-2 text-sm rounded-md bg-white/5 border border-wireframe-stroke text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-gold/30"
      />

      {/* System Prompt */}
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="Custom system prompt (optional)..."
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-md bg-white/5 border border-wireframe-stroke text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-gold/30 resize-none font-mono text-xs"
      />

      {/* Tags */}
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma-separated)..."
        className="w-full px-3 py-2 text-sm rounded-md bg-white/5 border border-wireframe-stroke text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-gold/30"
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !name.trim()}
        className="w-full py-2 text-sm font-medium rounded-md bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {saving ? 'Creating...' : 'Create Magazine'}
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────

interface MagazinePanelProps {
  onClose?: () => void;
  compact?: boolean;
}

export function MagazinePanel({ onClose, compact = false }: MagazinePanelProps) {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [activeSlots, setActiveSlots] = useState<MagazineSlot[]>([]);
  const [maxSlots, setMaxSlots] = useState(3);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fetch magazines and active state
  const refresh = useCallback(async () => {
    try {
      const [magRes, activeRes] = await Promise.all([
        magazineApi.listMagazines(),
        magazineApi.getActiveMagazines(),
      ]);
      setMagazines(magRes.magazines);
      setActiveSlots(activeRes.slots);
      setMaxSlots(activeRes.maxSlots);
      setError('');
    } catch {
      // Gateway may not be running — show empty state
      setMagazines([]);
      setActiveSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleLoad = async (magazineId: string) => {
    try {
      const res = await magazineApi.loadMagazine(magazineId);
      setActiveSlots(res.slots);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  const handleUnload = async (magazineId: string) => {
    try {
      const res = await magazineApi.unloadMagazine(magazineId);
      setActiveSlots(res.slots);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unload');
    }
  };

  const handleDelete = async (magazineId: string) => {
    try {
      await magazineApi.deleteMagazine(magazineId);
      setMagazines(prev => prev.filter(m => m.id !== magazineId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const loadedIds = new Set(activeSlots.map(s => s.magazineId));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wireframe-stroke">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gold/10 flex items-center justify-center">
            <span className="text-gold text-xs font-bold">MG</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Magazines</h3>
            <SlotIndicator active={activeSlots.length > 0} count={activeSlots.length} max={maxSlots} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-gold hover:bg-gold/10 transition-colors"
            title="Create magazine"
          >
            <Plus className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gold/60" />
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <CreateMagazineForm
              onCreated={(mag) => {
                setMagazines(prev => [mag, ...prev]);
                setShowCreate(false);
              }}
              onCancel={() => setShowCreate(false)}
            />
          )}
        </AnimatePresence>

        {/* Magazine List */}
        {!loading && magazines.length === 0 && !showCreate && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="text-zinc-600 text-lg">📎</span>
            </div>
            <p className="text-sm text-zinc-500">No magazines yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create a context pack to customize ACHEEVY&apos;s behavior</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors"
            >
              Create First Magazine
            </button>
          </div>
        )}

        <AnimatePresence>
          {magazines.map(mag => (
            <MagazineCard
              key={mag.id}
              magazine={mag}
              isLoaded={loadedIds.has(mag.id)}
              onLoad={() => handleLoad(mag.id)}
              onUnload={() => handleUnload(mag.id)}
              onDelete={() => handleDelete(mag.id)}
              onExpand={() => setExpandedId(expandedId === mag.id ? null : mag.id)}
              isExpanded={expandedId === mag.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-wireframe-stroke text-[10px] text-zinc-600 font-mono flex justify-between">
        <span>{magazines.length} magazines</span>
        <span>{activeSlots.length} loaded</span>
      </div>
    </div>
  );
}
