# Blockwise AI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a neighborhood intelligence and real estate investment platform with property search, deep analysis, LUC flip calculator, and K1 tax generator — all integrated into the A.I.M.S. dashboard with ACHEEVY voice chat.

**Architecture:** Integrated frontend (Next.js 14 App Router) with backend API routes in UEF Gateway (Express). Google Maps for geospatial rendering. 4-tier data pipeline (Google Maps → Brave Search → Firecrawl → Structured APIs). LUC preset engine for flip calculations. Paperform + C1 Thesys for K1 intake/review. NotebookLM for audio/research. Nano Banana Pro 2 for visual content.

**Tech Stack:** Next.js 14, TypeScript, @vis.gl/react-google-maps, Framer Motion, Express, LUC Preset Engine, Mercury 2 (Inception Labs — primary conversation LLM, OpenAI-compatible, 1,000 tok/sec), Google Drive/Docs/Sheets API, NotebookLM Enterprise API, Gemini 3.1 Flash Image (Nano Banana Pro 2), ElevenLabs Agent SDK, Paperform, C1 Thesys

**Design Doc:** `docs/plans/2026-03-01-blockwise-ai-design.md`

---

## Phase 1: Foundation (Types, API Clients, Maps Setup)

### Task 1: Blockwise Type Definitions

**Files:**
- Create: `frontend/lib/blockwise/types.ts`

**Step 1: Create type definitions**

```typescript
// frontend/lib/blockwise/types.ts

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
  bounds?: google.maps.LatLngBoundsLiteral;
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
```

**Step 2: Commit**

```bash
git add frontend/lib/blockwise/types.ts
git commit -m "feat(blockwise): add type definitions for property, neighborhood, flip, K1"
```

---

### Task 2: Install Google Maps Library

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install @vis.gl/react-google-maps**

Run: `cd frontend && npm install @vis.gl/react-google-maps`

This is the official Google-maintained React wrapper. It provides `<APIProvider>`, `<Map>`, `<AdvancedMarker>`, `<InfoWindow>` components.

**Step 2: Verify package.json updated**

Run: `grep "react-google-maps" frontend/package.json`
Expected: `"@vis.gl/react-google-maps": "^1.x.x"`

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add @vis.gl/react-google-maps for Blockwise property map"
```

---

### Task 3: Google Maps Client Library

**Files:**
- Create: `frontend/lib/blockwise/google-maps.ts`

**Step 1: Create Maps utility functions**

```typescript
// frontend/lib/blockwise/google-maps.ts

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

/**
 * Geocode an address to lat/lng
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  }
  return null;
}

/**
 * Get Street View thumbnail URL for a location
 */
export function getStreetViewUrl(lat: number, lng: number, width = 400, height = 250): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&key=${MAPS_KEY}`;
}

/**
 * Get elevation for flood risk assessment
 */
export async function getElevation(lat: number, lng: number): Promise<number | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${MAPS_KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    return data.results[0].elevation;
  }
  return null;
}

/**
 * Search nearby places (schools, grocery, transit)
 */
export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radiusMeters = 2000
): Promise<google.maps.places.PlaceResult[]> {
  // This runs client-side using the Maps JavaScript API
  // Called from within a component that has the API loaded
  return [];
}

/**
 * Calculate distance between two points in miles
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth radius in miles
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
git add frontend/lib/blockwise/google-maps.ts
git commit -m "feat(blockwise): add Google Maps client utilities (geocode, street view, elevation)"
```

---

### Task 4: Backend Blockwise Router + Aggregator Skeleton

**Files:**
- Create: `backend/uef-gateway/src/blockwise/router.ts`
- Create: `backend/uef-gateway/src/blockwise/aggregator.ts`
- Modify: `backend/uef-gateway/src/index.ts` (register routes)

**Step 1: Create the Blockwise router**

