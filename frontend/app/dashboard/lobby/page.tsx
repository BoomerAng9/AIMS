// frontend/app/dashboard/lobby/page.tsx
/**
 * Zone A: The Lobby — Community & Discovery
 *
 * Dynamic social feed for the "Forum First" strategy.
 * Bluesky/Discord hybrid with Agent Cards, Plug Showcase, ACHEEVY presence.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Zone A
 */

import { FeedStream } from '@/components/lobby/FeedStream';

export default function LobbyPage() {
  return (
    <main className="max-w-3xl mx-auto">
      <FeedStream />
    </main>
  );
}
