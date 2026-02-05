/**
 * ACHEEVY — Service Entry Point
 * REST API for the executive orchestrator.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { processRequest, getSessionHistory } from './orchestrator';
import { processDIYRequest } from './diy-handler';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(bodyParser.json());

// --------------------------------------------------------------------------
// Health
// --------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ACHEEVY Online', role: 'Executive Orchestrator' });
});

// --------------------------------------------------------------------------
// Chat — Main orchestration endpoint
// --------------------------------------------------------------------------
app.post('/chat', async (req, res) => {
  try {
    const { userId, sessionId, message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await processRequest({
      userId: userId || 'anon',
      sessionId: sessionId || uuidv4(),
      message,
    });

    res.json(result);
  } catch (err: any) {
    console.error('[ACHEEVY] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// History — Retrieve conversation
// --------------------------------------------------------------------------
app.get('/history/:sessionId', (req, res) => {
  const history = getSessionHistory(req.params.sessionId);
  res.json({ sessionId: req.params.sessionId, history });
});

// --------------------------------------------------------------------------
// DIY Mode — Voice + Vision enabled chat for hands-on projects
// --------------------------------------------------------------------------
app.post('/diy/chat', async (req, res) => {
  try {
    const { sessionId, projectId, message, imageBase64, mode } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await processDIYRequest({
      sessionId: sessionId || uuidv4(),
      projectId: projectId || 'unknown',
      message,
      imageBase64,
      mode: mode || 'console',
    });

    res.json(result);
  } catch (err: any) {
    console.error('[ACHEEVY/DIY] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n>>> ACHEEVY Orchestrator running on port ${PORT}`);
  console.log(`>>> Chat API:    POST http://localhost:${PORT}/chat`);
  console.log(`>>> DIY API:     POST http://localhost:${PORT}/diy/chat`);
  console.log(`>>> History API: GET  http://localhost:${PORT}/history/:sessionId\n`);
});
