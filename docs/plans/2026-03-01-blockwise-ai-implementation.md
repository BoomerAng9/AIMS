# Blockwise AI Implementation Plan (Standalone Repo)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Blockwise AI as a standalone Next.js 14 application — a product created BY A.I.M.S. — with property search, deep neighborhood analysis, LUC flip calculator, and K1 tax generator. Deploys as an A.I.M.S. Plug.

**Architecture:** Standalone Next.js 14 app (`blockwise-ai/`) with API routes for backend logic. Google Maps for geospatial rendering. 4-tier data pipeline (Google Maps → Brave Search → Firecrawl → Structured APIs). Mercury 2 as primary conversation LLM. ElevenLabs UI component library for voice-first chat UX. Connects to A.I.M.S. via external APIs (LUC, Evidence Locker, SDT).

**Tech Stack:** Next.js 14 (App Router), TypeScript, @vis.gl/react-google-maps, Tailwind CSS, shadcn/ui, ElevenLabs UI components (@elevenlabs/react), Mercury 2 (Inception Labs — OpenAI-compatible), Framer Motion, Google Drive/Docs/Sheets API, NotebookLM Enterprise API, Gemini 3.1 Flash Image (Nano Banana Pro 2), Paperform, C1 Thesys

**Design Doc:** `docs/plans/2026-03-01-blockwise-ai-design.md`

---

## Phase 1: Project Scaffold & Foundation

### Task 1: Initialize Standalone Next.js Project

**Files:**
- Create: `blockwise-ai/` directory and scaffold

**Step 1: Create directory and initialize Next.js**

```bash
mkdir -p blockwise-ai
cd blockwise-ai
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git
```

Selections when prompted:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No (use `app/` at root)
- App Router: Yes
- Import alias: `@/*`

**Step 2: Verify scaffold**

Run: `cd blockwise-ai && npm run build`
Expected: Build passes with default Next.js page

**Step 3: Commit**

```bash
cd blockwise-ai && git init
git add .
git commit -m "feat: initialize Blockwise AI standalone Next.js 14 project"
```

---

### Task 2: Install Core Dependencies

**Files:**
- Modify: `blockwise-ai/package.json`

**Step 1: Install map, UI, and animation libraries**

```bash
cd blockwise-ai
npm install @vis.gl/react-google-maps framer-motion openai
npm install -D @types/google.maps
```

- `@vis.gl/react-google-maps` — Official Google Maps React wrapper
- `framer-motion` — Animation library
- `openai` — Mercury 2 uses OpenAI-compatible API

**Step 2: Install shadcn/ui**

```bash
cd blockwise-ai
npx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables yes.

**Step 3: Add shadcn components needed**

```bash
npx shadcn@latest add button card input label select tabs badge dialog dropdown-menu separator slider toast
```

**Step 4: Install ElevenLabs**

```bash
npm install @elevenlabs/react @elevenlabs/client
```

**Step 5: Verify package.json**

Run: `grep -E "react-google-maps|framer-motion|elevenlabs|openai" blockwise-ai/package.json`
Expected: All 4 packages present

**Step 6: Commit**

```bash
git add package.json package-lock.json components.json lib/ components/
git commit -m "deps: add Google Maps, Framer Motion, shadcn/ui, ElevenLabs, OpenAI SDK"
```

---

### Task 3: Environment & Configuration Files

**Files:**
- Create: `blockwise-ai/.env.example`
- Create: `blockwise-ai/.env.local` (gitignored)
- Modify: `blockwise-ai/next.config.mjs`

**Step 1: Create .env.example**

```env
# === Required ===
NEXT_PUBLIC_GOOGLE_MAPS_KEY=         # Google Maps JavaScript API key
GOOGLE_MAPS_SERVER_KEY=              # Server-side Maps API key
MERCURY_API_KEY=                     # Inception Labs Mercury 2
MERCURY_API_URL=https://api.inceptionlabs.ai/v1
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=     # ElevenLabs conversational agent
ELEVENLABS_API_KEY=                  # ElevenLabs server-side
BRAVE_API_KEY=                       # Brave Search API
FIRECRAWL_API_KEY=                   # Firecrawl scraping

# === A.I.M.S. Integration ===
AIMS_API_URL=https://plugmein.cloud/api
AIMS_API_KEY=                        # A.I.M.S. service token
AIMS_LUC_ENDPOINT=                   # LUC metering endpoint
AIMS_EVIDENCE_LOCKER_URL=            # Evidence Locker API
AIMS_SDT_URL=                        # Secure Drop Token API

# === K1 Pipeline ===
PAPERFORM_API_KEY=                   # Paperform intake
PAPERFORM_FORM_ID=                   # K1 intake form ID
THESYS_API_KEY=                      # C1 Thesys generative UI

# === Google Workspace (K1 export) ===
GOOGLE_CLIENT_ID=                    # OAuth for Drive/Docs/Sheets
GOOGLE_CLIENT_SECRET=
GOOGLE_SERVICE_ACCOUNT_KEY=          # Base64-encoded service account JSON

# === Optional Tier 4 APIs ===
ATTOM_API_KEY=                       # ATTOM property data
MASHVISOR_API_KEY=                   # Rental/Airbnb estimates
FIRST_STREET_API_KEY=                # Climate risk
AIRDNA_API_KEY=                      # STR analytics
BATCHDATA_API_KEY=                   # Skip tracing
HOUSECANARY_API_KEY=                 # Block-level AVM

# === NotebookLM ===
NOTEBOOKLM_API_KEY=                  # NotebookLM Enterprise
```

**Step 2: Update next.config.mjs**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'streetviewpixels-pa.googleapis.com' },
    ],
  },
  // Standalone output for Docker deployment
  output: 'standalone',
};

export default nextConfig;
```

**Step 3: Commit**

```bash
git add .env.example next.config.mjs .gitignore
git commit -m "feat: add environment config and Next.js standalone output for Docker"
```

---

### Task 4: Type Definitions

**Files:**
- Create: `blockwise-ai/lib/types.ts`

**Step 1: Create type definitions**

