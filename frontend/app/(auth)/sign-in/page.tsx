// frontend/app/(auth)/sign-in/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SignInPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <div className="space-y-8">
      {/* Branded heading */}
      <header className="text-center">
        <h1 className="text-[2.5rem] md:text-[3rem] font-bold tracking-[0.2em] leading-tight text-amber-300 font-display uppercase">
          A.I.M.S.
        </h1>
        <p className="mt-2 text-[1rem] md:text-[1.2rem] tracking-[0.15em] text-amber-100/80 font-marker uppercase">
          AI MANAGED SOLUTIONS
        </p>
      </header>

      {!showEmailForm ? (
        <>
          {/* Social auth tiles — glass squares with icons */}
          <div className="flex justify-center gap-4">
            {/* Google */}
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/20 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <svg className="w-7 h-7 mb-1" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-[11px] text-amber-100/70 font-medium">Google</span>
            </button>

            {/* Telegram */}
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/20 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <svg className="w-7 h-7 mb-1 text-amber-50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z" />
              </svg>
              <span className="text-[11px] text-amber-100/70 font-medium">Telegram</span>
            </button>

            {/* Discord */}
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/20 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <svg className="w-7 h-7 mb-1 text-amber-50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
              </svg>
              <span className="text-[11px] text-amber-100/70 font-medium">Discord</span>
            </button>
          </div>

          {/* Email sign-in option */}
          <div className="flex flex-col items-center gap-5">
            <button
              onClick={() => setShowEmailForm(true)}
              className="rounded-full border border-amber-50/20 bg-white/5 px-8 py-3 text-sm text-amber-100/80 hover:bg-white/10 hover:border-amber-300/30 transition-all backdrop-blur-sm"
            >
              Or sign in with email
            </button>

            <Link
              href="/forgot-password"
              className="text-sm text-amber-100/60 hover:text-amber-300 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </>
      ) : (
        /* Email Form */
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-amber-100/50 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-300/20 text-amber-50 placeholder:text-amber-100/30 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/30 transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase tracking-widest text-amber-100/50">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] text-amber-300/70 hover:text-amber-300">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-300/20 text-amber-50 placeholder:text-amber-100/30 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/30 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="w-full py-3 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-100 font-medium uppercase tracking-wider hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2">
            Sign In
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button
            onClick={() => setShowEmailForm(false)}
            className="w-full text-center text-sm text-amber-100/50 hover:text-amber-300 transition-colors"
          >
            Back to social sign in
          </button>
        </div>
      )}

      {/* Create account link */}
      <div className="text-center pt-4">
        <span className="text-sm text-amber-100/50">New here? </span>
        <Link href="/sign-up" className="text-sm text-amber-300/80 hover:text-amber-300 italic">
          Create access ID
        </Link>
      </div>
    </div>
  );
}
