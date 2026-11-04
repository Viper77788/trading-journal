import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  Calendar as CalendarIcon,
  ShieldCheck,
  Sparkles,
  Award,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import {
  LIQUIDITY_WINDOWS,
  FEELING_OPTIONS,
  SELF_GRADING_QUESTIONS,
} from '../constants/viperConstants';

export default function WorkspaceTabView({
  activeTab,
  trades,
  onOpenLogModal,
  onSwitchToTradeLog,
}) {
  const {
    rules,
    strategies,
    addStrategy,
    deleteStrategy,
    addRule,
    deleteRule,
  } = useViper();

  const [newStratName, setNewStratName] = useState('');
  const [newStratWindow, setNewStratWindow] = useState(
    '2:00–5:00 AM EST (London)'
  );
  const [newStratDesc, setNewStratDesc] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  // Aggregated metrics for filtered trades
  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => Number(t.netPnl) > 0);
    const losses = trades.filter((t) => Number(t.netPnl) < 0);
    const netResult = trades.reduce((s, t) => s + (Number(t.netPnl) || 0), 0);
    const grossWin = wins.reduce((s, t) => s + (Number(t.netPnl) || 0), 0);
    const grossLoss = Math.abs(
      losses.reduce((s, t) => s + (Number(t.netPnl) || 0), 0)
    );
    const profitFactor =
      grossLoss > 0
        ? (grossWin / grossLoss).toFixed(2)
        : grossWin > 0
        ? '∞'
        : '0.00';
    const winRate =
      total > 0 ? ((wins.length / total) * 100).toFixed(1) : '0.0';
    const revengeTrades = trades.filter((t) => t.isRevengeTrade);
    const avgStars =
      total > 0
        ? (
            trades.reduce((s, t) => s + (Number(t.executionGrade) || 0), 0) /
            total
          ).toFixed(1)
        : '0.0';

    // Window breakdown
    const byWindow = [
      {
        id: LIQUIDITY_WINDOWS.ASIAN_LONDON,
        label: '2:00–5:00 AM EST (London Window)',
        ct: '1:00–4:00 AM CT',
      },
      {
        id: LIQUIDITY_WINDOWS.NY_OPEN,
        label: '9:00 AM–12:00 PM EST (NY Window)',
        ct: '8:00–11:00 AM CT',
      },
      {
        id: LIQUIDITY_WINDOWS.OUTSIDE,
        label: 'Outside Window',
        ct: 'Off-Session Hours',
      },
    ].map((w) => {
      const list = trades.filter((t) => t.sessionWindow === w.id);
      const wWins = list.filter((t) => Number(t.netPnl) > 0).length;
      const wNet = list.reduce((s, t) => s + (Number(t.netPnl) || 0), 0);
      return {
        ...w,
        count: list.length,
        winRate:
          list.length > 0 ? Math.round((wWins / list.length) * 100) : 0,
        netPnl: wNet,
      };
    });

    // Daily group for Calendar
    const byDate = {};
    trades.forEach((t) => {
      const d = t.date || '2026-11-04';
      if (!byDate[d]) {
        byDate[d] = { date: d, count: 0, netPnl: 0, revengeCount: 0 };
      }
      byDate[d].count += 1;
      byDate[d].netPnl += Number(t.netPnl) || 0;
      if (t.isRevengeTrade) byDate[d].revengeCount += 1;
    });

    return {
      total,
      winsCount: wins.length,
      lossesCount: losses.length,
      netResult,
      profitFactor,
      winRate,
      revengeCount: revengeTrades.length,
      revengeNetPnl: revengeTrades.reduce(
        (s, t) => s + (Number(t.netPnl) || 0),
        0
      ),
      cleanNetPnl: trades
        .filter((t) => !t.isRevengeTrade)
        .reduce((s, t) => s + (Number(t.netPnl) || 0), 0),
      avgStars,
      byWindow,
      dailyList: Object.values(byDate).sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
    };
  }, [trades]);

  /* 1. OVERVIEW TAB */
  if (activeTab === 'overview') {
    return (
      <div className="space-y-5">
        <div className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
            WORKSPACE OVERVIEW
          </span>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
            Performance &amp; Liquidity Window Summary
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            High-level view of your execution consistency across EST liquidity windows.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Net P&amp;L
              </span>
              <div
                className={`text-2xl font-bold font-mono mt-1.5 ${
                  stats.netResult >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {formatUSD(stats.netResult)}
              </div>
              <span className="text-xs text-[#94A3B8] mt-1 block">
                {stats.total} total trades
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Win Rate
              </span>
              <div className="text-2xl font-bold font-mono text-[#F8FAFC] mt-1.5">
                {stats.winRate}%
              </div>
              <span className="text-xs text-[#94A3B8] mt-1 block">
                {stats.winsCount}W / {stats.lossesCount}L • PF {stats.profitFactor}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Revenge Guard (&lt;15m)
              </span>
              <div
                className={`text-2xl font-bold font-mono mt-1.5 ${
                  stats.revengeCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
                }`}
              >
                {stats.revengeCount === 0
                  ? '0 Flagged'
                  : `${stats.revengeCount} Flagged`}
              </div>
              <span className="text-xs text-[#94A3B8] mt-1 block">
                Impact: {formatUSD(stats.revengeNetPnl)}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Avg Execution Grade
              </span>
              <div className="text-2xl font-bold font-mono text-[#10B981] mt-1.5 flex items-center gap-1.5">
                <span>{stats.avgStars}</span>
                <Star size={18} className="fill-[#10B981] text-[#10B981]" />
              </div>
              <span className="text-xs text-[#94A3B8] mt-1 block">
                Out of 5.0★ self-rating
              </span>
            </div>
          </div>

          {/* Liquidity Window Performance Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.byWindow.map((w) => (
              <div
                key={w.id}
                className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F8FAFC]">
                      {w.label}
                    </span>
                    <span className="text-xs font-mono text-[#94A3B8]">
                      {w.count} trades
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{w.ct}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-baseline justify-between">
                  <span
                    className={`text-lg font-bold font-mono ${
                      w.netPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {formatUSD(w.netPnl)}
                  </span>
                  <span className="text-xs font-mono text-[#94A3B8]">
                    Win Rate: <strong className="text-[#F8FAFC]">{w.winRate}%</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* 2. CALENDAR TAB */
  if (activeTab === 'calendar') {
    return (
      <div className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
              SESSION CALENDAR
            </span>
            <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
              Daily Execution Breakdown
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Review daily P&amp;L, trade count, and 15-minute cooldown adherence by session date.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0A0D12] bg-[#10B981] hover:bg-emerald-400 cursor-pointer"
          >
            <Plus size={16} />
            <span>Log trade</span>
          </button>
        </div>

        {stats.dailyList.length === 0 ? (
          <div className="py-12 text-center text-[#94A3B8] text-sm">
            No trading sessions recorded yet.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.dailyList.map((day) => (
              <div
                key={day.date}
                onClick={onSwitchToTradeLog}
                className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-mono font-bold text-[#F8FAFC]">
                    <CalendarIcon size={15} className="text-[#10B981]" />
                    <span>{day.date}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#121721] text-[#94A3B8] border border-slate-800">
                    {day.count} {day.count === 1 ? 'trade' : 'trades'}
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold font-mono mt-4 ${
                    day.netPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {formatUSD(day.netPnl)}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
                  {day.revengeCount > 0 ? (
                    <span className="text-[#EF4444] font-semibold">
                      🚨 {day.revengeCount} Revenge (&lt;15m gap)
                    </span>
                  ) : (
                    <span className="text-[#10B981] font-medium">
                      ✓ 15m Cooldown Respected
                    </span>
                  )}
                  <span className="text-[#94A3B8] hover:text-[#F8FAFC]">
                    View trades →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* 3. STRATEGIES TAB */
  if (activeTab === 'strategies') {
    const handleCreateStrategy = (e) => {
      e.preventDefault();
      if (!newStratName.trim()) return;
      addStrategy({
        name: newStratName.trim(),
        window: newStratWindow,
        description:
          newStratDesc.trim() ||
          'Core execution setup aligned with liquidity windows.',
        targetR: '2.0R',
      });
      setNewStratName('');
      setNewStratDesc('');
    };

    return (
      <div className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8 space-y-6">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
            PLAYBOOK &amp; SETUPS
          </span>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
            Trading Strategies
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Define your repeatable setups for the 2–5 AM EST London and 9–12 PM EST New York windows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strat) => (
            <div
              key={strat.id}
              className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    {strat.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => deleteStrategy(strat.id)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 mt-2">
                  <Clock size={11} />
                  <span>{strat.window}</span>
                </span>
                <p className="text-sm text-[#94A3B8] mt-3 leading-relaxed">
                  {strat.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Target Profile</span>
                <strong className="font-mono text-[#F8FAFC]">
                  {strat.targetR || '2.0R'}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {/* Add Strategy Form */}
        <form
          onSubmit={handleCreateStrategy}
          className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80 space-y-4"
        >
          <h4 className="text-sm font-bold text-[#F8FAFC]">
            + Add New Playbook Strategy
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Strategy name (e.g. NY Open Liquidity Sweep)"
              value={newStratName}
              onChange={(e) => setNewStratName(e.target.value)}
              className="bg-[#121721] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none"
            />
            <select
              value={newStratWindow}
              onChange={(e) => setNewStratWindow(e.target.value)}
              className="bg-[#121721] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] outline-none"
            >
              <option value="2:00–5:00 AM EST (London)">
                2:00–5:00 AM EST (London)
              </option>
              <option value="9:00 AM–12:00 PM EST (NY)">
                9:00 AM–12:00 PM EST (NY)
              </option>
              <option value="All Sessions">All Sessions</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Entry confirmation & risk rules..."
              value={newStratDesc}
              onChange={(e) => setNewStratDesc(e.target.value)}
              className="flex-1 bg-[#121721] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-[#0A0D12] font-bold text-sm cursor-pointer shrink-0"
            >
              Save Strategy
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* 4. INSIGHTS TAB */
  if (activeTab === 'insights') {
    return (
      <div className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8 space-y-6">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
            BEHAVIORAL INSIGHTS
          </span>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
            Psychology, Emotions &amp; 15-Minute Revenge Audit
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Compare how your emotional state and trade spacing directly impact your bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-bold text-[#10B981]">
              <CheckCircle2 size={16} />
              <span>Clean Trades (&ge; 15m Cooldown Respected)</span>
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-3 ${
                stats.cleanNetPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {formatUSD(stats.cleanNetPnl)}
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              {stats.total - stats.revengeCount} disciplined executions
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-bold text-[#EF4444]">
              <AlertTriangle size={16} />
              <span>Revenge Trades (&lt; 15m Gap Flagged)</span>
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-3 ${
                stats.revengeNetPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {formatUSD(stats.revengeNetPnl)}
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              {stats.revengeCount} rapid re-entries within 15 minutes of prior close
            </p>
          </div>
        </div>

        {/* Emotion Performance Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">
            Performance by Emotional Tag
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEELING_OPTIONS.map((feel) => {
              const matching = trades.filter((t) =>
                (t.feelings || []).includes(feel.id)
              );
              const sum = matching.reduce(
                (s, t) => s + (Number(t.netPnl) || 0),
                0
              );
              return (
                <div
                  key={feel.id}
                  className="p-3.5 rounded-xl bg-[#121721] border border-slate-800/80"
                >
                  <div className="text-sm font-medium text-[#F8FAFC]">
                    {feel.label}
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span
                      className={`font-mono text-sm font-bold ${
                        matching.length === 0
                          ? 'text-[#94A3B8]'
                          : sum >= 0
                          ? 'text-[#10B981]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {matching.length > 0 ? formatUSD(sum) : '—'}
                    </span>
                    <span className="text-xs font-mono text-[#94A3B8]">
                      {matching.length}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* 5. RULES TAB */
  if (activeTab === 'rules') {
    const handleCreateRule = (e) => {
      e.preventDefault();
      if (!newRuleText.trim()) return;
      addRule(newRuleText.trim());
      setNewRuleText('');
    };

    return (
      <div className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8 space-y-6">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
            TRADING CONSTITUTION
          </span>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
            Core Execution &amp; Risk Rules
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Non-negotiable guardrails for liquidity window timing, risk management, and emotional discipline.
          </p>
        </div>

        <div className="space-y-2.5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0A0D12] border border-slate-800/80"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {rule.number}
                </span>
                <span className="text-[15px] font-medium text-[#F8FAFC]">
                  {rule.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteRule(rule.id)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] cursor-pointer shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateRule} className="flex gap-3">
          <input
            type="text"
            placeholder="Add a new personal trading rule..."
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            className="flex-1 bg-[#0A0D12] border border-slate-800 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-[#0A0D12] font-bold text-sm cursor-pointer"
          >
            + Add Rule
          </button>
        </form>
      </div>
    );
  }

  /* 6. REPORT TAB */
  return (
    <div className="bg-[#121721] rounded-2xl border border-slate-800/70 p-6 sm:p-8 space-y-6">
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
          POST-TRADE SELF-GRADING REPORT
        </span>
        <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
          Execution Quality &amp; Self-Evaluation Scorecard
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Aggregated scores across your 5 post-trade self-grading dimensions and pre-trade checklist.
        </p>
      </div>

      <div className="space-y-3">
        {SELF_GRADING_QUESTIONS.map((q) => {
          const ratedTrades = trades.filter(
            (t) => t.selfGrading && Number(t.selfGrading[q.id]) > 0
          );
          const avgScore =
            ratedTrades.length > 0
              ? (
                  ratedTrades.reduce(
                    (s, t) => s + Number(t.selfGrading[q.id]),
                    0
                  ) / ratedTrades.length
                ).toFixed(1)
              : '0.0';
          const pct = Math.min(100, Math.round((Number(avgScore) / 5) * 100));

          return (
            <div
              key={q.id}
              className="p-4 rounded-2xl bg-[#0A0D12] border border-slate-800/80"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-medium text-[#F8FAFC]">
                  {q.question}
                </span>
                <span className="font-mono text-sm font-bold text-[#10B981]">
                  {avgScore} / 5.0
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#121721] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10B981] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
