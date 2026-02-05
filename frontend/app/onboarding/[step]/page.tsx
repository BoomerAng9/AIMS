"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { LucEstimatePanel } from "@/components/luc/LucEstimatePanel";
import { useLuc } from "@/lib/luc/use-luc";

const STEPS = ["profile", "goal", "estimate", "finish"] as const;

export default function OnboardingStepPage() {
  const params = useParams();
  const router = useRouter();
  const step = params.step as typeof STEPS[number];

  const { estimate: realEstimate, loading: estimateLoading } = useLuc({
    message: "A.I.M.S. Initialization Strategy",
    enabled: step === "estimate",
  });

  if (!STEPS.includes(step)) {
    return <div>Invalid step</div>;
  }

  const nextStep = STEPS[STEPS.indexOf(step) + 1];
  const prevStep = STEPS[STEPS.indexOf(step) - 1];

  const handleNext = () => {
    if (nextStep) {
      router.push(`/onboarding/${nextStep}`);
    } else {
      localStorage.setItem("aims_onboarding_complete", "true");
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (prevStep) {
      router.push(`/onboarding/${prevStep}`);
    } else {
      router.push("/");
    }
  };

  const renderContent = () => {
    switch (step) {
      case "profile":
        return (
          <OnboardingShell title="Identity" subtitle="Capture your tactical footprint. This helps ACHEEVY provision your secure domain.">
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-amber-100/40 px-4">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full rounded-full border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-amber-300 transition-all px-6 text-amber-50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-amber-100/40 px-4">Direct Email</label>
                <input type="email" placeholder="john@aims.agency" className="w-full rounded-full border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-amber-300 transition-all px-6 text-amber-50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-amber-100/40 px-4">Operational Country</label>
                <input type="text" placeholder="United States" className="w-full rounded-full border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-amber-300 transition-all px-6 text-amber-50" />
              </div>
            </div>
          </OnboardingShell>
        );
      case "goal":
        return (
          <OnboardingShell title="Mission Purpose" subtitle="Define the primary objective for your A.I.M.S. deployment.">
             <div className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-amber-100/40 px-4">Primary Goal</label>
                  <textarea
                    placeholder="e.g. Automate market research and containerize local data scrapers..."
                    className="w-full h-32 rounded-3xl border border-white/10 bg-black/40 p-4 text-sm outline-none focus:border-amber-300 transition-all text-amber-50 resize-none"
                  />
                </div>
                <p className="text-[10px] text-center text-amber-100/30">
                  This intent will be used by ACHEEVY to design your initial workflow.
                </p>
             </div>
          </OnboardingShell>
        );
      case "estimate":
        return (
          <OnboardingShell title="LUC Quote" subtitle="Real-time resource estimate for your selected mission parameters.">
             {estimateLoading ? (
               <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="h-8 w-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                  <p className="text-[10px] uppercase tracking-widest text-amber-100/40">Querying UEF Gateway...</p>
               </div>
             ) : (
               realEstimate && <LucEstimatePanel estimate={realEstimate} />
             )}
          </OnboardingShell>
        );
      case "finish":
        return (
          <OnboardingShell title="Ready" subtitle="ACHEEVY is primed and ready to orchestrate your tools.">
             <div className="flex flex-col items-center gap-6 py-6">
               <div className="h-24 w-24 rounded-full border-2 border-amber-300/20 bg-amber-400/10 flex items-center justify-center">
                  <img src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" className="h-14 w-14 object-contain" />
               </div>
               <p className="text-xs text-amber-100/40 text-center px-8">
                 By clicking Finish, you acknowledge the LUC resource rates. Your workspace will be provisioned instantly.
               </p>
             </div>
          </OnboardingShell>
        );
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <OnboardingStepper currentStep={step} />

      <div className="flex-1">
        {renderContent()}
      </div>

      <footer className="mt-12 flex justify-between">
        <button onClick={handleBack} className="text-xs font-semibold uppercase tracking-widest text-amber-100/40 hover:text-amber-100 transition-colors">
          {step === "profile" ? "Cancel" : "Back"}
        </button>
        <button onClick={handleNext} className="rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-black hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all">
          {step === "finish" ? "Launch Platform" : "Next"}
        </button>
      </footer>
    </div>
  );
}
