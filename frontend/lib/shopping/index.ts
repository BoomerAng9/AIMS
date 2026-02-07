// @ts-nocheck
/**
 * A.I.M.S. Shopping Module
 *
 * "Buy in Bulk" - Boomer_Angs scout products and build carts
 * "Garage to Global" - Boomer_Angs help entrepreneurs scale
 *
 * Key principle: Boomer_Angs NEVER have payment access.
 * They scout, compare, and report. ACHEEVY handles payments.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

// Buying (Buy in Bulk)
export type {
  ShoppingMission,
  ShoppingItem,
  ShoppingTeam,
  ShoppingTask,
  ShoppingAgent,
  ProductFinding,
  CartOption,
  AggregatedCart,
  CartItem,
  CartSummary,
  ShoppingChangeRequest,
  MissionProgress,
  PriceAlert,
  PriceHistory,
  PaymentVault,
  SavedPaymentMethod,
  BudgetConstraints,
  ShoppingPreferences,
  MissionStatus,
} from './types';

// Selling (Garage to Global)
export type {
  SellerProfile,
  SellerStage,
  MarketplaceConnection,
  MarketplaceType,
  SellerProduct,
  ProductVariant,
  MarketplaceListing,
  SellerMission,
  SellerMissionType,
  SellerTeam,
  SellerTeamRole,
  MarketResearch,
  PricingStrategy,
  GrowthJourney,
  GrowthMilestone,
  SellerMetrics,
  Recommendation,
} from './seller-types';

// ─────────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────────

// Purchasing PMO - Mission Management
export {
  PurchasingPMO,
  getPMO,
  type PMOConfig,
  type PMOEvent,
} from './purchasing-pmo';

// Shopping Agent - Boomer_Ang Scouting Capability
export {
  ShoppingAgent as ShoppingAgentService,
  MockRetailerAdapter,
  type RetailerAdapter,
  type SearchOptions,
  type AvailabilityResult,
  type ShippingEstimate,
  type AgentConfig,
  type ScoutingResult,
  type ScoutingWarning,
} from './shopping-agent';

// Cart Builder - Cart Management
export {
  CartBuilder,
  getCartBuilder,
  type CartBuilderConfig,
  type CartModification,
  type CartValidationResult,
  type CartValidationError,
  type CartValidationWarning,
  type OptimizationResult,
  type OptimizationChange,
} from './cart-builder';

// Price Monitor - Price Tracking & Alerts
export {
  PriceMonitor,
  getPriceMonitor,
  type PriceWatch,
  type PriceCheckResult,
  type PriceTrend,
  type PriceMonitorConfig,
} from './price-monitor';

// LUC Integration - Budget Management
export {
  ShoppingBudgetManager,
  getShoppingBudgetManager,
  type LUCEngineInterface,
  type SpendingCategory,
  type SpendCheckResult,
  type BudgetAllocation,
} from './luc-integration';

// Purchase Workflow - End-to-End Orchestration
export {
  PurchaseWorkflow,
  getPurchaseWorkflow,
  type WorkflowConfig,
  type WorkflowState,
  type WorkflowPhase,
  type WorkflowEvent,
  type WorkflowEventType,
  type WorkflowEventHandler,
} from './purchase-workflow';

// ─────────────────────────────────────────────────────────────
// Seller Services (Garage to Global)
// ─────────────────────────────────────────────────────────────

// Seller Agent - E-Commerce Expertise for Boomer_Angs
export {
  SellerAgent,
  ECOMMERCE_BEST_PRACTICES,
  type ListingAudit,
  type ListingIssue,
  type CompetitorInsight,
  type MarketOpportunity,
  type ContentSuggestion,
  type PricingRecommendation,
  type EcommerceBestPractice,
} from './seller-agent';

// Marketplace Adapters - Platform Integrations
export {
  ShopifyAdapter,
  AmazonAdapter,
  KDPAdapter,
  EtsyAdapter,
  MarketplaceRegistry,
  createMarketplaceAdapter,
  type MarketplaceAdapter,
  type MarketplaceCredentials,
  type ConnectionResult,
  type MarketplaceOrder,
  type ListingMetrics,
  type TimePeriod,
} from './marketplace-adapters';

// Listing Optimizer - AI-Powered Enhancement
export {
  ListingOptimizer,
  type OptimizationTask,
  type OptimizationType,
  type OptimizationSuggestion,
  type KeywordResearch,
  type ImageAnalysis,
  type ABTestConfig,
  type ABTestResults,
} from './listing-optimizer';

// Marketing Automation - Multi-Channel Marketing
export {
  MarketingAutomation,
  type MarketingCampaign,
  type CampaignType,
  type MarketingChannel,
  type CampaignMetrics,
  type AdGroup,
  type AdKeyword,
  type EmailSequence,
  type SocialPost,
  type LaunchStrategy,
  type Promotion,
} from './marketing-automation';

// Seller Analytics - Business Intelligence
export {
  SellerAnalytics,
  type AnalyticsDashboard,
  type OverviewMetrics,
  type SalesAnalytics,
  type ProductAnalytics,
  type AdvertisingAnalytics,
  type InventoryAnalytics,
  type CustomerAnalytics,
  type ProfitabilityAnalytics,
  type TrendAnalysis,
  type AnalyticsRecommendation,
  type ReorderAlert,
  type KeywordPerformance,
} from './seller-analytics';

// Growth Orchestrator - Garage to Global Journey Management
export {
  GrowthOrchestrator,
  getGrowthOrchestrator,
  GROWTH_STAGE_REQUIREMENTS,
  type GrowthPlan,
  type PlanMilestone,
  type MilestoneRequirement,
  type GrowthMetrics,
  type GrowthEvent,
  type GrowthEventType,
  type StageRequirements,
} from './growth-orchestrator';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export { SUPPORTED_RETAILERS } from './types';
export { GROWTH_STAGES } from './seller-types';
