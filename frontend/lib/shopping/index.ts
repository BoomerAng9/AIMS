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
// Constants
// ─────────────────────────────────────────────────────────────

export { SUPPORTED_RETAILERS } from './types';
export { GROWTH_STAGES } from './seller-types';