```typescript
// backend/uef-gateway/src/blockwise/router.ts

import { Router } from 'express';
import { BlockwiseAggregator } from './aggregator';

const router = Router();
const aggregator = new BlockwiseAggregator();

// Search properties by location + filters
router.post('/blockwise/search', async (req, res) => {
  try {
    const { location, filters } = req.body;
    const results = await aggregator.searchProperties(location, filters);
    res.json(results);
  } catch (err) {
    console.error('[blockwise/search]', err);
    res.status(500).json({ error: 'Property search failed' });
  }
});

// Analyze a specific property — full neighborhood report
router.post('/blockwise/analyze', async (req, res) => {
  try {
    const { address, lat, lng, radiusMiles, compPeriodMonths } = req.body;
    const report = await aggregator.analyzeNeighborhood(address, lat, lng, radiusMiles, compPeriodMonths);
    res.json(report);
  } catch (err) {
    console.error('[blockwise/analyze]', err);
    res.status(500).json({ error: 'Neighborhood analysis failed' });
  }
});

// Export to Google Docs/Sheets/PDF
router.post('/blockwise/export', async (req, res) => {
  try {
    const { format, title, data, recipientEmail } = req.body;
    const result = await aggregator.exportDocument(format, title, data, recipientEmail);
    res.json(result);
  } catch (err) {
    console.error('[blockwise/export]', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Create NotebookLM research notebook
router.post('/blockwise/notebook', async (req, res) => {
  try {
    const { propertyAddress, sources, generateAudio } = req.body;
    const result = await aggregator.createNotebook(propertyAddress, sources, generateAudio);
    res.json(result);
  } catch (err) {
    console.error('[blockwise/notebook]', err);
    res.status(500).json({ error: 'NotebookLM creation failed' });
  }
});

// Generate visual card via Nano Banana Pro 2
router.post('/blockwise/visual', async (req, res) => {
  try {
    const { type, data } = req.body;
    const result = await aggregator.generateVisual(type, data);
    res.json(result);
  } catch (err) {
    console.error('[blockwise/visual]', err);
    res.status(500).json({ error: 'Visual generation failed' });
  }
});

// Paperform webhook handler for K1 submissions
router.post('/blockwise/k1-webhook', async (req, res) => {
  try {
    const submission = req.body;
    const result = await aggregator.processK1Submission(submission);
    res.json(result);
  } catch (err) {
    console.error('[blockwise/k1-webhook]', err);
    res.status(500).json({ error: 'K1 processing failed' });
  }
});

export { router as blockwiseRouter };
```

**Step 2: Create the aggregator skeleton**

```typescript
// backend/uef-gateway/src/blockwise/aggregator.ts

import type { SearchResult, NeighborhoodReport, NotebookResult } from './types';

/**
 * BlockwiseAggregator
 *
 * Orchestrates the 4-tier data pipeline:
 * Tier 1: Google Maps APIs
 * Tier 2: Brave Search
 * Tier 3: Firecrawl
 * Tier 4: Structured APIs (ATTOM, Mashvisor, etc.)
 *
 * Fallback chain: Tier 4 → Tier 3 → Tier 2
 */
export class BlockwiseAggregator {

  async searchProperties(location: string, filters: Record<string, unknown>): Promise<SearchResult> {
    // Phase 2 implementation: Google Places + Brave Search
    return { properties: [], total: 0, center: { lat: 0, lng: 0 }, radius: 5 };
  }

  async analyzeNeighborhood(
    address: string,
    lat: number,
    lng: number,
    radiusMiles = 0.5,
    compPeriodMonths = 6
  ): Promise<NeighborhoodReport> {
    // Phase 3 implementation: Full 4-tier pipeline
    throw new Error('Not implemented — Phase 3');
  }

  async exportDocument(
    format: string,
    title: string,
    data: unknown,
    recipientEmail?: string
  ): Promise<{ url?: string; sent?: boolean }> {
    // Phase 5 implementation: Google Drive API
    throw new Error('Not implemented — Phase 5');
  }

  async createNotebook(
    propertyAddress: string,
    sources: Array<{ type: string; title: string; content: string }>,
    generateAudio: boolean
  ): Promise<NotebookResult> {
    // Phase 5 implementation: NotebookLM Enterprise API
    throw new Error('Not implemented — Phase 5');
  }

  async generateVisual(type: string, data: unknown): Promise<{ imageUrl: string }> {
    // Phase 5 implementation: Nano Banana Pro 2
    throw new Error('Not implemented — Phase 5');
  }

  async processK1Submission(submission: Record<string, unknown>): Promise<{ k1Id: string; status: string }> {
    // Phase 4 implementation: K1 formula engine
    throw new Error('Not implemented — Phase 4');
  }
}
```

