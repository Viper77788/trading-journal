import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Sparkles,
  RotateCcw,
  TrendingUp,
  Target,
  ShieldAlert,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CalculatorSettings,
  ProjectionPeriod,
} from '../types/settings';
import {
  ProjectionResults,
  MonteCarloBandPoint,
} from '../utils/monteCarlo';
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatRMultiple,
} from '../utils/formatters';
import { AnimatedNumber } from '../components/animations/AnimatedNumber';
import { StaggerContainer } from '../components/animations/StaggerContainer';
import { FadeInUp } from '../components/animations/FadeInUp';

interface FutureCalculatorProps {
  calcSettings: CalculatorSettings;
  onUpdateCalc: (patch: Partial<CalculatorSettings>) => void;
  onResetCalc: () => void;
  projection: ProjectionResults;
  monteCarlo: {
    bands: MonteCarloBandPoint[];
    medianEnding: number;
    p90Ending: number;
    p10Ending: number;
    probabilityOfProfit: number;
    probabilityOfMilestone: number;
  };
  realStats: {
    winRate: number;
    rewardToRisk: number;
    currentBalance: number;
  };
  onNotify: (title: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const FutureCalculator: React.FC<FutureCalculatorProps> = ({
  calcSettings,
  onUpdateCalc,
  onResetCalc,
  projection,
  monteCarlo,
  realStats,
  onNotify,
}) => {
  const [chartMode, setChartMode] = useState<'scenarios' | 'montecarlo'>(
    'scenarios'
  );

  const handleLoadRealStats = () => {
    onUpdateCalc({
      startingBalance: Math.max(100, Math.round(realStats.currentBalance)),
      winRate: Math.max(10, Math.min(90, realStats.winRate)),
      rewardToRisk: Math.max(0.5, Math.min(10, realStats.rewardToRisk)),
    });
    onNotify(
      `Loaded your real tracker stats (${realStats.winRate}% Win Rate, 1:${realStats.rewardToRisk} R:R)!`,
      'success'
    );
  };

  const periods: Array<{ id: ProjectionPeriod; label: string }> = [
    { id: '1m', label: '1 Month' },
    { id: '3m', label: '3 Months' },
    { id: '6m', label: '6 Months' },
    { id: '1y', label: '1 Year' },
    { id: 'custom', label: 'Custom' },
  ];

  const milestonePresets = [50000, 100000, 250000, 500000];

  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <FadeInUp>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              FEATURE 2 • ACCOUNT GROWTH &amp; MONTE CARLO SIMULATOR
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1 flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-emerald-400" />
              <span>Future Account Growth Calculator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Simulate compounding equity trajectories, Risk of Ruin, and
              1,000-run Monte Carlo probability bands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleLoadRealStats}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#0B0F19] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Load from my real stats</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onResetCalc}
              className="px-3.5 py-2.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </motion.button>
          </div>
        </div>
      </FadeInUp>

      {/* Main Grid: Left = Interactive Sliders & Inputs | Right = Live Outputs & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Parameters */}
        <FadeInUp delay={0.06} className="xl:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Simulation Parameters
              </h3>
              {/* Compounding ON/OFF Toggle */}
              <button
                type="button"
                onClick={() =>
                  onUpdateCalc({ compounding: !calcSettings.compounding })
                }
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  calcSettings.compounding
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Compounding: {calcSettings.compounding ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 1. Starting Balance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Starting Balance
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(calcSettings.startingBalance)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1000}
                  max={200000}
                  step={1000}
                  value={calcSettings.startingBalance}
                  onChange={(e) =>
                    onUpdateCalc({ startingBalance: Number(e.target.value) })
                  }
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <input
                  type="number"
                  value={calcSettings.startingBalance}
                  onChange={(e) =>
                    onUpdateCalc({
                      startingBalance: Math.max(100, Number(e.target.value) || 0),
                    })
                  }
                  className="w-28 bg-[#0B0F19] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* 2. Risk % per trade */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Risk % per Trade
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {calcSettings.riskPercent.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min={0.25}
                max={5}
                step={0.25}
                value={calcSettings.riskPercent}
                onChange={(e) =>
                  onUpdateCalc({ riskPercent: Number(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* 3. Win Rate % */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Win Rate %
                </span>
                <span className="font-mono font-bold text-sky-400">
                  {calcSettings.winRate}%
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={85}
                step={1}
                value={calcSettings.winRate}
                onChange={(e) =>
                  onUpdateCalc({ winRate: Number(e.target.value) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* 4. Average Risk:Reward Ratio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Average Risk:Reward Ratio
                </span>
                <span className="font-mono font-bold text-violet-400">
                  1 : {calcSettings.rewardToRisk.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={calcSettings.rewardToRisk}
                onChange={(e) =>
                  onUpdateCalc({ rewardToRisk: Number(e.target.value) })
                }
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>

            {/* 5. Trades per Day & Trading Days per Week */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">
                    Trades / Day
                  </span>
                  <span className="font-mono font-bold text-slate-100">
                    {calcSettings.tradesPerDay}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={calcSettings.tradesPerDay}
                  onChange={(e) =>
                    onUpdateCalc({ tradesPerDay: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">
                    Days / Week
                  </span>
                  <span className="font-mono font-bold text-slate-100">
                    {calcSettings.tradingDaysPerWeek}d
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={calcSettings.tradingDaysPerWeek}
                  onChange={(e) =>
                    onUpdateCalc({
                      tradingDaysPerWeek: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 6. Projection Period */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Projection Horizon
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {periods.map((p) => {
                  const active = calcSettings.period === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onUpdateCalc({ period: p.id })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-[#0B0F19] border-emerald-500'
                          : 'bg-[#0B0F19] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {calcSettings.period === 'custom' && (
                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Custom Months (1–36):
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={calcSettings.customMonths}
                    onChange={(e) =>
                      onUpdateCalc({
                        customMonths: Math.max(
                          1,
                          Math.min(36, Number(e.target.value) || 6)
                        ),
                      })
                    }
                    className="w-24 bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-100 outline-none"
                  />
                </div>
              )}
            </div>

            {/* 7. Optional Monthly Deposit/Withdrawal & Commission/Trade */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Monthly Cashflow ($)
                </label>
                <input
                  type="number"
                  step={100}
                  value={calcSettings.monthlyDepositOrWithdrawal}
                  onChange={(e) =>
                    onUpdateCalc({
                      monthlyDepositOrWithdrawal: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="+Deposit / -Withdraw"
                  className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Commission / Trade ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={calcSettings.commissionPerTrade}
                  onChange={(e) =>
                    onUpdateCalc({
                      commissionPerTrade: Math.max(
                        0,
                        Number(e.target.value) || 0
                      ),
                    })
                  }
                  className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Milestone Calculator Card ("How long to reach $X?") */}
          <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-bold text-slate-100">
                Milestone Calculator: &ldquo;How long to reach $X?&rdquo;
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {milestonePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdateCalc({ targetMilestone: preset })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    calcSettings.targetMilestone === preset
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                      : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {formatCompactCurrency(preset)}
                </button>
              ))}
              <input
                type="number"
                step={5000}
                value={calcSettings.targetMilestone}
                onChange={(e) =>
                  onUpdateCalc({
                    targetMilestone: Math.max(1000, Number(e.target.value) || 50000),
                  })
                }
                className="w-28 bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-100 outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F19]/90 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">
                  Estimated Time to Reach{' '}
                  <strong className="text-slate-200 font-mono">
                    {formatCurrency(calcSettings.targetMilestone)}
                  </strong>
                </div>
                <div className="text-lg font-extrabold font-mono text-violet-300 mt-1">
                  {projection.daysToReachMilestone === null
                    ? 'Edge negative — increase Win% or R:R'
                    : projection.daysToReachMilestone === 0
                    ? 'Already achieved!'
                    : `${projection.daysToReachMilestone} Trading Days (~${projection.monthsToReachMilestone} Months)`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Monte Carlo Hit Prob
                </div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  {monteCarlo.probabilityOfMilestone}%
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* RIGHT COLUMN: Live Outputs, Growth Chart, Monte Carlo & Monthly Table */}
        <FadeInUp delay={0.12} className="xl:col-span-7 space-y-6">
          {/* Top 6 Output Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Projected Ending Balance */}
            <div className="p-5 rounded-2xl bg-[#111827]/90 border border-emerald-500/30 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Projected Ending Balance
              </span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1.5">
                <AnimatedNumber
                  value={projection.expectedEndingBalance}
                  formatter={(v) => formatCurrency(v)}
                />
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                After {projection.totalTrades} trades ({projection.monthsCount}m)
              </span>
            </div>

            {/* 2. Total Net Profit $ & % */}
            <div className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Net Profit
              </span>
              <div
                className={`text-2xl font-extrabold font-mono mt-1.5 ${
                  projection.totalNetProfitDollar >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                <AnimatedNumber
                  value={projection.totalNetProfitDollar}
                  formatter={(v) => formatCurrency(v, true)}
                />
              </div>
              <span className="text-xs font-mono text-emerald-300 mt-1 block">
                {formatPercent(projection.totalNetProfitPercent, 1, true)} ROI
              </span>
            </div>

            {/* 3. Expectancy per Trade (R and $) */}
            <div className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Expectancy / Trade
              </span>
              <div
                className={`text-2xl font-extrabold font-mono mt-1.5 ${
                  projection.expectancyR > 0
                    ? 'text-sky-400'
                    : 'text-rose-400'
                }`}
              >
                {formatRMultiple(projection.expectancyR)}
              </div>
              <span className="text-xs font-mono text-slate-400 mt-1 block">
                Initial: {formatCurrency(projection.expectancyInitialDollar, true)} / trade
              </span>
            </div>

            {/* 4. Max Drawdown Estimate */}
            <div className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Est. Max Drawdown
              </span>
              <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1.5">
                -{projection.maxDrawdownPercent}%
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                During peak losing cluster
              </span>
            </div>

            {/* 5. Risk of Ruin Probability */}
            <div className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Risk of Ruin
              </span>
              <div
                className={`text-2xl font-extrabold font-mono mt-1.5 ${
                  projection.riskOfRuinPercent < 2
                    ? 'text-emerald-400'
                    : projection.riskOfRuinPercent < 15
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {projection.riskOfRuinPercent}%
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Account depletion probability
              </span>
            </div>

            {/* 6. Longest Expected Losing Streak */}
            <div className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Longest Losing Streak
              </span>
              <div className="text-2xl font-extrabold font-mono text-rose-300 mt-1.5">
                {projection.longestLosingStreak} Losses
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Expected over {projection.totalTrades} trades
              </span>
            </div>
          </div>

          {/* Growth Curve Chart (Best / Expected / Worst Case vs. 1,000-Run Monte Carlo) */}
          <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>
                    {chartMode === 'scenarios'
                      ? 'Projected Growth Curve (Best / Expected / Worst Case)'
                      : '1,000-Run Monte Carlo Probability Fan (P10 / P50 / P90)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {chartMode === 'scenarios'
                    ? 'Compares baseline win rate against +6% best-case and -6% worst-case variance.'
                    : `1,000 randomized paths • Median: ${formatCompactCurrency(
                        monteCarlo.medianEnding
                      )} • P90: ${formatCompactCurrency(
                        monteCarlo.p90Ending
                      )} • P10: ${formatCompactCurrency(monteCarlo.p10Ending)}`}
                </p>
              </div>

              <div className="inline-flex p-1 rounded-xl bg-[#0B0F19] border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setChartMode('scenarios')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    chartMode === 'scenarios'
                      ? 'bg-emerald-500 text-[#0B0F19]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Scenarios
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('montecarlo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    chartMode === 'montecarlo'
                      ? 'bg-violet-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Monte Carlo (1,000x)</span>
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'scenarios' ? (
                  <AreaChart
                    data={projection.growthChartData}
                    margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                    />
                    <XAxis dataKey="period" stroke="#64748B" fontSize={12} />
                    <YAxis
                      tickFormatter={(v) => formatCompactCurrency(v)}
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B0F19',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="bestCase"
                      name="Best Case (+6% WR)"
                      stroke="#38BDF8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="expected"
                      name="Expected Trajectory"
                      stroke="#10B981"
                      strokeWidth={3}
                      fill="url(#expGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="worstCase"
                      name="Worst Case (-6% WR)"
                      stroke="#F43F5E"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="none"
                    />
                  </AreaChart>
                ) : (
                  <AreaChart
                    data={monteCarlo.bands}
                    margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                    />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
                    <YAxis
                      tickFormatter={(v) => formatCompactCurrency(v)}
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B0F19',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="p90"
                      name="90th Percentile (Top 10%)"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="p50"
                      name="Median (50th Percentile)"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fill="url(#mcGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="p10"
                      name="10th Percentile (Bottom 10%)"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill="none"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-slate-100">
                  Monthly Breakdown Schedule
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {projection.monthsCount} Months •{' '}
                {calcSettings.compounding ? 'Compounded' : 'Fixed Risk'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#0B0F19]/80">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-[#111827]">
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Start Balance</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Wins / Losses</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-right">End Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {projection.monthlyBreakdown.map((row) => (
                    <tr
                      key={row.month}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                        {row.label}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {formatCurrency(row.startBalance)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {row.tradesCount}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold">
                          {row.wins}W
                        </span>{' '}
                        /{' '}
                        <span className="text-rose-400 font-semibold">
                          {row.losses}L
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          row.netProfit >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(row.netProfit, true)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">
                        {formatCurrency(row.endBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeInUp>
      </div>
    </StaggerContainer>
  );
};