```typescript
// blockwise-ai/lib/types.ts

// ── Property Types ──

export interface Property {
  id: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: PropertyType;
  estimatedArv: number | null;
  estimatedRoi: number | null;
  dealStatus: DealStatus;
  streetViewUrl: string | null;
  source: DataSource;
}

export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'land' | 'commercial';
export type DealStatus = 'excellent' | 'good' | 'marginal' | 'pass' | 'unknown';
export type DataSource = 'google_places' | 'brave_search' | 'firecrawl' | 'attom' | 'mashvisor' | 'manual';

// ── Search & Filters ──

export interface PropertyFilters {
  location: string;
  bounds?: { north: number; south: number; east: number; west: number };
  priceMin?: number;
  priceMax?: number;
  arvMin?: number;
  arvMax?: number;
  propertyType?: PropertyType[];
  bedroomsMin?: number;
  dealStatus?: DealStatus[];
}

export interface SearchResult {
  properties: Property[];
  total: number;
  center: { lat: number; lng: number };
  radius: number;
}

// ── Block Score / Neighborhood ──

export interface BlockScore {
  overall: number; // 0-100
  schools: number;
  safety: number;
  appreciation: number;
  livability: number;
  development: number;
}

export type VerdictLevel = 'strong_buy' | 'worth_investigating' | 'proceed_with_caution' | 'walk_away';

export interface NeighborhoodReport {
  property: Property;
  blockScore: BlockScore;
  verdict: VerdictLevel;
  verdictText: string;
  comps: CompSale[];
  schools: SchoolInfo[];
  safety: SafetyData;
  demographics: DemographicData;
  appreciation: AppreciationData;
  walkability: WalkabilityData;
  development: DevelopmentData;
}

export interface CompSale {
  address: string;
  lat: number;
  lng: number;
  salePrice: number;
  pricePerSqft: number;
  saleDate: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  deltaPercent: number;
  distanceMiles: number;
}

export interface SchoolInfo {
  name: string;
  type: 'elementary' | 'middle' | 'high';
  rating: number; // 1-10
  distance: number;
  commuteMinutes: number;
}

export interface SafetyData {
  overallScore: number; // 0-100
  violentCrime: 'low' | 'medium' | 'high';
  propertyCrime: 'low' | 'medium' | 'high';
  yoyTrend: number; // percent change
  sexOffenderCount: number;
  radius: number;
}

export interface DemographicData {
  population: number;
  medianIncome: number;
  medianAge: number;
  ownerOccupancyPercent: number;
}

export interface AppreciationData {
  oneYear: number;
  threeYear: number;
  fiveYear: number;
  forecast: number;
}

export interface WalkabilityData {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  nearestGroceryMiles: number;
}

export interface DevelopmentData {
  permits6mo: number;
  newBuilds: number;
  avgPermitValue: number;
  rezoning: string | null;
  gentrificationSignal: 'rising' | 'stable' | 'declining';
}

// ── Flip Calculator ──

export interface FlipInputs {
  purchasePrice: number;
  repairCosts: number;
  arv: number;
  holdingPeriodMonths: number;
  purchaseClosingCostPercent: number;
  saleClosingCostPercent: number;
  realtorCommissionPercent: number;
  loanToValue: number;
  interestRate: number;
  loanPoints: number;
  monthlyHoldingCosts: number;
  contingencyPercent: number;
}

export interface FlipOutputs {
  totalInvestment: number;
  cashRequired: number;
  loanAmount: number;
  totalFinancingCosts: number;
  totalHoldingCosts: number;
  totalSellingCosts: number;
  totalCosts: number;
  profit: number;
  roi: number;
  cashOnCashReturn: number;
  maxOffer: number;
  dealStatus: string;
}

export interface SensitivityRow {
  arv: number;
  profit: number;
  roi: number;
  isBaseline: boolean;
}

export interface OpmBreakdown {
  cashIn: number;
  hmlCovers: number;
  pointsAndInterest: number;
  totalOutOfPocket: number;
}

// ── K1 Tax ──

export interface K1Inputs {
  entityType: 'llc' | 's_corp' | 'partnership';
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  state: string; // 2-letter code
  purchasePrice: number;
  landValue: number;
  holdingDays: number;
  holdingPeriodMonths: number;
  flipProfit: number;
  rentalIncome: number;
  propertyTaxDeduction: number;
  mortgageInterestDeduction: number;
  insuranceCost: number;
  repairCosts: number;
  materialParticipation: boolean;
}

export interface K1Outputs {
  capitalGainType: 'short_term' | 'long_term';
  ordinaryIncome: number;
  depreciation: number;
  totalDeductions: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  selfEmploymentTax: number;
  totalTax: number;
  netAfterTax: number;
  effectiveRate: number;
}

// ── Export ──

export interface ExportOptions {
  format: 'pdf' | 'google_doc' | 'google_sheet' | 'email';
  title: string;
  data: unknown;
  recipientEmail?: string;
}

// ── NotebookLM ──

export interface NotebookRequest {
  propertyAddress: string;
  sources: NotebookSource[];
  generateAudio: boolean;
}

export interface NotebookSource {
  type: 'text' | 'url';
  title: string;
  content: string;
}

export interface NotebookResult {
  notebookId: string;
  notebookUrl: string;
  audioUrl?: string;
  status: 'created' | 'processing' | 'ready';
}

// ── Chat ──

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  propertyContext?: Property | null;
  richCard?: RichCard | null;
}

export interface RichCard {
  type: 'block_score' | 'flip_result' | 'k1_summary' | 'comp_table' | 'verdict';
  data: unknown;
}
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add type definitions for property, neighborhood, flip, K1, chat"
```

---

### Task 5: LUC Formula Data Files

**Files:**
- Create: `blockwise-ai/data/flip-formulas.json` (copy from `aims-tools/luc/presets/real-estate-flip/formulas.json`)
- Create: `blockwise-ai/data/k1-formulas.json`
- Create: `blockwise-ai/data/state-tax-rates.json`

**Step 1: Copy flip formulas**

Copy the 19 formulas from `aims-tools/luc/presets/real-estate-flip/formulas.json` into `blockwise-ai/data/flip-formulas.json`. This is the LUC Real Estate Calculator core — all 19 formulas including 70% Rule maxOffer, ROI, cash-on-cash return, deal status.

**Step 2: Create K1 formulas**

