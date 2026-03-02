// Blockwise AI — Type Definitions

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
