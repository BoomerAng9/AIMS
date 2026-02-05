# Buy in Bulk with Boomer_Angs

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  "I need to buy 50 chairs for the office, budget $5000 max"         │   │
│  │  "Find me the best deals on laptop chargers, under $20 each"        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ACHEEVY                                         │
│                     (Executive Orchestrator)                                 │
│                                                                              │
│  • Receives shopping requests from user                                      │
│  • Creates shopping missions with budget/price limits                        │
│  • Delegates to Purchasing PMO                                               │
│  • Receives Change Requests when limits exceeded                             │
│  • Presents cart options to user                                             │
│  • Executes final purchase (has payment access)                              │
│  • Tracks mission progress                                                   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Payment Vault   │  │ User Prefs      │  │ Mission Control │             │
│  │ (Stripe/ACP)    │  │ (Limits/Rules)  │  │ (Status/Alerts) │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ Delegates Mission
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PURCHASING PMO                                       │
│                    (Project Management Office)                               │
│                                                                              │
│  • Receives shopping mission from ACHEEVY                                    │
│  • Breaks down into tasks (search, compare, validate)                        │
│  • Assembles Boomer_Ang teams                                                │
│  • Assigns tasks to teams                                                    │
│  • Monitors progress & enforces deadlines                                    │
│  • Aggregates results into unified cart                                      │
│  • Sends Change Requests upstream when needed                                │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        SHOPPING TEAMS                                  │  │
│  │                                                                        │  │
│  │  Team Alpha          Team Bravo          Team Charlie                  │  │
│  │  ┌─────────┐        ┌─────────┐         ┌─────────┐                   │  │
│  │  │Scout_Ang│        │Scout_Ang│         │Compare  │                   │  │
│  │  │(Amazon) │        │(Walmart)│         │_Ang     │                   │  │
│  │  └─────────┘        └─────────┘         └─────────┘                   │  │
│  │  ┌─────────┐        ┌─────────┐         ┌─────────┐                   │  │
│  │  │Price_Ang│        │Price_Ang│         │Validate │                   │  │
│  │  │(Monitor)│        │(Monitor)│         │_Ang     │                   │  │
│  │  └─────────┘        └─────────┘         └─────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ Deploys Agents
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BOOMER_ANG AGENTS                                   │
│                      (NO PAYMENT ACCESS - SCOUTS ONLY)                       │
│                                                                              │
│  Capabilities:                                                               │
│  • Search products across retailers (Amazon, Walmart, etc.)                  │
│  • Extract pricing, availability, shipping info                              │
│  • Compare across vendors                                                    │
│  • Calculate bulk discounts                                                  │
│  • Build shopping carts (virtual, no checkout)                               │
│  • Monitor price changes                                                     │
│  • Report findings back to PMO                                               │
│                                                                              │
│  CANNOT:                                                                     │
│  • Access payment methods                                                    │
│  • Complete purchases                                                        │
│  • Interact with users directly                                              │
│  • Exceed assigned budget limits                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Shopping Request Flow

```
User → ACHEEVY → Purchasing PMO → Boomer_Ang Teams → Results
                                                         │
User ← ACHEEVY ← Purchasing PMO ← Cart Aggregation ←────┘
```

### 2. Change Request Flow (Budget Exceeded)

```
Boomer_Ang finds item at $25 (limit was $20)
         │
         ▼
    PMO receives finding
         │
         ▼
    PMO creates Change Request
         │
         ▼
    ACHEEVY receives Change Request
         │
         ▼
    ACHEEVY prompts user:
    "The best price I found for X is $25. Your limit was $20.
     Would you like to approve this or keep searching?"
         │
         ▼
    User approves/rejects
         │
         ▼
    Decision flows back down to PMO → Boomer_Angs
```

### 3. Purchase Execution Flow

```
User approves cart
         │
         ▼
    ACHEEVY retrieves payment method from vault
         │
         ▼
    ACHEEVY executes purchase via:
    - Stripe (for supported merchants)
    - Amazon API (with stored credentials)
    - Other payment rails
         │
         ▼
    Order confirmation → User
         │
         ▼
    LUC debits usage (shopping service quota)
```

