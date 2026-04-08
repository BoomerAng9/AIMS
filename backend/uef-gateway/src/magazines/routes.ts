/**
 * Magazine API Routes — A.I.M.S. Context Loading System
 *
 * Mounts under /api/magazines on the UEF Gateway (Express).
 * Provides CRUD for magazines, data sources, and slot management.
 */

import { Router, Request, Response } from 'express';
import {
  listMagazines,
  getMagazine,
  createMagazine,
  updateMagazine,
  deleteMagazine,
  addDataSource,
  removeDataSource,
  loadMagazine,
  unloadMagazine,
  getActiveState,
} from './store';

export const magazineRouter = Router();

// ─────────────────────────────────────────────────────────────
// Magazine CRUD
// ─────────────────────────────────────────────────────────────

/** GET /api/magazines — List all magazines */
magazineRouter.get('/', async (_req: Request, res: Response) => {
  const mags = await listMagazines();
  res.json({ magazines: mags, total: mags.length });
});

/** POST /api/magazines — Create a new magazine */
magazineRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body;
  const userId = (req.headers['x-user-id'] as string) || 'anonymous';

  if (!body.name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const magazine = await createMagazine(body, userId);
  res.status(201).json(magazine);
});

/** GET /api/magazines/active — Get currently loaded magazines (before :id to avoid collision) */
magazineRouter.get('/active', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'anonymous';
  const state = await getActiveState(userId);
  res.json({
    slots: state.slots,
    maxSlots: state.maxSlots,
    totalTokenEstimate: state.totalTokenEstimate,
  });
});

/** POST /api/magazines/load — Load a magazine into an active slot */
magazineRouter.post('/load', async (req: Request, res: Response) => {
  const body = req.body;
  const userId = (req.headers['x-user-id'] as string) || 'anonymous';

  if (!body.magazineId) {
    res.status(400).json({ error: 'magazineId is required' });
    return;
  }

  try {
    const slots = await loadMagazine(userId, body);
    res.json({ slots, loaded: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

/** POST /api/magazines/unload — Unload a magazine from active slots */
magazineRouter.post('/unload', async (req: Request, res: Response) => {
  const body = req.body;
  const userId = (req.headers['x-user-id'] as string) || 'anonymous';

  if (!body.magazineId) {
    res.status(400).json({ error: 'magazineId is required' });
    return;
  }

  const slots = await unloadMagazine(userId, body.magazineId);
  res.json({ slots, unloaded: true });
});

/** GET /api/magazines/:id — Get a single magazine */
magazineRouter.get('/:id', async (req: Request, res: Response) => {
  const mag = await getMagazine(req.params.id);
  if (!mag) { res.status(404).json({ error: 'Magazine not found' }); return; }
  res.json(mag);
});

/** PUT /api/magazines/:id — Update a magazine */
magazineRouter.put('/:id', async (req: Request, res: Response) => {
  const mag = await updateMagazine(req.params.id, req.body);
  if (!mag) { res.status(404).json({ error: 'Magazine not found' }); return; }
  res.json(mag);
});

/** DELETE /api/magazines/:id — Delete a magazine */
magazineRouter.delete('/:id', async (req: Request, res: Response) => {
  const deleted = await deleteMagazine(req.params.id);
  if (!deleted) { res.status(404).json({ error: 'Magazine not found' }); return; }
  res.json({ deleted: true });
});

// ─────────────────────────────────────────────────────────────
// Data Sources
// ─────────────────────────────────────────────────────────────

/** POST /api/magazines/:id/data-sources — Add a data source to a magazine */
magazineRouter.post('/:id/data-sources', async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.type || !body.name || !body.content) {
    res.status(400).json({ error: 'type, name, and content are required' });
    return;
  }

  const ds = await addDataSource(req.params.id, body);
  if (!ds) { res.status(404).json({ error: 'Magazine not found' }); return; }
  res.status(201).json(ds);
});

/** DELETE /api/magazines/:id/data-sources/:dsId — Remove a data source */
magazineRouter.delete('/:id/data-sources/:dsId', async (req: Request, res: Response) => {
  const removed = await removeDataSource(req.params.id, req.params.dsId);
  if (!removed) { res.status(404).json({ error: 'Data source or magazine not found' }); return; }
  res.json({ deleted: true });
});
