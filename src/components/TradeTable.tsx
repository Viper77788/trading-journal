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

  const pastelCardColors = ['#FFFDF7', '#FFFDF7', '#FFFDF7'];

  return (
    <section aria-label="My Trades Today" className="space-y-4">
      {/* Pastel Section Heading Bar */}
      <div className="px-5 py-3 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#8B5E3C] m-0">
            MY TRADES TODAY
          </h2>
          <p className="text-[16px] font-semibold text-[#5C3D2E] m-0">
            Max {settings.maxTradesPerDay} trades per day • Max risk{' '}
            {formatCurrency(maxRiskDollar)} ({settings.maxRiskPercent}%) per
            trade
          </p>
        </div>

        {/* Big Pastel "+ ADD TRADE" Button */}
        <button
          type="button"
          disabled={isAtLimit}
          onClick={openNewTradeModal}
          className={`no-print min-h-[50px] px-6 py-2.5 rounded-2xl border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-transform ${
            isAtLimit
              ? 'bg-[#F0DED4] text-[#8B5E3C]/60 cursor-not-allowed'
              : 'bg-[#BFE3C0] hover:bg-[#a9d8ab] text-[#2F6B3A] active:scale-95 cursor-pointer shadow-sm'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
          <span>+ ADD TRADE</span>
        </button>
      </div>

      {/* If 3 trades are already added: show clear stop message */}
      {isAtLimit && (
        <div className="p-4 rounded-2xl bg-[#F7E2A0] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] text-center">
          {settings.maxTradesPerDay} trades done. Stop trading for today!
        </div>
      )}

      {/* Trade Cards List */}
      {trades.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#FFFDF7] border-2 border-dashed border-[#8B5E3C]/60 text-center space-y-3">
          <div className="text-[20px] font-bold text-[#8B5E3C]">
            No trades added yet today
          </div>
          <p className="text-[17px] text-[#5C3D2E] m-0">
            Tap the green <strong>+ ADD TRADE</strong> button above when you
            finish a trade.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade, index) => {
            const violated = isTradeRiskViolated(trade, settings);
            const isWin = trade.outcome >= 0;
            const sessionName =
              trade.session === 'London'
                ? 'London'
                : trade.session === 'NY'
                ? 'New York'
                : 'Outside Allowed Time';

            return (
              <ShakeOnError
                key={trade.id}
                triggerKey={`${trade.id}-${trade.riskAmount}-${violated}`}
                isError={violated}
              >
                <div
                  style={{
                    backgroundColor:
                      pastelCardColors[index % pastelCardColors.length],
                  }}
                  className="rounded-2xl border-2 border-[#8B5E3C] p-5 space-y-4"
                >
                  {/* Red Bar if Risk Limit Exceeded */}
                  {violated && (
                    <div className="px-4 py-2.5 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#9B2C20]">
                      Over your risk limit! (Risked{' '}
                      {formatCurrency(trade.riskAmount)}, limit is{' '}
                      {formatCurrency(maxRiskDollar)})
                    </div>
                  )}

                  {/* Top Row: "Trade 1" + Pair + Session on Left, Big Result + Edit/Delete on Right */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3.5 py-1 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] font-heading text-[18px] font-bold text-[#8B5E3C]">
                          Trade {trade.tradeNumber}
                        </span>
                        <span className="text-[22px] font-extrabold text-[#5C3D2E]">
                          {trade.asset}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-[#F0DED4] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]">
                          {sessionName}
                        </span>
                      </div>

                      <div className="text-[17px] font-semibold text-[#5C3D2E] pt-1">
                        Money risked:{' '}
                        <strong>{formatCurrency(trade.riskAmount)}</strong> (
                        {trade.riskPercent}% of account)
                      </div>
                    </div>

                    {/* Right: Big Green/Red Result + Edit & Delete Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div
                        className={`px-4 py-2 rounded-2xl border-2 border-[#8B5E3C] text-[24px] font-extrabold ${
                          isWin
                            ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                            : 'bg-[#F5B8B0] text-[#9B2C20]'
                        }`}
                      >
                        {formatCurrency(trade.outcome, true)}
                      </div>

                      <div className="no-print flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditTradeModal(trade)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFFBF2] hover:bg-[#F2D29B] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTrade(trade.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFFBF2] hover:bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#9B2C20] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Note or Mistake Chips if present */}
                  {(trade.notes ||
                    (trade.mistakes &&
                      trade.mistakes.some((m) => m !== 'None'))) && (
                    <div className="pt-3 border-t-2 border-dotted border-[#8B5E3C]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {trade.notes && (
                        <p className="text-[17px] text-[#5C3D2E] m-0">
                          <strong>Note:</strong> {trade.notes}
                        </p>
                      )}
                      {trade.mistakes &&
                        trade.mistakes.some((m) => m !== 'None') && (
                          <div className="flex flex-wrap gap-2">
                            {trade.mistakes
                              .filter((m) => m !== 'None')
                              .map((m) => (
                                <span
                                  key={m}
                                  className="px-3 py-1 rounded-full bg-[#F8D0CC] border border-[#8B5E3C] text-[16px] font-bold text-[#9B2C20]"
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
          })}
        </div>
      )}

      {/* Bottom Total Line */}
      <div className="p-4 sm:px-6 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-[19px] font-extrabold text-[#5C3D2E]">
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

      {/* SIMPLE 5-FIELD "+ ADD TRADE" POP-UP MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="no-print fixed inset-0 z-50 bg-[#5C3D2E]/45 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-2xl p-6 sm:p-7 my-8 max-h-[92vh] overflow-y-auto space-y-5"
            >
              <div className="flex items-center justify-between border-b-2 border-dotted border-[#8B5E3C]/50 pb-3">
                <h3 className="font-heading text-[26px] font-bold uppercase text-[#8B5E3C] m-0">
                  {editingTradeId ? 'EDIT TRADE' : 'ADD A TRADE'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-11 h-11 rounded-full bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-5">
                {/* Field 1: Pair / Asset */}
                <div className="space-y-1.5">
                  <label className="block text-[18px] font-bold text-[#5C3D2E]">
                    1. Pair / Asset
                  </label>
                  <input
                    type="text"
                    required
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    placeholder="Example: XAUUSD or NQ"
                    className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] outline-none"
                  />
                </div>

                {/* Field 2: Session (two big buttons: London / New York) */}
                <div className="space-y-1.5">
                  <label className="block text-[18px] font-bold text-[#5C3D2E]">
                    2. Session
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSession('London')}
                      className={`min-h-[52px] rounded-2xl border-2 border-[#8B5E3C] text-[18px] font-bold cursor-pointer transition-colors ${
                        session === 'London'
                          ? 'bg-[#DCEEF2] text-[#5C3D2E] shadow-sm'
                          : 'bg-[#FFFBF2] text-[#8B5E3C]'
                      }`}
                    >
                      London (1–4 AM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSession('NY')}
                      className={`min-h-[52px] rounded-2xl border-2 border-[#8B5E3C] text-[18px] font-bold cursor-pointer transition-colors ${
                        session === 'NY'
                          ? 'bg-[#F2D29B] text-[#5C3D2E] shadow-sm'
                          : 'bg-[#FFFBF2] text-[#8B5E3C]'
                      }`}
                    >
                      New York (8–11 AM)
                    </button>
                  </div>
                </div>

                {/* Field 3: How much did I risk? ($ with auto % shown next to it) */}
                <div className="space-y-1.5">
                  <label className="block text-[18px] font-bold text-[#5C3D2E]">
                    3. How much did I risk? ($)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={riskDollar}
                      onChange={(e) => setRiskDollar(e.target.value)}
                      className="flex-1 min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] outline-none"
                    />
                    <span className="text-[16px] font-bold text-[#8B5E3C] px-3 py-2 rounded-xl bg-[#F0DED4] border border-[#8B5E3C]">
                      = {calculatedRiskPctInModal}% of your account
                    </span>
                  </div>
                  {Number(riskDollar) > maxRiskDollar && (
                    <div className="px-3.5 py-2 rounded-xl bg-[#F5B8B0] border border-[#8B5E3C] text-[16px] font-bold text-[#9B2C20]">
                      Warning: This is over your {formatCurrency(maxRiskDollar)}{' '}
                      ({settings.maxRiskPercent}%) risk limit!
                    </div>
                  )}
                </div>

                {/* Field 4: Result (two big buttons: WIN green / LOSS red, then amount in $) */}
                <div className="space-y-2">
                  <label className="block text-[18px] font-bold text-[#5C3D2E]">
                    4. Result
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResultType('WIN')}
                      className={`min-h-[52px] rounded-2xl border-2 border-[#8B5E3C] text-[18px] font-extrabold cursor-pointer transition-colors ${
                        resultType === 'WIN'
                          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                          : 'bg-[#FFFBF2] text-[#8B5E3C]'
                      }`}
                    >
                      WIN ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultType('LOSS')}
                      className={`min-h-[52px] rounded-2xl border-2 border-[#8B5E3C] text-[18px] font-extrabold cursor-pointer transition-colors ${
                        resultType === 'LOSS'
                          ? 'bg-[#F5B8B0] text-[#9B2C20]'
                          : 'bg-[#FFFBF2] text-[#8B5E3C]'
                      }`}
                    >
                      LOSS ✕
                    </button>
                  </div>
                  <div className="pt-1">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={resultDollar}
                      onChange={(e) => setResultDollar(e.target.value)}
                      placeholder="Amount in $ (example: 500)"
                      className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] outline-none"
                    />
                  </div>
                </div>

                {/* Field 5: Quick note (optional) */}
                <div className="space-y-1.5">
                  <label className="block text-[18px] font-bold text-[#5C3D2E]">
                    5. Quick note (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Short note about this trade..."
                    className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] text-[#5C3D2E] outline-none"
                  />
                </div>

                {/* Collapsible "More details (optional)" — closed by default */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((prev) => !prev)}
                    className="w-full min-h-[48px] px-4 py-2 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
                  >
                    <span>More details (optional)</span>
                    {showMoreDetails ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  {showMoreDetails && (
                    <div className="mt-3 p-4 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-4">
                      {/* Setup Quality (1-5 circles) */}
                      <div>
                        <span className="block text-[17px] font-bold text-[#5C3D2E] mb-2">
                          Setup Quality (1 to 5)
                        </span>
                        <div className="flex items-center gap-2.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSetupQuality(num)}
                              className={`w-11 h-11 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
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

                      {/* Discipline (1-5 circles) */}
                      <div>
                        <span className="block text-[17px] font-bold text-[#5C3D2E] mb-2">
                          Discipline (1 to 5)
                        </span>
                        <div className="flex items-center gap-2.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setDisciplineScore(num)}
                              className={`w-11 h-11 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
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

                      {/* Mistake tags */}
                      <div>
                        <span className="block text-[17px] font-bold text-[#5C3D2E] mb-2">
                          Mistake tags
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {MISTAKE_TAGS.map((tag) => {
                            const selected = mistakes.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleMistakeInModal(tag)}
                                className={`min-h-[44px] px-3.5 py-1.5 rounded-2xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
                                  selected
                                    ? tag === 'None'
                                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
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
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-[52px] px-5 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#5C3D2E] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[52px] px-6 rounded-2xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[20px] font-bold uppercase text-[#2F6B3A] cursor-pointer"
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
