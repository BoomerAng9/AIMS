"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  const handleOAuthSignIn = async (provider: string) => {
    setError(null);
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError(`Failed to sign in with ${provider}`);
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setError(null);
    setIsLoading("credentials");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(null);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(null);
    }
  };

  const decodeError = (code: string | null) => {
    if (!code) return null;
    const map: Record<string, string> = {
      OAuthSignin: "OAuth sign-in failed",
      OAuthCallback: "Callback verification failed",
      CredentialsSignin: "Invalid email or password",
      Default: "Authentication error",
    };
    return map[code] || "An error occurred";
  };

  const activeError = error || decodeError(authError);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Sign in to A.I.M.S.</h1>
        <p className="mt-2 text-sm text-white/50">
          Your AI team is waiting
        </p>
      </div>

      {/* Error */}
      {activeError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {activeError}
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuthSignIn("google")}
          disabled={isLoading !== null}
          className="group relative flex w-full items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/90 hover:border-white/20 hover:bg-white/[0.07] transition-all disabled:opacity-50"
        >
          {isLoading === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <button
          onClick={() => handleOAuthSignIn("discord")}
          disabled={isLoading !== null}
          className="group relative flex w-full items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/90 hover:border-[#5865F2]/30 hover:bg-[#5865F2]/10 transition-all disabled:opacity-50"
        >
          {isLoading === "discord" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
          ) : (
            <>
              <svg
                className="w-4 h-4 text-[#5865F2]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
              </svg>
              Continue with Discord
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="divider flex-1" />
        <span className="text-[11px] uppercase tracking-widest text-white/25">
          or
        </span>
        <div className="divider flex-1" />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className="input-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-white/60">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-white/40 hover:text-gold transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading !== null}
          className="btn-primary w-full"
        >
          {isLoading === "credentials" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-white/40">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-gold hover:text-gold-light transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
