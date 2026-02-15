'use client';

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewLandingPage() {
  return (
    <LogoWallBackground mode="hero">
      <SiteHeader />
      
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full pt-12 pb-24 text-center relative z-10">
           <div className="container px-4 md:px-6 flex flex-col items-center">
              
              <div className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-sm font-medium text-gold mb-8 backdrop-blur-md">
                 <span className="flex h-2 w-2 rounded-full bg-gold mr-2 animate-pulse"></span>
                 System Online
              </div>
              
              <div className="relative w-full max-w-6xl aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-wireframe-stroke mb-10">
                <Image 
                  src="/assets/acheevy_showroom_v5.png" 
                  alt="ACHEEVY Showroom - AI Managed Services" 
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="flex flex-col gap-4 min-[400px]:flex-row z-20">
                 <Link href="/chat">
                    <Button variant="acheevy" size="lg" className="h-12 px-8">
                       Chat with ACHEEVY <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={20} height={20} className="ml-2 h-5 w-5 rounded-full object-cover" />
                    </Button>
                 </Link>
              </div>
           </div>
        </section>
      </main>
    </LogoWallBackground>
  );
}
