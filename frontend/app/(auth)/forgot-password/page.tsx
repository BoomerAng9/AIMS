"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reset link");
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-signal-green/20 bg-signal-green/10">
            <CheckCircle className="w-7 h-7 text-signal-green" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-2 text-sm text-white/50">
            If an account exists for <strong className="text-white/70">{email}</strong>,
            we&apos;ve sent password reset instructions.
          </p>
        </div>
        <Link href="/sign-in" className="btn-secondary w-full">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-white/50">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>

        <p className="text-center text-sm text-white/40">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-gold hover:text-gold-light transition-colors"
          >
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
