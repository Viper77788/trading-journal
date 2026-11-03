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
    <div className="flex-1 flex flex-col gap-6 w-full">
      {/* TOP SUMMARY BAR: 5 Prominent Macro Metrics in #131B2E Dark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 w-full">
        {/* 1. Win Rate */}
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            <span>Win Rate</span>
            <Award size={18} className="text-emerald-400" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold font-mono text-[#F8FAFC]">
              {analytics.winRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-[#94A3B8]">
            <span>
              {analytics.wins}W / {analytics.losses}L
            </span>
            <span className="font-mono font-semibold text-[#F8FAFC]">
              {analytics.totalTrades} Trades
            </span>
          </div>
        </div>

        {/* 2. Net P&L */}
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            <span>Net P&L</span>
            <TrendingUp
              size={18}
              className={analytics.totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            />
          </div>
          <div className="my-3">
            <span
              className={`text-3xl font-bold font-mono ${
                analytics.totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatUSD(analytics.totalNetPnl)}
            </span>
          </div>
          <div className="text-sm text-[#94A3B8]">
            14-Rule Avg:{' '}
            <strong className="font-mono text-[#F8FAFC]">
              {analytics.avgComplianceScore}%
            </strong>
          </div>
        </div>

        {/* 3. Profit Factor */}
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            <span>Profit Factor</span>
            <Activity size={18} className="text-sky-400" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold font-mono text-[#F8FAFC]">
              {analytics.profitFactor}
            </span>
          </div>
          <div className="text-sm text-[#94A3B8]">
            Active Streak:{' '}
            <strong
              className={`font-mono ${
                analytics.streaks.currentStreak >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
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
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            <span>Avg R-Multiple</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  analytics.avgRMultiple >= 1.5 ? '#386641' : '#BC4749',
              }}
            />
          </div>
          <div className="my-3">
            <span className="text-3xl font-bold font-mono text-[#F8FAFC]">
              {analytics.avgRMultiple > 0
                ? `+${analytics.avgRMultiple}R`
                : `${analytics.avgRMultiple}R`}
            </span>
          </div>
          <div className="text-sm text-[#94A3B8]">
            Target Benchmark: <strong className="font-mono text-[#F8FAFC]">+1.50R</strong>
          </div>
        </div>

        {/* 5. Daily Loss Limit ($600 Cap Utilization Bar) */}
        <div className="bg-[#131B2E] rounded-2xl p-5 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">
            <span>Daily Loss Cap</span>
            {dailyLossTracker.riskStatusPass ? (
              <ShieldCheck size={18} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={18} className="text-rose-400" />
            )}
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#F8FAFC]">
              -${dailyLossTracker.latestDayLossUsed.toFixed(0)}{' '}
              <span className="text-sm font-normal text-[#94A3B8]">
                / ${dailyLossCap}
              </span>
            </span>
            <span
              className="text-sm font-mono font-bold px-2.5 py-1 rounded-md text-[#F8FAFC]"
              style={{
                backgroundColor: dailyLossTracker.riskStatusPass
                  ? '#386641'
                  : '#BC4749',
              }}
            >
              {dailyLossTracker.dailyLossUtilizationPct}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#0B0F17] rounded-full overflow-hidden">
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

      {/* SPACIOUS, HIGH-READABILITY DARK EXECUTIONS TABLE */}
      <div className="flex-1 flex flex-col bg-[#131B2E] rounded-2xl border border-slate-800/80 shadow-md overflow-hidden w-full">
        {/* Table Header Bar */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC] tracking-tight">
              Gold Futures Executions
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Showing {visibleTrades.length} logged trades • Zone badges:{' '}
              <span className="font-mono font-semibold text-emerald-400">
                #386641 Support
              </span>{' '}
              &{' '}
              <span className="font-mono font-semibold text-rose-400">
                #BC4749 Resistance
              </span>
            </p>
          </div>

          {/* Filter & Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Session Window Filter */}
            <div className="flex items-center bg-[#0B0F17] p-1 rounded-xl border border-slate-800/80 text-sm">
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
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    sessionFilter === w.id
                      ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700/70'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                placeholder="Search contract or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-[#0B0F17] border border-slate-800/80 text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#386641]"
              />
            </div>

            {/* Toggle AI Review Drawer */}
            <button
              type="button"
              onClick={onOpenSessionReview}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B0F17] hover:bg-slate-800/70 text-[#F8FAFC] border border-slate-800/80 transition-colors"
            >
              <Sparkles size={16} className="text-emerald-400" />
              <span>AI Session Review</span>
            </button>

            {/* Fast Log Button */}
            <button
              type="button"
              onClick={onOpenLogModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#F8FAFC] shadow-sm transition-opacity hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              <Plus size={16} />
              <span>Fast Log Trade</span>
            </button>
          </div>
        </div>

        {/* Spacious Table with >=14px (text-sm) Typography */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#0B0F17]/60 text-sm font-semibold text-[#94A3B8]">
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-5">Session Window</th>
                <th className="py-4 px-5">Contract</th>
                <th className="py-4 px-5">Direction & Zone</th>
                <th className="py-4 px-5 text-right">Net P&L</th>
                <th className="py-4 px-5 text-right">R-Multiple</th>
                <th className="py-4 px-5 text-center">Compliance</th>
                <th className="py-4 px-5">Execution Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {visibleTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#94A3B8] text-sm">
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
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      style={{
                        borderLeft: `4px solid ${accentColor}`,
                      }}
                    >
                      {/* Date & Time */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#F8FAFC] text-sm">
                          {t.date}
                        </div>
                        <div className="font-mono text-sm text-[#94A3B8] mt-0.5">
                          {t.time} NY
                        </div>
                      </td>

                      {/* Session Window */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-sm font-medium ${
                            t.sessionWindow === 'Outside Window'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800/90 text-[#F8FAFC] border border-slate-700/70'
                          }`}
                        >
                          {t.sessionWindow}
                        </span>
                      </td>

                      {/* Contract & Account */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#F8FAFC] text-sm">
                          {t.contract}
                        </div>
                        <div className="text-sm text-[#94A3B8] mt-0.5">
                          {t.accountType}
                        </div>
                      </td>

                      {/* Direction & Zone Badges */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="px-2.5 py-1 rounded-md text-sm font-bold text-[#F8FAFC]"
                            style={{
                              backgroundColor:
                                t.direction === 'Long' ? '#386641' : '#BC4749',
                            }}
                          >
                            {t.direction}
                          </span>

                          {(isSupport || isResistance) && (
                            <span
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-sm font-mono font-semibold text-[#F8FAFC]"
                              style={{
                                backgroundColor: isSupport
                                  ? '#386641'
                                  : '#BC4749',
                              }}
                            >
                              {isSupport ? 'Support #386641' : 'Resistance #BC4749'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Net P&L */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-mono font-bold text-base">
                        <span
                          className={isWin ? 'text-emerald-400' : 'text-rose-400'}
                        >
                          {formatUSD(t.netPnl)}
                        </span>
                      </td>

                      {/* R-Multiple */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-mono font-bold text-sm text-[#F8FAFC]">
                        {Number(t.rMultiple) > 0
                          ? `+${t.rMultiple}R`
                          : `${t.rMultiple}R`}
                      </td>

                      {/* Compliance Grade */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-sm font-bold text-[#F8FAFC]"
                          style={{
                            backgroundColor:
                              t.complianceGrade === 'A'
                                ? '#386641'
                                : t.complianceGrade === 'B'
                                ? '#b45309'
                                : '#BC4749',
                          }}
                        >
                          {t.complianceGrade} · {t.complianceScore}%
                        </span>
                      </td>

                      {/* Execution Status / Leak Tags */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-2">
                          {(t.leakTags || []).length === 0 ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold text-[#F8FAFC]"
                              style={{
                                backgroundColor: '#386641',
                              }}
                            >
                              ✓ Clean Execution
                            </span>
                          ) : (
                            t.leakTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 rounded-md text-sm font-semibold text-[#F8FAFC]"
                                style={{
                                  backgroundColor: '#BC4749',
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
                        <div className="inline-flex items-center gap-1.5">
                          {t.tradingViewUrl && (
                            <a
                              href={t.tradingViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800"
                              title="Open TradingView Chart"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTrade(t)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800"
                            title="Edit trade"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrade(t.id)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete trade"
                          >
                            <Trash2 size={16} />
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
