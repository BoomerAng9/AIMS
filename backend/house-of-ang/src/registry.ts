/**
 * House of Ang — Registry Loader
 * Loads BoomerAng definitions from the registry JSON file.
 * Supports hot-reload via fs.watch for development.
 */

import fs from 'fs';
import path from 'path';
import { BoomerAngDefinition, BoomerAngRegistry } from './types';

const REGISTRY_PATH = process.env.REGISTRY_PATH
  || path.resolve(__dirname, '../../../infra/boomerangs/registry.json');

let cachedRegistry: BoomerAngRegistry | null = null;

/**
 * Load the registry from disk.
 */
function loadFromDisk(): BoomerAngRegistry {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  const parsed: BoomerAngRegistry = JSON.parse(raw);
  console.log(`[HouseOfAng] Loaded registry v${parsed.version} — ${parsed.boomerangs.length} Boomer_Angs`);
  return parsed;
}

/**
 * Get the current registry (cached).
 */
export function getRegistry(): BoomerAngRegistry {
  if (!cachedRegistry) {
    cachedRegistry = loadFromDisk();
  }
  return cachedRegistry;
}

/**
 * Force-reload the registry from disk.
 */
export function reloadRegistry(): BoomerAngRegistry {
  cachedRegistry = loadFromDisk();
  return cachedRegistry;
}

/**
 * Get a single BoomerAng by ID.
 */
export function getBoomerAng(id: string): BoomerAngDefinition | undefined {
  return getRegistry().boomerangs.find(b => b.id === id);
}

/**
 * List all registered BoomerAngs.
 */
export function listBoomerAngs(): BoomerAngDefinition[] {
  return getRegistry().boomerangs;
}

/**
 * Find BoomerAngs that provide a given capability.
 */
export function findByCapability(capability: string): BoomerAngDefinition[] {
  const registry = getRegistry();
  const ids = registry.capability_index[capability] || [];
  return registry.boomerangs.filter(b => ids.includes(b.id));
}

/**
 * Find BoomerAngs matching any of the requested capabilities.
 * Returns matched agents and any capabilities that no agent covers.
 */
export function resolveCapabilities(capabilities: string[]): {
  matched: BoomerAngDefinition[];
  unmatched: string[];
} {
  const registry = getRegistry();
  const matchedIds = new Set<string>();
  const unmatched: string[] = [];

  for (const cap of capabilities) {
    const ids = registry.capability_index[cap];
    if (ids && ids.length > 0) {
      ids.forEach(id => matchedIds.add(id));
    } else {
      unmatched.push(cap);
    }
  }

  const matched = registry.boomerangs.filter(b => matchedIds.has(b.id));
  return { matched, unmatched };
}

/**
 * Start watching the registry file for changes (dev mode).
 */
export function watchRegistry(): void {
  try {
    fs.watch(REGISTRY_PATH, (eventType) => {
      if (eventType === 'change') {
        console.log('[HouseOfAng] Registry file changed — reloading...');
        try {
          reloadRegistry();
        } catch (err) {
          console.error('[HouseOfAng] Failed to reload registry:', err);
        }
      }
    });
    console.log('[HouseOfAng] Watching registry for changes');
  } catch {
    console.warn('[HouseOfAng] Could not watch registry file (non-fatal)');
  }
}
