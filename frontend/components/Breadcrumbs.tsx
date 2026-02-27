/**
 * Breadcrumbs — Auto-generates breadcrumb trail from the current pathname.
 *
 * Used in the DashboardShell top bar to provide navigation context
 * across deep dashboard pages.
 *
 * Features:
 *   - Auto-maps route segments to human-readable labels
 *   - Clickable breadcrumb links (except current page)
 *   - Compact mode for mobile
 *   - Respects PUBLIC/PRIVATE mode via terminology
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

// ── Route segment → label map ──

const SEGMENT_LABELS: Record<string, string> = {
  // Top-level zones
  dashboard: 'Dashboard',
  sandbox: 'Sandbox',
  workshop: 'Workshop',
  perform: 'Per|Form',
  arena: 'Arena',
  halalhub: 'HalalHub',
  workspace: 'Workspace',
  onboarding: 'Onboarding',

  // Dashboard core
  chat: 'Chat',
  acheevy: 'ACHEEVY',
  'deploy-dock': 'Deploy Dock',
  'plug-catalog': 'Plug Catalog',
  plugs: 'My Plugs',
  automations: 'Automations',
  'make-it-mine': 'Make It Mine',
  'ntntn-studio': 'Creative Studio',
  'your-space': 'Your Space',
  plan: 'Plan',
  build: 'Build',
  map: 'Platform Map',

  // Make It Mine sub-routes
  'web-app': 'Web App',
  'mobile-app': 'Mobile App',
  automation: 'Automation',
  diy: 'DIY',

  // Circuit Box
  'circuit-box': 'Circuit Box',
  operations: 'Operations',
  settings: 'Settings',
  security: 'Security',
  environments: 'Environments',
  gates: 'Gates',
  admin: 'Admin',

  // Tools
  playground: 'Playground',
  'model-garden': 'Model Garden',
  'custom-hawks': 'Custom Hawks',
  research: 'Research',
  lab: 'Lab',
  'editors-desk': "Editor's Desk",

  // Research sub-pages
  'activity-feed': 'Activity Feed',
  'codebase-sync': 'Codebase Sync',
  'connected-accounts': 'Connected Accounts',
  'google-ecosystem': 'Google Ecosystem',
  'notebook-lm': 'Notebook LM',
  protocols: 'Protocols',
  'revenue-platform': 'Revenue Platform',

  // Verticals
  luc: 'LUC',
  calculator: 'Calculator',
  'garage-to-global': 'Garage to Global',
  'buy-in-bulk': 'Buy in Bulk',
  'boost-bridge': 'Boost Bridge',
  blockwise: 'BlockWise AI',
  nil: 'N.I.L.',
  'sports-tracker': 'Sports Tracker',
  livesim: 'LiveSim',
  boomerangs: 'Boomer_Angs',
  'house-of-ang': 'House of Ang',
  'project-management': 'Projects',
  'needs-analysis': 'Needs Analysis',
  'war-room': 'War Room',
  veritas: 'Veritas',
  workstreams: 'Workstreams',
  showroom: 'Showroom',
  'the-hangar': 'The Hangar',

  // Per|Form
  'film-room': 'Film Room',
  'coaching-carousel': 'Coaching',
  'nil-tracker': 'NIL Tracker',
  pricing: 'Pricing',
  'revenue-budget': 'Revenue Budget',
  'transfer-portal': 'Transfer Portal',
  'big-board': 'Big Board',
  draft: 'Draft',
  mock: 'Mock Draft',
  simulator: 'Simulator',
  'state-boards': 'State Boards',
  analysts: 'Analysts',
  content: 'Content',
  directory: 'Directory',
  redraft: 'Redraft',
  prospects: 'Prospects',
  matchmaker: 'Matchmaker',
  'ncaa-database': 'NCAA Database',

  // Workshop
  'life-scenes': 'Life Scenes',
  'moment-studio': 'Moment Studio',
  'money-moves': 'Money Moves',
  'creator-circles': 'Creator Circles',

  // Arena
  contests: 'Contests',
  'how-it-works': 'How It Works',
  leaderboard: 'Leaderboard',
  'mock-draft': 'Mock Draft',
  wallet: 'Wallet',

  // HalalHub
  shop: 'Shop',
  meetups: 'Meetups',
  vendor: 'Vendor Signup',
  customer: 'Customer Signup',

  // Other
  discover: 'Discover',
  gallery: 'Gallery',
  integrations: 'Integrations',
  merch: 'Merch',
  'mission-control': 'Mission Control',
  'the-book-of-vibe': 'Book of Vibe',
  hangar: 'The Hangar',
  verticals: 'Verticals',
};

// Dynamic segment patterns (slugs, IDs)
function isDynamicSegment(segment: string): boolean {
  // UUIDs, numeric IDs, or common slug patterns
  return (
    /^[0-9a-f]{8}-/.test(segment) ||    // UUID prefix
    /^\d+$/.test(segment) ||              // Numeric ID
    /^[a-z0-9]+-[a-z0-9-]+$/.test(segment) && !SEGMENT_LABELS[segment] // Slug not in map
  );
}

function labelForSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (isDynamicSegment(segment)) return decodeURIComponent(segment);
  // Fallback: capitalize and replace hyphens
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Breadcrumb item type ──

interface Crumb {
  label: string;
  href: string;
  isLast: boolean;
}

// ── Component ──

interface BreadcrumbsProps {
  /** Override the auto-generated page title (last crumb) */
  pageTitle?: string;
  /** Show home icon for root crumb (default: true) */
  showHomeIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function Breadcrumbs({ pageTitle, showHomeIcon = true, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  const crumbs = useMemo<Crumb[]>(() => {
    const segments = (pathname ?? '').split('/').filter(Boolean);
    if (segments.length === 0) return [];

    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const isLast = index === segments.length - 1;
      const label = isLast && pageTitle ? pageTitle : labelForSegment(segment);
      return { label, href, isLast };
    });
  }, [pathname, pageTitle]);

  if (crumbs.length <= 1) return null; // Don't show for root pages

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-xs text-zinc-500 ${className}`}
    >
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
          )}
          {crumb.isLast ? (
            <span className="text-zinc-300 font-medium truncate max-w-[200px]">
              {index === 0 && showHomeIcon ? (
                <span className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  <span className="hidden sm:inline">{crumb.label}</span>
                </span>
              ) : (
                crumb.label
              )}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-amber-500 transition-colors truncate max-w-[150px]"
            >
              {index === 0 && showHomeIcon ? (
                <span className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  <span className="hidden sm:inline">{crumb.label}</span>
                </span>
              ) : (
                crumb.label
              )}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
