import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, ShieldAlert, Sparkles, Key, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
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

export default function ViperCopilotDrawer({ trades = [] }) {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const { userTimezone, geminiApiKey, updateGeminiApiKey } = useUserPreferences();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey || '');

  const messagesEndRef = useRef(null);

  // Sync temp key when context updates
  useEffect(() => {
    setTempApiKey(geminiApiKey || '');
  }, [geminiApiKey]);

  // Build state context
  const stateContext = buildViperStateContext({
    user,
    activeAccount,
    trades,
    userTimezone
  });

  const guardrailStatus = stateContext.activeGuardrail.status;

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Initial welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = `### 🐍 Viper Copilot Ready

I have audited **${stateContext.summaryStats.totalTrades} logged trades** on **${activeAccount?.name || 'your account'}**.

- **Execution Grade:** **[ ${stateContext.summaryStats.executionGrade} ]**
- **Win Rate:** **${stateContext.summaryStats.winRate}%**
- **Guardrail Status:** **${guardrailStatus}**

Click a quick prompt below or ask me anything about your trader execution!`;

      setMessages([
        { id: 1, sender: 'viper', text: welcomeText, timestamp: new Date() }
      ]);
    }
  }, [isOpen]);

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
          text: `[SYSTEM ERROR] Failed to generate response: ${err.message}`,
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

  // Format message text with markdown styling & badges
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Simple markdown helper replacements
    const formatted = text
      .replace(/\[VIPER EDGE\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VIPER EDGE</span>')
      .replace(/\[VIPER LEAK\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">VIPER LEAK</span>')
      .replace(/\[GUARDRAIL BREACHED\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">GUARDRAIL BREACHED</span>')
      .replace(/\[TILT WARNING\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">TILT WARNING</span>')
      .replace(/\[GUARDRAIL TRIGGERED\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">GUARDRAIL TRIGGERED</span>');

    return <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br/>') }} />;
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            guardrailStatus === 'CRITICAL'
              ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white animate-bounce shadow-red-500/40'
              : guardrailStatus === 'WARNING'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
          }`}
          title="Open Viper Copilot"
        >
          <div className="relative flex items-center justify-center">
            <Bot size={20} className="text-white" />
            {guardrailStatus !== 'NORMAL' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            )}
          </div>
          <span className="text-sm font-bold tracking-wide">Viper Copilot</span>
          {guardrailStatus !== 'NORMAL' && (
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-black/40 rounded-md uppercase">
              {guardrailStatus}
            </span>
          )}
        </button>
      )}

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Chat Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Viper Copilot</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI COACH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeAccount?.name || 'Main Account'} • {stateContext.summaryStats.totalTrades} Trades Logged
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                geminiApiKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
              title="Configure Gemini API Key"
            >
              <Key size={14} />
              <span className="hidden xs:inline">{geminiApiKey ? 'API Active' : 'Set Key'}</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Gemini Key Collapsible Input */}
        {showKeyInput && (
          <div className="p-3 bg-slate-900/90 border-b border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-emerald-400">Gemini LLM Integration (Optional)</span>
              <span className="text-[10px] text-slate-400">Free API Key from Google AI Studio</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Paste AIZA... Gemini API Key"
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Guardrail Status Bar */}
        {guardrailStatus !== 'NORMAL' && (
          <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            guardrailStatus === 'CRITICAL'
              ? 'bg-red-500/20 text-red-300 border-red-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={14} />
              <span>{stateContext.activeGuardrail.triggerReason}</span>
            </div>
          </div>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[90%] rounded-2xl p-3.5 shadow-md ${
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
                  <p className="text-xs">{msg.text}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.sender === 'user' ? 'You' : 'Viper'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs bg-white/5 p-3 rounded-2xl w-32 border border-white/10">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Auditing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="px-4 py-2 bg-slate-900/40 border-t border-white/5 overflow-x-auto flex gap-2 no-scrollbar">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp.query)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900/80 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Viper about your execution..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/20"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
