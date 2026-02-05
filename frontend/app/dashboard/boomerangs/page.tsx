"use client";

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, TrendingUp, Shield, Plus, Zap } from "lucide-react";

const BOOMER_ANGS = [
  {
    id: "cto-expert",
    name: "CTOExpert_Ang",
    role: "Technology PMO - Expert",
    specialty: "Architecture, Infrastructure, Code Quality",
    avatar: "🔧",
    status: "Active",
    tasksCompleted: 47,
    successRate: 98,
    color: "indigo",
  },
  {
    id: "cmo-mid",
    name: "CMOMid_Ang",
    role: "Marketing PMO - Mid",
    specialty: "Growth, Campaigns, Market Intelligence",
    avatar: "📈",
    status: "Active",
    tasksCompleted: 31,
    successRate: 94,
    color: "pink",
  },
  {
    id: "cdo-expert",
    name: "CDOExpert_Ang",
    role: "Design PMO - Expert",
    specialty: "UX, Brand Cohesion, Nano Banana Pro",
    avatar: "🎨",
    status: "Active",
    tasksCompleted: 28,
    successRate: 99,
    color: "purple",
  },
  {
    id: "bett-ann",
    name: "Bett-Ann_Ang",
    role: "Finance PMO - Manager",
    specialty: "LUC, Billing, Quota Management",
    avatar: "💼",
    status: "Active",
    tasksCompleted: 156,
    successRate: 100,
    color: "amber",
  },
];

export default function BoomerangsPage() {
  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-display text-white tracking-wide">Boomer_Ang Team</h1>
          <p className="text-zinc-400 text-sm">Your PMO agent roster - managed by ACHEEVY</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BOOMER_ANGS.map((ang) => (
            <Card key={ang.id} className={`border-${ang.color}-500/20 hover:bg-white/5 transition-all`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="text-4xl">{ang.avatar}</div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-500/20`}>
                    {ang.status}
                  </span>
                </div>
                <CardTitle className="mt-3 text-base">{ang.name}</CardTitle>
                <CardDescription>{ang.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-zinc-400">{ang.specialty}</p>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-lg font-bold text-white">{ang.tasksCompleted}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase">Tasks</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-lg font-bold text-white">{ang.successRate}%</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase">Success</div>
                  </div>
                </div>

                <Button variant="glass" size="sm" className="w-full text-xs">
                  View Activity
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Spawn New Card */}
          <Card className="border-dashed border-white/10 hover:border-amber-500/30 transition-all cursor-pointer group">
            <CardContent className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors mb-4">
                <Plus className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Spawn New Ang</h3>
              <p className="text-xs text-zinc-500">Add a specialist to your team</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </LogoWallBackground>
  );
}
