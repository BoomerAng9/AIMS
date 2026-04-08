import type { SessionSnapshot } from '@/lib/context-packs/contracts';

export type PreferenceMemory = {
  payload?: { key?: string; value?: string };
  updatedAt?: string;
  createdAt?: string;
};

export function formatSavedAt(savedAt: string | null) {
  if (!savedAt) return 'Unknown';
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

export function routeForScope(scope: string) {
  if (scope.startsWith('dashboard-')) return '/dashboard/chat';
  if (scope === 'chat-route') return '/chat';
  return '/dashboard/chat';
}

export function extractSessionSnapshots(memories: PreferenceMemory[]) {
  return (memories || [])
    .filter((memory) => {
      const key = memory.payload?.key || '';
      return key.startsWith('session_snapshot:') && Boolean(memory.payload?.value);
    })
    .map((memory) => {
      const key = memory.payload?.key || '';
      const scope = key.replace('session_snapshot:', '');

      try {
        const snapshot = JSON.parse(memory.payload?.value || '{}') as SessionSnapshot;
        return {
          scope,
          savedAt: snapshot.savedAt || memory.updatedAt || memory.createdAt || null,
          snapshot,
        };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is { scope: string; savedAt: string | null; snapshot: SessionSnapshot } => Boolean(entry))
    .sort((left, right) => {
      const leftTime = new Date(left.savedAt || 0).getTime();
      const rightTime = new Date(right.savedAt || 0).getTime();
      return rightTime - leftTime;
    });
}
