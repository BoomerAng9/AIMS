/**
 * Magazine Store — In-Memory + File-Backed Storage for Magazines
 *
 * Uses JSON files in data/magazines/ for persistence.
 * In-memory cache for fast reads. File writes for durability.
 *
 * Future: migrate to Redis or Prisma when scaling requires it.
 */

import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Magazine,
  DataSource,
  MagazineSlot,
  ActiveMagazineState,
  CreateMagazineRequest,
  UpdateMagazineRequest,
  AddDataSourceRequest,
  LoadMagazineRequest,
} from '../types/magazine';
import { DEFAULT_MAGAZINES } from '../types/magazine';

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const DATA_DIR = process.env.MAGAZINE_DATA_DIR || join(process.cwd(), 'data', 'magazines');
const MAX_SLOTS = 3;
const MAX_CONTEXT_TOKENS = 128_000; // Rough token limit for combined context

// ─────────────────────────────────────────────────────────────
// In-Memory State
// ─────────────────────────────────────────────────────────────

const magazines = new Map<string, Magazine>();
const activeSlots = new Map<string, MagazineSlot[]>(); // userId -> slots
let initialized = false;

// ─────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────

async function ensureDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function loadFromDisk(): Promise<void> {
  if (initialized) return;
  await ensureDir();
  try {
    const files = await readdir(DATA_DIR);

    // ⚡ Bolt: Parallelize magazine reads to eliminate sequential I/O latency
    await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          try {
            const raw = await readFile(join(DATA_DIR, file), 'utf-8');
            const mag: Magazine = JSON.parse(raw);
            magazines.set(mag.id, mag);
          } catch {
            // Skip corrupt files
          }
        })
    );

    initialized = true;
  } catch {
    initialized = true; // Empty dir, that's fine
  }
}

async function saveToDisk(magazine: Magazine): Promise<void> {
  await ensureDir();
  const filePath = join(DATA_DIR, `${magazine.id}.json`);
  await writeFile(filePath, JSON.stringify(magazine, null, 2), 'utf-8');
}

async function deleteFromDisk(id: string): Promise<void> {
  try {
    await unlink(join(DATA_DIR, `${id}.json`));
  } catch {
    // File may not exist — that's fine
  }
}

// ─────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function now(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────
// CRUD — Magazines
// ─────────────────────────────────────────────────────────────

