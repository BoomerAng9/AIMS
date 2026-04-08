import type { SessionContext, SessionSnapshot, WorkingNotebook } from '@/lib/context-packs/contracts';

const SESSION_SNAPSHOT_STORAGE_PREFIX = 'aims:session-snapshot:';

function getStorageKey(scope: string) {
  return `${SESSION_SNAPSHOT_STORAGE_PREFIX}${scope}`;
}

function buildSnapshot(scope: string, context: SessionContext, executionAttachmentIds: string[] = [], workingNotebook?: WorkingNotebook): SessionSnapshot {
  return {
    id: scope,
    sessionId: context.sessionId,
    context,
    workingNotebook,
    executionAttachmentIds,
    savedAt: new Date().toISOString(),
    status: 'draft',
  };
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function resolveSessionSnapshotScope(sessionId?: string, routeKey?: string) {
  if (sessionId) {
    return `session:${sessionId}`;
  }

  const normalizedRoute = (routeKey || 'dashboard-chat').replace(/[^a-z0-9:/_-]/gi, '-');
  return `route:${normalizedRoute}`;
}

export function loadLocalSessionSnapshot(scope: string): SessionSnapshot | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(getStorageKey(scope));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (!parsed?.context?.sessionId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function loadSessionSnapshot(scope: string): Promise<SessionSnapshot | null> {
  const localSnapshot = loadLocalSessionSnapshot(scope);

  try {
    const response = await fetch(`/api/session-snapshot?scope=${encodeURIComponent(scope)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return localSnapshot;
    }

    const data = (await response.json()) as { snapshot?: SessionSnapshot | null };
    if (data.snapshot) {
      persistLocalSessionSnapshot(scope, data.snapshot);
      return data.snapshot;
    }
  } catch {
    return localSnapshot;
  }

  return localSnapshot;
}

function persistLocalSessionSnapshot(scope: string, snapshot: SessionSnapshot) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(getStorageKey(scope), JSON.stringify(snapshot));
  } catch {
    // Ignore quota and availability failures.
  }
}

export async function saveSessionSnapshot(
  scope: string,
  context: SessionContext,
  executionAttachmentIds: string[] = [],
  workingNotebook?: WorkingNotebook,
) {
  const snapshot = buildSnapshot(scope, context, executionAttachmentIds, workingNotebook);
  persistLocalSessionSnapshot(scope, snapshot);

  try {
    await fetch('/api/session-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope,
        snapshot,
      }),
    });
  } catch {
    // Keep local fallback when backend persistence is unavailable.
  }
}