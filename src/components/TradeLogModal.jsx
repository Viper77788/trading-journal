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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#131B2E] text-[#F8FAFC] rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden my-auto">
        {/* Dark Modal Header */}
        <div className="px-6 py-5 bg-[#0B0F17] border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="px-2.5 py-1 rounded-md text-sm font-mono font-bold text-[#F8FAFC]"
                style={{ backgroundColor: '#386641' }}
              >
                FAST LOG
              </span>
              <h2 className="text-xl font-bold text-[#F8FAFC]">
                {initialTrade ? 'Edit Futures Execution' : 'Log Gold Futures Trade'}
              </h2>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Streamlined 30-second execution logger • GC & MGCZ6
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* SECTION 1: CORE TRADE INFO */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              Section 1: Core Trade Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC] focus:outline-none focus:border-[#386641]"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Time (NY)</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC] focus:outline-none focus:border-[#386641]"
                />
              </div>

              {/* Contract Pill Selector */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Contract</label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#0B0F17] p-1 rounded-xl border border-slate-800/80">
                  {['MGCZ6', 'GC'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateField('contract', c)}
                      className={`py-2 rounded-lg text-sm font-mono font-bold transition-all ${
                        form.contract === c
                          ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Selector */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Account</label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#0B0F17] p-1 rounded-xl border border-slate-800/80">
                  {['Lucid Flex', 'Apex'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => updateField('accountType', acc)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        form.accountType === acc
                          ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Session Window + Direction + Zone Anchor Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Session Selector */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Liquidity Session Window
                </label>
                <select
                  value={form.sessionWindow}
                  onChange={(e) => updateField('sessionWindow', e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#F8FAFC] focus:outline-none focus:border-[#386641]"
                >
                  <option value="1:00 AM–4:00 AM" className="bg-[#131B2E]">1:00 AM–4:00 AM (London)</option>
                  <option value="8:00 AM–11:00 AM" className="bg-[#131B2E]">8:00 AM–11:00 AM (NY Open)</option>
                  <option value="Outside Window" className="bg-[#131B2E]">Outside Window</option>
                </select>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Direction</label>
                <div className="grid grid-cols-2 gap-2 bg-[#0B0F17] p-1 rounded-xl border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => updateField('direction', 'Long')}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      form.direction === 'Long'
                        ? 'text-[#F8FAFC] shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      form.direction === 'Short'
                        ? 'text-[#F8FAFC] shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Zone Reaction Anchor
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#0B0F17] p-1 rounded-xl border border-slate-800/80">
                  {[
                    { id: 'Support (#386641)', short: '#386641', dot: '#386641' },
                    { id: 'Resistance (#BC4749)', short: '#BC4749', dot: '#BC4749' },
                    { id: 'No Zone', short: 'None', dot: '#94A3B8' },
                  ].map((z) => {
                    const active = form.zoneInteraction === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => updateField('zoneInteraction', z.id)}
                        className={`py-2 px-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          active
                            ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700'
                            : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
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

          <hr className="border-slate-800/80" />

          {/* SECTION 2: PRICES & P&L */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              Section 2: Prices & P&L
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2742.5"
                  value={form.entryPrice}
                  onChange={(e) => updateField('entryPrice', e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2738.5"
                  value={form.stopLoss}
                  onChange={(e) => updateField('stopLoss', e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2751.3"
                  value={form.exitPrice}
                  onChange={(e) => updateField('exitPrice', e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F8FAFC] mb-1.5">
                  Net P&L ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="427.60"
                  value={form.netPnl}
                  onChange={(e) => updateField('netPnl', e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F8FAFC] mb-1.5">
                  R-Multiple *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2.14"
                  value={form.rMultiple}
                  onChange={(e) => updateField('rMultiple', e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800/80" />

          {/* SECTION 3: SIMPLIFIED CHECKLIST & LEAKS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Section 3: Simplified Strategy Checklist & Leaks
              </h3>
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-[#94A3B8]">14-Rule Score:</span>
                <span
                  className="px-2.5 py-1 rounded-md text-sm font-mono font-bold text-[#F8FAFC]"
                  style={{
                    backgroundColor:
                      complianceGrade === 'A'
                        ? '#386641'
                        : complianceGrade === 'B'
                        ? '#b45309'
                        : '#BC4749',
                  }}
                >
                  {form.rulesCount}/14 ({compliancePct}% · Grade {complianceGrade})
                </span>
              </div>
            </div>

            {/* 3 Quick Pillar Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CORE_3_PILLARS.map((p) => {
                const checked = form.pillars[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePillar(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      checked
                        ? 'bg-[#386641]/20 border-[#386641] text-[#F8FAFC]'
                        : 'bg-[#0B0F17] border-slate-800/80 text-[#94A3B8]'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 text-[#F8FAFC]"
                      style={{
                        backgroundColor: checked ? '#386641' : '#334155',
                      }}
                    >
                      {checked && <Check size={14} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F8FAFC]">{p.title}</div>
                      <div className="text-sm text-[#94A3B8] leading-snug mt-1">
                        {p.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine-tune 14-Rule Compliance Slider */}
            <div className="bg-[#0B0F17] border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm">
                <span className="font-semibold text-[#F8FAFC]">
                  Exact 14-Rule Compliance Slider:
                </span>{' '}
                <span className="text-[#94A3B8]">
                  Adjust if specific sub-rules were missed ({form.rulesCount} of 14 rules followed)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                value={form.rulesCount}
                onChange={(e) => updateField('rulesCount', Number(e.target.value))}
                className="w-full sm:w-56 accent-[#386641] cursor-pointer"
              />
            </div>

            {/* Simple Behavioral Leak Tag Selector */}
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Execution & Behavioral Tags
              </label>
              <div className="flex flex-wrap gap-2.5">
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
                      className={`px-3.5 py-2 rounded-md text-sm font-semibold border transition-all ${
                        selected
                          ? 'text-[#F8FAFC] border-transparent shadow-sm'
                          : 'bg-[#0B0F17] text-[#94A3B8] border-slate-800/80 hover:text-[#F8FAFC]'
                      }`}
                      style={{
                        backgroundColor: selected
                          ? isCleanChip
                            ? '#386641'
                            : '#BC4749'
                          : undefined,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note & Chart URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                  <ExternalLink size={14} /> TradingView Chart Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.tradingview.com/x/..."
                  value={form.tradingViewUrl}
                  onChange={(e) => updateField('tradingViewUrl', e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  Quick Execution Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Clean #386641 bounce on 15m candle close..."
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#386641]"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#F8FAFC] shadow-sm transition-opacity hover:opacity-95"
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
