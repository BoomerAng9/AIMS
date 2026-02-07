// @ts-nocheck
/**
 * Garage to Global - Seller/Entrepreneur Types
 *
 * Boomer_Angs help entrepreneurs scale from garage operations
 * to global marketplaces. The reverse of "Buy in Bulk" - this is
 * "Sell Everywhere" with AI-powered marketplace management.
 */

// ─────────────────────────────────────────────────────────────
// Seller Profile
// ─────────────────────────────────────────────────────────────

export type SellerStage =
  | 'garage'      // Just starting, 1-10 products
  | 'workshop'    // Growing, 10-100 products
  | 'warehouse'   // Established, 100-1000 products
  | 'enterprise'  // Large scale, 1000+ products
  | 'global';     // International, multi-region

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  stage: SellerStage;

  // Business info
  businessType: 'individual' | 'llc' | 'corporation' | 'partnership';
  taxId?: string;
  country: string;
  regions: string[]; // Selling regions

  // Connected marketplaces
  marketplaces: MarketplaceConnection[];

  // Inventory
  totalProducts: number;
  totalInventoryValue: number;

  // Performance
  metrics: SellerMetrics;

  // Boomer_Ang teams
  activeTeams: SellerTeam[];

  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceConnection {
  id: string;
  marketplace: MarketplaceType;
  status: 'connected' | 'pending' | 'disconnected' | 'suspended';
  sellerId: string;
  storeName?: string;
  storeUrl?: string;
  credentials: {
    encrypted: boolean;
    lastRefreshed?: Date;
  };
  settings: MarketplaceSettings;
  metrics: MarketplaceMetrics;
  connectedAt: Date;
}

export type MarketplaceType =
  | 'amazon'
  | 'ebay'
  | 'walmart'
  | 'etsy'
  | 'shopify'
  | 'woocommerce'
  | 'alibaba'
  | 'mercadolibre'
  | 'rakuten'
  | 'kdp'
  | 'tiktok'
  | 'custom';

export interface MarketplaceSettings {
  autoReprice: boolean;
  autoFulfill: boolean;
  autoRespond: boolean;
  minPrice?: number;
  maxPrice?: number;
  targetMargin?: number;
  shippingTemplateId?: string;
}

export interface MarketplaceMetrics {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  revenue: number;
  rating?: number;
  feedbackCount?: number;
  lastSyncAt?: Date;
}

// ─────────────────────────────────────────────────────────────
// Product Catalog
// ─────────────────────────────────────────────────────────────

export interface SellerProduct {
  id: string;
  sellerId: string;
  sku: string;
  title: string;
  name: string; // Alias for title (used across codebase)
  description: string;
  category: string;
  brand?: string;
  features?: string[]; // Used in listing-optimizer
  tags?: string[]; // Used in listing-optimizer for keyword generation

  // Media
  images: ProductImage[];
  videos?: ProductVideo[];

  // Variants
  variants: ProductVariant[];
  hasVariants: boolean;

  // Pricing
  baseCost: number; // Your cost
  suggestedPrice: number; // AI suggested
  basePrice?: number; // Current selling price (used by marketplace adapters)
  compareAtPrice?: number; // Original/compare price for sale display
  margin: number;

  // Inventory
  totalQuantity: number;
  lowStockThreshold: number;
  inventory?: { totalQuantity: number }; // Nested accessor for compatibility

  // Marketplace listings
  listings: MarketplaceListing[];

  // AI-generated
  aiDescription?: string;
  aiKeywords?: string[];
  aiBulletPoints?: string[];

  // Status
  status: 'draft' | 'active' | 'paused' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  altText?: string;
  aiEnhanced?: boolean;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  type: 'demo' | 'unboxing' | 'testimonial' | 'lifestyle';
}

export interface ProductVariant {
  id: string;
  sku: string;
  name?: string; // Variant display name
  attributes: Record<string, string>; // size: "XL", color: "Blue"
  price: number;
  quantity: number;
  image?: string;
}

export interface MarketplaceListing {
  id: string;
  productId: string;
  marketplace: MarketplaceType;
  listingId: string; // Marketplace's ID
  listingUrl: string;
  status: 'active' | 'inactive' | 'pending' | 'suppressed' | 'error';

  // Marketplace-specific
  title: string;
  description?: string;
  bulletPoints?: string[];
  backendKeywords?: string[];
  keywords?: string[];
  images?: string[];
  price: number;
  quantity: number;
  fulfillment: 'merchant' | 'marketplace'; // FBA, WFS, etc.