```json
{
  "version": "1.0.0",
  "formulas": [
    {
      "id": "capitalGainType",
      "name": "Capital Gain Type",
      "description": "Short-term if held less than 365 days",
      "inputs": ["holdingDays"],
      "expression": "holdingDays >= 365 ? 1 : 0",
      "outputType": "number",
      "outputLabel": "1 = long_term, 0 = short_term"
    },
    {
      "id": "depreciationBuilding",
      "name": "Building Depreciation",
      "description": "Straight-line depreciation over 27.5 years",
      "inputs": ["purchasePrice", "landValue", "holdingPeriodMonths"],
      "expression": "(purchasePrice - landValue) / 27.5 * (holdingPeriodMonths / 12)",
      "outputType": "currency"
    },
    {
      "id": "totalDeductions",
      "name": "Total Deductions",
      "inputs": ["depreciationBuilding", "propertyTaxDeduction", "mortgageInterestDeduction", "insuranceCost", "repairCosts"],
      "expression": "depreciationBuilding + propertyTaxDeduction + mortgageInterestDeduction + insuranceCost + repairCosts",
      "outputType": "currency"
    },
    {
      "id": "taxableIncome",
      "name": "Taxable Income",
      "inputs": ["flipProfit", "totalDeductions"],
      "expression": "max(flipProfit - totalDeductions, 0)",
      "outputType": "currency"
    },
    {
      "id": "selfEmploymentTax",
      "name": "Self-Employment Tax",
      "description": "15.3% on 92.35% of income (if active participant)",
      "inputs": ["taxableIncome", "materialParticipation"],
      "expression": "materialParticipation ? taxableIncome * 0.9235 * 0.153 : 0",
      "outputType": "currency"
    },
    {
      "id": "federalTaxBracket",
      "name": "Federal Tax Bracket Rate",
      "description": "2025 marginal rate lookup (simplified)",
      "inputs": ["taxableIncome"],
      "expression": "taxableIncome <= 11600 ? 0.10 : taxableIncome <= 47150 ? 0.12 : taxableIncome <= 100525 ? 0.22 : taxableIncome <= 191950 ? 0.24 : taxableIncome <= 243725 ? 0.32 : taxableIncome <= 609350 ? 0.35 : 0.37",
      "outputType": "percentage"
    },
    {
      "id": "federalTax",
      "name": "Federal Tax Estimate",
      "inputs": ["taxableIncome", "federalTaxBracket"],
      "expression": "taxableIncome * federalTaxBracket",
      "outputType": "currency"
    },
    {
      "id": "totalTax",
      "name": "Total Tax Liability",
      "inputs": ["federalTax", "stateTax", "selfEmploymentTax"],
      "expression": "federalTax + stateTax + selfEmploymentTax",
      "outputType": "currency"
    },
    {
      "id": "netAfterTax",
      "name": "Net After-Tax Profit",
      "inputs": ["flipProfit", "totalTax"],
      "expression": "flipProfit - totalTax",
      "outputType": "currency"
    },
    {
      "id": "effectiveRate",
      "name": "Effective Tax Rate",
      "inputs": ["totalTax", "flipProfit"],
      "expression": "flipProfit > 0 ? (totalTax / flipProfit) * 100 : 0",
      "outputType": "percentage"
    }
  ]
}
```

**Step 3: Create state tax rates**

```json
{
  "TX": 0, "FL": 0, "NV": 0, "WA": 0, "WY": 0, "SD": 0, "TN": 0, "AK": 0, "NH": 0,
  "CA": 0.133, "NY": 0.109, "NJ": 0.1075, "OR": 0.099, "MN": 0.0985,
  "DC": 0.0975, "VT": 0.0875, "HI": 0.11, "IA": 0.085, "WI": 0.0765,
  "ME": 0.0715, "SC": 0.07, "CT": 0.0699, "MT": 0.069, "NE": 0.0684,
  "DE": 0.066, "WV": 0.065, "MA": 0.09, "GA": 0.055, "VA": 0.0575,
  "NC": 0.0525, "MD": 0.0575, "KY": 0.04, "IL": 0.0495, "OH": 0.04,
  "AL": 0.05, "AR": 0.047, "AZ": 0.025, "CO": 0.044, "ID": 0.058,
  "IN": 0.0305, "KS": 0.057, "LA": 0.0425, "MI": 0.0425, "MO": 0.048,
  "MS": 0.05, "ND": 0.0195, "NM": 0.059, "OK": 0.0475, "PA": 0.0307,
  "RI": 0.0599, "UT": 0.0465,
  "DEFAULT": 0.05
}
```

**Step 4: Commit**

```bash
git add data/
git commit -m "feat: add LUC flip formulas (19), K1 tax formulas (10), state tax rates"
```

---

### Task 6: Mercury 2 Client + A.I.M.S. API Client

**Files:**
- Create: `blockwise-ai/lib/mercury.ts`
- Create: `blockwise-ai/lib/aims-api.ts`

**Step 1: Create Mercury 2 client**

```typescript
// blockwise-ai/lib/mercury.ts
import OpenAI from 'openai';

const mercury = new OpenAI({
  apiKey: process.env.MERCURY_API_KEY || '',
  baseURL: process.env.MERCURY_API_URL || 'https://api.inceptionlabs.ai/v1',
});

export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await mercury.chat.completions.create({
    model: 'mercury-coder-small',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
  });
  return response.choices[0]?.message?.content || '';
}

export async function streamChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
) {
  return mercury.chat.completions.create({
    model: 'mercury-coder-small',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  });
}

export { mercury };
```

**Step 2: Create A.I.M.S. API client**

```typescript
// blockwise-ai/lib/aims-api.ts

const AIMS_API_URL = process.env.AIMS_API_URL || 'https://plugmein.cloud/api';
const AIMS_API_KEY = process.env.AIMS_API_KEY || '';

async function aimsRequest(path: string, body?: unknown) {
  const res = await fetch(`${AIMS_API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AIMS_API_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`A.I.M.S. API error: ${res.status} ${path}`);
  return res.json();
}

/** Meter a LUC usage event */
export async function meterLucUsage(key: string, amount: number, metadata?: Record<string, unknown>) {
  return aimsRequest('/luc/meter', { key, amount, metadata });
}

/** Store document in Evidence Locker */
export async function storeEvidence(title: string, content: string, contentType: string) {
  return aimsRequest('/evidence-locker/store', { title, content, contentType });
}

/** Generate a Secure Drop Token for document sharing */
export async function generateSdt(documentId: string, expiresIn: number = 7 * 24 * 60 * 60) {
  return aimsRequest('/sdt/generate', { documentId, expiresIn });
}

/** Get LUC quote for an operation */
export async function getLucQuote(operation: string) {
  return aimsRequest('/luc/quote', { operation });
}
```

**Step 3: Commit**

```bash
git add lib/mercury.ts lib/aims-api.ts
git commit -m "feat: add Mercury 2 LLM client + A.I.M.S. API client (LUC, Evidence, SDT)"
```

---

### Task 7: Google Maps Client Library

**Files:**
- Create: `blockwise-ai/lib/google-maps.ts`

**Step 1: Create Maps utility functions**

```typescript
// blockwise-ai/lib/google-maps.ts

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
const SERVER_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || '';

/** Geocode an address to lat/lng (server-side) */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${SERVER_KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  }
  return null;
}

/** Get Street View thumbnail URL */
export function getStreetViewUrl(lat: number, lng: number, width = 400, height = 250): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&key=${MAPS_KEY}`;
}

/** Get elevation for flood risk assessment (server-side) */
export async function getElevation(lat: number, lng: number): Promise<number | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${SERVER_KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    return data.results[0].elevation;
  }
  return null;
}

/** Calculate distance between two points in miles */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

**Step 2: Commit**

```bash
git add lib/google-maps.ts
git commit -m "feat: add Google Maps client (geocode, street view, elevation, haversine)"
```

---

### Task 8: Brave Search + Firecrawl Clients

**Files:**
- Create: `blockwise-ai/lib/brave-search.ts`
- Create: `blockwise-ai/lib/firecrawl.ts`

**Step 1: Create Brave Search client**

```typescript
// blockwise-ai/lib/brave-search.ts
import { meterLucUsage } from './aims-api';

