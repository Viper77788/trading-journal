import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { buildViperContext } from '../../utils/viperRuleEngine';
import { queryViperAgent, runAlgorithmicViper } from '../../services/viperEngine';
import { parseMarkdownToHtml } from '../../utils/markdownParser';

export default function ViperCopilotDrawer({ trades = [] }) {
  const { user } = useAuth();
  const { activeAccount, filterTradesByAccount } = useAccount();
  const { userTimezone } = useUserPreferences();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

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

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: runAlgorithmicViper('Full Session Review', viperContext),
        },
      ]);
    }
  }, [isOpen, viperContext, messages.length]);

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

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-xl shadow-emerald-600/30 border border-white/15 transition-all"
      >
        <Bot size={18} />
        <span>Viper 14-Rule Copilot</span>
        <span className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-[10px]">
          {viperContext.summaryStats.avgComplianceScore}%
        </span>
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-slate-950 border-l border-white/10 h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Viper AI Copilot</h3>
                  <p className="text-[11px] text-slate-400">
                    14-Rule Compliance: {viperContext.summaryStats.avgComplianceScore}% • Max Loss: ${viperContext.activeAccount.dailyLossLimit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Chips */}
            <div className="p-2.5 border-b border-white/10 flex flex-wrap gap-1.5 bg-slate-900/40">
              {[
                { label: '📋 14-Rule Audit', q: 'Show my 14-Rule Strategy Scorecard' },
                { label: '🕒 1-4AM / 8-11AM & Zones', q: 'Analyze my liquidity windows and #386641 / #BC4749 zones' },
                { label: '🚨 Leaks & $600 Risk', q: 'Audit my behavioral leaks and $600 daily loss limit' },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleSend(c.q)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[92%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-slate-900 border border-white/10 text-slate-200'
                    }`}
                  >
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(m.content) }} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-white/10 bg-slate-900/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Viper about 14 rules, #386641 zones, or leaks..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSending}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
