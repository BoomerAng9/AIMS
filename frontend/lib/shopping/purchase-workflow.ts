// @ts-nocheck
/**
 * Purchase Workflow — End-to-End Shopping Orchestration
 *
 * This is the main orchestration layer that ACHEEVY uses to coordinate
 * the entire Buy in Bulk workflow.
 *
 * Flow:
 * 1. User describes what they want to ACHEEVY
 * 2. ACHEEVY creates a shopping mission
 * 3. PurchasingPMO assigns Boomer_Angs to scout
 * 4. Boomer_Angs find products and build cart options
 * 5. User/ACHEEVY reviews and approves cart
 * 6. ACHEEVY processes payment (Boomer_Angs NEVER touch payments)
 * 7. Order tracking begins
 *
 * Change Request Flow:
 * - If prices exceed limits, Boomer_Angs create Change Requests
 * - Change Requests flow upstream to ACHEEVY
 * - ACHEEVY presents options to user
 * - User decides: approve overage, modify cart, or cancel
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ShoppingMission,
  ShoppingItem,
  AggregatedCart,
  CartOption,
  ProductFinding,
  ShoppingChangeRequest,
  BudgetConstraints,
  MissionStatus,
} from './types';
import { PurchasingPMO, getPMO } from './purchasing-pmo';
import { CartBuilder, getCartBuilder } from './cart-builder';
import { PriceMonitor, getPriceMonitor } from './price-monitor';
import { ShoppingBudgetManager, getShoppingBudgetManager } from './luc-integration';
import type { ShoppingAgent, ScoutingResult } from './shopping-agent';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface WorkflowConfig {
  autoApproveUnderBudget: boolean;
  priceMonitoringEnabled: boolean;
  maxChangeRequestRetries: number;
  changeRequestTimeoutMs: number;
}

export interface WorkflowState {
  missionId: string;
  status: MissionStatus;
  phase: WorkflowPhase;
  cart?: AggregatedCart;
  pendingChangeRequests: ShoppingChangeRequest[];
  error?: string;
}

export type WorkflowPhase =
  | 'initializing'
  | 'scouting'
  | 'building_cart'
  | 'awaiting_review'
  | 'change_request_pending'
  | 'approved'
  | 'processing_payment'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface WorkflowEvent {
  type: WorkflowEventType;
  missionId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export type WorkflowEventType =
  | 'mission_created'
  | 'scouting_started'
  | 'scouting_completed'
  | 'cart_built'
  | 'change_request_created'
  | 'change_request_resolved'
  | 'cart_approved'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'mission_completed'
  | 'mission_cancelled';

export type WorkflowEventHandler = (event: WorkflowEvent) => void | Promise<void>;

// ─────────────────────────────────────────────────────────────
// Purchase Workflow Orchestrator
// ─────────────────────────────────────────────────────────────

export class PurchaseWorkflow {
  private config: WorkflowConfig;
  private pmo: PurchasingPMO;
  private cartBuilder: CartBuilder;
  private priceMonitor: PriceMonitor;
  private budgetManager: ShoppingBudgetManager;
  private workflows: Map<string, WorkflowState>;
  private eventHandlers: Set<WorkflowEventHandler>;
  private agents: Map<string, ShoppingAgent>;

  constructor(config?: Partial<WorkflowConfig>) {
    this.config = {
      autoApproveUnderBudget: false,
      priceMonitoringEnabled: true,
      maxChangeRequestRetries: 3,
      changeRequestTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };

    this.pmo = getPMO();
    this.cartBuilder = getCartBuilder();
    this.priceMonitor = getPriceMonitor();
    this.budgetManager = getShoppingBudgetManager();
    this.workflows = new Map();
    this.eventHandlers = new Set();
    this.agents = new Map();
  }

  /**
   * Register a shopping agent (Boomer_Ang)
   */
  registerAgent(agent: ShoppingAgent, agentId: string): void {
    this.agents.set(agentId, agent);
  }

  /**
   * Subscribe to workflow events
   */
  onEvent(handler: WorkflowEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Start a new shopping workflow
   * Called by ACHEEVY when user wants to buy in bulk
   */
  async startWorkflow(params: {
    userId: string;
    description: string;
    items: Omit<ShoppingItem, 'id' | 'status'>[];
    budget: BudgetConstraints;
    preferences?: {
      preferredRetailers?: string[];
      maxDeliveryDays?: number;
      qualityPreference?: 'budget' | 'balanced' | 'premium';
    };
  }): Promise<WorkflowState> {
    // Create shopping mission via PMO
    // Assign IDs to items that don't have them
    const itemsWithIds: ShoppingItem[] = params.items.map((item) => ({
      ...item,
      id: uuidv4(),
    }));

    const mission = await this.pmo.createMission({
      userId: params.userId,
      title: params.description,
      items: itemsWithIds,
      budget: params.budget,
      preferences: {
        preferredRetailers: params.preferences?.preferredRetailers ?? [],
        excludedRetailers: [],
        shippingSpeed: 'standard',
        maxDeliveryDays: params.preferences?.maxDeliveryDays,
        qualityPreference: params.preferences?.qualityPreference ?? 'balanced',
      },
    });

    // Initialize workflow state
    const state: WorkflowState = {
      missionId: mission.id,
      status: 'planning',
      phase: 'initializing',
      pendingChangeRequests: [],
    };

    this.workflows.set(mission.id, state);
    await this.emitEvent('mission_created', mission.id, { mission });

    // Start scouting
    await this.startScouting(mission.id);

    return state;
  }

  /**
   * Start the scouting phase
   */
  private async startScouting(missionId: string): Promise<void> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);

    state.phase = 'scouting';
    state.status = 'scouting';
    await this.emitEvent('scouting_started', missionId);

    // PMO starts the mission (creates teams and assigns tasks)
    await this.pmo.startMission(missionId);

    // In a real implementation, this would dispatch to actual Boomer_Ang agents
    // For now, we'll simulate the scouting process
    // The actual scouting happens asynchronously

    // Register for PMO events to know when scouting completes
    // This would be handled by the Boomer_Ang agents calling back
  }

  /**
   * Process scouting results from Boomer_Ang agents
   * Called when agents return with their findings
   */
  async processScoutingResults(
    missionId: string,
    results: ScoutingResult[]
  ): Promise<void> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);

    // Combine all findings
    const allFindings: ProductFinding[] = [];
    const allCartOptions: CartOption[] = [];
    const allWarnings: Array<{ agentId: string; warning: string }> = [];

    for (const result of results) {
      allFindings.push(...result.findings);
      allCartOptions.push(...result.cartOptions);

      for (const warning of result.warnings) {
        if (warning.severity === 'high') {
          allWarnings.push({
            agentId: result.agentId,
            warning: warning.message,
          });
        }
      }
    }

    // Process findings through PMO
    for (const result of results) {
      await this.pmo.processFindings(missionId, result.agentId, result.findings);
    }

    await this.emitEvent('scouting_completed', missionId, {
      findingsCount: allFindings.length,
      cartOptionsCount: allCartOptions.length,
      warnings: allWarnings,
    });

    // Move to cart building phase
    await this.buildCart(missionId, allCartOptions);
  }

  /**
   * Build aggregated cart from options
   */
  private async buildCart(
    missionId: string,
    cartOptions: CartOption[]
  ): Promise<void> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);

    state.phase = 'building_cart';

    if (cartOptions.length === 0) {
      state.phase = 'failed';
      state.error = 'No products found matching your requirements';
      return;
    }

    // Select the best cart option (cheapest that's within budget)
    const mission = await this.pmo.getMission(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    const budget = mission.budget;
    const withinBudget = cartOptions.filter(
      (opt) => opt.summary.grandTotal <= budget.totalLimit
    );

    let selectedOption: CartOption;

    if (withinBudget.length > 0) {
      // Pick cheapest within budget
      selectedOption = withinBudget.sort((a, b) => a.summary.grandTotal - b.summary.grandTotal)[0];
    } else {
      // All options exceed budget - pick cheapest and create change request
      selectedOption = cartOptions.sort((a, b) => a.summary.grandTotal - b.summary.grandTotal)[0];

      const changeRequest: ShoppingChangeRequest = {
        id: uuidv4(),
        missionId,
        type: 'budget_exceeded',
        status: 'pending',
        originalValue: budget.totalLimit,
        requestedValue: selectedOption.summary.grandTotal,
        reason: `Best available option ($${selectedOption.summary.grandTotal.toFixed(2)}) exceeds budget ($${budget.totalLimit.toFixed(2)})`,
        createdAt: new Date(),
        createdBy: 'system',
        options: [
          {
            id: 'approve',
            label: `Approve $${selectedOption.summary.grandTotal.toFixed(2)}`,
            description: 'Proceed with the purchase at the higher price',
          },
          {
            id: 'modify',
            label: 'Modify cart',
            description: 'Review and adjust cart contents',
          },
          {
            id: 'cancel',
            label: 'Cancel mission',
            description: 'Abort this shopping mission',
          },
        ],
      };

      state.pendingChangeRequests.push(changeRequest);
      state.phase = 'change_request_pending';
      await this.emitEvent('change_request_created', missionId, { changeRequest });
      return;
    }

    // Create aggregated cart
    const cart = this.cartBuilder.createFromOption(selectedOption, missionId);
    state.cart = cart;

    // Validate against budget
    const budgetCheck = this.budgetManager.checkSpend(cart);
    if (!budgetCheck.allowed) {
      // Create change request
      const changeRequest: ShoppingChangeRequest = {
        id: uuidv4(),
        missionId,
        type: 'budget_exceeded',
        status: 'pending',
        originalValue: budget.totalLimit,
        requestedValue: cart.summary.grandTotal,
        reason: budgetCheck.reason || 'Budget exceeded',
        createdAt: new Date(),
        createdBy: 'system',
        recommendations: budgetCheck.recommendations,
      };

      state.pendingChangeRequests.push(changeRequest);
      state.phase = 'change_request_pending';
      await this.emitEvent('change_request_created', missionId, { changeRequest });
      return;
    }

    // Reserve budget
    this.budgetManager.reserveBudget(missionId, cart.summary.grandTotal);

    // Set up price monitoring
    if (this.config.priceMonitoringEnabled) {
      for (const item of cart.items) {
        // Create a synthetic ProductFinding from CartItem data
        const syntheticFinding: ProductFinding = {
          id: uuidv4(),
          teamId: '',
          itemId: item.itemId,
          product: {
            id: item.productId,
            name: item.productName,
            url: item.productUrl,
            image: item.productImage,
            price: item.pricePerUnit,
            retailer: item.retailer,
            availability: item.availability,
            rating: item.rating,
            reviewCount: item.reviewCount,
          },
          matchScore: 100,
          priceScore: 100,
          foundAt: new Date(),
        };

        this.priceMonitor.createWatch({
          missionId,
          item: { id: item.itemId, name: item.finding.productName, description: item.finding.productName, quantity: item.quantity, required: true },
          finding: syntheticFinding,
          alertOnDrop: true,
          alertOnIncrease: true,
          increaseThreshold: 10,
        });
      }
    }

    state.phase = 'awaiting_review';
    await this.emitEvent('cart_built', missionId, { cart });

    // Auto-approve if configured and under budget
    if (this.config.autoApproveUnderBudget && budgetCheck.allowed) {
      await this.approveCart(missionId, 'auto');
    }
  }

  /**
   * Get current workflow state
   */
  getWorkflowState(missionId: string): WorkflowState | undefined {
    return this.workflows.get(missionId);
  }

  /**
   * Get cart options for user review
   */
  async getCartOptions(missionId: string): Promise<CartOption[]> {
    const mission = await this.pmo.getMission(missionId);
    if (!mission) return [];

    // Return the PMO's aggregated cart options
    // In production, this would come from the scouting results
    return [];
  }

  /**
   * User selects a cart option
   */
  async selectCartOption(missionId: string, optionId: string): Promise<WorkflowState> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);

    const cart = await this.pmo.selectCartOption(missionId, optionId);
    state.cart = cart;
    state.phase = 'awaiting_review';

    return state;
  }

  /**
   * Resolve a change request
   */
  async resolveChangeRequest(
    missionId: string,
    changeRequestId: string,
    resolution: 'approve' | 'modify' | 'cancel',
    modifiedBudget?: number
  ): Promise<WorkflowState> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);

    const changeRequest = state.pendingChangeRequests.find(
      (cr) => cr.id === changeRequestId
    );
    if (!changeRequest) throw new Error(`Change request ${changeRequestId} not found`);

    changeRequest.status = 'approved';
    changeRequest.resolvedAt = new Date();
    changeRequest.resolvedBy = 'user';
    changeRequest.resolution = resolution;

    await this.emitEvent('change_request_resolved', missionId, {
      changeRequestId,
      resolution,
    });

    switch (resolution) {
      case 'approve':
        // User approved the higher price
        if (modifiedBudget && state.cart) {
          // Update budget constraints
          const mission = await this.pmo.getMission(missionId);
          if (mission) {
            mission.budget.totalLimit = modifiedBudget;
          }
        }
        state.phase = 'awaiting_review';
        break;

      case 'modify':
        // User wants to modify the cart
        state.phase = 'building_cart';
        break;

      case 'cancel':
        // User cancelled the mission
        state.phase = 'cancelled';
        state.status = 'cancelled';
        this.budgetManager.releaseBudget(missionId);
        await this.emitEvent('mission_cancelled', missionId);
        break;
    }

    // Remove resolved change request from pending
    state.pendingChangeRequests = state.pendingChangeRequests.filter(
      (cr) => cr.id !== changeRequestId
    );

    return state;
  }

  /**
   * Approve cart for purchase
   * This is where ACHEEVY takes over for payment
   */
  async approveCart(missionId: string, approvedBy: string): Promise<WorkflowState> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);
    if (!state.cart) throw new Error(`No cart to approve for mission ${missionId}`);

    // Final budget validation
    const budgetCheck = this.budgetManager.checkSpend(state.cart);
    if (!budgetCheck.allowed) {
      throw new Error(budgetCheck.reason || 'Budget exceeded');
    }

    // Mark cart as approved
    this.cartBuilder.markApproved(state.cart.id, approvedBy);
    state.cart.status = 'approved';
    state.cart.approvedBy = approvedBy;
    state.cart.approvedAt = new Date();

    state.phase = 'approved';
    state.status = 'approved';

    await this.emitEvent('cart_approved', missionId, {
      cartId: state.cart.id,
      approvedBy,
      total: state.cart.summary.grandTotal,
    });

    return state;
  }

  /**
   * Process payment (called by ACHEEVY)
   * Boomer_Angs NEVER call this - only ACHEEVY has payment access
   */
  async processPayment(
    missionId: string,
    paymentProcessor: (cart: AggregatedCart) => Promise<{
      success: boolean;
      orderIds: Record<string, string>;
      error?: string;
    }>
  ): Promise<WorkflowState> {
    const state = this.workflows.get(missionId);
    if (!state) throw new Error(`Workflow ${missionId} not found`);
    if (!state.cart) throw new Error(`No cart for mission ${missionId}`);
    if (state.cart.status !== 'approved') {
      throw new Error('Cart must be approved before payment');
    }

    state.phase = 'processing_payment';
    await this.emitEvent('payment_started', missionId);

    try {
      // Process payment through ACHEEVY's payment system
      const result = await paymentProcessor(state.cart);

      if (result.success) {
        // Finalize cart
        this.cartBuilder.finalize(state.cart.id, result.orderIds);
        state.cart.status = 'purchased';

        // Commit budget
        this.budgetManager.commitBudget(missionId, state.cart.summary.grandTotal);

        state.phase = 'completed';
        state.status = 'completed';

        await this.emitEvent('payment_completed', missionId, {
          orderIds: result.orderIds,
          total: state.cart.summary.grandTotal,
        });

        await this.emitEvent('mission_completed', missionId);
      } else {
        state.phase = 'failed';
        state.error = result.error || 'Payment failed';

        // Release budget reservation
        this.budgetManager.releaseBudget(missionId);

        await this.emitEvent('payment_failed', missionId, {
          error: result.error,
        });
      }
    } catch (error: any) {
      state.phase = 'failed';
      state.error = error.message;
      this.budgetManager.releaseBudget(missionId);

      await this.emitEvent('payment_failed', missionId, {
        error: error.message,
      });
    }

    return state;
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(missionId: string, reason?: string): Promise<void> {
    const state = this.workflows.get(missionId);
    if (!state) return;

    state.phase = 'cancelled';
    state.status = 'cancelled';
    state.error = reason;

    // Release any budget reservation
    this.budgetManager.releaseBudget(missionId);

    // Update mission status in PMO
    const mission = await this.pmo.getMission(missionId);
    if (mission) {
      mission.status = 'cancelled';
    }

    await this.emitEvent('mission_cancelled', missionId, { reason });
  }

  /**
   * Get workflow summary for ACHEEVY to present to user
   */
  getWorkflowSummary(missionId: string): {
    phase: WorkflowPhase;
    status: MissionStatus;
    cart?: {
      itemCount: number;
      total: number;
      retailers: string[];
    };
    pendingChangeRequests: number;
    error?: string;
  } | null {
    const state = this.workflows.get(missionId);
    if (!state) return null;

    return {
      phase: state.phase,
      status: state.status,
      cart: state.cart
        ? {
            itemCount: state.cart.items.length,
            total: state.cart.summary.grandTotal,
            retailers: state.cart.retailerBreakdown.map((r) => r.retailer),
          }
        : undefined,
      pendingChangeRequests: state.pendingChangeRequests.length,
      error: state.error,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  private async emitEvent(
    type: WorkflowEventType,
    missionId: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const event: WorkflowEvent = {
      type,
      missionId,
      timestamp: new Date(),
      data,
    };

    for (const handler of Array.from(this.eventHandlers)) {
      try {
        await handler(event);
      } catch (error) {
        console.error('[PurchaseWorkflow] Event handler error:', error);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

let defaultWorkflow: PurchaseWorkflow | null = null;

export function getPurchaseWorkflow(
  config?: Partial<WorkflowConfig>
): PurchaseWorkflow {
  if (!defaultWorkflow) {
    defaultWorkflow = new PurchaseWorkflow(config);
  }
  return defaultWorkflow;
}

export default PurchaseWorkflow;
