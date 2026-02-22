/**
 * Cloudflare API Router
 *
 * Routes:
 *   GET  /llm.txt               — Machine-readable site map (public)
 *   GET  /llm-full.txt          — Full site map with all details (public)
 *   GET  /ai-index.json         — Structured AI discoverability (public)
 *   GET  /api/cloudflare/status — Check Cloudflare connection
 *   GET  /api/cloudflare/zones  — List managed zones/domains
 *   POST /api/cloudflare/dns    — Create DNS record
 *   DELETE /api/cloudflare/dns  — Remove DNS record
 */

import { Router } from 'express';
import { cloudflare } from './client';
import { generateLlmTxt, generateAiIndex } from './markdown-agents';
import logger from '../logger';

export const cloudflareRouter = Router();

// ---------------------------------------------------------------------------
// Public: LLM.txt and AI Index (no auth required, like robots.txt)
// ---------------------------------------------------------------------------

cloudflareRouter.get('/llm.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(generateLlmTxt());
});

cloudflareRouter.get('/llm-full.txt', (_req, res) => {
  // Same as llm.txt for now — can be extended with more detail
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(generateLlmTxt());
});

cloudflareRouter.get('/ai-index.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(generateAiIndex());
});

// ---------------------------------------------------------------------------
// API: Cloudflare Management (auth required — mounted after API key gate)
// ---------------------------------------------------------------------------

cloudflareRouter.get('/api/cloudflare/status', async (_req, res) => {
  const configured = await cloudflare.isConfigured();
  if (!configured) {
    res.json({ configured: false, message: 'Cloudflare API token not set' });
    return;
  }

  const verification = await cloudflare.verify();
  res.json({
    configured: true,
    verified: verification.ok,
    error: verification.error,
  });
});

cloudflareRouter.get('/api/cloudflare/zones', async (_req, res) => {
  try {
    const zones = await cloudflare.listZones();
    res.json({ zones, count: zones.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list zones';
    res.status(500).json({ error: msg });
  }
});

cloudflareRouter.get('/api/cloudflare/dns/:zoneId', async (req, res) => {
  try {
    const records = await cloudflare.listDnsRecords(req.params.zoneId);
    res.json({ records, count: records.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list DNS records';
    res.status(500).json({ error: msg });
  }
});

cloudflareRouter.post('/api/cloudflare/dns', async (req, res) => {
  try {
    const { zoneId, type, name, content, ttl, proxied, comment } = req.body;

    if (!zoneId || !type || !name || !content) {
      res.status(400).json({ error: 'zoneId, type, name, and content are required' });
      return;
    }

    const result = await cloudflare.createDnsRecord(zoneId, {
      type, name, content,
      ttl: ttl || 1,
      proxied: proxied !== false,
      comment,
    });

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ id: result.id, name, type, content });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DNS creation failed';
    res.status(500).json({ error: msg });
  }
});

cloudflareRouter.delete('/api/cloudflare/dns', async (req, res) => {
  try {
    const { zoneId, recordId } = req.body;
    if (!zoneId || !recordId) {
      res.status(400).json({ error: 'zoneId and recordId are required' });
      return;
    }

    const deleted = await cloudflare.deleteDnsRecord(zoneId, recordId);
    res.json({ deleted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DNS deletion failed';
    res.status(500).json({ error: msg });
  }
});

/**
 * Create subdomain for a plug instance.
 * POST /api/cloudflare/plug-subdomain
 * { instanceName, domain, targetIp }
 */
cloudflareRouter.post('/api/cloudflare/plug-subdomain', async (req, res) => {
  try {
    const { instanceName, domain, targetIp } = req.body;
    if (!instanceName || !domain || !targetIp) {
      res.status(400).json({ error: 'instanceName, domain, and targetIp are required' });
      return;
    }

    const result = await cloudflare.createPlugSubdomain(instanceName, domain, targetIp);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ fqdn: result.fqdn, recordId: result.recordId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Subdomain creation failed';
    res.status(500).json({ error: msg });
  }
});
