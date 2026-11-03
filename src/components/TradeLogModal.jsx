import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Shield,
  Clock,
  Flame,
  ExternalLink,
  Edit3,
  Check,
  FileText,
  DollarSign,
  Sliders,
} from 'lucide-react';
import {
  CONTRACTS,
  ACCOUNT_TYPES,
  SESSION_WINDOWS,
  ZONE_TYPES,
  BEHAVIORAL_LEAK_TAGS,
} from '../constants/viperConstants';
import { useViper } from '../context/ViperContext';
import { computeRuleCompliance, formatUSD } from '../utils/viperAnalytics';

export default function TradeLogModal({ isOpen, onClose, initialTrade = null }) {
  const { rules, addOrUpdateTrade, updateRuleLabel, dailyLossCap } = useViper();

  const [activeTab, setActiveTab] = useState('execution');
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingRuleText, setEditingRuleText] = useState('');

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '08:30',
    sessionWindow: '8:00 AM–11:00 AM',
    contract: 'MGCZ6',
    accountType: 'Lucid Flex',
    direction: 'Long',
    zoneInteraction: 'Support (#386641)',
    entryPrice: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
    exitPrice: '',
    grossPnl: '',
    commissions: '12.40',
    netPnl: '',
    initialRisk: '200',
    rulesChecked: rules.map((r) => r.id),
    leakTags: [],
    tradingViewUrl: '',
    notes: '',
  });

  useEffect(() => {
    if (initialTrade) {
      setForm({
        ...initialTrade,
        rulesChecked: Array.isArray(initialTrade.rulesChecked)
          ? initialTrade.rulesChecked
          : [],
        leakTags: Array.isArray(initialTrade.leakTags) ? initialTrade.leakTags : [],
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        time: '08:30',
        sessionWindow: '8:00 AM–11:00 AM',
        contract: 'MGCZ6',
        accountType: 'Lucid Flex',
        direction: 'Long',
        zoneInteraction: 'Support (#386641)',
        entryPrice: '',
        stopLoss: '',
        tp1: '',
        tp2: '',
        exitPrice: '',
        grossPnl: '',
        commissions: '12.40',
        netPnl: '',
        initialRisk: '200',
        rulesChecked: rules.map((r) => r.id),
        leakTags: [],
        tradingViewUrl: '',
        notes: '',
      });
    }
    setActiveTab('execution');
  }, [initialTrade, isOpen, rules]);

  // Auto-calculate Net P&L & R-Multiple preview
  const derivedFinancials = useMemo(() => {
    const gross = parseFloat(form.grossPnl);
    const comm = parseFloat(form.commissions) || 0;
    const net = !Number.isNaN(gross)
      ? Math.round((gross - comm) * 100) / 100
      : parseFloat(form.netPnl) || 0;
    const risk = parseFloat(form.initialRisk) || 0;
    const rMultiple = risk > 0 ? Math.round((net / risk) * 100) / 100 : 0;
    return { net, rMultiple };
  }, [form.grossPnl, form.commissions, form.netPnl, form.initialRisk]);

  const liveCompliance = useMemo(() => {
    return computeRuleCompliance(form.rulesChecked, rules.length);
  }, [form.rulesChecked, rules.length]);

  if (!isOpen) return null;

  const updateField = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'grossPnl' || key === 'commissions') {
        const g = parseFloat(key === 'grossPnl' ? val : prev.grossPnl);
        const c = parseFloat(key === 'commissions' ? val : prev.commissions) || 0;
        if (!Number.isNaN(g)) {
          next.netPnl = (g - c).toFixed(2);
        }
      }
      return next;
    });
  };

  const toggleRule = (ruleId) => {
    setForm((prev) => {
      const exists = prev.rulesChecked.includes(ruleId);
      const nextRules = exists
        ? prev.rulesChecked.filter((id) => id !== ruleId)
        : [...prev.rulesChecked, ruleId];
      return { ...prev, rulesChecked: nextRules };
    });
  };

  const toggleLeakTag = (tag) => {
    setForm((prev) => {
      const exists = prev.leakTags.includes(tag);
      const nextTags = exists
        ? prev.leakTags.filter((t) => t !== tag)
        : [...prev.leakTags, tag];
      return { ...prev, leakTags: nextTags };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addOrUpdateTrade({
      ...form,
      id: initialTrade?.id,
      netPnl: derivedFinancials.net,
      rMultiple: derivedFinancials.rMultiple,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#121417] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#181B20] border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase text-white bg-[#386641]">
                {form.contract}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {initialTrade ? 'Edit Futures Execution & 14-Rule Audit' : 'Log Gold Futures Execution'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {form.accountType} • Daily Loss Limit: ${dailyLossCap} • Live Rule Compliance:{' '}
              <strong className="text-white font-mono">
                {liveCompliance.count}/14 ({liveCompliance.score}% — Grade {liveCompliance.grade})
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-[#181B20] border-b border-slate-800 flex gap-2 overflow-x-auto">
          {[
            { id: 'execution', label: '1. Metadata, Prices & Financials', icon: DollarSign },
            { id: 'rules', label: `2. 14-Rule Strategy Checklist (${liveCompliance.count}/14)`, icon: CheckCircle2 },
            { id: 'psychology', label: `3. Behavioral Leaks & Notes (${form.leakTags.length})`, icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#386641] text-white bg-[#121417]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
            {/* TAB 1: METADATA, EXECUTION PRICES & FINANCIALS */}
            {activeTab === 'execution' && (
              <div className="space-y-6">
                {/* Metadata Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock size={13} /> Session & Contract Metadata
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Trade Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        required
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#386641]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Execution Time (EST/NY)</label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) => updateField('time', e.target.value)}
                        required
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#386641]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Liquidity Session Window</label>
                      <select
                        value={form.sessionWindow}
                        onChange={(e) => updateField('sessionWindow', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#386641]"
                      >
                        {SESSION_WINDOWS.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Futures Contract</label>
                      <select
                        value={form.contract}
                        onChange={(e) => updateField('contract', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#386641]"
                      >
                        {CONTRACTS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Prop Firm Account</label>
                      <select
                        value={form.accountType}
                        onChange={(e) => updateField('accountType', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#386641]"
                      >
                        {ACCOUNT_TYPES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Direction</label>
                      <div className="grid grid-cols-2 gap-2 bg-[#181B20] p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateField('direction', 'Long')}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            form.direction === 'Long'
                              ? 'text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          style={{
                            backgroundColor: form.direction === 'Long' ? '#386641' : 'transparent',
                          }}
                        >
                          LONG (BUY)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('direction', 'Short')}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            form.direction === 'Short'
                              ? 'text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          style={{
                            backgroundColor: form.direction === 'Short' ? '#BC4749' : 'transparent',
                          }}
                        >
                          SHORT (SELL)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support (#386641) / Resistance (#BC4749) Zone Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Support (#386641) & Resistance (#BC4749) Zone Interaction
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {ZONE_TYPES.map((z) => {
                      const selected = form.zoneInteraction === z.id;
                      return (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => updateField('zoneInteraction', z.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                            selected
                              ? 'border-white bg-slate-800/90 text-white shadow-md'
                              : 'border-slate-800 bg-[#181B20] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/25"
                            style={{ backgroundColor: z.hex }}
                          />
                          <span className="truncate">{z.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Execution Prices */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Sliders size={13} /> Execution Prices (Entry, SL, TP1, TP2, Exit)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Entry Price</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2742.5"
                        value={form.entryPrice}
                        onChange={(e) => updateField('entryPrice', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Stop Loss</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2738.5"
                        value={form.stopLoss}
                        onChange={(e) => updateField('stopLoss', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target 1 (TP1)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2748.5"
                        value={form.tp1}
                        onChange={(e) => updateField('tp1', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target 2 (TP2)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2752.5"
                        value={form.tp2}
                        onChange={(e) => updateField('tp2', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Exit Price</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2751.3"
                        value={form.exitPrice}
                        onChange={(e) => updateField('exitPrice', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Financials */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Shield size={13} /> Financials & R-Multiple Calculation
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Gross P&L ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="440.00"
                        value={form.grossPnl}
                        onChange={(e) => updateField('grossPnl', e.target.value)}
                        required
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Commissions ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="12.40"
                        value={form.commissions}
                        onChange={(e) => updateField('commissions', e.target.value)}
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Initial Risk ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="200.00"
                        value={form.initialRisk}
                        onChange={(e) => updateField('initialRisk', e.target.value)}
                        required
                        className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#181B20] border border-slate-800 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 uppercase">Net P&L ($)</span>
                      <span
                        className="text-sm font-mono font-bold mt-0.5"
                        style={{
                          color: derivedFinancials.net >= 0 ? '#4ade80' : '#f87171',
                        }}
                      >
                        {formatUSD(derivedFinancials.net)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#181B20] border border-slate-800 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 uppercase">Realized R-Multiple</span>
                      <span className="text-sm font-mono font-bold text-white mt-0.5">
                        {derivedFinancials.rMultiple > 0 ? `+${derivedFinancials.rMultiple}R` : `${derivedFinancials.rMultiple}R`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 14-RULE STRATEGY CHECKLIST */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#181B20] p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">14-Rule Technical Strategy Scorecard</h4>
                    <p className="text-[11px] text-slate-400">
                      Rules 1–7 are core strategy locks. Rules 8–14 can be customized by clicking the edit icon.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateField('rulesChecked', rules.map((r) => r.id))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Check All 14
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('rulesChecked', [])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {rules.map((rule) => {
                    const checked = form.rulesChecked.includes(rule.id);
                    const isEditing = editingRuleId === rule.id;

                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          checked
                            ? 'bg-[#386641]/15 border-[#386641]/60 text-white'
                            : 'bg-[#181B20] border-slate-800 text-slate-400'
                        }`}
                      >
                        <div
                          onClick={() => !isEditing && toggleRule(rule.id)}
                          className="flex items-center gap-2.5 flex-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-[#386641] cursor-pointer"
                          />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingRuleText}
                              onChange={(e) => setEditingRuleText(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-black/40 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                            />
                          ) : (
                            <span className="text-xs font-medium leading-snug">
                              <strong className="font-mono text-slate-300">#{rule.number}.</strong> {rule.label}
                            </span>
                          )}
                        </div>

                        {!rule.isCore && (
                          <div className="shrink-0">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingRuleText.trim()) {
                                    updateRuleLabel(rule.id, editingRuleText.trim());
                                  }
                                  setEditingRuleId(null);
                                }}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                                title="Save custom rule"
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRuleId(rule.id);
                                  setEditingRuleText(rule.label);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-200"
                                title="Customize rule label"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: BEHAVIORAL LEAKS & NOTES */}
            {activeTab === 'psychology' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Behavioral Leak Tags (Multi-Select)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BEHAVIORAL_LEAK_TAGS.map((tag) => {
                      const active = form.leakTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleLeakTag(tag)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            active
                              ? 'text-white border-[#BC4749] shadow-sm'
                              : 'bg-[#181B20] text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          style={{
                            backgroundColor: active ? '#BC4749' : undefined,
                          }}
                        >
                          {active ? '⚠️ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <ExternalLink size={13} /> TradingView Chart URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.tradingview.com/x/..."
                    value={form.tradingViewUrl}
                    onChange={(e) => updateField('tradingViewUrl', e.target.value)}
                    className="w-full bg-[#181B20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <FileText size={13} /> Execution & Post-Trade Markdown Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Document #386641 support / #BC4749 resistance reaction, candle close confirmation, and session execution notes..."
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full bg-[#181B20] border border-slate-700 rounded-xl p-3.5 text-xs text-white leading-relaxed resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-[#181B20] border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Compliance Grade:</span>
              <span
                className="px-2.5 py-1 rounded-lg font-mono font-bold text-white"
                style={{
                  backgroundColor:
                    liveCompliance.grade === 'A'
                      ? '#386641'
                      : liveCompliance.grade === 'B'
                      ? '#ca8a04'
                      : '#BC4749',
                }}
              >
                Grade {liveCompliance.grade} ({liveCompliance.score}%)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-95"
                style={{ backgroundColor: '#386641' }}
              >
                {initialTrade ? 'Update Trade & Audit' : 'Submit Trade & Run AI Audit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
