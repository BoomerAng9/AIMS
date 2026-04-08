/**
 * Shelf Router — HTTP API Surface for the A.I.M.S. Shelving System
 *
 * Every shelf (collection) gets a clean REST API:
 *   GET    /shelves                 — List all shelves with doc counts
 *   GET    /shelves/:shelf          — List documents in a shelf
 *   POST   /shelves/:shelf          — Create a document
 *   GET    /shelves/:shelf/:id      — Get a single document
 *   PATCH  /shelves/:shelf/:id      — Update a document
 *   DELETE /shelves/:shelf/:id      — Delete a document
 *   POST   /shelves/search          — Search across shelves
 *
 * Chicken Hawk and Lil_Hawks call these endpoints (or the MCP tool wrappers)
 * to "walk the shelves" and assemble Plugs from existing parts.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { shelfClient, type ShelfListOptions, type ShelfQuery } from './firestore-client';
import { SHELF_REGISTRY, type ShelfName } from './types';
import logger from '../logger';

export const shelfRouter = Router();

const VALID_SHELVES = Object.keys(SHELF_REGISTRY) as ShelfName[];

function isValidShelf(name: string): name is ShelfName {
  return VALID_SHELVES.includes(name as ShelfName);
}

// ---------------------------------------------------------------------------
// GET /shelves — List all shelves with doc counts
// ---------------------------------------------------------------------------
shelfRouter.get('/shelves', async (_req: Request, res: Response) => {
  try {
    const info = await shelfClient.getAllShelfInfo();
    const shelves = info.map(s => ({
      ...s,
      ...SHELF_REGISTRY[s.name as ShelfName],
    }));
    res.json({ shelves, count: shelves.length, firestoreConnected: shelfClient.isConnected() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list shelves';
    logger.error({ err }, '[ShelfRouter] List shelves error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /shelves/:shelf — List documents in a shelf
// ---------------------------------------------------------------------------
shelfRouter.get('/shelves/:shelf', async (req: Request, res: Response) => {
  const { shelf } = req.params;
  if (!isValidShelf(shelf)) {
    res.status(400).json({ error: `Invalid shelf: ${shelf}. Valid shelves: ${VALID_SHELVES.join(', ')}` });
    return;
  }

  try {
    const filters: ShelfQuery[] = [];

    // Parse query string filters: ?status=active&userId=abc
    for (const [key, value] of Object.entries(req.query)) {
      if (['limit', 'offset', 'orderBy', 'orderDir'].includes(key)) continue;
      if (typeof value === 'string') {
        filters.push({ field: key, op: '==', value });
      }
    }

    const options: ShelfListOptions = {
      filters: filters.length > 0 ? filters : undefined,
      orderBy: req.query.orderBy as string | undefined,
      orderDir: (req.query.orderDir as 'asc' | 'desc') || 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const docs = await shelfClient.list(shelf, options);
    const count = await shelfClient.count(shelf);
    res.json({ shelf, docs, returned: docs.length, total: count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list shelf documents';
    logger.error({ err, shelf }, '[ShelfRouter] List error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /shelves/:shelf — Create a document
// ---------------------------------------------------------------------------
shelfRouter.post('/shelves/:shelf', async (req: Request, res: Response) => {
  const { shelf } = req.params;
  if (!isValidShelf(shelf)) {
    res.status(400).json({ error: `Invalid shelf: ${shelf}` });
    return;
  }

  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }

    // Auto-generate id if not provided
    const prefix = SHELF_REGISTRY[shelf].idPrefix;
    if (!body.id) {
      body.id = `${prefix}_${uuidv4().slice(0, 12)}`;
    }

    // Auto-set timestamps
    const now = new Date().toISOString();
    if (!body.createdAt) body.createdAt = now;
    if (!body.updatedAt) body.updatedAt = now;

    const doc = await shelfClient.create(shelf, body);
    res.status(201).json({ shelf, doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create document';
    logger.error({ err, shelf }, '[ShelfRouter] Create error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /shelves/:shelf/:id — Get a single document
// ---------------------------------------------------------------------------
shelfRouter.get('/shelves/:shelf/:id', async (req: Request, res: Response) => {
  const { shelf, id } = req.params;
  if (!isValidShelf(shelf)) {
    res.status(400).json({ error: `Invalid shelf: ${shelf}` });
    return;
  }

  try {
    const doc = await shelfClient.get(shelf, id);
    if (!doc) {
      res.status(404).json({ error: `Document ${id} not found on shelf ${shelf}` });
      return;
    }
    res.json({ shelf, doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to get document';
    logger.error({ err, shelf, id }, '[ShelfRouter] Get error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// PATCH /shelves/:shelf/:id — Update a document
// ---------------------------------------------------------------------------
shelfRouter.patch('/shelves/:shelf/:id', async (req: Request, res: Response) => {
  const { shelf, id } = req.params;
  if (!isValidShelf(shelf)) {
    res.status(400).json({ error: `Invalid shelf: ${shelf}` });
    return;
  }

  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }

    // Always update the updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    const doc = await shelfClient.update(shelf, id, updates);
    if (!doc) {
      res.status(404).json({ error: `Document ${id} not found on shelf ${shelf}` });
      return;
    }
    res.json({ shelf, doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update document';
    logger.error({ err, shelf, id }, '[ShelfRouter] Update error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// DELETE /shelves/:shelf/:id — Delete a document
// ---------------------------------------------------------------------------
shelfRouter.delete('/shelves/:shelf/:id', async (req: Request, res: Response) => {
  const { shelf, id } = req.params;
  if (!isValidShelf(shelf)) {
    res.status(400).json({ error: `Invalid shelf: ${shelf}` });
    return;
  }

  try {
    const deleted = await shelfClient.delete(shelf, id);
    if (!deleted) {
      res.status(404).json({ error: `Document ${id} not found on shelf ${shelf}` });
      return;
    }
    res.json({ shelf, id, deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete document';
    logger.error({ err, shelf, id }, '[ShelfRouter] Delete error');
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /shelves/search — Search across shelves (Chicken Hawk shelf-walking)
// ---------------------------------------------------------------------------
shelfRouter.post('/shelves/search', async (req: Request, res: Response) => {
  try {
    const { query, shelves } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Missing query string' });
      return;
    }
    if (query.length > 500) {
      res.status(400).json({ error: 'Query too long (max 500 chars)' });
      return;
    }

    const targetShelves = shelves
      ? (shelves as string[]).filter(s => isValidShelf(s)) as ShelfName[]
      : undefined;

    const results = await shelfClient.searchShelves(query, targetShelves);
    res.json({ query, results, count: results.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    logger.error({ err }, '[ShelfRouter] Search error');
    res.status(500).json({ error: msg });
  }
});