const BRAVE_KEY = process.env.BRAVE_API_KEY || '';

interface BraveResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

async function searchBrave(query: string): Promise<BraveResult[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
    { headers: { 'X-Subscription-Token': BRAVE_KEY, Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Brave search failed: ${res.status}`);
  const data = await res.json();
  await meterLucUsage('BRAVE_QUERIES', 1, { query });
  return (data.web?.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    description: r.description,
    snippet: r.extra_snippets?.[0],
  }));
}

export async function searchPropertyRecords(address: string) {
  return searchBrave(`${address} property records tax deed`);
}

export async function searchCrimeStats(neighborhood: string, zip: string) {
  return searchBrave(`${neighborhood} ${zip} crime statistics safety`);
}

export async function searchBuildingPermits(zip: string) {
  return searchBrave(`${zip} building permits 2025 2026`);
}

export async function searchComps(address: string) {
  return searchBrave(`${address} recent sales comparable properties`);
}

export async function searchGentrification(neighborhood: string) {
  return searchBrave(`${neighborhood} gentrification development trend`);
}
```

**Step 2: Create Firecrawl client**

```typescript
// blockwise-ai/lib/firecrawl.ts
import { meterLucUsage } from './aims-api';

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || '';
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1';

async function scrapeUrl(url: string, prompt?: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      ...(prompt ? { extract: { prompt } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Firecrawl scrape failed: ${res.status}`);
  const data = await res.json();
  await meterLucUsage('API_CALLS', 1, { provider: 'firecrawl', url });
  return data.data?.markdown || '';
}

export async function scrapeGreatSchools(zip: string) {
  return scrapeUrl(
    `https://www.greatschools.org/search/search.page?zip=${zip}`,
    'Extract school names, ratings (1-10), grade levels, and addresses'
  );
}

export async function scrapeCrimeData(lat: number, lng: number) {
  return scrapeUrl(
    `https://www.crimemapping.com/map/location/${lat},${lng}`,
    'Extract crime incidents, types, counts, and date range'
  );
}

export async function scrapeWalkScore(address: string) {
  const slug = address.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  return scrapeUrl(
    `https://www.walkscore.com/score/${slug}`,
    'Extract walk score, transit score, bike score'
  );
}

export async function scrapeCensusData(zip: string) {
  return scrapeUrl(
    `https://data.census.gov/profile?q=${zip}`,
    'Extract population, median income, median age, owner-occupancy rate'
  );
}

export { scrapeUrl };
```

**Step 3: Commit**

```bash
git add lib/brave-search.ts lib/firecrawl.ts
git commit -m "feat: add Brave Search + Firecrawl data pipeline clients with LUC metering"
```

---

## Phase 2: API Routes (Backend)

### Task 9: Health Check + Chat API Routes

**Files:**
- Create: `blockwise-ai/app/api/health/route.ts`
- Create: `blockwise-ai/app/api/chat/route.ts`

**Step 1: Health check**

```typescript
// blockwise-ai/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'blockwise-ai',
    timestamp: new Date().toISOString(),
  });
}
```

**Step 2: Chat route (Mercury 2)**

```typescript
// blockwise-ai/app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { streamChatCompletion } from '@/lib/mercury';

const SYSTEM_PROMPT = `You are ACHEEVY, the AI assistant for Blockwise AI — a neighborhood intelligence and real estate investment platform. You help real estate professionals:
- Find and analyze properties
- Understand neighborhoods deeply (Block Score, crime, schools, appreciation)
- Run flip calculations using the LUC Real Estate Calculator
- Generate K1 tax documents

Be conversational, knowledgeable about real estate investing, and concise. When a property is in context, reference it specifically. Use the 70% Rule, ARV analysis, and deal status terminology.`;

export async function POST(req: NextRequest) {
  const { messages, propertyContext } = await req.json();

  const systemMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...(propertyContext
      ? [{ role: 'system' as const, content: `Current property context: ${JSON.stringify(propertyContext)}` }]
      : []),
  ];

  const stream = await streamChatCompletion([...systemMessages, ...messages]);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

**Step 3: Commit**

```bash
git add app/api/health/ app/api/chat/
git commit -m "feat: add health check + Mercury 2 streaming chat API route"
```

---

### Task 10: Search + Analyze API Routes

**Files:**
- Create: `blockwise-ai/app/api/search/route.ts`
- Create: `blockwise-ai/app/api/analyze/route.ts`
- Create: `blockwise-ai/lib/neighborhood.ts`

**Step 1: Create Block Score algorithm**

```typescript
// blockwise-ai/lib/neighborhood.ts
import type { BlockScore, VerdictLevel, NeighborhoodReport } from './types';

const WEIGHTS = {
  schools: 0.20,
  safety: 0.20,
  appreciation: 0.25,
  livability: 0.20,
  development: 0.15,
};

export function calculateBlockScore(data: {
  avgSchoolRating: number;      // 1-10
  crimeScore: number;           // 0-100 (higher = safer)
  yoyCrimeTrend: number;        // percent change (negative = improving)
  oneYearAppreciation: number;  // percent
  walkScore: number;            // 0-100
  transitScore: number;         // 0-100
  bikeScore: number;            // 0-100
  permits6mo: number;
  gentrificationSignal: 'rising' | 'stable' | 'declining';
}): BlockScore {
  const schools = (data.avgSchoolRating / 10) * 100;
  const safety = Math.min(100, data.crimeScore + (data.yoyCrimeTrend < 0 ? 10 : 0));
  const appreciation = Math.min(100, Math.max(0, data.oneYearAppreciation >= 15 ? 100 : data.oneYearAppreciation >= 0 ? 50 + (data.oneYearAppreciation / 15) * 50 : data.oneYearAppreciation * 5 + 50));
  const livability = data.walkScore * 0.5 + data.transitScore * 0.3 + data.bikeScore * 0.2;
  const devBase = Math.min(100, data.permits6mo * 5);
  const devBonus = data.gentrificationSignal === 'rising' ? 20 : data.gentrificationSignal === 'stable' ? 0 : -10;
  const development = Math.min(100, Math.max(0, devBase + devBonus));

  const overall = Math.round(
    schools * WEIGHTS.schools +
    safety * WEIGHTS.safety +
    appreciation * WEIGHTS.appreciation +
    livability * WEIGHTS.livability +
    development * WEIGHTS.development
  );

  return {
    overall,
    schools: Math.round(schools),
    safety: Math.round(safety),
    appreciation: Math.round(appreciation),
    livability: Math.round(livability),
    development: Math.round(development),
  };
}

export function getVerdict(score: number): VerdictLevel {
  if (score >= 80) return 'strong_buy';
  if (score >= 60) return 'worth_investigating';
  if (score >= 40) return 'proceed_with_caution';
  return 'walk_away';
}

export function getVerdictLabel(verdict: VerdictLevel): string {
  const labels: Record<VerdictLevel, string> = {
    strong_buy: 'STRONG BUY ZONE',
    worth_investigating: 'WORTH INVESTIGATING',
    proceed_with_caution: 'PROCEED WITH CAUTION',
    walk_away: 'WALK AWAY',
  };
  return labels[verdict];
}
```

