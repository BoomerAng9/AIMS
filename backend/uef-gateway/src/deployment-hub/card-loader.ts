/**
 * Card Loader — Loads Boomer_Ang and Lil_Hawk role cards from JSON files.
 *
 * Reads from aims-skills/chain-of-command/role-cards/*.json
 * Caches in memory for fast lookup during spawn operations.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import logger from '../logger';
import type { RoleCard, VisualIdentity } from './types';

// ── Paths ───────────────────────────────────────────────────

const ROLE_CARDS_DIR = join(__dirname, '..', '..', '..', '..', 'aims-skills', 'chain-of-command', 'role-cards');

// ── Cache ───────────────────────────────────────────────────

const cardCache = new Map<string, RoleCard>();
let cacheLoaded = false;

// ── Loader ──────────────────────────────────────────────────

function loadAllCards(): void {
  if (cacheLoaded) return;

  try {
    const files = readdirSync(ROLE_CARDS_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const raw = readFileSync(join(ROLE_CARDS_DIR, file), 'utf-8');
        const card: RoleCard = JSON.parse(raw);
        // Normalize handle for lookup: "Scout_Ang" → "scout-ang"
        const key = normalizeHandle(card.handle);
        cardCache.set(key, card);
      } catch (err) {
        logger.warn({ file, err }, '[CardLoader] Failed to parse role card');
      }
    }

    cacheLoaded = true;
    logger.info({ count: cardCache.size }, '[CardLoader] Role cards loaded');
  } catch (err) {
    logger.error({ err }, '[CardLoader] Failed to read role cards directory');
  }
}

function normalizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

// ── Public API ──────────────────────────────────────────────

/**
 * Get a role card by handle. Accepts any format:
 * "Scout_Ang", "scout-ang", "SCOUT_ANG", etc.
 */
export function getCard(handle: string): RoleCard | null {
  loadAllCards();
  return cardCache.get(normalizeHandle(handle)) || null;
}

/**
 * List all loaded role cards.
 */
export function listCards(): RoleCard[] {
  loadAllCards();
  return Array.from(cardCache.values());
}

/**
 * List only Boomer_Ang cards.
 */
export function listBoomerAngs(): RoleCard[] {
  return listCards().filter(c => c.role_type === 'Boomer_Ang');
}

/**
 * List only Lil_Hawk cards.
 */
export function listLilHawks(): RoleCard[] {
  return listCards().filter(c =>
    c.handle.toLowerCase().includes('lil') && c.handle.toLowerCase().includes('hawk')
  );
}

/**
 * Extract visual identity from a role card (if present).
 * JSON cards use snake_case; we normalize to camelCase VisualIdentity.
 */
export function getVisualIdentity(card: RoleCard): VisualIdentity | null {
  const vi = card.visual_identity as Record<string, string> | undefined;
  if (vi) {
    return {
      accentColor: vi.accentColor || vi.accent_color || '',
      accentName: vi.accentName || vi.accent_name || '',
      helmetStyle: vi.helmetStyle || vi.helmet_style || '',
      roleTool: vi.roleTool || vi.role_tool || '',
      description: vi.description || '',
      angPlacement: 'chest_plate',
    };
  }
  return null;
}

/**
 * Force reload all cards (useful after hot-updates).
 */
export function reloadCards(): void {
  cardCache.clear();
  cacheLoaded = false;
  loadAllCards();
}
