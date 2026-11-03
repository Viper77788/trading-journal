import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Flame, Trophy, AlertOctagon, Clock, BarChart3, CheckCircle2 } from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsView() {
  const { analytics } = useViper();
  const { equityCurve, rBuckets, sessionStats, streaks, ruleStats } = analytics;

  const equityData = {
    labels: equityCurve.map((pt) => `#${pt.tradeNumber} (${pt.date.slice(5)})`),
    datasets: [
      {
        label: 'Cumulative Net P&L ($)',
        data: equityCurve.map((pt) => pt.cumulativePnl),
        borderColor: '#4ade80',
        backgroundColor: 'rgba(56, 102, 65, 0.25)',
        borderWidth: 2.5,
        pointBackgroundColor: equityCurve.map((pt) =>
          pt.netPnl >= 0 ? '#386641' : '#BC4749'
        ),
        pointRadius: 5,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const rDistData = {
    labels: rBuckets.map((b) => b.label),
    datasets: [
      {
        label: 'Trade Count',
        data: rBuckets.map((b) => b.count),
        backgroundColor: rBuckets.map((b) => b.color),
        borderRadius: 8,
      },
    ],
  };

  const sessionChartData = {
    labels: sessionStats.map((s) => s.id),
    datasets: [
      {
        label: 'Session Net P&L ($)',
        data: sessionStats.map((s) => s.netPnl),
        backgroundColor: sessionStats.map((s) =>
          s.netPnl >= 0 ? '#386641' : '#BC4749'
        ),
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94A3B8', font: { size: 12 } },
      },
    },
  };

  return (
    <div className="space-y-6 w-full">
      {/* Win / Loss Streak #131B2E Dark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
              Current Active Streak
            </span>
            <div
              className={`text-3xl font-bold font-mono mt-2 ${
                streaks.currentStreak >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {streaks.currentStreak > 0
                ? `${streaks.currentStreak} Wins`
                : streaks.currentStreak < 0
                ? `${Math.abs(streaks.currentStreak)} Losses`
                : 'Neutral (0)'}
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#F8FAFC]"
            style={{
              backgroundColor: streaks.currentStreak >= 0 ? '#386641' : '#BC4749',
            }}
          >
            <Flame size={22} />
          </div>
        </div>

        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
              Max Consecutive Wins
            </span>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">
              {streaks.maxWinStreak} Wins
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#F8FAFC]"
            style={{ backgroundColor: '#386641' }}
          >
            <Trophy size={22} />
          </div>
        </div>

        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
              Max Consecutive Losses
            </span>
            <div className="text-3xl font-bold font-mono text-rose-400 mt-2">
              {streaks.maxLossStreak} Losses
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#F8FAFC]"
            style={{ backgroundColor: '#BC4749' }}
          >
            <AlertOctagon size={22} />
          </div>
        </div>
      </div>

      {/* Charts Row: Cumulative Equity Curve + R-Multiple Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Cumulative Net P&L Curve
              </h3>
              <p className="text-sm text-[#94A3B8]">
                Green nodes = Winning trades (#386641) • Red nodes = Stops (#BC4749)
              </p>
            </div>
            <span className="font-mono text-base font-bold text-emerald-400">
              {formatUSD(analytics.totalNetPnl)}
            </span>
          </div>
          <div className="h-[270px]">
            <Line data={equityData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-400" />
                R-Multiple Distribution
              </h3>
              <p className="text-sm text-[#94A3B8]">
                Realized R-Multiples across GC & MGCZ6 executions
              </p>
            </div>
            <span className="font-mono text-base font-bold text-[#F8FAFC]">
              Avg: {analytics.avgRMultiple}R
            </span>
          </div>
          <div className="h-[270px]">
            <Bar data={rDistData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Liquidity Session Window Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2 mb-1">
            <Clock size={18} className="text-emerald-400" />
            Session Window P&L
          </h3>
          <p className="text-sm text-[#94A3B8] mb-4">
            1:00 AM–4:00 AM (London) vs. 8:00 AM–11:00 AM (NY Open)
          </p>
          <div className="h-[220px]">
            <Bar data={sessionChartData} options={chartOptions} />
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <h3 className="text-base font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <Clock size={18} className="text-emerald-400" />
            Liquidity Window Performance Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 text-[#94A3B8] text-sm uppercase">
                  <th className="py-3.5 px-4">Session Window</th>
                  <th className="py-3.5 px-4 text-center">Trades</th>
                  <th className="py-3.5 px-4 text-center">Win Rate</th>
                  <th className="py-3.5 px-4 text-center">Avg R</th>
                  <th className="py-3.5 px-4 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono text-sm">
                {sessionStats.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 font-sans font-semibold text-[#F8FAFC]">
                      {s.label}
                    </td>
                    <td className="py-4 px-4 text-center text-[#94A3B8]">
                      {s.trades}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="px-2.5 py-1 rounded-md text-sm font-bold text-[#F8FAFC]"
                        style={{
                          backgroundColor: s.winRate >= 50 ? '#386641' : '#BC4749',
                        }}
                      >
                        {s.winRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-[#F8FAFC]">
                      {s.avgR > 0 ? `+${s.avgR}R` : `${s.avgR}R`}
                    </td>
                    <td
                      className={`py-4 px-4 text-right font-bold ${
                        s.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatUSD(s.netPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 14-Rule Compliance Breakdown Grid */}
      <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              14-Rule Strategy Adherence
            </h3>
            <p className="text-sm text-[#94A3B8]">
              Rule-by-rule pass percentage across logged executions
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-md text-sm font-mono font-bold text-[#F8FAFC]"
            style={{ backgroundColor: '#386641' }}
          >
            Overall Compliance: {analytics.avgComplianceScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ruleStats.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800/80 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#F8FAFC] truncate pr-2">
                  <strong className="font-mono text-[#94A3B8]">#{rule.number}.</strong>{' '}
                  {rule.label}
                </span>
                <span
                  className={`font-mono font-bold ${
                    rule.pct >= 75 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {rule.pct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${rule.pct}%`,
                    backgroundColor: rule.pct >= 75 ? '#386641' : '#BC4749',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
