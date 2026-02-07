// @ts-nocheck
/**
 * LUC Integration for Shopping Module
 *
 * Connects the shopping system with LUC (Layered Usage Calculator)
 * for budget tracking, spending limits, and cost projections.
 *
 * Key Functions:
 * - Track shopping spend against budgets
 * - Enforce spending limits
 * - Project costs before purchases
 * - Alert when approaching budget limits
 */

import type { BudgetConstraints, AggregatedCart, ShoppingMission } from './types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * LUC Engine interface (simplified for shopping integration)
 * Full implementation in @plugmein/luc-sdk
 */
export interface LUCEngineInterface {
  canExecute(service: string, amount: number): { allowed: boolean; reason?: string };
  debit(service: string, amount: number): { success: boolean; newBalance: number };
  credit(service: string, amount: number): { success: boolean; newBalance: number };
  quote(service: string, amount: number): {
    service: string;
    amount: number;
    estimatedCost: number;
    withinQuota: boolean;
    remainingQuota: number;
  };
  getSummary(): {
    totalSpent: number;
    totalBudget: number;
    remainingBudget: number;
    utilizationPercent: number;
  };
}

export interface SpendingCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  pending: number;
  color: string;
}

export interface SpendCheckResult {
  allowed: boolean;
  reason?: string;
  currentSpent: number;
  cartTotal: number;
  projectedTotal: number;
  budgetRemaining: number;
  recommendations?: string[];
}

export interface BudgetAllocation {
  missionId: string;
  category: string;
  amount: number;
  status: 'pending' | 'committed' | 'released';
  createdAt: Date;
  expiresAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Shopping Budget Manager
// ─────────────────────────────────────────────────────────────

export class ShoppingBudgetManager {
  private lucEngine: LUCEngineInterface | null = null;
  private categories: Map<string, SpendingCategory>;
  private allocations: Map<string, BudgetAllocation>;
  private pendingByMission: Map<string, number>;

  constructor() {
    this.categories = new Map();
    this.allocations = new Map();
    this.pendingByMission = new Map();

    // Initialize default categories
    this.initializeDefaultCategories();
  }

  /**
   * Connect to a LUC engine instance
   */
  connectLUC(engine: LUCEngineInterface): void {
    this.lucEngine = engine;
  }

  /**
   * Initialize default spending categories
   */
  private initializeDefaultCategories(): void {
    const defaults: SpendingCategory[] = [
      { id: 'groceries', name: 'Groceries', budget: 500, spent: 0, pending: 0, color: '#4CAF50' },
      { id: 'household', name: 'Household', budget: 300, spent: 0, pending: 0, color: '#2196F3' },
      { id: 'electronics', name: 'Electronics', budget: 200, spent: 0, pending: 0, color: '#9C27B0' },
      { id: 'office', name: 'Office Supplies', budget: 100, spent: 0, pending: 0, color: '#FF9800' },
      { id: 'other', name: 'Other', budget: 200, spent: 0, pending: 0, color: '#607D8B' },
    ];

    for (const cat of defaults) {
      this.categories.set(cat.id, cat);
    }
  }

