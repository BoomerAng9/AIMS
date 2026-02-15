'use client';

/**
 * Merch Store — A.I.M.S. Merchandise
 *
 * Browse V.I.B.E. apparel, accessories, collectibles, and digital goods.
 * Currently a "coming soon" showcase — will integrate with Stripe when live.
 *
 * Lives on plugmein.cloud — the lore & learn domain.
 */

import { motion } from 'framer-motion';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';
import { MERCH_CATEGORIES, MERCH_ITEMS } from '@/lib/content/lore';

export default function MerchPage() {
  return (
    <main className="flex flex-col min-h-full bg-ink text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative py-16 md:py-24 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-5xl mb-4">🛍</div>
          <h1
            className="text-4xl md:text-6xl font-bold mb-3 tracking-tight"
            style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
          >
            Merch Store
          </h1>
          <p className="text-sm text-white/40 max-w-lg mx-auto">
            Rep the V.I.B.E. — apparel, gear, collectibles, and digital goods from the A.I.M.S. universe.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MERCH_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="wireframe-card p-4 text-center hover:border-gold/30 transition-colors"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1">{cat.label}</h3>
              <p className="text-[10px] text-white/30">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Items */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-3 mb-6 mt-8">
          <div className="h-px flex-1 bg-wireframe-stroke" />
          <span className="text-xs tracking-[0.2em] uppercase text-gold/50 font-mono">All Items</span>
          <div className="h-px flex-1 bg-wireframe-stroke" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MERCH_ITEMS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="wireframe-card p-5 hover:border-gold/20 transition-all group"
            >
              {/* Placeholder image area */}
              <div className="w-full aspect-square rounded-xl bg-white/[0.02] border border-wireframe-stroke mb-4 flex items-center justify-center">
                <span className="text-4xl opacity-30">
                  {MERCH_CATEGORIES.find(c => c.id === item.category)?.icon || '🛍'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-gold transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-white/40 mb-3">{item.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gold font-mono">{item.price}</span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Coming Soon
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="text-center mt-16 max-w-md mx-auto">
          <p className="text-sm text-white/40 mb-4">
            Want to know when the store goes live? Drop your email.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 rounded-lg bg-black/40 border border-wireframe-stroke text-white text-sm placeholder:text-white/20 outline-none focus:border-gold/50"
            />
            <button className="px-4 py-2.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors">
              Notify Me
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
