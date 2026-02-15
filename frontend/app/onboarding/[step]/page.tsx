// frontend/app/onboarding/[step]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { LucEstimatePanel } from "@/components/luc/LucEstimatePanel";
import { getLucEstimateStub } from "@/lib/luc/luc.stub";

const STEPS = ["profile", "goal", "estimate", "finish"] as const;

export default function OnboardingStepPage() {
  const params = useParams();
  const router = useRouter();
  const step = params.step as typeof STEPS[number];

  if (!STEPS.includes(step)) {
    return <div>Invalid step</div>;
  }

  const nextStep = STEPS[STEPS.indexOf(step) + 1];
  const prevStep = STEPS[STEPS.indexOf(step) - 1];

  const handleNext = () => {
    if (nextStep) {
      router.push(`/onboarding/${nextStep}`);
    } else {
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
          <OnboardingShell title="Identity" subtitle="Who are we building for? This helps ACHEEVY tune the architectural tone.">
            <div className="space-y-4 max-w-sm mx-auto">
              <input type="text" placeholder="Workspace Name" className="w-full rounded-full border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-gold transition-all px-6" />
              <select className="w-full rounded-full border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-gold transition-all px-6">
                <option>Solopreneur / Founder</option>
                <option>SME / Agency</option>
                <option>Enterprise Architect</option>
              </select>
            </div>
          </OnboardingShell>
        );
      case "goal":
        return (
          <OnboardingShell title="Objective" subtitle="What is the primary mission for this hybrid workspace?">
             <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
               {["Automated Outreach", "Full-Stack Deployment", "Data Orchestration", "Customer Success Agents"].map(g => (
                 <button key={g} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-left text-sm hover:border-gold/30 hover:bg-white/10 transition-all">
                   {g}
                 </button>
               ))}
             </div>
          </OnboardingShell>
        );
      case "estimate":
        return (
          <OnboardingShell title="LUC Quote" subtitle="Real-time resource estimate for your selected mission parameters.">
             <LucEstimatePanel estimate={getLucEstimateStub()} />
          </OnboardingShell>
        );
      case "finish":
        return (
          <OnboardingShell title="Ready" subtitle="ACHEEVY is primed. Your Boomer_Ang team is in standby.">
             <div className="flex flex-col items-center gap-6 py-6">
               <div className="h-24 w-24 rounded-full border-2 border-gold/20 bg-gold/10 flex items-center justify-center animate-pulse">
                  <span className="text-3xl text-gold">🛡️</span>
               </div>
               <p className="text-xs text-white/30 text-center px-8">
                 By clicking Finish, you acknowledge the LUC resource rates. Your obsidian-grade workspace will be provisioned instantly.
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
        <button onClick={handleBack} className="text-xs font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
          {step === "profile" ? "Cancel" : "Back"}
        </button>
        <button onClick={handleNext} className="rounded-full bg-gold px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-black hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all">
          {step === "finish" ? "Commission Platform" : "Next"}
        </button>
      </footer>
    </div>
  );
}
