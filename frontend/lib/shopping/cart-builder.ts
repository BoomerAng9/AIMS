/**
 * Cart Builder — Aggregated Cart Management
 *
 * Builds and manages aggregated carts across multiple retailers.
 * Handles cart optimization, merging, and checkout preparation.
 *
 * CRITICAL: This service does NOT handle payments.
 * Payment processing is exclusively handled by ACHEEVY.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AggregatedCart,
  CartItem,
  CartOption,
  CartSummary,
  ProductFinding,
  ShoppingItem,
  BudgetConstraints,
} from './types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CartBuilderConfig {
  defaultTaxRate: number;
  freeShippingThreshold?: number;
  combineRetailerShipping: boolean;
}

export interface CartModification {
  type: 'add' | 'remove' | 'update_quantity' | 'swap_product';
  itemId: string;
  data?: {
    finding?: ProductFinding;
    quantity?: number;
    alternateProductId?: string;
  };
}

export interface CartValidationResult {
  valid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
}

export interface CartValidationError {
  type: 'out_of_stock' | 'price_changed' | 'item_unavailable' | 'budget_exceeded';
  itemId?: string;
  message: string;
}

export interface CartValidationWarning {
  type: 'low_stock' | 'price_increase' | 'slow_shipping' | 'near_budget';
  itemId?: string;
  message: string;
}

export interface OptimizationResult {
  originalTotal: number;
  optimizedTotal: number;
  savings: number;
  changes: OptimizationChange[];
}

export interface OptimizationChange {
  itemId: string;
  type: 'swapped' | 'combined_shipping' | 'coupon_applied';
  description: string;
  savings: number;
}

// ─────────────────────────────────────────────────────────────
// Cart Builder Class
// ─────────────────────────────────────────────────────────────

export class CartBuilder {
  private config: CartBuilderConfig;
  private carts: Map<string, AggregatedCart>;

  constructor(config?: Partial<CartBuilderConfig>) {
    this.config = {
      defaultTaxRate: 0.08,
      combineRetailerShipping: true,
      ...config,
    };
    this.carts = new Map();
  }

  /**
   * Create a new aggregated cart from a cart option
   */
  createFromOption(option: CartOption, missionId: string): AggregatedCart {
    const cart: AggregatedCart = {
      id: uuidv4(),
      missionId,
      status: 'draft',
      items: option.items,
      summary: option.summary,
      retailerBreakdown: this.calculateRetailerBreakdown(option.items),
    };

    this.carts.set(cart.id, cart);
    return cart;
  }

  /**
   * Create an empty cart for a mission
   */
  createEmpty(missionId: string): AggregatedCart {
    const cart: AggregatedCart = {
      id: uuidv4(),
      missionId,
      status: 'draft',
      items: [],
      summary: {
        subtotal: 0,
        shippingTotal: 0,
        taxEstimate: 0,
        totalSavings: 0,
        grandTotal: 0,
        itemCount: 0,
        estimatedDelivery: {
          earliest: new Date(),
          latest: new Date(),
        },
      },
      retailerBreakdown: [],
    };

    this.carts.set(cart.id, cart);
    return cart;
  }

  /**
   * Get a cart by ID
   */
  getCart(cartId: string): AggregatedCart | undefined {
    return this.carts.get(cartId);
  }

  /**
   * Add an item to the cart
   */
  addItem(
    cartId: string,
    item: ShoppingItem,
    finding: ProductFinding,
    quantity?: number
  ): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const qty = quantity || item.quantity;
    const lineTotal = finding.product.price * qty;
    const cartItem: CartItem = {
      id: uuidv4(),
      itemId: item.id,
      productId: finding.product.id,
      productName: finding.product.name,
      productUrl: finding.product.url,
      productImage: finding.product.image,
      retailer: finding.product.retailer,
      retailerProductId: finding.product.id,
      pricePerUnit: finding.product.price,
      quantity: qty,
      totalPrice: lineTotal,
      lineTotal: lineTotal,
      originalPrice: finding.product.originalPrice,
      savings: finding.product.originalPrice ? (finding.product.originalPrice - finding.product.price) * qty : undefined,
      finding: {
        productName: finding.product.name,
        price: finding.product.price,
      },
      availability: (finding.product.availability as 'in_stock' | 'limited' | 'backorder' | 'out_of_stock') || 'in_stock',
      shippingCost: 0, // To be calculated
      shippingEstimate: 'Standard shipping',
      rating: finding.product.rating,
      reviewCount: finding.product.reviewCount,
    };

    cart.items.push(cartItem);
    this.recalculateTotals(cart);

    return cart;
  }

  /**
   * Remove an item from the cart
   */
  removeItem(cartId: string, itemId: string): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.items = cart.items.filter((i) => i.itemId !== itemId);
    this.recalculateTotals(cart);

    return cart;
  }

  /**
   * Update item quantity
   */
  updateQuantity(cartId: string, itemId: string, quantity: number): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const item = cart.items.find((i) => i.itemId === itemId);
    if (!item) throw new Error(`Item ${itemId} not found in cart`);

    if (quantity <= 0) {
      return this.removeItem(cartId, itemId);
    }

    item.quantity = quantity;
    item.totalPrice = item.pricePerUnit * quantity;
    this.recalculateTotals(cart);

    return cart;
  }

  /**
   * Swap a product for an alternative
   */
  swapProduct(
    cartId: string,
    itemId: string,
    newFinding: ProductFinding
  ): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const item = cart.items.find((i) => i.itemId === itemId);
    if (!item) throw new Error(`Item ${itemId} not found in cart`);

    // Update item with new product details
    item.productId = newFinding.product.id;
    item.productName = newFinding.product.name;
    item.productUrl = newFinding.product.url;
    item.productImage = newFinding.product.image;
    item.retailer = newFinding.product.retailer;
    item.retailerProductId = newFinding.product.id;
    item.pricePerUnit = newFinding.product.price;
    item.totalPrice = newFinding.product.price * item.quantity;
    item.originalPrice = newFinding.product.originalPrice;
    item.rating = newFinding.product.rating;
    item.reviewCount = newFinding.product.reviewCount;
    item.availability = (newFinding.product.availability as 'in_stock' | 'limited' | 'backorder' | 'out_of_stock') || 'in_stock';
    this.recalculateTotals(cart);

    return cart;
  }

  /**
   * Apply multiple modifications to a cart
   */
  applyModifications(cartId: string, modifications: CartModification[]): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    for (const mod of modifications) {
      switch (mod.type) {
        case 'remove':
          cart.items = cart.items.filter((i) => i.itemId !== mod.itemId);
          break;

        case 'update_quantity':
          if (mod.data?.quantity !== undefined) {
            const item = cart.items.find((i) => i.itemId === mod.itemId);
            if (item) {
              item.quantity = mod.data.quantity;
              item.totalPrice = item.pricePerUnit * mod.data.quantity;
            }
          }
          break;

        case 'swap_product':
          if (mod.data?.finding) {
            const item = cart.items.find((i) => i.itemId === mod.itemId);
            if (item) {
              const f = mod.data.finding;
              item.productId = f.product.id;
              item.productName = f.product.name;
              item.productUrl = f.product.url;
              item.productImage = f.product.image;
              item.retailer = f.product.retailer;
              item.retailerProductId = f.product.id;
              item.pricePerUnit = f.product.price;
              item.totalPrice = f.product.price * item.quantity;
            }
          }
          break;

        case 'add':
          if (mod.data?.finding) {
            const f = mod.data.finding;
            const qty = mod.data.quantity || 1;
            const itemLineTotal = f.product.price * qty;
            cart.items.push({
              id: uuidv4(),
              itemId: mod.itemId,
              productId: f.product.id,
              productName: f.product.name,
              productUrl: f.product.url,
              productImage: f.product.image,
              retailer: f.product.retailer,
              retailerProductId: f.product.id,
              pricePerUnit: f.product.price,
              quantity: qty,
              totalPrice: itemLineTotal,
              lineTotal: itemLineTotal,
              finding: {
                productName: f.product.name,
                price: f.product.price,
              },
              availability: (f.product.availability as 'in_stock' | 'limited' | 'backorder' | 'out_of_stock') || 'in_stock',
              shippingCost: 0,
              shippingEstimate: 'Standard shipping',
            });
          }
          break;
      }
    }

    this.recalculateTotals(cart);
    return cart;
  }

  /**
   * Validate cart against constraints and availability
   */
  validateCart(
    cartId: string,
    constraints?: BudgetConstraints
  ): CartValidationResult {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return {
        valid: false,
        errors: [{ type: 'item_unavailable', message: 'Cart not found' }],
        warnings: [],
      };
    }

    const errors: CartValidationError[] = [];
    const warnings: CartValidationWarning[] = [];

    // Check each item
    for (const item of cart.items) {
      // Stock check
      if (item.availability === 'out_of_stock') {
        errors.push({
          type: 'out_of_stock',
          itemId: item.itemId,
          message: `"${item.productName}" is out of stock`,
        });
      } else if (
        item.stockCount !== undefined &&
        item.stockCount < item.quantity
      ) {
        if (item.stockCount === 0) {
          errors.push({
            type: 'out_of_stock',
            itemId: item.itemId,
            message: `"${item.productName}" is out of stock`,
          });
        } else {
          warnings.push({
            type: 'low_stock',
            itemId: item.itemId,
            message: `Only ${item.stockCount} units available for "${item.productName}"`,
          });
        }
      }

      // Shipping delay warning - shippingEstimate is a string, not days
      if (item.shippingEstimate && item.shippingEstimate.includes('week')) {
        warnings.push({
          type: 'slow_shipping',
          itemId: item.itemId,
          message: `"${item.productName}" has extended delivery time`,
        });
      }
    }

    // Budget validation
    if (constraints) {
      const total = cart.summary.grandTotal;
      if (total > constraints.totalLimit) {
        errors.push({
          type: 'budget_exceeded',
          message: `Cart total $${total.toFixed(2)} exceeds budget of $${constraints.totalLimit}`,
        });
      } else if (total > constraints.totalLimit * 0.9) {
        warnings.push({
          type: 'near_budget',
          message: `Cart total $${total.toFixed(2)} is near budget limit of $${constraints.totalLimit}`,
        });
      }

      if (constraints.perItemLimit) {
        for (const item of cart.items) {
          if (item.totalPrice > constraints.perItemLimit) {
            errors.push({
              type: 'budget_exceeded',
              itemId: item.itemId,
              message: `"${item.productName}" at $${item.totalPrice.toFixed(2)} exceeds per-item limit of $${constraints.perItemLimit}`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Optimize cart for cost savings
   */
  async optimizeCart(
    cartId: string,
    alternateFindings: Map<string, ProductFinding[]>
  ): Promise<OptimizationResult> {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const originalTotal = cart.summary.grandTotal;
    const changes: OptimizationChange[] = [];

    // Try to swap items for cheaper alternatives
    for (const item of cart.items) {
      const alternatives = alternateFindings.get(item.itemId) || [];
      const cheaper = alternatives
        .filter((f) => f.product.price < item.pricePerUnit && f.product.availability === 'in_stock')
        .sort((a, b) => a.product.price - b.product.price)[0];

      if (cheaper) {
        const savings = (item.pricePerUnit - cheaper.product.price) * item.quantity;
        if (savings > 0.5) {
          // Only suggest if savings > $0.50
          item.productId = cheaper.product.id;
          item.productName = cheaper.product.name;
          item.productUrl = cheaper.product.url;
          item.productImage = cheaper.product.image;
          item.retailer = cheaper.product.retailer;
          item.pricePerUnit = cheaper.product.price;
          item.totalPrice = cheaper.product.price * item.quantity;

          changes.push({
            itemId: item.itemId,
            type: 'swapped',
            description: `Swapped to cheaper option from ${cheaper.product.retailer}`,
            savings,
          });
        }
      }
    }

    // Combine shipping where possible
    if (this.config.combineRetailerShipping) {
      const shippingSavings = this.optimizeShipping(cart);
      if (shippingSavings > 0) {
        changes.push({
          itemId: 'shipping',
          type: 'combined_shipping',
          description: 'Combined shipping for same-retailer items',
          savings: shippingSavings,
        });
      }
    }

    this.recalculateTotals(cart);

    return {
      originalTotal,
      optimizedTotal: cart.summary.grandTotal,
      savings: originalTotal - cart.summary.grandTotal,
      changes,
    };
  }

  /**
   * Get cart summary for display
   */
  getCartSummary(cartId: string): CartSummary & { cartId: string; missionId: string; totalQuantity: number; retailers: string[]; status: string } {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    return {
      ...cart.summary,
      cartId: cart.id,
      missionId: cart.missionId,
      totalQuantity: cart.items.reduce((sum, i) => sum + i.quantity, 0),
      retailers: Array.from(new Set(cart.items.map((i) => i.retailer))),
      status: cart.status,
    };
  }

  /**
   * Mark cart as ready for checkout (pending user/ACHEEVY approval)
   */
  markReadyForCheckout(cartId: string): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    // Cart remains in draft until approved
    return cart;
  }

  /**
   * Mark cart as approved (ready for ACHEEVY to process payment)
   */
  markApproved(cartId: string, approvedBy: string): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.status = 'approved';
    cart.approvedBy = approvedBy;
    cart.approvedAt = new Date();

    return cart;
  }

  /**
   * Finalize cart after successful payment
   * Called by ACHEEVY after payment processing
   */
  finalize(cartId: string, _orderIds: Record<string, string>): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.status = 'purchased';

    return cart;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  private recalculateTotals(cart: AggregatedCart): void {
    const subtotal = cart.items.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingTotal = this.calculateShipping(cart.items);
    const taxEstimate = subtotal * this.config.defaultTaxRate;
    const totalSavings = cart.items.reduce((sum, i) => sum + (i.savings || 0), 0);

    cart.summary = {
      subtotal,
      shippingTotal,
      taxEstimate,
      totalSavings,
      grandTotal: subtotal + shippingTotal + taxEstimate,
      itemCount: cart.items.length,
      estimatedDelivery: {
        earliest: new Date(),
        latest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    };
    cart.retailerBreakdown = this.calculateRetailerBreakdown(cart.items);
  }

  private calculateShipping(items: CartItem[]): number {
    if (this.config.combineRetailerShipping) {
      // Group by retailer and take max shipping per retailer
      const byRetailer = new Map<string, number>();
      for (const item of items) {
        const retailer = item.retailer;
        const shipping = item.shippingCost || 0;
        const current = byRetailer.get(retailer) || 0;
        byRetailer.set(retailer, Math.max(current, shipping));
      }
      return Array.from(byRetailer.values()).reduce((sum, s) => sum + s, 0);
    } else {
      // Sum all shipping
      return items.reduce((sum, i) => sum + (i.shippingCost || 0), 0);
    }
  }

  private optimizeShipping(cart: AggregatedCart): number {
    const oldShipping = cart.summary.shippingTotal;
    const newShipping = this.calculateShipping(cart.items);
    cart.summary.shippingTotal = newShipping;
    return oldShipping - newShipping;
  }

  private calculateRetailerBreakdown(
    items: CartItem[]
  ): AggregatedCart['retailerBreakdown'] {
    const byRetailer = new Map<
      string,
      { subtotal: number; shippingCost: number; itemCount: number }
    >();

    for (const item of items) {
      const retailer = item.retailer;
      const current = byRetailer.get(retailer) || {
        subtotal: 0,
        shippingCost: 0,
        itemCount: 0,
      };

      current.subtotal += item.totalPrice;
      current.shippingCost = Math.max(current.shippingCost, item.shippingCost || 0);
      current.itemCount += item.quantity;

      byRetailer.set(retailer, current);
    }

    return Array.from(byRetailer.entries()).map(([retailer, data]) => ({
      retailer,
      itemCount: data.itemCount,
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      freeShippingEligible: data.subtotal >= 50, // Example threshold
    }));
  }

  /**
   * Merge multiple carts into one
   */
  mergeCarts(cartIds: string[], missionId: string): AggregatedCart {
    const allItems: CartItem[] = [];

    for (const cartId of cartIds) {
      const cart = this.carts.get(cartId);
      if (cart) {
        allItems.push(...cart.items);
        // Remove old cart
        this.carts.delete(cartId);
      }
    }

    // Deduplicate by combining quantities for same products
    const itemMap = new Map<string, CartItem>();
    for (const item of allItems) {
      const key = `${item.productId}:${item.retailer}`;
      const existing = itemMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice = existing.pricePerUnit * existing.quantity;
      } else {
        itemMap.set(key, { ...item });
      }
    }

    const merged: AggregatedCart = {
      id: uuidv4(),
      missionId,
      status: 'draft',
      items: Array.from(itemMap.values()),
      summary: {
        subtotal: 0,
        shippingTotal: 0,
        taxEstimate: 0,
        totalSavings: 0,
        grandTotal: 0,
        itemCount: 0,
        estimatedDelivery: {
          earliest: new Date(),
          latest: new Date(),
        },
      },
      retailerBreakdown: [],
    };

    this.recalculateTotals(merged);
    this.carts.set(merged.id, merged);

    return merged;
  }

  /**
   * Clone a cart
   */
  cloneCart(cartId: string): AggregatedCart {
    const original = this.carts.get(cartId);
    if (!original) throw new Error(`Cart ${cartId} not found`);

    const clone: AggregatedCart = {
      id: uuidv4(),
      missionId: original.missionId,
      status: 'draft',
      items: original.items.map((i) => ({ ...i, id: uuidv4() })),
      summary: { ...original.summary },
      retailerBreakdown: [...original.retailerBreakdown],
    };

    this.carts.set(clone.id, clone);
    return clone;
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

let defaultBuilder: CartBuilder | null = null;

export function getCartBuilder(config?: Partial<CartBuilderConfig>): CartBuilder {
  if (!defaultBuilder) {
    defaultBuilder = new CartBuilder(config);
  }
  return defaultBuilder;
}

export default CartBuilder;
