// frontend/app/(auth)/forgot-password/page.tsx
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.75rem] uppercase tracking-[0.2em] text-amber-200/70">
          Recovery
        </p>
        <h1 className="mt-1 text-[1.3rem] font-semibold tracking-[0.3em] text-amber-50 font-display">
          RESET PASSWORD
        </h1>
        <p className="mt-3 text-sm text-amber-100/80">
          Enter your email and we&apos;ll send you instructions to reset your password.
        </p>
      </header>

      <form className="space-y-4 mt-4">
        <label className="block text-xs text-amber-100/80">
          Email Address
          <input
            type="email"
            className="mt-1 h-10 w-full rounded-full border border-amber-50/25 bg-black/70 px-3 text-sm text-amber-50 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 transition-all placeholder:text-white/20"
            placeholder="you@example.com"
          />
        </label>

        <Link href="/sign-in"
          className="mt-2 flex items-center justify-center h-11 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-sm font-semibold text-black hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-shadow"
        >
          Send Reset Link
        </Link>

        <p className="pt-2 text-center text-[0.8rem] text-amber-100/75">
          Remember your password?{" "}
          <a href="/sign-in" className="text-amber-300 hover:text-amber-200">
            Back to Sign In
          </a>
        </p>
      </form>
    </div>
  );
}
