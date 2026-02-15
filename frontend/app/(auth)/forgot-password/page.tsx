// frontend/app/(auth)/forgot-password/page.tsx
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      {/* LED dot-matrix heading */}
      <header className="text-center">
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold tracking-[0.15em] leading-tight text-white font-display uppercase">
          Reset
          <br />
          Password
        </h1>
        <p className="mt-4 text-sm text-white/50">
          Enter your email and we&apos;ll send you instructions to reset your password.
        </p>
      </header>

      <form className="space-y-4">
        <label className="block text-xs text-white/50">
          Email Address
          <input
            type="email"
            className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all placeholder:text-white/15"
            placeholder="you@example.com"
          />
        </label>

        <button
          type="submit"
          className="mt-4 flex items-center justify-center h-12 w-full rounded-full bg-gradient-to-r from-gold to-gold text-sm font-semibold text-black hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-shadow"
        >
          Send Reset Link
        </button>

        <p className="pt-2 text-center text-[0.8rem] text-white/50">
          Remember your password?{" "}
          <Link href="/sign-in" className="text-gold hover:text-gold">
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
