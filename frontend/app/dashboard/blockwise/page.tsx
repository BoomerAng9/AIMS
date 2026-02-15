'use client';

/**
 * BlockWise AI — Flip Calculator + Deal Analyzer
 *
 * The LUC Real Estate Calculator brought to life.
 * Based on the Flip Secrets methodology (Jake Leicht).
 *
 * Yellow Cells → User inputs (purchase, repairs, ARV, financing)
 * Green Cells → Auto-calculated (costs, profit, ROI, cash-on-cash)
 * Orange Cell → Deal Verdict (YES/NO/MAYBE + Max Offer)
 *
 * Boomer_Ang integration: Scout (comps), Flip (analysis), Capital (financing)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────

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

interface FlipResults {
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
  profitMarginPercent: number;
}

type OpmOption = {
  name: string;
  desc: string;
  yourCash: number;
  partnerCash: number;
  lenderCash: number;
  profitSplit: string;
  yourProfit: number;
};

// ─── Calculation Engine (from formulas.json) ──────────────────────────────

function calculate(i: FlipInputs): FlipResults {
  const contingencyAmount = i.repairCosts * (i.contingencyPercent / 100);
  const totalRepairCosts = i.repairCosts + contingencyAmount;
  const purchaseClosingCosts = i.purchasePrice * (i.purchaseClosingCostPercent / 100);
  const loanAmount = i.purchasePrice * (i.loanToValue / 100);
  const loanPointsCost = loanAmount * (i.loanPoints / 100);
  const monthlyInterest = loanAmount * (i.interestRate / 100 / 12);
  const totalInterestCost = monthlyInterest * i.holdingPeriodMonths;
  const totalFinancingCosts = loanPointsCost + totalInterestCost;
  const totalHoldingCosts = i.monthlyHoldingCosts * i.holdingPeriodMonths;
  const saleClosingCosts = i.arv * (i.saleClosingCostPercent / 100);
  const realtorCommission = i.arv * (i.realtorCommissionPercent / 100);
  const totalSellingCosts = saleClosingCosts + realtorCommission;
  const totalInvestment = i.purchasePrice + purchaseClosingCosts + totalRepairCosts;
  const cashRequired = (totalInvestment - loanAmount) + totalFinancingCosts + totalHoldingCosts;
  const totalCosts = totalInvestment + totalFinancingCosts + totalHoldingCosts + totalSellingCosts;
  const profit = i.arv - totalCosts;
  const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
  const cashOnCashReturn = cashRequired > 0 ? (profit / cashRequired) * 100 : 0;
  const maxOffer = (i.arv * 0.70) - totalRepairCosts;
  const dealStatus = roi >= 20 ? 'Excellent Deal' : roi >= 15 ? 'Good Deal' : roi >= 10 ? 'Marginal Deal' : 'Pass';
  const profitMarginPercent = i.arv > 0 ? (profit / i.arv) * 100 : 0;

  return {
    contingencyAmount, totalRepairCosts, purchaseClosingCosts, loanAmount,
    loanPointsCost, monthlyInterest, totalInterestCost, totalFinancingCosts,
    totalHoldingCosts, saleClosingCosts, realtorCommission, totalSellingCosts,
    totalInvestment, cashRequired, totalCosts, profit, roi, cashOnCashReturn,
    maxOffer, dealStatus, profitMarginPercent,
  };
}

function generateOpmOptions(inputs: FlipInputs, results: FlipResults): OpmOption[] {
  const gap = results.cashRequired;
  const profit = results.profit;
  if (gap <= 0 || profit <= 0) return [];

  const options: OpmOption[] = [];

  // Option 1: Partner split (50/50)
  const partnerShare = Math.ceil(gap * 0.5);
  options.push({
    name: 'Partner Up (50/50)',
    desc: `Split the gap with a partner. You each put in ~$${fmt(partnerShare)}.`,
    yourCash: partnerShare,
    partnerCash: partnerShare,
    lenderCash: results.loanAmount,
    profitSplit: '50/50',
    yourProfit: Math.round(profit * 0.5),
  });

  // Option 2: Private lender at 8%
  const privateLenderAmount = Math.round(gap * 0.75);
  const plInterest = privateLenderAmount * 0.08 * (inputs.holdingPeriodMonths / 12);
  options.push({
    name: 'Private Lender (8%)',
    desc: `Borrow $${fmt(privateLenderAmount)} from someone you trust at 8%/year.`,
    yourCash: gap - privateLenderAmount,
    partnerCash: 0,
    lenderCash: results.loanAmount + privateLenderAmount,
    profitSplit: `You keep all profit minus $${fmt(Math.round(plInterest))} interest`,
    yourProfit: Math.round(profit - plInterest),
  });

  // Option 3: 3-way split
  const thirdShare = Math.ceil(gap / 3);
  options.push({
    name: 'Squad Deal (3-Way)',
    desc: `You + 2 partners each put in ~$${fmt(thirdShare)}. Lower risk, shared upside.`,
    yourCash: thirdShare,
    partnerCash: thirdShare * 2,
    lenderCash: results.loanAmount,
    profitSplit: '33/33/33',
    yourProfit: Math.round(profit / 3),
  });

  return options;
}

// ─── Formatting ──────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function fmtCurrency(n: number): string {
  return '$' + fmt(n);
}

// ─── Component ───────────────────────────────────────────────────────────

export default function BlockWisePage() {
  const [inputs, setInputs] = useState<FlipInputs>({
    purchasePrice: 130000,
    repairCosts: 22000,
    arv: 185000,
    holdingPeriodMonths: 6,
    purchaseClosingCostPercent: 2,
    saleClosingCostPercent: 3,
    realtorCommissionPercent: 6,
    loanToValue: 80,
    interestRate: 12,
    loanPoints: 2,
    monthlyHoldingCosts: 500,
    contingencyPercent: 10,
  });

  const [showOpm, setShowOpm] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const results = useMemo(() => calculate(inputs), [inputs]);
  const opmOptions = useMemo(() => generateOpmOptions(inputs, results), [inputs, results]);

  const update = (field: keyof FlipInputs, value: string) => {
    const num = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: num }));
  };

  const isGoodDeal = results.roi >= 10 && results.profit >= 15000;
  const isGreatDeal = results.roi >= 20 && results.profit >= 25000;
  const isPurchaseBelowMax = inputs.purchasePrice <= results.maxOffer;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="text-emerald-400">BlockWise</span>
          <span className="text-zinc-400 font-normal">AI</span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">
            FLIP CALCULATOR
          </span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Stop guessing. Know your numbers before you make an offer.
        </p>
      </div>

      {/* Deal Verdict Banner */}
      <motion.div
        key={results.dealStatus}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border p-4 md:p-6 mb-6 ${
          isGreatDeal
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : isGoodDeal
            ? 'bg-amber-500/10 border-amber-500/25'
            : 'bg-red-500/10 border-red-500/25'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-1">DEAL VERDICT</p>
            <p className={`text-2xl md:text-3xl font-bold font-mono ${
              isGreatDeal ? 'text-emerald-400' : isGoodDeal ? 'text-amber-400' : 'text-red-400'
            }`}>
              {isGreatDeal ? 'YES — MOVE ON THIS' : isGoodDeal ? 'MAYBE — NEGOTIATE HARDER' : 'NO — WALK AWAY'}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              {results.dealStatus} &middot; {results.profit >= 0 ? fmtCurrency(results.profit) : '-' + fmtCurrency(Math.abs(results.profit))} profit &middot; {results.roi.toFixed(1)}% ROI
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl md:text-2xl font-mono font-bold text-emerald-400">{fmtCurrency(results.profit)}</p>
              <p className="text-[10px] text-zinc-500">NET PROFIT</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-mono font-bold text-amber-400">{results.roi.toFixed(1)}%</p>
              <p className="text-[10px] text-zinc-500">ROI</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-mono font-bold text-cyan-400">{results.cashOnCashReturn.toFixed(1)}%</p>
              <p className="text-[10px] text-zinc-500">CASH-ON-CASH</p>
            </div>
          </div>
        </div>

        {/* Max Offer Alert */}
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          isPurchaseBelowMax
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          <span className="font-mono font-bold">70% Rule Max Offer: {fmtCurrency(results.maxOffer)}</span>
          <span className="mx-2">&middot;</span>
          {isPurchaseBelowMax
            ? `You're ${fmtCurrency(results.maxOffer - inputs.purchasePrice)} under max. Room to negotiate.`
            : `You're ${fmtCurrency(inputs.purchasePrice - results.maxOffer)} OVER max. Negotiate down or walk.`
          }
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-4">
          {/* Acquisition */}
          <InputSection title="THE DEAL" color="emerald">
            <CurrencyInput label="Purchase Price" value={inputs.purchasePrice} onChange={v => update('purchasePrice', v)} highlight />
            <CurrencyInput label="Repair / Reno Costs" value={inputs.repairCosts} onChange={v => update('repairCosts', v)} />
            <CurrencyInput label="ARV (After Repair Value)" value={inputs.arv} onChange={v => update('arv', v)} highlight />
            <PercentInput label="Contingency Buffer" value={inputs.contingencyPercent} onChange={v => update('contingencyPercent', v)} />
          </InputSection>

          {/* Financing */}
          <InputSection title="THE MONEY" color="amber">
            <PercentInput label="Loan-to-Value (LTV)" value={inputs.loanToValue} onChange={v => update('loanToValue', v)} />
            <PercentInput label="Interest Rate (Annual)" value={inputs.interestRate} onChange={v => update('interestRate', v)} />
            <NumberInput label="Loan Points" value={inputs.loanPoints} onChange={v => update('loanPoints', v)} />
            <div className="bg-zinc-800/30 rounded-lg p-3 mt-2">
              <p className="text-xs text-zinc-500">Hard Money Loan Amount</p>
              <p className="text-lg font-mono font-bold text-amber-400">{fmtCurrency(results.loanAmount)}</p>
              <p className="text-xs text-zinc-600 mt-0.5">Cash needed for gap: {fmtCurrency(results.cashRequired)}</p>
            </div>
          </InputSection>

          {/* Costs */}
          <InputSection title="THE COSTS" color="zinc">
            <NumberInput label="Holding Period (Months)" value={inputs.holdingPeriodMonths} onChange={v => update('holdingPeriodMonths', v)} />
            <CurrencyInput label="Monthly Holding Costs" value={inputs.monthlyHoldingCosts} onChange={v => update('monthlyHoldingCosts', v)} />
            <PercentInput label="Purchase Closing %" value={inputs.purchaseClosingCostPercent} onChange={v => update('purchaseClosingCostPercent', v)} />
            <PercentInput label="Sale Closing %" value={inputs.saleClosingCostPercent} onChange={v => update('saleClosingCostPercent', v)} />
            <PercentInput label="Realtor Commission %" value={inputs.realtorCommissionPercent} onChange={v => update('realtorCommissionPercent', v)} />
          </InputSection>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          {/* Profit Waterfall */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">PROFIT WATERFALL</h3>
            <div className="space-y-2">
              <WaterfallRow label="Sale Price (ARV)" value={inputs.arv} positive />
              <WaterfallRow label="Purchase Price" value={-inputs.purchasePrice} />
              <WaterfallRow label="Total Repairs + Contingency" value={-results.totalRepairCosts} />
              <WaterfallRow label="Purchase Closing" value={-results.purchaseClosingCosts} />
              <WaterfallRow label="Financing Costs" value={-results.totalFinancingCosts} />
              <WaterfallRow label="Holding Costs" value={-results.totalHoldingCosts} />
              <WaterfallRow label="Selling Costs" value={-results.totalSellingCosts} />
              <div className="border-t border-zinc-700 pt-2 mt-2">
                <WaterfallRow label="NET PROFIT" value={results.profit} isBold positive={results.profit >= 0} />
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Total Investment" value={fmtCurrency(results.totalInvestment)} sub="All-in before sale" />
            <MetricCard label="Cash Out of Pocket" value={fmtCurrency(results.cashRequired)} sub="What YOU need" color="amber" />
            <MetricCard label="Monthly Carry" value={fmtCurrency(results.monthlyInterest + inputs.monthlyHoldingCosts)} sub="Interest + holding/mo" />
            <MetricCard label="Profit Margin" value={results.profitMarginPercent.toFixed(1) + '%'} sub="Profit / ARV" color={results.profitMarginPercent >= 10 ? 'emerald' : 'red'} />
          </div>

          {/* Detailed Breakdown (Collapsible) */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full px-4 py-3 text-sm text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors flex items-center justify-between"
          >
            <span>Full Cost Breakdown</span>
            <svg className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 overflow-hidden"
              >
                <div className="space-y-3 text-sm">
                  <BreakdownSection title="Acquisition">
                    <BreakdownRow label="Purchase Price" value={inputs.purchasePrice} />
                    <BreakdownRow label="Purchase Closing" value={results.purchaseClosingCosts} />
                  </BreakdownSection>
                  <BreakdownSection title="Renovation">
                    <BreakdownRow label="Base Repairs" value={inputs.repairCosts} />
                    <BreakdownRow label="Contingency ({inputs.contingencyPercent}%)" value={results.contingencyAmount} />
                    <BreakdownRow label="Total Repairs" value={results.totalRepairCosts} bold />
                  </BreakdownSection>
                  <BreakdownSection title="Financing">
                    <BreakdownRow label="Loan Amount" value={results.loanAmount} />
                    <BreakdownRow label="Loan Points" value={results.loanPointsCost} />
                    <BreakdownRow label="Monthly Interest" value={results.monthlyInterest} />
                    <BreakdownRow label={`Total Interest (${inputs.holdingPeriodMonths} mo)`} value={results.totalInterestCost} />
                    <BreakdownRow label="Total Financing" value={results.totalFinancingCosts} bold />
                  </BreakdownSection>
                  <BreakdownSection title="Holding">
                    <BreakdownRow label="Monthly Costs" value={inputs.monthlyHoldingCosts} />
                    <BreakdownRow label={`Total (${inputs.holdingPeriodMonths} months)`} value={results.totalHoldingCosts} bold />
                  </BreakdownSection>
                  <BreakdownSection title="Selling">
                    <BreakdownRow label="Sale Closing" value={results.saleClosingCosts} />
                    <BreakdownRow label="Realtor Commission" value={results.realtorCommission} />
                    <BreakdownRow label="Total Selling" value={results.totalSellingCosts} bold />
                  </BreakdownSection>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OPM (Other People's Money) */}
          <button
            onClick={() => setShowOpm(!showOpm)}
            className="w-full px-4 py-3 text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/15 transition-colors flex items-center justify-between"
          >
            <span>How to Fund This (OPM Calculator)</span>
            <svg className={`w-4 h-4 transition-transform ${showOpm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showOpm && opmOptions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
                  <p className="text-xs text-amber-400 font-mono mb-1">CASH GAP TO FILL</p>
                  <p className="text-2xl font-mono font-bold text-amber-400">{fmtCurrency(results.cashRequired)}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    The hard money lender covers {fmtCurrency(results.loanAmount)} ({inputs.loanToValue}% LTV).
                    You need {fmtCurrency(results.cashRequired)} for down payment + costs.
                  </p>
                </div>

                {opmOptions.map((opt, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">{opt.name}</h4>
                      <span className="text-xs font-mono text-emerald-400">
                        Your profit: {fmtCurrency(opt.yourProfit)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">{opt.desc}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-sm font-mono font-bold text-emerald-400">{fmtCurrency(opt.yourCash)}</p>
                        <p className="text-[10px] text-zinc-600">Your Cash</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-sm font-mono font-bold text-cyan-400">{fmtCurrency(opt.partnerCash)}</p>
                        <p className="text-[10px] text-zinc-600">Partner Cash</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-sm font-mono font-bold text-amber-400">{fmtCurrency(opt.lenderCash)}</p>
                        <p className="text-[10px] text-zinc-600">Lender Cash</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">Split: {opt.profitSplit}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rental Hold Analysis */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">WHAT IF YOU HOLD AS RENTAL?</h3>
            <RentalAnalysis arv={inputs.arv} totalInvestment={results.totalInvestment} cashRequired={results.cashRequired} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Input Components ────────────────────────────────────────────────────

function InputSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const borderMap: Record<string, string> = {
    emerald: 'border-emerald-500/20',
    amber: 'border-amber-500/20',
    zinc: 'border-zinc-800',
  };

  return (
    <div className={`bg-zinc-900/50 border ${borderMap[color] || 'border-zinc-800'} rounded-xl p-4`}>
      <h3 className="text-xs font-mono font-semibold text-zinc-500 mb-3 tracking-wider">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function CurrencyInput({ label, value, onChange, highlight }: {
  label: string; value: number; onChange: (v: string) => void; highlight?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={`w-full pl-7 pr-3 py-2 rounded-lg text-sm font-mono outline-none transition-colors ${
            highlight
              ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 focus:border-emerald-500/40'
              : 'bg-black/40 border border-zinc-700/50 text-zinc-200 focus:border-zinc-500'
          }`}
        />
      </div>
    </div>
  );
}

function PercentInput({ label, value, onChange }: {
  label: string; value: number; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          step="0.5"
          className="w-full pl-3 pr-7 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-sm font-mono text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">%</span>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }: {
  label: string; value: number; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-sm font-mono text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
      />
    </div>
  );
}

// ─── Result Components ───────────────────────────────────────────────────

function WaterfallRow({ label, value, positive, isBold }: {
  label: string; value: number; positive?: boolean; isBold?: boolean;
}) {
  const isPos = value >= 0;
  return (
    <div className={`flex items-center justify-between ${isBold ? 'text-base' : 'text-sm'}`}>
      <span className={isBold ? 'font-semibold text-zinc-200' : 'text-zinc-400'}>{label}</span>
      <span className={`font-mono ${isBold ? 'font-bold' : ''} ${
        positive && isPos ? 'text-emerald-400' : !isPos ? 'text-red-400' : 'text-zinc-300'
      }`}>
        {isPos ? '+' : '-'}${fmt(Math.abs(value))}
      </span>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color?: string;
}) {
  const textColor = color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-zinc-200';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-lg font-mono font-bold ${textColor}`}>{value}</p>
      <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
    </div>
  );
}

function BreakdownSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-mono text-zinc-500 mb-1">{title}</p>
      <div className="space-y-1 pl-2 border-l border-zinc-800">
        {children}
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={bold ? 'text-zinc-300 font-medium' : 'text-zinc-500'}>{label}</span>
      <span className={`font-mono ${bold ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}`}>{fmtCurrency(value)}</span>
    </div>
  );
}

