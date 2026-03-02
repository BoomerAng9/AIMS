// Blockwise AI — Block Score Algorithm (0-100)
// Weighted neighborhood scoring: Schools 20%, Safety 20%, Appreciation 25%, Livability 20%, Development 15%

import type { BlockScore, VerdictLevel } from './types';

const WEIGHTS = {
  schools: 0.20,
  safety: 0.20,
  appreciation: 0.25,
  livability: 0.20,
  development: 0.15,
};

export interface BlockScoreInputs {
  avgSchoolRating: number;      // 1-10
  crimeScore: number;           // 0-100 (higher = safer)
  yoyCrimeTrend: number;        // percent change (negative = improving)
  oneYearAppreciation: number;  // percent
  walkScore: number;            // 0-100
  transitScore: number;         // 0-100
  bikeScore: number;            // 0-100
  permits6mo: number;
  gentrificationSignal: 'rising' | 'stable' | 'declining';
}

export function calculateBlockScore(data: BlockScoreInputs): BlockScore {
  const schools = (data.avgSchoolRating / 10) * 100;
  const safety = Math.min(100, data.crimeScore + (data.yoyCrimeTrend < 0 ? 10 : 0));

  const appreciation = Math.min(100, Math.max(0,
    data.oneYearAppreciation >= 15 ? 100 :
    data.oneYearAppreciation >= 0 ? 50 + (data.oneYearAppreciation / 15) * 50 :
    data.oneYearAppreciation * 5 + 50
  ));

  const livability = data.walkScore * 0.5 + data.transitScore * 0.3 + data.bikeScore * 0.2;

  const devBase = Math.min(100, data.permits6mo * 5);
  const devBonus = data.gentrificationSignal === 'rising' ? 20 :
                   data.gentrificationSignal === 'stable' ? 0 : -10;
  const development = Math.min(100, Math.max(0, devBase + devBonus));

  const overall = Math.round(
    schools * WEIGHTS.schools +
    safety * WEIGHTS.safety +
    appreciation * WEIGHTS.appreciation +
    livability * WEIGHTS.livability +
    development * WEIGHTS.development
  );

  return {
    overall,
    schools: Math.round(schools),
    safety: Math.round(safety),
    appreciation: Math.round(appreciation),
    livability: Math.round(livability),
    development: Math.round(development),
  };
}

export function getVerdict(score: number): VerdictLevel {
  if (score >= 80) return 'strong_buy';
  if (score >= 60) return 'worth_investigating';
  if (score >= 40) return 'proceed_with_caution';
  return 'walk_away';
}

export function getVerdictLabel(verdict: VerdictLevel): string {
  const labels: Record<VerdictLevel, string> = {
    strong_buy: 'STRONG BUY ZONE',
    worth_investigating: 'WORTH INVESTIGATING',
    proceed_with_caution: 'PROCEED WITH CAUTION',
    walk_away: 'WALK AWAY',
  };
  return labels[verdict];
}

export function getVerdictColor(verdict: VerdictLevel): string {
  const colors: Record<VerdictLevel, string> = {
    strong_buy: '#22c55e',
    worth_investigating: '#D4A843',
    proceed_with_caution: '#f97316',
    walk_away: '#ef4444',
  };
  return colors[verdict];
}
