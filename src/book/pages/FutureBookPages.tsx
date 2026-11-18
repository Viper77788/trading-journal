import React from 'react';
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
import { CalculatorSettings, ProjectionPeriod } from '../../types/settings';
import {
  ProjectionResults,
  MonteCarloBandPoint,
} from '../../utils/monteCarlo';
import {
  formatCurrency,
  formatCompactCurrency,
} from '../../utils/formatters';
import { AnimatedNumber } from '../../components/animations/AnimatedNumber';
import { BookPageData } from '../BookPage';

interface FutureBookPagesProps {
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

export function buildFutureBookPages({
  calcSettings,
  onUpdateCalc,
  onResetCalc,
  projection,
  monteCarlo,
  realStats,
  onNotify,
}: FutureBookPagesProps): BookPageData[] {
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
    { id: '1m', label: '1M' },
    { id: '3m', label: '3M' },
    { id: '6m', label: '6M' },
    { id: '1y', label: '1Y' },
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

  return [
    // PAGE 1: Main Inputs 1–3 (Start, Risk %, Win Rate %)
    {
      id: 'future-p1',
      sectionLabel: 'FUTURE • PAGE 1',
      pageTitle: 'BALANCE, RISK & WIN RATE',
      mobileTitle: 'BALANCE & WIN RATE',
      pastelHeaderBg: '#E2DCEB',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleUseRealStats}
              className="flex-1 min-h-[48px] px-3 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase text-[#2F6B3A] cursor-pointer"
            >
              Use my real stats
            </button>
            <button
              type="button"
              onClick={onResetCalc}
              className="min-h-[48px] px-3.5 rounded-xl bg-[#FFFBF2] hover:bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
            >
              Reset
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[17px] font-extrabold text-[#5C3D2E]">
                Start ($)
              </label>
              <input
                type="number"
                value={calcSettings.startingBalance}
                onChange={(e) =>
                  onUpdateCalc({
                    startingBalance: Math.max(100, Number(e.target.value) || 0),
                  })
                }
                className="w-32 min-h-[46px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none"
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

          <div className="p-3 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[17px] font-extrabold text-[#5C3D2E]">
                Risk % per Trade
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
                className="w-28 min-h-[46px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none"
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

          <div className="p-3 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[17px] font-extrabold text-[#5C3D2E]">
                Win Rate %
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
                className="w-28 min-h-[46px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none"
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
        </div>
      ),
    },

    // PAGE 2: Reward Ratio, Time Period & Trade Frequency
    {
      id: 'future-p2',
      sectionLabel: 'FUTURE • PAGE 2',
      pageTitle: 'REWARD, PERIOD & PACE',
      mobileTitle: 'REWARD & PERIOD',
      pastelHeaderBg: '#F2D29B',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <div className="p-3 rounded-xl bg-[#E8E0A9] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[17px] font-extrabold text-[#5C3D2E]">
                Reward (1:X)
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
                className="w-28 min-h-[46px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none"
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

          <div className="p-3 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] space-y-2">
            <label className="block text-[17px] font-extrabold text-[#5C3D2E]">
              Time Period
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {periods.map((p) => {
                const active = calcSettings.period === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateCalc({ period: p.id })}
                    className={`min-h-[46px] px-3 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
                      active
                        ? 'bg-[#8B5E3C] text-[#FFFDF7]'
                        : 'bg-[#FFFDF7] text-[#5C3D2E]'
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
                  className="w-20 min-h-[46px] px-2.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#5C3D2E] outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-1.5">
              <label className="block text-[16px] font-extrabold text-[#5C3D2E]">
                Trades / day
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
                className="w-full min-h-[46px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] space-y-1.5">
              <label className="block text-[16px] font-extrabold text-[#5C3D2E]">
                Days / week
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
                className="w-full min-h-[46px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E]"
              />
            </div>
          </div>
        </div>
      ),
    },

    // PAGE 3: Compounding, Monthly Cashflow & Fees
    {
      id: 'future-p3',
      sectionLabel: 'FUTURE • PAGE 3',
      pageTitle: 'COMPOUNDING & FEES',
      mobileTitle: 'COMPOUNDING & FEES',
      pastelHeaderBg: '#F0DED4',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <div className="p-3.5 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Compounding
              </div>
              <p className="text-[15px] text-[#5C3D2E] m-0">
                Recalculate risk $ as balance grows
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateCalc({ compounding: !calcSettings.compounding })
              }
              className={`min-h-[48px] min-w-[96px] px-4 rounded-xl border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
                calcSettings.compounding
                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                  : 'bg-[#FFFDF7] text-[#5C3D2E]'
              }`}
            >
              {calcSettings.compounding ? 'ON ✓' : 'OFF'}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E8E0A9] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="text-[17px] font-extrabold text-[#5C3D2E]">
              Monthly Deposit / Withdrawal ($)
            </div>
            <input
              type="number"
              step={100}
              value={calcSettings.monthlyDepositOrWithdrawal}
              onChange={(e) =>
                onUpdateCalc({
                  monthlyDepositOrWithdrawal: Number(e.target.value) || 0,
                })
              }
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E]"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="text-[17px] font-extrabold text-[#5C3D2E]">
              Fee per trade ($)
            </div>
            <input
              type="number"
              min={0}
              step={0.5}
              value={calcSettings.commissionPerTrade}
              onChange={(e) =>
                onUpdateCalc({
                  commissionPerTrade: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E]"
            />
          </div>
        </div>
      ),
    },

    // PAGE 4: Projected Results & Plain Sentence
    {
      id: 'future-p4',
      sectionLabel: 'FUTURE • PAGE 4',
      pageTitle: 'PROJECTED RESULTS',
      mobileTitle: 'PROJECTED RESULTS',
      pastelHeaderBg: '#BFE3C0',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <div className="p-3.5 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[17px] sm:text-[18px] font-extrabold text-[#2F6B3A] leading-snug">
            If you keep this up for {periodText}, you could grow from{' '}
            {formatCurrency(calcSettings.startingBalance)} to about{' '}
            {formatCurrency(projection.expectedEndingBalance)}.
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
              <div className="text-[15px] font-bold text-[#8B5E3C]">
                Balance at end
              </div>
              <div className="text-[22px] sm:text-[25px] font-extrabold text-[#2F6B3A] leading-tight mt-0.5">
                <AnimatedNumber
                  value={projection.expectedEndingBalance}
                  formatter={(v) => formatCurrency(v)}
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
              <div className="text-[15px] font-bold text-[#8B5E3C]">
                Total profit
              </div>
              <div
                className={`text-[22px] sm:text-[25px] font-extrabold leading-tight mt-0.5 ${
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

            <div className="p-3 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
              <div className="text-[15px] font-bold text-[#8B5E3C]">
                Worst streak
              </div>
              <div className="text-[22px] sm:text-[25px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
                {projection.longestLosingStreak} in a row
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
              <div className="text-[15px] font-bold text-[#8B5E3C]">
                Chance of blowing
              </div>
              <div
                className={`text-[22px] sm:text-[25px] font-extrabold leading-tight mt-0.5 ${
                  projection.riskOfRuinPercent < 2
                    ? 'text-[#2F6B3A]'
                    : 'text-[#9B2C20]'
                }`}
              >
                {projection.riskOfRuinPercent}%
              </div>
            </div>
          </div>

          <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
        </div>
      ),
    },

    // PAGE 5: Growth Chart
    {
      id: 'future-p5',
      sectionLabel: 'FUTURE • PAGE 5',
      pageTitle: 'GROWTH CHART',
      mobileTitle: 'GROWTH CHART',
      pastelHeaderBg: '#DCEEF2',
      content: (
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex-1 min-h-[210px] p-2.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={projection.growthChartData}
                margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="rgba(139, 94, 60, 0.25)"
                />
                <XAxis
                  dataKey="period"
                  stroke="#5C3D2E"
                  tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  stroke="#5C3D2E"
                  tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF7',
                    borderColor: '#8B5E3C',
                    borderWidth: '2px',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#5C3D2E',
                  }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '14px',
                    fontWeight: 700,
                    paddingTop: '4px',
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
                  strokeWidth={3.5}
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
        </div>
      ),
    },

    // PAGE 6: Milestones, Monte Carlo & Monthly Table
    {
      id: 'future-p6',
      sectionLabel: 'FUTURE • PAGE 6',
      pageTitle: 'MILESTONES & MONTE CARLO',
      mobileTitle: 'MILESTONES & TABLE',
      pastelHeaderBg: '#F2D29B',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <div className="p-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[16px] font-extrabold text-[#8B5E3C]">
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
              className="w-32 min-h-[44px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]"
            />
            <span className="text-[15px] font-bold text-[#2F6B3A] w-full">
              {projection.daysToReachMilestone === null
                ? 'Increase Win% or Reward Ratio to reach this goal.'
                : projection.daysToReachMilestone === 0
                  ? 'Already reached!'
                  : `About ${projection.daysToReachMilestone} trading days (~${projection.monthsToReachMilestone} months)`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[15px] font-semibold text-[#5C3D2E]">
            <strong>1,000-Run Monte Carlo:</strong> Middle{' '}
            <strong>{formatCurrency(monteCarlo.medianEnding)}</strong> • Top 10%{' '}
            <strong>{formatCurrency(monteCarlo.p90Ending)}</strong> • Bottom 10%{' '}
            <strong>{formatCurrency(monteCarlo.p10Ending)}</strong>.
          </div>

          <div className="rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#F2D29B] border-b-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase text-[#8B5E3C]">
              MONTH-BY-MONTH TABLE
            </div>
            <div className="overflow-x-auto max-h-36">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="border-b-2 border-[#8B5E3C] bg-[#F0DED4] font-bold text-[#5C3D2E]">
                    <th className="py-1.5 px-2">Mo</th>
                    <th className="py-1.5 px-2">W/L</th>
                    <th className="py-1.5 px-2 text-right">Profit</th>
                    <th className="py-1.5 px-2 text-right">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8B5E3C]/30 font-semibold">
                  {projection.monthlyBreakdown.map((row) => (
                    <tr key={row.month}>
                      <td className="py-1.5 px-2 font-bold">{row.label}</td>
                      <td className="py-1.5 px-2">
                        {row.wins}W/{row.losses}L
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right font-extrabold ${
                          row.netProfit >= 0
                            ? 'text-[#2F6B3A]'
                            : 'text-[#9B2C20]'
                        }`}
                      >
                        {formatCurrency(row.netProfit, true)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-extrabold">
                        {formatCurrency(row.endBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
  ];
}
