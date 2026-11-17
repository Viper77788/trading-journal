import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import {
  TradeEntry,
  TradingSession,
  MistakeTag,
  MISTAKE_TAGS,
} from '../types/trade';
import { AccountSettings } from '../types/settings';
import {
  getMaxRiskDollar,
  isTradeRiskViolated,
  isMinorMistake,
} from '../utils/calculations';
import { formatCurrency, formatRMultiple } from '../utils/formatters';
import { AnimatedNumber } from './animations/AnimatedNumber';
import { ShakeOnError } from './animations/ShakeOnError';

interface TradeTableProps {
  trades: TradeEntry[];
  settings: AccountSettings;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onAddTrade: (customPayload?: Partial<TradeEntry>) => {
    ok: boolean;
    reason?: string;
  };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
  dailyPnl: number;
  dailyR: number;
}

export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  settings,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onNotify,
  dailyPnl,
  dailyR,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // 5 Simple Fields for the Pop-up Form
  const [asset, setAsset] = useState('XAUUSD');
  const [session, setSession] = useState<TradingSession>('NY');
  const [riskDollar, setRiskDollar] = useState<string>('250');
  const [resultType, setResultType] = useState<'WIN' | 'LOSS'>('WIN');
  const [resultDollar, setResultDollar] = useState<string>('500');
  const [notes, setNotes] = useState('');

  // Optional More Details
  const [setupQuality, setSetupQuality] = useState<number>(4);
  const [disciplineScore, setDisciplineScore] = useState<number>(5);
  const [mistakes, setMistakes] = useState<MistakeTag[]>(['None']);

  const maxRiskDollar = getMaxRiskDollar(settings);
  const isAtLimit = trades.length >= settings.maxTradesPerDay;

  const openNewTradeModal = () => {
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
    setIsModalOpen(true);
  };

  const openEditTradeModal = (t: TradeEntry) => {
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
    setIsModalOpen(true);
  };

  const toggleMistakeInModal = (tag: MistakeTag) => {
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

  const handleSaveModal = (e: React.FormEvent) => {
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
    setIsModalOpen(false);
  };

  const calculatedRiskPctInModal =
    settings.accountSize > 0
      ? (((Number(riskDollar) || 0) / settings.accountSize) * 100).toFixed(1)
      : '0.0';

  return (
    <section
      aria-label="My Trades Today"
      className="flex flex-col h-full min-h-0 gap-2.5"
    >
      {/* Slim Pastel Heading Bar + Single Plus "ADD TRADE" Button (§2) */}
      <div className="px-4 py-2 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h2 className="font-heading text-[19px] font-bold uppercase text-[#8B5E3C] m-0 leading-tight">
            MY TRADES TODAY
          </h2>
          <span className="text-[16px] font-semibold text-[#5C3D2E] block leading-tight">
            Max {settings.maxTradesPerDay} trades • Limit{' '}
            {formatCurrency(maxRiskDollar)} ({settings.maxRiskPercent}%)
          </span>
        </div>

        <button
          type="button"
          disabled={isAtLimit}
          onClick={openNewTradeModal}
          className={`no-print h-[42px] px-4 rounded-xl border-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 shrink-0 transition-transform ${
            isAtLimit
              ? 'bg-[#F0DED4] text-[#8B5E3C]/60 cursor-not-allowed'
              : 'bg-[#BFE3C0] hover:bg-[#a9d8ab] text-[#2F6B3A] active:scale-95 cursor-pointer'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.8]" />
          <span>ADD TRADE</span>
        </button>
      </div>

      {/* Stop Trading Banner when 3 trades reached */}
      {isAtLimit && (
        <div className="px-3.5 py-2 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] text-center shrink-0">
          {settings.maxTradesPerDay} trades done. Stop trading for today!
        </div>
      )}

      {/* Scrollable Trade Cards List */}
      <div className="flex-1 panel-scroll space-y-2.5 pr-0.5">
        {trades.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#FFFDF7] border-2 border-dashed border-[#8B5E3C]/60 text-center flex flex-col items-center justify-center h-full min-h-[180px] gap-3">
            <div className="text-[18px] font-bold text-[#8B5E3C]">
              No trades yet today. Tap ADD TRADE to start.
            </div>
            <button
              type="button"
              onClick={openNewTradeModal}
              className="no-print h-[42px] px-4 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase text-[#2F6B3A] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
              <span>ADD TRADE</span>
            </button>
          </div>
        ) : (
          trades.map((trade) => {
            const violated = isTradeRiskViolated(trade, settings);
            const isWin = trade.outcome >= 0;
            const sessionName =
              trade.session === 'London'
                ? 'London'
                : trade.session === 'NY'
                ? 'NY'
                : 'Outside';
            const nonNoneMistakes = (trade.mistakes || []).filter(
              (m) => m !== 'None'
            );
            const tradeR =
              trade.riskAmount > 0
                ? Math.round((trade.outcome / trade.riskAmount) * 10) / 10
                : 0;
            const rString =
              tradeR > 0 ? `+${tradeR}R` : `${tradeR}R`;
            const isConfirmingDelete = confirmDeleteId === trade.id;

            return (
              <ShakeOnError
                key={trade.id}
                triggerKey={`${trade.id}-${trade.riskAmount}-${violated}`}
                isError={violated}
              >
                {/* Compact Row Card (~90px tall) */}
                <div className="rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] px-3.5 py-2.5 space-y-1.5">
                  {/* Line 1: Trade #, pair, session chip, money risked (% of account) | Result badge (+$336.00 / +1.5R) + Edit/Delete icon buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] font-heading text-[16px] font-bold text-[#8B5E3C]">
                        #{trade.tradeNumber}
                      </span>
                      <span className="text-[18px] font-extrabold text-[#5C3D2E]">
                        {trade.asset}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]">
                        {sessionName}
                      </span>
                      <span className="text-[16px] font-semibold text-[#5C3D2E]">
                        Risk: <strong>{formatCurrency(trade.riskAmount)}</strong>{' '}
                        ({trade.riskPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Profit + R result next to it (§7) */}
                      <span
                        className={`px-3 py-1 rounded-xl border-2 border-[#8B5E3C] leading-none inline-flex items-baseline gap-1.5 ${
                          isWin
                            ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                            : 'bg-[#F5B8B0] text-[#9B2C20]'
                        }`}
                      >
                        <strong className="text-[18px] font-extrabold">
                          {formatCurrency(trade.outcome, true)}
                        </strong>
                        <span className="text-[15px] font-bold opacity-90">
                          / {rString}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditTradeModal(trade)}
                        aria-label="Edit trade"
                        title="Edit trade"
                        className="no-print w-9 h-9 rounded-lg bg-[#FFFBF2] hover:bg-[#F2D29B] border border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
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
                        title="Delete trade"
                        className="no-print w-9 h-9 rounded-lg bg-[#FFFBF2] hover:bg-[#F5B8B0] border border-[#8B5E3C] text-[#9B2C20] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation (§7: "Delete this trade? Yes / Cancel") */}
                  {isConfirmingDelete && (
                    <div className="no-print px-3 py-1.5 rounded-lg bg-[#F5B8B0]/60 border border-[#8B5E3C] flex items-center justify-between gap-2">
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
                          className="px-3 py-1 rounded-lg bg-[#F5B8B0] hover:bg-[#efa197] border border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20] cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-lg bg-[#FFFDF7] hover:bg-[#F0DED4] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Line 2: Risk limit warning, note, and mistake tags */}
                  {(violated || trade.notes || nonNoneMistakes.length > 0) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dotted border-[#8B5E3C]/40">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {violated && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20]">
                            Over your risk limit!
                          </span>
                        )}
                        {trade.notes && (
                          <span className="text-[16px] text-[#5C3D2E] truncate max-w-md">
                            {trade.notes}
                          </span>
                        )}
                      </div>

                      {nonNoneMistakes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {nonNoneMistakes.map((m) => {
                            const minor = isMinorMistake(m);
                            return (
                              <span
                                key={m}
                                className={`px-2.5 py-0.5 rounded-full border border-[#8B5E3C] text-[16px] font-bold ${
                                  minor
                                    ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                                    : 'bg-[#F8D0CC] text-[#9B2C20]'
                                }`}
                              >
                                {m}
                              </span>
                            );
                          })}
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

      {/* Slim Bottom Bar: Total today & R total */}
      <div className="px-4 py-2.5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0">
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

      {/* §6. COMPACT 2-COLUMN ADD TRADE POP-UP MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="no-print fixed inset-0 z-50 bg-[#5C3D2E]/45 backdrop-blur-[2px] flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-2xl p-5 space-y-4 max-h-[94vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-2 border-dotted border-[#8B5E3C]/50 pb-2.5">
                <h3 className="font-heading text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
                  {editingTradeId ? 'EDIT TRADE' : 'ADD A TRADE'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-3.5">
                {/* Row 1 (2 Columns): Pair / Asset + Session */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      1. Pair / Asset
                    </label>
                    <input
                      type="text"
                      required
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      placeholder="Example: XAUUSD"
                      className="w-full h-[46px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      2. Session
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSession('London')}
                        className={`h-[46px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
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
                        className={`h-[46px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
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

                {/* Row 2 (2 Columns): Risk ($) + Result (WIN/LOSS + $) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[16px] font-bold text-[#5C3D2E]">
                        3. Money risked ($)
                      </label>
                      <span className="text-[16px] font-bold text-[#8B5E3C]">
                        ({calculatedRiskPctInModal}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={riskDollar}
                      onChange={(e) => setRiskDollar(e.target.value)}
                      className="w-full h-[46px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                    />
                    {Number(riskDollar) > maxRiskDollar && (
                      <div className="mt-1 px-2.5 py-1 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[16px] font-bold text-[#9B2C20]">
                        Over {formatCurrency(maxRiskDollar)} risk limit!
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                      4. Result ($ amount)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setResultType('WIN')}
                        className={`h-[46px] px-3 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer shrink-0 ${
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
                        className={`h-[46px] px-3 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer shrink-0 ${
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
                        className="flex-1 min-w-0 h-[46px] px-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Quick Note */}
                <div>
                  <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                    5. Quick note (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Short note about this trade..."
                    className="w-full h-[46px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[16px] text-[#5C3D2E] outline-none"
                  />
                </div>

                {/* Collapsible "More details (optional)" */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((prev) => !prev)}
                    className="w-full h-[42px] px-3.5 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
                  >
                    <span>More details (optional)</span>
                    {showMoreDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showMoreDetails && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                            Setup Quality (1–5)
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setSetupQuality(num)}
                                className={`w-9 h-9 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
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
                          <span className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                            Discipline (1–5)
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setDisciplineScore(num)}
                                className={`w-9 h-9 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
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
                        <span className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                          Mistake tags (Yellow = Small mistake • Red = Rule break)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {MISTAKE_TAGS.map((tag) => {
                            const selected = mistakes.includes(tag);
                            const minor = isMinorMistake(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleMistakeInModal(tag)}
                                className={`px-3 py-1 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
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

                {/* Modal Action Buttons */}
                <div className="pt-1 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-[46px] px-5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-[46px] px-6 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase text-[#2F6B3A] cursor-pointer"
                  >
                    {editingTradeId ? 'Save Changes' : 'Save Trade'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
