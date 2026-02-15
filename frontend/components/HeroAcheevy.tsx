"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { heroStagger, heroItem } from "@/lib/motion";

export function HeroAcheevy() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 md:flex-row md:items-center">
      <motion.div
        variants={heroStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex-1 rounded-[40px] border border-wireframe-stroke bg-black/60 p-8 backdrop-blur-xl md:p-12 space-y-4"
      >
        <motion.p
          variants={heroItem}
          className="text-[0.7rem] uppercase tracking-[0.25em] text-gold/80 font-display"
        >
          AI MANAGED SOLUTIONS
        </motion.p>
        <motion.h1
          variants={heroItem}
          className="text-4xl font-semibold tracking-tight text-white md:text-5xl font-display leading-[1.1]"
        >
          Think it. Prompt it.
          <br />
          Let <span className="text-gold text-shadow-gold">ACHEEVY</span> build
          it.
        </motion.h1>
        <motion.p
          variants={heroItem}
          className="max-w-xl text-sm leading-relaxed text-muted"
        >
          Deploy Boomer_Angs, build aiPlugs, and manage your entire digital
          operation from one executive console — while you stay in the loop
          as the final approver.
        </motion.p>

        {/* Activity Breeds Activity — prominent */}
        <motion.p
          variants={heroItem}
          className="font-display text-2xl md:text-3xl uppercase tracking-[0.15em] text-gold text-shadow-gold pt-2"
        >
          Activity Breeds Activity
        </motion.p>

        <motion.div
          variants={heroItem}
          className="flex flex-wrap gap-3 pt-4"
        >
          <motion.div
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(212,168,67,0.25)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/dashboard/build"
              className="inline-flex rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black shadow-neon-gold transition-colors hover:bg-gold-light"
            >
              Start My Project
            </Link>
          </motion.div>
          <motion.div
            whileHover={{
              scale: 1.05,
              borderColor: "rgba(212,168,67,0.3)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/chat"
              className="inline-flex rounded-full border border-wireframe-stroke bg-white/5 px-6 py-3 text-sm text-white backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              Chat w/ACHEEVY
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="flex-1 flex justify-center"
      >
        <div className="relative group">
          {/* Subtle floor glow */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-gold/20 blur-[60px] rounded-full group-hover:bg-gold/30 transition-all duration-700" />

          <motion.img
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            src="/images/acheevy/acheevy-office-plug.png"
            alt="ACHEEVY holding an aiPlug cube"
            className="w-full max-w-[480px] drop-shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          />
        </div>
      </motion.div>
    </section>
  );
}