**Step 2: Create search API route**

```typescript
// blockwise-ai/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/google-maps';
import { searchPropertyRecords, searchComps } from '@/lib/brave-search';

export async function POST(req: NextRequest) {
  const { location, filters } = await req.json();

  const geo = await geocodeAddress(location);
  if (!geo) return NextResponse.json({ error: 'Could not geocode location' }, { status: 400 });

  // Tier 2: Brave Search for property intel
  const [records, comps] = await Promise.allSettled([
    searchPropertyRecords(location),
    searchComps(location),
  ]);

  return NextResponse.json({
    properties: [], // Populated by Tier 4 APIs or Brave parsing
    total: 0,
    center: geo,
    radius: filters?.radius || 5,
    rawRecords: records.status === 'fulfilled' ? records.value : [],
    rawComps: comps.status === 'fulfilled' ? comps.value : [],
  });
}
```

**Step 3: Create analyze API route**

```typescript
// blockwise-ai/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, getElevation } from '@/lib/google-maps';
import { searchCrimeStats, searchBuildingPermits, searchGentrification } from '@/lib/brave-search';
import { calculateBlockScore, getVerdict, getVerdictLabel } from '@/lib/neighborhood';

export async function POST(req: NextRequest) {
  const { address, lat, lng } = await req.json();

  const coords = lat && lng ? { lat, lng } : await geocodeAddress(address);
  if (!coords) return NextResponse.json({ error: 'Could not geocode address' }, { status: 400 });

  const zip = address.match(/\d{5}/)?.[0] || '';

  // Parallel data fetching — Tier 1 + 2
  const [elevation, crime, permits, gentrification] = await Promise.allSettled([
    getElevation(coords.lat, coords.lng),
    searchCrimeStats(address, zip),
    searchBuildingPermits(zip),
    searchGentrification(address),
  ]);

  // Placeholder scores — will be enriched by Tier 3/4
  const blockScore = calculateBlockScore({
    avgSchoolRating: 7,
    crimeScore: 60,
    yoyCrimeTrend: -2,
    oneYearAppreciation: 5,
    walkScore: 50,
    transitScore: 30,
    bikeScore: 40,
    permits6mo: 8,
    gentrificationSignal: 'stable',
  });

  const verdict = getVerdict(blockScore.overall);

  return NextResponse.json({
    address,
    coords,
    blockScore,
    verdict,
    verdictLabel: getVerdictLabel(verdict),
    elevation: elevation.status === 'fulfilled' ? elevation.value : null,
    rawCrime: crime.status === 'fulfilled' ? crime.value : [],
    rawPermits: permits.status === 'fulfilled' ? permits.value : [],
    rawGentrification: gentrification.status === 'fulfilled' ? gentrification.value : [],
  });
}
```

**Step 4: Commit**

```bash
git add lib/neighborhood.ts app/api/search/ app/api/analyze/
git commit -m "feat: add Block Score algorithm + search/analyze API routes with Tier 1-2 pipeline"
```

---

## Phase 3: Core UI Components

### Task 11: Root Layout with Providers

**Files:**
- Modify: `blockwise-ai/app/layout.tsx`
- Create: `blockwise-ai/app/providers.tsx`

**Step 1: Create providers wrapper**

```typescript
// blockwise-ai/app/providers.tsx
'use client';

import { APIProvider } from '@vis.gl/react-google-maps';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}>
      {children}
    </APIProvider>
  );
}
```

**Step 2: Update root layout**

Update `app/layout.tsx` to:
- Import and wrap with `<Providers>`
- Set dark theme background (`bg-[#0A0A0F]`)
- Add Inter font
- Set metadata title "Blockwise AI — Neighborhood Intelligence"

**Step 3: Commit**

```bash
git add app/layout.tsx app/providers.tsx
git commit -m "feat: add root layout with Google Maps provider + dark theme"
```

---

### Task 12: PropertyMap Component

**Files:**
- Create: `blockwise-ai/components/PropertyMap.tsx`

**Step 1: Build the map component**

