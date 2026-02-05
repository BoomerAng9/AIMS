
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Mail, Flag } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <LogoWallBackground mode="form">
       {/* Nav */}
       <div className="absolute top-0 left-0 p-6 z-20 flex items-center gap-4">
          <Link href="/auth/sign-in" className="text-zinc-400 hover:text-white transition-colors">
             <ArrowLeft className="h-6 w-6" />
          </Link>
          <Link href="/" className="font-display text-amber-50 uppercase tracking-widest">A.I.M.S. Home</Link>
       </div>

       <div className="flex flex-1 items-center justify-center p-4 relative">
          {/* Wireframe Room Effect (Visual Only) */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
              style={{ 
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  perspective: "1000px",
                  transform: "rotateX(20deg) scale(1.1)"
              }}>
          </div>

          <Card className="w-full max-w-2xl auth-glass-card border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.1)] relative z-10 animate-float">
             <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-8 w-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/30">1</div>
                   <h2 className="text-sm font-mono text-cyan-300 uppercase tracking-widest">New Operator Identification</h2>
                </div>
                <CardTitle className="text-3xl font-display text-white">Initialize Your Profile</CardTitle>
                <CardDescription>
                   ACHEEVY needs basic parameters to calibrate your dashboard.
                </CardDescription>
             </CardHeader>
             <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <User className="h-3 w-3" /> Full Name
                      </label>
                      <Input placeholder="John Doe" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Mail className="h-3 w-3" /> Email Link
                      </label>
                      <Input placeholder="john@example.com" disabled value="admin@plugmein.cloud" className="opacity-50" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                     <Flag className="h-3 w-3" /> Region / Country
                   </label>
                   <Input placeholder="United States" />
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">Primary Objective</label>
                   <select className="flex h-11 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-amber-50 focus:ring-2 focus:ring-cyan-500/50 outline-none">
                      <option>Deploying internal tools</option>
                      <option>Managed AI Hosting</option>
                      <option>Reselling A.I.M.S. infrastructure</option>
                      <option>Just exploring</option>
                   </select>
                </div>

                <div className="pt-4 flex justify-end">
                   <Link href="/dashboard">
                      <Button variant="acheevy" className="px-8 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] border-cyan-300/20 text-black">
                         Initialize Dashboard
                      </Button>
                   </Link>
                </div>
             </CardContent>
          </Card>
       </div>
    </LogoWallBackground>
  );
}
