'use client';

import { motion } from 'framer-motion';
import type {
  SchoolInfo,
  SafetyData,
  DemographicData,
  AppreciationData,
  WalkabilityData,
  DevelopmentData,
} from '@/lib/types';

interface NeighborhoodGridProps {
  schools: SchoolInfo[];
  safety: SafetyData;
  demographics: DemographicData;
  appreciation: AppreciationData;
  walkability: WalkabilityData;
  development: DevelopmentData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function CrimeLabel({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = { low: '#22c55e', medium: '#f97316', high: '#ef4444' };
  return (
    <span className="font-medium" style={{ color: colors[level] }}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

export function NeighborhoodGrid({
  schools,
  safety,
  demographics,
  appreciation,
  walkability,
  development,
}: NeighborhoodGridProps) {
  const cards = [
    {
      title: 'Schools',
      icon: '🏫',
      content: (
        <div className="space-y-2">
          {schools.length > 0 ? (
            schools.slice(0, 3).map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span className="text-zinc-300 truncate mr-2">{s.name}</span>
                <span className="font-medium" style={{ color: s.rating >= 7 ? '#22c55e' : s.rating >= 5 ? '#D4A843' : '#ef4444' }}>
                  {s.rating}/10
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-500">No school data available</div>
          )}
        </div>
      ),
    },
    {
      title: 'Safety',
      icon: '🛡️',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Violent Crime</span>
            <CrimeLabel level={safety.violentCrime} />
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Property Crime</span>
            <CrimeLabel level={safety.propertyCrime} />
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">YoY Trend</span>
            <span className={safety.yoyTrend < 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(safety.yoyTrend)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Sex Offenders</span>
            <span className="text-zinc-300">{safety.sexOffenderCount} within {safety.radius}mi</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Demographics',
      icon: '👥',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Population</span>
            <span className="text-zinc-300">{demographics.population.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Median Income</span>
            <span className="text-zinc-300">{formatCurrency(demographics.medianIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Median Age</span>
            <span className="text-zinc-300">{demographics.medianAge}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Owner-Occupied</span>
            <span className="text-zinc-300">{demographics.ownerOccupancyPercent}%</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Appreciation',
      icon: '📈',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">1 Year</span>
            <span className={appreciation.oneYear >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(appreciation.oneYear)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">3 Year</span>
            <span className={appreciation.threeYear >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(appreciation.threeYear)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">5 Year</span>
            <span className={appreciation.fiveYear >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(appreciation.fiveYear)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Forecast</span>
            <span className={appreciation.forecast >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(appreciation.forecast)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Walkability',
      icon: '🚶',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Walk Score</span>
            <span className="text-zinc-300 font-medium">{walkability.walkScore}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Transit Score</span>
            <span className="text-zinc-300 font-medium">{walkability.transitScore}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Bike Score</span>
            <span className="text-zinc-300 font-medium">{walkability.bikeScore}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Nearest Grocery</span>
            <span className="text-zinc-300">{walkability.nearestGroceryMiles.toFixed(1)} mi</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Development',
      icon: '🏗️',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Permits (6mo)</span>
            <span className="text-zinc-300">{development.permits6mo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">New Builds</span>
            <span className="text-zinc-300">{development.newBuilds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Avg Permit $</span>
            <span className="text-zinc-300">{formatCurrency(development.avgPermitValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Gentrification</span>
            <span className={
              development.gentrificationSignal === 'rising' ? 'text-green-400' :
              development.gentrificationSignal === 'stable' ? 'text-zinc-300' : 'text-red-400'
            }>
              {development.gentrificationSignal.charAt(0).toUpperCase() + development.gentrificationSignal.slice(1)}
            </span>
          </div>
          {development.rezoning && (
            <div className="mt-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-xs">
              Rezoning: {development.rezoning}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{card.icon}</span>
            <h3 className="text-sm font-semibold text-white">{card.title}</h3>
          </div>
          {card.content}
        </motion.div>
      ))}
    </div>
  );
}