Create `PropertyMap.tsx` with:
- `<Map>` with dark-styled map (using `mapId` for cloud-based styling or inline styles)
- `<AdvancedMarker>` for each property pin with custom content (price label)
- `<InfoWindow>` on pin click showing mini property card
- `onBoundsChanged` callback to update visible area
- Gold (#D4A843) for selected pins, zinc for unselected
- Props: `properties: Property[]`, `selectedId: string | null`, `onSelect: (id: string) => void`, `onBoundsChange: (bounds) => void`

**Step 2: Commit**

```bash
git add components/PropertyMap.tsx
git commit -m "feat: add PropertyMap with Google Maps, dark theme, gold pins"
```

---

### Task 13: PropertyCard + FilterPanel Components

**Files:**
- Create: `blockwise-ai/components/PropertyCard.tsx`
- Create: `blockwise-ai/components/FilterPanel.tsx`

**Step 1: Build PropertyCard**

- Street View thumbnail via `getStreetViewUrl()`
- Property details: price, beds/baths, sqft, year built
- Estimated ARV and ROI (if available)
- Deal Status badge (color-coded: green/gold/orange/red)
- Action buttons: [Analyze] [Flip Calc] [Save]
- Glass card styling: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl`

**Step 2: Build FilterPanel**

- Location search input (text → geocode on enter)
- Price Range (min/max)
- Property Type checkboxes
- Bedrooms minimum (1-5+ buttons)
- ARV Range (min/max — investor filter)
- Deal Status checkboxes (Excellent, Good, Marginal, Pass)
- [Search] button triggers `onFilterChange(filters)`
- Dark glass styling, collapsible sections

**Step 3: Commit**

```bash
git add components/PropertyCard.tsx components/FilterPanel.tsx
git commit -m "feat: add PropertyCard + FilterPanel with investor-grade filters"
```

---

### Task 14: ChatPanel Component (ElevenLabs + Mercury 2)

**Files:**
- Create: `blockwise-ai/components/ChatPanel.tsx`

**Context:**
- Uses `@elevenlabs/react` `useConversation` hook for voice
- Mercury 2 for text chat via `/api/chat`
- ElevenLabs UI components: `Conversation`, `VoiceButton`, or `Orb`
- Context-aware: receives `selectedProperty` prop

**Step 1: Build the chat panel**

Create `ChatPanel.tsx` with:
- Right-side collapsible panel (width: 320px desktop, full-width mobile overlay)
- Message list with auto-scroll
- Input bar with text + mic button (ElevenLabs `VoiceButton` or custom mic toggle)
- ElevenLabs `useConversation` hook for voice sessions
- Streaming text responses from Mercury 2 via `/api/chat` SSE
- Voice status indicator (Orb animation when speaking/listening)
- `selectedProperty: Property | null` prop for context
- Auto-suggestion when pin clicked: "I see you're looking at {address}. Want me to run a full analysis?"
- Toggle button (chevron) to collapse/expand

**Step 2: Commit**

```bash
git add components/ChatPanel.tsx
git commit -m "feat: add ChatPanel with ElevenLabs voice + Mercury 2 streaming chat"
```

---

### Task 15: Home Page — Property Search & Map Assembly

**Files:**
- Create: `blockwise-ai/app/page.tsx`

**Step 1: Assemble the search page**

Three-column layout:
- **Left:** FilterPanel (280px) + scrollable results list
- **Center:** PropertyMap (flex)
- **Right:** ChatPanel (320px, collapsible)

State: `filters`, `properties`, `selectedProperty`, `chatOpen`
API: POST `/api/search` on filter change

```typescript
// blockwise-ai/app/page.tsx
'use client';

import { useState } from 'react';
import { PropertyMap } from '@/components/PropertyMap';
import { FilterPanel } from '@/components/FilterPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { PropertyCard } from '@/components/PropertyCard';
import type { Property, PropertyFilters } from '@/lib/types';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [chatOpen, setChatOpen] = useState(true);

  async function handleSearch(filters: PropertyFilters) {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: filters.location, filters }),
    });
    const data = await res.json();
    setProperties(data.properties || []);
  }

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-white">
      {/* Left: Filters + Results */}
      <aside className="w-[280px] border-r border-white/10 flex flex-col overflow-hidden">
        <FilterPanel onFilterChange={handleSearch} />
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              selected={p.id === selectedProperty?.id}
              onClick={() => setSelectedProperty(p)}
            />
          ))}
        </div>
      </aside>

      {/* Center: Map */}
      <main className="flex-1 relative">
        <PropertyMap
          properties={properties}
          selectedId={selectedProperty?.id || null}
          onSelect={(id) => setSelectedProperty(properties.find((p) => p.id === id) || null)}
          onBoundsChange={() => {}}
        />
      </main>

      {/* Right: Chat */}
      {chatOpen && (
        <aside className="w-[320px] border-l border-white/10">
          <ChatPanel
            selectedProperty={selectedProperty}
            onClose={() => setChatOpen(false)}
          />
        </aside>
      )}

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed right-4 bottom-4 w-12 h-12 rounded-full bg-[#D4A843] flex items-center justify-center shadow-lg z-50"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

**Step 2: Run build check**

Run: `cd blockwise-ai && npm run build`
Expected: Build passes with home route

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble home page — 3-column layout with map, filters, chat"
```

---

## Phase 4: Neighborhood Intel (Module 2)

### Task 16: Neighborhood Intel Components

**Files:**
- Create: `blockwise-ai/components/BlockScoreCard.tsx`
- Create: `blockwise-ai/components/CompMap.tsx`
- Create: `blockwise-ai/components/NeighborhoodGrid.tsx`
- Create: `blockwise-ai/components/VerdictCard.tsx`

**Step 1: Build BlockScoreCard**

5 mini-cards in a row showing each score category (Schools, Safety, Appreciation, Livability, Development) with the overall Block Score as the hero number. Color-coded: green 80+, gold 60-79, orange 40-59, red below 40.

**Step 2: Build CompMap**

Google Map showing subject property (gold pin) + comps (blue pins) with price labels. Radius selector dropdown (0.25mi, 0.5mi, 1mi). Period selector (3mo, 6mo, 12mo). Comp table below map: address, sold$, $/sqft, date, delta%.

**Step 3: Build NeighborhoodGrid**

2x3 grid of glass cards: Schools, Safety, Demographics, Appreciation, Walkability, Development. Each card shows key stats from the `NeighborhoodReport` data.

**Step 4: Build VerdictCard**

ACHEEVY verdict banner: colored badge (green/gold/orange/red) + verdict text + action buttons [Run Flip Calculator →] [Generate K1 →] [Export PDF].

**Step 5: Commit**

```bash
git add components/BlockScoreCard.tsx components/CompMap.tsx components/NeighborhoodGrid.tsx components/VerdictCard.tsx
git commit -m "feat: add neighborhood intel components (Block Score, comps, grid, verdict)"
```

---

### Task 17: Analyze Page Assembly

**Files:**
- Create: `blockwise-ai/app/analyze/page.tsx`

**Step 1: Assemble the analyze page**

Compose: back button, property header, BlockScoreCard row, CompMap, comps table, NeighborhoodGrid (2x3), VerdictCard, ChatPanel on right.

Receives address via URL search params: `/analyze?address=123+Main+St&lat=30.27&lng=-97.74`

Fetches data from `/api/analyze` on mount.

**Step 2: Run build check**

Run: `cd blockwise-ai && npm run build`

**Step 3: Commit**

```bash
git add app/analyze/
git commit -m "feat: assemble neighborhood analysis page with all intel components"
```

---

## Phase 5: LUC Flip Calculator + K1 (Modules 3 & 4)

### Task 18: Flip Calculator Engine + Component

**Files:**
- Create: `blockwise-ai/lib/flip-formulas.ts`
- Create: `blockwise-ai/components/FlipCalculator.tsx`
- Create: `blockwise-ai/components/SensitivityTable.tsx`
- Create: `blockwise-ai/components/OpmCard.tsx`

**Step 1: Create flip calculation engine**

```typescript
// blockwise-ai/lib/flip-formulas.ts
import type { FlipInputs, FlipOutputs, SensitivityRow, OpmBreakdown } from './types';

export function calculateFlip(inputs: FlipInputs): FlipOutputs {
  const contingencyAmount = inputs.repairCosts * (inputs.contingencyPercent / 100);
  const totalRepairCosts = inputs.repairCosts + contingencyAmount;
  const purchaseClosingCosts = inputs.purchasePrice * (inputs.purchaseClosingCostPercent / 100);
  const loanAmount = inputs.purchasePrice * (inputs.loanToValue / 100);
  const loanPointsCost = loanAmount * (inputs.loanPoints / 100);
  const monthlyInterest = loanAmount * (inputs.interestRate / 100 / 12);
  const totalInterestCost = monthlyInterest * inputs.holdingPeriodMonths;
  const totalFinancingCosts = loanPointsCost + totalInterestCost;
  const totalHoldingCosts = inputs.monthlyHoldingCosts * inputs.holdingPeriodMonths;
  const saleClosingCosts = inputs.arv * (inputs.saleClosingCostPercent / 100);
  const realtorCommission = inputs.arv * (inputs.realtorCommissionPercent / 100);
  const totalSellingCosts = saleClosingCosts + realtorCommission;
  const totalInvestment = inputs.purchasePrice + purchaseClosingCosts + totalRepairCosts;
  const cashRequired = (totalInvestment - loanAmount) + totalFinancingCosts + totalHoldingCosts;
  const totalCosts = totalInvestment + totalFinancingCosts + totalHoldingCosts + totalSellingCosts;
  const profit = inputs.arv - totalCosts;
  const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
  const cashOnCashReturn = cashRequired > 0 ? (profit / cashRequired) * 100 : 0;
  const maxOffer = (inputs.arv * 0.70) - totalRepairCosts;
  const dealStatus = roi >= 20 ? 'Excellent Deal' : roi >= 15 ? 'Good Deal' : roi >= 10 ? 'Marginal Deal' : 'Pass';

  return {
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    cashRequired: Math.round(cashRequired * 100) / 100,
    loanAmount: Math.round(loanAmount * 100) / 100,
    totalFinancingCosts: Math.round(totalFinancingCosts * 100) / 100,
    totalHoldingCosts: Math.round(totalHoldingCosts * 100) / 100,
    totalSellingCosts: Math.round(totalSellingCosts * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    roi: Math.round(roi * 10) / 10,
    cashOnCashReturn: Math.round(cashOnCashReturn * 10) / 10,
    maxOffer: Math.round(maxOffer * 100) / 100,
    dealStatus,
  };
}

export function calculateSensitivity(inputs: FlipInputs, steps: number[] = [-20000, -10000, 0, 10000, 20000]): SensitivityRow[] {
  return steps.map((delta) => {
    const adjusted = { ...inputs, arv: inputs.arv + delta };
    const result = calculateFlip(adjusted);
    return {
      arv: adjusted.arv,
      profit: result.profit,
      roi: result.roi,
      isBaseline: delta === 0,
    };
  });
}

export function calculateOpm(inputs: FlipInputs, outputs: FlipOutputs): OpmBreakdown {
  return {
    cashIn: outputs.cashRequired,
    hmlCovers: outputs.loanAmount,
    pointsAndInterest: outputs.totalFinancingCosts,
    totalOutOfPocket: outputs.cashRequired,
  };
}
```

**Step 2: Build FlipCalculator component**

Two-column layout. Left: input sections (Property, Acquisition, Financing, Holding, Selling). Right: Deal Verdict card, Cost Breakdown stacked bars, SensitivityTable, OpmCard. Auto-fill indicators on fields populated from Blockwise analysis.

**Step 3: Build SensitivityTable**

Table with 5 rows: ARV -$20K, -$10K, baseline, +$10K, +$20K. Profit and ROI per row. Baseline row highlighted gold.

**Step 4: Build OpmCard**

Glass card: Your Cash In, HML Covers, Points + Interest, Total Out-of-Pocket.

**Step 5: Commit**

```bash
git add lib/flip-formulas.ts components/FlipCalculator.tsx components/SensitivityTable.tsx components/OpmCard.tsx
git commit -m "feat: add LUC flip calculator engine (19 formulas) + UI components"
```

---

### Task 19: K1 Tax Engine + Components

**Files:**
- Create: `blockwise-ai/lib/k1-formulas.ts`
- Create: `blockwise-ai/components/K1Form.tsx`

**Step 1: Create K1 calculation engine**

```typescript
// blockwise-ai/lib/k1-formulas.ts
import type { K1Inputs, K1Outputs } from './types';
import stateTaxRates from '@/data/state-tax-rates.json';

export function calculateK1(inputs: K1Inputs): K1Outputs {
  const rates = stateTaxRates as Record<string, number>;
  const stateRate = rates[inputs.state] ?? rates.DEFAULT;
  const capitalGainType = inputs.holdingDays >= 365 ? 'long_term' : 'short_term';
  const depreciation = (inputs.purchasePrice - inputs.landValue) / 27.5 * (inputs.holdingPeriodMonths / 12);
  const totalDeductions = depreciation + inputs.propertyTaxDeduction + inputs.mortgageInterestDeduction + inputs.insuranceCost + inputs.repairCosts;
  const taxableIncome = Math.max(inputs.flipProfit - totalDeductions, 0);
  const selfEmploymentTax = inputs.materialParticipation ? taxableIncome * 0.9235 * 0.153 : 0;

  // 2025 brackets (single — simplified marginal)
  const federalRate = taxableIncome <= 11600 ? 0.10
    : taxableIncome <= 47150 ? 0.12
    : taxableIncome <= 100525 ? 0.22
    : taxableIncome <= 191950 ? 0.24
    : taxableIncome <= 243725 ? 0.32
    : taxableIncome <= 609350 ? 0.35
    : 0.37;
  const federalTax = taxableIncome * federalRate;
  const stateTax = taxableIncome * stateRate;
  const totalTax = federalTax + stateTax + selfEmploymentTax;
  const netAfterTax = inputs.flipProfit - totalTax;
  const effectiveRate = inputs.flipProfit > 0 ? (totalTax / inputs.flipProfit) * 100 : 0;

  return {
    capitalGainType,
    ordinaryIncome: inputs.flipProfit,
    depreciation: Math.round(depreciation * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalTax: Math.round(federalTax * 100) / 100,
    stateTax: Math.round(stateTax * 100) / 100,
    selfEmploymentTax: Math.round(selfEmploymentTax * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    netAfterTax: Math.round(netAfterTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10) / 10,
  };
}
```

**Step 2: Build K1Form component**

Entity type selector, filing status, state dropdown, income section (auto-filled from flip), deductions section, tax impact summary cards (federal, state, SE tax), action buttons [Download PDF] [Export to Google Docs] [Email to CPA] [Save to Evidence Locker].

Disclaimer at bottom: "DRAFT — Review with your CPA before filing. Not tax advice."

**Step 3: Commit**

```bash
git add lib/k1-formulas.ts components/K1Form.tsx
git commit -m "feat: add K1 tax engine (10 formulas, 50 state rates) + K1Form component"
```

---

### Task 20: Flip + K1 Pages

**Files:**
- Create: `blockwise-ai/app/flip/page.tsx`
- Create: `blockwise-ai/app/k1/page.tsx`

**Step 1: Build flip page**

Compose FlipCalculator + ChatPanel. Receives property data via URL params or sessionStorage. Two-column layout: calculator left, results + chat right.

**Step 2: Build K1 page**

Compose K1Form + ChatPanel. Pre-populates from flip data if coming from `/flip`. Paperform iframe embed option for full intake.

**Step 3: Run build check**

Run: `cd blockwise-ai && npm run build`
Expected: All 4 routes build: `/`, `/analyze`, `/flip`, `/k1`

**Step 4: Commit**

```bash
git add app/flip/ app/k1/
git commit -m "feat: add flip calculator + K1 tax generator pages"
```

---

## Phase 6: Export, NotebookLM, Nano Banana Pro 2

### Task 21: Export API + Component

**Files:**
- Create: `blockwise-ai/lib/export.ts`
- Create: `blockwise-ai/app/api/export/route.ts`
- Create: `blockwise-ai/components/ExportMenu.tsx`

**Step 1: Build export module**

```typescript
// blockwise-ai/lib/export.ts

/** Export HTML to Google Doc via Drive API */
export async function exportToGoogleDoc(title: string, htmlContent: string, accessToken: string) {
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: createMultipartBody(
      { name: title, mimeType: 'application/vnd.google-apps.document' },
      htmlContent,
      'text/html'
    ),
  });
  return res.json();
}

/** Export CSV to Google Sheet via Drive API */
export async function exportToGoogleSheet(title: string, csvData: string, accessToken: string) {
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: createMultipartBody(
      { name: title, mimeType: 'application/vnd.google-apps.spreadsheet' },
      csvData,
      'text/csv'
    ),
  });
  return res.json();
}

