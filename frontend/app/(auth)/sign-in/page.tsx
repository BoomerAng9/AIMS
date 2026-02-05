import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 min-h-screen">
       <Card className="w-full max-w-[420px] auth-glass-card border-amber-500/20">
          <CardHeader className="text-center pb-2">
             <div className="mx-auto mb-4 relative h-16 w-16">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl"></div>
                 <img
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    className="relative h-full w-full object-contain"
                 />
             </div>
             <CardTitle className="text-3xl tracking-widest uppercase text-amber-100">A.I.M.S.</CardTitle>
             <CardDescription className="text-amber-100/60 uppercase tracking-widest text-xs mt-2">
                AI Managed Systems
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">Email Address</label>
                <Input placeholder="admin@plugmein.cloud" type="email" />
             </div>
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">Password</label>
                   <Link href="/auth/forgot-password" className="text-xs text-amber-500 hover:text-amber-400">Forgot?</Link>
                </div>
                <Input placeholder="••••••••" type="password" />
             </div>

             <Link href="/dashboard" className="block w-full">
                <Button variant="acheevy" className="w-full h-12 text-sm mt-4">
                   Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
             </Link>

             <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/50 px-2 text-zinc-500">Or continue with</span></div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Button variant="glass" className="w-full">Google</Button>
                <Button variant="glass" className="w-full">Telegram</Button>
             </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 pt-6">
             <p className="text-xs text-zinc-500">
                New here? <Link href="/onboarding" className="text-amber-500 hover:text-amber-400 font-medium">Create access ID</Link>
             </p>
          </CardFooter>
       </Card>
    </div>
  );
}