**Step 3: Register the router in the gateway**

In `backend/uef-gateway/src/index.ts`, add after existing router imports:

```typescript
import { blockwiseRouter } from './blockwise/router';
```

And after existing `app.use()` calls:

```typescript
app.use(blockwiseRouter);
```

**Step 4: Commit**

```bash
git add backend/uef-gateway/src/blockwise/router.ts backend/uef-gateway/src/blockwise/aggregator.ts backend/uef-gateway/src/index.ts
git commit -m "feat(blockwise): add backend router + aggregator skeleton with 6 endpoints"
```

---

## Phase 2: Property Search & Map (Module 1)

### Task 5: PropertyMap Component (Google Maps Canvas)

**Files:**
- Create: `frontend/components/blockwise/PropertyMap.tsx`

**Context:**
- Uses `@vis.gl/react-google-maps` installed in Task 2
- A.I.M.S. dark theme: `bg-obsidian` (#0A0A0F), gold accents (#D4A843)
- Read design doc Section 3 for layout specs
- Read `frontend/components/chat/ChatInterface.tsx` for Framer Motion patterns

**Step 1: Build the map component**

Create `PropertyMap.tsx` with:
- `<APIProvider>` wrapper with `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- `<Map>` with dark-styled map (mapId for cloud styling, or inline styles)
- `<AdvancedMarker>` for each property pin
- Custom pin content showing price or ROI estimate
- `<InfoWindow>` on pin click showing PropertyCard
- `onBoundsChanged` callback to update visible area
- Gold (#D4A843) for selected pins, zinc for unselected
- Props: `properties: Property[]`, `selectedId: string | null`, `onSelect: (id: string) => void`, `onBoundsChange: (bounds: LatLngBounds) => void`

**Step 2: Commit**

```bash
git add frontend/components/blockwise/PropertyMap.tsx
git commit -m "feat(blockwise): add PropertyMap component with Google Maps + dark theme pins"
```

---

### Task 6: PropertyCard Component

**Files:**
- Create: `frontend/components/blockwise/PropertyCard.tsx`

**Step 1: Build the property detail card**

Create `PropertyCard.tsx` with:
- Street View thumbnail via `getStreetViewUrl()`
- Property details: price, beds/baths, sqft, year built
- Estimated ARV and ROI (if available)
- Deal Status badge (color-coded: green/gold/orange/red)
- Action buttons: [Analyze] [Flip Calc] [Save]
- Glass card styling: `bg-surface/60 backdrop-blur-xl border border-white/10 rounded-xl`
- Framer Motion `motion.div` with fade-in

**Step 2: Commit**

```bash
git add frontend/components/blockwise/PropertyCard.tsx
git commit -m "feat(blockwise): add PropertyCard with street view, deal status, action buttons"
```

---

### Task 7: FilterPanel Component

**Files:**
- Create: `frontend/components/blockwise/FilterPanel.tsx`

**Step 1: Build the filter sidebar**

Create `FilterPanel.tsx` with:
- Location search input (text → geocode on enter)
- Price Range (min/max number inputs)
- Property Type checkboxes (single family, multi, condo, townhouse, land, commercial)
- Bedrooms minimum (1-5+ buttons)
- ARV Range (min/max — the investor filter Redfin doesn't have)
- Deal Status checkboxes (Excellent, Good, Marginal, Pass)
- [Search] button that calls `onFilterChange(filters: PropertyFilters)`
- Dark glass styling matching ChatInterface patterns
- Collapsible sections with chevron toggles

**Step 2: Commit**

```bash
git add frontend/components/blockwise/FilterPanel.tsx
git commit -m "feat(blockwise): add FilterPanel with investor-grade filters (ARV, deal status)"
```

---

### Task 8: BlockwiseChatPanel Component

**Files:**
- Create: `frontend/components/blockwise/BlockwiseChatPanel.tsx`

**Context:**
- Adapted from `FloatingACHEEVY.tsx` but as a side panel, not floating
- Includes ElevenLabs Agent SDK voice (pattern from `ChatInterface.tsx` lines 610-630)
- Context-aware: receives `selectedProperty` prop

**Step 1: Build the chat panel**

Create `BlockwiseChatPanel.tsx` with:
- Right-side collapsible panel (width: 320px desktop, full-width mobile overlay)
- Message list with auto-scroll
- Input bar with text + mic button
- ElevenLabs `useConversation` hook for voice
- Voice status indicator (speaking/listening)
- `selectedProperty: Property | null` prop — when set, ACHEEVY knows context
- Auto-suggestion when pin clicked: "I see you're looking at {address}. Want me to run a full analysis?"
- Rich card rendering for neighborhood scores and flip results
- Toggle button (chevron) to collapse/expand

**Step 2: Commit**

```bash
git add frontend/components/blockwise/BlockwiseChatPanel.tsx
git commit -m "feat(blockwise): add ACHEEVY chat panel with ElevenLabs voice + property context"
```

---

### Task 9: Blockwise Search Page (Module 1 Assembly)

**Files:**
- Create: `frontend/app/dashboard/blockwise/page.tsx`
- Create: `frontend/app/dashboard/blockwise/layout.tsx`

**Step 1: Create the layout wrapper**

```typescript
// frontend/app/dashboard/blockwise/layout.tsx
export default function BlockwiseLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[calc(100vh-64px)] overflow-hidden bg-obsidian">{children}</div>;
}
```

**Step 2: Assemble the search page**

Create `page.tsx` that composes:
- `FilterPanel` (left column)
- `PropertyMap` (center)
- `BlockwiseChatPanel` (right column)
- Results list below filter panel (scrollable)
- State management: `filters`, `properties`, `selectedProperty`, `chatOpen`
- API call to `/api/blockwise/search` on filter change
- Three-column responsive grid (filter: 280px | map: flex | chat: 320px)

**Step 3: Add to DashboardNav**

In `frontend/components/DashboardNav.tsx`, add Blockwise link:
```typescript
{ name: 'Blockwise', href: '/dashboard/blockwise', icon: '🏘️' }
```

**Step 4: Run build check**

Run: `cd frontend && npm run build`
Expected: Build passes with new `/dashboard/blockwise` route

**Step 5: Commit**

```bash
git add frontend/app/dashboard/blockwise/ frontend/components/DashboardNav.tsx
git commit -m "feat(blockwise): assemble property search page with map, filters, ACHEEVY chat"
```

---

## Phase 3: Neighborhood Intel (Module 2)

### Task 10: Block Score Algorithm

**Files:**
- Create: `frontend/lib/blockwise/neighborhood.ts`

**Step 1: Implement the Block Score calculator**

Create `neighborhood.ts` with:
- `calculateBlockScore(data: NeighborhoodData): BlockScore` — weighted algorithm
  - Schools: 20% — `(avgSchoolRating / 10) * 100`
  - Safety: 20% — inverse crime normalized to 0-100 + YoY bonus
  - Appreciation: 25% — 1yr growth normalized (15%+ = 100, 0% = 50, negative = 0-50)
  - Livability: 20% — `(walkScore * 0.5 + transitScore * 0.3 + bikeScore * 0.2)`
  - Development: 15% — permit activity score + gentrification signal
- `getVerdict(score: number): VerdictLevel`
  - 80+ → `strong_buy`
  - 60-79 → `worth_investigating`
  - 40-59 → `proceed_with_caution`
  - Below 40 → `walk_away`
- `generateVerdictText(report: NeighborhoodReport): string` — AI-style plain English summary

**Step 2: Commit**

```bash
git add frontend/lib/blockwise/neighborhood.ts
git commit -m "feat(blockwise): add Block Score algorithm (0-100) with 5-category weighting"
```

---

### Task 11: Aggregator Data Fetching (Tier 1 + 2)

**Files:**
- Create: `backend/uef-gateway/src/blockwise/brave-search.ts`
- Create: `backend/uef-gateway/src/blockwise/google-maps.ts`
- Modify: `backend/uef-gateway/src/blockwise/aggregator.ts`

**Step 1: Brave Search client**

Create `brave-search.ts` with:
- `searchBrave(query: string): Promise<BraveResult[]>` using `BRAVE_API_KEY`
- `searchPropertyRecords(address: string)` — tax + deed
- `searchCrimeStats(neighborhood: string, zip: string)` — safety data
- `searchBuildingPermits(zip: string)` — development intel
- `searchComps(address: string)` — recent sales
- LUC metering: each call increments `BRAVE_QUERIES`

**Step 2: Server-side Google Maps client**

Create `google-maps.ts` with:
- `geocode(address: string)` — lat/lng resolution
- `nearbyPlaces(lat, lng, type, radius)` — schools, grocery, transit
- `elevation(lat, lng)` — flood risk
- All use `GOOGLE_MAPS_SERVER_KEY` (server-side, not public key)

**Step 3: Wire aggregator**

Update `aggregator.ts` `searchProperties()` and `analyzeNeighborhood()` to call Brave + Google Maps, assemble partial `NeighborhoodReport`.

**Step 4: Commit**

```bash
git add backend/uef-gateway/src/blockwise/
git commit -m "feat(blockwise): add Brave Search + Google Maps server clients, wire aggregator"
```

---

### Task 12: Neighborhood Intel Components

**Files:**
- Create: `frontend/components/blockwise/BlockScoreCard.tsx`
- Create: `frontend/components/blockwise/CompMap.tsx`
- Create: `frontend/components/blockwise/NeighborhoodGrid.tsx`
- Create: `frontend/components/blockwise/VerdictCard.tsx`

**Step 1: Build BlockScoreCard**

5 mini-cards in a row showing each score category with the overall Block Score as the hero number. Color-coded (green 80+, gold 60-79, orange 40-59, red below 40).

**Step 2: Build CompMap**

Google Map showing subject property (gold pin) + comps (blue pins) with price labels. Radius selector dropdown (0.25mi, 0.5mi, 1mi). Period selector (3mo, 6mo, 12mo).

**Step 3: Build NeighborhoodGrid**

2x3 grid of glass cards: Schools, Safety, Demographics, Appreciation, Walkability, Development. Each card shows key stats from the `NeighborhoodReport`.

**Step 4: Build VerdictCard**

ACHEEVY verdict banner: colored badge (green/gold/orange/red) + verdict text + action buttons [Run Flip Calculator →] [Generate K1 →] [Export PDF].

**Step 5: Commit**

```bash
git add frontend/components/blockwise/BlockScoreCard.tsx frontend/components/blockwise/CompMap.tsx frontend/components/blockwise/NeighborhoodGrid.tsx frontend/components/blockwise/VerdictCard.tsx
git commit -m "feat(blockwise): add neighborhood intel components (Block Score, comps, grid, verdict)"
```

---

### Task 13: Analyze Page Assembly

**Files:**
- Create: `frontend/app/dashboard/blockwise/analyze/page.tsx`

**Step 1: Assemble the analyze page**

Compose: back button, property header, BlockScoreCard row, CompMap, comps table, NeighborhoodGrid (2x3), VerdictCard, ACHEEVY chat panel on right.

Receives address via URL search params: `/dashboard/blockwise/analyze?address=123+Main+St&lat=30.27&lng=-97.74`

Fetches data from `/api/blockwise/analyze` on mount.

**Step 2: Run build check**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/app/dashboard/blockwise/analyze/
git commit -m "feat(blockwise): assemble neighborhood analysis page with all intel components"
```

