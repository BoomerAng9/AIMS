/**
 * A.I.M.S. Firestore Client — Shelf Access Layer
 *
 * Provides typed CRUD operations for every shelf (collection) in Firestore.
 * Designed for use by:
 *   - Shelf HTTP router (REST API surface)
 *   - Chicken Hawk and Lil_Hawks (shelf walking via MCP tools)
 *   - Cloud Functions (LUC estimation, webhooks)
 *   - CLI bootstrapper (aims init)
 *
 * Falls back to in-memory storage when Firebase is not configured,
 * so development and tests can run without a live Firestore instance.
 */

import logger from '../logger';
import type { ShelfName } from './types';

// ---------------------------------------------------------------------------
// Firebase Admin lazy initialization
// firebase-admin is optional — falls back to memory store when absent
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _firestore: any = null;
let _initAttempted = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFirestore(): any {
  if (_initAttempted) return _firestore;
  _initAttempted = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        logger.warn('[Firestore] No project ID configured — running in memory-only mode');
        return null;
      }

      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (serviceAccountPath) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const cert = require(serviceAccountPath);
        admin.initializeApp({ credential: admin.credential.cert(cert), projectId });
      } else {
        admin.initializeApp({ projectId });
      }
    }
    _firestore = admin.firestore();
    logger.info('[Firestore] Connected to Firestore');
    return _firestore;
  } catch (err) {
    logger.warn({ err }, '[Firestore] firebase-admin not available — running in memory-only mode');
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-Memory Fallback Store (for dev/test without Firebase)
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, Map<string, Record<string, unknown>>>();

function getMemCollection(name: string): Map<string, Record<string, unknown>> {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, new Map());
  }
  return memoryStore.get(name)!;
}

// ---------------------------------------------------------------------------
// Shelf Client — Unified interface for Firestore + memory fallback
// ---------------------------------------------------------------------------

export interface ShelfQuery {
  field: string;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';
  value: unknown;
}

