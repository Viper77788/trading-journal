import React, { useState } from 'react';
import {
  Activity,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  ArrowUpRight,
  Upload,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import {
  formatTime12hEST,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';

export default function DashboardView({
  onOpenLogModal,
  onOpenImportModal,
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
  const [directionFilter, setDirectionFilter] = useState('All');

  const visibleTrades = filteredTrades.filter((t) => {
    const matchesDirection =
      directionFilter === 'All' || t.direction === directionFilter;
    const matchesSearch =
      !searchQuery ||
      t.contract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.accountId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.accountType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.leakTags || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDirection && matchesSearch;
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
        {/* 1. Win Rate & Total Contracts Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Win Rate
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {analytics.wins}W / {analytics.losses}L
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                {analytics.winRate}%
              </span>
              <span className="text-xs font-medium text-[#8A99AD]">
                {analytics.totalTrades} Trades ({analytics.totalContractsTraded}x Lots)
              </span>
            </div>

            {/* Thin Consistency Progress Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analytics.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.max(6, analytics.winRate)}%`,
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

        {/* 2. Total Net P&L & $25k Lucid Flex Account Balance Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Net P&L ($25k Acct)
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF] ${
                  analytics.totalNetPnl >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                ${analytics.currentAccountBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
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
                Base $25,000
              </span>
            </div>

            {/* Thin Rule Adherence Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analytics.avgComplianceScore >= 75
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.max(6, analytics.avgComplianceScore)}%`,
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

        {/* 3. Profit Factor & 15m Revenge Guard Card */}
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
                  analytics.revengeTradesCount === 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {analytics.revengeTradesCount === 0
                  ? '0 Revenge Leaks'
                  : `🚨 ${analytics.revengeTradesCount} <15m Gap`}
              </span>
            </div>

            {/* Thin Efficiency Bar */}
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analytics.profitFactor >= 1.5
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.max(8, pfBarPct)}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              15m Rule:{' '}
              <strong className="font-mono text-[#FFFFFF]">
                {analytics.revengeTradesCount === 0 ? 'PASS' : 'FLAGGED'}
              </strong>
            </span>
            <button
              type="button"
              onClick={onOpenSessionReview}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <span>Guard</span>
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
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF] ${
                  analytics.avgRMultiple >= 1.5
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                }`}
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
                className={`h-full rounded-full transition-all duration-300 ${
                  analytics.avgRMultiple >= 1.5
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${rBarPct}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A99AD]">
              Product: <strong className="text-[#FFFFFF]">MGCZ6 / GC</strong>
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
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF] ${
                  dailyLossTracker.riskStatusPass
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                }`}
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
                className={`h-full rounded-full transition-all duration-300 ${
                  dailyLossTracker.dailyLossUtilizationPct >= 80
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.max(4, dailyLossTracker.dailyLossUtilizationPct)}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-mono text-[#8A99AD]">
              LFE05072050930002
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
                title="Import NinjaTrader Orders.csv"
              >
                <Upload size={11} />
                <span>CSV</span>
              </button>
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
                {visibleTrades.length} Executions
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
              All timestamps formatted in <strong className="text-[#FFFFFF]">12-Hour EST (AM/PM)</strong> • Click any execution row to open the 4-Point AI Audit
            </p>
          </div>

          {/* Direction Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Direction Filter Pills */}
            <div className="flex items-center bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
              {[
                { id: 'All', label: 'All Trades' },
                { id: 'Long', label: 'LONG' },
                { id: 'Short', label: 'SHORT' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirectionFilter(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    directionFilter === d.id
                      ? 'bg-[#111620] text-[#FFFFFF] border border-slate-700/70 shadow-xs'
                      : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                  }`}
                >
                  {d.label}
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
                placeholder="Search LFE account, contract, leak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-[#090C10] border border-slate-800/60 text-sm text-[#FFFFFF] placeholder-[#8A99AD] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* High-Contrast Spacious Table (py-3.5 px-4 cells, hover:bg-slate-800/80) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-[#090C10]/60 text-xs font-semibold uppercase tracking-wider text-[#8A99AD]">
                <th className="py-3.5 px-4">Date & Time (EST)</th>
                <th className="py-3.5 px-4">Account & Contract</th>
                <th className="py-3.5 px-4">Direction & Lots</th>
                <th className="py-3.5 px-4">Entry → Exit Price</th>
                <th className="py-3.5 px-4 text-right">Net P&L</th>
                <th className="py-3.5 px-4 text-right">R-Multiple</th>
                <th className="py-3.5 px-4 text-center">Compliance</th>
                <th className="py-3.5 px-4">Behavioral Guard (15m Rule)</th>
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
                    No executions match the current filter. Click &quot;Import NinjaTrader CSV&quot; or &quot;Fast Log Trade&quot;.
                  </td>
                </tr>
              ) : (
                visibleTrades.map((t) => {
                  const isWin = Number(t.netPnl) >= 0;
                  const entryEST =
                    t.timeEST || formatTime12hEST(t.time || '09:30', false);
                  const exitEST =
                    t.exitTimeEST ||
                    (t.exitTime24
                      ? formatTime12hEST(t.exitTime24, false)
                      : null);
                  const hasRevengeFlag =
                    Boolean(t.isRevengeTrade) ||
                    (t.leakTags || []).includes(REVENGE_GAP_LABEL);
                  const qty = Math.max(1, Number(t.quantity) || 1);
                  const lotLabel = t.lotType || 'Micro';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setLastSubmittedTrade(t);
                        onOpenSessionReview?.();
                      }}
                      className="hover:bg-slate-800/80 transition-colors cursor-pointer"
                    >
                      {/* Date & Time in 12-Hour EST (AM/PM) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#FFFFFF] text-sm">
                          {t.date}
                        </div>
                        <div className="font-mono text-xs text-emerald-400 mt-0.5">
                          {entryEST}
                          {exitEST && exitEST !== entryEST
                            ? ` → ${exitEST.replace(' EST', '')} EST`
                            : ''}
                        </div>
                      </td>

                      {/* Account & Contract */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#FFFFFF] text-sm uppercase">
                            {t.contract}
                          </span>
                          <span className="text-xs text-[#8A99AD]">
                            {t.productDesc || 'E-Micro Gold'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#8A99AD] mt-0.5">
                          {t.accountId
                            ? `${t.accountId} ($25k ${t.accountType || 'Lucid Flex'})`
                            : `$25k ${t.accountType || 'Lucid Flex'}`}
                        </div>
                      </td>

                      {/* Clean LONG / SHORT Badges + Contract Lot Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                              t.direction === 'Long'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {t.direction === 'Long' ? 'LONG' : 'SHORT'}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-[#090C10] border border-slate-800/80 font-mono text-xs font-semibold text-[#FFFFFF]">
                            {qty}x {lotLabel}
                          </span>
                        </div>
                      </td>

                      {/* Entry -> Exit Prices */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-[#FFFFFF]">
                        {t.entryPrice !== '' && t.entryPrice !== undefined
                          ? Number(t.entryPrice).toFixed(2)
                          : '—'}{' '}
                        <span className="text-[#8A99AD]">→</span>{' '}
                        {t.exitPrice !== '' && t.exitPrice !== undefined
                          ? Number(t.exitPrice).toFixed(2)
                          : '—'}
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
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold text-[#FFFFFF] ${
                            t.complianceGrade === 'A'
                              ? 'bg-emerald-600'
                              : t.complianceGrade === 'B'
                              ? 'bg-amber-600'
                              : 'bg-rose-600'
                          }`}
                        >
                          {t.complianceGrade} · {t.complianceScore}%
                        </span>
                      </td>

                      {/* Behavioral Guard (15-Minute Revenge Trading Rule) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(t.leakTags || []).length === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ Clean
                              {t.timeGapFromPrevMins !== null &&
                                t.timeGapFromPrevMins !== undefined && (
                                  <span className="font-mono text-[11px] opacity-85">
                                    ({t.timeGapFromPrevMins}m gap)
                                  </span>
                                )}
                            </span>
                          ) : (
                            t.leakTags.map((tag) => {
                              const isRevengeChip = tag === REVENGE_GAP_LABEL;
                              return (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                >
                                  {isRevengeChip ? `🚨 ${tag}` : tag}
                                  {isRevengeChip &&
                                    t.timeGapFromPrevMins !== null &&
                                    t.timeGapFromPrevMins !== undefined && (
                                      <span className="font-mono ml-1 text-[#FFFFFF]">
                                        ({t.timeGapFromPrevMins}m)
                                      </span>
                                    )}
                                </span>
                              );
                            })
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
