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
    <div className="space-y-6">
      {/* Scope Switcher: Selected Trade vs Full Session Batch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>4-Point Automated Strategy & Risk Audit</span>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
              style={{
                backgroundColor: 'rgba(56, 102, 65, 0.1)',
                color: '#386641',
              }}
            >
              {auditTarget
                ? `Inspecting: ${auditTarget.contract} on ${auditTarget.date} (${formatUSD(auditTarget.netPnl)})`
                : `All Session Trades (${analytics.totalTrades} Logged)`}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct, objective evaluation of 14-rule adherence, $600 daily loss guardrail, and behavioral leaks.
          </p>
        </div>

        {auditTarget && (
          <button
            type="button"
            onClick={() => setLastSubmittedTrade(null)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Switch to Full Session Audit
          </button>
        )}
      </div>

      {/* 4 Clean High-Contrast Audit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Compliance Score */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>1. Compliance Score</span>
              <CheckCircle2 size={16} style={{ color: '#386641' }} />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {activeComplianceScore}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeRulesFollowedCount} of 14 strategy rules followed
            </p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${activeComplianceScore}%`,
                backgroundColor: activeComplianceScore >= 75 ? '#386641' : '#BC4749',
              }}
            />
          </div>
        </div>

        {/* 2. Risk Status ($600 Daily Loss Cap) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>2. Risk Status (${dailyCap} Cap)</span>
              {isRiskPassed ? (
                <ShieldCheck size={16} style={{ color: '#386641' }} />
              ) : (
                <ShieldAlert size={16} style={{ color: '#BC4749' }} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-lg text-sm font-mono font-extrabold"
                style={{
                  backgroundColor: isRiskPassed
                    ? 'rgba(56, 102, 65, 0.12)'
                    : 'rgba(188, 71, 73, 0.12)',
                  color: isRiskPassed ? '#386641' : '#BC4749',
                }}
              >
                {isRiskPassed ? 'PASS' : 'FAIL'}
              </span>
              <span className="text-xs font-mono text-slate-600">
                -${dailyLossUsed.toFixed(0)} / -${dailyCap}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {analytics.dailyLossTracker.breachedDaysCount === 0
              ? 'Daily loss cap respected across all sessions'
              : `${analytics.dailyLossTracker.breachedDaysCount} session(s) breached cap`}
          </p>
        </div>

        {/* 3. Behavioral Red Flags */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>3. Behavioral Red Flags</span>
              <AlertTriangle size={16} style={{ color: '#BC4749' }} />
            </div>
            {analytics.sortedLeaks.length === 0 ? (
              <div
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(56, 102, 65, 0.1)',
                  color: '#386641',
                }}
              >
                ✓ Zero Behavioral Leaks
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {analytics.sortedLeaks.map((item) => (
                  <span
                    key={item.tag}
                    className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold border"
                    style={{
                      backgroundColor: 'rgba(188, 71, 73, 0.08)',
                      borderColor: 'rgba(188, 71, 73, 0.25)',
                      color: '#BC4749',
                    }}
                  >
                    {item.tag} ({item.count}x)
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {analytics.topLeak
              ? `Primary leak impact: ${formatUSD(analytics.topLeak.netImpact)}`
              : 'No emotional or stop-moving leaks detected'}
          </p>
        </div>

        {/* 4. Actionable Adjustment */}
        <div
          className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between"
          style={{ borderLeft: '4px solid #386641' }}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <span>4. Actionable Adjustment</span>
              <Crosshair size={16} style={{ color: '#386641' }} />
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {analytics.actionableAdjustment}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Copilot Q&A Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#386641' }}
            >
              <Bot size={15} />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Ask Viper Copilot
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'Audit 14-Rule Compliance',
              'Compare 1–4 AM vs 8–11 AM Windows',
              'Inspect #386641 & #BC4749 Zones',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAsk(chip)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-medium transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {chatHistory.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1">
            {chatHistory.map((item, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl text-xs whitespace-pre-line leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-slate-100 text-slate-900 font-semibold ml-8'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 mr-4 font-mono'
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
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Viper Copilot to analyze a session, rule, or zone..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#386641]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-opacity hover:opacity-95"
            style={{ backgroundColor: '#386641' }}
          >
            <Send size={13} />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Clean Collapsible Bottom Drawer for on-demand AI Session Review
 */
export default function ViperCopilotBottomDrawer({ isOpen, onToggle }) {
  const { analytics } = useViper();

  return (
    <>
      {/* Subtle Bottom Pill Toggle when closed */}
      {!isOpen && (
        <div className="fixed bottom-5 right-6 z-40">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-lg hover:shadow-xl text-xs font-bold transition-all"
          >
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#386641' }}
            >
              <Bot size={14} />
            </span>
            <span>AI Session Review</span>
            <span
              className="px-2 py-0.5 rounded-md font-mono text-[11px]"
              style={{
                backgroundColor: 'rgba(56, 102, 65, 0.1)',
                color: '#386641',
              }}
            >
              {analytics.avgComplianceScore}%
            </span>
            <ChevronUp size={14} className="text-slate-400" />
          </button>
        </div>
      )}

      {/* Clean Slide-Up Bottom Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/30 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-h-[82vh] bg-[#F4F4F6] border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-y-auto">
            <div className="w-full px-6 lg:px-8 py-5">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: '#386641' }}
                  >
                    <Bot size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Viper AI Session Review Drawer
                    </h2>
                    <p className="text-xs text-slate-500">
                      On-demand 14-Rule Compliance & Behavioral Leak Audit
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70"
                >
                  <X size={18} />
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
