'use client';

/**
 * Garage to Global — E-Commerce Seller Suite
 *
 * AI-powered e-commerce seller dashboard with:
 * - 5-stage growth journey (Garage → Workshop → Warehouse → Enterprise → Global)
 * - Multi-marketplace management (Shopify, Amazon, KDP, Etsy)
 * - Listing optimization with AI SEO
 * - Seller analytics and best practices
 * - Growth milestones and recommended actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, TrendingUp, Package, ShoppingBag, Search,
  Star, BarChart3, Zap, ArrowRight, ChevronRight,
  Globe, Layers, Target, Award, CheckCircle, AlertTriangle,
  ExternalLink, Plus, Settings,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types (inline to keep standalone)
// ─────────────────────────────────────────────────────────────

type SellerStage = 'garage' | 'workshop' | 'warehouse' | 'enterprise' | 'global';
type MarketplaceType = 'amazon' | 'shopify' | 'etsy' | 'kdp' | 'ebay' | 'walmart' | 'tiktok';

interface StageInfo {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  requirements: string[];
  productsRange: string;
}

interface MarketplaceInfo {
  id: MarketplaceType;
  name: string;
  icon: string;
  color: string;
  description: string;
  bestFor: string[];
}

interface BestPractice {
  id: string;
  marketplace: MarketplaceType | 'general';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const STAGES: Record<SellerStage, StageInfo> = {
  garage: {
    name: 'Garage',
    description: 'Just starting out — test your first products',
    icon: <Store className="w-5 h-5" />,
    color: '#22c55e',
    features: ['Basic listing creation', 'Single marketplace', 'Manual inventory', 'AI listing assistance'],
    requirements: ['Create your first listing', 'Make your first sale', 'Set up a payment method'],
    productsRange: '1–10 products',
  },
  workshop: {
    name: 'Workshop',
    description: 'Growing business — multi-marketplace expansion',
    icon: <Package className="w-5 h-5" />,
    color: '#3b82f6',
    features: ['Multi-marketplace listing', 'Basic inventory sync', 'Price monitoring', 'Competitor tracking'],
    requirements: ['10+ products listed', '50+ sales', 'Connected 2+ marketplaces'],
    productsRange: '10–100 products',
  },
  warehouse: {
    name: 'Warehouse',
    description: 'Established seller — automated operations',
    icon: <Layers className="w-5 h-5" />,
    color: '#a855f7',
    features: ['Full inventory automation', 'Dynamic repricing', 'Automated customer service', 'Advanced analytics'],
    requirements: ['100+ products', '500+ monthly sales', 'Fulfillment automation'],
    productsRange: '100–1,000 products',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Large scale — dedicated AI team management',
    icon: <Target className="w-5 h-5" />,
    color: '#f59e0b',
    features: ['Full automation', 'Multi-region selling', 'Custom integrations', 'Dedicated Boomer_Ang teams'],
    requirements: ['1,000+ products', '$100K+ monthly revenue', 'Multi-region presence'],
    productsRange: '1,000+ products',
  },
  global: {
    name: 'Global',
    description: 'International empire — worldwide reach',
    icon: <Globe className="w-5 h-5" />,
    color: '#ef4444',
    features: ['Global logistics', 'Multi-currency', 'International compliance', 'White-glove service'],
    requirements: ['International presence', 'Multi-currency operations', 'Global logistics network'],
    productsRange: 'Unlimited',
  },
};

const MARKETPLACES: MarketplaceInfo[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    color: '#96bf48',
    description: 'Build your own branded store with full control',
    bestFor: ['Brand building', 'DTC sales', 'Custom storefronts'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    color: '#ff9900',
    description: 'Reach millions with FBA/FBM fulfillment',
    bestFor: ['High volume', 'FBA fulfillment', 'Prime customers'],
  },
  {
    id: 'kdp',
    name: 'KDP',
    icon: '📚',
    color: '#232f3e',
    description: 'Publish ebooks, paperbacks, and audiobooks',
    bestFor: ['Digital publishing', 'Low inventory books', 'Passive income'],
  },
  {
    id: 'etsy',
    name: 'Etsy',
    icon: '🎨',
    color: '#f1641e',
    description: 'Handmade, vintage, and unique products',
    bestFor: ['Handmade goods', 'Print on demand', 'Niche products'],
  },
  {
    id: 'ebay',
    name: 'eBay',
    icon: '🏷️',
    color: '#e53238',
    description: 'Auction and fixed-price marketplace',
    bestFor: ['Used goods', 'Collectibles', 'Auction sales'],
  },
  {
    id: 'walmart',
    name: 'Walmart',
    icon: '🏪',
    color: '#0071dc',
    description: 'Access Walmart\'s massive customer base',
    bestFor: ['Bulk sales', 'Grocery & household', 'Value shoppers'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    icon: '🎵',
    color: '#000000',
    description: 'Social commerce for viral products',
    bestFor: ['Viral products', 'Gen Z audience', 'Live selling'],
  },
];

const BEST_PRACTICES: BestPractice[] = [
  {
    id: 'bp-1',
    marketplace: 'amazon',
    category: 'Listings',
    title: 'Use all 5 bullet points with keywords',
    description: 'Amazon gives you 5 bullet points — use every one. Front-load with your primary keyword and keep under 200 characters each.',
    impact: 'high',
    effort: 'easy',
  },
  {
    id: 'bp-2',
    marketplace: 'shopify',
    category: 'SEO',
    title: 'Optimize product page meta descriptions',
    description: 'Write unique meta descriptions for each product page. Include your primary keyword and a compelling call to action under 160 characters.',
    impact: 'high',
    effort: 'easy',
  },
  {
    id: 'bp-3',
    marketplace: 'etsy',
    category: 'Tags',
    title: 'Use all 13 tags with long-tail keywords',
    description: 'Etsy gives you 13 tags — use all of them. Focus on long-tail, specific phrases rather than single words.',
    impact: 'high',
    effort: 'medium',
  },
  {
    id: 'bp-4',
    marketplace: 'kdp',
    category: 'Publishing',
    title: 'Choose 7 precise categories for discoverability',
    description: 'KDP allows 7 keyword phrases. Use specific, niche categories rather than broad ones to improve your book\'s visibility.',
    impact: 'high',
    effort: 'medium',
  },
  {
    id: 'bp-5',
    marketplace: 'general',
    category: 'Pricing',
    title: 'Price at .97 or .99 for psychological impact',
    description: 'Charm pricing ($19.97 vs $20) consistently shows 8-12% higher conversion rates across marketplaces.',
    impact: 'medium',
    effort: 'easy',
  },
  {
    id: 'bp-6',
    marketplace: 'general',
    category: 'Photography',
    title: 'Use lifestyle images alongside white background',
    description: 'Products with lifestyle images convert 22% higher. Show the product in use, not just on white background.',
    impact: 'high',
    effort: 'medium',
  },
  {
    id: 'bp-7',
    marketplace: 'amazon',
    category: 'PPC',
    title: 'Start with auto campaigns, then refine',
    description: 'Launch auto-targeting PPC campaigns first to discover converting keywords, then create manual campaigns with those winners.',
    impact: 'high',
    effort: 'medium',
  },
  {
    id: 'bp-8',
    marketplace: 'shopify',
    category: 'Conversion',
    title: 'Add urgency with stock count and time limits',
    description: 'Showing "Only 3 left" or countdown timers can boost conversions 15-30%. Use scarcity honestly.',
    impact: 'medium',
    effort: 'easy',
  },
];

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function GrowthJourneyMap({ currentStage, onStageSelect }: { currentStage: SellerStage; onStageSelect: (s: SellerStage) => void }) {
  const stages: SellerStage[] = ['garage', 'workshop', 'warehouse', 'enterprise', 'global'];
  const currentIdx = stages.indexOf(currentStage);

  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-semibold text-white">Growth Journey</h2>
        <span className="ml-auto text-xs font-mono text-gold/60 uppercase">
          Current: {STAGES[currentStage].name}
        </span>
      </div>

      {/* Journey timeline */}
      <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
        {stages.map((stage, idx) => {
          const info = STAGES[stage];
          const isActive = stage === currentStage;
          const isPast = idx < currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={stage} className="flex items-center flex-1 min-w-[120px]">
              <button
                onClick={() => onStageSelect(stage)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all w-full ${
                  isActive
                    ? 'bg-gold/10 border border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                    : isPast
                    ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15'
                    : 'bg-white/3 border border-wireframe-stroke hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-gold/20 text-gold' : isPast ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {isPast ? <CheckCircle className="w-5 h-5" /> : info.icon}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-gold' : isPast ? 'text-emerald-400' : 'text-white/50'}`}>
                  {info.name}
                </span>
                <span className="text-[10px] text-white/30">{info.productsRange}</span>
              </button>
              {idx < stages.length - 1 && (
                <div className={`w-4 h-px flex-shrink-0 ${isPast ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/3 border border-wireframe-stroke">
          <h3 className="text-sm font-medium text-white mb-2">Features at {STAGES[currentStage].name}</h3>
          <ul className="space-y-1.5">
            {STAGES[currentStage].features.map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/60" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-white/3 border border-wireframe-stroke">
          <h3 className="text-sm font-medium text-white mb-2">Next Milestone Requirements</h3>
          <ul className="space-y-1.5">
            {STAGES[currentStage].requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                <Target className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MarketplaceGrid({ onSelect }: { onSelect: (mp: MarketplaceType) => void }) {
  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-semibold text-white">Marketplaces</h2>
        <span className="ml-auto text-xs text-white/40">Connect & sell across platforms</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {MARKETPLACES.map((mp) => (
          <motion.button
            key={mp.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(mp.id)}
            className="p-4 rounded-xl bg-white/3 border border-wireframe-stroke hover:border-gold/20 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{mp.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white group-hover:text-gold transition-colors">{mp.name}</h3>
                </div>
                <p className="text-xs text-white/40 mt-1 line-clamp-2">{mp.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {mp.bestFor.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/50">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        ))}

        {/* Add Marketplace CTA */}
        <button className="p-4 rounded-xl border-2 border-dashed border-wireframe-stroke hover:border-gold/30 transition-all flex flex-col items-center justify-center gap-2 text-white/30 hover:text-gold/60">
          <Plus className="w-6 h-6" />
          <span className="text-xs">Connect New</span>
        </button>
      </div>
    </div>
  );
}

function BestPracticesEngine({ selectedMarketplace }: { selectedMarketplace: MarketplaceType | null }) {
  const [filter, setFilter] = useState<'all' | MarketplaceType | 'general'>('all');

  const effectiveFilter = selectedMarketplace || filter;
  const filtered = effectiveFilter === 'all'
    ? BEST_PRACTICES
    : BEST_PRACTICES.filter(bp => bp.marketplace === effectiveFilter || bp.marketplace === 'general');

  const impactColors = {
    high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-gold bg-gold/10 border-gold/20',
    low: 'text-white/50 bg-white/5 border-wireframe-stroke',
  };

  const effortColors = {
    easy: 'text-emerald-400',
    medium: 'text-gold',
    hard: 'text-red-400',
  };

  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-semibold text-white">AI Best Practices</h2>
      </div>

      {/* Filters */}
      {!selectedMarketplace && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['all', 'general', 'amazon', 'shopify', 'etsy', 'kdp'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-gold/10 text-gold border border-gold/30'
                  : 'bg-white/5 text-white/50 border border-wireframe-stroke hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f === 'general' ? 'General' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((bp) => (
          <motion.div
            key={bp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/3 border border-wireframe-stroke hover:border-gold/10 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-white/30 uppercase">{bp.category}</span>
                  {bp.marketplace !== 'general' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/40">{bp.marketplace}</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white">{bp.title}</h3>
                <p className="text-xs text-white/40 mt-1">{bp.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${impactColors[bp.impact]}`}>
                  {bp.impact} impact
                </span>
                <span className={`text-[10px] ${effortColors[bp.effort]}`}>
                  {bp.effort} effort
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuickMetrics() {
  const metrics = [
    { label: 'Total Products', value: '0', icon: Package, change: null },
    { label: 'Marketplaces', value: '0', icon: Store, change: null },
    { label: 'Monthly Revenue', value: '$0.00', icon: TrendingUp, change: null },
    { label: 'Seller Score', value: '--', icon: Star, change: null },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <div key={i} className="wireframe-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <m.icon className="w-4 h-4 text-white/30" />
            <span className="text-xs text-white/40">{m.label}</span>
          </div>
          <div className="text-xl font-bold text-white">{m.value}</div>
        </div>
      ))}
    </div>
  );
}

function MarketplaceDetailModal({ marketplace, onClose }: { marketplace: MarketplaceType; onClose: () => void }) {
  const mp = MARKETPLACES.find(m => m.id === marketplace);
  if (!mp) return null;

  const tips = BEST_PRACTICES.filter(bp => bp.marketplace === marketplace || bp.marketplace === 'general');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-wireframe-stroke">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{mp.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{mp.name}</h2>
              <p className="text-sm text-white/40">{mp.description}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {mp.bestFor.map((tag, i) => (
              <span key={i} className="px-2 py-1 rounded-lg text-xs bg-gold/10 text-gold/80 border border-gold/20">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tips for this marketplace */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-white mb-4">Best Practices for {mp.name}</h3>
          <div className="space-y-3">
            {tips.map((tip) => (
              <div key={tip.id} className="p-3 rounded-lg bg-white/3 border border-wireframe-stroke">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-gold/60 uppercase">{tip.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    tip.impact === 'high' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gold/10 text-gold'
                  }`}>
                    {tip.impact} impact
                  </span>
                </div>
                <h4 className="text-sm text-white font-medium">{tip.title}</h4>
                <p className="text-xs text-white/40 mt-1">{tip.description}</p>
              </div>
            ))}
          </div>

          {/* Getting Started CTA */}
          <div className="mt-6 p-4 rounded-xl bg-gold/5 border border-gold/20">
            <h4 className="text-sm font-medium text-gold mb-2">Ready to connect {mp.name}?</h4>
            <p className="text-xs text-white/40 mb-3">
              ACHEEVY will help you set up your {mp.name} integration with AI-optimized listings.
            </p>
            <button className="px-4 py-2 rounded-lg bg-gold text-black text-sm font-medium hover:bg-gold/90 transition-colors">
              Connect {mp.name}
            </button>
          </div>
        </div>

        {/* Close */}
        <div className="p-4 border-t border-wireframe-stroke flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function GarageToGlobalPage() {
  const [currentStage, setCurrentStage] = useState<SellerStage>('garage');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'marketplaces' | 'practices' | 'analytics'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <Store className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Garage to Global</h1>
            <p className="text-sm text-white/40">AI-powered e-commerce seller suite</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            LIVE
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'marketplaces', label: 'Marketplaces', icon: ShoppingBag },
          { id: 'practices', label: 'Best Practices', icon: Zap },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-white/50 border border-transparent hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <QuickMetrics />
          <GrowthJourneyMap currentStage={currentStage} onStageSelect={setCurrentStage} />
          <MarketplaceGrid onSelect={setSelectedMarketplace} />
        </div>
      )}

      {activeTab === 'marketplaces' && (
        <div className="space-y-6">
          <MarketplaceGrid onSelect={setSelectedMarketplace} />
          <div className="wireframe-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Marketplace Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-wireframe-stroke">
                    <th className="text-left py-3 px-4 text-white/40 font-medium">Platform</th>
                    <th className="text-left py-3 px-4 text-white/40 font-medium">Best For</th>
                    <th className="text-left py-3 px-4 text-white/40 font-medium">Startup Cost</th>
                    <th className="text-left py-3 px-4 text-white/40 font-medium">Fee Structure</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Amazon', bestFor: 'Volume & FBA', cost: '$39.99/mo', fees: '8-15% referral' },
                    { name: 'Shopify', bestFor: 'Brand & DTC', cost: '$29/mo', fees: '2.9% + $0.30' },
                    { name: 'Etsy', bestFor: 'Handmade & Niche', cost: '$0.20/listing', fees: '6.5% + $0.25' },
                    { name: 'KDP', bestFor: 'Books & Publishing', cost: 'Free', fees: '30-65% royalty' },
                    { name: 'eBay', bestFor: 'Used & Collectibles', cost: 'Free (250 listings)', fees: '12.9% + $0.30' },
                    { name: 'Walmart', bestFor: 'Bulk & Value', cost: 'Free (approved)', fees: '6-15% referral' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-wireframe-stroke/50">
                      <td className="py-3 px-4 text-white font-medium">{row.name}</td>
                      <td className="py-3 px-4 text-white/60">{row.bestFor}</td>
                      <td className="py-3 px-4 text-white/60">{row.cost}</td>
                      <td className="py-3 px-4 text-white/60">{row.fees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'practices' && (
        <BestPracticesEngine selectedMarketplace={null} />
      )}

      {activeTab === 'analytics' && (
        <div className="wireframe-card p-8 text-center">
          <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">Analytics Coming Soon</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
            Connect a marketplace to start seeing real-time sales analytics, competitor tracking, and AI-powered growth recommendations.
          </p>
          <button
            onClick={() => setActiveTab('marketplaces')}
            className="px-6 py-3 rounded-xl bg-gold text-black text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Connect Your First Marketplace
          </button>
        </div>
      )}

      {/* Marketplace Detail Modal */}
      <AnimatePresence>
        {selectedMarketplace && (
          <MarketplaceDetailModal
            marketplace={selectedMarketplace}
            onClose={() => setSelectedMarketplace(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
