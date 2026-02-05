/**
 * LUC (LUKE) Type Definitions
 * Ledger Usage Control - Billing and Usage Tracking Types
 */

// ==========================================
// PLAN TYPES
// ==========================================

export interface LucPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  quotas: {
    brave_searches: number;
    elevenlabs_chars: number;
    container_hours: number;
    n8n_executions: number;
    storage_gb: number;
    api_calls: number;
  };
  features: string[];
  stripe_product_id: string;
  stripe_price_id_monthly: string;
  stripe_price_id_annual: string;
}

export interface LucUsage {
  user_id: string;
  plan: string;
  quotas: {
    [service: string]: {
      limit: number;
      used: number;
      overage: number;
    };
  };
  billing_cycle_start: Date;
  billing_cycle_end: Date;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
}

export interface LucInvoice {
  invoice_id: string;
  user_id: string;
  period_start: Date;
  period_end: Date;
  line_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  stripe_invoice_id?: string;
  paid_at?: Date;
}

// ==========================================
// OVERAGE PRICING
// ==========================================

export const OVERAGE_RATES = {
  brave_searches: 0.01,       // $0.01 per search
  elevenlabs_chars: 0.0001,   // $0.0001 per char
  container_hours: 0.50,      // $0.50 per hour
  n8n_executions: 0.005,      // $0.005 per execution
  storage_gb: 0.10,           // $0.10 per GB/month
  api_calls: 0.0001           // $0.0001 per call
};

// ==========================================
// PLANS CONFIGURATION
// ==========================================

export const LUC_PLANS: Record<string, LucPlan> = {
  free: {
    id: 'free',
    name: 'Free (Guest)',
    price_monthly: 0,
    price_annual: 0,
    quotas: {
      brave_searches: 10,
      elevenlabs_chars: 0,
      container_hours: 0,
      n8n_executions: 0,
      storage_gb: 0.5,
      api_calls: 100
    },
    features: ['Browse marketplace', 'View case studies', 'Basic AI chat'],
    stripe_product_id: '',
    stripe_price_id_monthly: '',
    stripe_price_id_annual: ''
  },

  coffee: {
    id: 'coffee',
    name: 'Buy Me a Coffee',
    price_monthly: 7.99,
    price_annual: 79.99,
    quotas: {
      brave_searches: 100,
      elevenlabs_chars: 10000,
      container_hours: 2,
      n8n_executions: 50,
      storage_gb: 2,
      api_calls: 1000
    },
    features: [
      'Basic automations',
      'Voice summaries',
      'Research tools',
      '10 jobs/month'
    ],
    stripe_product_id: process.env.STRIPE_PRODUCT_COFFEE || '',
    stripe_price_id_monthly: process.env.STRIPE_PRICE_COFFEE_MONTHLY || '',
    stripe_price_id_annual: process.env.STRIPE_PRICE_COFFEE_ANNUAL || ''
  },

  data_entry: {
    id: 'data_entry',
    name: 'Data Entry',
    price_monthly: 29.99,
    price_annual: 299.99,
    quotas: {
      brave_searches: 1000,
      elevenlabs_chars: 50000,
      container_hours: 10,
      n8n_executions: 500,
      storage_gb: 10,
      api_calls: 10000
    },
    features: [
      'iAgent lite',
      'Full voice suite',
      'Research + analytics',
      'Unlimited jobs',
      'Partner marketplace access'
    ],
    stripe_product_id: process.env.STRIPE_PRODUCT_DATA_ENTRY || '',
    stripe_price_id_monthly: process.env.STRIPE_PRICE_DATA_ENTRY_MONTHLY || '',
    stripe_price_id_annual: process.env.STRIPE_PRICE_DATA_ENTRY_ANNUAL || ''
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price_monthly: 99.99,
    price_annual: 999.99,
    quotas: {
      brave_searches: 10000,
      elevenlabs_chars: 200000,
      container_hours: 50,
      n8n_executions: 5000,
      storage_gb: 100,
      api_calls: 100000
    },
    features: [
      'All II repos',
      'Priority execution',
      'Advanced analytics',
      'White-label options',
      'API access',
      'Priority support'
    ],
    stripe_product_id: process.env.STRIPE_PRODUCT_PRO || '',
    stripe_price_id_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    stripe_price_id_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || ''
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 299,
    price_annual: 2999,
    quotas: {
      brave_searches: -1, // unlimited
      elevenlabs_chars: -1,
      container_hours: -1,
      n8n_executions: -1,
      storage_gb: 500,
      api_calls: -1
    },
    features: [
      'Unlimited everything',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated Boomer_Ang',
      'White-glove support',
      'Custom billing'
    ],
    stripe_product_id: process.env.STRIPE_PRODUCT_ENTERPRISE || '',
    stripe_price_id_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    stripe_price_id_annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || ''
  }
};
