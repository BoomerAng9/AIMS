// frontend/components/onboarding/OnboardingStepper.tsx
import React from "react";
import clsx from "clsx";

const STEPS = ["profile", "goal", "estimate", "finish"] as const;

interface Props {
  currentStep: typeof STEPS[number];
}

export function OnboardingStepper({ currentStep }: Props) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between w-full max-w-xs mx-auto mb-8">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-2">
            <div className={clsx(
              "h-2.5 w-2.5 rounded-full transition-all duration-500",
              idx <= currentIndex ? "bg-gold shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-white/10"
            )} />
          </div>
          {idx < STEPS.length - 1 && (
            <div className={clsx(
              "h-[1px] flex-1 mx-2 transition-all duration-700",
              idx < currentIndex ? "bg-gold/50" : "bg-white/5"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
