import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, Key, AlertTriangle, RefreshCw, Zap, Flame, Award, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { buildViperStateContext } from '../../utils/viperContextBuilder';
import { queryViperAgent } from '../../services/viperEngine';

const QUICK_PROMPTS = [
  { label: '⚡ Analyze My Leaks', query: 'Analyze my leaks and behavioral mistakes' },
  { label: '📊 EOD Session Review', query: 'Generate an End-of-Day session review' },
  { label: '🛡️ Guardrail Status', query: 'Check my active risk guardrail status' },
  { label: '🔥 Revenge Trade Audit', query: 'Audit my revenge trades and tilt sizing' },
];

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);
};

export default function ViperCopilotView({ trades = [] }) {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const { userTimezone, geminiApiKey, updateGeminiApiKey } = useUserPreferences();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey || '');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setTempApiKey(geminiApiKey || '');
  }, [geminiApiKey]);

  // Build context
  const stateContext = buildViperStateContext({
    user,
    activeAccount,
    trades,
    userTimezone
  });

  const { summaryStats, activeGuardrail } = stateContext;
  const leaks = summaryStats.leaks || {};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = `### 🐍 Welcome to Viper Copilot
      
I am your automated behavioral performance specialist. I audit your logged trades to expose costly emotional leaks, enforce risk limits, and optimize your execution edge.

- **Execution Grade:** **[ ${summaryStats.executionGrade} ]** (${summaryStats.planFollowedPct}% Plan Followed)
- **Active Guardrail:** **${activeGuardrail.status}**

Select a quick analysis option below or ask me any question about your execution!`;

      setMessages([
        { id: 1, sender: 'viper', text: welcomeText, timestamp: new Date() }
      ]);
    }
  }, []);

  const handleSend = async (customQuery) => {
    const queryText = (customQuery || input).trim();
    if (!queryText || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setInput('');
    setLoading(true);

    try {
      const res = await queryViperAgent({
        userQuery: queryText,
        stateContext,
        apiKey: geminiApiKey
      });

      const viperMsg = {
        id: Date.now() + 1,
        sender: 'viper',
        text: res.text,
        isFallback: res.isLocalFallback,
        notice: res.errorNotice,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, viperMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'viper',
          text: `[SYSTEM ERROR] ${err.message}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    updateGeminiApiKey(tempApiKey);
    setShowKeyInput(false);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const formatted = text
      .replace(/\[VIPER EDGE\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VIPER EDGE</span>')
      .replace(/\[VIPER LEAK\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">VIPER LEAK</span>')
      .replace(/\[GUARDRAIL BREACHED\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">GUARDRAIL BREACHED</span>')
      .replace(/\[TILT WARNING\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">TILT WARNING</span>')
      .replace(/\[GUARDRAIL TRIGGERED\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">GUARDRAIL TRIGGERED</span>');

    return <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br/>') }} />;
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Bot size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Viper Copilot</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                BEHAVIORAL AGENT
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Active Account: <span className="text-white font-medium">{activeAccount?.name || 'Main Account'}</span> • Auditing {summaryStats.totalTrades} Logged Trades
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              geminiApiKey
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            <Key size={14} />
            <span>{geminiApiKey ? 'Gemini 2.5 Active' : 'Set Gemini Key'}</span>
          </button>
        </div>
      </div>

      {/* Key Input Dropdown Bar */}
      {showKeyInput && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-emerald-400">Gemini 2.5 Flash API Key</span>
            <span className="text-slate-400">Stored privately in your encrypted user settings</span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Paste AIZA... Gemini API Key"
              className="flex-1 px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Stats Column + Right Chat Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Behavioral Stats & Guardrails */}
        <div className="space-y-4">
          
          {/* Active Guardrail Card */}
          <div className={`glass-card p-5 border ${
            activeGuardrail.status === 'CRITICAL'
              ? 'border-red-500/40 bg-red-500/10'
              : activeGuardrail.status === 'WARNING'
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guardrail Engine</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                activeGuardrail.status === 'CRITICAL'
                  ? 'bg-red-600 text-white animate-pulse'
                  : activeGuardrail.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {activeGuardrail.status}
              </span>
            </div>

            {activeGuardrail.triggerReason ? (
              <p className="text-xs text-slate-200 font-medium">
                {activeGuardrail.triggerReason}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Risk parameters normal. No max daily drawdown or tilt triggers active.
              </p>
            )}
          </div>

          {/* Execution Grade Card */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Execution Grade</div>
              <div className="text-3xl font-extrabold text-white mt-1">
                Grade {summaryStats.executionGrade}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summaryStats.planFollowedPct}% Plan Adherence
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-bold font-mono">
              {summaryStats.executionGrade}
            </div>
          </div>

          {/* Behavioral Leaks Summary Card */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <span>Behavioral Leak Summary</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="font-semibold text-slate-200">Revenge Trades</div>
                  <div className="text-[10px] text-slate-400">&lt; 5m after stop-out</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-400">{fmtMoney(leaks.revengeTradeCost)}</div>
                  <div className="text-[10px] text-slate-500">{leaks.revengeTradesCount} trades</div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="font-semibold text-slate-200">Off-Hours Trading</div>
                  <div className="text-[10px] text-slate-400">After 14:30 EST</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-400">{fmtMoney(leaks.offHoursTradeCost)}</div>
                  <div className="text-[10px] text-slate-500">{leaks.offHoursTradesCount} trades</div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="font-semibold text-slate-200">Tilt Sizing</div>
                  <div className="text-[10px] text-slate-400">&gt; 1.5x avg size after loss</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-400">{fmtMoney(leaks.tiltSizingCost)}</div>
                  <div className="text-[10px] text-slate-500">{leaks.tiltSizingCount} trades</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Console */}
        <div className="lg:col-span-2 glass-card flex flex-col h-[650px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-slate-900/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-sm font-bold text-white">Viper Copilot Console</span>
            </div>
            <span className="text-xs text-slate-400">
              {geminiApiKey ? 'Engine: Gemini 2.5 Flash' : 'Engine: Local Deterministic JS'}
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none backdrop-blur-md'
                }`}>
                  {msg.sender === 'viper' ? (
                    <>
                      {renderFormattedText(msg.text)}
                      {msg.notice && (
                        <div className="mt-2 text-[10px] text-amber-400 border-t border-white/10 pt-1">
                          {msg.notice}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.sender === 'user' ? 'You' : 'Viper'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-white/5 p-3 rounded-2xl w-36 border border-white/10">
                <RefreshCw size={14} className="animate-spin text-emerald-400" />
                <span>Auditing state...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-3 bg-slate-900/60 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp.query)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 whitespace-nowrap transition-colors"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Viper about your trade execution..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 font-medium"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