export interface ShelfListOptions {
  filters?: ShelfQuery[];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class ShelfClient {
  private get db() { return getFirestore(); }

  // ---- CRUD ----

  async create<T extends { id: string }>(shelf: ShelfName, doc: T): Promise<T> {
    const db = this.db;
    if (db) {
      await db.collection(shelf).doc(doc.id).set(doc as Record<string, unknown>);
    } else {
      getMemCollection(shelf).set(doc.id, doc as Record<string, unknown>);
    }
    logger.info({ shelf, id: doc.id }, '[Shelf] Created');
    return doc;
  }

  async get<T extends { id: string }>(shelf: ShelfName, id: string): Promise<T | null> {
    const db = this.db;
    if (db) {
      const snap = await db.collection(shelf).doc(id).get();
      if (!snap.exists) return null;
      return snap.data() as T;
    }
    const mem = getMemCollection(shelf).get(id);
    return mem ? (mem as unknown as T) : null;
  }

  async update<T extends { id: string }>(shelf: ShelfName, id: string, updates: Partial<T>): Promise<T | null> {
    const db = this.db;
    if (db) {
      const ref = db.collection(shelf).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      await ref.update(updates as Record<string, unknown>);
      const updated = await ref.get();
      return updated.data() as T;
    }
    const col = getMemCollection(shelf);
    const existing = col.get(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates, id };
    col.set(id, merged);
    return merged as unknown as T;
  }

  async delete(shelf: ShelfName, id: string): Promise<boolean> {
    const db = this.db;
    if (db) {
      const ref = db.collection(shelf).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      await ref.delete();
      return true;
    }
    return getMemCollection(shelf).delete(id);
  }

  async list<T extends { id: string }>(shelf: ShelfName, options?: ShelfListOptions): Promise<T[]> {
    const db = this.db;
    if (db) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = db.collection(shelf);

      // Skip _SCHEMA documents
      query = query.where('id', '!=', '_SCHEMA');

      if (options?.filters) {
        for (const f of options.filters) {
          query = query.where(f.field, f.op, f.value);
        }
      }
      if (options?.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDir || 'desc');
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const snap = await query.get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return snap.docs.map((d: any) => d.data() as T);
    }

    // Memory fallback with basic filtering
    let items = Array.from(getMemCollection(shelf).values()) as unknown as T[];
    if (options?.filters) {
      for (const f of options.filters) {
        items = items.filter(item => {
          const val = (item as Record<string, unknown>)[f.field];
          switch (f.op) {
            case '==': return val === f.value;
            case '!=': return val !== f.value;
            case '<': return (val as number) < (f.value as number);
            case '<=': return (val as number) <= (f.value as number);
            case '>': return (val as number) > (f.value as number);
            case '>=': return (val as number) >= (f.value as number);
            case 'in': return Array.isArray(f.value) && f.value.includes(val);
            case 'array-contains': return Array.isArray(val) && val.includes(f.value);
            default: return true;
          }
        });
      }
    }
    if (options?.orderBy) {
      const dir = options.orderDir === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        const va = (a as Record<string, unknown>)[options.orderBy!];
        const vb = (b as Record<string, unknown>)[options.orderBy!];
        if (va === vb) return 0;
        return (va as string) > (vb as string) ? dir : -dir;
      });
    }
    if (options?.offset) items = items.slice(options.offset);
    if (options?.limit) items = items.slice(0, options.limit);
    return items;
  }

  async count(shelf: ShelfName): Promise<number> {
    const db = this.db;
    if (db) {
      const snap = await db.collection(shelf).count().get();
      return snap.data().count;
    }
    return getMemCollection(shelf).size;
  }

  // ---- Shelf discovery ----

  async getShelfInfo(shelf: ShelfName): Promise<{ name: string; docCount: number }> {
    const docCount = await this.count(shelf);
    return { name: shelf, docCount };
  }

  async getAllShelfInfo(): Promise<Array<{ name: string; docCount: number }>> {
    const shelves: ShelfName[] = ['projects', 'luc_projects', 'plugs', 'boomer_angs', 'workflows', 'runs', 'logs', 'assets'];
    return Promise.all(shelves.map(s => this.getShelfInfo(s)));
  }

  // ---- Batch operations ----

  async batchCreate<T extends { id: string }>(shelf: ShelfName, docs: T[]): Promise<T[]> {
    const db = this.db;
    if (db) {
      const batch = db.batch();
      for (const doc of docs) {
        batch.set(db.collection(shelf).doc(doc.id), doc as Record<string, unknown>);
      }
      await batch.commit();
    } else {
      const col = getMemCollection(shelf);
      for (const doc of docs) {
        col.set(doc.id, doc as Record<string, unknown>);
      }
    }
    logger.info({ shelf, count: docs.length }, '[Shelf] Batch created');
    return docs;
  }

  // ---- Search across shelves (Chicken Hawk shelf-walking) ----

  async searchShelves(query: string, shelves?: ShelfName[]): Promise<Array<{ shelf: ShelfName; id: string; matchField: string; snippet: string }>> {
    const targetShelves = shelves || (['projects', 'luc_projects', 'plugs', 'boomer_angs', 'workflows', 'runs', 'assets'] as ShelfName[]);
    const results: Array<{ shelf: ShelfName; id: string; matchField: string; snippet: string }> = [];
    const queryLower = query.toLowerCase();

    for (const shelf of targetShelves) {
      const items = await this.list<{ id: string } & Record<string, unknown>>(shelf, { limit: 100 });
      for (const item of items) {
        for (const [field, value] of Object.entries(item)) {
          if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
            results.push({
              shelf,
              id: item.id,
              matchField: field,
              snippet: value.slice(0, 200),
            });
            break; // One match per document is enough
          }
        }
      }
    }

    return results;
  }

  isConnected(): boolean {
    return !!getFirestore();
  }
}

export const shelfClient = new ShelfClient();
