import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Star,
  Check,
  Clock,
} from 'lucide-react';
import {
  CONTRACTS,
  LIQUIDITY_WINDOWS,
  FEELING_OPTIONS,
  PRE_TRADE_CHECKLIST_ITEMS,
  MARKET_CONDITION_OPTIONS,
  SELF_GRADING_QUESTIONS,
} from '../constants/viperConstants';
import { useViper } from '../context/ViperContext';
import {
  resolveLiquidityWindowFromTime24ET,
  formatDateUS12hEST,
} from '../utils/ninjaTraderCsvParser';
import { formatUSD } from '../utils/viperAnalytics';

/**
 * Converts a 24h time string ("09:04") to 12h components ({ hour12: "09", minute: "04", ampm: "AM" })
 */
function parse24hTo12hParts(time24 = '09:04') {
  const parts = String(time24 || '09:04').split(':');
  const h24 = parseInt(parts[0], 10);
  const min = parts[1] ? String(parts[1]).padStart(2, '0') : '00';
  if (Number.isNaN(h24)) {
    return { hour12: '09', minute: '04', ampm: 'AM' };
  }
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = String(h24 % 12 || 12).padStart(2, '0');
  return { hour12: h12, minute: min, ampm };
}

/**
 * Converts 12h components back to 24h "HH:mm"
 */
