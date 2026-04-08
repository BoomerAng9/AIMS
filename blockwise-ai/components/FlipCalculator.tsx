'use client';

import { useState } from 'react';
import { calculateFlip, calculateSensitivity, calculateOpm } from '@/lib/flip-formulas';
import { DEFAULT_FLIP_INPUTS } from '@/lib/flip-formulas';
import type { FlipInputs, FlipOutputs, SensitivityRow, OpmBreakdown } from '@/lib/types';
import { motion } from 'framer-motion';

interface FlipCalculatorProps {
  initialAddress?: string;
  initialPrice?: number;
  initialArv?: number;
}

type Tab = 'inputs' | 'results' | 'sensitivity' | 'opm';

const TABS: { key: Tab; label: string }[] = [
  { key: 'inputs', label: 'Inputs' },
  { key: 'results', label: 'Results' },
  { key: 'sensitivity', label: 'Sensitivity' },
  { key: 'opm', label: 'OPM' },
];

const inputStyle =
  'bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30 outline-none w-full';

const glassCard = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function InputField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-zinc-300 whitespace-nowrap">
        {label}
        {suffix && <span className="text-zinc-500 ml-1">({suffix})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`${inputStyle} max-w-[180px] text-right`}
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mt-6 mb-3 first:mt-0">
      {title}
    </h3>
  );
}

// ── Inputs Tab ──

