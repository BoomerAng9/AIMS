/**
 * LUC Industry Presets — Ready-to-Use Calculator Configurations
 *
 * Pre-configured calculators for different industries.
 * Users can select a preset and immediately start tracking usage.
 */

import { LUCServiceKey, QuotaRecord, LUCAccountRecord, LUC_PLANS } from './luc-engine';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface IndustryPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PresetCategory;
  services: PresetService[];
  recommendedPlan: string;
  useCases: string[];
}

export interface PresetService {
  key: string;
  name: string;
  unit: string;
  overageRate: number;
  description: string;
  defaultQuota: number;
}

export type PresetCategory =
  | 'technology'
  | 'content'
  | 'ecommerce'
  | 'professional'
  | 'creative'
  | 'custom';

// ─────────────────────────────────────────────────────────────
// Industry Presets
// ─────────────────────────────────────────────────────────────

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  // ─────────────────────────────────────────────────────
  // SaaS / Technology
  // ─────────────────────────────────────────────────────
  {
    id: 'saas',
    name: 'SaaS Platform',
    description: 'Track API calls, storage, compute, and user sessions for your SaaS application.',
    icon: '💻',
    category: 'technology',
    services: [
      { key: 'api_calls', name: 'API Calls', unit: 'call', overageRate: 0.0001, description: 'REST/GraphQL API requests', defaultQuota: 100000 },
      { key: 'storage_gb', name: 'Storage', unit: 'GB', overageRate: 0.05, description: 'User data and files', defaultQuota: 50 },
      { key: 'compute_minutes', name: 'Compute', unit: 'minute', overageRate: 0.001, description: 'Server processing time', defaultQuota: 10000 },
      { key: 'active_users', name: 'Active Users', unit: 'user', overageRate: 0.10, description: 'Monthly active users', defaultQuota: 1000 },
      { key: 'webhooks', name: 'Webhooks', unit: 'delivery', overageRate: 0.0005, description: 'Webhook deliveries', defaultQuota: 50000 },
      { key: 'email_sends', name: 'Emails', unit: 'email', overageRate: 0.001, description: 'Transactional emails', defaultQuota: 10000 },
    ],
    recommendedPlan: 'pro',
    useCases: ['B2B SaaS', 'Developer tools', 'Internal platforms', 'API services'],
  },

  // ─────────────────────────────────────────────────────
  // AI / Machine Learning
  // ─────────────────────────────────────────────────────
  {
    id: 'ai_platform',
    name: 'AI Platform',
    description: 'Track AI model usage, tokens, embeddings, and GPU compute for AI applications.',
    icon: '🤖',
    category: 'technology',
    services: [
      { key: 'ai_tokens', name: 'AI Tokens', unit: 'K tokens', overageRate: 0.002, description: 'LLM input/output tokens', defaultQuota: 10000 },
      { key: 'embeddings', name: 'Embeddings', unit: 'K tokens', overageRate: 0.0001, description: 'Vector embeddings', defaultQuota: 50000 },
      { key: 'image_generations', name: 'Image Generation', unit: 'image', overageRate: 0.02, description: 'AI image generation', defaultQuota: 500 },
      { key: 'vision_analyses', name: 'Vision Analysis', unit: 'image', overageRate: 0.01, description: 'Image analysis/OCR', defaultQuota: 1000 },
      { key: 'tts_characters', name: 'Text-to-Speech', unit: 'K chars', overageRate: 0.015, description: 'TTS character count', defaultQuota: 500 },
      { key: 'gpu_hours', name: 'GPU Compute', unit: 'hour', overageRate: 0.50, description: 'GPU processing time', defaultQuota: 100 },
    ],
    recommendedPlan: 'enterprise',
    useCases: ['AI chatbots', 'Content generation', 'Image processing', 'Voice applications'],
  },

  // ─────────────────────────────────────────────────────
  // E-Commerce
  // ─────────────────────────────────────────────────────
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Track orders, products, bandwidth, and customer interactions for online stores.',
    icon: '🛒',
    category: 'ecommerce',
    services: [
      { key: 'orders', name: 'Orders', unit: 'order', overageRate: 0.05, description: 'Processed orders', defaultQuota: 1000 },
      { key: 'products', name: 'Products', unit: 'SKU', overageRate: 0.01, description: 'Active product listings', defaultQuota: 500 },
      { key: 'bandwidth_gb', name: 'Bandwidth', unit: 'GB', overageRate: 0.08, description: 'Data transfer', defaultQuota: 100 },
      { key: 'image_storage', name: 'Image Storage', unit: 'GB', overageRate: 0.05, description: 'Product images', defaultQuota: 20 },
      { key: 'api_calls', name: 'API Calls', unit: 'call', overageRate: 0.0001, description: 'Storefront API calls', defaultQuota: 50000 },
      { key: 'email_sends', name: 'Emails', unit: 'email', overageRate: 0.001, description: 'Order notifications', defaultQuota: 5000 },
    ],
    recommendedPlan: 'coffee',
    useCases: ['Shopify stores', 'WooCommerce', 'Custom e-commerce', 'Marketplaces'],
  },

  // ─────────────────────────────────────────────────────
  // Content Creation
  // ─────────────────────────────────────────────────────
  {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Track video storage, transcoding, streaming, and audience engagement.',
    icon: '🎬',
    category: 'content',
    services: [
      { key: 'video_storage', name: 'Video Storage', unit: 'GB', overageRate: 0.02, description: 'Raw and processed video', defaultQuota: 100 },
      { key: 'transcoding_minutes', name: 'Transcoding', unit: 'minute', overageRate: 0.02, description: 'Video processing', defaultQuota: 500 },
      { key: 'streaming_hours', name: 'Streaming', unit: 'hour', overageRate: 0.05, description: 'Live streaming time', defaultQuota: 50 },
      { key: 'bandwidth_gb', name: 'Bandwidth', unit: 'GB', overageRate: 0.08, description: 'Content delivery', defaultQuota: 500 },
      { key: 'ai_captions', name: 'Auto Captions', unit: 'minute', overageRate: 0.01, description: 'AI-generated captions', defaultQuota: 300 },
      { key: 'thumbnails', name: 'Thumbnails', unit: 'image', overageRate: 0.005, description: 'Generated thumbnails', defaultQuota: 500 },
    ],
    recommendedPlan: 'pro',
    useCases: ['YouTubers', 'Course creators', 'Podcasters', 'Streamers'],
  },

  // ─────────────────────────────────────────────────────
  // Real Estate
  // ─────────────────────────────────────────────────────
  {
    id: 'real_estate',
    name: 'Real Estate',
    description: 'Track listings, virtual tours, lead management, and property analytics.',
    icon: '🏠',
    category: 'professional',
    services: [
      { key: 'listings', name: 'Active Listings', unit: 'listing', overageRate: 1.00, description: 'Property listings', defaultQuota: 50 },
      { key: 'virtual_tours', name: 'Virtual Tours', unit: 'tour', overageRate: 5.00, description: '3D property tours', defaultQuota: 20 },
      { key: 'lead_contacts', name: 'Lead Contacts', unit: 'contact', overageRate: 0.10, description: 'CRM contacts', defaultQuota: 500 },
      { key: 'image_storage', name: 'Image Storage', unit: 'GB', overageRate: 0.05, description: 'Property photos', defaultQuota: 50 },
      { key: 'email_campaigns', name: 'Email Campaigns', unit: 'campaign', overageRate: 2.00, description: 'Marketing campaigns', defaultQuota: 10 },
      { key: 'market_reports', name: 'Market Reports', unit: 'report', overageRate: 0.50, description: 'CMA reports', defaultQuota: 20 },
    ],
    recommendedPlan: 'coffee',
    useCases: ['Agents', 'Brokerages', 'Property managers', 'Real estate tech'],
  },

  // ─────────────────────────────────────────────────────
  // Publishing / KDP
  // ─────────────────────────────────────────────────────
  {
    id: 'publishing',
    name: 'Publishing / KDP',
    description: 'Track book production, marketing campaigns, and royalty calculations.',
    icon: '📚',
    category: 'content',
    services: [
      { key: 'books', name: 'Published Books', unit: 'book', overageRate: 2.00, description: 'Active titles', defaultQuota: 20 },
      { key: 'page_count', name: 'Page Count', unit: 'K pages', overageRate: 0.10, description: 'Total published pages', defaultQuota: 50 },
      { key: 'cover_designs', name: 'Cover Designs', unit: 'design', overageRate: 5.00, description: 'Cover generations', defaultQuota: 10 },
      { key: 'keyword_research', name: 'Keyword Research', unit: 'search', overageRate: 0.05, description: 'Category/keyword analysis', defaultQuota: 100 },
      { key: 'ad_campaigns', name: 'Ad Campaigns', unit: 'campaign', overageRate: 1.00, description: 'Amazon Ads campaigns', defaultQuota: 20 },
      { key: 'royalty_calcs', name: 'Royalty Calculations', unit: 'calc', overageRate: 0.01, description: 'Royalty projections', defaultQuota: 500 },
    ],
    recommendedPlan: 'coffee',
    useCases: ['Self-publishers', 'KDP authors', 'Publishing houses', 'Ghostwriters'],
  },

  // ─────────────────────────────────────────────────────
  // Agency
  // ─────────────────────────────────────────────────────
  {
    id: 'agency',
    name: 'Marketing Agency',
    description: 'Track client projects, campaigns, content generation, and reporting.',
    icon: '🎯',
    category: 'professional',
    services: [
      { key: 'active_clients', name: 'Active Clients', unit: 'client', overageRate: 10.00, description: 'Client accounts', defaultQuota: 20 },
      { key: 'campaigns', name: 'Campaigns', unit: 'campaign', overageRate: 2.00, description: 'Marketing campaigns', defaultQuota: 50 },
      { key: 'content_pieces', name: 'Content Pieces', unit: 'piece', overageRate: 0.50, description: 'Blog posts, social, etc.', defaultQuota: 200 },
      { key: 'report_generations', name: 'Reports', unit: 'report', overageRate: 1.00, description: 'Analytics reports', defaultQuota: 100 },
      { key: 'social_posts', name: 'Social Posts', unit: 'post', overageRate: 0.10, description: 'Scheduled posts', defaultQuota: 500 },
      { key: 'team_seats', name: 'Team Seats', unit: 'seat', overageRate: 15.00, description: 'Team members', defaultQuota: 5 },
    ],
    recommendedPlan: 'pro',
    useCases: ['Digital agencies', 'Social media managers', 'PR firms', 'Consultants'],
  },

  // ─────────────────────────────────────────────────────
  // Freelancer
  // ─────────────────────────────────────────────────────
  {
    id: 'freelancer',
    name: 'Freelancer',
    description: 'Track projects, client hours, deliverables, and invoicing.',
    icon: '💼',
    category: 'professional',
    services: [
      { key: 'active_projects', name: 'Active Projects', unit: 'project', overageRate: 5.00, description: 'Current projects', defaultQuota: 10 },
      { key: 'billable_hours', name: 'Billable Hours', unit: 'hour', overageRate: 0, description: 'Tracked time', defaultQuota: 160 },
      { key: 'deliverables', name: 'Deliverables', unit: 'item', overageRate: 1.00, description: 'Completed work', defaultQuota: 50 },
      { key: 'client_revisions', name: 'Revisions', unit: 'revision', overageRate: 0.50, description: 'Revision rounds', defaultQuota: 30 },
      { key: 'invoices', name: 'Invoices', unit: 'invoice', overageRate: 0.25, description: 'Generated invoices', defaultQuota: 20 },
      { key: 'storage_gb', name: 'Storage', unit: 'GB', overageRate: 0.05, description: 'Project files', defaultQuota: 10 },
    ],
    recommendedPlan: 'p2p',
    useCases: ['Web developers', 'Designers', 'Writers', 'Consultants'],
  },
];

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

