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
    <section aria-label="Today at a glance" className="space-y-2.5">
      {/* Card 1: Discipline Score (~76px tall, progress bar on the same line) */}
      <div className="px-4 py-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-bold text-[#8B5E3C] leading-tight">
            Discipline Score
          </div>
          <div className="mt-1.5 w-32 sm:w-40 h-3 rounded-full bg-[#FFFBF2] border border-[#8B5E3C] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${clampedScore}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ backgroundColor: barBgColor }}
              className="h-full rounded-full"
            />
          </div>
        </div>

        <div className={`text-[26px] font-extrabold leading-none shrink-0 ${scoreTextColor}`}>
          <AnimatedNumber
            value={clampedScore}
            formatter={(v) => `${Math.round(v)} / 100`}
          />
        </div>
      </div>

      {/* Card 2: Today's Profit / Loss (~72px tall, single compact row) */}
      <div
        className={`px-4 py-3 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-3 ${pnlCardBg}`}
      >
        <div className="text-[16px] font-bold text-[#8B5E3C]">
          Today&apos;s Profit / Loss
        </div>
        <div className={`text-[26px] font-extrabold leading-none ${pnlTextColor}`}>
          <AnimatedNumber
            value={dailyPnl}
            formatter={(v) => formatCurrency(v, true)}
          />
        </div>
      </div>

      {/* Card 3: Trades Today (~72px tall, single compact row) */}
      <div className="px-4 py-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
        <div className="text-[16px] font-bold text-[#8B5E3C]">
          Trades Today
        </div>
        <div className="text-[26px] font-extrabold text-[#5C3D2E] leading-none">
          {tradesCount} of {maxTrades}
        </div>
      </div>
    </section>
  );
};
