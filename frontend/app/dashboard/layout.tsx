// frontend/app/dashboard/layout.tsx
import type { ReactNode } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import { FloatingACHEEVY } from "../../components/global/FloatingACHEEVY";
import { QuickSwitcher } from "../../components/global/QuickSwitcher";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      {/* Persistent global components */}
      <FloatingACHEEVY />
      <QuickSwitcher />
    </>
  );
}
