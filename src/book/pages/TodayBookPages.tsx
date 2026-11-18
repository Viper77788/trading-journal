import React, { useState } from 'react';
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

interface TodayBookPagesProps {
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

// Page 3 Trade List + Bottom Sheet Component
const BookTradesPageContent: React.FC<{
  trades: TradeEntry[];
  settings: AccountSettings;
  dailyPnl: number;
  dailyR: number;
  onAddTrade: TodayBookPagesProps['onAddTrade'];
  onUpdateTrade: TodayBookPagesProps['onUpdateTrade'];
  onDeleteTrade: TodayBookPagesProps['onDeleteTrade'];
  onNotify: TodayBookPagesProps['onNotify'];
}> = ({
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

  const calculatedRiskPct =
    settings.accountSize > 0
      ? (((Number(riskDollar) || 0) / settings.accountSize) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {/* Top Rule Summary + Big 52px ADD TRADE Button */}
      <div className="p-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="text-[17px] font-bold text-[#5C3D2E]">
          Max <strong>{settings.maxTradesPerDay}</strong> trades • Risk limit{' '}
          <strong>
            {formatCurrency(maxRiskDollar)} ({settings.maxRiskPercent}%)
          </strong>
        </div>

        <button
          type="button"
          disabled={isAtLimit}
          onClick={openNewTradeSheet}
          className={`min-h-[52px] px-5 rounded-xl border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 shrink-0 transition-transform ${
            isAtLimit
              ? 'bg-[#F0DED4] text-[#8B5E3C]/60 cursor-not-allowed'
              : 'bg-[#BFE3C0] hover:bg-[#a9d8ab] text-[#2F6B3A] active:scale-95 cursor-pointer'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
          <span>ADD TRADE</span>
        </button>
      </div>

      {isAtLimit && (
        <div className="px-4 py-2.5 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] text-center shrink-0">
          {settings.maxTradesPerDay} trades done. Stop trading for today!
        </div>
      )}

      {/* Trade Cards List */}
      <div className="flex-1 space-y-2.5">
        {trades.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#FFFDF7] border-2 border-dashed border-[#8B5E3C]/60 text-center flex flex-col items-center justify-center min-h-[180px] gap-3">
            <div className="text-[18px] font-bold text-[#8B5E3C]">
              No trades yet today. Tap ADD TRADE to start.
            </div>
            <button
              type="button"
              onClick={openNewTradeSheet}
              className="min-h-[52px] px-5 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase text-[#2F6B3A] inline-flex items-center gap-2 cursor-pointer"
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
                <div className="rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] font-heading text-[17px] font-bold text-[#8B5E3C]">
                        #{trade.tradeNumber}
                      </span>
                      <span className="text-[19px] font-extrabold text-[#5C3D2E]">
                        {trade.asset}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]">
                        {trade.session}
                      </span>
                      <span className="text-[17px] font-semibold text-[#5C3D2E]">
                        Risk: <strong>{formatCurrency(trade.riskAmount)}</strong>{' '}
                        ({trade.riskPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3.5 py-1.5 rounded-xl border-2 border-[#8B5E3C] leading-none inline-flex items-baseline gap-1.5 ${
                          isWin
                            ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                            : 'bg-[#F5B8B0] text-[#9B2C20]'
                        }`}
                      >
                        <strong className="text-[18px] font-extrabold">
                          {formatCurrency(trade.outcome, true)}
                        </strong>
                        <span className="text-[16px] font-bold">
                          / {rString}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditTradeSheet(trade)}
                        aria-label="Edit trade"
                        className="w-[46px] h-[46px] rounded-xl bg-[#FFFBF2] hover:bg-[#F2D29B] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId((prev) =>
                            prev === trade.id ? null : trade.id
                          )
                        }
                        aria-label="Delete trade"
                        className="w-[46px] h-[46px] rounded-xl bg-[#FFFBF2] hover:bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[#9B2C20] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {isConfirmingDelete && (
                    <div className="px-3.5 py-2 rounded-xl bg-[#F5B8B0]/60 border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
                      <span className="text-[17px] font-bold text-[#9B2C20]">
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
                          className="min-h-[44px] px-4 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#9B2C20] cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[44px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {(violated || trade.notes || nonNoneMistakes.length > 0) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-dotted border-[#8B5E3C]/40">
                      <div className="flex flex-wrap items-center gap-2">
                        {violated && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20]">
                            Over your risk limit!
                          </span>
                        )}
                        {trade.notes && (
                          <span className="text-[17px] text-[#5C3D2E]">
                            {trade.notes}
                          </span>
                        )}
                      </div>
                      {nonNoneMistakes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {nonNoneMistakes.map((m) => (
                            <span
                              key={m}
                              className={`px-2.5 py-0.5 rounded-full border border-[#8B5E3C] text-[16px] font-bold ${
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
      <div className="px-4 py-3 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0 mt-auto">
        <div className="text-[18px] font-extrabold text-[#5C3D2E]">
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
        <div className="text-[18px] font-bold text-[#5C3D2E]">
          R total:{' '}
          <strong>
            <AnimatedNumber
              value={dailyR}
              formatter={(v) => formatRMultiple(v)}
            />
          </strong>
        </div>
      </div>

      {/* Slide-Up Bottom Sheet for Add / Edit Trade (§4: closes with swipe down or Close button) */}
      <AnimatePresence>
        {isSheetOpen && (
          <div
            onClick={() => setIsSheetOpen(false)}
            className="fixed inset-0 z-50 bg-[#5C3D2E]/45 backdrop-blur-[2px] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.45 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 450) {
                  setIsSheetOpen(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-t-3xl bg-[#FFFDF7] border-t-4 border-x-2 border-[#8B5E3C] shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
            >
              {/* Drag Handle Pill */}
              <div className="w-12 h-1.5 rounded-full bg-[#8B5E3C]/40 mx-auto -mt-1 mb-1 cursor-grab" />

              <div className="flex items-center justify-between border-b-2 border-dotted border-[#8B5E3C]/50 pb-2.5">
                <h3 className="font-heading text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
                  {editingTradeId ? 'EDIT TRADE' : 'ADD A TRADE'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  aria-label="Close bottom sheet"
                  className="w-[46px] h-[46px] rounded-full bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSheet} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[17px] font-bold text-[#5C3D2E] mb-1">
                      1. Pair / Asset
                    </label>
                    <input
                      type="text"
                      required
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      placeholder="Example: XAUUSD"
                      className="w-full min-h-[52px] px-4 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] outline-none"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[17px] font-bold text-[#5C3D2E]">
                        3. Money risked ($)
                      </label>
                      <span className="text-[17px] font-bold text-[#8B5E3C]">
                        ({calculatedRiskPct}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={riskDollar}
                      onChange={(e) => setRiskDollar(e.target.value)}
                      className="w-full min-h-[52px] px-4 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] outline-none"
                    />
                    {Number(riskDollar) > maxRiskDollar && (
                      <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[16px] font-bold text-[#9B2C20]">
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
                        onChange={(e) => setResultDollar(e.target.value)}
                        placeholder="$"
                        className="flex-1 min-w-0 min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] outline-none"
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
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Short note about this trade..."
                    className="w-full min-h-[52px] px-4 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] text-[#5C3D2E] outline-none"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((prev) => !prev)}
                    className="w-full min-h-[52px] px-4 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
                  >
                    <span>More details (optional)</span>
                    {showMoreDetails ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  {showMoreDetails && (
                    <div className="mt-2.5 p-4 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="block text-[17px] font-bold text-[#5C3D2E] mb-1.5">
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
                          <span className="block text-[17px] font-bold text-[#5C3D2E] mb-1.5">
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
                        <span className="block text-[17px] font-bold text-[#5C3D2E] mb-1.5">
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
                                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
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

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    className="min-h-[52px] px-5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[52px] px-6 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[19px] font-bold uppercase text-[#2F6B3A] cursor-pointer"
                  >
                    {editingTradeId ? 'Save Changes' : 'Save Trade'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Page 5 Lesson + Save Today Component
const BookLessonPageContent: React.FC<{
  day: DayRecord;
  onUpdateAudit: TodayBookPagesProps['onUpdateAudit'];
  onNotify: TodayBookPagesProps['onNotify'];
}> = ({ day, onUpdateAudit, onNotify }) => {
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSaveToday = () => {
    onUpdateAudit({ savedAt: new Date().toISOString() });
    setSavedBanner(true);
    onNotify('Saved today’s tracker sheet!', 'success');
    window.setTimeout(() => setSavedBanner(false), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5">
      <p className="text-[17px] font-bold text-[#5C3D2E] m-0">
        Write one key takeaway from today&apos;s session to keep top-of-mind
        before you trade tomorrow:
      </p>

      <div className="flex-1 flex flex-col min-h-[180px] rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden">
        <div className="px-4 py-2 bg-[#E8E0A9] border-b-2 border-[#8B5E3C] shrink-0">
          <label
            htmlFor="book-lesson-notepad"
            className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] block cursor-pointer"
          >
            LESSON FOR TOMORROW
          </label>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <textarea
            id="book-lesson-notepad"
            rows={6}
            value={day.audit.keyLesson || ''}
            onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
            placeholder="Write one simple thing to remember tomorrow..."
            className="lined-notepad flex-1 w-full px-2 text-[18px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none border-0"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveToday}
        className={`w-full min-h-[54px] rounded-xl border-2 border-[#8B5E3C] font-heading text-[20px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
          savedBanner
            ? 'bg-[#BFE3C0] text-[#2F6B3A]'
            : 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E]'
        }`}
      >
        {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
      </button>
    </div>
  );
};

export function buildTodayBookPages({
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

  return [
    // PAGE 1: Date + This Week's Habit Row + 3 Stat Cards
    {
      id: 'today-p1',
      sectionLabel: 'TODAY • DAILY SHEET',
      pageTitle: 'DAILY TRADING TRACKER',
      pastelHeaderBg: '#F2D29B',
      content: (
        <div className="space-y-3">
          {/* Date Bar with >=52px Prev / Next Buttons */}
          <div className="p-3 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[18px] font-extrabold text-[#5C3D2E]">
              {formatReadableDate(selectedDate)}
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectDate(shiftDateISO(selectedDate, -1))}
                aria-label="Previous day"
                className="min-h-[52px] min-w-[52px] px-3 rounded-xl bg-[#FFFDF7] hover:bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
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
                className="min-h-[52px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none cursor-pointer"
              />

              <button
                type="button"
                onClick={() => onSelectDate(shiftDateISO(selectedDate, 1))}
                aria-label="Next day"
                className="min-h-[52px] min-w-[52px] px-3 rounded-xl bg-[#FFFDF7] hover:bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {selectedDate !== todayIso && (
                <button
                  type="button"
                  onClick={() => onSelectDate(todayIso)}
                  className="min-h-[52px] px-3.5 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] cursor-pointer"
                >
                  Today
                </button>
              )}

              {Boolean(settings.showPrintButton) && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="no-print min-h-[52px] px-3.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-5 h-5" />
                  <span>Print</span>
                </button>
              )}
            </div>
          </div>

          {/* This Week's Habit Row with >=44px circles */}
          <div className="p-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-heading text-[17px] font-bold uppercase text-[#8B5E3C]">
                THIS WEEK&apos;S HABIT ROW
              </span>
              <div className="flex items-center gap-2.5 text-[15px] font-bold text-[#5C3D2E]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#BFE3C0] border border-[#8B5E3C]" />
                  Clean
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#F7E2A0] border border-[#8B5E3C]" />
                  Almost
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#F5B8B0] border border-[#8B5E3C]" />
                  Broken
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((wd) => {
                const evalRes = evaluateDayDiscipline(
                  daysMap[wd.dateIso],
                  settings
                );
                const status: DayDisciplineStatus = evalRes.hasTrades
                  ? evalRes.status
                  : 'empty';
                const isSelected = wd.dateIso === selectedDate;

                return (
                  <button
                    key={wd.dateIso}
                    type="button"
                    onClick={() => onSelectDate(wd.dateIso)}
                    className={`flex flex-col items-center py-1.5 rounded-xl transition-transform cursor-pointer ${
                      isSelected
                        ? 'bg-[#F2D29B]/75 ring-2 ring-[#8B5E3C]'
                        : 'hover:bg-[#F0DED4]/40'
                    }`}
                  >
                    <span className="font-heading text-[16px] font-bold text-[#8B5E3C]">
                      {wd.letter}
                    </span>
                    <div
                      className={`mt-1 w-[44px] h-[44px] rounded-full border-2 border-[#8B5E3C] flex items-center justify-center ${
                        status === 'green'
                          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                          : status === 'yellow'
                            ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                            : status === 'red'
                              ? 'bg-[#F5B8B0] text-[#9B2C20]'
                              : 'bg-[#FFFBF2] text-[#8B5E3C]'
                      }`}
                    >
                      {status === 'green' && (
                        <Check className="w-5 h-5 stroke-[3]" />
                      )}
                      {status === 'yellow' && (
                        <span className="text-[18px] font-extrabold leading-none">
                          ~
                        </span>
                      )}
                      {status === 'red' && <X className="w-5 h-5 stroke-[3]" />}
                      {status === 'empty' && (
                        <span className="text-[17px] font-bold">
                          {wd.dayNum}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Stat Cards: Discipline Score, Today's Profit/Loss, Trades Today */}
          <DisciplineGauge
            score={dayEval.score}
            dailyPnl={totalPnl}
            tradesCount={day.trades.length}
            maxTrades={settings.maxTradesPerDay}
          />
        </div>
      ),
    },

    // PAGE 2: Before You Trade Checklist & Ready Message
    {
      id: 'today-p2',
      sectionLabel: 'TODAY • PRE-SESSION',
      pageTitle: `BEFORE YOU TRADE (${checkedCount}/3)`,
      pastelHeaderBg: '#DCEEF2',
      content: (
        <div className="space-y-3.5">
          <p className="text-[17px] font-bold text-[#5C3D2E] m-0">
            Tick each rule circle below before placing your first trade today:
          </p>

          <div className="space-y-3">
            {checklistItems.map((item) => {
              const checked = day.checklist[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onUpdateChecklist({ [item.key]: !checked })}
                  style={{ backgroundColor: item.pastelBg }}
                  className="w-full min-h-[64px] px-4 py-3 rounded-2xl border-2 border-[#8B5E3C] flex items-center justify-between gap-3 text-left transition-transform active:scale-[0.99] cursor-pointer"
                >
                  <span
                    className={`text-[18px] font-extrabold text-[#5C3D2E] leading-snug ${
                      checked ? 'line-through opacity-80' : ''
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* >=44px Tick Circle */}
                  <span
                    className={`w-[46px] h-[46px] rounded-full border-2 border-[#8B5E3C] flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                        : 'bg-[#FFFDF7] text-transparent'
                    }`}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </span>
                </button>
              );
            })}
          </div>

          {!isAllReady ? (
            <div className="p-4 rounded-2xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[18px] font-extrabold text-[#5C3D2E]">
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
                className="min-h-[52px] px-5 rounded-xl bg-[#FFFDF7] hover:bg-[#F2D29B] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] cursor-pointer"
              >
                Tick all
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[19px] font-extrabold text-[#2F6B3A] text-center">
              You&apos;re ready to trade! ✓
            </div>
          )}
        </div>
      ),
    },

    // PAGE 3: My Trades Today + Add Trade Bottom Sheet + Total Bar
    {
      id: 'today-p3',
      sectionLabel: 'TODAY • EXECUTION LOG',
      pageTitle: 'MY TRADES TODAY',
      pastelHeaderBg: '#F2D29B',
      content: (
        <BookTradesPageContent
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

    // PAGE 4: End-of-Day Review (3 Yes/No questions) + "How did I feel today?" chips
    {
      id: 'today-p4',
      sectionLabel: 'TODAY • SELF AUDIT',
      pageTitle: 'END-OF-DAY REVIEW & FEELINGS',
      pastelHeaderBg: '#E2DCEB',
      content: (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {auditQuestions.map((q) => (
              <div
                key={q.key}
                style={{ backgroundColor: q.pastelBg }}
                className="p-3.5 rounded-2xl border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <span className="text-[18px] font-bold text-[#5C3D2E] leading-snug">
                  {q.label}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateAudit({ [q.key]: true })}
                    className={`min-h-[52px] min-w-[78px] px-4 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold transition-colors cursor-pointer ${
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
                    className={`min-h-[52px] min-w-[78px] px-4 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold transition-colors cursor-pointer ${
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

          <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-2.5">
            <div className="text-[18px] font-extrabold text-[#8B5E3C]">
              How did I feel today?
            </div>
            <div className="flex flex-wrap gap-2">
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
                    className={`min-h-[52px] px-4 py-2 rounded-full text-[17px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#8B5E3C] text-[#5C3D2E] shadow-xs'
                        : 'border border-[#8B5E3C]/60 text-[#8B5E3C]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },

    // PAGE 5: Lesson for Tomorrow (lined notepad) + SAVE TODAY button
    {
      id: 'today-p5',
      sectionLabel: 'TODAY • TOMORROW’S NOTE',
      pageTitle: 'LESSON FOR TOMORROW',
      pastelHeaderBg: '#E8E0A9',
      content: (
        <BookLessonPageContent
          day={day}
          onUpdateAudit={onUpdateAudit}
          onNotify={onNotify}
        />
      ),
    },
  ];
}
