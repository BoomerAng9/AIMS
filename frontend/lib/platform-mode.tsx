'use client';

/**
 * Platform Mode Context — A.I.M.S. Domain-Based Access
 *
 * Mode is determined by DOMAIN + AUTH ROLE. No toggle. No localStorage. Not hackable.
 *
 * - aimanagedsolutions.cloud → PRIVATE (OWNER/ADMIN only — enforced)
 * - plugmein.cloud           → PUBLIC  (customers — always)
 * - localhost                 → Determined by role (dev convenience)
 *
 * If a non-OWNER lands on aimanagedsolutions.cloud, they are redirected to plugmein.cloud.
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

export type PlatformMode = 'PRIVATE' | 'PUBLIC';

type PlatformDomain = 'aims' | 'plugmein' | 'localhost';

interface PlatformModeContextValue {
  /** Current active mode — determined by domain + role, read-only */
  mode: PlatformMode;
  /** Which domain cluster the user is on */
  domain: PlatformDomain;
  /** True if user has OWNER role */
  isOwner: boolean;
  /** True if user has OWNER or ADMIN role (PRIVATE-eligible) */
  isAdmin: boolean;
  /** True if user is a CUSTOMER (PUBLIC mode) */
  isCustomer: boolean;
  /** The user's actual role from session */
  role: string;
}

const PlatformModeCtx = createContext<PlatformModeContextValue>({
  mode: 'PUBLIC',
  domain: 'plugmein',
  isOwner: false,
  isAdmin: false,
  isCustomer: true,
  role: 'CUSTOMER',
});

/**
 * Detect which domain cluster we're running on.
 * - aimanagedsolutions.cloud (any subdomain) → 'aims'
 * - plugmein.cloud (any subdomain)           → 'plugmein'
 * - localhost / 127.0.0.1 / dev              → 'localhost'
 */
function detectDomain(): PlatformDomain {
  if (typeof window === 'undefined') return 'plugmein'; // SSR default: safest
  const host = window.location.hostname.toLowerCase();
  if (host.includes('aimanagedsolutions')) return 'aims';
  if (host.includes('plugmein')) return 'plugmein';
  // localhost, 127.0.0.1, or any dev domain
  return 'localhost';
}

/**
 * Determine platform mode from domain + role.
 *
 * Rules:
 * - aimanagedsolutions.cloud + OWNER/ADMIN → PRIVATE
 * - aimanagedsolutions.cloud + CUSTOMER    → redirect (handled in useEffect)
 * - plugmein.cloud + any role              → PUBLIC (always)
 * - localhost + OWNER/ADMIN                → PRIVATE (dev convenience)
 * - localhost + CUSTOMER                   → PUBLIC
 */
function resolveMode(domain: PlatformDomain, isAdmin: boolean): PlatformMode {
  switch (domain) {
    case 'aims':
      // Only OWNER/ADMIN should be here — enforced by redirect below
      return isAdmin ? 'PRIVATE' : 'PUBLIC';
    case 'plugmein':
      // Always PUBLIC on the customer-facing domain
      return 'PUBLIC';
    case 'localhost':
      // Dev convenience: role determines mode
      return isAdmin ? 'PRIVATE' : 'PUBLIC';
    default:
      return 'PUBLIC';
  }
}

/** The app URL for plugmein.cloud (customer domain) */
const PLUGMEIN_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud';

export function PlatformModeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role as string || 'CUSTOMER';
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || isOwner;

  const domain = useMemo(() => detectDomain(), []);
  const mode = resolveMode(domain, isAdmin);

  // Enforce: non-OWNER/ADMIN on aimanagedsolutions.cloud → redirect to plugmein.cloud
  useEffect(() => {
    if (
      domain === 'aims' &&
      status === 'authenticated' &&
      !isAdmin
    ) {
      // Non-privileged user on the OWNER domain → send them to plugmein.cloud
      window.location.href = PLUGMEIN_URL;
    }
  }, [domain, status, isAdmin]);

  return (
    <PlatformModeCtx.Provider
      value={{
        mode,
        domain,
        isOwner,
        isAdmin,
        isCustomer: !isAdmin,
        role,
      }}
    >
      {children}
    </PlatformModeCtx.Provider>
  );
}

export const usePlatformMode = () => useContext(PlatformModeCtx);
