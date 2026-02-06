/**
 * Shopping Agent — Boomer_Ang Shopping Capability
 *
 * Enables Boomer_Angs to scout products, compare prices, and build carts.
 * CRITICAL: Boomer_Angs NEVER have payment access. They scout and report only.
 *
 * Flow:
 * 1. Receive assignment from PurchasingPMO
 * 2. Search retailers for products
 * 3. Compare prices across sources
 * 4. Build cart options
 * 5. Report findings back to PMO
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ShoppingTask,
  ShoppingItem,
  ProductFinding,
  CartOption,
  CartItem,
  BudgetConstraints,
  ShoppingPreferences,
} from './types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface RetailerAdapter {
  id: string;
  name: string;
  search(query: string, options?: SearchOptions): Promise<ProductFinding[]>;
  getProductDetails(productId: string): Promise<ProductFinding | null>;
  checkAvailability(productId: string, quantity: number): Promise<AvailabilityResult>;
  estimateShipping(productId: string, zipCode: string): Promise<ShippingEstimate>;
}

export interface SearchOptions {
  maxResults?: number;
  priceMin?: number;
  priceMax?: number;
  category?: string;
  brand?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'relevance';
  inStockOnly?: boolean;
}

export interface AvailabilityResult {
  available: boolean;
  quantity: number;
  estimatedRestock?: Date;
  fulfillmentType: 'in_store' | 'warehouse' | 'third_party' | 'unavailable';
}

export interface ShippingEstimate {
  standard: { price: number; days: number } | null;
  expedited: { price: number; days: number } | null;
  overnight: { price: number; days: number } | null;
}

export interface AgentConfig {
  agentId: string;
  region: string;
  adapters: RetailerAdapter[];
  preferences: ShoppingPreferences;
  budgetConstraints: BudgetConstraints;
}

export interface ScoutingResult {
  taskId: string;
  agentId: string;
  findings: ProductFinding[];
  cartOptions: CartOption[];
  warnings: ScoutingWarning[];
  completedAt: Date;
}

export interface ScoutingWarning {
  type: 'price_exceeded' | 'low_stock' | 'quality_concern' | 'shipping_delay' | 'no_results';
  itemId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────────────────────
// Shopping Agent Class
// ─────────────────────────────────────────────────────────────

export class ShoppingAgent {
  private config: AgentConfig;
  private adapters: Map<string, RetailerAdapter>;

  constructor(config: AgentConfig) {
    this.config = config;
    this.adapters = new Map();

    // Register adapters
    for (const adapter of config.adapters) {
      this.adapters.set(adapter.id, adapter);
    }
  }

  /**
   * Execute a shopping task (scouting mission)
   */
  async executeTask(task: ShoppingTask): Promise<ScoutingResult> {
    const findings: ProductFinding[] = [];
    const warnings: ScoutingWarning[] = [];

    // Scout for each item in the task
    for (const item of task.items) {
      const itemFindings = await this.scoutItem(item);

      if (itemFindings.length === 0) {
        warnings.push({
          type: 'no_results',
          itemId: item.id,
          message: `No results found for "${item.name || item.description}"`,
          severity: 'high',
        });
        continue;
      }

      // Check price constraints
      const withinBudget = itemFindings.filter(
        (f) => !item.maxPrice || f.price <= item.maxPrice
      );

      if (withinBudget.length === 0 && item.maxPrice) {
        warnings.push({
          type: 'price_exceeded',
          itemId: item.id,
          message: `All options for "${item.name || item.description}" exceed max price of $${item.maxPrice}. Lowest found: $${Math.min(...itemFindings.map((f) => f.price || 0))}`,
          severity: 'high',
        });
      }

      findings.push(...itemFindings);
    }

    // Build cart options from findings
    const cartOptions = await this.buildCartOptions(task.items, findings);

    return {
      taskId: task.id,
      agentId: this.config.agentId,
      findings,
      cartOptions,
      warnings,
      completedAt: new Date(),
    };
  }

  /**
   * Scout for a single item across all retailers
   */
  private async scoutItem(item: ShoppingItem): Promise<ProductFinding[]> {
    const allFindings: ProductFinding[] = [];

    // Determine which retailers to search
    const retailers = item.preferredRetailers?.length
      ? item.preferredRetailers
      : Array.from(this.adapters.keys());

    // Search each retailer in parallel
    const searchPromises = retailers.map(async (retailerId) => {
      const adapter = this.adapters.get(retailerId);
      if (!adapter) return [];

      try {
        const searchOptions: SearchOptions = {
          maxResults: 10,
          priceMax: item.maxPrice,
          category: item.category,
          brand: item.brand,
          inStockOnly: true,
          sortBy: 'price_asc',
        };

        const results = await adapter.search(item.name || item.description, searchOptions);

        // Enrich with availability and shipping
        const enrichedResults = await Promise.all(
          results.map(async (finding) => {
            const [availability, shipping] = await Promise.all([
              adapter.checkAvailability(finding.productId, item.quantity),
              adapter.estimateShipping(finding.productId, this.config.region),
            ]);

            return {
              ...finding,
              inStock: availability.available,
              stockQuantity: availability.quantity,
              shippingEstimate: shipping.standard?.price || 0,
              deliveryDays: shipping.standard?.days || 7,
            };
          })
        );

        return enrichedResults;
      } catch (error) {
        console.error(`[ShoppingAgent] Error searching ${retailerId}:`, error);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    for (const retailerFindings of results) {
      allFindings.push(...retailerFindings);
    }

    // Sort by total cost (price + shipping)
    allFindings.sort(
      (a, b) =>
        a.price + (a.shippingEstimate || 0) - (b.price + (b.shippingEstimate || 0))
    );

    return allFindings;
  }

  /**
   * Build cart options from findings
   * Creates multiple cart configurations for user to choose from
   */
  private async buildCartOptions(
    items: ShoppingItem[],
    findings: ProductFinding[]
  ): Promise<CartOption[]> {
    const options: CartOption[] = [];

    // Group findings by item
    const findingsByItem = new Map<string, ProductFinding[]>();
    for (const item of items) {
      const itemFindings = findings.filter((f) =>
        this.matchesItem(f, item)
      );
      findingsByItem.set(item.id, itemFindings);
    }

    // Strategy 1: Cheapest overall
    const cheapestOption = this.buildCheapestCart(items, findingsByItem);
    if (cheapestOption) options.push(cheapestOption);

    // Strategy 2: Best rated
    const bestRatedOption = this.buildBestRatedCart(items, findingsByItem);
    if (bestRatedOption) options.push(bestRatedOption);

    // Strategy 3: Fastest delivery
    const fastestOption = this.buildFastestDeliveryCart(items, findingsByItem);
    if (fastestOption) options.push(fastestOption);

    // Strategy 4: Single retailer (minimize shipping)
    const singleRetailerOptions = this.buildSingleRetailerCarts(items, findingsByItem);
    options.push(...singleRetailerOptions);

    // Remove duplicate options
    return this.deduplicateOptions(options);
  }

  private buildCheapestCart(
    items: ShoppingItem[],
    findingsByItem: Map<string, ProductFinding[]>
  ): CartOption | null {
    const cartItems: CartItem[] = [];

    for (const item of items) {
      const findings = findingsByItem.get(item.id) || [];
      if (findings.length === 0) continue;

      // Sort by total cost
      const sorted = [...findings].sort(
        (a, b) =>
          a.price + (a.shippingEstimate || 0) - (b.price + (b.shippingEstimate || 0))
      );

      const best = sorted[0];
      cartItems.push({
        itemId: item.id,
        finding: best,
        quantity: item.quantity,
        lineTotal: best.price * item.quantity,
      });
    }

    if (cartItems.length === 0) return null;

    const subtotal = cartItems.reduce((sum, ci) => sum + (ci.lineTotal || 0), 0);
    const shipping = cartItems.reduce(
      (sum, ci) => sum + ((ci.finding as ProductFinding)?.shippingEstimate || 0),
      0
    );

    return {
      id: uuidv4(),
      strategy: 'cheapest',
      name: 'Lowest Total Cost',
      description: 'Optimized for the lowest overall price including shipping',
      items: cartItems,
      subtotal,
      estimatedShipping: shipping,
      estimatedTax: subtotal * 0.08, // Estimate 8% tax
      total: subtotal + shipping + subtotal * 0.08,
      estimatedDelivery: this.calculateDeliveryDate(cartItems),
      retailers: Array.from(new Set(cartItems.map((ci) => (ci.finding as ProductFinding)?.retailer).filter(Boolean))) as string[],
    };
  }

  private buildBestRatedCart(
    items: ShoppingItem[],
    findingsByItem: Map<string, ProductFinding[]>
  ): CartOption | null {
    const cartItems: CartItem[] = [];

    for (const item of items) {
      const findings = findingsByItem.get(item.id) || [];
      if (findings.length === 0) continue;

      // Sort by rating, then by reviews count
      const sorted = [...findings].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      });

      const best = sorted[0];
      cartItems.push({
        itemId: item.id,
        finding: best,
        quantity: item.quantity,
        lineTotal: best.price * item.quantity,
      });
    }

    if (cartItems.length === 0) return null;

    const subtotal = cartItems.reduce((sum, ci) => sum + (ci.lineTotal || 0), 0);
    const shipping = cartItems.reduce(
      (sum, ci) => sum + ((ci.finding as ProductFinding)?.shippingEstimate || 0),
      0
    );

    return {
      id: uuidv4(),
      strategy: 'best_rated',
      name: 'Highest Rated Products',
      description: 'Prioritizes products with the best customer reviews',
      items: cartItems,
      subtotal,
      estimatedShipping: shipping,
      estimatedTax: subtotal * 0.08,
      total: subtotal + shipping + subtotal * 0.08,
      estimatedDelivery: this.calculateDeliveryDate(cartItems),
      retailers: Array.from(new Set(cartItems.map((ci) => (ci.finding as ProductFinding)?.retailer).filter(Boolean))) as string[],
    };
  }

  private buildFastestDeliveryCart(
    items: ShoppingItem[],
    findingsByItem: Map<string, ProductFinding[]>
  ): CartOption | null {
    const cartItems: CartItem[] = [];

    for (const item of items) {
      const findings = findingsByItem.get(item.id) || [];
      if (findings.length === 0) continue;

      // Sort by delivery days
      const sorted = [...findings].sort(
        (a, b) => (a.deliveryDays || 7) - (b.deliveryDays || 7)
      );

      const best = sorted[0];
      cartItems.push({
        itemId: item.id,
        finding: best,
        quantity: item.quantity,
        lineTotal: best.price * item.quantity,
      });
    }

    if (cartItems.length === 0) return null;

    const subtotal = cartItems.reduce((sum, ci) => sum + (ci.lineTotal || 0), 0);
    const shipping = cartItems.reduce(
      (sum, ci) => sum + ((ci.finding as ProductFinding)?.shippingEstimate || 0),
      0
    );

    return {
      id: uuidv4(),
      strategy: 'fastest',
      name: 'Fastest Delivery',
      description: 'Optimized for the quickest delivery times',
      items: cartItems,
      subtotal,
      estimatedShipping: shipping,
      estimatedTax: subtotal * 0.08,
      total: subtotal + shipping + subtotal * 0.08,
      estimatedDelivery: this.calculateDeliveryDate(cartItems),
      retailers: Array.from(new Set(cartItems.map((ci) => (ci.finding as ProductFinding)?.retailer).filter(Boolean))) as string[],
    };
  }

  private buildSingleRetailerCarts(
    items: ShoppingItem[],
    findingsByItem: Map<string, ProductFinding[]>
  ): CartOption[] {
    const options: CartOption[] = [];

    // Get all retailers that have at least some items
    const retailerCoverage = new Map<string, number>();
    for (const [, findings] of Array.from(findingsByItem.entries())) {
      const retailers = Array.from(new Set(findings.map((f) => f.retailer)));
      for (const r of retailers) {
        if (r) retailerCoverage.set(r, (retailerCoverage.get(r) || 0) + 1);
      }
    }

    // Only consider retailers that have all items
    const fullCoverageRetailers = Array.from(retailerCoverage.entries())
      .filter(([, count]) => count === items.length)
      .map(([retailer]) => retailer);

    for (const retailer of fullCoverageRetailers) {
      const cartItems: CartItem[] = [];

      for (const item of items) {
        const findings = findingsByItem.get(item.id) || [];
        const retailerFindings = findings.filter((f) => f.retailer === retailer);
        if (retailerFindings.length === 0) continue;

        // Pick cheapest from this retailer
        const sorted = [...retailerFindings].sort((a, b) => a.price - b.price);
        const best = sorted[0];

        cartItems.push({
          itemId: item.id,
          finding: best,
          quantity: item.quantity,
          lineTotal: best.price * item.quantity,
        });
      }

      if (cartItems.length === items.length) {
        const subtotal = cartItems.reduce((sum, ci) => sum + (ci.lineTotal || 0), 0);
        // Single retailer usually means combined shipping
        const shipping = Math.max(
          ...cartItems.map((ci) => (ci.finding as ProductFinding)?.shippingEstimate || 0)
        );

        options.push({
          id: uuidv4(),
          strategy: 'single_retailer',
          name: `All from ${retailer}`,
          description: `Single retailer for simplified checkout and combined shipping`,
          items: cartItems,
          subtotal,
          estimatedShipping: shipping,
          estimatedTax: subtotal * 0.08,
          total: subtotal + shipping + subtotal * 0.08,
          estimatedDelivery: this.calculateDeliveryDate(cartItems),
          retailers: [retailer],
        });
      }
    }

    return options;
  }

  private matchesItem(finding: ProductFinding, item: ShoppingItem): boolean {
    // Basic matching - in production this would use NLP/ML
    const nameLower = (item.name || item.description).toLowerCase();
    const findingName = (finding.productName || '').toLowerCase();

    // Check if finding name contains item name keywords
    const keywords = nameLower.split(' ').filter((k) => k.length > 2);
    const matchCount = keywords.filter((k) => findingName.includes(k)).length;

    return matchCount >= Math.ceil(keywords.length * 0.5);
  }

  private calculateDeliveryDate(cartItems: CartItem[]): Date {
    const maxDays = Math.max(
      ...cartItems.map((ci) => (ci.finding as ProductFinding)?.deliveryDays || 7)
    );
    const date = new Date();
    date.setDate(date.getDate() + maxDays);
    return date;
  }

  private deduplicateOptions(options: CartOption[]): CartOption[] {
    const seen = new Set<string>();
    return options.filter((opt) => {
      // Create a signature based on items and retailers
      const sig = opt.items
        .map((ci) => `${(ci.finding as ProductFinding)?.productId || ''}:${ci.quantity}`)
        .sort()
        .join('|');

      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  /**
   * Compare prices for a specific product across retailers
   */
  async comparePrices(productName: string): Promise<ProductFinding[]> {
    const findings: ProductFinding[] = [];

    for (const [, adapter] of Array.from(this.adapters.entries())) {
      try {
        const results = await adapter.search(productName, { maxResults: 3 });
        findings.push(...results);
      } catch (error) {
        console.error(`[ShoppingAgent] Price comparison error:`, error);
      }
    }

    return findings.sort((a, b) => (a.price || 0) - (b.price || 0));
  }

  /**
   * Check if cart is within budget constraints
   */
  validateBudget(cart: CartOption): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    const constraints = this.config.budgetConstraints;

    if (cart.total && cart.total > constraints.totalLimit) {
      violations.push(
        `Total $${cart.total.toFixed(2)} exceeds budget of $${constraints.totalLimit}`
      );
    }

    if (constraints.perItemLimit) {
      for (const item of cart.items) {
        if (item.lineTotal && item.lineTotal > constraints.perItemLimit) {
          violations.push(
            `Item "${item.finding?.productName || 'Unknown'}" at $${item.lineTotal.toFixed(2)} exceeds per-item limit of $${constraints.perItemLimit}`
          );
        }
      }
    }

    if (constraints.maxShipping && cart.estimatedShipping && cart.estimatedShipping > constraints.maxShipping) {
      violations.push(
        `Shipping $${cart.estimatedShipping.toFixed(2)} exceeds limit of $${constraints.maxShipping}`
      );
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Mock Retailer Adapter (for testing)
// ─────────────────────────────────────────────────────────────

export class MockRetailerAdapter implements RetailerAdapter {
  id: string;
  name: string;
  private mockProducts: ProductFinding[];

  constructor(id: string, name: string, products: ProductFinding[]) {
    this.id = id;
    this.name = name;
    this.mockProducts = products;
  }

  async search(query: string, options?: SearchOptions): Promise<ProductFinding[]> {
    const queryLower = query.toLowerCase();
    let results = this.mockProducts.filter((p) =>
      p.productName.toLowerCase().includes(queryLower)
    );

    if (options?.priceMax) {
      results = results.filter((p) => p.price <= options.priceMax!);
    }

    if (options?.inStockOnly) {
      results = results.filter((p) => p.inStock);
    }

    if (options?.sortBy === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (options?.sortBy === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (options?.sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    }

    return results.slice(0, options?.maxResults || 10);
  }

  async getProductDetails(productId: string): Promise<ProductFinding | null> {
    return this.mockProducts.find((p) => p.productId === productId) || null;
  }

  async checkAvailability(
    productId: string,
    quantity: number
  ): Promise<AvailabilityResult> {
    const product = this.mockProducts.find((p) => p.productId === productId);
    if (!product) {
      return { available: false, quantity: 0, fulfillmentType: 'unavailable' };
    }

    return {
      available: (product.stockQuantity || 0) >= quantity,
      quantity: product.stockQuantity || 0,
      fulfillmentType: 'warehouse',
    };
  }

  async estimateShipping(
    productId: string,
    _zipCode: string
  ): Promise<ShippingEstimate> {
    const product = this.mockProducts.find((p) => p.productId === productId);
    if (!product) {
      return { standard: null, expedited: null, overnight: null };
    }

    return {
      standard: { price: product.shippingEstimate || 5.99, days: product.deliveryDays || 5 },
      expedited: { price: (product.shippingEstimate || 5.99) * 2, days: 2 },
      overnight: { price: (product.shippingEstimate || 5.99) * 4, days: 1 },
    };
  }
}

export default ShoppingAgent;
