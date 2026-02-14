/**
 * Estate Scout — Neighborhood Intelligence Agent (BlockWise AI)
 *
 * The Scout Boomer_Ang for real estate:
 *   - Scrapes property data from MLS feeds, public records, permit databases
 *   - Calculates Gentrification Score, Investment Opportunity Score, Community Stability Score
 *   - Identifies distressed properties, estate sales, off-market opportunities
 *   - Tracks institutional buyer activity (hedge funds eating up neighborhoods)
 *
 * Voice Interface Example:
 *   User: "Scout, what's happening in West End Atlanta?"
 *   Scout: "West End is heating up. Found 8 properties under $150K..."
 *
 * Data Sources (planned):
 *   - Homesage.ai (ARV, comps, CV analysis)
 *   - Mashvisor (STR/LTR analytics)
 *   - ATTOM Data (158M property records)
 *   - Google Maps (Street View + Earth 3D)
 *   - Brave Search (news, permits, developments)
 *   - Census Bureau (demographics)
 *   - SpotCrime (crime stats)
 *   - GreatSchools (school ratings)
 */

const PORT = Number(process.env.PORT) || 6001;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const HOMESAGE_API_KEY = process.env.HOMESAGE_API_KEY || '';
const MASHVISOR_API_KEY = process.env.MASHVISOR_API_KEY || '';
const ATTOM_API_KEY = process.env.ATTOM_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────

interface PropertyLead {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  listPrice: number;
  estimatedARV: number;
  propertyType: 'single-family' | 'multi-family' | 'townhome' | 'condo' | 'land';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  daysOnMarket: number;
  distressIndicators: string[];
  source: string;
  scoutedAt: string;
}

interface NeighborhoodIntel {
  name: string;
  city: string;
  state: string;
  scores: {
    gentrification: number;        // 1-10: How fast is change happening?
    investmentOpportunity: number;  // 1-10: Deal quality + timing
    communityStability: number;     // 1-10: How vulnerable are residents?
  };
  medianHomePrice: number;
  medianRent: number;
  priceChangeYoY: number;         // percent
  institutionalBuyerShare: number; // percent of recent sales
  newPermitsFiled: number;
  recentSales: number;
  avgDaysOnMarket: number;
  demographics: {
    medianIncome: number;
    ownerOccupied: number;         // percent
    populationGrowth: number;      // percent
  };
  scoutedAt: string;
}

interface ScoutState {
  properties: PropertyLead[];
  neighborhoods: NeighborhoodIntel[];
  totalScans: number;
  lastScanAt: string | null;
}

// ─── State ────────────────────────────────────────────────────────────────

const state: ScoutState = {
  properties: [],
  neighborhoods: [],
  totalScans: 0,
  lastScanAt: null,
};

// ─── Neighborhood Analysis ───────────────────────────────────────────────

