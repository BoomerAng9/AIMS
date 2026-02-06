'use client';

/**
 * A.I.M.S. Navigation Component
 *
 * Main navigation bar with circuit board aesthetic, glowing borders,
 * and A.I.M.S. branding. Adapted from NurdsCode vision.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CircuitBoardPattern, AIMS_CIRCUIT_COLORS } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

interface AIMSNavProps {
  items?: NavItem[];
  showSearch?: boolean;
  showNotifications?: boolean;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Default Navigation Items
// ─────────────────────────────────────────────────────────────

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'ACHEEVY', href: '/dashboard/acheevy' },
  { label: 'House of Ang', href: '/dashboard/house-of-ang' },
  { label: 'Deploy', href: '/dashboard/deploy' },
  { label: 'Sports Tracker', href: '/dashboard/sports-tracker' },
];

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const SearchIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BellIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ChevronDownIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const XIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// A.I.M.S. Logo
// ─────────────────────────────────────────────────────────────

function AIMSLogo({ className = '' }: { className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-3 ${className}`}>
      {/* Logo mark */}
      <div className="relative">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`,
            boxShadow: `0 0 20px ${AIMS_CIRCUIT_COLORS.glow}`,
          }}
        >
          <span className="text-xl font-bold text-black">A</span>
        </div>
        {/* Pulsing ring */}
        <div
          className="absolute inset-0 rounded-lg animate-ping"
          style={{
            background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}40, ${AIMS_CIRCUIT_COLORS.accent}40)`,
            animationDuration: '3s',
          }}
        />
      </div>

      {/* Text */}
      <div className="hidden sm:block">
        <div
          className="text-lg font-bold tracking-wider"
          style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
        >
          A.I.M.S.
        </div>
        <div
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: AIMS_CIRCUIT_COLORS.primary }}
        >
          AI Managed Solutions
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Navigation Component
// ─────────────────────────────────────────────────────────────

