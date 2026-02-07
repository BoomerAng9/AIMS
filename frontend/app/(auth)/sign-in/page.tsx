// frontend/app/(auth)/sign-in/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials. Try Google sign-in or check your email/password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.75rem] uppercase tracking-[0.2em] text-amber-200/70">
          Welcome back
        </p>
        <h1 className="mt-1 text-[1.3rem] font-semibold tracking-[0.3em] text-amber-50 font-display">
          AI MANAGED SOLUTIONS
        </h1>
        <p className="mt-3 text-sm text-amber-100/80">
          Sign in to orchestrate ACHEEVY and your Boomer_Ang teams.
        </p>
      </header>

      {/* Social auth row */}
      <div className="flex gap-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex-1 rounded-full border border-amber-50/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-amber-50 hover:bg-white/20 transition-colors"
        >
          Google
        </button>
        <button className="flex-1 rounded-full border border-amber-50/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-amber-50 hover:bg-white/20 transition-colors opacity-50 cursor-not-allowed">
          Telegram
        </button>
        <button className="flex-1 rounded-full border border-amber-50/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-amber-50 hover:bg-white/20 transition-colors opacity-50 cursor-not-allowed">
          WhatsApp
        </button>
      </div>

      <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-amber-100/60">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-50/40 to-transparent" />
        <span>or sign in with email</span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-50/40 to-transparent" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleCredentialLogin} className="space-y-3">
        <label className="block text-xs text-amber-100/80">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all placeholder:text-white/20"
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="block text-xs text-amber-100/80">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all"
            placeholder="••••••••"
            required
          />
        </label>

        <div className="flex items-center justify-between pt-1 text-[0.75rem]">
          <a href="/forgot-password" className="text-amber-300 hover:text-amber-200">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center h-11 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-sm font-semibold text-black hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-shadow disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="pt-2 text-center text-[0.8rem] text-amber-100/75">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="text-amber-300 hover:text-amber-200">
            Create one
          </a>
        </p>
      </form>
    </div>
  );
}
