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
  ArrowUpRight,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';

export default function DashboardView({
  onOpenLogModal,
  onEditTrade,
  onOpenSessionReview,
  onNavigateAnalytics,
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
  const pfBarPct = Math.min(100, Math.round((analytics.profitFactor / 3) * 100));
  const rBarPct = Math.min(
    100,
    Math.max(8, Math.round((Math.max(0, analytics.avgRMultiple) / 2.5) * 100))
  );

  return (
    <div className="flex-1 flex flex-col gap-6 w-full">
      {/* LUCID-STYLE SPACIOUS METRIC & ACCOUNT CARDS (#111620, rounded-xl, p-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 w-full">
        {/* 1. Win Rate & Consistency Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Win Rate
              </span>
              <span
                className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-emerald-300 border border-emerald-500/30"
                style={{ backgroundColor: 'rgba(56, 102, 65, 0.35)' }}
              >
                {analytics.wins}W / {analytics.losses}L
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                {analytics.winRate}%
              </span>
              <span className="text-xs font-medium text-[#8A99AD]">
                {analytics.totalTrades} Executions
              </span>
            </div>

            {/* Thin Consistency Progress Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(6, analytics.winRate)}%`,
                  backgroundColor:
                    analytics.winRate >= 50 ? '#386641' : '#BC4749',
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              Benchmark: <strong className="text-[#FFFFFF]">55.0%</strong>
            </span>
            <button
              type="button"
              onClick={onNavigateAnalytics}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <span>Stats</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* 2. Total Net P&L & Rule Compliance Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Total Net P&L
              </span>
              <span
                className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF]"
                style={{
                  backgroundColor:
                    analytics.totalNetPnl >= 0 ? '#386641' : '#BC4749',
                }}
              >
                {analytics.totalNetPnl >= 0 ? 'PROFIT' : 'DRAWDOWN'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span
                className={`text-2xl font-bold font-mono tracking-tight ${
                  analytics.totalNetPnl >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {formatUSD(analytics.totalNetPnl)}
              </span>
              <span className="text-xs font-mono text-[#8A99AD]">
                GC / MGCZ6
              </span>
            </div>

            {/* Thin Rule Adherence Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(6, analytics.avgComplianceScore)}%`,
                  backgroundColor:
                    analytics.avgComplianceScore >= 75 ? '#386641' : '#BC4749',
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              14-Rule Avg:{' '}
              <strong className="font-mono text-[#FFFFFF]">
                {analytics.avgComplianceScore}%
              </strong>
            </span>
            <button
              type="button"
              onClick={onOpenSessionReview}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <span>Audit</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* 3. Profit Factor & Streak Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Profit Factor
              </span>
              <Activity size={15} className="text-emerald-400" />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                {analytics.profitFactor}
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  analytics.streaks.currentStreak >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                Streak:{' '}
                {analytics.streaks.currentStreak > 0
                  ? `+${analytics.streaks.currentStreak}W`
                  : analytics.streaks.currentStreak < 0
                  ? `${analytics.streaks.currentStreak}L`
                  : '0'}
              </span>
            </div>

            {/* Thin Efficiency Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(8, pfBarPct)}%`,
                  backgroundColor:
                    analytics.profitFactor >= 1.5 ? '#386641' : '#BC4749',
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              Target: <strong className="font-mono text-[#FFFFFF]">&gt;1.80</strong>
            </span>
            <button
              type="button"
              onClick={onNavigateAnalytics}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <span>Curve</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* 4. Avg R-Multiple Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Avg R-Multiple
              </span>
              <span
                className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF]"
                style={{
                  backgroundColor:
                    analytics.avgRMultiple >= 1.5 ? '#386641' : '#BC4749',
                }}
              >
                {analytics.avgRMultiple >= 1.5 ? 'ON TARGET' : 'BELOW 1.5R'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                {analytics.avgRMultiple > 0
                  ? `+${analytics.avgRMultiple}R`
                  : `${analytics.avgRMultiple}R`}
              </span>
              <span className="text-xs font-mono text-[#8A99AD]">
                Target +1.50R
              </span>
            </div>

            {/* Thin R-Multiple Progress Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${rBarPct}%`,
                  backgroundColor:
                    analytics.avgRMultiple >= 1.5 ? '#386641' : '#BC4749',
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              Window: <strong className="text-[#FFFFFF]">1–4 / 8–11 AM</strong>
            </span>
            <button
              type="button"
              onClick={onNavigateAnalytics}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <span>R-Dist</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* 5. Lucid Flex $600 Daily Loss Cap Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Daily Loss Limit
              </span>
              <span
                className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF]"
                style={{
                  backgroundColor: dailyLossTracker.riskStatusPass
                    ? '#386641'
                    : '#BC4749',
                }}
              >
                {dailyLossTracker.dailyLossUtilizationPct}% USED
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                -${dailyLossTracker.latestDayLossUsed.toFixed(0)}
              </span>
              <span className="text-xs font-mono text-[#8A99AD]">
                Cap: -${dailyLossCap}
              </span>
            </div>

            {/* Thin Daily Loss Utilization Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
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

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              Account: <strong className="text-[#FFFFFF]">Lucid Flex</strong>
            </span>
            <button
              type="button"
              onClick={onOpenLogModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <span>+ Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* LUCID-STYLE EXECUTIONS TABLE CONTAINER (#111620, rounded-xl, border-slate-800/60) */}
      <div className="flex-1 flex flex-col bg-[#111620] rounded-xl border border-slate-800/60 overflow-hidden w-full">
        {/* Table Control & Filter Header */}
        <div className="px-6 py-5 border-b border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight text-[#FFFFFF]">
                Executed Futures Trades
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#090C10] text-[#8A99AD] border border-slate-800/60">
                {visibleTrades.length} Rows
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
              Click any execution row to inspect its 14-Rule Strategy Audit •{' '}
              <span className="font-mono text-emerald-400">
                #386641 Support
              </span>{' '}
              &{' '}
              <span className="font-mono text-rose-400">
                #BC4749 Resistance
              </span>
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Liquidity Window Filter Pills */}
            <div className="flex items-center bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    sessionFilter === w.id
                      ? 'bg-[#111620] text-[#FFFFFF] border border-slate-700/70 shadow-xs'
                      : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A99AD]"
              />
              <input
                type="text"
                placeholder="Search contract, account, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-[#090C10] border border-slate-800/60 text-sm text-[#FFFFFF] placeholder-[#8A99AD] focus:outline-none focus:border-[#386641]"
              />
            </div>
          </div>
        </div>

        {/* High-Contrast Spacious Table (py-3.5 px-4 cells, hover:bg-slate-800/80) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-[#090C10]/60 text-xs font-semibold uppercase tracking-wider text-[#8A99AD]">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Session Window</th>
                <th className="py-3.5 px-4">Contract & Account</th>
                <th className="py-3.5 px-4">Direction & Zone</th>
                <th className="py-3.5 px-4 text-right">Net P&L</th>
                <th className="py-3.5 px-4 text-right">R-Multiple</th>
                <th className="py-3.5 px-4 text-center">Compliance</th>
                <th className="py-3.5 px-4">Behavioral Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {visibleTrades.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-16 text-center text-[#8A99AD] text-sm font-medium"
                  >
                    No executions match the current filter. Click "Fast Log Trade" to record a trade.
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
                      className="hover:bg-slate-800/80 transition-colors cursor-pointer"
                      style={{
                        borderLeft: `3px solid ${accentColor}`,
                      }}
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#FFFFFF] text-sm">
                          {t.date}
                        </div>
                        <div className="font-mono text-xs text-[#8A99AD] mt-0.5">
                          {t.time} EST
                        </div>
                      </td>

                      {/* Session Window */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-xs font-medium ${
                            t.sessionWindow === 'Outside Window'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-[#090C10] text-[#FFFFFF] border border-slate-800/80'
                          }`}
                        >
                          {t.sessionWindow}
                        </span>
                      </td>

                      {/* Contract & Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#FFFFFF] text-sm uppercase">
                          {t.contract}
                        </div>
                        <div className="text-xs font-medium text-[#8A99AD] mt-0.5">
                          {t.accountType}
                        </div>
                      </td>

                      {/* Direction & Zone Badges */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-[#FFFFFF]"
                            style={{
                              backgroundColor:
                                t.direction === 'Long' ? '#386641' : '#BC4749',
                            }}
                          >
                            {t.direction}
                          </span>

                          {(isSupport || isResistance) && (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-[#FFFFFF] border"
                              style={{
                                backgroundColor: isSupport
                                  ? 'rgba(56, 102, 65, 0.25)'
                                  : 'rgba(188, 71, 73, 0.25)',
                                borderColor: isSupport ? '#386641' : '#BC4749',
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
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
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-base">
                        <span
                          className={isWin ? 'text-emerald-400' : 'text-rose-400'}
                        >
                          {formatUSD(t.netPnl)}
                        </span>
                      </td>

                      {/* R-Multiple */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-sm text-[#FFFFFF]">
                        {Number(t.rMultiple) > 0
                          ? `+${t.rMultiple}R`
                          : `${t.rMultiple}R`}
                      </td>

                      {/* Compliance Grade */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold text-[#FFFFFF]"
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
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(t.leakTags || []).length === 0 ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-300 border border-emerald-500/30"
                              style={{
                                backgroundColor: 'rgba(56, 102, 65, 0.3)',
                              }}
                            >
                              ✓ Clean
                            </span>
                          ) : (
                            t.leakTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#FFFFFF]"
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
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          {t.tradingViewUrl && (
                            <a
                              href={t.tradingViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors"
                              title="Open TradingView Chart"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTrade(t)}
                            className="p-1.5 rounded-lg text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
                            title="Edit trade"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrade(t.id)}
                            className="p-1.5 rounded-lg text-[#8A99AD] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
