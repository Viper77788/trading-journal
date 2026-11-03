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
        borderColor: '#386641',
        backgroundColor: 'rgba(56, 102, 65, 0.12)',
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
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Win / Loss Streak High-Contrast Light Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Active Streak
            </span>
            <div
              className="text-2xl font-extrabold font-mono mt-1"
              style={{
                color: streaks.currentStreak >= 0 ? '#386641' : '#BC4749',
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
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor:
                streaks.currentStreak >= 0
                  ? 'rgba(56, 102, 65, 0.1)'
                  : 'rgba(188, 71, 73, 0.1)',
              color: streaks.currentStreak >= 0 ? '#386641' : '#BC4749',
            }}
          >
            <Flame size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Max Consecutive Wins
            </span>
            <div
              className="text-2xl font-extrabold font-mono mt-1"
              style={{ color: '#386641' }}
            >
              {streaks.maxWinStreak} Wins
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(56, 102, 65, 0.1)',
              color: '#386641',
            }}
          >
            <Trophy size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Max Consecutive Losses
            </span>
            <div
              className="text-2xl font-extrabold font-mono mt-1"
              style={{ color: '#BC4749' }}
            >
              {streaks.maxLossStreak} Losses
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(188, 71, 73, 0.1)',
              color: '#BC4749',
            }}
          >
            <AlertOctagon size={20} />
          </div>
        </div>
      </div>

      {/* Charts Row: Cumulative Equity Curve + R-Multiple Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cumulative Net P&L Curve
              </h3>
              <p className="text-xs text-slate-500">
                Green dots = Winning trades (#386641) • Red dots = Stops (#BC4749)
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

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 size={15} className="text-slate-600" />
                R-Multiple Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Realized R-Multiples across GC & MGCZ6 executions
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

      {/* Liquidity Session Window Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Clock size={15} className="text-slate-600" />
            Session Window P&L
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            1:00 AM–4:00 AM (London) vs. 8:00 AM–11:00 AM (NY Open)
          </p>
          <div className="h-[210px]">
            <Bar data={sessionChartData} options={chartOptions} />
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={15} style={{ color: '#386641' }} />
            Liquidity Window Performance Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-3 px-3">Session Window</th>
                  <th className="py-3 px-3 text-center">Trades</th>
                  <th className="py-3 px-3 text-center">Win Rate</th>
                  <th className="py-3 px-3 text-center">Avg R</th>
                  <th className="py-3 px-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sessionStats.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-sans font-semibold text-slate-900">
                      {s.label}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600">
                      {s.trades}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className="px-2.5 py-0.5 rounded-md font-bold"
                        style={{
                          backgroundColor:
                            s.winRate >= 50
                              ? 'rgba(56, 102, 65, 0.1)'
                              : 'rgba(188, 71, 73, 0.1)',
                          color: s.winRate >= 50 ? '#386641' : '#BC4749',
                        }}
                      >
                        {s.winRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-700">
                      {s.avgR > 0 ? `+${s.avgR}R` : `${s.avgR}R`}
                    </td>
                    <td
                      className="py-3.5 px-3 text-right font-bold"
                      style={{
                        color: s.netPnl >= 0 ? '#386641' : '#BC4749',
                      }}
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 size={16} style={{ color: '#386641' }} />
              14-Rule Strategy Adherence
            </h3>
            <p className="text-xs text-slate-500">
              Rule-by-rule pass percentage across logged executions
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-xl text-xs font-mono font-bold"
            style={{
              backgroundColor: 'rgba(56, 102, 65, 0.1)',
              color: '#386641',
            }}
          >
            Overall Compliance: {analytics.avgComplianceScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ruleStats.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 truncate pr-2">
                  <strong className="font-mono text-slate-400">#{rule.number}.</strong>{' '}
                  {rule.label}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: rule.pct >= 75 ? '#386641' : '#BC4749' }}
                >
                  {rule.pct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
