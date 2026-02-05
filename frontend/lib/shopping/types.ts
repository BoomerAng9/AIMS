/**
 * Buy in Bulk - Type Definitions
 *
 * Types for the shopping mission system where Boomer_Angs
 * scout for products and ACHEEVY manages purchases.
 */

// ─────────────────────────────────────────────────────────────
// Shopping Mission
// ─────────────────────────────────────────────────────────────

export type MissionStatus =
  | 'planning'        // Initial setup
  | 'scouting'        // Boomer_Angs searching
  | 'comparing'       // Comparing options
  | 'awaiting_approval' // Cart ready for user review
  | 'purchasing'      // Purchase in progress
  | 'completed'       // Successfully purchased
  | 'cancelled';      // User cancelled

export interface ShoppingMission {
  id: string;
  userId: string;
  status: MissionStatus;
  title: string;
  description?: string;

  // What to buy
  items: ShoppingItem[];

  // Budget constraints
  budget: BudgetConstraints;

  // User preferences
  preferences: ShoppingPreferences;

  // Results
  cart?: AggregatedCart;
  options?: CartOption[];

  // Change management
  changeRequests: ShoppingChangeRequest[];

  // Teams and progress
  teams: ShoppingTeam[];
  progress: MissionProgress;

  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface ShoppingItem {
  id: string;
  description: string;
  quantity: number;
  maxPricePerUnit?: number;
  category?: string;
  specifications?: Record<string, string>;
  alternatives?: string[]; // Acceptable alternative products
  required: boolean; // Must-have vs nice-to-have
}

export interface BudgetConstraints {
  totalLimit: number;
  perItemLimit?: number;
  currency: string;
  flexibilityPercent?: number; // Allow X% over for good deals
}

export interface ShoppingPreferences {
  preferredRetailers?: string[];
  excludedRetailers?: string[];
  shippingSpeed: 'fastest' | 'standard' | 'cheapest';
  bulkDiscountPriority: boolean;
  ecoFriendly?: boolean;
  domesticOnly?: boolean;
  primeOnly?: boolean; // Amazon Prime
}

// ─────────────────────────────────────────────────────────────
// Cart & Products
// ─────────────────────────────────────────────────────────────

export interface CartOption {
  id: string;
  name: string; // "Best Value", "Budget Pick", "Premium"
  description: string;
  items: CartItem[];
  summary: CartSummary;
  savings: number;
  recommended: boolean;
}

export interface AggregatedCart {
  id: string;
  missionId: string;
  items: CartItem[];
  summary: CartSummary;
  retailerBreakdown: RetailerSummary[];
  status: 'draft' | 'approved' | 'purchased';
  approvedAt?: Date;
  approvedBy?: string;
}

export interface CartItem {
  id: string;
  itemId: string; // Reference to ShoppingItem
  productId: string;
  productName: string;
  productUrl: string;
  productImage?: string;

  // Retailer info
  retailer: string;
  retailerProductId: string;

  // Pricing
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
  originalPrice?: number; // If on sale
  savings?: number;

  // Bulk discount
  bulkDiscount?: {
    threshold: number;
    discountPercent: number;
    appliedDiscount: number;
  };

  // Availability
  availability: 'in_stock' | 'limited' | 'backorder' | 'out_of_stock';
  stockCount?: number;

  // Shipping
  shippingCost: number;
  shippingEstimate: string;
  freeShippingThreshold?: number;

  // Metadata
  rating?: number;
  reviewCount?: number;
  isPrime?: boolean;
  isBestSeller?: boolean;
}

export interface CartSummary {
  subtotal: number;
  shippingTotal: number;
  taxEstimate: number;
  totalSavings: number;
  grandTotal: number;
  itemCount: number;
  estimatedDelivery: {
    earliest: Date;
    latest: Date;
  };
}

export interface RetailerSummary {
  retailer: string;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  freeShippingEligible: boolean;
  orderUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// Shopping Teams (Boomer_Angs)
// ─────────────────────────────────────────────────────────────

export interface ShoppingTeam {
  id: string;
  name: string;
  missionId: string;
  retailer?: string; // Which retailer this team searches
  status: 'idle' | 'searching' | 'comparing' | 'reporting' | 'complete';

  // Team members
  agents: ShoppingAgent[];

  // Tasks
  tasks: ShoppingTask[];

  // Results
  findings: ProductFinding[];

