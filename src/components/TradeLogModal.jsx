import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { DEFAULT_14_RULES } from '../constants/viperConstants';

const CORE_3_PILLARS = [
  {
    id: 'pillar_window',
    title: '1. Liquidity Window Aligned',
    subtitle: 'Executed in 1:00–4:00 AM or 8:00–11:00 AM NY window',
  },
  {
    id: 'pillar_zone',
    title: '2. Zone & Candle Close Confirmed',
    subtitle: 'Confirmed reaction at #386641 Support or #BC4749 Resistance',
  },
  {
    id: 'pillar_risk',
    title: '3. Risk & Stop Plan Respected',
    subtitle: 'Within $600 daily loss cap with fixed initial stop',
  },
];

const QUICK_LEAK_OPTIONS = [
  'Clean',
  'FOMO Entry',
  'Early Exit',
  'Moved Stop Loss',
  'Oversizing',
  'Revenge Trading',
  'Session Outside Window',
];

export default function TradeLogModal({ isOpen, onClose, initialTrade = null }) {
  const { addOrUpdateTrade } = useViper();

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
    exitPrice: '',
    netPnl: '',
    rMultiple: '',
    pillars: {
      pillar_window: true,
      pillar_zone: true,
      pillar_risk: true,
    },
    rulesCount: 14,
    leakTags: [],
    tradingViewUrl: '',
    notes: '',
  });

  useEffect(() => {
    if (initialTrade) {
      const savedCount = Array.isArray(initialTrade.rulesChecked)
        ? initialTrade.rulesChecked.length
        : Math.round(((initialTrade.complianceScore || 100) / 100) * 14);
      setForm({
        date: initialTrade.date || new Date().toISOString().slice(0, 10),
        time: initialTrade.time || '08:30',
        sessionWindow: initialTrade.sessionWindow || '8:00 AM–11:00 AM',
        contract: initialTrade.contract || 'MGCZ6',
        accountType: initialTrade.accountType || 'Lucid Flex',
        direction: initialTrade.direction || 'Long',
        zoneInteraction: initialTrade.zoneInteraction || 'Support (#386641)',
        entryPrice: initialTrade.entryPrice ?? '',
        stopLoss: initialTrade.stopLoss ?? '',
        exitPrice: initialTrade.exitPrice ?? '',
        netPnl: initialTrade.netPnl ?? '',
        rMultiple: initialTrade.rMultiple ?? '',
        pillars: initialTrade.pillars || {
          pillar_window: savedCount >= 10,
          pillar_zone: savedCount >= 12,
          pillar_risk: savedCount >= 8,
        },
        rulesCount: savedCount,
        leakTags: Array.isArray(initialTrade.leakTags) ? initialTrade.leakTags : [],
        tradingViewUrl: initialTrade.tradingViewUrl || '',
        notes: initialTrade.notes || '',
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
        exitPrice: '',
        netPnl: '',
        rMultiple: '',
        pillars: {
          pillar_window: true,
          pillar_zone: true,
          pillar_risk: true,
        },
        rulesCount: 14,
        leakTags: [],
        tradingViewUrl: '',
        notes: '',
      });
    }
  }, [initialTrade, isOpen]);

  if (!isOpen) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Toggle one of the 3 quick pillars and automatically sync the 14-rule count slider
  const togglePillar = (pillarId) => {
    setForm((prev) => {
      const nextPillars = { ...prev.pillars, [pillarId]: !prev.pillars[pillarId] };
      const activeCount = Object.values(nextPillars).filter(Boolean).length;
      const mappedRulesCount =
        activeCount === 3 ? 14 : activeCount === 2 ? 10 : activeCount === 1 ? 5 : 0;
      return {
        ...prev,
        pillars: nextPillars,
        rulesCount: mappedRulesCount,
      };
    });
  };

  const handleTagSelect = (tag) => {
    if (tag === 'Clean') {
      updateField('leakTags', []);
      return;
    }
    setForm((prev) => {
      const exists = prev.leakTags.includes(tag);
      const next = exists
        ? prev.leakTags.filter((t) => t !== tag)
        : [...prev.leakTags, tag];
      return { ...prev, leakTags: next };
    });
  };

  const compliancePct = Math.round((form.rulesCount / 14) * 100);
  const complianceGrade =
    compliancePct >= 85 ? 'A' : compliancePct >= 65 ? 'B' : 'C';

  const handleSubmit = (e) => {
    e.preventDefault();
    const rulesChecked = DEFAULT_14_RULES.slice(0, form.rulesCount).map((r) => r.id);
    const netVal = parseFloat(form.netPnl) || 0;
    const rVal = parseFloat(form.rMultiple) || 0;

    addOrUpdateTrade({
      id: initialTrade?.id,
      date: form.date,
      time: form.time,
      sessionWindow: form.sessionWindow,
      contract: form.contract,
      accountType: form.accountType,
      direction: form.direction,
      zoneInteraction: form.zoneInteraction,
      entryPrice: form.entryPrice !== '' ? Number(form.entryPrice) : '',
      stopLoss: form.stopLoss !== '' ? Number(form.stopLoss) : '',
      exitPrice: form.exitPrice !== '' ? Number(form.exitPrice) : '',
      grossPnl: netVal,
      commissions: 0,
      netPnl: netVal,
      initialRisk: rVal !== 0 ? Math.round(Math.abs(netVal / rVal)) : 200,
      rMultiple: rVal,
      pillars: form.pillars,
      rulesChecked,
      complianceScore: compliancePct,
      complianceGrade,
      leakTags: form.leakTags,
      tradingViewUrl: form.tradingViewUrl,
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Clean Light Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-white"
                style={{ backgroundColor: '#386641' }}
              >
                FAST LOG
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {initialTrade ? 'Edit Futures Execution' : 'Log Gold Futures Trade'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Streamlined 30-second execution logger • GC & MGCZ6
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: CORE TRADE INFO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                Section 1: Core Trade Info
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Time (NY)</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>

              {/* Contract Pill Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contract</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {['MGCZ6', 'GC'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateField('contract', c)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        form.contract === c
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {['Lucid Flex', 'Apex'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => updateField('accountType', acc)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        form.accountType === acc
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Session Window + Direction + Zone Anchor Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Session Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Liquidity Session Window
                </label>
                <select
                  value={form.sessionWindow}
                  onChange={(e) => updateField('sessionWindow', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#386641]"
                >
                  <option value="1:00 AM–4:00 AM">1:00 AM–4:00 AM (London)</option>
                  <option value="8:00 AM–11:00 AM">8:00 AM–11:00 AM (NY Open)</option>
                  <option value="Outside Window">Outside Window</option>
                </select>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Direction</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateField('direction', 'Long')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.direction === 'Long'
                        ? 'text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={{
                      backgroundColor: form.direction === 'Long' ? '#386641' : 'transparent',
                    }}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('direction', 'Short')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.direction === 'Short'
                        ? 'text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={{
                      backgroundColor: form.direction === 'Short' ? '#BC4749' : 'transparent',
                    }}
                  >
                    Short
                  </button>
                </div>
              </div>

              {/* Zone Badge Anchor */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Zone Reaction Anchor
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'Support (#386641)', short: '#386641 Sup', dot: '#386641' },
                    { id: 'Resistance (#BC4749)', short: '#BC4749 Res', dot: '#BC4749' },
                    { id: 'No Zone', short: 'None', dot: '#94a3b8' },
                  ].map((z) => {
                    const active = form.zoneInteraction === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => updateField('zoneInteraction', z.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          active
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: z.dot }}
                        />
                        <span className="truncate">{z.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* SECTION 2: PRICES & P&L */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <DollarSign size={14} className="text-slate-400" />
              Section 2: Prices & P&L
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2742.5"
                  value={form.entryPrice}
                  onChange={(e) => updateField('entryPrice', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2738.5"
                  value={form.stopLoss}
                  onChange={(e) => updateField('stopLoss', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2751.3"
                  value={form.exitPrice}
                  onChange={(e) => updateField('exitPrice', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Net P&L ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="427.60"
                  value={form.netPnl}
                  onChange={(e) => updateField('netPnl', e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  R-Multiple *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2.14"
                  value={form.rMultiple}
                  onChange={(e) => updateField('rMultiple', e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* SECTION 3: SIMPLIFIED CHECKLIST & LEAKS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-slate-400" />
                Section 3: Simplified Strategy Checklist & Leaks
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">14-Rule Score:</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-white"
                  style={{
                    backgroundColor:
                      complianceGrade === 'A'
                        ? '#386641'
                        : complianceGrade === 'B'
                        ? '#ca8a04'
                        : '#BC4749',
                  }}
                >
                  {form.rulesCount}/14 ({compliancePct}% • Grade {complianceGrade})
                </span>
              </div>
            </div>

            {/* 3 Quick Pillar Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CORE_3_PILLARS.map((p) => {
                const checked = form.pillars[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePillar(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      checked
                        ? 'bg-[#386641]/5 border-[#386641] text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 text-white"
                      style={{
                        backgroundColor: checked ? '#386641' : '#cbd5e1',
                      }}
                    >
                      {checked && <Check size={12} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{p.title}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {p.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine-tune 14-Rule Compliance Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-semibold text-slate-700">
                  Exact 14-Rule Compliance Slider:
                </span>{' '}
                <span className="text-slate-500">
                  Adjust if specific sub-rules were missed ({form.rulesCount} of 14 rules followed)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                value={form.rulesCount}
                onChange={(e) => updateField('rulesCount', Number(e.target.value))}
                className="w-full sm:w-48 accent-[#386641] cursor-pointer"
              />
            </div>

            {/* Simple Behavioral Leak Tag Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Execution & Behavioral Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_LEAK_OPTIONS.map((tag) => {
                  const isCleanChip = tag === 'Clean';
                  const selected = isCleanChip
                    ? form.leakTags.length === 0
                    : form.leakTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? isCleanChip
                            ? 'bg-[#386641]/10 text-[#386641] border-[#386641]'
                            : 'bg-[#BC4749]/10 text-[#BC4749] border-[#BC4749]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note & Chart URL in a compact 2-column row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <ExternalLink size={12} /> TradingView Chart Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.tradingview.com/x/..."
                  value={form.tradingViewUrl}
                  onChange={(e) => updateField('tradingViewUrl', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Quick Execution Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Clean #386641 bounce on 15m candle close..."
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#386641]"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              {initialTrade ? 'Save Changes' : 'Log Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
