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
      subtotal: option.subtotal,
      shipping: option.estimatedShipping,
      tax: option.estimatedTax,
      total: option.total,
      retailerBreakdown: this.calculateRetailerBreakdown(option.items),
      createdAt: new Date(),
      updatedAt: new Date(),
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
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      retailerBreakdown: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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

    const cartItem: CartItem = {
      itemId: item.id,
      finding,
      quantity: quantity || item.quantity,
      lineTotal: finding.price * (quantity || item.quantity),
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
    item.lineTotal = item.finding.price * quantity;
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

    item.finding = newFinding;
    item.lineTotal = newFinding.price * item.quantity;
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
              item.lineTotal = item.finding.price * mod.data.quantity;
            }
          }
          break;

        case 'swap_product':
          if (mod.data?.finding) {
            const item = cart.items.find((i) => i.itemId === mod.itemId);
            if (item) {
              item.finding = mod.data.finding;
              item.lineTotal = mod.data.finding.price * item.quantity;
            }
          }
          break;

        case 'add':
          if (mod.data?.finding) {
            cart.items.push({
              itemId: mod.itemId,
              finding: mod.data.finding,
              quantity: mod.data.quantity || 1,
              lineTotal: mod.data.finding.price * (mod.data.quantity || 1),
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
      if (!item.finding.inStock) {
        errors.push({
          type: 'out_of_stock',
          itemId: item.itemId,
          message: `"${item.finding.productName}" is out of stock`,
        });
      } else if (
        item.finding.stockQuantity !== undefined &&
        item.finding.stockQuantity < item.quantity
      ) {
        if (item.finding.stockQuantity === 0) {
          errors.push({
            type: 'out_of_stock',
            itemId: item.itemId,
            message: `"${item.finding.productName}" is out of stock`,
          });
        } else {
          warnings.push({
            type: 'low_stock',
            itemId: item.itemId,
            message: `Only ${item.finding.stockQuantity} units available for "${item.finding.productName}"`,
          });
        }
      }

      // Shipping delay warning
      if (item.finding.deliveryDays && item.finding.deliveryDays > 7) {
        warnings.push({
          type: 'slow_shipping',
          itemId: item.itemId,
          message: `"${item.finding.productName}" has ${item.finding.deliveryDays}-day delivery`,
        });
      }
    }

    // Budget validation
    if (constraints) {
      if (cart.total > constraints.totalBudget) {
        errors.push({
          type: 'budget_exceeded',
          message: `Cart total $${cart.total.toFixed(2)} exceeds budget of $${constraints.totalBudget}`,
        });
      } else if (cart.total > constraints.totalBudget * 0.9) {
        warnings.push({
          type: 'near_budget',
          message: `Cart total $${cart.total.toFixed(2)} is near budget limit of $${constraints.totalBudget}`,
        });
      }

      if (constraints.maxPerItem) {
        for (const item of cart.items) {
          if (item.lineTotal > constraints.maxPerItem) {
            errors.push({
              type: 'budget_exceeded',
              itemId: item.itemId,
              message: `"${item.finding.productName}" at $${item.lineTotal.toFixed(2)} exceeds per-item limit of $${constraints.maxPerItem}`,
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

    const originalTotal = cart.total;
    const changes: OptimizationChange[] = [];

    // Try to swap items for cheaper alternatives
    for (const item of cart.items) {
      const alternatives = alternateFindings.get(item.itemId) || [];
      const cheaper = alternatives
        .filter((f) => f.price < item.finding.price && f.inStock)
        .sort((a, b) => a.price - b.price)[0];

      if (cheaper) {
        const savings = (item.finding.price - cheaper.price) * item.quantity;
        if (savings > 0.5) {
          // Only suggest if savings > $0.50
          item.finding = cheaper;
          item.lineTotal = cheaper.price * item.quantity;

          changes.push({
            itemId: item.itemId,
            type: 'swapped',
            description: `Swapped to cheaper option from ${cheaper.retailer}`,
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
      optimizedTotal: cart.total,
      savings: originalTotal - cart.total,
      changes,
    };
  }

  /**
   * Get cart summary for display
   */
  getCartSummary(cartId: string): CartSummary {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    return {
      cartId: cart.id,
      missionId: cart.missionId,
      itemCount: cart.items.length,
      totalQuantity: cart.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
      retailers: [...new Set(cart.items.map((i) => i.finding.retailer))],
      status: cart.status,
    };
  }

  /**
   * Mark cart as ready for checkout (pending user/ACHEEVY approval)
   */
  markReadyForCheckout(cartId: string): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.status = 'pending_approval';
    cart.updatedAt = new Date();

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
    cart.updatedAt = new Date();

    return cart;
  }

  /**
   * Finalize cart after successful payment
   * Called by ACHEEVY after payment processing
   */
  finalize(cartId: string, orderIds: Record<string, string>): AggregatedCart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.status = 'completed';
    cart.finalizedAt = new Date();
    cart.orderIds = orderIds;
    cart.updatedAt = new Date();

    return cart;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  private recalculateTotals(cart: AggregatedCart): void {
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.lineTotal, 0);
    cart.shipping = this.calculateShipping(cart.items);
    cart.tax = cart.subtotal * this.config.defaultTaxRate;
    cart.total = cart.subtotal + cart.shipping + cart.tax;
    cart.retailerBreakdown = this.calculateRetailerBreakdown(cart.items);
    cart.updatedAt = new Date();
  }

  private calculateShipping(items: CartItem[]): number {
    if (this.config.combineRetailerShipping) {
      // Group by retailer and take max shipping per retailer
      const byRetailer = new Map<string, number>();
      for (const item of items) {
        const retailer = item.finding.retailer;
        const shipping = item.finding.shippingEstimate || 0;
        const current = byRetailer.get(retailer) || 0;
        byRetailer.set(retailer, Math.max(current, shipping));
      }
      return Array.from(byRetailer.values()).reduce((sum, s) => sum + s, 0);
    } else {
      // Sum all shipping
      return items.reduce((sum, i) => sum + (i.finding.shippingEstimate || 0), 0);
    }
  }

  private optimizeShipping(cart: AggregatedCart): number {
    const oldShipping = cart.shipping;
    const newShipping = this.calculateShipping(cart.items);
    cart.shipping = newShipping;
    return oldShipping - newShipping;
  }

  private calculateRetailerBreakdown(
    items: CartItem[]
  ): AggregatedCart['retailerBreakdown'] {
    const byRetailer = new Map<
      string,
      { subtotal: number; shipping: number; itemCount: number }
    >();

    for (const item of items) {
      const retailer = item.finding.retailer;
      const current = byRetailer.get(retailer) || {
        subtotal: 0,
        shipping: 0,
        itemCount: 0,
      };

      current.subtotal += item.lineTotal;
      current.shipping = Math.max(current.shipping, item.finding.shippingEstimate || 0);
      current.itemCount += item.quantity;

      byRetailer.set(retailer, current);
    }

    return Array.from(byRetailer.entries()).map(([retailer, data]) => ({
      retailer,
      ...data,
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
      const key = `${item.finding.productId}:${item.finding.retailer}`;
      const existing = itemMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.lineTotal = existing.finding.price * existing.quantity;
      } else {
        itemMap.set(key, { ...item });
      }
    }

    const merged: AggregatedCart = {
      id: uuidv4(),
      missionId,
      status: 'draft',
      items: Array.from(itemMap.values()),
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      retailerBreakdown: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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
      ...original,
      id: uuidv4(),
      status: 'draft',
      items: original.items.map((i) => ({ ...i, finding: { ...i.finding } })),
      retailerBreakdown: [...original.retailerBreakdown],
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedBy: undefined,
      approvedAt: undefined,
      finalizedAt: undefined,
      orderIds: undefined,
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
