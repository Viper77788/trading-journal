import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  Send,
  X,
  ChevronUp,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';

export function ViperCopilotAuditContent() {
  const { analytics, lastSubmittedTrade, setLastSubmittedTrade, rules } = useViper();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);

  const auditTarget = lastSubmittedTrade;

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

    if (q.includes('14') || q.includes('rule') || q.includes('compliance')) {
      const lowest = analytics.weakestRule;
      return `1. Compliance Score: ${analytics.avgComplianceScore}% average across ${analytics.totalTrades} trades.${
        lowest ? ` Lowest checkpoint: Rule #${lowest.number} (${lowest.label}) at ${lowest.pct}%.` : ''
      }
2. Risk Status: ${isRiskPassed ? 'PASS' : 'FAIL'} — -$${dailyLossUsed.toFixed(2)} of -$${dailyCap} Daily Cap used.
3. Behavioral Red Flags: ${
        analytics.sortedLeaks.length > 0
          ? analytics.sortedLeaks.map((l) => `${l.tag} (${l.count}x)`).join(', ')
          : 'Zero recurring leaks.'
      }
4. Actionable Adjustment: ${analytics.actionableAdjustment}`;
    }

    if (q.includes('window') || q.includes('session')) {
      const sLines = analytics.sessionStats
        .map((s) => `• ${s.id}: ${s.trades} trades | ${s.winRate}% WR | ${s.avgR}R avg | ${formatUSD(s.netPnl)}`)
        .join('\n');
      return `Session Liquidity Window Breakdown:\n${sLines}\n\nActionable Adjustment: ${analytics.actionableAdjustment}`;
    }

    if (q.includes('zone') || q.includes('386641') || q.includes('bc4749')) {
      const zLines = analytics.zoneStats
        .filter((z) => z.trades > 0)
        .map((z) => `• ${z.id}: ${z.trades} trades | ${z.winRate}% WR | ${formatUSD(z.netPnl)}`)
        .join('\n');
      return `#386641 Support & #BC4749 Resistance Zone Performance:\n${zLines || 'No zone trades logged yet.'}`;
    }

    return `1. Compliance Score: ${analytics.avgComplianceScore}% (WR: ${analytics.winRate}% • PF: ${analytics.profitFactor} • Avg R: ${analytics.avgRMultiple}R)
2. Risk Status: ${isRiskPassed ? 'PASS' : 'FAIL'} (-$${dailyLossUsed.toFixed(2)} / -$${dailyCap} Cap)
3. Behavioral Red Flags: ${
      analytics.topLeak ? `${analytics.topLeak.tag} (${analytics.topLeak.count}x)` : 'Clean'
    }
4. Actionable Adjustment: ${analytics.actionableAdjustment}`;
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
    <div className="space-y-6 w-full">
      {/* Scope Switcher: Selected Trade vs Full Session Batch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold tracking-tight text-[#FFFFFF]">
              4-Point Automated Strategy & Risk Audit
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF]"
              style={{ backgroundColor: '#386641' }}
            >
              {auditTarget
                ? `Inspecting: ${auditTarget.contract} on ${auditTarget.date} (${formatUSD(auditTarget.netPnl)})`
                : `All Session Trades (${analytics.totalTrades} Logged)`}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
            Direct, objective evaluation of 14-rule adherence, $600 daily loss guardrail, and behavioral leaks.
          </p>
        </div>

        {auditTarget && (
          <button
            type="button"
            onClick={() => setLastSubmittedTrade(null)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#111620] hover:bg-slate-800/80 text-[#FFFFFF] border border-slate-800/60 cursor-pointer"
          >
            Switch to Full Session Audit
          </button>
        )}
      </div>

      {/* 4 Lucid #111620 Audit Cards (rounded-xl, p-6, border-slate-800/60) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Compliance Score */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#8A99AD] uppercase tracking-wider mb-3">
              <span>1. Compliance Score</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#FFFFFF] tracking-tight">
              {activeComplianceScore}%
            </div>
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${activeComplianceScore}%`,
                  backgroundColor:
                    activeComplianceScore >= 75 ? '#386641' : '#BC4749',
                }}
              />
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-800/60 text-xs font-medium text-[#8A99AD]">
            {activeRulesFollowedCount} of 14 strategy rules followed
          </div>
        </div>

        {/* 2. Risk Status ($600 Daily Loss Cap) */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#8A99AD] uppercase tracking-wider mb-3">
              <span>2. Risk Status (${dailyCap} Cap)</span>
              {isRiskPassed ? (
                <ShieldCheck size={16} className="text-emerald-400" />
              ) : (
                <ShieldAlert size={16} className="text-rose-400" />
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#FFFFFF]"
                style={{
                  backgroundColor: isRiskPassed ? '#386641' : '#BC4749',
                }}
              >
                {isRiskPassed ? 'PASS' : 'FAIL'}
              </span>
              <span className="text-xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                -${dailyLossUsed.toFixed(0)} / -${dailyCap}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    4,
                    analytics.dailyLossTracker.dailyLossUtilizationPct
                  )}%`,
                  backgroundColor: isRiskPassed ? '#386641' : '#BC4749',
                }}
              />
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-800/60 text-xs font-medium text-[#8A99AD]">
            {analytics.dailyLossTracker.breachedDaysCount === 0
              ? 'Daily loss cap respected across all sessions'
              : `${analytics.dailyLossTracker.breachedDaysCount} session(s) breached cap`}
          </div>
        </div>

        {/* 3. Behavioral Red Flags */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#8A99AD] uppercase tracking-wider mb-3">
              <span>3. Behavioral Red Flags</span>
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            {analytics.sortedLeaks.length === 0 ? (
              <div
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold text-[#FFFFFF]"
                style={{ backgroundColor: '#386641' }}
              >
                ✓ Zero Behavioral Leaks
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {analytics.sortedLeaks.map((item) => (
                  <span
                    key={item.tag}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold text-[#FFFFFF]"
                    style={{ backgroundColor: '#BC4749' }}
                  >
                    {item.tag} ({item.count}x)
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-800/60 text-xs font-medium text-[#8A99AD]">
            {analytics.topLeak
              ? `Primary leak impact: ${formatUSD(analytics.topLeak.netImpact)}`
              : 'No emotional or stop-moving leaks detected'}
          </div>
        </div>

        {/* 4. Actionable Adjustment */}
        <div
          className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between"
          style={{ borderLeft: '3px solid #386641' }}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#8A99AD] uppercase tracking-wider mb-2.5">
              <span>4. Actionable Adjustment</span>
              <Crosshair size={16} className="text-emerald-400" />
            </div>
            <p className="text-sm text-[#FFFFFF] font-medium leading-relaxed">
              {analytics.actionableAdjustment}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Copilot Q&A Bar */}
      <div className="bg-[#111620] rounded-xl border border-slate-800/60 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FFFFFF]"
              style={{ backgroundColor: '#386641' }}
            >
              <Bot size={16} />
            </div>
            <div>
              <span className="text-sm font-bold text-[#FFFFFF] block">
                Ask Viper Copilot
              </span>
              <span className="text-xs text-[#8A99AD]">
                Query rule compliance, session timing, or #386641 / #BC4749 zone performance
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Audit 14-Rule Compliance',
              'Compare 1–4 AM vs 8–11 AM Windows',
              'Inspect #386641 & #BC4749 Zones',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAsk(chip)}
                className="px-3 py-1.5 rounded-lg bg-[#090C10] hover:bg-slate-800/80 text-[#FFFFFF] border border-slate-800/60 text-xs font-medium transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {chatHistory.length > 0 && (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 pt-1">
            {chatHistory.map((item, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl text-sm whitespace-pre-line leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-slate-800/90 text-[#FFFFFF] font-semibold ml-8'
                    : 'bg-[#090C10] border border-slate-800/60 text-[#FFFFFF] mr-4 font-mono'
                }`}
              >
                {item.text}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Viper Copilot to analyze a session, rule, or zone..."
            className="flex-1 bg-[#090C10] border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-[#FFFFFF] placeholder-[#8A99AD] focus:outline-none focus:border-[#386641]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#FFFFFF] flex items-center gap-2 transition-opacity hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: '#386641' }}
          >
            <Send size={15} />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ViperCopilotBottomDrawer({ isOpen, onToggle }) {
  const { analytics } = useViper();

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-5 right-6 z-40">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#111620] text-[#FFFFFF] border border-slate-800/60 shadow-xl hover:bg-slate-800/80 text-sm font-semibold transition-all cursor-pointer"
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#FFFFFF]"
              style={{ backgroundColor: '#386641' }}
            >
              <Bot size={15} />
            </span>
            <span>AI Session Review</span>
            <span
              className="px-2 py-0.5 rounded-md font-mono text-xs text-[#FFFFFF]"
              style={{ backgroundColor: '#386641' }}
            >
              {analytics.avgComplianceScore}%
            </span>
            <ChevronUp size={15} className="text-[#8A99AD]" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-h-[84vh] bg-[#090C10] border-t border-slate-800/60 rounded-t-2xl shadow-2xl overflow-y-auto">
            <div className="w-full px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#FFFFFF]"
                    style={{ backgroundColor: '#386641' }}
                  >
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-[#FFFFFF]">
                      Viper AI Session Review Drawer
                    </h2>
                    <p className="text-xs font-medium text-[#8A99AD]">
                      On-demand 14-Rule Compliance & Behavioral Leak Audit
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="p-2 rounded-xl text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <ViperCopilotAuditContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