## Components Needed

### Already Implemented ✅

| Component | Location | Purpose |
|-----------|----------|---------|
| ACP/UCP | `/frontend/lib/acp-client.ts` | User account management |
| Stripe Integration | TBD | Payment processing |
| Change Order System | `/frontend/lib/change-order/` | Interruption handling |
| Boomer_Ang Registry | `/frontend/lib/orchestration/` | Agent management |
| LUC Engine | `/packages/luc-sdk/` | Usage tracking |
| ACHEEVY | `/backend/acheevy/` | Executive orchestrator |

### Need to Build 🔨

| Component | Purpose |
|-----------|---------|
| **Purchasing PMO** | Manages shopping missions, teams, tasks |
| **Shopping Agent** | Boomer_Ang capability for product search |
| **Cart Builder** | Aggregates items from multiple sources |
| **Price Monitor** | Tracks prices, alerts on changes |
| **Payment Vault** | Secure storage for payment methods |
| **Retailer Adapters** | Amazon, Walmart, etc. integrations |
| **Budget Enforcer** | LUC integration for spending limits |

## Shopping Mission Schema

```typescript
interface ShoppingMission {
  id: string;
  userId: string;
  status: 'planning' | 'scouting' | 'comparing' | 'awaiting_approval' | 'purchasing' | 'completed' | 'cancelled';

  // What to buy
  items: ShoppingItem[];

  // Budget constraints
  budget: {
    totalLimit: number;
    perItemLimit?: number;
    currency: string;
  };

  // Preferences
  preferences: {
    preferredRetailers?: string[];
    excludedRetailers?: string[];
    shippingSpeed?: 'fastest' | 'standard' | 'cheapest';
    bulkDiscountPriority?: boolean;
  };

  // Results
  cart?: AggregatedCart;
  changeRequests: ChangeRequest[];

  // Tracking
  teams: ShoppingTeam[];
  startedAt: Date;
  completedAt?: Date;
}

interface ShoppingItem {
  id: string;
  description: string;
  quantity: number;
  maxPricePerUnit?: number;
  specifications?: Record<string, string>;
  alternatives?: string[]; // Acceptable alternatives
}

interface AggregatedCart {
  items: CartItem[];
  totalPrice: number;
  totalSavings: number;
  shippingCost: number;
  estimatedDelivery: Date;
  retailerBreakdown: RetailerSummary[];
}

interface CartItem {
  itemId: string;
  productId: string;
  productName: string;
  retailer: string;
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
  url: string;
  availability: 'in_stock' | 'limited' | 'backorder';
  shippingEstimate: string;
  bulkDiscount?: {
    threshold: number;
    discountPercent: number;
  };
}
```

## Retailer Integration Strategy

### Phase 1: Amazon
- Amazon Product Advertising API
- Affiliate links for revenue
- Bulk ordering via Amazon Business

### Phase 2: Walmart
- Walmart Affiliate API
- Walmart+ integration

### Phase 3: Others
- Alibaba (true bulk)
- Direct manufacturer APIs
- Price comparison aggregators (Google Shopping)

## Security Model

### Payment Isolation

```
┌─────────────────────────────────────────────┐
│            PAYMENT VAULT (ACHEEVY ONLY)      │
│  ┌─────────────────────────────────────────┐ │
│  │  Stripe Customer ID                     │ │
│  │  Saved Payment Methods                  │ │
│  │  Amazon Pay Credentials                 │ │
│  │  PayPal Token                           │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Access: ACHEEVY ONLY                        │
│  Encryption: AES-256-GCM                     │
│  Audit: All access logged                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            BOOMER_ANG CONTEXT                │
│  ┌─────────────────────────────────────────┐ │
│  │  ✓ Product search queries              │ │
│  │  ✓ Price information                   │ │
│  │  ✓ Product URLs                        │ │
│  │  ✓ Budget limits (read-only)           │ │
│  │  ✗ NO payment methods                  │ │
│  │  ✗ NO user PII                         │ │
│  │  ✗ NO checkout capability              │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### LUC Integration for Spending

```typescript
// New LUC service bucket for shopping
defineService('shopping_spend', 'Shopping Budget', 'USD', 0, 'Monthly shopping allowance');

