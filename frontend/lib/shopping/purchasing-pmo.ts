// @ts-nocheck
/**
 * Purchasing PMO - Project Management Office
 *
 * Manages shopping missions (buying) and seller operations (selling).
 * Coordinates Boomer_Ang teams, tracks progress, and handles change requests.
 *
 * This is the bridge between ACHEEVY (executive) and Boomer_Angs (workers).
 * It does NOT have payment access - that stays with ACHEEVY.
 */

import {
  ShoppingMission,
  ShoppingTeam,
  ShoppingTask,
  ShoppingItem,
  ProductFinding,
  CartOption,
  AggregatedCart,
  ShoppingChangeRequest,
  MissionProgress,
  ProgressEvent,
  SUPPORTED_RETAILERS,
} from './types';

import {
  SellerMission,
  SellerTeam,
  SellerMissionType,
  SellerTeamRole,
  Recommendation,
} from './seller-types';

// ─────────────────────────────────────────────────────────────
// PMO Configuration
// ─────────────────────────────────────────────────────────────

export interface PMOConfig {
  maxConcurrentMissions: number;
  maxTeamsPerMission: number;
  maxAgentsPerTeam: number;
  defaultSearchTimeout: number; // ms
  priceVarianceThreshold: number; // % that triggers change request
}

const DEFAULT_CONFIG: PMOConfig = {
  maxConcurrentMissions: 5,
  maxTeamsPerMission: 10,
  maxAgentsPerTeam: 5,
  defaultSearchTimeout: 300000, // 5 minutes
  priceVarianceThreshold: 10, // 10% over budget triggers change request
};

// ─────────────────────────────────────────────────────────────
// Purchasing PMO Class
// ─────────────────────────────────────────────────────────────

export class PurchasingPMO {
  private config: PMOConfig;
  private activeMissions: Map<string, ShoppingMission> = new Map();
  private activeSellerMissions: Map<string, SellerMission> = new Map();
  private eventHandlers: Map<string, ((event: PMOEvent) => void)[]> = new Map();

