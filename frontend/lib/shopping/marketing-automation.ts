/**
 * Marketing Automation — Multi-Channel Marketing Orchestration
 *
 * Boomer_Ang-powered marketing automation for sellers.
 * Handles advertising, promotions, email, social, and launch strategies.
 *
 * Capabilities:
 * - Amazon PPC campaign management
 * - Shopify/Meta ads integration
 * - KDP promotional tools (Countdown deals, Free book promos)
 * - Email marketing sequences
 * - Social media scheduling
 * - Launch and promotional calendars
 * - ROI tracking and optimization
 */

import { v4 as uuidv4 } from 'uuid';
import type { MarketplaceType, SellerProduct, MarketplaceListing } from './seller-types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MarketingCampaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channels: MarketingChannel[];
  products: string[]; // Product IDs
  budget: CampaignBudget;
  schedule: CampaignSchedule;
  targeting?: CampaignTargeting;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignType =
  | 'product_launch'
  | 'seasonal_promotion'
  | 'clearance'
  | 'brand_awareness'
  | 'retargeting'
  | 'review_generation'
  | 'evergreen';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

export type MarketingChannel =
  | 'amazon_ppc'
  | 'amazon_dsp'
  | 'shopify_google'
  | 'shopify_facebook'
  | 'etsy_ads'
  | 'kdp_ads'
  | 'email'
  | 'social_organic'
  | 'influencer';

export interface CampaignBudget {
  total: number;
  daily?: number;
  spent: number;
  remaining: number;
  currency: string;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  dayParting?: { days: number[]; hours: { start: number; end: number } };
  timezone: string;
}

export interface CampaignTargeting {
  keywords?: string[];
  audiences?: string[];
  demographics?: {
    ageMin?: number;
    ageMax?: number;
    gender?: 'all' | 'male' | 'female';
    interests?: string[];
    locations?: string[];
  };
  competitors?: string[]; // ASIN targeting for Amazon
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  acos: number; // Advertising Cost of Sale
  roas: number; // Return on Ad Spend
  cpc: number; // Cost per Click
  ctr: number; // Click Through Rate
  conversionRate: number;
}

// ─────────────────────────────────────────────────────────────
// Ad Group and Keyword Types
// ─────────────────────────────────────────────────────────────

export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  type: 'keyword' | 'product' | 'auto' | 'audience';
  status: 'enabled' | 'paused';
  defaultBid: number;
  keywords?: AdKeyword[];
  targetedProducts?: string[];
  metrics: AdGroupMetrics;
}

export interface AdKeyword {
  id: string;
  keyword: string;
  matchType: 'exact' | 'phrase' | 'broad';
  bid: number;
  status: 'enabled' | 'paused' | 'negative';
  metrics: KeywordMetrics;
}

export interface AdGroupMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  acos: number;
  orders: number;
}

export interface KeywordMetrics extends AdGroupMetrics {
  searchVolume?: number;
  competitionIndex?: number;
  suggestedBid?: number;
}

// ─────────────────────────────────────────────────────────────
// Email Marketing Types
// ─────────────────────────────────────────────────────────────

export interface EmailSequence {
  id: string;
  name: string;
  trigger: EmailTrigger;
  emails: SequenceEmail[];
  status: 'draft' | 'active' | 'paused';
  metrics: EmailSequenceMetrics;
}

export type EmailTrigger =
  | 'purchase'
  | 'cart_abandon'
  | 'browse_abandon'
  | 'signup'
  | 'review_request'
  | 'win_back'
  | 'product_launch';

export interface SequenceEmail {
  id: string;
  subject: string;
  previewText: string;
  body: string;
  delay: { value: number; unit: 'hours' | 'days' };
  conditions?: EmailCondition[];
}

export interface EmailCondition {
  field: 'opened_previous' | 'clicked_previous' | 'purchased' | 'segment';
  operator: 'equals' | 'not_equals' | 'contains';
  value: string | boolean;
}

export interface EmailSequenceMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  revenue: number;
}

