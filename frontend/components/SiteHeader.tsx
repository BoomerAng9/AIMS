
import Link from 'next/link';
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link className="flex items-center gap-2 font-display uppercase tracking-wider text-amber-50" href="/">
           <img src="/images/acheevy/acheevy-helmet.png" className="h-8 w-8 rounded-full border border-amber-500/30" alt="Logo" />
           <span>A.I.M.S.</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
           <Link className="text-sm font-medium hover:text-amber-400 transition-colors text-white/70" href="/">
              Home
            </Link>
            <Link className="text-sm font-medium hover:text-amber-400 transition-colors text-white/70" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-sm font-medium hover:text-amber-400 transition-colors text-white/70" href="/plugs">
              Plugs
            </Link>
             <Link className="text-sm font-medium hover:text-amber-400 transition-colors text-white/70" href="/chat">
              Chat
            </Link>
             <Link className="text-sm font-medium hover:text-amber-400 transition-colors text-white/70" href="/integrations">
              Integrations
            </Link>
        </nav>
        <div className="ml-6 flex items-center gap-2">
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm" className="text-white/70">Sign In</Button>
            </Link>
            <Link href="/onboarding">
               <Button variant="acheevy" size="sm">Get Started</Button>
            </Link>
        </div>
      </div>
    </header>
  );
}
