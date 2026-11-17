import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Star,
  AlertOctagon,
  Sliders,
  Ban,
  TrendingUp,
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
  onAddTrade: () => { ok: boolean; reason?: string };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onNotify: (title: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  dailyPnl: number;
  dailyR: number;
}

interface StarRatingCellProps {
  value: number;
  onChange: (next: number) => void;
  activeColorClass?: string;
}

const StarRatingCell: React.FC<StarRatingCellProps> = ({
  value,
  onChange,
  activeColorClass = 'text-amber-400 fill-amber-400',
}) => {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered || value) >= star;
        return (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.22, y: -1 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="p-0.5 rounded focus:outline-none cursor-pointer"
          >
            <Star
              className={`w-4 h-4 transition-all duration-150 ${
                isFilled
                  ? `${activeColorClass} drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]`
                  : 'text-slate-600'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
};

export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  settings,
  onUpdateSettings,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onNotify,
  dailyPnl,
  dailyR,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [limitShakeCount, setLimitShakeCount] = useState(0);

  const maxRiskDollar = getMaxRiskDollar(settings);
  const isAtLimit = trades.length >= settings.maxTradesPerDay;

  const handleAddClick = () => {
    if (isAtLimit) {
      setLimitShakeCount((c) => c + 1);
      onNotify(
        `${settings.maxTradesPerDay}-trade limit reached, stop trading!`,
        'warning'
      );
      return;
    }
    const res = onAddTrade();
    if (!res.ok && res.reason) {
      setLimitShakeCount((c) => c + 1);
      onNotify(res.reason, 'warning');
    } else {
      onNotify(`Trade #${trades.length + 1} added to today's log`, 'success');
    }
  };

  const toggleMistakeTag = (trade: TradeEntry, tag: MistakeTag) => {
    const current = trade.mistakes || [];
    if (tag === 'None') {
      onUpdateTrade(trade.id, { mistakes: ['None'] });
      return;
    }

    const withoutNone = current.filter((m) => m !== 'None');
    const exists = withoutNone.includes(tag);
    const next = exists
      ? withoutNone.filter((m) => m !== tag)
      : [...withoutNone, tag];

    onUpdateTrade(trade.id, {
      mistakes: next.length === 0 ? ['None'] : next,
    });
  };

  return (
    <div className="space-y-6">
      {/* B) ACCOUNT SETTINGS BAR (Editable, saved globally) */}
      <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-slate-100">
              B) Account &amp; Risk Guardrails
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Saved globally • Auto-syncs Risk % &amp; Risk $
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Account Size */}
          <div className="p-4 rounded-xl bg-[#0B0F19]/90 border border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Account Size ($)
            </label>
            <input
              type="number"
              min={100}
              step={500}
              value={settings.accountSize}
              onChange={(e) =>
                onUpdateSettings({
                  accountSize: Math.max(100, Number(e.target.value) || 0),
                })
              }
              className="w-full bg-[#111827] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-base font-bold font-mono text-slate-100 outline-none transition-colors"
            />
          </div>

          {/* Max Risk % per trade */}
          <div className="p-4 rounded-xl bg-[#0B0F19]/90 border border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Max Risk % / Trade
            </label>
            <div className="relative">
              <input
                type="number"
                min={0.1}
                max={20}
                step={0.1}
                value={settings.maxRiskPercent}
                onChange={(e) =>
                  onUpdateSettings({
                    maxRiskPercent: Math.max(0.1, Number(e.target.value) || 0.1),
                  })
                }
                className="w-full bg-[#111827] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 pr-8 text-base font-bold font-mono text-slate-100 outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                %
              </span>
            </div>
          </div>

          {/* Max Risk $ per trade (Auto-calculated) */}
          <div className="p-4 rounded-xl bg-[#0B0F19]/90 border border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Max Risk $ / Trade (Auto)
            </label>
            <div className="h-[42px] px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-base font-bold font-mono text-emerald-300">
                {formatCurrency(maxRiskDollar)}
              </span>
              <span className="text-[11px] font-medium text-emerald-400/80">
                {settings.maxRiskPercent}% Cap
              </span>
            </div>
          </div>

          {/* Max Trades per Day */}
          <div className="p-4 rounded-xl bg-[#0B0F19]/90 border border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Max Trades / Day
            </label>
            <input
              type="number"
              min={1}
              max={15}
              step={1}
              value={settings.maxTradesPerDay}
              onChange={(e) =>
                onUpdateSettings({
                  maxTradesPerDay: Math.max(
                    1,
                    Math.min(15, Math.round(Number(e.target.value) || 3))
                  ),
                })
              }
              className="w-full bg-[#111827] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-base font-bold font-mono text-slate-100 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* C) TRADE LOG TABLE */}
      <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-100">
                C) Daily Trade Execution Log
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#0B0F19] text-slate-300 border border-slate-700">
                {trades.length} / {settings.maxTradesPerDay} Trades
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Max {settings.maxTradesPerDay} trades/day • Risk cap{' '}
              {settings.maxRiskPercent}% ({formatCurrency(maxRiskDollar)}) per
              trade
            </p>
          </div>

          {/* Add Trade Button with Shake on Limit Reached */}
          <ShakeOnError triggerKey={limitShakeCount} isError={limitShakeCount > 0}>
            <motion.button
              type="button"
              whileHover={isAtLimit ? undefined : { y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddClick}
              title={
                isAtLimit
                  ? `${settings.maxTradesPerDay}-trade limit reached, stop trading!`
                  : 'Log a new trade execution'
              }
              className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isAtLimit
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-[#0B0F19] shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isAtLimit ? (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Limit Reached ({trades.length}/{settings.maxTradesPerDay})</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Trade #{trades.length + 1}</span>
                </>
              )}
            </motion.button>
          </ShakeOnError>
        </div>

        {/* 3-Trade Limit Reached Warning Banner */}
        <AnimatePresence>
          {isAtLimit && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between gap-3 text-rose-200">
                <div className="flex items-center gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="text-sm font-bold">
                    {settings.maxTradesPerDay}-trade limit reached, stop trading!
                  </span>
                </div>
                <span className="text-xs font-medium text-rose-300 hidden sm:inline">
                  Protect your mental capital and complete your Daily Audit below.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trade Rows */}
        {trades.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 px-4 rounded-2xl bg-[#0B0F19]/60 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3"
            >
              <TrendingUp className="w-6 h-6" />
            </motion.div>
            <h4 className="text-base font-bold text-slate-200">
              No trades logged for this session yet
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              Wait for a clean London (1–4 AM EST) or NY (8–11 AM EST) setup,
              then click &ldquo;Add Trade #1&rdquo; above.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {trades.map((trade) => {
                const violated = isTradeRiskViolated(trade, settings);
                const isProfit = trade.outcome > 0;
                const isLoss = trade.outcome < 0;
                const rVal =
                  trade.riskAmount > 0
                    ? trade.outcome / trade.riskAmount
                    : 0;

                return (
                  <motion.div
                    key={trade.id}
                    layout
                    initial={{ opacity: 0, y: -16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, height: 0 }}
                    transition={{ duration: 0.25 }}
                    whileHover={
                      shouldReduceMotion ? undefined : { y: -1 }
                    }
                    className={`rounded-2xl p-5 border transition-colors ${
                      violated
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_25px_-6px_rgba(239,68,68,0.3)]'
                        : 'bg-[#0B0F19]/85 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Grid of Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
                      {/* 1. Trade # & Session Dropdown */}
                      <div className="lg:col-span-2 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-slate-200 flex items-center justify-center shrink-0">
                          #{trade.tradeNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Session
                          </label>
                          <select
                            value={trade.session}
                            onChange={(e) =>
                              onUpdateTrade(trade.id, {
                                session: e.target.value as TradingSession,
                              })
                            }
                            className={`w-full rounded-xl px-2.5 py-2 text-xs font-semibold border outline-none cursor-pointer ${
                              trade.session === 'Outside'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-[#111827] border-slate-700/80 text-slate-100'
                            }`}
                          >
                            <option value="London">London (1–4 AM EST)</option>
                            <option value="NY">NY (8–11 AM EST)</option>
                            <option value="Outside">Outside Window</option>
                          </select>
                        </div>
                      </div>

                      {/* 2. Asset / Pair */}
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Asset / Pair
                        </label>
                        <input
                          type="text"
                          value={trade.asset}
                          placeholder="e.g. XAUUSD / MGC"
                          onChange={(e) =>
                            onUpdateTrade(trade.id, { asset: e.target.value })
                          }
                          className="w-full bg-[#111827] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 outline-none"
                        />
                      </div>

                      {/* 3. Risk % & Risk ($) Auto-Synced with Violation Shake */}
                      <div className="lg:col-span-3">
                        <ShakeOnError
                          triggerKey={`${trade.riskPercent}-${trade.riskAmount}-${violated}`}
                          isError={violated}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Risk %
                              </label>
                              <input
                                type="number"
                                step={0.1}
                                min={0}
                                value={trade.riskPercent}
                                onChange={(e) =>
                                  onUpdateTrade(trade.id, {
                                    riskPercent:
                                      Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className={`w-full rounded-xl px-2.5 py-2 text-xs font-mono font-bold border outline-none ${
                                  violated
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                                    : 'bg-[#111827] border-slate-700/80 text-slate-100 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Risk ($)
                              </label>
                              <input
                                type="number"
                                step={10}
                                min={0}
                                value={trade.riskAmount}
                                onChange={(e) =>
                                  onUpdateTrade(trade.id, {
                                    riskAmount:
                                      Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className={`w-full rounded-xl px-2.5 py-2 text-xs font-mono font-bold border outline-none ${
                                  violated
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                                    : 'bg-[#111827] border-slate-700/80 text-slate-100 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        </ShakeOnError>

                        {/* Pulsing Red Risk Cap Violated Badge */}
                        <AnimatePresence>
                          {violated && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                boxShadow: [
                                  '0 0 0 0 rgba(239,68,68,0.4)',
                                  '0 0 12px 2px rgba(239,68,68,0.35)',
                                  '0 0 0 0 rgba(239,68,68,0.4)',
                                ],
                              }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{
                                boxShadow: { duration: 1.6, repeat: Infinity },
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/25 text-rose-200 border border-rose-500/60"
                            >
                              <AlertOctagon className="w-3 h-3 text-rose-400" />
                              <span>Risk cap violated</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 4. Setup Quality & Discipline Score Stars */}
                      <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Setup Quality
                          </label>
                          <StarRatingCell
                            value={trade.setupQuality}
                            onChange={(val) =>
                              onUpdateTrade(trade.id, { setupQuality: val })
                            }
                            activeColorClass="text-amber-400 fill-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Discipline
                          </label>
                          <StarRatingCell
                            value={trade.disciplineScore}
                            onChange={(val) =>
                              onUpdateTrade(trade.id, { disciplineScore: val })
                            }
                            activeColorClass="text-emerald-400 fill-emerald-400"
                          />
                        </div>
                      </div>

                      {/* 5. Outcome (+/- $) & Delete */}
                      <div className="lg:col-span-2 flex items-end gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Outcome ($)
                            </label>
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                rVal > 0
                                  ? 'text-emerald-400'
                                  : rVal < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatRMultiple(rVal)}
                            </span>
                          </div>
                          <input
                            type="number"
                            step={25}
                            value={trade.outcome}
                            onChange={(e) =>
                              onUpdateTrade(trade.id, {
                                outcome: Number(e.target.value) || 0,
                              })
                            }
                            className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold border outline-none transition-colors ${
                              isProfit
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                : isLoss
                                ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                                : 'bg-[#111827] border-slate-700/80 text-slate-100'
                            }`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteTrade(trade.id)}
                          title="Delete trade"
                          className="h-[34px] w-[34px] rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/70 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Mistake Tag Chips & Psychology Notes Textarea */}
                    <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      <div className="lg:col-span-6">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Mistake Check Tags
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {MISTAKE_TAGS.map((tag) => {
                            const selected = (trade.mistakes || []).includes(
                              tag
                            );
                            const isNone = tag === 'None';
                            return (
                              <motion.button
                                key={tag}
                                type="button"
                                whileTap={{ scale: 0.94 }}
                                onClick={() => toggleMistakeTag(trade, tag)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                  selected
                                    ? isNone
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-[#111827] text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {tag}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="lg:col-span-6">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Psychology Notes &amp; Execution Context
                        </label>
                        <textarea
                          rows={2}
                          value={trade.notes}
                          placeholder="Why did you take this setup? How did you manage emotions & stop loss?"
                          onChange={(e) =>
                            onUpdateTrade(trade.id, { notes: e.target.value })
                          }
                          className="w-full bg-[#111827] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none resize-y"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Running Daily P&L Total & R-Multiple Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Daily Risk Cap:{' '}
            <strong className="text-slate-200 font-mono">
              {settings.maxTradesPerDay} × {formatCurrency(maxRiskDollar)} ={' '}
              {formatCurrency(maxRiskDollar * settings.maxTradesPerDay)}
            </strong>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Daily R-Multiple:
              </span>
              <span
                className={`text-base font-bold font-mono ${
                  dailyR > 0
                    ? 'text-emerald-400'
                    : dailyR < 0
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                <AnimatedNumber
                  value={dailyR}
                  formatter={(v) => formatRMultiple(v)}
                />
              </span>
            </div>

            <div
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                dailyPnl > 0
                  ? 'bg-emerald-500/15 border-emerald-500/40'
                  : dailyPnl < 0
                  ? 'bg-rose-500/15 border-rose-500/40'
                  : 'bg-[#0B0F19] border-slate-800'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Running Daily P&amp;L:
              </span>
              <span
                className={`text-lg font-extrabold font-mono ${
                  dailyPnl > 0
                    ? 'text-emerald-300'
                    : dailyPnl < 0
                    ? 'text-rose-300'
                    : 'text-slate-100'
                }`}
              >
                <AnimatedNumber
                  value={dailyPnl}
                  formatter={(v) => formatCurrency(v, true)}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
