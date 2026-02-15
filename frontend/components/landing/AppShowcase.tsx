'use client';

/**
 * App Showcase + Build Prompts — Landing Page Sections
 *
 * Showcase: Real production apps built with A.I.M.S. using wireframe-card styling
 * BuildPrompts: Natural language prompt examples
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, cardLift } from '@/lib/motion/variants';
import { ArrowRight, Calculator, Store, ShoppingCart, Zap, Rocket } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AppShowcaseItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  demoLink: string;
  builtIn: string;
  status: 'live' | 'demo' | 'coming-soon';
}

// ─────────────────────────────────────────────────────────────
// Showcase Data
// ─────────────────────────────────────────────────────────────

const SHOWCASE_APPS: AppShowcaseItem[] = [
  {
    id: 'luc',
    name: 'LUC - Usage Calculator',
    tagline: 'Track, Estimate, Optimize',
    description: 'Production-ready usage calculator with quota tracking, cost estimation, and execution gating. 8 industry presets included.',
    icon: <Calculator className="w-6 h-6" />,
    features: [
      'Real-time quota tracking',
      'Industry presets (SaaS, AI, E-commerce)',
      'Import/Export functionality',
      'Usage history & analytics',
    ],
    demoLink: '/dashboard/luc',
    builtIn: '< 30 minutes',
    status: 'live',
  },
  {
    id: 'garage-to-global',
    name: 'Garage to Global',
    tagline: 'From Side Hustle to Empire',
    description: 'Complete e-commerce seller suite with AI-powered best practices for Shopify, Amazon, KDP, and Etsy.',
    icon: <Store className="w-6 h-6" />,
    features: [
      'E-commerce best practices engine',
      'Multi-platform adapters',
      'Listing SEO optimizer',
      '5-stage growth journey',
    ],
    demoLink: '/dashboard/garage-to-global',
    builtIn: '< 1 hour',
    status: 'live',
  },
  {
    id: 'buy-in-bulk',
    name: 'Buy in Bulk',
    tagline: 'Smart Shopping at Scale',
    description: 'Boomer_Ang-powered shopping assistant that scouts deals, compares prices, and optimizes bulk purchases.',
    icon: <ShoppingCart className="w-6 h-6" />,
    features: [
      'AI price comparison',
      'Deal scouting agents',
      'Cart optimization',
      'Never shares payment info',
    ],
    demoLink: '/dashboard/buy-in-bulk',
    builtIn: '< 45 minutes',
    status: 'live',
  },
];

// ─────────────────────────────────────────────────────────────
// App Card Component
// ─────────────────────────────────────────────────────────────

function AppCard({ app }: { app: AppShowcaseItem }) {
  return (
    <motion.div
      variants={staggerItem}
      {...cardLift}
      className="wireframe-card overflow-hidden cursor-default"
    >
      {/* Gold accent line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-gold/20 bg-gold/5 text-gold">
              {app.icon}
            </div>
            <div>
              <h3 className="text-base font-medium text-white">{app.name}</h3>
              <p className="text-xs text-white/40">{app.tagline}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[0.6rem] font-mono uppercase ${
            app.status === 'live'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : app.status === 'demo'
              ? 'bg-gold/10 text-gold border border-gold/20'
              : 'bg-white/5 text-white/30 border border-wireframe-stroke'
          }`}>
            {app.status === 'live' ? 'LIVE' : app.status === 'demo' ? 'DEMO' : 'SOON'}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-white/40 mb-4 leading-relaxed">{app.description}</p>

        {/* Features */}
        <div className="space-y-1.5 mb-5">
          {app.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-white/50">
              <span className="w-1 h-1 rounded-full bg-gold/60 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-wireframe-stroke">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-xs text-white/30">
              Built in <span className="text-gold/80 font-medium">{app.builtIn}</span>
            </span>
          </div>
          <Link
            href={app.demoLink}
            className="flex items-center gap-1 text-xs font-medium text-gold/80 hover:text-gold transition-colors group"
          >
            Try it now
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function AppShowcase() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 xl:px-12 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gold/20 bg-gold/5 text-[0.65rem] uppercase tracking-[0.2em] text-gold/80 font-mono mb-6">
            <Rocket className="w-3.5 h-3.5" />
            Production-Ready Apps
          </span>

          <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wider mb-4">
            <span className="text-gold">Real Apps.</span>{' '}
            <span className="text-white">Built Fast.</span>
          </h2>

          <p className="text-white/40 max-w-2xl mx-auto">
            These aren&apos;t mockups. Production-ready applications built with
            A.I.M.S. in under an hour.
          </p>
        </motion.div>

        {/* App Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          {SHOWCASE_APPS.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </motion.div>

        {/* Build Your Own CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="wireframe-card text-center p-8"
        >
          <h3 className="font-display text-xl uppercase tracking-wider text-white mb-2">
            What Will You Build?
          </h3>
          <p className="text-sm text-white/40 mb-6 max-w-xl mx-auto">
            Tell ACHEEVY what you need. A.I.M.S. will build it. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold-light"
            >
              Start Building with ACHEEVY
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://github.com/BoomerAng9/AIMS"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-wireframe-stroke px-6 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              View on GitHub
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Build Prompts
// ─────────────────────────────────────────────────────────────

export function BuildPrompts() {
  const prompts = [
    {
      title: 'Build me a usage calculator',
      description: 'Track API calls, storage, and compute with quota limits.',
      result: 'LUC Calculator',
    },
    {
      title: 'Help me sell online',
      description: 'Set up my e-commerce business with AI-powered best practices.',
      result: 'Garage to Global Suite',
    },
    {
      title: 'Find me the best deals',
      description: 'Scout products across retailers and optimize bulk purchases.',
      result: 'Buy in Bulk Agent',
    },
    {
      title: 'Manage my AI costs',
      description: 'Create dashboards and alerts for multi-model AI spending.',
      result: 'AI Platform Calculator',
    },
  ];

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 xl:px-12 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-white mb-2">
            Just Tell ACHEEVY What You Need
          </h2>
          <p className="text-white/40">No technical jargon required. Speak naturally.</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {prompts.map((prompt, i) => (
            <motion.div key={i} variants={staggerItem}>
              <Link
                href="/chat"
                className="block wireframe-card p-5 transition-all hover:border-gold/20 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg border border-gold/10 bg-gold/5">
                    <Zap className="w-4 h-4 text-gold/60" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1 group-hover:text-gold transition-colors">
                      &ldquo;{prompt.title}&rdquo;
                    </h4>
                    <p className="text-xs text-white/40 mb-2">{prompt.description}</p>
                    <span className="text-[0.6rem] text-gold/60 font-mono uppercase">
                      Creates: {prompt.result}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default AppShowcase;
