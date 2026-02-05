"use client";

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle, Circle, Clock, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

const MISSIONS = [
  {
    id: "onboarding",
    title: "Complete Onboarding",
    description: "Finish your profile and business setup",
    status: "in-progress",
    progress: 60,
    steps: [
      { label: "Create account", done: true },
      { label: "Set business goals", done: true },
      { label: "Choose your mentor", done: true },
      { label: "Define 90-day plan", done: false },
      { label: "Launch first Plug", done: false },
    ],
  },
  {
    id: "first-build",
    title: "Build Your First Plug",
    description: "Create and deploy an aiPlug with ACHEEVY",
    status: "pending",
    progress: 0,
    steps: [
      { label: "Describe your idea", done: false },
      { label: "Review estimate", done: false },
      { label: "Approve build", done: false },
      { label: "Test Plug", done: false },
      { label: "Deploy to production", done: false },
    ],
  },
  {
    id: "team-setup",
    title: "Assemble Your Team",
    description: "Spawn and configure Boomer_Angs for your workflow",
    status: "pending",
    progress: 0,
    steps: [
      { label: "Review PMO structure", done: false },
      { label: "Assign departments", done: false },
      { label: "Set bench levels", done: false },
      { label: "Run first task", done: false },
    ],
  },
];

export default function PlanPage() {
  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-display text-white tracking-wide flex items-center gap-2">
              <Target className="h-6 w-6 text-amber-400" />
              Mission Plan
            </h1>
            <p className="text-zinc-400 text-sm">Your roadmap to success with ACHEEVY</p>
          </div>
          <Link href="/dashboard/chat">
            <Button variant="acheevy" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Start New Mission
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {MISSIONS.map((mission) => (
            <Card 
              key={mission.id} 
              className={`border-white/10 ${mission.status === 'in-progress' ? 'border-amber-500/30 bg-amber-950/5' : ''}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {mission.status === 'in-progress' ? (
                        <Clock className="h-5 w-5 text-amber-400" />
                      ) : mission.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-zinc-500" />
                      )}
                      {mission.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{mission.description}</CardDescription>
                  </div>
                  <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded-full ${
                    mission.status === 'in-progress' 
                      ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20'
                      : mission.status === 'completed'
                      ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-900/50 text-zinc-500 border border-zinc-700/30'
                  }`}>
                    {mission.status.replace('-', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Progress</span>
                    <span className="text-amber-400">{mission.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mission.steps.map((step, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        step.done ? 'bg-emerald-950/20' : 'bg-white/5'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${step.done ? 'text-emerald-300' : 'text-zinc-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action */}
                {mission.status === 'in-progress' && (
                  <Link href="/dashboard/chat">
                    <Button variant="outline" size="sm" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2">
                      Continue Mission
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </LogoWallBackground>
  );
}
