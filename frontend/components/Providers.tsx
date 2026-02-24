"use client";

import { SessionProvider } from "next-auth/react";
import { DemoProvider } from "@/lib/demo-context";
import { PlatformModeProvider } from "@/lib/platform-mode";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlatformModeProvider>
        <DemoProvider>{children}</DemoProvider>
      </PlatformModeProvider>
    </SessionProvider>
  );
}
