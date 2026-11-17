import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ShieldAlert, ShieldCheck, Award } from 'lucide-react';
import { AnimatedNumber } from './animations/AnimatedNumber';
import { formatCurrency, formatRMultiple } from '../utils/formatters';

interface DisciplineGaugeProps {
  score: number;
  readinessCount: number;
  dailyPnl: number;
  dailyR: number;
  tradesCount: number;
  maxTrades: number;
}

export const DisciplineGauge: React.FC<DisciplineGaugeProps> = ({
  score,
  readinessCount,
  dailyPnl,
  dailyR,
  tradesCount,
  maxTrades,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset =
    circumference - (clampedScore / 100) * circumference;

  const isGreen = clampedScore >= 80;
  const isAmber = clampedScore >= 50 && clampedScore < 80;
  const isElite = clampedScore >= 90;

  const strokeColor = isGreen
    ? '#10B981'
    : isAmber
    ? '#F59E0B'
    : '#EF4444';

  const statusLabel = isElite
    ? 'Peak Institutional Discipline'
    : isGreen
    ? 'Strong Rule Adherence'
    : isAmber
    ? 'Caution — Review Execution'
    : 'Critical Rule Violation';

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      className="relative overflow-hidden rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl"
    >
      {/* Animated Ambient Glow Behind Score Card */}
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.18, 0.32, 0.18],
                scale: [1, 1.08, 1],
              }
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl"
        style={{ backgroundColor: strokeColor }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Circular Discipline Gauge */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="rgba(148, 163, 184, 0.12)"
                strokeWidth="11"
                fill="none"
              />
              <motion.circle
                cx="70"
                cy="70"
                r={radius}
                stroke={strokeColor}
                strokeWidth="11"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </svg>

            {/* Center Score Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="flex items-baseline gap-0.5">
                <AnimatedNumber
                  value={clampedScore}
                  formatter={(v) => Math.round(v).toString()}
                  duration={0.85}
                  className="text-3xl font-extrabold text-slate-100"
                />
                <span className="text-xs font-semibold text-slate-400">
                  /100
                </span>
              </div>
              <span
                className="text-[11px] font-bold uppercase tracking-wider mt-0.5"
                style={{ color: strokeColor }}
              >
                Score
              </span>
            </div>

            {/* Sparkle Badge when Score >= 90 */}
            {isElite && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-[#0B0F19] flex items-center justify-center shadow-lg shadow-emerald-500/40"
                title="90+ Elite Discipline Sparkle"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </motion.div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-[#0B0F19]/80 border-slate-700/80 text-slate-200">
              {isGreen ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Daily Discipline Score</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              {statusLabel}
            </h2>
            <p className="text-sm text-slate-400 max-w-md">
              Auto-calculated from your pre-session checklist ({readinessCount}/3),
              1% risk cap adherence, session window discipline, and post-trade
              self-audit.
            </p>
          </div>
        </div>

        {/* Right: Quick Session Snapshot Pills */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0">
          <div className="p-4 rounded-2xl bg-[#0B0F19]/85 border border-slate-800/80 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Session P&amp;L
            </div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                dailyPnl > 0
                  ? 'text-emerald-400'
                  : dailyPnl < 0
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              <AnimatedNumber
                value={dailyPnl}
                formatter={(v) => formatCurrency(v, true)}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0F19]/85 border border-slate-800/80 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net R-Mult
            </div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                dailyR > 0
                  ? 'text-emerald-400'
                  : dailyR < 0
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              <AnimatedNumber
                value={dailyR}
                formatter={(v) => formatRMultiple(v)}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0F19]/85 border border-slate-800/80 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trades Used
            </div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                tradesCount >= maxTrades
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {tradesCount} / {maxTrades}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
