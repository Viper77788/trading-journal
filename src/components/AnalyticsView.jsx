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

  // 1. Cumulative P&L Curve Data
  const equityData = {
    labels: equityCurve.map((pt) => `#${pt.tradeNumber} (${pt.date.slice(5)})`),
    datasets: [
      {
        label: 'Cumulative Net P&L ($)',
        data: equityCurve.map((pt) => pt.cumulativePnl),
        borderColor: '#386641',
        backgroundColor: 'rgba(56, 102, 65, 0.14)',
        borderWidth: 2.5,
        pointBackgroundColor: equityCurve.map((pt) =>
          pt.netPnl >= 0 ? '#386641' : '#BC4749'
        ),
        pointRadius: 4,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // 2. R-Multiple Distribution Bar Data
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

  // 3. Session Window Comparison Data (Asian/London 1–4 AM vs NY 8–11 AM vs Outside)
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
        ticks: { color: '#475569', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: { color: '#475569', font: { size: 11 } },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Win / Loss Streak Dark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Active Streak
            </span>
            <div
              className="text-2xl font-extrabold font-mono mt-1"
              style={{
                color: streaks.currentStreak >= 0 ? '#4ade80' : '#f87171',
              }}
            >
              {streaks.currentStreak > 0
                ? `${streaks.currentStreak} Wins`
                : streaks.currentStreak < 0
                ? `${Math.abs(streaks.currentStreak)} Losses`
                : 'Neutral (0)'}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{
              backgroundColor: streaks.currentStreak >= 0 ? '#386641' : '#BC4749',
            }}
          >
            <Flame size={20} />
          </div>
        </div>

        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Max Consecutive Wins
            </span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              {streaks.maxWinStreak} Wins
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: '#386641' }}
          >
            <Trophy size={20} />
          </div>
        </div>

        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Max Consecutive Losses
            </span>
            <div className="text-2xl font-extrabold font-mono text-red-400 mt-1">
              {streaks.maxLossStreak} Losses
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: '#BC4749' }}
          >
            <AlertOctagon size={20} />
          </div>
        </div>
      </div>

      {/* Charts Row: Cumulative Equity Curve + R-Multiple Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cumulative Net P&L Equity Curve
              </h3>
              <p className="text-xs text-slate-500">
                Green nodes = Support #386641 / Winning executions • Red nodes = #BC4749 / Stops
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-800">
              {formatUSD(analytics.totalNetPnl)}
            </span>
          </div>
          <div className="h-[260px]">
            <Line data={equityData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 size={15} className="text-slate-700" />
                R-Multiple Distribution Histogram
              </h3>
              <p className="text-xs text-slate-500">
                Distribution of realized R-Multiples across GC and MGC futures
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-800">
              Avg: {analytics.avgRMultiple}R
            </span>
          </div>
          <div className="h-[260px]">
            <Bar data={rDistData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Liquidity Session Window Breakdown (1:00–4:00 AM vs 8:00–11:00 AM NY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Clock size={15} className="text-slate-700" />
            Session Window P&L Comparison
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            1:00 AM–4:00 AM (Asian/London) vs. 8:00 AM–11:00 AM (New York Opening)
          </p>
          <div className="h-[220px]">
            <Bar data={sessionChartData} options={chartOptions} />
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#121417] text-white rounded-2xl p-5 border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Clock size={15} className="text-emerald-400" />
            Liquidity Session Window Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Liquidity Window</th>
                  <th className="py-2.5 px-3 text-center">Trades</th>
                  <th className="py-2.5 px-3 text-center">Win Rate</th>
                  <th className="py-2.5 px-3 text-center">Avg R-Multiple</th>
                  <th className="py-2.5 px-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {sessionStats.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-sans font-semibold text-white">
                      {s.label}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">{s.trades}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded font-bold text-white"
                        style={{
                          backgroundColor: s.winRate >= 50 ? '#386641' : '#BC4749',
                        }}
                      >
                        {s.winRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-200">
                      {s.avgR > 0 ? `+${s.avgR}R` : `${s.avgR}R`}
                    </td>
                    <td
                      className="py-3 px-3 text-right font-bold"
                      style={{ color: s.netPnl >= 0 ? '#4ade80' : '#f87171' }}
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
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 size={16} style={{ color: '#386641' }} />
              14-Rule Strategy Audit Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Individual pass percentage across all 14 technical strategy rules
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-xl text-xs font-mono font-bold text-white"
            style={{ backgroundColor: '#386641' }}
          >
            Overall Compliance: {analytics.avgComplianceScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ruleStats.map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-xl bg-[#F4F4F6] border border-slate-200 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 truncate pr-2">
                  <strong className="font-mono text-slate-500">#{rule.number}.</strong>{' '}
                  {rule.label}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: rule.pct >= 75 ? '#386641' : '#BC4749' }}
                >
                  {rule.pct}% ({rule.passed}/{analytics.totalTrades})
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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
