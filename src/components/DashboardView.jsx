import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';

export default function DashboardView({ onOpenLogModal, onEditTrade }) {
  const {
    filteredTrades,
    analytics,
    deleteTrade,
    setLastSubmittedTrade,
    dailyLossCap,
    setDailyLossCap,
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
    <div className="space-y-6">
      {/* 5 Crisp Dark Mode Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Win Rate (%) */}
        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Win Rate</span>
            <Award size={15} className="text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono text-white">
              {analytics.winRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{analytics.wins}W / {analytics.losses}L</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {analytics.totalTrades} Trades
            </span>
          </div>
        </div>

        {/* Card 2: Total Net P&L */}
        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Net P&L</span>
            <TrendingUp
              size={15}
              style={{ color: analytics.totalNetPnl >= 0 ? '#4ade80' : '#f87171' }}
            />
          </div>
          <div className="my-2">
            <span
              className="text-2xl font-extrabold font-mono"
              style={{ color: analytics.totalNetPnl >= 0 ? '#4ade80' : '#f87171' }}
            >
              {formatUSD(analytics.totalNetPnl)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            14-Rule Avg: <strong className="text-white">{analytics.avgComplianceScore}%</strong>
          </div>
        </div>

        {/* Card 3: Profit Factor */}
        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Profit Factor</span>
            <Activity size={15} className="text-sky-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono text-white">
              {analytics.profitFactor}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Current Streak:{' '}
            <strong
              style={{
                color: analytics.streaks.currentStreak >= 0 ? '#4ade80' : '#f87171',
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

        {/* Card 4: Average R-Multiple */}
        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Avg R-Multiple</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor:
                  analytics.avgRMultiple >= 1.5 ? '#386641' : '#BC4749',
              }}
            />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono text-white">
              {analytics.avgRMultiple > 0
                ? `+${analytics.avgRMultiple}R`
                : `${analytics.avgRMultiple}R`}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Target Benchmark: <strong className="text-emerald-400">&gt;= +1.50R</strong>
          </div>
        </div>

        {/* Card 5: Daily Loss Limit Utilization ($600 Cap for Lucid Flex / Apex) */}
        <div className="bg-[#121417] text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">
              Daily Loss Cap (${dailyLossCap})
            </span>
            {dailyLossTracker.riskStatusPass ? (
              <ShieldCheck size={15} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={15} className="text-red-400" />
            )}
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-mono text-white">
              {dailyLossTracker.dailyLossUtilizationPct}% Used
            </span>
            <span className="text-xs font-mono text-slate-400">
              -${dailyLossTracker.latestDayLossUsed.toFixed(0)} / -${dailyLossCap}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
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

      {/* Zone Legend & Quick Cap Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-md shadow-xs"
              style={{ backgroundColor: '#386641' }}
            />
            <span className="font-semibold text-slate-800">
              Support Zone (#386641):
            </span>
            <span className="font-mono font-bold text-slate-900">
              {analytics.zoneStats.find((z) => z.id === 'Support (#386641)')?.winRate || 0}% WR
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-md shadow-xs"
              style={{ backgroundColor: '#BC4749' }}
            />
            <span className="font-semibold text-slate-800">
              Resistance Zone (#BC4749):
            </span>
            <span className="font-mono font-bold text-slate-900">
              {analytics.zoneStats.find((z) => z.id === 'Resistance (#BC4749)')?.winRate || 0}% WR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="font-semibold text-slate-600">
            Daily Loss Limit ($):
          </label>
          <input
            type="number"
            step="50"
            value={dailyLossCap}
            onChange={(e) => setDailyLossCap(Number(e.target.value) || 600)}
            className="w-24 bg-[#F4F4F6] border border-slate-300 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900"
          />
        </div>
      </div>

      {/* Clean Off-White / Neutral Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F9FB]">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Futures Executions (GC & MGC)
            </h2>
            <p className="text-xs text-slate-500">
              Click any trade row to inspect its 4-Point AI Copilot Audit Card in the right panel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search contract, leak, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#386641]"
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
              <Filter size={13} className="text-slate-400" />
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="text-xs text-slate-800 font-medium bg-transparent focus:outline-none"
              >
                <option value="All">All Liquidity Windows</option>
                <option value="1:00 AM–4:00 AM">1:00 AM–4:00 AM (London)</option>
                <option value="8:00 AM–11:00 AM">8:00 AM–11:00 AM (NY)</option>
                <option value="Outside Window">Outside Window</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenLogModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              <Plus size={15} />
              <span>Log Trade</span>
            </button>
          </div>
        </div>

        {/* Data-Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F4F4F6] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Session Window</th>
                <th className="py-3 px-4">Contract & Account</th>
                <th className="py-3 px-4">Direction & Zone</th>
                <th className="py-3 px-4 text-right">Net P&L ($)</th>
                <th className="py-3 px-4 text-right">R-Multiple</th>
                <th className="py-3 px-4 text-center">Compliance Grade</th>
                <th className="py-3 px-4">Leak Flags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {visibleTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No futures trades match your current filter. Click "Log Trade" to record an execution.
                  </td>
                </tr>
              ) : (
                visibleTrades.map((t) => {
                  const isWin = Number(t.netPnl) >= 0;
                  const isSupport = t.zoneInteraction?.includes('#386641');
                  const isResistance = t.zoneInteraction?.includes('#BC4749');

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setLastSubmittedTrade(t)}
                      className="hover:bg-[#F4F4F6]/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{t.date}</div>
                        <div className="font-mono text-[11px] text-slate-500">{t.time} NY</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-semibold ${
                            t.sessionWindow === 'Outside Window'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {t.sessionWindow}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-extrabold text-slate-900">{t.contract}</div>
                        <div className="text-[11px] text-slate-500">{t.accountType}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-white"
                            style={{
                              backgroundColor: t.direction === 'Long' ? '#386641' : '#BC4749',
                            }}
                          >
                            {t.direction}
                          </span>
                          {(isSupport || isResistance) && (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-white"
                              style={{
                                backgroundColor: isSupport ? '#386641' : '#BC4749',
                              }}
                            >
                              {isSupport ? '#386641 Sup' : '#BC4749 Res'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          style={{
                            color: isWin ? '#386641' : '#BC4749',
                          }}
                        >
                          {formatUSD(t.netPnl)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {Number(t.rMultiple) > 0 ? `+${t.rMultiple}R` : `${t.rMultiple}R`}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-mono text-xs font-extrabold text-white"
                          style={{
                            backgroundColor:
                              t.complianceGrade === 'A'
                                ? '#386641'
                                : t.complianceGrade === 'B'
                                ? '#ca8a04'
                                : '#BC4749',
                          }}
                        >
                          {t.complianceGrade} ({t.complianceScore}%)
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(t.leakTags || []).length === 0 ? (
                            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                              Clean
                            </span>
                          ) : (
                            t.leakTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-white"
                                style={{ backgroundColor: '#BC4749' }}
                              >
                                {tag}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          {t.tradingViewUrl && (
                            <a
                              href={t.tradingViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                              title="Open TradingView Chart"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTrade(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                            title="Edit trade"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrade(t.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete trade"
                          >
                            <Trash2 size={14} />
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
