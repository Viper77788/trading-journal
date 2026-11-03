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
  Clock,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import {
  normalizeLiquidityWindow,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';
import { LiquidityWindowBadge } from './DashboardView';

export function ViperCopilotAuditContent() {
  const { analytics, lastSubmittedTrade, setLastSubmittedTrade, rules } = useViper();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);

  const auditTarget = lastSubmittedTrade;
  const targetWindow = auditTarget
    ? normalizeLiquidityWindow(auditTarget.sessionWindow, auditTarget.time)
    : null;

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

    if (q.includes('revenge') || q.includes('15')) {
      return `1. 15-Minute Revenge Trading Guard: ${
        analytics.revengeTradesCount > 0
          ? `🚨 ${analytics.revengeTradesCount} execution(s) entered < 15 minutes after the previous trade's Fill Time exit.`
          : '✓ PASS — All consecutive trades respected the 15-minute cooldown gap.'
      }
2. Compliance Score Impact: ${analytics.avgComplianceScore}% session average (Rule #14 automatically penalized on < 15m gap entries).
3. Account Risk Status ($25k Lucid Flex LFE05072050930002): ${isRiskPassed ? 'PASS' : 'FAIL'} (-$${dailyLossUsed.toFixed(2)} of -$${dailyCap} Daily Loss Cap used).
4. Actionable Adjustment: ${analytics.actionableAdjustment}`;
    }

    if (q.includes('14') || q.includes('rule') || q.includes('compliance')) {
      const lowest = analytics.weakestRule;
      return `1. Compliance Score: ${analytics.avgComplianceScore}% average across ${analytics.totalTrades} trades (${analytics.totalContractsTraded}x total lots).${
        lowest ? ` Lowest checkpoint: Rule #${lowest.number} (${lowest.label}) at ${lowest.pct}%.` : ''
      }
2. Risk Status ($25k Account): ${isRiskPassed ? 'PASS' : 'FAIL'} — -$${dailyLossUsed.toFixed(2)} of -$${dailyCap} Daily Cap used.
3. Behavioral Red Flags: ${
        analytics.sortedLeaks.length > 0
          ? analytics.sortedLeaks
              .map((l) =>
                l.tag === REVENGE_GAP_LABEL
                  ? `🚨 ${l.tag} (${l.count}x)`
                  : `${l.tag} (${l.count}x)`
              )
              .join(', ')
          : 'Zero recurring leaks.'
      }
4. Actionable Adjustment: ${analytics.actionableAdjustment}`;
    }

    if (q.includes('window') || q.includes('session') || q.includes('est') || q.includes('liquidity')) {
      const sLines = analytics.sessionStats
        .map(
          (s) =>
            `• ${s.label}: ${s.trades} trades | ${s.winRate}% WR | ${s.avgR}R avg | ${formatUSD(s.netPnl)}`
        )
        .join('\n');
      return `Liquidity Window Performance Breakdown (CT / ET):\n${sLines}\n\nActionable Adjustment: ${analytics.actionableAdjustment}`;
    }

    return `1. Compliance Score: ${analytics.avgComplianceScore}% (WR: ${analytics.winRate}% • PF: ${analytics.profitFactor} • Avg R: ${analytics.avgRMultiple}R)
2. Risk Status ($25k Lucid Flex): ${isRiskPassed ? 'PASS' : 'FAIL'} (-$${dailyLossUsed.toFixed(2)} / -$${dailyCap} Cap • Balance: $${analytics.currentAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })})
3. Behavioral Red Flags: ${
      analytics.topLeak
        ? `${analytics.topLeak.tag === REVENGE_GAP_LABEL ? '🚨 ' : ''}${analytics.topLeak.tag} (${analytics.topLeak.count}x)`
        : 'Clean'
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
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold tracking-tight text-[#FFFFFF]">
              4-Point Automated Strategy &amp; Behavioral Leak Audit
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold text-[#FFFFFF] ${
                auditTarget?.isRevengeTrade ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              {auditTarget
                ? `Inspecting: ${auditTarget.quantity || 1}x ${auditTarget.contract} on ${auditTarget.date} at ${auditTarget.timeEST || auditTarget.time} (${formatUSD(auditTarget.netPnl)})`
                : `All Session Trades (${analytics.totalTrades} Trades • ${analytics.totalContractsTraded}x Lots)`}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
            Direct, objective evaluation of Liquidity Windows, 14-rule adherence, $25k Lucid Flex ($600 Daily Cap), and 15-minute Revenge Trading Guard.
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

      {/* Detailed Trade Expansion / Liquidity Window Banner when a Trade is Selected */}
      {auditTarget && (
        <div className="bg-[#111620] rounded-xl p-5 border border-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] block mb-1">
                Execution Timestamp (EST / CT)
              </span>
              <div className="font-mono text-sm font-bold text-[#FFFFFF]">
                {auditTarget.date} •{' '}
                <span className="text-emerald-400">
                  {auditTarget.timeEST} → {auditTarget.exitTimeEST}
                </span>
              </div>
              {auditTarget.timeCT && (
                <div className="font-mono text-xs text-[#8A99AD] mt-0.5">
                  Chicago Time: {auditTarget.timeCT} → {auditTarget.exitTimeCT}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-800/80 hidden sm:block" />

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] block mb-1">
                Liquidity Window
              </span>
              <LiquidityWindowBadge sessionWindow={targetWindow} />
            </div>

            <div className="h-8 w-px bg-slate-800/80 hidden sm:block" />

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] block mb-1">
                Position &amp; Contract Lots
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                    auditTarget.direction === 'Long'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {auditTarget.direction === 'Long' ? 'LONG' : 'SHORT'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#090C10] border border-slate-800 font-mono text-xs font-bold text-[#FFFFFF]">
                  {auditTarget.quantity}x {auditTarget.lotType || 'Micro'} ({auditTarget.contract})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/60">
            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] block">
                Realized Net P&amp;L
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  Number(auditTarget.netPnl) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {formatUSD(auditTarget.netPnl)} ({auditTarget.rMultiple > 0 ? `+${auditTarget.rMultiple}R` : `${auditTarget.rMultiple}R`})
              </span>
            </div>
          </div>
        </div>
      )}

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
                className={`h-full rounded-full transition-all ${
                  activeComplianceScore >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  width: `${activeComplianceScore}%`,
                }}
              />
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-800/60 text-xs font-medium text-[#8A99AD]">
            {activeRulesFollowedCount} of 14 strategy rules followed
          </div>
        </div>

        {/* 2. Risk Status ($600 Daily Loss Cap on $25k Account) */}
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
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#FFFFFF] ${
                  isRiskPassed ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isRiskPassed ? 'PASS' : 'FAIL'}
              </span>
              <span className="text-xl font-bold font-mono text-[#FFFFFF] tracking-tight">
                -${dailyLossUsed.toFixed(0)} / -${dailyCap}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#090C10] rounded-full overflow-hidden mt-3.5">
              <div
                className={`h-full rounded-full transition-all ${
                  isRiskPassed ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.max(
                    4,
                    analytics.dailyLossTracker.dailyLossUtilizationPct
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-800/60 text-xs font-medium text-[#8A99AD]">
            $25k Balance:{' '}
            <strong className="font-mono text-[#FFFFFF]">
              ${analytics.currentAccountBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>

        {/* 3. Behavioral Red Flags & 15m Revenge Trading Guard */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#8A99AD] uppercase tracking-wider mb-3">
              <span>3. Behavioral Red Flags</span>
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            {analytics.sortedLeaks.length === 0 ? (
              <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-[#FFFFFF]">
                ✓ Zero Behavioral Leaks
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {analytics.sortedLeaks.map((item) => (
                  <span
                    key={item.tag}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  >
                    {item.tag === REVENGE_GAP_LABEL
                      ? `🚨 ${item.tag} (${item.count}x)`
                      : `${item.tag} (${item.count}x)`}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-800/60 text-xs font-medium text-[#8A99AD]">
            {analytics.revengeTradesCount > 0
              ? `🚨 ${analytics.revengeTradesCount} trade(s) violated 15m cooldown`
              : '15-minute cooldown respected across all trades'}
          </div>
        </div>

        {/* 4. Actionable Adjustment */}
        <div className="bg-[#111620] rounded-xl p-6 border border-slate-800/60 border-l-4 border-l-emerald-500 flex flex-col justify-between">
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-[#FFFFFF]">
              <Bot size={16} />
            </div>
            <div>
              <span className="text-sm font-bold text-[#FFFFFF] block">
                Ask Viper Copilot
              </span>
              <span className="text-xs text-[#8A99AD]">
                Query Liquidity Windows (1–4 AM CT / 8–11 AM CT), 15m Revenge Guard, or 14-rule compliance
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Audit 15-Minute Revenge Rule',
              'Audit 14-Rule Compliance',
              'Review Liquidity Window Performance',
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
            placeholder="Ask Viper Copilot about Liquidity Windows, 15m cooldowns, or rule compliance..."
            className="flex-1 bg-[#090C10] border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-[#FFFFFF] placeholder-[#8A99AD] focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2 transition-colors cursor-pointer"
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
            <span className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-[#FFFFFF]">
              <Bot size={15} />
            </span>
            <span>AI Session Review</span>
            <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-emerald-600 text-[#FFFFFF]">
              {analytics.avgComplianceScore}%
            </span>
            {analytics.revengeTradesCount > 0 && (
              <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-rose-600 text-[#FFFFFF]">
                🚨 {analytics.revengeTradesCount} &lt;15m
              </span>
            )}
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
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-[#FFFFFF]">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-[#FFFFFF]">
                      Viper AI Session Review Drawer
                    </h2>
                    <p className="text-xs font-medium text-[#8A99AD]">
                      On-demand Liquidity Window Audit, 14-Rule Compliance, $600 Daily Loss Cap &amp; 15m Revenge Trading Guard
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