  constructor(config: Partial<PMOConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─────────────────────────────────────────────────────────
  // Shopping Mission Management (Buying)
  // ─────────────────────────────────────────────────────────

  /**
   * Create a new shopping mission
   * Called by ACHEEVY when user wants to buy something
   */
  async createMission(params: {
    userId: string;
    title: string;
    items: ShoppingItem[];
    budget: ShoppingMission['budget'];
    preferences: ShoppingMission['preferences'];
  }): Promise<ShoppingMission> {
    const missionId = this.generateId('mission');

    const mission: ShoppingMission = {
      id: missionId,
      userId: params.userId,
      status: 'planning',
      title: params.title,
      items: params.items,
      budget: params.budget,
      preferences: params.preferences,
      changeRequests: [],
      teams: [],
      progress: {
        phase: 'setup',
        percentComplete: 0,
        currentActivity: 'Creating shopping teams',
        teamsActive: 0,
        itemsFound: 0,
        itemsSearched: 0,
        events: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create teams for each retailer
    const retailers = this.selectRetailers(params.preferences);
    for (const retailer of retailers) {
      const team = this.createShoppingTeam(missionId, retailer);
      mission.teams.push(team);
    }

    // Add comparison team
    const compareTeam = this.createComparisonTeam(missionId);
    mission.teams.push(compareTeam);

    this.activeMissions.set(missionId, mission);
    this.emitEvent('mission_created', { missionId, itemCount: params.items.length });

    return mission;
  }

  /**
   * Start executing a shopping mission
   */
  async startMission(missionId: string): Promise<void> {
    const mission = this.activeMissions.get(missionId);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);

    mission.status = 'scouting';
    mission.startedAt = new Date();
    mission.progress.phase = 'search';
    mission.progress.currentActivity = 'Deploying shopping teams';

    this.emitEvent('mission_started', { missionId });

    // Deploy teams (in real implementation, this would dispatch to actual Boomer_Angs)
    for (const team of mission.teams) {
      await this.deployTeam(mission, team);
    }
  }

  /**
   * Process findings from a shopping team
   */
  async processFindings(
    missionId: string,
    teamId: string,
    findings: ProductFinding[]
  ): Promise<void> {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    const team = mission.teams.find((t) => t.id === teamId);
    if (!team) return;

    // Add findings to team
    team.findings.push(...findings);
    team.status = 'reporting';

    // Update progress
    mission.progress.itemsFound += findings.length;
    this.addProgressEvent(mission, 'success', `${team.name} found ${findings.length} products`);

    // Check for budget violations
    for (const finding of findings) {
      await this.checkBudgetCompliance(mission, finding);
    }

    // Check if all teams are done
    const allComplete = mission.teams.every(
      (t) => t.status === 'reporting' || t.status === 'complete'
    );

    if (allComplete) {
      await this.aggregateResults(mission);
    }

    this.emitEvent('findings_received', { missionId, teamId, count: findings.length });
  }

  /**
   * Check if a finding exceeds budget and create change request if needed
   */
  private async checkBudgetCompliance(
    mission: ShoppingMission,
    finding: ProductFinding
  ): Promise<void> {
    const item = mission.items.find((i) => i.id === finding.itemId);
    if (!item || !item.maxPricePerUnit) return;

    const overagePercent =
      ((finding.product.price - item.maxPricePerUnit) / item.maxPricePerUnit) * 100;

    if (overagePercent > this.config.priceVarianceThreshold) {
      // Create change request
      const changeRequest: ShoppingChangeRequest = {
        id: this.generateId('cr'),
        missionId: mission.id,
        type: 'budget_exceeded',
        status: 'pending',
        trigger: {
          itemId: item.id,
          reason: `Best price found ($${finding.product.price}) exceeds limit ($${item.maxPricePerUnit})`,
          originalValue: item.maxPricePerUnit,
          proposedValue: finding.product.price,
        },
        impact: {
          priceDifference: finding.product.price - item.maxPricePerUnit,
          percentChange: overagePercent,
        },
        createdAt: new Date(),
      };

      mission.changeRequests.push(changeRequest);
      this.emitEvent('change_request_created', { missionId: mission.id, changeRequest });
    }
  }

  /**
   * Aggregate results from all teams into cart options
   */
  private async aggregateResults(mission: ShoppingMission): Promise<void> {
    mission.status = 'comparing';
    mission.progress.phase = 'compare';
    mission.progress.currentActivity = 'Comparing options across retailers';

    // Collect all findings
    const allFindings: ProductFinding[] = [];
    for (const team of mission.teams) {
      allFindings.push(...team.findings);
    }

    // Group by item
    const findingsByItem = new Map<string, ProductFinding[]>();
    for (const finding of allFindings) {
      const existing = findingsByItem.get(finding.itemId) || [];
      existing.push(finding);
      findingsByItem.set(finding.itemId, existing);
    }

    // Generate cart options
    const options = this.generateCartOptions(mission, findingsByItem);
    mission.options = options;

    // Mark as awaiting approval
    mission.status = 'awaiting_approval';
    mission.progress.phase = 'review';
    mission.progress.percentComplete = 90;
    mission.progress.currentActivity = 'Cart options ready for review';

    this.emitEvent('cart_ready', { missionId: mission.id, optionCount: options.length });
  }

  /**
   * Generate different cart options (best value, budget, premium)
   */
  private generateCartOptions(
    mission: ShoppingMission,
    findingsByItem: Map<string, ProductFinding[]>
  ): CartOption[] {
    const options: CartOption[] = [];

    // Best Value option - highest match score within budget
    const bestValue = this.buildCartOption(
      'best_value',
      'Best Value',
      'Optimal balance of quality and price',
      findingsByItem,
      (findings) => findings.sort((a, b) => b.matchScore * b.priceScore - a.matchScore * a.priceScore)[0]
    );
    if (bestValue) {
      bestValue.recommended = true;
      options.push(bestValue);
    }

    // Budget option - lowest prices
    const budget = this.buildCartOption(
      'budget',
      'Budget Pick',
      'Lowest prices, meeting minimum requirements',
      findingsByItem,
      (findings) => findings.sort((a, b) => a.product.price - b.product.price)[0]
    );
    if (budget) options.push(budget);

    // Premium option - highest rated
    const premium = this.buildCartOption(
      'premium',
      'Premium',
      'Top-rated products, best quality',
      findingsByItem,
      (findings) =>
        findings.sort((a, b) => (b.product.rating || 0) - (a.product.rating || 0))[0]
    );
    if (premium) options.push(premium);

    return options;
  }

  private buildCartOption(
    id: string,
    name: string,
    description: string,
    findingsByItem: Map<string, ProductFinding[]>,
    selector: (findings: ProductFinding[]) => ProductFinding | undefined
  ): CartOption | null {
    const items: any[] = [];
    let subtotal = 0;

    for (const [_itemId, findings] of Array.from(findingsByItem.entries())) {
      const selected = selector(findings);
      if (!selected) continue;

      const cartItem = {
        id: this.generateId('ci'),
        itemId: selected.itemId,
        productId: selected.product.id,
        productName: selected.product.name,
        productUrl: selected.product.url,
        productImage: selected.product.image,
        retailer: selected.product.retailer,
        retailerProductId: selected.product.id,
        pricePerUnit: selected.product.price,
        quantity: 1, // Will be set from mission items
        totalPrice: selected.product.price,
        originalPrice: selected.product.originalPrice,
        availability: selected.product.availability as any,
        shippingCost: 0,
        shippingEstimate: '3-5 business days',
        rating: selected.product.rating,
        reviewCount: selected.product.reviewCount,
      };

      items.push(cartItem);
      subtotal += cartItem.totalPrice;
    }

    if (items.length === 0) return null;

    return {
      id,
      name,
      description,
      items,
      summary: {
        subtotal,
        shippingTotal: 0,
        taxEstimate: subtotal * 0.08, // Rough estimate
        totalSavings: 0,
        grandTotal: subtotal * 1.08,
        itemCount: items.length,
        estimatedDelivery: {
          earliest: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          latest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      savings: 0,
      recommended: false,
    };
  }

  /**
   * User selects a cart option
   */
  async selectCartOption(missionId: string, optionId: string): Promise<AggregatedCart> {
    const mission = this.activeMissions.get(missionId);
    if (!mission || !mission.options) {
      throw new Error('Mission not found or no options available');
    }

    const option = mission.options.find((o) => o.id === optionId);
    if (!option) throw new Error(`Option not found: ${optionId}`);

    // Create aggregated cart from option
    const cart: AggregatedCart = {
      id: this.generateId('cart'),
      missionId,
      items: option.items,
      summary: option.summary,
      retailerBreakdown: this.calculateRetailerBreakdown(option.items),
      status: 'draft',
    };

    mission.cart = cart;
    this.emitEvent('cart_selected', { missionId, cartId: cart.id });

    return cart;
  }

  /**
   * Approve cart for purchase (sends back to ACHEEVY for payment)
   */
  async approveCart(missionId: string, userId: string): Promise<AggregatedCart> {
    const mission = this.activeMissions.get(missionId);
    if (!mission || !mission.cart) {
      throw new Error('No cart to approve');
    }

    mission.cart.status = 'approved';
    mission.cart.approvedAt = new Date();
    mission.cart.approvedBy = userId;
    mission.status = 'purchasing';
    mission.progress.phase = 'purchase';
    mission.progress.percentComplete = 95;

    this.emitEvent('cart_approved', {
      missionId,
      cart: mission.cart,
      // ACHEEVY will handle the actual purchase
    });

    return mission.cart;
  }

  // ─────────────────────────────────────────────────────────
  // Seller Mission Management (Selling)
  // ─────────────────────────────────────────────────────────

  /**
   * Create a seller mission (e.g., market research, listing optimization)
   */
  async createSellerMission(params: {
    sellerId: string;
    type: SellerMissionType;
    title: string;
    description: string;
    scope: SellerMission['scope'];
    config?: Record<string, unknown>;
  }): Promise<SellerMission> {
    const missionId = this.generateId('seller-mission');

    const mission: SellerMission = {
      id: missionId,
      sellerId: params.sellerId,
      type: params.type,
      status: 'planning',
      title: params.title,
      description: params.description,
      scope: params.scope,
      config: params.config || {},
      teams: [],
      createdAt: new Date(),
    };

    // Create appropriate teams based on mission type
    const teams = this.createSellerTeams(missionId, params.type);
    mission.teams = teams;

    this.activeSellerMissions.set(missionId, mission);
    this.emitEvent('seller_mission_created', { missionId, type: params.type });

    return mission;
  }

  /**
   * Create teams for seller mission based on type
   */
  private createSellerTeams(missionId: string, type: SellerMissionType): SellerTeam[] {
    const teamConfigs: Partial<Record<SellerMissionType, SellerTeamRole[]>> = {
      market_research: ['researcher', 'analyst'],
      listing_optimization: ['optimizer', 'creator'],
      price_optimization: ['analyst', 'optimizer'],
      inventory_sync: ['syncer'],
      review_management: ['responder', 'analyst'],
      customer_service: ['responder'],
      expansion: ['researcher', 'optimizer'],
      competitor_analysis: ['analyst', 'researcher'],
      advertising: ['advertiser', 'analyst'],
      content_creation: ['creator'],
    };

    const roles = teamConfigs[type] || ['researcher'];

    return roles.map((role, index) => ({
      id: this.generateId('seller-team'),
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} Team`,
      missionId,
      role,
      agents: [],
      status: 'idle',
      progress: 0,
    }));
  }

  // ─────────────────────────────────────────────────────────
  // Change Request Management
  // ─────────────────────────────────────────────────────────

  /**
   * Resolve a change request
   */
  async resolveChangeRequest(
    missionId: string,
    changeRequestId: string,
    resolution: 'approved' | 'rejected',
    resolvedBy: 'user' | 'acheevy' | 'auto'
  ): Promise<void> {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    const cr = mission.changeRequests.find((c) => c.id === changeRequestId);
    if (!cr) return;

    cr.status = resolution;
    cr.resolvedAt = new Date();
    cr.resolvedBy = resolvedBy;

    this.emitEvent('change_request_resolved', { missionId, changeRequestId, resolution });
  }

  // ─────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────

  private selectRetailers(preferences: ShoppingMission['preferences']): string[] {
    let retailers = SUPPORTED_RETAILERS.filter((r) => r.enabled).map((r) => r.id);

    if (preferences.preferredRetailers?.length) {
      retailers = retailers.filter((r) => preferences.preferredRetailers!.includes(r));
    }

    if (preferences.excludedRetailers?.length) {
      retailers = retailers.filter((r) => !preferences.excludedRetailers!.includes(r));
    }

    return retailers;
  }

  private createShoppingTeam(missionId: string, retailer: string): ShoppingTeam {
    return {
      id: this.generateId('team'),
      name: `${retailer.charAt(0).toUpperCase() + retailer.slice(1)} Team`,
      missionId,
      retailer,
      status: 'idle',
      agents: [
        {
          id: this.generateId('agent'),
          angId: `scout-${retailer}`,
          role: 'scout',
          status: 'idle',
        },
        {
          id: this.generateId('agent'),
          angId: `price-${retailer}`,
          role: 'price_monitor',
          status: 'idle',
        },
      ],
      tasks: [],
      findings: [],
      progress: 0,
    };
  }

  private createComparisonTeam(missionId: string): ShoppingTeam {
    return {
      id: this.generateId('team'),
      name: 'Comparison Team',
      missionId,
      status: 'idle',
      agents: [
        {
          id: this.generateId('agent'),
          angId: 'comparator-1',
          role: 'comparator',
          status: 'idle',
        },
        {
          id: this.generateId('agent'),
          angId: 'validator-1',
          role: 'validator',
          status: 'idle',
        },
      ],
      tasks: [],
      findings: [],
      progress: 0,
    };
  }

  private async deployTeam(mission: ShoppingMission, team: ShoppingTeam): Promise<void> {
    team.status = 'searching';
    team.startedAt = new Date();
    mission.progress.teamsActive++;

    for (const agent of team.agents) {
      agent.status = 'working';
    }

    this.addProgressEvent(mission, 'info', `Deployed ${team.name}`);

    // In real implementation, this would dispatch work to actual Boomer_Angs
    // For now, we just update status
  }

  private calculateRetailerBreakdown(items: any[]): any[] {
    const byRetailer = new Map<string, { items: any[]; subtotal: number }>();

    for (const item of items) {
      const existing = byRetailer.get(item.retailer) || { items: [], subtotal: 0 };
      existing.items.push(item);
      existing.subtotal += item.totalPrice;
      byRetailer.set(item.retailer, existing);
    }

    return Array.from(byRetailer.entries()).map(([retailer, data]) => ({
      retailer,
      itemCount: data.items.length,
      subtotal: data.subtotal,
      shippingCost: 0,
      freeShippingEligible: data.subtotal > 35,
    }));
  }

  private addProgressEvent(
    mission: ShoppingMission,
    type: ProgressEvent['type'],
    message: string
  ): void {
    mission.progress.events.push({
      id: this.generateId('event'),
      timestamp: new Date(),
      type,
      message,
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ─────────────────────────────────────────────────────────
  // Event System
  // ─────────────────────────────────────────────────────────

  on(event: string, handler: (event: PMOEvent) => void): () => void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
    return () => {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    };
  }

  private emitEvent(type: string, data: Record<string, unknown>): void {
    const event: PMOEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach((h) => h(event));

    const wildcardHandlers = this.eventHandlers.get('*') || [];
    wildcardHandlers.forEach((h) => h(event));
  }

  // ─────────────────────────────────────────────────────────
  // Query Methods
  // ─────────────────────────────────────────────────────────

  getMission(missionId: string): ShoppingMission | undefined {
    return this.activeMissions.get(missionId);
  }

  getSellerMission(missionId: string): SellerMission | undefined {
    return this.activeSellerMissions.get(missionId);
  }

  getUserMissions(userId: string): ShoppingMission[] {
    return Array.from(this.activeMissions.values()).filter((m) => m.userId === userId);
  }

  getPendingChangeRequests(missionId: string): ShoppingChangeRequest[] {
    const mission = this.activeMissions.get(missionId);
    return mission?.changeRequests.filter((cr) => cr.status === 'pending') || [];
  }
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PMOEvent {
  type: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────

let pmoInstance: PurchasingPMO | null = null;

export function getPMO(): PurchasingPMO {
  if (!pmoInstance) {
    pmoInstance = new PurchasingPMO();
  }
  return pmoInstance;
}

export default PurchasingPMO;
