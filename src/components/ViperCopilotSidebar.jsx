import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  Send,
  Sparkles,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';

export default function ViperCopilotSidebar() {
  const { analytics, lastSubmittedTrade, rules } = useViper();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);

  const auditTarget = lastSubmittedTrade;

  // Compute automated 4-point audit either for the just-submitted trade or the active session batch
  const activeComplianceScore = auditTarget
    ? auditTarget.complianceScore
    : analytics.avgComplianceScore;

  const activeRulesFollowedCount = auditTarget
    ? (auditTarget.rulesChecked || []).length
    : Math.round((analytics.avgComplianceScore / 100) * rules.length);

  const isRiskPassed = analytics.dailyLossTracker.riskStatusPass;
  const dailyLossUsed = analytics.dailyLossTracker.latestDayLossUsed;
  const dailyCap = analytics.dailyLossTracker.dailyLossCap;

  const generateDeterministicReply = (qText) => {
    const q = qText.toLowerCase();

    if (q.includes('14') || q.includes('rule') || q.includes('compliance') || q.includes('scorecard')) {
      const lowest = analytics.weakestRule;
      return `1. **Compliance Score:** ${analytics.avgComplianceScore}% average across ${analytics.totalTrades} logged trades.${
        lowest ? ` Lowest adherence is Rule #${lowest.number} (${lowest.label}) at ${lowest.pct}%.` : ''
      }
2. **Risk Status:** ${isRiskPassed ? 'PASS' : 'FAIL'} — $${dailyLossUsed.toFixed(2)} of $${dailyCap} Daily Loss Limit used on latest session.
3. **Behavioral Red Flags:** ${
        analytics.sortedLeaks.length > 0
          ? analytics.sortedLeaks.map((l) => `${l.tag} (${l.count}x, ${formatUSD(l.netImpact)})`).join(', ')
          : 'Zero recurring behavioral leaks.'
      }
4. **Actionable Adjustment:** ${analytics.actionableAdjustment}`;
    }

    if (q.includes('window') || q.includes('session') || q.includes('1:00') || q.includes('8:00')) {
      const sLines = analytics.sessionStats
        .map((s) => `• ${s.id}: ${s.trades} trades | ${s.winRate}% WR | ${s.avgR}R avg | ${formatUSD(s.netPnl)}`)
        .join('\n');
      return `**Session Liquidity Window Audit:**\n${sLines}\n\n**Actionable Adjustment:** ${analytics.actionableAdjustment}`;
    }

    if (q.includes('zone') || q.includes('386641') || q.includes('bc4749')) {
      const zLines = analytics.zoneStats
        .filter((z) => z.trades > 0)
        .map((z) => `• ${z.id}: ${z.trades} trades | ${z.winRate}% WR | ${formatUSD(z.netPnl)}`)
        .join('\n');
      return `**#386641 Support & #BC4749 Resistance Zone Audit:**\n${zLines || 'No zone trades logged yet.'}\n\n**Actionable Adjustment:** Only execute when price tests #386641 Support or #BC4749 Resistance with a structural candle close.`;
    }

    return `1. **Compliance Score:** ${analytics.avgComplianceScore}% (Win Rate: ${analytics.winRate}% • PF: ${analytics.profitFactor} • Avg R: ${analytics.avgRMultiple}R)
2. **Risk Status:** ${isRiskPassed ? 'PASS' : 'FAIL'} ($${dailyLossUsed.toFixed(2)} / $${dailyCap} Daily Cap)
3. **Behavioral Red Flags:** ${
      analytics.topLeak ? `${analytics.topLeak.tag} (${analytics.topLeak.count} occurrences)` : 'None detected'
    }
4. **Actionable Adjustment:** ${analytics.actionableAdjustment}`;
  };

  const handleAsk = (textOverride) => {
    const text = (textOverride ?? query).trim();
    if (!text) return;
    if (!textOverride) setQuery('');

    const reply = generateDeterministicReply(text);
    setChatHistory((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: reply },
    ]);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <aside className="w-full xl:w-[390px] shrink-0 bg-[#121417] text-slate-100 rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-[#181B20] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow"
            style={{ backgroundColor: '#386641' }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">VIPER AI COPILOT</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">14-Rule Audit & Behavioral Leak Engine</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
          {auditTarget ? `Trade #${auditTarget.contract}` : 'Session Batch'}
        </span>
      </div>

      {/* Automated 4-Point Audit Card */}
      <div className="p-4 space-y-3 border-b border-slate-800 bg-[#15181C]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={12} className="text-emerald-400" />
            {auditTarget ? 'Instant Post-Trade Audit Card' : 'Automated Session Audit Card'}
          </span>
          {auditTarget && (
            <span className="text-[10px] font-mono text-emerald-400">
              Just Logged: {auditTarget.contract} ({formatUSD(auditTarget.netPnl)})
            </span>
          )}
        </div>

        {/* 1. Compliance Score */}
        <div className="p-3 rounded-xl bg-[#181B20] border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              1. Compliance Score
            </span>
            <span className="font-mono font-bold text-white">
              {activeComplianceScore}% ({activeRulesFollowedCount}/14 Rules)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${activeComplianceScore}%`,
                backgroundColor: activeComplianceScore >= 75 ? '#386641' : '#BC4749',
              }}
            />
          </div>
        </div>

        {/* 2. Risk Status ($600 Daily Loss Limit) */}
        <div className="p-3 rounded-xl bg-[#181B20] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              {isRiskPassed ? (
                <ShieldCheck size={14} className="text-emerald-400" />
              ) : (
                <ShieldAlert size={14} className="text-red-400" />
              )}
              2. Risk Status (${dailyCap} Cap)
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Used: -${dailyLossUsed.toFixed(2)} / -${dailyCap}.00 ({analytics.dailyLossTracker.dailyLossUtilizationPct}%)
            </p>
          </div>
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold text-white"
            style={{ backgroundColor: isRiskPassed ? '#386641' : '#BC4749' }}
          >
            {isRiskPassed ? 'PASS' : 'FAIL'}
          </span>
        </div>

        {/* 3. Behavioral Red Flags */}
        <div className="p-3 rounded-xl bg-[#181B20] border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            3. Behavioral Red Flags
          </div>
          {analytics.sortedLeaks.length === 0 ? (
            <p className="text-[11px] text-emerald-400 font-medium">
              Zero execution or psychological leaks flagged across active entries.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {analytics.sortedLeaks.map((item) => (
                <span
                  key={item.tag}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-white flex items-center gap-1"
                  style={{ backgroundColor: '#BC4749' }}
                >
                  <span>{item.tag}</span>
                  <span className="opacity-80">({item.count}x)</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4. Actionable Adjustment */}
        <div className="p-3 rounded-xl bg-[#181B20] border border-l-4 border-slate-800" style={{ borderLeftColor: '#386641' }}>
          <div className="text-xs font-semibold text-white flex items-center gap-1.5 mb-1">
            <Crosshair size={14} className="text-emerald-400" />
            4. Actionable Adjustment
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {analytics.actionableAdjustment}
          </p>
        </div>
      </div>

      {/* Interactive Copilot Prompt & History */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 min-h-[220px] max-h-[320px]">
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {[
              'Audit 14 Rules',
              '1-4 AM vs 8-11 AM Windows',
              '#386641 & #BC4749 Zones',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAsk(chip)}
                className="px-2.5 py-1 rounded-lg bg-[#181B20] hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-800 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {chatHistory.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#181B20]/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              Ask Viper Copilot to drill into your 14-rule compliance, #386641 support / #BC4749 resistance win rates, or session R-multiples.
            </div>
          ) : (
            chatHistory.map((item, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl text-[11px] whitespace-pre-line leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-slate-800 text-white font-semibold ml-6'
                    : 'bg-[#181B20] border border-slate-800 text-slate-300 mr-2'
                }`}
              >
                {item.text}
              </div>
            ))
          )}
          <div ref={chatBottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 pt-2 border-t border-slate-800"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Query Viper Analytics Engine..."
            className="flex-1 bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#386641]"
          />
          <button
            type="submit"
            className="p-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#386641' }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </aside>
  );
}
