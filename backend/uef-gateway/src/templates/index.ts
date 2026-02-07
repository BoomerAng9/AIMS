/**
 * Template Library — Pre-Built Application Archetypes for A.I.M.S.
 *
 * Each PlugTemplate defines a full application blueprint that users can
 * select when starting a new project. Templates cover common archetypes
 * from simple portfolios to complex marketplaces.
 *
 * Picker_Ang references these templates during intake to recommend the
 * best starting point. The Scaffolder consumes a template's spec to
 * generate the actual file manifest.
 *
 * — by: ACHIEVEMOR
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlugTemplate {
  id: string;
  name: string;
  archetype: string;
  complexity: 'simple' | 'intermediate' | 'complex';
  description: string;
  features: string[];
  techStack: { frontend: string; backend: string; database: string };
  pages: string[];
  apiRoutes: string[];
  dbModels: string[];
  suggestedIntegrations: string[];
  estimatedFiles: number;
  estimatedBuildTime: string;
}

// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------

const PORTFOLIO: PlugTemplate = {
  id: 'portfolio',
  name: 'Portfolio',
  archetype: 'portfolio',
  complexity: 'simple',
  description:
    'Personal or business portfolio site with project showcase, about section, and contact form. Ideal for freelancers, agencies, and creatives.',
  features: [
    'responsive-design',
    'project-gallery',
    'contact-form',
    'seo-optimized',
    'dark-mode',
    'animations',
  ],
  techStack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Next.js API Routes',
    database: 'SQLite',
  },
  pages: ['home', 'about', 'projects', 'contact'],
  apiRoutes: ['/api/contact', '/api/projects'],
  dbModels: ['Project', 'ContactSubmission'],
  suggestedIntegrations: ['sendgrid', 'google-analytics', 'cloudinary'],
  estimatedFiles: 15,
  estimatedBuildTime: '30 min',
};

const SAAS: PlugTemplate = {
  id: 'saas',
  name: 'SaaS Application',
  archetype: 'saas',
  complexity: 'intermediate',
  description:
    'Full-featured SaaS application with user authentication, subscription billing, analytics dashboard, and admin panel. Production-ready architecture.',
  features: [
    'authentication',
    'subscription-billing',
    'analytics-dashboard',
    'admin-panel',
    'user-management',
    'role-based-access',
    'api-keys',
    'usage-tracking',
    'email-notifications',
    'onboarding-flow',
  ],
  techStack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Express + TypeScript',
    database: 'PostgreSQL',
  },
  pages: ['landing', 'dashboard', 'settings', 'billing', 'admin'],
  apiRoutes: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/users',
    '/api/users/:id',
    '/api/billing/subscribe',
    '/api/billing/cancel',
    '/api/billing/invoices',
    '/api/analytics/overview',
    '/api/analytics/usage',
    '/api/admin/users',
    '/api/admin/metrics',
  ],
  dbModels: ['User', 'Subscription', 'Invoice', 'ApiKey', 'UsageLog', 'AuditEntry'],
  suggestedIntegrations: [
    'stripe',
    'sendgrid',
    'google-analytics',
    'sentry',
    'posthog',
    'resend',
  ],
  estimatedFiles: 45,
  estimatedBuildTime: '2 hrs',
};

const MARKETPLACE: PlugTemplate = {
  id: 'marketplace',
  name: 'Marketplace',
  archetype: 'marketplace',
  complexity: 'complex',
  description:
    'Two-sided marketplace connecting buyers and sellers. Includes listings, search, reviews, escrow payments, and dual dashboards. Built for scale.',
  features: [
    'authentication',
    'seller-onboarding',
    'listing-management',
    'search-and-filters',
    'shopping-cart',
    'escrow-payments',
    'reviews-and-ratings',
    'messaging',
    'seller-dashboard',
    'buyer-dashboard',
    'admin-panel',
    'dispute-resolution',
    'analytics',
    'email-notifications',
  ],
  techStack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Express + TypeScript',
    database: 'PostgreSQL',
  },
  pages: [
    'home',
    'search',
    'listing-detail',
    'seller-dashboard',
    'buyer-dashboard',
    'checkout',
    'admin',
  ],
  apiRoutes: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/listings',
    '/api/listings/:id',
    '/api/listings/search',
    '/api/cart',
    '/api/cart/checkout',
    '/api/orders',
    '/api/orders/:id',
    '/api/reviews',
    '/api/reviews/:listingId',
    '/api/messages',
    '/api/messages/:conversationId',
    '/api/sellers/:id/dashboard',
    '/api/buyers/:id/dashboard',
    '/api/admin/listings',
    '/api/admin/users',
    '/api/admin/disputes',
    '/api/payments/escrow',
    '/api/payments/release',
  ],
  dbModels: [
    'User',
    'SellerProfile',
    'Listing',
    'ListingImage',
    'Category',
    'Cart',
    'CartItem',
    'Order',
    'OrderItem',
    'Review',
    'Message',
    'Conversation',
    'Dispute',
    'Payment',
  ],
  suggestedIntegrations: [
    'stripe-connect',
    'algolia',
    'cloudinary',
    'sendgrid',
    'twilio',
    'sentry',
    'google-maps',
  ],
  estimatedFiles: 65,
  estimatedBuildTime: '4 hrs',
};

const CRM: PlugTemplate = {
  id: 'crm',
  name: 'CRM',
  archetype: 'crm',
  complexity: 'intermediate',
  description:
    'Customer relationship management system with contacts, deals pipeline, activity tracking, and reporting. Perfect for sales teams and agencies.',
  features: [
    'authentication',
    'contact-management',
    'deal-pipeline',
    'activity-tracking',
    'reporting',
    'email-integration',
    'task-management',
    'notes',
    'search-and-filters',
    'csv-import-export',
    'role-based-access',
  ],
  techStack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Express + TypeScript',
    database: 'PostgreSQL',
  },
  pages: ['dashboard', 'contacts', 'deals', 'pipeline', 'reports', 'settings'],
  apiRoutes: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/contacts',
    '/api/contacts/:id',
    '/api/contacts/import',
    '/api/contacts/export',
    '/api/deals',
    '/api/deals/:id',
    '/api/deals/:id/stage',
    '/api/pipeline',
    '/api/activities',
    '/api/activities/:contactId',
    '/api/tasks',
    '/api/tasks/:id',
    '/api/reports/revenue',
    '/api/reports/pipeline',
    '/api/reports/activity',
    '/api/settings',
  ],
  dbModels: [
    'User',
    'Contact',
    'Company',
    'Deal',
    'DealStage',
    'Activity',
    'Task',
    'Note',
    'Tag',
    'CustomField',
  ],
  suggestedIntegrations: [
    'sendgrid',
    'google-calendar',
    'slack',
    'zapier',
    'google-analytics',
    'twilio',
  ],
  estimatedFiles: 40,
  estimatedBuildTime: '2 hrs',
};

const INTERNAL_TOOL: PlugTemplate = {
  id: 'internal-tool',
  name: 'Internal Tool',
  archetype: 'internal-tool',
  complexity: 'simple',
  description:
    'Admin panel and internal dashboard for managing data, running operations, and monitoring systems. Quick to deploy, easy to extend.',
  features: [
    'authentication',
    'data-tables',
    'crud-forms',
    'search-and-filters',
    'csv-export',
    'role-based-access',
    'audit-log',
    'dark-mode',
  ],
  techStack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Express + TypeScript',
    database: 'SQLite',
  },
  pages: ['dashboard', 'data-table', 'forms', 'settings'],
  apiRoutes: [
    '/api/auth/login',
    '/api/data',
    '/api/data/:id',
    '/api/data/export',
    '/api/settings',
    '/api/audit-log',
  ],
  dbModels: ['User', 'DataRecord', 'AuditEntry', 'Setting'],
  suggestedIntegrations: ['slack', 'sentry', 'google-analytics'],
  estimatedFiles: 20,
  estimatedBuildTime: '45 min',
};

const E_COMMERCE: PlugTemplate = {
  id: 'e-commerce',
  name: 'E-Commerce',
  archetype: 'e-commerce',
  complexity: 'complex',
  description:
    'Full online store with product catalog, shopping cart, checkout flow, order tracking, inventory management, and admin panel. Ready for production.',
  features: [
    'authentication',
    'product-catalog',
    'category-management',
    'shopping-cart',
    'checkout-flow',
    'payment-processing',
    'order-tracking',
    'inventory-management',
    'search-and-filters',
    'reviews-and-ratings',
    'wishlist',
    'email-notifications',
    'admin-panel',
    'analytics',
    'coupon-codes',
  ],
  techStack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Express + TypeScript',
    database: 'PostgreSQL',
  },
  pages: [
    'home',
    'catalog',
    'product-detail',
    'cart',
    'checkout',
    'order-tracking',
    'admin',
    'inventory',
  ],
  apiRoutes: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/products',
    '/api/products/:id',
    '/api/products/search',
    '/api/categories',
    '/api/categories/:id',
    '/api/cart',
    '/api/cart/items',
    '/api/cart/checkout',
    '/api/orders',
    '/api/orders/:id',
    '/api/orders/:id/track',
    '/api/reviews',
    '/api/reviews/:productId',
    '/api/wishlist',
    '/api/coupons/validate',
    '/api/inventory',
    '/api/inventory/:productId',
    '/api/admin/products',
    '/api/admin/orders',
    '/api/admin/analytics',
  ],
  dbModels: [
    'User',
    'Product',
    'ProductImage',
    'Category',
    'Cart',
    'CartItem',
    'Order',
    'OrderItem',
    'Review',
    'Wishlist',
    'Coupon',
    'InventoryRecord',
    'Address',
    'Payment',
  ],
  suggestedIntegrations: [
    'stripe',
    'cloudinary',
    'algolia',
    'sendgrid',
    'shippo',
    'google-analytics',
    'sentry',
  ],
  estimatedFiles: 60,
  estimatedBuildTime: '3.5 hrs',
};

// ---------------------------------------------------------------------------
// All Templates
// ---------------------------------------------------------------------------

const ALL_TEMPLATES: PlugTemplate[] = [
  PORTFOLIO,
  SAAS,
  MARKETPLACE,
  CRM,
  INTERNAL_TOOL,
  E_COMMERCE,
];

// ---------------------------------------------------------------------------
// Template Library
// ---------------------------------------------------------------------------

export class TemplateLibrary {
  private templates: Map<string, PlugTemplate>;

  constructor(initial: PlugTemplate[]) {
    this.templates = new Map(initial.map(t => [t.id, t]));
    logger.info({ count: this.templates.size }, '[Templates] Library initialized');
  }

  /** Return every template in the library. */
  list(): PlugTemplate[] {
    return Array.from(this.templates.values());
  }

  /** Retrieve a single template by id. */
  get(id: string): PlugTemplate | undefined {
    return this.templates.get(id);
  }

  /** Return templates filtered by complexity tier. */
  getByComplexity(complexity: PlugTemplate['complexity']): PlugTemplate[] {
    return this.list().filter(t => t.complexity === complexity);
  }

  /**
   * Suggest templates based on feature overlap.
   *
   * Scores each template by counting how many of the requested features
   * match the template's feature list. Returns all templates with at
   * least one match, sorted by overlap (descending).
   */
  suggest(features: string[]): PlugTemplate[] {
    if (features.length === 0) return [];

    const lowerFeatures = features.map(f => f.toLowerCase());

    const scored = this.list()
      .map(template => {
        const templateFeatures = template.features.map(f => f.toLowerCase());
        const overlap = lowerFeatures.filter(f => templateFeatures.includes(f)).length;
        return { template, overlap };
      })
      .filter(entry => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap);

    logger.info(
      { requestedFeatures: features.length, matchedTemplates: scored.length },
      '[Templates] Feature-based suggestion completed'
    );

    return scored.map(entry => entry.template);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const templateLibrary = new TemplateLibrary(ALL_TEMPLATES);
