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
import {
  formatTime12hEST,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';

const CORE_3_PILLARS = [
  {
    id: 'pillar_window',
    title: '1. Liquidity Session Aligned',
    subtitle: 'Executed during planned EST market liquidity hours',
  },
  {
    id: 'pillar_structure',
    title: '2. Structural Candle Close Confirmed',
    subtitle: 'Confirmed break and candle body close before entry',
  },
  {
    id: 'pillar_risk',
    title: '3. Risk & 15m Cooldown Respected',
    subtitle: 'Within $600 daily loss cap and ≥ 15m gap after previous exit',
  },
];

const QUICK_LEAK_OPTIONS = [
  'Clean',
  REVENGE_GAP_LABEL,
  'FOMO Entry',
  'Early Exit',
  'Moved Stop Loss',
  'Oversizing',
  'Session Outside Window',
];

export default function TradeLogModal({ isOpen, onClose, initialTrade = null }) {
  const { addOrUpdateTrade } = useViper();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '09:30',
    exitTime24: '09:45',
    sessionWindow: '8:00 AM–11:00 AM',
    contract: 'MGCZ6',
    quantity: 5,
    accountId: 'LFE05072050930002',
    accountType: 'Lucid Flex',
    direction: 'Long',
    entryPrice: '',
    stopLoss: '',
    exitPrice: '',
    netPnl: '',
    rMultiple: '',
    pillars: {
      pillar_window: true,
      pillar_structure: true,
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
        time: (initialTrade.time || '09:30').slice(0, 5),
        exitTime24: (
          initialTrade.exitTime24 ||
          initialTrade.time ||
          '09:45'
        ).slice(0, 5),
        sessionWindow: initialTrade.sessionWindow || '8:00 AM–11:00 AM',
        contract: initialTrade.contract || 'MGCZ6',
        quantity: initialTrade.quantity || 5,
        accountId: initialTrade.accountId || 'LFE05072050930002',
        accountType: initialTrade.accountType || 'Lucid Flex',
        direction: initialTrade.direction || 'Long',
        entryPrice: initialTrade.entryPrice ?? '',
        stopLoss: initialTrade.stopLoss ?? '',
        exitPrice: initialTrade.exitPrice ?? '',
        netPnl: initialTrade.netPnl ?? '',
        rMultiple: initialTrade.rMultiple ?? '',
        pillars: initialTrade.pillars || {
          pillar_window: savedCount >= 10,
          pillar_structure: savedCount >= 12,
          pillar_risk: savedCount >= 8,
        },
        rulesCount: savedCount,
        leakTags: Array.isArray(initialTrade.leakTags)
          ? initialTrade.leakTags
          : [],
        tradingViewUrl: initialTrade.tradingViewUrl || '',
        notes: initialTrade.notes || '',
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        time: '09:30',
        exitTime24: '09:45',
        sessionWindow: '8:00 AM–11:00 AM',
        contract: 'MGCZ6',
        quantity: 5,
        accountId: 'LFE05072050930002',
        accountType: 'Lucid Flex',
        direction: 'Long',
        entryPrice: '',
        stopLoss: '',
        exitPrice: '',
        netPnl: '',
        rMultiple: '',
        pillars: {
          pillar_window: true,
          pillar_structure: true,
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
      const nextPillars = {
        ...prev.pillars,
        [pillarId]: !prev.pillars[pillarId],
      };
      const activeCount = Object.values(nextPillars).filter(Boolean).length;
      const mappedRulesCount =
        activeCount === 3
          ? 14
          : activeCount === 2
          ? 10
          : activeCount === 1
          ? 5
          : 0;
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

  const previewEntryEST = formatTime12hEST(form.time, false);
  const previewExitEST = formatTime12hEST(form.exitTime24 || form.time, false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rulesChecked = DEFAULT_14_RULES.slice(0, form.rulesCount).map(
      (r) => r.id
    );
    const netVal = parseFloat(form.netPnl) || 0;
    const rVal = parseFloat(form.rMultiple) || 0;

    addOrUpdateTrade({
      id: initialTrade?.id,
      date: form.date,
      time: form.time,
      exitTime24: form.exitTime24 || form.time,
      timeEST: previewEntryEST,
      exitTimeEST: previewExitEST,
      sessionWindow: form.sessionWindow,
      contract: form.contract,
      productDesc: form.contract.startsWith('MGC')
        ? 'E-Micro Gold'
        : 'Gold Futures',
      lotType: form.contract.startsWith('M') ? 'Micro' : 'Mini/Std',
      quantity: Math.max(1, Number(form.quantity) || 1),
      accountId:
        form.accountType === 'Lucid Flex'
          ? 'LFE05072050930002'
          : 'APEX-25093001',
      accountType: form.accountType,
      direction: form.direction,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#111620] text-[#FFFFFF] rounded-xl border border-slate-800/60 shadow-2xl overflow-hidden my-auto">
        {/* Lucid Modal Header */}
        <div className="px-6 py-5 bg-[#090C10] border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-600 text-[#FFFFFF]">
                FAST LOG
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[#FFFFFF]">
                {initialTrade
                  ? 'Edit Futures Execution'
                  : 'Log Futures Execution'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
              12-Hour EST Timestamp:{' '}
              <span className="font-mono text-emerald-400">
                {previewEntryEST} → {previewExitEST}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[82vh] overflow-y-auto"
        >
          {/* SECTION 1: CORE TRADE INFO */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] flex items-center gap-2">
              <Clock size={15} className="text-emerald-400" />
              Section 1: Core Trade Info (12-Hour EST AM/PM)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#FFFFFF] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Entry Fill Time (EST) */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Entry Time →{' '}
                  <span className="text-emerald-400 font-mono">
                    {previewEntryEST}
                  </span>
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  required
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#FFFFFF] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Exit Fill Time (EST) */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Exit Time →{' '}
                  <span className="text-emerald-400 font-mono">
                    {previewExitEST}
                  </span>
                </label>
                <input
                  type="time"
                  value={form.exitTime24}
                  onChange={(e) => updateField('exitTime24', e.target.value)}
                  required
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#FFFFFF] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Account Selector */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Prop Account ($25k)
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
                  {['Lucid Flex', 'Apex'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => updateField('accountType', acc)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        form.accountType === acc
                          ? 'bg-[#111620] text-[#FFFFFF] shadow-xs border border-slate-700/70'
                          : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contract + Direction + Session Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Contract Selector */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Contract ID
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
                  {['MGCZ6', 'GC'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateField('contract', c)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        form.contract === c
                          ? 'bg-[#111620] text-[#FFFFFF] shadow-xs border border-slate-700/70'
                          : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean LONG / SHORT Direction Selector */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Direction
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#090C10] p-1 rounded-xl border border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => updateField('direction', 'Long')}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      form.direction === 'Long'
                        ? 'bg-emerald-600 text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('direction', 'Short')}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      form.direction === 'Short'
                        ? 'bg-rose-600 text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              {/* Session Window */}
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  EST Session Window
                </label>
                <select
                  value={form.sessionWindow}
                  onChange={(e) => updateField('sessionWindow', e.target.value)}
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#FFFFFF] focus:outline-none focus:border-emerald-500"
                >
                  <option value="1:00 AM–4:00 AM" className="bg-[#111620]">
                    01:00 AM–04:00 AM EST (London)
                  </option>
                  <option value="8:00 AM–11:00 AM" className="bg-[#111620]">
                    08:00 AM–11:00 AM EST (NY Open)
                  </option>
                  <option value="Outside Window" className="bg-[#111620]">
                    Extended / Afternoon Hours EST
                  </option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* SECTION 2: PRICES, CONTRACT LOTS & P&L */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] flex items-center gap-2">
              <DollarSign size={15} className="text-emerald-400" />
              Section 2: Contract Lots, Execution Prices & P&L
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#FFFFFF] mb-1.5">
                  Contract Lots *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                  required
                  className="w-full bg-[#090C10] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#FFFFFF] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="3916.3"
                  value={form.entryPrice}
                  onChange={(e) => updateField('entryPrice', e.target.value)}
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="3918.3"
                  value={form.stopLoss}
                  onChange={(e) => updateField('stopLoss', e.target.value)}
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="3913.7"
                  value={form.exitPrice}
                  onChange={(e) => updateField('exitPrice', e.target.value)}
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFFFFF] mb-1.5">
                  Net P&L ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="280.00"
                  value={form.netPnl}
                  onChange={(e) => updateField('netPnl', e.target.value)}
                  required
                  className="w-full bg-[#090C10] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFFFFF] mb-1.5">
                  R-Multiple *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1.80"
                  value={form.rMultiple}
                  onChange={(e) => updateField('rMultiple', e.target.value)}
                  required
                  className="w-full bg-[#090C10] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* SECTION 3: SIMPLIFIED CHECKLIST & LEAKS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Section 3: Strategy Checklist & Behavioral Leak Guard
              </h3>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-[#8A99AD]">
                  14-Rule Score:
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold text-[#FFFFFF] ${
                    complianceGrade === 'A'
                      ? 'bg-emerald-600'
                      : complianceGrade === 'B'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
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
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      checked
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-[#FFFFFF]'
                        : 'bg-[#090C10] border-slate-800/60 text-[#8A99AD] hover:bg-slate-800/80'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 text-[#FFFFFF] ${
                        checked ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    >
                      {checked && <Check size={13} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#FFFFFF]">
                        {p.title}
                      </div>
                      <div className="text-xs text-[#8A99AD] leading-snug mt-1">
                        {p.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine-tune 14-Rule Compliance Slider */}
            <div className="bg-[#090C10] border border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-[#FFFFFF]">
                  14-Rule Compliance Slider:
                </span>{' '}
                <span className="text-[#8A99AD]">
                  Adjust if specific sub-rules were missed ({form.rulesCount} of 14 followed)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                value={form.rulesCount}
                onChange={(e) => updateField('rulesCount', Number(e.target.value))}
                className="w-full sm:w-56 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Simple Behavioral Leak Tag Selector */}
            <div>
              <label className="block text-xs font-medium text-[#8A99AD] mb-2">
                Behavioral Leak Tags (15-Minute Revenge Trading Guard Auto-Checks Consecutive Fills)
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
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                        selected
                          ? isCleanChip
                            ? 'bg-emerald-600 text-[#FFFFFF] border-transparent shadow-xs'
                            : 'bg-rose-600 text-[#FFFFFF] border-transparent shadow-xs'
                          : 'bg-[#090C10] text-[#8A99AD] border-slate-800/60 hover:text-[#FFFFFF] hover:bg-slate-800/80'
                      }`}
                    >
                      {tag === REVENGE_GAP_LABEL ? `🚨 ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note & Chart URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5 flex items-center gap-1.5">
                  <ExternalLink size={13} /> TradingView Chart Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.tradingview.com/x/..."
                  value={form.tradingViewUrl}
                  onChange={(e) => updateField('tradingViewUrl', e.target.value)}
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8A99AD] mb-1.5">
                  Quick Execution Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Clean structural candle close..."
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full bg-[#090C10] border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-[#FFFFFF] placeholder-[#8A99AD]/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer"
            >
              {initialTrade ? 'Save Changes' : 'Log Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
