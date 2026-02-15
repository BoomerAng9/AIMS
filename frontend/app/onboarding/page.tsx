"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeUp } from "@/lib/motion";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Mail, Flag, Target } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <LogoWallBackground mode="form">
      {/* Nav */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-0 left-0 p-6 z-20 flex items-center gap-4"
      >
        <Link href="/auth/sign-in" className="text-white/40 hover:text-gold transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <Link href="/" className="font-display text-white uppercase tracking-widest hover:text-gold transition-colors">
          A.I.M.S. Home
        </Link>
      </motion.div>

      <div className="flex flex-1 items-center justify-center p-4 relative">
        {/* Wireframe Room Effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,168,67,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            perspective: "1000px",
            transform: "rotateX(20deg) scale(1.1)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl"
        >
          <Card className="rounded-2xl border border-wireframe-stroke bg-black/60 backdrop-blur-xl shadow-[0_0_80px_rgba(212,168,67,0.08)]">
            <CardHeader>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                <motion.div variants={staggerItem} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gold/20 flex items-center justify-center text-gold font-bold border border-gold/30">
                    1
                  </div>
                  <h2 className="text-sm font-mono text-gold/80 uppercase tracking-widest">
                    New Operator Identification
                  </h2>
                </motion.div>
                <motion.div variants={staggerItem}>
                  <CardTitle className="text-3xl font-display text-white">
                    Initialize Your Profile
                  </CardTitle>
                </motion.div>
                <motion.div variants={staggerItem}>
                  <CardDescription className="text-white/40">
                    ACHEEVY needs basic parameters to calibrate your dashboard.
                  </CardDescription>
                </motion.div>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid gap-6"
              >
                <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                      <User className="h-3 w-3 text-gold/60" /> Full Name
                    </label>
                    <Input
                      placeholder="John Doe"
                      className="border-wireframe-stroke bg-white/5 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                      <Mail className="h-3 w-3 text-gold/60" /> Email Link
                    </label>
                    <Input
                      placeholder="john@example.com"
                      disabled
                      value="admin@plugmein.cloud"
                      className="opacity-50 border-wireframe-stroke bg-white/5"
                    />
                  </div>
                </motion.div>

                <motion.div variants={staggerItem} className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                    <Flag className="h-3 w-3 text-gold/60" /> Region / Country
                  </label>
                  <Input
                    placeholder="United States"
                    className="border-wireframe-stroke bg-white/5 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </motion.div>

                <motion.div variants={staggerItem} className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                    <Target className="h-3 w-3 text-gold/60" /> Primary Objective
                  </label>
                  <select
                    aria-label="Primary Objective"
                    className="flex h-11 w-full rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2 text-sm text-white focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                  >
                    <option>Deploying internal tools</option>
                    <option>Managed AI Hosting</option>
                    <option>Reselling A.I.M.S. infrastructure</option>
                    <option>Just exploring</option>
                  </select>
                </motion.div>

                <motion.div variants={staggerItem} className="pt-4 flex justify-end">
                  <Link href="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Button className="px-8 bg-gold hover:bg-gold-light text-black font-semibold shadow-[0_0_30px_rgba(212,168,67,0.3)] border border-gold/30 transition-all">
                        Initialize Dashboard
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </LogoWallBackground>
  );
}
