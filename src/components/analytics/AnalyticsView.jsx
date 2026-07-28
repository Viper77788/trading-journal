import { useState, useMemo } from 'react';
import {
  BarChart3, PieChart, Calendar, TrendingUp, Target,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { computeStats, computeStreaks } from '../../utils/calculations';
import { resultOf, fmtMoney, setupArray, isYes } from '../../utils/formatters';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';

import { useAccount } from '../../context/AccountContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AnalyticsView({ trades = [], loading }) {
  const { filterTradesByAccount } = useAccount();
  const filteredTrades = useMemo(() => filterTradesByAccount(trades), [trades, filterTradesByAccount]);

  const [activeTab, setActiveTab] = useState('strategy');

  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);
  const streaks = useMemo(() => computeStreaks(filteredTrades), [filteredTrades]);

  /* ---- Strategy Breakdown ---- */
  const strategyData = useMemo(() => {
    const tally = new Map();
    filteredTrades.forEach(t => {
      setupArray(t).forEach(s => {
        if (s === 'No Setup') return;
        if (!tally.has(s)) tally.set(s, { wins: 0, losses: 0, total: 0, pnl: 0 });
        const entry = tally.get(s);
        entry.total += 1;
        entry.pnl += Number(t.profitLoss) || 0;
        if (resultOf(t) === 'Win') entry.wins += 1;
        else if (resultOf(t) === 'Loss') entry.losses += 1;
      });
    });
    return Array.from(tally.entries())
      .map(([name, d]) => ({ name, ...d, winRate: d.total ? (d.wins / d.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTrades]);

  /* ---- Day-of-Week ---- */
  const dowData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const buckets = days.map(d => ({ day: d, wins: 0, losses: 0, total: 0, pnl: 0 }));
    filteredTrades.forEach(t => {
      if (!t.tradeDate) return;
      const dow = new Date(t.tradeDate).getDay();
      buckets[dow].total += 1;
      buckets[dow].pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') buckets[dow].wins += 1;
      else if (resultOf(t) === 'Loss') buckets[dow].losses += 1;
    });
    return buckets.filter(b => b.total > 0);
  }, [filteredTrades]);

  /* ---- Emotion Analysis ---- */
  const emotionData = useMemo(() => {
    const tally = new Map();
    filteredTrades.forEach(t => {
      const emotion = t.emotionBeforeTrade;
      if (!emotion) return;
      if (!tally.has(emotion)) tally.set(emotion, { wins: 0, losses: 0, total: 0, pnl: 0 });
      const entry = tally.get(emotion);
      entry.total += 1;
      entry.pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') entry.wins += 1;
      else if (resultOf(t) === 'Loss') entry.losses += 1;
    });
    return Array.from(tally.entries())
      .map(([emotion, d]) => ({ emotion, ...d, winRate: d.total ? (d.wins / d.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTrades]);

  /* ---- Confidence Analysis ---- */
  const confidenceData = useMemo(() => {
    const buckets = {};
    for (let i = 1; i <= 10; i++) buckets[i] = { score: i, wins: 0, total: 0, pnl: 0 };
    filteredTrades.forEach(t => {
      const score = Number(t.confidenceScore);
      if (!score || score < 1 || score > 10) return;
      buckets[score].total += 1;
      buckets[score].pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') buckets[score].wins += 1;
    });
    return Object.values(buckets).filter(b => b.total > 0);
  }, [filteredTrades]);

  if (loading) return <Spinner />;
  if (!filteredTrades.length) return <EmptyState icon={BarChart3} title="No analytics yet" subtitle="Log some trades for this account to see detailed breakdowns." />;

  const tabs = [
    { key: 'strategy', label: 'Strategy', icon: Target },
    { key: 'timing', label: 'Day of Week', icon: Calendar },
    { key: 'psychology', label: 'Psychology', icon: TrendingUp },
    { key: 'risk', label: 'Risk Profile', icon: BarChart3 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Deep breakdowns of your trading patterns and performance.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Strategy Performance</h3>
            {strategyData.length === 0 ? (
              <p className="text-slate-500 text-sm">No setup data available. Tag your trades with setups to see breakdowns.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Setup</th><th>Trades</th><th>Wins</th><th>Losses</th><th>Win Rate</th><th>Net P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategyData.map(s => (
                      <tr key={s.name}>
                        <td><span className="font-medium text-white">{s.name}</span></td>
                        <td>{s.total}</td>
                        <td className="text-emerald-400">{s.wins}</td>
                        <td className="text-red-400">{s.losses}</td>
                        <td>
                          <span className={s.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                            {s.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className={`font-mono ${s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtMoney(s.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {strategyData.length > 0 && (
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Win Rate by Setup</h3>
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: strategyData.map(s => s.name),
                    datasets: [{
                      data: strategyData.map(s => s.winRate),
                      backgroundColor: strategyData.map(s => s.winRate >= 50 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
                      borderRadius: 6,
                    }],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
                      y: { grid: { color: 'rgba(255,255,255,0.06)' }, max: 100, ticks: { callback: v => v + '%' } },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day of Week Tab */}
      {activeTab === 'timing' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Day of Week</h3>
            <div className="overflow-x-auto">
              <table className="journal-table">
                <thead>
                  <tr><th>Day</th><th>Trades</th><th>Wins</th><th>Losses</th><th>Win Rate</th><th>Net P/L</th></tr>
                </thead>
                <tbody>
                  {dowData.map(d => {
                    const winRate = d.total ? (d.wins / d.total) * 100 : 0;
                    return (
                      <tr key={d.day}>
                        <td className="font-medium text-white">{d.day}</td>
                        <td>{d.total}</td>
                        <td className="text-emerald-400">{d.wins}</td>
                        <td className="text-red-400">{d.losses}</td>
                        <td className={winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>{winRate.toFixed(1)}%</td>
                        <td className={`font-mono ${d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtMoney(d.pnl)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">P/L by Day of Week</h3>
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: dowData.map(d => d.day.slice(0, 3)),
                  datasets: [{
                    data: dowData.map(d => Number(d.pnl.toFixed(2))),
                    backgroundColor: dowData.map(d => d.pnl >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
                    borderRadius: 6,
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(255,255,255,0.06)' } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Psychology Tab */}
      {activeTab === 'psychology' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Win Rate by Pre-Trade Emotion</h3>
            {emotionData.length === 0 ? (
              <p className="text-slate-500 text-sm">No emotion data recorded yet. Tag your emotions when logging trades.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="journal-table">
                  <thead>
                    <tr><th>Emotion</th><th>Trades</th><th>Wins</th><th>Losses</th><th>Win Rate</th><th>Net P/L</th></tr>
                  </thead>
                  <tbody>
                    {emotionData.map(e => (
                      <tr key={e.emotion}>
                        <td className="font-medium text-white">{e.emotion}</td>
                        <td>{e.total}</td>
                        <td className="text-emerald-400">{e.wins}</td>
                        <td className="text-red-400">{e.losses}</td>
                        <td className={e.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>{e.winRate.toFixed(1)}%</td>
                        <td className={`font-mono ${e.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtMoney(e.pnl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Confidence Score vs Win Rate</h3>
            {confidenceData.length === 0 ? (
              <p className="text-slate-500 text-sm">No confidence data yet.</p>
            ) : (
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: confidenceData.map(c => `Score ${c.score}`),
                    datasets: [
                      {
                        label: 'Win Rate %',
                        data: confidenceData.map(c => c.total ? (c.wins / c.total) * 100 : 0),
                        backgroundColor: 'rgba(59,130,246,0.7)',
                        borderRadius: 6,
                      },
                      {
                        label: 'Trade Count',
                        data: confidenceData.map(c => c.total),
                        backgroundColor: 'rgba(168,85,247,0.5)',
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, color: '#94a3b8' } } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { grid: { color: 'rgba(255,255,255,0.06)' } },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Profile Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card text-center">
              <div className="text-slate-400 text-sm mb-1">Avg RR (All)</div>
              <div className="text-2xl font-bold font-mono text-white">{stats.avgRR.toFixed(2)}</div>
            </div>
            <div className="glass-card text-center">
              <div className="text-slate-400 text-sm mb-1">Best Trade</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{stats.bestTrade ? fmtMoney(stats.bestTrade.profitLoss) : '$0'}</div>
              <div className="text-xs text-slate-500 mt-1">{stats.bestTrade?.pair || '—'}</div>
            </div>
            <div className="glass-card text-center">
              <div className="text-slate-400 text-sm mb-1">Worst Trade</div>
              <div className="text-2xl font-bold font-mono text-red-400">{stats.worstTrade ? fmtMoney(stats.worstTrade.profitLoss) : '$0'}</div>
              <div className="text-xs text-slate-500 mt-1">{stats.worstTrade?.pair || '—'}</div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Profit Distribution</h3>
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: trades.filter(t => Number(t.profitLoss)).map((_, i) => `#${i + 1}`),
                  datasets: [{
                    data: trades.filter(t => Number(t.profitLoss)).map(t => Number(t.profitLoss) || 0),
                    backgroundColor: trades.filter(t => Number(t.profitLoss)).map(t => (Number(t.profitLoss) || 0) >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
                    borderRadius: 4,
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { grid: { color: 'rgba(255,255,255,0.06)' } },
                  },
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-2">Streaks</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Current</span><span className={`font-mono font-bold ${streaks.current > 0 ? 'text-emerald-400' : streaks.current < 0 ? 'text-red-400' : 'text-white'}`}>{streaks.current === 0 ? '0' : `${Math.abs(streaks.current)} ${streaks.current > 0 ? 'W' : 'L'}`}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Longest Win</span><span className="font-mono font-bold text-emerald-400">{streaks.longestWin}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Longest Loss</span><span className="font-mono font-bold text-red-400">{streaks.longestLoss}</span></div>
              </div>
            </div>
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-2">Direction Split</h3>
              <div className="h-[180px]">
                <Doughnut
                  data={{
                    labels: ['Long', 'Short'],
                    datasets: [{
                      data: [
                        trades.filter(t => (t.direction || '').toLowerCase() === 'long').length,
                        trades.filter(t => (t.direction || '').toLowerCase() === 'short').length,
                      ],
                      backgroundColor: ['#3b82f6', '#a855f7'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, color: '#94a3b8' } } },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
