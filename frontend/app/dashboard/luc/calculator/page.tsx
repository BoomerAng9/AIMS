'use client';

/**
 * LUC Real Estate & K1 Tax Calculator
 *
 * Built on the Flip Secrets foundation (aims-tools/luc/presets/real-estate-flip/).
 * Calculates property flip profitability, financing costs, and K1 taxation
 * estimates for real estate investors.
 *
 * LUC = Locale Universal Calculator
 * Part of the A.I.M.S. GATEWAY SYSTEM financial tools.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  staggerContainer,
  staggerItem,
  fadeUp,
  scaleFade,
} from '@/lib/motion/variants';
import { transition, spring, stagger } from '@/lib/motion/tokens';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface FlipInputs {
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

interface K1Inputs {
  filingStatus: 'single' | 'married_joint' | 'married_separate';
  ordinaryIncome: number;
  holdingDays: number;
  depreciationMonths: number;
  propertyTaxDeduction: number;
  mortgageInterestDeduction: number;
  stateIncomeTaxRate: number;
}

interface FlipOutputs {
  contingencyAmount: number;
  totalRepairCosts: number;
  purchaseClosingCosts: number;
  loanAmount: number;
  loanPointsCost: number;
  monthlyInterest: number;
  totalInterestCost: number;
  totalFinancingCosts: number;
  totalHoldingCosts: number;
  saleClosingCosts: number;
  realtorCommission: number;
  totalSellingCosts: number;
  totalInvestment: number;
  cashRequired: number;
  totalCosts: number;
  profit: number;
  roi: number;
  cashOnCashReturn: number;
  maxOffer: number;
  dealStatus: string;
}

interface K1Outputs {
  grossProfit: number;
  capitalGainsType: 'short-term' | 'long-term';
  federalTaxRate: number;
  federalTaxOwed: number;
  stateTaxOwed: number;
  netInvestmentIncomeTax: number;
  totalTaxLiability: number;
  afterTaxProfit: number;
  effectiveTaxRate: number;
  depreciationDeduction: number;
  totalDeductions: number;
  taxableGain: number;
}

type ActiveTab = 'flip' | 'k1' | 'summary';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DEFAULT_FLIP: FlipInputs = {
  purchasePrice: 150000,
  repairCosts: 35000,
  arv: 250000,
  holdingPeriodMonths: 6,
  purchaseClosingCostPercent: 2,
  saleClosingCostPercent: 3,
  realtorCommissionPercent: 6,
  loanToValue: 70,
  interestRate: 12,
  loanPoints: 2,
  monthlyHoldingCosts: 500,
  contingencyPercent: 10,
};

const DEFAULT_K1: K1Inputs = {
  filingStatus: 'single',
  ordinaryIncome: 85000,
  holdingDays: 180,
  depreciationMonths: 0,
  propertyTaxDeduction: 0,
  mortgageInterestDeduction: 0,
  stateIncomeTaxRate: 5,
};

// 2025/2026 Federal tax brackets (single)
const FEDERAL_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 10 },
  { min: 11600, max: 47150, rate: 12 },
  { min: 47150, max: 100525, rate: 22 },
  { min: 100525, max: 191950, rate: 24 },
  { min: 191950, max: 243725, rate: 32 },
  { min: 243725, max: 609350, rate: 35 },
  { min: 609350, max: Infinity, rate: 37 },
];

const FEDERAL_BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 10 },
  { min: 23200, max: 94300, rate: 12 },
  { min: 94300, max: 201050, rate: 22 },
  { min: 201050, max: 383900, rate: 24 },
  { min: 383900, max: 487450, rate: 32 },
  { min: 487450, max: 731200, rate: 35 },
  { min: 731200, max: Infinity, rate: 37 },
];

const LONG_TERM_BRACKETS_SINGLE = [
  { min: 0, max: 47025, rate: 0 },
  { min: 47025, max: 518900, rate: 15 },
  { min: 518900, max: Infinity, rate: 20 },
];

const LONG_TERM_BRACKETS_MARRIED = [
  { min: 0, max: 94050, rate: 0 },
  { min: 94050, max: 583750, rate: 15 },
  { min: 583750, max: Infinity, rate: 20 },
];

// NIIT threshold
const NIIT_THRESHOLD_SINGLE = 200000;
const NIIT_THRESHOLD_MARRIED = 250000;
const NIIT_RATE = 3.8;

// Residential property depreciation (27.5 years)
const RESIDENTIAL_DEPRECIATION_YEARS = 27.5;

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TrendUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Calculation Engine
// ─────────────────────────────────────────────────────────────

function calculateFlip(inputs: FlipInputs): FlipOutputs {
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
    contingencyAmount: Math.round(contingencyAmount * 100) / 100,
    totalRepairCosts: Math.round(totalRepairCosts * 100) / 100,
    purchaseClosingCosts: Math.round(purchaseClosingCosts * 100) / 100,
    loanAmount: Math.round(loanAmount * 100) / 100,
    loanPointsCost: Math.round(loanPointsCost * 100) / 100,
    monthlyInterest: Math.round(monthlyInterest * 100) / 100,
    totalInterestCost: Math.round(totalInterestCost * 100) / 100,
    totalFinancingCosts: Math.round(totalFinancingCosts * 100) / 100,
    totalHoldingCosts: Math.round(totalHoldingCosts * 100) / 100,
    saleClosingCosts: Math.round(saleClosingCosts * 100) / 100,
    realtorCommission: Math.round(realtorCommission * 100) / 100,
    totalSellingCosts: Math.round(totalSellingCosts * 100) / 100,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    cashRequired: Math.round(cashRequired * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    roi: Math.round(roi * 10) / 10,
    cashOnCashReturn: Math.round(cashOnCashReturn * 10) / 10,
    maxOffer: Math.round(maxOffer * 100) / 100,
    dealStatus,
  };
}

function calculateProgressiveTax(
  taxableIncome: number,
  brackets: { min: number; max: number; rate: number }[]
): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * (bracket.rate / 100);
  }
  return tax;
}

function calculateK1(flipOutputs: FlipOutputs, flipInputs: FlipInputs, k1Inputs: K1Inputs): K1Outputs {
  const grossProfit = flipOutputs.profit;
  const isLongTerm = k1Inputs.holdingDays > 365;
  const capitalGainsType = isLongTerm ? 'long-term' as const : 'short-term' as const;

  // Depreciation deduction (only applies if holding as rental before flip)
  const annualDepreciation = flipInputs.purchasePrice / RESIDENTIAL_DEPRECIATION_YEARS;
  const depreciationDeduction = k1Inputs.depreciationMonths > 0
    ? (annualDepreciation / 12) * k1Inputs.depreciationMonths
    : 0;

  // Total deductions
  const totalDeductions = depreciationDeduction
    + k1Inputs.propertyTaxDeduction
    + k1Inputs.mortgageInterestDeduction;

  // Taxable gain after deductions
  const taxableGain = Math.max(0, grossProfit - totalDeductions);

  // Determine tax brackets based on filing status
  const isMarried = k1Inputs.filingStatus === 'married_joint';
  const ordinaryBrackets = isMarried ? FEDERAL_BRACKETS_MARRIED : FEDERAL_BRACKETS_SINGLE;
  const ltcgBrackets = isMarried ? LONG_TERM_BRACKETS_MARRIED : LONG_TERM_BRACKETS_SINGLE;

  let federalTaxOwed: number;
  let federalTaxRate: number;

  if (isLongTerm) {
    // Long-term capital gains — taxed at preferential rates
    // Calculate the marginal rate based on total income (ordinary + gain)
    const totalIncome = k1Inputs.ordinaryIncome + taxableGain;
    const taxOnTotalWithGain = calculateProgressiveTax(totalIncome, ltcgBrackets);
    const taxOnOrdinaryOnly = calculateProgressiveTax(k1Inputs.ordinaryIncome, ltcgBrackets);
    federalTaxOwed = taxOnTotalWithGain - taxOnOrdinaryOnly;
    federalTaxRate = taxableGain > 0 ? (federalTaxOwed / taxableGain) * 100 : 0;
  } else {
    // Short-term capital gains — taxed as ordinary income
    const totalIncome = k1Inputs.ordinaryIncome + taxableGain;
    const taxOnTotal = calculateProgressiveTax(totalIncome, ordinaryBrackets);
    const taxOnOrdinaryOnly = calculateProgressiveTax(k1Inputs.ordinaryIncome, ordinaryBrackets);
    federalTaxOwed = taxOnTotal - taxOnOrdinaryOnly;
    federalTaxRate = taxableGain > 0 ? (federalTaxOwed / taxableGain) * 100 : 0;
  }

  // State income tax on the gain
  const stateTaxOwed = taxableGain * (k1Inputs.stateIncomeTaxRate / 100);

  // Net Investment Income Tax (3.8% NIIT) — applies if AGI exceeds threshold
  const niitThreshold = isMarried ? NIIT_THRESHOLD_MARRIED : NIIT_THRESHOLD_SINGLE;
  const totalAGI = k1Inputs.ordinaryIncome + taxableGain;
  const niitExcess = Math.max(0, totalAGI - niitThreshold);
  const netInvestmentIncomeTax = Math.min(niitExcess, taxableGain) * (NIIT_RATE / 100);

  const totalTaxLiability = federalTaxOwed + stateTaxOwed + netInvestmentIncomeTax;
  const afterTaxProfit = grossProfit - totalTaxLiability;
  const effectiveTaxRate = grossProfit > 0 ? (totalTaxLiability / grossProfit) * 100 : 0;

  return {
    grossProfit: Math.round(grossProfit * 100) / 100,
    capitalGainsType,
    federalTaxRate: Math.round(federalTaxRate * 10) / 10,
    federalTaxOwed: Math.round(federalTaxOwed * 100) / 100,
    stateTaxOwed: Math.round(stateTaxOwed * 100) / 100,
    netInvestmentIncomeTax: Math.round(netInvestmentIncomeTax * 100) / 100,
    totalTaxLiability: Math.round(totalTaxLiability * 100) / 100,
    afterTaxProfit: Math.round(afterTaxProfit * 100) / 100,
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    depreciationDeduction: Math.round(depreciationDeduction * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    taxableGain: Math.round(taxableGain * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────
// Formatter
// ─────────────────────────────────────────────────────────────

function fmt(value: number, type: 'currency' | 'percent' | 'number' = 'currency'): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (type === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString('en-US');
}

// ─────────────────────────────────────────────────────────────
// Input Field Component
// ─────────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step ?? 1}
          className={`
            w-full h-11 rounded-xl border border-slate-200 bg-white
            text-slate-800 text-sm font-mono
            focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
            transition-colors
            ${prefix ? 'pl-8' : 'pl-3'}
            ${suffix ? 'pr-8' : 'pr-3'}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  subtitle,
  trend,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'amber' | 'slate';
}) {
  const colorMap = {
    green: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    slate: 'text-slate-800',
  };

  return (
    <motion.div
      variants={staggerItem}
      className="bg-white rounded-xl border border-slate-200 p-4"
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-xl font-bold font-mono ${colorMap[color ?? 'slate']}`}>{value}</p>
        {trend === 'up' && <TrendUpIcon className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendDownIcon className="w-4 h-4 text-red-500" />}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cost Breakdown Row
// ─────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  indent,
  bold,
  highlight,
}: {
  label: string;
  value: number;
  indent?: boolean;
  bold?: boolean;
  highlight?: 'green' | 'red' | 'amber';
}) {
  const colorMap = {
    green: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-700',
  };

  return (
    <div className={`flex items-center justify-between py-2 ${indent ? 'pl-4' : ''} ${bold ? 'border-t border-slate-200 pt-3' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${bold ? 'font-bold' : 'font-medium'} ${highlight ? colorMap[highlight] : 'text-slate-800'}`}>
        {fmt(value)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Deal Status Badge
// ─────────────────────────────────────────────────────────────

function DealBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Excellent Deal': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Good Deal': 'bg-blue-50 text-blue-700 border-blue-200',
    'Marginal Deal': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pass': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${styles[status] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function LUCCalculatorPage() {
  const [flipInputs, setFlipInputs] = useState<FlipInputs>(DEFAULT_FLIP);
  const [k1Inputs, setK1Inputs] = useState<K1Inputs>(DEFAULT_K1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('flip');

  const updateFlip = useCallback(<K extends keyof FlipInputs>(key: K, value: FlipInputs[K]) => {
    setFlipInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateK1 = useCallback(<K extends keyof K1Inputs>(key: K, value: K1Inputs[K]) => {
    setK1Inputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const flipOutputs = useMemo(() => calculateFlip(flipInputs), [flipInputs]);
  const k1Outputs = useMemo(() => calculateK1(flipOutputs, flipInputs, k1Inputs), [flipOutputs, flipInputs, k1Inputs]);

  const tabs: { key: ActiveTab; label: string; icon: typeof HomeIcon }[] = [
    { key: 'flip', label: 'Property Analysis', icon: HomeIcon },
    { key: 'k1', label: 'K1 Tax Estimate', icon: FileTextIcon },
    { key: 'summary', label: 'Deal Summary', icon: DollarIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          className="mb-8"
        >
          <a
            href="/dashboard/luc"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-amber-600 transition-colors mb-4"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Back to LUC
          </a>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Real Estate & K1 Tax Calculator
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Flip analysis with K1 taxation estimates — powered by LUC
              </p>
            </div>
            <DealBadge status={flipOutputs.dealStatus} />
          </div>
        </motion.header>

        {/* ── KPI Strip ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          <KPICard
            label="Net Profit"
            value={fmt(flipOutputs.profit)}
            trend={flipOutputs.profit > 0 ? 'up' : 'down'}
            color={flipOutputs.profit > 0 ? 'green' : 'red'}
          />
          <KPICard
            label="ROI"
            value={fmt(flipOutputs.roi, 'percent')}
            subtitle={`Cash-on-Cash: ${fmt(flipOutputs.cashOnCashReturn, 'percent')}`}
            color={flipOutputs.roi >= 15 ? 'green' : flipOutputs.roi >= 10 ? 'amber' : 'red'}
          />
          <KPICard
            label="After-Tax Profit"
            value={fmt(k1Outputs.afterTaxProfit)}
            subtitle={`Eff. Tax Rate: ${fmt(k1Outputs.effectiveTaxRate, 'percent')}`}
            trend={k1Outputs.afterTaxProfit > 0 ? 'up' : 'down'}
            color={k1Outputs.afterTaxProfit > 0 ? 'green' : 'red'}
          />
          <KPICard
            label="Max Offer (70% Rule)"
            value={fmt(flipOutputs.maxOffer)}
            subtitle={flipInputs.purchasePrice <= flipOutputs.maxOffer ? 'Under max — good' : 'Over max — risky'}
            color={flipInputs.purchasePrice <= flipOutputs.maxOffer ? 'green' : 'red'}
          />
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${isActive
                    ? 'text-amber-700 border-amber-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'flip' && (
            <motion.div
              key="flip"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Input Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Acquisition */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Acquisition
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="Purchase Price"
                      value={flipInputs.purchasePrice}
                      onChange={(v) => updateFlip('purchasePrice', v)}
                      prefix="$"
                      min={0}
                    />
                    <InputField
                      label="ARV (After Repair Value)"
                      value={flipInputs.arv}
                      onChange={(v) => updateFlip('arv', v)}
                      prefix="$"
                      min={0}
                    />
                    <InputField
                      label="Purchase Closing Costs"
                      value={flipInputs.purchaseClosingCostPercent}
                      onChange={(v) => updateFlip('purchaseClosingCostPercent', v)}
                      suffix="%"
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>
                </div>

                {/* Renovation */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Renovation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Repair / Renovation Costs"
                      value={flipInputs.repairCosts}
                      onChange={(v) => updateFlip('repairCosts', v)}
                      prefix="$"
                      min={0}
                    />
                    <InputField
                      label="Contingency Buffer"
                      value={flipInputs.contingencyPercent}
                      onChange={(v) => updateFlip('contingencyPercent', v)}
                      suffix="%"
                      min={0}
                      max={50}
                      hint={`Adds ${fmt(flipOutputs.contingencyAmount)} buffer`}
                    />
                  </div>
                </div>

                {/* Financing */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Financing
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="Loan-to-Value"
                      value={flipInputs.loanToValue}
                      onChange={(v) => updateFlip('loanToValue', v)}
                      suffix="%"
                      min={0}
                      max={100}
                      hint={`Loan: ${fmt(flipOutputs.loanAmount)}`}
                    />
                    <InputField
                      label="Annual Interest Rate"
                      value={flipInputs.interestRate}
                      onChange={(v) => updateFlip('interestRate', v)}
                      suffix="%"
                      min={0}
                      max={30}
                      step={0.25}
                    />
                    <InputField
                      label="Loan Points"
                      value={flipInputs.loanPoints}
                      onChange={(v) => updateFlip('loanPoints', v)}
                      min={0}
                      max={10}
                      hint={`Cost: ${fmt(flipOutputs.loanPointsCost)}`}
                    />
                  </div>
                </div>

                {/* Holding & Selling */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Holding & Selling
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField
                      label="Holding Period"
                      value={flipInputs.holdingPeriodMonths}
                      onChange={(v) => updateFlip('holdingPeriodMonths', v)}
                      suffix="mo"
                      min={1}
                      max={36}
                    />
                    <InputField
                      label="Monthly Holding Costs"
                      value={flipInputs.monthlyHoldingCosts}
                      onChange={(v) => updateFlip('monthlyHoldingCosts', v)}
                      prefix="$"
                      min={0}
                      hint="Taxes, insurance, utilities"
                    />
                    <InputField
                      label="Sale Closing Costs"
                      value={flipInputs.saleClosingCostPercent}
                      onChange={(v) => updateFlip('saleClosingCostPercent', v)}
                      suffix="%"
                      min={0}
                      max={10}
                      step={0.5}
                    />
                    <InputField
                      label="Realtor Commission"
                      value={flipInputs.realtorCommissionPercent}
                      onChange={(v) => updateFlip('realtorCommissionPercent', v)}
                      suffix="%"
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Cost Breakdown
                  </h3>
                  <div className="divide-y divide-slate-100">
                    <BreakdownRow label="Purchase Price" value={flipInputs.purchasePrice} />
                    <BreakdownRow label="Closing Costs (Buy)" value={flipOutputs.purchaseClosingCosts} indent />
                    <BreakdownRow label="Repairs + Contingency" value={flipOutputs.totalRepairCosts} indent />
                    <BreakdownRow label="Total Investment" value={flipOutputs.totalInvestment} bold />
                    <BreakdownRow label="Loan Amount" value={flipOutputs.loanAmount} indent />
                    <BreakdownRow label="Financing Costs" value={flipOutputs.totalFinancingCosts} indent />
                    <BreakdownRow label="Holding Costs" value={flipOutputs.totalHoldingCosts} indent />
                    <BreakdownRow label="Selling Costs" value={flipOutputs.totalSellingCosts} indent />
                    <BreakdownRow label="Total Project Costs" value={flipOutputs.totalCosts} bold />
                    <BreakdownRow label="Sale Price (ARV)" value={flipInputs.arv} highlight="amber" />
                    <BreakdownRow
                      label="Net Profit"
                      value={flipOutputs.profit}
                      bold
                      highlight={flipOutputs.profit >= 0 ? 'green' : 'red'}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">ROI</p>
                      <p className={`text-lg font-bold font-mono ${flipOutputs.roi >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {fmt(flipOutputs.roi, 'percent')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Cash-on-Cash</p>
                      <p className={`text-lg font-bold font-mono ${flipOutputs.cashOnCashReturn >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {fmt(flipOutputs.cashOnCashReturn, 'percent')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Cash Required</p>
                    <p className="text-lg font-bold font-mono text-slate-800">{fmt(flipOutputs.cashRequired)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'k1' && (
            <motion.div
              key="k1"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* K1 Input Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Filing Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Filing Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Filing Status</label>
                      <select
                        value={k1Inputs.filingStatus}
                        onChange={(e) => updateK1('filingStatus', e.target.value as K1Inputs['filingStatus'])}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                      >
                        <option value="single">Single</option>
                        <option value="married_joint">Married Filing Jointly</option>
                        <option value="married_separate">Married Filing Separately</option>
                      </select>
                    </div>
                    <InputField
                      label="Other Ordinary Income"
                      value={k1Inputs.ordinaryIncome}
                      onChange={(v) => updateK1('ordinaryIncome', v)}
                      prefix="$"
                      min={0}
                      hint="W-2, business income, etc."
                    />
                  </div>
                </div>

                {/* Capital Gains Classification */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Capital Gains Classification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Days Held Before Sale"
                      value={k1Inputs.holdingDays}
                      onChange={(v) => updateK1('holdingDays', v)}
                      suffix="days"
                      min={1}
                      max={3650}
                      hint={k1Inputs.holdingDays > 365 ? 'Long-term capital gains' : 'Short-term (ordinary rates)'}
                    />
                    <InputField
                      label="State Income Tax Rate"
                      value={k1Inputs.stateIncomeTaxRate}
                      onChange={(v) => updateK1('stateIncomeTaxRate', v)}
                      suffix="%"
                      min={0}
                      max={15}
                      step={0.1}
                    />
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500">
                      {k1Inputs.holdingDays > 365
                        ? 'Long-term capital gains are taxed at preferential rates (0%, 15%, or 20%) depending on your total income.'
                        : 'Short-term capital gains (held ≤ 365 days) are taxed as ordinary income at your marginal tax bracket.'}
                    </p>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Deductions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="Depreciation (months claimed)"
                      value={k1Inputs.depreciationMonths}
                      onChange={(v) => updateK1('depreciationMonths', v)}
                      suffix="mo"
                      min={0}
                      max={330}
                      hint={k1Inputs.depreciationMonths > 0
                        ? `Deduction: ${fmt(k1Outputs.depreciationDeduction)}`
                        : 'For rental-before-flip only'
                      }
                    />
                    <InputField
                      label="Property Tax Deduction"
                      value={k1Inputs.propertyTaxDeduction}
                      onChange={(v) => updateK1('propertyTaxDeduction', v)}
                      prefix="$"
                      min={0}
                    />
                    <InputField
                      label="Mortgage Interest Deduction"
                      value={k1Inputs.mortgageInterestDeduction}
                      onChange={(v) => updateK1('mortgageInterestDeduction', v)}
                      prefix="$"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              {/* K1 Results Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    K1 Tax Breakdown
                  </h3>
                  <div className="divide-y divide-slate-100">
                    <BreakdownRow label="Gross Profit from Flip" value={k1Outputs.grossProfit} />
                    <BreakdownRow label="Total Deductions" value={-k1Outputs.totalDeductions} indent />
                    <BreakdownRow label="Taxable Gain" value={k1Outputs.taxableGain} bold />
                    <div className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          {k1Outputs.capitalGainsType === 'long-term' ? 'Long-Term' : 'Short-Term'}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          k1Outputs.capitalGainsType === 'long-term'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {k1Outputs.capitalGainsType === 'long-term' ? 'Preferential Rates' : 'Ordinary Rates'}
                        </span>
                      </div>
                    </div>
                    <BreakdownRow
                      label={`Federal Tax (${fmt(k1Outputs.federalTaxRate, 'percent')} eff.)`}
                      value={k1Outputs.federalTaxOwed}
                      highlight="red"
                    />
                    <BreakdownRow
                      label={`State Tax (${fmt(k1Inputs.stateIncomeTaxRate, 'percent')})`}
                      value={k1Outputs.stateTaxOwed}
                      highlight="red"
                    />
                    {k1Outputs.netInvestmentIncomeTax > 0 && (
                      <BreakdownRow
                        label={`NIIT (${fmt(NIIT_RATE, 'percent')})`}
                        value={k1Outputs.netInvestmentIncomeTax}
                        highlight="red"
                        indent
                      />
                    )}
                    <BreakdownRow
                      label="Total Tax Liability"
                      value={k1Outputs.totalTaxLiability}
                      bold
                      highlight="red"
                    />
                    <BreakdownRow
                      label="After-Tax Profit"
                      value={k1Outputs.afterTaxProfit}
                      bold
                      highlight={k1Outputs.afterTaxProfit >= 0 ? 'green' : 'red'}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Effective Tax Rate on Gain</p>
                      <p className={`text-2xl font-bold font-mono ${k1Outputs.effectiveTaxRate < 25 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmt(k1Outputs.effectiveTaxRate, 'percent')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-800">
                      Estimates only. Consult a CPA for actual K1 filing. Tax brackets based on 2025 rates.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Deal Overview */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Deal Overview</h3>
                  <DealBadge status={flipOutputs.dealStatus} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Purchase</p>
                    <p className="text-xl font-bold font-mono text-slate-800">{fmt(flipInputs.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">ARV</p>
                    <p className="text-xl font-bold font-mono text-slate-800">{fmt(flipInputs.arv)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Costs</p>
                    <p className="text-xl font-bold font-mono text-slate-800">{fmt(flipOutputs.totalCosts)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Holding Period</p>
                    <p className="text-xl font-bold font-mono text-slate-800">{flipInputs.holdingPeriodMonths} mo</p>
                  </div>
                </div>
              </div>

              {/* Side-by-side: Before Tax vs After Tax */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    Before Tax
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Net Profit</span>
                      <span className={`text-lg font-bold font-mono ${flipOutputs.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmt(flipOutputs.profit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">ROI</span>
                      <span className="text-sm font-mono text-slate-800">{fmt(flipOutputs.roi, 'percent')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Cash-on-Cash Return</span>
                      <span className="text-sm font-mono text-slate-800">{fmt(flipOutputs.cashOnCashReturn, 'percent')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Cash Required</span>
                      <span className="text-sm font-mono text-slate-800">{fmt(flipOutputs.cashRequired)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Max Offer (70% Rule)</span>
                      <span className="text-sm font-mono text-slate-800">{fmt(flipOutputs.maxOffer)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    After Tax (K1)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">After-Tax Profit</span>
                      <span className={`text-lg font-bold font-mono ${k1Outputs.afterTaxProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmt(k1Outputs.afterTaxProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Federal Tax</span>
                      <span className="text-sm font-mono text-red-600">{fmt(k1Outputs.federalTaxOwed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">State Tax</span>
                      <span className="text-sm font-mono text-red-600">{fmt(k1Outputs.stateTaxOwed)}</span>
                    </div>
                    {k1Outputs.netInvestmentIncomeTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">NIIT</span>
                        <span className="text-sm font-mono text-red-600">{fmt(k1Outputs.netInvestmentIncomeTax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Tax</span>
                      <span className="text-sm font-mono font-bold text-red-600">{fmt(k1Outputs.totalTaxLiability)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Effective Tax Rate</span>
                      <span className="text-sm font-mono text-slate-800">{fmt(k1Outputs.effectiveTaxRate, 'percent')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Capital Gains Type</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        k1Outputs.capitalGainsType === 'long-term'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {k1Outputs.capitalGainsType === 'long-term' ? 'Long-Term' : 'Short-Term'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Cost Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                  Full Cost Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-500 font-medium">Category</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Item</th>
                        <th className="text-right py-2 text-slate-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 text-slate-600">Acquisition</td>
                        <td className="py-2 text-slate-800">Purchase Price</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipInputs.purchasePrice)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600"></td>
                        <td className="py-2 text-slate-800">Closing Costs</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.purchaseClosingCosts)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">Renovation</td>
                        <td className="py-2 text-slate-800">Repairs + Contingency</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.totalRepairCosts)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">Financing</td>
                        <td className="py-2 text-slate-800">Loan Points</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.loanPointsCost)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600"></td>
                        <td className="py-2 text-slate-800">Interest ({flipInputs.holdingPeriodMonths} mo)</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.totalInterestCost)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">Holding</td>
                        <td className="py-2 text-slate-800">Monthly Costs x {flipInputs.holdingPeriodMonths}</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.totalHoldingCosts)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">Selling</td>
                        <td className="py-2 text-slate-800">Sale Closing Costs</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.saleClosingCosts)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600"></td>
                        <td className="py-2 text-slate-800">Realtor Commission</td>
                        <td className="py-2 text-right font-mono text-slate-800">{fmt(flipOutputs.realtorCommission)}</td>
                      </tr>
                      <tr className="border-t-2 border-slate-300">
                        <td className="py-2 font-semibold text-slate-800">Taxation</td>
                        <td className="py-2 font-semibold text-slate-800">K1 Tax Liability</td>
                        <td className="py-2 text-right font-mono font-bold text-red-600">{fmt(k1Outputs.totalTaxLiability)}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-3 font-bold text-slate-800" colSpan={2}>
                          After-Tax Net Profit
                        </td>
                        <td className={`py-3 text-right font-mono text-lg font-bold ${k1Outputs.afterTaxProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(k1Outputs.afterTaxProfit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-800">
                  This calculator provides estimates for educational and planning purposes only. K1 tax calculations
                  are simplified and may not account for all deductions, credits, AMT, or state-specific rules.
                  Always consult a licensed CPA or tax professional for actual K1 filing and tax planning.
                  Tax brackets based on 2025 federal rates.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
