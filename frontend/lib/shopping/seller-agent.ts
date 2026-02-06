/**
 * Seller Agent — Boomer_Ang E-Commerce Expertise
 *
 * Enables Boomer_Angs to help entrepreneurs scale from Garage to Global.
 * Full knowledge of e-commerce best practices across all major platforms.
 *
 * Expertise Areas:
 * - Shopify store setup and optimization
 * - Amazon FBA/FBM strategies
 * - KDP (Kindle Direct Publishing) for ebooks
 * - Etsy handmade/vintage optimization
 * - eBay listing strategies
 * - Multi-channel inventory management
 * - SEO and marketplace optimization
 * - Pricing strategies
 * - Marketing automation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  SellerProfile,
  SellerStage,
  SellerProduct,
  MarketplaceListing,
  SellerMission,
  SellerMissionType,
  MarketResearch,
  PricingStrategy,
  Recommendation,
  MarketplaceType,
} from './seller-types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SellerAgentConfig {
  agentId: string;
  expertise: MarketplaceType[];
  region: string;
}

export interface ListingAudit {
  listingId: string;
  marketplace: MarketplaceType;
  score: number; // 0-100
  issues: ListingIssue[];
  recommendations: Recommendation[];
  competitorAnalysis?: CompetitorInsight[];
}

export interface ListingIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: 'title' | 'description' | 'images' | 'pricing' | 'keywords' | 'category' | 'shipping';
  message: string;
  fix?: string;
}

export interface CompetitorInsight {
  competitorId: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  strengths: string[];
  weaknesses: string[];
  marketShare?: number;
}

export interface MarketOpportunity {
  id: string;
  type: 'niche' | 'trending' | 'seasonal' | 'gap';
  marketplace: MarketplaceType;
  category: string;
  description: string;
  demandScore: number; // 0-100
  competitionLevel: 'low' | 'medium' | 'high';
  estimatedRevenue: { min: number; max: number };
  keywords: string[];
  seasonality?: { peakMonths: number[]; lowMonths: number[] };
}

export interface ContentSuggestion {
  type: 'title' | 'description' | 'bullet_points' | 'keywords' | 'a_plus_content';
  current?: string;
  suggested: string;
  reasoning: string;
  expectedImpact: 'low' | 'medium' | 'high';
}

export interface PricingRecommendation {
  currentPrice: number;
  recommendedPrice: number;
  strategy: 'competitive' | 'premium' | 'penetration' | 'psychological';
  reasoning: string;
  expectedMarginChange: number;
  expectedSalesChange: number;
  competitorPrices: { name: string; price: number }[];
}

// E-commerce Best Practices Database
export interface EcommerceBestPractice {
  id: string;
  marketplace: MarketplaceType | 'all';
  category: string;
  title: string;
  description: string;
  implementation: string[];
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─────────────────────────────────────────────────────────────
// E-Commerce Best Practices Knowledge Base
// ─────────────────────────────────────────────────────────────

export const ECOMMERCE_BEST_PRACTICES: EcommerceBestPractice[] = [
  // Shopify Best Practices
  {
    id: 'shopify-speed',
    marketplace: 'shopify',
    category: 'performance',
    title: 'Optimize Store Speed',
    description: 'Page load speed directly impacts conversion rates. Every second of delay can reduce conversions by 7%.',
    implementation: [
      'Compress images using WebP format',
      'Minimize app usage - each app adds load time',
      'Use a fast, lightweight theme like Dawn',
      'Enable lazy loading for images',
      'Remove unused code from theme.liquid',
    ],
    impact: 'high',
    difficulty: 'medium',
  },
  {
    id: 'shopify-trust',
    marketplace: 'shopify',
    category: 'conversion',
    title: 'Build Trust Signals',
    description: 'Trust badges and social proof increase conversion rates by up to 32%.',
    implementation: [
      'Add SSL badge and secure checkout messaging',
      'Display customer reviews prominently',
      'Show real-time purchase notifications',
      'Add money-back guarantee badge',
      'Include press mentions and certifications',
    ],
    impact: 'high',
    difficulty: 'easy',
  },
  {
    id: 'shopify-checkout',
    marketplace: 'shopify',
    category: 'conversion',
    title: 'Optimize Checkout Flow',
    description: 'Streamlined checkout reduces cart abandonment by up to 35%.',
    implementation: [
      'Enable Shop Pay for returning customers',
      'Offer guest checkout option',
      'Show progress indicators',
      'Minimize form fields',
      'Offer multiple payment methods (Apple Pay, Google Pay)',
    ],
    impact: 'high',
    difficulty: 'easy',
  },

  // Amazon Best Practices
  {
    id: 'amazon-title',
    marketplace: 'amazon',
    category: 'listing',
    title: 'Optimize Product Title',
    description: 'Amazon titles should be 150-200 characters with key info front-loaded.',
    implementation: [
      'Brand name first, then product name',
      'Include key features (size, color, quantity)',
      'Add primary keyword naturally',
      'Avoid promotional language (Best, #1)',
      'Use pipes or dashes for readability',
    ],
    impact: 'high',
    difficulty: 'easy',
  },
  {
    id: 'amazon-images',
    marketplace: 'amazon',
    category: 'listing',
    title: 'Professional Product Images',
    description: 'Products with 7+ images have 30% higher conversion rates.',
    implementation: [
      'Main image: pure white background, product fills 85%',
      'Include lifestyle/in-use images',
      'Show scale with common objects',
      'Infographic images with key features',
      'Include packaging shots if premium',
      'Add video if available',
    ],
    impact: 'high',
    difficulty: 'medium',
  },
  {
    id: 'amazon-backend-keywords',
    marketplace: 'amazon',
    category: 'seo',
    title: 'Backend Search Terms',
    description: 'Hidden keywords help Amazon index your product for more searches.',
    implementation: [
      'Use all 250 bytes allowed',
      'Include misspellings and synonyms',
      'Add Spanish translations for US market',
      'Never repeat words from title',
      'No competitor brand names',
    ],
    impact: 'medium',
    difficulty: 'easy',
  },
  {
    id: 'amazon-aplus',
    marketplace: 'amazon',
    category: 'conversion',
    title: 'A+ Content (Enhanced Brand Content)',
    description: 'A+ Content increases conversion by 3-10% on average.',
    implementation: [
      'Tell your brand story with lifestyle imagery',
      'Use comparison charts vs competitors',
      'Highlight key differentiators',
      'Include FAQ sections',
      'Mobile-first design approach',
    ],
    impact: 'high',
    difficulty: 'medium',
  },

  // KDP Best Practices
  {
    id: 'kdp-cover',
    marketplace: 'kdp',
    category: 'design',
    title: 'Professional Book Cover',
    description: 'Covers sell books. 75% of buying decisions are based on the cover alone.',
    implementation: [
      'Hire professional designer or use Canva Pro templates',
      'Title readable at thumbnail size',
      'Genre-appropriate design conventions',
      'High contrast colors',
      'Author name prominent for series',
      'Test cover at 300x400px thumbnail size',
    ],
    impact: 'high',
    difficulty: 'medium',
  },
  {
    id: 'kdp-categories',
    marketplace: 'kdp',
    category: 'discoverability',
    title: 'Strategic Category Selection',
    description: 'Choosing the right categories is crucial for bestseller rankings.',
    implementation: [
      'Research category competition using Publisher Rocket',
      'Target categories with <50k bestseller rank',
      'Request additional categories via KDP support',
      'Balance discoverability vs competition',
      'Update categories based on performance',
    ],
    impact: 'high',
    difficulty: 'easy',
  },
  {
    id: 'kdp-keywords',
    marketplace: 'kdp',
    category: 'seo',
    title: 'Keyword Optimization',
    description: 'KDP allows 7 keywords - use them strategically for discoverability.',
    implementation: [
      'Use long-tail phrases, not single words',
      'Include genre + theme combinations',
      'Research competitor keywords',
      'Add "books" or "novel" variations',
      'Target related non-fiction for fiction',
    ],
    impact: 'high',
    difficulty: 'easy',
  },
  {
    id: 'kdp-description',
    marketplace: 'kdp',
    category: 'conversion',
    title: 'Compelling Book Description',
    description: 'Your description is your sales page - use HTML formatting.',
    implementation: [
      'Hook in first 2-3 sentences (above the fold)',
      'Use HTML bold for emphasis',
      'Include social proof (reviews, awards)',
      'End with call-to-action',
      'Keep paragraphs short (2-3 sentences)',
      'A/B test descriptions',
    ],
    impact: 'high',
    difficulty: 'medium',
  },
  {
    id: 'kdp-series',
    marketplace: 'kdp',
    category: 'strategy',
    title: 'Series Strategy',
    description: 'Series outsell standalones 3-to-1. Read-through is key to profitability.',
    implementation: [
      'Plan series before writing book 1',
      'Use consistent branding across covers',
      'Price book 1 lower ($0.99-2.99) for entry',
      'Include series page links in back matter',
      'Release books close together for momentum',
    ],
    impact: 'high',
    difficulty: 'medium',
  },

  // Etsy Best Practices
  {
    id: 'etsy-tags',
    marketplace: 'etsy',
    category: 'seo',
    title: 'Tag Optimization',
    description: 'Etsy gives you 13 tags - use every single one for maximum visibility.',
    implementation: [
      'Use all 13 tags, max 20 characters each',
      'Include long-tail phrases',
      'Match tags to title keywords',
      'Add seasonal tags when relevant',
      'Include gift-related tags',
      'Use eRank or Marmalead for research',
    ],
    impact: 'high',
    difficulty: 'easy',
  },
  {
    id: 'etsy-photos',
    marketplace: 'etsy',
    category: 'listing',
    title: 'Lifestyle Photography',
    description: 'Etsy buyers want to see products in context - lifestyle images convert.',
    implementation: [
      'First image: clean product shot',
      'Include scale reference (hand, person)',
      'Show product in use/context',
      'Natural lighting preferred',
      'Cohesive brand aesthetic across shop',
      'Use video for complex products',
    ],
    impact: 'high',
    difficulty: 'medium',
  },

  // Universal Best Practices
  {
    id: 'universal-reviews',
    marketplace: 'all',
    category: 'reputation',
    title: 'Review Generation Strategy',
    description: 'Products with 50+ reviews see 4.6% higher conversion.',
    implementation: [
      'Follow up email sequence post-purchase',
      'Include product insert with review request',
      'Respond to all reviews (positive and negative)',
      'Address negative reviews constructively',
      'Never incentivize reviews (violates TOS)',
    ],
    impact: 'high',
    difficulty: 'easy',
  },
  {
    id: 'universal-pricing',
    marketplace: 'all',
    category: 'strategy',
    title: 'Psychological Pricing',
    description: 'Charm pricing (.99) works for low-cost items; round numbers for premium.',
    implementation: [
      'Use .99 for items under $50',
      'Use round numbers ($100, $250) for premium',
      'Bundle products to increase AOV',
      'Test price points with A/B testing',
      'Consider anchor pricing with strikethrough',
    ],
    impact: 'medium',
    difficulty: 'easy',
  },
];

// ─────────────────────────────────────────────────────────────
// Seller Agent Class
// ─────────────────────────────────────────────────────────────

export class SellerAgent {
  private config: SellerAgentConfig;
  private knowledgeBase: EcommerceBestPractice[];

  constructor(config: SellerAgentConfig) {
    this.config = config;
    this.knowledgeBase = ECOMMERCE_BEST_PRACTICES;
  }

  /**
   * Audit a product listing for optimization opportunities
   */
  async auditListing(
    listing: MarketplaceListing,
    product: SellerProduct
  ): Promise<ListingAudit> {
    const issues: ListingIssue[] = [];
    const recommendations: Recommendation[] = [];
    let score = 100;

    // Title Analysis
    const titleIssues = this.analyzeTitleForMarketplace(listing, listing.marketplace);
    issues.push(...titleIssues);
    score -= titleIssues.filter((i) => i.type === 'critical').length * 15;
    score -= titleIssues.filter((i) => i.type === 'warning').length * 5;

    // Description Analysis
    const descIssues = this.analyzeDescription(listing);
    issues.push(...descIssues);
    score -= descIssues.filter((i) => i.type === 'critical').length * 10;
    score -= descIssues.filter((i) => i.type === 'warning').length * 3;

    // Image Analysis
    const imageIssues = this.analyzeImages(listing);
    issues.push(...imageIssues);
    score -= imageIssues.filter((i) => i.type === 'critical').length * 15;
    score -= imageIssues.filter((i) => i.type === 'warning').length * 5;

    // Pricing Analysis
    const pricingIssues = this.analyzePricing(listing, product);
    issues.push(...pricingIssues);
    score -= pricingIssues.filter((i) => i.type === 'warning').length * 5;

    // Keywords/SEO Analysis
    const seoIssues = this.analyzeSEO(listing);
    issues.push(...seoIssues);
    score -= seoIssues.filter((i) => i.type === 'critical').length * 10;
    score -= seoIssues.filter((i) => i.type === 'warning').length * 3;

    // Generate recommendations from best practices
    const applicablePractices = this.knowledgeBase.filter(
      (bp) => bp.marketplace === listing.marketplace || bp.marketplace === 'all'
    );

    for (const practice of applicablePractices) {
      if (this.shouldRecommendPractice(listing, practice)) {
        recommendations.push({
          id: uuidv4(),
          type: 'optimization',
          priority: practice.impact === 'high' ? 'high' : practice.impact === 'medium' ? 'medium' : 'low',
          title: practice.title,
          description: practice.description,
          actionItems: practice.implementation,
          estimatedImpact: `${practice.impact} impact on conversion`,
          effort: practice.difficulty,
        });
      }
    }

    return {
      listingId: listing.id,
      marketplace: listing.marketplace,
      score: Math.max(0, score),
      issues,
      recommendations: recommendations.slice(0, 10), // Top 10 recommendations
    };
  }

  /**
   * Research market opportunities
   */
  async findMarketOpportunities(
    marketplace: MarketplaceType,
    category?: string
  ): Promise<MarketOpportunity[]> {
    const opportunities: MarketOpportunity[] = [];

    // This would integrate with actual market research APIs
    // For now, providing structured analysis framework

    // Simulated opportunity detection based on marketplace
    if (marketplace === 'amazon') {
      opportunities.push({
        id: uuidv4(),
        type: 'gap',
        marketplace: 'amazon',
        category: category || 'Home & Kitchen',
        description: 'Eco-friendly kitchen storage solutions with bamboo/sustainable materials',
        demandScore: 78,
        competitionLevel: 'medium',
        estimatedRevenue: { min: 5000, max: 25000 },
        keywords: ['sustainable kitchen', 'eco kitchen storage', 'bamboo organizer'],
      });
    }

    if (marketplace === 'kdp') {
      opportunities.push({
        id: uuidv4(),
        type: 'trending',
        marketplace: 'kdp',
        category: category || 'Self-Help',
        description: 'Journals and planners for specific professions (nurses, teachers, developers)',
        demandScore: 85,
        competitionLevel: 'medium',
        estimatedRevenue: { min: 500, max: 3000 },
        keywords: ['nurse planner', 'teacher journal', 'developer notebook'],
      });
    }

    if (marketplace === 'etsy') {
      opportunities.push({
        id: uuidv4(),
        type: 'seasonal',
        marketplace: 'etsy',
        category: category || 'Home Decor',
        description: 'Personalized seasonal decorations with modern minimalist aesthetic',
        demandScore: 72,
        competitionLevel: 'high',
        estimatedRevenue: { min: 2000, max: 15000 },
        keywords: ['modern seasonal decor', 'minimalist holiday', 'personalized decoration'],
        seasonality: { peakMonths: [10, 11, 12], lowMonths: [1, 2, 6, 7] },
      });
    }

    return opportunities;
  }

  /**
   * Generate optimized listing content
   */
  async generateListingContent(
    product: SellerProduct,
    marketplace: MarketplaceType
  ): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    // Title optimization
    suggestions.push(this.generateTitleSuggestion(product, marketplace));

    // Description optimization
    suggestions.push(this.generateDescriptionSuggestion(product, marketplace));

    // Bullet points (for Amazon)
    if (marketplace === 'amazon') {
      suggestions.push(this.generateBulletPointsSuggestion(product));
    }

    // Keywords
    suggestions.push(this.generateKeywordsSuggestion(product, marketplace));

    return suggestions;
  }

  /**
   * Get pricing recommendation
   */
  async getPricingRecommendation(
    product: SellerProduct,
    marketplace: MarketplaceType,
    competitorPrices: { name: string; price: number }[]
  ): Promise<PricingRecommendation> {
    const currentPrice = product.basePrice;
    const avgCompetitorPrice =
      competitorPrices.reduce((sum, c) => sum + c.price, 0) / competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices.map((c) => c.price));
    const maxCompetitorPrice = Math.max(...competitorPrices.map((c) => c.price));

    let strategy: PricingRecommendation['strategy'];
    let recommendedPrice: number;
    let reasoning: string;

    // Determine strategy based on product positioning and market
    if (product.basePrice > avgCompetitorPrice * 1.2) {
      // Already premium priced
      strategy = 'premium';
      recommendedPrice = Math.round(avgCompetitorPrice * 1.25 * 100) / 100;
      reasoning = 'Position as premium option. Ensure quality and branding justify price point.';
    } else if (competitorPrices.length > 5 && minCompetitorPrice < avgCompetitorPrice * 0.7) {
      // Competitive market with race-to-bottom
      strategy = 'psychological';
      recommendedPrice = Math.round((avgCompetitorPrice * 0.95 - 0.01) * 100) / 100;
      reasoning = 'Use psychological pricing just below average to stand out without devaluing.';
    } else {
      // Standard competitive positioning
      strategy = 'competitive';
      recommendedPrice = Math.round((avgCompetitorPrice * 0.97) * 100) / 100;
      reasoning = 'Price slightly below market average to capture value-conscious buyers.';
    }

    // Apply psychological pricing rules
    if (recommendedPrice < 50) {
      recommendedPrice = Math.floor(recommendedPrice) + 0.99;
    } else if (recommendedPrice >= 100) {
      recommendedPrice = Math.round(recommendedPrice / 5) * 5;
    }

    return {
      currentPrice,
      recommendedPrice,
      strategy,
      reasoning,
      expectedMarginChange: ((recommendedPrice - currentPrice) / currentPrice) * 100,
      expectedSalesChange: strategy === 'competitive' ? 15 : strategy === 'premium' ? -10 : 5,
      competitorPrices,
    };
  }

  /**
   * Get best practices for a specific marketplace
   */
  getBestPractices(
    marketplace: MarketplaceType,
    category?: string
  ): EcommerceBestPractice[] {
    return this.knowledgeBase.filter(
      (bp) =>
        (bp.marketplace === marketplace || bp.marketplace === 'all') &&
        (!category || bp.category === category)
    );
  }

  /**
   * Get stage-appropriate recommendations for seller growth
   */
  getStageRecommendations(stage: SellerStage): Recommendation[] {
    const recommendations: Recommendation[] = [];

    switch (stage) {
      case 'garage':
        recommendations.push(
          {
            id: uuidv4(),
            type: 'growth',
            priority: 'high',
            title: 'Validate Product-Market Fit',
            description: 'Before scaling, ensure your product resonates with customers.',
            actionItems: [
              'Get first 10 sales and collect feedback',
              'Achieve 4+ star average rating',
              'Identify your ideal customer profile',
              'Document common customer questions',
            ],
            estimatedImpact: 'Foundation for sustainable growth',
            effort: 'medium',
          },
          {
            id: uuidv4(),
            type: 'optimization',
            priority: 'high',
            title: 'Perfect Your Core Listing',
            description: 'One great listing beats 10 mediocre ones.',
            actionItems: [
              'Professional product photography',
              'Keyword-optimized title and description',
              'Competitive pricing analysis',
              'Complete all listing fields',
            ],
            estimatedImpact: '2-3x conversion improvement',
            effort: 'easy',
          }
        );
        break;

      case 'workshop':
        recommendations.push(
          {
            id: uuidv4(),
            type: 'expansion',
            priority: 'high',
            title: 'Expand Product Line',
            description: 'Leverage initial success with complementary products.',
            actionItems: [
              'Identify top-selling product variations',
              'Bundle products for higher AOV',
              'Create product family branding',
              'Cross-sell to existing customers',
            ],
            estimatedImpact: '40-60% revenue increase',
            effort: 'medium',
          },
          {
            id: uuidv4(),
            type: 'automation',
            priority: 'medium',
            title: 'Implement Basic Automation',
            description: 'Free up time for growth activities.',
            actionItems: [
              'Set up automated email sequences',
              'Use inventory management software',
              'Create templated customer responses',
              'Automate review requests',
            ],
            estimatedImpact: '10+ hours saved per week',
            effort: 'medium',
          }
        );
        break;

      case 'warehouse':
        recommendations.push(
          {
            id: uuidv4(),
            type: 'expansion',
            priority: 'high',
            title: 'Multi-Channel Expansion',
            description: 'Diversify revenue streams across platforms.',
            actionItems: [
              'List on 2-3 additional marketplaces',
              'Consider your own Shopify store',
              'Implement channel-specific pricing',
              'Centralize inventory management',
            ],
            estimatedImpact: '50-100% revenue growth',
            effort: 'hard',
          },
          {
            id: uuidv4(),
            type: 'operational',
            priority: 'high',
            title: 'Professionalize Operations',
            description: 'Build systems that scale.',
            actionItems: [
              'Implement 3PL or fulfillment service',
              'Hire first team member or VA',
              'Set up proper accounting',
              'Create SOPs for all processes',
            ],
            estimatedImpact: 'Enables 10x scale',
            effort: 'hard',
          }
        );
        break;

      case 'enterprise':
        recommendations.push(
          {
            id: uuidv4(),
            type: 'strategic',
            priority: 'high',
            title: 'Build Brand Equity',
            description: 'Transition from seller to brand.',
            actionItems: [
              'Develop brand story and identity',
              'Invest in brand registry/trademarks',
              'Launch branded website',
              'Build email list and owned audience',
            ],
            estimatedImpact: 'Premium pricing power',
            effort: 'hard',
          },
          {
            id: uuidv4(),
            type: 'financial',
            priority: 'medium',
            title: 'Optimize for Profitability',
            description: 'Revenue is vanity, profit is sanity.',
            actionItems: [
              'Renegotiate supplier terms',
              'Optimize advertising ROAS',
              'Eliminate unprofitable SKUs',
              'Implement dynamic pricing',
            ],
            estimatedImpact: '20-40% margin improvement',
            effort: 'medium',
          }
        );
        break;

      case 'global':
        recommendations.push(
          {
            id: uuidv4(),
            type: 'expansion',
            priority: 'high',
            title: 'International Expansion',
            description: 'Take your proven model global.',
            actionItems: [
              'Research target international markets',
              'Localize listings and customer service',
              'Set up international fulfillment',
              'Navigate import/export regulations',
            ],
            estimatedImpact: '2-5x addressable market',
            effort: 'hard',
          },
          {
            id: uuidv4(),
            type: 'strategic',
            priority: 'medium',
            title: 'Acquisition or Exit Planning',
            description: 'Build a business worth buying.',
            actionItems: [
              'Document all processes and SOPs',
              'Reduce owner dependency',
              'Clean up financials',
              'Understand valuation multiples',
            ],
            estimatedImpact: 'Maximize exit value',
            effort: 'medium',
          }
        );
        break;
    }

    return recommendations;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Analysis Methods
  // ─────────────────────────────────────────────────────────────

  private analyzeTitleForMarketplace(
    listing: MarketplaceListing,
    marketplace: MarketplaceType
  ): ListingIssue[] {
    const issues: ListingIssue[] = [];
    const title = listing.title;

    // Universal title checks
    if (title.length < 40) {
      issues.push({
        type: 'warning',
        category: 'title',
        message: 'Title is too short. Include more keywords.',
        fix: 'Expand title to 80-200 characters with relevant keywords.',
      });
    }

    if (title === title.toUpperCase()) {
      issues.push({
        type: 'critical',
        category: 'title',
        message: 'All-caps titles violate marketplace guidelines.',
        fix: 'Use proper title case.',
      });
    }

    // Marketplace-specific checks
    if (marketplace === 'amazon') {
      if (title.length > 200) {
        issues.push({
          type: 'warning',
          category: 'title',
          message: 'Amazon titles should be under 200 characters.',
        });
      }
      if (!/^[A-Z]/.test(title)) {
        issues.push({
          type: 'suggestion',
          category: 'title',
          message: 'Consider starting with brand name for Amazon.',
        });
      }
    }

    if (marketplace === 'etsy') {
      if (title.length > 140) {
        issues.push({
          type: 'warning',
          category: 'title',
          message: 'Etsy titles over 140 characters get truncated.',
        });
      }
    }

    return issues;
  }

  private analyzeDescription(listing: MarketplaceListing): ListingIssue[] {
    const issues: ListingIssue[] = [];
    const desc = listing.description;

    if (desc.length < 200) {
      issues.push({
        type: 'critical',
        category: 'description',
        message: 'Description is too short. Add more detail.',
        fix: 'Aim for 500+ characters with features, benefits, and use cases.',
      });
    }

    if (!desc.includes('\n') && desc.length > 300) {
      issues.push({
        type: 'warning',
        category: 'description',
        message: 'Description lacks formatting. Use paragraphs and bullet points.',
      });
    }

    return issues;
  }

  private analyzeImages(listing: MarketplaceListing): ListingIssue[] {
    const issues: ListingIssue[] = [];
    const imageCount = listing.images.length;

    if (imageCount < 3) {
      issues.push({
        type: 'critical',
        category: 'images',
        message: `Only ${imageCount} images. More images significantly increase conversion.`,
        fix: 'Add at least 5-7 images including lifestyle shots.',
      });
    }

    if (imageCount < 7) {
      issues.push({
        type: 'warning',
        category: 'images',
        message: 'Consider adding more images. 7+ images is optimal.',
      });
    }

    return issues;
  }

  private analyzePricing(
    listing: MarketplaceListing,
    product: SellerProduct
  ): ListingIssue[] {
    const issues: ListingIssue[] = [];

    if (listing.price < product.baseCost * 2) {
      issues.push({
        type: 'warning',
        category: 'pricing',
        message: 'Low margin warning. Price may not cover all costs and fees.',
        fix: 'Aim for 3x cost minimum to account for fees, returns, and advertising.',
      });
    }

    return issues;
  }

  private analyzeSEO(listing: MarketplaceListing): ListingIssue[] {
    const issues: ListingIssue[] = [];

    if (!listing.keywords || listing.keywords.length < 5) {
      issues.push({
        type: 'critical',
        category: 'keywords',
        message: 'Insufficient keywords for discoverability.',
        fix: 'Add more relevant keywords based on search data.',
      });
    }

    return issues;
  }

  private shouldRecommendPractice(
    listing: MarketplaceListing,
    practice: EcommerceBestPractice
  ): boolean {
    // Logic to determine if a best practice applies
    // In production, this would be more sophisticated
    return practice.impact === 'high' || Math.random() > 0.5;
  }

  private generateTitleSuggestion(
    product: SellerProduct,
    marketplace: MarketplaceType
  ): ContentSuggestion {
    let template: string;

    switch (marketplace) {
      case 'amazon':
        template = `[Brand] ${product.name} - [Key Feature] - [Benefit] - [Size/Quantity] - [Target Audience]`;
        break;
      case 'etsy':
        template = `${product.name} | [Style] [Material] | [Occasion] Gift | [Personalization Option]`;
        break;
      case 'kdp':
        template = `${product.name}: [Subtitle with Benefit] ([Series Name] Book #)`;
        break;
      default:
        template = `${product.name} - [Key Feature] - [Primary Benefit]`;
    }

    return {
      type: 'title',
      suggested: template,
      reasoning: `Optimized title structure for ${marketplace} algorithm and buyer psychology.`,
      expectedImpact: 'high',
    };
  }

  private generateDescriptionSuggestion(
    product: SellerProduct,
    marketplace: MarketplaceType
  ): ContentSuggestion {
    const template = marketplace === 'kdp'
      ? `[Hook - emotional connection or problem statement]

[Brief plot/content summary - what reader will experience]

[Author credentials or unique angle]

[Social proof - reviews, awards, comparisons]

[Call to action - scroll up and click buy]`
      : `[Opening hook with main benefit]

KEY FEATURES:
• [Feature 1] - [Benefit]
• [Feature 2] - [Benefit]
• [Feature 3] - [Benefit]

[Use case scenarios]

[Quality/guarantee statement]

[Call to action]`;

    return {
      type: 'description',
      suggested: template,
      reasoning: 'Structured format that guides buyers through benefits and builds purchase confidence.',
      expectedImpact: 'high',
    };
  }

  private generateBulletPointsSuggestion(product: SellerProduct): ContentSuggestion {
    return {
      type: 'bullet_points',
      suggested: `• [BENEFIT IN CAPS] - Detailed explanation of how this helps the customer
• [UNIQUE FEATURE] - What sets this apart from competitors
• [QUALITY/MATERIALS] - Build trust with specifics
• [USE CASES] - Help customer visualize using the product
• [GUARANTEE/SUPPORT] - Remove purchase risk`,
      reasoning: 'Amazon bullet points should lead with benefits in caps, then explain.',
      expectedImpact: 'high',
    };
  }

  private generateKeywordsSuggestion(
    product: SellerProduct,
    marketplace: MarketplaceType
  ): ContentSuggestion {
    return {
      type: 'keywords',
      suggested: `Research keywords using:
- ${marketplace === 'amazon' ? 'Helium 10, Jungle Scout' : marketplace === 'etsy' ? 'eRank, Marmalead' : marketplace === 'kdp' ? 'Publisher Rocket, KDP Rocket' : 'Google Keyword Planner'}
- Include: main product terms, use cases, materials, occasions, gift keywords
- Avoid: competitor brand names, irrelevant terms`,
      reasoning: 'Keyword research is essential for organic discoverability.',
      expectedImpact: 'high',
    };
  }
}

export default SellerAgent;
