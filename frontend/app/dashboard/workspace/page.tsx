// frontend/app/dashboard/workspace/page.tsx
/**
 * Zone B: YourSpace — The Digital Office
 *
 * Mission Control dashboard showing running Docker containers
 * as "Active Tiles" with real-time status indicators.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Zone B
 */

import { WorkspaceGrid } from '@/components/workspace/WorkspaceGrid';

export default function WorkspacePage() {
  return (
    <main>
      <WorkspaceGrid />
    </main>
  );
}