function RentalAnalysis({ arv, totalInvestment, cashRequired }: {
  arv: number; totalInvestment: number; cashRequired: number;
}) {
  // Rough rental estimate: 0.8% of ARV per month (conservative)
  const monthlyRent = arv * 0.008;
  const annualRent = monthlyRent * 12;
  // Operating expenses ~40% of gross rent
  const noi = annualRent * 0.6;
  const capRate = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
  const cashOnCash = cashRequired > 0 ? (noi / cashRequired) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="text-center">
        <p className="text-lg font-mono font-bold text-purple-400">{fmtCurrency(monthlyRent)}</p>
        <p className="text-[10px] text-zinc-600">Est. Monthly Rent</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-mono font-bold text-purple-400">{capRate.toFixed(1)}%</p>
        <p className="text-[10px] text-zinc-600">Cap Rate</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-mono font-bold text-purple-400">{fmtCurrency(noi)}</p>
        <p className="text-[10px] text-zinc-600">Annual NOI (60%)</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-mono font-bold text-purple-400">{cashOnCash.toFixed(1)}%</p>
        <p className="text-[10px] text-zinc-600">Cash-on-Cash</p>
      </div>
      <p className="col-span-2 text-[10px] text-zinc-700 text-center mt-1">
        BRRRR Strategy: Buy at {fmtCurrency(totalInvestment)}, rent at {fmtCurrency(monthlyRent)}/mo, refinance at 75% ARV ({fmtCurrency(arv * 0.75)})
      </p>
    </div>
  );
}
