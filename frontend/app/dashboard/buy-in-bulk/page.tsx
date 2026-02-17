'use client';

/**
 * Buy in Bulk — AI Shopping Assistant
 *
 * Boomer_Ang-powered shopping assistant that:
 * - Scouts deals across retailers (Amazon, Walmart, Alibaba)
 * - Compares prices and finds bulk discounts
 * - Builds optimized carts with shipping optimization
 * - Never shares payment info — ACHEEVY handles payments
 * - Price tracking and drop alerts
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, TrendingDown, Package, AlertCircle,
  Plus, Trash2, DollarSign, Truck, Shield, Zap, BarChart3,
  Star, Clock, Bell, ArrowRight, CheckCircle, XCircle,
  ChevronDown, Tag, Users, Settings,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  maxPrice: number | null;
  category: string;
  required: boolean;
}

type ShippingSpeed = 'fastest' | 'standard' | 'cheapest';
type QualityPref = 'budget' | 'balanced' | 'premium';

interface RetailerInfo {
  id: string;
  name: string;
  icon: string;
  features: string[];
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const RETAILERS: RetailerInfo[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    features: ['Real-time inventory', 'Price history', 'Prime shipping', 'Bulk orders'],
    enabled: true,
  },
  {
    id: 'walmart',
    name: 'Walmart',
    icon: '🏪',
    features: ['Bulk discounts', 'In-store pickup', 'Rollback deals', 'Affiliate API'],
    enabled: true,
  },
  {
    id: 'alibaba',
    name: 'Alibaba',
    icon: '🌏',
    features: ['Wholesale pricing', 'Factory direct', 'MOQ deals', 'Trade Assurance'],
    enabled: false,
  },
];

const SAMPLE_DEALS = [
  {
    id: 'd1',
    product: 'Office Paper (10 reams)',
    retailer: 'Amazon',
    originalPrice: 89.99,
    salePrice: 54.99,
    discount: 39,
    rating: 4.5,
    reviews: 12400,
    prime: true,
  },
  {
    id: 'd2',
    product: 'K-Cups Variety Pack (100ct)',
    retailer: 'Walmart',
    originalPrice: 44.99,
    salePrice: 32.97,
    discount: 27,
    rating: 4.3,
    reviews: 8200,
    prime: false,
  },
  {
    id: 'd3',
    product: 'Cleaning Supplies Bundle',
    retailer: 'Amazon',
    originalPrice: 67.50,
    salePrice: 43.20,
    discount: 36,
    rating: 4.7,
    reviews: 5600,
    prime: true,
  },
];

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function ShoppingListBuilder({
  items,
  onAdd,
  onRemove,
  onUpdate,
}: {
  items: ShoppingListItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingListItem>) => void;
}) {
  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-semibold text-white">Shopping List</h2>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-sm font-medium border border-gold/20 hover:bg-gold/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40">Add items for Boomer_Angs to scout</p>
          <p className="text-xs text-white/25 mt-1">They&apos;ll find the best prices across retailers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-white/3 border border-wireframe-stroke flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  placeholder="Product name or description..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-white/30">Qty</span>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdate(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    min="1"
                    className="w-10 bg-transparent text-sm text-white text-center outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                  <DollarSign className="w-3 h-3 text-white/30" />
                  <input
                    type="number"
                    value={item.maxPrice || ''}
                    onChange={(e) => onUpdate(item.id, { maxPrice: parseFloat(e.target.value) || null })}
                    placeholder="Max"
                    className="w-16 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function MissionPreferences({
  budget,
  setBudget,
  shippingSpeed,
  setShippingSpeed,
  quality,
  setQuality,
}: {
  budget: number;
  setBudget: (b: number) => void;
  shippingSpeed: ShippingSpeed;
  setShippingSpeed: (s: ShippingSpeed) => void;
  quality: QualityPref;
  setQuality: (q: QualityPref) => void;
}) {
  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-semibold text-white">Mission Preferences</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budget */}
        <div>
          <label className="block text-xs text-white/40 mb-2">Total Budget</label>
          <div className="flex items-center gap-2 bg-white/3 border border-wireframe-stroke rounded-lg px-3 py-2">
            <DollarSign className="w-4 h-4 text-gold/60" />
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-transparent text-white text-sm outline-none"
              placeholder="500.00"
            />
          </div>
        </div>

        {/* Shipping Speed */}
        <div>
          <label className="block text-xs text-white/40 mb-2">Shipping</label>
          <div className="flex gap-1">
            {([
              { value: 'fastest', label: 'Fastest', icon: Zap },
              { value: 'standard', label: 'Standard', icon: Truck },
              { value: 'cheapest', label: 'Cheapest', icon: DollarSign },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setShippingSpeed(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all ${
                  shippingSpeed === opt.value
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'bg-white/3 text-white/40 border border-wireframe-stroke hover:bg-white/5'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-xs text-white/40 mb-2">Quality</label>
          <div className="flex gap-1">
            {([
              { value: 'budget', label: 'Budget' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'premium', label: 'Premium' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setQuality(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                  quality === opt.value
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'bg-white/3 text-white/40 border border-wireframe-stroke hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RetailerPanel() {
  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-semibold text-white">Supported Retailers</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RETAILERS.map((retailer) => (
          <div
            key={retailer.id}
            className={`p-4 rounded-xl border transition-all ${
              retailer.enabled
                ? 'bg-white/3 border-wireframe-stroke hover:border-gold/20'
                : 'bg-white/2 border-wireframe-stroke/50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{retailer.icon}</span>
              <div>
                <h3 className="text-sm font-medium text-white">{retailer.name}</h3>
                <span className={`text-[10px] font-mono uppercase ${
                  retailer.enabled ? 'text-emerald-400' : 'text-white/30'
                }`}>
                  {retailer.enabled ? 'Active' : 'Coming Soon'}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {retailer.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-white/50">
                  <CheckCircle className="w-3 h-3 text-emerald-500/60 flex-shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealScout() {
  return (
    <div className="wireframe-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Deal Scout</h2>
        <span className="ml-auto text-xs text-white/30">AI-discovered deals</span>
      </div>

      <div className="space-y-3">
        {SAMPLE_DEALS.map((deal) => (
          <div
            key={deal.id}
            className="p-4 rounded-xl bg-white/3 border border-wireframe-stroke hover:border-gold/10 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">{deal.product}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">{deal.retailer}</span>
                  {deal.prime && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Prime</span>
                  )}
                  <span className="flex items-center gap-0.5 text-xs text-gold/60">
                    <Star className="w-3 h-3" />
                    {deal.rating} ({deal.reviews.toLocaleString()})
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm text-white/40 line-through">${deal.originalPrice.toFixed(2)}</div>
                <div className="text-lg font-bold text-emerald-400">${deal.salePrice.toFixed(2)}</div>
                <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {deal.discount}% off
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityBanner() {
  return (
    <div className="wireframe-card p-4 border-emerald-500/20 bg-emerald-500/5">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-emerald-400">Secure by Design</h3>
          <p className="text-xs text-white/40 mt-0.5">
            Boomer_Angs <strong className="text-white/60">never</strong> access payment info. They scout, compare, and report.
            ACHEEVY handles all payments with your explicit approval.
          </p>
        </div>
      </div>
    </div>
  );
}

function MissionLauncher({
  items,
  budget,
  onLaunch,
}: {
  items: ShoppingListItem[];
  budget: number;
  onLaunch: () => void;
}) {
  const validItems = items.filter(i => i.name.trim().length > 0);
  const canLaunch = validItems.length > 0 && budget > 0;

  return (
    <div className="wireframe-card p-6 border-gold/20 bg-gold/5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gold">Ready to Scout?</h2>
          <p className="text-xs text-white/40 mt-1">
            {validItems.length} items | Budget: ${budget.toFixed(2)} | Boomer_Angs will find the best deals
          </p>
        </div>
        <button
          onClick={onLaunch}
          disabled={!canLaunch}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
            canLaunch
              ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          <Search className="w-4 h-4" />
          Launch Shopping Mission
        </button>
      </div>
    </div>
  );
}

// Settings icon component for MissionPreferences
function Settings2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function BuyInBulkPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [budget, setBudget] = useState<number>(500);
  const [shippingSpeed, setShippingSpeed] = useState<ShippingSpeed>('standard');
  const [quality, setQuality] = useState<QualityPref>('balanced');
  const [activeTab, setActiveTab] = useState<'mission' | 'deals' | 'alerts' | 'history'>('mission');
  const [missionLaunched, setMissionLaunched] = useState(false);

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 1,
      maxPrice: null,
      category: '',
      required: true,
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ShoppingListItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const launchMission = () => {
    setMissionLaunched(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Buy in Bulk</h1>
            <p className="text-sm text-white/40">AI shopping assistant — deals at scale</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            LIVE
          </span>
        </div>
      </div>

      {/* Security Notice */}
      <SecurityBanner />

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'mission', label: 'New Mission', icon: Search },
          { id: 'deals', label: 'Deal Scout', icon: TrendingDown },
          { id: 'alerts', label: 'Price Alerts', icon: Bell },
          { id: 'history', label: 'History', icon: Clock },
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
      {activeTab === 'mission' && (
        <div className="space-y-6">
          {!missionLaunched ? (
            <>
              <ShoppingListBuilder
                items={items}
                onAdd={addItem}
                onRemove={removeItem}
                onUpdate={updateItem}
              />
              <MissionPreferences
                budget={budget}
                setBudget={setBudget}
                shippingSpeed={shippingSpeed}
                setShippingSpeed={setShippingSpeed}
                quality={quality}
                setQuality={setQuality}
              />
              <RetailerPanel />
              <MissionLauncher items={items} budget={budget} onLaunch={launchMission} />
            </>
          ) : (
            <div className="wireframe-card p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4"
              >
                <Users className="w-8 h-8 text-gold" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Mission Launched!</h2>
              <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
                Boomer_Angs are scouting {items.filter(i => i.name.trim()).length} items across {RETAILERS.filter(r => r.enabled).length} retailers.
                They&apos;ll report back with the best deals and bulk pricing options.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  Scouting in progress...
                </div>
              </div>
              <button
                onClick={() => setMissionLaunched(false)}
                className="mt-6 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white border border-wireframe-stroke hover:bg-white/5 transition-all"
              >
                Start New Mission
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'deals' && (
        <DealScout />
      )}

      {activeTab === 'alerts' && (
        <div className="wireframe-card p-8 text-center">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">Price Alerts</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
            Set alerts for products you&apos;re watching. Boomer_Angs will notify you when prices drop to your target.
          </p>
          <button className="px-6 py-3 rounded-xl bg-gold text-black text-sm font-medium hover:bg-gold/90 transition-colors">
            Create Price Alert
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="wireframe-card p-8 text-center">
          <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">Mission History</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Your completed shopping missions will appear here. Launch your first mission to get started!
          </p>
        </div>
      )}
    </div>
  );
}