---

## Phase 4: LUC Flip Calculator + K1 (Modules 3 & 4)

### Task 14: K1 Tax Formulas Preset

**Files:**
- Create: `aims-tools/luc/presets/real-estate-flip/k1-formulas.json`

**Step 1: Create K1 formula definitions**

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
      "description": "Sum of all deductible expenses",
      "inputs": ["depreciationBuilding", "propertyTaxDeduction", "mortgageInterestDeduction", "insuranceCost", "repairCosts"],
      "expression": "depreciationBuilding + propertyTaxDeduction + mortgageInterestDeduction + insuranceCost + repairCosts",
      "outputType": "currency"
    },
    {
      "id": "taxableIncome",
      "name": "Taxable Income",
      "description": "Flip profit minus deductions",
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
      "description": "Taxable income times marginal rate",
      "inputs": ["taxableIncome", "federalTaxBracket"],
      "expression": "taxableIncome * federalTaxBracket",
      "outputType": "currency"
    },
    {
      "id": "totalTax",
      "name": "Total Tax Liability",
      "description": "Federal + state + self-employment",
      "inputs": ["federalTax", "stateTax", "selfEmploymentTax"],
      "expression": "federalTax + stateTax + selfEmploymentTax",
      "outputType": "currency"
    },
    {
      "id": "netAfterTax",
      "name": "Net After-Tax Profit",
      "description": "Flip profit minus all taxes",
      "inputs": ["flipProfit", "totalTax"],
      "expression": "flipProfit - totalTax",
      "outputType": "currency"
    },
    {
      "id": "effectiveRate",
      "name": "Effective Tax Rate",
      "description": "Total tax as percentage of flip profit",
      "inputs": ["totalTax", "flipProfit"],
      "expression": "flipProfit > 0 ? (totalTax / flipProfit) * 100 : 0",
      "outputType": "percentage"
    }
  ]
}
```

**Step 2: Commit**

```bash
git add aims-tools/luc/presets/real-estate-flip/k1-formulas.json
git commit -m "feat(blockwise): add K1 tax formula preset (10 formulas: depreciation, SE tax, brackets)"
```

---

### Task 15: K1 Formula Engine (Frontend)

**Files:**
- Create: `frontend/lib/blockwise/k1-formulas.ts`

**Step 1: Create the K1 calculation engine**

```typescript
// frontend/lib/blockwise/k1-formulas.ts

