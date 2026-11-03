import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Shield, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import MultiSelect from './MultiSelect';
import {
  SETUP_OPTIONS,
  EMOTIONS_BEFORE,
  EMOTIONS_AFTER,
  GOLD_FUTURES_CONTRACTS,
  ZONE_INTERACTION_TYPES,
  BEHAVIORAL_LEAK_TAGS,
  VIPER_14_RULES,
} from '../../constants';
import { useAccount } from '../../context/AccountContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { checkCircuitBreaker } from '../../utils/aiAdvisor';
import { timeToIsoInTimezone, formatTimeInUserTimezone } from '../../utils/timezoneUtils';
import { evaluateTrade14Rules } from '../../utils/viperRuleEngine';

const extractTime = (val, userTz, dateStr) => {
  if (!val) return '';
  const formatted = formatTimeInUserTimezone(val, userTz, dateStr);
  if (formatted && formatted !== '—') return formatted;
  const s = String(val).trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
  }
  return '';
};

const AddTradeModal = ({ trade, isViewOnly, onSave, onCancel, loading, trades = [] }) => {
  const { accounts, activeAccountId } = useAccount();
  const { userTimezone } = useUserPreferences();

  const [formData, setFormData] = useState({
    accountId: activeAccountId !== 'all' ? activeAccountId : (accounts[0]?.id || ''),
    tradeDate: '',
    openTime: '',
    closeTime: '',
    pair: 'MGCZ6',
    direction: 'Long',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    profitLoss: '',
    rr: '',
    tradeResult: 'Auto',
    tradingViewLink: '',
    setup: [],
    zoneType: 'SUPPORT_386641',
    zoneInteraction: 'Yes',
    candleCloseConfirmation: 'Yes',
    stopLossRespected: 'Yes',
    behavioralLeaks: [],
    planFollowed: 'No',
    previous4HourDirection: 'No',
    previousWeeklyDirection: 'No',
    previousDailyDirection: 'No',
    previous1HourDirection: 'No',
    leftSideRangeClean: 'No',
    confidenceScore: 5,
    emotionBeforeTrade: 'Calm',
    emotionAfterTrade: 'Neutral',
    mistakes: '',
    lessons: '',
    comments: '',
    screenshotUrl: '',
  });

  const selectedAccount = accounts.find((a) => a.id === formData.accountId);
  const dailyLossLimit = Number(selectedAccount?.maxDailyLoss) || 600;
  const circuitBreakerInfo = !trade && !isViewOnly ? checkCircuitBreaker(selectedAccount, trades) : null;

  useEffect(() => {
    if (trade) {
      setFormData({
        ...trade,
        accountId: trade.accountId || (activeAccountId !== 'all' ? activeAccountId : accounts[0]?.id || ''),
        setup: Array.isArray(trade.setup) ? trade.setup : trade.setup ? trade.setup.split(',') : [],
        behavioralLeaks: Array.isArray(trade.behavioralLeaks) ? trade.behavioralLeaks : [],
        zoneType: trade.zoneType || 'NONE',
        zoneInteraction: trade.zoneInteraction || (trade.zoneType && trade.zoneType !== 'NONE' ? 'Yes' : 'No'),
        candleCloseConfirmation: trade.candleCloseConfirmation || 'Yes',
        stopLossRespected: trade.stopLossRespected || 'Yes',
        tradeDate: trade.tradeDate ? trade.tradeDate.split('T')[0] : '',
        openTime: extractTime(trade.openTime, userTimezone, trade.tradeDate),
        closeTime: extractTime(trade.closeTime, userTimezone, trade.tradeDate),
      });
    } else if (activeAccountId !== 'all') {
      setFormData((prev) => ({ ...prev, accountId: activeAccountId }));
    }
  }, [trade, activeAccountId, accounts, userTimezone]);

  const handleChange = (field, value) => {
    if (isViewOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    if (isViewOnly) return;
    setFormData((prev) => ({ ...prev, [field]: prev[field] === 'Yes' ? 'No' : 'Yes' }));
  };

  const liveScorecard = useMemo(() => {
    const previewTrade = {
      ...formData,
      openTime: formData.openTime
        ? timeToIsoInTimezone(formData.openTime, formData.tradeDate || new Date().toISOString().split('T')[0], userTimezone)
        : null,
    };
    return evaluateTrade14Rules(previewTrade, 0, dailyLossLimit);
  }, [formData, userTimezone, dailyLossLimit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) return;

    if (!formData.accountId) {
      alert('Please select a Trading Account for this trade.');
      return;
    }

    const payload = {
      ...formData,
      zoneInteraction: formData.zoneType && formData.zoneType !== 'NONE' ? 'Yes' : formData.zoneInteraction,
      ruleCompliancePct: liveScorecard.compliancePct,
      rulesPassedCount: liveScorecard.passedCount,
      openTime: formData.openTime ? timeToIsoInTimezone(formData.openTime, formData.tradeDate, userTimezone) : null,
      closeTime: formData.closeTime ? timeToIsoInTimezone(formData.closeTime, formData.tradeDate, userTimezone) : null,
    };
    onSave(payload);
  };

  const renderToggle = (label, field) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => handleToggle(field)}
        disabled={isViewOnly}
        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
          formData[field] === 'Yes' ? 'bg-blue-600 justify-end' : 'bg-white/20 justify-start'
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-md" />
      </button>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isViewOnly ? 'View Trade Details' : trade ? 'Edit Trade' : 'Log New Trade'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isViewOnly
              ? 'Review recorded trade metrics & 14-rule strategy compliance'
              : 'Log Gold Futures (GC / MGC) execution, zone interactions (#386641 / #BC4749), and 14-rule compliance'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          {!isViewOnly && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 text-sm font-medium shadow-lg shadow-blue-600/20 transition-all"
            >
              {loading ? 'Saving...' : 'Save Trade'}
            </button>
          )}
        </div>
      </div>

      {circuitBreakerInfo && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">Circuit Breaker Warning (Revenge Trade Intervention)</h4>
            <p className="text-xs opacity-90">
              Your last trade ({circuitBreakerInfo.lastTradePair}) closed at a loss{' '}
              <strong className="text-white font-mono">{circuitBreakerInfo.diffMins} minutes ago</strong> (cooldown window:{' '}
              {circuitBreakerInfo.windowMins} mins).
            </p>
            <p className="text-[11px] text-amber-400 font-medium">
              💡 Take a moment to pause. Ensure you are in a calm state before entering this position.
            </p>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Info Container */}
        <div className="relative z-20 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white">1. Contract & Session Metadata</h3>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                liveScorecard.liquidityInfo.inWindow
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              🕒 {liveScorecard.liquidityInfo.windowLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Target Account Selector */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-blue-600/10 p-3 rounded-xl border border-blue-500/20">
              <label className="block text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                <Shield size={14} /> Trading Account (Apex / Lucid Flex / Prop Evaluation)
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                disabled={isViewOnly}
                required
                className="w-full bg-slate-900 border border-blue-500/30 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>
                  -- Select Trading Account --
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.startingBalance?.toLocaleString()} • Max Daily Loss: ${acc.maxDailyLoss || 600})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-400" /> Date
              </label>
              <input
                type="date"
                value={formData.tradeDate}
                onChange={(e) => handleChange('tradeDate', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" /> Open Time (1–4 AM / 8–11 AM NY)
              </label>
              <input
                type="time"
                value={formData.openTime}
                onChange={(e) => handleChange('openTime', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" /> Close Time
              </label>
              <input
                type="time"
                value={formData.closeTime}
                onChange={(e) => handleChange('closeTime', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contract / Symbol (GC / MGC)</label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={formData.pair}
                  onChange={(e) => handleChange('pair', e.target.value.toUpperCase())}
                  disabled={isViewOnly}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm uppercase font-mono"
                  placeholder="MGCZ6"
                  required
                />
                {!isViewOnly && (
                  <div className="flex flex-wrap gap-1">
                    {GOLD_FUTURES_CONTRACTS.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => handleChange('pair', sym)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          formData.pair === sym
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Direction</label>
              <div className="flex bg-black/20 rounded-xl p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleChange('direction', 'Long')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    formData.direction === 'Long' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                  disabled={isViewOnly}
                >
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('direction', 'Short')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    formData.direction === 'Short' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                  disabled={isViewOnly}
                >
                  Short
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price</label>
              <input
                type="number"
                step="0.00001"
                value={formData.entryPrice}
                onChange={(e) => handleChange('entryPrice', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss</label>
              <input
                type="number"
                step="0.00001"
                value={formData.stopLoss}
                onChange={(e) => handleChange('stopLoss', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Take Profit</label>
              <input
                type="number"
                step="0.00001"
                value={formData.takeProfit}
                onChange={(e) => handleChange('takeProfit', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Profit / Loss ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.profitLoss}
                onChange={(e) => handleChange('profitLoss', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">R-Multiple / RR (Target &gt;= 1.5R)</label>
              <input
                type="number"
                step="0.1"
                value={formData.rr}
                onChange={(e) => handleChange('rr', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm font-mono"
                placeholder="2.0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Result</label>
              <select
                value={formData.tradeResult}
                onChange={(e) => handleChange('tradeResult', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
              >
                <option value="Auto" className="bg-slate-900 text-white">
                  Auto (derive from P/L)
                </option>
                <option value="Win" className="bg-slate-900 text-white">
                  Win
                </option>
                <option value="Loss" className="bg-slate-900 text-white">
                  Loss
                </option>
                <option value="Breakeven" className="bg-slate-900 text-white">
                  Breakeven
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">TradingView Chart Link</label>
              <input
                type="url"
                value={formData.tradingViewLink}
                onChange={(e) => handleChange('tradingViewLink', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
                placeholder="https://www.tradingview.com/x/..."
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Setup Type(s)</label>
              <MultiSelect
                options={SETUP_OPTIONS}
                selected={formData.setup}
                onChange={(selected) => handleChange('setup', selected)}
                placeholder="Select setup strategies..."
              />
            </div>

            {/* Custom Hex Zone Interaction Selector (#386641 Support / #BC4749 Resistance) */}
            <div className="col-span-1 md:col-span-3 pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Key Zone Interaction (Support <span className="font-mono text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#386641' }}>#386641</span> / Resistance{' '}
                <span className="font-mono text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#BC4749' }}>#BC4749</span>)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {ZONE_INTERACTION_TYPES.map((z) => {
                  const active = formData.zoneType === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      disabled={isViewOnly}
                      onClick={() => handleChange('zoneType', z.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2 ${
                        active
                          ? 'border-white text-white shadow-md bg-white/10'
                          : 'border-white/10 text-slate-400 bg-black/20 hover:bg-white/5'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30" style={{ backgroundColor: z.color }} />
                      <span className="truncate">{z.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 14-Rule Technical Strategy Scorecard */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                2. 14-Rule Strategy Scorecard
              </h3>
              <p className="text-xs text-slate-400">
                Real-time rule compliance evaluation (6 manual toggles + 8 auto-verified execution rules)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                {liveScorecard.passedCount}/14 Rules ({liveScorecard.compliancePct}%)
              </span>
              <span
                className={`text-sm font-mono font-extrabold px-3 py-1.5 rounded-xl ${
                  liveScorecard.compliancePct >= 80
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : liveScorecard.compliancePct >= 60
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                Grade {liveScorecard.grade}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderToggle('1. Weekly HTF Bias Aligned', 'previousWeeklyDirection')}
            {renderToggle('2. Daily HTF Bias Aligned', 'previousDailyDirection')}
            {renderToggle('3. 4H Candle Direction Aligned', 'previous4HourDirection')}
            {renderToggle('4. 1H Direction Aligned', 'previous1HourDirection')}
            {renderToggle('5. Left-Side Range Clean', 'leftSideRangeClean')}
            {renderToggle('7. Candle Close Confirmation', 'candleCloseConfirmation')}
            {renderToggle('10. Stop Loss Respected (No Moving SL)', 'stopLossRespected')}
            {renderToggle('14. Trading Plan Followed', 'planFollowed')}
          </div>

          {/* Live 14-Rule Status Chips */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-xs font-semibold text-slate-400 mb-2">Complete 14-Rule Verification Matrix:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIPER_14_RULES.map((rule) => {
                const passed = liveScorecard.ruleResults[rule.key];
                return (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border ${
                      passed
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/20 text-slate-400'
                    }`}
                  >
                    <span className="truncate pr-2">{rule.label}</span>
                    <span className="font-mono font-bold text-[10px] uppercase">{passed ? 'PASS' : 'MISS'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Behavioral Leak Tagging & Psychology */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Flame size={18} className="text-amber-400" />
              3. Behavioral Leak Detection & Psychology
            </h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Execution & Emotional Leaks (Select any errors that occurred on this trade)
            </label>
            <div className="flex flex-wrap gap-2">
              {BEHAVIORAL_LEAK_TAGS.map((tag) => {
                const isSelected = (formData.behavioralLeaks || []).includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => {
                      const curr = formData.behavioralLeaks || [];
                      const next = isSelected ? curr.filter((t) => t !== tag) : [...curr, tag];
                      handleChange('behavioralLeaks', next);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                        : 'bg-black/20 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {isSelected ? '⚠️ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">Trade Confidence Score</label>
              <span className="text-lg font-bold font-mono text-blue-400">{formData.confidenceScore}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.confidenceScore}
              onChange={(e) => handleChange('confidenceScore', Number(e.target.value))}
              disabled={isViewOnly}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotion Before Trade</label>
              <select
                value={formData.emotionBeforeTrade}
                onChange={(e) => handleChange('emotionBeforeTrade', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
              >
                {EMOTIONS_BEFORE.map((emo) => (
                  <option key={emo} value={emo} className="bg-slate-900">
                    {emo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotion After Trade</label>
              <select
                value={formData.emotionAfterTrade}
                onChange={(e) => handleChange('emotionAfterTrade', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
              >
                {EMOTIONS_AFTER.map((emo) => (
                  <option key={emo} value={emo} className="bg-slate-900">
                    {emo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes & Review */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">4. Review & Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mistakes</label>
              <textarea
                rows={3}
                value={formData.mistakes}
                onChange={(e) => handleChange('mistakes', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm resize-none"
                placeholder="What mistakes were made?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lessons Learned</label>
              <textarea
                rows={3}
                value={formData.lessons}
                onChange={(e) => handleChange('lessons', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm resize-none"
                placeholder="What did you learn from this trade?"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Comments</label>
              <textarea
                rows={2}
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm resize-none"
                placeholder="General observations..."
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Screenshot Image URL</label>
              <input
                type="url"
                value={formData.screenshotUrl}
                onChange={(e) => handleChange('screenshotUrl', e.target.value)}
                disabled={isViewOnly}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTradeModal;
