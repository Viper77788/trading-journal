import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Shield, AlertTriangle } from 'lucide-react';
import MultiSelect from './MultiSelect';
import { SETUP_OPTIONS, EMOTIONS_BEFORE, EMOTIONS_AFTER } from '../../constants';
import { useAccount } from '../../context/AccountContext';
import { checkCircuitBreaker } from '../../utils/aiAdvisor';

const extractTime = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
  }
  return '';
};

const AddTradeModal = ({ trade, isViewOnly, onSave, onCancel, loading, trades = [] }) => {
  const { accounts, activeAccountId } = useAccount();

  const [formData, setFormData] = useState({
    accountId: activeAccountId !== 'all' ? activeAccountId : (accounts[0]?.id || ''),
    tradeDate: '', openTime: '', closeTime: '', pair: '', direction: 'Long', entryPrice: '', stopLoss: '', takeProfit: '',
    profitLoss: '', rr: '', tradeResult: 'Auto', tradingViewLink: '',
    setup: [], planFollowed: 'No', previous4HourDirection: 'No', previousWeeklyDirection: 'No',
    previousDailyDirection: 'No', previous1HourDirection: 'No', leftSideRangeClean: 'No',
    confidenceScore: 5, emotionBeforeTrade: 'Neutral', emotionAfterTrade: 'Neutral',
    mistakes: '', lessons: '', comments: '', screenshotUrl: ''
  });

  const selectedAccount = accounts.find(a => a.id === formData.accountId);
  const circuitBreakerInfo = (!trade && !isViewOnly) ? checkCircuitBreaker(selectedAccount, trades) : null;

  useEffect(() => {
    if (trade) {
      setFormData({
        ...trade,
        accountId: trade.accountId || (activeAccountId !== 'all' ? activeAccountId : accounts[0]?.id || ''),
        setup: Array.isArray(trade.setup) ? trade.setup : (trade.setup ? trade.setup.split(',') : []),
        tradeDate: trade.tradeDate ? new Date(trade.tradeDate).toISOString().split('T')[0] : '',
        openTime: extractTime(trade.openTime),
        closeTime: extractTime(trade.closeTime)
      });
    } else if (activeAccountId !== 'all') {
      setFormData(prev => ({ ...prev, accountId: activeAccountId }));
    }
  }, [trade, activeAccountId, accounts]);

  const handleChange = (field, value) => {
    if (isViewOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    if (isViewOnly) return;
    setFormData(prev => ({ ...prev, [field]: prev[field] === 'Yes' ? 'No' : 'Yes' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) return;

    if (!formData.accountId) {
      alert('Please select a Trading Account for this trade.');
      return;
    }

    const payload = {
      ...formData,
      openTime: formData.openTime || null,
      closeTime: formData.closeTime || null
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
            {isViewOnly ? 'Review recorded trade metrics & setup parameters' : 'Record complete parameters, setup details, and trading psychology'}
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm font-medium transition-all">
            Cancel
          </button>
          {!isViewOnly && (
            <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 text-sm font-medium shadow-lg shadow-blue-600/20 transition-all">
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
              Your last trade ({circuitBreakerInfo.lastTradePair}) closed at a loss <strong className="text-white font-mono">{circuitBreakerInfo.diffMins} minutes ago</strong> (cooldown window: {circuitBreakerInfo.windowMins} mins).
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
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Target Account Selector */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-blue-600/10 p-3 rounded-xl border border-blue-500/20">
              <label className="block text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                <Shield size={14} /> Trading Account (Required)
              </label>
              <select
                value={formData.accountId}
                onChange={e => handleChange('accountId', e.target.value)}
                disabled={isViewOnly}
                required
                className="w-full bg-slate-900 border border-blue-500/30 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>-- Select Trading Account --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.startingBalance?.toLocaleString()} • {acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-400" /> Date
              </label>
              <input type="date" value={formData.tradeDate} onChange={e => handleChange('tradeDate', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" /> Open Time
              </label>
              <input type="time" value={formData.openTime} onChange={e => handleChange('openTime', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" /> Close Time
              </label>
              <input type="time" value={formData.closeTime} onChange={e => handleChange('closeTime', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Pair</label>
              <input type="text" value={formData.pair} onChange={e => handleChange('pair', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm uppercase" placeholder="XAUUSD" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Direction</label>
              <div className="flex bg-black/20 rounded-xl p-1 border border-white/10">
                <button type="button" onClick={() => handleChange('direction', 'Long')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.direction === 'Long' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`} disabled={isViewOnly}>Long</button>
                <button type="button" onClick={() => handleChange('direction', 'Short')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.direction === 'Short' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400'}`} disabled={isViewOnly}>Short</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price</label>
              <input type="number" step="0.00001" value={formData.entryPrice} onChange={e => handleChange('entryPrice', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss</label>
              <input type="number" step="0.00001" value={formData.stopLoss} onChange={e => handleChange('stopLoss', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Take Profit</label>
              <input type="number" step="0.00001" value={formData.takeProfit} onChange={e => handleChange('takeProfit', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Profit / Loss ($)</label>
              <input type="number" step="0.01" value={formData.profitLoss} onChange={e => handleChange('profitLoss', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm font-mono" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Risk / Reward (RR)</label>
              <input type="number" step="0.1" value={formData.rr} onChange={e => handleChange('rr', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" placeholder="1.5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Result</label>
              <select value={formData.tradeResult} onChange={e => handleChange('tradeResult', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                <option value="Auto" className="bg-slate-900 text-white">Auto (derive from P/L)</option>
                <option value="Win" className="bg-slate-900 text-white">Win</option>
                <option value="Loss" className="bg-slate-900 text-white">Loss</option>
                <option value="Breakeven" className="bg-slate-900 text-white">Breakeven</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">TradingView Chart Link</label>
              <input type="url" value={formData.tradingViewLink} onChange={e => handleChange('tradingViewLink', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" placeholder="https://www.tradingview.com/x/..." />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Setup Type(s)</label>
              <MultiSelect options={SETUP_OPTIONS} selected={formData.setup} onChange={selected => handleChange('setup', selected)} placeholder="Select setup strategies..." />
            </div>
          </div>
        </div>

        {/* Setup Validation Checklist */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Setup Validation Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderToggle('Plan Followed', 'planFollowed')}
            {renderToggle('4H Candle Direction Aligned', 'previous4HourDirection')}
            {renderToggle('Weekly Direction Aligned', 'previousWeeklyDirection')}
            {renderToggle('Daily Direction Aligned', 'previousDailyDirection')}
            {renderToggle('1H Direction Aligned', 'previous1HourDirection')}
            {renderToggle('Left-Side Range Clean', 'leftSideRangeClean')}
          </div>
        </div>

        {/* Quality Score & Psychology */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <h3 className="text-lg font-semibold text-white">Quality Score & Psychology</h3>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">Trade Quality Score</label>
              <span className="text-lg font-bold font-mono text-blue-400">{formData.confidenceScore}/10</span>
            </div>
            <input type="range" min="1" max="10" value={formData.confidenceScore} onChange={e => handleChange('confidenceScore', Number(e.target.value))} disabled={isViewOnly} className="w-full accent-blue-500 cursor-pointer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotion Before Trade (Optional)</label>
              <select value={formData.emotionBeforeTrade} onChange={e => handleChange('emotionBeforeTrade', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                {EMOTIONS_BEFORE.map(emo => <option key={emo} value={emo} className="bg-slate-900">{emo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotion After Trade (Optional)</label>
              <select value={formData.emotionAfterTrade} onChange={e => handleChange('emotionAfterTrade', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                {EMOTIONS_AFTER.map(emo => <option key={emo} value={emo} className="bg-slate-900">{emo}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes & Review */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Review & Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mistakes</label>
              <textarea rows={3} value={formData.mistakes} onChange={e => handleChange('mistakes', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm resize-none" placeholder="What mistakes were made?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lessons Learned</label>
              <textarea rows={3} value={formData.lessons} onChange={e => handleChange('lessons', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm resize-none" placeholder="What did you learn from this trade?" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Comments</label>
              <textarea rows={2} value={formData.comments} onChange={e => handleChange('comments', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm resize-none" placeholder="General observations..." />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Screenshot Image URL</label>
              <input type="url" value={formData.screenshotUrl} onChange={e => handleChange('screenshotUrl', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" placeholder="https://..." />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTradeModal;
