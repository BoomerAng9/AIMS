// frontend/app/(auth)/sign-up/page.tsx
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.75rem] uppercase tracking-[0.2em] text-amber-200/70">
          Get Started
        </p>
        <h1 className="mt-1 text-[1.3rem] font-semibold tracking-[0.3em] text-amber-50 font-display">
          CREATE YOUR ACCOUNT
        </h1>
        <p className="mt-3 text-sm text-amber-100/80">
          Join the Hybrid Business Architect platform and start building.
        </p>
      </header>

      {/* Social auth row */}
      <div className="flex gap-3">
        <button className="flex-1 rounded-full border border-amber-50/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-amber-50 hover:bg-white/20 transition-colors">
          Google
        </button>
        <button className="flex-1 rounded-full border border-amber-50/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-amber-50 hover:bg-white/20 transition-colors">
          Telegram
        </button>
        <button className="flex-1 rounded-full border border-amber-50/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-amber-50 hover:bg-white/20 transition-colors">
          WhatsApp
        </button>
      </div>

      <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-amber-100/60">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-50/40 to-transparent" />
        <span>or register with email</span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-50/40 to-transparent" />
      </div>

      <form className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-amber-100/80">
            First Name
            <input
                type="text"
                className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all placeholder:text-white/20"
                placeholder="Jane"
            />
            </label>
            <label className="block text-xs text-amber-100/80">
            Last Name
            <input
                type="text"
                className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all placeholder:text-white/20"
                placeholder="Doe"
            />
            </label>
        </div>
        
        <label className="block text-xs text-amber-100/80">
          Email
          <input
            type="email"
            className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all placeholder:text-white/20"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-xs text-amber-100/80">
          Password
          <input
            type="password"
            className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all"
            placeholder="Create a password"
          />
        </label>
         <label className="block text-xs text-amber-100/80">
          Role
          <input
            type="text"
            className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all placeholder:text-white/20"
            placeholder="e.g. Architect, Developer..."
          />
        </label>

        <Link href="/dashboard"
          className="mt-4 flex items-center justify-center h-11 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-sm font-semibold text-black hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-shadow"
        >
          Create Account
        </Link>

        <p className="pt-2 text-center text-[0.8rem] text-amber-100/75">
          Already have an account?{" "}
          <a href="/sign-in" className="text-amber-300 hover:text-amber-200">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