  // Performance
  views?: number;
  sales?: number;
  conversionRate?: number;
  searchRank?: number;

  // Sync
  lastSyncAt: Date;
  syncErrors?: string[];
}

// ─────────────────────────────────────────────────────────────
// Seller Operations (Boomer_Ang Missions)
// ─────────────────────────────────────────────────────────────

export type SellerMissionType =
  | 'market_research'        // Research demand, competition
  | 'listing_optimization'   // Improve listings
  | 'price_optimization'     // Optimize pricing
  | 'inventory_sync'         // Sync across marketplaces
  | 'inventory_management'   // Manage inventory
  | 'review_management'      // Handle reviews/feedback
  | 'customer_service'       // Answer questions
  | 'expansion'              // Expand to new marketplaces
  | 'marketplace_expansion'  // Expand to new marketplaces
  | 'competitor_analysis'    // Monitor competitors
  | 'advertising'            // Manage ads
  | 'advertising_setup'      // Set up advertising
  | 'advertising_optimization' // Optimize ads
  | 'product_expansion'      // Expand product line
  | 'content_creation'       // Create descriptions, images
  | 'brand_building'         // Build brand presence
  | 'analytics_setup'        // Set up analytics
  | 'channel_expansion'      // Expand sales channels
  | 'customer_acquisition'   // Acquire new customers
  | 'operations_optimization' // Optimize operations
  | 'international_expansion' // Expand internationally
  | 'team_building'          // Build team
  | 'exit_preparation';      // Prepare for exit

export interface SellerMission {
  id: string;
  sellerId: string;
  type: SellerMissionType;
  status: 'planning' | 'active' | 'paused' | 'complete' | 'failed';
  title: string;
  description: string;

  // Scope
  scope: {
    marketplaces?: MarketplaceType[];
    products?: string[]; // Product IDs
    categories?: string[];
  };

  // Configuration
  config: Record<string, unknown>;

  // Teams
  teams: SellerTeam[];

  // Results
  results?: MissionResults;
  recommendations?: Recommendation[];

  // Schedule
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    nextRun?: Date;
  };

  createdAt: Date;
  completedAt?: Date;
}

export interface SellerTeam {
  id: string;
  name: string;
  missionId: string;
  role: SellerTeamRole;
  agents: SellerAgent[];
  status: 'idle' | 'working' | 'complete';
  progress: number;
}

export type SellerTeamRole =
  | 'researcher'     // Market research
  | 'optimizer'      // Listing/price optimization
  | 'syncer'         // Inventory sync
  | 'responder'      // Customer service
  | 'advertiser'     // Ad management
  | 'creator'        // Content creation
  | 'analyst';       // Competitor analysis

export interface SellerAgent {
  id: string;
  angId: string;
  specialization: string;
  status: 'idle' | 'working' | 'waiting' | 'complete';
  currentTask?: string;
  capabilities: string[];
}

export interface MissionResults {
  summary: string;
  metrics: Record<string, number>;
  actions: ActionTaken[];
  insights: string[];
}

export interface ActionTaken {
  id: string;
  type: string;
  description: string;
  marketplace?: string;
  productId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
  success: boolean;
}

export interface Recommendation {
  id: string;
  type: 'pricing' | 'listing' | 'inventory' | 'expansion' | 'marketing' | 'optimization' | 'growth' | 'automation' | 'operational' | 'financial' | 'strategic' | string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  // Legacy properties (used in listing-optimizer and growth-orchestrator)
  actionItems?: string[];
  estimatedImpact?: string;
  effort?: 'easy' | 'medium' | 'hard';
  // Structured impact (preferred)
  impact?: {
    metric: string;
    estimated: number;
    confidence: number;
  };
  actions?: string[];
  autoApply?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Market Research
// ─────────────────────────────────────────────────────────────

export interface MarketResearch {
  id: string;
  category: string;
  keywords: string[];
  researchedAt: Date;

  // Demand
  demand: {
    searchVolume: number;
    trend: 'growing' | 'stable' | 'declining';
    seasonality?: SeasonalTrend[];
  };

  // Competition
  competition: {
    totalListings: number;
    topSellers: CompetitorInfo[];
    averagePrice: number;
    priceRange: { min: number; max: number };
    averageRating: number;
  };