/**
 * Get preset by ID
 */
export function getPreset(presetId: string): IndustryPreset | undefined {
  return INDUSTRY_PRESETS.find((p) => p.id === presetId);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: PresetCategory): IndustryPreset[] {
  return INDUSTRY_PRESETS.filter((p) => p.category === category);
}

/**
 * Create LUC account from preset
 */
export function createAccountFromPreset(
  userId: string,
  presetId: string,
  planId: string = 'p2p'
): LUCAccountRecord {
  const preset = getPreset(presetId);
  const plan = LUC_PLANS[planId] || LUC_PLANS.p2p;

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Build quotas from preset services
  const quotas: Record<string, QuotaRecord> = {};

  if (preset) {
    for (const service of preset.services) {
      quotas[service.key] = {
        limit: service.defaultQuota,
        used: 0,
        overage: 0,
        lastUpdated: now,
      };
    }
  } else {
    // Fall back to default LUC services if preset not found
    for (const [key, limit] of Object.entries(plan.quotas)) {
      quotas[key] = {
        limit,
        used: 0,
        overage: 0,
        lastUpdated: now,
      };
    }
  }

  return {
    userId,
    planId,
    planName: plan.name,
    quotas: quotas as Record<LUCServiceKey, QuotaRecord>,
    totalOverageCost: 0,
    billingCycleStart: now,
    billingCycleEnd: nextMonth,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get service config from preset
 */
export function getPresetServiceConfig(
  presetId: string
): Record<string, { name: string; unit: string; overageRate: number; description: string }> {
  const preset = getPreset(presetId);
  if (!preset) return {};

  const config: Record<string, { name: string; unit: string; overageRate: number; description: string }> = {};

  for (const service of preset.services) {
    config[service.key] = {
      name: service.name,
      unit: service.unit,
      overageRate: service.overageRate,
      description: service.description,
    };
  }

  return config;
}

export default INDUSTRY_PRESETS;
