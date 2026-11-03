import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  Flame,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { buildViperContext } from '../../utils/viperRuleEngine';
import { queryViperAgent, runAlgorithmicViper } from '../../services/viperEngine';
import { parseMarkdownToHtml } from '../../utils/markdownParser';

const QUICK_PROMPTS = [
  { label: '📋 14-Rule Scorecard Audit', query: 'Show my 14-Rule Strategy Scorecard & Compliance breakdown' },
  { label: '🕒 Liquidity Windows & Zones', query: 'Analyze my 1-4 AM & 8-11 AM liquidity windows and #386641 / #BC4749 zones' },
  { label: '🚨 Behavioral Leaks & $600 Cap', query: 'Audit my behavioral leaks and $600 daily loss limit compliance' },
  { label: '📊 Full Session Review', query: 'Run a complete session performance and R-multiple review' },
];

export default function ViperCopilotView({ trades = [] }) {
  const { user } = useAuth();
  const { activeAccount, filterTradesByAccount } = useAccount();
  const { userTimezone } = useUserPreferences();

  const scopedTrades = useMemo(
    () => filterTradesByAccount(trades).filter((t) => !t.isDeleted),
    [trades, filterTradesByAccount]
  );

  const viperContext = useMemo(
    () =>
      buildViperContext({
        user,
        activeAccount,
        trades: scopedTrades,
        userTimezone,
      }),
    [user, activeAccount, scopedTrades, userTimezone]
  );

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const initialReport = runAlgorithmicViper('Full Session Review', viperContext);
    setMessages([{ role: 'assistant', content: initialReport }]);
  }, [viperContext]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride) => {
    const queryText = (textOverride ?? input).trim();
    if (!queryText || isSending) return;

    if (!textOverride) setInput('');
    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: queryText }]);

    try {
      const res = await queryViperAgent({
        userQuery: queryText,
        stateContext: viperContext,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.text }]);
    } finally {
      setIsSending(false);
    }
  };

  const { activeAccount: acc, summaryStats: stats, sessionWindows, zoneStats, ruleBreakdown, behavioralLeaks } = viperContext;
  const dailyLossPct = Math.min(100, Math.round((acc.todayLoss / acc.dailyLossLimit) * 100));

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Viper AI Copilot & 14-Rule Engine</h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GC / MGC Futures
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              14-Rule Technical Strategy Grading • #386641 Support & #BC4749 Resistance • $600 Daily Loss Guardrail ({acc.name})
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 Core Pillar KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 14-Rule Compliance Score */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>1. 14-Rule Compliance</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.avgComplianceScore}%</div>
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${stats.avgComplianceScore}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Across {stats.totalTrades} Gold futures trades
          </p>
        </div>

        {/* 2. $600 Daily Loss Limit Tracker */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>2. Daily Loss Limit (${acc.dailyLossLimit})</span>
            <Shield size={16} className={acc.dailyLimitBreachedToday ? 'text-red-400' : 'text-blue-400'} />
          </div>
          <div className={`text-2xl font-bold font-mono ${acc.dailyLimitBreachedToday ? 'text-red-400' : 'text-emerald-400'}`}>
            -${acc.todayLoss.toFixed(2)} / -${acc.dailyLossLimit}
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                dailyLossPct >= 80 ? 'bg-red-500' : dailyLossPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${dailyLossPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {acc.dailyLimitBreachDays === 0 ? '0 breach days logged' : `${acc.dailyLimitBreachDays} historical breach day(s)`}
          </p>
        </div>

        {/* 3. Average R-Multiple & Profit Factor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>3. Avg R-Multiple & PF</span>
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.avgRMultiple}R <span className="text-sm font-normal text-slate-400">• PF {stats.profitFactor}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Win Rate: <strong className="text-white">{stats.winRate}%</strong> ({stats.wins}W / {stats.losses}L)
          </p>
        </div>

        {/* 4. Zone Edge (#386641 & #BC4749) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>4. Zone Win Rates</span>
            <Layers size={16} className="text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded font-mono text-white text-[11px]" style={{ backgroundColor: '#386641' }}>
                #386641 Support
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {zoneStats.support386641.winRate}% ({zoneStats.support386641.trades}T)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded font-mono text-white text-[11px]" style={{ backgroundColor: '#BC4749' }}>
                #BC4749 Resistance
              </span>
              <span className="font-mono font-bold text-rose-400">
                {zoneStats.resistanceBC4749.winRate}% ({zoneStats.resistanceBC4749.trades}T)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = 14-Rule Scorecard + Liquidity Windows + Leaks, Right = AI Copilot Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Liquidity Windows (1:00–4:00 AM & 8:00–11:00 AM NY) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Clock size={16} className="text-blue-400" />
              Liquidity Window Performance (NY Time)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                <div className="text-[11px] text-slate-400">1:00 AM – 4:00 AM (London)</div>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {sessionWindows.london1to4AM.winRate}% WR
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  {sessionWindows.london1to4AM.trades} trades • {sessionWindows.london1to4AM.avgR}R avg
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                <div className="text-[11px] text-slate-400">8:00 AM – 11:00 AM (NY)</div>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {sessionWindows.ny8to11AM.winRate}% WR
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  {sessionWindows.ny8to11AM.trades} trades • {sessionWindows.ny8to11AM.avgR}R avg
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/10">
                <div className="text-[11px] text-amber-400">Outside Windows</div>
                <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                  {sessionWindows.outsideWindow.winRate}% WR
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  {sessionWindows.outsideWindow.trades} trades • {sessionWindows.outsideWindow.avgR}R avg
                </div>
              </div>
            </div>
          </div>

          {/* 14-Rule Strategy Scorecard Breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target size={16} className="text-emerald-400" />
                14-Rule Technical Strategy Scorecard
              </h3>
              <span className="text-xs font-mono text-slate-400">Pass % per Rule</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {ruleBreakdown.map((rule) => (
                <div key={rule.id} className="p-2.5 rounded-xl bg-black/20 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 font-medium truncate pr-2">{rule.label}</span>
                    <span
                      className={`font-mono font-bold ${
                        rule.passPct >= 80 ? 'text-emerald-400' : rule.passPct >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}
                    >
                      {rule.passPct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rule.passPct}%`,
                        backgroundColor: rule.passPct >= 75 ? '#386641' : '#BC4749',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Leak Detector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame size={16} className="text-red-400" />
              Behavioral Leak Detector
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(behavioralLeaks).map(([name, info]) => (
                <div
                  key={name}
                  className={`p-3 rounded-xl border ${
                    info.count > 0 ? 'bg-red-500/10 border-red-500/25' : 'bg-black/20 border-white/10'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-300 truncate">{name}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-bold font-mono text-white">{info.count}</span>
                    <span className={`text-xs font-mono ${info.cost < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {info.cost < 0 ? `-$${Math.abs(info.cost).toFixed(0)}` : '$0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Viper AI Copilot Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden h-[720px]">
          <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Viper Direct Execution Coach
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">4-Point Audit Protocol</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="p-3 border-b border-white/10 flex flex-wrap gap-1.5 bg-black/10">
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSend(chip.query)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-slate-900/90 border border-white/10 text-slate-200'
                  }`}
                >
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    <div
                      className="space-y-1"
                      dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(m.content) }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-white/10 bg-black/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Viper to audit 14-rules, #386641 zones, or $600 risk..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSending}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
