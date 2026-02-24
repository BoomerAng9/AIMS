'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  MapPin,
  Store,
  Star,
  ArrowRight,
  Sparkles,
  Users,
  BadgeCheck,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal, GlowBorder, ScrollProgress } from '@/components/motion';

/* ─── HalalHub Landing Page ────────────────────────────────────────────────
   AIMS Landing UI Archetype: Hero + Features + Trust + CTA
   Colors: Emerald primary, Gold accent, Slate neutrals on #F8FAFC base
   Mobile-first, single-column → 2-column hero from md up
   ──────────────────────────────────────────────────────────────────────── */

import { scrollTransition, stagger } from '@/lib/motion/tokens';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * stagger.normal, ...scrollTransition.reveal },
  }),
};

const CATEGORIES = [
  { name: 'Meat & Poultry', icon: '🥩', count: 240, color: 'bg-red-50 text-red-600' },
  { name: 'Groceries', icon: '🛒', count: 520, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Restaurants', icon: '🍽️', count: 180, color: 'bg-amber-50 text-amber-600' },
  { name: 'Catering', icon: '🎉', count: 95, color: 'bg-violet-50 text-violet-600' },
  { name: 'Bakery', icon: '🍞', count: 110, color: 'bg-orange-50 text-orange-600' },
  { name: 'Services', icon: '⭐', count: 75, color: 'bg-blue-50 text-blue-600' },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Verified Halal',
    desc: 'Every vendor verified with documentation. Certification badges displayed transparently.',
  },
  {
    icon: MapPin,
    title: 'Local First',
    desc: 'Discover halal businesses in your area. Support your local community.',
  },
  {
    icon: BadgeCheck,
    title: 'Escrow Protection',
    desc: 'Payments held securely until delivery is confirmed. Dispute resolution built in.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'Reviews from real customers. Barakat referral program rewards the community.',
  },
];

const STATS = [
  { value: '500+', label: 'Verified Vendors' },
  { value: '10K+', label: 'Products Listed' },
  { value: '50+', label: 'Cities Served' },
  { value: '4.8', label: 'Avg. Rating' },
];

export default function HalalHubLanding() {
  return (
    <div className="flex flex-col">
      <ScrollProgress color="bg-emerald-500" height={2} zIndex={60} />

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50/30" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20 lg:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            {/* Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trusted Halal Marketplace
                </span>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
              >
                Your local halal
                <span className="block text-emerald-600">marketplace.</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="max-w-lg text-lg text-slate-600 leading-relaxed"
              >
                Discover verified halal food, groceries, restaurants, and services
                in your community. Shop with confidence — every vendor is certified
                and every transaction is protected.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
                <GlowBorder theme="emerald" rounded="rounded-xl">
                  <Link
                    href="/halalhub/shop"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30"
                  >
                    Start Shopping
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </GlowBorder>
                <Link
                  href="/halalhub/(auth)/signup/vendor"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <Store className="h-4 w-4" />
                  Become a Vendor
                </Link>
              </motion.div>
              {/* Stats strip */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-4 flex flex-wrap gap-6"
              >
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-2xl shadow-emerald-600/10">
                <Image
                  src="/assets/halalhub_storefront.jpg"
                  alt="HalalHub — Verified halal marketplace"
                  fill
                  className="object-contain"
                  priority
                />
                {/* Floating badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 backdrop-blur-sm shadow-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">100% Verified</p>
                    <p className="text-[10px] text-slate-500">All vendors certified</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────── */}
      <section className="border-t border-slate-200/60 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Browse by Category
            </h2>
            <p className="mt-2 text-base text-slate-500">
              Find exactly what you need from verified halal vendors.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat, i) => (
              <ScrollReveal key={cat.name} speed="pop" delay={i * 0.05} distance={16}>
                <Link
                  href={`/halalhub/shop?category=${cat.name.toLowerCase()}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${cat.color}`}>
                    {cat.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                      {cat.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{cat.count} listings</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust & Safety ───────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Built on Trust
            </h2>
            <p className="mt-2 text-base text-slate-500">
              Every aspect of HalalHub is designed to protect buyers and sellers.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item, i) => (
              <ScrollReveal key={item.title} speed="pop" delay={i * 0.08} distance={16}>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="border-t border-slate-200/60 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How It Works
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Browse & Discover',
                desc: 'Search by category, location, or keyword. Filter by certification, rating, and delivery options.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Order with Confidence',
                desc: 'Add to cart and checkout securely. Payment is held in escrow until you confirm delivery.',
                icon: '🛒',
              },
              {
                step: '03',
                title: 'Enjoy & Review',
                desc: 'Receive your order, confirm delivery to release payment. Leave a review to help the community.',
                icon: '⭐',
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} speed="pop" delay={i * 0.1} distance={16}>
                <div className="relative flex flex-col items-center text-center">
                  <span className="text-4xl">{item.icon}</span>
                  <span className="mt-3 text-xs font-bold text-emerald-600 tracking-widest uppercase">
                    Step {item.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Vendor CTA ───────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 md:p-14">
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-emerald-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-60 w-60 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Grow Your Halal Business
                </h2>
                <p className="mt-3 text-base text-emerald-100 leading-relaxed">
                  Join HalalHub as a verified vendor. Reach thousands of customers in
                  your area, manage orders effortlessly, and grow with the Barakat
                  referral program.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/halalhub/(auth)/signup/vendor"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition-all hover:bg-emerald-50"
                  >
                    <Store className="h-4 w-4" />
                    Apply as Vendor
                  </Link>
                  <Link
                    href="/halalhub/shop?view=barakat"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500/20"
                  >
                    <Heart className="h-4 w-4" />
                    Barakat Program
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { icon: TrendingUp, label: '7% platform fee — lower than competitors' },
                  { icon: ShieldCheck, label: 'Escrow payments — guaranteed settlement' },
                  { icon: Star, label: 'Featured placement for premium vendors' },
                  { icon: Users, label: 'Barakat affiliate — earn from referrals' },
                ].map((perk) => (
                  <div key={perk.label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/30 text-white">
                      <perk.icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-emerald-50">{perk.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
