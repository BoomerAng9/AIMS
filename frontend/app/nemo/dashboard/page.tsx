"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Cpu, 
  Terminal, 
  Activity, 
  Box, 
  Zap, 
  RefreshCcw, 
  ChevronRight, 
  Lock,
  Search,
  Settings,
  Bell,
  LogOut,
  Container,
  Database,
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Nemo Dashboard - Private AI Control Center
 * Minimalist, dark, professional interface.
 */
export default function NemoDashboard() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "[system] initializing secure gateway v2.2.1...",
    "[gateway] tunnel established via ssh://31.97.133.29",
    "[status] scanning local sandbox cluster...",
    "[onboard] discovered sandbox 'my-assistant'",
    "[inference] nim cloud telemetry healthy",
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#000103] text-zinc-100 flex font-sans selection:bg-cyan-500/20">
      
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-white/5 bg-[#000103] flex flex-col items-center md:items-stretch py-6 px-4 gap-8">
        <div className="flex items-center gap-3 px-2">
           <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
             <Cpu className="w-4 h-4 text-cyan-400" />
           </div>
           <span className="hidden md:block text-xs font-black tracking-widest uppercase opacity-70">Control Hub</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {[
            { icon: Activity, label: "Real-time Ops", active: true },
            { icon: Box, label: "Sandboxes" },
            { icon: Terminal, label: "Remote CLI" },
            { icon: Database, label: "Context Store" },
            { icon: Shield, label: "Policies" },
            { icon: Globe, label: "API Mesh" },
          ].map((item, i) => (
             <button 
               key={i} 
               className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${item.active ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`}
             >
               <item.icon className={`w-4 h-4 ${item.active ? 'text-cyan-400' : 'group-hover:text-cyan-400'} transition-colors`} />
               <span className="hidden md:block text-xs font-semibold">{item.label}</span>
             </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-2">
           <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl hidden md:block">
              <p className="text-[10px] text-zinc-600 mb-2 uppercase font-bold">Secure Access</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-400">31.97.133.29</span>
              </div>
           </div>
           
           <button className="flex items-center gap-3 p-3 text-zinc-600 hover:text-red-400 transition-colors group">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block text-xs font-semibold">Inlet Exit</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#000103]/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight">Main Terminal</h2>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/[0.03] text-emerald-400 text-[10px] h-5">
              Live Link Optimized
            </Badge>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group hidden sm:block">
               <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search protocols..." 
                 className="bg-white/[0.02] border border-white/5 rounded-full h-8 pl-9 pr-4 text-xs w-48 transition-all focus:w-64 focus:outline-none focus:border-cyan-500/30"
               />
             </div>
             
             <button className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors">
               <Bell className="w-3.5 h-3.5 text-zinc-500" />
             </button>
             
             <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px] group">
                <div className="w-full h-full rounded-full bg-[#000103] flex items-center justify-center overflow-hidden">
                   <div className="text-[10px] font-black text-cyan-400">RJ</div>
                </div>
             </button>
          </div>
        </header>

        {/* Scrollable Layout */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8 custom-scrollbar">
          
          {/* Status Row */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { icon: Cpu, label: "Provisioned CPU", val: "v22.2.1", color: "text-cyan-400" },
               { icon: Container, label: "Active Sandboxes", val: "01", color: "text-indigo-400" },
               { icon: Zap, label: "NIM Telemetry", val: "Healthy", color: "text-emerald-400" },
               { icon: Activity, label: "Node Runtime", val: "v22.22.1", color: "text-zinc-400" },
             ].map((stat, i) => (
               <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">{stat.label}</p>
                    <p className="text-xl font-bold mt-1">{stat.val}</p>
                  </div>
                  <stat.icon className={`w-5 h-5 ${stat.color} opacity-40`} />
               </div>
             ))}
          </div>

          {/* Major Components */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
             {/* Sandbox Card */}
             <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 relative group hover:border-cyan-500/20 transition-all">
                <div className="absolute top-0 right-0 p-8">
                   <RefreshCcw className="w-4 h-4 text-zinc-700 hover:text-cyan-400 transition-all cursor-pointer" />
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                      <Box className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold">my-assistant</h3>
                      <p className="text-xs text-zinc-500">NVIDIA NemoClaw Default Sandbox</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
                   <div>
                      <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold">Initialized</span>
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Inference</p>
                      <span className="text-xs font-mono">llama-3.1-70b</span>
                   </div>
                   <div>
                      <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Port</p>
                      <span className="text-xs font-mono">18789</span>
                   </div>
                   <div>
                      <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Egress</p>
                      <span className="text-xs font-bold text-emerald-500">Secure</span>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <Button className="h-10 px-6 bg-white text-black text-xs font-bold hover:bg-zinc-200 rounded-xl gap-2 transition-all">
                      <Terminal className="w-3.5 h-3.5" />
                      Connect SSH
                   </Button>
                   <Button variant="outline" className="h-10 px-6 border-white/10 text-xs text-zinc-400 rounded-xl hover:text-white transition-all">
                      Logs Protocol
                   </Button>
                </div>
             </div>

             {/* Live Terminal */}
             <div className="rounded-3xl bg-[#030305] border border-white/5 flex flex-col h-[400px] shadow-2xl overflow-hidden group hover:border-cyan-500/20 transition-all">
                <div className="h-10 flex items-center px-6 justify-between bg-white/[0.02] shrink-0 border-b border-white/5">
                   <div className="flex gap-1.5 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                   </div>
                   <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      vps_root@srv1492108.hstgr.cloud
                   </div>
                   <div />
                </div>
                
                <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed overflow-y-auto custom-scrollbar bg-black/40">
                   {logs.map((log, i) => (
                      <div key={i} className="mb-1.5 flex gap-3">
                         <span className="text-zinc-700 select-none">[{i+1}]</span>
                         <span className={log.includes('error') ? 'text-red-400' : log.includes('[gateway]') ? 'text-cyan-400' : 'text-zinc-400'}>
                             {log}
                         </span>
                      </div>
                   ))}
                   <div className="flex gap-3">
                      <span className="text-cyan-400 select-none">❯</span>
                      <input 
                        type="text" 
                        autoFocus
                        className="bg-transparent border-none outline-none flex-1 text-cyan-500 caret-cyan-500"
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              const val = e.currentTarget.value;
                              if (!val) return;
                              setLogs([...logs, `❯ ${val}`]);
                              e.currentTarget.value = '';
                           }
                        }}
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Sidebar Modules */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
             
             {/* Account Info */}
             <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-black text-black">
                      RJ
                   </div>
                   <div>
                      <h4 className="font-bold">Jarrett r.</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Primary Admin</p>
                   </div>
                </div>
                <Button variant="outline" className="w-full h-10 border-white/10 text-[10px] text-zinc-500 uppercase tracking-widest font-bold hover:text-white rounded-xl">
                   Access Security Keys
                </Button>
             </div>

             {/* Recent Activity */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Global Telemetry</p>
                   <p className="text-[10px] text-cyan-400 hover:underline cursor-pointer">History</p>
                </div>
                
                <div className="flex flex-col gap-2">
                   {[
                     { label: "IP Mesh Sync", time: "2m ago", type: "system" },
                     { label: "NIM Key Verified", time: "14m ago", type: "security" },
                     { label: "Onboarded 'my-assistant'", time: "22m ago", type: "action" },
                     { label: "Gateway 18789 Listening", time: "28m ago", type: "system" },
                   ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-white/5 hover:bg-white/[0.02] transition-colors flex items-center justify-between group cursor-default">
                         <div className="flex items-center gap-3">
                            <div className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-cyan-400' : 'bg-zinc-700'}`} />
                            <p className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{item.label}</p>
                         </div>
                         <p className="text-[10px] text-zinc-600 font-mono tracking-tighter">{item.time}</p>
                      </div>
                   ))}
                </div>
             </div>

             {/* Policies */}
             <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/[0.03] to-indigo-500/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                   <Lock className="w-4 h-4 text-cyan-400" />
                   <h4 className="text-xs font-bold uppercase tracking-widest">Active Policies</h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                   Environment strictly isolated. No data egress to cloud providers without encryption.
                </p>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                   <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-bold">Strict Protocol v1</span>
                   </div>
                   <ChevronRight className="w-3 h-3 text-zinc-600" />
                </div>
             </div>
          </div>

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.2);
        }
      `}</style>
    </div>
  );
}
