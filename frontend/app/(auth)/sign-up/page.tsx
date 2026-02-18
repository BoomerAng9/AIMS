"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import {
  CountrySelect,
  StateSelect,
  CityInput,
  PostalCodeInput,
} from "@/components/form/RegionSelect";
import type { Country } from "@/lib/region/types";

type Step = "account" | "business" | "region";
const STEPS: Step[] = ["account", "business", "region"];

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Business
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Region
  const [country, setCountry] = useState<Country | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const currentStepIndex = STEPS.indexOf(step);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && email && password) setStep("business");
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName) setStep("region");
  };

  const handleRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          businessName,
          businessType,
          country: country.code,
          state,
          city,
          postalCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) throw new Error(signInRes.error);
      router.push("/onboarding/welcome");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">
          {step === "account" && "Create your account"}
          {step === "business" && "About your business"}
          {step === "region" && "Where are you based?"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {step === "account" && "Step 1 of 3 — Personal details"}
          {step === "business" && "Step 2 of 3 — Business information"}
          {step === "region" && "Step 3 of 3 — Location"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                ${
                  step === s
                    ? "bg-gold text-black"
                    : currentStepIndex > i
                    ? "bg-gold/25 text-gold"
                    : "bg-white/8 text-white/30"
                }
              `}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-8 h-0.5 mx-1 transition-colors ${
                  currentStepIndex > i ? "bg-gold/30" : "bg-white/8"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Step 1: Account */}
      {step === "account" && (
        <>
          {/* Social sign-in */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleSocialSignIn("google")}
              className="flex flex-col items-center justify-center w-24 h-20 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-5 h-5 mb-1.5 text-white/70" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                />
              </svg>
              <span className="text-[10px] text-white/40">Google</span>
            </button>
            <button
              onClick={() => handleSocialSignIn("discord")}
              className="flex flex-col items-center justify-center w-24 h-20 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#5865F2]/30 hover:bg-[#5865F2]/10 transition-all"
            >
              <svg
                className="w-5 h-5 mb-1.5 text-[#5865F2]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="text-[10px] text-white/40">Discord</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="divider flex-1" />
            <span className="text-[11px] uppercase tracking-widest text-white/25">
              or register with email
            </span>
            <div className="divider flex-1" />
          </div>

          <form onSubmit={handleAccountSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Create a password"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2">
              Continue
            </button>

            <p className="text-center text-sm text-white/40 pt-1">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-gold hover:text-gold-light transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </>
      )}

      {/* Step 2: Business */}
      {step === "business" && (
        <form onSubmit={handleBusinessSubmit} className="space-y-4">
          <div>
            <label className="input-label">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input-field"
              placeholder="Acme Corp"
              required
            />
          </div>

          <div>
            <label className="input-label">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="input-field"
            >
              <option value="">Select a type...</option>
              <option value="startup">Startup</option>
              <option value="smb">Small/Medium Business</option>
              <option value="enterprise">Enterprise</option>
              <option value="agency">Agency</option>
              <option value="freelancer">Freelancer / Solo</option>
              <option value="nonprofit">Non-Profit</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="input-label">Your Role</label>
            <select className="input-field">
              <option value="">Select a role...</option>
              <option value="founder">Founder / CEO</option>
              <option value="executive">Executive / C-Suite</option>
              <option value="manager">Manager / Team Lead</option>
              <option value="developer">Developer / Engineer</option>
              <option value="designer">Designer</option>
              <option value="marketer">Marketing / Sales</option>
              <option value="operations">Operations</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("account")}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button type="submit" className="btn-primary flex-1">
              Continue
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Region */}
      {step === "region" && (
        <form onSubmit={handleRegionSubmit} className="space-y-4">
          <CountrySelect
            value={country?.code}
            onChange={(c) => {
              setCountry(c);
              setState(null);
            }}
            label="Country"
            placeholder="Start typing to search..."
          />

          {country &&
            ["US", "CA", "AU", "MX"].includes(country.code) && (
              <StateSelect
                countryCode={country.code}
                value={state ?? undefined}
                onChange={setState}
                label={country.code === "CA" ? "Province" : "State"}
                placeholder={`Select ${
                  country.code === "CA" ? "province" : "state"
                }...`}
              />
            )}

          <CityInput
            value={city}
            onChange={setCity}
            label="City"
            placeholder="Enter your city"
          />

          <PostalCodeInput
            value={postalCode}
            onChange={setPostalCode}
            countryCode={country?.code || "US"}
            label={country?.code === "US" ? "ZIP Code" : "Postal Code"}
          />

          {country && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <p className="text-xs text-white/50">
                <span className="text-white/30">Timezone:</span>{" "}
                <span className="text-white/80">{country.timezone}</span>
              </p>
              <p className="text-xs text-white/50 mt-1">
                <span className="text-white/30">Currency:</span>{" "}
                <span className="text-white/80">
                  {country.currencySymbol} {country.currency}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("business")}
              disabled={isLoading}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!country || isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
