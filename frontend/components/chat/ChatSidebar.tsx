'use client';

/**
 * ChatSidebar — Tabbed Panel (Agent Viewport + Magazines)
 *
 * Unifies the CollaborationSidebar (Agent Viewport) and MagazinePanel
 * into a single tabbed sidebar that slides in from the right.
 *
 * Replaces the standalone CollaborationSidebar import in ChatInterface.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollaborationFeed } from '@/components/collaboration/CollaborationFeed';
import { MagazinePanel } from '@/components/chat/MagazinePanel';
import type { MagazineSlot } from '@/lib/magazines/types';

type SidebarTab = 'viewport' | 'magazines';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which tab to show initially (default: viewport) */
  initialTab?: SidebarTab;
  /** Active magazine count for badge */
  activeMagazineCount?: number;
  activeMagazineSlots?: MagazineSlot[];
  onActiveMagazineSlotsChange?: (slots: MagazineSlot[]) => void;
}

export function ChatSidebar({
  isOpen,
  onClose,
  initialTab = 'viewport',
  activeMagazineCount = 0,
  activeMagazineSlots = [],
  onActiveMagazineSlotsChange,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>(initialTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[400px] max-w-[90vw] z-50 bg-[#111113]/95 backdrop-blur-xl border-l border-wireframe-stroke shadow-2xl flex flex-col"
          >
            {/* Tab Bar */}
            <div className="flex border-b border-wireframe-stroke">
              <TabButton
                label="Agent Viewport"
                shortLabel="Viewport"
                isActive={activeTab === 'viewport'}
                onClick={() => setActiveTab('viewport')}
              />
              <TabButton
                label="Magazines"
                shortLabel="Magazines"
                isActive={activeTab === 'magazines'}
                onClick={() => setActiveTab('magazines')}
                badge={activeMagazineCount > 0 ? activeMagazineCount : undefined}
              />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'viewport' && (
                <CollaborationFeed
                  maxHeight="100%"
                  compact
                  onClose={onClose}
                />
              )}
              {activeTab === 'magazines' && (
                <MagazinePanel
                  onClose={onClose}
                  compact
                  activeSlots={activeMagazineSlots}
                  onActiveSlotsChange={onActiveMagazineSlotsChange}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Tab Button ───────────────────────────────────────────────

function TabButton({
  label,
  shortLabel,
  isActive,
  onClick,
  badge,
}: {
  label: string;
  shortLabel: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-xs font-medium uppercase tracking-wider transition-all relative ${
        isActive
          ? 'text-gold border-b-2 border-gold bg-gold/5'
          : 'text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent'
      }`}
    >
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      {badge !== undefined && (
        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold/20 text-gold text-[9px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Active Magazine Badge (for chat header) ──────────────────

export function MagazineBadge({
  slots,
  onClick,
}: {
  slots: MagazineSlot[];
  onClick?: () => void;
}) {
  if (slots.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium hover:bg-gold/15 transition-colors"
      title={`${slots.length} magazine${slots.length > 1 ? 's' : ''} loaded`}
    >
      <span>📎</span>
      <span>
        {slots.length === 1
          ? slots[0].magazine?.name || '1 loaded'
          : `${slots.length} magazines`}
      </span>
    </button>
  );
}
