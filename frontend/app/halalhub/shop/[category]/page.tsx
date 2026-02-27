'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Search,
  Star,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── HalalHub Category Page ──────────────────────────────────────────────
   Dynamic [category] route showing vendors filtered by category.
   AIMS Design: Emerald primary, clean cards, mobile-first.
   ──────────────────────────────────────────────────────────────────────── */

const CATEGORY_META: Record<string, { label: string; emoji: string; desc: string }> = {
  'meat-poultry': {
    label: 'Meat & Poultry',
    emoji: '🥩',
    desc: 'Premium halal-certified meats, hand-slaughtered and delivered fresh.',
  },
  groceries: {
    label: 'Groceries',
    emoji: '🛒',
    desc: 'Halal grocery stores with imported and local goods.',
  },
  restaurants: {
    label: 'Restaurants',
    emoji: '🍽️',
    desc: 'Halal restaurants serving authentic cuisines from around the world.',
  },
  catering: {
    label: 'Catering',
    emoji: '🎉',
    desc: 'Professional halal catering for events, weddings, and corporate functions.',
  },
  'bakery': {
    label: 'Bakery & Sweets',
    emoji: '🧁',
    desc: 'Artisan halal bakeries and confectioners with fresh-baked daily selections.',
  },
  services: {
    label: 'Services',
    emoji: '🤝',
    desc: 'Halal certification, consulting, education, and professional services.',
  },
};

// Mock vendor data per category
const MOCK_VENDORS: Record<
  string,
  Array<{
    id: number;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    certified: boolean;
    desc: string;
    badges: string[];
  }>
> = {
  'meat-poultry': [
    { id: 1, name: 'Al-Madina Halal Meats', rating: 4.9, reviews: 312, location: 'Brooklyn, NY', certified: true, desc: 'Premium hand-slaughtered halal meats since 1998. Family-owned with farm-to-table traceability.', badges: ['Top Rated', 'Fast Delivery'] },
    { id: 2, name: 'Bismillah Butchers', rating: 4.7, reviews: 189, location: 'Jersey City, NJ', certified: true, desc: 'Wholesale and retail halal meats, custom cuts available.', badges: ['Wholesale Available'] },
    { id: 3, name: 'Green Valley Farms', rating: 4.8, reviews: 145, location: 'Lancaster, PA', certified: true, desc: 'Organic free-range halal poultry and lamb, pasture-raised.', badges: ['Organic', 'Free Range'] },
    { id: 4, name: 'Crescent Meats', rating: 4.6, reviews: 98, location: 'Paterson, NJ', certified: true, desc: 'Quality halal meats with competitive pricing. Delivery available within 50 miles.', badges: ['Value Pick'] },
  ],
  groceries: [
    { id: 5, name: 'Salam Grocery', rating: 4.7, reviews: 189, location: 'Dearborn, MI', certified: true, desc: 'Full-service halal grocery with imported goods from 30+ countries.', badges: ['Verified'] },
    { id: 6, name: 'Al-Huda Market', rating: 4.5, reviews: 134, location: 'Falls Church, VA', certified: true, desc: 'Fresh produce, halal meats, and international ingredients under one roof.', badges: ['Fresh Daily'] },
    { id: 7, name: 'Medina Market', rating: 4.6, reviews: 167, location: 'Houston, TX', certified: true, desc: 'Large selection of Middle Eastern, South Asian, and African halal products.', badges: ['Popular'] },
  ],
  restaurants: [
    { id: 8, name: 'Noor Kitchen', rating: 4.8, reviews: 256, location: 'Houston, TX', certified: true, desc: 'Authentic Middle Eastern cuisine made with 100% halal ingredients.', badges: ['Popular', 'Barakat Partner'] },
    { id: 9, name: 'Saffron House', rating: 4.7, reviews: 198, location: 'New York, NY', certified: true, desc: 'Fine dining Pakistani and Indian halal cuisine in Midtown Manhattan.', badges: ['Fine Dining'] },
    { id: 10, name: 'Istanbul Grill', rating: 4.6, reviews: 143, location: 'Chicago, IL', certified: true, desc: 'Turkish kebabs and mezes prepared the traditional way.', badges: ['Authentic'] },
  ],
  catering: [
    { id: 11, name: 'Crescent Catering Co.', rating: 4.6, reviews: 94, location: 'Chicago, IL', certified: true, desc: 'Corporate and event catering with diverse halal menus.', badges: ['Event Ready'] },
    { id: 12, name: 'Royal Feast Catering', rating: 4.8, reviews: 76, location: 'Dallas, TX', certified: true, desc: 'Wedding and celebration catering with custom menu planning.', badges: ['Weddings'] },
  ],
  bakery: [
    { id: 13, name: 'Barakah Bakery', rating: 4.9, reviews: 178, location: 'Los Angeles, CA', certified: true, desc: 'Artisan Middle Eastern pastries, fresh-baked daily.', badges: ['Top Rated', 'Organic'] },
    { id: 14, name: 'Sweet Sunnah', rating: 4.7, reviews: 112, location: 'Houston, TX', certified: true, desc: 'Traditional desserts from around the Muslim world with modern twists.', badges: ['Custom Orders'] },
  ],
  services: [
    { id: 15, name: 'Tayyib Consulting', rating: 4.5, reviews: 42, location: 'Online', certified: true, desc: 'Halal certification consulting and compliance auditing.', badges: ['Certified Expert'] },
    { id: 16, name: 'Halal Standards Academy', rating: 4.8, reviews: 67, location: 'Online', certified: true, desc: 'Education and training for halal certification and compliance.', badges: ['Education'] },
  ],
};

