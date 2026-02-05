'use client';

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Box, Cpu, Network, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Player } from "@remotion/player";
import { PortTransition } from "@/remotion/compositions/PortTransition";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function LandingPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <LogoWallBackground mode="hero">
      <SiteHeader />
      
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full pt-12 pb-24 md:pt-24 md:pb-32 lg:pt-32 lg:pb-40 text-center relative z-10">
           <div className="container px-4 md:px-6 flex flex-col items-center">
              
              {/* Status Badge */}
              <div className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400 mb-8 backdrop-blur-md">
                 <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                 System Online
              </div>
              
              {/* Showroom Visual */}
              <div className="relative w-full max-w-5xl aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-10 group">
                <Image 
                  src="/assets/acheevy_showroom_v5.png" 
                  alt="ACHEEVY Showroom - AI Managed Services" 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-left">
                  {/* Welcome Message - Frosty White */}
                  <p className="text-frosty-white text-lg md:text-xl tracking-wide mb-2">
                    Welcome to AI Managed Services
                  </p>
                  
                  {/* ACHEEVY Introduction - Permanent Marker */}
                  <h1 className="text-3xl md:text-5xl font-marker text-frosty-white drop-shadow-xl mb-3">
                    I am ACHEEVY!
                  </h1>
                  
                  {/* Dynamic Prompt - Permanent Marker + Gold */}
                  <p className="text-2xl md:text-3xl font-marker text-champagne drop-shadow-lg">
                    What will we Deploy today?
                  </p>
                  
                  {/* Motto */}
                  <p className="text-amber-400/70 text-sm md:text-base mt-4 italic">
                    Activity breeds Activity
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-4 min-[400px]:flex-row z-20">
                 <Link href="/chat">
                    <Button variant="acheevy" size="lg" className="h-12 px-8 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all">
                       Chat w/ACHEEVY <Bot className="ml-2 h-5 w-5" />
                    </Button>
                 </Link>
                 
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="glass" size="lg" className="h-12 px-8 flex items-center gap-2" onClick={() => setIsPlaying(true)}>
                        <Play className="h-4 w-4" /> View Operations
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[900px] p-0 bg-black/90 border-white/10 overflow-hidden">
                      <div className="aspect-video w-full">
                        <Player
                          component={PortTransition}
                          durationInFrames={300}
                          compositionWidth={1920}
                          compositionHeight={1080}
                          fps={30}
                          controls
                          autoPlay
                          loop
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      </div>
                    </DialogContent>
                 </Dialog>
              </div>
           </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t border-white/5 bg-black/40 backdrop-blur-md">
           <div className="container px-4 md:px-6">
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                 <Card className="bg-white/5 border-white/10 hover:border-amber-500/30 transition-all hover:-translate-y-1 duration-300">
                    <CardHeader>
                       <Network className="h-10 w-10 text-amber-400 mb-2" />
                       <CardTitle>Automation & Workflows</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-zinc-400">
                          Complex business logic automated behind the scenes. We route your requests to the best agents for the job.
                       </p>
                    </CardContent>
                 </Card>
                 
                 <Card className="bg-white/5 border-white/10 hover:border-amber-500/30 transition-all hover:-translate-y-1 duration-300">
                    <CardHeader>
                       <Box className="h-10 w-10 text-cyan-400 mb-2" />
                       <CardTitle>Containerized Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-zinc-400">
                          We wrap industry-standard open source software in secure, managed Docker containers deployed instantly.
                       </p>
                    </CardContent>
                 </Card>
                 
                 <Card className="bg-white/5 border-white/10 hover:border-amber-500/30 transition-all hover:-translate-y-1 duration-300">
                    <CardHeader>
                       <Cpu className="h-10 w-10 text-emerald-400 mb-2" />
                       <CardTitle>AI Orchestrator</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-zinc-400">
                          ACHEEVY is your single point of contact. Speak your intent, and the system builds the infrastructure.
                       </p>
                    </CardContent>
                 </Card>
              </div>
           </div>
        </section>
      </main>
    </LogoWallBackground>
  );
}
