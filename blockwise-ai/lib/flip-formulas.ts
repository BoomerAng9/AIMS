// Blockwise AI — LUC Flip Calculator Engine
// 19 formulas from Jake Leicht's flip methodology, branded as LUC Real Estate Calculator

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
  const maxOffer = (inputs.arv * 0.70) - totalRepairCosts; // 70% Rule
  const dealStatus = roi >= 20 ? 'Excellent Deal' :
                     roi >= 15 ? 'Good Deal' :
                     roi >= 10 ? 'Marginal Deal' : 'Pass';

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

export function calculateSensitivity(
  inputs: FlipInputs,
  steps: number[] = [-20000, -10000, 0, 10000, 20000]
): SensitivityRow[] {
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

/** Default flip inputs for new calculations */
export const DEFAULT_FLIP_INPUTS: FlipInputs = {
  purchasePrice: 0,
  repairCosts: 0,
  arv: 0,
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
