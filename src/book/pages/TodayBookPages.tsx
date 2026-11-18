import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DayRecord,
  SessionChecklistState,
  DailyAuditState,
  EmotionTag,
} from '../../types/day';
import { AccountSettings } from '../../types/settings';
import {
  TradeEntry,
  TradingSession,
  MistakeTag,
  MISTAKE_TAGS,
} from '../../types/trade';
import {
  calculateDayTotals,
  evaluateDayDiscipline,
  DayDisciplineStatus,
  getEffectiveAuditAnswers,
  getMaxRiskDollar,
  isTradeRiskViolated,
  isMinorMistake,
} from '../../utils/calculations';
import {
  formatReadableDate,
  getTodayDateISO,
  shiftDateISO,
  formatCurrency,
  formatRMultiple,
} from '../../utils/formatters';
import { DisciplineGauge } from '../../components/DisciplineGauge';
import { AnimatedNumber } from '../../components/animations/AnimatedNumber';
import { ShakeOnError } from '../../components/animations/ShakeOnError';
import { BookPageData } from '../BookPage';

export type TodayBookLayoutMode =
  | 'mobile'
  | 'tablet-landscape'
  | 'tablet-portrait';

interface TodayBookPagesProps {
  layoutMode: TodayBookLayoutMode;
  selectedDate: string;
  onSelectDate: (dateIso: string) => void;
  day: DayRecord;
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onUpdateChecklist: (patch: Partial<SessionChecklistState>) => void;
  onAddTrade: (customPayload?: Partial<TradeEntry>) => {
    ok: boolean;
    reason?: string;
  };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

const EMOTION_CHIP_META: Array<{
  id: EmotionTag;
  label: string;
  pastelBg: string;
}> = [
  { id: 'Calm', label: '😌 Calm', pastelBg: '#DCEEF2' },
  { id: 'Patient', label: '⏳ Patient', pastelBg: '#BFE3C0' },
  { id: 'Focused', label: '🎯 Focused', pastelBg: '#E2DCEB' },
  { id: 'Impatient', label: '⚡ Impatient', pastelBg: '#F2D29B' },
  { id: 'FOMO', label: '🏃 FOMO', pastelBg: '#F8D0CC' },
  { id: 'Anxious', label: '😰 Anxious', pastelBg: '#F7E2A0' },
  { id: 'Overconfident', label: '🦁 Overconfident', pastelBg: '#E8E0A9' },
  { id: 'Revenge', label: '😤 Revenge', pastelBg: '#F5B8B0' },
];

function getWeekDatesMondayToSunday(selectedDateIso: string) {
  const [y, m, d] = selectedDateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = dt.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return letters.map((letter, idx) => {
    const dateIso = shiftDateISO(selectedDateIso, offsetToMonday + idx);
    return {
      letter,
      dateIso,
      dayNum: Number(dateIso.split('-')[2]),
    };
  });
}

// Trade List + Keyboard-Safe Portal Bottom Sheet (Mobile) / Centered Modal (Tablet) (§1 & §6)
const BookTradesSection: React.FC<{
  isMobile: boolean;
  trades: TradeEntry[];
  settings: AccountSettings;
  dailyPnl: number;
  dailyR: number;
  onAddTrade: TodayBookPagesProps['onAddTrade'];
  onUpdateTrade: TodayBookPagesProps['onUpdateTrade'];
  onDeleteTrade: TodayBookPagesProps['onDeleteTrade'];
  onNotify: TodayBookPagesProps['onNotify'];
}> = ({
  isMobile,
  trades,
  settings,
  dailyPnl,
  dailyR,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onNotify,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const [asset, setAsset] = useState('XAUUSD');
  const [session, setSession] = useState<TradingSession>('NY');
  const [riskDollar, setRiskDollar] = useState<string>('250');
  const [resultType, setResultType] = useState<'WIN' | 'LOSS'>('WIN');
  const [resultDollar, setResultDollar] = useState<string>('500');
  const [notes, setNotes] = useState('');
  const [setupQuality, setSetupQuality] = useState<number>(4);
  const [disciplineScore, setDisciplineScore] = useState<number>(5);
  const [mistakes, setMistakes] = useState<MistakeTag[]>(['None']);

  // Track visualViewport height & offset for mobile virtual keyboard safety (§1)
  const [vvStyle, setVvStyle] = useState<{
    maxHeight: string;
    bottomOffset: number;
  }>({
    maxHeight: '92dvh',
    bottomOffset: 0,
  });

  useEffect(() => {
    if (!isSheetOpen || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const updateViewportMetrics = () => {
      const bottomGap = Math.max(
        0,
        window.innerHeight - (vv.offsetTop + vv.height)
      );
      setVvStyle({
        maxHeight: `${Math.round(vv.height * 0.92)}px`,
        bottomOffset: bottomGap,
      });
    };

    updateViewportMetrics();
    vv.addEventListener('resize', updateViewportMetrics);
    vv.addEventListener('scroll', updateViewportMetrics);
    return () => {
      vv.removeEventListener('resize', updateViewportMetrics);
      vv.removeEventListener('scroll', updateViewportMetrics);
    };
  }, [isSheetOpen]);

  const maxRiskDollar = getMaxRiskDollar(settings);
  const isAtLimit = trades.length >= settings.maxTradesPerDay;

  const openNewTradeSheet = () => {
    if (isAtLimit) {
      onNotify(
        `${settings.maxTradesPerDay} trades done. Stop trading for today!`,
        'warning'
      );
      return;
    }
    setEditingTradeId(null);
    setAsset('XAUUSD');
    setSession('NY');
    setRiskDollar(String(maxRiskDollar));
    setResultType('WIN');
    setResultDollar(String(maxRiskDollar * 2));
    setNotes('');
    setSetupQuality(4);
    setDisciplineScore(5);
    setMistakes(['None']);
    setShowMoreDetails(false);
    setIsSheetOpen(true);
  };

  const openEditTradeSheet = (t: TradeEntry) => {
    setEditingTradeId(t.id);
    setAsset(t.asset || 'XAUUSD');
    setSession(t.session === 'London' ? 'London' : 'NY');
    setRiskDollar(String(t.riskAmount || maxRiskDollar));
    setResultType(t.outcome >= 0 ? 'WIN' : 'LOSS');
    setResultDollar(String(Math.abs(t.outcome || 0)));
    setNotes(t.notes || '');
    setSetupQuality(t.setupQuality || 4);
    setDisciplineScore(t.disciplineScore || 5);
    setMistakes(t.mistakes && t.mistakes.length > 0 ? t.mistakes : ['None']);
    setShowMoreDetails(false);
    setIsSheetOpen(true);
  };

  const toggleMistake = (tag: MistakeTag) => {
    if (tag === 'None') {
      setMistakes(['None']);
      return;
    }
    const withoutNone = mistakes.filter((m) => m !== 'None');
    const exists = withoutNone.includes(tag);
    const next = exists
      ? withoutNone.filter((m) => m !== tag)
      : [...withoutNone, tag];
    setMistakes(next.length === 0 ? ['None'] : next);
  };

  const handleSaveSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const numericRisk = Math.max(0, Number(riskDollar) || 0);
    const numericResultAbs = Math.max(0, Number(resultDollar) || 0);
    const signedOutcome =
      resultType === 'WIN' ? numericResultAbs : -numericResultAbs;

    if (editingTradeId) {
      onUpdateTrade(editingTradeId, {
        asset: asset.trim() || 'XAUUSD',
        session,
        riskAmount: numericRisk,
        outcome: signedOutcome,
        notes: notes.trim(),
        setupQuality,
        disciplineScore,
        mistakes,
      });
      onNotify('Trade updated!', 'success');
    } else {
      const res = onAddTrade({
        asset: asset.trim() || 'XAUUSD',
        session,
        riskAmount: numericRisk,
        outcome: signedOutcome,
        notes: notes.trim(),
        setupQuality,
        disciplineScore,
        mistakes,
      });
      if (res.ok) {
        onNotify('Trade saved!', 'success');
      } else if (res.reason) {
        onNotify(res.reason, 'warning');
      }
    }
    setIsSheetOpen(false);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    window.setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
  };

  const calculatedRiskPct =
    settings.accountSize > 0
      ? (((Number(riskDollar) || 0) / settings.accountSize) * 100).toFixed(1)
      : '0.0';

  const sheetOrModalPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {isSheetOpen && (
              <div
                onClick={() => setIsSheetOpen(false)}
                className={`fixed inset-0 z-[9999] bg-[#5C3D2E]/50 backdrop-blur-[2px] flex ${
                  isMobile
                    ? 'items-end justify-center'
                    : 'items-center justify-center p-4'
                }`}
              >
                <motion.div
                  initial={
                    isMobile
                      ? { y: '100%' }
                      : { opacity: 0, scale: 0.96, y: 12 }
                  }
                  animate={
                    isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={
                    isMobile
                      ? { y: '100%' }
                      : { opacity: 0, scale: 0.96, y: 12 }
                  }
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  drag={isMobile ? 'y' : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.45 }}
                  onDragEnd={(_e, info) => {
                    if (info.offset.y > 90 || info.velocity.y > 450) {
                      setIsSheetOpen(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={
                    isMobile
                      ? {
                          maxHeight: vvStyle.maxHeight,
                          marginBottom: `${vvStyle.bottomOffset}px`,
                        }
                      : { maxHeight: '90dvh' }
                  }
                  className={
                    isMobile
                      ? 'w-full rounded-t-3xl bg-[#FFFDF7] border-t-4 border-x-2 border-[#8B5E3C] shadow-2xl flex flex-col overflow-hidden'
                      : 'w-full max-w-[560px] rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-2xl flex flex-col overflow-hidden'
                  }
                >
                  {/* Sheet / Modal Top Header */}
                  <div className="px-4 pt-3 pb-2.5 border-b-2 border-dotted border-[#8B5E3C]/50 shrink-0 bg-[#FFFDF7]">
                    {isMobile && (
                      <div className="w-12 h-1.5 rounded-full bg-[#8B5E3C]/40 mx-auto mb-2 cursor-grab" />
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-[20px] sm:text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
                        {editingTradeId ? 'EDIT TRADE' : 'ADD A TRADE'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsSheetOpen(false)}
                        aria-label="Close trade form"
                        className="w-[44px] h-[44px] rounded-full bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Form Body + Sticky Footer Inside Form */}
                  <form
                    onSubmit={handleSaveSheet}
                    className="flex-1 flex flex-col min-h-0 overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                            1. Pair / Asset
                          </label>
                          <input
                            type="text"
                            required
                            value={asset}
                            onFocus={handleInputFocus}
                            onChange={(e) => setAsset(e.target.value)}
                            placeholder="Example: XAUUSD"
                            className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                            2. Session
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSession('London')}
                              className={`min-h-[52px] rounded-xl border-2 border-[#8B5E3C] text-[17px] font-bold cursor-pointer ${
                                session === 'London'
                                  ? 'bg-[#DCEEF2] text-[#5C3D2E]'
                                  : 'bg-[#FFFBF2] text-[#8B5E3C]'
                              }`}
                            >
                              London
                            </button>
                            <button
                              type="button"
                              onClick={() => setSession('NY')}
                              className={`min-h-[52px] rounded-xl border-2 border-[#8B5E3C] text-[17px] font-bold cursor-pointer ${
                                session === 'NY'
                                  ? 'bg-[#F2D29B] text-[#5C3D2E]'
                                  : 'bg-[#FFFBF2] text-[#8B5E3C]'
                              }`}
                            >
                              New York
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[17px] font-bold text-[#5C3D2E]">
                              3. Money risked ($)
                            </label>
                            <span className="text-[16px] font-bold text-[#8B5E3C]">
                              ({calculatedRiskPct}%)
                            </span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            required
                            value={riskDollar}
                            onFocus={handleInputFocus}
                            onChange={(e) => setRiskDollar(e.target.value)}
                            className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                          />
                          {Number(riskDollar) > maxRiskDollar && (
                            <div className="mt-1 px-3 py-1 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[16px] font-bold text-[#9B2C20]">
                              Over {formatCurrency(maxRiskDollar)} risk limit!
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                            4. Result ($ amount)
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setResultType('WIN')}
                              className={`min-h-[52px] px-3.5 rounded-xl border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer shrink-0 ${
                                resultType === 'WIN'
                                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                  : 'bg-[#FFFBF2] text-[#8B5E3C]'
                              }`}
                            >
                              WIN
                            </button>
                            <button
                              type="button"
                              onClick={() => setResultType('LOSS')}
                              className={`min-h-[52px] px-3.5 rounded-xl border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer shrink-0 ${
                                resultType === 'LOSS'
                                  ? 'bg-[#F5B8B0] text-[#9B2C20]'
                                  : 'bg-[#FFFBF2] text-[#8B5E3C]'
                              }`}
                            >
                              LOSS
                            </button>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              required
                              value={resultDollar}
                              onFocus={handleInputFocus}
                              onChange={(e) => setResultDollar(e.target.value)}
                              placeholder="$"
                              className="flex-1 min-w-0 min-h-[52px] px-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                          5. Quick note (optional)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onFocus={handleInputFocus}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Short note about this trade..."
                          className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] text-[#5C3D2E] outline-none"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setShowMoreDetails((prev) => !prev)}
                          className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
                        >
                          <span>More details (optional)</span>
                          {showMoreDetails ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>

                        {showMoreDetails && (
                          <div className="mt-2 p-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <span className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                                  Setup Quality (1–5)
                                </span>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setSetupQuality(num)}
                                      className={`w-[44px] h-[44px] rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
                                        setupQuality >= num
                                          ? 'bg-[#F2D29B] text-[#5C3D2E]'
                                          : 'bg-[#FFFDF7] text-[#8B5E3C]'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <span className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                                  Discipline (1–5)
                                </span>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setDisciplineScore(num)}
                                      className={`w-[44px] h-[44px] rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
                                        disciplineScore >= num
                                          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                          : 'bg-[#FFFDF7] text-[#8B5E3C]'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                                Mistake tags
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {MISTAKE_TAGS.map((tag) => {
                                  const selected = mistakes.includes(tag);
                                  const minor = isMinorMistake(tag);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => toggleMistake(tag)}
                                      className={`min-h-[44px] px-3 py-1 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
                                        selected
                                          ? tag === 'None'
                                            ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                            : minor
                                              ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                                              : 'bg-[#F5B8B0] text-[#9B2C20]'
                                          : 'bg-[#FFFDF7] text-[#5C3D2E]'
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sticky Footer Always Visible with Safe-Area Padding (§1) */}
                    <div
                      style={{
                        paddingBottom:
                          'max(12px, env(safe-area-inset-bottom, 12px))',
                      }}
                      className="shrink-0 sticky bottom-0 bg-[#FFFDF7] border-t-2 border-dotted border-[#8B5E3C]/50 px-4 pt-2.5 flex items-center gap-3 z-20"
                    >
                      <button
                        type="button"
                        onClick={() => setIsSheetOpen(false)}
                        className="min-h-[52px] px-5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="flex-1 min-h-[52px] px-5 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase text-[#2F6B3A] cursor-pointer"
                      >
                        {editingTradeId ? 'SAVE CHANGES' : 'SAVE TRADE'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2">
      {/* Top Rule Summary + Header ADD TRADE Button ONLY when trades.length > 0 (§6) */}
      <div className="px-3 py-2 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="text-[16px] sm:text-[17px] font-bold text-[#5C3D2E]">
          Max <strong>{settings.maxTradesPerDay}</strong> trades • Limit{' '}
          <strong>
            {formatCurrency(maxRiskDollar)} ({settings.maxRiskPercent}%)
          </strong>
        </div>

        {trades.length > 0 && (
          <button
            type="button"
            disabled={isAtLimit}
            onClick={openNewTradeSheet}
            className={`min-h-[52px] px-4 rounded-xl border-2 border-[#8B5E3C] font-heading text-[17px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 shrink-0 transition-transform ${
              isAtLimit
                ? 'bg-[#F0DED4] text-[#8B5E3C]/60 cursor-not-allowed'
                : 'bg-[#BFE3C0] hover:bg-[#a9d8ab] text-[#2F6B3A] active:scale-95 cursor-pointer'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.8]" />
            <span>ADD TRADE</span>
          </button>
        )}
      </div>

      {isAtLimit && (
        <div className="px-3 py-1.5 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] text-center shrink-0">
          {settings.maxTradesPerDay} trades done. Stop trading for today!
        </div>
      )}

      {/* Trade Cards or Empty State (with single ADD TRADE button when empty — §6) */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {trades.length === 0 ? (
          <div className="flex-1 p-4 rounded-xl bg-[#FFFDF7] border-2 border-dashed border-[#8B5E3C]/60 text-center flex flex-col items-center justify-center gap-2.5">
            <div className="text-[17px] font-bold text-[#8B5E3C]">
              No trades yet today. Tap ADD TRADE to start.
            </div>
            <button
              type="button"
              onClick={openNewTradeSheet}
              className="min-h-[52px] px-5 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[17px] font-bold uppercase text-[#2F6B3A] inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.8]" />
              <span>ADD TRADE</span>
            </button>
          </div>
        ) : (
          trades.map((trade) => {
            const violated = isTradeRiskViolated(trade, settings);
            const isWin = trade.outcome >= 0;
            const nonNoneMistakes = (trade.mistakes || []).filter(
              (m) => m !== 'None'
            );
            const tradeR =
              trade.riskAmount > 0
                ? Math.round((trade.outcome / trade.riskAmount) * 10) / 10
                : 0;
            const rString = tradeR > 0 ? `+${tradeR}R` : `${tradeR}R`;
            const isConfirmingDelete = confirmDeleteId === trade.id;

            return (
              <ShakeOnError
                key={trade.id}
                triggerKey={`${trade.id}-${trade.riskAmount}-${violated}`}
                isError={violated}
              >
                <div className="rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] p-2.5 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] font-heading text-[15px] font-bold text-[#8B5E3C]">
                        #{trade.tradeNumber}
                      </span>
                      <span className="text-[17px] font-extrabold text-[#5C3D2E]">
                        {trade.asset}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[15px] font-bold text-[#5C3D2E]">
                        {trade.session}
                      </span>
                      <span className="text-[15px] font-semibold text-[#5C3D2E]">
                        Risk: <strong>{formatCurrency(trade.riskAmount)}</strong>{' '}
                        ({trade.riskPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl border-2 border-[#8B5E3C] leading-none inline-flex items-baseline gap-1 ${
                          isWin
                            ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                            : 'bg-[#F5B8B0] text-[#9B2C20]'
                        }`}
                      >
                        <strong className="text-[16px] font-extrabold">
                          {formatCurrency(trade.outcome, true)}
                        </strong>
                        <span className="text-[14px] font-bold">
                          / {rString}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditTradeSheet(trade)}
                        aria-label="Edit trade"
                        className="w-[42px] h-[42px] rounded-xl bg-[#FFFBF2] hover:bg-[#F2D29B] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId((prev) =>
                            prev === trade.id ? null : trade.id
                          )
                        }
                        aria-label="Delete trade"
                        className="w-[42px] h-[42px] rounded-xl bg-[#FFFBF2] hover:bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[#9B2C20] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isConfirmingDelete && (
                    <div className="px-3 py-1.5 rounded-xl bg-[#F5B8B0]/60 border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
                      <span className="text-[16px] font-bold text-[#9B2C20]">
                        Delete this trade?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTrade(trade.id);
                            setConfirmDeleteId(null);
                            onNotify('Trade deleted.', 'info');
                          }}
                          className="min-h-[42px] px-3 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20] cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[42px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {(violated || trade.notes || nonNoneMistakes.length > 0) && (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-dotted border-[#8B5E3C]/40">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {violated && (
                          <span className="px-2 py-0.5 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[15px] font-extrabold text-[#9B2C20]">
                            Over your risk limit!
                          </span>
                        )}
                        {trade.notes && (
                          <span className="text-[15px] text-[#5C3D2E]">
                            {trade.notes}
                          </span>
                        )}
                      </div>
                      {nonNoneMistakes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nonNoneMistakes.map((m) => (
                            <span
                              key={m}
                              className={`px-2 py-0.5 rounded-full border border-[#8B5E3C] text-[14px] font-bold ${
                                isMinorMistake(m)
                                  ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                                  : 'bg-[#F8D0CC] text-[#9B2C20]'
                              }`}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ShakeOnError>
            );
          })
        )}
      </div>

      {/* Bottom Total Bar */}
      <div className="px-3.5 py-2 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0 mt-auto">
        <div className="text-[17px] font-extrabold text-[#5C3D2E]">
          Total today:{' '}
          <span
            className={
              dailyPnl > 0
                ? 'text-[#2F6B3A]'
                : dailyPnl < 0
                  ? 'text-[#9B2C20]'
                  : 'text-[#5C3D2E]'
            }
          >
            <AnimatedNumber
              value={dailyPnl}
              formatter={(v) => formatCurrency(v, true)}
            />
          </span>
        </div>
        <div className="text-[17px] font-bold text-[#5C3D2E]">
          R total:{' '}
          <strong>
            <AnimatedNumber
              value={dailyR}
              formatter={(v) => formatRMultiple(v)}
            />
          </strong>
        </div>
      </div>

      {sheetOrModalPortal}
    </div>
  );
};

// Save Today Button Component with Saved✓ feedback
const SaveTodayActionBtn: React.FC<{
  onUpdateAudit: TodayBookPagesProps['onUpdateAudit'];
  onNotify: TodayBookPagesProps['onNotify'];
}> = ({ onUpdateAudit, onNotify }) => {
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSaveToday = () => {
    onUpdateAudit({ savedAt: new Date().toISOString() });
    setSavedBanner(true);
    onNotify('Saved today’s tracker sheet!', 'success');
    window.setTimeout(() => setSavedBanner(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleSaveToday}
      className={`w-full min-h-[52px] rounded-xl border-2 border-[#8B5E3C] font-heading text-[19px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
        savedBanner
          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
          : 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E]'
      }`}
    >
      {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
    </button>
  );
};

export function buildTodayBookPages({
  layoutMode,
  selectedDate,
  onSelectDate,
  day,
  daysMap,
  settings,
  onUpdateChecklist,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onUpdateAudit,
  onNotify,
}: TodayBookPagesProps): BookPageData[] {
  const isMobile = layoutMode === 'mobile';
  const todayIso = getTodayDateISO();
  const dayEval = evaluateDayDiscipline(day, settings);
  const { totalPnl, totalR } = calculateDayTotals(day);
  const weekDays = getWeekDatesMondayToSunday(selectedDate);
  const effectiveAudit = getEffectiveAuditAnswers(day, settings);
  const maxRiskDollar = getMaxRiskDollar(settings);

  const checklistItems: Array<{
    key: keyof SessionChecklistState;
    label: string;
    pastelBg: string;
  }> = [
    {
      key: 'checkedEconomicCalendar',
      label: 'Checked economic calendar (no big news)',
      pastelBg: '#DCEEF2',
    },
    {
      key: 'confirmedAllowedWindows',
      label: 'Trading in allowed time (London 1-4 / NY 8-11)',
      pastelBg: '#F2D29B',
    },
    {
      key: 'mentalStateCalm',
      label: 'Mind is calm and focused (no revenge)',
      pastelBg: '#E2DCEB',
    },
  ];

  const checkedCount = [
    day.checklist.checkedEconomicCalendar,
    day.checklist.confirmedAllowedWindows,
    day.checklist.mentalStateCalm,
  ].filter(Boolean).length;
  const isAllReady = checkedCount === 3;

  const auditQuestions: Array<{
    key: 'stuckToMaxTrades' | 'respectedRiskCap' | 'executedInAllowedWindows';
    label: string;
    pastelBg: string;
    value: boolean;
  }> = [
    {
      key: 'stuckToMaxTrades',
      label: `Did I stick to my ${settings.maxTradesPerDay}-trade maximum?`,
      pastelBg: '#DCEEF2',
      value: effectiveAudit.stuckToMaxTrades,
    },
    {
      key: 'respectedRiskCap',
      label: `Did I respect the ${settings.maxRiskPercent}% (${formatCurrency(
        maxRiskDollar
      )}) risk limit?`,
      pastelBg: '#F2D29B',
      value: effectiveAudit.respectedRiskCap,
    },
    {
      key: 'executedInAllowedWindows',
      label: 'Did I trade only in the London or NY time?',
      pastelBg: '#E2DCEB',
      value: effectiveAudit.executedInAllowedWindows,
    },
  ];

  const toggleEmotion = (tag: EmotionTag) => {
    const current = day.audit.emotions || [];
    const exists = current.includes(tag);
    const next = exists
      ? current.filter((e) => e !== tag)
      : [...current, tag];
    onUpdateAudit({ emotions: next });
  };

  // Shared Date Row: Prev arrow, date field (flex-1) and Next arrow on ONE line (§2)
  const dateRowBlock = (
    <div className="p-2.5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] space-y-2 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[17px] font-extrabold text-[#5C3D2E] truncate">
          {formatReadableDate(selectedDate)}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedDate !== todayIso && (
            <button
              type="button"
              onClick={() => onSelectDate(todayIso)}
              className="h-[36px] px-2.5 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[15px] font-extrabold text-[#5C3D2E] cursor-pointer"
            >
              Today
            </button>
          )}
          {Boolean(settings.showPrintButton) && (
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print h-[36px] px-2.5 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] text-[15px] font-bold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          )}
        </div>
      </div>

      {/* Prev + Date Field (flex: 1) + Next on ONE single line (§2) */}
      <div className="flex items-center gap-1.5 w-full">
        <button
          type="button"
          onClick={() => onSelectDate(shiftDateISO(selectedDate, -1))}
          aria-label="Previous day"
          className="h-[48px] w-[48px] shrink-0 rounded-xl bg-[#FFFDF7] hover:bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) onSelectDate(e.target.value);
          }}
          aria-label="Choose date"
          className="flex-1 min-w-0 h-[48px] px-2.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] outline-none cursor-pointer"
        />

        <button
          type="button"
          onClick={() => onSelectDate(shiftDateISO(selectedDate, 1))}
          aria-label="Next day"
          className="h-[48px] w-[48px] shrink-0 rounded-xl bg-[#FFFDF7] hover:bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Shared Week Row (M T W T F S S): 7-column grid, 36-40px circles, thin outline ring for selected/today (§2 & §4)
  const weekRowBlock = (
    <div className="p-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-2 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C]">
          THIS WEEK&apos;S HABIT ROW
        </span>
        <div className="flex items-center gap-2 text-[14px] font-bold text-[#5C3D2E]">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#BFE3C0] border border-[#8B5E3C]" />
            Clean
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#F7E2A0] border border-[#8B5E3C]" />
            Almost
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#F5B8B0] border border-[#8B5E3C]" />
            Broken
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((wd) => {
          const evalRes = evaluateDayDiscipline(daysMap[wd.dateIso], settings);
          const status: DayDisciplineStatus = evalRes.status;
          const isSelected = wd.dateIso === selectedDate;

          return (
            <button
              key={wd.dateIso}
              type="button"
              onClick={() => onSelectDate(wd.dateIso)}
              className="flex flex-col items-center py-1 rounded-xl cursor-pointer"
            >
              <span className="font-heading text-[15px] font-bold text-[#8B5E3C] leading-none">
                {wd.letter}
              </span>
              <div
                className={`mt-1 w-[38px] h-[38px] rounded-full border-2 border-[#8B5E3C] flex items-center justify-center transition-all ${
                  isSelected ? 'ring-2 ring-[#8B5E3C] ring-offset-1' : ''
                } ${
                  status === 'green'
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : status === 'yellow'
                      ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                      : status === 'red'
                        ? 'bg-[#F5B8B0] text-[#9B2C20]'
                        : 'bg-[#FFFBF2] text-[#8B5E3C]'
                }`}
              >
                {status === 'green' && <Check className="w-4 h-4 stroke-[3]" />}
                {status === 'yellow' && (
                  <span className="text-[17px] font-extrabold leading-none">
                    ~
                  </span>
                )}
                {status === 'red' && <X className="w-4 h-4 stroke-[3]" />}
                {status === 'empty' && (
                  <span className="text-[15px] font-bold">{wd.dayNum}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Shared 3 Stat Cards Block (shows "-" on empty day — §4)
  const statCardsBlock = (
    <div className="shrink-0">
      <DisciplineGauge
        score={dayEval.score}
        dailyPnl={totalPnl}
        tradesCount={day.trades.length}
        maxTrades={settings.maxTradesPerDay}
        isEmpty={dayEval.isEmpty}
      />
    </div>
  );

  // Shared How Did I Feel Block
  const feelingsBlock = (
    <div className="p-2.5 sm:p-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-1.5 shrink-0">
      <div className="text-[16px] sm:text-[17px] font-extrabold text-[#8B5E3C]">
        How did I feel today?
      </div>
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
        {EMOTION_CHIP_META.map((item) => {
          const isSelected = (day.audit.emotions || []).includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleEmotion(item.id)}
              style={{
                backgroundColor: isSelected ? item.pastelBg : '#FFFBF2',
              }}
              className={`min-h-[38px] sm:min-h-[42px] px-2.5 py-1 rounded-full text-[15px] sm:text-[16px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? 'border-2 border-[#8B5E3C] text-[#5C3D2E]'
                  : 'border border-[#8B5E3C]/60 text-[#8B5E3C]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Shared Checklist Block
  const checklistBlock = (
    <div className="space-y-2 shrink-0">
      <div className="space-y-2">
        {checklistItems.map((item) => {
          const checked = day.checklist[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onUpdateChecklist({ [item.key]: !checked })}
              style={{ backgroundColor: item.pastelBg }}
              className="w-full min-h-[54px] px-3.5 py-2 rounded-2xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2.5 text-left cursor-pointer"
            >
              <span
                className={`text-[16px] sm:text-[17px] font-extrabold text-[#5C3D2E] leading-snug ${
                  checked ? 'line-through opacity-80' : ''
                }`}
              >
                {item.label}
              </span>
              <span
                className={`w-[42px] h-[42px] rounded-full border-2 border-[#8B5E3C] flex items-center justify-center shrink-0 ${
                  checked
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : 'bg-[#FFFDF7] text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </span>
            </button>
          );
        })}
      </div>

      {!isAllReady ? (
        <div className="p-3 rounded-2xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <span className="text-[16px] sm:text-[17px] font-extrabold text-[#5C3D2E]">
            Not ready yet. Tick all 3 first.
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateChecklist({
                checkedEconomicCalendar: true,
                confirmedAllowedWindows: true,
                mentalStateCalm: true,
              })
            }
            className="min-h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] hover:bg-[#F2D29B] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#5C3D2E] cursor-pointer shrink-0"
          >
            Tick all
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#2F6B3A] text-center">
          You&apos;re ready to trade! ✓
        </div>
      )}
    </div>
  );

  // Shared End-of-Day Review 3 Questions Block
  const reviewQuestionsBlock = (
    <div className="space-y-2.5 shrink-0">
      {auditQuestions.map((q) => (
        <div
          key={q.key}
          style={{ backgroundColor: q.pastelBg }}
          className="p-3 rounded-2xl border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2"
        >
          <span className="text-[16px] sm:text-[17px] font-bold text-[#5C3D2E] leading-snug flex-1 min-w-[180px]">
            {q.label}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onUpdateAudit({ [q.key]: true })}
              className={`min-h-[46px] min-w-[68px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                q.value
                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                  : 'bg-[#FFFDF7] text-[#8B5E3C]'
              }`}
            >
              YES
            </button>
            <button
              type="button"
              onClick={() => onUpdateAudit({ [q.key]: false })}
              className={`min-h-[46px] min-w-[68px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                !q.value
                  ? 'bg-[#F5B8B0] text-[#9B2C20]'
                  : 'bg-[#FFFDF7] text-[#8B5E3C]'
              }`}
            >
              NO
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Shared Lesson Notepad Block (Single Heading Only — no duplicate inner bar! §6)
  const lessonNotepadBlock = (rows = 4) => (
    <div className="flex-1 flex flex-col min-h-[110px] rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden">
      <textarea
        aria-label="Lesson for Tomorrow"
        rows={rows}
        value={day.audit.keyLesson || ''}
        onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
        placeholder="Write one simple thing to remember tomorrow..."
        className="lined-notepad flex-1 w-full p-3 text-[17px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none border-0"
      />
    </div>
  );

  // Shared Day Recap Block
  const dayRecapCard = (
    <div className="p-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-2 shrink-0">
      <div className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C]">
        DAY RECAP SUMMARY
      </div>
      <div className="grid grid-cols-2 gap-2 text-[16px] font-bold text-[#5C3D2E]">
        <div className="p-2 rounded-lg bg-[#DCEEF2]/70 border border-[#8B5E3C]">
          Checklist: <strong>{checkedCount}/3</strong>
        </div>
        <div className="p-2 rounded-lg bg-[#F2D29B]/70 border border-[#8B5E3C]">
          Trades:{' '}
          <strong>
            {day.trades.length}/{settings.maxTradesPerDay}
          </strong>
        </div>
        <div className="p-2 rounded-lg bg-[#BFE3C0]/70 border border-[#8B5E3C]">
          Score:{' '}
          <strong>{dayEval.isEmpty ? '-' : `${dayEval.score}/100`}</strong>
        </div>
        <div className="p-2 rounded-lg bg-[#E2DCEB]/70 border border-[#8B5E3C]">
          Net P&amp;L: <strong>{formatCurrency(totalPnl, true)}</strong>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // 1. MOBILE BOOK LAYOUT (6 Pages — §2, fits 360x740 & 390x844 with zero inner scroll)
  // ==========================================================================
  if (layoutMode === 'mobile') {
    return [
      {
        id: 'today-m-p1',
        sectionLabel: 'TODAY • PAGE 1',
        pageTitle: 'DAILY SHEET',
        mobileTitle: 'DAILY SHEET',
        pastelHeaderBg: '#F2D29B',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2.5">
            {dateRowBlock}
            {weekRowBlock}
            <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
          </div>
        ),
      },
      {
        id: 'today-m-p2',
        sectionLabel: 'TODAY • PAGE 2',
        pageTitle: 'SCORE & MOOD',
        mobileTitle: 'SCORE & MOOD',
        pastelHeaderBg: '#DCEEF2',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2">
            {statCardsBlock}
            {feelingsBlock}
          </div>
        ),
      },
      {
        id: 'today-m-p3',
        sectionLabel: 'TODAY • PAGE 3',
        pageTitle: `BEFORE YOU TRADE (${checkedCount}/3)`,
        mobileTitle: `BEFORE YOU TRADE (${checkedCount}/3)`,
        pastelHeaderBg: '#DCEEF2',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2.5">
            {checklistBlock}
            <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
          </div>
        ),
      },
      {
        id: 'today-m-p4',
        sectionLabel: 'TODAY • PAGE 4',
        pageTitle: 'MY TRADES TODAY',
        mobileTitle: 'MY TRADES TODAY',
        pastelHeaderBg: '#F2D29B',
        content: (
          <BookTradesSection
            isMobile={true}
            trades={day.trades}
            settings={settings}
            dailyPnl={totalPnl}
            dailyR={totalR}
            onAddTrade={onAddTrade}
            onUpdateTrade={onUpdateTrade}
            onDeleteTrade={onDeleteTrade}
            onNotify={onNotify}
          />
        ),
      },
      {
        id: 'today-m-p5',
        sectionLabel: 'TODAY • PAGE 5',
        pageTitle: 'END-OF-DAY REVIEW',
        mobileTitle: 'END-OF-DAY REVIEW',
        pastelHeaderBg: '#E2DCEB',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2.5">
            {reviewQuestionsBlock}
            <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
          </div>
        ),
      },
      {
        id: 'today-m-p6',
        sectionLabel: 'TODAY • PAGE 6',
        pageTitle: 'LESSON FOR TOMORROW',
        mobileTitle: 'LESSON & RECAP',
        pastelHeaderBg: '#E8E0A9',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2.5">
            {lessonNotepadBlock(3)}
            {dayRecapCard}
            <SaveTodayActionBtn
              onUpdateAudit={onUpdateAudit}
              onNotify={onNotify}
            />
          </div>
        ),
      },
    ];
  }

  // ==========================================================================
  // 2. TABLET PORTRAIT LAYOUT (4 Pages — §8: Use empty space with flex)
  // ==========================================================================
  if (layoutMode === 'tablet-portrait') {
    return [
      {
        id: 'today-tp-p1',
        sectionLabel: 'TODAY • DAILY OVERVIEW',
        pageTitle: 'DAILY SHEET & MOOD',
        pastelHeaderBg: '#F2D29B',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-3">
            {dateRowBlock}
            {weekRowBlock}
            {statCardsBlock}
            {feelingsBlock}
            <div className="lined-notepad flex-1 min-h-[28px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
          </div>
        ),
      },
      {
        id: 'today-tp-p2',
        sectionLabel: 'TODAY • CHECKLIST & EXECUTION',
        pageTitle: 'BEFORE YOU TRADE & TRADES',
        pastelHeaderBg: '#DCEEF2',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-3">
            {checklistBlock}
            <BookTradesSection
              isMobile={false}
              trades={day.trades}
              settings={settings}
              dailyPnl={totalPnl}
              dailyR={totalR}
              onAddTrade={onAddTrade}
              onUpdateTrade={onUpdateTrade}
              onDeleteTrade={onDeleteTrade}
              onNotify={onNotify}
            />
          </div>
        ),
      },
      {
        id: 'today-tp-p3',
        sectionLabel: 'TODAY • REVIEW & REFLECTION',
        pageTitle: 'REVIEW & LESSON FOR TOMORROW',
        pastelHeaderBg: '#E2DCEB',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-3">
            {reviewQuestionsBlock}
            <div className="flex-1 flex flex-col gap-1.5 min-h-[160px]">
              <span className="font-heading text-[17px] font-bold uppercase text-[#8B5E3C]">
                Key Takeaway for Tomorrow:
              </span>
              {lessonNotepadBlock(5)}
            </div>
          </div>
        ),
      },
      {
        id: 'today-tp-p4',
        sectionLabel: 'TODAY • COMPLETE SESSION',
        pageTitle: 'DAY RECAP & SAVE TODAY',
        pastelHeaderBg: '#E8E0A9',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-3.5">
            {dayRecapCard}
            <div className="lined-notepad flex-1 min-h-[120px] rounded-xl border-2 border-dashed border-[#8B5E3C]/40 p-4 text-[17px] font-bold text-[#8B5E3C]">
              Review your discipline score and trades above, then tap SAVE TODAY
              to lock in your daily habit record.
            </div>
            <SaveTodayActionBtn
              onUpdateAudit={onUpdateAudit}
              onNotify={onNotify}
            />
          </div>
        ),
      },
    ];
  }

  // ==========================================================================
  // 3. TABLET LANDSCAPE LAYOUT (6 Real Pages — §5: 3 Two-Page Spreads, No Filler)
  // ==========================================================================
  return [
    {
      id: 'today-tl-p1',
      sectionLabel: 'TODAY • DAILY SHEET',
      pageTitle: 'DAILY SHEET',
      pastelHeaderBg: '#F2D29B',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          {dateRowBlock}
          {weekRowBlock}
          {statCardsBlock}
        </div>
      ),
    },
    {
      id: 'today-tl-p2',
      sectionLabel: 'TODAY • PRE-SESSION',
      pageTitle: `BEFORE YOU TRADE (${checkedCount}/3)`,
      pastelHeaderBg: '#DCEEF2',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-3">
          {checklistBlock}
          <div className="lined-notepad flex-1 min-h-[40px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
        </div>
      ),
    },
    {
      id: 'today-tl-p3',
      sectionLabel: 'TODAY • EXECUTION LOG',
      pageTitle: 'MY TRADES TODAY',
      pastelHeaderBg: '#F2D29B',
      content: (
        <BookTradesSection
          isMobile={false}
          trades={day.trades}
          settings={settings}
          dailyPnl={totalPnl}
          dailyR={totalR}
          onAddTrade={onAddTrade}
          onUpdateTrade={onUpdateTrade}
          onDeleteTrade={onDeleteTrade}
          onNotify={onNotify}
        />
      ),
    },
    {
      id: 'today-tl-p4',
      sectionLabel: 'TODAY • SELF AUDIT',
      pageTitle: 'REVIEW & FEELINGS',
      pastelHeaderBg: '#E2DCEB',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          {reviewQuestionsBlock}
          {feelingsBlock}
        </div>
      ),
    },
    {
      id: 'today-tl-p5',
      sectionLabel: 'TODAY • TOMORROW’S NOTE',
      pageTitle: 'LESSON FOR TOMORROW',
      pastelHeaderBg: '#E8E0A9',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <p className="text-[17px] font-bold text-[#5C3D2E] m-0">
            Write one simple takeaway to remember before trading tomorrow:
          </p>
          {lessonNotepadBlock(6)}
        </div>
      ),
    },
    {
      id: 'today-tl-p6',
      sectionLabel: 'TODAY • SESSION WRAP-UP',
      pageTitle: 'DAY RECAP & SAVE',
      pastelHeaderBg: '#BFE3C0',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-3">
          {dayRecapCard}
          <div className="lined-notepad flex-1 min-h-[60px] rounded-xl border border-dashed border-[#8B5E3C]/35 p-3 text-[16px] font-bold text-[#8B5E3C]">
            All rules, trades, and notes are automatically synced to your
            private cloud journal.
          </div>
          <SaveTodayActionBtn
            onUpdateAudit={onUpdateAudit}
            onNotify={onNotify}
          />
        </div>
      ),
    },
  ];
}
