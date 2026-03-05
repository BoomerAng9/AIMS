/**
 * Magazine API Client — Frontend gateway calls for Magazine system
 */

import type { Magazine, DataSource, MagazineSlot } from './types';

const GATEWAY_URL = process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';

async function magazineFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${GATEWAY_URL}/api/magazines${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'user-1', // TODO: wire real user ID from session
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Magazine API error: ${res.status}`);
  }

  return res.json();
}

// ─── Magazine CRUD ────────────────────────────────────────────

export async function listMagazines(): Promise<{ magazines: Magazine[]; total: number }> {
  return magazineFetch('/');
}

export async function getMagazine(id: string): Promise<Magazine> {
  return magazineFetch(`/${id}`);
}

export async function createMagazine(data: {
  name: string;
  description: string;
  icon?: string;
  systemPrompt?: string;
  tags?: string[];
}): Promise<Magazine> {
  return magazineFetch('/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMagazine(
  id: string,
  data: Partial<{ name: string; description: string; icon: string; systemPrompt: string; tags: string[] }>
): Promise<Magazine> {
  return magazineFetch(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMagazine(id: string): Promise<void> {
  await magazineFetch(`/${id}`, { method: 'DELETE' });
}

// ─── Data Sources ─────────────────────────────────────────────

export async function addDataSource(
  magazineId: string,
  data: { type: string; name: string; content: string }
): Promise<DataSource> {
  return magazineFetch(`/${magazineId}/data-sources`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeDataSource(magazineId: string, dsId: string): Promise<void> {
  await magazineFetch(`/${magazineId}/data-sources/${dsId}`, { method: 'DELETE' });
}

// ─── Magazine Slots ───────────────────────────────────────────

export async function loadMagazine(magazineId: string): Promise<{ slots: MagazineSlot[] }> {
  return magazineFetch('/load', {
    method: 'POST',
    body: JSON.stringify({ magazineId }),
  });
}

export async function unloadMagazine(magazineId: string): Promise<{ slots: MagazineSlot[] }> {
  return magazineFetch('/unload', {
    method: 'POST',
    body: JSON.stringify({ magazineId }),
  });
}

export async function getActiveMagazines(): Promise<{
  slots: MagazineSlot[];
  maxSlots: number;
  totalTokenEstimate: number;
}> {
  return magazineFetch('/active');
}
