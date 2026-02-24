'use client';

/**
 * Platform Mode Context — A.I.M.S. Dual-Layer Access
 *
 * Provides PRIVATE vs PUBLIC mode awareness to all components.
 *
 * - PRIVATE: Owner/Admin — full technical UI, all agents visible, developer tools
 * - PUBLIC:  Customer — simplified UI, plain language, paywalled features
 *
 * Owner gets a "Developer Mode" toggle to switch between views
 * (useful for testing the customer experience).
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type PlatformMode = 'PRIVATE' | 'PUBLIC';

interface PlatformModeContextValue {
  /** Current active mode */
  mode: PlatformMode;
  /** True if user has OWNER role */
  isOwner: boolean;
  /** True if user has OWNER or ADMIN role (PRIVATE-eligible) */
  isAdmin: boolean;
  /** True if user is a CUSTOMER (PUBLIC mode, no toggle) */
  isCustomer: boolean;
  /** True if user can toggle between modes (OWNER/ADMIN only) */
  canToggle: boolean;
  /** The user's actual role from session */
  role: string;
  /** Toggle between PRIVATE and PUBLIC (owner/admin only) */
  toggleMode: () => void;
}

const PlatformModeCtx = createContext<PlatformModeContextValue>({
  mode: 'PUBLIC',
  isOwner: false,
  isAdmin: false,
  isCustomer: true,
  canToggle: false,
  role: 'CUSTOMER',
  toggleMode: () => {},
});

const STORAGE_KEY = 'aims-platform-mode';

export function PlatformModeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role as string || 'CUSTOMER';
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || isOwner;
  const canToggle = isAdmin;

  // Default: PRIVATE for admin/owner, PUBLIC for customers
  const defaultMode: PlatformMode = isAdmin ? 'PRIVATE' : 'PUBLIC';

  const [mode, setMode] = useState<PlatformMode>(defaultMode);

  // Load saved preference from localStorage (owner/admin only)
  useEffect(() => {
    if (!canToggle) {
      setMode('PUBLIC');
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'PRIVATE' || saved === 'PUBLIC') {
        setMode(saved);
      } else {
        setMode('PRIVATE'); // Default for admins
      }
    } catch {
      setMode('PRIVATE');
    }
  }, [canToggle]);

  const toggleMode = useCallback(() => {
    if (!canToggle) return;
    setMode((prev) => {
      const next = prev === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, [canToggle]);

  return (
    <PlatformModeCtx.Provider
      value={{
        mode,
        isOwner,
        isAdmin,
        isCustomer: !isAdmin,
        canToggle,
        role,
        toggleMode,
      }}
    >
      {children}
    </PlatformModeCtx.Provider>
  );
}

export const usePlatformMode = () => useContext(PlatformModeCtx);
