"use client";

import { SessionProvider } from "next-auth/react";
import { DemoProvider } from "@/lib/demo-context";
import { PlatformModeProvider } from "@/lib/platform-mode";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlatformModeProvider>
        <DemoProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'text-sm',
              style: { background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b' },
            }}
          />
        </DemoProvider>
      </PlatformModeProvider>
    </SessionProvider>
  );
}