export function AIMSNav({
  items = DEFAULT_NAV_ITEMS,
  showSearch = true,
  showNotifications = true,
  user,
}: AIMSNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="relative">
      {/* Glowing top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${AIMS_CIRCUIT_COLORS.accent}, transparent)`,
          boxShadow: `0 0 10px ${AIMS_CIRCUIT_COLORS.glow}`,
        }}
      />

      {/* Main nav container */}
      <div
        className="relative border-b"
        style={{
          backgroundColor: AIMS_CIRCUIT_COLORS.background + 'f0',
          borderColor: AIMS_CIRCUIT_COLORS.dimLine,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Circuit pattern overlay */}
        <CircuitBoardPattern
          density="dense"
          animated={false}
          glowIntensity={0.1}
          className="opacity-30"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <AIMSLogo />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              {showSearch && (
                <div className="relative">
                  <AnimatePresence>
                    {searchOpen && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 240, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="absolute right-0 top-1/2 -translate-y-1/2"
                      >
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search..."
                          autoFocus
                          className="w-full h-9 pl-4 pr-10 rounded-lg text-sm outline-none"
                          style={{
                            backgroundColor: AIMS_CIRCUIT_COLORS.background,
                            border: `1px solid ${AIMS_CIRCUIT_COLORS.primary}40`,
                            color: AIMS_CIRCUIT_COLORS.secondary,
                          }}
                          onBlur={() => {
                            if (!searchQuery) setSearchOpen(false);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
                  >
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Notifications */}
              {showNotifications && (
                <button
                  className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
                >
                  <BellIcon className="w-5 h-5" />
                  {/* Notification badge */}
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: AIMS_CIRCUIT_COLORS.accent,
                      boxShadow: `0 0 6px ${AIMS_CIRCUIT_COLORS.glow}`,
                    }}
                  />
                </button>
              )}

              {/* User menu */}
              {user && (
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/10">
                  <div className="text-right">
                    <div
                      className="text-sm font-medium"
                      style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
                    >
                      {user.name}
                    </div>
                    {user.role && (
                      <div
                        className="text-xs"
                        style={{ color: AIMS_CIRCUIT_COLORS.primary }}
                      >
                        {user.role}
                      </div>
                    )}
                  </div>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}40, ${AIMS_CIRCUIT_COLORS.accent}40)`,
                      border: `1px solid ${AIMS_CIRCUIT_COLORS.primary}60`,
                      color: AIMS_CIRCUIT_COLORS.secondary,
                    }}
                  >
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
              >
                {mobileMenuOpen ? (
                  <XIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{
              backgroundColor: AIMS_CIRCUIT_COLORS.background,
              borderBottom: `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}`,
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor:
                      pathname === item.href
                        ? AIMS_CIRCUIT_COLORS.primary + '20'
                        : 'transparent',
                    color:
                      pathname === item.href
                        ? AIMS_CIRCUIT_COLORS.accent
                        : AIMS_CIRCUIT_COLORS.secondary,
                  }}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span
                        className="ml-auto px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: AIMS_CIRCUIT_COLORS.accent + '20',
                          color: AIMS_CIRCUIT_COLORS.accent,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glowing bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${AIMS_CIRCUIT_COLORS.primary}60, transparent)`,
        }}
      />
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav Link Component
// ─────────────────────────────────────────────────────────────

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="relative" onMouseLeave={() => setDropdownOpen(false)}>
      <Link
        href={item.href}
        onMouseEnter={() => hasChildren && setDropdownOpen(true)}
        className="relative flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          color: isActive ? AIMS_CIRCUIT_COLORS.accent : AIMS_CIRCUIT_COLORS.secondary,
          backgroundColor: isActive ? AIMS_CIRCUIT_COLORS.primary + '15' : 'transparent',
        }}
      >
        {item.icon}
        {item.label}
        {hasChildren && <ChevronDownIcon className="w-4 h-4" />}
        {item.badge && (
          <span
            className="ml-1 px-1.5 py-0.5 rounded text-xs"
            style={{
              backgroundColor: AIMS_CIRCUIT_COLORS.accent + '20',
              color: AIMS_CIRCUIT_COLORS.accent,
            }}
          >
            {item.badge}
          </span>
        )}

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
            style={{
              backgroundColor: AIMS_CIRCUIT_COLORS.accent,
              boxShadow: `0 0 8px ${AIMS_CIRCUIT_COLORS.glow}`,
            }}
          />
        )}
      </Link>

      {/* Dropdown */}
      <AnimatePresence>
        {hasChildren && dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 py-2 rounded-lg min-w-[200px]"
            style={{
              backgroundColor: AIMS_CIRCUIT_COLORS.background,
              border: `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}`,
              boxShadow: `0 4px 20px ${AIMS_CIRCUIT_COLORS.background}`,
            }}
          >
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="block px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: AIMS_CIRCUIT_COLORS.secondary }}
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar Navigation (Alternative)
// ─────────────────────────────────────────────────────────────

interface SidebarNavProps {
  items?: NavItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarNav({
  items = DEFAULT_NAV_ITEMS,
  collapsed = false,
  onToggleCollapse,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-full transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        backgroundColor: AIMS_CIRCUIT_COLORS.background,
        borderRight: `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}`,
      }}
    >
      {/* Background pattern */}
      <CircuitBoardPattern
        density="sparse"
        animated={false}
        glowIntensity={0.1}
        className="opacity-20"
      />

      <div className="relative h-full flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: AIMS_CIRCUIT_COLORS.dimLine }}>
          <AIMSLogo className={collapsed ? 'justify-center' : ''} />
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  collapsed ? 'justify-center' : ''
                }`}
                style={{
                  backgroundColor: isActive ? AIMS_CIRCUIT_COLORS.primary + '20' : 'transparent',
                  color: isActive ? AIMS_CIRCUIT_COLORS.accent : AIMS_CIRCUIT_COLORS.secondary,
                  borderLeft: isActive
                    ? `3px solid ${AIMS_CIRCUIT_COLORS.accent}`
                    : '3px solid transparent',
                }}
                title={collapsed ? item.label : undefined}
              >
                {item.icon || (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? AIMS_CIRCUIT_COLORS.accent
                        : AIMS_CIRCUIT_COLORS.dimLine,
                    }}
                  />
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: AIMS_CIRCUIT_COLORS.accent + '20',
                          color: AIMS_CIRCUIT_COLORS.accent,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-4 border-t transition-colors hover:bg-white/5"
            style={{
              borderColor: AIMS_CIRCUIT_COLORS.dimLine,
              color: AIMS_CIRCUIT_COLORS.secondary,
            }}
          >
            <ChevronDownIcon
              className={`w-5 h-5 mx-auto transition-transform ${
                collapsed ? 'rotate-[-90deg]' : 'rotate-90'
              }`}
            />
          </button>
        )}
      </div>

      {/* Glowing right border */}
      <div
        className="absolute top-0 right-0 w-px h-full"
        style={{
          background: `linear-gradient(180deg, transparent, ${AIMS_CIRCUIT_COLORS.primary}40, transparent)`,
        }}
      />
    </aside>
  );
}

export default AIMSNav;
