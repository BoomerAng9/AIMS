// frontend/lib/demo-context.tsx
"use client";

import { createContext, useContext } from "react";

const DemoContext = createContext(false);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return <DemoContext.Provider value={isDemo}>{children}</DemoContext.Provider>;
}

export function useIsDemo(): boolean {
  return useContext(DemoContext);
}
