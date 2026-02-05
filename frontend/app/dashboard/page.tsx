
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Bot, Database, FlaskConical, MessageSquare, Network, Server, Settings, Target, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      
      <main className="flex-1 container max-w-7xl py-8 px-4 md:px-6">
         {/* Welcome / Status Bar */}
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
               <h1 className="text-2xl font-display text-white tracking-wide">Command Center</h1>
               <p className="text-zinc-400 text-sm">Welcome back. Activity breeds Activity.</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-emerald-950/30 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Net-Ops: Online
               </span>
               <Link href="/dashboard/chat">
                   <Button variant="acheevy" size="sm">Open ACHEEVY</Button>
               </Link>
            </div>
         </div>

         {/* Plan & Usage */}
         <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="md:col-span-2 border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-transparent">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Zap className="text-amber-400 h-5 w-5" /> Current Plan: Pro Managed
                  </CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col sm:flex-row gap-6 justify-between items-center text-sm">
                  <div className="space-y-1">
                     <p className="text-zinc-400">Next Billing Cycle</p>
                     <p className="font-mono text-white">Feb 28, 2026</p>
                     <p className="text-xs text-zinc-500">Managed by Bett-Ann_Ang</p>
                  </div>
                  <div className="flex-1 w-full sm:mx-8 space-y-2">
                      <div className="flex justify-between text-xs uppercase tracking-wider text-zinc-500">
                         <span>Compute Units</span>
                         <span className="text-amber-400">74%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-amber-500 w-[74%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                      </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent border-white/10 hover:bg-white/5 text-xs uppercase tracking-wider">Manage</Button>
               </CardContent>
            </Card>

            <Card className="border-white/5">
                <CardHeader>
                   <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                   <Link href="/dashboard/settings">
                     <Button variant="glass" className="h-20 w-full flex flex-col gap-2 text-xs">
                         <Settings className="h-5 w-5 text-zinc-400" /> Settings
                     </Button>
                   </Link>
                   <Link href="/dashboard/plan">
                     <Button variant="glass" className="h-20 w-full flex flex-col gap-2 text-xs">
                         <Target className="h-5 w-5 text-amber-400" /> Plan
                     </Button>
                   </Link>
                </CardContent>
            </Card>
         </div>

         {/* Agent & Resources Grid */}
         <div className="space-y-6">
            <h2 className="text-lg font-display text-white/80 tracking-widest pl-1 border-l-2 border-amber-500">Mission Resources</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
               
               {/* ACHEEVY Card */}
               <Link href="/dashboard/chat">
                 <Card className="group hover:bg-amber-500/5 hover:border-amber-500/30 transition-all cursor-pointer">
                    <CardHeader>
                       <div className="flex justify-between items-start">
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20"><Bot className="h-6 w-6"/></div>
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                       </div>
                       <CardTitle className="mt-4 text-base">ACHEEVY</CardTitle>
                       <CardDescription>AI Orchestrator</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-zinc-500">Think It. Prompt It. Let ACHEEVY Deploy it!</p>
                    </CardContent>
                 </Card>
               </Link>

               {/* Boomer_Angs Card */}
               <Link href="/dashboard/boomerangs">
                 <Card className="group hover:bg-purple-500/5 hover:border-purple-500/30 transition-all cursor-pointer">
                    <CardHeader>
                       <div className="flex justify-between items-start">
                          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20"><Users className="h-6 w-6"/></div>
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                       </div>
                       <CardTitle className="mt-4 text-base">Boomer_Ang Team</CardTitle>
                       <CardDescription>PMO Agents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-white/5 rounded p-2">
                               <div className="text-lg font-bold text-white">6</div>
                               <div className="text-[9px] text-zinc-500 uppercase">Departments</div>
                            </div>
                            <div className="bg-white/5 rounded p-2">
                               <div className="text-lg font-bold text-white">18</div>
                               <div className="text-[9px] text-zinc-500 uppercase">Agents</div>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
               </Link>

               {/* Automation Card */}
               <Card className="group hover:bg-pink-500/5 transition-all">
                  <CardHeader>
                     <div className="flex justify-between items-start">
                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 border border-pink-500/20"><Network className="h-6 w-6"/></div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                     </div>
                     <CardTitle className="mt-4 text-base">Automation Engine</CardTitle>
                     <CardDescription>Workflow Orchestration</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-white/5 rounded p-2">
                             <div className="text-lg font-bold text-white">12</div>
                             <div className="text-[9px] text-zinc-500 uppercase">Active Flows</div>
                          </div>
                          <div className="bg-white/5 rounded p-2">
                             <div className="text-lg font-bold text-white">184</div>
                             <div className="text-[9px] text-zinc-500 uppercase">Execs</div>
                          </div>
                      </div>
                  </CardContent>
               </Card>

               {/* Lab Card */}
               <Link href="/dashboard/lab">
                 <Card className="group hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                    <CardHeader>
                       <div className="flex justify-between items-start">
                          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20"><FlaskConical className="h-6 w-6"/></div>
                          <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div>
                       </div>
                       <CardTitle className="mt-4 text-base">ACP Lab</CardTitle>
                       <CardDescription>Experimental</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-zinc-500">Test and debug ACP requests</p>
                    </CardContent>
                 </Card>
               </Link>

            </div>
         </div>

         {/* Infrastructure Status */}
         <div className="mt-8 space-y-6">
            <h2 className="text-lg font-display text-white/80 tracking-widest pl-1 border-l-2 border-blue-500">Infrastructure</h2>
            <div className="grid gap-4 md:grid-cols-3">
               
               {/* Compute Card */}
               <Card className="group hover:bg-white/5 transition-all">
                  <CardHeader className="pb-2">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Server className="h-4 w-4 text-indigo-400" />
                           <CardTitle className="text-sm">Compute Cluster</CardTitle>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-500"><span>CPU</span><span className="text-emerald-400">12%</span></div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[12%]"/></div>
                     </div>
                  </CardContent>
               </Card>

               {/* Storage Card */}
               <Card className="group hover:bg-white/5 transition-all">
                  <CardHeader className="pb-2">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Database className="h-4 w-4 text-blue-400" />
                           <CardTitle className="text-sm">Unified Storage</CardTitle>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                     </div>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-500"><span>Used</span><span className="text-blue-400">10.6 GB</span></div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[15%]"/></div>
                     </div>
                  </CardContent>
               </Card>

               {/* Activity Card */}
               <Card className="group hover:bg-white/5 transition-all">
                  <CardHeader className="pb-2">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Activity className="h-4 w-4 text-emerald-400" />
                           <CardTitle className="text-sm">Activity Log</CardTitle>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <div className="text-xs text-zinc-500 space-y-1">
                        <p>• CTOExpert_Ang completed build task</p>
                        <p>• Bett-Ann_Ang updated usage quota</p>
                     </div>
                  </CardContent>
               </Card>

            </div>
         </div>
      </main>
    </LogoWallBackground>
  );
}
