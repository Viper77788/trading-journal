import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Calendar,
  ChevronDown,
  Plus,
  Minus,
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

  // §7. Part 2 Accordion ("More details") — Default state: COLLAPSED
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

  // Validation errors & dirty tracking
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

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
      setIsMoreOpen(false);
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
    setErrors({});
    setIsDirty(false);
    setShowDatePickerPopover(false);
  }, [editTrade, isOpen]);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(
        'You have unsaved changes in this trade entry. Discard changes?'
      );
      if (!ok) return;
    }
    onClose();
  }, [isDirty, onClose]);

  // Esc key handler (§7)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleRequestClose]);

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

  // §7. Auto liquidity-window pill under date field (green London / blue NY / grey Outside Window)
  const windowBadgeStyle = useMemo(() => {
    if (detectedWindow === LIQUIDITY_WINDOWS.ASIAN_LONDON) {
      return {
        label: '2:00–5:00 AM EST • London Window',
        bg: 'rgba(16, 185, 129, 0.15)',
        color: 'var(--green)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
      };
    }
    if (detectedWindow === LIQUIDITY_WINDOWS.NY_OPEN) {
      return {
        label: '9:00 AM–12:00 PM EST • NY Window',
        bg: 'rgba(59, 130, 246, 0.15)',
        color: '#60A5FA',
        border: '1px solid rgba(59, 130, 246, 0.4)',
      };
    }
    return {
      label: 'Outside Window',
      bg: 'var(--surface-2)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    };
  }, [detectedWindow]);

  // §7. Live P&L preview chip ("Estimated P&L: +$X.XX")
  const estimatedNetPnl = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = Math.max(1, Number(quantity) || 1);
    if (Number.isNaN(entry) || Number.isNaN(exit) || entry <= 0 || exit <= 0) {
      return 0;
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
      setIsDirty(true);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setCustomTags((prev) => prev.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  };

  const toggleFeeling = (id) => {
    setIsDirty(true);
    setFeelings((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleChecklist = (id) => {
    setIsDirty(true);
    setPreTradeChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleMarketCondition = (id) => {
    setIsDirty(true);
    setMarketConditions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelfGradeChange = (questionId, rating) => {
    setIsDirty(true);
    setSelfGrading((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === rating ? 0 : rating,
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const entryVal = parseFloat(entryPrice);
    const exitVal = parseFloat(exitPrice);
    const qtyVal = Number(quantity);

    if (Number.isNaN(entryVal) || entryVal <= 0) {
      nextErrors.entryPrice = 'Enter a valid entry price greater than 0.';
    }
    if (Number.isNaN(exitVal) || exitVal <= 0) {
      nextErrors.exitPrice = 'Enter a valid exit price greater than 0.';
    }
    if (Number.isNaN(qtyVal) || qtyVal < 1) {
      nextErrors.quantity = 'Contracts must be at least 1.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    addOrUpdateTrade({
      id: editTrade?.id,
      contract,
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      quantity: Math.max(1, Number(quantity) || 1),
      date,
      time: time24,
      sessionWindow: detectedWindow,
      netPnl: estimatedNetPnl,
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
    <div
      onClick={handleRequestClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(2, 6, 12, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="p-0 sm:p-4"
    >
      {/* §7. Modal Container: min(880px, 94vw) on desktop, full-screen sheet on mobile (<640px) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="viper-modal-animate w-screen h-screen max-h-screen rounded-none sm:w-[min(880px,94vw)] sm:h-auto sm:max-h-[90vh] sm:rounded-[20px]"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* §7. STICKY HEADER (padding 24px 32px desktop, 16px 20px mobile) */}
        <div
          className="px-5 py-4 sm:px-8 sm:py-6"
          style={{
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div className="eyebrow-green">
              {editTrade ? 'UPDATE JOURNAL ENTRY' : 'NEW JOURNAL ENTRY'}
            </div>
            <h2
              style={{
                marginTop: '4px',
                marginBottom: 0,
                fontSize: '26px',
                lineHeight: 1.2,
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              {editTrade ? 'Edit trade' : 'Log a trade'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Close modal"
            className="cursor-pointer transition-colors hover:bg-slate-800/70"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* §7. SCROLLABLE BODY (Only the body scrolls, padding 32px desktop / 20px mobile, section gap 28px) */}
        <form
          id="viper-log-trade-form"
          onSubmit={handleSubmit}
          className="p-5 sm:p-8"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* PART 1 — Core details (always visible), 2-column grid with 20px gap (1 col under 640px) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* CONTRACT */}
              <div style={{ minWidth: 0 }}>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  CONTRACT
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={contract}
                    onChange={(e) => {
                      setContract(e.target.value);
                      setIsDirty(true);
                    }}
                    className="viper-input"
                    style={{
                      appearance: 'none',
                      paddingRight: '40px',
                      cursor: 'pointer',
                    }}
                  >
                    {CONTRACTS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>

              {/* DIRECTION (segmented toggle: Long = solid green when active, Short = solid red when active; 48px high) */}
              <div style={{ minWidth: 0 }}>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  DIRECTION
                </label>
                <div
                  style={{
                    height: '48px',
                    padding: '4px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDirection('Long');
                      setIsDirty(true);
                    }}
                    style={{
                      borderRadius: '7px',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      backgroundColor:
                        direction === 'Long' ? 'var(--green)' : 'transparent',
                      color:
                        direction === 'Long' ? '#0A0D12' : 'var(--text-muted)',
                    }}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDirection('Short');
                      setIsDirty(true);
                    }}
                    style={{
                      borderRadius: '7px',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      backgroundColor:
                        direction === 'Short' ? 'var(--red)' : 'transparent',
                      color:
                        direction === 'Short' ? '#FFFFFF' : 'var(--text-muted)',
                    }}
                  >
                    Short
                  </button>
                </div>
              </div>

              {/* ENTRY PRICE */}
              <div style={{ minWidth: 0 }}>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  ENTRY PRICE
                </label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={entryPrice}
                  onChange={(e) => {
                    setEntryPrice(e.target.value);
                    setIsDirty(true);
                    if (errors.entryPrice) {
                      setErrors((prev) => ({ ...prev, entryPrice: null }));
                    }
                  }}
                  className="viper-input tabular-nums"
                  style={{
                    borderColor: errors.entryPrice
                      ? 'var(--red)'
                      : 'var(--border)',
                  }}
                />
                {errors.entryPrice && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      color: 'var(--red)',
                    }}
                  >
                    {errors.entryPrice}
                  </div>
                )}
              </div>

              {/* EXIT PRICE */}
              <div style={{ minWidth: 0 }}>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  EXIT PRICE
                </label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={exitPrice}
                  onChange={(e) => {
                    setExitPrice(e.target.value);
                    setIsDirty(true);
                    if (errors.exitPrice) {
                      setErrors((prev) => ({ ...prev, exitPrice: null }));
                    }
                  }}
                  className="viper-input tabular-nums"
                  style={{
                    borderColor: errors.exitPrice
                      ? 'var(--red)'
                      : 'var(--border)',
                  }}
                />
                {errors.exitPrice && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      color: 'var(--red)',
                    }}
                  >
                    {errors.exitPrice}
                  </div>
                )}
              </div>

              {/* CONTRACTS (number stepper with − / + buttons, default 1) */}
              <div style={{ minWidth: 0 }}>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  CONTRACTS
                </label>
                <div
                  style={{
                    height: '48px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'var(--surface-2)',
                    border: errors.quantity
                      ? '1px solid var(--red)'
                      : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((q) => Math.max(1, (Number(q) || 1) - 1));
                      setIsDirty(true);
                    }}
                    aria-label="Decrease contracts"
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                    style={{
                      width: '48px',
                      height: '100%',
                      border: 'none',
                      borderRight: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setIsDirty(true);
                    }}
                    className="tabular-nums"
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'center',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((q) => (Number(q) || 1) + 1);
                      setIsDirty(true);
                    }}
                    aria-label="Increase contracts"
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                    style={{
                      width: '48px',
                      height: '100%',
                      border: 'none',
                      borderLeft: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.quantity && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      color: 'var(--red)',
                    }}
                  >
                    {errors.quantity}
                  </div>
                )}
              </div>

              {/* DATE & TIME (EST) (MM/DD/YYYY hh:mm AM/PM) */}
              <div style={{ minWidth: 0, position: 'relative' }}>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  DATE &amp; TIME (EST)
                </label>
                <button
                  type="button"
                  onClick={() => setShowDatePickerPopover((prev) => !prev)}
                  className="viper-input tabular-nums"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{formattedDisplayDateEST}</span>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Auto liquidity-window pill under the date field */}
                <div style={{ marginTop: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: windowBadgeStyle.bg,
                      color: windowBadgeStyle.color,
                      border: windowBadgeStyle.border,
                    }}
                  >
                    <Clock size={12} />
                    <span>{windowBadgeStyle.label}</span>
                  </span>
                </div>

                {/* Date & Time 12h EST Popover */}
                {showDatePickerPopover && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span
                        className="eyebrow-label"
                        style={{ display: 'block', marginBottom: '6px' }}
                      >
                        Date
                      </span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setIsDirty(true);
                        }}
                        className="viper-input tabular-nums"
                        style={{ height: '40px' }}
                      />
                    </div>
                    <div>
                      <span
                        className="eyebrow-label"
                        style={{ display: 'block', marginBottom: '6px' }}
                      >
                        Time (12-Hour EST)
                      </span>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '8px',
                        }}
                      >
                        <select
                          value={hour12}
                          onChange={(e) => {
                            setHour12(e.target.value);
                            setIsDirty(true);
                          }}
                          className="viper-input tabular-nums"
                          style={{ height: '40px', padding: '0 10px' }}
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
                          onChange={(e) => {
                            setMinute(e.target.value);
                            setIsDirty(true);
                          }}
                          className="viper-input tabular-nums"
                          style={{ height: '40px', padding: '0 10px' }}
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
                          onChange={(e) => {
                            setAmpm(e.target.value);
                            setIsDirty(true);
                          }}
                          className="viper-input tabular-nums"
                          style={{
                            height: '40px',
                            padding: '0 10px',
                            color: 'var(--green)',
                            fontWeight: 600,
                          }}
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

            {/* Live P&L preview chip under the form */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Estimated P&amp;L ({quantity || 1}x {contract} {direction})
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color:
                    estimatedNetPnl > 0
                      ? 'var(--green)'
                      : estimatedNetPnl < 0
                      ? 'var(--red)'
                      : 'var(--text-muted)',
                }}
              >
                Estimated P&amp;L: {formatUSD(estimatedNetPnl)}
              </span>
            </div>
          </div>

          {/* §7. PART 2 — "More details" Accordion (52px high, default COLLAPSED) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              style={{
                width: '100%',
                height: '52px',
                padding: '0 18px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '15px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span>More details</span>
              <ChevronDown
                size={18}
                style={{
                  color: 'var(--text-muted)',
                  transform: isMoreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 250ms ease',
                }}
              />
            </button>

            {/* Animated Grid Accordion Wrapper — Nothing visible while collapsed */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isMoreOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 250ms ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    paddingTop: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '28px',
                  }}
                >
                  {/* 1. TAGS */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '8px' }}
                    >
                      TAGS
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
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
                        className="viper-input"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        aria-label="Add tag"
                        className="cursor-pointer transition-opacity hover:opacity-90"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-control)',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: 'var(--green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    {customTags.length > 0 && (
                      <div
                        style={{
                          marginTop: '10px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        {customTags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '13px',
                              fontWeight: 500,
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--green)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                            }}
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                padding: 0,
                              }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. NOTES */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '8px' }}
                    >
                      NOTES
                    </label>
                    <textarea
                      placeholder="Observations, market context, lessons learned..."
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setIsDirty(true);
                      }}
                      className="viper-textarea"
                    />
                  </div>

                  {/* 3. CHART URL */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '8px' }}
                    >
                      CHART URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={chartUrl}
                      onChange={(e) => {
                        setChartUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      className="viper-input"
                    />
                  </div>

                  {/* 4. HOW ARE YOU FEELING? (pill height 40px, wraps naturally) */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '10px' }}
                    >
                      HOW ARE YOU FEELING?
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      {FEELING_OPTIONS.map((item) => {
                        const isSelected = feelings.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleFeeling(item.id)}
                            style={{
                              height: '40px',
                              padding: '0 16px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '14px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 150ms ease',
                              backgroundColor: isSelected
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'var(--surface-2)',
                              color: isSelected
                                ? 'var(--green)'
                                : 'var(--text)',
                              border: isSelected
                                ? '1px solid var(--green)'
                                : '1px solid var(--border)',
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. PRE-TRADE CHECKLIST (header with "0/4 checked" counter; 2×2 grid of checkbox cards, 52px high each) */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <label className="eyebrow-label">
                        PRE-TRADE CHECKLIST
                      </label>
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color:
                            checkedCount === 4
                              ? 'var(--green)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {checkedCount}/4 checked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PRE_TRADE_CHECKLIST_ITEMS.map((item) => {
                        const isChecked = Boolean(preTradeChecklist[item.id]);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleChecklist(item.id)}
                            style={{
                              height: '52px',
                              padding: '0 16px',
                              borderRadius: 'var(--radius-control)',
                              backgroundColor: isChecked
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'var(--surface-2)',
                              border: isChecked
                                ? '1px solid var(--green)'
                                : '1px solid var(--border)',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 150ms ease',
                            }}
                          >
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                backgroundColor: isChecked
                                  ? 'var(--green)'
                                  : 'transparent',
                                border: isChecked
                                  ? '1px solid var(--green)'
                                  : '1px solid var(--text-dim)',
                                color: '#0A0D12',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {isChecked && <Check size={14} strokeWidth={3} />}
                            </div>
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: isChecked
                                  ? 'var(--green)'
                                  : 'var(--text)',
                              }}
                            >
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. MARKET CONDITIONS */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '10px' }}
                    >
                      MARKET CONDITIONS
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      {MARKET_CONDITION_OPTIONS.map((item) => {
                        const isSelected = marketConditions.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleMarketCondition(item.id)}
                            style={{
                              height: '40px',
                              padding: '0 16px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '14px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 150ms ease',
                              backgroundColor: isSelected
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'var(--surface-2)',
                              color: isSelected
                                ? 'var(--green)'
                                : 'var(--text)',
                              border: isSelected
                                ? '1px solid var(--green)'
                                : '1px solid var(--border)',
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 7. POST-TRADE SELF-GRADING (5 rows, 44px squares [1][2][3][4][5]) */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '10px' }}
                    >
                      POST-TRADE SELF-GRADING
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {SELF_GRADING_QUESTIONS.map((q) => {
                        const currentVal = selfGrading[q.id] || 0;
                        return (
                          <div
                            key={q.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            style={{
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-control)',
                              backgroundColor: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '15px',
                                fontWeight: 500,
                                color: 'var(--text)',
                              }}
                            >
                              {q.question}
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexShrink: 0,
                              }}
                            >
                              {[1, 2, 3, 4, 5].map((num) => {
                                const isActive = currentVal === num;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() =>
                                      handleSelfGradeChange(q.id, num)
                                    }
                                    className="tabular-nums"
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 150ms ease',
                                      backgroundColor: isActive
                                        ? 'var(--green)'
                                        : 'var(--surface)',
                                      color: isActive
                                        ? '#0A0D12'
                                        : 'var(--text-muted)',
                                      border: isActive
                                        ? '1px solid var(--green)'
                                        : '1px solid var(--border)',
                                    }}
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

                  {/* 8. EXECUTION GRADE (5 clickable stars, 32px each, with hover preview) */}
                  <div>
                    <label
                      className="eyebrow-label"
                      style={{ display: 'block', marginBottom: '10px' }}
                    >
                      EXECUTION GRADE
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = (hoverStar || executionGrade) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverStar(star)}
                            onMouseLeave={() => setHoverStar(0)}
                            onClick={() => {
                              setIsDirty(true);
                              setExecutionGrade((prev) =>
                                prev === star ? 0 : star
                              );
                            }}
                            aria-label={`Rate ${star} stars`}
                            style={{
                              padding: '4px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                            }}
                          >
                            <Star
                              size={32}
                              style={{
                                color: filled
                                  ? 'var(--green)'
                                  : 'var(--text-dim)',
                                fill: filled ? 'var(--green)' : 'transparent',
                                transition: 'all 120ms ease',
                              }}
                            />
                          </button>
                        );
                      })}
                      {executionGrade > 0 && (
                        <span
                          className="tabular-nums"
                          style={{
                            marginLeft: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--green)',
                          }}
                        >
                          {executionGrade} / 5 ★
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* §7. STICKY FOOTER: Cancel (ghost, left of primary) and Add Trade (solid green, flex-grow, 52px high) */}
        <div
          className="px-5 py-4 sm:px-8 sm:py-6"
          style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleRequestClose}
            className="cursor-pointer transition-colors hover:bg-slate-800/60"
            style={{
              height: '52px',
              padding: '0 24px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '15px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="viper-log-trade-form"
            className="cursor-pointer transition-opacity hover:opacity-90"
            style={{
              flexGrow: 1,
              height: '52px',
              padding: '0 24px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--green)',
              border: 'none',
              color: '#0A0D12',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            {editTrade ? 'Save Changes' : 'Add Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}