// Purchasing PMO checks LUC before accepting mission
const canShop = lucEngine.canExecute('shopping_spend', missionBudget);
if (!canShop.allowed) {
  return { error: 'Shopping budget exceeded for this period' };
}

// After successful purchase, debit from LUC
lucEngine.debit('shopping_spend', actualSpend);
```

## API Endpoints

```
POST /api/shopping/missions          - Create new shopping mission
GET  /api/shopping/missions/:id      - Get mission status
PUT  /api/shopping/missions/:id      - Update mission (approve cart, etc.)
DELETE /api/shopping/missions/:id    - Cancel mission

GET  /api/shopping/missions/:id/cart - Get aggregated cart
POST /api/shopping/missions/:id/cart - Approve and purchase cart

GET  /api/shopping/change-requests   - List pending change requests
PUT  /api/shopping/change-requests/:id - Approve/reject change request

GET  /api/shopping/price-alerts      - Get price drop alerts
POST /api/shopping/price-alerts      - Set up price monitoring
```

## Example User Flow

```
User: "I need to buy office supplies for my team.
       10 ergonomic mice, 10 laptop stands, and 5 webcams.
       Budget is $1500 total. Find me the best deals."

ACHEEVY: "I'll set up a shopping mission for you. Let me confirm:
          - 10 ergonomic mice
          - 10 laptop stands
          - 5 webcams
          - Total budget: $1500

          I'll have my team scout Amazon, Walmart, and office supply stores.
          I'll come back with options. Should I proceed?"

User: "Yes, go ahead."

ACHEEVY: [Creates mission, delegates to PMO]

PMO: [Assembles teams, assigns retailers]
     - Team Alpha: Amazon search
     - Team Bravo: Walmart search
     - Team Charlie: Staples/Office Depot

Boomer_Angs: [Search, compare, build virtual carts]

--- 30 minutes later ---

ACHEEVY: "I found some great options! Here's what my team put together:

          **Option A: Best Value ($1,287)**
          - Logitech MX Anywhere 3 mice (10) - $599 from Amazon
          - VIVO laptop stands (10) - $289 from Walmart
          - Logitech C920 webcams (5) - $399 from Amazon

          **Option B: Budget Pick ($892)**
          - AmazonBasics mice (10) - $199 from Amazon
          - Generic laptop stands (10) - $149 from Walmart
          - NexiGo webcams (5) - $244 from Amazon

          **Option C: Premium ($1,489)**
          - Logitech MX Master 3S mice (10) - $799 from Amazon
          - Rain Design mStand (10) - $390 from Apple
          - Logitech Brio webcams (5) - $300 from Walmart

          Which option would you like? Or should I mix and match?"

User: "Let's go with Option A, but swap the webcams for the NexiGo ones."

ACHEEVY: "Perfect! Your customized cart:
          - Logitech MX Anywhere 3 mice (10) - $599
          - VIVO laptop stands (10) - $289
          - NexiGo webcams (5) - $244

          Total: $1,132 (saving $368 vs original budget)

          Ready to purchase? I'll use your saved Amex ending in 4242."

User: "Yes, purchase it."

ACHEEVY: [Executes purchase via Payment Vault]
         "Done! Orders placed:
          - Amazon order #123-456: Mice + Webcams - arriving Thursday
          - Walmart order #789: Laptop stands - arriving Friday

          I've saved the receipts to your account. Anything else?"
```

## Next Steps

1. **Create Purchasing PMO module** - Team management, task assignment
2. **Create Shopping Agent capability** - Product search, price extraction
3. **Create Cart Builder** - Multi-retailer cart aggregation
4. **Create Payment Vault** - Secure payment storage for ACHEEVY
5. **Create Retailer Adapters** - Amazon API integration first
6. **Extend LUC** - Add shopping_spend service bucket
7. **Update ACHEEVY** - Shopping mission orchestration