function CategoryVendorCard({
  vendor,
  emoji,
}: {
  vendor: (typeof MOCK_VENDORS)['meat-poultry'][0];
  emoji: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:border-emerald-200/60"
    >
      {/* Image placeholder */}
      <div className="flex h-32 w-full sm:h-auto sm:w-40 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-slate-100">
        <span className="text-4xl opacity-50">{emoji}</span>
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {vendor.name}
            </h3>
            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 flex-shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-amber-700">{vendor.rating}</span>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed line-clamp-2">{vendor.desc}</p>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {vendor.location}
            </span>
            <span>{vendor.reviews} reviews</span>
            {vendor.certified && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="h-3 w-3" />
                Certified
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vendor.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const meta = CATEGORY_META[categorySlug];
  const vendors = MOCK_VENDORS[categorySlug] || [];
  const [search, setSearch] = React.useState('');

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.desc.toLowerCase().includes(search.toLowerCase())
  );

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h2 className="text-xl font-bold text-slate-900">Category not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The category &ldquo;{categorySlug}&rdquo; doesn&apos;t exist yet.
        </p>
        <Link
          href="/halalhub/shop"
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/halalhub" className="hover:text-emerald-600 transition-colors">
          HalalHub
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/halalhub/shop" className="hover:text-emerald-600 transition-colors">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-700 font-medium">{meta.label}</span>
      </nav>

      {/* Header */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{meta.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{meta.label}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{meta.desc}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search in ${meta.label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="mt-4 text-sm text-slate-500">
        {filtered.length} vendor{filtered.length !== 1 ? 's' : ''} in {meta.label}
      </p>

      {/* Vendor List */}
      <div className="mt-4 flex flex-col gap-4">
        {filtered.length > 0 ? (
          filtered.map((vendor) => (
            <CategoryVendorCard key={vendor.id} vendor={vendor} emoji={meta.emoji} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              No vendors found matching &ldquo;{search}&rdquo; in {meta.label}
            </p>
            <button
              onClick={() => setSearch('')}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Cross-category navigation */}
      <div className="mt-12">
        <h3 className="text-base font-semibold text-slate-900">Other Categories</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(CATEGORY_META)
            .filter(([slug]) => slug !== categorySlug)
            .map(([slug, cat]) => (
              <Link
                key={slug}
                href={`/halalhub/shop/${slug}`}
                className="group flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white p-3 transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">
                  {cat.label}
                </span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