function createMultipartBody(metadata: object, content: string, contentType: string): FormData {
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: contentType }));
  return form;
}
```

**Step 2: Build export API route**

Handles format dispatch: PDF (HTML-to-PDF), Google Doc, Google Sheet, Email.

**Step 3: Build ExportMenu component**

Dropdown menu: Google Docs, Google Sheets, PDF, Email to CPA, Generate Visual Card. Each calls `/api/export`.

**Step 4: Commit**

```bash
git add lib/export.ts app/api/export/ components/ExportMenu.tsx
git commit -m "feat: add Google Drive export (Doc, Sheet, PDF) + ExportMenu component"
```

---

### Task 22: NotebookLM + Nano Banana Pro 2 Clients

**Files:**
- Create: `blockwise-ai/lib/notebooklm.ts`
- Create: `blockwise-ai/lib/nano-banana.ts`
- Create: `blockwise-ai/app/api/notebook/route.ts`
- Create: `blockwise-ai/app/api/visual/route.ts`

**Step 1: Build NotebookLM client**

- `createNotebook(title)` — POST to NotebookLM Enterprise API
- `addSources(notebookId, sources[])` — add text/URL sources
- `generateAudioOverview(notebookId)` — trigger audio generation
- Uses `NOTEBOOKLM_API_KEY` or service account auth

**Step 2: Build Nano Banana Pro 2 client**

- `generatePropertyCard(data)` — prompt Gemini 3.1 Flash Image for branded property report card
- `generateNeighborhoodInfographic(report)` — 6-category visual
- Uses `generativelanguage.googleapis.com` endpoint
- Prompt includes Blockwise branding (dark bg, gold accents, text overlays)

**Step 3: Build API routes**

- `/api/notebook` — create notebook + add sources + optional audio
- `/api/visual` — generate visual card via Nano Banana Pro 2

**Step 4: Commit**

```bash
git add lib/notebooklm.ts lib/nano-banana.ts app/api/notebook/ app/api/visual/
git commit -m "feat: add NotebookLM + Nano Banana Pro 2 clients with API routes"
```

---

## Phase 7: Docker + Plug Deployment

### Task 23: Dockerfile + Docker Compose

**Files:**
- Create: `blockwise-ai/Dockerfile`
- Create: `blockwise-ai/docker-compose.yml`

**Step 1: Create Dockerfile**

```dockerfile
# blockwise-ai/Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
```

**Step 2: Create docker-compose.yml**

```yaml
# blockwise-ai/docker-compose.yml
version: '3.8'
services:
  blockwise:
    build: .
    ports:
      - "3100:3000"
    env_file: .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

