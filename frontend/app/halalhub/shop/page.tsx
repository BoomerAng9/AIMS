'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Grid3X3,
  List,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── HalalHub Shop ───────────────────────────────────────────────────────
   Main marketplace page: category grid, search, filters, product listings.
   AIMS Design: Emerald primary, clean cards, mobile-first responsive.
   ──────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { slug: 'meat-poultry', label: 'Meat & Poultry', emoji: '🥩', count: 128 },
  { slug: 'groceries', label: 'Groceries', emoji: '🛒', count: 342 },
  { slug: 'restaurants', label: 'Restaurants', emoji: '🍽️', count: 86 },
  { slug: 'catering', label: 'Catering', emoji: '🎉', count: 45 },
  { slug: 'bakery', label: 'Bakery & Sweets', emoji: '🧁', count: 67 },
  { slug: 'services', label: 'Services', emoji: '🤝', count: 53 },
];

const FEATURED_VENDORS = [
  {
    id: 1,
    name: 'Al-Madina Halal Meats',
    category: 'Meat & Poultry',
    rating: 4.9,
    reviews: 312,
    location: 'Brooklyn, NY',
    certified: true,
    image: '/assets/halalhub_storefront.jpg',
    desc: 'Premium hand-slaughtered halal meats since 1998.',
    badges: ['Top Rated', 'Fast Delivery'],
  },
  {
    id: 2,
    name: 'Salam Grocery',
    category: 'Groceries',
    rating: 4.7,
    reviews: 189,
    location: 'Dearborn, MI',
    certified: true,
    image: null,
    desc: 'Full-service halal grocery with imported goods from 30+ countries.',
    badges: ['Verified'],
  },
  {
    id: 3,
    name: 'Noor Kitchen',
    category: 'Restaurants',
    rating: 4.8,
    reviews: 256,
    location: 'Houston, TX',
    certified: true,
    image: null,
    desc: 'Authentic Middle Eastern cuisine made with 100% halal ingredients.',
    badges: ['Popular', 'Barakat Partner'],
  },
  {
    id: 4,
    name: 'Crescent Catering Co.',
    category: 'Catering',
    rating: 4.6,
    reviews: 94,
    location: 'Chicago, IL',
    certified: true,
    image: null,
    desc: 'Corporate and event catering with diverse halal menus.',
    badges: ['Event Ready'],
  },
  {
    id: 5,
    name: 'Barakah Bakery',
    category: 'Bakery & Sweets',
    rating: 4.9,
    reviews: 178,
    location: 'Los Angeles, CA',
    certified: true,
    image: null,
    desc: 'Artisan Middle Eastern pastries, fresh-baked daily.',
    badges: ['Top Rated', 'Organic'],
  },
  {
    id: 6,
    name: 'Tayyib Consulting',
    category: 'Services',
    rating: 4.5,
    reviews: 42,
    location: 'Online',
    certified: true,
    image: null,
    desc: 'Halal certification consulting and compliance auditing.',
    badges: ['Certified Expert'],
  },
];

function VendorCard({ vendor }: { vendor: (typeof FEATURED_VENDORS)[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-lg hover:border-emerald-200/60"
    >
      {/* Image area */}
      <div className="relative h-40 overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-50 to-slate-100">
        {vendor.image ? (
          <img
            src={vendor.image}
            alt={vendor.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl opacity-40">
              {CATEGORIES.find((c) => c.label === vendor.category)?.emoji || '🏪'}
            </span>
          </div>
        )}
        {vendor.certified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-emerald-700 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            Halal Certified
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {vendor.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{vendor.category}</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-700">{vendor.rating}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">{vendor.desc}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3 w-3" />
          {vendor.location}
          <span className="mx-1">·</span>
          {vendor.reviews} reviews
        </div>
        {vendor.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vendor.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function HalalHubShop() {
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const filteredVendors = FEATURED_VENDORS.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      v.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Halal Marketplace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse certified halal vendors, restaurants, and services near you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors, products, or services..."
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
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
                <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500">
                  <option>All Locations</option>
                  <option>Within 5 miles</option>
                  <option>Within 10 miles</option>
                  <option>Within 25 miles</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500">
                  <option>All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Rating</label>
                <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500">
                  <option>Any Rating</option>
                  <option>4+ Stars</option>
                  <option>4.5+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sort By</label>
                <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500">
                  <option>Most Popular</option>
                  <option>Highest Rated</option>
                  <option>Newest</option>
                  <option>Nearest</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Browse Categories</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/halalhub/shop/${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/60 bg-white p-4 text-center transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-700">
                {cat.label}
              </span>
              <span className="text-xs text-slate-400">{cat.count} listings</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Vendors */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Featured Vendors</h2>
          <Link
            href="/halalhub/shop/meat-poultry"
            className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div
          className={`mt-4 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-3'
          }`}
        >
          {filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)
          ) : (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
              <Search className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">
                No vendors found matching &ldquo;{search}&rdquo;
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
      </div>

      {/* Barakat Referral Banner */}
      <div className="mt-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">Barakat Referral Program</h3>
            <p className="mt-1 text-sm text-emerald-100 max-w-lg">
              Refer vendors to HalalHub and earn rewards. Every successful referral earns you
              Barakat points redeemable for discounts and exclusive offers.
            </p>
          </div>
          <Link
            href="/halalhub/shop?view=barakat"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-lg transition-colors hover:bg-emerald-50"
          >
            Learn More
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
