// @ts-nocheck
/**
 * Price Monitor — Real-time Price Tracking & Alerts
 *
 * Monitors price changes for products in shopping missions.
 * Sends alerts when prices drop or exceed thresholds.
 *
 * Key Features:
 * - Track prices across retailers
 * - Price history tracking
 * - Alert on price drops
 * - Alert on price increases (budget protection)
 * - Best time to buy recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import type { PriceAlert, PriceHistory, ProductFinding, ShoppingItem } from './types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PriceWatch {
  id: string;
  missionId: string;
  item: ShoppingItem;
  targetPrice: number;
  currentPrice: number;
  retailer: string;
  productId: string;
  productUrl?: string;
  status: 'active' | 'paused' | 'triggered' | 'expired';
  alertOnDrop: boolean;
  alertOnIncrease: boolean;
  increaseThreshold?: number; // Alert if price increases by this percentage
  createdAt: Date;
  lastChecked?: Date;
  expiresAt?: Date;
}

export interface PriceCheckResult {
  watchId: string;
  productId: string;
  previousPrice: number;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  alert?: PriceAlert;
}

export interface PriceTrend {
  productId: string;
  retailer: string;
  currentPrice: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  trend: 'rising' | 'falling' | 'stable';
  recommendation: 'buy_now' | 'wait' | 'neutral';
  confidence: number;
}

export interface PriceMonitorConfig {
  checkIntervalMs: number;
  historyRetentionDays: number;
  alertThresholdPercent: number;
  maxWatchesPerMission: number;
}

export type AlertHandler = (alert: PriceAlert) => void | Promise<void>;

// ─────────────────────────────────────────────────────────────
// Price Monitor Class
// ─────────────────────────────────────────────────────────────

export class PriceMonitor {
  private config: PriceMonitorConfig;
  private watches: Map<string, PriceWatch>;
  private history: Map<string, PriceHistory>;
  private alertHandlers: Set<AlertHandler>;
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<PriceMonitorConfig>) {
    this.config = {
      checkIntervalMs: 60 * 60 * 1000, // 1 hour default
      historyRetentionDays: 90,
      alertThresholdPercent: 5,
      maxWatchesPerMission: 50,
      ...config,
    };

    this.watches = new Map();
    this.history = new Map();
    this.alertHandlers = new Set();
  }

  /**
   * Start the price monitoring loop
   */
  start(): void {
    if (this.checkTimer) return;

    this.checkTimer = setInterval(() => {
      this.checkAllPrices().catch(console.error);
    }, this.config.checkIntervalMs);

    console.log('[PriceMonitor] Started monitoring');
  }

  /**
   * Stop the price monitoring loop
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      console.log('[PriceMonitor] Stopped monitoring');
    }
  }

  /**
   * Register an alert handler
   */
  onAlert(handler: AlertHandler): () => void {
    this.alertHandlers.add(handler);
    return () => this.alertHandlers.delete(handler);
  }

  /**
   * Create a new price watch
   */
  createWatch(params: {
    missionId: string;
    item: ShoppingItem;
    finding: ProductFinding;
    targetPrice?: number;
    alertOnDrop?: boolean;
    alertOnIncrease?: boolean;
    increaseThreshold?: number;
    expiresInDays?: number;
  }): PriceWatch {
    const watch: PriceWatch = {
      id: uuidv4(),
      missionId: params.missionId,
      item: params.item,
      targetPrice: params.targetPrice || params.item.maxPrice || params.finding.product.price * 0.9,
      currentPrice: params.finding.product.price,
      retailer: params.finding.product.retailer,
      productId: params.finding.product.id,
      productUrl: params.finding.product.url,
      status: 'active',
      alertOnDrop: params.alertOnDrop ?? true,
      alertOnIncrease: params.alertOnIncrease ?? true,
      increaseThreshold: params.increaseThreshold || 10, // 10% default
      createdAt: new Date(),
      expiresAt: params.expiresInDays
        ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
    };

    this.watches.set(watch.id, watch);

    // Initialize price history
    this.recordPrice(watch.productId, watch.retailer, watch.currentPrice);

    return watch;
  }

  /**
   * Get a price watch by ID
   */
  getWatch(watchId: string): PriceWatch | undefined {
    return this.watches.get(watchId);
  }

  /**
   * Get all watches for a mission
   */
  getMissionWatches(missionId: string): PriceWatch[] {
    return Array.from(this.watches.values()).filter(
      (w) => w.missionId === missionId && w.status === 'active'
    );
  }

  /**
   * Pause a watch
   */
  pauseWatch(watchId: string): void {
    const watch = this.watches.get(watchId);
    if (watch) {
      watch.status = 'paused';
    }
  }

  /**
   * Resume a watch
   */
  resumeWatch(watchId: string): void {
    const watch = this.watches.get(watchId);
    if (watch && watch.status === 'paused') {
      watch.status = 'active';
    }
  }

  /**
   * Delete a watch
   */
  deleteWatch(watchId: string): void {
    this.watches.delete(watchId);
  }

  /**
   * Update target price for a watch
   */
  updateTargetPrice(watchId: string, targetPrice: number): void {
    const watch = this.watches.get(watchId);
    if (watch) {
      watch.targetPrice = targetPrice;
    }
  }

  /**
   * Check price for a specific watch
   */
  async checkPrice(
    watchId: string,
    getCurrentPrice: (productId: string, retailer: string) => Promise<number | null>
  ): Promise<PriceCheckResult | null> {
    const watch = this.watches.get(watchId);
    if (!watch || watch.status !== 'active') return null;

    // Check expiration
    if (watch.expiresAt && watch.expiresAt < new Date()) {
      watch.status = 'expired';
      return null;
    }

    const newPrice = await getCurrentPrice(watch.productId, watch.retailer);
    if (newPrice === null) return null;

    const previousPrice = watch.currentPrice;
    const priceChange = newPrice - previousPrice;
    const percentChange = (priceChange / previousPrice) * 100;

    // Update watch
    watch.currentPrice = newPrice;
    watch.lastChecked = new Date();

    // Record in history
    this.recordPrice(watch.productId, watch.retailer, newPrice);

    let alert: PriceAlert | undefined;

    // Check for price drop alert
    if (watch.alertOnDrop && newPrice <= watch.targetPrice && previousPrice > watch.targetPrice) {
      alert = this.createAlert(watch, 'price_drop', previousPrice, newPrice);
      watch.status = 'triggered';
    }

    // Check for significant price drop
    if (
      watch.alertOnDrop &&
      percentChange <= -this.config.alertThresholdPercent &&
      newPrice > watch.targetPrice
    ) {
      alert = this.createAlert(watch, 'price_drop', previousPrice, newPrice);
    }

    // Check for price increase alert
    if (
      watch.alertOnIncrease &&
      watch.increaseThreshold &&
      percentChange >= watch.increaseThreshold
    ) {
      alert = this.createAlert(watch, 'price_increase', previousPrice, newPrice);
    }

    // Emit alert
    if (alert) {
      await this.emitAlert(alert);
    }

    return {
      watchId,
      productId: watch.productId,
      previousPrice,
      currentPrice: newPrice,
      priceChange,
      percentChange,
      alert,
    };
  }

  /**
   * Check all active watches
   */
  async checkAllPrices(
    getCurrentPrice?: (productId: string, retailer: string) => Promise<number | null>
  ): Promise<PriceCheckResult[]> {
    const results: PriceCheckResult[] = [];
    const priceGetter = getCurrentPrice || this.mockPriceCheck.bind(this);

    for (const [watchId] of Array.from(this.watches.entries())) {
      const result = await this.checkPrice(watchId, priceGetter);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get price history for a product
   */
  getPriceHistory(productId: string, retailer?: string): PriceHistory | undefined {
    const key = retailer ? `${productId}:${retailer}` : productId;

    // Try exact match first
    const exact = this.history.get(key);
    if (exact) return exact;

    // If no retailer specified, find any history for this product
    if (!retailer) {
      for (const [histKey, hist] of Array.from(this.history.entries())) {
        if (histKey.startsWith(productId)) {
          return hist;
        }
      }
    }

    return undefined;
  }

  /**
   * Get price trend analysis
   */
  analyzeTrend(productId: string, retailer: string): PriceTrend | null {
    const history = this.getPriceHistory(productId, retailer);
    if (!history || history.dataPoints.length < 3) return null;

    const prices = history.dataPoints.map((dp) => dp.price);
    const currentPrice = prices[prices.length - 1];
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);

    // Calculate trend using simple linear regression
    const n = prices.length;
    const xSum = (n * (n - 1)) / 2;
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;
    const ySum = prices.reduce((a, b) => a + b, 0);
    const xySum = prices.reduce((sum, price, i) => sum + i * price, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);

    let trend: 'rising' | 'falling' | 'stable';
    let recommendation: 'buy_now' | 'wait' | 'neutral';
    let confidence: number;

    if (slope > 0.5) {
      trend = 'rising';
      recommendation = 'buy_now';
      confidence = Math.min(0.9, 0.5 + Math.abs(slope) / 10);
    } else if (slope < -0.5) {
      trend = 'falling';
      recommendation = 'wait';
      confidence = Math.min(0.9, 0.5 + Math.abs(slope) / 10);
    } else {
      trend = 'stable';
      recommendation = currentPrice <= averagePrice ? 'buy_now' : 'neutral';
      confidence = 0.6;
    }

    // Adjust recommendation based on current price vs. history
    if (currentPrice <= lowestPrice * 1.05) {
      recommendation = 'buy_now';
      confidence = Math.max(confidence, 0.8);
    }

    return {
      productId,
      retailer,
      currentPrice,
      averagePrice,
      lowestPrice,
      highestPrice,
      trend,
      recommendation,
      confidence,
    };
  }

  /**
   * Get best time to buy recommendation
   */
  getBuyRecommendation(productId: string, retailer: string): string {
    const trend = this.analyzeTrend(productId, retailer);
    if (!trend) {
      return 'Insufficient price history for recommendation';
    }

    const { currentPrice, lowestPrice, highestPrice, averagePrice } = trend;

    if (currentPrice <= lowestPrice * 1.02) {
      return `🟢 Great time to buy! Price is at or near the all-time low of $${lowestPrice.toFixed(2)}`;
    }

    if (currentPrice <= averagePrice * 0.95) {
      return `🟢 Good time to buy. Price is below the average of $${averagePrice.toFixed(2)}`;
    }

    if (currentPrice >= highestPrice * 0.98) {
      return `🔴 Consider waiting. Price is near the all-time high of $${highestPrice.toFixed(2)}`;
    }

    if (trend.trend === 'falling') {
      return `🟡 Price is trending down. You may want to wait for a better deal.`;
    }

    if (trend.trend === 'rising') {
      return `🟡 Price is trending up. Consider buying soon before it increases further.`;
    }

    return `⚪ Price is stable around $${averagePrice.toFixed(2)}. Buy when convenient.`;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  private recordPrice(productId: string, retailer: string, price: number): void {
    const key = `${productId}:${retailer}`;
    let history = this.history.get(key);

    if (!history) {
      history = {
        productId,
        retailer,
        prices: [],
        dataPoints: [],
        lowestPrice: price,
        highestPrice: price,
        allTimeLow: price,
        allTimeHigh: price,
        averagePrice: price,
      };
      this.history.set(key, history);
    }

    // Add data point
    const dataPoint = {
      price,
      timestamp: new Date(),
    };
    history.dataPoints.push(dataPoint);
    history.prices.push(dataPoint);

    // Update statistics
    history.allTimeLow = Math.min(history.allTimeLow, price);
    history.allTimeHigh = Math.max(history.allTimeHigh, price);
    history.lowestPrice = history.allTimeLow;
    history.highestPrice = history.allTimeHigh;
    history.averagePrice =
      history.dataPoints.reduce((sum, dp) => sum + dp.price, 0) /
      history.dataPoints.length;

    // Prune old data points
    const cutoff = new Date(
      Date.now() - this.config.historyRetentionDays * 24 * 60 * 60 * 1000
    );
    history.dataPoints = history.dataPoints.filter((dp) => dp.timestamp > cutoff);
    history.prices = history.prices.filter((dp) => dp.timestamp > cutoff);
  }

  private createAlert(
    watch: PriceWatch,
    type: 'price_drop' | 'price_increase' | 'target_reached' | 'out_of_stock',
    previousPrice: number,
    currentPrice: number
  ): PriceAlert {
    const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;

    let message: string;
    switch (type) {
      case 'price_drop':
        message = `Price dropped ${Math.abs(percentChange).toFixed(1)}% from $${previousPrice.toFixed(2)} to $${currentPrice.toFixed(2)}`;
        break;
      case 'price_increase':
        message = `Price increased ${percentChange.toFixed(1)}% from $${previousPrice.toFixed(2)} to $${currentPrice.toFixed(2)}`;
        break;
      case 'target_reached':
        message = `Target price of $${watch.targetPrice.toFixed(2)} reached! Current price: $${currentPrice.toFixed(2)}`;
        break;
      case 'out_of_stock':
        message = `Product is now out of stock`;
        break;
    }

    return {
      id: uuidv4(),
      missionId: watch.missionId,
      watchId: watch.id,
      type,
      itemId: watch.item.id,
      itemName: watch.item.name,
      retailer: watch.retailer,
      previousPrice,
      currentPrice,
      percentChange,
      message,
      productUrl: watch.productUrl,
      createdAt: new Date(),
      read: false,
    };
  }

  private async emitAlert(alert: PriceAlert): Promise<void> {
    for (const handler of Array.from(this.alertHandlers)) {
      try {
        await handler(alert);
      } catch (error) {
        console.error('[PriceMonitor] Alert handler error:', error);
      }
    }
  }

  // Mock price check for testing
  private async mockPriceCheck(
    _productId: string,
    _retailer: string
  ): Promise<number | null> {
    // In production, this would call the actual retailer adapter
    // For now, return a slightly varied price
    const watch = Array.from(this.watches.values()).find(
      (w) => w.productId === _productId && w.retailer === _retailer
    );
    if (!watch) return null;

    // Simulate price fluctuation (-5% to +5%)
    const variance = (Math.random() - 0.5) * 0.1;
    return watch.currentPrice * (1 + variance);
  }

  /**
   * Export all watches and history for persistence
   */
  export(): { watches: PriceWatch[]; history: PriceHistory[] } {
    return {
      watches: Array.from(this.watches.values()),
      history: Array.from(this.history.values()),
    };
  }

  /**
   * Import watches and history from persistence
   */
  import(data: { watches: PriceWatch[]; history: PriceHistory[] }): void {
    for (const watch of data.watches) {
      // Restore Date objects
      watch.createdAt = new Date(watch.createdAt);
      if (watch.lastChecked) watch.lastChecked = new Date(watch.lastChecked);
      if (watch.expiresAt) watch.expiresAt = new Date(watch.expiresAt);
      this.watches.set(watch.id, watch);
    }

    for (const hist of data.history) {
      // Restore Date objects in data points
      hist.dataPoints = hist.dataPoints.map((dp) => ({
        ...dp,
        timestamp: new Date(dp.timestamp),
      }));
      this.history.set(`${hist.productId}:${hist.retailer}`, hist);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeWatches: number;
    totalAlerts: number;
    productsTracked: number;
  } {
    const activeWatches = Array.from(this.watches.values()).filter(
      (w) => w.status === 'active'
    ).length;

    return {
      activeWatches,
      totalAlerts: 0, // Would track this in production
      productsTracked: this.history.size,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

let defaultMonitor: PriceMonitor | null = null;

export function getPriceMonitor(config?: Partial<PriceMonitorConfig>): PriceMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new PriceMonitor(config);
  }
  return defaultMonitor;
}

export default PriceMonitor;
