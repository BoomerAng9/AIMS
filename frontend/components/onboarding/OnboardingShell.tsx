// frontend/components/onboarding/OnboardingShell.tsx
import React from "react";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function OnboardingShell({ title, subtitle, children }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white font-display uppercase tracking-[0.2em]">
          {title}
        </h1>
        <p className="text-sm text-white/50 max-w-sm mx-auto">
          {subtitle}
        </p>
      </header>

      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
