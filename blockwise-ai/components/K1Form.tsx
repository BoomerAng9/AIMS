'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { calculateK1 } from '@/lib/k1-formulas';
import type { K1Inputs, K1Outputs } from '@/lib/types';

interface K1FormProps {
  initialAddress?: string;
  initialPrice?: number;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export function K1Form({ initialAddress, initialPrice }: K1FormProps) {
  const [inputs, setInputs] = useState<K1Inputs>({
    entityType: 'llc',
    filingStatus: 'single',
    state: 'TX',
    purchasePrice: initialPrice ?? 200000,
    landValue: 40000,
    holdingDays: 365,
    holdingPeriodMonths: 12,
    flipProfit: 50000,
    rentalIncome: 0,
    propertyTaxDeduction: 4000,
    mortgageInterestDeduction: 8000,
    insuranceCost: 1200,
    repairCosts: 0,
    materialParticipation: true,
  });

  const [outputs, setOutputs] = useState<K1Outputs | null>(null);
  const [activeTab, setActiveTab] = useState<'inputs' | 'results'>('inputs');

  function handleChange(field: keyof K1Inputs, value: string | number | boolean) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function handleNumberChange(field: keyof K1Inputs, raw: string) {
    const parsed = parseFloat(raw);
    handleChange(field, isNaN(parsed) ? 0 : parsed);
  }

  function handleGenerate() {
    const result = calculateK1(inputs);
    setOutputs(result);
    setActiveTab('results');
  }

  const inputClass =
    'bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30 outline-none w-full';

  const selectClass =
    'bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30 outline-none w-full';

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      {initialAddress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-center"
        >
          <h2 className="text-lg font-semibold text-zinc-300">{initialAddress}</h2>
        </motion.div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab('inputs')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'inputs'
              ? 'bg-[#D4A843] text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Inputs
        </button>
        <button
          onClick={() => setActiveTab('results')}
          disabled={!outputs}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'results'
              ? 'bg-[#D4A843] text-black'
              : outputs
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 cursor-not-allowed'
          }`}
        >
          Results
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'inputs' && (
        <motion.div
          key="inputs"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Entity & Filing */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Entity &amp; Filing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Entity Type</label>
                <select
                  value={inputs.entityType}
                  onChange={(e) => handleChange('entityType', e.target.value)}
                  className={selectClass}
                >
                  <option value="llc">LLC</option>
                  <option value="s_corp">S-Corp</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Filing Status</label>
                <select
                  value={inputs.filingStatus}
                  onChange={(e) => handleChange('filingStatus', e.target.value)}
                  className={selectClass}
                >
                  <option value="single">Single</option>
                  <option value="married_filing_jointly">Married Filing Jointly</option>
                  <option value="married_filing_separately">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">State</label>
              <select
                value={inputs.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className={selectClass}
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Property */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Property
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => handleNumberChange('purchasePrice', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Land Value</label>
                <input
                  type="number"
                  value={inputs.landValue}
                  onChange={(e) => handleNumberChange('landValue', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Holding Days</label>
                <input
                  type="number"
                  value={inputs.holdingDays}
                  onChange={(e) => handleNumberChange('holdingDays', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Holding Period (Months)</label>
                <input
                  type="number"
                  value={inputs.holdingPeriodMonths}
                  onChange={(e) => handleNumberChange('holdingPeriodMonths', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Income */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Income
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Flip Profit</label>
                <input
                  type="number"
                  value={inputs.flipProfit}
                  onChange={(e) => handleNumberChange('flipProfit', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Rental Income</label>
                <input
                  type="number"
                  value={inputs.rentalIncome}
                  onChange={(e) => handleNumberChange('rentalIncome', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Deductions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Property Tax Deduction</label>
                <input
                  type="number"
                  value={inputs.propertyTaxDeduction}
                  onChange={(e) => handleNumberChange('propertyTaxDeduction', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Mortgage Interest Deduction</label>
                <input
                  type="number"
                  value={inputs.mortgageInterestDeduction}
                  onChange={(e) => handleNumberChange('mortgageInterestDeduction', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Insurance Cost</label>
                <input
                  type="number"
                  value={inputs.insuranceCost}
                  onChange={(e) => handleNumberChange('insuranceCost', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Repair Costs</label>
                <input
                  type="number"
                  value={inputs.repairCosts}
                  onChange={(e) => handleNumberChange('repairCosts', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Participation */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Participation
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  inputs.materialParticipation ? 'bg-[#D4A843]' : 'bg-white/10'
                }`}
                onClick={() => handleChange('materialParticipation', !inputs.materialParticipation)}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    inputs.materialParticipation ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-sm text-zinc-300">Material Participation</span>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="bg-[#D4A843] text-black font-bold py-3 rounded-lg w-full hover:bg-[#c49a3a] transition-colors"
          >
            Generate K1
          </button>
        </motion.div>
      )}

      {activeTab === 'results' && outputs && (
        <motion.div
          key="results"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Hero Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total Tax</div>
                <div className="text-3xl font-bold text-red-400 tabular-nums">
                  {fmt.format(outputs.totalTax)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Net After Tax</div>
                <div className="text-3xl font-bold text-emerald-400 tabular-nums">
                  {fmt.format(outputs.netAfterTax)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Effective Rate</div>
                <div
                  className={`text-3xl font-bold tabular-nums ${
                    outputs.effectiveRate <= 15
                      ? 'text-emerald-400'
                      : outputs.effectiveRate <= 30
                        ? 'text-[#D4A843]'
                        : 'text-red-400'
                  }`}
                >
                  {outputs.effectiveRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Tax Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Capital Gain Type */}
              <div className="col-span-2">
                <div className="text-xs text-zinc-400 mb-1">Capital Gain Type</div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    outputs.capitalGainType === 'short_term'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {outputs.capitalGainType === 'short_term' ? 'Short Term' : 'Long Term'}
                </span>
              </div>

              {/* Ordinary Income */}
              <div>
                <div className="text-xs text-zinc-400 mb-1">Ordinary Income</div>
                <div className="text-lg font-semibold text-white tabular-nums">
                  {fmtCents.format(outputs.ordinaryIncome)}
                </div>
              </div>

              {/* Depreciation */}
              <div>
                <div className="text-xs text-zinc-400 mb-1">Depreciation</div>
                <div className="text-lg font-semibold text-emerald-400 tabular-nums">
                  +{fmtCents.format(outputs.depreciation)}
                </div>
              </div>

              {/* Total Deductions */}
              <div>
                <div className="text-xs text-zinc-400 mb-1">Total Deductions</div>
                <div className="text-lg font-semibold text-emerald-400 tabular-nums">
                  {fmtCents.format(outputs.totalDeductions)}
                </div>
              </div>

              {/* Taxable Income */}
              <div>
                <div className="text-xs text-zinc-400 mb-1">Taxable Income</div>
                <div className="text-lg font-semibold text-white tabular-nums">
                  {fmtCents.format(outputs.taxableIncome)}
                </div>
              </div>

              {/* Federal Tax */}
              <div>
                <div className="text-xs text-zinc-400 mb-1">Federal Tax</div>
                <div className="text-lg font-semibold text-red-400 tabular-nums">
                  {fmtCents.format(outputs.federalTax)}
                </div>
              </div>

              {/* State Tax */}
              <div>
                <div className="text-xs text-zinc-400 mb-1">State Tax</div>
                <div className="text-lg font-semibold text-red-400 tabular-nums">
                  {fmtCents.format(outputs.stateTax)}
                </div>
              </div>

              {/* Self-Employment Tax (only if > 0) */}
              {outputs.selfEmploymentTax > 0 && (
                <div className="col-span-2">
                  <div className="text-xs text-zinc-400 mb-1">Self-Employment Tax</div>
                  <div className="text-lg font-semibold text-red-400 tabular-nums">
                    {fmtCents.format(outputs.selfEmploymentTax)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