  /**
   * Set budget for a category
   */
  setCategoryBudget(categoryId: string, budget: number): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.budget = budget;
    } else {
      this.categories.set(categoryId, {
        id: categoryId,
        name: categoryId,
        budget,
        spent: 0,
        pending: 0,
        color: '#607D8B',
      });
    }
  }

  /**
   * Get all spending categories
   */
  getCategories(): SpendingCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get budget constraints for a mission
   */
  getBudgetConstraints(missionCategory?: string): BudgetConstraints {
    // If LUC is connected, use its budget info
    if (this.lucEngine) {
      const summary = this.lucEngine.getSummary();
      return {
        totalLimit: summary.remainingBudget,
        perItemLimit: summary.totalBudget * 0.25, // Max 25% of budget per item
        currency: 'USD',
      };
    }

    // Otherwise use category-based budget
    if (missionCategory) {
      const category = this.categories.get(missionCategory);
      if (category) {
        const remaining = category.budget - category.spent - category.pending;
        return {
          totalLimit: remaining,
          perItemLimit: category.budget * 0.5,
          currency: 'USD',
        };
      }
    }

    // Default constraints
    return {
      totalLimit: 500,
      perItemLimit: 250,
      currency: 'USD',
    };
  }

  /**
   * Check if a cart purchase is allowed
   */
  checkSpend(cart: AggregatedCart, category?: string): SpendCheckResult {
    const constraints = this.getBudgetConstraints(category);
    const pendingForMission = this.pendingByMission.get(cart.missionId) || 0;
    const cartTotal = cart.summary.grandTotal;

    // If LUC is connected, use it for the check
    if (this.lucEngine) {
      const serviceKey = category || 'shopping';
      const canExecute = this.lucEngine.canExecute(serviceKey, cartTotal);
      const quote = this.lucEngine.quote(serviceKey, cartTotal);

      return {
        allowed: canExecute.allowed,
        reason: canExecute.reason,
        currentSpent: quote.estimatedCost - cartTotal,
        cartTotal: cartTotal,
        projectedTotal: quote.estimatedCost,
        budgetRemaining: quote.remainingQuota,
        recommendations: canExecute.allowed
          ? undefined
          : this.getRecommendations(cart, constraints),
      };
    }

    // Manual budget check
    const catData = category ? this.categories.get(category) : null;
    const currentSpent = catData ? catData.spent + catData.pending : 0;
    const projectedTotal = currentSpent + cartTotal - pendingForMission;
    const budgetRemaining = constraints.totalLimit - projectedTotal;

    const allowed = cartTotal <= constraints.totalLimit + pendingForMission;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Cart total $${cartTotal.toFixed(2)} exceeds available budget of $${(constraints.totalLimit + pendingForMission).toFixed(2)}`,
      currentSpent,
      cartTotal: cartTotal,
      projectedTotal,
      budgetRemaining: Math.max(0, budgetRemaining),
      recommendations: allowed ? undefined : this.getRecommendations(cart, constraints),
    };
  }

  /**
   * Reserve budget for a pending purchase
   */
  reserveBudget(
    missionId: string,
    amount: number,
    category?: string,
    expiresInMinutes = 30
  ): BudgetAllocation | null {
    const constraints = this.getBudgetConstraints(category);
    const currentPending = this.pendingByMission.get(missionId) || 0;

    // Check if reservation is possible
    if (amount > constraints.totalLimit + currentPending) {
      return null;
    }

    const allocation: BudgetAllocation = {
      missionId,
      category: category || 'other',
      amount,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    };

    const allocationId = `${missionId}:${Date.now()}`;
    this.allocations.set(allocationId, allocation);

    // Update pending amount
    this.pendingByMission.set(missionId, currentPending + amount);

    // Update category pending
    if (category) {
      const cat = this.categories.get(category);
      if (cat) {
        cat.pending += amount;
      }
    }

    return allocation;
  }

  /**
   * Commit a reserved budget (purchase completed)
   */
  commitBudget(missionId: string, actualAmount: number, category?: string): boolean {
    const pending = this.pendingByMission.get(missionId) || 0;
    if (pending === 0) return false;

    // Update spent
    if (category) {
      const cat = this.categories.get(category);
      if (cat) {
        cat.spent += actualAmount;
        cat.pending = Math.max(0, cat.pending - pending);
      }
    }

    // If LUC is connected, record the debit
    if (this.lucEngine) {
      const serviceKey = category || 'shopping';
      this.lucEngine.debit(serviceKey, actualAmount);
    }

    // Clear pending
    this.pendingByMission.delete(missionId);

    // Update allocation status
    for (const [id, alloc] of Array.from(this.allocations.entries())) {
      if (alloc.missionId === missionId && alloc.status === 'pending') {
        alloc.status = 'committed';
        // Keep for history, or delete: this.allocations.delete(id);
      }
    }

    return true;
  }

  /**
   * Release a reserved budget (purchase cancelled)
   */
  releaseBudget(missionId: string, category?: string): void {
    const pending = this.pendingByMission.get(missionId);
    if (!pending) return;

    // Update category pending
    if (category) {
      const cat = this.categories.get(category);
      if (cat) {
        cat.pending = Math.max(0, cat.pending - pending);
      }
    }

    // Clear pending
    this.pendingByMission.delete(missionId);

    // Update allocation status
    for (const [, alloc] of Array.from(this.allocations.entries())) {
      if (alloc.missionId === missionId && alloc.status === 'pending') {
        alloc.status = 'released';
      }
    }
  }

  /**
   * Get cost projection for a shopping mission
   */
  projectMissionCost(mission: ShoppingMission): {
    estimated: number;
    minimum: number;
    maximum: number;
    withinBudget: boolean;
    budgetUtilization: number;
  } {
    // Calculate estimates from items
    let minimum = 0;
    let maximum = 0;
    let estimated = 0;

    for (const item of mission.items) {
      const qty = item.quantity;
      if (item.minPrice) {
        minimum += item.minPrice * qty;
      }
      if (item.maxPrice) {
        maximum += item.maxPrice * qty;
        estimated += item.maxPrice * 0.8 * qty; // Estimate at 80% of max
      } else if (item.minPrice) {
        maximum += item.minPrice * 1.5 * qty;
        estimated += item.minPrice * 1.2 * qty;
      }
    }

    const constraints = this.getBudgetConstraints();
    const withinBudget = estimated <= constraints.totalLimit;
    const budgetUtilization = (estimated / constraints.totalLimit) * 100;

    return {
      estimated,
      minimum,
      maximum,
      withinBudget,
      budgetUtilization,
    };
  }

  /**
   * Get spending summary
   */
  getSpendingSummary(): {
    totalBudget: number;
    totalSpent: number;
    totalPending: number;
    totalRemaining: number;
    categories: SpendingCategory[];
  } {
    let totalBudget = 0;
    let totalSpent = 0;
    let totalPending = 0;

    for (const cat of Array.from(this.categories.values())) {
      totalBudget += cat.budget;
      totalSpent += cat.spent;
      totalPending += cat.pending;
    }

    return {
      totalBudget,
      totalSpent,
      totalPending,
      totalRemaining: totalBudget - totalSpent - totalPending,
      categories: this.getCategories(),
    };
  }

  /**
   * Clean up expired allocations
   */
  cleanupExpiredAllocations(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [id, alloc] of Array.from(this.allocations.entries())) {
      if (alloc.status === 'pending' && alloc.expiresAt < now) {
        this.releaseBudget(alloc.missionId, alloc.category);
        this.allocations.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  private getRecommendations(
    cart: AggregatedCart,
    constraints: BudgetConstraints
  ): string[] {
    const recommendations: string[] = [];
    const cartTotal = cart.summary.grandTotal;
    const overage = cartTotal - constraints.totalLimit;

    if (overage > 0) {
      recommendations.push(
        `Remove $${overage.toFixed(2)} worth of items to stay within budget`
      );
    }

    // Find most expensive item
    const sortedItems = [...cart.items].sort((a, b) => b.lineTotal - a.lineTotal);
    if (sortedItems.length > 0) {
      const mostExpensive = sortedItems[0];
      if (mostExpensive.lineTotal > constraints.totalLimit * 0.5) {
        recommendations.push(
          `Consider a cheaper alternative for "${mostExpensive.finding.productName}" ($${mostExpensive.lineTotal.toFixed(2)})`
        );
      }
    }

    // Check for items that could be reduced in quantity
    for (const item of cart.items) {
      if (item.quantity > 1) {
        recommendations.push(
          `Reduce quantity of "${item.finding.productName}" from ${item.quantity} to save $${(item.finding.price).toFixed(2)} per unit`
        );
      }
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

let defaultManager: ShoppingBudgetManager | null = null;

export function getShoppingBudgetManager(): ShoppingBudgetManager {
  if (!defaultManager) {
    defaultManager = new ShoppingBudgetManager();
  }
  return defaultManager;
}

export default ShoppingBudgetManager;