// ─────────────────────────────────────────────────────────────
// Social Media Types
// ─────────────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  media?: string[];
  hashtags?: string[];
  scheduledAt: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics?: SocialMetrics;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'pinterest' | 'twitter' | 'linkedin';

export interface SocialMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
}

// ─────────────────────────────────────────────────────────────
// Launch Strategy Types
// ─────────────────────────────────────────────────────────────

export interface LaunchStrategy {
  id: string;
  productId: string;
  marketplace: MarketplaceType;
  phases: LaunchPhase[];
  budget: number;
  startDate: Date;
  status: 'planning' | 'active' | 'completed';
  metrics: LaunchMetrics;
}

export interface LaunchPhase {
  name: string;
  duration: number; // days
  activities: LaunchActivity[];
  goals: LaunchGoal[];
}

export interface LaunchActivity {
  type: 'ppc' | 'promotion' | 'social' | 'email' | 'influencer' | 'review_request';
  description: string;
  budget?: number;
  schedule: { day: number; action: string }[];
}

export interface LaunchGoal {
  metric: 'sales' | 'reviews' | 'ranking' | 'bsr' | 'revenue';
  target: number;
  achieved?: number;
}

export interface LaunchMetrics {
  totalSales: number;
  totalSpend: number;
  reviewsGained: number;
  bestSellerRank?: number;
  organicRank?: { keyword: string; position: number }[];
}

// ─────────────────────────────────────────────────────────────
// Promotion Types
// ─────────────────────────────────────────────────────────────

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  marketplace: MarketplaceType;
  products: string[];
  discount: PromotionDiscount;
  schedule: { start: Date; end: Date };
  conditions?: PromotionConditions;
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  metrics: PromotionMetrics;
}

export type PromotionType =
  | 'percentage_off'
  | 'fixed_discount'
  | 'bogo'
  | 'bundle'
  | 'free_shipping'
  | 'lightning_deal'
  | 'countdown_deal'
  | 'prime_exclusive'
  | 'coupon'
  | 'free_book'; // KDP

export interface PromotionDiscount {
  type: 'percentage' | 'fixed' | 'free';
  value: number;
  originalPrice?: number;
  salePrice?: number;
}

export interface PromotionConditions {
  minPurchase?: number;
  maxUses?: number;
  perCustomerLimit?: number;
  stackable?: boolean;
  audienceRestriction?: string;
}

export interface PromotionMetrics {
  impressions: number;
  claims: number;
  redemptions: number;
  revenue: number;
  avgOrderValue: number;
  newCustomers: number;
}

// ─────────────────────────────────────────────────────────────
// Marketing Automation Engine
// ─────────────────────────────────────────────────────────────

export class MarketingAutomation {
  private campaigns: Map<string, MarketingCampaign> = new Map();
  private emailSequences: Map<string, EmailSequence> = new Map();
  private socialPosts: Map<string, SocialPost> = new Map();
  private launchStrategies: Map<string, LaunchStrategy> = new Map();
  private promotions: Map<string, Promotion> = new Map();

