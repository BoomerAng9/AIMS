'use client';

import React from 'react';
import Link from 'next/link';
import {
  Store,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── HalalHub Vendor Signup ───────────────────────────────────────────────
   Multi-section form for vendor onboarding.
   AIMS Auth Archetype: Glass card, centered, mobile-first.
   ──────────────────────────────────────────────────────────────────────── */

const TIERS = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    desc: 'Get started with basic listings',
    features: ['Up to 10 products', 'Basic analytics', 'Standard support'],
    popular: false,
  },
  {
    name: 'Basic',
    price: '$29',
    period: '/mo',
    desc: 'Grow your halal business',
    features: ['Up to 50 products', 'Priority placement', 'Advanced analytics', 'Priority support'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '$79',
    period: '/mo',
    desc: 'Scale with premium features',
    features: ['Unlimited products', 'Featured vendor badge', 'Custom storefront', 'Dedicated support', 'Barakat boost'],
    popular: false,
  },
];

export default function VendorSignup() {
  const [step, setStep] = React.useState(1);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-200/50">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Become a Vendor</h1>
            <p className="mt-1 text-sm text-slate-500">
              Join HalalHub and reach thousands of customers
            </p>
          </div>

          {/* Progress */}
          <div className="mt-6 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Step {step} of 3 — {step === 1 ? 'Account' : step === 2 ? 'Business' : 'Plan'}
          </p>

          {/* Step 1: Account */}
          {step === 1 && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              {/* Role toggle */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <Link
                  href="/halalhub/(auth)/signup/customer"
                  className="flex-1 rounded-lg py-2 text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                  Customer
                </Link>
                <div className="flex-1 rounded-lg bg-emerald-600 py-2 text-center text-sm font-semibold text-white">
                  Vendor
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="vendor@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(3);
              }}
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Business Name</label>
                <input
                  type="text"
                  placeholder="Your business name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Business Category</label>
                <select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20">
                  <option value="">Select category</option>
                  <option>Meat & Poultry</option>
                  <option>Groceries</option>
                  <option>Restaurant</option>
                  <option>Catering</option>
                  <option>Bakery</option>
                  <option>Services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Business Address</label>
                <div className="relative mt-1.5">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="123 Main St, City, State ZIP"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Tell customers about your business..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none resize-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Halal Certification Document
                </label>
                <div className="mt-1.5 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition-colors hover:border-emerald-300">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">
                      Drop your certification here or{' '}
                      <span className="font-medium text-emerald-600">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {TIERS.map((tier) => (
                  <button
                    key={tier.name}
                    className={`relative rounded-2xl border p-5 text-left transition-all hover:shadow-lg ${
                      tier.popular
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-600/10'
                        : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        Popular
                      </span>
                    )}
                    <p className="text-sm font-semibold text-slate-900">{tier.name}</p>
                    <div className="mt-2 flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold text-slate-900">{tier.price}</span>
                      <span className="text-sm text-slate-500">{tier.period}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{tier.desc}</p>
                    <ul className="mt-3 space-y-1.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <ShieldCheck className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/60 p-3">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  All plans include escrow payment protection, halal certification display,
                  and access to the Barakat referral program. You can upgrade or downgrade anytime.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  Submit Application
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center text-xs text-slate-400">
                Applications are reviewed within 24-48 hours. You&apos;ll receive an email once approved.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
