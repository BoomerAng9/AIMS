"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invalid Reset Link</h1>
          <p className="mt-2 text-sm text-slate-500">
            This reset link is missing or invalid. Please request a new one.
          </p>
        </div>
        <Link href="/forgot-password" className="btn-primary w-full inline-block text-center">
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setIsReset(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isReset) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-signal-green/20 bg-signal-green/10">
            <CheckCircle className="w-7 h-7 text-signal-green" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Password Reset</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        <button
          onClick={() => router.push("/sign-in")}
          className="btn-primary w-full"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Set New Password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your new password below.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="input-label">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            placeholder="Re-enter your password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </button>

        <p className="text-center text-sm text-slate-400">
          <Link
            href="/sign-in"
            className="text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
