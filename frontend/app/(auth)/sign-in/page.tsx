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

            {/* WhatsApp */}
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/20 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <svg className="w-7 h-7 mb-1 text-amber-50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-[11px] text-amber-100/70 font-medium">WhatsApp</span>
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