  // ─────────────────────────────────────────────────────────────
  // Campaign Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a new marketing campaign
   */
  createCampaign(params: {
    name: string;
    type: CampaignType;
    channels: MarketingChannel[];
    products: string[];
    budget: Omit<CampaignBudget, 'spent' | 'remaining'>;
    schedule: CampaignSchedule;
    targeting?: CampaignTargeting;
  }): MarketingCampaign {
    const campaign: MarketingCampaign = {
      id: uuidv4(),
      ...params,
      status: 'draft',
      budget: {
        ...params.budget,
        spent: 0,
        remaining: params.budget.total,
      },
      metrics: this.initializeMetrics(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Generate campaign structure based on goals
   */
  generateCampaignStrategy(params: {
    product: SellerProduct;
    marketplace: MarketplaceType;
    goal: 'launch' | 'scale' | 'profit' | 'liquidate';
    budget: number;
    duration: number; // days
  }): MarketingCampaign {
    const { product, marketplace, goal, budget, duration } = params;

    // Strategy templates based on goal
    const strategies: Record<string, Partial<MarketingCampaign>> = {
      launch: {
        type: 'product_launch',
        channels: this.getChannelsForMarketplace(marketplace, 'launch'),
      },
      scale: {
        type: 'evergreen',
        channels: this.getChannelsForMarketplace(marketplace, 'scale'),
      },
      profit: {
        type: 'evergreen',
        channels: ['amazon_ppc'], // Focus on proven profitable channels
      },
      liquidate: {
        type: 'clearance',
        channels: this.getChannelsForMarketplace(marketplace, 'clearance'),
      },
    };

    const strategy = strategies[goal];

    return this.createCampaign({
      name: `${product.name} - ${goal.charAt(0).toUpperCase() + goal.slice(1)} Campaign`,
      type: strategy.type as CampaignType,
      channels: strategy.channels as MarketingChannel[],
      products: [product.id],
      budget: {
        total: budget,
        daily: budget / duration,
        currency: 'USD',
      },
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        timezone: 'America/New_York',
      },
      targeting: this.generateTargeting(product, marketplace, goal),
    });
  }

  /**
   * Generate Amazon PPC structure
   */
  generateAmazonPPCStructure(params: {
    product: SellerProduct;
    keywords: { keyword: string; searchVolume: number; competition: string }[];
    budget: number;
  }): { campaigns: MarketingCampaign[]; adGroups: AdGroup[] } {
    const { product, keywords, budget } = params;
    const campaigns: MarketingCampaign[] = [];
    const adGroups: AdGroup[] = [];

    // Recommended Amazon PPC structure:
    // 1. Auto campaign (discovery)
    // 2. Research campaign (broad match)
    // 3. Performance campaign (exact match for proven keywords)
    // 4. Product targeting campaign

    // Auto Campaign
    const autoCampaign = this.createCampaign({
      name: `${product.name} - Auto`,
      type: 'evergreen',
      channels: ['amazon_ppc'],
      products: [product.id],
      budget: { total: budget * 0.2, daily: (budget * 0.2) / 30, currency: 'USD' },
      schedule: { startDate: new Date(), timezone: 'America/New_York' },
    });
    campaigns.push(autoCampaign);

    adGroups.push({
      id: uuidv4(),
      campaignId: autoCampaign.id,
      name: 'Auto - All',
      type: 'auto',
      status: 'enabled',
      defaultBid: 0.75,
      metrics: this.initializeAdGroupMetrics(),
    });

    // Research Campaign (Broad)
    const researchCampaign = this.createCampaign({
      name: `${product.name} - Research`,
      type: 'evergreen',
      channels: ['amazon_ppc'],
      products: [product.id],
      budget: { total: budget * 0.3, daily: (budget * 0.3) / 30, currency: 'USD' },
      schedule: { startDate: new Date(), timezone: 'America/New_York' },
      targeting: { keywords: keywords.slice(0, 20).map((k) => k.keyword) },
    });
    campaigns.push(researchCampaign);

    // Group keywords by theme
    const broadKeywords: AdKeyword[] = keywords.slice(0, 20).map((k) => ({
      id: uuidv4(),
      keyword: k.keyword,
      matchType: 'broad',
      bid: this.calculateBid(k.searchVolume, k.competition),
      status: 'enabled',
      metrics: this.initializeKeywordMetrics(),
    }));

    adGroups.push({
      id: uuidv4(),
      campaignId: researchCampaign.id,
      name: 'Research - Broad',
      type: 'keyword',
      status: 'enabled',
      defaultBid: 0.85,
      keywords: broadKeywords,
      metrics: this.initializeAdGroupMetrics(),
    });

    // Performance Campaign (Exact)
    const performanceCampaign = this.createCampaign({
      name: `${product.name} - Performance`,
      type: 'evergreen',
      channels: ['amazon_ppc'],
      products: [product.id],
      budget: { total: budget * 0.4, daily: (budget * 0.4) / 30, currency: 'USD' },
      schedule: { startDate: new Date(), timezone: 'America/New_York' },
    });
    campaigns.push(performanceCampaign);

    // Top 10 keywords as exact match
    const exactKeywords: AdKeyword[] = keywords.slice(0, 10).map((k) => ({
      id: uuidv4(),
      keyword: k.keyword,
      matchType: 'exact',
      bid: this.calculateBid(k.searchVolume, k.competition) * 1.2, // Higher bids for exact
      status: 'enabled',
      metrics: this.initializeKeywordMetrics(),
    }));

    adGroups.push({
      id: uuidv4(),
      campaignId: performanceCampaign.id,
      name: 'Performance - Exact',
      type: 'keyword',
      status: 'enabled',
      defaultBid: 1.0,
      keywords: exactKeywords,
      metrics: this.initializeAdGroupMetrics(),
    });

    // Product Targeting Campaign
    const productCampaign = this.createCampaign({
      name: `${product.name} - Product Targeting`,
      type: 'evergreen',
      channels: ['amazon_ppc'],
      products: [product.id],
      budget: { total: budget * 0.1, daily: (budget * 0.1) / 30, currency: 'USD' },
      schedule: { startDate: new Date(), timezone: 'America/New_York' },
    });
    campaigns.push(productCampaign);

    adGroups.push({
      id: uuidv4(),
      campaignId: productCampaign.id,
      name: 'Product Targeting - Competitors',
      type: 'product',
      status: 'enabled',
      defaultBid: 0.65,
      targetedProducts: [], // Would be populated with competitor ASINs
      metrics: this.initializeAdGroupMetrics(),
    });

    return { campaigns, adGroups };
  }

  // ─────────────────────────────────────────────────────────────
  // Email Marketing
  // ─────────────────────────────────────────────────────────────

  /**
   * Create email sequence
   */
  createEmailSequence(params: {
    name: string;
    trigger: EmailTrigger;
    emails: Omit<SequenceEmail, 'id'>[];
  }): EmailSequence {
    const sequence: EmailSequence = {
      id: uuidv4(),
      name: params.name,
      trigger: params.trigger,
      emails: params.emails.map((e) => ({ ...e, id: uuidv4() })),
      status: 'draft',
      metrics: this.initializeEmailMetrics(),
    };

    this.emailSequences.set(sequence.id, sequence);
    return sequence;
  }

  /**
   * Generate review request sequence
   */
  generateReviewRequestSequence(marketplace: MarketplaceType): EmailSequence {
    // Platform-specific review request best practices
    const emails: Omit<SequenceEmail, 'id'>[] = [];

    if (marketplace === 'amazon') {
      emails.push({
        subject: 'Your order has arrived! 📦',
        previewText: "We hope you're enjoying your purchase",
        body: `Hi {first_name},

Your recent order should have arrived by now. We hope you're enjoying your {product_name}!

If you have any questions or need assistance, please don't hesitate to reach out. We're here to help!

Best regards,
{brand_name} Team

P.S. If you're loving your purchase, we'd be grateful if you'd share your experience with other shoppers.`,
        delay: { value: 7, unit: 'days' },
      });

      emails.push({
        subject: 'Quick question about your {product_name}',
        previewText: 'Your feedback matters to us',
        body: `Hi {first_name},

Just checking in! How's your {product_name} working out for you?

Your honest feedback helps us improve and helps other customers make informed decisions.

If you have a moment, we'd love to hear your thoughts.

Thank you for being a valued customer!

{brand_name} Team`,
        delay: { value: 14, unit: 'days' },
        conditions: [{ field: 'opened_previous', operator: 'equals', value: true }],
      });
    } else {
      // Shopify/DTC approach - more direct
      emails.push({
        subject: "We'd love your feedback! ⭐",
        previewText: 'Share your experience and help others',
        body: `Hi {first_name},

Thank you for your recent purchase of {product_name}!

We'd love to hear what you think. Your review helps us improve and helps other customers discover great products.

[Leave a Review Button]

As a thank you, enjoy 10% off your next order with code: THANKS10

With gratitude,
{brand_name}`,
        delay: { value: 14, unit: 'days' },
      });
    }

    return this.createEmailSequence({
      name: `Review Request - ${marketplace}`,
      trigger: 'review_request',
      emails,
    });
  }

  /**
   * Generate cart abandonment sequence
   */
  generateCartAbandonmentSequence(): EmailSequence {
    return this.createEmailSequence({
      name: 'Cart Abandonment Recovery',
      trigger: 'cart_abandon',
      emails: [
        {
          subject: 'Did you forget something? 🛒',
          previewText: 'Your cart is waiting for you',
          body: `Hi {first_name},

Looks like you left some items in your cart! No worries - we saved them for you.

{cart_items}

[Complete Your Purchase]

Need help? Just reply to this email.`,
          delay: { value: 1, unit: 'hours' },
        },
        {
          subject: 'Still thinking it over?',
          previewText: "Here's a little nudge",
          body: `Hi {first_name},

We noticed you haven't completed your purchase yet. Still have questions? Here are some common ones:

• Free shipping on orders over $50
• 30-day hassle-free returns
• 24/7 customer support

[Return to Cart]

If there's anything we can help with, we're here!`,
          delay: { value: 24, unit: 'hours' },
        },
        {
          subject: 'Last chance: 10% off your cart',
          previewText: 'Special offer just for you',
          body: `Hi {first_name},

We really want you to experience {product_name}! Use code COMEBACK10 for 10% off your order.

{cart_items}

[Claim Your Discount]

Offer expires in 24 hours.`,
          delay: { value: 48, unit: 'hours' },
          conditions: [{ field: 'purchased', operator: 'equals', value: false }],
        },
      ],
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Launch Strategy
  // ─────────────────────────────────────────────────────────────

  /**
   * Generate product launch strategy
   */
  generateLaunchStrategy(params: {
    product: SellerProduct;
    marketplace: MarketplaceType;
    budget: number;
    launchDate: Date;
  }): LaunchStrategy {
    const { product, marketplace, budget, launchDate } = params;

    let phases: LaunchPhase[] = [];

    if (marketplace === 'amazon') {
      phases = this.generateAmazonLaunchPhases(product, budget);
    } else if (marketplace === 'kdp') {
      phases = this.generateKDPLaunchPhases(product, budget);
    } else if (marketplace === 'shopify') {
      phases = this.generateShopifyLaunchPhases(product, budget);
    } else {
      phases = this.generateGenericLaunchPhases(product, budget);
    }

    const strategy: LaunchStrategy = {
      id: uuidv4(),
      productId: product.id,
      marketplace,
      phases,
      budget,
      startDate: launchDate,
      status: 'planning',
      metrics: {
        totalSales: 0,
        totalSpend: 0,
        reviewsGained: 0,
      },
    };

    this.launchStrategies.set(strategy.id, strategy);
    return strategy;
  }

  private generateAmazonLaunchPhases(product: SellerProduct, budget: number): LaunchPhase[] {
    return [
      {
        name: 'Pre-Launch (Week -1)',
        duration: 7,
        activities: [
          {
            type: 'social',
            description: 'Build anticipation on social media',
            schedule: [
              { day: 1, action: 'Announce upcoming product' },
              { day: 3, action: 'Behind-the-scenes content' },
              { day: 5, action: 'Feature highlight posts' },
              { day: 7, action: 'Launch countdown' },
            ],
          },
          {
            type: 'email',
            description: 'Notify email list of upcoming launch',
            schedule: [{ day: 5, action: 'Send launch teaser email' }],
          },
        ],
        goals: [
          { metric: 'ranking', target: 0 },
        ],
      },
      {
        name: 'Launch Week',
        duration: 7,
        activities: [
          {
            type: 'ppc',
            description: 'Aggressive PPC to drive initial sales velocity',
            budget: budget * 0.4,
            schedule: [
              { day: 1, action: 'Launch auto campaign' },
              { day: 1, action: 'Launch broad match campaign' },
              { day: 3, action: 'Analyze and adjust bids' },
              { day: 5, action: 'Add negative keywords' },
            ],
          },
          {
            type: 'promotion',
            description: 'Launch discount or coupon',
            budget: budget * 0.1,
            schedule: [{ day: 1, action: 'Activate launch coupon (15-20% off)' }],
          },
          {
            type: 'influencer',
            description: 'Coordinate influencer posts',
            budget: budget * 0.15,
            schedule: [
              { day: 1, action: 'First influencer posts' },
              { day: 4, action: 'Second wave of posts' },
            ],
          },
        ],
        goals: [
          { metric: 'sales', target: 50 },
          { metric: 'reviews', target: 5 },
        ],
      },
      {
        name: 'Momentum Building (Weeks 2-4)',
        duration: 21,
        activities: [
          {
            type: 'ppc',
            description: 'Optimize PPC based on data',
            budget: budget * 0.25,
            schedule: [
              { day: 1, action: 'Launch exact match campaign' },
              { day: 7, action: 'Weekly optimization' },
              { day: 14, action: 'Product targeting campaign' },
            ],
          },
          {
            type: 'review_request',
            description: 'Follow up with buyers for reviews',
            schedule: [{ day: 7, action: 'Activate review request sequence' }],
          },
        ],
        goals: [
          { metric: 'sales', target: 150 },
          { metric: 'reviews', target: 15 },
          { metric: 'bsr', target: 10000 },
        ],
      },
      {
        name: 'Optimization (Month 2+)',
        duration: 30,
        activities: [
          {
            type: 'ppc',
            description: 'Scale profitable campaigns, cut losers',
            budget: budget * 0.1,
            schedule: [
              { day: 1, action: 'Full campaign audit' },
              { day: 15, action: 'Scale winning keywords' },
            ],
          },
        ],
        goals: [
          { metric: 'sales', target: 300 },
          { metric: 'reviews', target: 30 },
        ],
      },
    ];
  }

  private generateKDPLaunchPhases(product: SellerProduct, budget: number): LaunchPhase[] {
    return [
      {
        name: 'Pre-Launch',
        duration: 14,
        activities: [
          {
            type: 'social',
            description: 'Build author platform and book buzz',
            schedule: [
              { day: 1, action: 'Cover reveal on social media' },
              { day: 7, action: 'Share excerpt/first chapter' },
              { day: 10, action: 'ARC reader recruitment' },
              { day: 14, action: 'Launch day countdown' },
            ],
          },
          {
            type: 'email',
            description: 'Warm up email list',
            schedule: [
              { day: 7, action: 'Announce book to list' },
              { day: 13, action: 'Launch day reminder' },
            ],
          },
        ],
        goals: [],
      },
      {
        name: 'Launch Week',
        duration: 7,
        activities: [
          {
            type: 'promotion',
            description: 'Launch pricing strategy',
            schedule: [
              { day: 1, action: 'Price at $0.99 (if enrolled in KDP Select)' },
              { day: 3, action: 'Request category changes' },
            ],
          },
          {
            type: 'ppc',
            description: 'Amazon Ads for books',
            budget: budget * 0.3,
            schedule: [{ day: 1, action: 'Launch sponsored product campaigns' }],
          },
          {
            type: 'social',
            description: 'Maximum social push',
            schedule: [
              { day: 1, action: 'Launch announcement everywhere' },
              { day: 3, action: 'Share early reviews' },
              { day: 5, action: 'Reader Q&A' },
            ],
          },
        ],
        goals: [
          { metric: 'sales', target: 100 },
          { metric: 'reviews', target: 10 },
        ],
      },
      {
        name: 'Post-Launch',
        duration: 21,
        activities: [
          {
            type: 'promotion',
            description: 'Price increase and ongoing promos',
            schedule: [
              { day: 1, action: 'Raise price to $2.99-4.99' },
              { day: 14, action: 'Consider Kindle Countdown Deal' },
            ],
          },
          {
            type: 'review_request',
            description: 'Follow up with readers',
            schedule: [{ day: 7, action: 'Send review request to purchasers' }],
          },
        ],
        goals: [
          { metric: 'reviews', target: 25 },
        ],
      },
    ];
  }

  private generateShopifyLaunchPhases(product: SellerProduct, budget: number): LaunchPhase[] {
    return [
      {
        name: 'Pre-Launch',
        duration: 14,
        activities: [
          {
            type: 'email',
            description: 'Build anticipation',
            schedule: [
              { day: 1, action: 'Teaser email to list' },
              { day: 10, action: 'Early access signup' },
            ],
          },
          {
            type: 'social',
            description: 'Social media build-up',
            schedule: [
              { day: 1, action: 'Product teaser content' },
              { day: 7, action: 'Behind the scenes' },
              { day: 12, action: 'Launch countdown' },
            ],
          },
        ],
        goals: [],
      },
      {
        name: 'Launch',
        duration: 7,
        activities: [
          {
            type: 'ppc',
            description: 'Paid advertising blitz',
            budget: budget * 0.5,
            schedule: [
              { day: 1, action: 'Launch Facebook/Instagram ads' },
              { day: 1, action: 'Launch Google Shopping ads' },
              { day: 3, action: 'Launch retargeting campaigns' },
            ],
          },
          {
            type: 'promotion',
            description: 'Launch offer',
            schedule: [{ day: 1, action: 'Activate launch discount (20% off)' }],
          },
          {
            type: 'influencer',
            description: 'Influencer partnerships',
            budget: budget * 0.2,
            schedule: [{ day: 1, action: 'Coordinated influencer posts' }],
          },
        ],
        goals: [
          { metric: 'sales', target: 50 },
          { metric: 'revenue', target: product.suggestedPrice * 50 * 0.8 },
        ],
      },
      {
        name: 'Sustain',
        duration: 21,
        activities: [
          {
            type: 'ppc',
            description: 'Optimize and scale',
            budget: budget * 0.3,
            schedule: [
              { day: 7, action: 'Optimize ad creative' },
              { day: 14, action: 'Scale winning audiences' },
            ],
          },
          {
            type: 'email',
            description: 'Post-purchase flows',
            schedule: [{ day: 1, action: 'Activate review request sequence' }],
          },
        ],
        goals: [
          { metric: 'sales', target: 150 },
        ],
      },
    ];
  }

  private generateGenericLaunchPhases(product: SellerProduct, budget: number): LaunchPhase[] {
    return [
      {
        name: 'Launch',
        duration: 14,
        activities: [
          {
            type: 'social',
            description: 'Social media launch',
            schedule: [{ day: 1, action: 'Launch announcement' }],
          },
          {
            type: 'ppc',
            description: 'Paid advertising',
            budget: budget * 0.7,
            schedule: [{ day: 1, action: 'Start ads' }],
          },
        ],
        goals: [{ metric: 'sales', target: 30 }],
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // Promotions
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a promotion
   */
  createPromotion(params: Omit<Promotion, 'id' | 'status' | 'metrics'>): Promotion {
    const promotion: Promotion = {
      ...params,
      id: uuidv4(),
      status: 'draft',
      metrics: this.initializePromotionMetrics(),
    };

    this.promotions.set(promotion.id, promotion);
    return promotion;
  }

  /**
   * Generate promotional calendar for a year
   */
  generatePromotionalCalendar(
    marketplace: MarketplaceType,
    products: SellerProduct[]
  ): Promotion[] {
    const promotions: Promotion[] = [];
    const year = new Date().getFullYear();

    // Key shopping events
    const events = [
      { name: 'New Year Sale', date: new Date(year, 0, 1), discount: 20 },
      { name: "Valentine's Day", date: new Date(year, 1, 7), discount: 15 },
      { name: 'Spring Sale', date: new Date(year, 2, 20), discount: 20 },
      { name: "Mother's Day", date: new Date(year, 4, 1), discount: 15 },
      { name: "Father's Day", date: new Date(year, 5, 10), discount: 15 },
      { name: 'Summer Sale', date: new Date(year, 6, 4), discount: 25 },
      { name: 'Back to School', date: new Date(year, 7, 1), discount: 20 },
      { name: 'Labor Day', date: new Date(year, 8, 1), discount: 20 },
      { name: 'Prime Day', date: new Date(year, 6, 15), discount: 30 }, // Amazon
      { name: 'Black Friday', date: new Date(year, 10, 24), discount: 35 },
      { name: 'Cyber Monday', date: new Date(year, 10, 27), discount: 30 },
      { name: 'Holiday Sale', date: new Date(year, 11, 10), discount: 25 },
    ];

    for (const event of events) {
      // Skip Amazon-specific events for non-Amazon marketplaces
      if (event.name === 'Prime Day' && marketplace !== 'amazon') continue;

      const promotion = this.createPromotion({
        name: event.name,
        type: 'percentage_off',
        marketplace,
        products: products.map((p) => p.id),
        discount: {
          type: 'percentage',
          value: event.discount,
        },
        schedule: {
          start: event.date,
          end: new Date(event.date.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      promotions.push(promotion);
    }

    return promotions;
  }

  // ─────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────

  private getChannelsForMarketplace(
    marketplace: MarketplaceType,
    goal: string
  ): MarketingChannel[] {
    const channelMap: Partial<Record<MarketplaceType, MarketingChannel[]>> = {
      amazon: ['amazon_ppc', 'amazon_dsp', 'email', 'social_organic'],
      shopify: ['shopify_google', 'shopify_facebook', 'email', 'social_organic', 'influencer'],
      etsy: ['etsy_ads', 'social_organic', 'email'],
      kdp: ['kdp_ads', 'social_organic', 'email'],
      ebay: ['social_organic', 'email'],
      walmart: ['social_organic', 'email'],
      tiktok: ['social_organic', 'influencer'],
    };

    return channelMap[marketplace] ?? ['social_organic', 'email'];
  }

  private generateTargeting(
    product: SellerProduct,
    marketplace: MarketplaceType,
    goal: string
  ): CampaignTargeting {
    return {
      keywords: product.tags?.slice(0, 10),
      demographics: {
        ageMin: 18,
        ageMax: 65,
        gender: 'all',
        interests: product.category ? [product.category] : [],
      },
    };
  }

  private calculateBid(searchVolume: number, competition: string): number {
    const baseBid = 0.5;
    const volumeMultiplier = Math.min(2, 1 + searchVolume / 10000);
    const competitionMultiplier =
      competition === 'high' ? 1.5 : competition === 'medium' ? 1.2 : 1.0;

    return Math.round(baseBid * volumeMultiplier * competitionMultiplier * 100) / 100;
  }

  private initializeMetrics(): CampaignMetrics {
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      acos: 0,
      roas: 0,
      cpc: 0,
      ctr: 0,
      conversionRate: 0,
    };
  }

  private initializeAdGroupMetrics(): AdGroupMetrics {
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      sales: 0,
      acos: 0,
      orders: 0,
    };
  }

  private initializeKeywordMetrics(): KeywordMetrics {
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      sales: 0,
      acos: 0,
      orders: 0,
    };
  }

  private initializeEmailMetrics(): EmailSequenceMetrics {
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      revenue: 0,
    };
  }

  private initializePromotionMetrics(): PromotionMetrics {
    return {
      impressions: 0,
      claims: 0,
      redemptions: 0,
      revenue: 0,
      avgOrderValue: 0,
      newCustomers: 0,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Campaign Management
  // ─────────────────────────────────────────────────────────────

  getCampaign(id: string): MarketingCampaign | undefined {
    return this.campaigns.get(id);
  }

  getAllCampaigns(): MarketingCampaign[] {
    return Array.from(this.campaigns.values());
  }

  getLaunchStrategy(id: string): LaunchStrategy | undefined {
    return this.launchStrategies.get(id);
  }

  getEmailSequence(id: string): EmailSequence | undefined {
    return this.emailSequences.get(id);
  }
}

export default MarketingAutomation;
