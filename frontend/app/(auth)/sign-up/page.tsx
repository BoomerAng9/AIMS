// frontend/app/(auth)/sign-up/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CountrySelect, StateSelect, CityInput, PostalCodeInput } from '@/components/form/RegionSelect';
import type { Country } from '@/lib/region/types';

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'business' | 'region'>('account');

  // Account details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Business details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Region details
  const [country, setCountry] = useState<Country | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && email && password) {
      setStep('business');
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName) {
      setStep('region');
    }
  };

  const handleRegionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (country) {
      // Navigate to onboarding
      router.push('/onboarding/welcome');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['account', 'business', 'region'].map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
            ${step === s
              ? 'bg-gold text-black'
              : ['account', 'business', 'region'].indexOf(step) > i
                ? 'bg-gold/30 text-gold'
                : 'bg-white/10 text-white/30'
            }
          `}>
            {i + 1}
          </div>
          {i < 2 && (
            <div className={`w-8 h-0.5 mx-1 ${
              ['account', 'business', 'region'].indexOf(step) > i
                ? 'bg-gold/30'
                : 'bg-white/10'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* LED dot-matrix heading */}
      <header className="text-center">
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold tracking-[0.15em] leading-tight text-white font-display uppercase">
          {step === 'account' && 'Create Your Account'}
          {step === 'business' && 'Your Business'}
          {step === 'region' && 'Your Location'}
        </h1>
        <p className="text-xs text-white/40 mt-2">
          {step === 'account' && 'Step 1: Personal details'}
          {step === 'business' && 'Step 2: Business information'}
          {step === 'region' && 'Step 3: Where are you based?'}
        </p>
      </header>

      {renderStepIndicator()}

      {/* Step 1: Account Details */}
      {step === 'account' && (
        <>
          {/* Social auth tiles */}
          <div className="flex justify-center gap-4">
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-gold/20 bg-white/5 backdrop-blur-md transition-all hover:border-gold/30 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <span className="text-2xl mb-1">G</span>
              <span className="text-[10px] text-white/50 font-medium">Google</span>
            </button>
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-gold/20 bg-white/5 backdrop-blur-md transition-all hover:border-gold/30 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <svg className="w-6 h-6 mb-1 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z" /></svg>
              <span className="text-[10px] text-white/50 font-medium">Telegram</span>
            </button>
            <button className="group flex flex-col items-center justify-center w-[88px] h-[88px] rounded-2xl border border-gold/20 bg-white/5 backdrop-blur-md transition-all hover:border-gold/30 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <svg className="w-6 h-6 mb-1 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              <span className="text-[10px] text-white/50 font-medium">Discord</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-white/30">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span>or register with email</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <form onSubmit={handleAccountSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-white/50">
                First Name
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all placeholder:text-white/15"
                  placeholder="Jane"
                  required
                />
              </label>
              <label className="block text-xs text-white/50">
                Last Name
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all placeholder:text-white/15"
                  placeholder="Doe"
                  required
                />
              </label>
            </div>
            <label className="block text-xs text-white/50">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all placeholder:text-white/15"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block text-xs text-white/50">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all placeholder:text-white/15"
                placeholder="Create a password"
                required
              />
            </label>

            <button
              type="submit"
              className="mt-4 flex items-center justify-center h-12 w-full rounded-full bg-gradient-to-r from-gold to-gold text-sm font-semibold text-black hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-shadow"
            >
              Continue
            </button>

            <p className="pt-2 text-center text-[0.8rem] text-white/50">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-gold hover:text-gold">
                Sign in
              </Link>
            </p>
          </form>
        </>
      )}

      {/* Step 2: Business Details */}
      {step === 'business' && (
        <form onSubmit={handleBusinessSubmit} className="space-y-4">
          <label className="block text-xs text-white/50">
            Business Name
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all placeholder:text-white/15"
              placeholder="Acme Corp"
              required
            />
          </label>

          <label className="block text-xs text-white/50">
            Business Type
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all"
            >
              <option value="" className="bg-black">Select a type...</option>
              <option value="startup" className="bg-black">Startup</option>
              <option value="smb" className="bg-black">Small/Medium Business</option>
              <option value="enterprise" className="bg-black">Enterprise</option>
              <option value="agency" className="bg-black">Agency</option>
              <option value="freelancer" className="bg-black">Freelancer / Solo</option>
              <option value="nonprofit" className="bg-black">Non-Profit</option>
              <option value="other" className="bg-black">Other</option>
            </select>
          </label>

          <label className="block text-xs text-white/50">
            What best describes your role?
            <select
              className="mt-1 h-11 w-full rounded-xl border border-wireframe-stroke bg-black/60 px-3 text-sm text-white outline-none focus:border-gold transition-all"
            >
              <option value="" className="bg-black">Select a role...</option>
              <option value="founder" className="bg-black">Founder / CEO</option>
              <option value="executive" className="bg-black">Executive / C-Suite</option>
              <option value="manager" className="bg-black">Manager / Team Lead</option>
              <option value="developer" className="bg-black">Developer / Engineer</option>
              <option value="designer" className="bg-black">Designer</option>
              <option value="marketer" className="bg-black">Marketing / Sales</option>
              <option value="operations" className="bg-black">Operations</option>
              <option value="other" className="bg-black">Other</option>
            </select>
          </label>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('account')}
              className="flex-1 h-12 rounded-full border border-gold/20 text-sm font-medium text-gold hover:bg-gold/10 transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-gold to-gold text-sm font-semibold text-black hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-shadow"
            >
              Continue
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Region Details */}
      {step === 'region' && (
        <form onSubmit={handleRegionSubmit} className="space-y-4">
          <div className="space-y-4">
            <CountrySelect
              value={country?.code}
              onChange={(c) => {
                setCountry(c);
                setState(null); // Reset state when country changes
              }}
              label="Country"
              placeholder="Start typing to search..."
            />

            {country && (country.code === 'US' || country.code === 'CA' || country.code === 'AU' || country.code === 'MX') && (
              <StateSelect
                countryCode={country.code}
                value={state ?? undefined}
                onChange={setState}
                label={country.code === 'CA' ? 'Province' : 'State'}
                placeholder={`Select ${country.code === 'CA' ? 'province' : 'state'}...`}
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
              countryCode={country?.code || 'US'}
              label={country?.code === 'US' ? 'ZIP Code' : 'Postal Code'}
            />
          </div>

          {/* Timezone display */}
          {country && (
            <div className="p-3 rounded-xl bg-white/5 border border-wireframe-stroke">
              <p className="text-xs text-white/50">
                <span className="text-white/30">Timezone:</span>{' '}
                <span className="text-white">{country.timezone}</span>
              </p>
              <p className="text-xs text-white/50 mt-1">
                <span className="text-white/30">Currency:</span>{' '}
                <span className="text-white">{country.currencySymbol} {country.currency}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('business')}
              className="flex-1 h-12 rounded-full border border-gold/20 text-sm font-medium text-gold hover:bg-gold/10 transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!country}
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-gold to-gold text-sm font-semibold text-black hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
