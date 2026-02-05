# A.I.M.S. Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the A.I.M.S. onboarding system, LUC billing engine, and end-to-end managed service funnel.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Hostinger VPS with Docker installed
- [ ] Firebase project created (Firestore + Authentication enabled)
- [ ] GCP project with Cloud Run, Cloud Storage enabled
- [ ] Stripe account with API keys
- [ ] Resend account for transactional emails

---

## Quick Start

### 1. Install Dependencies

```bash
cd aims-skills
npm install
```

### 2. Setup Stripe Products

```bash
export STRIPE_SECRET_KEY=sk_live_xxx
npm run setup:stripe
```

### 3. Initialize Firestore Schema

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
npm run setup:firestore
```

### 4. Run Tests

```bash
npm test
```

---

## Project Structure

```
aims-skills/
├── types/               # TypeScript type definitions
│   ├── skills.ts        # Skill types
│   ├── hooks.ts         # Hook types
│   └── index.ts
├── skills/              # ACHEEVY skills
│   ├── onboarding-sop.skill.ts
│   ├── idea-validation.skill.ts
│   └── index.ts
├── hooks/               # ACHEEVY hooks
│   ├── onboarding-flow.hook.ts
│   ├── conversation-state.hook.ts
│   └── index.ts
├── luc/                 # LUC (LUKE) Billing ADK
│   ├── luc-adk.ts
│   ├── types.ts
│   └── index.ts
├── scripts/             # Setup scripts
│   ├── setup-stripe-products.js
│   └── init-firestore-schema.ts
├── tests/               # Test files
│   ├── onboarding-sop.test.ts
│   ├── idea-validation.test.ts
│   ├── luc-adk.test.ts
│   └── hooks.test.ts
├── package.json
├── tsconfig.json
└── index.ts
```

---

## Skills Overview

### 1. Onboarding SOP Skill (`onboarding-sop.skill.ts`)

**Purpose:** Adaptive onboarding that generates personalized templates.

**Triggers:**
- `user_first_login` - When user hasn't completed onboarding
- `user_industry_change` - When user changes industry
- `user_goal_reset` - When user requests restart

**Flow:**
1. **Discovery Phase** - Ask about purpose, industry, income goal
2. **Prompt 1: Fastest Path** - Recommend offer and channel
3. **Prompt 2: Mentor Identification** - Identify expert to learn from
4. **Prompt 3: Action Plan** - 90-day plan in mentor's voice
5. **Bonus: Mindset Diagnosis** - 2-week proof sprint if stuck

### 2. Idea Validation Skill (`idea-validation.skill.ts`)

**Purpose:** M.I.M. (MakeItMine) 4-step validation chain.

**Steps:**
1. Raw Idea Capture
2. Gap Analysis (Clarity, Risk, Gaps)
3. Audience Resonance
4. Expert Perspective

---

## Hooks Overview

### 1. Onboarding Flow Hook (`onboarding-flow.hook.ts`)

**Priority:** 100 (runs first)

**Lifecycle Points:**
- `before_acheevy_response` - Load onboarding state, inject context
- `after_user_message` - Extract data, advance steps
- `before_tool_call` - Inject user data into tools

### 2. Conversation State Hook (`conversation-state.hook.ts`)

**Priority:** 90

**Lifecycle Points:**
- `before_acheevy_response` - Load conversation history
- `after_acheevy_response` - Save assistant message
- `after_user_message` - Save user message

---

## LUC (LUKE) Billing

**Pronunciation:** "LUKE" (not L-U-C)

### Plans

| Plan | Monthly | Brave Searches | API Calls |
|------|---------|----------------|-----------|
| Free | $0 | 10 | 100 |
| Coffee | $7.99 | 100 | 1,000 |
| Data Entry | $29.99 | 1,000 | 10,000 |
| Pro | $99.99 | 10,000 | 100,000 |
| Enterprise | $299 | Unlimited | Unlimited |

### Key Methods

```typescript
// Debit usage
await LucAdk.debit(userId, 'brave_searches', 1);

// Check if can execute
const { can_execute } = await LucAdk.canExecute(userId, 'api_calls', 100);

// Generate invoice
const invoice = await LucAdk.generateInvoice(userId);

// Create subscription
await LucAdk.createSubscription(userId, 'pro', 'monthly', stripeCustomerId);
```

---

## Environment Variables

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Products (from setup script)
STRIPE_COFFEE_PRODUCT=prod_...
STRIPE_COFFEE_PRICE_MONTHLY=price_...
STRIPE_COFFEE_PRICE_ANNUAL=price_...
# ... etc for each plan

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Resend
RESEND_API_KEY=re_...
```

---

## Integration with ACHEEVY

```typescript
import { 
  ACHEEVY_SKILLS, 
  ACHEEVY_HOOKS,
  LucAdk 
} from 'aims-skills';

class ACHEEVY {
  private skills = ACHEEVY_SKILLS;
  private hooks = ACHEEVY_HOOKS;

  async chat(userId: string, message: string) {
    let context = { user: { id: userId }, message };

    // Run before hooks
    for (const hook of this.hooks) {
      if (hook.lifecycle_points.before_acheevy_response) {
        context = await hook.lifecycle_points.before_acheevy_response.execute(context);
      }
    }

    // Check LUC quota
    const { can_execute } = await LucAdk.canExecute(userId, 'api_calls', 1);
    if (!can_execute) {
      return 'Quota exceeded. Please upgrade your plan.';
    }

    // Process with LLM...
    const response = await this.generateResponse(context);

    // Run after hooks
    for (const hook of this.hooks) {
      if (hook.lifecycle_points.after_acheevy_response) {
        await hook.lifecycle_points.after_acheevy_response.execute(context, response);
      }
    }

    // Debit usage
    await LucAdk.debit(userId, 'api_calls', 1);

    return response;
  }
}
```

---

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- onboarding-sop.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Deployment

### 1. Build

```bash
npm run build
```

### 2. Deploy to Firebase Functions

```bash
firebase deploy --only functions
```

### 3. Set up Cron Jobs

Monthly billing cycle reset:

```typescript
// functions/cron/reset-billing-cycles.ts
export const resetBillingCycles = onSchedule('0 0 1 * *', async () => {
  const users = await db.collection('luc').where('status', '==', 'active').get();
  for (const doc of users.docs) {
    await LucAdk.resetBillingCycle(doc.id);
  }
});
```

---

## Support

For implementation questions:
- Check tests for usage examples
- Review type definitions for API reference
- Contact: dev@plugmein.com