export async function listMagazines(): Promise<Magazine[]> {
  await loadFromDisk();
  return Array.from(magazines.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getMagazine(id: string): Promise<Magazine | null> {
  await loadFromDisk();
  return magazines.get(id) || null;
}

export async function createMagazine(
  req: CreateMagazineRequest,
  userId: string
): Promise<Magazine> {
  await loadFromDisk();
  const magazine: Magazine = {
    id: randomUUID(),
    name: req.name,
    description: req.description,
    icon: req.icon || '📎',
    systemPrompt: req.systemPrompt || '',
    dataSources: [],
    skills: req.skills || [],
    voiceConfig: req.voiceConfig,
    tags: req.tags || [],
    createdAt: now(),
    updatedAt: now(),
    createdBy: userId,
    isDefault: false,
    isPublic: false,
  };
  magazines.set(magazine.id, magazine);
  await saveToDisk(magazine);
  return magazine;
}

export async function updateMagazine(
  id: string,
  req: UpdateMagazineRequest
): Promise<Magazine | null> {
  await loadFromDisk();
  const magazine = magazines.get(id);
  if (!magazine) return null;

  const updated: Magazine = {
    ...magazine,
    ...(req.name !== undefined && { name: req.name }),
    ...(req.description !== undefined && { description: req.description }),
    ...(req.icon !== undefined && { icon: req.icon }),
    ...(req.systemPrompt !== undefined && { systemPrompt: req.systemPrompt }),
    ...(req.tags !== undefined && { tags: req.tags }),
    ...(req.skills !== undefined && { skills: req.skills }),
    ...(req.voiceConfig !== undefined && { voiceConfig: req.voiceConfig }),
    updatedAt: now(),
  };
  magazines.set(id, updated);
  await saveToDisk(updated);
  return updated;
}

export async function deleteMagazine(id: string): Promise<boolean> {
  await loadFromDisk();
  const existed = magazines.delete(id);
  if (existed) {
    await deleteFromDisk(id);
    // Remove from all active slots
    for (const [userId, slots] of activeSlots) {
      const filtered = slots.filter(s => s.magazineId !== id);
      if (filtered.length !== slots.length) {
        activeSlots.set(userId, filtered);
      }
    }
  }
  return existed;
}

// ─────────────────────────────────────────────────────────────
// CRUD — Data Sources
// ─────────────────────────────────────────────────────────────

export async function addDataSource(
  magazineId: string,
  req: AddDataSourceRequest
): Promise<DataSource | null> {
  await loadFromDisk();
  const magazine = magazines.get(magazineId);
  if (!magazine) return null;

  const ds: DataSource = {
    id: randomUUID(),
    magazineId,
    type: req.type,
    name: req.name,
    content: req.content,
    metadata: {
      ...req.metadata,
      charCount: req.content.length,
      wordCount: req.content.split(/\s+/).length,
      summary: req.content.slice(0, 500),
    },
    contentHash: hashContent(req.content),
    createdAt: now(),
    updatedAt: now(),
  };

  magazine.dataSources.push(ds);
  magazine.updatedAt = now();
  magazines.set(magazineId, magazine);
  await saveToDisk(magazine);
  return ds;
}

export async function removeDataSource(
  magazineId: string,
  dataSourceId: string
): Promise<boolean> {
  await loadFromDisk();
  const magazine = magazines.get(magazineId);
  if (!magazine) return false;

  const before = magazine.dataSources.length;
  magazine.dataSources = magazine.dataSources.filter(ds => ds.id !== dataSourceId);
  if (magazine.dataSources.length === before) return false;

  magazine.updatedAt = now();
  magazines.set(magazineId, magazine);
  await saveToDisk(magazine);
  return true;
}

// ─────────────────────────────────────────────────────────────
// Magazine Slots — Loading / Unloading
// ─────────────────────────────────────────────────────────────

export async function loadMagazine(
  userId: string,
  req: LoadMagazineRequest
): Promise<MagazineSlot[]> {
  await loadFromDisk();
  const magazine = magazines.get(req.magazineId);
  if (!magazine) throw new Error(`Magazine not found: ${req.magazineId}`);

  let slots = activeSlots.get(userId) || [];

  // Check if already loaded
  if (slots.some(s => s.magazineId === req.magazineId)) {
    return slots;
  }

  // Check slot limit
  if (slots.length >= MAX_SLOTS) {
    // Remove oldest slot
    slots = slots.slice(1);
  }

  const slotIndex = req.slotIndex ?? slots.length;
  slots.push({
    slotIndex,
    magazineId: req.magazineId,
    magazine,
    active: true,
    loadedAt: now(),
  });

  activeSlots.set(userId, slots);
  return slots;
}

export async function unloadMagazine(
  userId: string,
  magazineId: string
): Promise<MagazineSlot[]> {
  let slots = activeSlots.get(userId) || [];
  slots = slots.filter(s => s.magazineId !== magazineId);
  activeSlots.set(userId, slots);
  return slots;
}

export async function getActiveState(userId: string): Promise<ActiveMagazineState> {
  await loadFromDisk();
  const slots = activeSlots.get(userId) || [];

  // Hydrate magazine references
  for (const slot of slots) {
    slot.magazine = magazines.get(slot.magazineId) || undefined;
  }

  // Build combined context from all active magazines
  const contextParts: string[] = [];
  for (const slot of slots) {
    if (!slot.magazine || !slot.active) continue;

    // Add system prompt
    if (slot.magazine.systemPrompt) {
      contextParts.push(`[MAGAZINE: ${slot.magazine.name}]\n${slot.magazine.systemPrompt}`);
    }

    // Add data source contents
    for (const ds of slot.magazine.dataSources) {
      contextParts.push(`[DATA SOURCE: ${ds.name} (${ds.type})]\n${ds.content}`);
    }
  }

  const combinedContext = contextParts.join('\n\n---\n\n');
  const totalTokenEstimate = estimateTokens(combinedContext);

  return {
    slots,
    maxSlots: MAX_SLOTS,
    combinedContext,
    totalTokenEstimate,
  };
}

// ─────────────────────────────────────────────────────────────
// Context Injection — Used by chat endpoint
// ─────────────────────────────────────────────────────────────

/**
 * Get the combined magazine context for injection into the system prompt.
 * Called from the main chat endpoint after NLP normalization.
 */
export async function getMagazineContext(userId: string): Promise<string> {
  const state = await getActiveState(userId);
  if (!state.combinedContext || state.totalTokenEstimate === 0) return '';

  // Guard against exceeding token limits
  if (state.totalTokenEstimate > MAX_CONTEXT_TOKENS) {
    // Truncate to fit
    const maxChars = MAX_CONTEXT_TOKENS * 4; // rough chars = tokens * 4
    return state.combinedContext.slice(0, maxChars) + '\n\n[Context truncated due to token limit]';
  }

  return `\n\n## Active Magazine Context\n\n${state.combinedContext}`;
}