async function scoutNeighborhood(neighborhood: string, city: string, state_code: string): Promise<NeighborhoodIntel> {
  const intel: NeighborhoodIntel = {
    name: neighborhood,
    city,
    state: state_code,
    scores: { gentrification: 0, investmentOpportunity: 0, communityStability: 0 },
    medianHomePrice: 0,
    medianRent: 0,
    priceChangeYoY: 0,
    institutionalBuyerShare: 0,
    newPermitsFiled: 0,
    recentSales: 0,
    avgDaysOnMarket: 0,
    demographics: { medianIncome: 0, ownerOccupied: 0, populationGrowth: 0 },
    scoutedAt: new Date().toISOString(),
  };

  // Brave Search for local news + developments
  if (BRAVE_API_KEY) {
    try {
      const query = `${neighborhood} ${city} ${state_code} real estate development 2026`;
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`, {
        headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json() as { web?: { results?: Array<{ title: string; description: string }> } };
        const results = data.web?.results || [];

        // Score based on development activity signals
        const devSignals = results.filter(r =>
          /permit|development|construction|rezoning|gentrification|investment/i.test(r.title + r.description)
        ).length;

        intel.scores.gentrification = Math.min(10, Math.round(devSignals * 1.5) + 3);
        intel.newPermitsFiled = devSignals * 12; // rough estimate
      }
    } catch {
      console.warn(`[EstateScout] Brave search failed for ${neighborhood}`);
    }
  }

  // Without live APIs, generate conservative scores based on search signals
  // In production: Homesage + ATTOM + Mashvisor would provide real data
  intel.scores.investmentOpportunity = Math.max(1, 10 - intel.scores.gentrification + 2);
  intel.scores.communityStability = Math.max(1, 10 - intel.scores.gentrification);

  return intel;
}

// ─── Property Search (Brave-based for MVP) ───────────────────────────────

async function searchProperties(query: string, maxResults: number = 10): Promise<PropertyLead[]> {
  const leads: PropertyLead[] = [];

  if (!BRAVE_API_KEY) {
    console.warn('[EstateScout] No BRAVE_API_KEY — returning empty results');
    return leads;
  }

  try {
    const searchQuery = `${query} for sale distressed fixer-upper`;
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=${maxResults}`, {
      headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json() as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
      // Parse property listings from search results
      // In production: this would hit Homesage/ATTOM APIs directly
      console.log(`[EstateScout] Found ${data.web?.results?.length || 0} search results for: ${query}`);
    }
  } catch {
    console.warn(`[EstateScout] Property search failed for: ${query}`);
  }

  return leads;
}

// ─── Flip Analysis ───────────────────────────────────────────────────────

function analyzeFlip(inputs: {
  purchasePrice: number;
  repairCosts: number;
  arv: number;
  holdingPeriodMonths?: number;
  loanToValue?: number;
  interestRate?: number;
  loanPoints?: number;
  monthlyHoldingCosts?: number;
  contingencyPercent?: number;
}) {
  const {
    purchasePrice, repairCosts, arv,
    holdingPeriodMonths = 6,
    loanToValue = 80,
    interestRate = 12,
    loanPoints = 2,
    monthlyHoldingCosts = 500,
    contingencyPercent = 10,
  } = inputs;

  const contingency = repairCosts * (contingencyPercent / 100);
  const totalRepairs = repairCosts + contingency;
  const purchaseClosing = purchasePrice * 0.02;
  const loanAmount = purchasePrice * (loanToValue / 100);
  const pointsCost = loanAmount * (loanPoints / 100);
  const monthlyInterest = loanAmount * (interestRate / 100 / 12);
  const totalInterest = monthlyInterest * holdingPeriodMonths;
  const totalFinancing = pointsCost + totalInterest;
  const totalHolding = monthlyHoldingCosts * holdingPeriodMonths;
  const saleClosing = arv * 0.03;
  const commission = arv * 0.06;
  const totalSelling = saleClosing + commission;
  const totalInvestment = purchasePrice + purchaseClosing + totalRepairs;
  const cashRequired = (totalInvestment - loanAmount) + totalFinancing + totalHolding;
  const totalCosts = totalInvestment + totalFinancing + totalHolding + totalSelling;
  const profit = arv - totalCosts;
  const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
  const maxOffer = (arv * 0.70) - totalRepairs;
  const dealStatus = roi >= 20 ? 'Excellent' : roi >= 15 ? 'Good' : roi >= 10 ? 'Marginal' : 'Pass';

  return {
    loanAmount,
    totalRepairs,
    totalFinancing,
    totalHolding,
    totalSelling,
    totalInvestment,
    cashRequired,
    totalCosts,
    profit,
    roi: Math.round(roi * 10) / 10,
    maxOffer,
    dealStatus,
    monthlyCarry: monthlyInterest + monthlyHoldingCosts,
    // Rental hold analysis
    rentalEstimate: {
      monthlyRent: Math.round(arv * 0.008),
      annualNOI: Math.round(arv * 0.008 * 12 * 0.6),
      capRate: totalInvestment > 0 ? Math.round(((arv * 0.008 * 12 * 0.6) / totalInvestment) * 1000) / 10 : 0,
    },
  };
}

// ─── HTTP Server ────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const headers = { 'Content-Type': 'application/json' };

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'estate-scout',
        totalScans: state.totalScans,
        propertiesFound: state.properties.length,
        neighborhoodsAnalyzed: state.neighborhoods.length,
        integrations: {
          brave: !!BRAVE_API_KEY,
          homesage: !!HOMESAGE_API_KEY,
          mashvisor: !!MASHVISOR_API_KEY,
          attom: !!ATTOM_API_KEY,
        },
        uptime: process.uptime(),
      }), { headers });
    }

    // Scout a neighborhood
    if (url.pathname === '/api/scout-neighborhood' && req.method === 'POST') {
      const body = await req.json() as { neighborhood: string; city: string; state: string };
      const intel = await scoutNeighborhood(body.neighborhood, body.city, body.state);
      state.neighborhoods.push(intel);
      state.totalScans++;
      state.lastScanAt = new Date().toISOString();
      return new Response(JSON.stringify(intel), { headers });
    }

    // Search properties
    if (url.pathname === '/api/search' && req.method === 'POST') {
      const body = await req.json() as { query: string; maxResults?: number };
      const leads = await searchProperties(body.query, body.maxResults);
      state.properties.push(...leads);
      state.totalScans++;
      state.lastScanAt = new Date().toISOString();
      return new Response(JSON.stringify({ leads, total: leads.length }), { headers });
    }

    // Analyze a flip deal
    if (url.pathname === '/api/analyze-flip' && req.method === 'POST') {
      const body = await req.json() as Parameters<typeof analyzeFlip>[0];
      const analysis = analyzeFlip(body);
      return new Response(JSON.stringify(analysis), { headers });
    }

    // Status
    if (url.pathname === '/api/status') {
      return new Response(JSON.stringify({
        service: 'estate-scout',
        version: '1.0.0',
        state: {
          totalScans: state.totalScans,
          propertiesFound: state.properties.length,
          neighborhoodsAnalyzed: state.neighborhoods.length,
          lastScanAt: state.lastScanAt,
        },
      }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  },
});

console.log(`[EstateScout] BlockWise AI Scout running on port ${PORT}`);
console.log(`[EstateScout] Brave: ${BRAVE_API_KEY ? 'configured' : 'NOT configured'}`);
console.log(`[EstateScout] Homesage: ${HOMESAGE_API_KEY ? 'configured' : 'NOT configured'}`);
console.log(`[EstateScout] Mashvisor: ${MASHVISOR_API_KEY ? 'configured' : 'NOT configured'}`);
console.log(`[EstateScout] ATTOM: ${ATTOM_API_KEY ? 'configured' : 'NOT configured'}`);