**Step 3: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Dockerfile + docker-compose for A.I.M.S. Plug deployment"
```

---

### Task 24: CLAUDE.md + .env.example Finalization

**Files:**
- Create: `blockwise-ai/CLAUDE.md`

**Step 1: Create project-specific Claude instructions**

```markdown
# Blockwise AI — Claude Code Project Instructions

## What This Is
Blockwise AI is a standalone neighborhood intelligence and real estate investment platform.
It is a product created BY A.I.M.S. — NOT built into A.I.M.S.

## Architecture
- **Frontend + Backend:** Next.js 14 (App Router) — single deployable unit
- **API Routes:** `app/api/` handles all backend logic (no separate server)
- **Primary LLM:** Mercury 2 (Inception Labs) via OpenAI-compatible SDK
- **Voice:** ElevenLabs Agent SDK + UI components
- **Maps:** Google Maps JavaScript API via @vis.gl/react-google-maps
- **Data Pipeline:** 4 tiers (Google Maps → Brave Search → Firecrawl → Structured APIs)
- **A.I.M.S. Connection:** External APIs (LUC metering, Evidence Locker, SDT)

## Key Files
- `lib/types.ts` — All TypeScript interfaces
- `lib/flip-formulas.ts` — LUC flip calculator (19 formulas)
- `lib/k1-formulas.ts` — K1 tax calculator (10 formulas)
- `lib/neighborhood.ts` — Block Score algorithm
- `lib/mercury.ts` — Mercury 2 LLM client
- `lib/aims-api.ts` — A.I.M.S. API client
- `data/` — Static formula and rate data

## Branding
- All calculator branding is "LUC" — never "Flip Secrets"
- ACHEEVY is the AI assistant name
- Dark theme: #0A0A0F background, gold #D4A843 accents

## Testing
```bash
npm run build    # Build check
npm run lint     # Lint check
```

## Deployment
Deploys as an A.I.M.S. Plug (Docker container):
```bash
docker build -t blockwise-ai .
docker run -p 3100:3000 --env-file .env.local blockwise-ai
```
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add CLAUDE.md project instructions for Blockwise AI"
```

---

### Task 25: Build Verification + Final Assembly

**Step 1: Run build**

Run: `cd blockwise-ai && npm run build`
Expected: Build passes with all 4 routes: `/`, `/analyze`, `/flip`, `/k1`

**Step 2: Run lint**

Run: `cd blockwise-ai && npm run lint`
Expected: No errors

**Step 3: Verify Docker build**

Run: `cd blockwise-ai && docker build -t blockwise-ai .`
Expected: Image builds successfully

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build errors from final assembly"
```

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 — Scaffold | 1-8 | Init Next.js, deps, env, types, formulas, Mercury/AIMS clients, Maps, Brave/Firecrawl |
| 2 — API Routes | 9-10 | Health, chat (Mercury 2), search, analyze with Block Score |
| 3 — Core UI | 11-15 | Providers, PropertyMap, PropertyCard, FilterPanel, ChatPanel, Home page |
| 4 — Neighborhood | 16-17 | BlockScore, CompMap, NeighborhoodGrid, VerdictCard, Analyze page |
| 5 — Flip + K1 | 18-20 | Flip engine + UI, K1 engine + form, Flip + K1 pages |
| 6 — Export/Media | 21-22 | Google Drive export, NotebookLM, Nano Banana Pro 2 |
| 7 — Deploy | 23-25 | Dockerfile, docker-compose, CLAUDE.md, build verification |