  // Opportunity
  opportunity: {
    score: number; // 0-100
    reasoning: string;
    suggestedPrice: number;
    suggestedMargin: number;
    barriers: string[];
    advantages: string[];
  };
}

export interface SeasonalTrend {
  month: number;
  demandMultiplier: number;
  notes?: string;
}

export interface CompetitorInfo {
  name: string;
  marketplace: MarketplaceType;
  price: number;
  rating: number;
  reviewCount: number;
  estimatedSales?: number;
  listingUrl: string;
}

// ─────────────────────────────────────────────────────────────
// Pricing Intelligence
// ─────────────────────────────────────────────────────────────

export interface PricingStrategy {
  id: string;
  productId: string;
  strategy: 'competitive' | 'premium' | 'penetration' | 'dynamic';

  // Rules
  rules: PricingRule[];

  // Current state
  currentPrice: number;
  suggestedPrice: number;
  lastAdjusted?: Date;

  // Performance
  metrics: {
    priceChanges: number;
    revenueImpact: number;
    competitorReactions: number;
  };
}

export interface PricingRule {
  id: string;
  name: string;
  condition: string; // e.g., "competitor_price < my_price - 5"
  action: string; // e.g., "match_competitor + 0.01"
  priority: number;
  active: boolean;
}

// ─────────────────────────────────────────────────────────────
// Garage to Global Journey
// ─────────────────────────────────────────────────────────────

export interface GrowthJourney {
  sellerId: string;
  currentStage: SellerStage;
  startedAt: Date;

  // Milestones
  milestones: GrowthMilestone[];

  // Next steps
  nextMilestone: GrowthMilestone;
  recommendedActions: GrowthAction[];

  // Progress
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    marketplacesActive: number;
    countriesReached: number;
    productsListed: number;
  };
}

export interface GrowthMilestone {
  id: string;
  stage: SellerStage;
  name: string;
  description: string;
  requirements: MilestoneRequirement[];
  achieved: boolean;
  achievedAt?: Date;
  rewards?: string[];
}

export interface MilestoneRequirement {
  metric: string;
  target: number;
  current: number;
  met: boolean;
}

export interface GrowthAction {
  id: string;
  title: string;
  description: string;
  category: 'listing' | 'pricing' | 'marketing' | 'expansion' | 'operations';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  automated: boolean; // Can Boomer_Angs do this?
  missionType?: SellerMissionType;
}

// ─────────────────────────────────────────────────────────────
// Seller Analytics
// ─────────────────────────────────────────────────────────────

export interface SellerMetrics {
  // Revenue
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    trend: number; // % change
  };

  // Orders
  orders: {
    pending: number;
    shipped: number;
    delivered: number;
    returned: number;
  };

  // Performance
  performance: {
    conversionRate: number;
    averageOrderValue: number;
    customerSatisfaction: number;
    responseTime: number; // hours
  };

  // Inventory
  inventory: {
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockedItems: number;
  };

  // Health
  health: {
    score: number; // 0-100
    issues: HealthIssue[];
    lastUpdated: Date;
  };

  // Legacy/convenience accessors (optional - for backward compatibility)
  monthlyRevenue?: number;
  totalProducts?: number;
  orderCount?: number;
  marketplaces?: { length: number }[];
  totalReviews?: number;
  profitMargin?: number;
}

export interface HealthIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  affectedListings?: number;
  suggestedAction?: string;
}

// ─────────────────────────────────────────────────────────────
// Supported Growth Stages
// ─────────────────────────────────────────────────────────────

export const GROWTH_STAGES: Record<SellerStage, {
  name: string;
  description: string;
  features: string[];
  nextStage?: SellerStage;
}> = {
  garage: {
    name: 'Garage',
    description: 'Just starting out with 1-10 products',
    features: [
      'Basic listing creation',
      'Single marketplace',
      'Manual inventory',
      'AI listing assistance',
    ],
    nextStage: 'workshop',
  },
  workshop: {
    name: 'Workshop',
    description: 'Growing business with 10-100 products',
    features: [
      'Multi-marketplace listing',
      'Basic inventory sync',
      'Price monitoring',
      'Competitor tracking',
    ],
    nextStage: 'warehouse',
  },
  warehouse: {
    name: 'Warehouse',
    description: 'Established seller with 100-1000 products',
    features: [
      'Full inventory automation',
      'Dynamic repricing',
      'Automated customer service',
      'Advanced analytics',
    ],
    nextStage: 'enterprise',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Large scale operation with 1000+ products',
    features: [
      'Full automation',
      'Multi-region selling',
      'Custom integrations',
      'Dedicated Boomer_Ang teams',
    ],
    nextStage: 'global',
  },
  global: {
    name: 'Global',
    description: 'International presence across multiple regions',
    features: [
      'Global logistics',
      'Multi-currency',
      'International compliance',
      'White-glove service',
    ],
  },
};
