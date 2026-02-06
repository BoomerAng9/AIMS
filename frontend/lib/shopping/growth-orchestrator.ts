/**
 * Growth Orchestrator — Garage to Global Journey Management
 *
 * The main orchestration layer for seller growth.
 * Guides entrepreneurs through each stage of their journey
 * using Boomer_Ang intelligence and expertise.
 *
 * Journey Stages:
 * 1. Garage - Starting out, validating product-market fit
 * 2. Workshop - Established sales, ready to expand
 * 3. Warehouse - Multi-channel, scaling operations
 * 4. Enterprise - Brand building, team expansion
 * 5. Global - International expansion, exit planning
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  SellerProfile,
  SellerStage,
  SellerMission,
  SellerMissionType,
  GrowthJourney,
  GrowthMilestone,
  Recommendation,
  SellerMetrics,
  MarketplaceType,
  SellerProduct,
} from './seller-types';
import { SellerAgent, ECOMMERCE_BEST_PRACTICES } from './seller-agent';
import { MarketplaceRegistry, createMarketplaceAdapter } from './marketplace-adapters';
import { ListingOptimizer } from './listing-optimizer';
import { MarketingAutomation } from './marketing-automation';
import { SellerAnalytics } from './seller-analytics';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GrowthPlan {
  id: string;
  sellerId: string;
  currentStage: SellerStage;
  targetStage: SellerStage;
  timeline: number; // months
  milestones: PlanMilestone[];
  activeMissions: SellerMission[];
  completedMissions: SellerMission[];
  metrics: GrowthMetrics;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanMilestone {
  id: string;
  stage: SellerStage;
  name: string;
  description: string;
  requirements: MilestoneRequirement[];
  rewards: string[];
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
}

export interface MilestoneRequirement {
  id: string;
  type: 'revenue' | 'products' | 'reviews' | 'marketplaces' | 'margin' | 'custom';
  metric: string;
  target: number;
  current: number;
  unit: string;
  completed: boolean;
}

export interface GrowthMetrics {
  startingRevenue: number;
  currentRevenue: number;
  revenueGrowth: number;
  startingProducts: number;
  currentProducts: number;
  startingMarketplaces: number;
  currentMarketplaces: number;
  missionsCompleted: number;
  milestonesAchieved: number;
  daysInPlan: number;
}

export interface GrowthEvent {
  type: GrowthEventType;
  planId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export type GrowthEventType =
  | 'plan_created'
  | 'plan_updated'
  | 'stage_advanced'
  | 'milestone_completed'
  | 'mission_started'
  | 'mission_completed'
  | 'recommendation_generated'
  | 'alert_triggered';

export type GrowthEventHandler = (event: GrowthEvent) => void | Promise<void>;

export interface StageRequirements {
  stage: SellerStage;
  name: string;
  description: string;
  minRevenue: number;
  minProducts: number;
  minMarketplaces: number;
  minReviews: number;
  additionalRequirements: string[];
  typicalTimeline: string;
}

// ─────────────────────────────────────────────────────────────
// Stage Definitions
// ─────────────────────────────────────────────────────────────

export const GROWTH_STAGE_REQUIREMENTS: StageRequirements[] = [
  {
    stage: 'garage',
    name: 'Garage',
    description: 'Just starting out. Focus on product-market fit and first sales.',
    minRevenue: 0,
    minProducts: 1,
    minMarketplaces: 1,
    minReviews: 0,
    additionalRequirements: [
      'Have at least one product listed',
      'Complete basic listing optimization',
      'Set up payment processing',
    ],
    typicalTimeline: '1-3 months',
  },
  {
    stage: 'workshop',
    name: 'Workshop',
    description: 'Validated product. Time to expand and systemize.',
    minRevenue: 1000,
    minProducts: 3,
    minMarketplaces: 1,
    minReviews: 10,
    additionalRequirements: [
      'Consistent monthly sales',
      'Positive customer reviews',
      'Basic inventory system in place',
      'Understanding of unit economics',
    ],
    typicalTimeline: '3-6 months',
  },
  {
    stage: 'warehouse',
    name: 'Warehouse',
    description: 'Scaling operations. Multi-channel and team building.',
    minRevenue: 10000,
    minProducts: 10,
    minMarketplaces: 2,
    minReviews: 50,
    additionalRequirements: [
      'Profitable advertising campaigns',
      'Multi-channel presence',
      'Fulfillment solution (FBA/3PL)',
      'Basic automation in place',
    ],
    typicalTimeline: '6-12 months',
  },
  {
    stage: 'enterprise',
    name: 'Enterprise',
    description: 'Established business. Focus on brand and optimization.',
    minRevenue: 50000,
    minProducts: 20,
    minMarketplaces: 3,
    minReviews: 200,
    additionalRequirements: [
      'Brand registry on major platforms',
      'Team or VA support',
      'Sophisticated advertising strategy',
      'Strong profit margins (>20%)',
    ],
    typicalTimeline: '12-24 months',
  },
  {
    stage: 'global',
    name: 'Global',
    description: 'Market leader. International expansion and exit optionality.',
    minRevenue: 250000,
    minProducts: 50,
    minMarketplaces: 5,
    minReviews: 1000,
    additionalRequirements: [
      'International marketplace presence',
      'Established brand recognition',
      'Multiple revenue streams',
      'Exit-ready documentation',
    ],
    typicalTimeline: '24+ months',
  },
];

// ─────────────────────────────────────────────────────────────
// Growth Orchestrator Class
// ─────────────────────────────────────────────────────────────

export class GrowthOrchestrator {
  private plans: Map<string, GrowthPlan> = new Map();
  private missions: Map<string, SellerMission> = new Map();
  private eventHandlers: Set<GrowthEventHandler> = new Set();

  // Services
  private sellerAgent: SellerAgent;
  private marketplaceRegistry: MarketplaceRegistry;
  private listingOptimizer: ListingOptimizer;
  private marketingAutomation: MarketingAutomation;
  private sellerAnalytics: SellerAnalytics;

  constructor() {
    this.sellerAgent = new SellerAgent({
      agentId: 'growth-orchestrator-agent',
      expertise: ['amazon', 'shopify', 'etsy', 'kdp'],
      region: 'US',
    });
    this.marketplaceRegistry = new MarketplaceRegistry();
    this.listingOptimizer = new ListingOptimizer();
    this.marketingAutomation = new MarketingAutomation();
    this.sellerAnalytics = new SellerAnalytics();
  }

  /**
   * Subscribe to growth events
   */
  onEvent(handler: GrowthEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  // ─────────────────────────────────────────────────────────────
  // Growth Plan Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a new growth plan for a seller
   */
  async createGrowthPlan(params: {
    sellerId: string;
    profile: SellerProfile;
    targetStage?: SellerStage;
    timelineMonths?: number;
  }): Promise<GrowthPlan> {
    const { sellerId, profile, targetStage, timelineMonths } = params;

    // Determine current stage
    const currentStageAnalysis = this.sellerAnalytics.determineSellerStage(profile.metrics);
    const currentStage = currentStageAnalysis.stage;

    // Default target is next stage
    const stageOrder: SellerStage[] = ['garage', 'workshop', 'warehouse', 'enterprise', 'global'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const defaultTarget = stageOrder[Math.min(currentIndex + 1, stageOrder.length - 1)];
    const target = targetStage || defaultTarget;

    // Generate milestones
    const milestones = this.generateMilestones(currentStage, target, profile.metrics);

    const plan: GrowthPlan = {
      id: uuidv4(),
      sellerId,
      currentStage,
      targetStage: target,
      timeline: timelineMonths || this.estimateTimeline(currentStage, target),
      milestones,
      activeMissions: [],
      completedMissions: [],
      metrics: {
        startingRevenue: profile.metrics.revenue.month,
        currentRevenue: profile.metrics.revenue.month,
        revenueGrowth: 0,
        startingProducts: profile.totalProducts,
        currentProducts: profile.totalProducts,
        startingMarketplaces: profile.marketplaces.length,
        currentMarketplaces: profile.marketplaces.length,
        missionsCompleted: 0,
        milestonesAchieved: 0,
        daysInPlan: 0,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.plans.set(plan.id, plan);
    await this.emitEvent('plan_created', plan.id, { plan });

    // Generate initial missions
    await this.generateMissionsForStage(plan.id, currentStage);

    return plan;
  }

  /**
   * Get growth plan by ID
   */
  getGrowthPlan(planId: string): GrowthPlan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Update growth plan with current metrics
   */
  async updateGrowthPlan(
    planId: string,
    currentMetrics: SellerMetrics
  ): Promise<GrowthPlan> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Growth plan ${planId} not found`);

    // Update metrics
    plan.metrics.currentRevenue = currentMetrics.monthlyRevenue;
    plan.metrics.currentProducts = currentMetrics.totalProducts;
    plan.metrics.currentMarketplaces = currentMetrics.marketplaces.length;
    plan.metrics.revenueGrowth =
      ((currentMetrics.monthlyRevenue - plan.metrics.startingRevenue) /
        plan.metrics.startingRevenue) *
      100;
    plan.metrics.daysInPlan = Math.floor(
      (Date.now() - plan.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Check milestone progress
    for (const milestone of plan.milestones) {
      if (milestone.status === 'completed') continue;

      let allComplete = true;
      for (const req of milestone.requirements) {
        req.current = this.getCurrentMetricValue(req.type, currentMetrics);
        req.completed = req.current >= req.target;
        if (!req.completed) allComplete = false;
      }

      if (allComplete) {
        milestone.status = 'completed';
        milestone.completedDate = new Date();
        plan.metrics.milestonesAchieved++;
        await this.emitEvent('milestone_completed', planId, { milestone });
      } else if (milestone.status === 'pending') {
        milestone.status = 'in_progress';
      }
    }

    // Check for stage advancement
    const newStageAnalysis = this.sellerAnalytics.determineSellerStage(currentMetrics);
    if (this.isStageHigher(newStageAnalysis.stage, plan.currentStage)) {
      plan.currentStage = newStageAnalysis.stage;
      await this.emitEvent('stage_advanced', planId, { newStage: newStageAnalysis.stage });

      // Generate new missions for the new stage
      await this.generateMissionsForStage(planId, newStageAnalysis.stage);
    }

    plan.updatedAt = new Date();
    await this.emitEvent('plan_updated', planId, { metrics: plan.metrics });

    return plan;
  }

  // ─────────────────────────────────────────────────────────────
  // Mission Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Generate missions appropriate for the current stage
   */
  async generateMissionsForStage(planId: string, stage: SellerStage): Promise<SellerMission[]> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Growth plan ${planId} not found`);

    const missions: SellerMission[] = [];
    const missionTemplates = this.getMissionTemplatesForStage(stage);

    for (const template of missionTemplates) {
      const mission: SellerMission = {
        id: uuidv4(),
        sellerId: plan.sellerId,
        type: template.type,
        status: 'planning',
        title: template.title,
        description: template.description,
        scope: template.scope || {},
        config: template.config || {},
        teams: template.teams || [],
        createdAt: new Date(),
      };

      this.missions.set(mission.id, mission);
      missions.push(mission);
    }

    plan.activeMissions = [...plan.activeMissions, ...missions];
    return missions;
  }

  /**
   * Start a mission with Boomer_Ang agents
   */
  async startMission(missionId: string): Promise<SellerMission> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    mission.status = 'active';

    // Assign virtual agents based on mission type
    const agents = this.assignAgentsToMission(mission);
    mission.config = { ...mission.config, assignedAgents: agents };

    await this.emitEvent('mission_started', mission.id, { mission });

    return mission;
  }

  /**
   * Complete a mission
   */
  async completeMission(
    missionId: string,
    results: { success: boolean; deliverables: string[]; notes?: string }
  ): Promise<SellerMission> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    mission.status = results.success ? 'complete' : 'failed';
    mission.completedAt = new Date();
    mission.results = {
      summary: results.notes || `Mission ${results.success ? 'completed successfully' : 'failed'}`,
      metrics: {},
      actions: results.deliverables.map((d, i) => ({
        id: `${missionId}-action-${i}`,
        type: 'deliverable',
        description: d,
        timestamp: new Date(),
        success: results.success,
      })),
      insights: [],
    };

    // Update plan
    for (const plan of Array.from(this.plans.values())) {
      const index = plan.activeMissions.findIndex((m) => m.id === missionId);
      if (index !== -1) {
        plan.activeMissions.splice(index, 1);
        plan.completedMissions.push(mission);
        plan.metrics.missionsCompleted++;
        break;
      }
    }

    await this.emitEvent('mission_completed', missionId, { mission, results });

    return mission;
  }

  // ─────────────────────────────────────────────────────────────
  // Recommendations & Guidance
  // ─────────────────────────────────────────────────────────────

  /**
   * Get personalized recommendations for a seller
   */
  getRecommendations(
    profile: SellerProfile,
    options?: { limit?: number; focus?: string }
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Stage-specific recommendations from SellerAgent
    const stageRecs = this.sellerAgent.getStageRecommendations(profile.stage);
    recommendations.push(...stageRecs);

    // Product-specific recommendations would require product data
    // For now, generate general recommendations based on product count
    if (profile.totalProducts > 0) {
      // Add general product improvement recommendations
      recommendations.push({
        id: `product-improve-${Date.now()}`,
        type: 'listing',
        priority: 'medium',
        title: 'Optimize Product Listings',
        description: `Review and optimize your ${profile.totalProducts} products for better visibility`,
        impact: { metric: 'conversion_rate', estimated: 0.1, confidence: 0.7 },
        actions: ['Review product titles', 'Improve descriptions', 'Optimize images'],
      });
    }

    // Marketplace expansion recommendations
    if (profile.metrics.marketplaces.length < 3 && profile.stage !== 'garage') {
      recommendations.push(this.getMarketplaceExpansionRec(profile));
    }

    // Sort by priority and limit
    const sorted = recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    return sorted.slice(0, options?.limit || 10);
  }

  /**
   * Get a detailed growth roadmap
   */
  getGrowthRoadmap(
    currentStage: SellerStage,
    targetStage: SellerStage
  ): {
    stages: StageRequirements[];
    totalEstimatedTime: string;
    keyMilestones: string[];
    criticalSuccessFactors: string[];
  } {
    const stageOrder: SellerStage[] = ['garage', 'workshop', 'warehouse', 'enterprise', 'global'];
    const startIndex = stageOrder.indexOf(currentStage);
    const endIndex = stageOrder.indexOf(targetStage);

    const relevantStages = GROWTH_STAGE_REQUIREMENTS.slice(startIndex, endIndex + 1);

    const keyMilestones: string[] = [];
    for (const stage of relevantStages) {
      keyMilestones.push(
        `Reach $${stage.minRevenue.toLocaleString()}/month revenue`,
        `Expand to ${stage.minProducts}+ products`,
        `Achieve ${stage.minReviews}+ reviews`
      );
    }

    return {
      stages: relevantStages,
      totalEstimatedTime: this.calculateTotalTimeline(relevantStages),
      keyMilestones: Array.from(new Set(keyMilestones)),
      criticalSuccessFactors: [
        'Consistent product quality and customer satisfaction',
        'Profitable unit economics from day one',
        'Systematic approach to listing optimization',
        'Data-driven advertising decisions',
        'Strong cash flow management',
        'Continuous learning and adaptation',
      ],
    };
  }

  /**
   * Get next actions for a seller
   */
  getNextActions(plan: GrowthPlan): {
    immediate: string[];
    thisWeek: string[];
    thisMonth: string[];
  } {
    const immediate: string[] = [];
    const thisWeek: string[] = [];
    const thisMonth: string[] = [];

    // From active missions
    for (const mission of plan.activeMissions.slice(0, 3)) {
      if (mission.status === 'planning') {
        immediate.push(`Start mission: ${mission.title}`);
      } else if (mission.status === 'active') {
        // Mission is in progress
        thisWeek.push(`Continue working on: ${mission.title}`);
      }
    }

    // From milestone requirements
    const currentMilestone = plan.milestones.find(
      (m) => m.status === 'in_progress' || m.status === 'pending'
    );
    if (currentMilestone) {
      for (const req of currentMilestone.requirements) {
        if (!req.completed) {
          const gap = req.target - req.current;
          thisMonth.push(`Increase ${req.metric} by ${gap} ${req.unit}`);
        }
      }
    }

    // Stage-specific actions
    const stageActions = this.getStageSpecificActions(plan.currentStage);
    thisWeek.push(...stageActions.slice(0, 2));

    return {
      immediate: immediate.slice(0, 3),
      thisWeek: thisWeek.slice(0, 5),
      thisMonth: thisMonth.slice(0, 5),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────

  private generateMilestones(
    currentStage: SellerStage,
    targetStage: SellerStage,
    currentMetrics: SellerMetrics
  ): PlanMilestone[] {
    const milestones: PlanMilestone[] = [];
    const stageOrder: SellerStage[] = ['garage', 'workshop', 'warehouse', 'enterprise', 'global'];

    const startIndex = stageOrder.indexOf(currentStage);
    const endIndex = stageOrder.indexOf(targetStage);

    for (let i = startIndex + 1; i <= endIndex; i++) {
      const stageReqs = GROWTH_STAGE_REQUIREMENTS[i];
      const prevReqs = GROWTH_STAGE_REQUIREMENTS[i - 1];

      const milestone: PlanMilestone = {
        id: uuidv4(),
        stage: stageReqs.stage,
        name: `Advance to ${stageReqs.name}`,
        description: stageReqs.description,
        requirements: [
          {
            id: uuidv4(),
            type: 'revenue',
            metric: 'Monthly Revenue',
            target: stageReqs.minRevenue,
            current: currentMetrics.monthlyRevenue,
            unit: 'USD',
            completed: currentMetrics.monthlyRevenue >= stageReqs.minRevenue,
          },
          {
            id: uuidv4(),
            type: 'products',
            metric: 'Active Products',
            target: stageReqs.minProducts,
            current: currentMetrics.totalProducts,
            unit: 'products',
            completed: currentMetrics.totalProducts >= stageReqs.minProducts,
          },
          {
            id: uuidv4(),
            type: 'marketplaces',
            metric: 'Active Marketplaces',
            target: stageReqs.minMarketplaces,
            current: currentMetrics.marketplaces.length,
            unit: 'marketplaces',
            completed: currentMetrics.marketplaces.length >= stageReqs.minMarketplaces,
          },
          {
            id: uuidv4(),
            type: 'reviews',
            metric: 'Total Reviews',
            target: stageReqs.minReviews,
            current: 0, // Reviews not tracked in SellerMetrics
            unit: 'reviews',
            completed: false,
          },
        ],
        rewards: [
          `Unlock ${stageReqs.name} stage features`,
          `Access to ${stageReqs.name}-level strategies`,
          'New mission types available',
        ],
        targetDate: new Date(
          Date.now() + (i - startIndex) * 90 * 24 * 60 * 60 * 1000
        ), // ~90 days per stage
        status: 'pending',
      };

      milestones.push(milestone);
    }

    return milestones;
  }

  private getMissionTemplatesForStage(
    stage: SellerStage
  ): any[] {
    const templates: Record<
      SellerStage,
      any[]
    > = {
      garage: [
        {
          type: 'listing_optimization',
          status: 'planning',
          priority: 'high',
          title: 'Optimize First Product Listing',
          description: 'Ensure your first product listing follows marketplace best practices',
          objectives: [
            { id: '1', description: 'Audit current listing quality', completed: false },
            { id: '2', description: 'Optimize title with keywords', completed: false },
            { id: '3', description: 'Improve product images', completed: false },
            { id: '4', description: 'Write compelling description', completed: false },
          ],
          deliverables: ['Optimized listing', 'Keyword list', 'Image recommendations'],
          estimatedHours: 4,
        },
        {
          type: 'market_research',
          status: 'planning',
          priority: 'high',
          title: 'Competitive Analysis',
          description: 'Research top competitors and identify opportunities',
          objectives: [
            { id: '1', description: 'Identify top 5 competitors', completed: false },
            { id: '2', description: 'Analyze pricing strategies', completed: false },
            { id: '3', description: 'Review competitor listings', completed: false },
          ],
          deliverables: ['Competitor analysis report', 'Pricing recommendations'],
          estimatedHours: 6,
        },
      ],
      workshop: [
        {
          type: 'product_expansion',
          status: 'planning',
          priority: 'high',
          title: 'Product Line Expansion',
          description: 'Identify and launch complementary products',
          objectives: [
            { id: '1', description: 'Research product opportunities', completed: false },
            { id: '2', description: 'Validate demand', completed: false },
            { id: '3', description: 'Source new products', completed: false },
            { id: '4', description: 'Create listings', completed: false },
          ],
          deliverables: ['Product research report', 'New product listings'],
          estimatedHours: 20,
        },
        {
          type: 'advertising_setup',
          status: 'planning',
          priority: 'high',
          title: 'Launch PPC Campaigns',
          description: 'Set up and optimize advertising campaigns',
          objectives: [
            { id: '1', description: 'Research keywords', completed: false },
            { id: '2', description: 'Create campaign structure', completed: false },
            { id: '3', description: 'Set up targeting', completed: false },
            { id: '4', description: 'Monitor and optimize', completed: false },
          ],
          deliverables: ['Campaign structure', 'Keyword list', 'Performance baseline'],
          estimatedHours: 10,
        },
      ],
      warehouse: [
        {
          type: 'channel_expansion',
          status: 'planning',
          priority: 'high',
          title: 'Multi-Channel Expansion',
          description: 'Expand to additional sales channels',
          objectives: [
            { id: '1', description: 'Evaluate new marketplace fit', completed: false },
            { id: '2', description: 'Set up new accounts', completed: false },
            { id: '3', description: 'Adapt listings for new platforms', completed: false },
            { id: '4', description: 'Sync inventory', completed: false },
          ],
          deliverables: ['New marketplace accounts', 'Synced inventory system'],
          estimatedHours: 30,
        },
        {
          type: 'operations_optimization',
          status: 'planning',
          priority: 'medium',
          title: 'Streamline Operations',
          description: 'Implement systems for scalable operations',
          objectives: [
            { id: '1', description: 'Document current processes', completed: false },
            { id: '2', description: 'Identify bottlenecks', completed: false },
            { id: '3', description: 'Implement automation', completed: false },
            { id: '4', description: 'Create SOPs', completed: false },
          ],
          deliverables: ['Process documentation', 'Automation setup', 'SOP library'],
          estimatedHours: 40,
        },
      ],
      enterprise: [
        {
          type: 'brand_building',
          status: 'planning',
          priority: 'high',
          title: 'Brand Development',
          description: 'Build brand equity and recognition',
          objectives: [
            { id: '1', description: 'Define brand identity', completed: false },
            { id: '2', description: 'Register trademarks', completed: false },
            { id: '3', description: 'Create brand assets', completed: false },
            { id: '4', description: 'Implement A+ content', completed: false },
          ],
          deliverables: ['Brand guidelines', 'Trademark registrations', 'A+ content'],
          estimatedHours: 50,
        },
        {
          type: 'team_building',
          status: 'planning',
          priority: 'medium',
          title: 'Team Expansion',
          description: 'Build team to support growth',
          objectives: [
            { id: '1', description: 'Define role requirements', completed: false },
            { id: '2', description: 'Recruit team members', completed: false },
            { id: '3', description: 'Create training materials', completed: false },
            { id: '4', description: 'Set up workflows', completed: false },
          ],
          deliverables: ['Job descriptions', 'Training docs', 'Team workflows'],
          estimatedHours: 60,
        },
      ],
      global: [
        {
          type: 'international_expansion',
          status: 'planning',
          priority: 'high',
          title: 'International Expansion',
          description: 'Launch in international markets',
          objectives: [
            { id: '1', description: 'Research target markets', completed: false },
            { id: '2', description: 'Set up international accounts', completed: false },
            { id: '3', description: 'Localize listings', completed: false },
            { id: '4', description: 'Set up fulfillment', completed: false },
          ],
          deliverables: ['Market research', 'Localized listings', 'Fulfillment setup'],
          estimatedHours: 100,
        },
        {
          type: 'exit_preparation',
          status: 'planning',
          priority: 'medium',
          title: 'Exit Preparation',
          description: 'Prepare business for potential acquisition',
          objectives: [
            { id: '1', description: 'Clean up financials', completed: false },
            { id: '2', description: 'Document all processes', completed: false },
            { id: '3', description: 'Reduce owner dependency', completed: false },
            { id: '4', description: 'Get business valued', completed: false },
          ],
          deliverables: ['Financial documentation', 'Complete SOP library', 'Valuation report'],
          estimatedHours: 80,
        },
      ],
    };

    return templates[stage] || [];
  }

  private assignAgentsToMission(mission: SellerMission): string[] {
    // Assign virtual Boomer_Ang agents based on mission type
    const agentsByType: Record<SellerMissionType, string[]> = {
      market_research: ['research-agent-001', 'data-agent-001'],
      listing_optimization: ['seo-agent-001', 'content-agent-001'],
      price_optimization: ['pricing-agent-001', 'analytics-agent-001'],
      inventory_sync: ['sync-agent-001', 'inventory-agent-001'],
      inventory_management: ['inventory-agent-001'],
      review_management: ['review-agent-001', 'customer-agent-001'],
      customer_service: ['support-agent-001', 'response-agent-001'],
      expansion: ['growth-agent-001', 'marketplace-agent-001'],
      marketplace_expansion: ['marketplace-agent-001', 'integration-agent-001'],
      competitor_analysis: ['research-agent-001', 'analytics-agent-001'],
      advertising: ['ppc-agent-001', 'marketing-agent-001'],
      advertising_setup: ['ppc-agent-001', 'analytics-agent-001'],
      advertising_optimization: ['ppc-agent-001', 'optimization-agent-001'],
      product_expansion: ['research-agent-001', 'sourcing-agent-001'],
      content_creation: ['content-agent-001', 'creative-agent-001'],
      brand_building: ['brand-agent-001', 'content-agent-001'],
      analytics_setup: ['analytics-agent-001', 'data-agent-001'],
      channel_expansion: ['marketplace-agent-001', 'integration-agent-001'],
      customer_acquisition: ['marketing-agent-001', 'ads-agent-001'],
      operations_optimization: ['ops-agent-001', 'automation-agent-001'],
      international_expansion: ['intl-agent-001', 'localization-agent-001'],
      team_building: ['hr-agent-001'],
      exit_preparation: ['finance-agent-001', 'documentation-agent-001'],
    };

    return agentsByType[mission.type] || ['general-agent-001'];
  }

  private getCurrentMetricValue(
    type: MilestoneRequirement['type'],
    metrics: SellerMetrics
  ): number {
    switch (type) {
      case 'revenue':
        return metrics.monthlyRevenue;
      case 'products':
        return metrics.totalProducts;
      case 'marketplaces':
        return metrics.marketplaces.length;
      case 'reviews':
        return metrics.totalReviews || 0;
      case 'margin':
        return metrics.profitMargin || 0;
      default:
        return 0;
    }
  }

  private isStageHigher(newStage: SellerStage, currentStage: SellerStage): boolean {
    const order: SellerStage[] = ['garage', 'workshop', 'warehouse', 'enterprise', 'global'];
    return order.indexOf(newStage) > order.indexOf(currentStage);
  }

  private estimateTimeline(from: SellerStage, to: SellerStage): number {
    const stageMonths: Record<SellerStage, number> = {
      garage: 2,
      workshop: 4,
      warehouse: 8,
      enterprise: 12,
      global: 0,
    };

    const order: SellerStage[] = ['garage', 'workshop', 'warehouse', 'enterprise', 'global'];
    const startIndex = order.indexOf(from);
    const endIndex = order.indexOf(to);

    let total = 0;
    for (let i = startIndex; i < endIndex; i++) {
      total += stageMonths[order[i]];
    }

    return total;
  }

  private calculateTotalTimeline(stages: StageRequirements[]): string {
    const totalMonths = stages.reduce((sum, stage) => {
      const timeline = stage.typicalTimeline;
      const match = timeline.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 6);
    }, 0);

    if (totalMonths < 12) return `${totalMonths} months`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return months > 0 ? `${years} year${years > 1 ? 's' : ''}, ${months} months` : `${years} year${years > 1 ? 's' : ''}`;
  }

  private getProductRecommendations(
    product: SellerProduct,
    stage: SellerStage
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Image recommendations
    if (product.images.length < 5) {
      recommendations.push({
        id: uuidv4(),
        type: 'listing',
        priority: 'high',
        title: `Add More Images: ${product.title}`,
        description: `Product has only ${product.images.length} images. 5-7 images significantly increase conversion.`,
        impact: {
          metric: 'conversion',
          estimated: 20,
          confidence: 0.75,
        },
        actions: [
          'Add lifestyle/in-use images',
          'Add infographic with features',
          'Add scale/size reference image',
        ],
      });
    }

    return recommendations;
  }

  private getMarketplaceExpansionRec(profile: SellerProfile): Recommendation {
    const currentMarketplaces = profile.metrics.marketplaces;
    const allMarketplaces: MarketplaceType[] = ['amazon', 'shopify', 'etsy', 'ebay', 'walmart'];
    const newMarketplaces = allMarketplaces.filter((m) => !currentMarketplaces.includes(m));

    return {
      id: uuidv4(),
      type: 'expansion',
      priority: 'medium',
      title: 'Expand to New Marketplaces',
      description: `Currently on ${currentMarketplaces.length} marketplace(s). Consider expanding to diversify revenue.`,
      impact: {
        metric: 'revenue',
        estimated: 40,
        confidence: 0.6,
      },
      actions: [
        `Evaluate ${newMarketplaces[0]} for your product category`,
        'Research marketplace-specific requirements',
        'Adapt listings for new platform',
      ],
    };
  }

  private getStageSpecificActions(stage: SellerStage): string[] {
    const actions: Record<SellerStage, string[]> = {
      garage: [
        'Respond to all customer messages within 24 hours',
        'Review listing analytics and optimize',
        'Request reviews from satisfied customers',
      ],
      workshop: [
        'Analyze PPC search term reports',
        'Test new product variations',
        'Set up email capture on your store',
      ],
      warehouse: [
        'Review and optimize inventory levels',
        'Negotiate better supplier terms',
        'Document key business processes',
      ],
      enterprise: [
        'Review brand registry opportunities',
        'Evaluate team performance and needs',
        'Analyze profit margins by channel',
      ],
      global: [
        'Monitor international market performance',
        'Review cross-border logistics efficiency',
        'Evaluate acquisition opportunities',
      ],
    };

    return actions[stage] || [];
  }

  private async emitEvent(
    type: GrowthEventType,
    planId: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const event: GrowthEvent = {
      type,
      planId,
      timestamp: new Date(),
      data,
    };

    for (const handler of Array.from(this.eventHandlers)) {
      try {
        await handler(event);
      } catch (error) {
        console.error('[GrowthOrchestrator] Event handler error:', error);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

let defaultOrchestrator: GrowthOrchestrator | null = null;

export function getGrowthOrchestrator(): GrowthOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new GrowthOrchestrator();
  }
  return defaultOrchestrator;
}

export default GrowthOrchestrator;
