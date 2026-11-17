import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
} from '../utils/formatters';
import { AnimatedNumber } from '../components/animations/AnimatedNumber';
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
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
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
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const handleUseRealStats = () => {
    onUpdateCalc({
      startingBalance: Math.max(100, Math.round(realStats.currentBalance)),
      winRate: Math.max(
        10,
        Math.min(90, Math.round(realStats.winRate || 50))
      ),
      rewardToRisk: Math.max(0.5, Math.min(10, realStats.rewardToRisk || 2)),
    });
    onNotify('Filled in your real stats from your tracker!', 'success');
  };

  const periods: Array<{ id: ProjectionPeriod; label: string }> = [
    { id: '1m', label: '1 Month' },
    { id: '3m', label: '3 Months' },
    { id: '6m', label: '6 Months' },
    { id: '1y', label: '1 Year' },
    { id: 'custom', label: 'Custom' },
  ];

  const periodText =
    calcSettings.period === '1m'
      ? '1 month'
      : calcSettings.period === '3m'
      ? '3 months'
      : calcSettings.period === '6m'
      ? '6 months'
      : calcSettings.period === '1y'
      ? '1 year'
      : `${projection.monthsCount} months`;

  return (
    <FadeInUp>
      <div className="paper-sheet p-5 sm:p-8 space-y-7">
        {/* Title + Dotted Line + "Use my real stats" Pastel Button */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="font-heading text-[32px] sm:text-[38px] font-bold uppercase text-[#8B5E3C] leading-none m-0">
              FUTURE CALCULATOR
            </h1>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleUseRealStats}
                className="min-h-[50px] px-5 py-2.5 rounded-2xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase text-[#2F6B3A] shadow-sm cursor-pointer"
              >
                Use my real stats
              </button>
              <button
                type="button"
                onClick={onResetCalc}
                className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FFFBF2] hover:bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="dotted-divider w-full pt-1" />
        </div>

        {/* Two-Column Layout on Wide Screens (>= 1100px): LEFT = Inputs | RIGHT = Results + Chart */}
        <div className="two-col-1100">
          {/* LEFT COLUMN: 5 Main Inputs + Collapsible "More options" */}
          <section aria-label="Main calculator inputs" className="space-y-4 min-w-0">
            {/* 1. Starting Balance */}
            <div className="p-4 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[18px] font-extrabold text-[#5C3D2E]">
                  1. Starting Balance ($)
                </label>
                <input
                  type="number"
                  value={calcSettings.startingBalance}
                  onChange={(e) =>
                    onUpdateCalc({
                      startingBalance: Math.max(
                        100,
                        Number(e.target.value) || 0
                      ),
                    })
                  }
                  className="w-36 min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
                />
              </div>
              <input
                type="range"
                min={1000}
                max={200000}
                step={1000}
                value={calcSettings.startingBalance}
                onChange={(e) =>
                  onUpdateCalc({ startingBalance: Number(e.target.value) })
                }
                className="w-full cursor-pointer"
              />
            </div>

            {/* 2. Risk % */}
            <div className="p-4 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[18px] font-extrabold text-[#5C3D2E]">
                  2. Risk % per trade
                </label>
                <input
                  type="number"
                  step={0.25}
                  min={0.1}
                  max={25}
                  value={calcSettings.riskPercent}
                  onChange={(e) =>
                    onUpdateCalc({
                      riskPercent: Math.max(0.1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-36 min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
                />
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
                className="w-full cursor-pointer"
              />
            </div>

            {/* 3. Win Rate % */}
            <div className="p-4 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[18px] font-extrabold text-[#5C3D2E]">
                  3. Win Rate %
                </label>
                <input
                  type="number"
                  min={5}
                  max={95}
                  value={calcSettings.winRate}
                  onChange={(e) =>
                    onUpdateCalc({
                      winRate: Math.max(
                        5,
                        Math.min(95, Number(e.target.value) || 50)
                      ),
                    })
                  }
                  className="w-36 min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
                />
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
                className="w-full cursor-pointer"
              />
            </div>

            {/* 4. Reward Ratio */}
            <div className="p-4 rounded-2xl bg-[#E8E0A9] border-2 border-[#8B5E3C] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[18px] font-extrabold text-[#5C3D2E]">
                  4. Reward Ratio (1 : X)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  max={20}
                  value={calcSettings.rewardToRisk}
                  onChange={(e) =>
                    onUpdateCalc({
                      rewardToRisk: Math.max(0.1, Number(e.target.value) || 2),
                    })
                  }
                  className="w-36 min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
                />
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
                className="w-full cursor-pointer"
              />
            </div>

            {/* 5. Time Period */}
            <div className="p-4 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] space-y-3">
              <label className="block text-[18px] font-extrabold text-[#5C3D2E]">
                5. Time Period
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {periods.map((p) => {
                  const active = calcSettings.period === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onUpdateCalc({ period: p.id })}
                      className={`min-h-[48px] px-3.5 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
                        active
                          ? 'bg-[#8B5E3C] text-[#FFFDF7]'
                          : 'bg-[#FFFDF7] text-[#5C3D2E] hover:bg-[#FFFBF2]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
                {calcSettings.period === 'custom' && (
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
                    className="w-24 min-h-[48px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
                  />
                )}
              </div>
            </div>

            {/* Collapsible "More options" Section */}
            <div>
              <button
                type="button"
                onClick={() => setShowMoreOptions((prev) => !prev)}
                className="w-full min-h-[50px] px-5 py-2.5 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
              >
                <span>More options (trades per day, compounding, fees)</span>
                {showMoreOptions ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showMoreOptions && (
                <div className="mt-3 p-4 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      Trades per day
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={calcSettings.tradesPerDay}
                      onChange={(e) =>
                        onUpdateCalc({
                          tradesPerDay: Math.max(1, Number(e.target.value) || 3),
                        })
                      }
                      className="w-full min-h-[48px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      Days per week
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={calcSettings.tradingDaysPerWeek}
                      onChange={(e) =>
                        onUpdateCalc({
                          tradingDaysPerWeek: Math.max(
                            1,
                            Math.min(7, Number(e.target.value) || 5)
                          ),
                        })
                      }
                      className="w-full min-h-[48px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      Compounding
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCalc({ compounding: !calcSettings.compounding })
                      }
                      className={`w-full min-h-[48px] px-4 rounded-xl border-2 border-[#8B5E3C] text-[18px] font-extrabold cursor-pointer ${
                        calcSettings.compounding
                          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                          : 'bg-[#FFFDF7] text-[#5C3D2E]'
                      }`}
                    >
                      {calcSettings.compounding ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      Monthly deposit / withdraw ($)
                    </label>
                    <input
                      type="number"
                      step={100}
                      value={calcSettings.monthlyDepositOrWithdrawal}
                      onChange={(e) =>
                        onUpdateCalc({
                          monthlyDepositOrWithdrawal:
                            Number(e.target.value) || 0,
                        })
                      }
                      className="w-full min-h-[48px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      Fee per trade ($)
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
                      className="w-full min-h-[48px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E]"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Summary Sentence + 4 Result Cards + Growth Chart + Collapsible "Advanced details" */}
          <div className="space-y-6 min-w-0">
            {/* Plain-English Summary Sentence */}
            <div className="p-5 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[19px] font-extrabold text-[#2F6B3A]">
              If you keep this up for {periodText}, you could grow from{' '}
              {formatCurrency(calcSettings.startingBalance)} to about{' '}
              {formatCurrency(projection.expectedEndingBalance)}.
            </div>

            {/* 4 Big Plain Result Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Balance at the end */}
              <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
                <div className="text-[17px] font-bold text-[#8B5E3C]">
                  Balance at the end
                </div>
                <div className="text-[30px] font-extrabold text-[#2F6B3A] mt-1">
                  <AnimatedNumber
                    value={projection.expectedEndingBalance}
                    formatter={(v) => formatCurrency(v)}
                  />
                </div>
              </div>

              {/* 2. Total profit */}
              <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
                <div className="text-[17px] font-bold text-[#8B5E3C]">
                  Total profit
                </div>
                <div
                  className={`text-[30px] font-extrabold mt-1 ${
                    projection.totalNetProfitDollar >= 0
                      ? 'text-[#2F6B3A]'
                      : 'text-[#9B2C20]'
                  }`}
                >
                  <AnimatedNumber
                    value={projection.totalNetProfitDollar}
                    formatter={(v) => formatCurrency(v, true)}
                  />
                </div>
              </div>

              {/* 3. Worst losing streak */}
              <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
                <div className="text-[17px] font-bold text-[#8B5E3C]">
                  Worst losing streak
                </div>
                <div className="text-[30px] font-extrabold text-[#5C3D2E] mt-1">
                  {projection.longestLosingStreak} in a row
                </div>
              </div>

              {/* 4. Chance of blowing the account */}
              <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
                <div className="text-[17px] font-bold text-[#8B5E3C]">
                  Chance of blowing account
                </div>
                <div
                  className={`text-[30px] font-extrabold mt-1 ${
                    projection.riskOfRuinPercent < 2
                      ? 'text-[#2F6B3A]'
                      : 'text-[#9B2C20]'
                  }`}
                >
                  {projection.riskOfRuinPercent}%
                </div>
              </div>
            </div>

            {/* Growth Chart: 3 Pastel Lines (Best / Expected / Worst) */}
            <section className="space-y-4">
              <div className="px-5 py-3 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C]">
                <h2 className="font-heading text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
                  GROWTH CHART (BEST / EXPECTED / WORST)
                </h2>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={projection.growthChartData}
                    margin={{ top: 12, right: 20, left: 10, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="rgba(139, 94, 60, 0.25)"
                    />
                    <XAxis
                      dataKey="period"
                      stroke="#5C3D2E"
                      tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompactCurrency(v)}
                      stroke="#5C3D2E"
                      tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFDF7',
                        borderColor: '#8B5E3C',
                        borderWidth: '2px',
                        borderRadius: '14px',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#5C3D2E',
                      }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: '16px',
                        fontWeight: 700,
                        paddingTop: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bestCase"
                      name="Best Case"
                      stroke="#3B7A8C"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="expected"
                      name="Expected"
                      stroke="#2F6B3A"
                      strokeWidth={4}
                    />
                    <Line
                      type="monotone"
                      dataKey="worstCase"
                      name="Worst Case"
                      stroke="#9B2C20"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Collapsible "Advanced details" Section */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedDetails((prev) => !prev)}
                className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
              >
                <span>
                  Advanced details (Milestone Goal, Monte Carlo &amp; Monthly Table)
                </span>
                {showAdvancedDetails ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showAdvancedDetails && (
                <div className="mt-4 space-y-5">
                  {/* Milestone Goal Calculator */}
                  <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3">
                    <div className="text-[19px] font-extrabold text-[#8B5E3C]">
                      How long to reach a goal balance?
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[17px] font-bold text-[#5C3D2E]">
                        Goal ($):
                      </span>
                      <input
                        type="number"
                        step={5000}
                        value={calcSettings.targetMilestone}
                        onChange={(e) =>
                          onUpdateCalc({
                            targetMilestone: Math.max(
                              1000,
                              Number(e.target.value) || 50000
                            ),
                          })
                        }
                        className="w-36 min-h-[48px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E]"
                      />
                      <span className="text-[17px] font-bold text-[#2F6B3A]">
                        {projection.daysToReachMilestone === null
                          ? 'Increase Win% or Reward Ratio to reach this goal.'
                          : projection.daysToReachMilestone === 0
                          ? 'Already reached!'
                          : `About ${projection.daysToReachMilestone} trading days (~${projection.monthsToReachMilestone} months)`}
                      </span>
                    </div>
                  </div>

                  {/* 1,000-Run Monte Carlo Summary */}
                  <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-2">
                    <div className="text-[19px] font-extrabold text-[#8B5E3C]">
                      1,000-Run Monte Carlo Simulation
                    </div>
                    <p className="text-[17px] font-semibold text-[#5C3D2E] m-0">
                      Across 1,000 random simulations, your middle result is{' '}
                      <strong>{formatCurrency(monteCarlo.medianEnding)}</strong>,
                      lucky top 10% is{' '}
                      <strong>{formatCurrency(monteCarlo.p90Ending)}</strong>,
                      and unlucky bottom 10% is{' '}
                      <strong>{formatCurrency(monteCarlo.p10Ending)}</strong>.
                    </p>
                  </div>

                  {/* Monthly Breakdown Table */}
                  <div className="rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
                    <div className="px-5 py-3 bg-[#F2D29B] border-b-2 border-[#8B5E3C] font-heading text-[20px] font-bold uppercase text-[#8B5E3C]">
                      MONTH-BY-MONTH TABLE
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[16px]">
                        <thead>
                          <tr className="border-b-2 border-[#8B5E3C] bg-[#F0DED4] font-bold text-[#5C3D2E]">
                            <th className="py-3 px-4">Month</th>
                            <th className="py-3 px-4">Start</th>
                            <th className="py-3 px-4">Trades</th>
                            <th className="py-3 px-4">Wins / Losses</th>
                            <th className="py-3 px-4 text-right">Profit</th>
                            <th className="py-3 px-4 text-right">End Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8B5E3C]/30 font-semibold">
                          {projection.monthlyBreakdown.map((row) => (
                            <tr key={row.month}>
                              <td className="py-3 px-4 font-bold">{row.label}</td>
                              <td className="py-3 px-4">
                                {formatCurrency(row.startBalance)}
                              </td>
                              <td className="py-3 px-4">{row.tradesCount}</td>
                              <td className="py-3 px-4">
                                {row.wins}W / {row.losses}L
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-extrabold ${
                                  row.netProfit >= 0
                                    ? 'text-[#2F6B3A]'
                                    : 'text-[#9B2C20]'
                                }`}
                              >
                                {formatCurrency(row.netProfit, true)}
                              </td>
                              <td className="py-3 px-4 text-right font-extrabold">
                                {formatCurrency(row.endBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FadeInUp>
  );
};
