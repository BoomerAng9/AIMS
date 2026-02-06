'use client';

/**
 * Quick Switcher
 *
 * Command palette for instant navigation between pages and modes.
 * Activated by clicking the icon in the bottom-left corner or pressing Cmd/Ctrl+K.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SwitcherItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'mode';
  keywords?: string[];
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CircuitIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
    <path d="M10 7h4M10 17h4M7 10v4M17 10v4" />
  </svg>
);

const PlugIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22v-5M9 7V2M15 7V2M6 13V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FlaskIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 3h6M10 9V3M14 9V3M5 21h14M8 9h8l3 12H5L8 9z" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const DeployIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CommandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

const PlanIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Navigation Items
// ─────────────────────────────────────────────────────────────

const SWITCHER_ITEMS: SwitcherItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Dashboard home',
    href: '/dashboard',
    icon: <HomeIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['home', 'dashboard', 'main'],
  },
  {
    id: 'acheevy',
    label: 'ACHEEVY',
    description: 'AI assistant chat',
    href: '/dashboard/acheevy',
    icon: <ChatIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['chat', 'ai', 'assistant', 'talk'],
  },
  {
    id: 'plan',
    label: 'Plan',
    description: 'Project planning',
    href: '/dashboard/plan',
    icon: <PlanIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['planning', 'project', 'roadmap'],
  },
  {
    id: 'ai-plugs',
    label: 'aiPlugs',
    description: 'AI integrations',
    href: '/dashboard/ai-plugs',
    icon: <PlugIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['plugins', 'integrations', 'tools'],
  },
  {
    id: 'boomerangs',
    label: 'BoomerAngs',
    description: 'Agent workforce',
    href: '/dashboard/boomerangs',
    icon: <UsersIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['agents', 'workers', 'bots'],
  },
  {
    id: 'lab',
    label: 'Lab',
    description: 'Experimental features',
    href: '/dashboard/lab',
    icon: <FlaskIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['experiment', 'test', 'beta'],
  },
  {
    id: 'luc',
    label: 'LUC Usage',
    description: 'Usage calculator',
    href: '/dashboard/luc',
    icon: <ChartIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['usage', 'cost', 'quota', 'calculator'],
  },
  {
    id: 'circuit-box',
    label: 'Circuit Box',
    description: 'System control',
    href: '/dashboard/circuit-box',
    icon: <CircuitIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['system', 'control', 'monitoring'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Account & preferences',
    href: '/dashboard/settings',
    icon: <SettingsIcon className="w-4 h-4" />,
    category: 'navigation',
    keywords: ['preferences', 'account', 'config'],
  },
  {
    id: 'deploy',
    label: 'Quick Deploy',
    description: 'Deploy to staging',
    icon: <DeployIcon className="w-4 h-4" />,
    category: 'action',
    keywords: ['deploy', 'release', 'publish'],
  },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function QuickSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search) return SWITCHER_ITEMS;
    const lower = search.toLowerCase();
    return SWITCHER_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.keywords?.some((k) => k.includes(lower))
    );
  }, [search]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
    }
  }, [isOpen]);

  // Handle navigation
  const handleSelect = (item: SwitcherItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  return (
    <>
      {/* Trigger Button (Bottom Left) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 p-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-gray-400 hover:text-amber-300 hover:border-amber-500/30 transition-all shadow-lg group"
        title="Quick Switcher (⌘K)"
      >
        <CommandIcon className="w-5 h-5" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          ⌘K
        </span>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Switcher Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <SearchIcon className="w-5 h-5 text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search pages, actions..."
                  className="flex-1 bg-transparent text-amber-50 placeholder:text-gray-500 outline-none text-sm"
                />
                <kbd className="px-2 py-1 text-[10px] text-gray-500 bg-white/5 rounded">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filteredItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No results found
                  </div>
                ) : (
                  <>
                    {/* Navigation Items */}
                    <div className="px-2">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-600">
                        Navigation
                      </p>
                      {filteredItems
                        .filter((i) => i.category === 'navigation')
                        .map((item, index) => {
                          const globalIndex = filteredItems.indexOf(item);
                          const isActive = pathname === item.href;
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-100'
                                  : 'text-gray-300 hover:bg-white/5'
                              } ${isActive ? 'border-l-2 border-amber-500' : ''}`}
                            >
                              <span className={isSelected ? 'text-amber-400' : 'text-gray-500'}>
                                {item.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.label}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                )}
                              </div>
                              {isActive && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                                  Current
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>

                    {/* Actions */}
                    {filteredItems.some((i) => i.category === 'action') && (
                      <div className="px-2 mt-2 pt-2 border-t border-white/5">
                        <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-600">
                          Quick Actions
                        </p>
                        {filteredItems
                          .filter((i) => i.category === 'action')
                          .map((item) => {
                            const globalIndex = filteredItems.indexOf(item);
                            const isSelected = globalIndex === selectedIndex;

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                  isSelected
                                    ? 'bg-amber-500/20 text-amber-100'
                                    : 'text-gray-300 hover:bg-white/5'
                                }`}
                              >
                                <span className={isSelected ? 'text-amber-400' : 'text-gray-500'}>
                                  {item.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.label}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] text-gray-600">
                <div className="flex items-center gap-4">
                  <span><kbd className="px-1 py-0.5 bg-white/5 rounded">↑↓</kbd> Navigate</span>
                  <span><kbd className="px-1 py-0.5 bg-white/5 rounded">↵</kbd> Select</span>
                </div>
                <span>A.I.M.S.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default QuickSwitcher;
