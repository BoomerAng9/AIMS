"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldOff, ArrowLeft, Lock } from "lucide-react";

/**
 * OwnerGate — blocks non-OWNER users from seeing children.
 * Renders children only if the current session user has role === 'OWNER'.
 * Shows a polished "Access Restricted" screen for unauthorized users.
 */
export default function OwnerGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Dev bypass — skip auth gate in local development
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
            <Lock className="absolute inset-0 m-auto h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
            Verifying access...
          </p>
        </motion.div>
      </div>
    );
  }

  const role = (session?.user as Record<string, unknown> | undefined)?.role;

  if (role !== "OWNER") {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[60vh] px-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="w-full max-w-md text-center">
          {/* Icon */}
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <ShieldOff className="h-9 w-9 text-slate-400" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <h2 className="text-xl font-display font-semibold text-slate-800 tracking-tight">
            Access Restricted
          </h2>

          {/* Description */}
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            This section is reserved for platform owners. If you believe this is
            an error, contact your administrator.
          </p>

          {/* Role badge */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span>Current role:</span>
            <span className="font-mono font-semibold text-slate-700 uppercase">
              {typeof role === "string" ? role : "GUEST"}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
            >
              Dashboard Home
            </button>
          </div>

          {/* Subtle divider */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-300 font-mono select-none">
              A.I.M.S.
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
