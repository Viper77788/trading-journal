import React, { useState } from 'react';
import {
  Activity,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import { LIQUIDITY_WINDOWS } from '../constants/viperConstants';
import {
  formatTime12hEST,
  normalizeLiquidityWindow,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';

export function LiquidityWindowBadge({ sessionWindow }) {
  if (sessionWindow === LIQUIDITY_WINDOWS.ASIAN_LONDON) {
    return (
      <div className="inline-flex flex-col items-start">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          <Clock size={12} className="text-sky-400 shrink-0" />
          <span>1–4 AM CT / 2–5 AM ET</span>
        </span>
        <span className="text-[11px] font-medium text-[#8A99AD] mt-0.5 pl-0.5">
          Asian / Early London
        </span>
      </div>
    );
  }

  if (sessionWindow === LIQUIDITY_WINDOWS.NY_OPEN) {
    return (
      <div className="inline-flex flex-col items-start">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Clock size={12} className="text-emerald-400 shrink-0" />
          <span>8–11 AM CT / 9–12 PM ET</span>
        </span>
        <span className="text-[11px] font-medium text-[#8A99AD] mt-0.5 pl-0.5">
          New York Opening Window
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-800/70 text-[#8A99AD] border border-slate-700/60">
        <Clock size={12} className="text-[#8A99AD] shrink-0" />
        <span>Outside Window</span>
      </span>
      <span className="text-[11px] font-medium text-[#8A99AD]/70 mt-0.5 pl-0.5">
        Off-Session Hours
      </span>
    </div>
  );
}

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
    clearAllTrades,
    setLastSubmittedTrade,
  } = useViper();

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [windowFilter, setWindowFilter] = useState('All');

  const visibleTrades = filteredTrades.filter((t) => {
    const resolvedWin = normalizeLiquidityWindow(t.sessionWindow, t.time);
    const matchesDirection =
      directionFilter === 'All' || t.direction === directionFilter;
    const matchesWindow =
      windowFilter === 'All' || resolvedWin === windowFilter;
    const matchesSearch =
      !searchQuery ||
      t.contract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resolvedWin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.leakTags || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDirection && matchesWindow && matchesSearch;
  });

  const pfBarPct = Math.min(100, Math.round((analytics.profitFactor / 3) * 100));
  const rBarPct = Math.min(
    100,
    Math.max(8, Math.round((Math.max(0, analytics.avgRMultiple) / 2.5) * 100))
  );

  return (
    <div className="flex-1 flex flex-col gap-6 w-full">
      {/* LUCID-STYLE SPACIOUS 4-CARD METRIC ROW (#111620, rounded-xl, p-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full">
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

        {/* 2. Total Net P&L & Rule Compliance Card */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8A99AD]">
                Total Net P&amp;L
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF] ${
                  analytics.totalNetPnl >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {analytics.totalNetPnl >= 0 ? 'NET PROFIT' : 'NET LOSS'}
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
                Realized P&amp;L
              </span>
            </div>

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
      </div>

      {/* LUCID-STYLE EXECUTIONS TABLE CONTAINER (#111620, rounded-xl, border-slate-800/60) */}
      <div className="flex-1 flex flex-col bg-[#111620] rounded-xl border border-slate-800/60 overflow-hidden w-full">
        {/* Table Control & Filter Header */}
        <div className="px-6 py-5 border-b border-slate-800/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight text-[#FFFFFF]">
                Executed Futures Trades
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#090C10] text-[#8A99AD] border border-slate-800/60">
                {visibleTrades.length} Executions
              </span>
              {filteredTrades.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllTrades}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Clear all Orders.csv trades"
                >
                  <Trash2 size={13} />
                  <span>Clear Orders CSV</span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
              Converted to <strong className="text-[#FFFFFF]">Chicago Central Time (CT)</strong> &amp; <strong className="text-emerald-400">Eastern Time (ET +1h)</strong> in 12-hour AM/PM format • Click any row to inspect in AI Audit
            </p>
          </div>

          {/* Liquidity Window Filter + Direction Filter + Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Liquidity Window Filter Pills */}
            <div className="flex flex-wrap items-center bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
              {[
                { id: 'All', label: 'All Windows' },
                {
                  id: LIQUIDITY_WINDOWS.ASIAN_LONDON,
                  label: '1–4 AM CT / 2–5 AM ET',
                },
                {
                  id: LIQUIDITY_WINDOWS.NY_OPEN,
                  label: '8–11 AM CT / 9–12 PM ET',
                },
                { id: LIQUIDITY_WINDOWS.OUTSIDE, label: 'Outside Window' },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWindowFilter(w.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    windowFilter === w.id
                      ? 'bg-[#111620] text-[#FFFFFF] border border-slate-700/70 shadow-xs'
                      : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Direction Filter Pills */}
            <div className="flex items-center bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
              {[
                { id: 'All', label: 'All' },
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
                placeholder="Search contract, window, leak..."
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
                <th className="py-3.5 px-4">Date &amp; Time (EST / CT)</th>
                <th className="py-3.5 px-4">Liquidity Window</th>
                <th className="py-3.5 px-4">Contract</th>
                <th className="py-3.5 px-4">Direction &amp; Lots</th>
                <th className="py-3.5 px-4">Entry → Exit Price</th>
                <th className="py-3.5 px-4 text-right">Net P&amp;L</th>
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
                    colSpan={10}
                    className="py-16 text-center text-[#8A99AD] text-sm font-medium"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span>
                        No executions loaded. Click &quot;Import NinjaTrader CSV&quot; or &quot;Fast Log Trade&quot; to begin.
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={onOpenImportModal}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#FFFFFF] bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                          Import NinjaTrader CSV
                        </button>
                        <button
                          type="button"
                          onClick={onOpenLogModal}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
                        >
                          Fast Log Trade
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleTrades.map((t) => {
                  const isWin = Number(t.netPnl) >= 0;
                  const entryEST =
                    t.timeEST || formatTime12hEST(t.time || '09:30', false, 'EST');
                  const exitEST =
                    t.exitTimeEST ||
                    (t.exitTime24
                      ? formatTime12hEST(t.exitTime24, false, 'EST')
                      : null);
                  const entryCT = t.timeCT || '';
                  const exitCT = t.exitTimeCT || '';
                  const resolvedWindow = normalizeLiquidityWindow(
                    t.sessionWindow,
                    t.time
                  );
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
                      {/* Date & Time in 12-Hour EST (AM/PM) + CT Reference */}
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
                        {entryCT && (
                          <div className="font-mono text-[11px] text-[#8A99AD] mt-0.5">
                            {entryCT}
                            {exitCT && exitCT !== entryCT
                              ? ` → ${exitCT.replace(' CT', '')} CT`
                              : ''}
                          </div>
                        )}
                      </td>

                      {/* Dedicated Liquidity Window Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <LiquidityWindowBadge sessionWindow={resolvedWindow} />
                      </td>

                      {/* Clean Contract Badge Column ONLY */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#090C10] border border-slate-800/80 font-mono font-bold text-[#FFFFFF] text-xs uppercase tracking-wider">
                          {t.contract}
                        </span>
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
