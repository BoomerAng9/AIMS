/**
 * Third-Party Integration Registry
 *
 * Catalogue of available connectors that can be activated per Plug.
 * Each integration defines its required env vars, npm packages,
 * initialization code, and minimum tier.
 *
 * Picker_Ang uses this registry to recommend and provision integrations
 * during the BUILD pipeline stage.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IntegrationCategory =
  | 'email'
  | 'storage'
  | 'payments'
  | 'auth'
  | 'analytics'
  | 'messaging'
  | 'search'
  | 'database';

export interface ConfigField {
  type: string;
  required: boolean;
  description: string;
}

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  provider: string;
  envKeys: string[];
  npmPackages: string[];
  setupCode: string;
  configSchema: Record<string, ConfigField>;
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'available' | 'coming-soon';
}

export interface RegistryStats {
  total: number;
  byCategory: Record<string, number>;
  available: number;
  comingSoon: number;
}

// ---------------------------------------------------------------------------
// Built-in integrations (15 total)
// ---------------------------------------------------------------------------

const INTEGRATIONS: Integration[] = [
  // ── Email ──────────────────────────────────────────────────────────────
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'email',
    description: 'Transactional email delivery with templates, analytics, and deliverability tracking.',
    provider: 'Twilio SendGrid',
    envKeys: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
    npmPackages: ['@sendgrid/mail'],
    setupCode: [
      "import sgMail from '@sendgrid/mail';",
      '',
      "sgMail.setApiKey(process.env.SENDGRID_API_KEY!);",
      '',
      'export async function sendEmail(to: string, subject: string, html: string) {',
      '  await sgMail.send({',
      '    to,',
      '    from: process.env.SENDGRID_FROM_EMAIL!,',
      '    subject,',
      '    html,',
      '  });',
      '}',
    ].join('\n'),
    configSchema: {
      SENDGRID_API_KEY: { type: 'string', required: true, description: 'SendGrid API key' },
      SENDGRID_FROM_EMAIL: { type: 'string', required: true, description: 'Verified sender email address' },
    },
    tier: 'starter',
    status: 'available',
  },
  {
    id: 'resend',
    name: 'Resend',
    category: 'email',
    description: 'Developer-first email API with React-based templates and excellent DX.',
    provider: 'Resend',
    envKeys: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
    npmPackages: ['resend'],
    setupCode: [
      "import { Resend } from 'resend';",
      '',
      'const resend = new Resend(process.env.RESEND_API_KEY!);',
      '',
      'export async function sendEmail(to: string, subject: string, html: string) {',
      '  await resend.emails.send({',
      '    from: process.env.RESEND_FROM_EMAIL!,',
      '    to,',
      '    subject,',
      '    html,',
      '  });',
      '}',
    ].join('\n'),
    configSchema: {
      RESEND_API_KEY: { type: 'string', required: true, description: 'Resend API key' },
      RESEND_FROM_EMAIL: { type: 'string', required: true, description: 'Verified sender email address' },
    },
    tier: 'free',
    status: 'available',
  },

  // ── Storage ────────────────────────────────────────────────────────────
  {
    id: 'aws-s3',
    name: 'AWS S3',
    category: 'storage',
    description: 'Object storage for files, images, and backups with industry-leading durability.',
    provider: 'Amazon Web Services',
    envKeys: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'AWS_REGION'],
    npmPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
    setupCode: [
      "import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';",
      "import { getSignedUrl } from '@aws-sdk/s3-request-presigner';",
      '',
      'const s3 = new S3Client({',
      '  region: process.env.AWS_REGION!,',
      '  credentials: {',
      '    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,',
      '    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,',
      '  },',
      '});',
      '',
      'export async function uploadFile(key: string, body: Buffer, contentType: string) {',
      '  await s3.send(new PutObjectCommand({',
      '    Bucket: process.env.AWS_S3_BUCKET!,',
      '    Key: key,',
      '    Body: body,',
      '    ContentType: contentType,',
      '  }));',
      '}',
    ].join('\n'),
    configSchema: {
      AWS_ACCESS_KEY_ID: { type: 'string', required: true, description: 'AWS IAM access key ID' },
      AWS_SECRET_ACCESS_KEY: { type: 'string', required: true, description: 'AWS IAM secret access key' },
      AWS_S3_BUCKET: { type: 'string', required: true, description: 'S3 bucket name' },
      AWS_REGION: { type: 'string', required: true, description: 'AWS region (e.g. us-east-1)' },
    },
    tier: 'pro',
    status: 'available',
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    category: 'storage',
    description: 'S3-compatible object storage with zero egress fees and global distribution.',
    provider: 'Cloudflare',
    envKeys: ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'],
    npmPackages: ['@aws-sdk/client-s3'],
    setupCode: [
      "import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';",
      '',
      'const r2 = new S3Client({',
      '  region: "auto",',
      '  endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,',
      '  credentials: {',
      '    accessKeyId: process.env.R2_ACCESS_KEY_ID!,',
      '    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,',
      '  },',
      '});',
      '',
      'export async function uploadFile(key: string, body: Buffer, contentType: string) {',
      '  await r2.send(new PutObjectCommand({',
      '    Bucket: process.env.R2_BUCKET_NAME!,',
      '    Key: key,',
      '    Body: body,',
      '    ContentType: contentType,',
      '  }));',
      '}',
    ].join('\n'),
    configSchema: {
      R2_ACCOUNT_ID: { type: 'string', required: true, description: 'Cloudflare account ID' },
      R2_ACCESS_KEY_ID: { type: 'string', required: true, description: 'R2 access key ID' },
      R2_SECRET_ACCESS_KEY: { type: 'string', required: true, description: 'R2 secret access key' },
      R2_BUCKET_NAME: { type: 'string', required: true, description: 'R2 bucket name' },
    },
    tier: 'starter',
    status: 'available',
  },

  // ── Payments ───────────────────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Full payment processing — one-time charges, subscriptions, invoicing, and payouts.',
    provider: 'Stripe',
    envKeys: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    npmPackages: ['stripe'],
    setupCode: [
      "import Stripe from 'stripe';",
      '',
      'export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {',
      "  apiVersion: '2024-04-10',",
      '});',
      '',
      'export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {',
      '  return stripe.checkout.sessions.create({',
      "    mode: 'subscription',",
      '    line_items: [{ price: priceId, quantity: 1 }],',
      '    success_url: successUrl,',
      '    cancel_url: cancelUrl,',
      '  });',
      '}',
    ].join('\n'),
    configSchema: {
      STRIPE_SECRET_KEY: { type: 'string', required: true, description: 'Stripe secret API key' },
      STRIPE_PUBLISHABLE_KEY: { type: 'string', required: true, description: 'Stripe publishable key (client-side)' },
      STRIPE_WEBHOOK_SECRET: { type: 'string', required: true, description: 'Stripe webhook signing secret' },
    },
    tier: 'starter',
    status: 'available',
  },
  {
    id: 'lemonsqueezy',
    name: 'LemonSqueezy',
    category: 'payments',
    description: 'All-in-one payments for digital products and SaaS — billing, tax, and licensing.',
    provider: 'LemonSqueezy',
    envKeys: ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID', 'LEMONSQUEEZY_WEBHOOK_SECRET'],
    npmPackages: ['@lemonsqueezy/lemonsqueezy.js'],
    setupCode: [
      "import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';",
      '',
      'lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });',
      '',
      'export async function createLemonCheckout(variantId: number) {',
      '  return createCheckout(process.env.LEMONSQUEEZY_STORE_ID!, variantId);',
      '}',
    ].join('\n'),
    configSchema: {
      LEMONSQUEEZY_API_KEY: { type: 'string', required: true, description: 'LemonSqueezy API key' },
      LEMONSQUEEZY_STORE_ID: { type: 'string', required: true, description: 'LemonSqueezy store identifier' },
      LEMONSQUEEZY_WEBHOOK_SECRET: { type: 'string', required: true, description: 'Webhook signing secret' },
    },
    tier: 'starter',
    status: 'available',
  },

  // ── Auth ───────────────────────────────────────────────────────────────
  {
    id: 'nextauth',
    name: 'NextAuth.js',
    category: 'auth',
    description: 'Flexible authentication for Next.js — OAuth providers, credentials, and session management.',
    provider: 'Auth.js',
    envKeys: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
    npmPackages: ['next-auth'],
    setupCode: [
      "import NextAuth from 'next-auth';",
      "import GoogleProvider from 'next-auth/providers/google';",
      '',
      'export const authOptions = {',
      '  providers: [',
      '    GoogleProvider({',
      '      clientId: process.env.GOOGLE_CLIENT_ID!,',
      '      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,',
      '    }),',
      '  ],',
      '  secret: process.env.NEXTAUTH_SECRET,',
      '};',
      '',
      'export default NextAuth(authOptions);',
    ].join('\n'),
    configSchema: {
      NEXTAUTH_SECRET: { type: 'string', required: true, description: 'Session encryption secret' },
      NEXTAUTH_URL: { type: 'string', required: true, description: 'Canonical app URL (e.g. https://app.example.com)' },
    },
    tier: 'free',
    status: 'available',
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'auth',
    description: 'Managed authentication with drop-in UI components, user management, and org support.',
    provider: 'Clerk',
    envKeys: ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    npmPackages: ['@clerk/nextjs'],
    setupCode: [
      "import { clerkMiddleware } from '@clerk/nextjs/server';",
      '',
      'export default clerkMiddleware();',
      '',
      'export const config = {',
      "  matcher: ['/((?!.*\\\\..*|_next).*)', '/', '/(api|trpc)(.*)'],",
      '};',
    ].join('\n'),
    configSchema: {
      CLERK_PUBLISHABLE_KEY: { type: 'string', required: true, description: 'Clerk publishable key (client-side)' },
      CLERK_SECRET_KEY: { type: 'string', required: true, description: 'Clerk secret key (server-side)' },
    },
    tier: 'starter',
    status: 'available',
  },

  // ── Analytics ──────────────────────────────────────────────────────────
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'analytics',
    description: 'Product analytics, feature flags, session replay, and A/B testing — all self-hostable.',
    provider: 'PostHog',
    envKeys: ['POSTHOG_API_KEY', 'POSTHOG_HOST'],
    npmPackages: ['posthog-js', 'posthog-node'],
    setupCode: [
      "import posthog from 'posthog-js';",
      '',
      'if (typeof window !== "undefined") {',
      '  posthog.init(process.env.POSTHOG_API_KEY!, {',
      '    api_host: process.env.POSTHOG_HOST || "https://app.posthog.com",',
      '    capture_pageview: true,',
      '  });',
      '}',
      '',
      'export { posthog };',
    ].join('\n'),
    configSchema: {
      POSTHOG_API_KEY: { type: 'string', required: true, description: 'PostHog project API key' },
      POSTHOG_HOST: { type: 'string', required: false, description: 'PostHog instance URL (default: https://app.posthog.com)' },
    },
    tier: 'free',
    status: 'available',
  },
  {
    id: 'plausible',
    name: 'Plausible',
    category: 'analytics',
    description: 'Privacy-friendly web analytics — no cookies, GDPR-compliant, lightweight script.',
    provider: 'Plausible Analytics',
    envKeys: ['PLAUSIBLE_DOMAIN', 'PLAUSIBLE_HOST'],
    npmPackages: ['next-plausible'],
    setupCode: [
      "import PlausibleProvider from 'next-plausible';",
      '',
      'export function AnalyticsProvider({ children }: { children: React.ReactNode }) {',
      '  return (',
      '    <PlausibleProvider',
      '      domain={process.env.PLAUSIBLE_DOMAIN!}',
      '      customDomain={process.env.PLAUSIBLE_HOST}',
      '    >',
      '      {children}',
      '    </PlausibleProvider>',
      '  );',
      '}',
    ].join('\n'),
    configSchema: {
      PLAUSIBLE_DOMAIN: { type: 'string', required: true, description: 'Site domain registered in Plausible' },
      PLAUSIBLE_HOST: { type: 'string', required: false, description: 'Self-hosted Plausible instance URL' },
    },
    tier: 'free',
    status: 'available',
  },

  // ── Messaging ──────────────────────────────────────────────────────────
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'messaging',
    description: 'SMS, voice, and WhatsApp messaging APIs with global reach and number provisioning.',
    provider: 'Twilio',
    envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    npmPackages: ['twilio'],
    setupCode: [
      "import twilio from 'twilio';",
      '',
      'const client = twilio(',
      '  process.env.TWILIO_ACCOUNT_SID!,',
      '  process.env.TWILIO_AUTH_TOKEN!,',
      ');',
      '',
      'export async function sendSMS(to: string, body: string) {',
      '  return client.messages.create({',
      '    to,',
      '    from: process.env.TWILIO_PHONE_NUMBER!,',
      '    body,',
      '  });',
      '}',
    ].join('\n'),
    configSchema: {
      TWILIO_ACCOUNT_SID: { type: 'string', required: true, description: 'Twilio account SID' },
      TWILIO_AUTH_TOKEN: { type: 'string', required: true, description: 'Twilio auth token' },
      TWILIO_PHONE_NUMBER: { type: 'string', required: true, description: 'Twilio phone number (E.164 format)' },
    },
    tier: 'pro',
    status: 'available',
  },
  {
    id: 'pusher',
    name: 'Pusher',
    category: 'messaging',
    description: 'Real-time WebSocket channels for live updates, chat, notifications, and collaboration.',
    provider: 'Pusher',
    envKeys: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'],
    npmPackages: ['pusher', 'pusher-js'],
    setupCode: [
      "import Pusher from 'pusher';",
      '',
      'export const pusher = new Pusher({',
      '  appId: process.env.PUSHER_APP_ID!,',
      '  key: process.env.PUSHER_KEY!,',
      '  secret: process.env.PUSHER_SECRET!,',
      '  cluster: process.env.PUSHER_CLUSTER!,',
      '  useTLS: true,',
      '});',
      '',
      'export async function triggerEvent(channel: string, event: string, data: unknown) {',
      '  await pusher.trigger(channel, event, data);',
      '}',
    ].join('\n'),
    configSchema: {
      PUSHER_APP_ID: { type: 'string', required: true, description: 'Pusher app ID' },
      PUSHER_KEY: { type: 'string', required: true, description: 'Pusher key (client-side)' },
      PUSHER_SECRET: { type: 'string', required: true, description: 'Pusher secret (server-side)' },
      PUSHER_CLUSTER: { type: 'string', required: true, description: 'Pusher cluster region' },
    },
    tier: 'starter',
    status: 'available',
  },

  // ── Search ─────────────────────────────────────────────────────────────
  {
    id: 'algolia',
    name: 'Algolia',
    category: 'search',
    description: 'Full-text search, autocomplete, and faceted filtering with sub-50ms responses.',
    provider: 'Algolia',
    envKeys: ['ALGOLIA_APP_ID', 'ALGOLIA_ADMIN_KEY', 'ALGOLIA_SEARCH_KEY'],
    npmPackages: ['algoliasearch', 'react-instantsearch'],
    setupCode: [
      "import algoliasearch from 'algoliasearch';",
      '',
      '// Server-side client (has write access)',
      'export const algoliaAdmin = algoliasearch(',
      '  process.env.ALGOLIA_APP_ID!,',
      '  process.env.ALGOLIA_ADMIN_KEY!,',
      ');',
      '',
      '// Client-side client (search-only)',
      'export const algoliaSearch = algoliasearch(',
      '  process.env.ALGOLIA_APP_ID!,',
      '  process.env.ALGOLIA_SEARCH_KEY!,',
      ');',
    ].join('\n'),
    configSchema: {
      ALGOLIA_APP_ID: { type: 'string', required: true, description: 'Algolia application ID' },
      ALGOLIA_ADMIN_KEY: { type: 'string', required: true, description: 'Algolia admin API key (server-side only)' },
      ALGOLIA_SEARCH_KEY: { type: 'string', required: true, description: 'Algolia search-only API key (safe for client)' },
    },
    tier: 'pro',
    status: 'available',
  },

  // ── Database ───────────────────────────────────────────────────────────
  {
    id: 'neon',
    name: 'Neon',
    category: 'database',
    description: 'Serverless PostgreSQL with branching, auto-scaling, and instant provisioning.',
    provider: 'Neon',
    envKeys: ['DATABASE_URL'],
    npmPackages: ['@neondatabase/serverless', 'drizzle-orm', 'drizzle-kit'],
    setupCode: [
      "import { neon } from '@neondatabase/serverless';",
      "import { drizzle } from 'drizzle-orm/neon-http';",
      '',
      'const sql = neon(process.env.DATABASE_URL!);',
      'export const db = drizzle(sql);',
    ].join('\n'),
    configSchema: {
      DATABASE_URL: { type: 'string', required: true, description: 'Neon PostgreSQL connection string' },
    },
    tier: 'free',
    status: 'available',
  },
  {
    id: 'planetscale',
    name: 'PlanetScale',
    category: 'database',
    description: 'Serverless MySQL platform with branching, deploy requests, and horizontal scaling.',
    provider: 'PlanetScale',
    envKeys: ['DATABASE_URL'],
    npmPackages: ['@planetscale/database', 'drizzle-orm', 'drizzle-kit'],
    setupCode: [
      "import { Client } from '@planetscale/database';",
      "import { drizzle } from 'drizzle-orm/planetscale-serverless';",
      '',
      'const client = new Client({ url: process.env.DATABASE_URL! });',
      'export const db = drizzle(client);',
    ].join('\n'),
    configSchema: {
      DATABASE_URL: { type: 'string', required: true, description: 'PlanetScale connection string' },
    },
    tier: 'starter',
    status: 'available',
  },
];

// ---------------------------------------------------------------------------
// IntegrationRegistry
// ---------------------------------------------------------------------------

export class IntegrationRegistry {
  private integrations: Integration[];

  constructor() {
    this.integrations = [...INTEGRATIONS];
    logger.info(
      { count: this.integrations.length },
      '[IntegrationRegistry] Loaded integrations',
    );
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  /** Return all registered integrations. */
  list(): Integration[] {
    return this.integrations;
  }

  /** Look up a single integration by ID. */
  get(id: string): Integration | undefined {
    return this.integrations.find((i) => i.id === id);
  }

  /** Filter integrations by category. */
  getByCategory(category: IntegrationCategory): Integration[] {
    return this.integrations.filter((i) => i.category === category);
  }

  /** Filter integrations by minimum tier. */
  getByTier(tier: string): Integration[] {
    return this.integrations.filter((i) => i.tier === tier);
  }

  // -----------------------------------------------------------------------
  // Aggregation helpers
  // -----------------------------------------------------------------------

  /**
   * Collect all required environment variable keys for a given set of
   * integration IDs. Duplicates are removed.
   */
  getRequiredEnvKeys(integrationIds: string[]): string[] {
    const keys = new Set<string>();
    for (const id of integrationIds) {
      const integration = this.get(id);
      if (integration) {
        for (const key of integration.envKeys) {
          keys.add(key);
        }
      } else {
        logger.warn({ integrationId: id }, '[IntegrationRegistry] Unknown integration ID — skipping');
      }
    }
    return Array.from(keys);
  }

  /**
   * Generate a combined setup file that initialises all requested integrations.
   * Returns a single TypeScript string ready to be written to disk.
   */
  generateSetupCode(integrationIds: string[]): string {
    const sections: string[] = [
      '/**',
      ' * Auto-generated integration setup',
      ` * Integrations: ${integrationIds.join(', ')}`,
      ` * Generated at: ${new Date().toISOString()}`,
      ' * by: ACHIEVEMOR',
      ' */',
      '',
    ];

    for (const id of integrationIds) {
      const integration = this.get(id);
      if (!integration) {
        sections.push(`// WARNING: Unknown integration "${id}" — skipped`);
        sections.push('');
        continue;
      }

      sections.push(`// ── ${integration.name} (${integration.category}) ${'─'.repeat(Math.max(1, 50 - integration.name.length - integration.category.length))}`);
      sections.push('');
      sections.push(integration.setupCode);
      sections.push('');
    }

    return sections.join('\n');
  }

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  /** Aggregate stats about the registry. */
  getStats(): RegistryStats {
    const byCategory: Record<string, number> = {};

    for (const i of this.integrations) {
      byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
    }

    return {
      total: this.integrations.length,
      byCategory,
      available: this.integrations.filter((i) => i.status === 'available').length,
      comingSoon: this.integrations.filter((i) => i.status === 'coming-soon').length,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const integrationRegistry = new IntegrationRegistry();
