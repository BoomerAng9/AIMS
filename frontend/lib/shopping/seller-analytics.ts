// @ts-nocheck
/**
 * Seller Analytics — Performance Tracking & Business Intelligence
 *
 * Comprehensive analytics for sellers across all marketplaces.
 * Provides insights, forecasting, and actionable recommendations.
 *
 * Metrics Tracked:
 * - Revenue & profit analysis
 * - Product performance
 * - Advertising ROI
 * - Inventory health
 * - Customer behavior
 * - Competitive positioning
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  MarketplaceType,
  SellerProduct,
  SellerMetrics,
  SellerStage,
} from './seller-types';
import type { CampaignMetrics } from './marketing-automation';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  period: AnalyticsPeriod;
  overview: OverviewMetrics;
  sales: SalesAnalytics;
  products: ProductAnalytics[];
  advertising: AdvertisingAnalytics;
  inventory: InventoryAnalytics;
  customers: CustomerAnalytics;
  profitability: ProfitabilityAnalytics;
  trends: TrendAnalysis;
  recommendations: AnalyticsRecommendation[];
}

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | '365d' | 'ytd' | 'all' | 'custom';

export interface OverviewMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalUnits: number;
  averageOrderValue: number;
  conversionRate: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueChange: number; // % vs previous period
  ordersChange: number;
  profitChange: number;
}

export interface SalesAnalytics {
  revenueByDay: TimeSeriesData[];
  ordersByDay: TimeSeriesData[];
  revenueByMarketplace: MarketplaceBreakdown[];
  revenueByCategory: CategoryBreakdown[];
  topSellingProducts: ProductSalesData[];
  salesVelocity: number; // units per day
  projectedMonthlyRevenue: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  previousValue?: number;
}

export interface MarketplaceBreakdown {
  marketplace: MarketplaceType;
  revenue: number;
  orders: number;
  percentage: number;
  growth: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
  growth: number;
}

export interface ProductSalesData {
  productId: string;
  name: string;
  revenue: number;
  units: number;
  orders: number;
  averagePrice: number;
  margin: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ProductAnalytics {
  productId: string;
  name: string;
  marketplace: MarketplaceType;
  metrics: {
    revenue: number;
    units: number;
    views: number;
    conversion: number;
    reviews: number;
    rating: number;
    returns: number;
    returnRate: number;
  };
  ranking: {
    bsr?: number;
    categoryRank?: number;
    organicKeywords?: { keyword: string; position: number }[];
  };
  profitability: {
    cost: number;
    fees: number;
    advertising: number;
    shipping: number;
    grossProfit: number;
    netProfit: number;
    margin: number;
    roi: number;
  };
  health: 'healthy' | 'warning' | 'critical';
  healthIssues: string[];
}

export interface AdvertisingAnalytics {
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  tacos: number; // Total Advertising Cost of Sale
  roas: number; // Return on Ad Spend
  acos: number; // Advertising Cost of Sale
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  campaignPerformance: CampaignPerformance[];
  topKeywords: KeywordPerformance[];
  spendByChannel: { channel: string; spend: number; revenue: number; roas: number }[];
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  type: string;
  spend: number;
  revenue: number;
  orders: number;
  acos: number;
  status: 'profitable' | 'break-even' | 'unprofitable';
}

export interface KeywordPerformance {
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  spend: number;
  revenue: number;
  orders: number;
  acos: number;
  conversionRate: number;
  recommendation: 'scale' | 'maintain' | 'reduce' | 'pause';
}

export interface InventoryAnalytics {
  totalValue: number;
  totalUnits: number;
  healthySKUs: number;
  lowStockSKUs: number;
  outOfStockSKUs: number;
  overstockedSKUs: number;
  daysOfInventory: number;
  turnoverRate: number;
  reorderAlerts: ReorderAlert[];
  agedInventory: AgedInventoryItem[];
  storageUtilization?: number; // For FBA
  storageFees?: number;
}

export interface ReorderAlert {
  productId: string;
  name: string;
  currentStock: number;
  dailyVelocity: number;
  daysUntilStockout: number;
  recommendedOrderQty: number;
  leadTime: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface AgedInventoryItem {
  productId: string;
  name: string;
  units: number;
  age: number; // days
  estimatedFees: number;
  recommendation: 'liquidate' | 'promote' | 'return';
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatPurchaseRate: number;
  customerLifetimeValue: number;
  averageOrderFrequency: number;
  customerAcquisitionCost: number;
  nps?: number; // Net Promoter Score
  segments: CustomerSegment[];
}

export interface CustomerSegment {
  name: string;
  count: number;
  revenue: number;
  averageOrderValue: number;
  characteristics: string[];
}

export interface ProfitabilityAnalytics {
  revenue: number;
  cogs: number; // Cost of Goods Sold
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: {
    advertising: number;
    marketplaceFees: number;
    shipping: number;
    returns: number;
    storage: number;
    other: number;
  };
  operatingProfit: number;
  operatingMargin: number;
  netProfit: number;
  netMargin: number;
  breakEvenPoint: number;
  profitByProduct: { productId: string; name: string; profit: number; margin: number }[];
  profitByMarketplace: { marketplace: MarketplaceType; profit: number; margin: number }[];
}

export interface TrendAnalysis {
  revenueTrend: 'growing' | 'stable' | 'declining';
  revenueGrowthRate: number;
  seasonalPatterns: SeasonalPattern[];
  forecasts: Forecast[];
  anomalies: Anomaly[];
}

export interface SeasonalPattern {
  pattern: string;
  peakMonths: number[];
  lowMonths: number[];
  impact: number; // % revenue difference
}

export interface Forecast {
  metric: string;
  period: string;
  predicted: number;
  confidence: { low: number; high: number };
  assumptions: string[];
}

export interface Anomaly {
  date: string;
  metric: string;
  expected: number;
  actual: number;
  deviation: number;
  possibleCauses: string[];
}

export interface AnalyticsRecommendation {
  id: string;
  type: 'growth' | 'efficiency' | 'risk' | 'opportunity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actions: string[];
  metrics: { current: number; target: number; unit: string };
}

// ─────────────────────────────────────────────────────────────
// Seller Analytics Engine
// ─────────────────────────────────────────────────────────────

export class SellerAnalytics {
  private data: Map<string, unknown> = new Map();

  /**
   * Generate comprehensive analytics dashboard
   */
  generateDashboard(
    sellerId: string,
    period: AnalyticsPeriod,
    options?: {
      marketplaces?: MarketplaceType[];
      products?: string[];
      includeForecasts?: boolean;
    }
  ): AnalyticsDashboard {
    // In production, this would aggregate data from multiple sources
    // For now, providing structure and sample data

    const overview = this.calculateOverview(sellerId, period);
    const sales = this.analyzeSales(sellerId, period);
    const products = this.analyzeProducts(sellerId, period);
    const advertising = this.analyzeAdvertising(sellerId, period);
    const inventory = this.analyzeInventory(sellerId);
    const customers = this.analyzeCustomers(sellerId, period);
    const profitability = this.analyzeProfitability(sellerId, period);
    const trends = this.analyzeTrends(sellerId, period);
    const recommendations = this.generateRecommendations(
      overview,
      sales,
      advertising,
      inventory,
      profitability
    );

    return {
      period,
      overview,
      sales,
      products,
      advertising,
      inventory,
      customers,
      profitability,
      trends,
      recommendations,
    };
  }

  /**
   * Calculate seller's current stage based on metrics
   */
  determineSellerStage(metrics: SellerMetrics): {
    stage: SellerStage;
    reasoning: string[];
    nextStageRequirements: string[];
  } {
    const { monthlyRevenue, totalProducts, orderCount, marketplaces } = metrics;

    let stage: SellerStage;
    const reasoning: string[] = [];
    const nextStageRequirements: string[] = [];

    if (monthlyRevenue < 1000 || totalProducts < 5) {
      stage = 'garage';
      reasoning.push(`Monthly revenue: $${monthlyRevenue.toLocaleString()}`);
      reasoning.push(`Products: ${totalProducts}`);
      nextStageRequirements.push('Achieve $1,000+ monthly revenue');
      nextStageRequirements.push('Expand to 5+ products');
      nextStageRequirements.push('Establish consistent sales velocity');
    } else if (monthlyRevenue < 10000 || marketplaces.length < 2) {
      stage = 'workshop';
      reasoning.push(`Monthly revenue: $${monthlyRevenue.toLocaleString()}`);
      reasoning.push(`Active on ${marketplaces.length} marketplace(s)`);
      nextStageRequirements.push('Scale to $10,000+ monthly revenue');
      nextStageRequirements.push('Expand to multiple marketplaces');
      nextStageRequirements.push('Develop operational systems');
    } else if (monthlyRevenue < 50000 || totalProducts < 20) {
      stage = 'warehouse';
      reasoning.push(`Monthly revenue: $${monthlyRevenue.toLocaleString()}`);
      reasoning.push(`Products: ${totalProducts}`);
      nextStageRequirements.push('Scale to $50,000+ monthly revenue');
      nextStageRequirements.push('Expand product catalog to 20+');
      nextStageRequirements.push('Build team or outsource operations');
    } else if (monthlyRevenue < 250000) {
      stage = 'enterprise';
      reasoning.push(`Monthly revenue: $${monthlyRevenue.toLocaleString()}`);
      reasoning.push(`Operating across ${marketplaces.length} marketplaces`);
      nextStageRequirements.push('Scale to $250,000+ monthly revenue');
      nextStageRequirements.push('Establish international presence');
      nextStageRequirements.push('Build recognized brand');
    } else {
      stage = 'global';
      reasoning.push(`Monthly revenue: $${monthlyRevenue.toLocaleString()}`);
      reasoning.push('Operating at enterprise scale');
      nextStageRequirements.push('Continue international expansion');
      nextStageRequirements.push('Consider acquisition opportunities');
      nextStageRequirements.push('Optimize for exit or long-term growth');
    }

    return { stage, reasoning, nextStageRequirements };
  }

  /**
   * Calculate product-level profitability
   */
  analyzeProductProfitability(
    product: SellerProduct,
    salesData: {
      units: number;
      revenue: number;
      advertising: number;
      fees: number;
      returns: number;
      shipping: number;
    }
  ): ProductAnalytics['profitability'] {
    const cost = product.baseCost * salesData.units;
    const grossProfit = salesData.revenue - cost;
    const totalExpenses =
      salesData.advertising + salesData.fees + salesData.returns + salesData.shipping;
    const netProfit = grossProfit - totalExpenses;

    return {
      cost,
      fees: salesData.fees,
      advertising: salesData.advertising,
      shipping: salesData.shipping,
      grossProfit,
      netProfit,
      margin: salesData.revenue > 0 ? (netProfit / salesData.revenue) * 100 : 0,
      roi: cost > 0 ? (netProfit / cost) * 100 : 0,
    };
  }

  /**
   * Generate reorder recommendations
   */
  generateReorderAlerts(
    inventory: { productId: string; name: string; quantity: number; leadTime: number }[],
    salesVelocity: Map<string, number> // productId -> units/day
  ): ReorderAlert[] {
    const alerts: ReorderAlert[] = [];

    for (const item of inventory) {
      const velocity = salesVelocity.get(item.productId) || 0;
      if (velocity === 0) continue;

      const daysUntilStockout = item.quantity / velocity;
      const safetyStockDays = 14; // 2 weeks safety stock
      const reorderPoint = velocity * (item.leadTime + safetyStockDays);
      const recommendedQty = Math.ceil(velocity * 30); // 30 days of stock

      let priority: ReorderAlert['priority'];
      if (daysUntilStockout <= item.leadTime) {
        priority = 'urgent';
      } else if (daysUntilStockout <= item.leadTime + 7) {
        priority = 'high';
      } else if (item.quantity <= reorderPoint) {
        priority = 'medium';
      } else {
        continue; // No alert needed
      }

      alerts.push({
        productId: item.productId,
        name: item.name,
        currentStock: item.quantity,
        dailyVelocity: velocity,
        daysUntilStockout: Math.floor(daysUntilStockout),
        recommendedOrderQty: recommendedQty,
        leadTime: item.leadTime,
        priority,
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Analyze advertising performance and generate recommendations
   */
  analyzeKeywordPerformance(
    keywords: {
      keyword: string;
      matchType: string;
      impressions: number;
      clicks: number;
      spend: number;
      revenue: number;
      orders: number;
    }[]
  ): KeywordPerformance[] {
    return keywords.map((kw) => {
      const acos = kw.revenue > 0 ? (kw.spend / kw.revenue) * 100 : 100;
      const ctr = kw.impressions > 0 ? (kw.clicks / kw.impressions) * 100 : 0;
      const conversionRate = kw.clicks > 0 ? (kw.orders / kw.clicks) * 100 : 0;

      let recommendation: KeywordPerformance['recommendation'];
      if (acos < 20 && kw.orders >= 5) {
        recommendation = 'scale';
      } else if (acos <= 35 && kw.orders >= 2) {
        recommendation = 'maintain';
      } else if (acos <= 50 && kw.orders >= 1) {
        recommendation = 'reduce';
      } else {
        recommendation = 'pause';
      }

      return {
        keyword: kw.keyword,
        matchType: kw.matchType,
        impressions: kw.impressions,
        clicks: kw.clicks,
        spend: kw.spend,
        revenue: kw.revenue,
        orders: kw.orders,
        acos,
        conversionRate,
        recommendation,
      };
    });
  }

  /**
   * Calculate break-even analysis
   */
  calculateBreakEven(params: {
    fixedCosts: number;
    pricePerUnit: number;
    costPerUnit: number;
    fees: number; // percentage
  }): {
    breakEvenUnits: number;
    breakEvenRevenue: number;
    contributionMargin: number;
  } {
    const { fixedCosts, pricePerUnit, costPerUnit, fees } = params;

    const netPrice = pricePerUnit * (1 - fees / 100);
    const contributionMargin = netPrice - costPerUnit;

    const breakEvenUnits =
      contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : Infinity;

    const breakEvenRevenue = breakEvenUnits * pricePerUnit;

    return {
      breakEvenUnits,
      breakEvenRevenue,
      contributionMargin,
    };
  }

  /**
   * Generate revenue forecast
   */
  generateForecast(
    historicalData: TimeSeriesData[],
    periods: number
  ): Forecast[] {
    // Simple moving average forecast
    // In production, would use more sophisticated models (ARIMA, Prophet, etc.)

    const values = historicalData.map((d) => d.value);
    const windowSize = Math.min(7, values.length);

    // Calculate trend
    const recentAvg = values.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    const olderAvg =
      values.slice(-windowSize * 2, -windowSize).reduce((a, b) => a + b, 0) / windowSize || recentAvg;

    const growthRate = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;

    const forecasts: Forecast[] = [];

    for (let i = 1; i <= periods; i++) {
      const predicted = recentAvg * Math.pow(1 + growthRate / 4, i); // Dampen growth
      const uncertainty = 0.1 + i * 0.02; // Increase uncertainty over time

      forecasts.push({
        metric: 'revenue',
        period: `Period +${i}`,
        predicted: Math.round(predicted),
        confidence: {
          low: Math.round(predicted * (1 - uncertainty)),
          high: Math.round(predicted * (1 + uncertainty)),
        },
        assumptions: [
          'Based on recent trend continuation',
          'No major market changes',
          'Consistent marketing spend',
        ],
      });
    }

    return forecasts;
  }

  /**
   * Detect anomalies in data
   */
  detectAnomalies(data: TimeSeriesData[], sensitivity: number = 2): Anomaly[] {
    const values = data.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    const anomalies: Anomaly[] = [];

    for (const point of data) {
      const deviation = Math.abs(point.value - mean) / stdDev;
      if (deviation > sensitivity) {
        anomalies.push({
          date: point.date,
          metric: 'revenue',
          expected: mean,
          actual: point.value,
          deviation,
          possibleCauses:
            point.value > mean
              ? ['Promotional activity', 'Seasonal spike', 'Viral content', 'Inventory restock']
              : ['Stock-out', 'Listing suppression', 'Negative reviews', 'Competitor activity'],
        });
      }
    }

    return anomalies;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Analysis Methods
  // ─────────────────────────────────────────────────────────────

  private calculateOverview(sellerId: string, period: AnalyticsPeriod): OverviewMetrics {
    // Placeholder - would aggregate from real data
    return {
      totalRevenue: 25000,
      totalOrders: 450,
      totalUnits: 680,
      averageOrderValue: 55.56,
      conversionRate: 3.2,
      grossProfit: 12500,
      netProfit: 7500,
      profitMargin: 30,
      revenueChange: 12.5,
      ordersChange: 8.3,
      profitChange: 15.2,
    };
  }

  private analyzeSales(sellerId: string, period: AnalyticsPeriod): SalesAnalytics {
    // Generate sample time series data
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const revenueByDay: TimeSeriesData[] = [];
    const ordersByDay: TimeSeriesData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const revenue = 500 + Math.random() * 500;
      const orders = Math.floor(10 + Math.random() * 10);

      revenueByDay.push({ date: date.toISOString().split('T')[0], value: revenue });
      ordersByDay.push({ date: date.toISOString().split('T')[0], value: orders });
    }

    return {
      revenueByDay,
      ordersByDay,
      revenueByMarketplace: [
        { marketplace: 'amazon', revenue: 15000, orders: 280, percentage: 60, growth: 15 },
        { marketplace: 'shopify', revenue: 7500, orders: 130, percentage: 30, growth: 8 },
        { marketplace: 'etsy', revenue: 2500, orders: 40, percentage: 10, growth: 5 },
      ],
      revenueByCategory: [
        { category: 'Electronics', revenue: 12000, orders: 200, percentage: 48, growth: 12 },
        { category: 'Home & Kitchen', revenue: 8000, orders: 150, percentage: 32, growth: 10 },
        { category: 'Sports', revenue: 5000, orders: 100, percentage: 20, growth: 5 },
      ],
      topSellingProducts: [],
      salesVelocity: 22.7,
      projectedMonthlyRevenue: 27500,
    };
  }

  private analyzeProducts(sellerId: string, period: AnalyticsPeriod): ProductAnalytics[] {
    // Placeholder
    return [];
  }

  private analyzeAdvertising(sellerId: string, period: AnalyticsPeriod): AdvertisingAnalytics {
    return {
      totalSpend: 3500,
      totalRevenue: 12000,
      totalOrders: 180,
      tacos: 14,
      roas: 3.43,
      acos: 29.2,
      impressions: 250000,
      clicks: 5000,
      ctr: 2.0,
      cpc: 0.70,
      conversionRate: 3.6,
      campaignPerformance: [],
      topKeywords: [],
      spendByChannel: [
        { channel: 'Amazon PPC', spend: 2500, revenue: 9000, roas: 3.6 },
        { channel: 'Facebook', spend: 700, revenue: 2100, roas: 3.0 },
        { channel: 'Google', spend: 300, revenue: 900, roas: 3.0 },
      ],
    };
  }

  private analyzeInventory(sellerId: string): InventoryAnalytics {
    return {
      totalValue: 45000,
      totalUnits: 2500,
      healthySKUs: 35,
      lowStockSKUs: 8,
      outOfStockSKUs: 2,
      overstockedSKUs: 5,
      daysOfInventory: 45,
      turnoverRate: 8.1,
      reorderAlerts: [],
      agedInventory: [],
      storageUtilization: 65,
      storageFees: 450,
    };
  }

  private analyzeCustomers(sellerId: string, period: AnalyticsPeriod): CustomerAnalytics {
    return {
      totalCustomers: 1200,
      newCustomers: 350,
      returningCustomers: 850,
      repeatPurchaseRate: 28,
      customerLifetimeValue: 125,
      averageOrderFrequency: 2.3,
      customerAcquisitionCost: 12.50,
      nps: 42,
      segments: [
        {
          name: 'VIP Customers',
          count: 120,
          revenue: 18000,
          averageOrderValue: 150,
          characteristics: ['5+ orders', 'High AOV', 'Low return rate'],
        },
        {
          name: 'Regular Buyers',
          count: 400,
          revenue: 12000,
          averageOrderValue: 60,
          characteristics: ['2-4 orders', 'Moderate AOV'],
        },
        {
          name: 'One-Time Buyers',
          count: 680,
          revenue: 8500,
          averageOrderValue: 40,
          characteristics: ['Single purchase', 'Acquisition focus'],
        },
      ],
    };
  }

  private analyzeProfitability(sellerId: string, period: AnalyticsPeriod): ProfitabilityAnalytics {
    const revenue = 25000;
    const cogs = 10000;
    const grossProfit = revenue - cogs;
    const expenses = {
      advertising: 3500,
      marketplaceFees: 3750,
      shipping: 1500,
      returns: 500,
      storage: 450,
      other: 300,
    };
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const operatingProfit = grossProfit - totalExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      grossMargin: (grossProfit / revenue) * 100,
      operatingExpenses: expenses,
      operatingProfit,
      operatingMargin: (operatingProfit / revenue) * 100,
      netProfit: operatingProfit * 0.75, // After taxes
      netMargin: ((operatingProfit * 0.75) / revenue) * 100,
      breakEvenPoint: 15000,
      profitByProduct: [],
      profitByMarketplace: [
        { marketplace: 'amazon', profit: 3000, margin: 20 },
        { marketplace: 'shopify', profit: 1800, margin: 24 },
        { marketplace: 'etsy', profit: 200, margin: 8 },
      ],
    };
  }

  private analyzeTrends(sellerId: string, period: AnalyticsPeriod): TrendAnalysis {
    return {
      revenueTrend: 'growing',
      revenueGrowthRate: 12.5,
      seasonalPatterns: [
        {
          pattern: 'Q4 Holiday Peak',
          peakMonths: [11, 12],
          lowMonths: [1, 2],
          impact: 45,
        },
      ],
      forecasts: [],
      anomalies: [],
    };
  }

  private generateRecommendations(
    overview: OverviewMetrics,
    sales: SalesAnalytics,
    advertising: AdvertisingAnalytics,
    inventory: InventoryAnalytics,
    profitability: ProfitabilityAnalytics
  ): AnalyticsRecommendation[] {
    const recommendations: AnalyticsRecommendation[] = [];

    // Advertising efficiency
    if (advertising.acos > 30) {
      recommendations.push({
        id: uuidv4(),
        type: 'efficiency',
        priority: 'high',
        title: 'Reduce Advertising Cost of Sale',
        description: `Your ACoS is ${advertising.acos.toFixed(1)}%, above the target of 25%.`,
        impact: `Reducing ACoS to 25% would save $${((advertising.totalSpend * (advertising.acos - 25)) / advertising.acos).toFixed(0)}/month`,
        actions: [
          'Pause keywords with ACoS > 50% and no conversions',
          'Increase bids on top-performing exact match keywords',
          'Add negative keywords from search term report',
          'Test different ad copy and images',
        ],
        metrics: { current: advertising.acos, target: 25, unit: '% ACoS' },
      });
    }

    // Inventory health
    if (inventory.lowStockSKUs > 5) {
      recommendations.push({
        id: uuidv4(),
        type: 'risk',
        priority: 'critical',
        title: 'Address Low Stock Items',
        description: `${inventory.lowStockSKUs} products are running low on inventory.`,
        impact: 'Stock-outs can result in lost sales and decreased organic ranking',
        actions: [
          'Review reorder alerts and place orders',
          'Consider air freight for urgent items',
          'Set up automated reorder points',
        ],
        metrics: { current: inventory.lowStockSKUs, target: 2, unit: 'low stock SKUs' },
      });
    }

    // Profit margin
    if (profitability.netMargin < 15) {
      recommendations.push({
        id: uuidv4(),
        type: 'efficiency',
        priority: 'high',
        title: 'Improve Profit Margins',
        description: `Net margin is ${profitability.netMargin.toFixed(1)}%, below healthy threshold of 15%.`,
        impact: 'Improving margins by 5% would add $1,250/month to bottom line',
        actions: [
          'Negotiate better supplier pricing',
          'Reduce advertising spend on unprofitable products',
          'Consider price increases on unique products',
          'Review and reduce shipping costs',
        ],
        metrics: { current: profitability.netMargin, target: 15, unit: '% net margin' },
      });
    }

    // Growth opportunity
    if (overview.revenueChange > 10) {
      recommendations.push({
        id: uuidv4(),
        type: 'opportunity',
        priority: 'medium',
        title: 'Capitalize on Growth Momentum',
        description: `Revenue is up ${overview.revenueChange.toFixed(1)}% - time to scale.`,
        impact: 'Reinvesting in growth can compound your momentum',
        actions: [
          'Increase advertising budget on winning campaigns',
          'Launch new product variations',
          'Expand to additional marketplaces',
          'Consider international expansion',
        ],
        metrics: { current: overview.revenueChange, target: 20, unit: '% growth' },
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

export default SellerAnalytics;
