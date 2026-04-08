import { describe, expect, it } from 'vitest';
import { extractSessionSnapshots, formatSavedAt, routeForScope, type PreferenceMemory } from './history';

describe('session snapshot history utilities', () => {
  it('formats saved timestamp safely', () => {
    expect(formatSavedAt(null)).toBe('Unknown');
    expect(formatSavedAt('not-a-date')).toBe('Unknown');
    expect(formatSavedAt('2026-03-17T10:00:00.000Z')).not.toBe('Unknown');
  });

  it('maps scope to expected resume route', () => {
    expect(routeForScope('dashboard-chat')).toBe('/dashboard/chat');
    expect(routeForScope('chat-route')).toBe('/chat');
    expect(routeForScope('anything-else')).toBe('/dashboard/chat');
  });

  it('extracts and sorts valid session snapshot memories', () => {
    const memories: PreferenceMemory[] = [
      {
        payload: {
          key: 'session_snapshot:chat-route',
          value: JSON.stringify({
            id: 'a',
            sessionId: 'chat-route',
            context: {
              sessionId: 'chat-route',
              selectedContextPackIds: [],
              selectedModel: 'model-a',
              selectedLanguage: 'en',
              speechOutputEnabled: true,
            },
            executionAttachmentIds: [],
            savedAt: '2026-03-17T09:00:00.000Z',
            status: 'synced',
          }),
        },
        updatedAt: '2026-03-17T09:00:00.000Z',
      },
      {
        payload: {
          key: 'session_snapshot:dashboard-chat',
          value: JSON.stringify({
            id: 'b',
            sessionId: 'dashboard-chat',
            context: {
              sessionId: 'dashboard-chat',
              selectedContextPackIds: ['pack-1'],
              selectedModel: 'model-b',
              selectedLanguage: 'en',
              speechOutputEnabled: false,
            },
            executionAttachmentIds: [],
            savedAt: '2026-03-17T10:00:00.000Z',
            status: 'draft',
          }),
        },
        updatedAt: '2026-03-17T10:00:00.000Z',
      },
      {
        payload: {
          key: 'not-a-snapshot',
          value: 'ignored',
        },
      },
    ];

    const snapshots = extractSessionSnapshots(memories);
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].scope).toBe('dashboard-chat');
    expect(snapshots[1].scope).toBe('chat-route');
  });
});