function convert12hPartsTo24h(hour12, minute, ampm) {
  let h = parseInt(hour12, 10) || 12;
  const m = String(Math.min(59, Math.max(0, parseInt(minute, 10) || 0))).padStart(
    2,
    '0'
  );
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export default function TradeLogModal({ isOpen, onClose, editTrade = null }) {
  const { addOrUpdateTrade } = useViper();

  const [contract, setContract] = useState('MGCZ6');
  const [direction, setDirection] = useState('Long');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState('2026-11-04');
  const [hour12, setHour12] = useState('09');
  const [minute, setMinute] = useState('04');
  const [ampm, setAmpm] = useState('AM');
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);

  // Accordion state for Part 2 ("More details")
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Part 2 fields
  const [tagInput, setTagInput] = useState('');
  const [customTags, setCustomTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [chartUrl, setChartUrl] = useState('');
  const [feelings, setFeelings] = useState([]);
  const [preTradeChecklist, setPreTradeChecklist] = useState({
    inPlan: false,
    waitedConfirmation: false,
    withinRiskLimit: false,
    rewardWorthRisk: false,
  });
  const [marketConditions, setMarketConditions] = useState([]);
  const [selfGrading, setSelfGrading] = useState({
    followPlan: 0,
    entryTiming: 0,
    exitManagement: 0,
    positionSize: 0,
    stayedCalm: 0,
  });
  const [executionGrade, setExecutionGrade] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (editTrade) {
      setContract(editTrade.contract || 'MGCZ6');
      setDirection(editTrade.direction || 'Long');
      setEntryPrice(
        editTrade.entryPrice !== undefined && editTrade.entryPrice !== null
          ? String(editTrade.entryPrice)
          : ''
      );
      setExitPrice(
        editTrade.exitPrice !== undefined && editTrade.exitPrice !== null
          ? String(editTrade.exitPrice)
          : ''
      );
      setQuantity(editTrade.quantity || 1);
      setDate(editTrade.date || '2026-11-04');

      const parsedTime = parse24hTo12hParts(editTrade.time || '09:04');
      setHour12(parsedTime.hour12);
      setMinute(parsedTime.minute);
      setAmpm(parsedTime.ampm);

      setCustomTags(
        Array.isArray(editTrade.customTags) ? editTrade.customTags : []
      );
      setNotes(editTrade.notes || '');
      setChartUrl(editTrade.chartUrl || '');
      setFeelings(Array.isArray(editTrade.feelings) ? editTrade.feelings : []);
      setPreTradeChecklist(
        editTrade.preTradeChecklist || {
          inPlan: false,
          waitedConfirmation: false,
          withinRiskLimit: false,
          rewardWorthRisk: false,
        }
      );
      setMarketConditions(
        Array.isArray(editTrade.marketConditions)
          ? editTrade.marketConditions
          : []
      );
      setSelfGrading(
        editTrade.selfGrading || {
          followPlan: 0,
          entryTiming: 0,
          exitManagement: 0,
          positionSize: 0,
          stayedCalm: 0,
        }
      );
      setExecutionGrade(Number(editTrade.executionGrade) || 0);
      setIsMoreOpen(true);
    } else {
      setContract('MGCZ6');
      setDirection('Long');
      setEntryPrice('');
      setExitPrice('');
      setQuantity(1);
      setDate('2026-11-04');
      setHour12('09');
      setMinute('04');
      setAmpm('AM');
      setTagInput('');
      setCustomTags([]);
      setNotes('');
      setChartUrl('');
      setFeelings([]);
      setPreTradeChecklist({
        inPlan: false,
        waitedConfirmation: false,
        withinRiskLimit: false,
        rewardWorthRisk: false,
      });
      setMarketConditions([]);
      setSelfGrading({
        followPlan: 0,
        entryTiming: 0,
        exitManagement: 0,
        positionSize: 0,
        stayedCalm: 0,
      });
      setExecutionGrade(0);
      setIsMoreOpen(false);
    }
    setShowDatePickerPopover(false);
  }, [editTrade, isOpen]);

  const time24 = useMemo(
    () => convert12hPartsTo24h(hour12, minute, ampm),
    [hour12, minute, ampm]
  );

  const detectedWindow = useMemo(
    () => resolveLiquidityWindowFromTime24ET(time24),
    [time24]
  );

  const formattedDisplayDateEST = useMemo(
    () => formatDateUS12hEST(date, time24, false),
    [date, time24]
  );

  const windowBadgeMeta = useMemo(() => {
    if (detectedWindow === LIQUIDITY_WINDOWS.ASIAN_LONDON) {
      return {
        label: '2–5 AM EST (London Liquidity Window)',
        classes:
          'bg-sky-500/15 text-sky-300 border-sky-500/30',
      };
    }
    if (detectedWindow === LIQUIDITY_WINDOWS.NY_OPEN) {
      return {
        label: '9–12 PM EST (NY Opening Window)',
        classes:
          'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    }
    return {
      label: 'Outside Window',
      classes: 'bg-slate-800/80 text-[#94A3B8] border-slate-700/70',
    };
  }, [detectedWindow]);

  // Live P&L preview from Entry & Exit price
  const estimatedNetPnl = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = Math.max(1, Number(quantity) || 1);
    if (Number.isNaN(entry) || Number.isNaN(exit) || entry <= 0 || exit <= 0) {
      return null;
    }
    const contractMeta =
      CONTRACTS.find((c) => c.id === contract) || CONTRACTS[0];
    const diff = direction === 'Short' ? entry - exit : exit - entry;
    return Math.round(diff * qty * (contractMeta.multiplier || 10) * 100) / 100;
  }, [entryPrice, exitPrice, quantity, contract, direction]);

  const checkedCount = useMemo(() => {
    return Object.values(preTradeChecklist).filter(Boolean).length;
  }, [preTradeChecklist]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!customTags.includes(trimmed)) {
      setCustomTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setCustomTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const toggleFeeling = (id) => {
    setFeelings((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleChecklist = (id) => {
    setPreTradeChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleMarketCondition = (id) => {
    setMarketConditions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelfGradeChange = (questionId, rating) => {
    setSelfGrading((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === rating ? 0 : rating,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addOrUpdateTrade({
      id: editTrade?.id,
      contract,
      direction,
      entryPrice: parseFloat(entryPrice) || 0,
      exitPrice: parseFloat(exitPrice) || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      date,
      time: time24,
      sessionWindow: detectedWindow,
      netPnl:
        estimatedNetPnl !== null
          ? estimatedNetPnl
          : editTrade?.netPnl !== undefined
          ? editTrade.netPnl
          : 0,
      customTags,
      notes,
      chartUrl,
      feelings,
      preTradeChecklist,
      marketConditions,
      selfGrading,
      executionGrade,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[600px] bg-[#121721] border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-7 pt-7 pb-4 flex items-start justify-between shrink-0">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
              {editTrade ? 'UPDATE JOURNAL ENTRY' : 'NEW JOURNAL ENTRY'}
            </span>
            <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1 tracking-tight">
              {editTrade ? 'Edit trade' : 'Log a trade'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="px-7 pb-7 overflow-y-auto space-y-5 flex-1"
        >
          {/* PART 1: CORE TRADE DETAILS (2-Column Grid Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CONTRACT */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                CONTRACT
              </label>
              <div className="relative">
                <select
                  value={contract}
                  onChange={(e) => setContract(e.target.value)}
                  className="w-full appearance-none bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3.5 pr-10 text-[15px] font-medium text-[#F8FAFC] outline-none transition-colors cursor-pointer"
                >
                  {CONTRACTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
              </div>
            </div>

            {/* DIRECTION (Segmented 2-button toggle) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                DIRECTION
              </label>
              <div className="grid grid-cols-2 bg-[#0A0D12] border border-slate-800/90 rounded-2xl overflow-hidden p-1 h-[52px]">
                <button
                  type="button"
                  onClick={() => setDirection('Long')}
                  className={`rounded-xl text-[15px] font-semibold transition-all cursor-pointer ${
                    direction === 'Long'
                      ? 'bg-[#10B981] text-[#FFFFFF] shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('Short')}
                  className={`rounded-xl text-[15px] font-semibold transition-all cursor-pointer ${
                    direction === 'Short'
                      ? 'bg-[#EF4444] text-[#FFFFFF] shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>

            {/* ENTRY PRICE */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                ENTRY PRICE
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3.5 text-[15px] font-mono text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none transition-colors"
              />
            </div>

            {/* EXIT PRICE */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  EXIT PRICE
                </label>
                {estimatedNetPnl !== null && (
                  <span
                    className={`text-xs font-mono font-bold ${
                      estimatedNetPnl >= 0
                        ? 'text-[#10B981]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    Est. {formatUSD(estimatedNetPnl)}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3.5 text-[15px] font-mono text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none transition-colors"
              />
            </div>

            {/* CONTRACTS (Lots) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                CONTRACTS
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3.5 text-[15px] font-mono text-[#F8FAFC] outline-none transition-colors"
              />
            </div>

            {/* DATE & TIME (EST) */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                DATE &amp; TIME (EST)
              </label>
              <button
                type="button"
                onClick={() =>
                  setShowDatePickerPopover((prev) => !prev)
                }
                className="w-full flex items-center justify-between bg-[#0A0D12] border border-slate-800/90 hover:border-slate-700 focus:border-[#10B981] rounded-2xl px-4 py-3.5 text-[15px] font-mono text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <span>{formattedDisplayDateEST}</span>
                <Calendar size={16} className="text-[#94A3B8]" />
              </button>

              {/* Auto-detected Liquidity Window Pill beneath Date & Time */}
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${windowBadgeMeta.classes}`}
                >
                  <Clock size={11} />
                  <span>{windowBadgeMeta.label}</span>
                </span>
              </div>

              {/* 12-Hour EST Date & Time Picker Popover */}
              {showDatePickerPopover && (
                <div className="mt-2 p-3.5 rounded-2xl bg-[#0A0D12] border border-slate-700/80 shadow-xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">
                      Execution Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#121721] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-[#F8FAFC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">
                      12-Hour Time (EST)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={hour12}
                        onChange={(e) => setHour12(e.target.value)}
                        className="bg-[#121721] border border-slate-800 rounded-xl px-2.5 py-2 text-sm font-mono text-[#F8FAFC] outline-none"
                      >
                        {Array.from({ length: 12 }, (_, idx) => {
                          const val = String(idx + 1).padStart(2, '0');
                          return (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        className="bg-[#121721] border border-slate-800 rounded-xl px-2.5 py-2 text-sm font-mono text-[#F8FAFC] outline-none"
                      >
                        {Array.from({ length: 60 }, (_, idx) => {
                          const val = String(idx).padStart(2, '0');
                          return (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={ampm}
                        onChange={(e) => setAmpm(e.target.value)}
                        className="bg-[#121721] border border-slate-800 rounded-xl px-2.5 py-2 text-sm font-mono font-bold text-[#10B981] outline-none"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLLAPSIBLE "More details ⌄" ACCORDION BUTTON */}
          <div>
            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className="w-full flex items-center justify-between bg-[#0A0D12] hover:bg-slate-900/90 border border-slate-800/90 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <span>More details</span>
              {isMoreOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* PART 2: EXPANDABLE BEHAVIORAL & GRADING SECTION */}
          {isMoreOpen && (
            <div className="space-y-6 pt-2 border-t border-slate-800/60">
              {/* 1. TAGS */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  TAGS
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3 text-[15px] text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="w-12 h-12 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[#10B981] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {customTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {customTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-[#10B981] border border-emerald-500/30"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-[#F8FAFC] cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. NOTES */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  NOTES
                </label>
                <textarea
                  rows={3}
                  placeholder="Observations, market context, lessons learned..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3.5 text-[15px] text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none transition-colors resize-none"
                />
              </div>

              {/* 3. CHART URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  CHART URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={chartUrl}
                  onChange={(e) => setChartUrl(e.target.value)}
                  className="w-full bg-[#0A0D12] border border-slate-800/90 focus:border-[#10B981] rounded-2xl px-4 py-3 text-[15px] text-[#F8FAFC] placeholder-[#94A3B8]/50 outline-none transition-colors"
                />
              </div>

              {/* 4. HOW ARE YOU FEELING? (Selectable Emoji Pills) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2.5">
                  HOW ARE YOU FEELING?
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEELING_OPTIONS.map((item) => {
                    const isSelected = feelings.includes(item.id);
                    const isRevengePill = item.id === 'Revenge';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleFeeling(item.id)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? isRevengePill
                              ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50 shadow-xs'
                              : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50 shadow-xs'
                            : 'bg-[#0A0D12] text-[#F8FAFC] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. PRE-TRADE CHECKLIST (Interactive Checkboxes with 0/4 checked counter) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2.5">
                  PRE-TRADE CHECKLIST
                </label>
                <div className="space-y-2.5">
                  {PRE_TRADE_CHECKLIST_ITEMS.map((item) => {
                    const isChecked = Boolean(preTradeChecklist[item.id]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-950/20 border-[#10B981]/40 text-[#F8FAFC]'
                            : 'bg-[#0A0D12] border-slate-800/90 text-[#F8FAFC] hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-[#10B981] border-[#10B981] text-[#0A0D12]'
                              : 'border-slate-600 bg-transparent'
                          }`}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-[15px] font-medium">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs font-medium text-[#94A3B8]">
                  {checkedCount}/4 checked
                </div>
              </div>

              {/* 6. MARKET CONDITIONS (Selectable Pills) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2.5">
                  MARKET CONDITIONS
                </label>
                <div className="flex flex-wrap gap-2">
                  {MARKET_CONDITION_OPTIONS.map((item) => {
                    const isSelected = marketConditions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMarketCondition(item.id)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50 shadow-xs'
                            : 'bg-[#0A0D12] text-[#F8FAFC] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. POST-TRADE SELF-GRADING (1 to 5 Numbered Buttons per Row) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2.5">
                  POST-TRADE SELF-GRADING
                </label>
                <div className="space-y-2.5">
                  {SELF_GRADING_QUESTIONS.map((q) => {
                    const currentVal = selfGrading[q.id] || 0;
                    return (
                      <div
                        key={q.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3.5 rounded-2xl bg-[#0A0D12] border border-slate-800/90"
                      >
                        <span className="text-[15px] font-medium text-[#F8FAFC]">
                          {q.question}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((num) => {
                            const active = currentVal === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() =>
                                  handleSelfGradeChange(q.id, num)
                                }
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#10B981] text-[#0A0D12] shadow-xs'
                                    : 'bg-slate-800/80 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-700/80'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 8. EXECUTION GRADE (Interactive 5-Star rating selector) */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Execution Grade
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (hoverStar || executionGrade) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() =>
                          setExecutionGrade((prev) =>
                            prev === star ? 0 : star
                          )
                        }
                        className="p-1 text-[#94A3B8] hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={26}
                          className={
                            filled
                              ? 'text-[#10B981] fill-[#10B981]'
                              : 'text-slate-600'
                          }
                        />
                      </button>
                    );
                  })}
                  {executionGrade > 0 && (
                    <span className="ml-2 text-xs font-mono font-semibold text-[#10B981]">
                      {executionGrade}/5 ★
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 9. MODAL FOOTER: Full-width primary Add Trade button + Cancel button */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#10B981] hover:bg-emerald-400 text-[#0A0D12] font-bold text-[15px] shadow-md transition-all cursor-pointer"
            >
              {editTrade ? 'Save Changes' : 'Add Trade'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3.5 px-6 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-[#F8FAFC] font-semibold text-[15px] border border-slate-700/70 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
