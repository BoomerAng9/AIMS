/**
 * Per|Form — NCAA Module Types
 *
 * Types for Coaching Carousel, Transfer Portal, NIL Tracker, and School Revenue Budget.
 */

// ─────────────────────────────────────────────────────────────
// Coaching Carousel
// ─────────────────────────────────────────────────────────────

export type CoachChangeType = 'HIRED' | 'FIRED' | 'RESIGNED' | 'RETIRED' | 'INTERIM';

export interface CoachingChange {
  id: string;
  coachName: string;
  previousRole?: string;
  newRole?: string;
  previousTeam?: { id: string; schoolName: string; commonName: string; abbreviation: string };
  newTeam?: { id: string; schoolName: string; commonName: string; abbreviation: string };
  changeType: CoachChangeType;
  season: number;
  effectiveDate?: string;
  contractYears?: number;
  contractValue?: string;
  buyout?: string;
  record?: string;
  notes?: string;
  verified: boolean;
  verifiedBy?: string;
}

export const CHANGE_TYPE_STYLES: Record<CoachChangeType, {
  label: string;
  bg: string;
  border: string;
  text: string;
}> = {
  HIRED: { label: 'Hired', bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-400' },
  FIRED: { label: 'Fired', bg: 'bg-red-400/15', border: 'border-red-400/30', text: 'text-red-400' },
  RESIGNED: { label: 'Resigned', bg: 'bg-amber-400/15', border: 'border-amber-400/30', text: 'text-amber-400' },
  RETIRED: { label: 'Retired', bg: 'bg-blue-400/15', border: 'border-blue-400/30', text: 'text-blue-400' },
  INTERIM: { label: 'Interim', bg: 'bg-zinc-400/15', border: 'border-zinc-400/30', text: 'text-zinc-400' },
};

// ─────────────────────────────────────────────────────────────
// Transfer Portal
// ─────────────────────────────────────────────────────────────

export type PortalStatus = 'IN_PORTAL' | 'COMMITTED' | 'WITHDRAWN' | 'SIGNED';
export type TransferWindow = 'SPRING' | 'SUMMER' | 'WINTER';

export interface TransferPortalEntry {
  id: string;
  playerName: string;
  position: string;
  eligibility?: string;
  previousTeam?: { id: string; schoolName: string; commonName: string; abbreviation: string };
  newTeam?: { id: string; schoolName: string; commonName: string; abbreviation: string };
  status: PortalStatus;
  season: number;
  enteredDate?: string;
  committedDate?: string;
  stars?: number;
  previousStats?: Record<string, string | number>;
  nilValuation?: string;
  paiScore?: number;
  tier?: string;
  transferWindow: TransferWindow;
  verified: boolean;
}

export const PORTAL_STATUS_STYLES: Record<PortalStatus, {
  label: string;
  bg: string;
  text: string;
}> = {
  IN_PORTAL: { label: 'In Portal', bg: 'bg-amber-400/15', text: 'text-amber-400' },
  COMMITTED: { label: 'Committed', bg: 'bg-emerald-400/15', text: 'text-emerald-400' },
  WITHDRAWN: { label: 'Withdrawn', bg: 'bg-zinc-400/15', text: 'text-zinc-400' },
  SIGNED: { label: 'Signed', bg: 'bg-blue-400/15', text: 'text-blue-400' },
};

export const WINDOW_STYLES: Record<TransferWindow, {
  label: string;
  bg: string;
  text: string;
}> = {
  SPRING: { label: 'Spring Window', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  SUMMER: { label: 'Summer Window', bg: 'bg-amber-400/10', text: 'text-amber-400' },
  WINTER: { label: 'Winter Window', bg: 'bg-blue-400/10', text: 'text-blue-400' },
};

// ─────────────────────────────────────────────────────────────
// NIL Ranking & Tracker
// ─────────────────────────────────────────────────────────────

export type NilDealType = 'ENDORSEMENT' | 'COLLECTIVE' | 'APPEARANCE' | 'SOCIAL_MEDIA' | 'MERCH' | 'LICENSING' | 'OTHER';
export type NilDealStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'TERMINATED';

export interface NilDeal {
  id: string;
  playerName: string;
  team?: { id: string; schoolName: string; commonName: string };
  position?: string;
  dealType: NilDealType;
  brandOrCollective?: string;
  estimatedValue?: number;
  duration?: string;
  status: NilDealStatus;
  announcedDate?: string;
  season: number;
  verified: boolean;
}

export interface NilTeamRanking {
  id: string;
  team: { id: string; schoolName: string; commonName: string; abbreviation: string };
  season: number;
  rank: number;
  totalNilValue: number;
  avgPerPlayer: number;
  topDealValue: number;
  dealCount: number;
  collectiveCount: number;
  trend: string;
  previousRank?: number;
}

export const NIL_DEAL_TYPE_STYLES: Record<NilDealType, {
  label: string;
  bg: string;
  text: string;
}> = {
  ENDORSEMENT: { label: 'Endorsement', bg: 'bg-gold/15', text: 'text-gold' },
  COLLECTIVE: { label: 'Collective', bg: 'bg-blue-400/15', text: 'text-blue-400' },
  APPEARANCE: { label: 'Appearance', bg: 'bg-emerald-400/15', text: 'text-emerald-400' },
  SOCIAL_MEDIA: { label: 'Social Media', bg: 'bg-purple-400/15', text: 'text-purple-400' },
  MERCH: { label: 'Merchandise', bg: 'bg-amber-400/15', text: 'text-amber-400' },
  LICENSING: { label: 'Licensing', bg: 'bg-cyan-400/15', text: 'text-cyan-400' },
  OTHER: { label: 'Other', bg: 'bg-zinc-400/15', text: 'text-zinc-400' },
};

// ─────────────────────────────────────────────────────────────
// School Revenue Budget (NCAA Free Agency)
// ─────────────────────────────────────────────────────────────

export type SpendingTier = 'ELITE' | 'HIGH' | 'MID' | 'LOW' | 'MINIMAL';
export type TransactionType = 'NIL_DEAL' | 'COACH_HIRE' | 'COACH_BUYOUT' | 'FACILITY' | 'TRANSFER_PORTAL_BONUS' | 'SCHOLARSHIP' | 'OTHER';

export interface SchoolRevenueBudget {
  id: string;
  team: { id: string; schoolName: string; commonName: string; abbreviation: string };
  season: number;
  totalRevenue: number;
  footballRevenue: number;
  nilBudget: number;
  nilSpent: number;
  nilRemaining: number;
  coachingSalary: number;
  operatingBudget: number;
  scholarships: number;
  rosterSize: number;
  capSpace: number;
  capRank?: number;
  spendingTier: SpendingTier;
  tvRevenue: number;
  ticketRevenue: number;
  donorRevenue: number;
  merchandiseRev: number;
  conferenceShare: number;
}

export interface BudgetTransaction {
  id: string;
  transactionType: TransactionType;
  description: string;
  amount: number;
  playerName?: string;
  category?: string;
  effectiveDate: string;
}

export const SPENDING_TIER_STYLES: Record<SpendingTier, {
  label: string;
  bg: string;
  border: string;
  text: string;
}> = {
  ELITE: { label: 'Elite', bg: 'bg-gold/15', border: 'border-gold/30', text: 'text-gold' },
  HIGH: { label: 'High', bg: 'bg-blue-400/15', border: 'border-blue-400/30', text: 'text-blue-400' },
  MID: { label: 'Mid-Tier', bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-400' },
  LOW: { label: 'Low', bg: 'bg-amber-400/15', border: 'border-amber-400/30', text: 'text-amber-400' },
  MINIMAL: { label: 'Minimal', bg: 'bg-zinc-400/15', border: 'border-zinc-400/30', text: 'text-zinc-400' },
};

// ─────────────────────────────────────────────────────────────
// Automation
// ─────────────────────────────────────────────────────────────

export type AutomationAgent = 'boomer_ang' | 'lil_hawk';
export type AutomationTaskType = 'COACHING_SCAN' | 'PORTAL_SCAN' | 'NIL_UPDATE' | 'BUDGET_CALC' | 'VERIFICATION';
export type AutomationStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface AutomationRun {
  id: string;
  agentName: AutomationAgent;
  taskType: AutomationTaskType;
  status: AutomationStatus;
  targetModule: string;
  recordsScanned: number;
  recordsUpdated: number;
  recordsCreated: number;
  errorCount: number;
  summary?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  triggeredBy: string;
}

export const AGENT_STYLES: Record<AutomationAgent, {
  label: string;
  role: string;
  bg: string;
  text: string;
  avatar: string;
}> = {
  boomer_ang: {
    label: 'Boomer_Ang',
    role: 'Data Acquisition & Verification',
    bg: 'bg-gold/15',
    text: 'text-gold',
    avatar: 'BA',
  },
  lil_hawk: {
    label: 'Lil_Hawk',
    role: 'Monitoring & Accuracy Oversight',
    bg: 'bg-cyan-400/15',
    text: 'text-cyan-400',
    avatar: 'LH',
  },
};
