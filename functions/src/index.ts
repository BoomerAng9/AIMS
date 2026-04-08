/**
 * A.I.M.S. Cloud Functions — Firebase Functions for the Shelving System
 *
 * Deployed to Firebase Cloud Functions. Provides:
 *   - LUC estimation endpoint (calling Vertex AI and/or OSS models)
 *   - Chicken Hawk / Lil_Hawk tool endpoints
 *   - Webhooks and events (runs, status changes, logs)
 *   - Project lifecycle triggers
 *
 * These functions run alongside the UEF Gateway but are designed for
 * serverless invocation from Firebase, GCP triggers, and scheduled jobs.
 */

import * as admin from 'firebase-admin';
import { onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// LUC Estimation Endpoint — Callable from UI and agents
// ---------------------------------------------------------------------------

export const lucEstimate = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { scope, requirements, models, userId } = req.body;
  if (!scope || typeof scope !== 'string') {
    res.status(400).json({ error: 'Missing scope field' });
    return;
  }

  try {
    // Classify complexity from scope text
    const combined = `${scope} ${requirements || ''}`.toLowerCase();
    const len = combined.length;

    let complexity = 'intermediate';
    const complexSignals = ['enterprise', 'multi-tenant', 'real-time', 'ml pipeline', 'distributed'];
    const intermediateSignals = ['api', 'database', 'auth', 'dashboard', 'integration', 'workflow'];

    if (complexSignals.some(s => combined.includes(s)) || len > 2000) complexity = 'enterprise';
    else if (intermediateSignals.filter(s => combined.includes(s)).length >= 3) complexity = 'complex';
    else if (len < 200) complexity = 'simple';

    // Token estimation by complexity
    const profiles: Record<string, { planning: number; execution: number; verification: number; timeBand: string }> = {
      simple: { planning: 2000, execution: 15000, verification: 3000, timeBand: 'INSTANT' },
      intermediate: { planning: 8000, execution: 60000, verification: 12000, timeBand: '1H' },
      complex: { planning: 25000, execution: 200000, verification: 40000, timeBand: '4H' },
      enterprise: { planning: 80000, execution: 800000, verification: 120000, timeBand: '1D' },
    };

    const profile = profiles[complexity];
    const totalTokens = profile.planning + profile.execution + profile.verification;

    // Cost estimation (using Vertex AI pricing)
    const inputCostPer1M = 3.0; // Sonnet midpoint
    const outputCostPer1M = 15.0;
    const inputTokens = Math.round(totalTokens * 0.4);
    const outputTokens = Math.round(totalTokens * 0.6);
    const costMid = (inputTokens / 1_000_000) * inputCostPer1M + (outputTokens / 1_000_000) * outputCostPer1M;

    const estimate = {
      complexity,
      totalEstimatedTokens: totalTokens,
      costBand: {
        low: Math.round(costMid * 0.7 * 100) / 100,
        mid: Math.round(costMid * 100) / 100,
        high: Math.round(costMid * 1.5 * 100) / 100,
        currency: 'USD',
      },
      timeBand: profile.timeBand,
      breakdown: {
        planning: profile.planning,
        execution: profile.execution,
        verification: profile.verification,
      },
    };

    res.json({ estimate, scope, userId: userId || 'anonymous' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Estimation failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// LUC Project Creation — Creates a LUC record in Firestore
// ---------------------------------------------------------------------------

export const lucCreateProject = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { projectId, userId, scope, requirements } = req.body;
  if (!projectId || !userId || !scope) {
    res.status(400).json({ error: 'Missing required fields: projectId, userId, scope' });
    return;
  }

  try {
    const now = new Date().toISOString();
    const lucId = `luc_${Date.now().toString(36)}`;

    const lucProject = {
      id: lucId,
      projectId,
      userId,
      scope,
      requirements: requirements || '',
      status: 'estimated',
      timeBand: 'TBD',
      modelMix: [],
      totalEstimatedTokens: 0,
      costBand: { low: 0, mid: 0, high: 0, currency: 'USD' },
      actualTokensUsed: 0,
      actualCostUsd: 0,
      historicalSimilarity: { matchedProjectIds: [], confidenceScore: 0.1 },
      linkedRunIds: [],
      linkedAssetIds: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('luc_projects').doc(lucId).set(lucProject);

    // Link to parent project
    const projectRef = db.collection('projects').doc(projectId);
    const projectSnap = await projectRef.get();
    if (projectSnap.exists) {
      await projectRef.update({ lucProjectId: lucId, updatedAt: now });
    }

    res.status(201).json({ lucProject });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LUC project creation failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Webhook — Run Status Changes
// ---------------------------------------------------------------------------

export const onRunStatusChange = onDocumentUpdated('runs/{runId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  if (before.status !== after.status) {
    // Log the status change
    await db.collection('logs').add({
      id: `log_${Date.now().toString(36)}`,
      runId: after.id,
      agentId: after.executorAgentId || 'system',
      level: after.status === 'failed' ? 'error' : 'info',
      source: 'system',
      message: `Run ${after.id} status: ${before.status} -> ${after.status}`,
      timestamp: new Date().toISOString(),
    });

    // If run completed, update LUC project costs
    if (after.status === 'completed' && after.lucProjectId) {
      const lucRef = db.collection('luc_projects').doc(after.lucProjectId);
      const lucSnap = await lucRef.get();
      if (lucSnap.exists) {
        const lucData = lucSnap.data()!;
        await lucRef.update({
          actualTokensUsed: (lucData.actualTokensUsed || 0) + (after.totalTokensUsed || 0),
          actualCostUsd: Math.round(((lucData.actualCostUsd || 0) + (after.totalCostUsd || 0)) * 10000) / 10000,
          linkedRunIds: admin.firestore.FieldValue.arrayUnion(after.id),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Webhook — New Project Created
// ---------------------------------------------------------------------------

export const onProjectCreated = onDocumentCreated('projects/{projectId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  // Auto-create a LUC estimate for new projects
  if (data.description && data.userId) {
    const lucId = `luc_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    await db.collection('luc_projects').doc(lucId).set({
      id: lucId,
      projectId: data.id,
      userId: data.userId,
      scope: data.name || 'New Project',
      requirements: data.description || '',
      status: 'estimated',
      timeBand: 'TBD',
      modelMix: [],
      totalEstimatedTokens: 0,
      costBand: { low: 0, mid: 0, high: 0, currency: 'USD' },
      actualTokensUsed: 0,
      actualCostUsd: 0,
      historicalSimilarity: { matchedProjectIds: [], confidenceScore: 0.1 },
      linkedRunIds: [],
      linkedAssetIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // Link back to project
    await db.collection('projects').doc(data.id).update({
      lucProjectId: lucId,
      updatedAt: now,
    });
  }
});

// ---------------------------------------------------------------------------
// Scheduled — Daily LUC Usage Summary
// ---------------------------------------------------------------------------

export const dailyLucSummary = onSchedule('every 24 hours', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();

  // Find runs completed in the last 24 hours
  const runsSnap = await db.collection('runs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', yesterdayStr)
    .get();

  let totalTokens = 0;
  let totalCost = 0;
  const projectCounts: Record<string, number> = {};

  for (const doc of runsSnap.docs) {
    const run = doc.data();
    totalTokens += run.totalTokensUsed || 0;
    totalCost += run.totalCostUsd || 0;
    if (run.projectId) {
      projectCounts[run.projectId] = (projectCounts[run.projectId] || 0) + 1;
    }
  }

  // Write summary to logs
  await db.collection('logs').add({
    id: `log_${Date.now().toString(36)}`,
    level: 'info',
    source: 'system',
    message: `Daily LUC Summary: ${runsSnap.size} runs, ${totalTokens} tokens, $${totalCost.toFixed(4)}`,
    data: { totalRuns: runsSnap.size, totalTokens, totalCost, projectCounts },
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Tool Endpoint — Chicken Hawk / Lil_Hawk Shelf Access
// ---------------------------------------------------------------------------

export const shelfTool = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, shelf, id, data, query } = req.body;

  try {
    switch (action) {
      case 'read': {
        if (!shelf || !id) throw new HttpsError('invalid-argument', 'Missing shelf or id');
        const doc = await db.collection(shelf).doc(id).get();
        if (!doc.exists) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
        res.json({ doc: doc.data() });
        break;
      }
      case 'list': {
        if (!shelf) throw new HttpsError('invalid-argument', 'Missing shelf');
        const snap = await db.collection(shelf).limit(50).get();
        res.json({ docs: snap.docs.map(d => d.data()), count: snap.size });
        break;
      }
      case 'create': {
        if (!shelf || !data) throw new HttpsError('invalid-argument', 'Missing shelf or data');
        const docId = data.id || `${shelf.slice(0, 3)}_${Date.now().toString(36)}`;
        data.id = docId;
        data.createdAt = data.createdAt || new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        await db.collection(shelf).doc(docId).set(data);
        res.status(201).json({ doc: data });
        break;
      }
      case 'update': {
        if (!shelf || !id || !data) throw new HttpsError('invalid-argument', 'Missing shelf, id, or data');
        data.updatedAt = new Date().toISOString();
        await db.collection(shelf).doc(id).update(data);
        const updated = await db.collection(shelf).doc(id).get();
        res.json({ doc: updated.data() });
        break;
      }
      case 'search': {
        if (!query) throw new HttpsError('invalid-argument', 'Missing query');
        // Simple search across specified shelves
        const shelves = req.body.shelves || ['projects', 'plugs', 'workflows'];
        const results: Array<{ shelf: string; id: string; snippet: string }> = [];
        const queryLower = query.toLowerCase();

        for (const s of shelves) {
          const snap = await db.collection(s).limit(100).get();
          for (const doc of snap.docs) {
            const docData = doc.data();
            for (const [field, value] of Object.entries(docData)) {
              if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
                results.push({ shelf: s, id: doc.id, snippet: value.slice(0, 200) });
                break;
              }
            }
          }
        }
        res.json({ query, results, count: results.length });
        break;
      }
      default:
        res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Shelf tool error';
    res.status(500).json({ error: msg });
  }
});
