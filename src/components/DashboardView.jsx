import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Star,
  Clock,
  AlertTriangle,
  Download,
  Sparkles,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import {
  LIQUIDITY_WINDOWS,
  FEELING_OPTIONS,
  MARKET_CONDITION_OPTIONS,
} from '../constants/viperConstants';
import {
  formatLiquidityWindowESTLabel,
  exportTradingJournalCsv,
} from '../utils/ninjaTraderCsvParser';

export function LiquidityWindowPill({ sessionWindow, time }) {
  const label = formatLiquidityWindowESTLabel(sessionWindow, time);

  if (sessionWindow === LIQUIDITY_WINDOWS.ASIAN_LONDON) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30 whitespace-nowrap">
        <Clock size={12} className="text-sky-400 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  if (sessionWindow === LIQUIDITY_WINDOWS.NY_OPEN) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 whitespace-nowrap">
        <Clock size={12} className="text-[#10B981] shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-[#94A3B8] border border-slate-700/70 whitespace-nowrap">
      <Clock size={12} className="text-[#94A3B8] shrink-0" />
      <span>Outside Window</span>
    </span>
  );
}

export default function DashboardView({
  trades,
  onOpenLogModal,
  onOpenImportModal,
  onEditTrade,
}) {
  const { deleteTrade, clearAllTrades, loadSampleNinjaTraderCsv } = useViper();
  const [searchQuery, setSearchQuery] = useState('');

  const searchedTrades = trades.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const winLabel = formatLiquidityWindowESTLabel(
      t.sessionWindow,
      t.time
    ).toLowerCase();
    return (
      t.contract?.toLowerCase().includes(q) ||
      t.direction?.toLowerCase().includes(q) ||
      winLabel.includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      (t.customTags || []).join(' ').toLowerCase().includes(q) ||
      (t.feelings || []).join(' ').toLowerCase().includes(q) ||
      (t.marketConditions || []).join(' ').toLowerCase().includes(q) ||
      (t.leakTags || []).join(' ').toLowerCase().includes(q)
    );
  });

  // Compute summary metrics for the 4 inline columns in Decision Archive
  const totalTrades = searchedTrades.length;
  const netResult = searchedTrades.reduce(
    (sum, t) => sum + (Number(t.netPnl) || 0),
    0
  );
  const winsCount = searchedTrades.filter(
    (t) => (Number(t.netPnl) || 0) > 0
  ).length;
  const winRate =
    totalTrades > 0 ? ((winsCount / totalTrades) * 100).toFixed(1) : '0.0';

  const bestTradePnl =
    totalTrades > 0
      ? Math.max(...searchedTrades.map((t) => Number(t.netPnl) || 0))
      : null;

  const tradesWithNotesCount = searchedTrades.filter(
    (t) => t.notes && t.notes.trim().length > 0
  ).length;
  const revengeFlaggedCount = searchedTrades.filter(
    (t) => t.isRevengeTrade
  ).length;
  const cleanTradesCount = Math.max(0, totalTrades - revengeFlaggedCount);

  const handleExportCsv = () => {
    const csvContent = exportTradingJournalCsv(searchedTrades);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trading-journal-2026-11-04.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* D. "DECISION ARCHIVE" SUMMARY CARD & ACTION BAR */}
      <section className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
              DECISION ARCHIVE
            </span>
            <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1 tracking-tight">
              Every trade, in context
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Search the details behind the result, not just the result itself.
            </p>
          </div>

          {/* Action Buttons (Top Right of Card) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#F8FAFC] bg-[#0A0D12] hover:bg-slate-800/80 border border-slate-800/90 transition-colors cursor-pointer"
            >
              <Upload size={15} className="text-[#94A3B8]" />
              <span>Import CSV</span>
            </button>

            {trades.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 transition-colors cursor-pointer"
                  title="Download trading-journal-2026-11-04.csv"
                >
                  <Download size={15} />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={clearAllTrades}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 transition-colors cursor-pointer"
                  title="Clear loaded CSV trades"
                >
                  <Trash2 size={15} />
                  <span>Clear CSV</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onOpenLogModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0A0D12] bg-[#10B981] hover:bg-emerald-400 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Log trade</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Inline Metric Columns separated by subtle dividers */}
        <div className="mt-7 pt-6 border-t border-slate-800/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:divide-x sm:divide-slate-800/70">
          {/* 1. NET RESULT */}
          <div className="sm:pr-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              NET RESULT
            </span>
            <div
              className={`text-2xl font-bold font-mono mt-1.5 tracking-tight ${
                netResult > 0
                  ? 'text-[#10B981]'
                  : netResult < 0
                  ? 'text-[#EF4444]'
                  : 'text-[#10B981]'
              }`}
            >
              {formatUSD(netResult)}
            </div>
          </div>

          {/* 2. WIN RATE */}
          <div className="sm:px-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              WIN RATE
            </span>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC] mt-1.5 tracking-tight">
              {winRate}%
            </div>
          </div>

          {/* 3. BEST RESULT */}
          <div className="sm:px-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              BEST RESULT
            </span>
            <div
              className={`text-2xl font-bold font-mono mt-1.5 tracking-tight ${
                bestTradePnl !== null && bestTradePnl > 0
                  ? 'text-[#10B981]'
                  : 'text-[#94A3B8]'
              }`}
            >
              {bestTradePnl !== null ? formatUSD(bestTradePnl) : '—'}
            </div>
          </div>

          {/* 4. WITH NOTES / REVENGE GUARD */}
          <div className="sm:pl-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              WITH NOTES / REVENGE GUARD
            </span>
            <div className="mt-1.5 flex items-center flex-wrap gap-2">
              <span className="text-2xl font-bold font-mono text-[#F8FAFC] tracking-tight">
                {tradesWithNotesCount}{' '}
                <span className="text-base font-sans font-semibold text-[#94A3B8]">
                  {tradesWithNotesCount === 1 ? 'trade' : 'trades'}
                </span>
              </span>
              {totalTrades > 0 && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    revengeFlaggedCount > 0
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                      : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  }`}
                >
                  {revengeFlaggedCount > 0
                    ? `${cleanTradesCount} Clean • 🚨 ${revengeFlaggedCount} <15m Revenge`
                    : `${cleanTradesCount} Clean`}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* E. TRADE LOG TABLE / EMPTY STATE */}
      <section className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8 shadow-lg">
        {trades.length === 0 ? (
          /* EMPTY STATE (Matches Screenshot 4) */
          <div className="py-14 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mb-5">
              <CalendarIcon size={26} />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
              Your trade log is ready
            </h3>
            <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
              Once you log a trade, this is where you&apos;ll review the
              decision, context and result.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenLogModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0A0D12] bg-[#10B981] hover:bg-emerald-400 transition-all cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Log a trade</span>
              </button>
              <button
                type="button"
                onClick={() => loadSampleNinjaTraderCsv()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#F8FAFC] bg-[#0A0D12] hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
              >
                <Sparkles size={15} className="text-[#10B981]" />
                <span>Load Orders.csv Sample</span>
              </button>
            </div>
          </div>
        ) : (
          /* POPULATED TRADE LOG TABLE */
          <div className="space-y-5">
            {/* Search & Count Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by contract, liquidity window, emotion, tag or notes..."
                  className="w-full bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 outline-none transition-colors"
                />
              </div>
              <div className="text-xs font-medium text-[#94A3B8]">
                Showing{' '}
                <strong className="text-[#F8FAFC] font-mono">
                  {searchedTrades.length}
                </strong>{' '}
                {searchedTrades.length === 1 ? 'execution' : 'executions'} in
                12-Hour EST
              </div>
            </div>

            {/* Spacious Dark Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0A0D12]/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-3.5 px-4">Date &amp; Time (EST)</th>
                    <th className="py-3.5 px-4">Liquidity Window</th>
                    <th className="py-3.5 px-4">Contract</th>
                    <th className="py-3.5 px-4">Direction &amp; Lots</th>
                    <th className="py-3.5 px-4">Entry → Exit</th>
                    <th className="py-3.5 px-4 text-right">Net P&amp;L</th>
                    <th className="py-3.5 px-4">Execution Grade &amp; Tags</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[14px]">
                  {searchedTrades.map((trade) => {
                    const isPositive = Number(trade.netPnl) > 0;
                    const isNegative = Number(trade.netPnl) < 0;
                    const stars = Number(trade.executionGrade) || 0;

                    return (
                      <tr
                        key={trade.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Date & Time (12-Hour EST with AM/PM) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-[#F8FAFC] text-sm">
                            {trade.formattedDateEST} EST
                          </div>
                          <div className="text-xs font-mono text-[#94A3B8] mt-0.5">
                            Exit: {trade.exitTimeEST} • {trade.timeCT}
                          </div>
                        </td>

                        {/* Liquidity Window Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <LiquidityWindowPill
                            sessionWindow={trade.sessionWindow}
                            time={trade.time}
                          />
                        </td>

                        {/* Contract */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#121721] text-[#F8FAFC] border border-slate-700/80">
                            {trade.contract || 'MGCZ6'}
                          </span>
                        </td>

                        {/* Direction & Lots */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                                trade.direction === 'Long'
                                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                                  : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                              }`}
                            >
                              {trade.direction}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#121721] text-[#F8FAFC] border border-slate-800">
                              {trade.quantity || 1}x
                            </span>
                          </div>
                        </td>

                        {/* Entry -> Exit Price */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-sm text-[#F8FAFC]">
                          <span>
                            {Number(trade.entryPrice || 0).toFixed(2)}
                          </span>
                          <span className="text-[#94A3B8] mx-1.5">→</span>
                          <span>{Number(trade.exitPrice || 0).toFixed(2)}</span>
                        </td>

                        {/* Net P&L ($) */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <span
                            className={`font-mono text-base font-bold ${
                              isPositive
                                ? 'text-[#10B981]'
                                : isNegative
                                ? 'text-[#EF4444]'
                                : 'text-[#94A3B8]'
                            }`}
                          >
                            {formatUSD(trade.netPnl)}
                          </span>
                        </td>

                        {/* Execution Grade & Tags */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {/* Star Rating (1-5★) */}
                            {stars > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#121721] border border-slate-800 text-xs font-mono font-semibold text-[#10B981]">
                                {Array.from({ length: stars }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={11}
                                    className="text-[#10B981] fill-[#10B981]"
                                  />
                                ))}
                              </span>
                            )}

                            {/* Automatic 15-Minute Revenge Guard Badge */}
                            {trade.isRevengeTrade && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/35">
                                <AlertTriangle size={11} />
                                <span>🚨 Revenge (&lt;15m gap)</span>
                              </span>
                            )}

                            {/* Feeling Emoji Pills */}
                            {(trade.feelings || []).map((fId) => {
                              const fMeta = FEELING_OPTIONS.find(
                                (item) => item.id === fId
                              );
                              const label = fMeta ? fMeta.label : fId;
                              const isRevengeFeeling = fId === 'Revenge';
                              return (
                                <span
                                  key={fId}
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    isRevengeFeeling
                                      ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                                      : 'bg-[#121721] text-[#F8FAFC] border-slate-800'
                                  }`}
                                >
                                  {label}
                                </span>
                              );
                            })}

                            {/* Market Condition Pills */}
                            {(trade.marketConditions || []).map((mcId) => {
                              const mcMeta = MARKET_CONDITION_OPTIONS.find(
                                (item) => item.id === mcId
                              );
                              return (
                                <span
                                  key={mcId}
                                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#121721] text-[#94A3B8] border border-slate-800"
                                >
                                  {mcMeta ? mcMeta.label : mcId}
                                </span>
                              );
                            })}

                            {/* Custom Tags */}
                            {(trade.customTags || []).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          {trade.notes && (
                            <p className="text-xs text-[#94A3B8] mt-1.5 line-clamp-1 max-w-md">
                              {trade.notes}
                            </p>
                          )}
                        </td>

                        {/* Actions: Edit / Delete / View Chart */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {trade.chartUrl && (
                              <a
                                href={trade.chartUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl text-[#94A3B8] hover:text-[#10B981] hover:bg-slate-800/70 transition-colors"
                                title="Open Chart URL"
                              >
                                <ExternalLink size={15} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditTrade(trade)}
                              className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/70 transition-colors cursor-pointer"
                              title="Edit trade"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTrade(trade.id)}
                              className="p-2 rounded-xl text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                              title="Delete trade"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
