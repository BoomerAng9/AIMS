// frontend/app/dashboard/layout.tsx
// Dashboard is freely browsable. Auth is enforced at the ACTION level
// (chat submit, deploy, build) via the AuthGate component, not at page load.
export const dynamic = 'force-dynamic';

import type { ReactNode } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import { FloatingACHEEVY } from "../../components/global/FloatingACHEEVY";
import { QuickSwitcher } from "../../components/global/QuickSwitcher";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      {/* Persistent global components */}
      <FloatingACHEEVY />
      <QuickSwitcher />
    </>
  );
}
