import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './animations/AnimatedNumber';
import { formatCurrency } from '../utils/formatters';

interface DisciplineGaugeProps {
  score: number;
  dailyPnl: number;
  tradesCount: number;
  maxTrades: number;
}

export const DisciplineGauge: React.FC<DisciplineGaugeProps> = ({
  score,
  dailyPnl,
  tradesCount,
  maxTrades,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  const barBgColor =
    clampedScore >= 80
      ? '#BFE3C0'
      : clampedScore >= 50
      ? '#F7E2A0'
      : '#F5B8B0';

  const scoreTextColor =
    clampedScore >= 80
      ? 'text-[#2F6B3A]'
      : clampedScore >= 50
      ? 'text-[#8B5E3C]'
      : 'text-[#9B2C20]';

  const pnlCardBg =
    dailyPnl > 0
      ? 'bg-[#BFE3C0]/45'
      : dailyPnl < 0
      ? 'bg-[#F5B8B0]/45'
      : 'bg-[#FFFDF7]';

  const pnlTextColor =
    dailyPnl > 0
      ? 'text-[#2F6B3A]'
      : dailyPnl < 0
      ? 'text-[#9B2C20]'
      : 'text-[#5C3D2E]';

  return (
    <section aria-label="Today at a glance" className="space-y-3">
      {/* 3.1 Today at a glance: One row of 3 big simple cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Discipline Score */}
        <div className="p-5 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex flex-col justify-between">
          <div className="text-[17px] font-bold text-[#8B5E3C]">
            Discipline Score
          </div>
          <div className={`text-[32px] font-extrabold mt-1 ${scoreTextColor}`}>
            <AnimatedNumber
              value={clampedScore}
              formatter={(v) => `${Math.round(v)} / 100`}
            />
          </div>
          {/* Plain progress bar underneath */}
          <div className="mt-3 w-full h-4 rounded-full bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${clampedScore}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ backgroundColor: barBgColor }}
              className="h-full rounded-full"
            />
          </div>
        </div>

        {/* Card 2: Today's Profit / Loss */}
        <div
          className={`p-5 rounded-2xl border-2 border-[#8B5E3C] flex flex-col justify-between ${pnlCardBg}`}
        >
          <div className="text-[17px] font-bold text-[#8B5E3C]">
            Today&apos;s Profit / Loss
          </div>
          <div className={`text-[32px] font-extrabold mt-1 ${pnlTextColor}`}>
            <AnimatedNumber
              value={dailyPnl}
              formatter={(v) => formatCurrency(v, true)}
            />
          </div>
          <div className="text-[16px] font-semibold text-[#5C3D2E] mt-2">
            {dailyPnl > 0
              ? 'Great job staying green today'
              : dailyPnl < 0
              ? 'Keep losses small and stick to rules'
              : 'No profit or loss recorded yet'}
          </div>
        </div>

        {/* Card 3: Trades Today */}
        <div className="p-5 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex flex-col justify-between">
          <div className="text-[17px] font-bold text-[#8B5E3C]">
            Trades Today
          </div>
          <div className="text-[32px] font-extrabold text-[#5C3D2E] mt-1">
            {tradesCount} of {maxTrades}
          </div>
          <div className="text-[16px] font-semibold text-[#5C3D2E] mt-2">
            {tradesCount >= maxTrades
              ? 'Daily limit reached — stop trading'
              : `${maxTrades - tradesCount} trade${
                  maxTrades - tradesCount === 1 ? '' : 's'
                } left today`}
          </div>
        </div>
      </div>
    </section>
  );
};
