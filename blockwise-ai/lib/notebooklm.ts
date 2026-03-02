// Blockwise AI — NotebookLM Client
// Creates notebooks, adds sources, generates audio overviews

import type { NotebookRequest, NotebookResult, NotebookSource } from './types';

const NOTEBOOKLM_BASE = process.env.NOTEBOOKLM_API_URL ?? 'https://notebooklm.googleapis.com/v1';
const API_KEY = process.env.NOTEBOOKLM_API_KEY ?? '';

async function notebookFetch(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`${NOTEBOOKLM_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NotebookLM API error (${res.status}): ${err}`);
  }

  return res;
}

/** Create a new notebook */
export async function createNotebook(title: string): Promise<string> {
  const res = await notebookFetch('/notebooks', { title });
  const data = await res.json();
  return data.notebookId ?? data.id;
}

/** Add text or URL sources to a notebook */
export async function addSources(notebookId: string, sources: NotebookSource[]): Promise<void> {
  await notebookFetch(`/notebooks/${notebookId}/sources`, { sources });
}

/** Trigger audio overview generation */
export async function generateAudioOverview(notebookId: string): Promise<string> {
  const res = await notebookFetch(`/notebooks/${notebookId}/audio`, {
    format: 'audio_overview',
  });
  const data = await res.json();
  return data.audioUrl ?? '';
}

/** Full pipeline: create notebook, add sources, optionally generate audio */
export async function createPropertyNotebook(
  request: NotebookRequest
): Promise<NotebookResult> {
  const notebookId = await createNotebook(
    `Blockwise AI — ${request.propertyAddress}`
  );

  await addSources(notebookId, request.sources);

  let audioUrl: string | undefined;
  if (request.generateAudio) {
    audioUrl = await generateAudioOverview(notebookId);
  }

  return {
    notebookId,
    notebookUrl: `https://notebooklm.google.com/notebook/${notebookId}`,
    audioUrl,
    status: audioUrl ? 'ready' : 'created',
  };
}
