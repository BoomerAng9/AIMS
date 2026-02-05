"use client";

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { AcheevyChat } from "@/components/AcheevyChat";

export default function DashboardChatPage() {
  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)]">
        <AcheevyChat />
      </main>
    </LogoWallBackground>
  );
}
