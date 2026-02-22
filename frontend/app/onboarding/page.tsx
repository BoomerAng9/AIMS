"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Mail, Flag, Target, Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const OBJECTIVES = [
  "Deploying internal tools",
  "Managed AI Hosting",
  "Reselling A.I.M.S. infrastructure",
  "Building AI agents & workflows",
  "Just exploring",
] as const;

const INDUSTRIES = [
  "Technology / SaaS",
  "Marketing / Agency",
  "Finance / Fintech",
  "Healthcare",
  "Education",
  "Real Estate",
  "Sports / Entertainment",
  "E-commerce / Retail",
  "Other",
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState("");
  const [objective, setObjective] = useState(OBJECTIVES[0]);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          region: region.trim() || "Not specified",
          objective,
          industry,
          companyName: companyName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save profile. Proceeding anyway.");
        // Still navigate — onboarding is best-effort
      }

      // Move to step 2 briefly to show success, then redirect
      setStep(2);
      setTimeout(() => router.push("/dashboard/acheevy"), 1500);
    } catch {
      // Non-blocking — proceed even if API fails
      setStep(2);
      setTimeout(() => router.push("/dashboard/acheevy"), 1500);
    } finally {
      setSubmitting(false);
    }
  };

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
          {step === 1 ? (
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
                      ACHEEVY needs basic parameters to calibrate your dashboard and recommend the right tools.
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
                        <User className="h-3 w-3 text-gold/60" /> Full Name *
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border-wireframe-stroke bg-white/5 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                        <Briefcase className="h-3 w-3 text-gold/60" /> Company (optional)
                      </label>
                      <Input
                        placeholder="Acme Inc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="border-wireframe-stroke bg-white/5 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                      <Flag className="h-3 w-3 text-gold/60" /> Region / Country
                    </label>
                    <Input
                      placeholder="United States"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="border-wireframe-stroke bg-white/5 focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                    />
                  </motion.div>

                  <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                        <Target className="h-3 w-3 text-gold/60" /> Primary Objective
                      </label>
                      <select
                        aria-label="Primary Objective"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2 text-sm text-white focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                      >
                        {OBJECTIVES.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-white/30 flex items-center gap-2 font-mono">
                        <Mail className="h-3 w-3 text-gold/60" /> Industry
                      </label>
                      <select
                        aria-label="Industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2 text-sm text-white focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none transition-all"
                      >
                        {INDUSTRIES.map((i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>

                  {error && (
                    <motion.p variants={staggerItem} className="text-red-400 text-sm">
                      {error}
                    </motion.p>
                  )}

                  <motion.div variants={staggerItem} className="pt-4 flex justify-end">
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 bg-gold hover:bg-gold-light text-black font-semibold shadow-[0_0_30px_rgba(212,168,67,0.3)] border border-gold/30 transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
                        ) : (
                          "Initialize Dashboard"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-gold/30 bg-black/60 backdrop-blur-xl shadow-[0_0_80px_rgba(212,168,67,0.15)]">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-gold" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-display text-white"
                >
                  Welcome, {fullName.split(" ")[0]}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/40 text-sm"
                >
                  Calibrating your ACHEEVY instance...
                </motion.p>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
                  className="h-1 bg-gradient-to-r from-gold/50 to-gold rounded-full max-w-xs"
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </LogoWallBackground>
  );
}
