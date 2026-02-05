/**
 * Firestore Schema Initialization Script
 * Creates collection schemas and example documents for A.I.M.S.
 * 
 * Run: npx ts-node scripts/init-firestore-schema.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

if (serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  // Use default credentials (e.g., on GCP)
  initializeApp();
}

const db = getFirestore();

async function initSchema() {
  console.log('🚀 Initializing A.I.M.S. Firestore Schema...\n');

  try {
    // ==========================================
    // LUC Collection
    // ==========================================
    console.log('Creating LUC collection schema...');
    await db.collection('luc').doc('_SCHEMA').set({
      _description: 'Ledger Usage Control records - tracks user quotas and billing',
      _created_at: FieldValue.serverTimestamp(),
      _example: {
        user_id: 'uid123',
        plan: 'pro',
        quotas: {
          brave_searches: { limit: 10000, used: 0, overage: 0 },
          elevenlabs_chars: { limit: 200000, used: 0, overage: 0 },
          container_hours: { limit: 50, used: 0, overage: 0 },
          n8n_executions: { limit: 5000, used: 0, overage: 0 },
          storage_gb: { limit: 100, used: 0, overage: 0 },
          api_calls: { limit: 100000, used: 0, overage: 0 }
        },
        billing_cycle_start: new Date(),
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripe_subscription_id: 'sub_xxx',
        stripe_customer_id: 'cus_xxx',
        status: 'active'
      }
    });
    console.log('  ✅ LUC collection created\n');

    // ==========================================
    // Users Collection with Subcollections
    // ==========================================
    console.log('Creating Users collection schema...');
    
    // Onboarding state subcollection
    await db.collection('users').doc('_SCHEMA')
      .collection('onboarding_state').doc('_SCHEMA').set({
        _description: 'User onboarding progress and collected data',
        _example: {
          onboarding_active: true,
          current_step: 1,
          step_started_at: new Date(),
          collected_data: {
            purpose: 'Build client pipeline',
            industry: 'Real Estate',
            income_goal: 100000,
            career_stage: 'established',
            fastest_offer: 'Luxury home staging consultation',
            fastest_channel: 'Instagram + referrals',
            identified_mentor: 'Ryan Serhant',
            mentor_expertise: 'High-volume real estate sales'
          },
          messages_count: 12,
          last_updated: new Date()
        }
      });

    // Conversations subcollection
    await db.collection('users').doc('_SCHEMA')
      .collection('conversations').doc('_SCHEMA').set({
        _description: 'User conversation history with ACHEEVY',
        _example: {
          messages: [
            { role: 'user', content: 'Hello!', timestamp: new Date() },
            { role: 'assistant', content: 'Welcome to A.I.M.S.!', timestamp: new Date() }
          ],
          metadata: {
            started_at: new Date(),
            message_count: 2,
            last_updated: new Date()
          }
        }
      });

    // Templates subcollection
    await db.collection('users').doc('_SCHEMA')
      .collection('templates').doc('_SCHEMA').set({
        _description: 'Generated personalized templates for user',
        _example: {
          header: {
            title: 'Your A.I.M.S. Roadmap',
            tagline: 'Real Estate → $100,000/year'
          },
          goal_framework: {
            income_target: 100000,
            fastest_path: {
              offer: 'Luxury home staging consultation',
              channel: 'Instagram + referrals'
            },
            mentor: {
              name: 'Ryan Serhant',
              expertise: 'High-volume real estate sales'
            }
          },
          generated_at: new Date()
        }
      });

    // Validations subcollection
    await db.collection('users').doc('_SCHEMA')
      .collection('validations').doc('_SCHEMA').set({
        _description: 'Idea validation results',
        _example: {
          raw_idea: 'AI scheduling assistant for dentists',
          validated_version: 'HIPAA-compliant AI scheduling for solo dental practices',
          gaps_identified: ['HIPAA compliance', 'PMS integration'],
          expert: 'Jason Lemkin',
          created_at: new Date()
        }
      });

    console.log('  ✅ Users collection with subcollections created\n');

    // ==========================================
    // Industry Knowledge Collection
    // ==========================================
    console.log('Creating Industry Knowledge collection...');
    
    const industries = [
      {
        id: 'real_estate',
        industry: 'Real Estate',
        key_challenges: ['Lead generation', 'Client retention', 'Market competition'],
        success_patterns: ['Referral networks', 'Social proof', 'Local SEO'],
        top_experts: ['Ryan Serhant', 'Gary Keller'],
        average_deal_size: 15000,
        typical_close_rate: 0.03
      },
      {
        id: 'digital_marketing',
        industry: 'Digital Marketing',
        key_challenges: ['Client acquisition', 'Proving ROI', 'Scaling operations'],
        success_patterns: ['Case studies', 'LinkedIn outreach', 'Partnerships'],
        top_experts: ['Alex Hormozi', 'Seth Godin'],
        average_deal_size: 5000,
        typical_close_rate: 0.15
      },
      {
        id: 'saas',
        industry: 'SaaS',
        key_challenges: ['Product-market fit', 'Churn reduction', 'Sales cycle'],
        success_patterns: ['Freemium model', 'Content marketing', 'Product-led growth'],
        top_experts: ['Jason Lemkin', 'Hiten Shah'],
        average_deal_size: 2000,
        typical_close_rate: 0.05
      },
      {
        id: 'consulting',
        industry: 'Consulting',
        key_challenges: ['Pricing', 'Client acquisition', 'Scope creep'],
        success_patterns: ['Value-based pricing', 'Thought leadership', 'Referrals'],
        top_experts: ['Alan Weiss', 'David C. Baker'],
        average_deal_size: 10000,
        typical_close_rate: 0.25
      },
      {
        id: 'ecommerce',
        industry: 'E-commerce',
        key_challenges: ['Customer acquisition cost', 'Inventory management', 'Competition'],
        success_patterns: ['Influencer partnerships', 'Email marketing', 'Retargeting'],
        top_experts: ['Ezra Firestone', 'Nik Sharma'],
        average_deal_size: 75,
        typical_close_rate: 0.02
      }
    ];

    for (const industry of industries) {
      await db.collection('industry_knowledge').doc(industry.id).set({
        ...industry,
        created_at: FieldValue.serverTimestamp()
      });
    }
    console.log('  ✅ Industry Knowledge collection created\n');

    // ==========================================
    // Invoices Collection
    // ==========================================
    console.log('Creating Invoices collection schema...');
    await db.collection('invoices').doc('_SCHEMA').set({
      _description: 'Billing invoices',
      _example: {
        invoice_id: 'INV-123456',
        user_id: 'uid123',
        period_start: new Date(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        line_items: [
          { description: 'Pro - Monthly Subscription', quantity: 1, unit_price: 99.99, total: 99.99 },
          { description: 'brave_searches overage (500 units)', quantity: 500, unit_price: 0.01, total: 5.00 }
        ],
        subtotal: 104.99,
        tax: 8.40,
        total: 113.39,
        status: 'paid',
        stripe_invoice_id: 'in_xxx',
        paid_at: new Date()
      }
    });
    console.log('  ✅ Invoices collection created\n');

    // ==========================================
    // Jobs Collection (for task tracking)
    // ==========================================
    console.log('Creating Jobs collection schema...');
    await db.collection('jobs').doc('_SCHEMA').set({
      _description: 'Async job tracking for long-running tasks',
      _example: {
        job_id: 'job_123456',
        user_id: 'uid123',
        type: 'research',
        status: 'completed',
        input: { topic: 'AI trends 2024', depth: 'comprehensive' },
        output: { report_url: 'gs://aims-outputs/report.pdf' },
        started_at: new Date(),
        completed_at: new Date(),
        luc_usage: {
          brave_searches: 50,
          api_calls: 100
        }
      }
    });
    console.log('  ✅ Jobs collection created\n');

    console.log('✨ Firestore schema initialization complete!');
    console.log('\nCollections created:');
    console.log('  - luc (quotas & billing)');
    console.log('  - users (with onboarding_state, conversations, templates, validations)');
    console.log('  - industry_knowledge (pre-populated with 5 industries)');
    console.log('  - invoices');
    console.log('  - jobs');

  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    throw error;
  }
}

// Run if called directly
initSchema().catch(console.error);

export { initSchema };
