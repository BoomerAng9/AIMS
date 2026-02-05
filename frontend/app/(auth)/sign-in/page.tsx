// frontend/app/(auth)/sign-in/page.tsx
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="space-y-8">
      {/* LED dot-matrix heading */}
      <header className="text-center">
        <h1 className="text-[2rem] md:text-[2.5rem] font-bold tracking-[0.2em] leading-tight text-amber-50 font-display uppercase">
          A.I.M.S.
        </h1>
        <p className="mt-2 text-[0.7rem] md:text-[0.8rem] tracking-[0.25em] text-amber-100/70 uppercase">
          AI Managed Solutions
        </p>
      </header>

      {/* Social auth tiles — glass squares with icons */}
      <div className="flex justify-center gap-4">
        <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/15 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
          <span className="text-2xl mb-1">G</span>
          <span className="text-[10px] text-amber-100/60 font-medium">Google</span>
        </button>
        <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/15 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
          <svg className="w-6 h-6 mb-1 text-amber-50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z" /></svg>
          <span className="text-[10px] text-amber-100/60 font-medium">Telegram</span>
        </button>
        <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-amber-300/15 bg-white/5 backdrop-blur-md transition-all hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
          <svg className="w-6 h-6 mb-1 text-amber-50" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
          <span className="text-[10px] text-amber-100/60 font-medium">Discord</span>
        </button>
      </div>

      {/* Email sign-in option */}
      <div className="flex flex-col items-center gap-6">
        <Link
          href="/sign-in?method=email"
          className="rounded-full border border-amber-50/20 bg-white/5 px-8 py-3 text-sm text-amber-100/80 hover:bg-white/10 hover:border-amber-300/30 transition-all backdrop-blur-sm"
        >
          Or sign in with email
        </Link>

        <Link
          href="/forgot-password"
          className="text-sm text-amber-100/60 hover:text-amber-300 transition-colors"
        >
          Forgot Password?
        </Link>
      </div>
    </div>
  );
}
