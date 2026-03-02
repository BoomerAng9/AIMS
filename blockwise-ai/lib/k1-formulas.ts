// Blockwise AI — K1 Tax Calculation Engine
// 10 formulas: depreciation, SE tax, federal brackets, state rates, effective rate

import type { K1Inputs, K1Outputs } from './types';
import stateTaxRates from '@/data/state-tax-rates.json';

export function calculateK1(inputs: K1Inputs): K1Outputs {
  const rates = stateTaxRates as Record<string, number>;
  const stateRate = rates[inputs.state] ?? rates.DEFAULT;
  const capitalGainType = inputs.holdingDays >= 365 ? 'long_term' : 'short_term';

  // Straight-line depreciation over 27.5 years
  const depreciation = (inputs.purchasePrice - inputs.landValue) / 27.5 * (inputs.holdingPeriodMonths / 12);

  const totalDeductions = depreciation +
    inputs.propertyTaxDeduction +
    inputs.mortgageInterestDeduction +
    inputs.insuranceCost +
    inputs.repairCosts;

  const taxableIncome = Math.max(inputs.flipProfit - totalDeductions, 0);

  // Self-employment tax: 15.3% on 92.35% of income (if active participant)
  const selfEmploymentTax = inputs.materialParticipation
    ? taxableIncome * 0.9235 * 0.153
    : 0;

  // 2025 federal tax brackets (single, simplified marginal)
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