function InputsTab({
  inputs,
  setInputs,
  onCalculate,
}: {
  inputs: FlipInputs;
  setInputs: React.Dispatch<React.SetStateAction<FlipInputs>>;
  onCalculate: () => void;
}) {
  const update = (field: keyof FlipInputs) => (v: number) =>
    setInputs((prev) => ({ ...prev, [field]: v }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${glassCard} p-6`}
    >
      <SectionHeader title="Deal" />
      <div className="space-y-3">
        <InputField label="Purchase Price" value={inputs.purchasePrice} onChange={update('purchasePrice')} suffix="$" />
        <InputField label="After Repair Value" value={inputs.arv} onChange={update('arv')} suffix="$" />
        <InputField label="Repair Costs" value={inputs.repairCosts} onChange={update('repairCosts')} suffix="$" />
      </div>

      <SectionHeader title="Financing" />
      <div className="space-y-3">
        <InputField label="Loan-to-Value" value={inputs.loanToValue} onChange={update('loanToValue')} suffix="%" />
        <InputField label="Interest Rate" value={inputs.interestRate} onChange={update('interestRate')} suffix="%" />
        <InputField label="Loan Points" value={inputs.loanPoints} onChange={update('loanPoints')} suffix="%" />
      </div>

      <SectionHeader title="Holding" />
      <div className="space-y-3">
        <InputField
          label="Holding Period"
          value={inputs.holdingPeriodMonths}
          onChange={update('holdingPeriodMonths')}
          suffix="months"
        />
        <InputField
          label="Monthly Holding Costs"
          value={inputs.monthlyHoldingCosts}
          onChange={update('monthlyHoldingCosts')}
          suffix="$"
        />
      </div>

      <SectionHeader title="Costs" />
      <div className="space-y-3">
        <InputField
          label="Purchase Closing Cost"
          value={inputs.purchaseClosingCostPercent}
          onChange={update('purchaseClosingCostPercent')}
          suffix="%"
        />
        <InputField
          label="Sale Closing Cost"
          value={inputs.saleClosingCostPercent}
          onChange={update('saleClosingCostPercent')}
          suffix="%"
        />
        <InputField
          label="Realtor Commission"
          value={inputs.realtorCommissionPercent}
          onChange={update('realtorCommissionPercent')}
          suffix="%"
        />
        <InputField
          label="Contingency"
          value={inputs.contingencyPercent}
          onChange={update('contingencyPercent')}
          suffix="%"
        />
      </div>

      <button
        onClick={onCalculate}
        className="bg-[#D4A843] text-black font-bold py-3 rounded-lg w-full hover:bg-[#c49a3a] mt-6 transition-colors"
      >
        Calculate
      </button>
    </motion.div>
  );
}

// ── Results Tab ──

function ResultsTab({ outputs }: { outputs: FlipOutputs }) {
  const profitColor = outputs.profit >= 0 ? 'text-emerald-400' : 'text-red-400';
  const roiColor = outputs.roi >= 0 ? 'text-emerald-400' : 'text-red-400';

  const statusColor =
    outputs.dealStatus === 'Excellent Deal'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : outputs.dealStatus === 'Good Deal'
        ? 'bg-green-500/20 text-green-300 border-green-500/30'
        : outputs.dealStatus === 'Marginal Deal'
          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
          : 'bg-red-500/20 text-red-300 border-red-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Hero Row */}
      <div className={`${glassCard} p-6`}>
        <div className="grid grid-cols-3 gap-4 items-center text-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Profit</p>
            <p className={`text-2xl font-bold ${profitColor}`}>{formatCurrency(outputs.profit)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">ROI</p>
            <p className={`text-2xl font-bold ${roiColor}`}>{formatPercent(outputs.roi)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Verdict</p>
            <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
              {outputs.dealStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`${glassCard} p-4 text-center`}>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Max Offer (70% Rule)</p>
          <p className="text-lg font-bold text-[#D4A843]">{formatCurrency(outputs.maxOffer)}</p>
        </div>
        <div className={`${glassCard} p-4 text-center`}>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Total Investment</p>
          <p className="text-lg font-bold text-white">{formatCurrency(outputs.totalInvestment)}</p>
        </div>
        <div className={`${glassCard} p-4 text-center`}>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Cash Required</p>
          <p className="text-lg font-bold text-white">{formatCurrency(outputs.cashRequired)}</p>
        </div>
      </div>

      {/* Detail Grid */}
      <div className={`${glassCard} p-6`}>
        <SectionHeader title="Cost Breakdown" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Loan Amount</span>
            <span className="text-sm text-white font-medium">{formatCurrency(outputs.loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Financing Costs</span>
            <span className="text-sm text-white font-medium">{formatCurrency(outputs.totalFinancingCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Holding Costs</span>
            <span className="text-sm text-white font-medium">{formatCurrency(outputs.totalHoldingCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Selling Costs</span>
            <span className="text-sm text-white font-medium">{formatCurrency(outputs.totalSellingCosts)}</span>
          </div>
          <div className="flex justify-between col-span-2 border-t border-white/10 pt-3 mt-1">
            <span className="text-sm text-zinc-300 font-semibold">Total Costs</span>
            <span className="text-sm text-white font-bold">{formatCurrency(outputs.totalCosts)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Sensitivity Tab ──

function SensitivityTab({ rows }: { rows: SensitivityRow[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${glassCard} p-6 overflow-x-auto`}
    >
      <SectionHeader title="ARV Sensitivity Analysis" />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-zinc-500 uppercase tracking-wider text-xs">
            <th className="text-left py-2 pr-4">ARV</th>
            <th className="text-right py-2 px-4">Profit</th>
            <th className="text-right py-2 pl-4">ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowColor = row.profit >= 0 ? 'text-emerald-400' : 'text-red-400';
            const baselineClass = row.isBaseline
              ? 'border border-[#D4A843]/50 bg-[#D4A843]/5'
              : '';
            return (
              <tr key={i} className={`${baselineClass} transition-colors`}>
                <td className="py-2 pr-4 text-white font-medium">{formatCurrency(row.arv)}</td>
                <td className={`py-2 px-4 text-right font-medium ${rowColor}`}>
                  {formatCurrency(row.profit)}
                </td>
                <td className={`py-2 pl-4 text-right font-medium ${rowColor}`}>
                  {formatPercent(row.roi)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}

// ── OPM Tab ──

function OpmBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{formatCurrency(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#D4A843] to-[#c49a3a]"
        />
      </div>
    </div>
  );
}

function OpmTab({ opm }: { opm: OpmBreakdown }) {
  const maxVal = Math.max(opm.cashIn, opm.hmlCovers, opm.pointsAndInterest, opm.totalOutOfPocket, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${glassCard} p-6`}
    >
      <SectionHeader title="Other People's Money Breakdown" />
      <div className="space-y-5">
        <OpmBar label="Your Cash In" value={opm.cashIn} max={maxVal} />
        <OpmBar label="Hard Money Lender Covers" value={opm.hmlCovers} max={maxVal} />
        <OpmBar label="Points & Interest" value={opm.pointsAndInterest} max={maxVal} />
        <div className="border-t border-white/10 pt-4">
          <OpmBar label="Total Out-of-Pocket" value={opm.totalOutOfPocket} max={maxVal} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ──

export function FlipCalculator({ initialAddress, initialPrice, initialArv }: FlipCalculatorProps) {
  const [inputs, setInputs] = useState<FlipInputs>(() => ({
    ...DEFAULT_FLIP_INPUTS,
    ...(initialPrice != null ? { purchasePrice: initialPrice } : {}),
    ...(initialArv != null ? { arv: initialArv } : {}),
  }));
  const [outputs, setOutputs] = useState<FlipOutputs | null>(null);
  const [sensitivity, setSensitivity] = useState<SensitivityRow[]>([]);
  const [opm, setOpm] = useState<OpmBreakdown | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('inputs');

  function handleCalculate() {
    const flipOutputs = calculateFlip(inputs);
    const sensitivityRows = calculateSensitivity(inputs);
    const opmBreakdown = calculateOpm(inputs, flipOutputs);
    setOutputs(flipOutputs);
    setSensitivity(sensitivityRows);
    setOpm(opmBreakdown);
    setActiveTab('results');
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Address Header */}
      {initialAddress && (
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{initialAddress}</h2>
          <p className="text-sm text-zinc-500 mt-1">LUC Flip Calculator</p>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const isDisabled = tab.key !== 'inputs' && outputs === null;
          return (
            <button
              key={tab.key}
              onClick={() => !isDisabled && setActiveTab(tab.key)}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#D4A843] text-black'
                  : isDisabled
                    ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                    : 'bg-white/10 text-zinc-300 hover:bg-white/15'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'inputs' && (
        <InputsTab inputs={inputs} setInputs={setInputs} onCalculate={handleCalculate} />
      )}
      {activeTab === 'results' && outputs && <ResultsTab outputs={outputs} />}
      {activeTab === 'sensitivity' && sensitivity.length > 0 && <SensitivityTab rows={sensitivity} />}
      {activeTab === 'opm' && opm && <OpmTab opm={opm} />}
    </div>
  );
}