  // Progress
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
}

export interface ShoppingAgent {
  id: string;
  angId: string; // Boomer_Ang ID
  role: 'scout' | 'price_monitor' | 'comparator' | 'validator';
  status: 'idle' | 'working' | 'waiting' | 'complete' | 'error';
  currentTask?: string;
  lastActivity?: Date;
}

export interface ShoppingTask {
  id: string;
  teamId: string;
  type: 'search' | 'compare' | 'validate' | 'monitor';
  description: string;
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  assignedTo?: string; // Agent ID
  priority: 'low' | 'medium' | 'high';
  result?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ProductFinding {
  id: string;
  teamId: string;
  itemId: string; // Which ShoppingItem this matches
  product: {
    id: string;
    name: string;
    url: string;
    image?: string;
    price: number;
    originalPrice?: number;
    retailer: string;
    availability: string;
    rating?: number;
    reviewCount?: number;
  };
  matchScore: number; // How well it matches the request (0-100)
  priceScore: number; // How good the price is (0-100)
  notes?: string;
  foundAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Change Requests
// ─────────────────────────────────────────────────────────────

export interface ShoppingChangeRequest {
  id: string;
  missionId: string;
  type: 'budget_exceeded' | 'item_unavailable' | 'better_alternative' | 'price_change';
  status: 'pending' | 'approved' | 'rejected';

  // What triggered the change request
  trigger: {
    itemId: string;
    reason: string;
    originalValue: unknown;
    proposedValue: unknown;
  };

  // Cost impact
  impact: {
    priceDifference: number;
    percentChange: number;
  };

  // Resolution
  resolvedAt?: Date;
  resolvedBy?: 'user' | 'acheevy' | 'auto';
  resolution?: string;

  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Mission Progress
// ─────────────────────────────────────────────────────────────

export interface MissionProgress {
  phase: 'setup' | 'search' | 'compare' | 'review' | 'purchase' | 'complete';
  percentComplete: number;
  currentActivity: string;
  teamsActive: number;
  itemsFound: number;
  itemsSearched: number;
  estimatedTimeRemaining?: number; // seconds
  events: ProgressEvent[];
}

export interface ProgressEvent {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  teamId?: string;
  agentId?: string;
}

// ─────────────────────────────────────────────────────────────
// Price Monitoring
// ─────────────────────────────────────────────────────────────

export interface PriceAlert {
  id: string;
  userId: string;
  productUrl: string;
  productName: string;
  retailer: string;
  targetPrice: number;
  currentPrice: number;
  status: 'active' | 'triggered' | 'expired' | 'cancelled';
  notifyVia: ('email' | 'push' | 'sms')[];
  createdAt: Date;
  triggeredAt?: Date;
  expiresAt?: Date;
}

export interface PriceHistory {
  productUrl: string;
  retailer: string;
  prices: {
    price: number;
    timestamp: Date;
  }[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
}

// ─────────────────────────────────────────────────────────────
// Payment (ACHEEVY Only)
// ─────────────────────────────────────────────────────────────

export interface PaymentVault {
  userId: string;
  methods: SavedPaymentMethod[];
  defaultMethodId?: string;
  preferences: PaymentPreferences;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal' | 'amazon_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
  stripePaymentMethodId?: string;
  addedAt: Date;
}

export interface PaymentPreferences {
  autoApproveUnder?: number; // Auto-approve purchases under this amount
  requireConfirmation: boolean;
  preferredMethod?: string;
}

// ─────────────────────────────────────────────────────────────
// Retailer Configuration
// ─────────────────────────────────────────────────────────────

export interface RetailerConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiType: 'affiliate' | 'direct' | 'scrape';
  capabilities: {
    search: boolean;
    bulkOrder: boolean;
    priceHistory: boolean;
    realTimeInventory: boolean;
  };
  credentials?: {
    apiKey?: string;
    affiliateId?: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export const SUPPORTED_RETAILERS: RetailerConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    enabled: true,
    apiType: 'affiliate',
    capabilities: {
      search: true,
      bulkOrder: true,
      priceHistory: true,
      realTimeInventory: true,
    },
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 8640 },
  },
  {
    id: 'walmart',
    name: 'Walmart',
    enabled: true,
    apiType: 'affiliate',
    capabilities: {
      search: true,
      bulkOrder: true,
      priceHistory: false,
      realTimeInventory: true,
    },
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 5000 },
  },
  {
    id: 'alibaba',
    name: 'Alibaba',
    enabled: false, // Phase 3
    apiType: 'direct',
    capabilities: {
      search: true,
      bulkOrder: true,
      priceHistory: false,
      realTimeInventory: false,
    },
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 1000 },
  },
];