import type { K1Inputs, K1Outputs } from './types';

// State income tax rates (simplified — top marginal rates)
const STATE_TAX_RATES: Record<string, number> = {
  TX: 0, FL: 0, NV: 0, WA: 0, WY: 0, SD: 0, TN: 0, AK: 0, NH: 0,
  CA: 0.133, NY: 0.109, NJ: 0.1075, OR: 0.099, MN: 0.0985,
  // ... add remaining states
  DEFAULT: 0.05,
};

export function calculateK1(inputs: K1Inputs): K1Outputs {
  const stateRate = STATE_TAX_RATES[inputs.state] ?? STATE_TAX_RATES.DEFAULT;
  const capitalGainType = inputs.holdingDays >= 365 ? 'long_term' : 'short_term';

  const depreciation = (inputs.purchasePrice - inputs.landValue) / 27.5 * (inputs.holdingPeriodMonths / 12);
  const totalDeductions = depreciation + inputs.propertyTaxDeduction + inputs.mortgageInterestDeduction + inputs.insuranceCost + inputs.repairCosts;
  const taxableIncome = Math.max(inputs.flipProfit - totalDeductions, 0);

  const selfEmploymentTax = inputs.materialParticipation ? taxableIncome * 0.9235 * 0.153 : 0;

  // 2025 brackets (single — simplified)
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

**Step 2: Commit**

```bash
git add frontend/lib/blockwise/k1-formulas.ts
git commit -m "feat(blockwise): add K1 tax calculation engine with state rates + federal brackets"
```

---

### Task 16: FlipCalculator Component

**Files:**
- Create: `frontend/components/blockwise/FlipCalculator.tsx`
- Create: `frontend/components/blockwise/SensitivityTable.tsx`
- Create: `frontend/components/blockwise/OpmCard.tsx`

**Step 1: Build FlipCalculator**

Two-column layout. Left: input sections (Property, Acquisition, Financing, Holding, Selling). Right: Deal Verdict card, Cost Breakdown stacked bars, SensitivityTable, OpmCard.

Uses LUC preset engine formulas from `aims-tools/luc/presets/real-estate-flip/formulas.json`. Auto-fill indicators (robot icon) on fields populated from Blockwise analysis.

**Step 2: Build SensitivityTable**

Table with 5 rows: ARV -$20K, -$10K, baseline, +$10K, +$20K. Each row shows profit and ROI. Baseline row highlighted in gold.

**Step 3: Build OpmCard**

Glass card showing: Your Cash In, HML Covers, Points + Interest, Total Out-of-Pocket. Plain English summary at bottom.

**Step 4: Commit**

```bash
git add frontend/components/blockwise/FlipCalculator.tsx frontend/components/blockwise/SensitivityTable.tsx frontend/components/blockwise/OpmCard.tsx
git commit -m "feat(blockwise): add LUC flip calculator with sensitivity analysis + OPM breakdown"
```

---

### Task 17: Flip Page + K1 Page Assembly

**Files:**
- Create: `frontend/app/dashboard/blockwise/flip/page.tsx`
- Create: `frontend/app/dashboard/blockwise/k1/page.tsx`
- Create: `frontend/components/blockwise/K1Form.tsx`

**Step 1: Build flip page**

Compose FlipCalculator with ACHEEVY chat panel. Receives property data via URL params or from Blockwise context (React context or URL state).

**Step 2: Build K1Form component**

Entity type selector, filing status, state dropdown, income section (auto-filled from flip), deductions section (auto-filled from flip + county data), tax impact summary cards (federal, state, SE tax), K1 document preview, action buttons [Download PDF] [Export to Google Docs] [Email to CPA] [Save to Evidence Locker].

Paperform iframe embed for full intake, or native form for quick K1 from flip data.

**Step 3: Build K1 page**

Compose K1Form with ACHEEVY chat panel. Pre-populates from flip data if coming from `/flip` page.

**Step 4: Run build check**

Run: `cd frontend && npm run build`

**Step 5: Commit**

```bash
git add frontend/app/dashboard/blockwise/flip/ frontend/app/dashboard/blockwise/k1/ frontend/components/blockwise/K1Form.tsx
git commit -m "feat(blockwise): add flip calculator page + K1 tax generator page with form"
```

---

## Phase 5: Export, NotebookLM, Nano Banana Pro 2

### Task 18: Google Drive Export Client

**Files:**
- Create: `backend/uef-gateway/src/blockwise/export.ts`

**Step 1: Build the export module**

Create `export.ts` with:
- `exportToGoogleDoc(title, htmlContent, accessToken)` — Drive API `files.create` with `mimeType: application/vnd.google-apps.document` and HTML upload
- `exportToGoogleSheet(title, csvData, accessToken)` — Drive API with spreadsheet mime type
- `exportToPdf(title, htmlContent)` — server-side HTML-to-PDF (use puppeteer or @react-pdf/renderer)
- `sendEmail(to, subject, body, attachments)` — Nodemailer with SDT link

**Step 2: Commit**

```bash
git add backend/uef-gateway/src/blockwise/export.ts
git commit -m "feat(blockwise): add Google Drive export (Doc, Sheet, PDF, email)"
```

---

### Task 19: NotebookLM Client

**Files:**
- Create: `backend/uef-gateway/src/blockwise/notebooklm.ts`

**Step 1: Build the NotebookLM client**

Create `notebooklm.ts` with:
- `createNotebook(title)` — `POST` to NotebookLM Enterprise API `notebooks.create`
- `addSources(notebookId, sources[])` — add text/URL sources to notebook
- `generateAudioOverview(notebookId)` — trigger audio overview generation
- `getNotebookStatus(notebookId)` — poll for ready state
- Uses `GOOGLE_APPLICATION_CREDENTIALS` for auth (service account)

**Step 2: Commit**

```bash
git add backend/uef-gateway/src/blockwise/notebooklm.ts
git commit -m "feat(blockwise): add NotebookLM Enterprise API client (notebooks, sources, audio)"
```

---

### Task 20: Nano Banana Pro 2 Visual Client

**Files:**
- Create: `backend/uef-gateway/src/blockwise/nano-banana.ts`

**Step 1: Build the visual generation client**

Create `nano-banana.ts` with:
- `generatePropertyCard(data: PropertyCardData)` — prompt Gemini 3.1 Flash Image to generate branded property report card with Block Score, ARV, ROI, deal verdict
- `generateNeighborhoodInfographic(report: NeighborhoodReport)` — 6-category visual summary
- Uses `generativelanguage.googleapis.com` endpoint (already enabled)
- Prompt template includes A.I.M.S. branding instructions (dark bg, gold accents, precise text)
- Returns base64 image or URL

**Step 2: Commit**

```bash
git add backend/uef-gateway/src/blockwise/nano-banana.ts
git commit -m "feat(blockwise): add Nano Banana Pro 2 visual generator for property cards"
```

---

### Task 21: ExportMenu Frontend Component

**Files:**
- Create: `frontend/components/blockwise/ExportMenu.tsx`

**Step 1: Build the export dropdown**

Dropdown menu with options: Google Docs, Google Sheets, PDF, Email to CPA, NotebookLM, Generate Visual Card. Each option calls the corresponding `/api/blockwise/export` or `/api/blockwise/notebook` or `/api/blockwise/visual` endpoint.

**Step 2: Commit**

```bash
git add frontend/components/blockwise/ExportMenu.tsx
git commit -m "feat(blockwise): add ExportMenu with Google Docs/Sheets/PDF/NotebookLM/visual options"
```

---

## Phase 6: Firecrawl + Tier 4 API Integration

### Task 22: Firecrawl Scraping Client

**Files:**
- Create: `backend/uef-gateway/src/blockwise/firecrawl.ts`

**Step 1: Build the Firecrawl client**

Create `firecrawl.ts` with:
- `scrapeUrl(url, prompt)` — generic Firecrawl scrape with extraction prompt
- `scrapeCountyAssessor(county, address)` — tax assessed values
- `scrapeGreatSchools(zip)` — school ratings
- `scrapeCrimeData(neighborhood)` — crime statistics
- `scrapeWalkScore(address)` — walkability breakdown
- `scrapeCensus(zip)` — demographics
- Uses `FIRECRAWL_API_KEY` env var
- LUC metering: each scrape increments `API_CALLS`

**Step 2: Wire into aggregator**

Update `aggregator.ts` to use Firecrawl as Tier 3 fallback.

**Step 3: Commit**

```bash
git add backend/uef-gateway/src/blockwise/firecrawl.ts backend/uef-gateway/src/blockwise/aggregator.ts
git commit -m "feat(blockwise): add Firecrawl scraping client (county, schools, crime, census)"
```

---

### Task 23: Enable Missing GCP APIs

**Step 1: Enable required APIs**

Run:
```bash
gcloud services enable \
  docs.googleapis.com \
  drive.googleapis.com \
  sheets.googleapis.com \
  --project=aims-aimanagedsolutions
```

For NotebookLM Enterprise, check:
```bash
gcloud services enable notebooklm.googleapis.com --project=aims-aimanagedsolutions
```

(API name may differ — check GCP console if command fails.)

**Step 2: Verify**

Run: `gcloud services list --enabled --project=aims-aimanagedsolutions | grep -E "docs|drive|sheets|notebook"`

**Step 3: Commit** (no code changes — infrastructure step)

---

## Phase 7: Final Assembly + Build Verification

### Task 24: Frontend API Routes (Proxy to Gateway)

**Files:**
- Create: `frontend/app/api/blockwise/[...path]/route.ts`

**Step 1: Create the catch-all proxy**

```typescript
// frontend/app/api/blockwise/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.UEF_GATEWAY_URL || 'http://localhost:3001';

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const body = await req.json();
  const res = await fetch(`${GATEWAY_URL}/blockwise/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const res = await fetch(`${GATEWAY_URL}/blockwise/${path}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

**Step 2: Commit**

```bash
git add frontend/app/api/blockwise/
git commit -m "feat(blockwise): add frontend API proxy routes to UEF Gateway"
```

---

### Task 25: Build Verification + Final Commit

**Step 1: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build passes with all 4 Blockwise routes

**Step 2: Run backend build (if applicable)**

Run: `cd backend/uef-gateway && npm run build`
Expected: TypeScript compiles without errors

**Step 3: Verify all routes exist**

Check build output for:
- `/dashboard/blockwise` (search & map)
- `/dashboard/blockwise/analyze` (neighborhood intel)
- `/dashboard/blockwise/flip` (LUC calculator)
- `/dashboard/blockwise/k1` (K1 generator)

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(blockwise): resolve build errors from final assembly"
```

**Step 5: Push and create PR**

```bash
git push origin perf/voice-hooks-luc-io-vercel-cleanup
```

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 — Foundation | 1-4 | Types, Maps library, Maps client, Backend router/aggregator |
| 2 — Search & Map | 5-9 | PropertyMap, PropertyCard, FilterPanel, ChatPanel, Search page |
| 3 — Neighborhood | 10-13 | Block Score algo, Brave+Maps clients, Intel components, Analyze page |
| 4 — Flip + K1 | 14-17 | K1 formulas preset, K1 engine, FlipCalculator, Flip+K1 pages |
| 5 — Export/Media | 18-21 | Google Drive, NotebookLM, Nano Banana, ExportMenu |
| 6 — Deep Data | 22-23 | Firecrawl client, GCP API enablement |
| 7 — Final | 24-25 | API proxy routes, build verification |
