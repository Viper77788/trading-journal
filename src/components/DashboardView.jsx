import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';

export default function DashboardView({
  onOpenLogModal,
  onEditTrade,
  onOpenSessionReview,
}) {
  const {
    filteredTrades,
    analytics,
    deleteTrade,
    setLastSubmittedTrade,
    dailyLossCap,
  } = useViper();

  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState('All');

  const visibleTrades = filteredTrades.filter((t) => {
    const matchesSession =
      sessionFilter === 'All' || t.sessionWindow === sessionFilter;
    const matchesSearch =
      !searchQuery ||
      t.contract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.accountType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.leakTags || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSession && matchesSearch;
  });

  const { dailyLossTracker } = analytics;

  return (
    <div className="flex-1 flex flex-col gap-5 w-full">
      {/* TOP SUMMARY BAR: 5 Prominent Macro Metrics in Crisp High-Contrast Light Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        {/* 1. Win Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Win Rate</span>
            <Award size={16} style={{ color: '#386641' }} />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {analytics.winRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {analytics.wins}W / {analytics.losses}L
            </span>
            <span className="font-mono font-semibold text-slate-700">
              {analytics.totalTrades} Trades
            </span>
          </div>
        </div>

        {/* 2. Net P&L */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Net P&L</span>
            <TrendingUp
              size={16}
              style={{
                color: analytics.totalNetPnl >= 0 ? '#386641' : '#BC4749',
              }}
            />
          </div>
          <div className="my-3">
            <span
              className="text-3xl font-extrabold font-mono"
              style={{
                color: analytics.totalNetPnl >= 0 ? '#386641' : '#BC4749',
              }}
            >
              {formatUSD(analytics.totalNetPnl)}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            14-Rule Avg:{' '}
            <strong className="font-mono text-slate-800">
              {analytics.avgComplianceScore}%
            </strong>
          </div>
        </div>

        {/* 3. Profit Factor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Profit Factor</span>
            <Activity size={16} className="text-slate-400" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {analytics.profitFactor}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Active Streak:{' '}
            <strong
              className="font-mono"
              style={{
                color:
                  analytics.streaks.currentStreak >= 0 ? '#386641' : '#BC4749',
              }}
            >
              {analytics.streaks.currentStreak > 0
                ? `+${analytics.streaks.currentStreak}W`
                : analytics.streaks.currentStreak < 0
                ? `${analytics.streaks.currentStreak}L`
                : '0'}
            </strong>
          </div>
        </div>

        {/* 4. Avg R-Multiple */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Avg R-Multiple</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor:
                  analytics.avgRMultiple >= 1.5 ? '#386641' : '#BC4749',
              }}
            />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {analytics.avgRMultiple > 0
                ? `+${analytics.avgRMultiple}R`
                : `${analytics.avgRMultiple}R`}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Target Benchmark: <strong className="font-mono text-slate-700">+1.50R</strong>
          </div>
        </div>

        {/* 5. Daily Loss Limit ($600 Cap Utilization Bar) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Daily Loss Cap</span>
            {dailyLossTracker.riskStatusPass ? (
              <ShieldCheck size={16} style={{ color: '#386641' }} />
            ) : (
              <ShieldAlert size={16} style={{ color: '#BC4749' }} />
            )}
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">
              -${dailyLossTracker.latestDayLossUsed.toFixed(0)}{' '}
              <span className="text-sm font-normal text-slate-400">
                / ${dailyLossCap}
              </span>
            </span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: dailyLossTracker.riskStatusPass
                  ? 'rgba(56, 102, 65, 0.1)'
                  : 'rgba(188, 71, 73, 0.1)',
                color: dailyLossTracker.riskStatusPass ? '#386641' : '#BC4749',
              }}
            >
              {dailyLossTracker.dailyLossUtilizationPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(4, dailyLossTracker.dailyLossUtilizationPct)}%`,
                backgroundColor:
                  dailyLossTracker.dailyLossUtilizationPct >= 80
                    ? '#BC4749'
                    : '#386641',
              }}
            />
          </div>
        </div>
      </div>

      {/* SPACIOUS, HIGH-CONTRAST FULL-SCREEN EXECUTIONS TABLE */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        {/* Clean Table Header Bar */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Gold Futures Executions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {visibleTrades.length} logged trades • Zone anchors:{' '}
                <span className="font-mono font-semibold" style={{ color: '#386641' }}>
                  #386641 Support
                </span>{' '}
                &{' '}
                <span className="font-mono font-semibold" style={{ color: '#BC4749' }}>
                  #BC4749 Resistance
                </span>
              </p>
            </div>
          </div>

          {/* Filter & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Session Window Pill Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {[
                { id: 'All', label: 'All Windows' },
                { id: '1:00 AM–4:00 AM', label: '1–4 AM' },
                { id: '8:00 AM–11:00 AM', label: '8–11 AM' },
                { id: 'Outside Window', label: 'Outside' },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSessionFilter(w.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    sessionFilter === w.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search contract or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#386641]"
              />
            </div>

            {/* Toggle AI Review Drawer */}
            <button
              type="button"
              onClick={onOpenSessionReview}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors"
            >
              <Sparkles size={14} style={{ color: '#386641' }} />
              <span>AI Session Review</span>
            </button>

            {/* Fast Log Button */}
            <button
              type="button"
              onClick={onOpenLogModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              <Plus size={15} />
              <span>Fast Log Trade</span>
            </button>
          </div>
        </div>

        {/* Spacious Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Date & Time</th>
                <th className="py-3.5 px-5">Session Window</th>
                <th className="py-3.5 px-5">Contract</th>
                <th className="py-3.5 px-5">Direction & Zone</th>
                <th className="py-3.5 px-5 text-right">Net P&L</th>
                <th className="py-3.5 px-5 text-right">R-Multiple</th>
                <th className="py-3.5 px-5 text-center">Compliance</th>
                <th className="py-3.5 px-5">Execution Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {visibleTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400 text-sm">
                    No trades found for this filter. Click "Fast Log Trade" to record an execution.
                  </td>
                </tr>
              ) : (
                visibleTrades.map((t) => {
                  const isWin = Number(t.netPnl) >= 0;
                  const isSupport = t.zoneInteraction?.includes('#386641');
                  const isResistance = t.zoneInteraction?.includes('#BC4749');
                  const accentColor = isSupport
                    ? '#386641'
                    : isResistance
                    ? '#BC4749'
                    : 'transparent';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setLastSubmittedTrade(t);
                        onOpenSessionReview?.();
                      }}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                      style={{
                        borderLeft: `3px solid ${accentColor}`,
                      }}
                    >
                      {/* Date & Time */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900 text-xs">
                          {t.date}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {t.time} NY
                        </div>
                      </td>

                      {/* Session Window */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-xs font-medium ${
                            t.sessionWindow === 'Outside Window'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.sessionWindow}
                        </span>
                      </td>

                      {/* Contract & Account */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {t.contract}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {t.accountType}
                        </div>
                      </td>

                      {/* Direction & Subtle Zone Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-xs font-bold"
                            style={{
                              backgroundColor:
                                t.direction === 'Long'
                                  ? 'rgba(56, 102, 65, 0.12)'
                                  : 'rgba(188, 71, 73, 0.12)',
                              color:
                                t.direction === 'Long' ? '#386641' : '#BC4749',
                            }}
                          >
                            {t.direction}
                          </span>

                          {(isSupport || isResistance) && (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold border"
                              style={{
                                borderColor: isSupport
                                  ? 'rgba(56, 102, 65, 0.3)'
                                  : 'rgba(188, 71, 73, 0.3)',
                                color: isSupport ? '#386641' : '#BC4749',
                                backgroundColor: isSupport
                                  ? 'rgba(56, 102, 65, 0.05)'
                                  : 'rgba(188, 71, 73, 0.05)',
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: isSupport
                                    ? '#386641'
                                    : '#BC4749',
                                }}
                              />
                              {isSupport ? 'Support #386641' : 'Resistance #BC4749'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Net P&L */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span
                          style={{
                            color: isWin ? '#386641' : '#BC4749',
                          }}
                        >
                          {formatUSD(t.netPnl)}
                        </span>
                      </td>

                      {/* R-Multiple */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-mono font-semibold text-xs text-slate-800">
                        {Number(t.rMultiple) > 0
                          ? `+${t.rMultiple}R`
                          : `${t.rMultiple}R`}
                      </td>

                      {/* Compliance Grade */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold"
                          style={{
                            backgroundColor:
                              t.complianceGrade === 'A'
                                ? 'rgba(56, 102, 65, 0.12)'
                                : t.complianceGrade === 'B'
                                ? 'rgba(202, 138, 4, 0.12)'
                                : 'rgba(188, 71, 73, 0.12)',
                            color:
                              t.complianceGrade === 'A'
                                ? '#386641'
                                : t.complianceGrade === 'B'
                                ? '#a16207'
                                : '#BC4749',
                          }}
                        >
                          {t.complianceGrade} · {t.complianceScore}%
                        </span>
                      </td>

                      {/* Execution Status / Leak Tags */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {(t.leakTags || []).length === 0 ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(56, 102, 65, 0.08)',
                                color: '#386641',
                              }}
                            >
                              ✓ Clean Execution
                            </span>
                          ) : (
                            t.leakTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
                                style={{
                                  backgroundColor: 'rgba(188, 71, 73, 0.08)',
                                  borderColor: 'rgba(188, 71, 73, 0.25)',
                                  color: '#BC4749',
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          {t.tradingViewUrl && (
                            <a
                              href={t.tradingViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                              title="Open TradingView Chart"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTrade(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit trade"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrade(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete trade"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
