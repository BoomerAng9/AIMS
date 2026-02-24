"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, Truck, Store, Star, Search, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { name: "Meat & Poultry", slug: "meat-poultry", icon: "\u{1F969}", count: "200+ products" },
  { name: "Pantry & Spices", slug: "pantry", icon: "\u{1FAD9}", count: "350+ products" },
  { name: "Bakery & Sweets", slug: "bakery", icon: "\u{1F35E}", count: "150+ products" },
  { name: "Beverages", slug: "beverages", icon: "\u{1F375}", count: "100+ products" },
  { name: "Ready-to-Eat", slug: "ready-to-eat", icon: "\u{1F372}", count: "80+ products" },
  { name: "Personal Care", slug: "personal-care", icon: "\u{1F9F4}", count: "120+ products" },
];

const TRUST = [
  { icon: ShieldCheck, title: "Halal Certified", desc: "Every product verified by certified halal authorities" },
  { icon: Store, title: "Verified Vendors", desc: "Background-checked and continuously monitored vendors" },
  { icon: Truck, title: "Fresh Delivery", desc: "Temperature-controlled logistics for quality guarantee" },
  { icon: Star, title: "Community Rated", desc: "Real reviews from our growing community of shoppers" },
];

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HalalHubPage() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="relative">
      {/* Scroll progress bar — emerald */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-500 origin-left z-[60]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/8 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Now Open</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Your Trusted
              <br />
              <span className="text-emerald-400">Halal Marketplace</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Certified halal products from verified vendors. Fresh delivery to your door. The marketplace built on trust.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/halalhub/shop"
                className="h-12 px-8 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2 hover:bg-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/halalhub/signup/vendor"
                className="h-12 px-8 rounded-xl border border-white/10 text-zinc-300 font-medium flex items-center gap-2 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                Become a Vendor
              </Link>
            </div>
          </FadeIn>
          {/* Search bar */}
          <FadeIn delay={0.4}>
            <div className="mt-12 max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search halal products..."
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#111113] border border-white/10 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-emerald-400 mb-2">Categories</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Browse by Category</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => (
              <FadeIn key={cat.slug} delay={i * 0.05}>
                <Link
                  href={`/halalhub/shop/${cat.slug}`}
                  className="group relative p-6 rounded-2xl border border-white/8 bg-[#111113] hover:border-emerald-500/30 hover:bg-[#111113]/80 transition-all"
                >
                  <span className="text-3xl mb-3 block">{cat.icon}</span>
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">{cat.name}</h3>
                  <p className="text-sm text-zinc-500">{cat.count}</p>
                  <ArrowRight className="absolute top-6 right-6 w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Why HalalHub */}
      <section className="py-24 px-4 md:px-6 border-y border-white/8 bg-[#0D0D10]">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-emerald-400 mb-2">Why HalalHub</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built on Trust</h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="p-6 rounded-2xl border border-white/8 bg-[#111113]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section id="vendors" className="py-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="p-10 md:p-16 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[80px]" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Become a Vendor</h2>
                <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
                  Join our growing marketplace. Reach thousands of customers looking for certified halal products. Easy setup, powerful tools.
                </p>
                <Link
                  href="/halalhub/signup/vendor"
                  className="h-12 px-8 rounded-xl bg-emerald-600 text-white font-semibold inline-flex items-center gap-2 hover:bg-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
