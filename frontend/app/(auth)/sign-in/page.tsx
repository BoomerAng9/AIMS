"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

type OAuthProviderInfo = {
  id: string;
  name: string;
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function useIsAIMSDomain(): boolean {
  const [isAIMS, setIsAIMS] = useState(false);
  useEffect(() => {
    setIsAIMS(window.location.hostname.includes('aimanagedsolutions'));
  }, []);
  return isAIMS;
}

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderInfo[]>([]);
  const isAIMSDomain = useIsAIMSDomain();

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  // Dynamically fetch available providers
  useEffect(() => {
    getProviders().then((providers) => {
      if (!providers) return;
      const oauth = Object.values(providers)
        .filter((p) => p.id !== "credentials")
        .map((p) => ({ id: p.id, name: p.name }));
      setOauthProviders(oauth);
    });
  }, []);

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
      OAuthSignin: "OAuth sign-in failed. Check that your OAuth provider is configured correctly.",
      OAuthCallback: "Callback verification failed. Try again.",
      OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
      CredentialsSignin: "Invalid email or password",
      Default: "Authentication error",
    };
    return map[code] || "An error occurred";
  };

  const activeError = error || decodeError(authError);

  // Provider icon/style mapping
  const providerStyles: Record<string, { icon: React.ReactNode; hoverClass: string }> = {
    google: {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          />
        </svg>
      ),
      hoverClass: "hover:bg-[#18181B] hover:border-white/15",
    },
    discord: {
      icon: (
        <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
        </svg>
      ),
      hoverClass: "hover:border-[#5865F2]/30 hover:bg-[#5865F2]/5",
    },
    github: {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
      hoverClass: "hover:bg-[#18181B] hover:border-white/15",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header — domain-aware */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-50">
          {isAIMSDomain ? 'A.I.M.S. Command Center' : 'Sign in to A.I.M.S.'}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {isAIMSDomain ? 'Owner & Admin access' : 'Your AI team is waiting'}
        </p>
      </div>

      {/* Error */}
      {activeError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {activeError}
        </div>
      )}

      {/* OAuth Buttons — only show providers that are actually registered */}
      {oauthProviders.length > 0 && (
        <>
          <div className="space-y-3">
            {oauthProviders.map((provider) => {
              const style = providerStyles[provider.id];
              return (
                <button
                  key={provider.id}
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={isLoading !== null}
                  className={`group relative flex w-full items-center justify-center gap-3 h-11 rounded-xl border border-white/8 bg-[#111113] text-sm text-zinc-300 transition-all disabled:opacity-50 ${style?.hoverClass || "hover:bg-[#18181B] hover:border-white/15"}`}
                >
                  {isLoading === provider.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  ) : (
                    <>
                      {style?.icon || null}
                      Continue with {provider.name}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-sm uppercase tracking-widest text-zinc-500">
              or
            </span>
            <div className="h-px flex-1 bg-white/8" />
          </div>
        </>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded-xl border border-white/8 bg-[#111113] px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 rounded-xl border border-white/8 bg-[#111113] px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading !== null}
          className="w-full h-11 rounded-xl bg-amber-500 text-black text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors disabled:opacity-50"
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
      <p className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
