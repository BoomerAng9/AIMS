// frontend/components/DelayedSignUpModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { scaleFade } from "@/lib/motion/variants";

const DELAY_MS = 30_000; // 30 seconds
const STORAGE_KEY = "aims_signup_dismissed";

export function DelayedSignUpModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="relative w-full max-w-md wireframe-card bg-[#0A0A0A] px-8 py-10 text-center">
              {/* Gold accent line at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

              {/* Dismiss button */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <Sparkles className="h-6 w-6 text-gold" />
              </div>

              {/* Heading */}
              <h2 className="font-display text-xl uppercase tracking-wider text-white mb-2">
                Join A.I.M.S.
              </h2>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                Create your A.I.M.S. account and let ACHEEVY orchestrate your
                entire digital operation — from build to deploy.
              </p>

              {/* CTA */}
              <Link
                href="/sign-up"
                onClick={dismiss}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold-light"
              >
                <Sparkles className="h-4 w-4" />
                Create your A.I.M.S. account
              </Link>

              {/* Skip */}
              <button
                onClick={dismiss}
                className="mt-4 block w-full text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Continue browsing
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
